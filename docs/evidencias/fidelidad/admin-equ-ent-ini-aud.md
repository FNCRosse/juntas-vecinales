# Fidelidad al prototipo · administración · ADM-EQU, ADM-ENT, ADM-INI y ADM-AUD

Comparación de las 8 pantallas ADM-EQU, las 2 ADM-ENT, las 2 ADM-INI y la ADM-AUD con el prototipo de referencia, versión del 15 de octubre de 2026, con el mismo método y criterios que [vecino-acc.md](vecino-acc.md). Las rutas con sesión están en `pruebas/e2e/soporte/actores.ts`, que `densidad.cy.ts` y `area-tactil.cy.ts` recorren con 0 pendientes.

| Id | Pantalla | Estado | Objetivos normal | Objetivos grande | HU |
| --- | --- | --- | ---: | ---: | --- |
| ADM-ENT-01 | Entrar como parte del equipo | desviación justificada | 4 | 4 | HU-GAR-21 CA2 |
| ADM-ENT-02 | Crear el acceso de equipo (invitación) | desviación justificada | 4 | 4 | HU-GAR-21 CA2 |
| ADM-INI-01 | Panel de administración | corregida | 2 | 2 | HU-GAR-16 CA2, HU-GAR-26 CA1 |
| ADM-INI-02 | Más opciones | corregida | 3 | 3 | navegación |
| ADM-EQU-01 | Cuentas del equipo y permisos por rol | corregida | 6 (con 5 personas) | 5 (con 3 personas) | HU-GAR-21, 22, 23 |
| ADM-EQU-02 | Agregar a una persona · paso 1 de 2 | corregida | 7 | 7 | HU-GAR-21 CA1 |
| ADM-EQU-03 | Agregar · paso 2 de 2 | igual | 3 | 3 | HU-GAR-21 CA2–CA3 |
| ADM-EQU-04 | Invitación enviada | igual | 2 | 2 | HU-GAR-21 CA2–CA3 |
| ADM-EQU-05 | Cambiar rol · paso 1 de 2 | igual | 5 | 5 | HU-GAR-23 CA1–CA2 |
| ADM-EQU-06 | Cambiar rol · paso 2 de 2 | igual | 3 | 3 | HU-GAR-23 CA2–CA3 |
| ADM-EQU-07 | Quitar acceso · paso 1 de 2 | igual | 5 | 5 | HU-GAR-22 CA1–CA2 |
| ADM-EQU-08 | Quitar acceso · paso 2 de 2 | igual | 3 | 3 | HU-GAR-22 CA2–CA3 |
| ADM-AUD-01 | Auditoría global (solo lectura) | corregida | 2 | 2 | HU-GAR-26 CA1–CA3 |

## Qué se corrigió

- **INI-01:** el panel sigue el prototipo: saludo, fecha, la alerta de las solicitudes que vencen pronto, «Para atender», «Lista de la garita» (casas al día y atrasadas, con la última sincronización) y «Últimas acciones» con el botón «Ver toda la auditoría».
- **INI-02:** «Más opciones» lista Solicitudes de privacidad y Auditoría sin textos de apoyo, como el prototipo.
- **EQU-01:** cada persona tiene un solo botón «Gestionar acceso» que abre la hoja «Acceso de {nombre}» con su cargo y sus acciones («Cambiar rol», «Quitar acceso» y, para la administración, «Roles de directiva»).
- **EQU-02:** «¿Qué rol tendrá?» es una fila de selección con hoja (`SelectorEnHoja`); antes eran tres opciones a la vista y la pantalla pasaba de 8 objetivos.
- **AUD-01:** la hoja de filtros se llama «Filtrar auditoría».

## Desviaciones justificadas

- **ENT-01, usuario y clave:** el prototipo pide un usuario (el correo de la junta) y ofrece entrar con huella, rostro o PIN. El sitio entra con el DNI y la clave de equipo, que ya cumple WCAG 3.3.8, y la llave de acceso no se implementa mientras la autora no la pida (`modulos/identidad/CLAUDE.md`). **Para la autora: la opción de huella queda fuera.**
- **ENT-01, «Es mi primera vez» y «Olvidé mi clave»:** el sitio no los muestra; quien entra por primera vez llega desde la invitación por WhatsApp, y quien olvidó su clave la pide a la administración (el texto de la pantalla lo dice).
- **ENT-02:** la pantalla de crear el acceso del equipo es la de la invitación (con su enlace); solo ofrece la clave de 12 caracteres, no la llave.
- **INI-01, plazo:** la alerta dice «Resuélvala antes de que venza el plazo legal.»; el detalle de los días queda en la bandeja de privacidad.
- **AUD-01, filtros:** la hoja trae el módulo, el responsable y el tipo de acción, porque la HU-GAR-26 CA2 pide filtrar por acción; el prototipo no tiene el tipo de acción.
- **EQU-03, 06, 08, resumen:** las filas del resumen van una bajo otra, igual que en las demás pantallas de revisión (ver [admin-pad-arc.md](admin-pad-arc.md)).
