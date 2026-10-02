# Graph Report - juntas-vecinales  (2026-10-02)

## Corpus Check
- 362 files · ~236,157 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .prisma 4, (none) 3, .example 1)

## Summary
- 1945 nodes · 5760 edges · 125 communities (85 shown, 40 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fad424f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- Reglas duras del proyecto
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Usuario
- exigirActor
- verificar-contraste.mjs
- Predio
- Módulo accesibilidad (M6)
- package.json
- Panel de inicio del vecino (HU-GAR-19)
- Desviaciones respecto del Anexo H
- guia-visual/generar-css.mjs
- despachar.ts
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
- AC-5 Idempotencia por idOperacion
- Regla de capas dominio/aplicacion/infraestructura
- Procedimiento por HU
- BotonEnlace
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- exigirSesion
- archivos.test.ts
- entrarConEnlace.test.ts
- tokens/generar-css.mjs
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- Queja
- cliente.ts
- dependencies
- Comprobante
- e2e.ts
- avisos.test.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- ref_node_fs
- mediacion.ts
- aplicacion/equipo.ts
- lenguajeLlano.test.ts
- aplicacion/sesion.ts
- consultarPadron.ts
- garita.test.ts
- ref_node_child_process
- jest.config.ts
- tabularHasta
- lintear.mjs
- area-tactil.cy.ts
- catalogo.cy.ts
- revisar-estilos.sh
- letra-grande.cy.ts
- AsistenteEmpadronar.tsx
- entradaAlterna.ts
- lucide-react
- modoSeniorAlRenderizar
- leerJson
- next
- fechas.ts
- visitas.ts
- Boton
- Tarjeta.tsx
- compilerOptions
- enviarJson
- MensajeEstado
- administracion/equipo/page.tsx
- aplicacion/arco.ts
- errores.ts
- ConsultarGarita.tsx
- arco.test.ts
- auditoria.ts
- cancelacion.test.ts
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- garita/page.tsx
- Plantilla de evidencia de cierre de módulo
- cuentas/route.ts
- solicitarRectificacion
- catalogo/page.tsx
- esquema.ts
- repositorioArco.ts
- Evidencia de cierre · M1 Identidad: usuarios y control de acceso
- administracion/privacidad/page.tsx
- Anexo H de la tesis (arquitectura 4+1)
- Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido
- AC-6 Auditoría en la misma transacción
- PreguntarAlVecino
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 95 edges
2. `MensajeEstado()` - 93 edges
3. `exigirActor()` - 81 edges
4. `Boton()` - 75 edges
5. `exigirSesion()` - 72 edges
6. `lucide-react` - 64 edges
7. `leerJson()` - 59 edges
8. `react` - 59 edges
9. `enviarJson()` - 55 edges
10. `prisma` - 53 edges

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

## Communities (125 total, 40 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.09
Nodes (26): Lucide (librería de íconos), compartido/archivos (R2 firmado, validación, PDF etiquetado), compartido/notificaciones (cola, worker, adaptador Meta + simulador), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, HU-COB-12 Recibo digital en PDF, ReciboDigital (+18 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.07
Nodes (49): metadata, Responder(), inicioDelDiaEnLima(), plantillaEmergenciaGarita(), plantillaRejaManual(), plantillaVisitaEnPuerta(), plantillaVisitaLlego(), bitacora() (+41 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (18): Open Peeps (ilustraciones CC0), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales, HU-GAR-13 Rectificación de datos, HU-GAR-14 Cancelación de la cuenta (+10 more)

### Community 4 - "Usuario"
Cohesion: 0.15
Nodes (16): CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA), HU-GAR-09 Desvincular a un ex residente, HU-GAR-11 Pedir un enlace nuevo, HU-GAR-21 Crear cuentas internas con rol, HU-GAR-22 Revocar acceso de un miembro interno (+8 more)

### Community 5 - "exigirActor"
Cohesion: 0.09
Nodes (33): metadata, PoliticaDePrivacidad(), SECCIONES, Auditoria(), enlace(), metadata, Ayuda(), metadata (+25 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Predio"
Cohesion: 0.13
Nodes (18): Cuota semanal, EstadoCuenta, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-02 Estado de cuenta privado, HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CheckInPresencial, ConfirmacionAsistencia (DIGITAL / ASISTIDA) (+10 more)

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.57
Nodes (7): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (20): engines, node, name, private, version, prettier, prisma, @prisma/adapter-pg (+12 more)

### Community 10 - "Panel de inicio del vecino (HU-GAR-19)"
Cohesion: 0.22
Nodes (7): AC-2 Baja carga cognitiva (<= 3 interacciones), Modo Senior ("Letra grande"), Tamaños mínimos, Grupos de rutas por actor, Panel de inicio del vecino (HU-GAR-19), Server Components por defecto, Tokens, Tailwind v4 y Radix

### Community 11 - "Desviaciones respecto del Anexo H"
Cohesion: 0.16
Nodes (11): Cloudflare R2, Neon PostgreSQL, WhatsApp Cloud API (número de prueba), Adaptador de archivos R2 (URLs firmadas), Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones (+3 more)

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "despachar.ts"
Cohesion: 0.06
Nodes (39): dynamic, GET(), comprobarBaseDatos(), despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote() (+31 more)

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
Cohesion: 0.14
Nodes (21): DatosEmpadronamiento, empadronar(), MENSAJE_YA_REGISTRADO, personasDe(), validarEmpadronamiento(), ViviendaEmpadronada, SesionDto, NOMBRE_RELACION (+13 more)

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

### Community 42 - "BotonEnlace"
Cohesion: 0.13
Nodes (16): enlaceFiltro(), metadata, Padron(), Parametros, plural(), AvisoInstalar, GuiaPrimerUso(), PASOS (+8 more)

### Community 46 - "exigirSesion"
Cohesion: 0.12
Nodes (21): esquema, POST, GET, GET, GET, PATCH, respuesta, esquema (+13 more)

### Community 47 - "archivos.test.ts"
Cohesion: 0.11
Nodes (23): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), configuracion() (+15 more)

### Community 48 - "entrarConEnlace.test.ts"
Cohesion: 0.08
Nodes (25): PUT, cambiarModoSenior(), obtenerPerfil(), ADR-0004, aDto(), cargarPerfil(), DuenoPerfil, esUuid() (+17 more)

### Community 49 - "tokens/generar-css.mjs"
Cohesion: 0.25
Nodes (10): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+2 more)

### Community 50 - "contraste.ts"
Cohesion: 0.15
Nodes (15): aplanar(), hexadecimal(), luminancia(), MINIMOS, Modo, NodoToken, Par, paresAVerificar() (+7 more)

### Community 51 - "matriz-hu.mjs"
Cohesion: 0.15
Nodes (13): archivos(), casillas, cerradas, CODIGO, conAlgo, errores, ESTADO, filas (+5 more)

### Community 52 - "Fase 0b · Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.09
Nodes (31): Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12, Switch "Letra grande", tokens.json (fuente única de verdad) (+23 more)

### Community 53 - "Queja"
Cohesion: 0.20
Nodes (9): ConsentimientoInformado, Evidencia (foto/video), HU-QUE-01 Registrar queja con consentimiento y evidencia, HU-QUE-02 Modo anónimo, HU-QUE-04 Ticket correlativo y aviso a la directiva, HU-QUE-09 Seguimiento por código, IdentidadProtegida (AES-256-GCM + HMAC), Queja (+1 more)

### Community 54 - "cliente.ts"
Cohesion: 0.06
Nodes (36): EntradaAuditoria, crearAdministradorInicial(), global, prisma, Transaccion, negarseEnNube(), Persona, PERSONAS (+28 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "Comprobante"
Cohesion: 0.18
Nodes (12): Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, Pago (abstracta), PagoDigital, PagoPresencial (+4 more)

### Community 57 - "e2e.ts"
Cohesion: 0.20
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "avisos.test.ts"
Cohesion: 0.10
Nodes (28): PATCH, POST, filtro, GET, esquema, PUT, metadata, PreferenciasPagina() (+20 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (17): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita (+9 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.11
Nodes (31): esquema, POST, nombreDePantalla(), NOMBRES, Ayuda(), metadata, plantillaPedidoAyuda(), Actor (+23 more)

### Community 62 - "aplicacion/equipo.ts"
Cohesion: 0.14
Nodes (32): registrarAuditoria(), encolarAviso(), ADR-0006, plantillaBajaPadron(), plantillaClaveNueva(), plantillaEnlaceAcceso(), plantillaInvitacionEquipo(), plantillaRolCambiado() (+24 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 64 - "aplicacion/sesion.ts"
Cohesion: 0.19
Nodes (17): esquema, ADR-0004, cookieDeSesion(), esquema, POST, esquema, POST, esquema (+9 more)

### Community 65 - "consultarPadron.ts"
Cohesion: 0.09
Nodes (30): Actualizar(), metadata, Baja(), metadata, describirAccion(), etiquetaCampo(), Fila, Json (+22 more)

### Community 66 - "garita.test.ts"
Cohesion: 0.15
Nodes (27): esquema, POST, vecino, horaCorta(), rangoHorario(), abrirPorEmergencia(), aFila(), anotarEntradaVecino() (+19 more)

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

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.07
Nodes (34): AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), Concepto, CONCEPTOS, direccion() (+26 more)

### Community 78 - "entradaAlterna.ts"
Cohesion: 0.11
Nodes (41): hashDeToken(), nuevoToken(), ErrorEnPausa, plantillaClaveCambiada(), pasarPerfilALaCuenta(), asignarPerfilSinDueno(), emitirEnlace(), MENSAJE_MUCHOS (+33 more)

### Community 79 - "lucide-react"
Cohesion: 0.13
Nodes (24): Errores, Agregado, Encontrada, Errores, Resultado, ICONOS, Coincidencia, Casa (+16 more)

### Community 80 - "modoSeniorAlRenderizar"
Cohesion: 0.09
Nodes (34): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, Layout(), Layout() (+26 more)

### Community 81 - "leerJson"
Cohesion: 0.10
Nodes (23): esquema, PATCH, esquema, PATCH, esquema, POST, esquema, PATCH (+15 more)

### Community 82 - "next"
Cohesion: 0.08
Nodes (26): ClaveNueva(), metadata, EntrarConClave(), metadata, FormularioEntradaClave(), FormularioPedirEnlace(), ICONOS, OpcionEntrada() (+18 more)

### Community 83 - "fechas.ts"
Cohesion: 0.22
Nodes (14): ClaveRespaldo(), metadata, metadata, PanelAdministracion(), metadata, ResumenDirectiva(), sesionActual, Inicio() (+6 more)

### Community 84 - "visitas.ts"
Cohesion: 0.14
Nodes (25): DELETE, POST, Anular(), metadata, desdeHoraDeLima(), actualizarEstadoMorosidad(), aDto(), anularVisita() (+17 more)

### Community 85 - "Boton"
Cohesion: 0.10
Nodes (26): FormularioPolitica(), metadata, Privacidad(), PUNTOS, AgregarAlEquipo(), QuitarAcceso(), CambiarRol(), Lista() (+18 more)

### Community 86 - "Tarjeta.tsx"
Cohesion: 0.31
Nodes (9): MasOpciones(), metadata, MasOpciones(), metadata, BotonCerrarSesion(), MasOpciones(), metadata, TarjetaEnlace() (+1 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "enviarJson"
Cohesion: 0.09
Nodes (23): confirmar(), CambiarEstado(), pasarA(), metadata, PedidosDeAyuda(), enviarJson(), AccionGarita(), enviar() (+15 more)

### Community 89 - "MensajeEstado"
Cohesion: 0.11
Nodes (18): FormularioClaveNueva(), ClaveNuevaConEnlace(), metadata, FormularioClave(), FormularioAccesoEquipo(), CrearAccesoEquipo(), metadata, BotonReenviar() (+10 more)

### Community 90 - "administracion/equipo/page.tsx"
Cohesion: 0.11
Nodes (19): Agregar(), metadata, metadata, metadata, QuitarAccesoPagina(), CambiarRolPagina(), metadata, verMiembro() (+11 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.13
Nodes (28): plantillaNumeroCambiado(), aFila(), AnonimizarEnOtroModulo, avisarCambioDeNumero(), insignia(), Solicitud, titulo(), CampoRectificable (+20 more)

### Community 92 - "errores.ts"
Cohesion: 0.11
Nodes (11): contador, esquema, PATCH, ErrorDeAplicacion, ErrorNoAutorizado, ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion (+3 more)

### Community 93 - "ConsultarGarita.tsx"
Cohesion: 0.15
Nodes (19): Consulta, ConsultarGarita(), abrirPorEmergencia(), buscar(), MOTIVOS, Respuesta, abrir(), buscarEnInstantanea() (+11 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.16
Nodes (15): GET, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, anonimizar(), datosPersonales(), ESCALAS (+7 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.18
Nodes (16): GET, ACCIONES, accionesDelModulo(), describirAccion(), ModuloAuditoria, MODULOS_AUDITORIA, actoresDeAuditoria(), leerAuditoria() (+8 more)

### Community 96 - "cancelacion.test.ts"
Cohesion: 0.16
Nodes (14): metadata, Resolver(), PATCH, ErrorConflicto, aplicarRectificacion(), exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco() (+6 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.37
Nodes (12): CLAUDE.md (instrucciones del proyecto), Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, M6 · Accesibilidad y Diseño Centrado en el Usuario, M5 · Aportes Vecinales y Vigilancia, M4 · Asambleas y eventos pro fondos, M1 · Identidad: Usuarios y Control de Acceso (+4 more)

### Community 101 - "garita/page.tsx"
Cohesion: 0.21
Nodes (13): RefrescarSolo(), ACCIONES, InicioGarita(), metadata, BuscarVisita(), EnlaceLlego(), Dato(), enlaceBitacora() (+5 more)

### Community 102 - "Plantilla de evidencia de cierre de módulo"
Cohesion: 0.14
Nodes (17): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Semillas ficticias (personajes del prototipo), Plantilla de evidencia de cierre de módulo (+9 more)

### Community 103 - "cuentas/route.ts"
Cohesion: 0.19
Nodes (11): deAfuera, esquema, POST, rol, POST, POST, esquema, POST (+3 more)

### Community 104 - "solicitarRectificacion"
Cohesion: 0.20
Nodes (16): esquema, POST, plantillaCancelacionPedida(), plantillaSolicitudPrivacidad(), avisarResultado(), cambiarOposicion(), solicitarCancelacion(), solicitarCopia() (+8 more)

### Community 105 - "catalogo/page.tsx"
Cohesion: 0.26
Nodes (9): DemoConfirmacion(), Catalogo(), Confirmacion(), FilaResumen, CerrarDialogo, Dialogo(), POSICION, PropsDialogo (+1 more)

### Community 106 - "esquema.ts"
Cohesion: 0.18
Nodes (9): contador, dni, esquemaEmpadronamiento, nombre, otro, telefono, titular, vivienda (+1 more)

### Community 107 - "repositorioArco.ts"
Cohesion: 0.18
Nodes (9): miPerfil(), prefiereUbicacionGeneralizada(), terminaEn(), anonimizarIdentidad(), cerrarSolicitud(), CON_VECINO, pendienteDelMismoCampo(), solicitudesDelVecino() (+1 more)

### Community 108 - "Evidencia de cierre · M1 Identidad: usuarios y control de acceso"
Cohesion: 0.17
Nodes (9): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · M1 Identidad: usuarios y control de acceso (+1 more)

### Community 109 - "administracion/privacidad/page.tsx"
Cohesion: 0.22
Nodes (6): ESTILO_INSIGNIA, FILTROS, metadata, bandejaArco(), FilaArco, solicitudesParaLaBandeja()

### Community 110 - "Anexo H de la tesis (arquitectura 4+1)"
Cohesion: 0.29
Nodes (6): Anexo H de la tesis (arquitectura 4+1), Equivalencia de nombres Anexo H -> repositorio, Matriz de dependencias permitidas entre módulos, Vercel (app Next.js), Migraciones Prisma, Rollback por pieza

### Community 111 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.29
Nodes (7): 1. HU de la fase, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido

### Community 112 - "AC-6 Auditoría en la misma transacción"
Cohesion: 0.40
Nodes (5): AC-6 Auditoría en la misma transacción, Casos de uso (una función por archivo), exigirRol() autorización en aplicacion, registrarAuditoria(), Tabla nucleo_auditoria

### Community 113 - "PreguntarAlVecino"
Cohesion: 0.50
Nodes (3): metadata, VisitaNoAnunciada(), PreguntarAlVecino()

## Knowledge Gaps
- **500 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+495 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 672 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **Why does `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `tokens/generar-css.mjs`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `1. HU de la fase` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `catalogo/page.tsx`, `exigirSesion`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _500 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07012987012987013 - nodes in this community are weakly interconnected._
- **Should `Cierre diferido de HU parciales ([~] / [-])` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._