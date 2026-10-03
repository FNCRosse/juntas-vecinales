# Graph Report - juntas-vecinales  (2026-10-03)

## Corpus Check
- 429 files · ~293,013 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .prisma 5, (none) 3, .example 1)

## Summary
- 2217 nodes · 6689 edges · 140 communities (94 shown, 46 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2be217e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- actas.test.ts
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Predio
- BotonEnlace
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Panel de inicio del vecino (HU-GAR-19)
- Adaptador WhatsApp
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
- ErrorValidacion
- Worker (GET /salud, POST /tareas/ejecutar)
- Evidencia de cierre · M1 Identidad: usuarios y control de acceso
- Reglas duras del proyecto
- actas.ts
- GuiaPrimerUso
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- PublicarActa.tsx
- unitarias/nucleo/archivos.test.ts
- entrarConEnlace.test.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- balances.ts
- errores.ts
- dependencies
- prisma
- e2e.ts
- avisos.test.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- empadronar.test.ts
- mediacion.ts
- aplicacion/equipo.ts
- lenguajeLlano.test.ts
- zod
- consultarPadron.ts
- aplicacion/sesion.ts
- ref_node_child_process
- jest.config.ts
- tabularHasta
- repositorioArco.ts
- area-tactil.cy.ts
- catalogo.cy.ts
- revisar-estilos.sh
- letra-grande.cy.ts
- AsistenteEmpadronar.tsx
- entrarConEnlace.ts
- exigirActor
- modoSeniorAlRenderizar
- exigirSesion
- Opciones.tsx
- _sesion/sesion.ts
- PublicarBalance.tsx
- Boton
- perfiles.ts
- compilerOptions
- notificaciones.test.ts
- MensajeEstado
- administracion/equipo/page.tsx
- aplicacion/arco.ts
- equipo.cy.ts
- instantaneaLocal.ts
- arco.test.ts
- auditoria.ts
- ErrorNoEncontrado
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- next
- balance.ts
- integracion/identidad/entradaAlterna.test.ts
- cancelacion.test.ts
- Campo
- fechas.ts
- salud.test.ts
- cliente.ts
- administracion/privacidad/page.tsx
- Desviaciones respecto del Anexo H
- acta.ts
- HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts
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

## God Nodes (most connected - your core abstractions)
1. `next` - 104 edges
2. `MensajeEstado()` - 101 edges
3. `exigirActor()` - 95 edges
4. `exigirSesion()` - 93 edges
5. `Boton()` - 81 edges
6. `lucide-react` - 75 edges
7. `leerJson()` - 69 edges
8. `react` - 65 edges
9. `enviarJson()` - 64 edges
10. `prisma` - 63 edges

## Surprising Connections (you probably didn't know these)
- `Matriz HU → código → pruebas` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/matriz-hu.md → componentes/a11y/Confirmacion.tsx
- `7. Pendientes y decisiones` --references--> `css()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/tokens/generar-css.mjs
- `1. HU de la fase` --references--> `manejar()`  [INFERRED]
  docs/evidencias/F0b.md → compartido/manejar.ts
- `1. HU de la fase` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/a11y/Confirmacion.tsx
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

## Communities (140 total, 46 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.08
Nodes (30): compartido/archivos (R2 firmado, validación, PDF etiquetado), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, HU-COB-12 Recibo digital en PDF, Pago (abstracta) (+22 more)

### Community 1 - "actas.test.ts"
Cohesion: 0.21
Nodes (7): esquemaActa, GET, GET, POST, POST, vistaPreviaActa(), T0

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.05
Nodes (99): esquema, POST, vecino, GET, DELETE, PATCH, ErrorConflicto, horaCorta() (+91 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (18): Open Peeps (ilustraciones CC0), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales, HU-GAR-13 Rectificación de datos, HU-GAR-14 Cancelación de la cuenta (+10 more)

### Community 4 - "Predio"
Cohesion: 0.11
Nodes (23): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA) (+15 more)

### Community 5 - "BotonEnlace"
Cohesion: 0.10
Nodes (22): AgregarAlEquipo(), Equipo(), CambiarEstado(), pasarA(), metadata, PedidosDeAyuda(), MarcarLeido(), MarcarTodos() (+14 more)

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

### Community 13 - "entradaAlterna.ts"
Cohesion: 0.15
Nodes (23): plantillaClaveCambiada(), plantillaClaveNueva(), plantillaEnlaceAcceso(), plantillaInvitacionEquipo(), Destinatario, emitirEnlace(), SEGUN_PROPOSITO, MENSAJE_MUCHOS (+15 more)

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

### Community 37 - "ErrorValidacion"
Cohesion: 0.14
Nodes (21): ErrorValidacion, DatosEmpadronamiento, empadronar(), MENSAJE_YA_REGISTRADO, personasDe(), validarEmpadronamiento(), ViviendaEmpadronada, agregarAlEquipo() (+13 more)

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
Cohesion: 0.17
Nodes (15): ActaDto, ActaPreparada, descargarActa(), Fila, FilaActa, pdfDelActa(), publicarActa(), revisar() (+7 more)

### Community 42 - "GuiaPrimerUso"
Cohesion: 0.50
Nodes (3): GuiaPrimerUso(), Guia(), metadata

### Community 46 - "PublicarActa.tsx"
Cohesion: 0.13
Nodes (12): metadata, NuevaActa(), hoyEnLima(), PublicarActa(), publicar(), VACIO, metadata, NuevoComunicado() (+4 more)

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.10
Nodes (25): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), configuracion() (+17 more)

### Community 48 - "entrarConEnlace.test.ts"
Cohesion: 0.08
Nodes (28): esquema, PUT, ADR-0004, cambiarModoSenior(), cambiarSintesisVoz(), obtenerPerfil(), ADR-0004, aDto() (+20 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.07
Nodes (34): hayVozEnEspanol(), sintetizador(), suscribirVoces(), esquema, GET, POST, Escuchar(), leer() (+26 more)

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
Cohesion: 0.13
Nodes (19): archivosSubidosPor(), balanceADto(), BalanceDto, balancesPublicados(), Fila, FilaBalance, publicarBalance(), ROLES_DIRECTIVA (+11 more)

### Community 54 - "errores.ts"
Cohesion: 0.07
Nodes (26): GET, GET, GET, negarseEnNube(), Persona, PERSONAS, sembrar(), ErrorDeAplicacion (+18 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "prisma"
Cohesion: 0.11
Nodes (18): crearAdministradorInicial(), prisma, cifrarClave(), claveCoincide(), derivar(), aceptarPolitica(), crearClaveRespaldo(), CredencialRespaldo (+10 more)

### Community 57 - "e2e.ts"
Cohesion: 0.20
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "avisos.test.ts"
Cohesion: 0.07
Nodes (43): PATCH, POST, filtro, GET, esquema, PUT, GET, contarNoLeidas() (+35 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (17): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita (+9 more)

### Community 60 - "empadronar.test.ts"
Cohesion: 0.14
Nodes (11): POST, contador, dni, esquemaEmpadronamiento, nombre, otro, telefono, titular (+3 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.12
Nodes (27): nombreDePantalla(), NOMBRES, Ayuda(), metadata, plantillaPedidoAyuda(), Actor, aDto(), cambiarEstadoApoyo() (+19 more)

### Community 62 - "aplicacion/equipo.ts"
Cohesion: 0.11
Nodes (32): metadata, QuitarAccesoPagina(), EntradaAuditoria, registrarAuditoria(), encolarAviso(), plantillaBajaPadron(), plantillaRolCambiado(), MENSAJE_ENLACE_NO_SIRVE (+24 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 64 - "zod"
Cohesion: 0.18
Nodes (18): cookieDeSesion(), esquema, POST, esquema, esquema, POST, esquema, POST (+10 more)

### Community 65 - "consultarPadron.ts"
Cohesion: 0.10
Nodes (29): Actualizar(), metadata, Baja(), metadata, describirAccion(), etiquetaCampo(), Fila, Json (+21 more)

### Community 66 - "aplicacion/sesion.ts"
Cohesion: 0.28
Nodes (8): GET, esquema, POST, USOS, NombreRol, pedir(), R2, subida()

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "repositorioArco.ts"
Cohesion: 0.20
Nodes (7): administradoresActivos(), anonimizarIdentidad(), cancelacionPendiente(), cerrarSolicitud(), CON_VECINO, contarPendientes(), pendienteDelMismoCampo()

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.10
Nodes (29): AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), CasillaDni(), Concepto, CONCEPTOS (+21 more)

### Community 78 - "entrarConEnlace.ts"
Cohesion: 0.22
Nodes (20): hashDeToken(), nuevoToken(), pasarPerfilALaCuenta(), asignarPerfilSinDueno(), cerrarSesion(), restablecerClave(), Bienvenida, canjearEnlace() (+12 more)

### Community 79 - "exigirActor"
Cohesion: 0.08
Nodes (35): Ayuda(), metadata, MasOpciones(), metadata, enlaceFiltro(), metadata, Padron(), Parametros (+27 more)

### Community 80 - "modoSeniorAlRenderizar"
Cohesion: 0.09
Nodes (34): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, Layout(), Layout() (+26 more)

### Community 81 - "exigirSesion"
Cohesion: 0.07
Nodes (42): esquema, PATCH, esquema, POST, esquema, PATCH, esquema, POST (+34 more)

### Community 82 - "Opciones.tsx"
Cohesion: 0.16
Nodes (16): ClaveNueva(), metadata, FormularioPedirEnlace(), ICONOS, OpcionEntrada(), OtrasFormasDeEntrar(), Volver(), EnlaceNuevo() (+8 more)

### Community 83 - "_sesion/sesion.ts"
Cohesion: 0.16
Nodes (15): EntrarConClave(), metadata, FormularioEntradaClave(), FormularioClave(), ClaveRespaldo(), metadata, EntradaEquipo(), metadata (+7 more)

### Community 84 - "PublicarBalance.tsx"
Cohesion: 0.12
Nodes (17): metadata, NuevoBalance(), Gasto, hoyEnLima(), nuevoGasto(), PublicarBalance(), publicar(), revisar() (+9 more)

### Community 85 - "Boton"
Cohesion: 0.07
Nodes (56): Errores, Agregado, Encontrada, Errores, QuitarAcceso(), CambiarRol(), Lista(), Opcion (+48 more)

### Community 86 - "perfiles.ts"
Cohesion: 0.50
Nodes (3): ClavePerfil, PERFILES, perfilesParaCambiar()

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "notificaciones.test.ts"
Cohesion: 0.12
Nodes (17): depurarVencidos(), haceDias(), RETENCION_DIAS, VIDA_SESION_DIAS, encolar(), simulador, simuladorEnFallo, T0 (+9 more)

### Community 89 - "MensajeEstado"
Cohesion: 0.08
Nodes (27): InterruptorVoz(), FormularioClaveNueva(), ClaveNuevaConEnlace(), metadata, FormularioAccesoEquipo(), CrearAccesoEquipo(), metadata, BotonReenviar() (+19 more)

### Community 90 - "administracion/equipo/page.tsx"
Cohesion: 0.14
Nodes (15): Agregar(), metadata, metadata, CambiarRolPagina(), metadata, diferenciaDePermisos(), HORAS_INVITACION, LARGO_MINIMO_CLAVE_EQUIPO (+7 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.12
Nodes (32): ErrorReglaNegocio, plantillaSolicitudPrivacidad(), aFila(), AnonimizarEnOtroModulo, aplicarRectificacion(), avisarResultado(), insignia(), Solicitud (+24 more)

### Community 93 - "instantaneaLocal.ts"
Cohesion: 0.27
Nodes (11): buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea, leerInstantanea(), sha256() (+3 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.17
Nodes (14): GET, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, anonimizar(), datosPersonales(), ESCALAS (+6 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.23
Nodes (14): ACCIONES, accionesDelModulo(), describirAccion(), ModuloAuditoria, MODULOS_AUDITORIA, actoresDeAuditoria(), leerAuditoria(), auditoriaGlobal() (+6 more)

### Community 96 - "ErrorNoEncontrado"
Cohesion: 0.21
Nodes (12): metadata, Resolver(), ErrorNoEncontrado, plantillaNumeroCambiado(), avisarCambioDeNumero(), exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco() (+4 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.30
Nodes (15): CLAUDE.md (instrucciones del proyecto), Plantilla de evidencia de cierre de módulo, Cierre de módulo, Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, Matriz HU -> código -> pruebas (npm run matriz), M6 · Accesibilidad y Diseño Centrado en el Usuario (+7 more)

### Community 101 - "next"
Cohesion: 0.10
Nodes (28): metadata, PoliticaDePrivacidad(), SECCIONES, Auditoria(), enlace(), metadata, Bitacora(), FILTROS (+20 more)

### Community 102 - "balance.ts"
Cohesion: 0.18
Nodes (13): desdeHoraDeLima(), calcularTotales(), DatosBalance, esFechaReal(), esMontoValido(), hoyEnLima(), MAXIMO_CONCEPTO, MAXIMO_EGRESOS (+5 more)

### Community 103 - "integracion/identidad/entradaAlterna.test.ts"
Cohesion: 0.15
Nodes (16): deAfuera, esquema, POST, rol, POST, POST, esquema, POST (+8 more)

### Community 104 - "cancelacion.test.ts"
Cohesion: 0.18
Nodes (18): PATCH, esquema, POST, plantillaCancelacionPedida(), cambiarOposicion(), cargarUsuario(), miPerfil(), prefiereUbicacionGeneralizada() (+10 more)

### Community 105 - "Campo"
Cohesion: 0.13
Nodes (17): DemoConfirmacion(), Catalogo(), Consulta, ConsultarGarita(), abrirPorEmergencia(), MOTIVOS, Respuesta, refrescarInstantanea() (+9 more)

### Community 106 - "fechas.ts"
Cohesion: 0.30
Nodes (11): metadata, PanelAdministracion(), metadata, ResumenDirectiva(), Inicio(), metadata, fechaLarga(), primerNombre() (+3 more)

### Community 107 - "salud.test.ts"
Cohesion: 0.43
Nodes (3): dynamic, GET(), comprobarBaseDatos()

### Community 108 - "cliente.ts"
Cohesion: 0.20
Nodes (10): global, Transaccion, AvisoNuevo, encolarAvisos(), ADR-0006, ADR-0007, vecinosDeLaComunidad(), idsDeVecinosActivos() (+2 more)

### Community 109 - "administracion/privacidad/page.tsx"
Cohesion: 0.22
Nodes (6): ESTILO_INSIGNIA, FILTROS, metadata, bandejaArco(), FilaArco, solicitudesParaLaBandeja()

### Community 110 - "Desviaciones respecto del Anexo H"
Cohesion: 0.12
Nodes (12): Anexo H de la tesis (arquitectura 4+1), Cloudflare R2, Equivalencia de nombres Anexo H -> repositorio, Funciones de aptitud con ESLint, Matriz de dependencias permitidas entre módulos, Vercel (app Next.js), Adaptador de archivos R2 (URLs firmadas), Convenciones de nombres de BD (+4 more)

### Community 112 - "acta.ts"
Cohesion: 0.21
Nodes (11): DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO, porLinea() (+3 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 129 - "aplicacion/historial.ts"
Cohesion: 0.23
Nodes (9): actaADto(), actasPublicadas(), Actas, Balance, historialPublico(), RegistroDeHistorial, ROLES_VECINO, ordenarHistorial() (+1 more)

### Community 131 - "balances/[id]/page.tsx"
Cohesion: 0.40
Nodes (6): Balance(), metadata, soles(), GraficoBalance(), Totales, verBalance()

### Community 132 - "tokens/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 133 - "Lista de comprobación por pantalla"
Cohesion: 0.27
Nodes (10): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Definition of Done de una HU, Componente Confirmacion (+2 more)

### Community 134 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.25
Nodes (8): 1. HU de la fase, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido

### Community 135 - "ref_node_fs"
Cohesion: 0.33
Nodes (3): ADR-0006, cypress, pg

### Community 136 - "Casos de uso (una función por archivo)"
Cohesion: 0.40
Nodes (5): Casos de uso (una función por archivo), Errores tipados de dominio (compartido/errores.ts), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio)

### Community 137 - "lintear.mjs"
Cohesion: 0.40
Nodes (4): casos, eslint, resultados, eslint

## Knowledge Gaps
- **576 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+571 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 778 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `1. HU de la fase` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `exigirSesion`, `Campo`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _576 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.07956989247311828 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05098988748041589 - nodes in this community are weakly interconnected._
- **Should `Cierre diferido de HU parciales ([~] / [-])` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._