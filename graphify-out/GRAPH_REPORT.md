# Graph Report - juntas-vecinales  (2026-10-16)

## Corpus Check
- 538 files · ~462,583 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .prisma 6, (none) 3, .example 1)

## Summary
- 2706 nodes · 8142 edges · 175 communities (118 shown, 57 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6ef7dc9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- aplicacion/sesion.ts
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Usuario
- aplicacion/mapa.ts
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Matriz HU -> código -> pruebas (npm run matriz)
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
- integracion/identidad/entradaAlterna.test.ts
- Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido
- Reglas duras del proyecto
- actas.ts
- GuiaPrimerUso.tsx
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- PublicarActa
- unitarias/nucleo/archivos.test.ts
- cambiarModoSenior.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- balances.ts
- errores.ts
- dependencies
- entrarConEnlace.test.ts
- e2e.ts
- actas.test.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- leerJson
- mediacion.ts
- (vecino)/page.tsx
- lenguajeLlano.test.ts
- zod
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
- asistido/page.tsx
- exigirActor
- exigirSesion
- sesionActual
- derivacion.test.ts
- avisos.test.ts
- lucide-react
- TarjetaNoticia.tsx
- compilerOptions
- prisma
- avisos/page.tsx
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
- next
- balance.ts
- (vecino)/visitas/nueva/page.tsx
- solicitudes/route.ts
- fechaYHora
- archivos/route.ts
- Predio
- cliente.ts
- gestionarPadron.ts
- emitirEnlace.ts
- acta.ts
- HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts
- repositorioArco.ts
- escuchar.cy.ts
- queja.ts
- credencialRespaldo.ts
- aplicacion/historial.ts
- comunicados.cy.ts
- balances/[id]/page.tsx
- tokens/generar-css.mjs
- Lista de comprobación por pantalla
- BarraNavegacion.tsx
- PerfilAccesibilidad
- AsistenteEmpadronar
- fechaLarga
- actas.cy.ts
- balances.cy.ts
- historial.cy.ts
- obtenerPerfil
- avisarDenunciante.ts
- resolverSolicitudArco
- quejas/route.ts
- Comprobante
- HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos
- ElegirLugar
- actas/route.ts
- Evidencia de cierre · M1 Identidad: usuarios y control de acceso
- Evidencia de cierre · M2 Transparencia y rendición de cuentas
- claves.ts
- cancelar/page.tsx
- corregir/page.tsx
- barra-navegacion.cy.ts
- garita/visitas/nueva/page.tsx
- equipo.cy.ts
- nueva/[token]/page.tsx
- crear/[token]/page.tsx
- [predioId]/route.ts
- visitas/route.ts
- catalogo/layout.tsx
- Preferencias
- fechaLimite
- CambiarRoles
- EvaluarReporte
- RegistrarSolucion

## God Nodes (most connected - your core abstractions)
1. `next` - 125 edges
2. `exigirSesion()` - 119 edges
3. `exigirActor()` - 115 edges
4. `lucide-react` - 96 edges
5. `ErrorNoEncontrado` - 85 edges
6. `leerJson()` - 85 edges
7. `enviarJson()` - 83 edges
8. `prisma` - 80 edges
9. `react` - 79 edges
10. `manejar()` - 68 edges

## Surprising Connections (you probably didn't know these)
- `2. Qué cambió en el prototipo y el sitio todavía no lo tiene` --references--> `CambiarDePerfil()`  [INFERRED]
  docs/FIDELIDAD_PROTOTIPO.md → app/_sesion/CambiarDePerfil.tsx
- `1. HU de la fase` --references--> `manejar()`  [INFERRED]
  docs/evidencias/F0b.md → compartido/manejar.ts
- `3. Orden de trabajo` --references--> `AvisoDeshacer()`  [INFERRED]
  docs/FIDELIDAD_PROTOTIPO.md → componentes/a11y/AvisoDeshacer.tsx
- `Matriz HU → código → pruebas` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/matriz-hu.md → componentes/a11y/Confirmacion.tsx
- `2. Qué cambió en el prototipo y el sitio todavía no lo tiene` --references--> `Confirmacion()`  [INFERRED]
  docs/FIDELIDAD_PROTOTIPO.md → componentes/a11y/Confirmacion.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]

## Communities (175 total, 57 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.14
Nodes (18): compartido/archivos (R2 firmado, validación, PDF etiquetado), HU-COB-12 Recibo digital en PDF, ReciboDigital, Asamblea, Convocatoria (abstracta, versión imprimible), EventoProFondos, HU-ASA-01 Convocatoria con versión imprimible, HU-ASA-05 Contingencia por falta de quórum (+10 more)

### Community 1 - "aplicacion/sesion.ts"
Cohesion: 0.10
Nodes (17): esquema, POST, deAfuera, esquema, POST, rol, POST, esquema (+9 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.05
Nodes (102): esquema, POST, vecino, GET, PATCH, InicioGarita(), Transaccion, compartido_bd_generado_client_estadogarita (+94 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (21): Exclusión de gamificación (sin medallas, puntos ni rachas), Open Peeps (ilustraciones CC0), Cierre diferido de HU parciales ([~] / [-]), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales (+13 more)

### Community 4 - "Usuario"
Cohesion: 0.15
Nodes (16): CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA), HU-GAR-09 Desvincular a un ex residente, HU-GAR-11 Pedir un enlace nuevo, HU-GAR-21 Crear cuentas internas con rol, HU-GAR-22 Revocar acceso de un miembro interno (+8 more)

### Community 5 - "aplicacion/mapa.ts"
Cohesion: 0.14
Nodes (22): manzanasDelBarrio(), ESTADO_EN_EL_MAPA, mapaDeIncidentes(), ROLES, lugaresParaAsistir(), descripcionTextualAlternativa(), DIAS_DEL_MAPA, ESTADOS_EN_EL_MAPA (+14 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Queja"
Cohesion: 0.17
Nodes (12): compartido/notificaciones (cola, worker, adaptador Meta + simulador), HU-GAR-20 Centro de notificaciones unificado, Código de ticket Q-<año>-<correlativo>-<sufijo aleatorio>, ConsentimientoInformado, Evidencia (foto/video), HU-QUE-01 Registrar queja con consentimiento y evidencia, HU-QUE-02 Modo anónimo, HU-QUE-04 Ticket correlativo y aviso a la directiva (+4 more)

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.57
Nodes (7): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (21): engines, node, name, private, version, prettier, prisma, @prisma/adapter-pg (+13 more)

### Community 10 - "Matriz HU -> código -> pruebas (npm run matriz)"
Cohesion: 0.12
Nodes (16): Prohibición de datos reales, Sin gamificación, AC-2 Baja carga cognitiva (<= 3 interacciones), Modo Senior ("Letra grande"), Tamaños mínimos, ADR-004 Perfil de accesibilidad en el servidor, Semillas ficticias (personajes del prototipo), Cierre de módulo (+8 more)

### Community 11 - "Desviaciones respecto del Anexo H"
Cohesion: 0.10
Nodes (25): Prohibición de manejar secretos, ADR-003 Worker separado con cerrojo, ADR-006 Notificaciones por cola con copia interna, Cloudflare R2, Desviaciones respecto del Anexo H, Neon PostgreSQL, Render (worker Node.js), WhatsApp Cloud API (número de prueba) (+17 more)

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "entradaAlterna.ts"
Cohesion: 0.18
Nodes (27): ClaveNuevaConEnlace(), CrearAccesoEquipo(), EntrarConEnlace(), hashDeToken(), nuevoToken(), primerNombre(), plantillaClaveCambiada(), pasarPerfilALaCuenta() (+19 more)

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
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 37 - "empadronar.ts"
Cohesion: 0.11
Nodes (29): DatosEmpadronamiento, empadronar(), MENSAJE_YA_REGISTRADO, personasDe(), validarEmpadronamiento(), ViviendaEmpadronada, modulos_identidad_aplicacion_placas_placas, revisarVehiculos() (+21 more)

### Community 38 - "integracion/identidad/entradaAlterna.test.ts"
Cohesion: 0.17
Nodes (18): POST, esquema, POST, esquema, POST, despertarWorker(), MENSAJE_MUCHOS, MENSAJE_MUY_SEGUIDO (+10 more)

### Community 39 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.10
Nodes (16): Confirmacion(), 1. HU de la fase, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido (+8 more)

### Community 40 - "Reglas duras del proyecto"
Cohesion: 0.07
Nodes (39): Todo el código en español, Uso del grafo graphify en el repo, Montos en céntimos enteros y fechas en UTC, Reglas duras del proyecto, Sin sobreingeniería, Una HU por rama y por PR, Lenguaje llano (R-07, HU-ACC-08), ADR-005 Rutas asistidas y sin conexión en el dominio (+31 more)

### Community 41 - "actas.ts"
Cohesion: 0.16
Nodes (17): actaADto(), ActaDto, ActaPreparada, actasPublicadas(), descargarActa(), Fila, FilaActa, publicarActa() (+9 more)

### Community 42 - "GuiaPrimerUso.tsx"
Cohesion: 0.11
Nodes (20): AvisoInstalar, GuiaPrimerUso(), elegirVista(), siguiente(), PASOS, Vista, VISTAS, metadata (+12 more)

### Community 46 - "PublicarActa"
Cohesion: 0.22
Nodes (5): metadata, NuevaActa(), hoyEnLima(), PublicarActa(), publicar()

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.10
Nodes (27): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), configuracion() (+19 more)

### Community 48 - "cambiarModoSenior.ts"
Cohesion: 0.23
Nodes (15): activarVistaGrandeAlEmpadronar(), cambiarModoSenior(), ADR-0004, cambiarSintesisVoz(), ADR-0004, aDto(), cargarPerfil(), DuenoPerfil (+7 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.12
Nodes (21): compartido_bd_generado_client_nivelurgencia, aDto(), Fila, publicarComunicado(), ADR-0006, verNoticias(), DatosComunicado, MAXIMO_CUERPO (+13 more)

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
Cohesion: 0.18
Nodes (14): balanceADto(), BalanceDto, balancesPublicados(), Fila, FilaBalance, publicarBalance(), ROLES_DIRECTIVA, ROLES_VECINO (+6 more)

### Community 54 - "errores.ts"
Cohesion: 0.07
Nodes (29): compartido_bd_generado_client_prisma, compartido_bd_generado_client_tipovehiculo, negarseEnNube(), Persona, PERSONAS, sembrar(), ErrorNoAutenticado, ErrorNoAutorizado (+21 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "entrarConEnlace.test.ts"
Cohesion: 0.13
Nodes (18): FormularioClave(), ClaveRespaldo(), metadata, esquema, POST, esquema, POST, aceptarPolitica() (+10 more)

### Community 57 - "e2e.ts"
Cohesion: 0.20
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "actas.test.ts"
Cohesion: 0.08
Nodes (25): compartido_bd_generado_client_avisoencola, despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote(), ResumenDespacho, ADR-0006 (+17 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (18): Estado de deuda no punitivo (nunca 'moroso'), Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas (+10 more)

### Community 60 - "leerJson"
Cohesion: 0.07
Nodes (26): POST, contador, dni, esquemaEmpadronamiento, esquemaPlacas, nombre, otro, telefono (+18 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.11
Nodes (32): esquema, POST, nombreDePantalla(), NOMBRES, MasOpciones(), Ayuda(), metadata, plantillaPedidoAyuda() (+24 more)

### Community 62 - "(vecino)/page.tsx"
Cohesion: 0.44
Nodes (6): GET, Inicio(), metadata, bloqueDeIdentidad(), bloqueDeReportes(), ultimasNoticias()

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.14
Nodes (12): ADR-0006, archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles(), casos (+4 more)

### Community 64 - "zod"
Cohesion: 0.17
Nodes (21): esquema, ADR-0004, cookieDeSesion(), esquema, POST, esquema, POST, esquema (+13 more)

### Community 65 - "consultarPadron.ts"
Cohesion: 0.08
Nodes (32): Actualizar(), metadata, DarDeBaja(), Baja(), metadata, CAMPOS_DE_PLACAS, describirAccion(), etiquetaCampo() (+24 more)

### Community 66 - "guias.ts"
Cohesion: 0.14
Nodes (23): esquema, GET, POST, Guia(), metadata, Incidentes(), ACCIONES_GUIA, esSeccion() (+15 more)

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
Nodes (42): metadata, Reportar(), ReportarProblema(), archivosSubidosPor(), compartido_bd_generado_client_categoriaqueja, compartido_bd_generado_client_entidadexterna, compartido_bd_generado_client_estadoqueja, compartido_bd_generado_client_medidacorrectiva (+34 more)

### Community 71 - "area-tactil.cy.ts"
Cohesion: 0.29
Nodes (8): Caja, cajas(), distancia(), verificar(), LIMITE, Actor, ACTORES, entrarComo()

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.09
Nodes (22): CamposPlacas(), PlacasEscritas, Concepto, CONCEPTOS, Errores, Otro, Paso, Relacion (+14 more)

### Community 78 - "aplicacion/equipo.ts"
Cohesion: 0.09
Nodes (44): metadata, QuitarAccesoPagina(), QuitarAcceso(), CambiarRolPagina(), CambiarRolesPagina(), metadata, subconjuntos, plantillaRolCambiado() (+36 more)

### Community 79 - "asistido/page.tsx"
Cohesion: 0.29
Nodes (3): metadata, ReporteAsistido(), RegistrarPorVecino()

### Community 80 - "exigirActor"
Cohesion: 0.05
Nodes (53): modoSeniorAlRenderizar, ADR-0004, Layout(), Ayuda(), metadata, Layout(), MasOpciones(), Empadronar() (+45 more)

### Community 81 - "exigirSesion"
Cohesion: 0.07
Nodes (39): esquema, PATCH, GET, esquema, PATCH, esquema, PATCH, GET (+31 more)

### Community 82 - "sesionActual"
Cohesion: 0.06
Nodes (25): metadata, EntrarConClave(), metadata, FormularioEntradaClave(), FormularioPedirEnlace(), ICONOS, OpcionEntrada(), OtrasFormasDeEntrar() (+17 more)

### Community 83 - "derivacion.test.ts"
Cohesion: 0.11
Nodes (15): registrarQueja(), pedir(), reportar(), T0, T1, reportar(), T0, reportar() (+7 more)

### Community 84 - "avisos.test.ts"
Cohesion: 0.11
Nodes (25): metadata, PreferenciasPagina(), compartido_bd_generado_client_tipoaviso, contarNoLeidas(), listarNotificaciones(), marcarLeida(), marcarNoLeidas(), marcarTodasLeidas() (+17 more)

### Community 85 - "lucide-react"
Cohesion: 0.07
Nodes (74): Errores, Agregado, Encontrada, Errores, Opcion, Combinacion, ROLES, EFECTOS (+66 more)

### Community 86 - "TarjetaNoticia.tsx"
Cohesion: 0.19
Nodes (13): hayVozEnEspanol(), sintetizador(), suscribirVoces(), Escuchar(), leer(), Estado, TarjetaNoticia(), elegirVoz() (+5 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "prisma"
Cohesion: 0.13
Nodes (17): dynamic, GET(), prisma, comprobarBaseDatos(), depurarVencidos(), haceDias(), RETENCION_DIAS, VIDA_SESION_DIAS (+9 more)

### Community 89 - "avisos/page.tsx"
Cohesion: 0.13
Nodes (19): DemoDeshacer(), AvisoDeLectura(), ContextoLectura, Hecho, Lectura, MarcarLeido(), MarcarTodos(), ProveedorLectura() (+11 more)

### Community 90 - "rol/page.tsx"
Cohesion: 0.12
Nodes (14): AgregarAlEquipo(), Agregar(), metadata, CambiarRol(), metadata, modulos_identidad_aplicacion_equipo_diferenciadepermisos, modulos_identidad_aplicacion_equipo_nombre_rol, modulos_identidad_aplicacion_equipo_permisos (+6 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.15
Nodes (25): plantillaNumeroCambiado(), AnonimizarEnOtroModulo, aplicarRectificacion(), avisarCambioDeNumero(), solicitarRectificacion(), Solicitud, CampoRectificable, CAMPOS (+17 more)

### Community 92 - "aplicacion/seguimiento.ts"
Cohesion: 0.08
Nodes (37): GET, respuestaPdf(), GET, GET, ipDe(), AvanceReporte(), ICONO, AvanceDeMiReporte() (+29 more)

### Community 93 - "instantaneaLocal.ts"
Cohesion: 0.17
Nodes (15): ConsultarGarita(), abrirPorEmergencia(), buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea (+7 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.16
Nodes (14): GET, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, anonimizar(), ESCALAS, anonimizarPedidos() (+6 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.17
Nodes (17): ACCIONES, accionesDelModulo(), ACTOR_ANONIMO, describirAccion(), ModuloAuditoria, MODULOS_AUDITORIA, actoresDeAuditoria(), leerAuditoria() (+9 more)

### Community 96 - "ErrorNoEncontrado"
Cohesion: 0.11
Nodes (41): ErrorNoEncontrado, ErrorValidacion, 3. Matriz HU → código → prueba, nombresDe(), exigirRol(), anioEnLima(), derivarQueja(), documentoDelOficio() (+33 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.34
Nodes (13): CLAUDE.md (instrucciones del proyecto), Plantilla de evidencia de cierre de módulo, Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, M6 · Accesibilidad y Diseño Centrado en el Usuario, M5 · Aportes Vecinales y Vigilancia, M4 · Asambleas y eventos pro fondos (+5 more)

### Community 101 - "next"
Cohesion: 0.07
Nodes (37): metadata, SECCIONES, metadata, BotonReenviar(), metadata, metadata, metadata, metadata (+29 more)

### Community 102 - "balance.ts"
Cohesion: 0.19
Nodes (12): calcularTotales(), DatosBalance, esFechaReal(), esMontoValido(), hoyEnLima(), MAXIMO_CONCEPTO, MAXIMO_EGRESOS, MAXIMO_MONTO (+4 more)

### Community 103 - "(vecino)/visitas/nueva/page.tsx"
Cohesion: 0.33
Nodes (4): metadata, Nueva(), hoyEnLima(), RegistrarVisita()

### Community 104 - "solicitudes/route.ts"
Cohesion: 0.19
Nodes (14): esquema, POST, plantillaCancelacionPedida(), plantillaSolicitudPrivacidad(), avisarResultado(), cambiarOposicion(), prefiereUbicacionGeneralizada(), solicitarCancelacion() (+6 more)

### Community 105 - "fechaYHora"
Cohesion: 0.05
Nodes (50): Auditoria(), enlace(), metadata, AccionesDePersona(), GenerarEnlace(), Equipo(), metadata, enlaceFiltro() (+42 more)

### Community 106 - "archivos/route.ts"
Cohesion: 0.19
Nodes (8): GET, esquema, POST, USOS, ClavePerfil, PERFILES, perfilesParaCambiar(), NombreRol

### Community 107 - "Predio"
Cohesion: 0.13
Nodes (19): Cuota semanal, EstadoCuenta, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-02 Estado de cuenta privado, HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CheckInPresencial, ConfirmacionAsistencia (DIGITAL / ASISTIDA) (+11 more)

### Community 108 - "cliente.ts"
Cohesion: 0.18
Nodes (13): global, compartido_bd_generado_client, compartido_bd_generado_client_estadoguia, compartido_bd_generado_client_prismaclient, compartido_bd_generado_client_seccionguia, AvisoNuevo, encolarAvisos(), ADR-0006 (+5 more)

### Community 109 - "gestionarPadron.ts"
Cohesion: 0.17
Nodes (21): EntradaAuditoria, registrarAuditoria(), compartido_bd_generado_client_nombrerol, ErrorReglaNegocio, encolarAviso(), plantillaBajaPadron(), cambiarRol(), quitarAcceso() (+13 more)

### Community 110 - "emitirEnlace.ts"
Cohesion: 0.17
Nodes (12): plantillaClaveNueva(), plantillaEnlaceAcceso(), plantillaInvitacionEquipo(), Destinatario, SEGUN_PROPOSITO, HORAS_INVITACION, EstadoEnlace, interpretarIdentificador() (+4 more)

### Community 112 - "acta.ts"
Cohesion: 0.21
Nodes (11): DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO, porLinea() (+3 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 125 - "repositorioArco.ts"
Cohesion: 0.16
Nodes (14): compartido_bd_generado_client_estadoarco, compartido_bd_generado_client_tipoarco, aFila(), bandejaArco(), insignia(), resumenArco(), estadoDelPlazo(), anonimizarIdentidad() (+6 more)

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 127 - "queja.ts"
Cohesion: 0.18
Nodes (15): anonimizar(), datosPersonales(), CATEGORIAS, codigoTicket(), DatosQueja, esCoordenada(), ESTADOS, lugarEnTexto() (+7 more)

### Community 128 - "credencialRespaldo.ts"
Cohesion: 0.15
Nodes (6): CredencialRespaldo, DatosCredencial, LARGO_MINIMO_CLAVE, MAX_FALLOS, MINUTOS_DE_PAUSA, T0

### Community 129 - "aplicacion/historial.ts"
Cohesion: 0.22
Nodes (8): ActasYBalances(), metadata, Actas, Balance, historialPublico(), RegistroDeHistorial, ROLES_VECINO, ordenarHistorial()

### Community 131 - "balances/[id]/page.tsx"
Cohesion: 0.20
Nodes (12): hoyEnLima(), nuevoGasto(), PublicarBalance(), publicar(), revisar(), Balance(), metadata, aCentimos() (+4 more)

### Community 132 - "tokens/generar-css.mjs"
Cohesion: 0.25
Nodes (10): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+2 more)

### Community 133 - "Lista de comprobación por pantalla"
Cohesion: 0.31
Nodes (9): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), Lista de comprobación por pantalla, WCAG 2.2 AA, Definition of Done de una HU, Componente Confirmacion, Formularios accesibles (+1 more)

### Community 134 - "BarraNavegacion.tsx"
Cohesion: 0.20
Nodes (10): BarraNavegacion(), esActual(), INICIOS, Opcion, OPCIONES_POR_ACTOR, 1. Qué significa "igual o muy parecido", 3. Orden de trabajo, 4. Cómo comparar una pantalla (+2 more)

### Community 135 - "PerfilAccesibilidad"
Cohesion: 0.15
Nodes (4): DatosPerfil, EscalaTipografica, PerfilAccesibilidad, ADR-0004

### Community 136 - "AsistenteEmpadronar"
Cohesion: 0.21
Nodes (11): AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), direccion(), erroresDe(), FormularioOtro() (+3 more)

### Community 137 - "fechaLarga"
Cohesion: 0.21
Nodes (11): PanelAdministracion(), ResumenDirectiva(), fechaLarga(), saludo(), datosPersonales(), cargarUsuario(), datosPersonales(), miPerfil() (+3 more)

### Community 141 - "obtenerPerfil"
Cohesion: 0.25
Nodes (8): InterruptorVoz(), cambiar(), guardar(), PUT, metadata, Noticias(), obtenerPerfil(), guardar()

### Community 142 - "avisarDenunciante.ts"
Cohesion: 0.25
Nodes (11): plantillaNovedadReporte(), telefonoDe(), avisarAlDenunciante(), ADR-0006, cifrar(), clave(), descifrar(), Entorno (+3 more)

### Community 143 - "resolverSolicitudArco"
Cohesion: 0.36
Nodes (8): metadata, Resolver(), exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco(), modulos_identidad_aplicacion_arco_verificaciones, verSolicitudArco(), solicitudConVecino()

### Community 144 - "quejas/route.ts"
Cohesion: 0.40
Nodes (4): coordenada, esquema, GET, POST

### Community 145 - "Comprobante"
Cohesion: 0.25
Nodes (9): Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, PagoDigital, Colaboracion (ANTICIPADA / EN_PUERTA), HU-ASA-08 Modalidad de aporte en eventos pro fondos, HU-ASA-09 Voluntariado (+1 more)

### Community 146 - "HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos"
Cohesion: 0.29
Nodes (8): Toast que no desaparece solo, HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos, HU-COB-11 Cobro en efectivo sin conexión, Idempotencia por idOperacionLocal (UNIQUE), Pago (abstracta), PagoPresencial, DelegacionVoto, HU-ASA-06 Delegar el voto en un apoderado

### Community 148 - "actas/route.ts"
Cohesion: 0.36
Nodes (5): esquemaActa, GET, POST, POST, vistaPreviaActa()

### Community 149 - "Evidencia de cierre · M1 Identidad: usuarios y control de acceso"
Cohesion: 0.25
Nodes (8): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · M1 Identidad: usuarios y control de acceso

### Community 150 - "Evidencia de cierre · M2 Transparencia y rendición de cuentas"
Cohesion: 0.25
Nodes (8): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Diferido y decisiones, Evidencia de cierre · M2 Transparencia y rendición de cuentas

### Community 151 - "claves.ts"
Cohesion: 0.31
Nodes (7): crearAdministradorInicial(), cifrarClave(), claveCoincide(), derivar(), pedir(), R2, subida()

### Community 152 - "cancelar/page.tsx"
Cohesion: 0.33
Nodes (5): CancelarCuenta(), pedir(), Cancelar(), metadata, modulos_identidad_aplicacion_arco_motivos_cancelacion

### Community 153 - "corregir/page.tsx"
Cohesion: 0.33
Nodes (5): CorregirDato(), enviar(), Corregir(), metadata, modulos_identidad_aplicacion_arco_campos

### Community 164 - "equipo.cy.ts"
Cohesion: 0.50
Nodes (3): abrirAcciones(), accion(), sufijo

### Community 167 - "[predioId]/route.ts"
Cohesion: 0.50
Nodes (3): contador, esquema, PATCH

### Community 168 - "visitas/route.ts"
Cohesion: 0.67
Nodes (3): esquema, POST, desdeHoraDeLima()

### Community 170 - "Preferencias"
Cohesion: 0.83
Nodes (4): Preferencias(), cambiar(), deshacer(), guardar()

### Community 171 - "fechaLimite"
Cohesion: 0.67
Nodes (4): diaDeLima(), diasHabilesDesde(), esHabil(), fechaLimite()

## Knowledge Gaps
- **693 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+688 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 951 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `Fidelidad al prototipo` connect `BarraNavegacion.tsx` to `fechaYHora`, `Plan de implementación`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `aplicacion/sesion.ts`, `aplicacion/historial.ts`, `balances/[id]/page.tsx`, `BarraNavegacion.tsx`, `package.json`, `obtenerPerfil`, `resolverSolicitudArco`, `cancelar/page.tsx`, `corregir/page.tsx`, `garita/visitas/nueva/page.tsx`, `nueva/[token]/page.tsx`, `crear/[token]/page.tsx`, `integracion/identidad/entradaAlterna.test.ts`, `catalogo/layout.tsx`, `GuiaPrimerUso.tsx`, `PublicarActa`, `entrarConEnlace.test.ts`, `leerJson`, `mediacion.ts`, `(vecino)/page.tsx`, `consultarPadron.ts`, `guias.ts`, `jest.config.ts`, `quejas.ts`, `AsistenteEmpadronar.tsx`, `aplicacion/equipo.ts`, `asistido/page.tsx`, `exigirActor`, `sesionActual`, `avisos.test.ts`, `lucide-react`, `avisos/page.tsx`, `rol/page.tsx`, `aplicacion/seguimiento.ts`, `instantaneaLocal.ts`, `(vecino)/visitas/nueva/page.tsx`, `fechaYHora`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _693 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `aplicacion/sesion.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10114942528735632 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05232383808095952 - nodes in this community are weakly interconnected._