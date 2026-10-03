# Graph Report - juntas-vecinales  (2026-10-03)

## Corpus Check
- 425 files · ~292,204 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .prisma 5, (none) 3, .example 1)

## Summary
- 2208 nodes · 6649 edges · 141 communities (96 shown, 45 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d71cdfb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- exigirSesion
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Predio
- Boton.tsx
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Panel de inicio del vecino (HU-GAR-19)
- Adaptador WhatsApp
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
- repositorioPerfiles.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- balances.ts
- errores.ts
- dependencies
- credencialRespaldo.ts
- e2e.ts
- avisos.test.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- despachar.ts
- mediacion.ts
- aplicacion/equipo.ts
- lenguajeLlano.test.ts
- perfil/route.ts
- gestionarPadron.ts
- archivos/route.ts
- ref_node_child_process
- jest.config.ts
- tabularHasta
- Escuchar.tsx
- area-tactil.cy.ts
- catalogo.cy.ts
- revisar-estilos.sh
- letra-grande.cy.ts
- AsistenteEmpadronar.tsx
- entradaAlterna.ts
- Tarjeta
- modoSeniorAlRenderizar
- leerJson
- Opciones.tsx
- _sesion/sesion.ts
- next
- lucide-react
- aplicacion/sesion.ts
- compilerOptions
- ejecutor.ts
- MensajeEstado
- emitirEnlace.ts
- aplicacion/arco.ts
- PerfilAccesibilidad
- instantaneaLocal.ts
- arco.test.ts
- auditoria.ts
- ErrorValidacion
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- visitas/[id]/page.tsx
- balance.ts
- integracion/identidad/entradaAlterna.test.ts
- repositorioArco.ts
- Boton
- (vecino)/page.tsx
- prisma
- cliente.ts
- administracion/privacidad/page.tsx
- Desviaciones respecto del Anexo H
- miPerfil
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

## Communities (141 total, 45 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.08
Nodes (30): compartido/archivos (R2 firmado, validación, PDF etiquetado), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, HU-COB-12 Recibo digital en PDF, Pago (abstracta) (+22 more)

### Community 1 - "exigirSesion"
Cohesion: 0.16
Nodes (12): GET, GET, GET, esquemaActa, GET, GET, POST, POST (+4 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.05
Nodes (100): esquema, POST, vecino, GET, DELETE, PATCH, ErrorConflicto, horaCorta() (+92 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (18): Open Peeps (ilustraciones CC0), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales, HU-GAR-13 Rectificación de datos, HU-GAR-14 Cancelación de la cuenta (+10 more)

### Community 4 - "Predio"
Cohesion: 0.11
Nodes (23): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA) (+15 more)

### Community 5 - "Boton.tsx"
Cohesion: 0.08
Nodes (35): Equipo(), metadata, BotonReenviar(), FichaVivienda(), metadata, metadata, PanelAdministracion(), metadata (+27 more)

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

### Community 13 - "notificaciones.test.ts"
Cohesion: 0.16
Nodes (13): crearCanalMeta(), crearSimulador(), elegirCanal(), Entorno, MensajeWhatsApp, enviar(), encolar(), simulador (+5 more)

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
Cohesion: 0.13
Nodes (21): registrarAuditoria(), plantillaEnlaceAcceso(), emitirEnlace(), DatosEmpadronamiento, empadronar(), MENSAJE_YA_REGISTRADO, personasDe(), validarEmpadronamiento() (+13 more)

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
Cohesion: 0.14
Nodes (17): ActaDto, ActaPreparada, descargarActa(), Fila, FilaActa, publicarActa(), revisar(), ROLES_VECINO (+9 more)

### Community 42 - "GuiaPrimerUso.tsx"
Cohesion: 0.32
Nodes (5): AvisoInstalar, GuiaPrimerUso(), PASOS, Guia(), metadata

### Community 46 - "entrarConEnlace.test.ts"
Cohesion: 0.17
Nodes (14): esquema, POST, esquema, POST, aceptarPolitica(), crearClaveRespaldo(), MENSAJE_FALTA_ACEPTAR, faltaAceptarPolitica() (+6 more)

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.10
Nodes (25): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), configuracion() (+17 more)

### Community 48 - "repositorioPerfiles.ts"
Cohesion: 0.22
Nodes (15): PUT, cambiarModoSenior(), cambiarSintesisVoz(), obtenerPerfil(), ADR-0004, aDto(), cargarPerfil(), DuenoPerfil (+7 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.12
Nodes (20): esquema, GET, POST, aDto(), Fila, publicarComunicado(), ADR-0006, verNoticias() (+12 more)

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
Nodes (15): archivosSubidosPor(), balanceADto(), BalanceDto, Fila, FilaBalance, publicarBalance(), ROLES_DIRECTIVA, ROLES_VECINO (+7 more)

### Community 54 - "errores.ts"
Cohesion: 0.10
Nodes (17): negarseEnNube(), claveCoincide(), ErrorDeAplicacion, ErrorEnPausa, ErrorNoAutenticado, ErrorNoAutorizado, ErrorNoEncontrado, ErrorReglaNegocio (+9 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "credencialRespaldo.ts"
Cohesion: 0.15
Nodes (6): CredencialRespaldo, DatosCredencial, LARGO_MINIMO_CLAVE, MAX_FALLOS, MINUTOS_DE_PAUSA, T0

### Community 57 - "e2e.ts"
Cohesion: 0.20
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "avisos.test.ts"
Cohesion: 0.12
Nodes (22): PATCH, POST, filtro, GET, esquema, PUT, GET, contarNoLeidas() (+14 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (17): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita (+9 more)

### Community 60 - "despachar.ts"
Cohesion: 0.16
Nodes (14): despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote(), ResumenDespacho, ADR-0006, leerPreferencias() (+6 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.08
Nodes (41): Ayuda(), metadata, esquema, POST, AyudaEquipo(), nombreDePantalla(), NOMBRES, Ayuda() (+33 more)

### Community 62 - "aplicacion/equipo.ts"
Cohesion: 0.17
Nodes (22): metadata, plantillaRolCambiado(), buscarEnPadron(), cambiarRol(), listarEquipo(), MiembroDto, miembroGestionable(), PersonaDelEquipo (+14 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 64 - "perfil/route.ts"
Cohesion: 0.17
Nodes (19): esquema, ADR-0004, cookieDeSesion(), esquema, POST, esquema, POST, esquema (+11 more)

### Community 65 - "gestionarPadron.ts"
Cohesion: 0.10
Nodes (36): metadata, plantillaBajaPadron(), describirAccion(), etiquetaCampo(), Fila, Json, listarPadron(), NOMBRE_CONCEPTO (+28 more)

### Community 66 - "archivos/route.ts"
Cohesion: 0.27
Nodes (8): GET, esquema, POST, USOS, NombreRol, pedir(), R2, subida()

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "Escuchar.tsx"
Cohesion: 0.22
Nodes (11): hayVozEnEspanol(), sintetizador(), suscribirVoces(), Escuchar(), leer(), Estado, elegirVoz(), esEspanol() (+3 more)

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.10
Nodes (28): AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), CasillaDni(), Concepto, CONCEPTOS (+20 more)

### Community 78 - "entradaAlterna.ts"
Cohesion: 0.19
Nodes (25): crearAdministradorInicial(), cifrarClave(), derivar(), hashDeToken(), nuevoToken(), pasarPerfilALaCuenta(), asignarPerfilSinDueno(), cerrarSesion() (+17 more)

### Community 79 - "Tarjeta"
Cohesion: 0.14
Nodes (20): metadata, PoliticaDePrivacidad(), SECCIONES, MasOpciones(), metadata, enlaceFiltro(), metadata, Padron() (+12 more)

### Community 80 - "modoSeniorAlRenderizar"
Cohesion: 0.09
Nodes (33): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, Layout(), Layout() (+25 more)

### Community 81 - "leerJson"
Cohesion: 0.06
Nodes (46): esquema, PATCH, esquema, PATCH, esquema, POST, deAfuera, esquema (+38 more)

### Community 82 - "Opciones.tsx"
Cohesion: 0.23
Nodes (11): ClaveNueva(), metadata, FormularioPedirEnlace(), ICONOS, OpcionEntrada(), OtrasFormasDeEntrar(), Volver(), EnlaceNuevo() (+3 more)

### Community 83 - "_sesion/sesion.ts"
Cohesion: 0.16
Nodes (15): EntrarConClave(), metadata, FormularioEntradaClave(), FormularioClave(), ClaveRespaldo(), metadata, EntradaEquipo(), metadata (+7 more)

### Community 84 - "next"
Cohesion: 0.05
Nodes (50): QuitarAccesoPagina(), ActualizarPredio(), guardar(), Concepto, CONCEPTOS, nombreUso(), Ocupacion, Uso (+42 more)

### Community 85 - "lucide-react"
Cohesion: 0.11
Nodes (31): Errores, Agregado, Encontrada, Errores, CambiarRol(), Lista(), Opcion, Solicitud (+23 more)

### Community 86 - "aplicacion/sesion.ts"
Cohesion: 0.15
Nodes (13): GET, esquema, GET, POST, GET, sembrar(), obtenerSesion(), SesionDto (+5 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "ejecutor.ts"
Cohesion: 0.18
Nodes (13): depurarVencidos(), haceDias(), RETENCION_DIAS, VIDA_SESION_DIAS, ahora, servidor, pg, CERROJO_WORKER (+5 more)

### Community 89 - "MensajeEstado"
Cohesion: 0.08
Nodes (27): InterruptorVoz(), FormularioClaveNueva(), ClaveNuevaConEnlace(), metadata, FormularioAccesoEquipo(), CrearAccesoEquipo(), metadata, BotonEntrar() (+19 more)

### Community 90 - "emitirEnlace.ts"
Cohesion: 0.08
Nodes (23): metadata, CambiarRolPagina(), metadata, Destinatario, SEGUN_PROPOSITO, diferenciaDePermisos(), HORAS_INVITACION, LARGO_MINIMO_CLAVE_EQUIPO (+15 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.15
Nodes (23): plantillaNumeroCambiado(), AnonimizarEnOtroModulo, avisarCambioDeNumero(), Solicitud, CampoRectificable, CAMPOS, celularLegible(), diaDeLima() (+15 more)

### Community 92 - "PerfilAccesibilidad"
Cohesion: 0.15
Nodes (4): DatosPerfil, EscalaTipografica, PerfilAccesibilidad, ADR-0004

### Community 93 - "instantaneaLocal.ts"
Cohesion: 0.26
Nodes (12): buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea, leerInstantanea(), refrescarInstantanea() (+4 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.16
Nodes (16): GET, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, fechaLarga(), anonimizar(), datosPersonales() (+8 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.12
Nodes (20): Auditoria(), enlace(), metadata, GET, ACCIONES, accionesDelModulo(), describirAccion(), ModuloAuditoria (+12 more)

### Community 96 - "ErrorValidacion"
Cohesion: 0.16
Nodes (13): metadata, Resolver(), PATCH, ErrorValidacion, exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco(), resumenArco() (+5 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.30
Nodes (15): CLAUDE.md (instrucciones del proyecto), Plantilla de evidencia de cierre de módulo, Cierre de módulo, Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, Matriz HU -> código -> pruebas (npm run matriz), M6 · Accesibilidad y Diseño Centrado en el Usuario (+7 more)

### Community 101 - "visitas/[id]/page.tsx"
Cohesion: 0.14
Nodes (18): Bitacora(), FILTROS, metadata, RefrescarSolo(), AccionGarita(), enviar(), ICONOS, BuscarVisita() (+10 more)

### Community 102 - "balance.ts"
Cohesion: 0.19
Nodes (12): calcularTotales(), DatosBalance, esFechaReal(), esMontoValido(), hoyEnLima(), MAXIMO_CONCEPTO, MAXIMO_EGRESOS, MAXIMO_MONTO (+4 more)

### Community 103 - "integracion/identidad/entradaAlterna.test.ts"
Cohesion: 0.17
Nodes (18): POST, esquema, POST, esquema, POST, despertarWorker(), MENSAJE_MUCHOS, MENSAJE_MUY_SEGUIDO (+10 more)

### Community 104 - "repositorioArco.ts"
Cohesion: 0.15
Nodes (15): esquema, POST, plantillaCancelacionPedida(), cambiarOposicion(), prefiereUbicacionGeneralizada(), solicitarCancelacion(), solicitarCopia(), administradoresActivos() (+7 more)

### Community 105 - "Boton"
Cohesion: 0.07
Nodes (33): AgregarAlEquipo(), Agregar(), QuitarAcceso(), DarDeBaja(), EFECTOS, Motivo, Residente, Baja() (+25 more)

### Community 106 - "(vecino)/page.tsx"
Cohesion: 0.31
Nodes (7): metadata, Noticias(), TarjetaNoticia(), Inicio(), metadata, NoticiaDto, ultimasNoticias()

### Community 107 - "prisma"
Cohesion: 0.39
Nodes (4): dynamic, GET(), prisma, comprobarBaseDatos()

### Community 108 - "cliente.ts"
Cohesion: 0.13
Nodes (13): EntradaAuditoria, global, Transaccion, Persona, PERSONAS, AvisoNuevo, encolarAvisos(), ADR-0006 (+5 more)

### Community 109 - "administracion/privacidad/page.tsx"
Cohesion: 0.22
Nodes (6): ESTILO_INSIGNIA, FILTROS, metadata, bandejaArco(), FilaArco, solicitudesParaLaBandeja()

### Community 110 - "Desviaciones respecto del Anexo H"
Cohesion: 0.12
Nodes (12): Anexo H de la tesis (arquitectura 4+1), Cloudflare R2, Equivalencia de nombres Anexo H -> repositorio, Funciones de aptitud con ESLint, Matriz de dependencias permitidas entre módulos, Vercel (app Next.js), Adaptador de archivos R2 (URLs firmadas), Convenciones de nombres de BD (+4 more)

### Community 111 - "miPerfil"
Cohesion: 0.20
Nodes (12): plantillaSolicitudPrivacidad(), aFila(), avisarResultado(), cargarUsuario(), insignia(), miPerfil(), terminaEn(), titulo() (+4 more)

### Community 112 - "acta.ts"
Cohesion: 0.20
Nodes (12): desdeHoraDeLima(), DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO (+4 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 125 - "solicitarRectificacion"
Cohesion: 0.60
Nodes (5): aplicarRectificacion(), solicitarRectificacion(), errorDeRectificacion(), leerCelular(), leerVivienda()

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 129 - "aplicacion/historial.ts"
Cohesion: 0.23
Nodes (9): actaADto(), Actas, Balance, historialPublico(), RegistroDeHistorial, ROLES_VECINO, ordenarHistorial(), listarActas() (+1 more)

### Community 131 - "balances/[id]/page.tsx"
Cohesion: 0.35
Nodes (7): revisar(), Balance(), metadata, aCentimos(), soles(), GraficoBalance(), Totales

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

## Knowledge Gaps
- **575 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+570 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 775 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `tokens/generar-css.mjs`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `1. HU de la fase` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `leerJson`, `Boton`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _575 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.07956989247311828 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05084033613445378 - nodes in this community are weakly interconnected._
- **Should `Cierre diferido de HU parciales ([~] / [-])` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._