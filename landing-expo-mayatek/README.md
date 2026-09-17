# Expo MAYATEK 2026 — sitio

Sitio de una sola página para Expo MAYATEK 2026 (10 de octubre, Gran Museo del Mundo Maya,
Mérida — organiza U Péekbal Waye'). Cubre todo el evento: programa, mesa panel, Maya Makers
(el hackathon), aliados de difusión e inscripción.

Es **HTML + CSS estático, sin backend ni build** — se puede desplegar en cualquier hosting
estático (Cloudflare Pages, GitHub Pages, Netlify) en minutos. No necesita cuenta de
desarrollador para levantarlo, solo subir la carpeta.

## Contenido y fuentes

Construido a partir de las minutas reales de las juntas de organización (16 abr – 21 ago
2026, carpeta `Documents/Mayatek/`) y los assets de marca que ya existían ahí (wordmark de
Mayatek, logo de Péekbal, ilustración e imagen de fondo). Los retos y la mecánica del hackathon
(final en línea, solo el ganador presenta en vivo) vienen de
`convocatoria-maya-makers-2026.md` ya actualizado.

**Nota de nombre:** la sección del hackathon se llamaba "Mayathon" — se renombró a
**Maya Makers** porque alguien del equipo detectó que "mayathon"/"mayatón" puede sonar a un
término ofensivo en español o a una palabra de connotación sexual en maya. Ver
`propuesta-maya-makers-2026.md` §0 para el detalle completo. **"Maya Makers" en sí todavía no
se ha validado con un mayahablante** — confirmarlo antes de publicar este sitio.

## Lo que falta antes de publicar — marcado en el sitio con la etiqueta "pendiente"

Cada uno de estos puntos tiene una etiqueta ámbar visible en el sitio (`<span class="pending">`)
para que no se publique por accidente sin llenarlo:

1. **Ponente de la conferencia magistral** — las minutas dicen "confirmada" pero no encontré
   un nombre definitivo por escrito.
2. **Selección final de ponencias y stands** — hay 11 propuestas recibidas (ver
   `U propuestas ti' u formulario mayatek...docx`), pero las notas indican que todavía están
   en revisión (Mauricio comentando postulantes). No las publiqué como confirmadas para no
   anunciar a alguien que al final no quede seleccionado.
3. **Liga al formulario de registro** — las minutas mencionan un Google Form ya existente
   ("U registro Mayatek 2026"), pero no tuve acceso a él desde el Drive conectado a esta
   sesión. Hay que pegar la liga real en el botón "Inscribir a mi equipo" (sección Maya Makers)
   y en el botón de la sección "Inscripción" general del evento.
4. **Contacto / WhatsApp** — sin liga todavía, igual que en la convocatoria de Maya Makers.
5. **11 y 12 de octubre** — las minutas dicen "probablemente" un segundo día; el sitio solo
   menciona el 10 para no prometer un día que no está confirmado. Si se confirma, agregarlo
   al hero y al footer.
6. **Liga a la lista completa de los 11 retos de Maya Makers** — vive en
   `propuesta-maya-makers-2026.md` §6, pero antes de publicarla hay que resolver si el corpus de
   audio que lista como recurso es el mismo de Maayatʼaan (excluido antes por incipiente) o uno
   distinto del equipo de Péekbal — ver ese documento, §6 y §17 punto 12.

Busca `pending` en `index.html` para encontrar los puntos exactos en el código.

**Dominio: ya confirmado** — `expomayatek.mx`. El botón "Portal de equipos y jurado" ya
apunta a `https://mayamakers.expomayatek.mx` (no lleva etiqueta "pendiente"). Ver la sección
"Cómo va junto con el portal de Maya Makers" para cómo configurarlo del lado de Cloudflare.

## Cómo va junto con el portal de Maya Makers

El flujo completo es: este sitio → botón "Inscribir a mi equipo" → Google Form (externo) →
si el equipo es seleccionado, recibe por WhatsApp su link privado al portal de
`.repos/maya-makers-portal`, donde sube su entrega y sigue su evaluación hasta el 10 de octubre.

El portal **no se despliega como un sitio aparte con su propia URL suelta y desconectada** —
queda bajo el mismo dominio que este sitio, `expomayatek.mx`, para que se sienta una sola
propiedad. Forma acordada, la más simple de configurar: un **subdominio** —

- Este sitio estático → Cloudflare Pages en la raíz del dominio (`expomayatek.mx`).
- El Worker de `maya-makers-portal` → el mismo Worker de siempre, sin tocar código, colgado de
  `mayamakers.expomayatek.mx` en esa misma zona de Cloudflare.

Esto no pide ningún cambio de código en el portal — un subdominio en Cloudflare apunta
directo a la raíz del Worker, tal cual está. (La alternativa de ruta `expomayatek.mx/mayamakers/*`
también era posible, pero pide agregar un `basePath` en el Hono del portal — más frágil, por
eso se descartó a favor del subdominio.)

El botón "Portal de equipos y jurado" de este sitio ya apunta a
`https://mayamakers.expomayatek.mx`. Falta que, al desplegar, alguien registre ese subdominio
en la zona de Cloudflare y lo enrute al Worker — ver `.repos/maya-makers-portal/README.md` para
los pasos de deploy de ese lado.

## Cómo editar

Todo vive en un solo archivo, `index.html` — estilos incluidos, sin dependencias externas
(sin fuentes de Google, sin CDN) para que cargue rápido incluso con conectividad limitada,
que es uno de los principios del proyecto. Las imágenes están en `assets/`, ya optimizadas
(comprimidas y redimensionadas desde los originales en `Documents/Mayatek/`).

## Deploy

Cualquier hosting estático funciona. Con Cloudflare Pages (consistente con el resto del stack
de Danil/Maayatʼaan):

```bash
npx wrangler pages deploy . --project-name=mayatek-2026
```

O simplemente arrastra la carpeta a Cloudflare Pages / Netlify desde el dashboard — no hay
build step, es solo `index.html` + `assets/`.
