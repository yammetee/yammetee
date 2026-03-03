import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET = path.join(ROOT, 'public', 'tracks');

const PATTERNS = [/Timmy Hurtful/gi, /TIMMY HURTFUL/gi];

function replaceName(name) {
  let next = name;
  for (const pattern of PATTERNS) {
    next = next.replace(pattern, 'Yamme Tee');
  }
  return next;
}

async function collect(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await collect(fullPath)));
      paths.push(fullPath);
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}

async function main() {
  const allPaths = await collect(TARGET);
  // Deepest first so renames don't break child paths.
  allPaths.sort((a, b) => b.length - a.length);

  let renamed = 0;

  for (const oldPath of allPaths) {
    const base = path.basename(oldPath);
    const replaced = replaceName(base);

    if (base === replaced) continue;

    const newPath = path.join(path.dirname(oldPath), replaced);
    await fs.rename(oldPath, newPath);
    renamed += 1;
  }

  console.log(`Renamed ${renamed} paths.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
