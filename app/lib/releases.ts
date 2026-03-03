import type { Release, ReleaseRegistryItem } from "../types/release";

let registryCache: ReleaseRegistryItem[] | null = null;
let registryPromise: Promise<ReleaseRegistryItem[]> | null = null;

let releasesCache: Release[] | null = null;
let releasesPromise: Promise<Release[]> | null = null;

export async function loadReleaseRegistry(): Promise<ReleaseRegistryItem[]> {
  if (registryCache) {
    return registryCache;
  }

  if (registryPromise) {
    return registryPromise;
  }

  registryPromise = (async () => {
    const response = await fetch("/tracks/releases.json", { cache: "force-cache" });
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as ReleaseRegistryItem[];
    registryCache = data;
    return data;
  })();

  try {
    return await registryPromise;
  } finally {
    registryPromise = null;
  }
}

export async function loadAllReleases(): Promise<Release[]> {
  if (releasesCache) {
    return releasesCache;
  }

  if (releasesPromise) {
    return releasesPromise;
  }

  releasesPromise = (async () => {
    const registry = await loadReleaseRegistry();
    const loaded = await Promise.all(
      registry.map(async ({ dataFile }) => {
        const response = await fetch(dataFile, { cache: "force-cache" });
        if (!response.ok) {
          return null;
        }

        return response.json() as Promise<Release>;
      }),
    );

    const sorted = loaded
      .filter((release): release is Release => Boolean(release))
      .sort((a, b) => {
        const aTime = new Date(a.releaseDate).getTime();
        const bTime = new Date(b.releaseDate).getTime();
        return bTime - aTime;
      });

    releasesCache = sorted;
    return sorted;
  })();

  try {
    return await releasesPromise;
  } finally {
    releasesPromise = null;
  }
}

export async function loadReleaseById(id: string): Promise<Release | null> {
  const releases = await loadAllReleases();
  return releases.find((release) => release.id === id) ?? null;
}
