// Shared fetch helper with abort-controller timeout.
// Prevents any network call from hanging indefinitely on slow/offline connections.
// Default: 12 seconds — enough for slow 3G, short enough to fail fast.
export function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeoutMs = 12_000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}
