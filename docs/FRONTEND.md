# Frontend

Next.js App Router con Server Components, Tailwind v4 sobre los tokens propios y Radix Primitives. Las reglas de accesibilidad que se verifican están en [ACCESIBILIDAD.md](ACCESIBILIDAD.md); aquí, cómo se construye.

## 1. Grupos de rutas por actor

Los actores son los cuatro del Anexo M (prefijos de pantalla `VEC`, `DIR`, `ADM`, `VIG`). Cada grupo tiene su `layout.tsx`, que exige sesión y rol y pinta la barra de navegación del actor.

| Grupo | URL | Actor y dispositivo | Barra de navegación (Anexo M, Tabla M2) |
| --- | --- | --- | --- |
| `app/(acceso)/` | `/entrar`, `/entrar/[token]`, `/clave`, `/clave/nueva`, `/seguimiento` | Sin sesión | — |
| `app/(vecino)/` | `/`, `/cuota`, `/asambleas`, `/incidentes`, `/mas/...` | Vecino (incluye adulto mayor y denunciante), teléfono | Inicio · Mi cuota · Asambleas · Incidentes · Más |
| `app/(directiva)/directiva/` | `/directiva/...` | Directiva y directivo mediador, teléfono y escritorio | Resumen · Cobros · Incidentes · Asambleas · Más |
| `app/(administrador)/administracion/` | `/administracion/...` | Administrador, escritorio | Inicio · Padrón · Equipo · Privacidad · Más |
| `app/(garita)/garita/` | `/garita/...` | Vigilante, tablet de garita | Inicio · Consultar · Visitas · Bitácora |
| `app/api/` | `/api/...` | Route handlers (ver [BACKEND.md](BACKEND.md)) | — |

- La directiva y el administrador también son vecinos: el selector "Mi casa / Directiva" (pantalla `DIR-INI-03`) lleva a `/` sin cerrar sesión.
- En modo Senior la barra del vecino muestra Inicio · Mi cuota · Asambleas · Más (Incidentes pasa a "Más").
- Dos niveles como máximo bajo el inicio (AC-2). Los pasos de un trámite ("paso 1 de 2") no cuentan como nivel.
- No se implementa lo que el prototipo marca como demostración: la opción "Volver al selector de actor" y los controles de la sección "Demostración".

## 2. Componentes de servidor por defecto

- Toda página es Server Component y obtiene sus datos llamando a la `aplicacion` de los módulos. Se añade `"use client"` solo en la hoja que lo necesita: el switch "Letra grande", formularios con validación en vivo, el mapa, la lectura en voz alta y las colas sin conexión.
- El panel de inicio del vecino (HU-GAR-19) se compone en `app/(vecino)/page.tsx` llamando a la `aplicacion` de cada módulo: así M1 no importa M3–M5 ([ARQUITECTURA.md §3](ARQUITECTURA.md#3-dependencias-permitidas-entre-módulos)).
- Las páginas entregan HTML semántico completo: un `<h1>` por pantalla, `<main id="contenido">`, enlace "Saltar al contenido" como primer elemento, `<nav aria-label>` por barra.
- Al cambiar de ruta en el cliente, el foco va al `<h1>` y una región `aria-live="polite"` anuncia el título.

## 3. Perfil de accesibilidad al renderizar (ADR-004)

- El layout raíz lee la sesión y el `PerfilAccesibilidad` en el servidor y pinta `<html lang="es" data-mode="senior">` cuando corresponde. Sin parpadeo, porque el documento llega ya ajustado.
- Sin sesión (pantallas de acceso) se usa el perfil por defecto (modo Normal).
- El switch "Letra grande" (guía visual §5.8) cambia `document.documentElement.dataset.mode` al instante y guarda con `PUT /api/accesibilidad/perfil`. Si no se pudo guardar, el modo se mantiene en el dispositivo y aparece el aviso "No pudimos guardar su preferencia. Se mantendrá en este teléfono".
- Componentes y pantallas leen siempre tokens; nunca valores fijos de color, tamaño o espaciado.

## 4. Estilos: tokens, Tailwind v4 y Radix

- Fuente única: [`docs/guia-visual/tokens.json`](guia-visual/tokens.json), copiado a `componentes/tokens/tokens.json` (una prueba de Jest exige que sean iguales). `node componentes/tokens/generar-css.mjs` genera `componentes/tokens/tokens.css`, que `app/globals.css` importa como indica la [guía visual §0.4](guia-visual/guia-visual.md). `verificar-contraste.mjs` se convirtió en la prueba `pruebas/unitarias/accesibilidad/tokens.test.ts` (`componentes/tokens/contraste.ts`): falla si un par baja de 4.5:1 en Normal o de 7:1 en Senior, o si `tokens.css` no está regenerado. Para cambiar un token: se edita en los dos `tokens.json`, se regenera y se corre la prueba. El `tokens.css` de `docs/prototipo/` es una versión anterior y solo sirve al prototipo.
- `--color-*: initial` borra la paleta de Tailwind: `bg-red-500` no genera CSS. Cero hexadecimales, tamaños fijos (`text-[18px]`) y `outline-none` en `app/` y `componentes/`: lo verifica `npm run estilos` (`guiones/revisar-estilos.sh`) en el job `lint` del CI.
- Tipografía Atkinson Hyperlegible con `next/font`. Íconos `lucide-react`, siempre acompañados de texto (guía §3).
- Radix Primitives solo para lo que el HTML nativo no resuelve bien: diálogo y hoja de confirmación, menú "Más", pestañas. Sin temas de terceros: los estilos salen de los tokens.
- Ningún elemento de gamificación (medallas, puntos, rachas, confeti, mascotas). El proyecto es de accesibilidad y diseño centrado en el usuario.
- Gráficos (balances, tablero de recaudación): barras en SVG o CSS hechas a mano, siempre con su tabla equivalente debajo. Sin librería de gráficos.

## 5. De una pantalla del prototipo a código

1. Busca el id de la pantalla (`VEC-COB-01`) en la tabla de HU del `modulos/<m>/CLAUDE.md` y en `docs/prototipo/` ([LEEME](prototipo/LEEME.md)). En `trazabilidad-*.js` está cómo cumple cada criterio de aceptación.
2. Abre la pantalla en `docs/prototipo/prototipo.html` en teléfono (360 px) y en modo Senior.
3. Arma la pantalla con lo que ya existe en `componentes/a11y/`. Crea un componente nuevo solo cuando lo usen dos pantallas; si lo usa una, vive junto a su página (`_componentes/`).
4. Copia los textos tal cual: trato de usted, botones que nombran la acción y su objeto ("Ya pagué, enviar mi comprobante"). Hacia el vecino se dice "Con retraso", nunca "moroso".
5. Un solo botón primario por pantalla. "Letra grande" y "Pedir ayuda" siempre en la misma posición de la barra superior.
6. Los estados de error, confirmación y éxito del prototipo son parte de la HU: se implementan y se prueban.

## 6. PWA

- `app/manifest.ts` (nombre, íconos, `display: standalone`, `start_url: "/"`) y un service worker escrito a mano en `public/sw.js`, sin librerías de PWA.
- **Sesión persistente** (HU-GAR-03): la cookie de sesión no caduca mientras se use; al abrir desde el ícono se entra directo al inicio.
- **Instantánea del padrón en la garita** (AC-4, HU-GAR-06): la tablet guarda en IndexedDB la lista de placas y el estado semafórico de cada predio, y los DNI solo como hash SHA-256 (nunca en claro). Se refresca en cada consulta con red y cada 15 min. Sin red, la consulta se resuelve con la instantánea y la pantalla dice "Dato de las 10:52 p. m.; puede no estar al día".
- **Cola local de cobros** (HU-COB-11, R-05): el cobro sin conexión se guarda en IndexedDB con su `idOperacion` y se muestra "Pendiente de enviar". Se envía en orden al volver la red (evento `online`) o al abrir la app. El servidor es idempotente por `idOperacion`, así que reintentar es seguro.
- IndexedDB nativo con un helper propio pequeño. Background Sync no se usa porque no funciona en Safari ni en Firefox.

## 7. Formularios accesibles

- Etiqueta visible en todo campo, con ejemplo y ayuda debajo (`aria-describedby`). El placeholder nunca reemplaza a la etiqueta.
- `autocomplete` correcto (`tel`, `name`, `one-time-code`, `current-password`, `new-password`), `inputmode="numeric"` para DNI y montos. Se permite pegar en todos los campos.
- Validación en el servidor siempre (zod) y en el cliente solo como ayuda. El error aparece junto al campo con `aria-invalid` y dice cómo corregir ("Al DNI le faltan 2 números"). Si hay varios, un resumen al inicio recibe el foco.
- Nunca se borra lo ya escrito al fallar. Lo que el sistema ya sabe llega rellenado (WCAG 3.3.7).
- Las acciones críticas (dinero, voto, queja, bajas) pasan por `componentes/a11y/Confirmacion` con un resumen y las opciones Confirmar y Cancelar (HU-ACC-03, WCAG 3.3.4).
- Los mensajes de estado usan `role="status"`; los avisos no desaparecen solos.
- Nada se opera arrastrando: el punto del incidente se elige tocando, escribiendo la dirección o con "Usar mi ubicación"; el zoom del mapa tiene botones (WCAG 2.5.7).
