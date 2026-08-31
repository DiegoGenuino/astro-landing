import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../src/config/site';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const DIST_DIRECTORY = join(PROJECT_ROOT, 'dist');
const VERCEL_API = 'https://api.vercel.com';
const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const skipBuild = args.has('--skip-build');
const skipDomain = args.has('--skip-domain');

interface DeploymentFile {
  file: string;
  sha: string;
  size: number;
  contents: Buffer;
}

interface VercelDeployment {
  id: string;
  url?: string;
  readyState?: string;
  alias?: string[];
}

interface VercelDomainVerification {
  type?: string;
  domain?: string;
  name?: string;
  value?: string;
}

interface VercelProjectDomain {
  name: string;
  verified?: boolean;
  verification?: VercelDomainVerification[];
}

interface VercelDomainConfiguration {
  misconfigured?: boolean;
  recommendedCNAME?: Array<{
    rank?: number;
    value?: string;
  }>;
}

interface CloudflareRecord {
  id: string;
  type: string;
  name: string;
  content: string;
}

interface CloudflareResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ code?: number; message?: string }>;
}

const sleep = (milliseconds: number) => new Promise((resolvePromise) => {
  setTimeout(resolvePromise, milliseconds);
});

const loadEnvironmentFile = async (filename: string) => {
  const path = join(PROJECT_ROOT, filename);
  let content: string;

  try {
    content = await readFile(path, 'utf8');
  } catch {
    return;
  }

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) process.env[key] = value;
  });
};

await loadEnvironmentFile('.env');
await loadEnvironmentFile('.env.automation');
await loadEnvironmentFile('.env.local');

const deploymentConfig = siteConfig.deployment;
const projectName = deploymentConfig.projectName.trim();
const subdomain = deploymentConfig.subdomain.trim();
const baseDomain = deploymentConfig.baseDomain.trim();
const customDomain = `${subdomain}.${baseDomain}`;
const vercelToken = process.env.VERCEL_TOKEN?.trim() || '';
const vercelTeamId = process.env.VERCEL_TEAM_ID?.trim() || '';
const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN?.trim() || '';
const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID?.trim() || '';
const cnameTarget = process.env.VERCEL_CNAME_TARGET?.trim() || deploymentConfig.cnameTarget;

const validateConfiguration = () => {
  const slugPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  if (!slugPattern.test(projectName)) {
    throw new Error('deployment.projectName deve conter somente letras minúsculas, números e hífens.');
  }
  if (!slugPattern.test(subdomain)) {
    throw new Error('deployment.subdomain deve conter somente letras minúsculas, números e hífens.');
  }
  if (!baseDomain.includes('.') || /\s/.test(baseDomain)) {
    throw new Error('deployment.baseDomain deve ser um domínio válido.');
  }

  if (dryRun) return;

  const missing: string[] = [];
  if (!vercelToken) missing.push('VERCEL_TOKEN');
  if (!skipDomain && !cloudflareToken) missing.push('CLOUDFLARE_API_TOKEN');
  if (!skipDomain && !cloudflareZoneId) missing.push('CLOUDFLARE_ZONE_ID');
  if (missing.length) {
    throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(', ')}.`);
  }
};

const runBuild = async () => {
  if (skipBuild) {
    await access(DIST_DIRECTORY, fsConstants.R_OK);
    return;
  }

  const packageManagerScript = process.env.npm_execpath;
  const executable = packageManagerScript
    ? process.execPath
    : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const buildArguments = packageManagerScript
    ? [packageManagerScript, 'run', 'build']
    : ['run', 'build'];
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(executable, buildArguments, {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`O build terminou com código ${code ?? 'desconhecido'}.`));
    });
  });
};

const collectDeploymentFiles = async () => {
  const files: DeploymentFile[] = [];

  const visit = async (directory: string) => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;

      const contents = await readFile(absolutePath);
      files.push({
        file: relative(DIST_DIRECTORY, absolutePath).split(sep).join('/'),
        sha: createHash('sha1').update(contents).digest('hex'),
        size: contents.length,
        contents,
      });
    }
  };

  await visit(DIST_DIRECTORY);
  return files.sort((left, right) => left.file.localeCompare(right.file));
};

const withTeamScope = (input: string) => {
  const url = new URL(input, VERCEL_API);
  if (vercelTeamId) url.searchParams.set('teamId', vercelTeamId);
  return url;
};

const readErrorMessage = async (response: Response) => {
  const text = await response.text();
  if (!text) return `HTTP ${response.status}`;
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string; code?: string } };
    return parsed.error?.message || parsed.error?.code || text;
  } catch {
    return text;
  }
};

const vercelJson = async <T>(path: string, init: RequestInit = {}, allowedStatuses: number[] = []) => {
  const response = await fetch(withTeamScope(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok && !allowedStatuses.includes(response.status)) {
    throw new Error(`Vercel: ${await readErrorMessage(response)}`);
  }

  const text = await response.text();
  return {
    status: response.status,
    data: text ? JSON.parse(text) as T : {} as T,
  };
};

const uploadFiles = async (files: DeploymentFile[]) => {
  const concurrency = 8;
  let cursor = 0;

  const worker = async () => {
    while (cursor < files.length) {
      const file = files[cursor++];
      const body = new Uint8Array(file.contents.length);
      body.set(file.contents);
      const response = await fetch(withTeamScope('/v2/files'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(file.size),
          'x-vercel-digest': file.sha,
        },
        body,
      });

      if (!response.ok && response.status !== 409) {
        throw new Error(`Vercel upload (${file.file}): ${await readErrorMessage(response)}`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
};

const createDeployment = async (files: DeploymentFile[]) => {
  const url = withTeamScope('/v13/deployments');
  url.searchParams.set('forceNew', '1');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      target: 'production',
      files: files.map(({ file, sha, size }) => ({ file, sha, size })),
      projectSettings: { framework: null },
    }),
  });

  if (!response.ok) throw new Error(`Vercel deployment: ${await readErrorMessage(response)}`);
  return response.json() as Promise<VercelDeployment>;
};

const waitForDeployment = async (deployment: VercelDeployment) => {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const { data } = await vercelJson<VercelDeployment>(`/v13/deployments/${deployment.id}`);
    const state = data.readyState;
    if (state === 'READY') return data;
    if (state === 'ERROR' || state === 'CANCELED') {
      throw new Error(`O deployment terminou no estado ${state}. Consulte os logs da Vercel.`);
    }
    await sleep(2_000);
  }
  throw new Error('Tempo limite excedido aguardando o deployment da Vercel.');
};

const cloudflareJson = async <T>(path: string, init: RequestInit = {}) => {
  const response = await fetch(`${CLOUDFLARE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cloudflareToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const payload = await response.json() as CloudflareResponse<T>;
  if (!response.ok || !payload.success) {
    const message = payload.errors?.map(({ message }) => message).filter(Boolean).join('; ');
    throw new Error(`Cloudflare: ${message || `HTTP ${response.status}`}`);
  }
  return payload.result;
};

const upsertCloudflareRecord = async (type: 'CNAME' | 'TXT', name: string, content: string) => {
  const query = new URLSearchParams({ type, name });
  const records = await cloudflareJson<CloudflareRecord[]>(
    `/zones/${cloudflareZoneId}/dns_records?${query}`,
  );

  const exactRecord = records.find((record) => record.content === content);
  if (exactRecord) return exactRecord;

  const body = JSON.stringify({
    type,
    name,
    content,
    ttl: 1,
    proxied: false,
    comment: `Automação do projeto Vercel ${projectName}`,
  });

  if (type === 'CNAME' && records[0]) {
    return cloudflareJson<CloudflareRecord>(
      `/zones/${cloudflareZoneId}/dns_records/${records[0].id}`,
      { method: 'PUT', body },
    );
  }

  return cloudflareJson<CloudflareRecord>(
    `/zones/${cloudflareZoneId}/dns_records`,
    { method: 'POST', body },
  );
};

const addProjectDomain = async () => {
  const path = `/v10/projects/${encodeURIComponent(projectName)}/domains`;
  const result = await vercelJson<VercelProjectDomain>(path, {
    method: 'POST',
    body: JSON.stringify({ name: customDomain }),
  }, [409]);

  if (result.status !== 409) return result.data;

  const existing = await vercelJson<VercelProjectDomain>(
    `/v9/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(customDomain)}`,
  );
  return existing.data;
};

const getDomainConfiguration = async () => {
  const { data } = await vercelJson<VercelDomainConfiguration>(
    `/v6/domains/${encodeURIComponent(customDomain)}/config`,
  );
  return data;
};

const waitForOwnershipVerification = async (projectDomain: VercelProjectDomain) => {
  if (projectDomain.verified || !projectDomain.verification?.length) return true;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    try {
      const { data } = await vercelJson<VercelProjectDomain>(
        `/v9/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(customDomain)}/verify`,
        { method: 'POST' },
      );
      if (data.verified) return true;
    } catch {
      // A verificação depende da propagação do desafio DNS.
    }
    await sleep(5_000);
  }

  return false;
};

const configureDomain = async () => {
  const projectDomain = await addProjectDomain();

  for (const verification of projectDomain.verification ?? []) {
    const type = verification.type?.toUpperCase();
    const name = verification.domain || verification.name;
    if ((type === 'TXT' || type === 'CNAME') && name && verification.value) {
      await upsertCloudflareRecord(type, name, verification.value);
    }
  }

  const ownershipVerified = await waitForOwnershipVerification(projectDomain);
  if (!ownershipVerified) {
    throw new Error(`Não foi possível verificar a propriedade de ${customDomain}. Execute o deploy novamente após a propagação do DNS.`);
  }

  const initialConfiguration = await getDomainConfiguration();
  const recommendedTarget = initialConfiguration.recommendedCNAME
    ?.filter(({ value }) => Boolean(value))
    .sort((left, right) => (left.rank ?? 999) - (right.rank ?? 999))[0]
    ?.value
    ?.replace(/\.$/, '');

  await upsertCloudflareRecord('CNAME', customDomain, recommendedTarget || cnameTarget);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    try {
      const configuration = await getDomainConfiguration();
      if (configuration.misconfigured === false) return true;
    } catch {
      // DNS pode levar alguns minutos para propagar; a próxima tentativa repete a consulta.
    }
    await sleep(5_000);
  }

  return false;
};

const main = async () => {
  validateConfiguration();
  await runBuild();
  const files = await collectDeploymentFiles();

  if (!files.length) throw new Error('A pasta dist está vazia.');

  if (dryRun) {
    console.log('Simulação concluída sem chamadas externas.');
    console.log(`Projeto Vercel: ${projectName}`);
    console.log(`Domínio: https://${customDomain}`);
    console.log(`Arquivos prontos para envio: ${files.length}`);
    console.log(`Escopo: ${vercelTeamId ? `time ${vercelTeamId}` : 'conta pessoal'}`);
    return;
  }

  console.log(`Enviando ${files.length} arquivos para a Vercel...`);
  await uploadFiles(files);
  const deployment = await createDeployment(files);
  const readyDeployment = await waitForDeployment(deployment);

  let domainReady = false;
  if (!skipDomain) {
    console.log(`Configurando ${customDomain}...`);
    domainReady = await configureDomain();
  }

  console.log('Deployment concluído.');
  console.log(`URL Vercel: https://${readyDeployment.url || deployment.url}`);
  if (!skipDomain) {
    console.log(`Domínio: https://${customDomain}${domainReady ? '' : ' (DNS ainda em propagação)'}`);
  }
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha no deploy: ${message}`);
  process.exitCode = 1;
});
