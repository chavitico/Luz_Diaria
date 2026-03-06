/**
 * Biblical Card Image Preloader
 *
 * Provides a fire-and-forget utility to warm the React Native image cache
 * for card artwork before the user navigates to the album or card reveal.
 *
 * Strategy:
 * - Call preloadCardImages() when the user opens the "Objetos Especiales"
 *   section in the Store, and again when the Album screen mounts.
 * - React Native's Image.prefetch() resolves once the image is in the
 *   native HTTP cache. Subsequent <Image source={{ uri }} /> renders are
 *   served from cache with no visible network delay.
 * - Preloads are fire-and-forget; errors are swallowed so they never block UI.
 */

import { Image } from 'react-native';
import { BIBLICAL_CARDS } from './biblical-cards';

/** All image URLs declared in biblical-cards.ts */
export const ALL_CARD_IMAGE_URLS: string[] = Object.values(BIBLICAL_CARDS)
  .filter((c) => !!c.imageUrl)
  .map((c) => c.imageUrl as string);

let _preloadStarted = false;

/**
 * Prefetch all biblical card artwork into the native image cache.
 * Safe to call multiple times — after the first call it is a no-op so we
 * never fire duplicate network requests.
 *
 * @param force  Pass `true` to ignore the deduplication guard (e.g. after
 *               new cards are added during a session).
 */
export function preloadCardImages(force = false): void {
  if (_preloadStarted && !force) return;
  _preloadStarted = true;

  const t0 = Date.now();
  console.log(`[Cards] Preloading ${ALL_CARD_IMAGE_URLS.length} card image(s)…`);

  let loaded = 0;
  for (const url of ALL_CARD_IMAGE_URLS) {
    Image.prefetch(url)
      .then(() => {
        loaded += 1;
        if (loaded === ALL_CARD_IMAGE_URLS.length) {
          console.log(`[Cards] All ${loaded} card image(s) cached in ${Date.now() - t0}ms`);
        }
      })
      .catch(() => {
        // Swallow — preload is best-effort; the Image component will re-fetch.
      });
  }
}

/**
 * Prefetch only the images for the cards a user currently owns.
 * Useful on album mount so owned card art loads first.
 */
export function preloadOwnedCardImages(ownedCardIds: string[]): void {
  const urls = ownedCardIds
    .map((id) => BIBLICAL_CARDS[id]?.imageUrl)
    .filter((url): url is string => !!url);

  if (urls.length === 0) return;

  const t0 = Date.now();
  console.log(`[Cards] Preloading ${urls.length} owned card image(s)…`);

  let loaded = 0;
  for (const url of urls) {
    Image.prefetch(url)
      .then(() => {
        loaded += 1;
        if (loaded === urls.length) {
          console.log(`[Cards] Owned card images ready in ${Date.now() - t0}ms`);
        }
      })
      .catch(() => {});
  }
}
