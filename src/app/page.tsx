import { projects, meta, categories, allTags, allRegions } from "@/lib/data";
import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
      <header className="border-b border-zinc-800/80 pb-10 pt-12">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-violet-400">
            apex · stellar ecosystem
          </p>
          <a
            href="/stats"
            className="rounded-lg border border-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-400 transition hover:border-violet-500/50 hover:text-violet-300"
          >
            stats →
          </a>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Galería de proyectos Stellar
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Todo el ecosistema indexado en un solo lugar. Filtra por categoría, descubre qué ya
          existe e intégrate con soluciones previas en vez de reinventarlas.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Proyectos", meta.totals.projects],
            ["Categorías", categories.length],
            ["Fondos SCF", meta.totals.scfFunded],
            ["Auditados", meta.totals.audited],
            ["Contratos on-chain", meta.totals.contracts],
            ["Tags", meta.totals.tags],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3"
            >
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-violet-300">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Gallery projects={projects} categories={categories} tags={allTags} regions={allRegions} />
    </main>
  );
}
