export type VideoProvider = 'youtube' | 'file';

export interface VideoSectionConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  highlightedTitle: string;
  description: string;
  provider: VideoProvider;
  videoId: string;
  videoUrl: string;
  poster: string;
  posterAlt: string;
  playLabel: string;
  caption: string;
}

export interface LocationSectionConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  highlightedTitle: string;
  description: string;
  address: string;
  mapQuery: string;
  mapTitle: string;
  directionsLabel: string;
}

export interface SeoConfig {
  siteName: string;
  legalName: string;
  siteUrl: string;
  locale: string;
  language: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultImage: string;
  defaultImageAlt: string;
  defaultImageWidth: number;
  defaultImageHeight: number;
  themeColor: string;
  author: string;
  keywords: string[];
  logo: string;
  areaServed: string;
  knowsAbout: string[];
  sitemap: Array<{
    path: string;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    priority: number;
  }>;
}

export interface SiteConfig {
  seo: SeoConfig;
  videoSection: VideoSectionConfig;
  locationSection: LocationSectionConfig;
}

export const siteConfig: SiteConfig = {
  seo: {
    siteName: 'Ferreira Defesa',
    legalName: 'Ferreira Defesa',
    siteUrl: 'https://ferreiradefesa.com.br',
    locale: 'pt_BR',
    language: 'pt-BR',
    defaultTitle: 'Advocacia Criminal Estratégica | Ferreira Defesa',
    titleTemplate: '%s | Ferreira Defesa',
    defaultDescription: 'Defesa estratégica em crimes financeiros, corrupção e Direito Penal Econômico, com atendimento técnico, pessoal e sigiloso.',
    defaultImage: '/images/hero-legal-1672.webp',
    defaultImageAlt: 'Equipe jurídica da Ferreira Defesa em atendimento',
    defaultImageWidth: 1672,
    defaultImageHeight: 942,
    themeColor: '#111318',
    author: 'Ferreira Defesa',
    keywords: [
      'advogado criminalista',
      'Direito Penal Econômico',
      'crimes financeiros',
      'defesa criminal empresarial',
      'corrupção e improbidade',
    ],
    logo: '/images/eduardo-ferreira-logo.svg',
    areaServed: 'Brasil',
    knowsAbout: [
      'Direito Penal Econômico',
      'Crimes Financeiros',
      'Crimes Tributários',
      'Lavagem de Dinheiro',
      'Corrupção e Improbidade',
      'Defesa Criminal Empresarial',
    ],
    sitemap: [
      { path: '/', changeFrequency: 'monthly', priority: 1 },
    ],
  },
  videoSection: {
    // Use videoId para YouTube ou videoUrl para um arquivo local.
    enabled: true,
    eyebrow: 'Apresentação institucional',
    title: 'Conheça nossa atuação',
    highlightedTitle: 'de perto.',
    description: 'Um espaço para apresentar a experiência, a forma de atendimento e os valores que orientam cada atuação.',
    provider: 'youtube',
    videoId: 'EeUu8C_VLAc',
    videoUrl: '',
    poster: '/images/video-poster.webp',
    posterAlt: 'Capa do vídeo institucional',
    playLabel: 'Assistir apresentação',
    caption: 'Vídeo institucional',
  },
  locationSection: {
    // Substitua address e mapQuery pelo endereço completo de cada novo projeto.
    enabled: true,
    eyebrow: 'Localização',
    title: 'Encontre nosso',
    highlightedTitle: 'escritório.',
    description: 'Consulte nossa localização e planeje sua visita. Para atendimento presencial, entre em contato para confirmar o horário.',
    address: 'São Paulo, SP, Brasil',
    mapQuery: 'São Paulo, SP, Brasil',
    mapTitle: 'Localização da Ferreira Defesa em São Paulo',
    directionsLabel: 'Abrir no Google Maps',
  },
};
