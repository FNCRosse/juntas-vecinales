# Fidelidad al prototipo · vecino · VEC-QUE y VEC-TRA (incidentes y transparencia)

Comparación de las 10 pantallas VEC-QUE y las 4 VEC-TRA con el prototipo de referencia, versión del 15 de octubre de 2026, con el mismo método y criterios que [vecino-acc.md](vecino-acc.md). Las rutas con sesión están en `pruebas/e2e/soporte/actores.ts`, que `densidad.cy.ts` y `area-tactil.cy.ts` recorren con 0 pendientes.

| Id | Pantalla | Estado | Objetivos normal | Objetivos grande | HU |
| --- | --- | --- | ---: | ---: | --- |
| VEC-QUE-01 | Incidentes · lista | corregida | 5 (con la guía a la vista) | 5 | HU-QUE-08, HU-ACC-07, HU-ACC-10 |
| VEC-QUE-02 | Incidentes · mapa | igual | 5 | 5 | HU-QUE-08 CA1–CA3 |
| VEC-QUE-03 | Incidentes · resumen por zona y tipo | desviación justificada | 5 | 5 | HU-ACC-07 CA2 |
| VEC-QUE-04 | Reportar un problema · paso 1 de 2 | desviación justificada | 8 | 6 | HU-QUE-01 CA1–CA2 |
| VEC-QUE-05 | Elegir el lugar | corregida | 5 | 5 | HU-ACC-09 CA4 |
| VEC-QUE-06 | Reportar un problema · paso 2 de 2 | corregida | 6 | 6 | HU-ACC-03 |
| VEC-QUE-07 | Reporte enviado | desviación justificada | 1 | 1 | HU-QUE-04, HU-QUE-02 |
| VEC-QUE-08 | Avance de mi reporte | igual | 1 | 1 | HU-QUE-09 |
| VEC-QUE-09 | Buscar con mi código | igual | 3 | 3 | HU-QUE-09 CA1 |
| VEC-QUE-10 | Reporte: faltan datos | desviación justificada | 8 | 6 | HU-QUE-01 CA3 |
| VEC-TRA-01 | Cuentas del barrio | desviación justificada | — | — | HU-COB-14 (M5) |
| VEC-TRA-02 | Actas y balances | corregida | 5 + «Ver más» | 3 + «Ver más» | HU-ASA-12 |
| VEC-TRA-03 | Balance de una actividad | corregida | 1 | 1 | HU-ASA-12 CA2 |
| VEC-TRA-04 | Noticias de la junta | corregida | 1 + «Escuchar» por noticia | 1 + «Escuchar» por noticia | HU-ACC-02, HU-ASA-15 |

## Qué se corrigió

- **QUE-01 a 03:** «Ver los incidentes como» es una fila de selección con la vista elegida y «Cambiar», que abre una hoja con Lista, Mapa y Resumen (`SelectorEnHoja`, C-20 del prototipo); la oferta de la guía ya no lleva la frase extra.
- **QUE-04:** el tipo de problema y el lugar se eligen en hojas; «Foto y nombre (opcional)» es una sección plegable en vista grande en el teléfono (`SeccionPlegable`); si falta la foto o la casilla, la sección se abre sola para mostrar el error.
- **QUE-05:** la manzana se elige en una hoja («Manzana o lugar», «Cambiar»), no en seis opciones a la vista.
- **QUE-06:** la revisión dice «Qué pasó», «Dónde» y «Foto y nombre», cada uno con su «Cambiar» (nuevo en `PasoConfirmacion`), «Sí, enviar mi reporte» y «Cancelar, no enviar».
- **TRA-02:** el texto del prototipo; cada tarjeta dice «Acta» o «Balance», su título y fecha, un resumen y un solo botón («Descargar acta (PDF)» o «Ver el balance»); van 5 (3 en vista grande) con «Ver más».
- **TRA-03:** «{fecha} · publicado por la directiva, no se puede modificar» y «Saldo final: S/ …».
- **TRA-04:** mientras la lectura en voz alta está apagada, un botón «Activar lectura en voz alta» con la frase del prototipo; si está activa y el teléfono no tiene voz en español, el aviso lo explica (`AvisoSinVoz`).

## Desviaciones justificadas

- **QUE-04 y QUE-10, casilla de la política:** la HU-QUE-01 CA1 de la v7 exige marcar la casilla; el prototipo la reemplaza por «Al enviarlo, acepta…» en la revisión. El sitio mantiene la casilla (dentro de «Foto y nombre» en vista grande, para no pasar de 6 objetivos) y la revisión lo repite. **Para la autora: decidir si se quita la casilla (prototipo) o se mantiene (v7).**
- **QUE-04, foto obligatoria:** el prototipo la llama «(opcional)», pero su propio mensaje de error dice «Falta una foto o video» y la HU-QUE-01 CA2–CA3 la exige; el sitio la exige.
- **QUE-03, columna «Otros»:** el resumen incluye «Otros», que el prototipo no tiene, porque «Otro problema» es una categoría del reporte.
- **QUE-01 y QUE-03, texto del total:** el prototipo dice «Los reportes sin nombre se muestran solo por manzana»; el sitio muestra todos solo por manzana y lo dice («Se muestran solo por manzana, sin la casa de quien reportó»).
- **QUE-07 y QUE-08, constancia en PDF:** el prototipo ofrece «Descargar constancia (PDF)»; no está en las HU-QUE-04 ni HU-QUE-09 y no se construyó (igual que la constancia de visitas).
- **QUE-09, código de ejemplo:** «Se parece a: Q-2026-00142-K7QM», que es el formato real del código; el del prototipo es de ejemplo.
- **TRA-01:** las cuentas del barrio dependen de los pagos (HU-COB-14, M5).
- **TRA-02, actas:** el prototipo resume los acuerdos en una línea y el PDF trae todo; el sitio hace lo mismo, así que los compromisos y las conclusiones solo están en el PDF.
