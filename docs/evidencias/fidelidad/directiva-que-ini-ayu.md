# Fidelidad al prototipo · directiva · DIR-QUE, DIR-INI y DIR-AYU (incidentes, resumen y ayuda)

Comparación de las 10 pantallas DIR-QUE, las 5 DIR-INI y la DIR-AYU-01 con el prototipo de referencia, versión del 15 de octubre de 2026, con el mismo método y criterios que [vecino-acc.md](vecino-acc.md). Las rutas con sesión están en `pruebas/e2e/soporte/actores.ts`, que `densidad.cy.ts` y `area-tactil.cy.ts` recorren con 0 pendientes; las que dependen de un reporte (evaluar, registrar lo que se hizo, derivar) se midieron a mano con las semillas y un reporte de ejemplo.

| Id | Pantalla | Estado | Objetivos normal | Objetivos grande | HU |
| --- | --- | --- | ---: | ---: | --- |
| DIR-INI-01 | Resumen de la directiva | desviación justificada | 5 | 5 | HU-QUE-04 CA2 |
| DIR-INI-02 | Alertas de la directiva | igual | 1 + alertas | 1 + alertas | HU-QUE-04 CA2 |
| DIR-INI-03 | Mi casa (vista de vecina) | igual | 3 a 4 | 3 a 4 | HU-ACC-01 CA1 |
| DIR-INI-04 | Más opciones de la directiva | igual | 2 | 2 | navegación |
| DIR-INI-05 | Historial de acciones | desviación justificada | — | — | HU-COB-15 CA3 (M5) |
| DIR-QUE-01 | Bandeja de incidentes | corregida | 4 (con un reporte; 8 con cinco) | 4 (6 con tres) | HU-QUE-04, HU-QUE-05 |
| DIR-QUE-02 | Evaluar el reporte · paso 1 de 2 | corregida | 3 (+ evidencias) | 3 (+ evidencias) | HU-QUE-05 |
| DIR-QUE-03 | Evaluar el reporte · paso 2 de 2 | igual | 3 | 3 | HU-QUE-05 CA2–CA3 |
| DIR-QUE-04 | Registrar lo que se hizo · paso 1 de 2 | corregida | 5 | 5 | HU-QUE-06 CA1 |
| DIR-QUE-05 | Cerrar como resuelto · paso 2 de 2 | igual | 3 | 3 | HU-QUE-06 CA2–CA3 |
| DIR-QUE-06 | Derivar a PNP o Municipalidad · paso 1 de 2 | igual | 5 | 5 | HU-QUE-07 CA1–CA2 |
| DIR-QUE-07 | Derivar · paso 2 de 2 | igual | 3 | 3 | HU-QUE-07 CA3 |
| DIR-QUE-08 | Reporte asistido · paso 1 de 2 | desviación justificada | 10 | 10 | HU-QUE-03 CA1–CA2 |
| DIR-QUE-09 | Reporte asistido · paso 2 de 2 | igual | 3 | 3 | HU-QUE-03, HU-QUE-04 CA1 |
| DIR-QUE-10 | Constancia con código de seguimiento | igual | 3 | 3 | HU-QUE-03 CA3 |
| DIR-AYU-01 | Pedidos de ayuda | corregida | 2 por pedido (2 pedidos + «Ver más») | 2 por pedido (1 pedido + «Ver más») | HU-ACC-04 CA2–CA3 |

## Qué se corrigió

- **QUE-01:** «Mostrar» es una fila de selección con hoja (`SelectorDeFiltro`) en lugar de un botón «Filtrar».
- **QUE-02, 04 y 08:** «¿Qué decide?», «Prioridad», «¿Qué medida se tomó?», «¿Qué problema es?» y «¿Dónde pasa?» son filas de selección con hoja (`SelectorEnHoja`); antes eran grupos de opciones a la vista y las pantallas pasaban de 8 objetivos.
- **AYU-01:** cada pedido pendiente trae «Llamar al {teléfono}» (nuevo `telefonosParaLlamar`, solo para la directiva y el mediador) junto a «Marcar como atendido»; la lista muestra 2 pedidos (1 en vista grande) con «Ver más» porque cada uno suma hasta 3 objetivos.

## Desviaciones justificadas

- **INI-01, bloques de M4 y M5:** «Crear o registrar», «Recaudación», «Estado de las casas» y «Próxima asamblea» llegan con esos módulos; mientras tanto el resumen ofrece los accesos para publicar un comunicado, un acta o un balance, que son de M2.
- **INI-05:** el historial de acciones depende de los cobros (HU-COB-15 y HU-COB-16, M5).
- **QUE-08, 10 objetivos:** el prototipo no tiene el campo «Referencia» ni la casilla de que el vecino aceptó la política; el sitio los mantiene (HU-QUE-03 pide el consentimiento del vecino). Es la misma pregunta que en ADM-PAD-04. **Para la autora: confirmar si R-11 cuenta los campos de un formulario y si la casilla de consentimiento del mediador puede ir en la constancia.**
- **QUE-01, botón de registrar por un vecino:** el prototipo lo llama «Vecino» con un «+»; el sitio dice «Registrar un reporte por un vecino», que se entiende sin el ícono.
- **AYU-01, «Lo atiendo yo»:** el prototipo solo tiene «Marcar como atendido»; el sitio conserva el paso «En atención» que pide la HU-ACC-04 CA3.
