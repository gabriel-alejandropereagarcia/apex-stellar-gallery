import Link from "next/link";
import { projects, meta, categories, activityScore, isLive, chainMeta } from "@/lib/data";
import type { Project } from "@/lib/types";

function Bar({ label, value, max, hint }: { label: string; value: number; max: number; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 truncate text-sm text-zinc-400" title={hint ?? label}>
        {label}
      </span>
      <div className="h-5 flex-1 overflow-hidden rounded bg-zinc-900">
        <div
          className="h-full rounded bg-gradient-to-r from-violet-600 to-violet-400"
          style={{ width: `${max ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="w-14 text-right font-mono text-sm text-zinc-300">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">{title}</h2>
      <div className="mt-4 space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
        {children}
      </div>
    </section>
  );
}

export default function StatsPage() {
  const tagCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  const scfRounds = new Map<string, number>();
  const activityBuckets = [0, 0, 0, 0, 0];
  let live = 0;
  let contractsAlive = 0;
  let contractsChecked = 0;
  let scfTotal = 0;

  for (const p of projects) {
    p.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1));
    p.regions.forEach((r) => regionCounts.set(r, (regionCounts.get(r) ?? 0) + 1));
    p.scf?.rounds.forEach((r) => scfRounds.set(r, (scfRounds.get(r) ?? 0) + 1));
    scfTotal += p.scf?.total ?? 0;
    const s = activityScore(p as Project);
    activityBuckets[Math.min(4, Math.floor(s / 20))]++;
    if (isLive(p as Project)) live++;
    contractsAlive += p.chain?.contractsAlive ?? 0;
    contractsChecked += p.chain?.contractsChecked ?? 0;
  }

  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  const topTags = top(tagCounts, 20);
  const topRegions = top(regionCounts, 12);
  const topRounds = [...scfRounds.entries()].sort((a, b) => {
    const na = Number(a[0]), nb = Number(b[0]);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a[0].localeCompare(b[0]);
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
      <Link
        href="/"
        className="mt-8 inline-block font-mono text-xs text-zinc-500 transition hover:text-violet-300"
      >
        ← volver a la galería
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight">Ecosistema en números</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Snapshot del dataset {meta.source} · ledger {chainMeta.ledger.toLocaleString()} ·{" "}
          {new Date(chainMeta.generatedAt).toLocaleDateString("es")}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["SCF total distribuido", `$${(scfTotal / 1e6).toFixed(1)}M`],
          ["Proyectos vivos on-chain", live],
          ["Contratos vivos", `${contractsAlive}/${contractsChecked}`],
          ["Con stellar.toml", projects.filter((p) => p.sep).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="mt-1 font-mono text-xl font-semibold text-violet-300">{value}</dd>
          </div>
        ))}
      </div>

      <Section title="Proyectos por categoría">
        {categories.map(([name, count]) => (
          <Bar key={name} label={name} value={count} max={categories[0][1]} />
        ))}
      </Section>

      <Section title="Actividad on-chain (score)">
        {["0–20", "21–40", "41–60", "61–80", "81–100"].map((b, i) => (
          <Bar key={b} label={b} value={activityBuckets[i]} max={Math.max(...activityBuckets)} />
        ))}
      </Section>

      <Section title="Top 20 tags">
        {topTags.map(([t, n]) => (
          <Bar key={t} label={t} value={n} max={topTags[0][1]} />
        ))}
      </Section>

      <Section title="Regiones de operación">
        {topRegions.map(([r, n]) => (
          <Bar key={r} label={r} value={n} max={topRegions[0][1]} />
        ))}
      </Section>

      <Section title="Rondas SCF (proyectos premiados por ronda)">
        {topRounds.map(([r, n]) => (
          <Bar key={r} label={`Round ${r}`} value={n} max={Math.max(...topRounds.map(([, v]) => v))} />
        ))}
      </Section>
    </main>
  );
}
