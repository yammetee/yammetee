import { resolveAudioSource } from "./audio-source";

const prefetched = new Set<string>();
const prefetchOrder: string[] = [];
const prefetchLinks = new Map<string, HTMLLinkElement>();
const MAX_PREFETCHED = 80;
let preconnected = false;

function getOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function preconnectAudioOrigin(audioPath: string) {
  if (typeof document === "undefined" || preconnected) return;
  const src = resolveAudioSource(audioPath);
  const origin = getOrigin(src);
  if (!origin) return;

  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = origin;
  document.head.appendChild(link);
  preconnected = true;
}

export function preloadAudio(audioPath: string) {
  if (typeof document === "undefined") return;
  const src = resolveAudioSource(audioPath);
  if (prefetched.has(src)) return;

  preconnectAudioOrigin(audioPath);

  // Use <link rel="preload"> instead of creating many Audio elements.
  // This reduces retained objects and decoder work while keeping startup fast.
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "audio";
  link.href = src;
  document.head.appendChild(link);

  prefetched.add(src);
  prefetchOrder.push(src);
  prefetchLinks.set(src, link);

  while (prefetchOrder.length > MAX_PREFETCHED) {
    const oldest = prefetchOrder.shift();
    if (!oldest) continue;
    prefetched.delete(oldest);
    const oldLink = prefetchLinks.get(oldest);
    if (oldLink) {
      oldLink.remove();
      prefetchLinks.delete(oldest);
    }
  }
}
