# Fidelidad al prototipo · vigilante · VIG (garita)

Comparación de las 12 pantallas VIG con el prototipo de referencia, versión del 15 de octubre de 2026, con el mismo método y criterios que [vecino-acc.md](vecino-acc.md). Las rutas con sesión (inicio, consultar, visitas, llegó una visita y bitácora) están en `pruebas/e2e/soporte/actores.ts`, que `densidad.cy.ts` y `area-tactil.cy.ts` recorren con 0 pendientes; los resultados de una consulta y los pasos de una visita se midieron a mano con las semillas.

| Id | Pantalla | Estado | Objetivos normal | Objetivos grande | HU |
| --- | --- | --- | ---: | ---: | --- |
| VIG-ENT-01 | Entrar a la tablet de la garita | desviación justificada | 4 | 4 | HU-GAR-21 CA2 |
| VIG-INI-01 | Inicio de la garita | corregida | 4 + visitas (hasta 2) y «Ver más» | 4 + visitas (hasta 1) y «Ver más» | HU-GAR-04, 07, 08 |
| VIG-CON-01 | Consultar placa: vecino al día | igual | 4 | 4 | HU-GAR-06 CA1 |
| VIG-CON-02 | Consultar placa: la reja no se abre sola | corregida | 5 | 5 | HU-GAR-06 CA2–CA3 |
| VIG-CON-03 | Consultar sin internet | igual | 3 | 3 | HU-GAR-06 CA1 |
| VIG-CON-04 | Abrir por emergencia · paso 2 de 2 | igual | 6 | 6 | HU-GAR-06 CA2 |
| VIG-VIS-01 | Llegó una visita (lista blanca) | corregida | 3 + visitas (hasta 4) y «Ver más» | 3 + visitas (hasta 2) y «Ver más» | HU-GAR-07 CA1 |
| VIG-VIS-02 | Visita anunciada: puede pasar | igual | 2 | 2 | HU-GAR-07 CA1 |
| VIG-VIS-03 | Visita no anunciada · paso 1 de 2 | desviación justificada | 8 | 8 | HU-GAR-07 CA2 |
| VIG-VIS-04 | Esperando la respuesta de la vecina | igual | 4 | 4 | HU-GAR-07 CA2 |
| VIG-VIS-05 | La vecina autorizó: anotar la entrada | igual | 3 | 3 | HU-GAR-07 CA3, HU-GAR-08 |
| VIG-BIT-01 | Bitácora de la garita | corregida | 3 + entradas (hasta 4) y «Ver más» | 3 + entradas (hasta 2) y «Ver más» | HU-GAR-08 CA1–CA3 |

## Qué se corrigió

- **INI-01, VIS-01 y BIT-01:** las visitas anunciadas y las entradas de la bitácora van en una lista corta con «Ver más» (cada una trae su botón «Llegó» o «Marcar salida»); sin tope, con varias visitas la pantalla pasaba de 8 objetivos. Del inicio se quitó «Ver la bitácora» de «Dentro del barrio ahora», que el prototipo no tiene y que repetía el acceso «Bitácora».
- **CON-02:** el texto es el del prototipo: «Vecino atrasado: no abrir», «No use la apertura de la reja para esta casa…», «Si le pregunta, dígale con amabilidad que la directiva le explica…», y el botón de emergencia dice «Es una emergencia: abrir la reja igual».
- **CON-01 a 03, sin resultados y baja:** «No encontramos a nadie con ese dato» y «Ya no vive en el barrio» (con «Registrar como visita») dicen lo mismo que el prototipo.

## Desviaciones justificadas

- **ENT-01:** igual que la entrada de la administración: DNI y clave de equipo, sin la opción de huella, rostro o PIN (ver [admin-equ-ent-ini-aud.md](admin-equ-ent-ini-aud.md)).
- **INI-01, turno:** el prototipo dice «turno de día, de 6:00 a. m. a 6:00 p. m.»; el sitio no guarda turnos de los vigilantes y muestra solo la fecha.
- **CON-02, «Llamar a la directiva (Marta Rojas)»:** el sitio no guarda un teléfono de la directiva para la garita; el vigilante tiene el de la administración en «Pedir ayuda».
- **VIS-03, 8 objetivos:** los mismos campos que el prototipo (nombre, DNI, casa, motivo, cómo llegó, placa) más los botones. **Para la autora: confirmar si R-11 cuenta los campos de un formulario** (es la misma pregunta de ADM-PAD-04 y DIR-QUE-08).
- **Constancias y PDF:** la garita no tiene constancias; no aplica.
