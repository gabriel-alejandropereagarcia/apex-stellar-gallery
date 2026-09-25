# · Stellar Ecosystem Gallery

**Todos los proyectos del ecosistema Stellar en un solo lugar — verificados contra la propia blockchain.**

Una galería indexada de **812 proyectos** con búsqueda, filtros por categoría/tag/región, datos del
Stellar Community Fund, auditorías, y algo que ningún directorio del ecosistema tiene: **señal de
actividad on-chain real** (contratos vivos, invocaciones, eventos, transfers) y una **matriz de
integración** que muestra qué podés reusar de cada proyecto antes de construir.

---

## El problema que resuelve

Construir en Stellar hoy significa responder tres preguntas que ninguna fuente única responde:

1. **"¿Ya existe?"** — El ecosistema está fragmentado: stellar.org/ecosystem, listas de SCF,
   Discord, Twitter. Descubrir proyectos similares cuesta días → la gente reconstruye lo que ya existe.
2. **"¿Sigue vivo?"** — Los directorios listan proyectos, pero no dicen si están activos.
   Un proyecto con landing linda puede tener sus contratos expirados desde 2024.
3. **"¿Con qué me puedo integrar?"** — Lo valioso no es la lista de proyectos, es saber
   **qué exponen**: contratos Soroban llamables, endpoints SEP (ramps, auth, pagos),
   tokens componibles, repos públicos.

APEX responde las tres con datos verificables, no con curaduría manual.

## Qué hace

### Galería (`/`)
- 812 proyectos con búsqueda full-text y filtros: categoría, tag, región, SCF, auditados, on-chain, SEP-1, **"Activos ahora"** (señal on-chain verificada)
- Sorts: alfabético, actividad on-chain, integrabilidad, fondos SCF, contratos
- Badges por proyecto: `SCF` · `Auditado` · `SEP-1` · `{vivos}/{total}C` · `live`

### Detalle (`/project/[slug]` — 812 páginas SSG)
- **Superficie de integración**: qué podés reusar (contratos llamables, tokens SAC, endpoints SEP, GitHub)
- Contratos Soroban con estado **vivo/expirado** + **invocaciones y usuarios únicos en 30d**
- Tokens mainnet: trustlines, pagos, trades, **transfers 30d, emisores únicos 30d**, rating
- Auditorías, rondas SCF con links a submissions, todos los links sociales

### Matriz de integración (`/matrix`)
Tabla proyectos × capacidades: contratos vivos, tokens SAC, endpoints SEP descubiertos,
GitHub, auditorías — con score de "integrabilidad" y filtros por capacidad.
*La respuesta directa a "¿con qué me integro antes de construir?"*

### Stats (`/stats`)
Ecosistema en números: distribución por categorías, score de actividad, top tags,
regiones, rondas SCF, total distribuido por el fondo.

## Lo que lo hace diferente (verificación on-chain)

| Directorio | Lista proyectos | Verifica vida | Muestra integración |
|---|---|---|---|
| stellar.org/ecosystem | ~522 | ✗ | ✗ |
| LumenLoop | ~756 | ✗ | parcial |
| **APEX** | **812** | **✓ RPC + BigQuery** | **✓ matriz completa** |

- **Soroban RPC**: `getLedgerEntries` sobre cada contrato → vivo si `liveUntilLedgerSeq ≥ ledger actual` (369/392 vivos)
- **Hubble/BigQuery** (`crypto-stellar.crypto_stellar`): invocaciones, usuarios únicos y eventos por contrato en 30d; transfers y emisores por token
- **SEP-1 crawl**: `/.well-known/stellar.toml` en 752 dominios → endpoints SEP + org info (65 proyectos verificados)
- **StellarExpert API**: trustlines, pagos, trades, rating por asset + directory tags

## Stack

Next.js 16 (App Router, SSG puro) · TypeScript · Tailwind 4 · @stellar/stellar-sdk ·
@google-cloud/bigquery · smol-toml · yaml

## Pipeline de datos

```
lumenloop/stellar-ecosystem-db ─┐
  projects/*.yaml (812)          ├─► npm run ingest ──► src/data/projects.json
  contracts/*.yaml  (392 ctr.)   ┘                     src/data/meta.json

dominios → /.well-known/stellar.toml ─► npm run enrich ──► src/data/enrichment.json
StellarExpert API + Soroban RPC     ──► npm run enrich:chain ──► src/data/chain.json
StellarExpert Directory             ──► npm run enrich:dir  ──► src/data/directory.json
Hubble (BigQuery público)           ──► npm run enrich:hubble ─► src/data/hubble.json

                    todo mergeado en src/lib/data.ts
```

## Quickstart

```bash
git clone https://github.com/gabriel-alejandropereagarcia/apex-stellar-gallery
cd apex-stellar-gallery && npm ci

# dataset al lado del repo (o ECOSYSTEM_DB=/ruta)
git clone --depth 1 https://github.com/lumenloop/stellar-ecosystem-db ../stellar-ecosystem-db

npm run ingest          # YAML -> JSON
npm run enrich          # SEP-1 (varios minutos, ~750 dominios)
npm run enrich:chain    # RPC + StellarExpert
npm run enrich:dir      # directory tags
npm run enrich:hubble   # histórico 30d (requiere key GCP)

npm run dev             # localhost:3000
npm run build           # 818 páginas estáticas
```

## Enriquecimiento Hubble (BigQuery)

Dataset público `crypto-stellar.crypto_stellar` — el cómputo lo paga tu proyecto GCP
(~170 GB ≈ **$0** dentro del tier gratis de 1 TB/mes).

1. GCP Console → habilitar **BigQuery Unified API**
2. IAM → Service Account `apex-hubble` → rol **BigQuery Job User** → key JSON
3. `secrets/gcp-key.json` (gitignored) — o `gcloud auth application-default login` + `GOOGLE_CLOUD_PROJECT`
4. `npm run enrich:hubble` — incluye **dry-run** (`--dryrun`) con estimado de GB y guard de costo (aborta >250 GB)

## Scores

- **activityScore** (0-100): contratos vivos, trustlines/pagos/trades de tokens,
  transfers+senders 30d (Hubble), invocaciones recientes, SEP-1, auditorías, GitHub
- **integrationScore** (0-100): contratos llamables, tokens SAC, endpoints SEP, repos, auditorías
- **isLive**: tiene contratos vivos o tokens con actividad ahora mismo

## Sync automático

`.github/workflows/sync.yml` — cron semanal: re-ingest del dataset + todos los enrichers +
commit del snapshot. `enrich:hubble` se activa si configurás el secret **`GCP_SA_KEY`**
(Settings → Secrets → Actions) con el contenido del JSON de la service account.

## Roadmap

- [ ] Deploy público (Vercel — repo listo, build estático)
- [ ] Búsqueda semántica (embeddings sobre descripciones)
- [ ] GitHub activity signal (commits recientes por repo)
- [ ] "Duplicados probables" — detectar proyectos que solapan dominio funcional
- [ ] API pública del catálogo (`/api/projects`)

## Datos y créditos

- Catálogo base: [`lumenloop/stellar-ecosystem-db`](https://github.com/lumenloop/stellar-ecosystem-db) (open data)
- On-chain: Soroban RPC público, StellarExpert Open API (MIT), Hubble (SDF + BigQuery)
- Proponer correcciones: PR al repo o upstream a LumenLoop
- Mantenido por [@gabriel_apg](https://x.com/gabriel_apg) — proyecto comunitario, sin fines de lucro
