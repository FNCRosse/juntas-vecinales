# Despliegue

El despliegue existe desde la fase 0: cada PR tiene su preview y cada merge a `main` va a producción. Desviaciones respecto del Anexo H y su motivo: [ARQUITECTURA.md §7](ARQUITECTURA.md#7-desviaciones-respecto-del-anexo-h).

## 1. Arquitectura de despliegue

```
Teléfono / tablet (PWA) ──HTTPS──▶ Vercel: Next.js (SSR + app/api)  ──▶ Neon PostgreSQL (prod)
                                      │  preview por PR ───────────▶ Neon: rama por preview
                                      ├─ URLs firmadas ────────────▶ Cloudflare R2 (bucket privado)
                                      └─ despertador (after) ──┐
GitHub Actions cron (cada 10 min) ───────────────────────────────┴─▶ Render: worker (web service gratuito)
                                                                      ├──▶ Neon PostgreSQL (prod)
                                                                      └──▶ WhatsApp Cloud API (número de prueba)
```

| Entorno | App | BD | WhatsApp | Archivos |
| --- | --- | --- | --- | --- |
| Local | `npm run dev` | Postgres en Docker o rama `dev` de Neon | `simulador` | R2 de desarrollo o almacén en memoria |
| CI | build + `next start` en Actions | Servicio `postgres:16` de Actions | `simulador` | Almacén en memoria |
| Preview (cada PR) | Vercel preview | Rama de Neon creada para esa preview, copia de producción, **sin semillas** (una clave conocida daría acceso a la copia) | `simulador` | R2 (prefijo `preview/`) |
| Producción | Vercel, rama `main` | Rama principal de Neon | `meta` | R2 |

El worker solo existe en producción; las previews no despachan a WhatsApp (el simulador escribe la copia interna).

## 2. Variables de entorno

Sin valores en el repositorio. `.env.example` lista los nombres; los valores locales van en `.env.local` (ignorado por git). **Claude nunca pide, genera, lee ni escribe el valor de un secreto.**

| Variable | Secreto | Dónde se configura | Quién la pone |
| --- | --- | --- | --- |
| `DATABASE_URL` | Sí | Vercel prod y preview (integración Neon); Render; `.env.local` | La integración Neon en Vercel; la autora en Render y en local |
| `DATABASE_URL_UNPOOLED` | Sí | Vercel prod y preview (integración Neon); `.env.local` | La integración Neon; la autora en local |
| `URL_PUBLICA` | No | Vercel (prod), Render | Claude con el conector |
| `URL_WORKER` | No | Vercel; variable de repositorio en GitHub Actions | Claude |
| `SECRETO_WORKER` | Sí | Render, Vercel, secreto de GitHub Actions | La autora (`gh secret set SECRETO_WORKER`) |
| `WHATSAPP_MODO` | No | Vercel (`simulador` en preview, `meta` en prod), Render (`meta`). Hasta configurar Meta (antes de M1) vale `simulador` en todas partes | Claude |
| `WHATSAPP_ID_NUMERO` | No | Render | La autora da el dato; Claude lo fija con el conector |
| `WHATSAPP_TOKEN` | Sí | Render | La autora |
| `R2_ID_CUENTA` | No | Vercel | Claude |
| `R2_BUCKET` | No | Vercel | Claude |
| `R2_ID_CLAVE_ACCESO` | Sí | Vercel | La autora |
| `R2_CLAVE_ACCESO_SECRETA` | Sí | Vercel | La autora |
| `CLAVE_CIFRADO` | Sí | Vercel, Render (32 bytes en base64, AES-256-GCM) | La autora |
| `NEXT_PUBLIC_MAPA_URL_TESELAS` | No | Vercel | Claude |
| `WHATSAPP_SIMULAR_FALLO` | No | Solo local y pruebas | — |
| `CYPRESS_INSTALL_BINARY` | No | Vercel (prod y preview) y Render = `0`; jobs del CI sin e2e | Claude |
| `NODE_VERSION` | No | Render = `22` | Claude |
| `SEMILLA_CLAVE` | No (solo datos ficticios) | Local y CI; si falta, una clave de prueba | — |
| `ADMIN_INICIAL_NOMBRE`, `ADMIN_INICIAL_DNI`, `ADMIN_INICIAL_CLAVE` | La clave sí | Solo en la terminal de la autora al correr `npm run administrador:crear` contra producción, una vez | La autora |

## 3. Pasos de la autora en cada panel

Claude los pide en el momento en que hacen falta (fase 0, P2) y espera la confirmación.

1. **GitHub.** Repositorio público `FNCRosse/juntas-vecinales` con `main` protegida (creado en P1). Secretos: `gh secret set SECRETO_WORKER`. Variable: `gh variable set URL_WORKER`.
2. **Vercel.** Claude crea el proyecto `juntas-vecinales` enlazado al repo con el conector, rama de producción `main` y build `prisma migrate deploy && next build`. La autora instala la integración **Neon** desde el Marketplace de Vercel (Storage → Neon), la conecta al proyecto para Production y Preview y activa "crear una rama de BD por cada preview" y el borrado automático de ramas.
3. **Neon.** Región en EE. UU. Este (la más cercana a Render Virginia u Ohio). La autora copia la URL de producción con pooling en la variable `DATABASE_URL` del worker en Render.
4. **Render.** La autora autoriza a Render a leer el repositorio. Claude crea el web service `juntas-vecinales-worker` (plan `free`, runtime `node`, rama `main`, `npm ci && npm run worker:construir`, `npm run worker:iniciar`, región `virginia` u `ohio`). La autora pega los secretos.
5. **Cloudflare R2.** Bucket privado `juntas-vecinales-archivos`; token de API con permiso de lectura y escritura **solo sobre ese bucket**; CORS que permite `PUT` y `GET` desde `URL_PUBLICA` y `https://*.vercel.app`.
6. **Meta (WhatsApp Cloud API, antes de M1).** App de tipo Business con el producto WhatsApp y su número de prueba. Hasta 5 destinatarios verificados (los teléfonos de las personas de la validación). Token permanente de un usuario del sistema (el token temporal caduca en 24 h). Plantillas con los nombres y textos de `compartido/notificaciones/plantillas.ts` (hoy `enlace_acceso`, `clave_nueva`, `clave_cambiada`, `invitacion_equipo`, `rol_cambiado`, `baja_padron`, `pedido_ayuda`, `reja_manual`, `emergencia_garita`, `visita_llego`, `visita_en_puerta` y `solicitud_privacidad`), enviadas a aprobación.

Después de cada cambio hecho con un conector, Claude anota aquí la configuración exacta (servicio, plan, región, comandos y nombres de variables) para poder recrearla sin el conector.

## 3b. Configuración creada con los conectores (fase 0)

Para recrearla sin los conectores, en el panel de cada servicio.

**Vercel** — proyecto `juntas-vecinales` (`prj_tjJi3y2nCyvC6quFDu3taUwJSfKO`), cuenta Hobby `rosita4407-2852` (ámbito `team_oBeJgxLcYVwDlTXrb5NPZBZY`).

| Ajuste | Valor |
| --- | --- |
| Repositorio | `FNCRosse/juntas-vecinales`, rama de producción `main`; cada PR crea una preview |
| Framework | Next.js |
| Comando de build | `prisma migrate deploy && next build` (el `postinstall` ya corrió `prisma generate`) |
| Instalación y salida | Las de Next por defecto (`npm install`, `.next`) |
| Node.js | `22.x` |
| Protección de despliegues | Vercel Authentication solo en previews (`ssoProtection: preview`); producción es pública |
| Variables (no secretas) | `WHATSAPP_MODO=simulador` (prod, preview, dev) · `CYPRESS_INSTALL_BINARY=0` (prod, preview) · `R2_BUCKET=juntas-vecinales-archivos` (todas) · `NEXT_PUBLIC_MAPA_URL_TESELAS=https://tile.openstreetmap.org/{z}/{x}/{y}.png` (todas) · `URL_WORKER=https://juntas-vecinales-worker.onrender.com` (prod) |
| Variables de la integración Neon | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` y las que la integración agrega sola (`PG*`, `POSTGRES_*`, `NEON_*`, `VITE_NEON_AUTH_URL`), para prod y preview. Solo se usan las dos primeras |
| Base de datos | Integración Neon del Marketplace, región Washington D. C. (`iad1`, AWS us-east-1), plan Free |
| `R2_ID_CUENTA` | Account ID de Cloudflare (no secreto), en todos los entornos |

El conector creó el proyecto con `create_project` y `gitRepository`: `create_git_project` exige `teamId` y el token del conector no tiene acceso explícito al ámbito del equipo (403), aunque sí al ámbito por defecto.

**Render** — web service `juntas-vecinales-worker` (`srv-davi9v67bikc73e60oig`), workspace "My Workspace" (`tea-d2cdvf15pdvs73dj8b70`).

| Ajuste | Valor |
| --- | --- |
| Plan / región / runtime | `free` / `virginia` / `node` |
| Repositorio y rama | `FNCRosse/juntas-vecinales`, `main`, auto-deploy en cada commit |
| Build | `npm ci && npm run worker:construir` |
| Inicio | `npm run worker:iniciar` (escucha en `PORT`, que pone Render) |
| URL | `https://juntas-vecinales-worker.onrender.com` |
| Variables (no secretas) | `WHATSAPP_MODO=simulador`, `CYPRESS_INSTALL_BINARY=0`, `NODE_VERSION=22` |
| Secretos (la autora) | `DATABASE_URL` (Neon, rama principal, con pooling), `SECRETO_WORKER` |

**GitHub** — variable de Actions `URL_WORKER` y secreto `SECRETO_WORKER` (la autora). Protección de `main`: PR obligatorio y checks obligatorios `lint`, `tipos`, `pruebas` y `e2e` (los nombres de los jobs de `ci.yml`).

## 3c. URLs reales y checks obligatorios (fase 0)

| Qué | URL |
| --- | --- |
| Producción (app) | https://juntas-vecinales-eight.vercel.app |
| Salud de la app | https://juntas-vecinales-eight.vercel.app/api/salud |
| Worker | https://juntas-vecinales-worker.onrender.com (salud: `/salud`; tareas: `POST /tareas/ejecutar`) |
| Preview de una rama | `https://juntas-vecinales-git-<rama>-rosita4407-2852s-projects.vercel.app`, protegida por Vercel Authentication; cada una usa su rama de Neon `preview/<rama>` |
| Panel de Vercel | https://vercel.com/rosita4407-2852s-projects/juntas-vecinales |
| Panel de Render | https://dashboard.render.com/web/srv-davi9v67bikc73e60oig |

Checks obligatorios en la protección de `main` (los jobs de `ci.yml`): `lint`, `tipos`, `pruebas` y `e2e`. Se comprobó con un PR que violaba la regla de arquitectura: con `lint` en rojo, GitHub lo reportó como `blocked`.

Circuito de la fase 0 verificado: PR con preview y su rama de Neon, merge, despliegue de producción en Vercel y Render, y `worker-cron.yml` lanzado a mano ([corrida](https://github.com/FNCRosse/juntas-vecinales/actions/runs/36963424407)): el worker respondió `ejecutada` y la fila `EXITOSA` quedó en `nucleo_ejecuciones_worker` de la rama `main` de Neon.

## 4. Rollback

| Pieza | Cómo | Tiempo |
| --- | --- | --- |
| App web | Vercel → Deployments → despliegue anterior de producción → **Instant Rollback** (un paso) | Inmediato |
| Worker | Render → Events → despliegue anterior → Rollback | 1–2 min |
| BD | Neon → restauración a un punto en el tiempo (ventana corta en el plan gratuito) | Minutos |

Las migraciones no se revierten con el rollback de Vercel. Por eso todo cambio de esquema es compatible con la versión anterior del código ([DATOS.md §4](DATOS.md#4-migraciones)).

## 5. Cron del worker

- `.github/workflows/worker-cron.yml`: `schedule` cada 10 min (`*/10 * * * *`) y `workflow_dispatch`. Llama a `POST $URL_WORKER/tareas/ejecutar` con la cabecera `x-secreto-worker`, timeout de 120 s (arranque en frío de Render) y un reintento.
- El despertador desde la app (`after()` al encolar un aviso urgente) reduce la espera de los enlaces de acceso a lo que tarde Render en despertar.
- GitHub puede retrasar las ejecuciones programadas en horas de carga y las desactiva tras 60 días sin actividad en el repositorio: si el proyecto queda quieto, reactivar el workflow desde la pestaña Actions.

## 6. Límites de los planes gratuitos

Valores de referencia al momento de escribir; Claude los confirma en cada panel en P2 y corrige esta tabla.

| Servicio | Límite que importa | Qué vigilar |
| --- | --- | --- |
| Vercel Hobby | Uso no comercial; duración máxima por función; cuota mensual de transferencia y de ejecuciones | Ninguna tarea larga en route handlers (para eso está el worker) |
| Neon Free | 0.5 GB por proyecto; horas de cómputo mensuales; suspensión tras 5 min sin uso; número máximo de ramas | El cron despierta la BD cada 10 min: si el cómputo pasa del 70 % del mes, bajar el cron a cada 30 min. La integración de Vercel **no borra** la rama de una preview al fusionar: borrar las de PR cerrados (con el visto bueno de la autora) o activar el borrado automático en la integración |
| Render Free | 750 horas de instancia al mes por cuenta; duerme tras 15 min sin tráfico; arranque en frío de ~1 min; disco efímero | Con el cron cada 10 min el worker queda despierto casi todo el mes (~730 h): no crear otro servicio gratuito en la misma cuenta |
| Cloudflare R2 | 10 GB almacenados; 1 M de operaciones de clase A y 10 M de clase B al mes; salida sin costo | Tamaño de evidencias y la retención de [DATOS.md §6](DATOS.md#6-ley-n-29733-protección-de-datos-personales) |
| GitHub Actions | Gratis en repos públicos; cron mínimo cada 5 min y con retrasos | Duración del job de Cypress |
| WhatsApp Cloud API (prueba) | Hasta 5 destinatarios verificados; fuera de la ventana de 24 h solo plantillas aprobadas | Las personas de la validación deben estar en la lista |
