# Prototipo de referencia

Copia de trabajo del prototipo navegable de alta fidelidad del Resultado R2.3 (170 pantallas, cuatro actores). Es la referencia visual y de textos para implementar cada pantalla; no es código de la aplicación y no se importa desde `app/` ni `componentes/`. El original es el prototipo en Figma (R2.3), de solo lectura: <https://www.figma.com/design/D8ENPs7zwoO5YBbbJvmvgu/Plataforma-Junta-Vecinal-%C2%B7-Prototipos-R2.3>.

| Archivo | Qué es |
| --- | --- |
| `prototipo.html` | El prototipo completo en un solo archivo, funciona sin conexión |
| `pantallas-vec.js`, `-dir.js`, `-adm.js`, `-vig.js` | Inventario por actor: id de la pantalla, código interno del prototipo, nombre y HU con criterios que cubre (67, 62, 29 y 12 pantallas) |
| `trazabilidad-vec.js`, `-dir.js`, `-adm.js`, `-vig.js` | Por HU y criterio: en qué pantallas y **cómo** se cumple |
| `tokens.css` | Tokens con los que se dibujó el prototipo. Versión anterior: la fuente vigente es [`../guia-visual/tokens.json`](../guia-visual/tokens.json) |
| `icono.js`, `support.js` | Soporte de ejecución del prototipo (íconos Lucide y motor de plantillas) |

## Cómo abrirlo

1. Abre `docs/prototipo/prototipo.html` con doble clic (Chrome o Edge) o en el navegador integrado de Claude Code con `file:///C:/dev/juntas-vecinales/docs/prototipo/prototipo.html`.
2. Elige el actor en el selector inicial (vecino, directiva, administrador o vigilante).
3. Usa "Letra grande" en la barra superior para ver la variante Senior, y reduce el ancho de la ventana a 360 px para ver la de teléfono.
4. La sección "Demostración" (semanas pendientes, hora de la asamblea, sin conexión) cambia el estado de los datos ficticios; no forma parte del producto.

## Cómo encontrar una pantalla por id

Los ids tienen la forma `<ACTOR>-<MÓDULO>-<nn>` (`VEC-COB-01`).

1. Busca el id en el inventario del actor: `grep -n "VEC-COB-01" docs/prototipo/pantallas-vec.js`. Obtienes su nombre ("Mi cuota"), que es el título `<h1>` de la pantalla, y las HU y criterios que cubre.
2. Llega a ella por la barra de navegación del actor, según la estructura de [FRONTEND.md §1](../FRONTEND.md#1-grupos-de-rutas-por-actor): el módulo del id indica el destino (COB → Mi cuota o Cobros, ASA → Asambleas, QUE → Incidentes, GAR y TRA → Más, PAD → Padrón, EQU → Equipo, ARC → Privacidad, CON / VIS / BIT → Consultar, Visitas, Bitácora).
3. Para saber qué debe cumplir: `grep -n "VEC-COB-01" docs/prototipo/trazabilidad-vec.js`.
4. La lista de pantallas por módulo, con nombre, está al final de cada `modulos/<m>/CLAUDE.md`.

Los nombres de personas, lotes, DNI y placas del prototipo son ficticios y son los mismos de las semillas ([DATOS.md §5](../DATOS.md#5-semillas-ficticias)).
