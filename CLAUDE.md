# juntas-vecinales

Plataforma web accesible de la Junta Vecinal de Villa de Fátima: software del Resultado R3.1 de una tesis PUCP. 76 HU (70 funcionales + 6 RNF) en 6 módulos, para una comunidad con muchos adultos mayores. La accesibilidad (WCAG 2.2 AA) y la baja carga cognitiva mandan sobre cualquier otro atributo.

Repo público: `github.com/FNCRosse/juntas-vecinales`. Todo lo que se escribe aquí es público.

## Stack

- Next.js (App Router, TypeScript estricto) en **Vercel**, como monolito modular.
- Worker Node.js en **Render** (web service gratuito) despertado por un cron de GitHub Actions.
- PostgreSQL en **Neon** (rama por preview) · Prisma · un solo esquema.
- Tailwind v4 + Radix Primitives, solo con los tokens propios (`docs/guia-visual/tokens.json`).
- Cloudflare R2 (URLs firmadas) · WhatsApp Cloud API (número de prueba) con simulador.
- Jest (unitarias) · Supertest (integración) · Cypress + axe-core (e2e).
- npm · Node 22.

## Reglas duras

1. **Todo el código en español**: carpetas, archivos, clases, funciones, variables, tablas, commits y PR. Solo quedan en inglés los nombres que impone una herramienta (`app/`, `page.tsx`, `route.ts`, `middleware.ts`, `package.json`, `migrations/`…).
2. **Capas:** `dominio` no importa Prisma, Next, React, zod ni infraestructura. Ningún módulo importa el `dominio` ni la `infraestructura` de otro: todo pasa por `aplicacion`. `app/` y `worker/` solo importan `aplicacion`. Matriz de módulos permitidos: `docs/ARQUITECTURA.md §3`. Lo verifica `npm run lint`.
3. **Una HU por rama y por PR** (`hu/<id>-<slug>`). Pruebas primero, desde los criterios de la v7. Merge solo con el CI verde. Procedimiento: `docs/FLUJO_TRABAJO.md`.
4. **Pruebas:** cada prueba lleva `@HU-XXX-nn`. Cobertura de líneas de Jest ≥ 80 % global (bloquea). Toda HU cerrada tiene al menos un e2e con 0 violaciones axe WCAG 2.2 AA.
5. **Accesibilidad:** nada por debajo de 16 px; objetivos de 48 px (56 en Senior); solo tokens, ningún hexadecimal; ningún estado solo con color; confirmación en dos pasos para dinero, voto, queja y bajas; textos del prototipo con trato de usted y lenguaje llano.
6. **Calidad del Anexo H:** idempotencia por `idOperacion` (AC-5), auditoría de toda acción crítica en la misma transacción (AC-6), un vecino nunca ve datos de otro predio: 404 (AC-7).
7. **Sin sobreingeniería:** nada "para después"; ninguna abstracción sin un segundo uso real; ninguna interfaz con una sola implementación salvo los adaptadores externos (WhatsApp, R2, mapas, PDF); ninguna dependencia nueva para lo que resuelven la plataforma o unas pocas líneas.
8. Montos en céntimos enteros; fechas en UTC y mostradas en `America/Lima`.
9. Sin gamificación (medallas, puntos, rachas, confeti).

## Prohibiciones

- **Secretos:** nunca pedir, generar, leer, imprimir ni escribir el valor de un secreto (BD, R2, Meta, `SECRETO_WORKER`, `CLAVE_CIFRADO`), tampoco por un conector. Solo nombres de variables (`.env.example`, `docs/DESPLIEGUE.md`). La autora pone los valores.
- **Datos reales:** nunca copiar al repo nombres, DNI, teléfonos, direcciones, placas ni recibos reales de la junta. Las semillas usan los personajes ficticios del prototipo (`docs/DATOS.md §5`).
- **Nombre de la herramienta de diseño:** la herramienta con la que se generó el prototipo HTML no se nombra en ningún archivo, carpeta, texto visible ni documento. El prototipo se llama "prototipo en Figma (R2.3)" o "prototipo de referencia". Antes de cada PR, `git grep -iE "claude[ -]?design"` debe salir vacío.
- Rutas de la carpeta de la tesis: solo en `CLAUDE.local.md` (ignorado por git), nunca en archivos versionados.
- No desactivar pruebas, reglas de lint ni umbrales para que el CI pase.

## Comandos

Se crean en la fase 0 (y `matriz` en la 0b). Si cambian, se actualiza esta lista.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Next |
| `npm run build` / `npm start` | Build de producción y servidor (Cypress corre contra esto) |
| `npm test` | Jest: unitarias + integración, con cobertura y umbral (necesita el Postgres de pruebas) |
| `npm run test:integracion` | Solo integración (Supertest contra la BD de pruebas) |
| `npm run test:e2e` | Build, `next start` y Cypress + axe en headless contra el build (`guiones/e2e.mjs`; los argumentos tras `--` van a Cypress) |
| `npm run lint` | ESLint, incluidas la regla de arquitectura y `jsx-a11y` |
| `npm run tipos` | `tsc --noEmit` |
| `npm run worker:construir` / `npm run worker:iniciar` | Compila e inicia el worker (Render) |
| `postinstall` | `prisma generate`: genera el cliente en `compartido/bd/generado/` (ignorado por git) al instalar |
| `npm run matriz` | Genera `docs/evidencias/matriz-hu.md` desde las etiquetas `@HU` |

Antes de abrir un PR: `npm run lint && npm run tipos && npm test`.

## Estructura

```
app/(acceso) (vecino) (directiva)/directiva (administrador)/administracion (garita)/garita  api/
componentes/{a11y,tokens}
modulos/<modulo>/{dominio,aplicacion,infraestructura}   ← identidad transparencia incidencias asambleas aportes accesibilidad
compartido/{notificaciones,auditoria,archivos,bd}
worker/tareas
pruebas/{unitarias,integracion,e2e}
docs/
```

Las carpetas se crean cuando tienen su primer archivo real.

## Documentación (`docs/`)

| Documento | Para qué |
| --- | --- |
| [ARQUITECTURA.md](docs/ARQUITECTURA.md) | Capas, matriz de módulos, verificaciones automáticas, ADR, equivalencias de nombres, desviaciones y diferencias v7/Anexo I |
| [FRONTEND.md](docs/FRONTEND.md) | Rutas por actor, Server Components, perfil al renderizar, de pantalla del prototipo a código, PWA, formularios |
| [BACKEND.md](docs/BACKEND.md) | Route handler → aplicación → dominio → repositorio, errores, sesión, AC-5/6/7, adaptadores, worker |
| [DATOS.md](docs/DATOS.md) | Esquema Prisma, nombres, restricciones en la BD, migraciones, semillas, Ley 29733 |
| [PRUEBAS.md](docs/PRUEBAS.md) | Pirámide, etiquetas `@HU`, umbrales, BD de pruebas, simuladores, matriz |
| [ACCESIBILIDAD.md](docs/ACCESIBILIDAD.md) | WCAG 2.2 AA, AC-1/AC-2, modo Senior, tamaños, lista por pantalla, lenguaje llano, reparto de M6 |
| [DESPLIEGUE.md](docs/DESPLIEGUE.md) | Entornos, variables (sin valores), pasos de la autora, rollback, cron, límites gratuitos |
| [FLUJO_TRABAJO.md](docs/FLUJO_TRABAJO.md) | Procedimiento por HU, Definition of Done, commits, cierre de módulo |
| [PLAN.md](docs/PLAN.md) | Fases, orden de HU, casillas, riesgos |
| [guia-visual/](docs/guia-visual/guia-visual.md) | Tokens (fuente única), tipografía, íconos, componentes, reglas A1–A12 |
| [prototipo/](docs/prototipo/LEEME.md) | Prototipo navegable y trazabilidad pantalla → criterio |
| [evidencias/](docs/evidencias/PLANTILLA.md) | Evidencia de cierre de cada módulo |

Cada módulo tiene su `modulos/<m>/CLAUDE.md` con responsabilidad, entidades, reglas de negocio y **la tabla completa de sus HU** (criterios, clases, endpoint y pantallas). No hace falta otra fuente.

## graphify

El repo tiene su propio grafo en `graphify-out/` (separado del de la tesis).

- **Antes** de leer código o responder sobre la arquitectura: `graphify query "<pregunta>"` y abre solo los archivos que señale. Para un nodo: `graphify explain "<nodo>"`; para una relación: `graphify path "<A>" "<B>"`.
- **Después** de cada cambio que se fusiona (y al terminar una HU): `graphify update .` desde la raíz.
- Si el grafo no responde o está desactualizado, reconstrúyelo con la skill `/graphify` antes de seguir.

## Al empezar una sesión

1. Lee este archivo, `docs/PLAN.md` (dónde va el proyecto) y el `CLAUDE.md` del módulo en curso.
2. `graphify query` sobre lo que vas a tocar.
3. Sigue `docs/FLUJO_TRABAJO.md`. Al cerrar un módulo, detente y espera el "aprobado" de la autora.
