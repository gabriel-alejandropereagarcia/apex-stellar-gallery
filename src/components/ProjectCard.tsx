import Link from "next/link";
import type { Project } from "@/lib/types";
import ProjectLogo from "./ProjectLogo";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/project/${project.slug}`}
      className="group flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition hover:border-violet-500/50 hover:bg-zinc-900"
    >
      <div className="flex items-start gap-3">
        <ProjectLogo src={project.logo ?? project.avatar} title={project.title} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-zinc-100 group-hover:text-violet-300">
            {project.title}
          </h3>
          <p className="truncate text-xs text-zinc-500">{project.category}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-zinc-400">{project.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {project.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-400"
          >
            {tag}
          </span>
        ))}
        <span className="flex-1" />
        {project.scf?.total ? (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium text-violet-300">
            SCF
          </span>
        ) : null}
        {project.audits.length ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            Auditado
          </span>
        ) : null}
        {project.sep ? (
          <span
            className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300"
            title={`Publica stellar.toml en ${project.sep.domain}`}
          >
            SEP-1
          </span>
        ) : null}
        {project.contracts.length ? (
          <span
            className="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[11px] text-sky-300"
            title={`${project.contracts.length} contratos Soroban`}
          >
            {project.contracts.length}C
          </span>
        ) : null}
      </div>
    </Link>
  );
}
