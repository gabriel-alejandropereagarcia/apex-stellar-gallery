import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects, ledgerDaysAgo } from "@/lib/data";
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

const H2 = "font-mono text-xs uppercase tracking-widest text-faint";

export default async function ProjectPage({ params }: PageProps<"/project/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const linkEntries = Object.entries(project.links).flatMap(([platform, urls]) =>
    urls.map((url) => ({ platform, url })),
  );
  const hasSurface =
    project.contracts.length > 0 ||
    project.tokens.length > 0 ||
    (project.sep?.sepEndpoints.length ?? 0) > 0 ||
    project.links.github?.length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
      <Link
        href="/"
        className="mt-8 inline-block font-mono text-xs text-faint transition hover:text-accent-ink"
      >
        ← volver a la galería
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <ProjectLogo src={project.logo ?? project.avatar} title={project.title} size={72} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            {project.scf?.total ? (
              <span className="badge b-scf">SCF ${project.scf.total.toLocaleString()}</span>
            ) : null}
            {project.audits.length ? <span className="badge b-live">Auditado</span> : null}
            {project.sep ? <span className="badge b-amber">SEP-1 verificado</span> : null}
            {project.chain && project.chain.contractsAlive > 0 ? (
              <span className="badge b-live">
                <span className="dot" />
                {project.chain.contractsAlive} contratos vivos
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-faint">
            {project.category}
            {project.basedIn ? ` · ${project.basedIn}` : ""}
            {project.parent ? ` · by ${project.parent}` : ""}
          </p>
          {project.otherNames.length ? (
            <p className="mt-1 text-xs text-faint">aka {project.otherNames.join(", ")}</p>
          ) : null}
        </div>
      </header>

      <p className="mt-6 leading-relaxed text-ink2">{project.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <span key={t} className="badge b-tag">
            {t}
          </span>
        ))}
        {project.regions.map((r) => (
          <span key={r} className="badge b-tag text-faint">
            {r}
          </span>
        ))}
      </div>

      {hasSurface ? (
        <section className="mt-8 rounded-xl border border-accent/25 bg-accent-soft/50 p-5">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent-ink">
            Superficie de integración — qué podés reusar
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ink2">
            {project.contracts.length > 0 && (
              <li>
                <span className="text-[var(--b-sky-ink)]">
                  {project.contracts.length} contratos Soroban
                </span>
                <span className="text-muted">
                  {project.chain
                    ? ` — ${project.chain.contractsAlive} vivos en mainnet, llamables via RPC`
                    : " — llamables via RPC"}
                </span>
              </li>
            )}
            {project.tokens.length > 0 && (
              <li>
                <span className="text-[var(--b-amber-ink)]">
                  {project.tokens.map((t) => t.code).filter(Boolean).join(", ")}
                </span>
                <span className="text-muted"> — tokens componibles (SAC) en mainnet</span>
              </li>
            )}
            {project.sep && project.sep.sepEndpoints.length > 0 && (
              <li>
                <span className="text-ink">Endpoints SEP publicados:</span>
                <span className="ml-1 font-mono text-xs text-muted">
                  {project.sep.sepEndpoints.join(", ")}
                </span>
              </li>
            )}
            {project.links.github?.length ? (
              <li>
                <span className="text-ink">Código abierto:</span>
                <a
                  href={project.links.github[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-muted underline decoration-line-strong underline-offset-2 hover:text-accent-ink"
                >
                  {project.links.github[0].replace("https://", "")}
                </a>
              </li>
            ) : null}
            {project.audits.length > 0 && (
              <li className="text-[var(--b-live-ink)]">Auditado — superficie verificada por terceros</li>
            )}
          </ul>
        </section>
      ) : null}

      {linkEntries.length > 0 && (
        <section className="mt-8">
          <h2 className={H2}>Links</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {linkEntries.map(({ platform, url }) => (
              <a
                key={`${platform}-${url}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink2 transition hover:border-accent/50 hover:text-accent-ink"
              >
                {LINK_LABELS[platform] ?? platform} ↗
              </a>
            ))}
          </div>
        </section>
      )}

      {project.contracts.length > 0 && (
        <section className="mt-8">
          <h2 className={H2}>
            Contratos Soroban · {project.contracts.length}
            {project.chain ? (
              <span className="ml-2 text-[var(--b-live-ink)]">
                {project.chain.contractsAlive} vivos
              </span>
            ) : null}
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {project.contracts.map((c) =>
              c.id ? (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <a
                    href={`https://stellar.expert/explorer/public/contract/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-[var(--b-sky-ink)] hover:underline"
                  >
                    {shortId(c.id)}
                  </a>
                  {project.chain?.contractStatus?.[c.id] === "alive" && (
                    <span className="badge b-live !px-1.5 !py-0.5 !text-[10px]">
                      <span className="dot !h-1 !w-1" />
                      vivo
                    </span>
                  )}
                  {project.chain?.contractStatus?.[c.id] === "expired" && (
                    <span className="badge b-red !px-1.5 !py-0.5 !text-[10px]">expirado</span>
                  )}
                  {project.hubble?.contractActivity?.[c.id]?.invocations30d != null && (
                    <span
                      className="font-mono text-[10px] text-accent-ink"
                      title={`${project.hubble.contractActivity[c.id].invocations30d} invocaciones · ${project.hubble.contractActivity[c.id].users30d ?? 0} usuarios · ${project.hubble.contractActivity[c.id].events30d ?? 0} eventos (30d)`}
                    >
                      {project.hubble.contractActivity[c.id].invocations30d} inv/30d
                    </span>
                  )}
                  {project.hubble?.contractActivity?.[c.id]?.lastModifiedLedger != null && (
                    <span className="font-mono text-[10px] text-faint">
                      act. hace{" "}
                      {ledgerDaysAgo(project.hubble.contractActivity[c.id].lastModifiedLedger!)}d
                    </span>
                  )}
                  <span className="text-sm text-muted">{c.label ?? "contrato"}</span>
                  {c.isPool && <span className="badge b-sky !text-[11px]">pool</span>}
                  <span className="flex-1" />
                  {c.tags.map((t) => (
                    <span key={t} className="text-[11px] text-faint">
                      {t}
                    </span>
                  ))}
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {project.chain && (project.chain.tokens.length > 0 || project.chain.contractsChecked > 0) && (
        <section className="mt-8">
          <h2 className={H2}>Actividad on-chain</h2>
          {project.chain.tokens.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left font-mono text-[11px] uppercase text-faint">
                    <th className="px-4 py-2">Token</th>
                    <th className="px-4 py-2 text-right">Trustlines</th>
                    <th className="px-4 py-2 text-right">Pagos</th>
                    <th className="px-4 py-2 text-right">Trades</th>
                    <th className="px-4 py-2 text-right">Transfers 30d</th>
                    <th className="px-4 py-2 text-right">Emisores 30d</th>
                    <th className="px-4 py-2 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {project.chain.tokens.map((t) => (
                    <tr key={t.issuer} className="border-b border-line last:border-0">
                      <td className="px-4 py-2">
                        <a
                          href={`https://stellar.expert/explorer/public/asset/${t.code}-${t.issuer}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[var(--b-amber-ink)] hover:underline"
                        >
                          {t.code}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-ink2">
                        {t.trustlines.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-ink2">
                        {t.payments.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-ink2">
                        {t.trades.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-accent-ink">
                        {project.hubble?.tokens?.[`${t.code}-${t.issuer}`]?.transfers30d?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-accent-ink">
                        {project.hubble?.tokens?.[`${t.code}-${t.issuer}`]?.senders30d?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-ink2">
                        {t.rating ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {project.dir && project.dir.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-faint">StellarExpert directory:</span>
              {project.dir.tags.map((t) => (
                <span key={t} className="badge b-tag !border-line-strong text-ink2">
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {project.sep && (
        <section className="mt-8">
          <h2 className={H2}>Integración on-chain · stellar.toml</h2>
          <div className="mt-3 rounded-xl border border-line p-4">
            <p className="text-sm text-ink2">
              <a
                href={`https://${project.sep.domain}/.well-known/stellar.toml`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[var(--b-amber-ink)] hover:underline"
              >
                {project.sep.domain}
              </a>
              {project.sep.orgName ? (
                <span className="ml-2 text-muted">→ {project.sep.orgName}</span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.sep.sepEndpoints.map((k) => (
                <span key={k} className="badge b-amber font-mono !text-[11px]">
                  {k}
                </span>
              ))}
              {project.sep.currencyCount > 0 && (
                <span className="badge b-tag">{project.sep.currencyCount} assets</span>
              )}
              {project.sep.validators > 0 && (
                <span className="badge b-tag">{project.sep.validators} validators</span>
              )}
            </div>
          </div>
        </section>
      )}

      {project.audits.length > 0 && (
        <section className="mt-8">
          <h2 className={H2}>Auditorías</h2>
          <ul className="mt-3 space-y-2">
            {project.audits.map((a, i) => (
              <li key={i} className="text-sm text-ink2">
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--b-live-ink)] hover:underline"
                  >
                    {a.name} ↗
                  </a>
                ) : (
                  a.name
                )}
                <span className="ml-2 text-xs text-faint">
                  {[a.auditor, a.date?.slice(0, 10)].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.scf && (
        <section className="mt-8">
          <h2 className={H2}>Stellar Community Fund</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.scf.rounds.map((r) => (
              <span
                key={r}
                className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-1.5 font-mono text-xs text-accent-ink"
              >
                Round {r}
              </span>
            ))}
          </div>
          {project.scf.submissions.filter(Boolean).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {project.scf.submissions.filter(Boolean).map((url) => (
                <a
                  key={url}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-faint underline decoration-line-strong underline-offset-2 hover:text-accent-ink"
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
