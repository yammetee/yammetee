import { toStorageObjectPath } from "./storage-path";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function encodePath(pathname: string): string {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function resolveTrackAssetSource(input: string): string {
  const bucket = 'tracks';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!bucket || !supabaseUrl) {
    return input;
  }

  if (!input.startsWith("/tracks/")) {
    return input;
  }

  const objectPath = toStorageObjectPath(input);
  const encodedPath = encodePath(objectPath);
  return `${trimTrailingSlash(supabaseUrl)}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

interface CoverSourceOptions {
  width?: number;
  quality?: number;
}

export function resolveCoverSource(input: string, options: CoverSourceOptions = {}): string {
  const bucket = 'tracks'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!bucket || !supabaseUrl) {
    return input;
  }

  if (!input.startsWith("/tracks/")) {
    return input;
  }

  const objectPath = toStorageObjectPath(input);
  const encodedPath = encodePath(objectPath);
  const params = new URLSearchParams();

  if (options.width && Number.isFinite(options.width)) {
    params.set("width", String(Math.max(1, Math.round(options.width))));
  }

  if (options.quality && Number.isFinite(options.quality)) {
    params.set("quality", String(Math.min(100, Math.max(1, Math.round(options.quality)))));
  }

  const query = params.toString();
  const base = `${trimTrailingSlash(supabaseUrl)}/storage/v1/render/image/public/${bucket}/${encodedPath}`;
  return query ? `${base}?${query}` : base;
}

export function resolveAudioSource(input: string): string {
  return resolveTrackAssetSource(input);
}

export function isResolvedRemoteAsset(input: string): boolean {
  return /^https?:\/\//i.test(resolveTrackAssetSource(input));
}
