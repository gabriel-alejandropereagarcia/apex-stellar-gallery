import projectsJson from "@/data/projects.json";
import metaJson from "@/data/meta.json";
import enrichmentJson from "@/data/enrichment.json";
import chainJson from "@/data/chain.json";
import directoryJson from "@/data/directory.json";
import hubbleJson from "@/data/hubble.json";
import type { ChainInfo, DatasetMeta, DirInfo, HubbleInfo, Project, SepInfo } from "./types";

const enrichment = enrichmentJson as Record<string, SepInfo>;
const chain = (chainJson as { projects: Record<string, ChainInfo> }).projects;
const directory = directoryJson as Record<string, DirInfo>;
const hubble = (hubbleJson as { projects: Record<string, HubbleInfo> }).projects;

export const chainMeta = { ledger: chainJson.ledger, generatedAt: chainJson.generatedAt };

export const projects = (projectsJson as Project[]).map((p) => ({
  ...p,
  sep: enrichment[p.slug],
  chain: chain[p.slug],
  dir: directory[p.slug],
  hubble: hubble[p.slug],
}));
export const meta = metaJson as DatasetMeta;

export const categories = Object.entries(meta.categories).sort((a, b) => b[1] - a[1]);

export const allTags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort((a, b) =>
  a.localeCompare(b),
);

export const allRegions = Array.from(new Set(projects.flatMap((p) => p.regions))).sort((a, b) =>
  a.localeCompare(b),
);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Días aproximados desde que un ledger modificó un contrato (ledgers ~5s). */
export function ledgerDaysAgo(lastModifiedLedger: number): number {
  return Math.max(0, Math.round(((chainMeta.ledger - lastModifiedLedger) * 5) / 86400));
}

/** Score 0-100 de actividad verificable: contratos vivos, tokens, SEP-1, auditorías, GitHub. */
export function activityScore(p: Project): number {
  let s = 0;
  const c = p.chain;
  if (c) {
    if (c.contractsChecked) s += 35 * (c.contractsAlive / c.contractsChecked);
    for (const t of c.tokens) {
      s += Math.min(15, Math.log10(t.payments + 1) * 3);
      s += Math.min(15, Math.log10(t.trustlines + 1) * 4);
      s += (t.rating ?? 0) * 2;
    }
  }
  const h = p.hubble;
  if (h) {
    for (const t of Object.values(h.tokens)) s += Math.min(10, Math.log10(t.transfers30d + 1) * 2);
    for (const a of Object.values(h.contractActivity)) {
      s += Math.min(6, Math.log10((a.invocations30d ?? 0) + 1));
      if (a.lastModifiedLedger && ledgerDaysAgo(a.lastModifiedLedger) <= 30) s += 3;
    }
  }
  if (p.sep) s += 8;
  if (p.audits.length) s += 6;
  if (p.links.github?.length) s += 4;
  if (p.scf?.total) s += 4;
  return Math.round(Math.min(100, s));
}

/** Tiene señal on-chain verificable ahora mismo. */
export function isLive(p: Project): boolean {
  const c = p.chain;
  if (!c) return false;
  return c.contractsAlive > 0 || c.tokens.some((t) => t.trustlines > 0 || t.payments > 0);
}

export interface IntegrationCaps {
  contracts: number; // contratos Soroban publicados
  contractsAlive: number; // vivos verificados via RPC
  tokens: number; // assets mainnet componibles (SAC)
  sepEndpoints: string[]; // endpoints SEP descubiertos en stellar.toml
  github: number; // repos/orgs públicos
  audited: boolean; // tiene auditoría publicada
}

/** Superficie de integración: qué puede reusar otro builder de este proyecto. */
export function capabilities(p: Project): IntegrationCaps {
  return {
    contracts: p.contracts.length,
    contractsAlive: p.chain?.contractsAlive ?? 0,
    tokens: p.tokens.length,
    sepEndpoints: p.sep?.sepEndpoints ?? [],
    github: p.links.github?.length ?? 0,
    audited: p.audits.length > 0,
  };
}

/** Score de "integrabilidad" 0-100: cuánto ofrece el proyecto para construir encima. */
export function integrationScore(p: Project): number {
  const c = capabilities(p);
  return Math.min(
    100,
    Math.round(
      Math.min(40, c.contractsAlive * 4 + Math.min(8, c.contracts * 1)) +
        Math.min(20, c.tokens * 4) +
        Math.min(25, c.sepEndpoints.length * 5) +
        Math.min(8, c.github * 2) +
        (c.audited ? 7 : 0),
    ),
  );
}
