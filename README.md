# Template jurídico em Astro

Template estático, responsivo e orientado por configuração para criar sites de novos clientes sem alterar o layout original. Componentes, estilos, animações, SEO técnico e SEO para agentes de IA já estão prontos.

## Regra principal

Para adaptar o template a um cliente, altere somente:

- `src/config/site.ts`: textos, links, dados profissionais, seções, SEO e feature flags;
- `public/images`: imagens, logotipo, favicon e poster do vídeo;
- `public/fonts`: apenas se o projeto realmente precisar de outra família tipográfica.

Não altere `src/components`, `src/layouts`, `src/pages` ou `src/styles` durante uma personalização comum. Esses arquivos são a camada visual protegida do template.

## Estrutura

```text
src/
├── components/       Componentes visuais reutilizáveis
├── config/site.ts    Fonte única dos dados do cliente
├── data/faqs.ts      Reexportação de compatibilidade do FAQ
├── layouts/          Estrutura base, preload e metadados
├── pages/            Página, sitemap, robots e conteúdo para agentes
└── styles/           Layout, responsividade e identidade visual
public/
├── images/           Assets substituíveis do cliente
├── fonts/            Fontes locais
└── favicon.svg       Ícone padrão
```

## Criar um projeto novo para um cliente

A solução recomendada é manter este repositório como **GitHub Template Repository**. Assim, cada cliente recebe um repositório independente e o template original permanece intacto.

1. No GitHub, habilite `Settings > General > Template repository` neste repositório.
2. Clique em `Use this template` e crie um repositório privado para o cliente.
3. Clone o novo repositório.
4. Instale as dependências com `pnpm install`.
5. Substitua os assets em `public/images`.
6. Edite apenas `src/config/site.ts` com os dados do cliente.
7. Execute `pnpm build`.
8. Faça a revisão final descrita abaixo e publique.

Também é possível criar o projeto pelo GitHub CLI:

```powershell
gh repo create nome-do-cliente --private --template USUARIO/REPOSITORIO-TEMPLATE --clone
Set-Location nome-do-cliente
pnpm install
```

Esse fluxo normalmente cabe em 15 minutos quando textos e assets já estão preparados.

## Ordem rápida de personalização

Edite `src/config/site.ts` nesta ordem:

1. `identity`: nome do escritório, profissional, registro e logotipo;
2. `contact`: URL do WhatsApp e CTA principal;
3. `header` e `hero`: navegação, imagem principal, headline e CTAs;
4. `stats`, `about`, `practiceSection` e `differentialsSection`;
5. `reviewsSection`, `faqSection` e `footer`;
6. `videoSection` e `locationSection`;
7. `seo` e `aiDiscovery`.

O TypeScript valida a estrutura do contrato durante `pnpm build`. Se um campo obrigatório for removido ou estiver com o tipo errado, o build falhará antes da publicação.

## Assets do cliente

Os caminhos dos assets ficam no próprio `site.ts`, portanto os arquivos podem ter nomes diferentes. Mantenha as dimensões e proporções do layout para evitar mudanças visuais e CLS.

Checklist mínimo:

- logotipo SVG;
- favicon SVG;
- hero em WebP, com versões responsivas;
- foto profissional em WebP, com versões responsivas;
- três avatares do selo da hero;
- avatares das avaliações;
- ícone da plataforma de avaliações;
- poster 16:9 do vídeo, caso a seção esteja ativa;
- vídeo local, caso não seja usado YouTube.

Sempre atualize `width`, `height`, `srcset`, `alt` e `sizes` junto com o arquivo. Esses dados reservam espaço antes do download e ajudam a evitar CLS.

## Feature flags

As seções opcionais são controladas no arquivo de configuração:

```ts
videoSection: {
  enabled: true,
  provider: 'youtube', // ou 'file'
  videoId: 'ID_DO_YOUTUBE',
  videoUrl: '',
  // ...
},
locationSection: {
  enabled: true,
  // ...
},
aiDiscovery: {
  enabled: true,
  // ...
},
```

Para vídeo local, use `provider: 'file'`, deixe `videoId` vazio e informe `videoUrl`, por exemplo `/videos/institucional.mp4`. Para remover uma seção opcional sem tocar no layout, altere apenas `enabled` para `false`.

## SEO e descoberta por agentes de IA

O conteúdo de `siteConfig` alimenta automaticamente:

- title, description, canonical, Open Graph e Twitter Cards;
- JSON-LD de `WebSite`, `LegalService`, `Person`, `WebPage` e `FAQPage`;
- `robots.txt`;
- `sitemap.xml`;
- `site.webmanifest`;
- `llms.txt`;
- `index.md`, versão limpa do conteúdo para agentes.

Antes de publicar, confira principalmente `seo.siteUrl`, `seo.defaultTitle`, `seo.titleTemplate`, `seo.defaultDescription`, `seo.defaultImage`, `seo.keywords`, `seo.areaServed`, `seo.knowsAbout`, `aiDiscovery.summary` e `aiDiscovery.usageNote`.

## Prompt recomendado para adaptar com IA

Use um pedido com limites explícitos:

```text
Adapte este template para o cliente usando os dados abaixo.
Edite somente src/config/site.ts e substitua os assets necessários em public/images.
Não altere componentes, páginas, estilos, classes CSS, breakpoints, animações ou estrutura visual.
Mantenha as feature flags existentes, salvo quando eu indicar o contrário.
Atualize também SEO, JSON-LD, conteúdo para agentes de IA, textos alternativos e dados de contato.
Ao terminar, execute pnpm build e relate qualquer dado que ainda esteja faltando.

[COLE AQUI O BRIEFING DO CLIENTE]
```

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

`pnpm build` executa primeiro a checagem de tipos do Astro e depois gera o site estático em `dist`.

## Checklist antes da publicação

- nenhum dado, telefone, OAB ou nome do cliente anterior permanece;
- todos os CTAs abrem o WhatsApp correto;
- menu e links de âncora apontam para seções existentes;
- título, descrição, imagem social e URL canônica estão corretos;
- endereço e mapa correspondem ao cliente;
- vídeo e poster funcionam, ou a seção está desativada;
- avaliações foram autorizadas pelo cliente;
- textos alternativos descrevem as imagens relevantes;
- `pnpm build` termina com zero erros e zero avisos;
- `dist/llms.txt`, `dist/index.md`, `dist/robots.txt` e `dist/sitemap.xml` contêm o domínio e os dados novos.

## Evolução do template

Melhorias visuais ou estruturais devem ser feitas somente no repositório do template e versionadas. Depois, podem ser aplicadas aos projetos dos clientes de forma controlada. O conteúdo de um cliente nunca deve ser copiado de volta para o template-base.
