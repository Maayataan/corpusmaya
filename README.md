# maayataan

**Plataforma abierta para construir un corpus lingüístico de maya yucateco.**

Maayataan recolecta texto, traducciones y audio, permite revisarlos antes de su publicación y mantiene los datos bajo control comunitario. Las contribuciones públicas no requieren una cuenta; la revisión administrativa está protegida por Cloudflare Access.

## Arquitectura

- **Interfaz:** Astro 7 + React 19
- **API:** Cloudflare Worker
- **Datos:** Cloudflare D1
- **Audio:** bucket privado de Cloudflare R2
- **Protección pública:** Turnstile + Rate Limiting
- **Administración:** Cloudflare Access
- **Hosting:** Workers Static Assets

El Worker sirve el sitio y atiende `/api/*`. Los audios pendientes permanecen privados; sólo un audio aprobado puede consultarse desde la ruta pública. El esquema versionado vive en [`migrations/`](./migrations/).

## Desarrollo local

```bash
git clone https://github.com/nosoypoot/maayataan.git
cd maayataan
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Astro se abre en `http://localhost:4321` y reenvía `/api` al Worker local en el puerto `8787`. Las claves de prueba oficiales de Turnstile se usan únicamente en desarrollo.

Comandos útiles:

```bash
npm run check             # Astro/TypeScript + Worker TypeScript
npm run build             # build de producción
npm run db:verify:local   # verifica el esquema D1 local
npm run preview           # sitio compilado + Worker local
npm run deploy            # build, migraciones remotas y deploy
```

## Configuración de Cloudflare

`wrangler.toml` declara D1, R2, Static Assets, Rate Limiting y las variables públicas. Los secretos nunca se guardan en Git:

```bash
npx wrangler secret put TURNSTILE_SECRET
```

`/admin*` y `/api/admin*` están protegidos por la aplicación self-hosted `Maayataan Admin` de Cloudflare Access. El Worker valida además el JWT de Access mediante `TEAM_DOMAIN` y `POLICY_AUD`; en producción falla de forma segura si faltan esas variables.

## Migración desde Supabase

La aplicación ya no depende del SDK ni de servicios de Supabase. Si conservas exportaciones CSV de las tablas anteriores, conviértelas y cárgalas así:

```bash
python3 scripts/import_supabase.py \
  --contributions contributions.csv \
  --speakers speaker_interests.csv \
  --allies ally_interests.csv \
  --output d1-import.sql

npx wrangler d1 execute maayataan-db --remote --file d1-import.sql
```

La migración inicial desde el proyecto Supabase `Mayataan` se completó en julio de 2026. El importador se conserva para auditoría, restauraciones y futuras migraciones; los archivos exportados pueden contener datos personales y nunca deben guardarse en Git.

## Exportar el corpus

El endpoint administrativo exporta únicamente contribuciones aprobadas:

```bash
MAAYATAAN_URL=https://maayataan.org python3 scripts/export.py --format jsonl
```

Para automatización, define `CF_ACCESS_CLIENT_ID` y `CF_ACCESS_CLIENT_SECRET` con un service token de Access. CSV y JSONL funcionan sin dependencias adicionales; Parquet requiere `pyarrow`.

## Estructura

```text
src/                 interfaz Astro/React
worker/src/          API del Cloudflare Worker
migrations/          migraciones D1
scripts/             importación y exportación
public/              assets y cabeceras de seguridad
wrangler.toml        infraestructura del Worker
```

## Principios

- Los datos son de la comunidad.
- El consentimiento, la licencia y las etiquetas de gobernanza son campos distintos.
- Las contribuciones anónimas deben seguir siendo accesibles desde teléfonos modestos.
- Ningún audio pendiente se publica desde R2.

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md), [DESIGN.md](./DESIGN.md) y [TODOS.md](./TODOS.md).

## License

Código bajo licencia MIT. La licencia aplicable a cada contribución del corpus se registra por separado.

---

## English

Maayataan is an open platform for collecting, reviewing, and publishing Yucatec Maya text, translations, and audio. It runs on Astro/React and Cloudflare Workers, D1, R2, Turnstile, and Access. Public contributions do not require an account; administrative review is protected by Access.

Follow the local setup above. The source Supabase project is no longer a runtime dependency. Legacy CSV exports can be converted with `scripts/import_supabase.py`, and approved data can be downloaded with `scripts/export.py`.
