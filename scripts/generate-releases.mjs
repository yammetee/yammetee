import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const TRACKS_ROOT = path.join(ROOT, 'public', 'tracks');
const META_DIR = path.join(TRACKS_ROOT, '_meta');
const REGISTRY_FILE = path.join(TRACKS_ROOT, 'releases.json');

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function hash(input) {
  return crypto.createHash('md5').update(input).digest('hex').slice(0, 8);
}

function slugify(input) {
  const ascii = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-{2,}/g, '-');

  return ascii;
}

function cleanReleaseTitle(name) {
  return name
    .replace(/\u00A0/g, ' ')
    .replace(/\s+-\s+EP$/i, '')
    .replace(/\s+-\s+ЕР$/i, '')
    .trim();
}

function titleFromFilename(filename) {
  return filename
    .replace(path.extname(filename), '')
    .replace(/^\d+\s*[.\-_)]+\s*/u, '')
    .replace(/^\d+(?=[A-Za-zА-Яа-яЁё])/u, '')
    .trim();
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function findCoverForFolder(folderName) {
  const topFolderPath = path.join(TRACKS_ROOT, folderName);
  const all = await walk(topFolderPath);
  const image = all.find((file) => IMAGE_EXTS.has(path.extname(file).toLowerCase()));

  if (image) {
    return `/${toPosix(path.relative(path.join(ROOT, 'public'), image))}`;
  }

  return '/favicon.svg';
}

async function loadExistingByAudio() {
  const map = new Map();

  try {
    const registryRaw = await fs.readFile(REGISTRY_FILE, 'utf8');
    const registry = JSON.parse(registryRaw);

    for (const item of registry) {
      try {
        const dataPath = path.join(ROOT, 'public', item.dataFile.replace(/^\//, ''));
        const release = JSON.parse(await fs.readFile(dataPath, 'utf8'));
        for (const track of release?.tracks || []) {
          if (track?.audio) {
            map.set(track.audio, {
              title: track.title,
              artist: track.artist,
              lyrics: track.lyrics || '',
            });
          }
        }
      } catch {
        // ignore broken metadata file
      }
    }
  } catch {
    // no previous registry
  }

  return map;
}

async function main() {
  const topEntries = await fs.readdir(TRACKS_ROOT, { withFileTypes: true });
  const folders = topEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '_meta')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const existingByAudio = await loadExistingByAudio();

  await fs.rm(META_DIR, { recursive: true, force: true });
  await fs.mkdir(META_DIR, { recursive: true });

  const registry = [];

  for (const folderName of folders) {
    const folderPath = path.join(TRACKS_ROOT, folderName);
    const files = await walk(folderPath);
    const audioFiles = files
      .filter((file) => AUDIO_EXTS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    if (audioFiles.length === 0) continue;

    const cover = await findCoverForFolder(folderName);

    const tracks = [];
    let latestTime = 0;

    for (const audioPath of audioFiles) {
      const relativeAudio = `/${toPosix(path.relative(path.join(ROOT, 'public'), audioPath))}`;
      const stat = await fs.stat(audioPath);
      latestTime = Math.max(latestTime, stat.mtimeMs);

      const existing = existingByAudio.get(relativeAudio);
      const trackRelative = toPosix(path.relative(folderPath, audioPath));

      tracks.push({
        id: `${slugify(trackRelative.replace(path.extname(trackRelative), '')) || 'track'}-${hash(trackRelative)}`,
        title: titleFromFilename(path.basename(audioPath)),
        artist: existing?.artist || 'Yamme Tee',
        audio: relativeAudio,
        lyrics: existing?.lyrics || '',
      });
    }

    const folderHash = hash(folderName);
    const folderSlug = slugify(folderName);
    const releaseId = folderSlug ? `${folderSlug}-${folderHash}` : `release-${folderHash}`;

    const release = {
      id: releaseId,
      title: cleanReleaseTitle(folderName),
      artist: 'Yamme Tee',
      releaseType: tracks.length > 1 ? 'EP' : 'Single',
      releaseDate: new Date(latestTime || Date.now()).toISOString().slice(0, 10),
      cover,
      tracks,
    };

    const outPath = path.join(META_DIR, `${releaseId}.json`);
    await fs.writeFile(outPath, `${JSON.stringify(release, null, 2)}\n`, 'utf8');

    registry.push({
      id: releaseId,
      dataFile: `/tracks/_meta/${releaseId}.json`,
    });
  }

  await fs.writeFile(REGISTRY_FILE, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

  console.log(`Generated ${registry.length} releases.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
