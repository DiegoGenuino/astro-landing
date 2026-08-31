import { siteConfig } from '@/config/site';
import type { FaqItem } from '@/config/site';

// Compatibilidade para integrações existentes. A fonte única fica em config/site.ts.
export const faqItems: FaqItem[] = siteConfig.faqSection.items;
export type { FaqItem };
