import { promises as fs } from "node:fs";
import path from "node:path";
import type { Release, ReleaseRegistryItem } from "../types/release";
import { toCanonicalTrackId } from "./track-id";

function getPublicPath(relativePath: string): string {
  return path.join(process.cwd(), "public", relativePath.replace(/^\//, ""));
}

function canonicalizeReleaseTrackIds(release: Release): Release {
  return {
    ...release,
    tracks: (release.tracks || []).map((track) => ({
      ...track,
      id: toCanonicalTrackId(track.id),
    })),
  };
}

export async function loadReleaseRegistryServer(): Promise<ReleaseRegistryItem[]> {
  try {
    const filePath = getPublicPath("/tracks/releases.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as ReleaseRegistryItem[];
  } catch {
    return [];
  }
}

export async function loadAllReleasesServer(): Promise<Release[]> {
  const registry = await loadReleaseRegistryServer();
  const loaded = await Promise.all(
    registry.map(async ({ dataFile }) => {
      try {
        const filePath = getPublicPath(dataFile);
        const raw = await fs.readFile(filePath, "utf8");
        const release = JSON.parse(raw) as Release;
        return canonicalizeReleaseTrackIds(release);
      } catch {
        return null;
      }
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

export async function loadReleaseByIdServer(id: string): Promise<Release | null> {
  const releases = await loadAllReleasesServer();
  return releases.find((release) => release.id === id) ?? null;
}
