# Graph Report - juntas-vecinales  (2026-10-18)

## Corpus Check
- 662 files · ~587,991 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .prisma 7, (none) 3, .example 1)

## Summary
- 3304 nodes · 10528 edges · 185 communities (131 shown, 54 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `940bcaf6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- aplicacion/sesion.ts
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Predio
- actividades.ts
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Plantilla de evidencia de cierre de módulo
- Adaptador WhatsApp
- guia-visual/generar-css.mjs
- entrarConEnlace.ts
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
- empadronar.ts
- integracion/identidad/entradaAlterna.test.ts
- Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido
- Pirámide de pruebas (Jest, Supertest, Cypress+axe)
- actas.ts
- GuiaPrimerUso.tsx
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- enviarJson
- unitarias/nucleo/archivos.test.ts
- entrarConEnlace.test.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- balances.ts
- prisma
- dependencies
- cliente.ts
- e2e.ts
- despachar.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- empadronar/route.ts
- mediacion.ts
- fechaLarga
- lenguajeLlano.test.ts
- perfil/route.ts
- consultarPadron.ts
- guias.ts
- e2e.mjs
- jest.config.ts
- tabularHasta
- quejas.ts
- area-tactil.cy.ts
- catalogo.cy.ts
- revisar-estilos.sh
- letra-grande.cy.ts
- AsistenteEmpadronar.tsx
- aplicacion/equipo.ts
- propuestas.ts
- next
- manejar.ts
- clave/page.tsx
- derivacion.test.ts
- avisos.test.ts
- Boton.tsx
- convocatorias.ts
- compilerOptions
- ejecutor.ts
- fechaYHora
- delegaciones.ts
- aplicacion/arco.ts
- aplicacion/seguimiento.ts
- instantaneaLocal.ts
- identidad/arco.test.ts
- SesionDto
- aplicacion/gestion.ts
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- lucide-react
- balance.ts
- voluntarios.ts
- cancelacion.test.ts
- visitas.ts
- archivos/route.ts
- exigirRol
- aplicacion/contingencia.ts
- gestionarPadron.ts
- entradaAlterna.ts
- acta.ts
- HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts
- identidad/infraestructura/repositorioArco.ts
- escuchar.cy.ts
- vecino-acc.md
- credencialRespaldo.ts
- integracion/transparencia/historial.test.ts
- comunicados.cy.ts
- soles
- tokens/generar-css.mjs
- repositorioGarita.ts
- BarraNavegacion.tsx
- direccion
- AsistenteEmpadronar
- miPerfil
- actas.cy.ts
- balances.cy.ts
- historial.cy.ts
- garita.test.ts
- ref_node_crypto
- ErrorNoEncontrado
- exigirSesion
- verVisitaEnGarita
- verVivienda
- ElegirLugar
- leerJson
- Evidencia de cierre · M1 Identidad: usuarios y control de acceso
- enlaces.ts
- Regla de capas dominio/aplicacion/infraestructura
- BuscarConCodigo.tsx
- predio.ts
- barra-navegacion.cy.ts
- garita/visitas/nueva/page.tsx
- equipo.cy.ts
- MensajeEstado.tsx
- Evidencia de cierre · M4 Asambleas y eventos pro fondos
- [predioId]/route.ts
- eventos/route.ts
- catalogo/layout.tsx
- Preferencias.tsx
- placas.ts
- Reglas duras del proyecto
- Worker (GET /salud, POST /tareas/ejecutar)
- salud.test.ts
- Desviaciones respecto del Anexo H
- incidencias/asistida.test.ts
- lenguajeLlano.test.ts
- entrar/privacidad/page.tsx
- admisibilidad.test.ts
- solicitarRectificacion
- Procedimiento por HU
- Ley N.° 29733 protección de datos personales
- convocatorias.cy.ts
- manifest.ts

## God Nodes (most connected - your core abstractions)
1. `exigirSesion()` - 162 edges
2. `next` - 157 edges
3. `exigirActor()` - 133 edges
4. `enviarJson()` - 131 edges
5. `lucide-react` - 127 edges
6. `ErrorNoEncontrado` - 112 edges
7. `leerJson()` - 112 edges
8. `exigirRol()` - 110 edges
9. `prisma` - 109 edges
10. `react` - 102 edges

## Surprising Connections (you probably didn't know these)
- `Qué se corrigió` --references--> `SelectorEnHoja()`  [INFERRED]
  docs/evidencias/fidelidad/admin-equ-ent-ini-aud.md → componentes/a11y/SelectorEnHoja.tsx
- `Qué se corrigió` --references--> `SelectorEnHoja()`  [INFERRED]
  docs/evidencias/fidelidad/vecino-acc.md → componentes/a11y/SelectorEnHoja.tsx
- `5. Revisión manual de accesibilidad` --references--> `SelectorFechaHora()`  [INFERRED]
  docs/evidencias/M4.md → componentes/a11y/SelectorFechaHora.tsx
- `Qué se corrigió` --references--> `ConceptosDelPredio()`  [INFERRED]
  docs/evidencias/fidelidad/admin-pad-arc.md → app/(administrador)/administracion/padron/_componentes/ConceptosDelPredio.tsx
- `Qué se corrigió` --references--> `fechaEnFrase()`  [INFERRED]
  docs/evidencias/fidelidad/admin-pad-arc.md → compartido/fechas.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]

## Communities (185 total, 54 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.07
Nodes (36): compartido/archivos (R2 firmado, validación, PDF etiquetado), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, HU-COB-12 Recibo digital en PDF, Idempotencia por idOperacionLocal (UNIQUE) (+28 more)

### Community 1 - "aplicacion/sesion.ts"
Cohesion: 0.10
Nodes (17): esquema, POST, deAfuera, esquema, POST, rol, POST, esquema (+9 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.10
Nodes (33): plantillaClaveNueva(), plantillaEmergenciaGarita(), plantillaInvitacionEquipo(), plantillaRejaManual(), plantillaVisitaEnPuerta(), plantillaVisitaLlego(), buscarCasas(), consultar() (+25 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (21): Exclusión de gamificación (sin medallas, puntos ni rachas), Open Peeps (ilustraciones CC0), Cierre diferido de HU parciales ([~] / [-]), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales (+13 more)

### Community 4 - "Predio"
Cohesion: 0.11
Nodes (23): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA) (+15 more)

### Community 5 - "actividades.ts"
Cohesion: 0.06
Nodes (52): archivosSubidosPor(), compartido_bd_generado_client_estadocolaboracion, compartido_bd_generado_client_modalidadaporte, compartido_bd_generado_client_pagosdeactividad, compartido_bd_generado_client_tipoactividad, ActividadDto, aDto(), aDtoColaboracion() (+44 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Queja"
Cohesion: 0.11
Nodes (20): compartido/notificaciones (cola, worker, adaptador Meta + simulador), EstadoCuenta, HU-COB-02 Estado de cuenta privado, ConfirmacionAsistencia (DIGITAL / ASISTIDA), HU-ASA-02 Confirmar asistencia, HU-ASA-03 Confirmación asistida por el mediador, HU-GAR-19 Panel de inicio consolidado, HU-GAR-20 Centro de notificaciones unificado (+12 more)

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.57
Nodes (7): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (21): engines, node, name, private, version, prettier, prisma, @prisma/adapter-pg (+13 more)

### Community 10 - "Plantilla de evidencia de cierre de módulo"
Cohesion: 0.13
Nodes (20): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), Prohibición de datos reales, AC-1 Accesibilidad (0 violaciones axe), AC-2 Baja carga cognitiva (<= 3 interacciones), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA (+12 more)

### Community 11 - "Adaptador WhatsApp"
Cohesion: 0.25
Nodes (9): Prohibición de manejar secretos, ADR-006 Notificaciones por cola con copia interna, WhatsApp Cloud API (número de prueba), Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones, Variables de entorno (sin valores) (+1 more)

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "entrarConEnlace.ts"
Cohesion: 0.14
Nodes (28): ClaveNuevaConEnlace(), CrearAccesoEquipo(), EntrarConEnlace(), crearAdministradorInicial(), cifrarClave(), derivar(), hashDeToken(), nuevoToken() (+20 more)

### Community 14 - "MagicLink de un solo uso"
Cohesion: 0.67
Nodes (3): ADR-002 Magic Link y sesión persistente, MagicLink de un solo uso, Sesión propia sin librerías de autenticación

### Community 15 - "SolicitudAjusteTarifa"
Cohesion: 0.67
Nodes (3): HU-COB-03 Solicitud de ajuste de tarifa, HU-COB-04 Auditar solicitudes de ajuste, SolicitudAjusteTarifa

### Community 16 - "PropuestaAgenda"
Cohesion: 0.67
Nodes (3): HU-ASA-13 Proponer un tema de agenda, HU-ASA-14 Consolidar propuestas en la agenda, PropuestaAgenda

### Community 31 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, axe-core, cypress, cypress-axe, eslint, eslint-config-next, jest, prettier (+12 more)

### Community 32 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "eslint.config.mjs"
Cohesion: 0.16
Nodes (12): capasInternas(), MODULOS, MODULOS_PERMITIDOS, patronesDelModulo(), pureza, reglasDeModulos, rutasRelativas, casos (+4 more)

### Community 34 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, administrador:crear, build, dev, estilos, lint, matriz, postinstall (+8 more)

### Community 35 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 36 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, lib, module, outDir, paths, rootDir, skipLibCheck (+4 more)

### Community 37 - "empadronar.ts"
Cohesion: 0.16
Nodes (18): plantillaEnlaceAcceso(), empadronar(), personasDe(), validarEmpadronamiento(), ViviendaEmpadronada, modulos_identidad_aplicacion_placas_placas, NOMBRE_RELACION, PersonaEnFormulario (+10 more)

### Community 38 - "integracion/identidad/entradaAlterna.test.ts"
Cohesion: 0.21
Nodes (14): POST, esquema, POST, esquema, POST, despertarWorker(), pedirEnlace(), reenviarEnlace() (+6 more)

### Community 39 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.07
Nodes (24): Confirmacion(), 1. HU de la fase, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido (+16 more)

### Community 40 - "Pirámide de pruebas (Jest, Supertest, Cypress+axe)"
Cohesion: 0.16
Nodes (15): ADR-005 Rutas asistidas y sin conexión en el dominio, AC-5 Idempotencia por idOperacion, AC-6 Auditoría en la misma transacción, AC-7 Confidencialidad (404 a datos ajenos), Casos de uso (una función por archivo), Errores tipados de dominio (compartido/errores.ts), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers (+7 more)

### Community 41 - "actas.ts"
Cohesion: 0.13
Nodes (20): actaADto(), ActaDto, ActaPreparada, actasPublicadas(), descargarActa(), Fila, FilaActa, pdfDelActa() (+12 more)

### Community 42 - "GuiaPrimerUso.tsx"
Cohesion: 0.11
Nodes (20): AvisoInstalar, GuiaPrimerUso(), elegirVista(), siguiente(), PASOS, Vista, VISTAS, metadata (+12 more)

### Community 46 - "enviarJson"
Cohesion: 0.03
Nodes (62): ResolverSolicitud(), confirmar(), hoyEnLima(), PublicarActa(), publicar(), EvaluarVoluntario(), enviar(), NuevaActividad() (+54 more)

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.11
Nodes (26): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), configuracion() (+18 more)

### Community 48 - "entrarConEnlace.test.ts"
Cohesion: 0.06
Nodes (37): hayVozEnEspanol(), sintetizador(), suscribirVoces(), PUT, Escuchar(), leer(), Estado, activarVistaGrandeAlEmpadronar() (+29 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.11
Nodes (24): Noticias(), compartido_bd_generado_client_nivelurgencia, avisarALaComunidad(), aDto(), Fila, NoticiaDto, publicarComunicado(), ADR-0006 (+16 more)

### Community 50 - "contraste.ts"
Cohesion: 0.15
Nodes (16): aplanar(), hexadecimal(), luminancia(), MINIMOS, Modo, NodoToken, Par, paresAVerificar() (+8 more)

### Community 51 - "matriz-hu.mjs"
Cohesion: 0.15
Nodes (13): archivos(), casillas, cerradas, CODIGO, conAlgo, errores, ESTADO, filas (+5 more)

### Community 52 - "Fase 0b · Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.09
Nodes (33): Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12, Switch "Letra grande", Toast que no desaparece solo (+25 more)

### Community 53 - "balances.ts"
Cohesion: 0.13
Nodes (21): GET, esquema, GET, POST, balanceADto(), BalanceDto, balancesPublicados(), Fila (+13 more)

### Community 54 - "prisma"
Cohesion: 0.06
Nodes (34): POST, prisma, compartido_bd_generado_client_tipovehiculo, negarseEnNube(), Persona, PERSONAS, sembrar(), claveCoincide() (+26 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "cliente.ts"
Cohesion: 0.11
Nodes (21): FormularioClave(), ClaveRespaldo(), metadata, EntradaAuditoria, registrarAuditoria(), global, Transaccion, compartido_bd_generado_client (+13 more)

### Community 57 - "e2e.ts"
Cohesion: 0.22
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "despachar.ts"
Cohesion: 0.11
Nodes (23): compartido_bd_generado_client_avisoencola, despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote(), ResumenDespacho, ADR-0006 (+15 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.15
Nodes (17): Estado de deuda no punitivo (nunca 'moroso'), Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas (+9 more)

### Community 60 - "empadronar/route.ts"
Cohesion: 0.15
Nodes (11): POST, contador, dni, esquemaEmpadronamiento, esquemaPlacas, nombre, otro, telefono (+3 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.08
Nodes (41): Ayuda(), metadata, esquema, POST, AyudaEquipo(), nombreDePantalla(), NOMBRES, Ayuda() (+33 more)

### Community 62 - "fechaLarga"
Cohesion: 0.12
Nodes (34): PanelAdministracion(), GET, ActividadDirectiva(), AsambleasDirectiva(), PaseDeLista(), Poderes(), Propuestas(), metadata (+26 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.18
Nodes (8): ADR-0006, archivosJs(), RAIZ, casos, cypress, ref_node_fs, ref_node_path, pg

### Community 64 - "perfil/route.ts"
Cohesion: 0.18
Nodes (18): esquema, ADR-0004, cookieDeSesion(), esquema, POST, esquema, POST, esquema (+10 more)

### Community 65 - "consultarPadron.ts"
Cohesion: 0.16
Nodes (18): CAMPOS_DE_PLACAS, describirAccion(), etiquetaCampo(), Fila, FilaBase, Json, listarPadron(), NOMBRE_USO (+10 more)

### Community 66 - "guias.ts"
Cohesion: 0.05
Nodes (57): esquema, GET, POST, Guia(), metadata, CALOR, cantidad(), CORTO (+49 more)

### Community 67 - "e2e.mjs"
Cohesion: 0.29
Nodes (3): entorno, servidor, ref_node_child_process

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "quejas.ts"
Cohesion: 0.07
Nodes (52): compartido_bd_generado_client_categoriaqueja, compartido_bd_generado_client_entidadexterna, compartido_bd_generado_client_estadoqueja, compartido_bd_generado_client_medidacorrectiva, aVecino(), buscarVecinos(), conCasa, manzanaDe() (+44 more)

### Community 71 - "area-tactil.cy.ts"
Cohesion: 0.29
Nodes (9): Caja, cajas(), distancia(), verificar(), LIMITE, Actor, ACTORES, entrarComo() (+1 more)

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.09
Nodes (21): CamposPlacas(), PlacasEscritas, Concepto, CONCEPTOS, Errores, Otro, Paso, Relacion (+13 more)

### Community 78 - "aplicacion/equipo.ts"
Cohesion: 0.05
Nodes (68): AccionesDePersona(), AgregarAlEquipo(), Agregar(), metadata, Equipo(), metadata, metadata, QuitarAccesoPagina() (+60 more)

### Community 79 - "propuestas.ts"
Cohesion: 0.07
Nodes (44): GET, cierreDeAgenda(), aDto(), agendaPublicada(), bandejaDePropuestas(), cambiarDecision(), decidirPropuesta(), Fila (+36 more)

### Community 80 - "next"
Cohesion: 0.04
Nodes (88): modoSeniorAlRenderizar, ADR-0004, Layout(), metadata, SECCIONES, Layout(), MasOpciones(), metadata (+80 more)

### Community 81 - "manejar.ts"
Cohesion: 0.10
Nodes (19): GET, GET, Contexto, esquema, POST, esquema, POST, GET (+11 more)

### Community 82 - "clave/page.tsx"
Cohesion: 0.11
Nodes (13): metadata, EntrarConClave(), metadata, FormularioEntradaClave(), FormularioPedirEnlace(), ICONOS, OtrasFormasDeEntrar(), Volver() (+5 more)

### Community 83 - "derivacion.test.ts"
Cohesion: 0.16
Nodes (15): GET, respuestaPdf(), GET, GET, ipDe(), oficioParaDirectiva(), registrarQueja(), miOficio() (+7 more)

### Community 84 - "avisos.test.ts"
Cohesion: 0.09
Nodes (31): PATCH, POST, esquema, POST, filtro, GET, esquema, PUT (+23 more)

### Community 85 - "Boton.tsx"
Cohesion: 0.06
Nodes (81): Agregado, Encontrada, Errores, Opcion, CambiarRoles(), clave(), Combinacion, ROLES (+73 more)

### Community 86 - "convocatorias.ts"
Cohesion: 0.08
Nodes (41): compartido_bd_generado_client_modoconfirmacion, compartido_bd_generado_client_tipoasamblea, ErrorReglaNegocio, encolarAvisos(), ADR-0005, aDto(), anularAsistenciaAsistida(), asambleaVigente() (+33 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "ejecutor.ts"
Cohesion: 0.19
Nodes (12): depurarVencidos(), haceDias(), RETENCION_DIAS, VIDA_SESION_DIAS, ahora, servidor, CERROJO_WORKER, ejecutarTareas() (+4 more)

### Community 89 - "fechaYHora"
Cohesion: 0.07
Nodes (24): GenerarEnlace(), FichaVivienda(), AlertasDirectiva(), RegistrarPorVecino(), metadata, ReporteDirectiva(), AvisoDeLectura(), ContextoLectura (+16 more)

### Community 90 - "delegaciones.ts"
Cohesion: 0.10
Nodes (36): compartido_bd_generado_client_condicionapoderado, anonimizar(), COLABORACION, cuando(), datosPersonales(), Fila, PROPUESTA, VOLUNTARIADO (+28 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.13
Nodes (25): metadata, plantillaNumeroCambiado(), AnonimizarEnOtroModulo, avisarCambioDeNumero(), modulos_identidad_aplicacion_arco_campos, Solicitud, CampoRectificable, CAMPOS (+17 more)

### Community 92 - "aplicacion/seguimiento.ts"
Cohesion: 0.13
Nodes (24): AvanceDeMiReporte(), metadata, avanceADto(), consultarPorCodigo(), Fila, hashDeIp(), MENSAJE_CODIGO_NO_ENCONTRADO, MENSAJE_MUCHAS_CONSULTAS (+16 more)

### Community 93 - "instantaneaLocal.ts"
Cohesion: 0.17
Nodes (15): ConsultarGarita(), abrirPorEmergencia(), buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea (+7 more)

### Community 94 - "identidad/arco.test.ts"
Cohesion: 0.15
Nodes (16): GET, esquema, PATCH, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, anonimizar() (+8 more)

### Community 95 - "SesionDto"
Cohesion: 0.17
Nodes (18): ACCIONES, accionesDelModulo(), ACTOR_ANONIMO, describirAccion(), ModuloAuditoria, MODULOS_AUDITORIA, actoresDeAuditoria(), leerAuditoria() (+10 more)

### Community 96 - "aplicacion/gestion.ts"
Cohesion: 0.10
Nodes (40): Derivar(), plantillaNovedadReporte(), 3. Matriz HU → código → prueba, nombresDe(), telefonoDe(), avisarAlDenunciante(), ADR-0006, anioEnLima() (+32 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.36
Nodes (12): CLAUDE.md (instrucciones del proyecto), Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, M6 · Accesibilidad y Diseño Centrado en el Usuario, M5 · Aportes Vecinales y Vigilancia, M4 · Asambleas y eventos pro fondos, M1 · Identidad: Usuarios y Control de Acceso (+4 more)

### Community 101 - "lucide-react"
Cohesion: 0.05
Nodes (58): Auditoria(), enlace(), metadata, ESTILO_INSIGNIA, FILTROS, metadata, SolicitudesDePrivacidad(), INSIGNIAS (+50 more)

### Community 102 - "balance.ts"
Cohesion: 0.21
Nodes (11): DatosBalance, esFechaReal(), esMontoValido(), hoyEnLima(), MAXIMO_CONCEPTO, MAXIMO_EGRESOS, MAXIMO_MONTO, MAXIMO_TITULO (+3 more)

### Community 103 - "voluntarios.ts"
Cohesion: 0.12
Nodes (26): aDto(), evaluarVoluntariado(), Fila, ofrecerAyuda(), ROLES_DIRECTIVA, ROLES_VECINO, VoluntariadoDto, voluntariosDeLaActividad() (+18 more)

### Community 104 - "cancelacion.test.ts"
Cohesion: 0.30
Nodes (9): esquema, POST, plantillaCancelacionPedida(), cambiarOposicion(), prefiereUbicacionGeneralizada(), solicitarCancelacion(), solicitarCopia(), crearSolicitud() (+1 more)

### Community 105 - "visitas.ts"
Cohesion: 0.16
Nodes (24): DELETE, Anular(), metadata, compartido_bd_generado_client_estadogarita, actualizarEstadoMorosidad(), aDto(), anularVisita(), MENSAJE_VISITAS_EN_PAUSA (+16 more)

### Community 106 - "archivos/route.ts"
Cohesion: 0.31
Nodes (6): GET, esquema, POST, USOS, descargarSiPuede(), NombreRol

### Community 107 - "exigirRol"
Cohesion: 0.17
Nodes (22): abrirLasVotaciones(), asambleaDelDia(), buscarParaPaseDeLista(), exigirDiaDeLaAsamblea(), marcarCasaPresente(), PaseDeLista, quorumDeLaPuerta(), ROLES (+14 more)

### Community 108 - "aplicacion/contingencia.ts"
Cohesion: 0.07
Nodes (31): compartido_bd_generado_client_tipoaviso, visperaALasOchoPm(), ADR-0006, MENSAJES, registrarContingencia(), AsambleaDto, publicarConvocatoria(), admiteContingencia() (+23 more)

### Community 109 - "gestionarPadron.ts"
Cohesion: 0.20
Nodes (10): plantillaBajaPadron(), actualizarPredio(), darDeBajaResidente(), cambiosDeOcupacion(), MotivoBajaResidente, Ocupacion, buscarPredio(), cerrarResidencia() (+2 more)

### Community 110 - "entradaAlterna.ts"
Cohesion: 0.15
Nodes (20): plantillaClaveCambiada(), Destinatario, emitirEnlace(), SEGUN_PROPOSITO, MENSAJE_MUCHOS, MENSAJE_MUY_SEGUIDO, MENSAJE_SIN_WHATSAPP, MENSAJE_ENLACE_NO_SIRVE (+12 more)

### Community 112 - "acta.ts"
Cohesion: 0.21
Nodes (11): DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO, porLinea() (+3 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 125 - "identidad/infraestructura/repositorioArco.ts"
Cohesion: 0.14
Nodes (16): compartido_bd_generado_client_estadoarco, compartido_bd_generado_client_tipoarco, aFila(), bandejaArco(), insignia(), resumenArco(), estadoDelPlazo(), administradoresActivos() (+8 more)

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 127 - "vecino-acc.md"
Cohesion: 0.09
Nodes (18): Desviaciones justificadas, Fidelidad al prototipo · administración · ADM-EQU, ADM-ENT, ADM-INI y ADM-AUD, Qué se corrigió, Desviaciones justificadas, Fidelidad al prototipo · administración · ADM-PAD y ADM-ARC (padrón y privacidad), Qué se corrigió, Desviaciones justificadas, Fidelidad al prototipo · directiva · DIR-QUE, DIR-INI y DIR-AYU (incidentes, resumen y ayuda) (+10 more)

### Community 128 - "credencialRespaldo.ts"
Cohesion: 0.16
Nodes (5): CredencialRespaldo, DatosCredencial, LARGO_MINIMO_CLAVE, MAX_FALLOS, T0

### Community 129 - "integracion/transparencia/historial.test.ts"
Cohesion: 0.19
Nodes (10): GET, Actas, Balance, historialPublico(), RegistroDeHistorial, ROLES_VECINO, ordenarHistorial(), acta() (+2 more)

### Community 131 - "soles"
Cohesion: 0.18
Nodes (12): hoyEnLima(), nuevoGasto(), PublicarBalance(), publicar(), revisar(), Balance(), metadata, ActasYBalances() (+4 more)

### Community 132 - "tokens/generar-css.mjs"
Cohesion: 0.25
Nodes (10): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+2 more)

### Community 133 - "repositorioGarita.ts"
Cohesion: 0.13
Nodes (17): metadata, Responder(), compartido_bd_generado_client_estadovisita, compartido_bd_generado_client_modoacceso, compartido_bd_generado_client_tiporegistroacceso, marcarSalida(), visitaEnLaPuerta(), visitaPorResponder() (+9 more)

### Community 134 - "BarraNavegacion.tsx"
Cohesion: 0.50
Nodes (4): 1. Qué significa "igual o muy parecido", 4. Cómo comparar una pantalla, 5. Lo que no se copia, Fidelidad al prototipo

### Community 135 - "direccion"
Cohesion: 0.29
Nodes (17): esquema, POST, vecino, encolarAviso(), abrirPorEmergencia(), aFila(), anotarEntradaVecino(), anotarEntradaVisita() (+9 more)

### Community 136 - "AsistenteEmpadronar"
Cohesion: 0.21
Nodes (11): AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), direccion(), erroresDe(), FormularioOtro() (+3 more)

### Community 137 - "miPerfil"
Cohesion: 0.22
Nodes (9): plantillaSolicitudPrivacidad(), avisarResultado(), cargarUsuario(), datosPersonales(), miPerfil(), terminaEn(), titulo(), numeroDeSolicitud() (+1 more)

### Community 141 - "garita.test.ts"
Cohesion: 0.20
Nodes (8): GET, PATCH, respuesta, ErrorConflicto, guardarRespuesta(), marcarRespuestaTelefono(), responderVisita(), T0

### Community 142 - "ref_node_crypto"
Cohesion: 0.22
Nodes (10): cifrar(), clave(), descifrar(), Entorno, hashDenunciante(), reportar(), T0, entorno (+2 more)

### Community 143 - "ErrorNoEncontrado"
Cohesion: 0.26
Nodes (10): metadata, Resolver(), ErrorNoEncontrado, exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco(), modulos_identidad_aplicacion_arco_verificaciones, verSolicitudArco() (+2 more)

### Community 144 - "exigirSesion"
Cohesion: 0.09
Nodes (25): Contexto, DELETE, POST, Contexto, esquema, GET, POST, Contexto (+17 more)

### Community 145 - "verVisitaEnGarita"
Cohesion: 0.19
Nodes (14): InicioGarita(), inicioDelDiaEnLima(), rangoHorario(), anunciada(), bitacora(), vehiculoDe(), verificarVisita(), verVisitaEnGarita() (+6 more)

### Community 146 - "verVivienda"
Cohesion: 0.18
Nodes (9): Actualizar(), metadata, DarDeBaja(), Baja(), metadata, verVivienda(), modulos_identidad_aplicacion_gestionarpadron_motivos_baja_residente, MOTIVOS_BAJA_RESIDENTE (+1 more)

### Community 148 - "leerJson"
Cohesion: 0.06
Nodes (39): esquema, PATCH, esquema, PATCH, esquema, POST, Contexto, DELETE (+31 more)

### Community 149 - "Evidencia de cierre · M1 Identidad: usuarios y control de acceso"
Cohesion: 0.25
Nodes (8): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · M1 Identidad: usuarios y control de acceso

### Community 150 - "enlaces.ts"
Cohesion: 0.28
Nodes (11): metadata, NuevoBalance(), actividadDeUnBalance(), actividadesParaBalance(), admiteAcuerdos(), Asamblea, asambleaDeUnActa(), asambleasParaActa() (+3 more)

### Community 151 - "Regla de capas dominio/aplicacion/infraestructura"
Cohesion: 0.17
Nodes (12): Sin gamificación, Modo Senior ("Letra grande"), Tamaños mínimos, ADR-004 Perfil de accesibilidad en el servidor, Funciones de aptitud con ESLint, Matriz de dependencias permitidas entre módulos, Regla de capas dominio/aplicacion/infraestructura, Dominio sin dependencias (fecha como parámetro) (+4 more)

### Community 152 - "BuscarConCodigo.tsx"
Cohesion: 0.27
Nodes (6): BuscarConCodigo(), metadata, Seguimiento(), AvanceReporte(), ICONO, AvanceDto

### Community 153 - "predio.ts"
Cohesion: 0.42
Nodes (7): ConceptosDelPredio(), ETIQUETA, Concepto, CONCEPTOS, MAXIMO_POR_CONCEPTO, NOMBRE_CONCEPTO, ocupacionEnTexto()

### Community 164 - "equipo.cy.ts"
Cohesion: 0.50
Nodes (3): abrirAcciones(), accion(), sufijo

### Community 165 - "MensajeEstado.tsx"
Cohesion: 0.08
Nodes (21): FormularioClaveNueva(), metadata, Errores, FormularioAccesoEquipo(), metadata, BotonEntrar(), entrar(), canjear() (+13 more)

### Community 166 - "Evidencia de cierre · M4 Asambleas y eventos pro fondos"
Cohesion: 0.22
Nodes (8): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Diferido y decisiones, Evidencia de cierre · M4 Asambleas y eventos pro fondos

### Community 167 - "[predioId]/route.ts"
Cohesion: 0.50
Nodes (3): contador, esquema, PATCH

### Community 168 - "eventos/route.ts"
Cohesion: 0.17
Nodes (11): esquema, PATCH, esquema, GET, POST, esquema, GET, POST (+3 more)

### Community 170 - "Preferencias.tsx"
Cohesion: 0.10
Nodes (22): AvisoSinVoz(), InterruptorVoz(), cambiar(), guardar(), DemoDeshacer(), OfertaDeGuia(), GRUPOS, OPCIONES (+14 more)

### Community 171 - "placas.ts"
Cohesion: 0.31
Nodes (7): revisarVehiculos(), SIN_PLACAS, GRUPOS, Placas, prepararPlacas(), TipoVehiculoPlaca, buscarVehiculosPorPlaca()

### Community 172 - "Reglas duras del proyecto"
Cohesion: 0.25
Nodes (9): Montos en céntimos enteros y fechas en UTC, Reglas duras del proyecto, Sin sobreingeniería, ADR-007 Esquema único con separación lógica por módulo, Eventos como llamadas síncronas (sin bus), Convenciones de nombres de BD, Esquema Prisma por módulo, Migraciones Prisma (+1 more)

### Community 173 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.31
Nodes (9): ADR-003 Worker separado con cerrojo, Monolito modular (ADR-001), Render (worker Node.js), Vercel (app Next.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker (+1 more)

### Community 174 - "salud.test.ts"
Cohesion: 0.36
Nodes (4): dynamic, GET(), comprobarBaseDatos(), supertest

### Community 175 - "Desviaciones respecto del Anexo H"
Cohesion: 0.25
Nodes (8): Todo el código en español, Anexo H de la tesis (arquitectura 4+1), Cloudflare R2, Desviaciones respecto del Anexo H, Equivalencia de nombres Anexo H -> repositorio, Neon PostgreSQL, Adaptador de archivos R2 (URLs firmadas), Entornos (local, CI, preview, producción)

### Community 176 - "incidencias/asistida.test.ts"
Cohesion: 0.43
Nodes (3): GET, vecinosParaAsistir(), T0

### Community 177 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 178 - "entrar/privacidad/page.tsx"
Cohesion: 0.33
Nodes (4): FormularioPolitica(), metadata, Privacidad(), PUNTOS

### Community 179 - "admisibilidad.test.ts"
Cohesion: 0.40
Nodes (5): PATCH, pedir(), reportar(), T0, T1

### Community 180 - "solicitarRectificacion"
Cohesion: 0.47
Nodes (6): aplicarRectificacion(), solicitarRectificacion(), errorDeRectificacion(), leerCelular(), leerVivienda(), pendienteDelMismoCampo()

### Community 181 - "Procedimiento por HU"
Cohesion: 0.50
Nodes (4): Uso del grafo graphify en el repo, Una HU por rama y por PR, Conventional Commits en español, Procedimiento por HU

### Community 182 - "Ley N.° 29733 protección de datos personales"
Cohesion: 0.50
Nodes (4): Derechos ARCO, Ley N.° 29733 protección de datos personales, Instantánea del padrón en la garita (AC-4), PWA con service worker propio

## Knowledge Gaps
- **858 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+853 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1158 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `aplicacion/sesion.ts`, `soles`, `repositorioGarita.ts`, `package.json`, `ErrorNoEncontrado`, `verVivienda`, `enlaces.ts`, `BuscarConCodigo.tsx`, `garita/visitas/nueva/page.tsx`, `MensajeEstado.tsx`, `integracion/identidad/entradaAlterna.test.ts`, `catalogo/layout.tsx`, `Preferencias.tsx`, `GuiaPrimerUso.tsx`, `enviarJson`, `entrar/privacidad/page.tsx`, `cliente.ts`, `manifest.ts`, `empadronar/route.ts`, `mediacion.ts`, `fechaLarga`, `guias.ts`, `jest.config.ts`, `AsistenteEmpadronar.tsx`, `aplicacion/equipo.ts`, `clave/page.tsx`, `Boton.tsx`, `fechaYHora`, `aplicacion/arco.ts`, `aplicacion/seguimiento.ts`, `instantaneaLocal.ts`, `lucide-react`, `visitas.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Fidelidad al prototipo` connect `BarraNavegacion.tsx` to `next`, `Plan de implementación`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _858 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `aplicacion/sesion.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10114942528735632 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._