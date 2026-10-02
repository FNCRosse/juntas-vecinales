# Graph Report - juntas-vecinales  (2026-10-01)

## Corpus Check
- Corpus is ~40,119 words - fits in a single context window. You may not need a graph.

## Summary
- 331 nodes · 459 edges · 31 communities (17 shown, 14 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Núcleo compartido y pagos digitales
- Reglas duras y ADR
- Guía visual y tokens
- Accesibilidad WCAG y plantilla PR
- Padrón, acceso y tarifa
- Cierres diferidos y ARCO
- Verificación de contraste
- Asistencia y quórum
- Mapa de módulos M1–M6
- Morosidad y worker
- Modo Senior y semillas
- Servicios externos y desviaciones
- Generador de CSS de tokens
- Plan por fases
- Magic Link y sesión
- Ajustes de tarifa
- Propuestas de agenda
- Fuentes v7 y Anexo I
- Bitácora de garita
- Cambio de contacto
- Preferencias de notificación
- Acciones correctivas
- PDF etiquetado

## God Nodes (most connected - your core abstractions)
1. `Fase 0b · Base de accesibilidad (M6) y núcleo compartido` - 14 edges
2. `CLAUDE.md (instrucciones del proyecto)` - 10 edges
3. `Reglas de accesibilidad verificables A1–A12` - 10 edges
4. `Reglas duras del proyecto` - 9 edges
5. `Plan de implementación` - 8 edges
6. `Cierre diferido de HU parciales ([~] / [-])` - 8 edges
7. `compartido/archivos (R2 firmado, validación, PDF etiquetado)` - 8 edges
8. `HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos` - 8 edges
9. `Queja` - 8 edges
10. `M1 · Identidad: Usuarios y Control de Acceso` - 7 edges

## Surprising Connections (you probably didn't know these)
- `TokensVisuales (cumpleWCAG_AA)` --semantically_similar_to--> `verificar-contraste.mjs (114 combinaciones por modo)`  [INFERRED] [semantically similar]
  modulos/accesibilidad/CLAUDE.md → docs/guia-visual/guia-visual.md
- `Definition of Done de una HU` --semantically_similar_to--> `Plantilla de PR`  [INFERRED] [semantically similar]
  docs/FLUJO_TRABAJO.md → .github/pull_request_template.md
- `Estado de deuda no punitivo (nunca 'moroso')` --semantically_similar_to--> `HU-COB-05 Alerta preventiva a la semana de retraso`  [INFERRED] [semantically similar]
  docs/guia-visual/guia-visual.md → modulos/aportes/CLAUDE.md
- `HU-GAR-19 Panel de inicio consolidado` --conceptually_related_to--> `Cierre diferido de HU parciales ([~] / [-])`  [EXTRACTED]
  modulos/identidad/CLAUDE.md → docs/PLAN.md
- `HU-QUE-04 Ticket correlativo y aviso a la directiva` --references--> `compartido/notificaciones (cola, worker, adaptador Meta + simulador)`  [INFERRED]
  modulos/incidencias/CLAUDE.md → docs/PLAN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]

## Communities (31 total, 14 thin omitted)

### Community 0 - "Núcleo compartido y pagos digitales"
Cohesion: 0.06
Nodes (40): compartido/archivos (R2 firmado, validación, PDF etiquetado), compartido/notificaciones (cola, worker, adaptador Meta + simulador), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo (+32 more)

### Community 1 - "Reglas duras y ADR"
Cohesion: 0.07
Nodes (38): Todo el código en español, Uso del grafo graphify en el repo, Montos en céntimos enteros y fechas en UTC, Reglas duras del proyecto, Sin sobreingeniería, Una HU por rama y por PR, ADR-005 Rutas asistidas y sin conexión en el dominio, ADR-007 Esquema único con separación lógica por módulo (+30 more)

### Community 2 - "Guía visual y tokens"
Cohesion: 0.09
Nodes (36): Guía visual · Plataforma Junta Vecinal, Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, Lucide (librería de íconos), Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12 (+28 more)

### Community 3 - "Accesibilidad WCAG y plantilla PR"
Cohesion: 0.17
Nodes (16): Plantilla de PR, CLAUDE.md (instrucciones del proyecto), Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Plantilla de evidencia de cierre de módulo (+8 more)

### Community 4 - "Padrón, acceso y tarifa"
Cohesion: 0.11
Nodes (23): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA) (+15 more)

### Community 5 - "Cierres diferidos y ARCO"
Cohesion: 0.12
Nodes (21): Exclusión de gamificación (sin medallas, puntos ni rachas), Open Peeps (ilustraciones CC0), Cierre diferido de HU parciales ([~] / [-]), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales (+13 more)

### Community 6 - "Verificación de contraste"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Asistencia y quórum"
Cohesion: 0.11
Nodes (19): EstadoCuenta, HU-COB-02 Estado de cuenta privado, CheckInPresencial, ConfirmacionAsistencia (DIGITAL / ASISTIDA), HU-ASA-02 Confirmar asistencia, HU-ASA-03 Confirmación asistida por el mediador, HU-ASA-07 Check-in presencial y quórum definitivo, Quorum (50 % + 1 de predios) (+11 more)

### Community 8 - "Mapa de módulos M1–M6"
Cohesion: 0.17
Nodes (18): Reparto de las 10 HU de M6, ADR-003 Worker separado con cerrojo, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2) (+10 more)

### Community 9 - "Morosidad y worker"
Cohesion: 0.17
Nodes (16): Estado de deuda no punitivo (nunca 'moroso'), Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita, HU-ASA-04 Quórum proyectado en tiempo real (+8 more)

### Community 10 - "Modo Senior y semillas"
Cohesion: 0.14
Nodes (14): Prohibición de datos reales, Sin gamificación, AC-2 Baja carga cognitiva (<= 3 interacciones), Modo Senior ("Letra grande"), Tamaños mínimos, ADR-004 Perfil de accesibilidad en el servidor, Semillas ficticias (personajes del prototipo), Grupos de rutas por actor (+6 more)

### Community 11 - "Servicios externos y desviaciones"
Cohesion: 0.16
Nodes (14): Prohibición de manejar secretos, ADR-006 Notificaciones por cola con copia interna, Cloudflare R2, Desviaciones respecto del Anexo H, Neon PostgreSQL, WhatsApp Cloud API (número de prueba), Adaptador de archivos R2 (URLs firmadas), Adaptador WhatsApp (+6 more)

### Community 12 - "Generador de CSS de tokens"
Cohesion: 0.25
Nodes (10): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+2 more)

### Community 13 - "Plan por fases"
Cohesion: 0.49
Nodes (10): Plan de implementación, Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, M6 · Accesibilidad y Diseño Centrado en el Usuario, M5 · Aportes Vecinales y Vigilancia, M4 · Asambleas y eventos pro fondos, M1 · Identidad: Usuarios y Control de Acceso, Contrato ARCO datosPersonales() / anonimizar() (+2 more)

### Community 14 - "Magic Link y sesión"
Cohesion: 0.67
Nodes (3): ADR-002 Magic Link y sesión persistente, MagicLink de un solo uso, Sesión propia sin librerías de autenticación

### Community 15 - "Ajustes de tarifa"
Cohesion: 0.67
Nodes (3): HU-COB-03 Solicitud de ajuste de tarifa, HU-COB-04 Auditar solicitudes de ajuste, SolicitudAjusteTarifa

### Community 16 - "Propuestas de agenda"
Cohesion: 0.67
Nodes (3): HU-ASA-13 Proponer un tema de agenda, HU-ASA-14 Consolidar propuestas en la agenda, PropuestaAgenda

## Knowledge Gaps
- **73 isolated node(s):** `REM`, `TAILWIND`, `tokens`, `tw`, `json` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 92 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fase 0b · Base de accesibilidad (M6) y núcleo compartido` connect `Guía visual y tokens` to `Núcleo compartido y pagos digitales`, `Plan por fases`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `compartido/archivos (R2 firmado, validación, PDF etiquetado)` connect `Núcleo compartido y pagos digitales` to `Guía visual y tokens`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos` connect `Guía visual y tokens` to `Núcleo compartido y pagos digitales`, `Morosidad y worker`, `Asistencia y quórum`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `REM`, `TAILWIND`, `tokens` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Núcleo compartido y pagos digitales` be split into smaller, more focused modules?**
  _Cohesion score 0.06025641025641026 - nodes in this community are weakly interconnected._
- **Should `Reglas duras y ADR` be split into smaller, more focused modules?**
  _Cohesion score 0.07112375533428165 - nodes in this community are weakly interconnected._
- **Should `Guía visual y tokens` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._