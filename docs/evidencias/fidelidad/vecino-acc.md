# Fidelidad al prototipo · vecino · VEC-ACC (acceso, inicio, avisos y perfil)

Comparación de las 16 pantallas VEC-ACC con el prototipo de referencia, versión del 15 de octubre de 2026, siguiendo [FIDELIDAD_PROTOTIPO.md §1](../../FIDELIDAD_PROTOTIPO.md): estructura y orden, textos, cantidad de objetivos, tamaños y separaciones por token, navegación y estados.

**Método.** Los textos y los objetivos del prototipo se sacaron de su fuente vigente (el `prototipo.html` de este repositorio todavía es la versión anterior y se regenera aparte). Los del sitio, de la página renderizada con las semillas, en vista normal y en vista grande a 360 px. Los objetivos cuentan enlaces, botones y campos de `<main>` (no la barra, el encabezado ni el selector de perfil), como R-11. Las rutas de sesión están además en `pruebas/e2e/soporte/actores.ts`, que `densidad.cy.ts` y `area-tactil.cy.ts` recorren con 0 pendientes.

| Id | Pantalla | Estado | Objetivos normal | Objetivos grande | HU |
| --- | --- | --- | ---: | ---: | --- |
| VEC-ACC-01 | Entrar con enlace mágico | corregida | 3 | 3 | HU-GAR-02 CA1 |
| VEC-ACC-02 | Cómo cuidamos sus datos | igual | 3 | 3 | HU-GAR-02 CA2 |
| VEC-ACC-03 | Clave de respaldo (opcional) | igual | 5 | 5 | HU-GAR-02 CA3 |
| VEC-ACC-04 | Pedir un enlace nuevo | corregida | 4 | 4 | HU-GAR-11 CA1–CA3 |
| VEC-ACC-05 | Entrar con mi clave | corregida | 6 | 6 | HU-GAR-24 CA1–CA2 |
| VEC-ACC-06 | Entrada con clave en pausa | desviación justificada | 3 | 3 | HU-GAR-24 CA3 |
| VEC-ACC-07 | Crear una clave nueva | igual | 3 | 3 | HU-GAR-25 CA1–CA3 |
| VEC-ACC-08 | Guía de primer uso · elegir cómo ver la aplicación | corregida | 5 | 5 | HU-ACC-01 CA4, HU-GAR-03 |
| VEC-ACC-09 | Inicio | desviación justificada | 3 a 5 | 3 a 5 | HU-GAR-19 CA1–CA3 |
| VEC-ACC-10 | Inicio sin conexión | desviación justificada | — | — | HU-GAR-19 CA3 |
| VEC-ACC-11 | Avisos | igual | 8 (con 5 avisos) | 6 (con 3 avisos) | HU-GAR-20 |
| VEC-ACC-12 | Qué avisos recibo | corregida | 7 | 6 | HU-GAR-18 |
| VEC-ACC-13 | Mi perfil y privacidad | corregida | 6 | 6 | HU-GAR-12, 15; HU-ACC-01 |
| VEC-ACC-14 | Corregir un dato | corregida | 3 (5 con el dato elegido) | 3 (5) | HU-GAR-13, 17 |
| VEC-ACC-15 | Cancelar mi cuenta | igual | 6 | 6 | HU-GAR-14 CA1 |
| VEC-ACC-16 | Más opciones | igual | 6 | 6 | navegación |

## Qué se corrigió

- **ACC-01:** el texto dice «Llegó aquí con un enlace mágico: es el enlace que le mandamos por WhatsApp y que le deja entrar sin clave…». Se dice «le» y no «la» porque el sitio no sabe el género de la persona.
- **ACC-04:** «No tengo WhatsApp: entrar con mi clave» es un enlace sin texto de apoyo.
- **ACC-05:** sin ayudas extra bajo el DNI ni la clave; el botón dice «Entrar» y el enlace «Olvidé mi clave». La pantalla de entrada del equipo conserva sus ayudas hasta que se compare con su prototipo (ADM-ENT).
- **ACC-08:** el paso 3 agrega «Su teléfono le preguntará si desea agregarla.»; el último botón dice «Terminar y empezar»; se quitó la línea «Puede volver a verla desde Más…», que el prototipo no tiene.
- **ACC-09 Inicio:** saluda «Hola, {nombre}» con la fecha (sin vivienda ni «Buenas noches»); suma la tarjeta «{nombre} está en la garita y pregunta por usted» con «Responder» (HU-GAR-07 CA2); el orden es Mis reportes, Mis avisos y una tarjeta «Noticias de la junta» con el último título; en vista grande, lo que pasa de 3 va detrás de «Ver más». Mis reportes dice «Ninguno abierto» o «N abierto(s)» con su número, categoría y estado. Se quitaron las dos tarjetas de noticias con «Escuchar» y «Ver todas las noticias», que superaban R-11.
- **ACC-12:** los textos son los del prototipo («Cada cambio se guarda solo y vale desde el próximo aviso.», «El cambio vale desde el próximo aviso.», «Avisos importantes de la reja y de seguridad»). En vista grande y en el teléfono las seis opciones van en dos grupos plegables, «WhatsApp, pagos y asambleas» y «Mi casa y el barrio», con uno abierto a la vez.
- **ACC-13:** sin «Volver a Más opciones» (la barra ya lleva a Más); «Descargar una copia de mis datos»; suma «Qué avisos recibo» y el título «Si ya no vive en el barrio».
- **ACC-14:** «¿Qué dato quiere corregir?» es un selector que abre una hoja (`SelectorEnHoja`, C-20 del prototipo) en lugar de cuatro opciones a la vista; la opción de la vivienda dice «Mi dirección».

## Desviaciones justificadas

- **ACC-04, mensaje de éxito:** el prototipo dice «Revise su WhatsApp terminado en 245». El sitio responde siempre lo mismo, exista o no el DNI en el padrón («Si sus datos están en el padrón, le enviamos un enlace»), para no revelar quién vive en el barrio (R-01).
- **ACC-05 y ACC-06, errores y pausa:** el prototipo dice «3 veces seguidas»; la HU-GAR-24 CA3 de la v7 dice cinco intentos, y el sitio sigue la v7. El error de clave no dice si falló el DNI o la clave. **Para la autora:** el prototipo debería decir cinco, o la HU cambiarse a tres.
- **ACC-09, cuota, asamblea y actividad:** sus tarjetas dependen de M5 y M4 y se suman al construir esos módulos, en el orden del prototipo. «Ver más» ya admite el umbral de cada vista (5 en normal, 3 en grande).
- **ACC-10 Inicio sin conexión:** depende de la cola local de cobros (HU-COB-11, M5).
- **ACC-13, vivienda:** el prototipo agrega «· casa + 1 inquilino»; el sitio muestra solo la dirección hasta que el padrón exponga esa descripción en el perfil.
- **ACC-14, documento de respaldo:** el prototipo adjunta una foto del DNI; el sitio ofrece un campo de texto «Por qué hay que corregirlo (opcional)» porque la subida de archivos llega con R2.
- **ACC-11:** cada aviso muestra su título y su texto, porque el aviso real los tiene; el prototipo muestra una sola línea.
- **ACC-16:** «Volver al selector de actor (demostración)» no se implementa; es de demostración.
