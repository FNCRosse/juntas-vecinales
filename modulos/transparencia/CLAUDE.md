# M2 · Transparencia y Rendición de Cuentas (6 HU)

**Responsabilidad:** publicar de forma pública e inalterable lo que otros módulos producen: actas, balances de actividades, comunicados generales, el balance agregado de la recaudación y su respaldo exportable. Consume datos de M4 y M5; no participa en sus flujos.

**Puede importar:** la `aplicacion/` de `identidad`, `aportes`, `asambleas` y `accesibilidad`; `compartido/*`.

## Entidades (diagrama 02e)

`Publicacion` (abstracta: título, fechaPublicacion, autor, esInalterable) → `ActaDigital` (acuerdos, compromisos, conclusiones) · `BalanceFinanciero` (ingresosVirtuales, ingresosEnPuerta, egresos) · `ComunicadoGeneral` (cuerpo, urgencia) · `Egreso` (concepto, monto, comprobante) · `BalanceAgregadoRecaudacion` (periodo, totalRecaudado, totalMorosidad, egresosVigilancia) · `ExportacionContable` (rango, formato) · `FeedComunitario`.

Enum: `NivelUrgencia` (INFORMATIVO, URGENTE).

## Reglas de negocio

- Una publicación emitida es **inalterable**: la tabla rechaza UPDATE y DELETE una vez publicada (trigger). Toda corrección es una publicación nueva enlazada a la anterior (`corrigeA`), y el historial muestra ambas.
- Publicar notifica a toda la comunidad por la cola (ADR-006), respetando las preferencias de cada vecino; la copia interna siempre se escribe.
- El acta pasa por BORRADOR → APROBADA (por la directiva) → PUBLICADA; solo la publicada se notifica. El PDF es etiquetado y legible por lector de pantalla ([BACKEND.md §7](../../docs/BACKEND.md#7-adaptadores-externos)).
- El balance de una actividad: utilidad neta = ingresos virtuales + ingresos en puerta − egresos, en céntimos. Cada egreso lleva su comprobante en R2. El gráfico siempre va con su tabla equivalente.
- Mientras M4 no exista, actas y balances se registran con título y fecha; en M4 se enlazan a su asamblea o evento. Una asamblea sin quórum definitivo no admite registrar acuerdos (lo informa M4).
- El feed lista por fecha, los urgentes primero, de forma lineal y sin jerarquías. El historial público es visible para todo vecino con sesión.
- Con la lectura en voz alta activa en el perfil (M6), cada publicación del feed muestra "Escuchar" con controles de reproducir, pausar y detener (Web Speech API, voz `es-PE` o `es`). Si el navegador no tiene voz en español, el botón no aparece.
- **Balance agregado (invariante `garantizarNoIdentificacion`):** solo totales del periodo; ningún filtro accesible al vecino baja a nivel de lote, manzana o persona. Se calcula pidiendo a `aportes/aplicacion` los totales; nunca lee tablas de M5.
- La exportación es CSV ([BACKEND.md §7](../../docs/BACKEND.md#7-adaptadores-externos)) con los mismos totales y desgloses del tablero de recaudación de M5, y queda auditada (fecha y responsable).
- Las dos HU de recaudación se implementan al cerrar M5 (ver [PLAN](../../docs/PLAN.md)).

## Historias de usuario

† = el endpoint difiere del Anexo I; ver [ARQUITECTURA.md §8](../../docs/ARQUITECTURA.md#8-diferencias-entre-la-matriz-v7-de-hu-y-el-anexo-i). RNF = requisito no funcional en la v7.

| ID | Rol | Historia (quiero…) | Criterios de aceptación (v7) | Clases | Endpoint o servicio | Pantallas |
| --- | --- | --- | --- | --- | --- | --- |
| HU-COB-14 | Vecino | Consultar el balance agregado y anonimizado de la recaudación de la cuota de vigilancia del periodo | 1) El vecino visualiza el total recaudado, el total de morosidad y los egresos de vigilancia del periodo, sin desagregar por lote.<br>2) El sistema no permite, bajo ningún filtro accesible al vecino, identificar el estado financiero individual de otro residente.<br>3) El balance agregado se actualiza automáticamente con cada pago validado por la directiva. | BalanceAgregadoRecaudacion | GET /api/transparencia/balance-agregado | VEC-TRA-01, DIR-TRA-01, DIR-TRA-02, DIR-TRA-03 |
| HU-COB-15 | Directiva | Exportar el historial de recaudación a un archivo Excel o CSV | 1) La directiva puede generar la exportación filtrando por rango de fechas y estado de pago.<br>2) El archivo exportado incluye los mismos totales y desgloses mostrados en el dashboard consolidado (HU-COB-13).<br>3) La exportación queda registrada en el historial de acciones de la directiva, con fecha y usuario responsable. | ExportacionContable.generar() | GET /api/transparencia/exportar | DIR-COB-19, DIR-INI-05, DIR-TRA-01 |
| HU-ASA-10 | Directiva | Registrar los ingresos y egresos de las actividades pro-fondos | 1) El sistema permite desglosar ingresos (virtuales y en puerta) y registrar egresos con comprobantes adjuntos.<br>2) Genera automáticamente un gráfico de ingresos, costos operativos y utilidad neta.<br>3) El balance consolidado se publica de forma inalterable en el módulo de transparencia del feed vecinal. | BalanceFinanciero, Egreso | POST /api/transparencia/balances | VEC-TRA-03, DIR-ASA-12, DIR-ASA-13, DIR-ASA-16, DIR-ASA-17, DIR-ASA-18, DIR-TRA-01, DIR-TRA-03, DIR-TRA-04, DIR-TRA-05 |
| HU-ASA-11 | Directiva | Asentar los acuerdos y deliberaciones para generar el acta digital en PDF | 1) La plataforma permite redactar los puntos aprobados, compromisos y conclusiones adoptadas en asamblea.<br>2) El sistema compila la información y genera un PDF descargable con formato oficial del acta.<br>3) Tras la aprobación de la directiva, el acta se publica en el feed y notifica a todos los vecinos registrados. | ActaDigital.generarPDF(), publicar() | POST /api/transparencia/actas | VEC-ASA-09, VEC-TRA-02, DIR-ASA-10, DIR-ASA-11 |
| HU-ASA-12 | Vecino | Consultar el historial público de actas y balances de asambleas y eventos anteriores | 1) El vecino accede a un listado histórico de actas y balances ordenado por fecha.<br>2) Cada registro muestra el detalle de ingresos, egresos y saldo final del evento correspondiente.<br>3) La información es de acceso público para todos los vecinos autenticados en la plataforma. | FeedComunitario.historialPublico() | GET /api/transparencia/historial | VEC-ASA-13, VEC-TRA-02, VEC-TRA-03 |
| HU-ASA-15 | Directiva | Publicar un comunicado general a la comunidad no ligado a una asamblea o evento específico | 1) La directiva puede redactar y publicar un comunicado desde un módulo independiente al de convocatorias de asamblea.<br>2) El comunicado se publica automáticamente en el feed comunitario y genera una notificación en el centro de notificaciones de cada vecino.<br>3) El sistema permite clasificar el comunicado por urgencia (informativo o urgente) para priorizar su visibilidad. | ComunicadoGeneral, NivelUrgencia | POST /api/transparencia/comunicados | VEC-ACC-09, VEC-TRA-04, DIR-ASA-01, DIR-ASA-14, DIR-ASA-15, DIR-ASA-16, DIR-INI-01 |

## Pantallas

Id y nombre en el prototipo ([cómo abrirlas](../../docs/prototipo/LEEME.md)):

`DIR-ASA-01` Asambleas: quórum proyectado · `DIR-ASA-10` Acta de la asamblea · paso 1 de 2 · `DIR-ASA-11` Publicar acta · paso 2 de 2 · `DIR-ASA-12` Pro-fondos: ingresos, gastos y voluntarios · `DIR-ASA-13` Publicar balance pro-fondos · paso 2 de 2 · `DIR-ASA-14` Comunicado a la comunidad · paso 1 de 2 · `DIR-ASA-15` Comunicado · paso 2 de 2 · `DIR-ASA-16` Crear: asamblea, actividad, comunicado o movimiento · `DIR-ASA-17` Nueva actividad pro-fondos · paso 1 de 2 · `DIR-ASA-18` Nueva actividad pro-fondos · paso 2 de 2 · `DIR-COB-19` Exportar a Excel o CSV · `DIR-INI-01` Resumen de la directiva · `DIR-INI-05` Historial de acciones (solo lectura) · `DIR-TRA-01` Rendición de cuentas · `DIR-TRA-02` Publicar rendición · paso 2 de 2 · `DIR-TRA-03` Registrar un ingreso o gasto · paso 1 de 2 · `DIR-TRA-04` Registrar un ingreso o gasto · paso 2 de 2 · `DIR-TRA-05` Ingresos y gastos (movimientos) · `VEC-ACC-09` Inicio · `VEC-ASA-09` Voto registrado · `VEC-ASA-13` Actividades pro-fondos · `VEC-TRA-01` Cuentas del barrio · `VEC-TRA-02` Actas y balances · `VEC-TRA-03` Balance de una actividad · `VEC-TRA-04` Noticias de la junta (con lectura en voz)
