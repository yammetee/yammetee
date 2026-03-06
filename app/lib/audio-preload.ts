import { resolveAudioSource } from "./audio-source";

const prefetched = new Set<string>();
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
  if (typeof window === "undefined") return;
  const src = resolveAudioSource(audioPath);
  if (prefetched.has(src)) return;
  prefetched.add(src);

  preconnectAudioOrigin(audioPath);

  const audio = new Audio();
  audio.preload = "auto";
  audio.src = src;
  audio.load();
}
