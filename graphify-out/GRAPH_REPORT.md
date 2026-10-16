# Graph Report - juntas-vecinales  (2026-10-15)

## Corpus Check
- 535 files · ~460,173 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .prisma 6, (none) 3, .example 1)

## Summary
- 2684 nodes · 8045 edges · 163 communities (110 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd364fd3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- errores.ts
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Usuario
- AgregarAlEquipo
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Anexo H de la tesis (arquitectura 4+1)
- Desviaciones respecto del Anexo H
- guia-visual/generar-css.mjs
- entradaAlterna.ts
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
- Worker (GET /salud, POST /tareas/ejecutar)
- Evidencia de cierre · M1 Identidad: usuarios y control de acceso
- Procedimiento por HU
- actas.ts
- perfil/page.tsx
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- enviarJson
- unitarias/nucleo/archivos.test.ts
- cambiarModoSenior.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- balances.ts
- cliente.ts
- dependencies
- entrarConEnlace.test.ts
- e2e.ts
- avisos.test.ts
- Predio
- padron/esquema.ts
- mediacion.ts
- exigirRol
- lenguajeLlano.test.ts
- aplicacion/sesion.ts
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
- exigirActor
- modoSeniorAlRenderizar
- exigirSesion
- next
- _sesion/sesion.ts
- avisos.ts
- MensajeEstado
- ayuda-y-accesibilidad/page.tsx
- compilerOptions
- ejecutor.ts
- react
- rol/page.tsx
- aplicacion/arco.ts
- aplicacion/seguimiento.ts
- instantaneaLocal.ts
- arco.test.ts
- auditoria.ts
- ErrorNoEncontrado
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- lucide-react
- balance.ts
- visitas.ts
- cancelacion.test.ts
- Boton.tsx
- (vecino)/page.tsx
- garita.test.ts
- Transaccion
- gestionarPadron.ts
- Regla de capas dominio/aplicacion/infraestructura
- acta.ts
- HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts
- encolarAviso
- escuchar.cy.ts
- queja.ts
- [id]/oficio/route.ts
- aplicacion/historial.ts
- comunicados.cy.ts
- balances/[id]/page.tsx
- tokens/generar-css.mjs
- Lista de comprobación por pantalla
- Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido
- ref_node_fs
- AC-6 Auditoría en la misma transacción
- lintear.mjs
- actas.cy.ts
- balances.cy.ts
- historial.cy.ts
- repositorioGarita.ts
- avisarDenunciante.ts
- verVisitaEnGarita
- quejas/route.ts
- Reglas duras del proyecto
- HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos
- ReportarProblema
- visitaPorResponder
- AC-5 Idempotencia por idOperacion
- padron/page.tsx
- claves.ts
- BuscarConCodigo.tsx
- densidad.cy.ts
- barra-navegacion.cy.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 126 edges
2. `exigirSesion()` - 117 edges
3. `exigirActor()` - 115 edges
4. `lucide-react` - 95 edges
5. `ErrorNoEncontrado` - 85 edges
6. `leerJson()` - 83 edges
7. `enviarJson()` - 82 edges
8. `prisma` - 80 edges
9. `react` - 78 edges
10. `manejar()` - 67 edges

## Surprising Connections (you probably didn't know these)
- `2. Qué cambió en el prototipo y el sitio todavía no lo tiene` --references--> `CambiarDePerfil()`  [INFERRED]
  docs/FIDELIDAD_PROTOTIPO.md → app/_sesion/CambiarDePerfil.tsx
- `1. HU de la fase` --references--> `manejar()`  [INFERRED]
  docs/evidencias/F0b.md → compartido/manejar.ts
- `3. Orden de trabajo` --references--> `AvisoDeshacer()`  [INFERRED]
  docs/FIDELIDAD_PROTOTIPO.md → componentes/a11y/AvisoDeshacer.tsx
- `3. Orden de trabajo` --references--> `BarraNavegacion()`  [INFERRED]
  docs/FIDELIDAD_PROTOTIPO.md → componentes/a11y/BarraNavegacion.tsx
- `Matriz HU → código → pruebas` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/matriz-hu.md → componentes/a11y/Confirmacion.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]

## Communities (163 total, 53 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.09
Nodes (27): compartido/archivos (R2 firmado, validación, PDF etiquetado), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-12 Recibo digital en PDF, PagoDigital, ReciboDigital (+19 more)

### Community 1 - "errores.ts"
Cohesion: 0.11
Nodes (12): POST, ErrorDeAplicacion, ErrorEnPausa, ErrorNoAutenticado, ErrorValidacion, MENSAJE_NO_COINCIDE, pedir(), T0 (+4 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.11
Nodes (29): GET, plantillaEmergenciaGarita(), plantillaRejaManual(), plantillaVisitaEnPuerta(), plantillaVisitaLlego(), buscarCasas(), consultar(), FilaBitacora (+21 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (21): Exclusión de gamificación (sin medallas, puntos ni rachas), Open Peeps (ilustraciones CC0), Cierre diferido de HU parciales ([~] / [-]), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales (+13 more)

### Community 4 - "Usuario"
Cohesion: 0.15
Nodes (16): CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA), HU-GAR-09 Desvincular a un ex residente, HU-GAR-11 Pedir un enlace nuevo, HU-GAR-21 Crear cuentas internas con rol, HU-GAR-22 Revocar acceso de un miembro interno (+8 more)

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

### Community 10 - "Anexo H de la tesis (arquitectura 4+1)"
Cohesion: 0.17
Nodes (12): Sin gamificación, AC-2 Baja carga cognitiva (<= 3 interacciones), Modo Senior ("Letra grande"), Tamaños mínimos, ADR-004 Perfil de accesibilidad en el servidor, Anexo H de la tesis (arquitectura 4+1), Equivalencia de nombres Anexo H -> repositorio, Matriz de dependencias permitidas entre módulos (+4 more)

### Community 11 - "Desviaciones respecto del Anexo H"
Cohesion: 0.16
Nodes (14): Prohibición de manejar secretos, ADR-006 Notificaciones por cola con copia interna, Cloudflare R2, Desviaciones respecto del Anexo H, Neon PostgreSQL, WhatsApp Cloud API (número de prueba), Adaptador de archivos R2 (URLs firmadas), Adaptador WhatsApp (+6 more)

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "entradaAlterna.ts"
Cohesion: 0.08
Nodes (52): ClaveNuevaConEnlace(), CrearAccesoEquipo(), hashDeToken(), nuevoToken(), ErrorConflicto, plantillaClaveCambiada(), plantillaClaveNueva(), plantillaInvitacionEquipo() (+44 more)

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
Cohesion: 0.28
Nodes (8): capasInternas(), MODULOS, MODULOS_PERMITIDOS, patronesDelModulo(), pureza, reglasDeModulos, rutasRelativas, eslint-config-next

### Community 34 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, administrador:crear, build, dev, estilos, lint, matriz, postinstall (+8 more)

### Community 35 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 36 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 37 - "empadronar.ts"
Cohesion: 0.10
Nodes (31): compartido_bd_generado_client_prisma, plantillaEnlaceAcceso(), DatosEmpadronamiento, empadronar(), MENSAJE_YA_REGISTRADO, personasDe(), validarEmpadronamiento(), ViviendaEmpadronada (+23 more)

### Community 38 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.43
Nodes (7): ADR-003 Worker separado con cerrojo, Render (worker Node.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker, Límites de los planes gratuitos

### Community 39 - "Evidencia de cierre · M1 Identidad: usuarios y control de acceso"
Cohesion: 0.07
Nodes (23): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · M1 Identidad: usuarios y control de acceso (+15 more)

### Community 40 - "Procedimiento por HU"
Cohesion: 0.22
Nodes (9): Uso del grafo graphify en el repo, Una HU por rama y por PR, Funciones de aptitud con ESLint, AC-7 Confidencialidad (404 a datos ajenos), Errores tipados de dominio (compartido/errores.ts), Conventional Commits en español, Procedimiento por HU, Etiquetas @HU (+1 more)

### Community 41 - "actas.ts"
Cohesion: 0.13
Nodes (21): GET, compartido_bd_generado_client_nivelurgencia, actaADto(), ActaDto, ActaPreparada, actasPublicadas(), descargarActa(), Fila (+13 more)

### Community 42 - "perfil/page.tsx"
Cohesion: 0.10
Nodes (19): GuiaPrimerUso(), elegirVista(), siguiente(), metadata, DescargarCopia(), metadata, MiPerfil(), clasesBotonBarra() (+11 more)

### Community 46 - "enviarJson"
Cohesion: 0.06
Nodes (35): ResolverSolicitud(), confirmar(), hoyEnLima(), PublicarActa(), publicar(), PublicarComunicado(), publicar(), DerivarReporte() (+27 more)

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.08
Nodes (33): GET, esquema, POST, USOS, codificar(), Credenciales, fechaAmz(), firmarUrl() (+25 more)

### Community 48 - "cambiarModoSenior.ts"
Cohesion: 0.11
Nodes (21): PUT, activarVistaGrandeAlEmpadronar(), cambiarModoSenior(), ADR-0004, cambiarSintesisVoz(), ADR-0004, aDto(), cargarPerfil() (+13 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.15
Nodes (18): aDto(), Fila, NoticiaDto, publicarComunicado(), ADR-0006, ultimasNoticias(), verNoticias(), DatosComunicado (+10 more)

### Community 50 - "contraste.ts"
Cohesion: 0.15
Nodes (16): aplanar(), hexadecimal(), luminancia(), MINIMOS, Modo, NodoToken, Par, paresAVerificar() (+8 more)

### Community 51 - "matriz-hu.mjs"
Cohesion: 0.15
Nodes (13): archivos(), casillas, cerradas, CODIGO, conAlgo, errores, ESTADO, filas (+5 more)

### Community 52 - "Fase 0b · Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.11
Nodes (29): Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12, Switch "Letra grande", tokens.json (fuente única de verdad) (+21 more)

### Community 53 - "balances.ts"
Cohesion: 0.14
Nodes (19): GET, esquema, GET, POST, balanceADto(), BalanceDto, balancesPublicados(), Fila (+11 more)

### Community 54 - "cliente.ts"
Cohesion: 0.07
Nodes (38): global, prisma, compartido_bd_generado_client_prismaclient, compartido_bd_generado_client_tipovehiculo, negarseEnNube(), Persona, PERSONAS, sembrar() (+30 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "entrarConEnlace.test.ts"
Cohesion: 0.08
Nodes (22): esquema, POST, esquema, POST, aceptarPolitica(), crearClaveRespaldo(), MENSAJE_FALTA_ACEPTAR, CredencialRespaldo (+14 more)

### Community 57 - "e2e.ts"
Cohesion: 0.20
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "avisos.test.ts"
Cohesion: 0.08
Nodes (25): compartido_bd_generado_client_avisoencola, despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote(), ResumenDespacho, ADR-0006 (+17 more)

### Community 59 - "Predio"
Cohesion: 0.09
Nodes (29): Estado de deuda no punitivo (nunca 'moroso'), Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), Cuota semanal, EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-01 Cálculo semanal de la deuda (worker) (+21 more)

### Community 60 - "padron/esquema.ts"
Cohesion: 0.17
Nodes (10): contador, dni, esquemaEmpadronamiento, esquemaPlacas, nombre, otro, telefono, titular (+2 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.11
Nodes (33): esquema, PATCH, esquema, POST, nombreDePantalla(), NOMBRES, Ayuda(), metadata (+25 more)

### Community 62 - "exigirRol"
Cohesion: 0.17
Nodes (20): compartido_bd_generado_client_nombrerol, primerNombre(), agregarAlEquipo(), buscarEnPadron(), cambiarRol(), listarEquipo(), miembroGestionable(), quitarAcceso() (+12 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 64 - "aplicacion/sesion.ts"
Cohesion: 0.11
Nodes (24): esquema, ADR-0004, cookieDeSesion(), esquema, POST, esquema, POST, esquema (+16 more)

### Community 65 - "consultarPadron.ts"
Cohesion: 0.11
Nodes (24): DarDeBaja(), Baja(), metadata, CAMPOS_DE_PLACAS, describirAccion(), etiquetaCampo(), Fila, FilaBase (+16 more)

### Community 66 - "guias.ts"
Cohesion: 0.05
Nodes (57): esquema, GET, POST, GET, Guia(), metadata, CALOR, cantidad() (+49 more)

### Community 67 - "e2e.mjs"
Cohesion: 0.20
Nodes (5): entorno, servidor, casos, ref_node_child_process, ref_node_path

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "quejas.ts"
Cohesion: 0.08
Nodes (39): BandejaIncidentes(), metadata, metadata, Reportar(), archivosSubidosPor(), compartido_bd_generado_client_categoriaqueja, compartido_bd_generado_client_entidadexterna, compartido_bd_generado_client_estadoqueja (+31 more)

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.07
Nodes (33): CamposPlacas(), PlacasEscritas, AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), Concepto (+25 more)

### Community 78 - "aplicacion/equipo.ts"
Cohesion: 0.12
Nodes (31): CambiarRolesPagina(), metadata, subconjuntos, plantillaRolCambiado(), administradorActivo(), cambiarRolesDeDirectiva(), modulos_identidad_aplicacion_equipo_diferenciaderoles, MiembroDto (+23 more)

### Community 79 - "exigirActor"
Cohesion: 0.06
Nodes (30): Ayuda(), metadata, Empadronar(), metadata, Actualizar(), metadata, AyudaEquipo(), metadata (+22 more)

### Community 80 - "modoSeniorAlRenderizar"
Cohesion: 0.11
Nodes (25): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, Catalogo(), Layout() (+17 more)

### Community 81 - "exigirSesion"
Cohesion: 0.06
Nodes (65): esquema, POST, deAfuera, esquema, POST, rol, POST, esquema (+57 more)

### Community 82 - "next"
Cohesion: 0.07
Nodes (22): metadata, metadata, FormularioEntradaClave(), FormularioPedirEnlace(), ICONOS, OpcionEntrada(), OtrasFormasDeEntrar(), Volver() (+14 more)

### Community 83 - "_sesion/sesion.ts"
Cohesion: 0.13
Nodes (16): EntrarConClave(), FormularioClave(), ClaveRespaldo(), metadata, EntradaEquipo(), metadata, FormularioPolitica(), metadata (+8 more)

### Community 84 - "avisos.ts"
Cohesion: 0.10
Nodes (28): PATCH, POST, filtro, GET, metadata, PreferenciasPagina(), Preferencias(), cambiar() (+20 more)

### Community 85 - "MensajeEstado"
Cohesion: 0.08
Nodes (48): Agregado, Encontrada, Errores, Opcion, CambiarRoles(), clave(), Combinacion, ROLES (+40 more)

### Community 86 - "ayuda-y-accesibilidad/page.tsx"
Cohesion: 0.14
Nodes (18): InterruptorVoz(), hayVozEnEspanol(), sintetizador(), suscribirVoces(), AyudaYAccesibilidad(), metadata, Escuchar(), leer() (+10 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "ejecutor.ts"
Cohesion: 0.12
Nodes (16): dynamic, GET(), comprobarBaseDatos(), depurarVencidos(), haceDias(), RETENCION_DIAS, VIDA_SESION_DIAS, ahora (+8 more)

### Community 89 - "react"
Cohesion: 0.09
Nodes (23): FormularioClaveNueva(), metadata, Errores, FormularioAccesoEquipo(), metadata, DemoDeshacer(), Consulta, MOTIVOS (+15 more)

### Community 90 - "rol/page.tsx"
Cohesion: 0.12
Nodes (15): Agregar(), metadata, metadata, QuitarAccesoPagina(), QuitarAcceso(), CambiarRol(), CambiarRolPagina(), metadata (+7 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.07
Nodes (59): metadata, Resolver(), ESTILO_INSIGNIA, FILTROS, metadata, SolicitudesDePrivacidad(), esquema, PATCH (+51 more)

### Community 92 - "aplicacion/seguimiento.ts"
Cohesion: 0.12
Nodes (25): AvanceDeMiReporte(), metadata, avanceADto(), consultarPorCodigo(), Fila, hashDeIp(), MENSAJE_CODIGO_NO_ENCONTRADO, MENSAJE_MUCHAS_CONSULTAS (+17 more)

### Community 93 - "instantaneaLocal.ts"
Cohesion: 0.17
Nodes (15): ConsultarGarita(), abrirPorEmergencia(), buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea (+7 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.14
Nodes (18): GET, esquema, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, fechaLarga(), anonimizar() (+10 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.13
Nodes (22): Auditoria(), enlace(), metadata, GET, ACCIONES, accionesDelModulo(), ACTOR_ANONIMO, describirAccion() (+14 more)

### Community 96 - "ErrorNoEncontrado"
Cohesion: 0.11
Nodes (36): Derivar(), metadata, ErrorNoEncontrado, 3. Matriz HU → código → prueba, nombresDe(), anioEnLima(), derivarQueja(), documentoDelOficio() (+28 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.34
Nodes (13): CLAUDE.md (instrucciones del proyecto), Plantilla de evidencia de cierre de módulo, Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, M6 · Accesibilidad y Diseño Centrado en el Usuario, M5 · Aportes Vecinales y Vigilancia, M4 · Asambleas y eventos pro fondos (+5 more)

### Community 101 - "lucide-react"
Cohesion: 0.08
Nodes (29): metadata, SECCIONES, GenerarEnlace(), Equipo(), metadata, BotonReenviar(), FichaVivienda(), metadata (+21 more)

### Community 102 - "balance.ts"
Cohesion: 0.19
Nodes (12): calcularTotales(), DatosBalance, esFechaReal(), esMontoValido(), hoyEnLima(), MAXIMO_CONCEPTO, MAXIMO_EGRESOS, MAXIMO_MONTO (+4 more)

### Community 103 - "visitas.ts"
Cohesion: 0.17
Nodes (22): Anular(), metadata, Nueva(), compartido_bd_generado_client_estadogarita, actualizarEstadoMorosidad(), aDto(), anularVisita(), MENSAJE_VISITAS_EN_PAUSA (+14 more)

### Community 104 - "cancelacion.test.ts"
Cohesion: 0.14
Nodes (22): esquema, POST, compartido_bd_generado_client_estadoarco, compartido_bd_generado_client_tipoarco, plantillaCancelacionPedida(), cambiarOposicion(), cargarUsuario(), miPerfil() (+14 more)

### Community 105 - "Boton.tsx"
Cohesion: 0.08
Nodes (26): DemoConfirmacion(), Bitacora(), FILTROS, metadata, AccionGarita(), enviar(), ICONOS, enlaceBitacora() (+18 more)

### Community 106 - "(vecino)/page.tsx"
Cohesion: 0.11
Nodes (21): MasOpciones(), metadata, metadata, PanelAdministracion(), MasOpciones(), metadata, metadata, ResumenDirectiva() (+13 more)

### Community 107 - "garita.test.ts"
Cohesion: 0.16
Nodes (11): DELETE, PATCH, respuesta, esquema, POST, guardarRespuesta(), marcarRespuestaTelefono(), preguntarAlVecino() (+3 more)

### Community 108 - "Transaccion"
Cohesion: 0.25
Nodes (10): EntradaAuditoria, Transaccion, compartido_bd_generado_client, compartido_bd_generado_client_tipoaviso, encolarAvisos(), ADR-0006, vecinosDeLaComunidad(), idsDeVecinosActivos() (+2 more)

### Community 109 - "gestionarPadron.ts"
Cohesion: 0.21
Nodes (17): registrarAuditoria(), ErrorReglaNegocio, plantillaBajaPadron(), generarEnlaceDeInvitacion(), actualizarPredio(), darDeBajaResidente(), cambiosDeOcupacion(), MAXIMO_POR_CONCEPTO (+9 more)

### Community 110 - "Regla de capas dominio/aplicacion/infraestructura"
Cohesion: 0.29
Nodes (7): Monolito modular (ADR-001), Regla de capas dominio/aplicacion/infraestructura, Vercel (app Next.js), Dominio sin dependencias (fecha como parámetro), Migraciones Prisma, Rollback por pieza, Base de datos de pruebas

### Community 112 - "acta.ts"
Cohesion: 0.19
Nodes (12): revisar(), DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO (+4 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 125 - "encolarAviso"
Cohesion: 0.29
Nodes (17): esquema, POST, vecino, horaCorta(), encolarAviso(), abrirPorEmergencia(), aFila(), anotarEntradaVecino() (+9 more)

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 127 - "queja.ts"
Cohesion: 0.20
Nodes (15): anonimizar(), datosPersonales(), quejaADto(), codigoTicket(), DatosQueja, esCoordenada(), lugarEnTexto(), MAXIMO_EVIDENCIAS (+7 more)

### Community 128 - "[id]/oficio/route.ts"
Cohesion: 0.23
Nodes (11): GET, respuestaPdf(), GET, GET, ipDe(), nombreDelArchivo(), oficioDeLaQueja(), oficioParaDirectiva() (+3 more)

### Community 129 - "aplicacion/historial.ts"
Cohesion: 0.19
Nodes (10): GET, ActasYBalances(), metadata, Actas, Balance, historialPublico(), RegistroDeHistorial, ROLES_VECINO (+2 more)

### Community 131 - "balances/[id]/page.tsx"
Cohesion: 0.21
Nodes (11): hoyEnLima(), nuevoGasto(), PublicarBalance(), publicar(), revisar(), Balance(), metadata, aCentimos() (+3 more)

### Community 132 - "tokens/generar-css.mjs"
Cohesion: 0.25
Nodes (10): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+2 more)

### Community 133 - "Lista de comprobación por pantalla"
Cohesion: 0.14
Nodes (17): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), Prohibición de datos reales, AC-1 Accesibilidad (0 violaciones axe), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Semillas ficticias (personajes del prototipo) (+9 more)

### Community 134 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.12
Nodes (14): Confirmacion(), 1. HU de la fase, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido (+6 more)

### Community 135 - "ref_node_fs"
Cohesion: 0.33
Nodes (4): ADR-0006, cypress, ref_node_fs, pg

### Community 136 - "AC-6 Auditoría en la misma transacción"
Cohesion: 0.29
Nodes (8): AC-6 Auditoría en la misma transacción, Casos de uso (una función por archivo), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio), registrarAuditoria(), Tabla nucleo_auditoria, Restricciones en la base (solo inserción, UNIQUE)

### Community 137 - "lintear.mjs"
Cohesion: 0.40
Nodes (4): casos, eslint, resultados, eslint

### Community 141 - "repositorioGarita.ts"
Cohesion: 0.18
Nodes (13): compartido_bd_generado_client_estadovisita, compartido_bd_generado_client_modoacceso, compartido_bd_generado_client_tiporegistroacceso, bitacora(), marcarSalida(), anotarSalida(), buscarRegistro(), directivaActiva() (+5 more)

### Community 142 - "avisarDenunciante.ts"
Cohesion: 0.25
Nodes (11): plantillaNovedadReporte(), telefonoDe(), avisarAlDenunciante(), ADR-0006, cifrar(), clave(), descifrar(), Entorno (+3 more)

### Community 143 - "verVisitaEnGarita"
Cohesion: 0.24
Nodes (11): InicioGarita(), inicioDelDiaEnLima(), rangoHorario(), anunciada(), vehiculoDe(), verificarVisita(), verVisitaEnGarita(), visitasDeHoy() (+3 more)

### Community 144 - "quejas/route.ts"
Cohesion: 0.24
Nodes (8): GET, coordenada, esquema, GET, POST, bloqueDeReportes(), misQuejas(), quejasDe()

### Community 145 - "Reglas duras del proyecto"
Cohesion: 0.29
Nodes (8): Todo el código en español, Montos en céntimos enteros y fechas en UTC, Reglas duras del proyecto, Sin sobreingeniería, ADR-007 Esquema único con separación lógica por módulo, Eventos como llamadas síncronas (sin bus), Convenciones de nombres de BD, Esquema Prisma por módulo

### Community 146 - "HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos"
Cohesion: 0.29
Nodes (8): Toast que no desaparece solo, HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos, HU-COB-11 Cobro en efectivo sin conexión, Idempotencia por idOperacionLocal (UNIQUE), Pago (abstracta), PagoPresencial, DelegacionVoto, HU-ASA-06 Delegar el voto en un apoderado

### Community 148 - "visitaPorResponder"
Cohesion: 0.33
Nodes (6): metadata, Responder(), visitaPorResponder(), dniTerminadoEn(), nombreDeUsuario(), visitaConPredio()

### Community 149 - "AC-5 Idempotencia por idOperacion"
Cohesion: 0.29
Nodes (7): ADR-005 Rutas asistidas y sin conexión en el dominio, AC-5 Idempotencia por idOperacion, Derechos ARCO, Ley N.° 29733 protección de datos personales, Cola local de cobros sin conexión, Instantánea del padrón en la garita (AC-4), PWA con service worker propio

### Community 150 - "padron/page.tsx"
Cohesion: 0.47
Nodes (5): enlaceFiltro(), metadata, Padron(), Parametros, plural()

### Community 151 - "claves.ts"
Cohesion: 0.60
Nodes (4): crearAdministradorInicial(), cifrarClave(), claveCoincide(), derivar()

### Community 152 - "BuscarConCodigo.tsx"
Cohesion: 0.60
Nodes (3): AvanceReporte(), ICONO, AvanceDto

## Knowledge Gaps
- **689 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+684 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 950 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Predio`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `aplicacion/historial.ts`, `balances/[id]/page.tsx`, `package.json`, `visitaPorResponder`, `padron/page.tsx`, `BuscarConCodigo.tsx`, `perfil/page.tsx`, `enviarJson`, `mediacion.ts`, `consultarPadron.ts`, `guias.ts`, `jest.config.ts`, `quejas.ts`, `AsistenteEmpadronar.tsx`, `aplicacion/equipo.ts`, `exigirActor`, `modoSeniorAlRenderizar`, `exigirSesion`, `_sesion/sesion.ts`, `avisos.ts`, `MensajeEstado`, `ayuda-y-accesibilidad/page.tsx`, `react`, `rol/page.tsx`, `aplicacion/arco.ts`, `aplicacion/seguimiento.ts`, `instantaneaLocal.ts`, `auditoria.ts`, `ErrorNoEncontrado`, `lucide-react`, `visitas.ts`, `Boton.tsx`, `(vecino)/page.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `Fidelidad al prototipo` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `Boton.tsx`, `Plan de implementación`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _689 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.09116809116809117 - nodes in this community are weakly interconnected._
- **Should `errores.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11076923076923077 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10984848484848485 - nodes in this community are weakly interconnected._