# Graph Report - juntas-vecinales  (2026-10-02)

## Corpus Check
- 121 files · ~104,739 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 3, .prisma 3, .example 1)

## Summary
- 817 nodes · 1303 edges · 77 communities (51 shown, 26 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6d75550`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ActaDigital
- Reglas duras del proyecto
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- Plan de implementación
- Usuario
- Cierre diferido de HU parciales ([~] / [-])
- verificar-contraste.mjs
- ConfirmacionAsistencia (DIGITAL / ASISTIDA)
- Módulo accesibilidad (M6)
- package.json
- Panel de inicio del vecino (HU-GAR-19)
- Desviaciones respecto del Anexo H
- guia-visual/generar-css.mjs
- notificaciones.test.ts
- MagicLink de un solo uso
- SolicitudAjusteTarifa
- PropuestaAgenda
- Anexo I (endpoints por HU)
- HU-GAR-08 Bitácora de entradas y salidas
- HU-GAR-17 Cambio de número de contacto verificado
- HU-GAR-18 Preferencias de notificación
- AccionCorrectiva
- Adaptador PDF etiquetado (pdfkit)
- devDependencies
- compilerOptions
- eslint.config.mjs
- scripts
- compilerOptions
- compilerOptions
- Anexo H de la tesis (arquitectura 4+1)
- Worker (GET /salud, POST /tareas/ejecutar)
- AC-5 Idempotencia por idOperacion
- Regla de capas dominio/aplicacion/infraestructura
- Procedimiento por HU
- catalogo/page.tsx
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- manejar.test.ts
- archivos.test.ts
- PerfilAccesibilidad
- tokens/generar-css.mjs
- contraste.ts
- matriz-hu.mjs
- Reglas de accesibilidad verificables A1–A12
- HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- dependencies
- Comprobante
- e2e.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- HU-COB-06 Moroso crítico a las 8 semanas
- ref_node_fs
- Predio
- MagicLink (enlace de acceso de un solo uso)
- lenguajeLlano.test.ts
- AC-6 Auditoría en la misma transacción
- EvaluadorMorosidad
- compartido/notificaciones (cola, worker, adaptador Meta + simulador)
- ref_node_child_process
- jest.config.ts
- tabularHasta
- lintear.mjs
- area-tactil.cy.ts
- catalogo.cy.ts
- revisar-estilos.sh
- letra-grande.cy.ts

## God Nodes (most connected - your core abstractions)
1. `modoSeniorAlRenderizar` - 20 edges
2. `MarcoActor()` - 20 edges
3. `react` - 20 edges
4. `compilerOptions` - 16 edges
5. `Plan de implementación` - 15 edges
6. `scripts` - 14 edges
7. `Fase 0b · Base de accesibilidad (M6) y núcleo compartido` - 14 edges
8. `Catalogo()` - 12 edges
9. `PerfilAccesibilidad` - 12 edges
10. `next` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Matriz HU → código → pruebas` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/matriz-hu.md → componentes/a11y/Confirmacion.tsx
- `1. HU de la fase` --references--> `manejar()`  [INFERRED]
  docs/evidencias/F0b.md → compartido/manejar.ts
- `1. HU de la fase` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/a11y/Confirmacion.tsx
- `7. Pendientes y decisiones` --references--> `css()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/tokens/generar-css.mjs
- `TokensVisuales (cumpleWCAG_AA)` --semantically_similar_to--> `verificar-contraste.mjs (114 combinaciones por modo)`  [INFERRED] [semantically similar]
  modulos/accesibilidad/CLAUDE.md → docs/guia-visual/guia-visual.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]

## Communities (77 total, 26 thin omitted)

### Community 0 - "ActaDigital"
Cohesion: 0.15
Nodes (15): HU-COB-12 Recibo digital en PDF, ReciboDigital, Asamblea, Convocatoria (abstracta, versión imprimible), EventoProFondos, HU-ASA-01 Convocatoria con versión imprimible, HU-ASA-05 Contingencia por falta de quórum, ActaDigital (+7 more)

### Community 2 - "Fase 0b · Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.19
Nodes (13): Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, tokens.json (fuente única de verdad), verificar-contraste.mjs (114 combinaciones por modo), compartido/auditoria (tabla solo inserción), Fase 0b · Base de accesibilidad (M6) y núcleo compartido (+5 more)

### Community 3 - "Plan de implementación"
Cohesion: 0.14
Nodes (29): Plantilla de PR, CLAUDE.md (instrucciones del proyecto), Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Semillas ficticias (personajes del prototipo) (+21 more)

### Community 4 - "Usuario"
Cohesion: 0.28
Nodes (9): HU-GAR-03 Abrir desde el ícono del teléfono (PWA), HU-GAR-09 Desvincular a un ex residente, HU-GAR-21 Crear cuentas internas con rol, HU-GAR-22 Revocar acceso de un miembro interno, HU-GAR-23 Reasignar rol de un miembro interno, Residencia (Usuario–Predio), Rol, Sesion (persistente) (+1 more)

### Community 5 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.09
Nodes (24): Lucide (librería de íconos), Open Peeps (ilustraciones CC0), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación (+16 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "ConfirmacionAsistencia (DIGITAL / ASISTIDA)"
Cohesion: 0.25
Nodes (8): EstadoCuenta, HU-COB-02 Estado de cuenta privado, ConfirmacionAsistencia (DIGITAL / ASISTIDA), HU-ASA-02 Confirmar asistencia, HU-ASA-03 Confirmación asistida por el mediador, HU-GAR-19 Panel de inicio consolidado, PanelInicio, HU-QUE-03 Queja asistida por el mediador

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.57
Nodes (7): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (18): engines, node, name, private, version, prettier, prisma, @prisma/client (+10 more)

### Community 10 - "Panel de inicio del vecino (HU-GAR-19)"
Cohesion: 0.22
Nodes (7): AC-2 Baja carga cognitiva (<= 3 interacciones), Modo Senior ("Letra grande"), Tamaños mínimos, Grupos de rutas por actor, Panel de inicio del vecino (HU-GAR-19), Server Components por defecto, Tokens, Tailwind v4 y Radix

### Community 11 - "Desviaciones respecto del Anexo H"
Cohesion: 0.16
Nodes (11): Cloudflare R2, Neon PostgreSQL, WhatsApp Cloud API (número de prueba), Adaptador de archivos R2 (URLs firmadas), Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones (+3 more)

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "notificaciones.test.ts"
Cohesion: 0.06
Nodes (41): dynamic, GET(), EntradaAuditoria, registrarAuditoria(), global, prisma, Transaccion, comprobarBaseDatos() (+33 more)

### Community 15 - "SolicitudAjusteTarifa"
Cohesion: 0.67
Nodes (3): HU-COB-03 Solicitud de ajuste de tarifa, HU-COB-04 Auditar solicitudes de ajuste, SolicitudAjusteTarifa

### Community 16 - "PropuestaAgenda"
Cohesion: 0.67
Nodes (3): HU-ASA-13 Proponer un tema de agenda, HU-ASA-14 Consolidar propuestas en la agenda, PropuestaAgenda

### Community 31 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, axe-core, cypress, cypress-axe, eslint, eslint-config-next, jest, prettier (+11 more)

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "eslint.config.mjs"
Cohesion: 0.28
Nodes (8): capasInternas(), MODULOS, MODULOS_PERMITIDOS, patronesDelModulo(), pureza, reglasDeModulos, rutasRelativas, eslint-config-next

### Community 34 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, estilos, lint, matriz, postinstall, start (+6 more)

### Community 35 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 36 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 37 - "Anexo H de la tesis (arquitectura 4+1)"
Cohesion: 0.29
Nodes (6): Anexo H de la tesis (arquitectura 4+1), Equivalencia de nombres Anexo H -> repositorio, Matriz de dependencias permitidas entre módulos, Vercel (app Next.js), Migraciones Prisma, Rollback por pieza

### Community 38 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.43
Nodes (6): Render (worker Node.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker, Límites de los planes gratuitos

### Community 39 - "AC-5 Idempotencia por idOperacion"
Cohesion: 0.29
Nodes (6): AC-5 Idempotencia por idOperacion, Derechos ARCO, Ley N.° 29733 protección de datos personales, Cola local de cobros sin conexión, Instantánea del padrón en la garita (AC-4), PWA con service worker propio

### Community 40 - "Regla de capas dominio/aplicacion/infraestructura"
Cohesion: 0.22
Nodes (8): Funciones de aptitud con ESLint, AC-7 Confidencialidad (404 a datos ajenos), Errores tipados de dominio (compartido/errores.ts), manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio), Base de datos de pruebas, Etiquetas @HU, Pirámide de pruebas (Jest, Supertest, Cypress+axe)

### Community 41 - "Procedimiento por HU"
Cohesion: 0.50
Nodes (3): Uso del grafo graphify en el repo, Conventional Commits en español, Procedimiento por HU

### Community 42 - "catalogo/page.tsx"
Cohesion: 0.05
Nodes (67): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, DemoConfirmacion(), Layout() (+59 more)

### Community 46 - "manejar.test.ts"
Cohesion: 0.13
Nodes (21): esquema, leerCookie(), PUT, ADR-0004, ErrorConflicto, ErrorDeAplicacion, ErrorNoAutenticado, ErrorNoAutorizado (+13 more)

### Community 47 - "archivos.test.ts"
Cohesion: 0.11
Nodes (23): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), configuracion() (+15 more)

### Community 48 - "PerfilAccesibilidad"
Cohesion: 0.13
Nodes (14): cambiarModoSenior(), obtenerPerfil(), ADR-0004, aDto(), cargarPerfil(), esUuid(), PerfilAccesibilidadDto, DatosPerfil (+6 more)

### Community 49 - "tokens/generar-css.mjs"
Cohesion: 0.11
Nodes (18): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+10 more)

### Community 50 - "contraste.ts"
Cohesion: 0.15
Nodes (15): aplanar(), hexadecimal(), luminancia(), MINIMOS, Modo, NodoToken, Par, paresAVerificar() (+7 more)

### Community 51 - "matriz-hu.mjs"
Cohesion: 0.15
Nodes (13): archivos(), casillas, cerradas, CODIGO, conAlgo, errores, ESTADO, filas (+5 more)

### Community 52 - "Reglas de accesibilidad verificables A1–A12"
Cohesion: 0.24
Nodes (12): Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12, Switch "Letra grande", WCAG 2.2 nivel AA, CI (lint, tipos, Jest ≥80 %, build, Cypress + axe), componentes/a11y (botón, campo, diálogo, barra con Letra grande y Pedir ayuda), AuditorWCAG (suite Cypress + axe), CanalMediacionHumana (solicitarApoyo) (+4 more)

### Community 53 - "HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos"
Cohesion: 0.22
Nodes (9): HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos, HU-ACC-08 Lenguaje llano, RetroalimentacionNoPunitiva (Confirmacion), DelegacionVoto, HU-ASA-06 Delegar el voto en un apoderado, HU-QUE-02 Modo anónimo, HU-QUE-05 Admisibilidad, IdentidadProtegida (AES-256-GCM + HMAC) (+1 more)

### Community 54 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.20
Nodes (10): compartido/archivos (R2 firmado, validación, PDF etiquetado), Colaboracion (ANTICIPADA / EN_PUERTA), HU-ASA-08 Modalidad de aporte en eventos pro fondos, HU-ASA-09 Voluntariado, Voluntariado, ConsentimientoInformado, Evidencia (foto/video), ExpedienteDerivacion (PNP / Municipalidad) (+2 more)

### Community 55 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, lucide-react, next, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog, react (+2 more)

### Community 56 - "Comprobante"
Cohesion: 0.28
Nodes (8): Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, Pago (abstracta), PagoDigital, PagoPresencial

### Community 57 - "e2e.ts"
Cohesion: 0.22
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.25
Nodes (7): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), CheckInPresencial, HU-ASA-04 Quórum proyectado en tiempo real, HU-ASA-07 Check-in presencial y quórum definitivo, Quorum (50 % + 1 de predios)

### Community 59 - "HU-COB-06 Moroso crítico a las 8 semanas"
Cohesion: 0.32
Nodes (8): HU-COB-06 Moroso crítico a las 8 semanas, ConsultaGarita, HU-GAR-04 Pre-registrar visitas, HU-GAR-05 Anular visitas, HU-GAR-06 Consultar placa o DNI con semáforo, HU-GAR-07 Verificar visitantes contra la lista blanca, ResultadoSemaforo (VERDE, AMBAR, ROJO), Visita

### Community 61 - "Predio"
Cohesion: 0.43
Nodes (7): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), HU-GAR-10 Actualizar datos del predio, Predio, Vehiculo

### Community 62 - "MagicLink (enlace de acceso de un solo uso)"
Cohesion: 0.29
Nodes (7): CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-11 Pedir un enlace nuevo, HU-GAR-24 Entrar con la clave de respaldo, HU-GAR-25 Restablecer la clave de respaldo, MagicLink (enlace de acceso de un solo uso)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 64 - "AC-6 Auditoría en la misma transacción"
Cohesion: 0.40
Nodes (5): AC-6 Auditoría en la misma transacción, Casos de uso (una función por archivo), exigirRol() autorización en aplicacion, registrarAuditoria(), Tabla nucleo_auditoria

### Community 65 - "EvaluadorMorosidad"
Cohesion: 0.40
Nodes (5): EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-07 Liquidar deuda histórica y restituir garita, actualizarEstadoMorosidad() (proyección de morosidad de M1)

### Community 66 - "compartido/notificaciones (cola, worker, adaptador Meta + simulador)"
Cohesion: 0.33
Nodes (5): compartido/notificaciones (cola, worker, adaptador Meta + simulador), HU-GAR-20 Centro de notificaciones unificado, HU-QUE-04 Ticket correlativo y aviso a la directiva, HU-QUE-09 Seguimiento por código, SeguimientoTicket

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "lintear.mjs"
Cohesion: 0.40
Nodes (4): casos, eslint, resultados, eslint

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

## Knowledge Gaps
- **277 isolated node(s):** `printWidth`, `ADR-0004`, `esquema`, `ADR-0004`, `dynamic` (+272 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 338 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `tokens/generar-css.mjs`, `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`?**
  _High betweenness centrality (0.395) - this node is a cross-community bridge._
- **Why does `1. HU de la fase` connect `tokens/generar-css.mjs` to `catalogo/page.tsx`, `manejar.test.ts`?**
  _High betweenness centrality (0.239) - this node is a cross-community bridge._
- **What connects `printWidth`, `ADR-0004`, `esquema` to the rest of the system?**
  _277 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Plan de implementación` be split into smaller, more focused modules?**
  _Cohesion score 0.1379800853485064 - nodes in this community are weakly interconnected._
- **Should `Cierre diferido de HU parciales ([~] / [-])` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Should `verificar-contraste.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._