"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import ProjectCard from "./ProjectCard";

type SortKey = "name" | "scf" | "contracts";

const SORTERS: Record<SortKey, (a: Project, b: Project) => number> = {
  name: (a, b) => a.title.localeCompare(b.title),
  scf: (a, b) => (b.scf?.total ?? 0) - (a.scf?.total ?? 0),
  contracts: (a, b) => b.contracts.length - a.contracts.length,
};

export default function Gallery({
  projects,
  categories,
  tags,
  regions,
}: {
  projects: Project[];
  categories: [string, number][];
  tags: string[];
  regions: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState("");
  const [onlyScf, setOnlyScf] = useState(false);
  const [onlyAudited, setOnlyAudited] = useState(false);
  const [onlyOnchain, setOnlyOnchain] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (category && p.category !== category) return false;
        if (tag && !p.tags.includes(tag)) return false;
        if (region && !p.regions.includes(region)) return false;
        if (onlyScf && !p.scf?.total) return false;
        if (onlyAudited && !p.audits.length) return false;
        if (onlyOnchain && !p.contracts.length && !p.tokens.length) return false;
        if (!q) return true;
        const hay = [p.title, p.description, p.category, p.parent ?? "", ...p.tags, ...p.otherNames]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort(SORTERS[sort]);
  }, [projects, query, category, tag, region, onlyScf, onlyAudited, onlyOnchain, sort]);

  const selectCls =
    "rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500/60";

  return (
    <section className="pt-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar proyecto, tag, descripción…"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-violet-500/60 lg:max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectCls}>
            <option value="">Tag: todos</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls}>
            <option value="">Región: todas</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectCls}
          >
            <option value="name">A–Z</option>
            <option value="scf">Fondos SCF</option>
            <option value="contracts">Contratos</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            category === null
              ? "border-violet-500 bg-violet-500/15 text-violet-200"
              : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          Todas
        </button>
        {categories.map(([name, count]) => (
          <button
            key={name}
            onClick={() => setCategory(category === name ? null : name)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              category === name
                ? "border-violet-500 bg-violet-500/15 text-violet-200"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {name} <span className="text-zinc-600">{count}</span>
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-zinc-800 sm:block" />
        {[
          ["SCF", onlyScf, setOnlyScf],
          ["Auditados", onlyAudited, setOnlyAudited],
          ["On-chain", onlyOnchain, setOnlyOnchain],
        ].map(([label, active, setter]) => (
          <button
            key={label as string}
            onClick={() => (setter as (v: boolean) => void)(!(active as boolean))}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              active
                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {label as string}
          </button>
        ))}
      </div>

      <p className="mt-6 font-mono text-xs text-zinc-500">
        {filtered.length} / {projects.length} proyectos
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>

      {!filtered.length && (
        <p className="mt-16 text-center text-zinc-500">
          Sin resultados — ajusta los filtros o la búsqueda.
        </p>
      )}
    </section>
  );
}
