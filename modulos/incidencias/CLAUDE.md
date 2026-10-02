# M3 · Incidencias: Demandas e Incidentes (9 HU)

**Responsabilidad:** quejas e incidentes vecinales: registro con consentimiento y evidencia, anonimato, ruta asistida, ticket y seguimiento, admisibilidad, acciones correctivas, derivación a entidades externas y mapa de incidentes.

**Puede importar:** la `aplicacion/` de `identidad` y `accesibilidad`; `compartido/*`.

## Entidades (diagrama 02d)

`Queja` (codigoTicket, categoria, descripcion, ubicacion, esAnonimo, prioridad, estado, fechaRegistro, registradaPor) · `Evidencia` (archivo, tipo) · `ConsentimientoInformado` (versión, fecha) · `AccionCorrectiva` (descripción, fecha, responsable) · `ExpedienteDerivacion` (entidad, oficio, fecha) · `SeguimientoTicket` · `MapaIncidentes` (marcadores, mapa de calor, `anonimizarEspacialmente`, `descripcionTextualAlternativa`) · `IdentidadProtegida` (hashDenunciante, datosCifrados).

Enums: `CategoriaQueja` (RUIDOS, BASURA, COCHERAS, SEGURIDAD, OTROS) · `EstadoQueja` (RECIBIDO, EN_REVISION, RECHAZADO, RESUELTO, DERIVADO_ENTIDAD_EXTERNA) · `EntidadExterna` (PNP, MUNICIPALIDAD) · `Prioridad` (BAJA, MEDIA, ALTA).

## Reglas de negocio

**Registro**
- No se envía sin: consentimiento marcado (se guarda la versión aceptada), categoría, descripción, ubicación y al menos una evidencia (foto o video validados en el servidor).
- La ubicación se elige tocando el mapa, escribiendo la dirección o con "Usar mi ubicación"; nunca arrastrando (WCAG 2.5.7).
- Código de ticket: `Q-<año>-<correlativo de 5 dígitos>-<4 caracteres aleatorios>`. El correlativo da la trazabilidad; el sufijo impide adivinar códigos ajenos. Estado inicial RECIBIDO con fecha y hora; se avisa a la directiva.
- La queja asistida la registra un `DIRECTIVO_MEDIADOR` buscando al vecino por nombre o DNI; `registradaPor` guarda al mediador y se entrega una constancia impresa o digital con el código.

**Anonimato (R-09, AC-7)**
- El id del denunciante se cifra con AES-256-GCM (`CLAVE_CIFRADO`) en `IdentidadProtegida`; `hashDenunciante` es un HMAC que permite al propio vecino listar sus reportes. En una queja anónima propia, `registradaPor` queda vacío.
- **Ninguna pantalla ni endpoint revela la identidad**; la directiva ve "Reporte anónimo". `revelarSoloPara` no se implementa mientras ninguna HU lo pida.
- El sistema usa la identidad descifrada solo para avisar al denunciante. Esos avisos (copia interna y WhatsApp) no llevan el código ni el detalle: "Hay novedades en su reporte anónimo. Consúltelo con su código".
- La auditoría de una queja anónima registra el actor como `ANONIMO`.

**Gestión**
- Admisibilidad: admitir asigna prioridad y pasa a EN_REVISION; rechazar pasa a RECHAZADO y envía una advertencia por mal uso redactada sin tono punitivo. Ambas se auditan y se avisan.
- Acciones correctivas: se documentan las medidas y el ticket pasa a RESUELTO con aviso al denunciante.
- Derivación (faltas penales o delitos): se genera el expediente en PDF (pruebas, descripción, coordenadas) y el oficio; estado DERIVADO_ENTIDAD_EXTERNA y el oficio visible para el denunciante. La entrega a la PNP o la Municipalidad ocurre fuera del sistema.
- Seguimiento por código: `/seguimiento` funciona sin sesión, con límite de intentos por IP; muestra estado, fechas y categoría, nunca datos de terceros.

**Mapa (HU-ACC-07)**
- Solo muestra quejas admitidas, derivadas o resueltas; nunca RECIBIDO ni RECHAZADO.
- Las anónimas y sensibles, y todas las de vecinos con oposición activa en M1, se generalizan a una cuadrícula de ~100 m (nivel manzana), también de forma retroactiva.
- Siempre con su alternativa textual: lista de zonas con categoría y cantidad, debajo o en una pestaña "Ver como lista". Teselas de OpenStreetMap con su atribución visible.

**ARCO:** el módulo expone `datosPersonales(usuarioId)` (quejas propias no anónimas y sus coordenadas) y `anonimizar(usuarioId)`.

## Historias de usuario

† = el endpoint difiere del Anexo I; ver [ARQUITECTURA.md §8](../../docs/ARQUITECTURA.md#8-diferencias-entre-la-matriz-v7-de-hu-y-el-anexo-i). RNF = requisito no funcional en la v7.

| ID | Rol | Historia (quiero…) | Criterios de aceptación (v7) | Clases | Endpoint o servicio | Pantallas |
| --- | --- | --- | --- | --- | --- | --- |
| HU-QUE-01 | Vecino | Registrar una queja mediante un formulario estructurado con consentimiento informado | 1) El usuario debe marcar obligatoriamente la casilla de consentimiento y aceptación de la Política de Privacidad.<br>2) El formulario exige categorizar el tipo de queja (ruidos, basura, cocheras, otros) y adjuntar evidencia (foto/video).<br>3) El sistema valida que descripción, ubicación y evidencia estén completos antes de permitir el envío. | Queja.registrar(), ConsentimientoInformado, Evidencia | POST /api/quejas | VEC-QUE-04, VEC-QUE-10 |
| HU-QUE-02 | Vecino | Activar la opción de "Modo anónimo" al enviar una queja | 1) La interfaz incluye un selector visible y opcional para marcar el reporte como "Modo anónimo".<br>2) Al activarse, ningún directivo ni residente puede ver los datos de identidad del vecino, que se conservan protegidos (R-09).<br>3) El sistema asigna un código de ticket único para que el denunciante dé seguimiento privado sin exponerse. | IdentidadProtegida.cifrar() | POST /api/quejas con esAnonimo | VEC-QUE-04, VEC-QUE-06, VEC-QUE-07, VEC-QUE-09, DIR-QUE-02 |
| HU-QUE-03 | Directivo Mediador | Registrar reportes vecinales asistidos en nombre de adultos mayores | 1) El directivo accede con credenciales de "Mediador" y completa el formulario con los descargos del adulto mayor.<br>2) Puede activar el anonimato a solicitud del residente, protegiendo su identidad ante terceros.<br>3) El sistema genera una constancia física o digital con el código de ticket para que el adulto mayor supervise su estado. | Queja.registradaPor | POST /api/quejas/asistida | DIR-QUE-08, DIR-QUE-09, DIR-QUE-10 |
| HU-QUE-04 | Sistema | Emitir un ticket correlativo intransferible y notificar a la directiva | 1) El sistema genera un código de ticket único tras la recepción del formulario.<br>2) Remite una alerta automática al panel de la directiva informando la llegada de un nuevo caso.<br>3) El estado inicial del ticket se establece en "Recibido / pendiente de evaluación" con fecha y hora exacta. | Queja.codigoTicket, Notificacion | `registrarQueja()` emite el ticket (sin endpoint propio) | VEC-QUE-07, DIR-INI-01, DIR-INI-02, DIR-QUE-01, DIR-QUE-02, DIR-QUE-09, DIR-QUE-10 |
| HU-QUE-05 | Directiva | Calificar la admisibilidad de las quejas | 1) La directiva evalúa las evidencias y testimonios del caso en su consola de gestión de quejas.<br>2) Si el reporte es verídico, asigna prioridad y cambia el estado a "En revisión / procede", notificando al vecino.<br>3) Si es falso o difamatorio, cambia el estado a "Rechazado" y el sistema notifica una advertencia por mal uso. | Queja.admitir(), rechazar() | PATCH /api/quejas/{id}/admisibilidad | VEC-QUE-08, DIR-QUE-01, DIR-QUE-02, DIR-QUE-03 |
| HU-QUE-06 | Directiva | Documentar las acciones correctivas aplicadas en quejas de convivencia interna | 1) La directiva registra las medidas de mediación o acuerdos adoptados con los infractores en el plano presencial.<br>2) El sistema conmuta el estado del ticket a "Resuelto", documentando la intervención realizada.<br>3) Remite una notificación final de resolución al denunciante con el detalle de las medidas aplicadas. | AccionCorrectiva.documentar(), Queja.resolver() | POST /api/quejas/{id}/acciones | DIR-QUE-04, DIR-QUE-05 |
| HU-QUE-07 | Directiva | Conformar un expediente digital y derivar incidentes graves hacia la PNP o la Municipalidad | 1) La directiva clasifica los incidentes constitutivos de faltas penales o delitos como "Derivación a entidad externa".<br>2) El sistema compila pruebas, descripción y coordenadas en un expediente digital formal.<br>3) El ticket pasa a estado "Derivado a entidad externa", adjuntando el oficio de derivación visible al denunciante. | ExpedienteDerivacion.generarOficio() | POST /api/quejas/{id}/derivacion | DIR-QUE-06, DIR-QUE-07 |
| HU-QUE-08 | Vecino | Consultar el mapa georreferenciado de incidentes comunales | 1) El mapa visualiza marcadores y un mapa de calor clasificados según la tipología de incidentes resueltos o canalizados.<br>2) El sistema aplica anonimización espacial sobre reportes sensibles o anónimos, sin identificar el lote emisor.<br>3) Los datos del mapa se actualizan automáticamente tras la validación y cierre de cada ticket. | MapaIncidentes.descripcionTextualAlternativa() | GET /api/quejas/mapa | VEC-QUE-01, VEC-QUE-02, VEC-QUE-03 |
| HU-QUE-09 | Vecino Denunciante | Consultar el estado de mi ticket usando mi código de seguimiento | 1) El vecino puede ingresar su código de ticket y visualizar el estado actual (recibido, en revisión, resuelto, derivado).<br>2) El sistema notifica automáticamente al denunciante en cada cambio de estado relevante.<br>3) El detalle mostrado no revela información sensible de terceros involucrados en el caso. | SeguimientoTicket.consultarPorCodigo() | GET /api/quejas/seguimiento/{codigo} | VEC-ACC-11, VEC-QUE-01, VEC-QUE-08, VEC-QUE-09 |

## Pantallas

Id y nombre en el prototipo ([cómo abrirlas](../../docs/prototipo/LEEME.md)):

`DIR-INI-01` Resumen de la directiva · `DIR-INI-02` Alertas de la directiva · `DIR-QUE-01` Bandeja de incidentes · `DIR-QUE-02` Evaluar un reporte · paso 1 de 2 · `DIR-QUE-03` Evaluar el reporte · paso 2 de 2 · `DIR-QUE-04` Registrar lo que se hizo · paso 1 de 2 · `DIR-QUE-05` Cerrar como resuelto · paso 2 de 2 · `DIR-QUE-06` Derivar a PNP o Municipalidad · paso 1 de 2 · `DIR-QUE-07` Derivar · paso 2 de 2 · `DIR-QUE-08` Reporte asistido (mediador) · paso 1 de 2 · `DIR-QUE-09` Reporte asistido · paso 2 de 2 · `DIR-QUE-10` Constancia con código de seguimiento · `VEC-ACC-11` Avisos · `VEC-QUE-01` Incidentes · lista · `VEC-QUE-02` Incidentes · mapa · `VEC-QUE-03` Incidentes · resumen por zona y tipo · `VEC-QUE-04` Reportar un problema · paso 1 de 2 · `VEC-QUE-06` Reportar un problema · paso 2 de 2 · `VEC-QUE-07` Reporte enviado · `VEC-QUE-08` Avance de mi reporte · `VEC-QUE-09` Buscar con mi código · `VEC-QUE-10` Reporte: faltan datos
