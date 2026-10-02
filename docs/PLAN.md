# Plan de implementación

Orden cerrado: fase 0 → fase 0b → M1 → M2 → M3 → M4 → M5. Se implementan las 76 HU; cada una tiene **una sola casilla** en este plan, en la fase donde se cierra o se inicia. Dentro de cada módulo, el orden de la lista es el orden de trabajo (dependencias primero). Criterios y detalle de cada HU: `modulos/<m>/CLAUDE.md`.

Leyenda de la casilla: `[ ]` pendiente · `[x]` cerrada (anotar el número de PR) · `[~]` implementada en parte, se cierra en el módulo que indica su nota · `[-]` diferida, no se empieza antes del módulo que indica su nota. Una HU con nota `[~]` pasa a `[~]` al terminar su parte y a `[x]` en el módulo de cierre.

| Fase | HU asignadas | PR estimados |
| --- | ---: | ---: |
| 0 · Esqueleto, CI/CD y despliegue | 0 | 3–4 |
| 0b · Base de accesibilidad (M6) y núcleo compartido | 5 | 7–9 |
| M1 · Usuarios y Control de Acceso | 28 | 20–22 |
| M2 · Transparencia | 7 | 5–6 |
| M3 · Demandas e Incidentes | 11 | 9–10 |
| M4 · Asambleas y eventos pro fondos | 11 | 9–10 |
| M5 · Aportes Vecinales y Vigilancia | 14 | 13–15 |
| **Total** | **76** | **66–76** |

## Fase 0 · Esqueleto, CI/CD y despliegue

- [x] Next.js (App Router, TS estricto, Tailwind v4, ESLint, Prettier) con la estructura de [ARQUITECTURA.md](ARQUITECTURA.md); `GET /api/salud` que comprueba la BD.
- [x] Reglas de arquitectura en `eslint.config.mjs` y la prueba que demuestra que fallan.
- [x] Prisma con el esquema base y la primera migración (solo `nucleo_ejecuciones_worker`); `prisma migrate deploy` en el build de Vercel.
- [x] Worker con `GET /salud` y `POST /tareas/ejecutar` (secreto, advisory lock, registro de ejecución).
- [x] Jest, Supertest y Cypress + axe con una prueba de humo `@HU-INFRA` cada uno.
- [x] CI (`ci.yml`) con lint, tipos, Jest con cobertura ≥ 80 %, build y Cypress contra Postgres de Actions; checks obligatorios en `main`.
- [x] Cron del worker (`worker-cron.yml`). PR [#1](https://github.com/FNCRosse/juntas-vecinales/pull/1).
- [x] Vercel + Neon (rama por preview) + Render + R2 configurados; [DESPLIEGUE.md](DESPLIEGUE.md) con la configuración real.
- [x] Circuito probado: PR con preview y rama Neon, merge, producción y ejecución del cron registrada.

**Riesgos:** límites de Neon y Render con el cron cada 10 min; el arranque en frío de Render con el timeout del cron; la versión de Prisma decide cómo se declaran las URLs de conexión.

## Fase 0b · Base de accesibilidad (M6) y núcleo compartido

Tareas de base:
- [x] Tokens desde `docs/guia-visual/` a `componentes/tokens/`, modos Normal y Senior, Atkinson Hyperlegible; prueba de Jest de contraste; grep de hexadecimales en el CI (`npm run estilos`). PR [#5](https://github.com/FNCRosse/juntas-vecinales/pull/5).
- [x] `PerfilAccesibilidad` (dominio, persistencia y aplicación al renderizar) con un perfil por defecto. **Pendiente de enlazar en M1:** asociar el perfil a `Usuario` al autenticar (detalle en HU-ACC-01). PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9).
- [x] `componentes/a11y`: botón, campo con error, opción, diálogo y hoja (Radix), mensaje de estado, tarjeta, encabezado, barra por actor con "Letra grande" y "Pedir ayuda". PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9).
- [x] Layouts de los grupos de rutas con salto al contenido y anuncio de cambio de ruta (sin exigir sesión todavía: M1). PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9).
- [x] Núcleo: `compartido/auditoria` (tabla solo inserción) y `compartido/errores` con `manejar()` (PR [#6](https://github.com/FNCRosse/juntas-vecinales/pull/6)), `compartido/notificaciones` (cola, despacho en el worker, adaptador Meta + simulador; PR [#7](https://github.com/FNCRosse/juntas-vecinales/pull/7)), `compartido/archivos` (R2 firmado y validación; PR [#8](https://github.com/FNCRosse/juntas-vecinales/pull/8)). El PDF etiquetado (`pdf.ts`) y la tabla `nucleo_archivos` se crean con su primer uso (actas en M2, comprobantes en M5).
- [x] `guiones/matriz-hu.mjs` (`npm run matriz`) en el CI. PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9).
- [x] Catálogo interno de componentes (no se publica en producción) recorrido por Cypress + axe en ambos modos y tamaños. PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9). Evidencia: [F0b.md](evidencias/F0b.md).

HU que se cierran:
- [x] HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos (`Confirmacion`) — PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9)
- [x] HU-ACC-05 Conformidad WCAG 2.2 AA con auditoría axe bloqueante en el CI — PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9)
- [x] HU-ACC-06 Operación completa con teclado y lector de pantalla — PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9)
- [x] HU-ACC-08 Lenguaje llano en componentes y mensajes de error — PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9)
- [x] HU-ACC-09 Área táctil de 48 px (56 en Senior) y separación — PR [#9](https://github.com/FNCRosse/juntas-vecinales/pull/9)

**Pantallas:** ninguna de negocio; el catálogo interno. Estas RNF se verifican después en cada pantalla de M1–M5.
**Riesgos:** crear componentes que ninguna pantalla de M1 usa (no hacerlo); que el modo Senior parpadee si el perfil se lee en el cliente.

## M1 · Usuarios y Control de Acceso

Acceso y padrón:
- [x] HU-GAR-01 Empadronar residente y enviarle su acceso inicial
- [x] HU-GAR-02 Entrar con el enlace de acceso, aceptar la política y crear la clave de respaldo
- [x] HU-ACC-01 Modo Senior guardado en la cuenta (enlaza el perfil de la fase 0b con `Usuario`)
  - Enlazado: llave foránea, el perfil del dispositivo pasa a la cuenta al entrar (con enlace o con clave) y se lee por la sesión. Queda para sus HU: el switch "Letra grande" también en Mi perfil (VEC-ACC-13, con HU-GAR-13) y "Pedir ayuda" (`/mas/ayuda`, HU-ACC-04).
- [x] HU-GAR-03 Abrir desde el ícono del teléfono sin volver a entrar (PWA)
- [x] HU-GAR-11 Pedir un enlace nuevo
- [x] HU-GAR-24 Entrar con la clave de respaldo
- [x] HU-GAR-25 Restablecer la clave de respaldo

Equipo interno:
- [x] HU-GAR-21 Crear cuentas internas con rol
- [x] HU-GAR-22 Revocar el acceso de un miembro interno
- [x] HU-GAR-23 Reasignar el rol de un miembro interno

Padrón:
- [ ] HU-GAR-10 Actualizar los datos del predio de un residente — `[~]` se cierra en M5, cuando el cálculo de la cuota usa la ocupación nueva
- [ ] HU-GAR-09 Desvincular a un ex residente

Punto de entrada del vecino:
- [ ] HU-GAR-20 Centro de notificaciones unificado
- [ ] HU-GAR-18 Preferencias de notificación
- [ ] HU-ACC-04 Pedir ayuda humana desde cualquier pantalla
- [ ] HU-GAR-19 Panel de inicio consolidado — `[~]` se cierra en M5: M1 deja el panel y el bloque de avisos; M3, M4 y M5 añaden los bloques de queja, evento y deuda

Garita:
- [ ] HU-GAR-04 Pre-registrar visitas
- [ ] HU-GAR-05 Anular visitas
- [ ] HU-GAR-06 Consultar placa o DNI con semáforo (con la proyección de morosidad de M1 e instantánea sin conexión)
- [ ] HU-GAR-07 Verificar visitantes contra la lista blanca
- [ ] HU-GAR-08 Bitácora de entradas y salidas

Privacidad (ARCO) y contacto:
- [ ] HU-GAR-16 Bandeja ARCO del administrador con plazos
- [ ] HU-GAR-12 Copia de mis datos personales — `[~]` se cierra en M5: cada módulo añade su sección a la copia
- [ ] HU-GAR-13 Rectificación de datos
- [ ] HU-GAR-14 Cancelación de la cuenta — `[~]` se cierra en M5: cada módulo añade su anonimización
- [ ] HU-GAR-15 Oposición a mostrar la ubicación exacta — `[~]` se cierra en M3, cuando el mapa la aplica
- [ ] HU-GAR-17 Cambio de número de contacto verificado

Trazabilidad:
- [ ] HU-GAR-26 Log de auditoría global

**Pantallas:** ADM-ARC-01–05 · ADM-AUD-01 · ADM-ENT-01–02 · ADM-EQU-01–08 · ADM-INI-01 · ADM-PAD-01–11 · DIR-AYU-01 · DIR-COB-08 · DIR-INI-01–03 · VEC-ACC-01–16 · VEC-AYU-01–03 · VEC-COB-12–14 · VEC-GAR-01–06 · VIG-BIT-01 · VIG-CON-01–04 · VIG-ENT-01 · VIG-INI-01 · VIG-VIS-01–05.
**Riesgos:** plantillas de WhatsApp sin aprobar (el simulador permite avanzar); la vista previa de enlaces que consume el token (canje por POST); el semáforo de garita sin M5 (proyección propia en M1, la actualiza M5); el panel de inicio y ARCO dependen de módulos posteriores (composición en `app/`, cierre en M5); módulo grande: un PR por HU o por grupo acoplado.

## M2 · Transparencia y Rendición de Cuentas

- [ ] HU-ASA-15 Comunicados generales y feed comunitario
- [ ] HU-ACC-02 Escuchar en voz alta los comunicados del feed
- [ ] HU-ASA-11 Acta digital en PDF y su publicación
- [ ] HU-ASA-10 Balance de ingresos y egresos de actividades pro fondos
- [ ] HU-ASA-12 Historial público de actas y balances
- [ ] HU-COB-14 Balance agregado y anonimizado de la recaudación — `[-]` diferida a M5: necesita cuotas y pagos
- [ ] HU-COB-15 Exportar la recaudación a CSV — `[-]` diferida a M5: necesita cuotas y pagos

**Pantallas:** DIR-ASA-01, 10–18 · DIR-COB-19 · DIR-INI-01, 05 · DIR-TRA-01–05 · VEC-ACC-09 · VEC-ASA-09, 13 · VEC-AYU-03 · VEC-TRA-01–04.
**Riesgos:** el orden de módulos pone M2 antes de M4 y M5, de los que consume datos: las actas y balances se registran a mano con título y fecha (en M4 se enlazan a su asamblea o evento) y las dos HU de recaudación se hacen en M5. La evidencia de M2 lo declara.

## M3 · Demandas e Incidentes

- [ ] HU-QUE-01 Registrar una queja con consentimiento y evidencia
- [ ] HU-QUE-04 Ticket correlativo y aviso a la directiva (acoplada a la anterior)
- [ ] HU-QUE-02 Modo anónimo
- [ ] HU-QUE-03 Queja asistida por el mediador
- [ ] HU-QUE-09 Seguimiento por código
- [ ] HU-QUE-05 Admisibilidad
- [ ] HU-QUE-06 Acciones correctivas y cierre
- [ ] HU-QUE-07 Expediente y derivación a PNP o Municipalidad
- [ ] HU-QUE-08 Mapa de incidentes
- [ ] HU-ACC-07 Alternativa textual del mapa, imágenes e íconos
- [ ] HU-ACC-10 Tutorial guiado por sección — `[~]` se cierra en M5: M3 deja el mecanismo y el recorrido de Incidentes; M4 y M5 añaden Asambleas y Mi cuota

Al cerrar M3 también: cerrar la oposición de ubicación de M1, añadir el bloque de quejas al panel de inicio y la sección de quejas a la copia y la anonimización ARCO.

**Pantallas:** DIR-INI-01–02 · DIR-QUE-01–10 · VEC-ACC-08, 11 · VEC-ASA-01 · VEC-AYU-03 · VEC-COB-01 · VEC-QUE-01–04, 06–10.
**Riesgos:** fuga de identidad en anónimos (cifrado, avisos sin código ni detalle, ninguna pantalla que la revele); teselas de OpenStreetMap con su política de uso; videos pesados en R2.

## M4 · Asambleas y eventos pro fondos

- [ ] HU-ASA-01 Convocatoria con versión imprimible
- [ ] HU-ASA-02 Confirmar asistencia
- [ ] HU-ASA-03 Confirmación asistida por el mediador
- [ ] HU-ASA-04 Quórum proyectado en tiempo real
- [ ] HU-ASA-05 Contingencia por falta de quórum
- [ ] HU-ASA-06 Delegar el voto en un apoderado
- [ ] HU-ASA-07 Check-in presencial y quórum definitivo
- [ ] HU-ASA-13 Proponer un tema de agenda
- [ ] HU-ASA-14 Consolidar propuestas en la agenda
- [ ] HU-ASA-08 Modalidad de aporte en eventos pro fondos
- [ ] HU-ASA-09 Voluntariado

Al cerrar M4 también: bloque de próximo evento en el panel, recorrido guiado de Asambleas, sección de asambleas en ARCO y enlace de actas y balances de M2 con su asamblea o evento.

**Pantallas:** DIR-ASA-01–09, 12, 16–17 · DIR-INI-01–02 · VEC-ACC-09, 11 · VEC-ASA-01–07, 10–13.
**Riesgos:** votación digital: las pantallas VEC-ASA-07–09 del prototipo no tienen HU que pida votar desde la app; solo se implementa el efecto del check-in (votación habilitada o bloqueada según el quórum definitivo). El límite normativo de representaciones por apoderado debe confirmarlo la directiva (valor inicial: 2, como el prototipo).

## M5 · Aportes Vecinales y Vigilancia

- [ ] HU-COB-16 Conceptos y montos de la tarifa
- [ ] HU-COB-01 Cálculo semanal de la deuda y estado de cuenta (worker)
- [ ] HU-COB-02 Estado de cuenta privado
- [ ] HU-COB-08 Subir el comprobante de pago digital
- [ ] HU-COB-09 Auditar comprobantes
- [ ] HU-COB-10 Observar un comprobante con motivo
- [ ] HU-COB-12 Recibo digital en PDF
- [ ] HU-COB-11 Cobro en efectivo sin conexión
- [ ] HU-COB-07 Liquidar la deuda histórica y restituir la garita
- [ ] HU-COB-05 Alerta preventiva a la semana de retraso (worker)
- [ ] HU-COB-06 Moroso crítico a las 8 semanas y suspensión en garita (worker)
- [ ] HU-COB-03 Solicitud de ajuste de tarifa
- [ ] HU-COB-04 Auditar solicitudes de ajuste
- [ ] HU-COB-13 Tablero de recaudación

Al cerrar M5 también: las dos HU diferidas de M2, el bloque de deuda del panel (cierra el panel de inicio de M1 con su prueba de AC-2), el recálculo por cambio de ocupación (cierra la actualización del predio de M1), el recorrido guiado de Mi cuota (cierra el tutorial de M3), y las secciones de pagos en la copia y la anonimización ARCO (cierran las dos HU parciales de M1).

**Pantallas:** ADM-INI-01 · ADM-PAD-01–03, 08–09 · DIR-COB-01–18, 20–23 · DIR-INI-01–02, 05 · DIR-TRA-05 · VEC-ACC-09, 11 · VEC-COB-01–08, 10–15 · VEC-GAR-06 · VEC-TRA-01 · VIG-CON-01–03.
**Riesgos:** dinero duplicado al sincronizar (idempotencia por `idOperacionLocal` con `UNIQUE`); semanas y fechas límite en `America/Lima`; cambios de tarifa que no deben tocar cuotas ya emitidas; el tablero debe cuadrar al céntimo con los recibos; es el módulo con más trabajo diferido de otros.
