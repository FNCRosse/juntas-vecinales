# Fidelidad al prototipo

El frontend desplegado debe ser **igual o muy parecido** al prototipo de referencia ([prototipo/prototipo.html](prototipo/LEEME.md), versión del 15 de octubre de 2026). Si una pantalla del sitio y la del prototipo no coinciden, el defecto está en el sitio, salvo que este documento diga lo contrario.

## 1. Qué significa "igual o muy parecido"

Se compara cada pantalla en teléfono (360 px) en vista normal y en vista grande (Senior). Tiene que coincidir:

1. **Estructura y orden:** los mismos bloques en el mismo orden, el mismo título `<h1>`, un solo botón primario.
2. **Textos:** los mismos, palabra por palabra (trato de usted, botones que nombran la acción y su objeto). Se copian de `pantallas-*.js` o del propio prototipo, no se reescriben.
3. **Cantidad de objetivos:** no más de los del prototipo, y siempre dentro de R-11 (8 en normal, 6 en Senior, sin contar barra, encabezado ni selector de rol).
4. **Tamaños y separaciones:** salen de los tokens (48/56 px, 8/12 px, 24/32 px entre acciones opuestas). Una diferencia de unos pocos píxeles por el motor de render es aceptable; un botón más pequeño, más junto o en otro lugar no lo es.
5. **Navegación:** los mismos destinos en la barra, el mismo contenido del menú "Más", los mismos niveles (ninguna pantalla a más de 2 niveles bajo el inicio).
6. **Estados:** error, confirmación, éxito y "Listo. Deshacer" existen y se ven como en el prototipo.

No se exige copiar el HTML del prototipo ni sus estilos en línea: se reconstruye con `componentes/a11y/`, los tokens y Tailwind, como dice [FRONTEND.md §5](FRONTEND.md#5-de-una-pantalla-del-prototipo-a-código).

## 2. Qué cambió en el prototipo y el sitio todavía no lo tiene

Las reglas que mandan son estas (R-03 ya estaba en la [guía visual](guia-visual/guia-visual.md); R-03b, R-11 y R-12 son nuevas y se definen aquí hasta que se pasen a la guía):

- **R-03:** objetivos de 48 × 48 px (56 en Senior) con 8 px de separación (12 en Senior).
- **R-03b:** las acciones de resultado opuesto (aprobar/observar, sí/no, confirmar/cancelar) van apiladas en el teléfono, a 24 px como mínimo (32 en Senior).
- **R-11:** como máximo 8 objetivos de contenido por pantalla de teléfono en normal y 6 en Senior; no cuentan la barra de navegación, el encabezado ("Vista grande", "Pedir ayuda") ni el selector de rol. Las listas muestran 5 y "Ver más"; los filtros van en un botón "Filtrar" que abre una hoja; la barra inferior tiene como máximo 4 destinos.
- **R-12:** las acciones con dinero, voto, delegación, denuncia o baja piden **una sola** confirmación. Las reversibles se aplican al instante con "Listo" y "Deshacer", sin desaparecer por tiempo.

| Tema | Prototipo vigente | Sitio hoy | Dónde |
| --- | --- | --- | --- |
| Barra del vecino (teléfono) | Inicio · Mi cuota · Asambleas · Más, en normal y en Senior. "Mis reportes" y "Mis avisos" son atajos del inicio. Desde tablet se suma Incidentes | 5 destinos en normal; Incidentes solo se oculta en Senior | `componentes/a11y/BarraNavegacion.tsx` |
| Barra de la directiva (teléfono) | Resumen · Cobros · Incidentes · Más. Desde tablet suma Asambleas y Ayuda pedida; en escritorio, Cuentas | 5 destinos | ídem |
| Barra del administrador (teléfono) | Inicio · Padrón · Equipo · Más. Desde tablet, Privacidad y Auditoría en lugar de Más | 5 destinos | ídem |
| Garita | Inicio · Consultar · Visitas · Bitácora | Igual | — |
| Etiquetas de la barra | Una línea, sin partir palabras | `hyphens-auto` y `break-words` parten palabras | ídem |
| Menú "Más" del vecino | Lista plana: Mis visitas · Transparencia · Mi perfil y privacidad · Ayuda y accesibilidad · Cerrar sesión (más "Volver al selector", solo demostración, que no se implementa) | Hecho: 4 filas (Mis visitas, Transparencia, Mi perfil y privacidad, Ayuda y accesibilidad), sin descripciones, como el prototipo. Noticias y Avisos se abren desde el inicio, "Qué avisos recibo" desde Avisos y la guía rápida desde Ayuda y accesibilidad | `app/(vecino)/mas/page.tsx` |
| Botón del encabezado | **"Vista grande"** (antes "Letra grande") junto a "Pedir ayuda"; mismo lugar en todas las pantallas. Se cambia el texto visible y el nombre accesible; los nombres internos (`modoSenior`, rutas de la API) no se renombran | "Letra grande" (también en `Boton.tsx`, `modo.ts`, la ruta de perfil y los e2e `letra-grande.cy.ts`, `teclado.cy.ts`) | `componentes/a11y/Encabezado.tsx`, `InterruptorLetraGrande.tsx` |
| Primer ingreso | La guía pregunta "¿Cómo prefiere ver la aplicación?" con dos vistas previas; la grande viene marcada | Hecho: la guía tiene 4 pasos y el primero es la elección (vista grande marcada; al pulsar Siguiente sin tocar nada se aplica). Se vuelve a ver desde Ayuda y accesibilidad, "Primeros pasos" | `app/(vecino)/guia/`, `componentes/a11y/cambiarVista.ts` |
| Empadronar | Interruptor "Empezar con la vista grande (adulto mayor)" | Hecho: interruptor en el paso 2; la cuenta del titular nace con el perfil de vista grande dentro de la misma transacción y la auditoría lo registra | `app/(administrador)/administracion/padron/empadronar/`, `modulos/accesibilidad/aplicacion/cambiarModoSenior.ts` |
| Selector "Ver como" (doble rol) | Dos botones con separación de token; apilados en Senior | `CambiarDePerfil` (revisar separación y apilado) | `app/_sesion/CambiarDePerfil.tsx` |
| Acciones reversibles | Se aplican al instante y muestran "Listo" con "Deshacer", sin desaparecer solas | Hecho: `componentes/a11y/AvisoDeshacer.tsx` ("Listo.", Deshacer y Cerrar; no desaparece solo), en uso en Qué avisos recibo. Falta usarlo en las demás acciones reversibles (marcar como leído, confirmar asistencia, voz) | `componentes/a11y/AvisoDeshacer.tsx` |
| Acciones críticas | Una sola confirmación ("Revisar": "Sí, …" y "Cancelar" a 24 px, enlaces "Cambiar" por dato). Sin "Corregir algo" ni diálogos extra | `Confirmacion` (hoja con resumen); revisar que no haya un segundo diálogo | `componentes/a11y/Confirmacion.tsx` |
| Listas largas | 5 elementos y "Ver más"; filtros en un botón "Filtrar" que abre una hoja | Revisar listas de incidentes, padrón, auditoría | cada `page.tsx` |
| Acciones opuestas | Apiladas, a 24 px (32 en Senior): aprobar/observar, sí/no puede pasar, confirmar/cancelar | `AccionGarita` ya las apila | revisar las demás |
| Cobranza (M5) | Pago en 2 pantallas con "Todo lo pendiente" y el último medio preseleccionados; datos de pago solo del medio elegido | **No implementado** | `modulos/aportes/`, `app/(vecino)/cuota` |

La lista no es exhaustiva: es el punto de partida. La comparación pantalla por pantalla (sección 4) la completa.

**Hecho en el marco común (rama `hu/marco-comun-fidelidad`):** barras de 4 destinos en el teléfono para vecino, directiva y administrador (con más destinos desde la tablet), etiquetas sin partir (los destinos se reparten el ancho según su texto, con el token `text-barra`), botón "Vista grande", tokens `text-barra` y `spacing-opuestas`, prueba unitaria `barraNavegacion.test.ts` y e2e `barra-navegacion.cy.ts`. El menú "Más" del vecino quedó en 4 filas. Pendiente de esa fila: la directiva (le falta "Asambleas" cuando exista su ruta) y comprobar a mano, con sesión, el Más del vecino a 360 px en Senior.

## 3. Orden de trabajo

Una HU o un grupo pequeño de pantallas por rama y por PR, como siempre ([FLUJO_TRABAJO.md](FLUJO_TRABAJO.md)).

1. **Marco común (un PR):** `BarraNavegacion` con los destinos por dispositivo de la tabla; etiquetas sin partir; "Vista grande"; selector "Ver como". Prueba de Cypress que recorre las rutas reales de los cuatro actores y falla si un objetivo mide menos de 48/56 px o está a menos de 8/12 px de otro.
2. **Componentes nuevos (un PR):** `AvisoDeshacer`; revisión de `Confirmacion` para que sea una sola confirmación; hoja "Filtrar"; "Ver más".
3. **Perfil (un PR):** pregunta de primer uso, vista grande marcada por defecto, interruptor al empadronar.
4. **Pantallas ya construidas (M1 a M4), por actor:** compararlas con el prototipo (sección 4) y corregir. Primero el vecino, después directiva, administrador y garita.
5. **M5 Cobranza:** construirla directamente con el diseño vigente.
6. **Prueba de densidad (R-11):** `pruebas/e2e/accesibilidad/densidad.cy.ts` cuenta los objetivos de contenido de cada ruta real en 360 px, en normal y en Senior.

## 4. Cómo comparar una pantalla

1. Busque el id (`VEC-COB-02`) en `docs/prototipo/pantallas-*.js`: da el nombre y las HU.
2. Abra `docs/prototipo/prototipo.html`, elija el actor, reduzca la ventana a 360 px y llegue a la pantalla. Repita con "Vista grande".
3. Abra la misma pantalla del sitio (local o preview) con los mismos datos de las semillas y compare con la lista de la sección 1. Anote cada diferencia con su id.
4. Corrija la diferencia en el sitio. Si cree que el prototipo está mal, no lo corrija aquí: avise a la autora, porque el prototipo se rehace aparte.
5. Cada PR dice qué ids de pantalla deja iguales al prototipo.

## 5. Lo que no se copia

La sección "Demostración" del prototipo (semanas pendientes, hora de la asamblea, sin conexión) y la opción "Volver al selector de actor" son de demostración y no van en el sitio.
