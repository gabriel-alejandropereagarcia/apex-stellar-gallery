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

// Si hay key JSON la usamos; si no, intentamos Application Default Credentials
// (gcloud auth application-default login) con proyecto de env.
const useAdc = !existsSync(keyPath);
if (useAdc && !process.env.GOOGLE_CLOUD_PROJECT) {
  console.error(`No hay key en ${keyPath} ni credenciales ADC configuradas.`);
  console.error("  Opción A: bajar key JSON de la service account -> secrets/gcp-key.json");
  console.error("  Opción B: gcloud auth application-default login && set GOOGLE_CLOUD_PROJECT=<tu-proyecto>");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRYRUN = args.includes("--dryrun");
const FORCE = args.includes("--force");
const daysIdx = args.indexOf("--days");
const DAYS = daysIdx >= 0 ? Number(args[daysIdx + 1]) : 30;
const MAX_GB = Number(process.env.HUBBLE_MAX_GB ?? 250); // guard de costo (~$1.5/TB on-demand)

const projects = JSON.parse(readFileSync(join(DATA, "projects.json"), "utf8"));
const keyProjectId = useAdc ? null : JSON.parse(readFileSync(keyPath, "utf8")).project_id;
const bq = new BigQuery(
  useAdc
    ? { projectId: process.env.GOOGLE_CLOUD_PROJECT }
    : { keyFilename: keyPath, projectId: keyProjectId },
);
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
console.log(`  contract_data: ${[...cdCols].slice(0, 8).join(", ")}…`);

const out = {};
const slot = (slug) => (out[slug] ??= { tokens: {}, contractActivity: {} });

const contractIds = [
  ...new Set(projects.flatMap((p) => (p.contracts ?? []).map((c) => c.id).filter(Boolean))),
];
const slugByContract = {};
for (const p of projects) for (const c of p.contracts ?? []) if (c.id) slugByContract[c.id] = p.slug;
const inContracts = contractIds.map((id) => `'${id}'`).join(",");
const dateFilter = `batch_run_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${DAYS} DAY)`;

// --- 1. Contratos: última actividad (contract_data) ---------------------------------
if (cdCols.has("contract_id") && cdCols.has("last_modified_ledger") && contractIds.length) {
  const rows = await runQuery(
    "contract_data",
    `SELECT contract_id, MAX(last_modified_ledger) AS last_mod, COUNT(*) AS entries
     FROM ${DS}.contract_data WHERE contract_id IN (${inContracts}) GROUP BY contract_id`,
  );
  for (const r of rows ?? []) {
    const s = slugByContract[r.contract_id];
    if (s)
      slot(s).contractActivity[r.contract_id] = {
        ...(slot(s).contractActivity[r.contract_id] ?? {}),
        lastModifiedLedger: Number(r.last_mod),
        entries: Number(r.entries),
      };
  }
}

// --- 2. Contratos: invocaciones + usuarios únicos (enriched_history_operations) -------
{
  const rows = await runQuery(
    "contract-invocations",
    `SELECT contract_id, COUNT(*) AS invokes, COUNT(DISTINCT op_source_account) AS users,
            MAX(closed_at) AS last_used
     FROM ${DS}.enriched_history_operations
     WHERE ${dateFilter} AND contract_id IN (${inContracts})
     GROUP BY contract_id`,
  );
  for (const r of rows ?? []) {
    const s = slugByContract[r.contract_id];
    if (s)
      Object.assign(slot(s).contractActivity[r.contract_id] ??= {}, {
        invocations30d: Number(r.invokes),
        users30d: Number(r.users),
        lastUsed: r.last_used?.value ?? r.last_used ?? null,
      });
  }
}

// --- 3. Contratos: eventos emitidos (history_contract_events) ------------------------
{
  const rows = await runQuery(
    "contract-events",
    `SELECT contract_id, COUNT(*) AS events
     FROM ${DS}.history_contract_events
     WHERE ${dateFilter} AND contract_id IN (${inContracts})
     GROUP BY contract_id`,
  );
  for (const r of rows ?? []) {
    const s = slugByContract[r.contract_id];
    if (s)
      Object.assign(slot(s).contractActivity[r.contract_id] ??= {}, {
        events30d: Number(r.events),
      });
  }
}

// --- 4. Tokens: transfers + emisores únicos (token_transfers_raw) --------------------
const tokenPairs = [];
const slugByPair = {};
for (const p of projects) {
  for (const t of p.tokens ?? []) {
    if (!t.code || !t.issuer) continue;
    tokenPairs.push(t);
    slugByPair[`${t.code}|${t.issuer}`] = p.slug;
  }
}
if (tokenPairs.length) {
  const pairs = tokenPairs.map((t) => `('${t.code.replace(/'/g, "")}','${t.issuer}')`).join(",");
  const rows = await runQuery(
    "token-transfers",
    `SELECT asset_code, asset_issuer, COUNT(*) AS transfers,
            COUNT(DISTINCT \`from\`) AS senders
     FROM ${DS}.token_transfers_raw
     WHERE ${dateFilter} AND (asset_code, asset_issuer) IN (${pairs})
     GROUP BY asset_code, asset_issuer`,
  );
  for (const r of rows ?? []) {
    const s = slugByPair[`${r.asset_code}|${r.asset_issuer}`];
    if (s)
      slot(s).tokens[`${r.asset_code}-${r.asset_issuer}`] = {
        transfers30d: Number(r.transfers),
        senders30d: Number(r.senders),
      };
  }
}

if (!DRYRUN) {
  writeFileSync(
    join(DATA, "hubble.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), days: DAYS, projects: out }),
  );
  console.log(`OK ${Object.keys(out).length} proyectos con datos históricos -> src/data/hubble.json`);
}
