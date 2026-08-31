import assert from 'node:assert/strict';
import test from 'node:test';
import { siteConfig } from '../src/config/site';
import { resolveReviews } from '../src/services/google-reviews';

const createSection = () => structuredClone(siteConfig.reviewsSection);

test('usa o fallback manual quando a chave da API não foi configurada', async () => {
  const section = createSection();
  section.google.placeId = 'ChIJ-place-id';

  let requested = false;
  const result = await resolveReviews(section, {
    apiKey: '',
    fetcher: async () => {
      requested = true;
      return new Response();
    },
  });

  assert.equal(requested, false);
  assert.equal(result.hasGoogleReviews, false);
  assert.equal(result.items.length, 3);
  assert.ok(result.items.every(({ source }) => source === 'manual'));
});

test('normaliza avaliações do Google e completa a grade com fallback manual', async () => {
  const section = createSection();
  section.google.placeId = 'ChIJ-place-id';
  section.google.limit = 3;

  const result = await resolveReviews(section, {
    apiKey: 'test-key',
    fetcher: async (input, init) => {
      assert.match(String(input), /places\.googleapis\.com\/v1\/places\/ChIJ-place-id/);
      assert.equal(new Headers(init?.headers).get('X-Goog-Api-Key'), 'test-key');

      return new Response(JSON.stringify({
        googleMapsLinks: { reviewsUri: 'https://maps.google.com/reviews' },
        reviews: [
          {
            text: { text: 'Atendimento excelente.' },
            rating: 5,
            relativePublishTimeDescription: 'há uma semana',
            publishTime: '2026-08-20T12:00:00Z',
            googleMapsUri: 'https://maps.google.com/review/1',
            authorAttribution: {
              displayName: 'Cliente Google',
              photoUri: 'https://example.com/avatar.jpg',
              uri: 'https://maps.google.com/contributor/1',
            },
          },
          {
            originalText: { text: 'Profissional cuidadoso.' },
            rating: 4,
            authorAttribution: {},
          },
        ],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });

  assert.equal(result.hasGoogleReviews, true);
  assert.equal(result.items.length, 3);
  assert.equal(result.items[0].source, 'google');
  assert.equal(result.items[0].name, 'Cliente Google');
  assert.equal(result.items[0].details, 'Não disponível');
  assert.equal(result.items[0].googleMapsUrl, 'https://maps.google.com/review/1');
  assert.equal(result.items[0].authorProfileUrl, 'https://maps.google.com/contributor/1');
  assert.equal(result.items[1].name, 'Usuário do Google');
  assert.equal(result.items[1].googleMapsUrl, 'https://maps.google.com/reviews');
  assert.equal(result.items[2].source, 'manual');
});

test('mantém o site publicável quando o Google Places falha', async () => {
  const section = createSection();
  section.google.placeId = 'ChIJ-place-id';
  const warnings: string[] = [];

  const result = await resolveReviews(section, {
    apiKey: 'test-key',
    fetcher: async () => new Response('indisponível', { status: 503 }),
    warn: (message) => warnings.push(message),
  });

  assert.equal(result.hasGoogleReviews, false);
  assert.ok(result.items.every(({ source }) => source === 'manual'));
  assert.match(warnings[0], /HTTP 503/);
});
