import { projects, meta, categories, allTags, allRegions } from "@/lib/data";
import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
      {/* glow ambiental */}
      <div className="glow-orb left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2" aria-hidden />
      <div className="glow-orb -left-20 top-40 h-48 w-48 opacity-60" aria-hidden />

      <header className="relative border-b border-line pb-10 pt-14">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-ink">
          ecosistema stellar · indexado + verificado on-chain
        </p>
        <h1 className="gradient-title mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Galería de proyectos Stellar
        </h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted">
          Todo el ecosistema en un solo lugar, con señal de vida real desde la blockchain.
          Filtrá por categoría, descubrí qué ya existe e integrate con soluciones previas
          en vez de reinventarlas.
        </p>
        <dl className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
              className="rounded-xl border border-line bg-card px-4 py-3"
            >
              <dt className="text-xs text-faint">{label}</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-accent-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Gallery projects={projects} categories={categories} tags={allTags} regions={allRegions} />
    </main>
  );
}
