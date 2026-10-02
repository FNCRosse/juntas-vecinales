# Matriz HU → código → pruebas

Generada por `npm run matriz` (`guiones/matriz-hu.mjs`) desde las etiquetas `@HU-…`. No se edita a mano.

- HU en el plan: 76 · cerradas: 6 · cerradas con e2e: 6 de 6 (100 %).
- Se listan las HU con casilla distinta de pendiente o con algo etiquetado.

| HU | Estado | Código | Unitarias | Integración | E2E |
| --- | --- | --- | --- | --- | --- |
| HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos (`Confirmacion`) | Cerrada | `componentes/a11y/Confirmacion.tsx` | `pruebas/unitarias/accesibilidad/perfilAccesibilidad.test.ts`<br>`pruebas/unitarias/nucleo/manejar.test.ts` | `pruebas/integracion/accesibilidad/perfil.test.ts` | `pruebas/e2e/accesibilidad/confirmacion.cy.ts` |
| HU-ACC-05 Conformidad WCAG 2.2 AA con auditoría axe bloqueante en el CI | Cerrada | `app/catalogo/layout.tsx`<br>`componentes/tokens/contraste.ts` | `pruebas/unitarias/accesibilidad/catalogo.test.ts`<br>`pruebas/unitarias/accesibilidad/tokens.test.ts` | — | `pruebas/e2e/accesibilidad/catalogo.cy.ts` |
| HU-ACC-06 Operación completa con teclado y lector de pantalla | Cerrada | `componentes/a11y/Dialogo.tsx`<br>`componentes/a11y/MarcoActor.tsx` | — | — | `pruebas/e2e/accesibilidad/teclado.cy.ts` |
| HU-ACC-08 Lenguaje llano en componentes y mensajes de error | Cerrada | `compartido/errores.ts` | `pruebas/unitarias/accesibilidad/lenguajeLlano.test.ts`<br>`pruebas/unitarias/nucleo/fechas.test.ts` | — | `pruebas/e2e/accesibilidad/lenguaje.cy.ts` |
| HU-ACC-09 Área táctil de 48 px (56 en Senior) y separación | Cerrada | `componentes/a11y/Boton.tsx`<br>`componentes/a11y/Opcion.tsx` | `pruebas/unitarias/accesibilidad/tokens.test.ts` | — | `pruebas/e2e/accesibilidad/area-tactil.cy.ts` |
| HU-GAR-01 Empadronar residente y enviarle su acceso inicial | Cerrada | `app/(administrador)/administracion/padron/empadronar/_componentes/AsistenteEmpadronar.tsx`<br>`modulos/identidad/aplicacion/consultarPadron.ts`<br>`modulos/identidad/aplicacion/emitirEnlace.ts`<br>`modulos/identidad/aplicacion/empadronar.ts`<br>`modulos/identidad/dominio/empadronamiento.ts`<br>`modulos/identidad/dominio/magicLink.ts`<br>`modulos/identidad/dominio/predio.ts` | `pruebas/unitarias/identidad/empadronamiento.test.ts` | `pruebas/integracion/identidad/empadronar.test.ts` | `pruebas/e2e/identidad/empadronar.cy.ts` |
| HU-ACC-01 Modo Senior guardado en la cuenta (enlaza el perfil de la fase 0b con `Usuario`) | Pendiente | `modulos/accesibilidad/aplicacion/cambiarModoSenior.ts`<br>`modulos/accesibilidad/aplicacion/obtenerPerfil.ts` | `pruebas/unitarias/accesibilidad/perfilAccesibilidad.test.ts` | `pruebas/integracion/accesibilidad/perfil.test.ts` | `pruebas/e2e/accesibilidad/letra-grande.cy.ts` |
| HU-GAR-03 Abrir desde el ícono del teléfono sin volver a entrar (PWA) | Pendiente | — | — | `pruebas/integracion/identidad/sesion.test.ts` | — |
| HU-GAR-24 Entrar con la clave de respaldo | Pendiente | `modulos/identidad/aplicacion/iniciarSesionConClave.ts` | `pruebas/unitarias/identidad/credencialRespaldo.test.ts` | `pruebas/integracion/identidad/sesion.test.ts` | `pruebas/e2e/identidad/entrada-equipo.cy.ts` |
| HU-GAR-21 Crear cuentas internas con rol | Pendiente | — | — | `pruebas/integracion/identidad/sesion.test.ts` | `pruebas/e2e/identidad/entrada-equipo.cy.ts` |
