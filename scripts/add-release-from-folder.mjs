import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, "public");
const TRACKS_ROOT = path.join(PUBLIC_ROOT, "tracks");
const META_DIR = path.join(TRACKS_ROOT, "_meta");
const REGISTRY_PATH = path.join(TRACKS_ROOT, "releases.json");
const AUDIO_DIR = path.join(TRACKS_ROOT, "audio");
const COVERS_DIR = path.join(TRACKS_ROOT, "covers");

const AUDIO_EXTS = new Set([".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg"]);
const COVER_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const CYR_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function translit(input) {
  let out = "";
  for (const ch of input) out += CYR_MAP[ch.toLowerCase()] ?? ch;
  return out;
}

function slugify(input) {
  return translit(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "");
}

function hash(input) {
  return crypto.createHash("md5").update(input).digest("hex").slice(0, 8);
}

function titleFromFilename(filename) {
  return filename
    .replace(path.extname(filename), "")
    .replace(/^\d+\s*[.\-_)]+\s*/u, "")
    .replace(/^\d+(?=[A-Za-zА-Яа-яЁё])/u, "")
    .trim();
}

function createTrackId(trackTitle, audioFile, takenTrackIds) {
  const base = slugify(trackTitle) || "track";
  let attempt = 0;
  while (true) {
    const suffix = hash(`${audioFile}:${attempt}`);
    const candidate = `${base}-${suffix}`;
    if (!takenTrackIds.has(candidate)) return candidate;
    attempt += 1;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv);
  const sourceArg = String(args.source || "").trim();
  const id = String(args.id || "").trim();
  const append = Boolean(args.append);
  const replaceCover = Boolean(args["replace-cover"]);
  const titleArg = typeof args.title === "string" ? args.title.trim() : "";
  const artistArg = typeof args.artist === "string" ? args.artist.trim() : "";
  const dateArg = typeof args.date === "string" ? args.date.trim() : "";
  const releaseTypeArg = String(args.type || "").trim();

  if (!sourceArg || !id) {
    console.error("Usage: node scripts/add-release-from-folder.mjs --source <folder> --id <release-id> [--title <title>] [--artist Yamme Tee] [--date YYYY-MM-DD] [--type EP|Single] [--append] [--replace-cover]");
    process.exit(1);
  }

  const registry = await readJson(REGISTRY_PATH);
  const existingRegistryItem = registry.find((item) => item.id === id);
  const metaPath = path.join(META_DIR, `${id}.json`);
  const hasExistingRelease = Boolean(existingRegistryItem);

  if (hasExistingRelease && !append) {
    console.error(`Release id already exists: ${id}. Use --append to add tracks to existing release.`);
    process.exit(1);
  }

  if (!hasExistingRelease && append) {
    console.error(`Release not found: ${id}. Remove --append to create new release.`);
    process.exit(1);
  }

  if (!hasExistingRelease && !titleArg) {
    console.error("--title is required when creating a new release.");
    process.exit(1);
  }

  const sourcePath = path.isAbsolute(sourceArg) ? sourceArg : path.join(ROOT, sourceArg);
  const sourceEntries = await fs.readdir(sourcePath, { withFileTypes: true });
  const files = sourceEntries.filter((e) => e.isFile()).map((e) => e.name);

  const audioFiles = files
    .filter((name) => AUDIO_EXTS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "ru"));

  await fs.mkdir(path.join(AUDIO_DIR, id), { recursive: true });
  await fs.mkdir(COVERS_DIR, { recursive: true });

  const coverCandidates = files
    .filter((name) => COVER_EXTS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "ru"));

  if (!audioFiles.length && !(replaceCover && coverCandidates.length)) {
    console.error("No audio files found in source folder.");
    process.exit(1);
  }

  const existingRelease = hasExistingRelease ? await readJson(metaPath) : null;
  const takenTrackIds = new Set((existingRelease?.tracks || []).map((track) => track.id));
  const incomingTracks = [];
  for (const audioFile of audioFiles) {
    const ext = path.extname(audioFile).toLowerCase();
    const trackTitle = titleFromFilename(audioFile);
    const trackId = createTrackId(trackTitle, audioFile, takenTrackIds);
    takenTrackIds.add(trackId);
    const src = path.join(sourcePath, audioFile);
    const dstRel = path.posix.join("tracks", "audio", id, `${trackId}${ext}`);
    const dst = path.join(PUBLIC_ROOT, dstRel);
    await fs.copyFile(src, dst);

    incomingTracks.push({
      id: trackId,
      title: trackTitle,
      artist: artistArg || existingRelease?.artist || "Yamme Tee",
      audio: `/${dstRel}`,
      lyrics: "",
    });
  }

  let incomingCover = "";
  if (coverCandidates.length && (replaceCover || !hasExistingRelease)) {
    const coverFile = coverCandidates[0];
    const ext = path.extname(coverFile).toLowerCase();
    const src = path.join(sourcePath, coverFile);
    const dstRel = path.posix.join("tracks", "covers", `${id}${ext}`);
    const dst = path.join(PUBLIC_ROOT, dstRel);
    await fs.copyFile(src, dst);
    incomingCover = `/${dstRel}`;
  }

  const release = hasExistingRelease
    ? {
        ...existingRelease,
        title: titleArg || existingRelease.title,
        artist: artistArg || existingRelease.artist,
        releaseDate: dateArg || existingRelease.releaseDate,
        releaseType: releaseTypeArg || existingRelease.releaseType,
        cover: incomingCover || existingRelease.cover,
        tracks: [...(existingRelease.tracks || []), ...incomingTracks],
      }
    : {
        id,
        title: titleArg,
        artist: artistArg || "Yamme Tee",
        releaseType: releaseTypeArg || (incomingTracks.length > 1 ? "EP" : "Single"),
        releaseDate: dateArg || new Date().toISOString().slice(0, 10),
        cover: incomingCover || "/favicon.svg",
        tracks: incomingTracks,
      };

  await fs.writeFile(metaPath, `${JSON.stringify(release, null, 2)}\n`, "utf8");

  if (!hasExistingRelease) {
    registry.push({
      id,
      dataFile: `/tracks/_meta/${id}.json`,
    });
    await fs.writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  }

  if (hasExistingRelease) {
    console.log(`Updated release: ${id}`);
    console.log(`Added tracks: ${incomingTracks.length}`);
    if (incomingCover) console.log("Cover: updated");
  } else {
    console.log(`Created release: ${id}`);
    console.log(`Tracks: ${incomingTracks.length}`);
  }
  console.log(`Meta: ${path.relative(ROOT, metaPath)}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
