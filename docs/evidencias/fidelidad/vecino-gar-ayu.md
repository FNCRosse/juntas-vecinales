# Fidelidad al prototipo · vecino · VEC-GAR y VEC-AYU (visitas y ayuda)

Comparación de las 6 pantallas VEC-GAR y las 3 VEC-AYU con el prototipo de referencia, versión del 15 de octubre de 2026, con el mismo método y los mismos criterios que [vecino-acc.md](vecino-acc.md). Las rutas con sesión están en `pruebas/e2e/soporte/actores.ts`, que `densidad.cy.ts` y `area-tactil.cy.ts` recorren con 0 pendientes.

| Id | Pantalla | Estado | Objetivos normal | Objetivos grande | HU |
| --- | --- | --- | ---: | ---: | --- |
| VEC-GAR-01 | Mis visitas | corregida | 1 + 1 por visita (5 como máximo) + «Ver más» | 1 + 1 por visita (3 como máximo) + «Ver más» | HU-GAR-05 CA1 |
| VEC-GAR-02 | Registrar una visita | corregida | 8 | 6 (más 3 con la sección abierta, a decisión de la persona) | HU-GAR-04 CA1 |
| VEC-GAR-03 | Visita registrada | desviación justificada | 1 | 1 | HU-GAR-04 CA3 |
| VEC-GAR-04 | Anular una visita | igual | 2 | 2 | HU-GAR-05 CA2–CA3 |
| VEC-GAR-05 | Visita no anunciada en la garita | corregida | 2 | 2 | HU-GAR-07 CA2–CA3 |
| VEC-GAR-06 | Visitas en pausa (8 semanas) | desviación justificada | 2 | 2 | HU-GAR-04 CA2 |
| VEC-AYU-01 | Pedir ayuda a una persona | igual | 5 | 5 | HU-ACC-04 CA1–CA2 |
| VEC-AYU-02 | Pedido de ayuda enviado | igual | 1 | 1 | HU-ACC-04 CA2–CA3 |
| VEC-AYU-03 | Ayuda y accesibilidad | corregida | 4 | 4 | HU-ACC-01, 02, 10, 04 |

## Qué se corrigió

- **GAR-01:** las visitas programadas van en una lista de 5 (3 en vista grande) con «Ver más».
- **GAR-02:** el orden es el del prototipo (nombre, fecha y hora de llegada) y el DNI y el vehículo van en «Agregar DNI o vehículo (opcional)», una sección plegable que se pliega en vista grande en el teléfono; así no pasa de 6 objetivos. Se crearon `SeccionPlegable` (C-21 del prototipo) y `useVistaGrandeEnTelefono`, que `Preferencias` también usa.
- **GAR-03:** el texto agrega «Cuando llegue, le avisaremos.».
- **GAR-05:** «No la conozco, que no pase» va antes que «Sí, dejarla pasar», como en el prototipo, a 24 px (32 en vista grande); se quitó «Ir a Mis visitas», que el prototipo no tiene.
- **AYU-03:** una sola sección «Cómo se ve y se escucha» con «Vista grande» y «Leer en voz alta las noticias» («Aparece el botón Escuchar en cada noticia.»); las guías dicen «Ver la guía» (el nombre de la guía queda en el texto para el lector de pantalla); se quitó el botón «Pedir ayuda a una persona» del cuerpo, porque «Pedir ayuda» ya está en el encabezado.
- `densidad.cy.ts` y `area-tactil.cy.ts` suman `/visitas/nueva` y `/mas/ayuda`.

## Desviaciones justificadas

- **GAR-03, constancia en PDF:** el prototipo ofrece «Descargar constancia (PDF)». Ni la HU-GAR-04 ni sus criterios piden ese archivo; la constancia se ve en pantalla, con su número. **Para la autora:** si se quiere el PDF, es una HU nueva.
- **GAR-05, «Prefiero llamar a la garita»:** el prototipo lo muestra como enlace; el sitio dice «Si prefiere, llame a la garita y dígale al vigilante qué hacer.» porque no hay un teléfono de la garita guardado. Se agrega cuando el equipo lo configure.
- **GAR-05, género:** el prototipo dice «lo» porque la visita de ejemplo es un hombre; el sitio dice «la» porque «visita» es femenino y no conoce el género de la persona.
- **GAR-06:** el prototipo muestra la deuda en soles y «Ver cómo ponerme al día», que llevan a M5. Hasta entonces el botón dice «Hablar con la directiva».
- **AYU-02, destinatario:** el prototipo siempre dice «Pedro Chávez»; el sitio dice el nombre de quien atiende ese día.
