const CYRILLIC_MAP: Record<string, string> = {
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

function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    const lower = ch.toLowerCase();
    out += CYRILLIC_MAP[lower] ?? ch;
  }
  return out;
}

function slugify(input: string): string {
  return transliterate(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toStorageObjectPath(input: string): string {
  const raw = input.replace(/^\/tracks\//, "");
  const parts = raw.split("/").filter(Boolean);
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
