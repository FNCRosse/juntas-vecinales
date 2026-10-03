# Graph Report - juntas-vecinales  (2026-10-03)

## Corpus Check
- 429 files · ~294,380 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .prisma 5, (none) 3, .example 1)

## Summary
- 2227 nodes · 6708 edges · 153 communities (108 shown, 45 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2be217e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- exigirActor
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Predio
- fechas.ts
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Panel de inicio del vecino (HU-GAR-19)
- Adaptador WhatsApp
- guia-visual/generar-css.mjs
- visitas.ts
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
- Reglas duras del proyecto
- actas.ts
- GuiaPrimerUso.tsx
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- entrarConEnlace.test.ts
- unitarias/nucleo/archivos.test.ts
- perfil/route.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- balances.ts
- errores.ts
- dependencies
- garita.test.ts
- e2e.ts
- avisos.test.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- Boton
- mediacion.ts
- aplicacion/equipo.ts
- lenguajeLlano.test.ts
- canjear/route.ts
- consultarPadron.ts
- aplicacion/sesion.ts
- ref_node_child_process
- jest.config.ts
- tabularHasta
- InterruptorVoz
- area-tactil.cy.ts
- catalogo.cy.ts
- revisar-estilos.sh
- letra-grande.cy.ts
- AsistenteEmpadronar.tsx
- entradaAlterna.ts
- next
- modoSeniorAlRenderizar
- leerJson
- Opciones.tsx
- _sesion/sesion.ts
- enviarJson
- lucide-react
- exigirSesion
- compilerOptions
- prisma
- MensajeEstado
- administracion/equipo/page.tsx
- aplicacion/arco.ts
- PerfilAccesibilidad
- ConsultarGarita.tsx
- arco.test.ts
- auditoria.ts
- ErrorNoEncontrado
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- Boton.tsx
- balance.ts
- cuentas/route.ts
- cancelacion.test.ts
- AgregarAlEquipo.tsx
- (vecino)/page.tsx
- ayuda-y-accesibilidad/page.tsx
- cliente.ts
- administracion/privacidad/page.tsx
- Desviaciones respecto del Anexo H
- encolarAviso
- acta.ts
- HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts
- solicitarRectificacion
- escuchar.cy.ts
- catalogo/layout.tsx
- aplicacion/historial.ts
- comunicados.cy.ts
- balances/[id]/page.tsx
- tokens/generar-css.mjs
- Lista de comprobación por pantalla
- Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido
- ref_node_fs
- Casos de uso (una función por archivo)
- lintear.mjs
- actas.cy.ts
- balances.cy.ts
- historial.cy.ts
- gestionarPadron.ts
- equipo.test.ts
- fechaYHora
- repositorioPadron.ts
- claves.ts
- AyudaEquipo
- gestionarPadron.test.ts
- plantillas.ts
- direccion
- entrar/privacidad/page.tsx
- app/layout.tsx
- PreguntarAlVecino

## God Nodes (most connected - your core abstractions)
1. `next` - 104 edges
2. `MensajeEstado()` - 101 edges
3. `exigirActor()` - 93 edges
4. `exigirSesion()` - 93 edges
5. `Boton()` - 81 edges
6. `lucide-react` - 74 edges
7. `leerJson()` - 69 edges
8. `react` - 65 edges
9. `enviarJson()` - 64 edges
10. `prisma` - 63 edges

## Surprising Connections (you probably didn't know these)
- `Matriz HU → código → pruebas` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/matriz-hu.md → componentes/a11y/Confirmacion.tsx
- `1. HU de la fase` --references--> `manejar()`  [INFERRED]
  docs/evidencias/F0b.md → compartido/manejar.ts
- `1. HU de la fase` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/a11y/Confirmacion.tsx
- `7. Pendientes y decisiones` --references--> `css()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/tokens/generar-css.mjs
- `1. HU del módulo` --references--> `anonimizar()`  [INFERRED]
  docs/evidencias/M1.md → modulos/accesibilidad/aplicacion/datosPersonales.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]

## Communities (153 total, 45 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.08
Nodes (30): compartido/archivos (R2 firmado, validación, PDF etiquetado), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, HU-COB-12 Recibo digital en PDF, Pago (abstracta) (+22 more)

### Community 1 - "exigirActor"
Cohesion: 0.08
Nodes (21): Empadronar(), metadata, metadata, NuevaActa(), metadata, NuevoBalance(), metadata, NuevoComunicado() (+13 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.10
Nodes (30): inicioDelDiaEnLima(), bitacora(), FilaBitacora, marcarSalida(), PredioConResidentes, Registro, verificarVisita(), VisitaGarita (+22 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (18): Open Peeps (ilustraciones CC0), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales, HU-GAR-13 Rectificación de datos, HU-GAR-14 Cancelación de la cuenta (+10 more)

### Community 4 - "Predio"
Cohesion: 0.11
Nodes (23): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA) (+15 more)

### Community 5 - "fechas.ts"
Cohesion: 0.35
Nodes (9): metadata, PanelAdministracion(), metadata, ResumenDirectiva(), fechaLarga(), primerNombre(), saludo(), plantillaSolicitudPrivacidad() (+1 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Queja"
Cohesion: 0.09
Nodes (22): compartido/notificaciones (cola, worker, adaptador Meta + simulador), EstadoCuenta, HU-COB-02 Estado de cuenta privado, CheckInPresencial, ConfirmacionAsistencia (DIGITAL / ASISTIDA), HU-ASA-02 Confirmar asistencia, HU-ASA-03 Confirmación asistida por el mediador, HU-ASA-07 Check-in presencial y quórum definitivo (+14 more)

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.29
Nodes (11): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2), Derechos ARCO (+3 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (21): engines, node, name, private, version, prettier, prisma, @prisma/adapter-pg (+13 more)

### Community 10 - "Panel de inicio del vecino (HU-GAR-19)"
Cohesion: 0.14
Nodes (11): AC-2 Baja carga cognitiva (<= 3 interacciones), Modo Senior ("Letra grande"), Tamaños mínimos, Semillas ficticias (personajes del prototipo), Grupos de rutas por actor, Panel de inicio del vecino (HU-GAR-19), Server Components por defecto, Tokens, Tailwind v4 y Radix (+3 more)

### Community 11 - "Adaptador WhatsApp"
Cohesion: 0.16
Nodes (9): Neon PostgreSQL, WhatsApp Cloud API (número de prueba), Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones, Entornos (local, CI, preview, producción), Variables de entorno (sin valores) (+1 more)

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "visitas.ts"
Cohesion: 0.17
Nodes (22): DELETE, actualizarEstadoMorosidad(), aDto(), anularVisita(), MENSAJE_VISITAS_EN_PAUSA, misVisitas(), miVivienda(), registrarVisita() (+14 more)

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
Cohesion: 0.15
Nodes (16): plantillaEnlaceAcceso(), DatosEmpadronamiento, MENSAJE_YA_REGISTRADO, personasDe(), validarEmpadronamiento(), ViviendaEmpadronada, NOMBRE_RELACION, PersonaEnFormulario (+8 more)

### Community 38 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.43
Nodes (6): Render (worker Node.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker, Límites de los planes gratuitos

### Community 39 - "Evidencia de cierre · M1 Identidad: usuarios y control de acceso"
Cohesion: 0.10
Nodes (17): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · M1 Identidad: usuarios y control de acceso (+9 more)

### Community 40 - "Reglas duras del proyecto"
Cohesion: 0.17
Nodes (11): Uso del grafo graphify en el repo, AC-5 Idempotencia por idOperacion, AC-6 Auditoría en la misma transacción, AC-7 Confidencialidad (404 a datos ajenos), registrarAuditoria(), Tabla nucleo_auditoria, Conventional Commits en español, Procedimiento por HU (+3 more)

### Community 41 - "actas.ts"
Cohesion: 0.13
Nodes (22): GET, exigirRol(), actaADto(), ActaDto, ActaPreparada, actasPublicadas(), descargarActa(), Fila (+14 more)

### Community 42 - "GuiaPrimerUso.tsx"
Cohesion: 0.32
Nodes (5): AvisoInstalar, GuiaPrimerUso(), PASOS, Guia(), metadata

### Community 46 - "entrarConEnlace.test.ts"
Cohesion: 0.09
Nodes (18): MENSAJE_ENLACE_NO_SIRVE, aceptarPolitica(), crearClaveRespaldo(), MENSAJE_FALTA_ACEPTAR, CredencialRespaldo, DatosCredencial, LARGO_MINIMO_CLAVE, MAX_FALLOS (+10 more)

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.11
Nodes (22): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), configuracion() (+14 more)

### Community 48 - "perfil/route.ts"
Cohesion: 0.22
Nodes (14): esquema, PUT, ADR-0004, cambiarModoSenior(), cambiarSintesisVoz(), aDto(), cargarPerfil(), DuenoPerfil (+6 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.16
Nodes (16): aDto(), Fila, publicarComunicado(), ADR-0006, verNoticias(), DatosComunicado, MAXIMO_CUERPO, MAXIMO_TITULO (+8 more)

### Community 50 - "contraste.ts"
Cohesion: 0.15
Nodes (15): aplanar(), hexadecimal(), luminancia(), MINIMOS, Modo, NodoToken, Par, paresAVerificar() (+7 more)

### Community 51 - "matriz-hu.mjs"
Cohesion: 0.15
Nodes (13): archivos(), casillas, cerradas, CODIGO, conAlgo, errores, ESTADO, filas (+5 more)

### Community 52 - "Fase 0b · Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.09
Nodes (31): Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12, Switch "Letra grande", tokens.json (fuente única de verdad) (+23 more)

### Community 53 - "balances.ts"
Cohesion: 0.14
Nodes (18): archivosSubidosPor(), balanceADto(), BalanceDto, Fila, FilaBalance, publicarBalance(), ROLES_DIRECTIVA, ROLES_VECINO (+10 more)

### Community 54 - "errores.ts"
Cohesion: 0.07
Nodes (30): POST, negarseEnNube(), Persona, PERSONAS, sembrar(), ErrorDeAplicacion, ErrorEnPausa, ErrorNoAutenticado (+22 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "garita.test.ts"
Cohesion: 0.12
Nodes (17): GET, PATCH, buscarCasas(), consultar(), guardarRespuesta(), hashDeDni(), instantanea(), marcarRespuestaTelefono() (+9 more)

### Community 57 - "e2e.ts"
Cohesion: 0.20
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "avisos.test.ts"
Cohesion: 0.12
Nodes (24): PATCH, POST, filtro, GET, esquema, PUT, contarNoLeidas(), listarNotificaciones() (+16 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (17): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita (+9 more)

### Community 60 - "Boton"
Cohesion: 0.20
Nodes (14): DemoConfirmacion(), Catalogo(), MarcarLeido(), MarcarTodos(), Avisos(), metadata, ROLES_VECINO, Boton() (+6 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.12
Nodes (28): nombreDePantalla(), NOMBRES, Ayuda(), metadata, plantillaPedidoAyuda(), Actor, aDto(), cambiarEstadoApoyo() (+20 more)

### Community 62 - "aplicacion/equipo.ts"
Cohesion: 0.21
Nodes (17): plantillaRolCambiado(), buscarEnPadron(), cambiarRol(), consultarInvitacion(), listarEquipo(), MiembroDto, miembroGestionable(), PersonaDelEquipo (+9 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 64 - "canjear/route.ts"
Cohesion: 0.21
Nodes (15): cookieDeSesion(), esquema, POST, esquema, POST, esquema, esquema, POST (+7 more)

### Community 65 - "consultarPadron.ts"
Cohesion: 0.11
Nodes (24): Actualizar(), metadata, Baja(), metadata, CAMPOS_DE_PLACAS, describirAccion(), etiquetaCampo(), Fila (+16 more)

### Community 66 - "aplicacion/sesion.ts"
Cohesion: 0.29
Nodes (8): GET, esquema, POST, USOS, firmarDescarga(), descargarSiPuede(), pedirSubida(), NombreRol

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "InterruptorVoz"
Cohesion: 0.19
Nodes (12): InterruptorVoz(), hayVozEnEspanol(), sintetizador(), suscribirVoces(), Escuchar(), leer(), Estado, elegirVoz() (+4 more)

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.08
Nodes (37): CamposPlacas(), PlacasEscritas, AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), CasillaDni() (+29 more)

### Community 78 - "entradaAlterna.ts"
Cohesion: 0.10
Nodes (44): registrarAuditoria(), hashDeToken(), nuevoToken(), ErrorConflicto, ErrorValidacion, plantillaClaveCambiada(), pasarPerfilALaCuenta(), asignarPerfilSinDueno() (+36 more)

### Community 79 - "next"
Cohesion: 0.10
Nodes (32): metadata, PoliticaDePrivacidad(), SECCIONES, MasOpciones(), metadata, enlaceFiltro(), metadata, Padron() (+24 more)

### Community 80 - "modoSeniorAlRenderizar"
Cohesion: 0.18
Nodes (19): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, Layout(), Layout() (+11 more)

### Community 81 - "leerJson"
Cohesion: 0.10
Nodes (21): esquema, PATCH, esquema, PATCH, esquema, POST, POST, esquema (+13 more)

### Community 82 - "Opciones.tsx"
Cohesion: 0.16
Nodes (16): ClaveNueva(), metadata, FormularioPedirEnlace(), ICONOS, OpcionEntrada(), OtrasFormasDeEntrar(), Volver(), EnlaceNuevo() (+8 more)

### Community 83 - "_sesion/sesion.ts"
Cohesion: 0.27
Nodes (10): EntrarConClave(), metadata, FormularioEntradaClave(), ClaveRespaldo(), metadata, EntradaEquipo(), metadata, inicioSegunRoles() (+2 more)

### Community 84 - "enviarJson"
Cohesion: 0.09
Nodes (29): Equipo(), hoyEnLima(), PublicarActa(), publicar(), Gasto, hoyEnLima(), nuevoGasto(), PublicarBalance() (+21 more)

### Community 85 - "lucide-react"
Cohesion: 0.13
Nodes (23): Errores, FormularioClave(), Solicitud, VACIO, Urgencia, URGENCIAS, Resultado, Casa (+15 more)

### Community 86 - "exigirSesion"
Cohesion: 0.10
Nodes (29): esquema, POST, GET, GET, GET, respuesta, esquema, POST (+21 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "prisma"
Cohesion: 0.06
Nodes (39): dynamic, GET(), prisma, comprobarBaseDatos(), despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno() (+31 more)

### Community 89 - "MensajeEstado"
Cohesion: 0.11
Nodes (18): FormularioClaveNueva(), ClaveNuevaConEnlace(), metadata, FormularioAccesoEquipo(), CrearAccesoEquipo(), metadata, OPCIONES, DescargarCopia() (+10 more)

### Community 90 - "administracion/equipo/page.tsx"
Cohesion: 0.11
Nodes (18): Agregar(), metadata, metadata, metadata, QuitarAccesoPagina(), CambiarRolPagina(), metadata, verMiembro() (+10 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.13
Nodes (27): plantillaNumeroCambiado(), aFila(), AnonimizarEnOtroModulo, avisarCambioDeNumero(), insignia(), Solicitud, CampoRectificable, CAMPOS (+19 more)

### Community 92 - "PerfilAccesibilidad"
Cohesion: 0.15
Nodes (4): DatosPerfil, EscalaTipografica, PerfilAccesibilidad, ADR-0004

### Community 93 - "ConsultarGarita.tsx"
Cohesion: 0.15
Nodes (19): Consulta, ConsultarGarita(), abrirPorEmergencia(), buscar(), MOTIVOS, Respuesta, abrir(), buscarEnInstantanea() (+11 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.15
Nodes (15): GET, esquema, PATCH, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, anonimizar() (+7 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.15
Nodes (18): Auditoria(), enlace(), metadata, ACCIONES, accionesDelModulo(), describirAccion(), ModuloAuditoria, MODULOS_AUDITORIA (+10 more)

### Community 96 - "ErrorNoEncontrado"
Cohesion: 0.16
Nodes (15): metadata, Resolver(), ErrorNoEncontrado, ErrorReglaNegocio, aplicarRectificacion(), exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco() (+7 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.30
Nodes (15): CLAUDE.md (instrucciones del proyecto), Plantilla de evidencia de cierre de módulo, Cierre de módulo, Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, Matriz HU -> código -> pruebas (npm run matriz), M6 · Accesibilidad y Diseño Centrado en el Usuario (+7 more)

### Community 101 - "Boton.tsx"
Cohesion: 0.17
Nodes (14): Bitacora(), FILTROS, metadata, AccionGarita(), enviar(), ICONOS, Dato(), enlaceBitacora() (+6 more)

### Community 102 - "balance.ts"
Cohesion: 0.19
Nodes (12): calcularTotales(), DatosBalance, esFechaReal(), esMontoValido(), hoyEnLima(), MAXIMO_CONCEPTO, MAXIMO_EGRESOS, MAXIMO_MONTO (+4 more)

### Community 103 - "cuentas/route.ts"
Cohesion: 0.10
Nodes (20): deAfuera, esquema, POST, rol, POST, contador, dni, esquemaEmpadronamiento (+12 more)

### Community 104 - "cancelacion.test.ts"
Cohesion: 0.13
Nodes (19): esquema, POST, plantillaCancelacionPedida(), cambiarOposicion(), miPerfil(), prefiereUbicacionGeneralizada(), solicitarCancelacion(), solicitarCopia() (+11 more)

### Community 105 - "AgregarAlEquipo.tsx"
Cohesion: 0.10
Nodes (17): Agregado, AgregarAlEquipo(), Encontrada, Errores, QuitarAcceso(), CambiarRol(), Lista(), Opcion (+9 more)

### Community 106 - "(vecino)/page.tsx"
Cohesion: 0.23
Nodes (11): metadata, Noticias(), TarjetaNoticia(), Inicio(), metadata, obtenerPerfil(), ADR-0004, PerfilAccesibilidadDto (+3 more)

### Community 107 - "ayuda-y-accesibilidad/page.tsx"
Cohesion: 0.19
Nodes (14): AyudaYAccesibilidad(), metadata, clasesBotonBarra(), Encabezado(), Isologo(), EnlaceAyuda(), aplicarModo(), enSenior() (+6 more)

### Community 108 - "cliente.ts"
Cohesion: 0.18
Nodes (11): EntradaAuditoria, global, Transaccion, AvisoNuevo, encolarAvisos(), ADR-0006, ADR-0007, vecinosDeLaComunidad() (+3 more)

### Community 109 - "administracion/privacidad/page.tsx"
Cohesion: 0.22
Nodes (7): ESTILO_INSIGNIA, FILTROS, metadata, SolicitudesDePrivacidad(), bandejaArco(), FilaArco, solicitudesParaLaBandeja()

### Community 110 - "Desviaciones respecto del Anexo H"
Cohesion: 0.12
Nodes (12): Anexo H de la tesis (arquitectura 4+1), Cloudflare R2, Equivalencia de nombres Anexo H -> repositorio, Funciones de aptitud con ESLint, Matriz de dependencias permitidas entre módulos, Vercel (app Next.js), Adaptador de archivos R2 (URLs firmadas), Convenciones de nombres de BD (+4 more)

### Community 111 - "encolarAviso"
Cohesion: 0.29
Nodes (17): esquema, POST, vecino, horaCorta(), encolarAviso(), abrirPorEmergencia(), aFila(), anotarEntradaVecino() (+9 more)

### Community 112 - "acta.ts"
Cohesion: 0.21
Nodes (11): DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO, porLinea() (+3 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 125 - "solicitarRectificacion"
Cohesion: 0.47
Nodes (6): cargarUsuario(), datosPersonales(), solicitarRectificacion(), errorDeRectificacion(), leerCelular(), leerVivienda()

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 129 - "aplicacion/historial.ts"
Cohesion: 0.21
Nodes (9): ActasYBalances(), metadata, Actas, Balance, historialPublico(), RegistroDeHistorial, ROLES_VECINO, ordenarHistorial() (+1 more)

### Community 131 - "balances/[id]/page.tsx"
Cohesion: 0.44
Nodes (5): Balance(), metadata, soles(), GraficoBalance(), Totales

### Community 132 - "tokens/generar-css.mjs"
Cohesion: 0.25
Nodes (10): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+2 more)

### Community 133 - "Lista de comprobación por pantalla"
Cohesion: 0.27
Nodes (10): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Definition of Done de una HU, Componente Confirmacion (+2 more)

### Community 134 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.29
Nodes (7): 1. HU de la fase, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido

### Community 136 - "Casos de uso (una función por archivo)"
Cohesion: 0.40
Nodes (5): Casos de uso (una función por archivo), Errores tipados de dominio (compartido/errores.ts), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio)

### Community 137 - "lintear.mjs"
Cohesion: 0.40
Nodes (4): casos, eslint, resultados, eslint

### Community 141 - "gestionarPadron.ts"
Cohesion: 0.22
Nodes (16): plantillaBajaPadron(), actualizarPredio(), darDeBajaResidente(), conRolDeEquipo(), cambiosDeOcupacion(), MAXIMO_POR_CONCEPTO, MotivoBajaResidente, MOTIVOS_BAJA_RESIDENTE (+8 more)

### Community 142 - "equipo.test.ts"
Cohesion: 0.15
Nodes (7): esquema, POST, esquema, PATCH, DELETE, esquema, T0

### Community 143 - "fechaYHora"
Cohesion: 0.19
Nodes (9): BotonReenviar(), FichaVivienda(), metadata, CambiarEstado(), pasarA(), metadata, PedidosDeAyuda(), PedirAyuda() (+1 more)

### Community 144 - "repositorioPadron.ts"
Cohesion: 0.23
Nodes (10): revisarVehiculos(), SIN_PLACAS, GRUPOS, Placas, prepararPlacas(), TipoVehiculoPlaca, buscarVehiculosPorPlaca(), FiltrosPadron (+2 more)

### Community 145 - "claves.ts"
Cohesion: 0.24
Nodes (9): crearAdministradorInicial(), cifrarClave(), claveCoincide(), derivar(), cerrarSesion(), obtenerSesion(), buscarSesionVigente(), marcarUso() (+1 more)

### Community 146 - "AyudaEquipo"
Cohesion: 0.27
Nodes (8): Ayuda(), metadata, AyudaEquipo(), Ayuda(), metadata, Ayuda(), metadata, contactoDeAdministracion()

### Community 147 - "gestionarPadron.test.ts"
Cohesion: 0.25
Nodes (3): contador, esquema, PATCH

### Community 148 - "plantillas.ts"
Cohesion: 0.22
Nodes (8): plantillaClaveNueva(), plantillaEmergenciaGarita(), plantillaInvitacionEquipo(), plantillaRejaManual(), plantillaVisitaEnPuerta(), plantillaVisitaLlego(), preguntarAlVecino(), crearVisitaNoAnunciada()

### Community 149 - "direccion"
Cohesion: 0.48
Nodes (7): rangoHorario(), anunciada(), vehiculoDe(), verVisitaEnGarita(), visitasDeHoy(), llegaAHora(), direccion()

### Community 150 - "entrar/privacidad/page.tsx"
Cohesion: 0.40
Nodes (4): FormularioPolitica(), metadata, Privacidad(), PUNTOS

### Community 151 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): atkinson, metadata, RootLayout(), ADR-0004

### Community 152 - "PreguntarAlVecino"
Cohesion: 0.50
Nodes (3): metadata, VisitaNoAnunciada(), PreguntarAlVecino()

## Knowledge Gaps
- **581 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+576 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 781 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `tokens/generar-css.mjs`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `1. HU de la fase` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `Boton`, `exigirSesion`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _581 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.07956989247311828 - nodes in this community are weakly interconnected._
- **Should `exigirActor` be split into smaller, more focused modules?**
  _Cohesion score 0.08143939393939394 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10158730158730159 - nodes in this community are weakly interconnected._