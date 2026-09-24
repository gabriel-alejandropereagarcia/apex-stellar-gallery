/**
 * StellarExpert Directory -> tags de direcciones conocidas (anchor, exchange, issuer…)
 * Mapea issuer/account -> proyecto. Salida: src/data/directory.json { [slug]: {issuerTags, dirName} }
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DATA = join(ROOT, "src", "data");
const projects = JSON.parse(readFileSync(join(DATA, "projects.json"), "utf8"));

const res = await fetch("https://api.stellar.expert/explorer/directory?limit=20000");
if (!res.ok) {
  console.error(`directory API -> ${res.status}`);
  process.exit(1);
}
const body = await res.json();
const records = body?._embedded?.records ?? body?.records ?? (Array.isArray(body) ? body : []);
console.log(`Directory: ${records.length} direcciones tagged`);

const byAddress = new Map(records.map((r) => [r.address, r]));

const out = {};
for (const p of projects) {
  const hits = [];
  for (const t of p.tokens ?? []) {
    const rec = t.issuer && byAddress.get(t.issuer);
    if (rec) hits.push(rec);
  }
  if (hits.length) {
    out[p.slug] = {
      names: [...new Set(hits.map((h) => h.name).filter(Boolean))],
      tags: [...new Set(hits.flatMap((h) => h.tags ?? []))],
      domains: [...new Set(hits.map((h) => h.domain).filter(Boolean))],
    };
  }
}

writeFileSync(join(DATA, "directory.json"), JSON.stringify(out));
console.log(`OK ${Object.keys(out).length} proyectos con direcciones tagged en StellarExpert`);
