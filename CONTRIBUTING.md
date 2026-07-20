# Contribuir a maayataan

Gracias por ayudar a preservar y digitalizar el maya yucateco. Antes de cambiar el producto, considera la soberanía de los datos lingüísticos y la accesibilidad para hablantes con dispositivos o conectividad limitados.

## Preparar el proyecto

```bash
git clone https://github.com/nosoypoot/maayataan.git
cd maayataan
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

No necesitas una cuenta de Cloudflare para el desarrollo normal: Wrangler ejecuta D1 y R2 localmente y el proyecto usa las claves de prueba oficiales de Turnstile. Astro corre en `http://localhost:4321` y el Worker en `http://localhost:8787`.

## Antes de enviar un PR

```bash
npm run check
npm run build
```

- Lee `DESIGN.md` antes de hacer cambios visuales.
- Coloca los componentes y páginas en `src/`; la API vive en `worker/src/`.
- Añade cambios de esquema como una nueva migración, nunca editando una migración ya desplegada.
- No guardes `.env`, `.dev.vars`, tokens, secretos de Turnstile ni credenciales de Access.
- Conserva separados consentimiento, licencia y gobernanza del corpus.
- Prueba que los audios pendientes no sean accesibles desde `/api/audio/*`.

Usamos Conventional Commits, por ejemplo `feat(corpus): add dialect filter` o `fix(api): reject oversized audio`.

Para cambios grandes, abre primero un issue. Los reportes de errores deben incluir pasos de reproducción, resultado esperado y entorno.

## English

Install dependencies, copy `.dev.vars.example`, apply the local D1 migrations, and run `npm run dev`. Cloudflare credentials are not required for ordinary local development. Before opening a PR, run `npm run check` and `npm run build`; never commit secrets, and add schema changes as new D1 migrations.
