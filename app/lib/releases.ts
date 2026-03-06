import type { Release, ReleaseRegistryItem } from "../types/release";

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

      return response.json() as Promise<Release>;
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
  const releases = await loadAllReleases();
  return releases.find((release) => release.id === id) ?? null;
}
