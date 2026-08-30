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

export const siteConfig: { videoSection: VideoSectionConfig } = {
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
    poster: 'https://i.ytimg.com/vi/EeUu8C_VLAc/maxresdefault.jpg',
    posterAlt: 'Capa do vídeo institucional',
    playLabel: 'Assistir apresentação',
    caption: 'Vídeo institucional',
  },
};
