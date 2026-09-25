"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { activityScore, integrationScore, isLive } from "@/lib/data";
import ProjectCard from "./ProjectCard";

type SortKey = "name" | "scf" | "contracts" | "activity" | "integrate";

const SORTERS: Record<SortKey, (a: Project, b: Project) => number> = {
  name: (a, b) => a.title.localeCompare(b.title),
  scf: (a, b) => (b.scf?.total ?? 0) - (a.scf?.total ?? 0),
  contracts: (a, b) => b.contracts.length - a.contracts.length,
  activity: (a, b) => activityScore(b) - activityScore(a),
  integrate: (a, b) => integrationScore(b) - integrationScore(a),
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
  const [onlyLive, setOnlyLive] = useState(false);
  const [onlySep, setOnlySep] = useState(false);
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
        if (onlyLive && !isLive(p)) return false;
        if (onlySep && !p.sep) return false;
        if (!q) return true;
        const hay = [p.title, p.description, p.category, p.parent ?? "", ...p.tags, ...p.otherNames]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort(SORTERS[sort]);
  }, [projects, query, category, tag, region, onlyScf, onlyAudited, onlyOnchain, onlyLive, onlySep, sort]);

  const selectCls =
    "rounded-lg border border-line bg-field px-3 py-2 text-sm text-ink2 outline-none transition focus:border-accent/60";

  const chipCls = (active: boolean, accent = false) =>
    `rounded-full border px-3 py-1 text-xs transition ${
      active
        ? accent
          ? "border-accent/60 bg-accent-soft text-accent-ink"
          : "border-accent bg-accent-soft text-accent-ink"
        : "border-line text-muted hover:border-line-strong hover:text-ink2"
    }`;

  return (
    <section className="relative pt-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar proyecto, tag, descripción…"
          aria-label="Buscar proyectos"
          className="w-full rounded-lg border border-line bg-field px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent/60 lg:max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectCls} aria-label="Filtrar por tag">
            <option value="">Tag: todos</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls} aria-label="Filtrar por región">
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
            aria-label="Ordenar"
          >
            <option value="name">A–Z</option>
            <option value="activity">Actividad on-chain</option>
            <option value="integrate">Integrabilidad</option>
            <option value="scf">Fondos SCF</option>
            <option value="contracts">Contratos</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setCategory(null)} className={chipCls(category === null)}>
          Todas
        </button>
        {categories.map(([name, count]) => (
          <button
            key={name}
            onClick={() => setCategory(category === name ? null : name)}
            className={chipCls(category === name)}
            aria-pressed={category === name}
          >
            {name} <span className="text-faint">{count}</span>
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
        {(
          [
            ["SCF", onlyScf, setOnlyScf],
            ["Auditados", onlyAudited, setOnlyAudited],
            ["On-chain", onlyOnchain, setOnlyOnchain],
            ["Activos ahora", onlyLive, setOnlyLive],
            ["SEP-1", onlySep, setOnlySep],
          ] as const
        ).map(([label, active, setter]) => (
          <button
            key={label}
            onClick={() => setter(!active)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              active
                ? "border-transparent bg-[var(--b-live-bg)] text-[var(--b-live-ink)]"
                : "border-line text-muted hover:border-line-strong hover:text-ink2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-6 font-mono text-xs text-faint">
        {filtered.length} / {projects.length} proyectos
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>

      {!filtered.length && (
        <p className="mt-16 text-center text-muted">
          Sin resultados — ajustá los filtros o la búsqueda.
        </p>
      )}
    </section>
  );
}
