# Fidelidad al prototipo · administración · ADM-PAD y ADM-ARC (padrón y privacidad)

Comparación de las 11 pantallas ADM-PAD y las 5 ADM-ARC con el prototipo de referencia, versión del 15 de octubre de 2026, con el mismo método y criterios que [vecino-acc.md](vecino-acc.md). Las rutas con sesión (el padrón, la ficha, actualizar, dar de baja y empadronar) están en `pruebas/e2e/soporte/actores.ts`, que `densidad.cy.ts` y `area-tactil.cy.ts` recorren con 0 pendientes; las pantallas de privacidad con una solicitud se midieron a mano con las semillas y dos solicitudes de ejemplo.

| Id | Pantalla | Estado | Objetivos normal | Objetivos grande | HU |
| --- | --- | --- | ---: | ---: | --- |
| ADM-PAD-01 | Padrón de viviendas y residentes | desviación justificada | 8 | 6 | HU-GAR-01 |
| ADM-PAD-02 | Ficha de la vivienda | desviación justificada | 4 | 4 | HU-GAR-10 CA3, HU-GAR-11 |
| ADM-PAD-03 | Empadronar · paso 1 de 3 (vivienda) | corregida | 6 | 6 | HU-GAR-01 CA1 |
| ADM-PAD-04 | Empadronar · paso 2 de 3 (residentes) | desviación justificada | 8 | 8 | HU-GAR-01 CA1 |
| ADM-PAD-05 | Empadronar · DNI ya registrado | igual | 8 | 8 | HU-GAR-01 CA3 |
| ADM-PAD-06 | Empadronar · paso 3 de 3 | igual | 3 | 3 | HU-GAR-01 CA2–CA3 |
| ADM-PAD-07 | Vivienda empadronada | igual | 3 | 3 | HU-GAR-01 CA2–CA3 |
| ADM-PAD-08 | Actualizar datos del predio · paso 1 de 2 | corregida | 4 | 4 | HU-GAR-10 CA1–CA2 |
| ADM-PAD-09 | Actualizar predio · paso 2 de 2 | igual | 3 | 3 | HU-GAR-10 CA2–CA3 |
| ADM-PAD-10 | Dar de baja a un residente · paso 1 de 2 | igual | 6 | 6 | HU-GAR-09 CA1 |
| ADM-PAD-11 | Dar de baja · paso 2 de 2 | igual | 3 | 3 | HU-GAR-09 CA2–CA3 |
| ADM-ARC-01 | Solicitudes de privacidad | corregida | 5 | 5 | HU-GAR-16 CA1–CA2 |
| ADM-ARC-02 | Resolver una rectificación | corregida | 6 | 6 | HU-GAR-13 CA2, HU-GAR-17 CA2 |
| ADM-ARC-03 | Rectificación · paso 2 de 2 | igual | 3 | 3 | HU-GAR-13 CA3, HU-GAR-16 CA3 |
| ADM-ARC-04 | Resolver una cancelación | corregida | 4 | 4 | HU-GAR-14 CA2–CA3 |
| ADM-ARC-05 | Cancelación · paso 2 de 2 | igual | 3 | 3 | HU-GAR-14 CA3 |

## Qué se corrigió

- **PAD-03 y PAD-08:** «¿Cuántos hay de cada uno?» dice lo que hay en una línea («1 familia · 1 auto o camioneta») con un solo botón «Cambiar las cantidades»; al abrirlo, cada concepto es una fila de selección con su número y «Listo» lo cierra (`ConceptosDelPredio`). Antes eran doce botones de más y menos. «¿Para qué se usa?» es una fila de selección con hoja (`SelectorEnHoja`).
- **ARC-01:** «Tipo de solicitud» es una fila de selección con hoja que cambia la dirección (`SelectorDeFiltro`, que también usa «Ver los incidentes como»).
- **ARC-01, 02 y 04:** las fechas dentro de una frase llevan el día en minúscula («recibida el viernes 16 de octubre de 2026», «el plazo legal vence el viernes 30 de octubre de 2026») como en el prototipo (`fechaEnFrase`).
- Se quitó el contador de botones `Contador`, que ya no usa ninguna pantalla.

## Desviaciones justificadas

- **PAD-01:** el prototipo deja el campo de búsqueda y la fila «Manzana» a la vista; con 5 viviendas por lista (R-11) eso pasa de 8 objetivos, así que el sitio los pone juntos detrás de «Filtrar» (la hoja lleva la búsqueda y las manzanas).
- **PAD-02 y PAD-03, cuota:** el prototipo muestra la cuota semanal calculada y «Cuota semanal» en la ficha; la cuota la calcula M5. Hasta entonces las pantallas muestran solo la ocupación. La ficha tampoco dice «También es parte del equipo» ni el estado de la garita, que dependen de la proyección de morosidad de M5.
- **PAD-04 y PAD-05, 8 objetivos en vista grande:** el paso de los residentes tiene los mismos controles que el del prototipo (casilla del DNI, DNI, nombre, WhatsApp, vista grande, agregar otra persona, revisar todo). **Para la autora: confirmar si R-11 debe contar los campos de un formulario; si es así, este paso necesita plegarse como «Foto y nombre» en el reporte.**
- **PAD-06, 09, 11 y ARC-03, 05, resumen:** las filas del resumen van una bajo otra (la etiqueta arriba, el dato abajo) y no en dos columnas, para que los datos largos no se corten en el teléfono.
- **PAD-02, extras:** la ficha muestra también triciclos, locales de negocio y placas, que son parte de la ocupación del predio.
