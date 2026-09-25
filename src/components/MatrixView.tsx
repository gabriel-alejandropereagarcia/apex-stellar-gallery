"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { IntegrationCaps } from "@/lib/data";

export interface MatrixRow {
  slug: string;
  title: string;
  category: string;
  caps: IntegrationCaps;
  score: number;
}

const CAP_FILTERS: { id: keyof IntegrationCaps | "sep"; label: string }[] = [
  { id: "contracts", label: "Contratos" },
  { id: "tokens", label: "Tokens" },
  { id: "sep", label: "Endpoints SEP" },
  { id: "github", label: "GitHub" },
  { id: "audited", label: "Auditado" },
];

const has = (caps: IntegrationCaps, id: string) =>
  id === "sep" ? caps.sepEndpoints.length > 0 : Boolean(caps[id as keyof IntegrationCaps]);

const fmt = (n: number) => (n > 0 ? String(n) : "·");

export default function MatrixView({ rows }: { rows: MatrixRow[] }) {
  const [query, setQuery] = useState("");
  const [cap, setCap] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (cap && !has(r.caps, cap)) return false;
        if (r.score < minScore) return false;
        if (!q) return true;
        return `${r.title} ${r.category}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.score - a.score);
  }, [rows, query, cap, minScore]);

  const cell = "px-3 py-2 text-center font-mono text-sm border-l border-line first:border-0";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar proyecto…"
          aria-label="Buscar en la matriz"
          className="w-full rounded-lg border border-line bg-field px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent/60 sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          {CAP_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCap(cap === f.id ? null : f.id)}
              aria-pressed={cap === f.id}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                cap === f.id
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line text-muted hover:border-line-strong hover:text-ink2"
              }`}
            >
              {f.label}
            </button>
          ))}
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-lg border border-line bg-field px-3 py-1.5 text-xs text-ink2 outline-none"
            aria-label="Score mínimo"
          >
            <option value={0}>Score ≥ 0</option>
            <option value={20}>Score ≥ 20</option>
            <option value={40}>Score ≥ 40</option>
            <option value={60}>Score ≥ 60</option>
          </select>
        </div>
      </div>

      <p className="mt-4 font-mono text-xs text-faint">
        {filtered.length} proyectos con superficie de integración
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="sticky top-14 bg-surface">
            <tr className="border-b border-line text-left font-mono text-[11px] uppercase text-faint">
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-3 py-3 text-center" title="Contratos Soroban (vivos/total)">
                ◈ Contratos
              </th>
              <th className="px-3 py-3 text-center" title="Tokens mainnet (SAC-componibles)">
                Tokens
              </th>
              <th className="px-3 py-3 text-center" title="Endpoints SEP en stellar.toml">
                SEP
              </th>
              <th className="px-3 py-3 text-center">GitHub</th>
              <th className="px-3 py-3 text-center">Audit</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.slug}
                className="border-b border-line transition last:border-0 hover:bg-card"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/project/${r.slug}`}
                    className="font-medium text-ink hover:text-accent-ink"
                  >
                    {r.title}
                  </Link>
                  <span className="ml-2 text-xs text-faint">{r.category}</span>
                </td>
                <td className={cell}>
                  {r.caps.contracts > 0 ? (
                    <span className={r.caps.contractsAlive > 0 ? "text-[var(--b-live-ink)]" : "text-muted"}>
                      {r.caps.contractsAlive}/{r.caps.contracts}
                    </span>
                  ) : (
                    "·"
                  )}
                </td>
                <td className={`${cell} text-[var(--b-amber-ink)]`}>{fmt(r.caps.tokens)}</td>
                <td className={`${cell} text-[var(--b-sky-ink)]`}>
                  {r.caps.sepEndpoints.length > 0 ? (
                    <span title={r.caps.sepEndpoints.join(", ")}>{r.caps.sepEndpoints.length}</span>
                  ) : (
                    "·"
                  )}
                </td>
                <td className={`${cell} text-ink2`}>{fmt(r.caps.github)}</td>
                <td className={cell}>
                  {r.caps.audited ? <span className="text-[var(--b-live-ink)]">✓</span> : "·"}
                </td>
                <td className="px-4 py-2 text-right font-mono text-sm text-accent-ink">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
