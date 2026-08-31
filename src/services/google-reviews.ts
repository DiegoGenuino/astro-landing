import type { ManualReviewItem, ReviewItem, ReviewsSectionConfig } from '@/config/site';

type Fetcher = typeof fetch;

interface GoogleLocalizedText {
  text?: string;
  languageCode?: string;
}

interface GoogleAuthorAttribution {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}

interface GoogleReview {
  text?: GoogleLocalizedText;
  originalText?: GoogleLocalizedText;
  rating?: number;
  relativePublishTimeDescription?: string;
  publishTime?: string;
  googleMapsUri?: string;
  authorAttribution?: GoogleAuthorAttribution;
}

interface GooglePlaceResponse {
  reviews?: GoogleReview[];
  googleMapsLinks?: {
    reviewsUri?: string;
  };
}

export interface ResolvedReviews {
  items: ReviewItem[];
  hasGoogleReviews: boolean;
}

interface ResolveReviewsOptions {
  apiKey?: string;
  fetcher?: Fetcher;
  warn?: (message: string) => void;
}

const clampLimit = (value: number) => Math.max(1, Math.min(5, Math.trunc(value || 3)));

const normalizeManualReview = (
  review: ManualReviewItem,
  section: ReviewsSectionConfig,
): ReviewItem => ({
  quote: review.quote || section.fallbacks.quote,
  name: review.name || section.fallbacks.name,
  details: review.details || section.fallbacks.details,
  rating: Number.isFinite(review.rating) ? review.rating : null,
  avatar: review.avatar || section.fallbacks.avatar,
  avatarPosition: review.avatarPosition || section.fallbacks.avatarPosition,
  publishedAt: review.publishedAt || null,
  publishedAtLabel: review.publishedAtLabel || section.fallbacks.publishedAtLabel,
  googleMapsUrl: review.googleMapsUrl || '',
  authorProfileUrl: review.authorProfileUrl || '',
  source: 'manual',
});

export const getManualReviews = (section: ReviewsSectionConfig, limit = section.google.limit) =>
  section.manualItems
    .map((review) => normalizeManualReview(review, section))
    .slice(0, clampLimit(limit));

const normalizeGoogleReview = (
  review: GoogleReview,
  section: ReviewsSectionConfig,
  placeReviewsUrl: string,
): ReviewItem => ({
  quote: review.text?.text?.trim() || review.originalText?.text?.trim() || section.fallbacks.quote,
  name: review.authorAttribution?.displayName?.trim() || section.fallbacks.name,
  // A Places API não fornece profissão ou localização do autor.
  details: section.fallbacks.details,
  rating: Number.isFinite(review.rating) ? review.rating! : null,
  avatar: review.authorAttribution?.photoUri || section.fallbacks.avatar,
  avatarPosition: section.fallbacks.avatarPosition,
  publishedAt: review.publishTime || null,
  publishedAtLabel: review.relativePublishTimeDescription || section.fallbacks.publishedAtLabel,
  googleMapsUrl: review.googleMapsUri || placeReviewsUrl,
  authorProfileUrl: review.authorAttribution?.uri || '',
  source: 'google',
});

export const resolveReviews = async (
  section: ReviewsSectionConfig,
  options: ResolveReviewsOptions = {},
): Promise<ResolvedReviews> => {
  const limit = clampLimit(section.google.limit);
  const manualReviews = getManualReviews(section, limit);
  const placeId = section.google.placeId.trim();
  const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const apiKey = options.apiKey ?? runtimeEnv?.GOOGLE_PLACES_API_KEY;

  if (section.source !== 'google' || !placeId || !apiKey) {
    return { items: manualReviews, hasGoogleReviews: false };
  }

  const fetcher = options.fetcher ?? fetch;
  const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  try {
    const response = await fetcher(endpoint, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'pt-BR',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews,googleMapsLinks.reviewsUri',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Places respondeu com HTTP ${response.status}`);
    }

    const place = await response.json() as GooglePlaceResponse;
    const placeReviewsUrl = place.googleMapsLinks?.reviewsUri || section.google.reviewsUrl;
    const googleReviews = (place.reviews ?? [])
      .filter((review) => Boolean(review.text?.text?.trim() || review.originalText?.text?.trim()))
      .map((review) => normalizeGoogleReview(review, section, placeReviewsUrl))
      .slice(0, limit);

    const missingCount = Math.max(0, limit - googleReviews.length);
    const usedQuotes = new Set(googleReviews.map(({ quote }) => quote));
    const fallbackReviews = manualReviews
      .filter(({ quote }) => !usedQuotes.has(quote))
      .slice(0, missingCount);
    const items = [...googleReviews, ...fallbackReviews];

    return {
      items: items.length ? items : manualReviews,
      hasGoogleReviews: googleReviews.length > 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida';
    options.warn?.(`[reviews] ${message}. Usando avaliações manuais.`);
    return { items: manualReviews, hasGoogleReviews: false };
  }
};
