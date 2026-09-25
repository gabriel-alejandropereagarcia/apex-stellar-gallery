import Link from "next/link";
import type { Project } from "@/lib/types";
import ProjectLogo from "./ProjectLogo";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/project/${project.slug}`}
      className="card-hover group flex flex-col rounded-xl border border-line bg-card p-4 hover:border-accent/50"
    >
      <div className="flex items-start gap-3">
        <ProjectLogo src={project.logo ?? project.avatar} title={project.title} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink group-hover:text-accent-ink">
            {project.title}
          </h3>
          <p className="truncate text-xs text-faint">{project.category}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted">{project.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {project.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="badge b-tag">
            {tag}
          </span>
        ))}
        <span className="flex-1" />
        {project.scf?.total ? <span className="badge b-scf">SCF</span> : null}
        {project.audits.length ? <span className="badge b-live">Auditado</span> : null}
        {project.sep ? (
          <span className="badge b-amber" title={`stellar.toml en ${project.sep.domain}`}>
            SEP-1
          </span>
        ) : null}
        {project.chain && project.chain.contractsAlive > 0 ? (
          <span
            className="badge b-live"
            title={`${project.chain.contractsAlive}/${project.chain.contractsChecked} contratos vivos en mainnet`}
          >
            <span className="dot" />
            live
          </span>
        ) : null}
        {project.contracts.length ? (
          <span
            className="badge b-sky"
            title={`${project.contracts.length} contratos Soroban`}
          >
            {project.chain
              ? `${project.chain.contractsAlive}/${project.contracts.length}C`
              : `${project.contracts.length}C`}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
