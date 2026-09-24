# APEX · Stellar Ecosystem Gallery

Galería indexada del ecosistema Stellar: todos los proyectos en un solo lugar, con filtros
por categoría/tag/región, datos de SCF, auditorías y verificación on-chain vía SEP-1.

## Stack

- **Next.js 16** (App Router, static export-ready) + TypeScript + Tailwind CSS 4
- **Dataset**: [`lumenloop/stellar-ecosystem-db`](https://github.com/lumenloop/stellar-ecosystem-db)
  (812 proyectos en YAML, open data)
- **Enriquecimiento on-chain**: SEP-1 `stellar.toml` crawling por dominio

## Quickstart

```bash
# 1. Clonar el dataset al lado del repo (o setear ECOSYSTEM_DB)
git clone --depth 1 https://github.com/lumenloop/stellar-ecosystem-db ../stellar-ecosystem-db

# 2. Ingesta: YAML -> src/data/projects.json
npm run ingest

# 3. Enriquecimiento SEP-1 (opcional, ~752 dominios, varios minutos)
npm run enrich

# 4. Dev / build
npm run dev
npm run build
```

## Pipeline de datos

```
stellar-ecosystem-db ─┐
  projects/*.yaml     │   scripts/ingest.mjs     src/data/projects.json
  contracts/*.yaml    ┘ ───────────────────────► src/data/meta.json
dominios de projects ── scripts/enrich-toml.mjs ──► src/data/enrichment.json
                      (SEP-1 /.well-known/stellar.toml)
```

- `projects.json`: catálogo normalizado (links absolutos, SCF, auditorías, tokens, contratos)
- `enrichment.json`: por slug — org info, endpoints SEP descubiertos, currencies, validators
- La UI mergea todo en `src/lib/data.ts` (badge `SEP-1 verificado`, sección de integración)

## Roadmap (siguiente nivel de indexación)

1. **Stellar RPC / Horizon** — stats en vivo por contrato (invocaciones, TTL, holders de tokens)
2. **Hubble (BigQuery `crypto-stellar.crypto_stellar`)** — actividad histórica, "proyecto vivo" score
3. **StellarExpert Directory API** — addresses tagged, ratings de assets
4. **Matriz de integración** — "este proyecto expone X endpoint/contrato/SDK" para evitar rebuilds
5. Sync automático (GitHub Action cron → re-ingest + re-deploy)
