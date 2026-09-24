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
    for (const t of Object.values(h.tokens)) s += Math.min(10, Math.log10(t.ops30d + 1) * 2);
    const recent = Object.values(h.contractActivity).filter((a) => ledgerDaysAgo(a.lastModifiedLedger) <= 30).length;
    s += Math.min(10, recent * 3);
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
