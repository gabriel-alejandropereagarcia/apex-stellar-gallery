import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StellarScope · Galería del ecosistema Stellar",
  description:
    "Todos los proyectos Stellar indexados y verificados on-chain: contratos Soroban vivos, endpoints SEP, SCF y actividad real via Hubble.",
};

const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||(!t&&matchMedia('(prefers-color-scheme: light)').matches)){document.documentElement.classList.add('light')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <SiteNav />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 font-mono text-xs text-faint sm:px-6">
            <span>StellarScope — ecosistema Stellar indexado y verificado on-chain</span>
            <span className="hidden text-faint sm:inline">· open source, sin fines de lucro</span>
            <span className="flex-1" />
            <span>
              datos: lumenloop db · soroban rpc · stellar.expert · hubble/bigquery
            </span>
            <a
              href="https://x.com/gabriel_apg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition hover:text-accent-ink"
            >
              by @gabriel_apg ↗
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
