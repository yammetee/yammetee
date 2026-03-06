import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, "public");
const TRACKS_ROOT = path.join(PUBLIC_ROOT, "tracks");
const REGISTRY_PATH = path.join(TRACKS_ROOT, "releases.json");

async function loadEnvFile() {
  const envPath = path.join(ROOT, ".env.local");
  let raw = "";
  try {
    raw = await fs.readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

await loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_TRACKS_BUCKET || "tracks";

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

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

function getContentType(ext) {
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".flac":
      return "audio/flac";
    case ".m4a":
      return "audio/mp4";
    case ".aac":
      return "audio/aac";
    case ".ogg":
      return "audio/ogg";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function translit(input) {
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  let out = "";
  for (const ch of input) out += map[ch.toLowerCase()] ?? ch;
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

function toStorageObjectPath(audioPath) {
  const rel = audioPath.replace(/^\/tracks\//, "");
  const parts = rel.split("/").filter(Boolean);
  return parts
    .map((part) => {
      const dot = part.lastIndexOf(".");
      if (dot <= 0) return slugify(part) || "item";
      const name = part.slice(0, dot);
      const ext = part.slice(dot + 1).toLowerCase();
      return `${slugify(name) || "item"}.${ext}`;
    })
    .join("/");
}

async function ensureBucket() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const exists = (data || []).some((item) => item.name === bucket);
  if (exists) return;
  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
  });
  if (createError) throw createError;
}

async function uploadFile(audioPath) {
  const absPath = path.join(PUBLIC_ROOT, audioPath.replace(/^\//, ""));
  const objectPath = toStorageObjectPath(audioPath);
  try {
    await fs.access(absPath);
  } catch {
    return { status: "skipped_missing_local", objectPath };
  }

  const bytes = await fs.readFile(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, bytes, {
      contentType: getContentType(ext),
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) {
    if (
      String(error.message || "")
        .toLowerCase()
        .includes("already exists")
    ) {
      return { status: "already_exists", objectPath };
    }
    throw new Error(`${audioPath}: ${error.message}`);
  }
  return { status: "uploaded", objectPath };
}

async function main() {
  const args = parseArgs(process.argv);
  const targetReleaseId =
    typeof args.release === "string" ? args.release.trim() : "";

  await ensureBucket();

  const registryAll = JSON.parse(await fs.readFile(REGISTRY_PATH, "utf8"));
  const registry = targetReleaseId
    ? registryAll.filter((item) => item.id === targetReleaseId)
    : registryAll;

  if (!registry.length) {
    console.error(
      targetReleaseId
        ? `Release not found: ${targetReleaseId}`
        : "No releases found.",
    );
    process.exit(1);
  }

  const assetPaths = [];
  for (const item of registry) {
    const metaPath = path.join(PUBLIC_ROOT, item.dataFile.replace(/^\//, ""));
    const release = JSON.parse(await fs.readFile(metaPath, "utf8"));

    if (
      typeof release.cover === "string" &&
      release.cover.startsWith("/tracks/")
    ) {
      assetPaths.push(release.cover);
    }

    for (const track of release.tracks || []) {
      if (
        typeof track.audio === "string" &&
        track.audio.startsWith("/tracks/")
      ) {
        assetPaths.push(track.audio);
      }
    }
  }

  const uniqueAssetPaths = [...new Set(assetPaths)];
  console.log(`Found asset paths: ${uniqueAssetPaths.length}`);

  let processed = 0;
  let uploaded = 0;
  let alreadyExists = 0;
  let skippedMissingLocal = 0;
  for (const assetPath of uniqueAssetPaths) {
    const result = await uploadFile(assetPath);
    processed += 1;
    if (result.status === "uploaded") uploaded += 1;
    if (result.status === "already_exists") alreadyExists += 1;
    if (result.status === "skipped_missing_local") skippedMissingLocal += 1;

    if (processed % 10 === 0 || processed === uniqueAssetPaths.length) {
      console.log(`Processed ${processed}/${uniqueAssetPaths.length}`);
    }
  }

  console.log(`Done. Bucket: ${bucket}`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Already exists: ${alreadyExists}`);
  console.log(`Skipped missing local: ${skippedMissingLocal}`);
  console.log(`Set NEXT_PUBLIC_SUPABASE_TRACKS_BUCKET=${bucket}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
