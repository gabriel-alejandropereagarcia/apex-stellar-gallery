/**
 * Ingesta del dataset abierto LumenLoop stellar-ecosystem-db.
 * YAML (projects/ + contracts/) -> src/data/projects.json normalizado.
 *
 * Uso:  node scripts/ingest.mjs [ruta-al-dataset]
 * Env:  ECOSYSTEM_DB  (default: ../stellar-ecosystem-db)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DB = resolve(process.argv[2] ?? process.env.ECOSYSTEM_DB ?? join(ROOT, "..", "stellar-ecosystem-db"));
const OUT_DIR = join(ROOT, "src", "data");

const asUrl = (v) => {
  if (!v || typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

const SOCIAL_PREFIX = {
  x: "https://x.com/",
  telegram: "https://t.me/",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  reddit: "https://reddit.com/u/",
};

function normalizeLinks(raw = {}) {
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    const items = list(val);
    if (!items.length) continue;
    const prefix = SOCIAL_PREFIX[key];
    out[key] = items.map((entry) => {
      const s = String(entry).trim();
      if (/^https?:\/\//i.test(s)) return s;
      if (prefix && !s.includes("/") && !s.includes(".")) return `${prefix}${s.replace(/^@/, "")}`;
      return `https://${s}`;
    });
  }
  return out;
}

function loadYamlDir(dir) {
  if (!existsSync(dir)) return new Map();
  const map = new Map();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
    map.set(basename(file).replace(/\.ya?ml$/, ""), YAML.parse(readFileSync(join(dir, file), "utf8")));
  }
  return map;
}

const projects = loadYamlDir(join(DB, "projects"));
const contracts = loadYamlDir(join(DB, "contracts"));

if (!projects.size) {
  console.error(`No se encontraron proyectos en ${DB}/projects — clona lumenloop/stellar-ecosystem-db`);
  process.exit(1);
}

const out = [];
for (const [slug, p] of projects) {
  const rawContracts = contracts.get(slug);
  const contractList = Array.isArray(rawContracts) ? rawContracts : [];
  const links = normalizeLinks(p.links);
  const audits = list(p.mainnet?.audits).map((a) => ({
    name: a?.name ?? "Audit",
    url: asUrl(a?.url),
    date: a?.date ?? null,
    auditor: a?.auditor ?? null,
  }));
  const tokens = list(p.mainnet?.tokens).map((t) => ({
    code: t?.code ?? null,
    issuer: t?.issuer ?? null,
    decimals: t?.decimals ?? null,
  }));

  out.push({
    slug,
    title: p.title ?? slug,
    otherNames: list(p.other_names),
    parent: p.parent ?? null,
    description: (p.description ?? "").trim(),
    links,
    website: links.website?.[0] ?? null,
    category: p.attributes?.category ?? "Uncategorized",
    tags: list(p.attributes?.tags),
    regions: list(p.attributes?.operating_region),
    basedIn: p.attributes?.based_in ?? null,
    avatar: p.images?.avatar ?? null,
    logo: p.images?.logo ?? null,
    scf: p.scf
      ? {
          rounds: list(p.scf.awarded_round).map(String),
          total: p.scf.awarded_total ?? 0,
          submissions: list(p.scf.submission_urls).map(asUrl),
        }
      : null,
    audits,
    tokens,
    contracts: contractList.map((c) => ({
      id: c?.id ?? null,
      label: c?.label ?? null,
      isPool: Boolean(c?.is_pool),
      tags: list(c?.tags),
    })),
  });
}

out.sort((a, b) => a.title.localeCompare(b.title));

const categories = {};
const tagSet = new Set();
let scfFunded = 0, audited = 0, withContracts = 0, contractTotal = 0;
for (const p of out) {
  categories[p.category] = (categories[p.category] ?? 0) + 1;
  p.tags.forEach((t) => tagSet.add(t));
  if (p.scf?.total) scfFunded++;
  if (p.audits.length) audited++;
  if (p.contracts.length) { withContracts++; contractTotal += p.contracts.length; }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "projects.json"), JSON.stringify(out, null, 0));
writeFileSync(
  join(OUT_DIR, "meta.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: "lumenloop/stellar-ecosystem-db",
      totals: {
        projects: out.length,
        scfFunded,
        audited,
        withContracts,
        contracts: contractTotal,
        tags: tagSet.size,
      },
      categories,
    },
    null,
    2,
  ),
);

console.log(`OK ${out.length} proyectos -> src/data/projects.json`);
console.log(`   categorías: ${Object.keys(categories).length}, contratos: ${contractTotal}, SCF: ${scfFunded}, auditados: ${audited}`);
