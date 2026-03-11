import type { Release, ReleaseRegistryItem } from "../types/release";
import { toCanonicalTrackId } from "./track-id";

function canonicalizeReleaseTrackIds(release: Release): Release {
  return {
    ...release,
    tracks: (release.tracks || []).map((track) => ({
      ...track,
      id: toCanonicalTrackId(track.id),
    })),
  };
}

export async function loadReleaseRegistry(): Promise<ReleaseRegistryItem[]> {
  const response = await fetch("/tracks/releases.json", { cache: "no-store" });
  if (!response.ok) {
    return [];
  }

  return (await response.json()) as ReleaseRegistryItem[];
}

export async function loadAllReleases(): Promise<Release[]> {
  const registry = await loadReleaseRegistry();
  const loaded = await Promise.all(
    registry.map(async ({ dataFile }) => {
      const response = await fetch(dataFile, { cache: "no-store" });
      if (!response.ok) {
        return null;
      }

      const release = await (response.json() as Promise<Release>);
      return canonicalizeReleaseTrackIds(release);
    }),
  );

  return loaded
    .filter((release): release is Release => Boolean(release))
    .sort((a, b) => {
      const aTime = new Date(a.releaseDate).getTime();
      const bTime = new Date(b.releaseDate).getTime();
      return bTime - aTime;
    });
}

export async function loadReleaseById(id: string): Promise<Release | null> {
  const registry = await loadReleaseRegistry();
  const item = registry.find((entry) => entry.id === id);
  if (!item) return null;

  const response = await fetch(item.dataFile, { cache: "no-store" });
  if (!response.ok) return null;
  const release = (await response.json()) as Release;
  return canonicalizeReleaseTrackIds(release);
}
