# Graph Report - juntas-vecinales  (2026-10-06)

## Corpus Check
- 521 files · ~452,849 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .prisma 6, (none) 3, .example 1)

## Summary
- 2620 nodes · 8236 edges · 168 communities (117 shown, 51 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 86 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `069486ce`
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
- avisos.ts
- escuchar.cy.ts
- catalogo/layout.tsx
- manifest.ts
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
- fechaLarga
- garita.test.ts
- queja.ts
- equipo.test.ts
- avisarDenunciante.ts
- PerfilAccesibilidad
- verVisitaEnGarita
- compartido/notificaciones (cola, worker, adaptador Meta + simulador)
- ConsultarGarita.tsx
- dominio/seguimiento.ts
- comunicado.ts
- Reglas duras del proyecto
- (vecino)/incidentes/[id]/page.tsx
- entrar/privacidad/page.tsx
- CambiarRol.tsx
- cancelar/page.tsx
- corregir/page.tsx
- visitas/route.ts
- Procedimiento por HU
- Ley N.° 29733 protección de datos personales

## God Nodes (most connected - your core abstractions)
1. `next` - 123 edges
2. `exigirSesion()` - 115 edges
3. `exigirActor()` - 113 edges
4. `MensajeEstado()` - 113 edges
5. `Boton()` - 98 edges
6. `lucide-react` - 91 edges
7. `ErrorNoEncontrado` - 83 edges
8. `enviarJson()` - 81 edges
9. `leerJson()` - 81 edges
10. `prisma` - 80 edges

## Surprising Connections (you probably didn't know these)
- `Matriz HU → código → pruebas` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/matriz-hu.md → componentes/a11y/Confirmacion.tsx
- `1. HU de la fase` --references--> `manejar()`  [INFERRED]
  docs/evidencias/F0b.md → compartido/manejar.ts
- `1. HU de la fase` --references--> `Confirmacion()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/a11y/Confirmacion.tsx
- `7. Pendientes y decisiones` --references--> `css()`  [INFERRED]
  docs/evidencias/F0b.md → componentes/tokens/generar-css.mjs
- `1. HU del módulo` --references--> `actualizarEstadoMorosidad()`  [INFERRED]
  docs/evidencias/M1.md → modulos/identidad/aplicacion/visitas.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Atributos de calidad transversales AC-5/AC-6/AC-7 y su prueba** — docs_backend_ac5_idempotencia, docs_backend_ac6_auditoria, docs_backend_ac7_confidencialidad, docs_pruebas_piramide, docs_datos_restricciones_bd [EXTRACTED 1.00]
- **Flujo worker: cron, despertador, despacho y copia interna** — docs_despliegue_cron_worker, docs_backend_despertador, docs_backend_worker, docs_backend_despacho_notificaciones, docs_arquitectura_adr_006_notificaciones, docs_datos_nucleo_notificaciones [EXTRACTED 1.00]
- **Regla de capas verificada automáticamente** — docs_arquitectura_regla_de_capas, docs_arquitectura_matriz_modulos, docs_arquitectura_funciones_aptitud, docs_backend_recorrido_peticion [EXTRACTED 1.00]
- **Contrato ARCO implementado por cada módulo** — modulos_identidad_claude_contrato_arco, modulos_identidad_claude_hu_gar_12, modulos_identidad_claude_hu_gar_14, modulos_aportes_claude, modulos_asambleas_claude, modulos_incidencias_claude [EXTRACTED 1.00]
- **Protección de identidad y no identificación** — modulos_incidencias_claude_identidadprotegida, modulos_incidencias_claude_mapaincidentes, modulos_identidad_claude_prefiereubicaciongeneralizada, modulos_transparencia_claude_garantizarnoidentificacion [INFERRED 0.75]
- **Mediación asistida para adultos mayores** — modulos_accesibilidad_claude_canalmediacionhumana, modulos_accesibilidad_claude_hu_acc_04, modulos_asambleas_claude_hu_asa_03, modulos_incidencias_claude_hu_que_03 [INFERRED 0.85]

## Communities (168 total, 51 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.15
Nodes (15): compartido/archivos (R2 firmado, validación, PDF etiquetado), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, Pago (abstracta), PagoDigital (+7 more)

### Community 1 - "actas.test.ts"
Cohesion: 0.11
Nodes (38): nombresDe(), anioEnLima(), derivarQueja(), documentoDelOficio(), Fila, MENSAJE_NO_SE_DERIVA, nombreDelArchivo(), oficioDe() (+30 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.08
Nodes (39): inicioDelDiaEnLima(), plantillaEmergenciaGarita(), plantillaRejaManual(), plantillaVisitaEnPuerta(), plantillaVisitaLlego(), bitacora(), buscarCasas(), consultar() (+31 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (18): Open Peeps (ilustraciones CC0), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales, HU-GAR-13 Rectificación de datos, HU-GAR-14 Cancelación de la cuenta (+10 more)

### Community 4 - "Predio"
Cohesion: 0.11
Nodes (23): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA) (+15 more)

### Community 5 - "BotonEnlace"
Cohesion: 0.10
Nodes (28): GenerarEnlace(), Equipo(), AlertasDirectiva(), metadata, metadata, ReporteDirectiva(), BandejaIncidentes(), metadata (+20 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Queja"
Cohesion: 0.11
Nodes (19): EstadoCuenta, HU-COB-02 Estado de cuenta privado, CheckInPresencial, ConfirmacionAsistencia (DIGITAL / ASISTIDA), HU-ASA-02 Confirmar asistencia, HU-ASA-03 Confirmación asistida por el mediador, HU-ASA-07 Check-in presencial y quórum definitivo, Quorum (50 % + 1 de predios) (+11 more)

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.57
Nodes (7): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (24): engines, node, name, private, version, Cypress, ETIQUETAS, axe-core (+16 more)

### Community 10 - "Panel de inicio del vecino (HU-GAR-19)"
Cohesion: 0.17
Nodes (8): Modo Senior ("Letra grande"), Tamaños mínimos, Funciones de aptitud con ESLint, Matriz de dependencias permitidas entre módulos, Panel de inicio del vecino (HU-GAR-19), Server Components por defecto, Tokens, Tailwind v4 y Radix, Base de datos de pruebas

### Community 11 - "Adaptador WhatsApp"
Cohesion: 0.25
Nodes (7): WhatsApp Cloud API (número de prueba), Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones, Variables de entorno (sin valores), Simuladores de pruebas

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "entradaAlterna.ts"
Cohesion: 0.10
Nodes (25): ErrorReglaNegocio, plantillaBajaPadron(), plantillaClaveNueva(), plantillaEnlaceAcceso(), plantillaInvitacionEquipo(), Destinatario, emitirEnlace(), SEGUN_PROPOSITO (+17 more)

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

### Community 37 - "ErrorValidacion"
Cohesion: 0.08
Nodes (26): esquema, PATCH, ErrorConflicto, ErrorDeAplicacion, ErrorEnPausa, ErrorNoAutenticado, ErrorNoAutorizado, ErrorValidacion (+18 more)

### Community 38 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.31
Nodes (7): Render (worker Node.js), Vercel (app Next.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker, Límites de los planes gratuitos

### Community 39 - "Evidencia de cierre · M1 Identidad: usuarios y control de acceso"
Cohesion: 0.09
Nodes (17): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · M1 Identidad: usuarios y control de acceso (+9 more)

### Community 40 - "Reglas duras del proyecto"
Cohesion: 0.16
Nodes (13): AC-5 Idempotencia por idOperacion, AC-6 Auditoría en la misma transacción, AC-7 Confidencialidad (404 a datos ajenos), Casos de uso (una función por archivo), Errores tipados de dominio (compartido/errores.ts), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio) (+5 more)

### Community 41 - "actas.ts"
Cohesion: 0.07
Nodes (36): GET, GET, POST, GET, actaADto(), ActaDto, ActaPreparada, actasPublicadas() (+28 more)

### Community 42 - "GuiaPrimerUso"
Cohesion: 0.09
Nodes (31): metadata, Reportar(), aVecino(), buscarVecinos(), conCasa, directivaParaAvisar(), manzanaDe(), ROLES_DE_VECINO (+23 more)

### Community 46 - "PublicarActa.tsx"
Cohesion: 0.11
Nodes (21): Ayuda(), metadata, Agregar(), Empadronar(), metadata, Actualizar(), metadata, AyudaEquipo() (+13 more)

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.07
Nodes (36): GET, codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256() (+28 more)

### Community 48 - "entrarConEnlace.test.ts"
Cohesion: 0.20
Nodes (17): esquema, PUT, ADR-0004, cambiarModoSenior(), cambiarSintesisVoz(), obtenerPerfil(), ADR-0004, aDto() (+9 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.19
Nodes (12): InterruptorVoz(), hayVozEnEspanol(), sintetizador(), suscribirVoces(), Escuchar(), leer(), Estado, elegirVoz() (+4 more)

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
Cohesion: 0.17
Nodes (12): archivosSubidosPor(), 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Diferido y decisiones (+4 more)

### Community 54 - "errores.ts"
Cohesion: 0.08
Nodes (27): esquema, POST, crearAdministradorInicial(), negarseEnNube(), Persona, PERSONAS, sembrar(), cifrarClave() (+19 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "prisma"
Cohesion: 0.18
Nodes (6): CredencialRespaldo, DatosCredencial, LARGO_MINIMO_CLAVE, MAX_FALLOS, MINUTOS_DE_PAUSA, T0

### Community 58 - "avisos.test.ts"
Cohesion: 0.08
Nodes (30): prisma, despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote(), ResumenDespacho, ADR-0006 (+22 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (17): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita (+9 more)

### Community 60 - "empadronar.test.ts"
Cohesion: 0.11
Nodes (22): POST, contador, dni, esquemaEmpadronamiento, esquemaPlacas, nombre, otro, telefono (+14 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.11
Nodes (32): esquema, PATCH, esquema, POST, nombreDePantalla(), NOMBRES, Ayuda(), metadata (+24 more)

### Community 62 - "aplicacion/equipo.ts"
Cohesion: 0.14
Nodes (31): metadata, QuitarAccesoPagina(), registrarAuditoria(), encolarAviso(), plantillaRolCambiado(), agregarAlEquipo(), buscarEnPadron(), cambiarRol() (+23 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.14
Nodes (10): ADR-0006, archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles(), casos (+2 more)

### Community 64 - "zod"
Cohesion: 0.16
Nodes (18): cookieDeSesion(), esquema, POST, esquema, POST, esquema, POST, DELETE (+10 more)

### Community 65 - "consultarPadron.ts"
Cohesion: 0.10
Nodes (30): enlaceFiltro(), metadata, Padron(), Parametros, plural(), CAMPOS_DE_PLACAS, describirAccion(), etiquetaCampo() (+22 more)

### Community 66 - "aplicacion/sesion.ts"
Cohesion: 0.32
Nodes (6): esquema, POST, USOS, pedirSubida(), pedir(), subida()

### Community 67 - "ref_node_child_process"
Cohesion: 0.10
Nodes (18): GET, esquema, POST, aceptarPolitica(), MENSAJE_FALTA_ACEPTAR, obtenerSesion(), SesionDto, faltaAceptarPolitica() (+10 more)

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "repositorioArco.ts"
Cohesion: 0.31
Nodes (10): esquema, POST, cambiarOposicion(), solicitarCopia(), solicitarRectificacion(), errorDeRectificacion(), leerCelular(), leerVivienda() (+2 more)

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.08
Nodes (36): CamposPlacas(), PlacasEscritas, AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), CasillaDni() (+28 more)

### Community 78 - "entrarConEnlace.ts"
Cohesion: 0.25
Nodes (22): hashDeToken(), nuevoToken(), primerNombre(), plantillaClaveCambiada(), pasarPerfilALaCuenta(), asignarPerfilSinDueno(), restablecerClave(), Bienvenida (+14 more)

### Community 79 - "exigirActor"
Cohesion: 0.15
Nodes (19): MasOpciones(), metadata, metadata, PanelAdministracion(), MasOpciones(), metadata, metadata, ResumenDirectiva() (+11 more)

### Community 80 - "modoSeniorAlRenderizar"
Cohesion: 0.13
Nodes (23): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, Layout(), Layout() (+15 more)

### Community 81 - "exigirSesion"
Cohesion: 0.10
Nodes (22): DELETE, esquema, esquema, POST, contador, esquema, PATCH, esquema (+14 more)

### Community 82 - "Opciones.tsx"
Cohesion: 0.16
Nodes (16): ClaveNueva(), metadata, FormularioPedirEnlace(), ICONOS, OpcionEntrada(), OtrasFormasDeEntrar(), Volver(), EnlaceNuevo() (+8 more)

### Community 83 - "_sesion/sesion.ts"
Cohesion: 0.18
Nodes (13): EntrarConClave(), metadata, FormularioEntradaClave(), ClaveRespaldo(), metadata, EntradaEquipo(), metadata, BuscarConCodigo() (+5 more)

### Community 84 - "PublicarBalance.tsx"
Cohesion: 0.20
Nodes (14): Gasto, hoyEnLima(), nuevoGasto(), PublicarBalance(), publicar(), revisar(), Balance(), metadata (+6 more)

### Community 85 - "Boton"
Cohesion: 0.06
Nodes (48): Agregado, AgregarAlEquipo(), Encontrada, Errores, QuitarAcceso(), ResolverSolicitud(), Solicitud, metadata (+40 more)

### Community 86 - "perfiles.ts"
Cohesion: 0.09
Nodes (24): confirmar(), publicar(), publicar(), derivar(), guardar(), guardar(), CambiarEstado(), pasarA() (+16 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "notificaciones.test.ts"
Cohesion: 0.12
Nodes (24): GET, respuestaPdf(), GET, GET, ipDe(), ErrorNoEncontrado, consultarPorCodigo(), Fila (+16 more)

### Community 89 - "MensajeEstado"
Cohesion: 0.12
Nodes (20): FormularioClaveNueva(), ClaveNuevaConEnlace(), metadata, Errores, FormularioClave(), FormularioAccesoEquipo(), CrearAccesoEquipo(), metadata (+12 more)

### Community 90 - "administracion/equipo/page.tsx"
Cohesion: 0.14
Nodes (15): metadata, metadata, CambiarRolPagina(), metadata, diferenciaDePermisos(), HORAS_INVITACION, LARGO_MINIMO_CLAVE_EQUIPO, MotivoBaja (+7 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.21
Nodes (12): CampoRectificable, diaDeLima(), DIAS_DE_ALERTA, diasHabilesDesde(), EFECTO_CANCELACION, esHabil(), fechaLimite(), MotivoCancelacion (+4 more)

### Community 92 - "equipo.cy.ts"
Cohesion: 0.11
Nodes (24): Baja(), metadata, aplicarRectificacion(), actualizarPredio(), revisarVehiculos(), SIN_PLACAS, cambiosDeOcupacion(), Concepto (+16 more)

### Community 93 - "instantaneaLocal.ts"
Cohesion: 0.26
Nodes (12): buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea, leerInstantanea(), refrescarInstantanea() (+4 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.14
Nodes (17): GET, esquema, PATCH, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, anonimizar() (+9 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.14
Nodes (20): Auditoria(), enlace(), metadata, ACCIONES, accionesDelModulo(), ACTOR_ANONIMO, describirAccion(), ModuloAuditoria (+12 more)

### Community 96 - "ErrorNoEncontrado"
Cohesion: 0.13
Nodes (18): metadata, Resolver(), esquema, PATCH, plantillaNumeroCambiado(), avisarCambioDeNumero(), exigirAdministracion(), resolverCambioDeNumero() (+10 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.37
Nodes (12): CLAUDE.md (instrucciones del proyecto), Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, M6 · Accesibilidad y Diseño Centrado en el Usuario, M5 · Aportes Vecinales y Vigilancia, M4 · Asambleas y eventos pro fondos, M1 · Identidad: Usuarios y Control de Acceso (+4 more)

### Community 101 - "next"
Cohesion: 0.10
Nodes (28): metadata, PoliticaDePrivacidad(), SECCIONES, Bitacora(), FILTROS, metadata, RefrescarSolo(), ACCIONES (+20 more)

### Community 102 - "balance.ts"
Cohesion: 0.09
Nodes (30): GET, esquema, GET, POST, BalanceDto, balancesPublicados(), Fila, FilaBalance (+22 more)

### Community 103 - "integracion/identidad/entradaAlterna.test.ts"
Cohesion: 0.21
Nodes (10): deAfuera, esquema, POST, rol, POST, esquema, POST, esquema (+2 more)

### Community 104 - "cancelacion.test.ts"
Cohesion: 0.17
Nodes (22): plantillaCancelacionPedida(), plantillaSolicitudPrivacidad(), aFila(), AnonimizarEnOtroModulo, avisarResultado(), bandejaArco(), cargarUsuario(), insignia() (+14 more)

### Community 105 - "Campo"
Cohesion: 0.11
Nodes (19): DarDeBaja(), EFECTOS, Motivo, Residente, DemoConfirmacion(), Catalogo(), AvisoInstalar, GuiaPrimerUso() (+11 more)

### Community 106 - "fechas.ts"
Cohesion: 0.18
Nodes (17): GET, metadata, Noticias(), TarjetaNoticia(), Inicio(), metadata, aDto(), Fila (+9 more)

### Community 107 - "salud.test.ts"
Cohesion: 0.16
Nodes (6): dynamic, GET(), comprobarBaseDatos(), entorno, servidor, supertest

### Community 108 - "cliente.ts"
Cohesion: 0.12
Nodes (12): EntradaAuditoria, global, Transaccion, AvisoNuevo, encolarAvisos(), ADR-0006, ADR-0007, vecinosDeLaComunidad() (+4 more)

### Community 109 - "administracion/privacidad/page.tsx"
Cohesion: 0.22
Nodes (6): ESTILO_INSIGNIA, FILTROS, metadata, FilaArco, TipoArco, TIPOS_ARCO

### Community 110 - "Desviaciones respecto del Anexo H"
Cohesion: 0.25
Nodes (6): Anexo H de la tesis (arquitectura 4+1), Cloudflare R2, Equivalencia de nombres Anexo H -> repositorio, Neon PostgreSQL, Adaptador de archivos R2 (URLs firmadas), Entornos (local, CI, preview, producción)

### Community 112 - "acta.ts"
Cohesion: 0.19
Nodes (12): revisar(), DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO (+4 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.17
Nodes (13): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, HU-COB-12 Recibo digital en PDF, ReciboDigital, Asamblea, Convocatoria (abstracta, versión imprimible) (+5 more)

### Community 125 - "avisos.ts"
Cohesion: 0.11
Nodes (23): PATCH, POST, filtro, GET, esquema, PUT, metadata, PreferenciasPagina() (+15 more)

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 128 - "manifest.ts"
Cohesion: 0.13
Nodes (23): esquema, GET, POST, GuiaDeSeccion(), Guia(), metadata, ACCIONES_GUIA, esSeccion() (+15 more)

### Community 129 - "aplicacion/historial.ts"
Cohesion: 0.13
Nodes (22): GET, manzanasDelBarrio(), ESTADO_EN_EL_MAPA, mapaDeIncidentes(), ROLES, descripcionTextualAlternativa(), DIAS_DEL_MAPA, ESTADOS_EN_EL_MAPA (+14 more)

### Community 131 - "balances/[id]/page.tsx"
Cohesion: 0.16
Nodes (22): Anular(), metadata, actualizarEstadoMorosidad(), aDto(), anularVisita(), MENSAJE_VISITAS_EN_PAUSA, misVisitas(), miVivienda() (+14 more)

### Community 132 - "tokens/generar-css.mjs"
Cohesion: 0.14
Nodes (17): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+9 more)

### Community 133 - "Lista de comprobación por pantalla"
Cohesion: 0.13
Nodes (19): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), AC-2 Baja carga cognitiva (<= 3 interacciones), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Semillas ficticias (personajes del prototipo) (+11 more)

### Community 134 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.16
Nodes (13): esquema, POST, GET, GET, GET, GET, coordenada, esquema (+5 more)

### Community 135 - "ref_node_fs"
Cohesion: 0.26
Nodes (18): esquema, POST, vecino, horaCorta(), abrirPorEmergencia(), aFila(), anotarEntradaVecino(), anotarEntradaVisita() (+10 more)

### Community 136 - "Casos de uso (una función por archivo)"
Cohesion: 0.20
Nodes (14): AyudaYAccesibilidad(), metadata, Dato(), metadata, MiPerfil(), clasesBotonBarra(), Encabezado(), Isologo() (+6 more)

### Community 137 - "lintear.mjs"
Cohesion: 0.17
Nodes (13): esquema, PATCH, GET, esquema, POST, MENSAJE_ERROR_INESPERADO, CuerpoDeError, Manejador (+5 more)

### Community 141 - "fechaLarga"
Cohesion: 0.18
Nodes (15): Derivar(), metadata, OfertaDeGuia(), CALOR, cantidad(), CORTO, ICONOS, IncidentesDelBarrio() (+7 more)

### Community 142 - "garita.test.ts"
Cohesion: 0.15
Nodes (9): GET, DELETE, PATCH, respuesta, hashDeDni(), instantanea(), responderVisita(), padronParaGarita() (+1 more)

### Community 143 - "queja.ts"
Cohesion: 0.19
Nodes (14): anonimizar(), datosPersonales(), codigoTicket(), DatosQueja, esCoordenada(), ESTADOS, lugarEnTexto(), MAXIMO_EVIDENCIAS (+6 more)

### Community 144 - "equipo.test.ts"
Cohesion: 0.19
Nodes (6): esquema, POST, POST, generarEnlaceDeInvitacion(), guardarEnlace(), T0

### Community 145 - "avisarDenunciante.ts"
Cohesion: 0.25
Nodes (11): plantillaNovedadReporte(), telefonoDe(), avisarAlDenunciante(), ADR-0006, cifrar(), clave(), descifrar(), Entorno (+3 more)

### Community 146 - "PerfilAccesibilidad"
Cohesion: 0.15
Nodes (4): DatosPerfil, EscalaTipografica, PerfilAccesibilidad, ADR-0004

### Community 147 - "verVisitaEnGarita"
Cohesion: 0.23
Nodes (11): metadata, Responder(), rangoHorario(), anunciada(), vehiculoDe(), verVisitaEnGarita(), visitaPorResponder(), dniTerminadoEn() (+3 more)

### Community 148 - "compartido/notificaciones (cola, worker, adaptador Meta + simulador)"
Cohesion: 0.18
Nodes (11): compartido/notificaciones (cola, worker, adaptador Meta + simulador), HU-GAR-20 Centro de notificaciones unificado, HU-QUE-04 Ticket correlativo y aviso a la directiva, HU-QUE-09 Seguimiento por código, SeguimientoTicket, BalanceFinanciero, ComunicadoGeneral, Egreso (+3 more)

### Community 149 - "ConsultarGarita.tsx"
Cohesion: 0.22
Nodes (7): Consulta, ConsultarGarita(), abrirPorEmergencia(), MOTIVOS, Respuesta, Consultar(), metadata

### Community 150 - "dominio/seguimiento.ts"
Cohesion: 0.25
Nodes (9): Estado, EstadoPaso, MAXIMO_CONSULTAS, normalizarCodigo(), Paso, pasosDelAvance(), superaLimite(), VENTANA_CONSULTAS_MS (+1 more)

### Community 151 - "comunicado.ts"
Cohesion: 0.22
Nodes (7): DatosComunicado, MAXIMO_CUERPO, MAXIMO_TITULO, NIVELES, NivelUrgencia, prepararComunicado(), T0

### Community 152 - "Reglas duras del proyecto"
Cohesion: 0.25
Nodes (4): Convenciones de nombres de BD, Esquema Prisma por módulo, Migraciones Prisma, Rollback por pieza

### Community 153 - "(vecino)/incidentes/[id]/page.tsx"
Cohesion: 0.38
Nodes (5): AvanceReporte(), ICONO, AvanceDeMiReporte(), metadata, AvanceDto

### Community 154 - "entrar/privacidad/page.tsx"
Cohesion: 0.40
Nodes (4): FormularioPolitica(), metadata, Privacidad(), PUNTOS

### Community 155 - "CambiarRol.tsx"
Cohesion: 0.60
Nodes (3): CambiarRol(), Lista(), Opcion

### Community 156 - "cancelar/page.tsx"
Cohesion: 0.40
Nodes (3): Cancelar(), metadata, MOTIVOS_CANCELACION

### Community 157 - "corregir/page.tsx"
Cohesion: 0.40
Nodes (3): Corregir(), metadata, CAMPOS

### Community 158 - "visitas/route.ts"
Cohesion: 0.67
Nodes (3): esquema, POST, desdeHoraDeLima()

### Community 159 - "Procedimiento por HU"
Cohesion: 0.50
Nodes (3): Uso del grafo graphify en el repo, Conventional Commits en español, Procedimiento por HU

### Community 160 - "Ley N.° 29733 protección de datos personales"
Cohesion: 0.50
Nodes (4): Derechos ARCO, Ley N.° 29733 protección de datos personales, Instantánea del padrón en la garita (AC-4), PWA con service worker propio

## Knowledge Gaps
- **673 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+668 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 912 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `3. Matriz HU → código → prueba` connect `balances.ts` to `actas.test.ts`, `lintear.mjs`, `aplicacion/historial.ts`, `ErrorValidacion`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `Evidencia de cierre · M3 Demandas e incidentes` connect `balances.ts` to `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _673 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `actas.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10685249709639953 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08282828282828283 - nodes in this community are weakly interconnected._
- **Should `Cierre diferido de HU parciales ([~] / [-])` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._