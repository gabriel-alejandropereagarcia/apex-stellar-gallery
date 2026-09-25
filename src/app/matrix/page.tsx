import { projects, capabilities, integrationScore } from "@/lib/data";
import MatrixView from "@/components/MatrixView";

export const metadata = { title: "StellarScope · Matriz de integración" };

export default function MatrixPage() {
  const rows = projects
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      caps: capabilities(p),
      score: integrationScore(p),
    }))
    .filter((r) => r.score > 0);

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <div className="glow-orb right-0 top-8 h-52 w-52" aria-hidden />
      <header className="mt-10">
        <h1 className="gradient-title text-3xl font-bold tracking-tight">Matriz de integración</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Qué expone cada proyecto para construir encima: contratos Soroban llamables, tokens
          componibles (SAC), endpoints SEP publicados en <code className="text-accent-ink">stellar.toml</code>,
          repos públicos y auditorías. Antes de construir algo, mirá si ya existe y podés integrarte.
        </p>
      </header>

      <div className="mt-8">
        <MatrixView rows={rows} />
      </div>
    </main>
  );
}
