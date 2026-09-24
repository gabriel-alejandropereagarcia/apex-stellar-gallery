/**
 * Enriquecimiento histórico vía Hubble (BigQuery público crypto-stellar.crypto_stellar).
 *
 * - contract_data  -> último ledger modificado por contrato (actividad histórica)
 * - history_operations -> ops + cuentas únicas por asset en últimos 30 días
 *
 * Credenciales: secrets/gcp-key.json  (service account con rol BigQuery Job User)
 * o GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON.
 *
 * Uso: node scripts/enrich-hubble.mjs [--force] [--days 30]
 *      --dryrun  solo estima bytes sin ejecutar
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BigQuery } from "@google-cloud/bigquery";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DATA = join(ROOT, "src", "data");
const KEY_FILE = join(ROOT, "secrets", "gcp-key.json");
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? KEY_FILE;

if (!existsSync(keyPath)) {
  console.error(`Falta la key de GCP: ${keyPath}`);
  console.error("  1. GCP Console -> IAM -> Service Accounts -> create (rol: BigQuery Job User)");
  console.error("  2. Keys -> Add Key -> JSON -> guardar como secrets/gcp-key.json");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRYRUN = args.includes("--dryrun");
const FORCE = args.includes("--force");
const DAYS = Number(args[args.indexOf("--days") + 1] ?? 30);
const MAX_GB = Number(process.env.HUBBLE_MAX_GB ?? 250); // guard de costo (~$1.5/TB on-demand)

const projects = JSON.parse(readFileSync(join(DATA, "projects.json"), "utf8"));
const bq = new BigQuery({ keyFilename: keyPath });
const DS = "`crypto-stellar.crypto_stellar`";

async function columnsOf(table) {
  const [rows] = await bq.query({
    query: `SELECT column_name FROM ${DS}.INFORMATION_SCHEMA.COLUMNS WHERE table_name='${table}'`,
  });
  return new Set(rows.map((r) => r.column_name));
}

async function runQuery(name, query, location = "US") {
  const [job] = await bq.createQueryJob({ query, location, dryRun: true });
  const bytes = Number(job.metadata.statistics.totalBytesProcessed);
  const gb = bytes / 1e9;
  console.log(`  [${name}] estimado: ${gb.toFixed(1)} GB`);
  if (DRYRUN) return null;
  if (gb > MAX_GB && !FORCE) {
    console.error(`  [${name}] aborta: ${gb.toFixed(0)}GB > ${MAX_GB}GB (usar --force)`);
    return null;
  }
  const [rows] = await bq.query({ query, location });
  console.log(`  [${name}] ${rows.length} filas`);
  return rows;
}

// --- schema discovery -------------------------------------------------------------
console.log("Descubriendo schema de Hubble…");
const cdCols = await columnsOf("contract_data");
const opCols = await columnsOf("history_operations");
console.log(`  contract_data: ${[...cdCols].slice(0, 8).join(", ")}…`);
console.log(`  history_operations: tiene asset_code=${opCols.has("asset_code")}, batch_run_date=${opCols.has("batch_run_date")}`);

const out = {};

// --- 1. Contratos: última actividad en contract_data -------------------------------
const contractIds = [
  ...new Set(projects.flatMap((p) => (p.contracts ?? []).map((c) => c.id).filter(Boolean))),
];
const slugByContract = {};
for (const p of projects) for (const c of p.contracts ?? []) if (c.id) slugByContract[c.id] = p.slug;

if (cdCols.has("contract_id") && cdCols.has("last_modified_ledger") && contractIds.length) {
  const inList = contractIds.map((id) => `'${id}'`).join(",");
  const rows = await runQuery(
    "contract_data",
    `SELECT contract_id, MAX(last_modified_ledger) AS last_mod, COUNT(*) AS entries
     FROM ${DS}.contract_data WHERE contract_id IN (${inList}) GROUP BY contract_id`,
  );
  if (rows) {
    for (const r of rows) {
      const slug = slugByContract[r.contract_id];
      if (!slug) continue;
      (out[slug] ??= { tokens: {}, contractActivity: {} }).contractActivity[r.contract_id] = {
        lastModifiedLedger: Number(r.last_mod),
        entries: Number(r.entries),
      };
    }
  }
} else {
  console.log("  contract_data sin columnas esperadas — se omite");
}

// --- 2. Tokens: ops + cuentas únicas últimos N días ---------------------------------
const tokenPairs = [];
const slugByPair = {};
for (const p of projects) {
  for (const t of p.tokens ?? []) {
    if (!t.code || !t.issuer) continue;
    tokenPairs.push({ slug: p.slug, code: t.code, issuer: t.issuer });
    slugByPair[`${t.code}|${t.issuer}`] = p.slug;
  }
}

if (opCols.has("asset_code") && opCols.has("asset_issuer") && tokenPairs.length) {
  const dateCol = opCols.has("batch_run_date") ? "batch_run_date" : "closed_at";
  const dateExpr =
    dateCol === "batch_run_date"
      ? `batch_run_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${DAYS} DAY)`
      : `closed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${DAYS} DAY)`;
  const pairs = tokenPairs.map((t) => `('${t.code.replace(/'/g, "")}','${t.issuer}')`).join(",");
  const rows = await runQuery(
    "token-ops",
    `SELECT asset_code, asset_issuer, COUNT(*) AS ops, COUNT(DISTINCT source_account) AS accounts
     FROM ${DS}.history_operations
     WHERE ${dateExpr} AND asset_code IS NOT NULL
       AND (asset_code, asset_issuer) IN (${pairs})
     GROUP BY asset_code, asset_issuer`,
  );
  if (rows) {
    for (const r of rows) {
      const slug = slugByPair[`${r.asset_code}|${r.asset_issuer}`];
      if (!slug) continue;
      (out[slug] ??= { tokens: {}, contractActivity: {} }).tokens[`${r.asset_code}-${r.asset_issuer}`] = {
        ops30d: Number(r.ops),
        accounts30d: Number(r.accounts),
      };
    }
  }
} else {
  console.log("  history_operations sin columnas de asset — se omite");
}

if (!DRYRUN) {
  writeFileSync(
    join(DATA, "hubble.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), days: DAYS, projects: out }),
  );
  console.log(`OK ${Object.keys(out).length} proyectos con datos históricos -> src/data/hubble.json`);
}
