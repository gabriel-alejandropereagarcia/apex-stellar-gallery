/**
 * Enriquecimiento on-chain en vivo:
 *  - Tokens: StellarExpert Open API -> trustlines, payments, trades, rating
 *  - Contratos Soroban: RPC getLedgerEntries -> vivo si liveUntilLedgerSeq >= ledger actual
 *
 * Salida: src/data/chain.json  { [slug]: { tokens: [...], contractsAlive, contractsChecked } }
 *
 * Uso: node scripts/enrich-chain.mjs [--rpc URL]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rpc, Contract } from "@stellar/stellar-sdk";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DATA = join(ROOT, "src", "data");
const projects = JSON.parse(readFileSync(join(DATA, "projects.json"), "utf8"));

const rpcArg = process.argv.indexOf("--rpc");
const RPC_URL =
  rpcArg >= 0
    ? process.argv[rpcArg + 1]
    : process.env.STELLAR_RPC_URL ?? "https://soroban-rpc.mainnet.stellar.gateway.fm";
const EXPERT = "https://api.stellar.expert/explorer/public";

const getJson = async (url, ms = 9000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
};

// --- 1. Tokens via StellarExpert -------------------------------------------------
const out = {};
const tokenJobs = [];
for (const p of projects) {
  for (const t of p.tokens ?? []) {
    if (t.code && t.issuer) tokenJobs.push({ slug: p.slug, code: t.code, issuer: t.issuer });
  }
}
console.log(`Tokens a consultar: ${tokenJobs.length}`);

const CONC = 8;
const tokenQueue = [...tokenJobs];
await Promise.all(
  Array.from({ length: CONC }, async () => {
    while (tokenQueue.length) {
      const { slug, code, issuer } = tokenQueue.shift();
      const a = await getJson(`${EXPERT}/asset/${encodeURIComponent(code)}-${issuer}`);
      if (!a) continue;
      (out[slug] ??= { tokens: [], contractsAlive: 0, contractsChecked: 0 }).tokens.push({
        code: a.code ?? code,
        issuer,
        trustlines: a.trustlines?.total ?? a.trustlines?.funded ?? 0,
        payments: a.payments ?? 0,
        trades: a.trades ?? 0,
        rating: a.rating?.average ?? null,
        domain: a.domain ?? null,
      });
    }
  }),
);

// --- 2. Contratos Soroban via RPC -------------------------------------------------
const server = new rpc.Server(RPC_URL);
const { sequence: latestLedger } = await server.getLatestLedger();
console.log(`Ledger actual: ${latestLedger} — chequeando contratos…`);

const contractJobs = [];
for (const p of projects) {
  for (const c of p.contracts ?? []) {
    if (c.id) contractJobs.push({ slug: p.slug, id: c.id });
  }
}
console.log(`Contratos a chequear: ${contractJobs.length}`);

const contractQueue = [...contractJobs];
let checked = 0, alive = 0, unknown = 0;
const checkContract = async (id, attempts = 3) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const key = new Contract(id).getFootprint();
      const res = await server.getLedgerEntries(key);
      const entry = res.entries?.[0];
      if (!entry) return "expired";
      return (entry.liveUntilLedgerSeq ?? 0) >= res.latestLedger ? "alive" : "expired";
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  return "unknown";
};

await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (contractQueue.length) {
      const { slug, id } = contractQueue.shift();
      const status = await checkContract(id);
      const slot = (out[slug] ??= { tokens: [], contractsAlive: 0, contractsChecked: 0, contractStatus: {} });
      slot.contractStatus ??= {};
      slot.contractStatus[id] = status;
      if (status !== "unknown") slot.contractsChecked++;
      if (status === "alive") { slot.contractsAlive++; alive++; }
      if (status === "unknown") unknown++;
      if (++checked % 50 === 0) console.log(`  ${checked}/${contractJobs.length} (${alive} vivos, ${unknown} sin datos)`);
    }
  }),
);

writeFileSync(
  join(DATA, "chain.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), ledger: latestLedger, projects: out }),
);
console.log(`OK ${alive}/${checked} contratos vivos, ${Object.keys(out).length} proyectos con datos on-chain`);
