import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const KNOWN_TABLES = ["comments", "user_liked_tracks", "user_profiles"];
const PAGE_SIZE = 1000;
const LIST_PAGE_SIZE = 100;

function ts() {
  const now = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}`;
}

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
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function detectTablesFromRestApi(supabaseUrl, serviceRoleKey) {
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/openapi+json",
      },
    });
    if (!res.ok) return [];
    const doc = await res.json();
    const paths = Object.keys(doc?.paths || {});
    return unique(
      paths
        .map((p) => p.replace(/^\/+/, "").split("/")[0] || "")
        .filter((name) => name && name !== "rpc")
    );
  } catch {
    return [];
  }
}

async function dumpTableData(supabase, tableName, outPath) {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Table ${tableName}: ${error.message}`);
    }

    const chunk = Array.isArray(data) ? data : [];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  await fs.writeFile(outPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  return rows.length;
}

function isFolderLike(item) {
  return !item?.id;
}

async function listAllObjects(storage, bucket, prefix = "") {
  const files = [];
  const folders = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.from(bucket).list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Storage list ${bucket}/${prefix}: ${error.message}`);
    }

    const page = Array.isArray(data) ? data : [];
    for (const item of page) {
      const name = item?.name || "";
      if (!name) continue;
      const itemPath = prefix ? `${prefix}/${name}` : name;
      if (isFolderLike(item)) {
        folders.push(itemPath);
      } else {
        files.push(itemPath);
      }
    }

    if (page.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  for (const folder of folders) {
    const nested = await listAllObjects(storage, bucket, folder);
    files.push(...nested);
  }

  return files;
}

async function downloadObject(storage, bucket, objectPath, outputRoot) {
  const { data, error } = await storage.from(bucket).download(objectPath);
  if (error) {
    throw new Error(`Storage download ${bucket}/${objectPath}: ${error.message}`);
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  const dst = path.join(outputRoot, objectPath);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.writeFile(dst, bytes);
}

async function main() {
  await loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const dumpDirName = `supabase_dump_${ts()}`;
  const dumpDir = path.join(ROOT, dumpDirName);
  const dbDir = path.join(dumpDir, "db");
  const dbDataDir = path.join(dbDir, "data");
  const storageDir = path.join(dumpDir, "storage");

  await fs.mkdir(dbDataDir, { recursive: true });
  await fs.mkdir(storageDir, { recursive: true });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const detectedTables = await detectTablesFromRestApi(supabaseUrl, serviceRoleKey);
  const tables = unique([...KNOWN_TABLES, ...detectedTables]);

  const dbManifest = {
    tables: {},
    detectedTables,
  };

  for (const tableName of tables) {
    const outPath = path.join(dbDataDir, `${tableName}.json`);
    try {
      const rowCount = await dumpTableData(supabase, tableName, outPath);
      dbManifest.tables[tableName] = { status: "ok", rows: rowCount };
      console.log(`DB: ${tableName} -> ${rowCount} rows`);
    } catch (err) {
      dbManifest.tables[tableName] = { status: "error", error: err.message || String(err) };
      console.log(`DB: ${tableName} -> error`);
    }
  }

  await fs.writeFile(path.join(dbDir, "manifest.json"), `${JSON.stringify(dbManifest, null, 2)}\n`, "utf8");

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) throw new Error(`List buckets failed: ${bucketsError.message}`);

  const storageManifest = { buckets: {} };
  for (const bucket of buckets || []) {
    const bucketName = bucket.name;
    const bucketOut = path.join(storageDir, bucketName);
    await fs.mkdir(bucketOut, { recursive: true });

    try {
      const objects = await listAllObjects(supabase.storage, bucketName, "");
      let downloaded = 0;
      for (const objectPath of objects) {
        await downloadObject(supabase.storage, bucketName, objectPath, bucketOut);
        downloaded += 1;
      }
      storageManifest.buckets[bucketName] = { status: "ok", objects: downloaded };
      console.log(`Storage: ${bucketName} -> ${downloaded} objects`);
    } catch (err) {
      storageManifest.buckets[bucketName] = { status: "error", error: err.message || String(err) };
      console.log(`Storage: ${bucketName} -> error`);
    }
  }

  await fs.writeFile(path.join(storageDir, "manifest.json"), `${JSON.stringify(storageManifest, null, 2)}\n`, "utf8");

  const rootManifest = {
    createdAt: new Date().toISOString(),
    supabaseUrl,
    dumpDir: dumpDirName,
    dbManifest: "./db/manifest.json",
    storageManifest: "./storage/manifest.json",
  };
  await fs.writeFile(path.join(dumpDir, "manifest.json"), `${JSON.stringify(rootManifest, null, 2)}\n`, "utf8");

  console.log(`Dump created: ${dumpDirName}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
