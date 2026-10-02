# Arquitectura aplicada al código

Monolito modular (Anexo H de la tesis, modelo 4+1) llevado a carpetas, reglas de importación y verificaciones automáticas. Si este documento y el código discrepan, gana este documento: corrige el código o abre un PR que cambie el documento con su justificación.

## 1. Piezas desplegables

| Pieza | Dónde corre | Qué hace |
| --- | --- | --- |
| App web Next.js (App Router, TypeScript estricto) | Vercel | Páginas renderizadas en el servidor, route handlers (`app/api`), PWA |
| Worker Node.js | Render (web service gratuito) | Tareas programadas (deuda, morosidad) y despacho de la cola de notificaciones |
| PostgreSQL | Neon | Único almacén transaccional; separación lógica por módulo |
| Archivos | Cloudflare R2 | Comprobantes, evidencias, PDF; solo URLs firmadas de vigencia corta |
| WhatsApp | Meta WhatsApp Cloud API (número de prueba) | Canal externo de avisos y enlaces de acceso, detrás de un adaptador |

App y worker se coordinan **solo a través de PostgreSQL** (cola con bloqueo de reclamo, cerrojo de ejecución). No hay memoria compartida ni llamadas directas entre ellos, salvo el "despertador" descrito en [BACKEND.md §8](BACKEND.md#8-worker).

## 2. Capas y regla de dependencias

Cada módulo de `modulos/<modulo>/` tiene tres capas:

| Capa | Contiene | Puede importar | Nunca importa |
| --- | --- | --- | --- |
| `dominio/` | Clases del diagrama lógico (DOO clásico), reglas de negocio, errores de dominio | Solo su propio `dominio/` y TypeScript puro | Prisma, Next, React, zod, `infraestructura/`, `compartido/bd`, otro módulo |
| `aplicacion/` | Casos de uso (una función por archivo), puerto público del módulo | Su `dominio/` y su `infraestructura/`, la `aplicacion/` de los módulos permitidos (§3), `compartido/*` | El `dominio/` o la `infraestructura/` de otro módulo |
| `infraestructura/` | Repositorios Prisma del módulo, adaptadores externos | Su `dominio/`, `compartido/*` | Otro módulo |

Fuera de los módulos:

- `app/` (páginas y route handlers) y `worker/` importan **solo** `modulos/*/aplicacion`, `compartido/*` y `componentes/*`. Nunca `dominio/` ni `infraestructura/`.
- `componentes/` no importa módulos; recibe datos por props.
- `compartido/` no importa módulos.
- Entre módulos se importa siempre con el alias `@/modulos/<m>/aplicacion/...`. Dentro de `modulos/**` está prohibido subir dos niveles con rutas relativas (`../../`), así ninguna importación esquiva la regla.
- Los tipos que viajan entre módulos son DTO planos definidos en `aplicacion/`, nunca clases de `dominio/`.

## 3. Dependencias permitidas entre módulos

Tomadas de la figura H2 del Anexo H, sin ciclos:

| Módulo | Puede usar la `aplicacion/` de |
| --- | --- |
| `identidad` (M1) | `accesibilidad` |
| `transparencia` (M2) | `identidad`, `aportes`, `asambleas`, `accesibilidad` |
| `incidencias` (M3) | `identidad`, `accesibilidad` |
| `asambleas` (M4) | `identidad`, `accesibilidad` |
| `aportes` (M5) | `identidad`, `accesibilidad` |
| `accesibilidad` (M6) | ninguno |

Reglas que se derivan:

- **M1 no importa M2 a M5.** Cuando un dato de M1 necesita información de otro módulo se resuelve de dos formas: (a) composición en `app/` o en `worker/` (el panel de inicio, la copia de datos ARCO), o (b) una proyección propia de M1 que el otro módulo actualiza llamando a la `aplicacion` de M1 (el semáforo de garita lo actualiza M5).
- **M6 no importa M1.** El Anexo H dibuja M6 → M1 y M1 → M6; se quita M6 → M1 para no tener un ciclo. `PerfilAccesibilidad` referencia al usuario solo por su id.
- Los "eventos" del Anexo H (`MorosidadActualizada`, `PagoAplicado`, `AsistenciaConfirmada`) son **llamadas síncronas** al puerto `aplicacion` del módulo consumidor, dentro de la misma transacción cuando la operación debe ser atómica (pagar y restituir el acceso en garita, ADR-007). No hay bus de eventos.

## 4. Verificaciones automáticas (funciones de aptitud)

El Anexo H §6 y §8 nombra ESLint como la herramienta de la regla de dependencia; se usa ESLint, sin dependencias nuevas. Se configuran en `eslint.config.mjs` en la fase 0 y corren en `npm run lint`, que es un check obligatorio del CI.

| Verificación | Implementación | Rompe si |
| --- | --- | --- |
| Pureza del dominio | `no-restricted-imports` en `modulos/*/dominio/**` | se importa `@prisma/client`, `next*`, `react*`, `zod`, `**/infraestructura/**`, `@/compartido/bd/**` o cualquier otro módulo |
| Puerto público | `no-restricted-imports` en `app/**`, `worker/**` y `modulos/**` | se importa `@/modulos/*/dominio/**` o `@/modulos/*/infraestructura/**` de otro módulo (desde `app/` y `worker/`, de cualquiera) |
| Matriz de §3 | Un bloque `no-restricted-imports` por módulo, generado con un bucle sobre la tabla de §3 en el mismo `eslint.config.mjs` | un módulo usa la `aplicacion/` de uno no permitido |
| Rutas relativas | `no-restricted-imports` con el patrón `../../*` en `modulos/**` | una importación sale del módulo sin alias |
| Sin ciclos | `import/no-cycle` (el plugin ya viene con `eslint-config-next`) | aparece un ciclo de importación |
| Accesibilidad estática | `jsx-a11y` (incluido en `eslint-config-next`) con `alt-text` como error | una imagen sin alternativa |
| Accesibilidad en ejecución | Cypress + axe-core (ver [PRUEBAS.md](PRUEBAS.md)) | una pantalla tiene una violación WCAG 2.2 AA |

La fase 0 incluye una prueba que demuestra que la regla falla: `pruebas/unitarias/arquitectura/reglas.test.ts` lintea con la API de ESLint código de ejemplo (un módulo que importa el `dominio` de otro, una `aplicacion` fuera de la matriz, un dominio que importa Prisma, una ruta `../../`, una página que importa un `dominio`…) como si viviera en `modulos/…`, `app/…` o `worker/…`, y espera el error; también comprueba que lo permitido pasa. ESLint corre en un proceso aparte (`lintear.mjs`) porque carga `eslint.config.mjs` con `import()`, que el entorno de Jest no admite.

## 5. Resumen de los ADR del Anexo H

| ADR | Decisión | Consecuencia en el código |
| --- | --- | --- |
| 001 | Monolito modular: una app Next.js + un worker + un PostgreSQL | Un repo, un `package.json`, un esquema Prisma, un conjunto de pruebas |
| 002 | Magic Link de un solo uso como acceso principal y clave de respaldo como ruta alterna; sesión persistente | `MagicLink` y `Sesion` son entidades; el canje usa `SELECT … FOR UPDATE`; cookie de sesión persistente |
| 003 | Worker separado para lo programado y asíncrono, con cerrojo de ejecución | `worker/tareas/*`; advisory lock de Postgres; generación de cuotas idempotente por predio y periodo |
| 004 | Perfil de accesibilidad persistido en el servidor y aplicado al renderizar | El layout raíz lee el perfil y pinta `data-mode="senior"` en `<html>`; nada de `localStorage` para el perfil |
| 005 | Rutas asistidas y sin conexión modeladas en el dominio | `ConfirmacionAsistencia.modo`, `Queja.registradaPor`, `PagoPresencial.idOperacionLocal`; idempotencia por id de operación |
| 006 | Notificaciones por cola en PostgreSQL con copia interna garantizada | El emisor solo encola; el worker escribe primero la copia interna y luego intenta WhatsApp con reintentos de espera creciente |
| 007 | Un único esquema con separación lógica por módulo | Prefijo de tabla por módulo; cada repositorio toca solo las tablas de su módulo; ver [DATOS.md](DATOS.md) |

## 6. Equivalencia de nombres (Anexo H §8 → repositorio)

Todo el código va en español. Solo quedan en inglés los nombres que impone una herramienta (`app/`, `page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`, `public/`, `package.json`, `next.config.ts`, `migrations/`, etc.).

| Anexo H | Repositorio |
| --- | --- |
| `app/(portal)/` | `app/(vecino)/` |
| `app/(directiva)/` | `app/(directiva)/directiva/` |
| `app/(garita)/` | `app/(garita)/garita/` |
| — (no existía) | `app/(administrador)/administracion/`, `app/(acceso)/` |
| `app/api/` | `app/api/` |
| `components/a11y/` | `componentes/a11y/` |
| `components/tokens/` | `componentes/tokens/` |
| `modules/<m>/domain/` | `modulos/<m>/dominio/` |
| `modules/<m>/application/` | `modulos/<m>/aplicacion/` |
| `modules/<m>/infrastructure/` | `modulos/<m>/infraestructura/` |
| `shared/notificaciones/`, `auditoria/`, `archivos/` | `compartido/notificaciones/`, `auditoria/`, `archivos/` |
| `shared/db/` | `compartido/bd/` |
| `worker/jobs/` | `worker/tareas/` |
| `tests/unit/`, `integration/`, `e2e/` | `pruebas/unitarias/`, `integracion/`, `e2e/` |
| Nombres de los módulos | Iguales: `identidad`, `transparencia`, `incidencias`, `asambleas`, `aportes`, `accesibilidad` |
| `CalculoDeudaJob`, `AlertaMorosidadJob`, `ClasificacionMorosidadJob` | `worker/tareas/calcularDeuda.ts`, `alertarMorosidad.ts`, `clasificarMorosidad.ts` |
| `SesionService.renovar()`, `ServicioQuejas.emitirTicket()` | Funciones de caso de uso: `renovarSesion()`, `registrarQueja()` |

Las carpetas de cada capa se crean cuando tienen su primer archivo real; no se dejan carpetas vacías ni archivos de relleno.

## 7. Desviaciones respecto del Anexo H

Todas responden al presupuesto cero de la tesis. Se declaran en el capítulo de resultados de R3.1.

| Anexo H | Implementación | Motivo | Qué se conserva |
| --- | --- | --- | --- |
| PostgreSQL gestionado en Render | **Neon** (plan gratuito), con una rama de BD por cada preview de Vercel | El PostgreSQL gratuito de Render caduca a los 30 días | Un único almacén transaccional (ADR-007) con copias del proveedor |
| Worker como servicio Node de larga vida | **Web service gratuito de Render** despertado por un **cron de GitHub Actions** que llama a `POST /tareas/ejecutar` con un secreto, más un despertador inmediato desde la app al encolar | El plan gratuito de Render duerme el servicio tras 15 min sin tráfico y no ofrece cron jobs gratuitos | La segunda unidad desplegable de ADR-003, el cerrojo y los reintentos |
| API de WhatsApp Business (proveedor abierto) | **Número de prueba de WhatsApp Cloud API** de Meta (hasta 5 destinatarios verificados) detrás de un adaptador; un **simulador** en desarrollo y CI que deja el mensaje en el centro de notificaciones | Sin costo; el número de prueba basta para la validación con usuarios | ADR-006: la copia interna siempre se escribe |
| Almacenamiento de objetos (proveedor abierto) | **Cloudflare R2**, bucket privado, URLs firmadas de vigencia corta | Plan gratuito sin costo de salida | Comprobantes y evidencias nunca públicos |
| Proveedor de mapas (abierto) | Teselas de OpenStreetMap con Leaflet, URL configurable | Sin costo ni clave | Descripción textual alternativa obligatoria (HU-ACC-07) |
| Nombres en inglés (`modules`, `domain`…) | Nombres en español (§6) | Decisión del proyecto: todo el código en español | La misma estructura de tres capas |
| Dependencias M6 ↔ M1 | Solo M1 → M6 (§3) | Evitar un ciclo | El perfil se carga en el servidor durante la autenticación |
| Eventos de dominio | Llamadas síncronas al puerto `aplicacion` (§3) | Un bus sería infraestructura sin segundo uso | La atomicidad de ADR-007 |

## 8. Diferencias entre la matriz v7 de HU y el Anexo I

Manda la matriz v7. Estas son las diferencias encontradas y cómo se resuelven en el código (en las tablas de los `modulos/*/CLAUDE.md` van marcadas con †):

| HU | Anexo I | v7 / decisión en el código |
| --- | --- | --- |
| HU-COB-16 | `PUT /api/cobranza/tarifa` | `PUT /api/aportes/tarifa`: el prefijo de todo el módulo es `aportes` |
| HU-GAR-02 | `GET /auth/canjear` canjea el token | `GET /entrar/{token}` muestra la página y el canje es `POST /api/auth/canjear`: la vista previa de enlaces de WhatsApp hace GET y quemaría el token de un solo uso |
| HU-GAR-17 | Solo `POST /api/perfil/contacto` | v7 CA2 exige que la directiva o el administrador aprueben: se añade `PATCH /api/admin/contacto/{id}` |
| HU-GAR-15 | Solicitud ARCO de oposición que resuelve el administrador | v7 CA1–CA3: es una opción que el vecino activa y se aplica de inmediato y de forma retroactiva. Se registra como `SolicitudARCO` tipo `OPOSICION` resuelta automáticamente, para conservar la traza |
| HU-GAR-13 | CA1: adjuntar sustento documental | El sustento es texto ("Así figura en mi DNI") y la administración puede pedir ver el documento. Adjuntar la foto llega con el primer uso real de R2 (comprobantes, M5), que crea `nucleo_archivos` y la subida firmada; queda pendiente de la decisión de la autora |
| HU-GAR-12, 13 | `SolicitudARCO` con `fechaLimite` | `SolicitudArco` (`identidad_solicitudes_arco`): el plazo se calcula al leerla con `fechaLimite()` y `estadoDelPlazo()` en días hábiles de Lima, no se guarda. La copia de datos (acceso) se resuelve sola: el vecino la descarga al momento y queda registrada |
| HU-GAR-09 | Estado `DESVINCULADA` (diagrama 02a) | v7 dice "Inactivo": en el dominio es `DESVINCULADA`; en pantalla, el texto del prototipo |
| HU-GAR-25 | `CredencialRespaldo.restablecer()` | El diagrama 02a la pone en `Usuario.restablecerClaveRespaldo()`; se usa la del diagrama |
| HU-ASA-09 | Solo `POST /api/eventos/{id}/voluntariado` | v7 CA2: la directiva aprueba la postulación → `PATCH /api/eventos/voluntariado/{id}` |
| HU-ACC-02 | `GET /api/accesibilidad/voz` (síntesis en el servidor) | v7 R-08: lectura en voz alta activable desde el perfil → Web Speech API del navegador, sin endpoint; la preferencia va en el perfil |
| HU-ACC-04 | `GET /api/accesibilidad/mediacion` | v7 CA2–CA3: la solicitud se registra y tiene estado → `POST` para pedir ayuda y `GET`/`PATCH` para que la directiva la atienda |
| HU-COB-09 | "Deudor" | `EstadoMorosidad` del diagrama 02b (`SOLVENTE`, `MOROSO_PREVENTIVO`, `MOROSO_CRITICO`); hacia el vecino se dice "Con retraso", no "moroso" |
| HU-QUE-01 | Categorías ruidos, basura, cocheras, otros | El enum del diagrama 02d añade `SEGURIDAD`; se usa el enum completo |
| HU-ACC-03, 05, 06, 07, 08, 09 | Historias | v7 los clasifica como requisitos no funcionales (RNF): se verifican en todas las pantallas, no en una sola |
| HU-ACC-05 CA4–CA5 | — | Nuevos en v7: autenticación sin prueba cognitiva (WCAG 3.3.8) y sin entrada redundante (3.3.7) |
| HU-ACC-08 CA4, HU-ACC-05 CA3 (pruebas con usuarios) | — | Requieren el producto construido y personas: corresponden a R3.2; en R3.1 se deja el instrumento y la evidencia automatizada |
| Hoja "Épicas por Módulo" de la v7 | — | Dice "Total: 13 historias" en la Épica 5 pero lista 14 (falta sumar HU-COB-16); el conteo correcto es 14 |
