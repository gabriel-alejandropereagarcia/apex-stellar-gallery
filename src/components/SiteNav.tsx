import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-mono text-sm font-semibold tracking-tight text-ink">
            Stellar<span className="text-accent-ink">Scope</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          {[
            ["Galería", "/"],
            ["Matriz", "/matrix"],
            ["Stats", "/stats"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-card hover:text-ink"
            >
              {label}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px bg-line" />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
