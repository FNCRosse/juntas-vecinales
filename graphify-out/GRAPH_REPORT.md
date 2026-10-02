# Graph Report - juntas-vecinales  (2026-10-02)

## Corpus Check
- 58 files · ~44,275 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .prisma 2, .example 1)

## Summary
- 513 nodes · 685 edges · 46 communities (27 shown, 19 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01a9bb93`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- Reglas duras del proyecto
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- ARQUITECTURA.md
- Predio
- Cierre diferido de HU parciales ([~] / [-])
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Lista de comprobación por pantalla
- Adaptador WhatsApp
- generar-css.mjs
- cliente.ts
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
- Desviaciones respecto del Anexo H
- Worker (GET /salud, POST /tareas/ejecutar)
- AC-5 Idempotencia por idOperacion
- Regla de capas dominio/aplicacion/infraestructura
- Procedimiento por HU
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Plan de implementación` - 14 edges
3. `Fase 0b · Base de accesibilidad (M6) y núcleo compartido` - 14 edges
4. `scripts` - 12 edges
5. `CLAUDE.md (instrucciones del proyecto)` - 12 edges
6. `compilerOptions` - 10 edges
7. `compilerOptions` - 10 edges
8. `M1 · Identidad: Usuarios y Control de Acceso` - 10 edges
9. `Reglas de accesibilidad verificables A1–A12` - 10 edges
10. `Reglas duras del proyecto` - 9 edges

## Surprising Connections (you probably didn't know these)
- `TokensVisuales (cumpleWCAG_AA)` --semantically_similar_to--> `verificar-contraste.mjs (114 combinaciones por modo)`  [INFERRED] [semantically similar]
  modulos/accesibilidad/CLAUDE.md → docs/guia-visual/guia-visual.md
- `Evidencia (foto/video)` --references--> `compartido/archivos (R2 firmado, validación, PDF etiquetado)`  [INFERRED]
  modulos/incidencias/CLAUDE.md → docs/PLAN.md
- `Definition of Done de una HU` --semantically_similar_to--> `Plantilla de PR`  [INFERRED] [semantically similar]
  docs/FLUJO_TRABAJO.md → .github/pull_request_template.md
- `Estado de deuda no punitivo (nunca 'moroso')` --semantically_similar_to--> `HU-COB-05 Alerta preventiva a la semana de retraso`  [INFERRED] [semantically similar]
  docs/guia-visual/guia-visual.md → modulos/aportes/CLAUDE.md
- `ReciboDigital` --references--> `compartido/archivos (R2 firmado, validación, PDF etiquetado)`  [INFERRED]
  modulos/aportes/CLAUDE.md → docs/PLAN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]

## Communities (46 total, 19 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.07
Nodes (32): compartido/archivos (R2 firmado, validación, PDF etiquetado), compartido/notificaciones (cola, worker, adaptador Meta + simulador), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, HU-COB-12 Recibo digital en PDF (+24 more)

### Community 1 - "Reglas duras del proyecto"
Cohesion: 0.25
Nodes (4): Convenciones de nombres de BD, Esquema Prisma por módulo, Migraciones Prisma, Rollback por pieza

### Community 2 - "Fase 0b · Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.09
Nodes (31): Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12, Switch "Letra grande", tokens.json (fuente única de verdad) (+23 more)

### Community 3 - "ARQUITECTURA.md"
Cohesion: 0.30
Nodes (15): CLAUDE.md (instrucciones del proyecto), Plantilla de evidencia de cierre de módulo, Cierre de módulo, Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, Matriz HU -> código -> pruebas (npm run matriz), M6 · Accesibilidad y Diseño Centrado en el Usuario (+7 more)

### Community 4 - "Predio"
Cohesion: 0.06
Nodes (45): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), Cuota semanal, EstadoCuenta, EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-01 Cálculo semanal de la deuda (worker) (+37 more)

### Community 5 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.09
Nodes (24): Lucide (librería de íconos), Open Peeps (ilustraciones CC0), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación (+16 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Queja"
Cohesion: 0.13
Nodes (15): ConfirmacionAsistencia (DIGITAL / ASISTIDA), HU-ASA-02 Confirmar asistencia, HU-ASA-03 Confirmación asistida por el mediador, HU-GAR-19 Panel de inicio consolidado, PanelInicio, ConsentimientoInformado, Evidencia (foto/video), HU-QUE-01 Registrar queja con consentimiento y evidencia (+7 more)

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.39
Nodes (9): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2), Derechos ARCO (+1 more)

### Community 9 - "package.json"
Cohesion: 0.05
Nodes (38): metadata, collectCoverageFrom, configuracion(), conTransformacionDeNext, nextConfig, dependencies, next, pg (+30 more)

### Community 10 - "Lista de comprobación por pantalla"
Cohesion: 0.09
Nodes (21): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), AC-2 Baja carga cognitiva (<= 3 interacciones), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, Modo Senior ("Letra grande"), Tamaños mínimos (+13 more)

### Community 11 - "Adaptador WhatsApp"
Cohesion: 0.29
Nodes (6): Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones, Variables de entorno (sin valores), Simuladores de pruebas

### Community 12 - "generar-css.mjs"
Cohesion: 0.10
Nodes (12): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+4 more)

### Community 13 - "cliente.ts"
Cohesion: 0.12
Nodes (15): dynamic, GET(), global, prisma, comprobarBaseDatos(), servidor, pg, @prisma/adapter-pg (+7 more)

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
Cohesion: 0.16
Nodes (12): capasInternas(), MODULOS, MODULOS_PERMITIDOS, patronesDelModulo(), pureza, reglasDeModulos, rutasRelativas, casos (+4 more)

### Community 34 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, lint, postinstall, start, test, test:e2e (+4 more)

### Community 35 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 36 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 37 - "Desviaciones respecto del Anexo H"
Cohesion: 0.22
Nodes (7): Anexo H de la tesis (arquitectura 4+1), Cloudflare R2, Equivalencia de nombres Anexo H -> repositorio, Neon PostgreSQL, WhatsApp Cloud API (número de prueba), Adaptador de archivos R2 (URLs firmadas), Entornos (local, CI, preview, producción)

### Community 38 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.31
Nodes (7): Render (worker Node.js), Vercel (app Next.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker, Límites de los planes gratuitos

### Community 39 - "AC-5 Idempotencia por idOperacion"
Cohesion: 0.25
Nodes (7): AC-5 Idempotencia por idOperacion, AC-6 Auditoría en la misma transacción, registrarAuditoria(), Tabla nucleo_auditoria, Cola local de cobros sin conexión, Instantánea del padrón en la garita (AC-4), PWA con service worker propio

### Community 40 - "Regla de capas dominio/aplicacion/infraestructura"
Cohesion: 0.22
Nodes (7): AC-7 Confidencialidad (404 a datos ajenos), Casos de uso (una función por archivo), Errores tipados de dominio (compartido/errores.ts), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio), Base de datos de pruebas

### Community 41 - "Procedimiento por HU"
Cohesion: 0.25
Nodes (7): Uso del grafo graphify en el repo, Funciones de aptitud con ESLint, Matriz de dependencias permitidas entre módulos, Conventional Commits en español, Procedimiento por HU, Etiquetas @HU, Pirámide de pruebas (Jest, Supertest, Cypress+axe)

## Knowledge Gaps
- **182 isolated node(s):** `printWidth`, `dynamic`, `metadata`, `global`, `REM` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 218 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fase 0b · Base de accesibilidad (M6) y núcleo compartido` connect `Fase 0b · Base de accesibilidad (M6) y núcleo compartido` to `compartido/archivos (R2 firmado, validación, PDF etiquetado)`, `ARQUITECTURA.md`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `Plantilla de PR` connect `Lista de comprobación por pantalla` to `Procedimiento por HU`, `ARQUITECTURA.md`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `Plan de implementación` connect `ARQUITECTURA.md` to `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Predio`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `printWidth`, `dynamic`, `metadata` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.07386363636363637 - nodes in this community are weakly interconnected._
- **Should `Fase 0b · Base de accesibilidad (M6) y núcleo compartido` be split into smaller, more focused modules?**
  _Cohesion score 0.0946969696969697 - nodes in this community are weakly interconnected._
- **Should `Predio` be split into smaller, more focused modules?**
  _Cohesion score 0.05550416281221091 - nodes in this community are weakly interconnected._