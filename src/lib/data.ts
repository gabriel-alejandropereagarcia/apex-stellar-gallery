import projectsJson from "@/data/projects.json";
import metaJson from "@/data/meta.json";
import enrichmentJson from "@/data/enrichment.json";
import type { DatasetMeta, Project, SepInfo } from "./types";

const enrichment = enrichmentJson as Record<string, SepInfo>;

export const projects = (projectsJson as Project[]).map((p) => ({
  ...p,
  sep: enrichment[p.slug],
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
