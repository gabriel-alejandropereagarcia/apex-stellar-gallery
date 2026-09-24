/**
 * Enriquecimiento on-chain vía SEP-1 (stellar.toml).
 * Para cada proyecto con website -> fetch https://{domain}/.well-known/stellar.toml
 * -> extrae org info + endpoints SEP + currencies -> src/data/enrichment.json
 *
 * Uso:  node scripts/enrich-toml.mjs [--limit N] [--concurrency N]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "smol-toml";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DATA = join(ROOT, "src", "data");
const projects = JSON.parse(readFileSync(join(DATA, "projects.json"), "utf8"));

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
const LIMIT = flag("limit", Infinity);
const CONCURRENCY = flag("concurrency", 12);
const TIMEOUT_MS = 9000;

const SEP_KEYS = [
  "WEB_AUTH_ENDPOINT",
  "WEB_AUTH_FOR_CONTRACTS_ENDPOINT",
  "TRANSFER_SERVER",
  "TRANSFER_SERVER_SEP0024",
  "DIRECT_PAYMENT_SERVER",
  "KYC_SERVER",
  "FEDERATION_SERVER",
  "HORIZON_URL",
  "ANCHOR_QUOTE_SERVER",
];

const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

async function fetchToml(domain) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://${domain}/.well-known/stellar.toml`, {
      signal: ctrl.signal,
      headers: { accept: "text/plain, application/toml, */*" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extract(doc) {
  const seps = SEP_KEYS.filter((k) => typeof doc[k] === "string" && doc[k]);
  const currencies = Array.isArray(doc.CURRENCIES) ? doc.CURRENCIES : [];
  const validators = Array.isArray(doc.VALIDATORS) ? doc.VALIDATORS : [];
  return {
    orgName: doc.DOCUMENTATION?.ORG_NAME ?? null,
    orgLogo: doc.DOCUMENTATION?.ORG_LOGO ?? null,
    sepEndpoints: seps,
    currencyCount: currencies.length,
    currencyCodes: currencies.map((c) => c?.code).filter(Boolean).slice(0, 12),
    validators: validators.length,
    accounts: Array.isArray(doc.ACCOUNTS) ? doc.ACCOUNTS.length : 0,
  };
}

const targets = [];
const seen = new Map();
for (const p of projects) {
  const domain = p.website ? domainOf(p.website) : null;
  if (!domain) continue;
  if (!seen.has(domain)) seen.set(domain, []);
  seen.get(domain).push(p.slug);
}
const domains = [...seen.keys()].slice(0, LIMIT);
console.log(`SEP-1: ${domains.length} dominios únicos (${seen.size} total)`);

const results = {};
let done = 0, ok = 0;
const queue = [...domains];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const domain = queue.shift();
      const text = await fetchToml(domain);
      if (text) {
        try {
          const info = { domain, ...extract(parseToml(text)) };
          for (const slug of seen.get(domain)) results[slug] = info;
          ok++;
        } catch {}
      }
      if (++done % 100 === 0) console.log(`  ${done}/${domains.length} (${ok} con toml)`);
    }
  }),
);

const prev = existsSync(join(DATA, "enrichment.json"))
  ? JSON.parse(readFileSync(join(DATA, "enrichment.json"), "utf8"))
  : {};
const merged = { ...prev, ...results };
writeFileSync(join(DATA, "enrichment.json"), JSON.stringify(merged));
console.log(`OK ${ok}/${domains.length} dominios con stellar.toml -> ${Object.keys(merged).length} proyectos enriquecidos`);
