import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/data";
import ProjectLogo from "@/components/ProjectLogo";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

const LINK_LABELS: Record<string, string> = {
  website: "Website",
  github: "GitHub",
  x: "X / Twitter",
  discord: "Discord",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  blog: "Blog",
  instagram: "Instagram",
  reddit: "Reddit",
  tiktok: "TikTok",
  linktree: "Linktree",
};

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-6)}`;

export default async function ProjectPage({ params }: PageProps<"/project/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const linkEntries = Object.entries(project.links).flatMap(([platform, urls]) =>
    urls.map((url) => ({ platform, url })),
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
      <Link
        href="/"
        className="mt-8 inline-block font-mono text-xs text-zinc-500 transition hover:text-violet-300"
      >
        ← volver a la galería
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <ProjectLogo src={project.logo ?? project.avatar} title={project.title} size={72} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            {project.scf?.total ? (
              <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300">
                SCF ${project.scf.total.toLocaleString()}
              </span>
            ) : null}
            {project.audits.length ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                Auditado
              </span>
            ) : null}
            {project.sep ? (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
                SEP-1 verificado
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {project.category}
            {project.basedIn ? ` · ${project.basedIn}` : ""}
            {project.parent ? ` · by ${project.parent}` : ""}
          </p>
          {project.otherNames.length ? (
            <p className="mt-1 text-xs text-zinc-600">aka {project.otherNames.join(", ")}</p>
          ) : null}
        </div>
      </header>

      <p className="mt-6 leading-relaxed text-zinc-300">{project.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-400"
          >
            {t}
          </span>
        ))}
        {project.regions.map((r) => (
          <span
            key={r}
            className="rounded-full border border-zinc-800/60 px-2.5 py-0.5 text-xs text-zinc-500"
          >
            {r}
          </span>
        ))}
      </div>

      {linkEntries.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">Links</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {linkEntries.map(({ platform, url }) => (
              <a
                key={`${platform}-${url}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-violet-500/50 hover:text-violet-300"
              >
                {LINK_LABELS[platform] ?? platform} ↗
              </a>
            ))}
          </div>
        </section>
      )}

      {project.contracts.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            Contratos Soroban · {project.contracts.length}
          </h2>
          <ul className="mt-3 divide-y divide-zinc-800/60 rounded-xl border border-zinc-800/80">
            {project.contracts.map((c) =>
              c.id ? (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <a
                    href={`https://stellar.expert/explorer/public/contract/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-sky-300 hover:underline"
                  >
                    {shortId(c.id)}
                  </a>
                  <span className="text-sm text-zinc-400">{c.label ?? "contrato"}</span>
                  {c.isPool && (
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] text-sky-300">
                      pool
                    </span>
                  )}
                  <span className="flex-1" />
                  {c.tags.map((t) => (
                    <span key={t} className="text-[11px] text-zinc-600">
                      {t}
                    </span>
                  ))}
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {project.tokens.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            Tokens en mainnet
          </h2>
          <ul className="mt-3 space-y-1.5">
            {project.tokens.map((t) => (
              <li key={`${t.code}-${t.issuer}`} className="text-sm">
                {t.issuer ? (
                  <a
                    href={`https://stellar.expert/explorer/public/asset/${t.code}-${t.issuer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-amber-300 hover:underline"
                  >
                    {t.code}
                  </a>
                ) : (
                  <span className="font-mono text-amber-300">{t.code}</span>
                )}
                <span className="ml-2 font-mono text-xs text-zinc-600">
                  {t.issuer ? shortId(t.issuer) : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.sep && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            Integración on-chain · stellar.toml
          </h2>
          <div className="mt-3 rounded-xl border border-zinc-800/80 p-4">
            <p className="text-sm text-zinc-300">
              <a
                href={`https://${project.sep.domain}/.well-known/stellar.toml`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-amber-300 hover:underline"
              >
                {project.sep.domain}
              </a>
              {project.sep.orgName ? (
                <span className="ml-2 text-zinc-400">→ {project.sep.orgName}</span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.sep.sepEndpoints.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] text-amber-200"
                >
                  {k}
                </span>
              ))}
              {project.sep.currencyCount > 0 && (
                <span className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400">
                  {project.sep.currencyCount} assets
                </span>
              )}
              {project.sep.validators > 0 && (
                <span className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400">
                  {project.sep.validators} validators
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {project.audits.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">Auditorías</h2>
          <ul className="mt-3 space-y-2">
            {project.audits.map((a, i) => (
              <li key={i} className="text-sm text-zinc-300">
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-300 hover:underline"
                  >
                    {a.name} ↗
                  </a>
                ) : (
                  a.name
                )}
                <span className="ml-2 text-xs text-zinc-500">
                  {[a.auditor, a.date?.slice(0, 10)].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.scf && (
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            Stellar Community Fund
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.scf.rounds.map((r) => (
              <span
                key={r}
                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 font-mono text-xs text-violet-200"
              >
                Round {r}
              </span>
            ))}
          </div>
          {project.scf.submissions.filter(Boolean).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {project.scf.submissions.filter(Boolean).map((url) => (
                <a
                  key={url}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 underline decoration-zinc-700 hover:text-violet-300"
                >
                  submission ↗
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
