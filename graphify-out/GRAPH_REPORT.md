# Graph Report - juntas-vecinales  (2026-10-03)

## Corpus Check
- 518 files · ~451,799 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .prisma 6, (none) 3, .example 1)

## Summary
- 2611 nodes · 8188 edges · 161 communities (108 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 86 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `617b3df2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compartido/archivos (R2 firmado, validación, PDF etiquetado)
- ErrorNoEncontrado
- aplicacion/garita.ts
- Cierre diferido de HU parciales ([~] / [-])
- Predio
- Campo
- verificar-contraste.mjs
- Queja
- Módulo accesibilidad (M6)
- package.json
- Matriz de dependencias permitidas entre módulos
- Desviaciones respecto del Anexo H
- guia-visual/generar-css.mjs
- plantillas.ts
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
- aplicacion/seguimiento.ts
- Worker (GET /salud, POST /tareas/ejecutar)
- Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido
- Pirámide de pruebas (Jest, Supertest, Cypress+axe)
- actas.ts
- GuiaPrimerUso
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- PublicarActa.tsx
- unitarias/nucleo/archivos.test.ts
- repositorioPerfiles.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- balances.ts
- prisma
- dependencies
- credencialRespaldo.ts
- e2e.ts
- avisos.test.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- padron/esquema.ts
- mediacion.ts
- aplicacion/equipo.ts
- lenguajeLlano.test.ts
- aplicacion/sesion.ts
- gestionarPadron.ts
- quejas.ts
- e2e.mjs
- jest.config.ts
- tabularHasta
- visitas.ts
- area-tactil.cy.ts
- catalogo.cy.ts
- revisar-estilos.sh
- letra-grande.cy.ts
- AsistenteEmpadronar.tsx
- entradaAlterna.ts
- AyudaEquipo
- exigirActor
- exigirSesion
- clave/page.tsx
- guias.ts
- PublicarBalance.tsx
- lucide-react
- avisos.ts
- compilerOptions
- ejecutor.ts
- MensajeEstado
- aplicacion/mapa.ts
- aplicacion/arco.ts
- garita.test.ts
- instantaneaLocal.ts
- arco.test.ts
- auditoria.ts
- resolverSolicitudArco
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- next
- balance.ts
- cuentas/route.ts
- repositorioArco.ts
- Boton
- fechas.ts
- entrarConEnlace.test.ts
- cliente.ts
- administracion/privacidad/page.tsx
- Reglas duras del proyecto
- acta.ts
- HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts
- perfil/page.tsx
- escuchar.cy.ts
- catalogo/layout.tsx
- aplicacion/historial.ts
- comunicados.cy.ts
- balances/[id]/page.tsx
- tokens/generar-css.mjs
- Plantilla de evidencia de cierre de módulo
- direccion
- ref_node_fs
- (vecino)/incidentes/page.tsx
- lintear.mjs
- actas.cy.ts
- balances.cy.ts
- historial.cy.ts
- repositorioGarita.ts
- registrarQueja
- queja.ts
- avisarDenunciante.ts
- Comprobante
- ConsultarGarita.tsx
- BuscarConCodigo.tsx
- Evidencia de cierre · M1 Identidad: usuarios y control de acceso
- verVivienda
- ADR-007 Esquema único con separación lógica por módulo
- Preferencias.tsx
- Procedimiento por HU
- corregir/page.tsx

## God Nodes (most connected - your core abstractions)
1. `next` - 123 edges
2. `exigirActor()` - 113 edges
3. `exigirSesion()` - 113 edges
4. `MensajeEstado()` - 111 edges
5. `Boton()` - 96 edges
6. `lucide-react` - 90 edges
7. `ErrorNoEncontrado` - 83 edges
8. `leerJson()` - 81 edges
9. `enviarJson()` - 80 edges
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

## Communities (161 total, 53 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.09
Nodes (26): compartido/archivos (R2 firmado, validación, PDF etiquetado), compartido/notificaciones (cola, worker, adaptador Meta + simulador), HU-COB-12 Recibo digital en PDF, ReciboDigital, Asamblea, CheckInPresencial, Convocatoria (abstracta, versión imprimible), EventoProFondos (+18 more)

### Community 1 - "ErrorNoEncontrado"
Cohesion: 0.10
Nodes (43): Derivar(), metadata, ErrorNoEncontrado, 3. Matriz HU → código → prueba, exigirRol(), anioEnLima(), derivarQueja(), documentoDelOficio() (+35 more)

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.11
Nodes (30): rangoHorario(), plantillaEmergenciaGarita(), plantillaRejaManual(), plantillaVisitaEnPuerta(), plantillaVisitaLlego(), anunciada(), FilaBitacora, PredioConResidentes (+22 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (18): Open Peeps (ilustraciones CC0), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales, HU-GAR-13 Rectificación de datos, HU-GAR-14 Cancelación de la cuenta (+10 more)

### Community 4 - "Predio"
Cohesion: 0.11
Nodes (23): Cuota semanal, HU-COB-01 Cálculo semanal de la deuda (worker), HU-COB-16 Conceptos y montos de la tarifa, Tarifa (ConceptoTarifa), CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA) (+15 more)

### Community 5 - "Campo"
Cohesion: 0.06
Nodes (50): FormularioPolitica(), metadata, Privacidad(), PUNTOS, Agregado, AgregarAlEquipo(), Encontrada, Errores (+42 more)

### Community 6 - "verificar-contraste.mjs"
Cohesion: 0.11
Nodes (14): css, esperado, fondos, hex(), json, lum(), minimo, neutros (+6 more)

### Community 7 - "Queja"
Cohesion: 0.14
Nodes (14): EstadoCuenta, HU-COB-02 Estado de cuenta privado, ConfirmacionAsistencia (DIGITAL / ASISTIDA), HU-ASA-02 Confirmar asistencia, HU-ASA-03 Confirmación asistida por el mediador, HU-GAR-19 Panel de inicio consolidado, PanelInicio, HU-QUE-02 Modo anónimo (+6 more)

### Community 8 - "Módulo accesibilidad (M6)"
Cohesion: 0.39
Nodes (9): Reparto de las 10 HU de M6, Módulo accesibilidad (M6), Módulo aportes (M5), Módulo asambleas (M4), Módulo identidad (M1), Módulo incidencias (M3), Módulo transparencia (M2), Derechos ARCO (+1 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (20): engines, node, name, private, version, prettier, prisma, @prisma/adapter-pg (+12 more)

### Community 10 - "Matriz de dependencias permitidas entre módulos"
Cohesion: 0.22
Nodes (7): AC-2 Baja carga cognitiva (<= 3 interacciones), Modo Senior ("Letra grande"), Tamaños mínimos, Matriz de dependencias permitidas entre módulos, Panel de inicio del vecino (HU-GAR-19), Server Components por defecto, Tokens, Tailwind v4 y Radix

### Community 11 - "Desviaciones respecto del Anexo H"
Cohesion: 0.16
Nodes (11): Cloudflare R2, Neon PostgreSQL, WhatsApp Cloud API (número de prueba), Adaptador de archivos R2 (URLs firmadas), Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones (+3 more)

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "plantillas.ts"
Cohesion: 0.33
Nodes (5): plantillaCancelacionPedida(), plantillaClaveNueva(), plantillaInvitacionEquipo(), plantillaSolicitudPrivacidad(), avisarResultado()

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

### Community 37 - "aplicacion/seguimiento.ts"
Cohesion: 0.10
Nodes (31): GET, respuestaPdf(), GET, GET, ipDe(), avanceADto(), consultarPorCodigo(), Fila (+23 more)

### Community 38 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.36
Nodes (7): Render (worker Node.js), Vercel (app Next.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker, Límites de los planes gratuitos

### Community 39 - "Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.07
Nodes (23): 1. HU de la fase, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido, 1. HU del módulo (+15 more)

### Community 40 - "Pirámide de pruebas (Jest, Supertest, Cypress+axe)"
Cohesion: 0.22
Nodes (9): Funciones de aptitud con ESLint, AC-5 Idempotencia por idOperacion, AC-6 Auditoría en la misma transacción, registrarAuditoria(), Tabla nucleo_auditoria, Cola local de cobros sin conexión, Instantánea del padrón en la garita (AC-4), PWA con service worker propio (+1 more)

### Community 41 - "actas.ts"
Cohesion: 0.13
Nodes (20): actaADto(), ActaDto, ActaPreparada, actasPublicadas(), descargarActa(), Fila, FilaActa, publicarActa() (+12 more)

### Community 42 - "GuiaPrimerUso"
Cohesion: 0.50
Nodes (3): GuiaPrimerUso(), Guia(), metadata

### Community 46 - "PublicarActa.tsx"
Cohesion: 0.24
Nodes (6): metadata, NuevaActa(), hoyEnLima(), PublicarActa(), publicar(), VACIO

### Community 47 - "unitarias/nucleo/archivos.test.ts"
Cohesion: 0.09
Nodes (29): GET, esquema, POST, USOS, codificar(), Credenciales, fechaAmz(), firmarUrl() (+21 more)

### Community 48 - "repositorioPerfiles.ts"
Cohesion: 0.07
Nodes (35): InterruptorVoz(), hayVozEnEspanol(), sintetizador(), suscribirVoces(), PUT, Escuchar(), leer(), Estado (+27 more)

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
Cohesion: 0.17
Nodes (15): balanceADto(), BalanceDto, Fila, FilaBalance, publicarBalance(), ROLES_DIRECTIVA, ROLES_VECINO, ADR-0006 (+7 more)

### Community 54 - "prisma"
Cohesion: 0.06
Nodes (39): prisma, negarseEnNube(), Persona, PERSONAS, sembrar(), ErrorDeAplicacion, ErrorEnPausa, ErrorNoAutenticado (+31 more)

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
Cohesion: 0.08
Nodes (30): despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote(), ResumenDespacho, ADR-0006, AvisoNuevo (+22 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (17): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita (+9 more)

### Community 60 - "padron/esquema.ts"
Cohesion: 0.17
Nodes (10): contador, dni, esquemaEmpadronamiento, esquemaPlacas, nombre, otro, telefono, titular (+2 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.08
Nodes (43): MasOpciones(), metadata, esquema, POST, nombreDePantalla(), NOMBRES, MasOpciones(), metadata (+35 more)

### Community 62 - "aplicacion/equipo.ts"
Cohesion: 0.06
Nodes (48): Agregar(), metadata, metadata, QuitarAccesoPagina(), CambiarRolPagina(), metadata, ErrorReglaNegocio, encolarAviso() (+40 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.33
Nodes (6): archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles()

### Community 64 - "aplicacion/sesion.ts"
Cohesion: 0.16
Nodes (24): EntradaEquipo(), metadata, esquema, ADR-0004, cookieDeSesion(), esquema, POST, esquema (+16 more)

### Community 65 - "gestionarPadron.ts"
Cohesion: 0.05
Nodes (63): esquema, POST, contador, esquema, PATCH, plantillaBajaPadron(), plantillaEnlaceAcceso(), CAMPOS_DE_PLACAS (+55 more)

### Community 66 - "quejas.ts"
Cohesion: 0.08
Nodes (34): metadata, ReporteAsistido(), aVecino(), buscarVecinos(), conCasa, directivaParaAvisar(), manzanaDe(), nombresDe() (+26 more)

### Community 67 - "e2e.mjs"
Cohesion: 0.20
Nodes (3): entorno, servidor, casos

### Community 68 - "jest.config.ts"
Cohesion: 0.50
Nodes (4): collectCoverageFrom, configuracion(), conTransformacionDeNext, jest

### Community 69 - "tabularHasta"
Cohesion: 0.60
Nodes (4): conFoco(), Foco, tab(), tabularHasta()

### Community 70 - "visitas.ts"
Cohesion: 0.15
Nodes (24): DELETE, respuesta, actualizarEstadoMorosidad(), aDto(), anularVisita(), MENSAJE_VISITAS_EN_PAUSA, misVisitas(), miVivienda() (+16 more)

### Community 72 - "catalogo.cy.ts"
Cohesion: 0.50
Nodes (3): MODOS, PAGINAS, TAMANOS

### Community 77 - "AsistenteEmpadronar.tsx"
Cohesion: 0.08
Nodes (36): CamposPlacas(), PlacasEscritas, AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), Concepto (+28 more)

### Community 78 - "entradaAlterna.ts"
Cohesion: 0.10
Nodes (46): hashDeToken(), nuevoToken(), ErrorConflicto, plantillaClaveCambiada(), pasarPerfilALaCuenta(), asignarPerfilSinDueno(), cerrarSesion(), MENSAJE_MUCHOS (+38 more)

### Community 79 - "AyudaEquipo"
Cohesion: 0.27
Nodes (8): Ayuda(), metadata, AyudaEquipo(), Ayuda(), metadata, Ayuda(), metadata, contactoDeAdministracion()

### Community 80 - "exigirActor"
Cohesion: 0.06
Nodes (44): modoSeniorAlRenderizar, ADR-0004, ClaveRespaldo(), metadata, Layout(), Layout(), metadata, Resolver() (+36 more)

### Community 81 - "exigirSesion"
Cohesion: 0.06
Nodes (64): esquema, PATCH, GET, esquema, PATCH, esquema, POST, esquema (+56 more)

### Community 82 - "clave/page.tsx"
Cohesion: 0.13
Nodes (19): ClaveNueva(), metadata, EntrarConClave(), metadata, FormularioEntradaClave(), FormularioPedirEnlace(), ICONOS, OpcionEntrada() (+11 more)

### Community 83 - "guias.ts"
Cohesion: 0.14
Nodes (20): esquema, GET, POST, ACCIONES_GUIA, esSeccion(), guiaDeSeccion(), GuiaDto, guiasDeUso() (+12 more)

### Community 84 - "PublicarBalance.tsx"
Cohesion: 0.29
Nodes (7): metadata, NuevoBalance(), Gasto, hoyEnLima(), nuevoGasto(), PublicarBalance(), publicar()

### Community 85 - "lucide-react"
Cohesion: 0.08
Nodes (41): Errores, EFECTOS, Motivo, Residente, ENTIDADES, DECISIONES, EvaluarReporte(), guardar() (+33 more)

### Community 86 - "avisos.ts"
Cohesion: 0.11
Nodes (22): PATCH, POST, filtro, GET, esquema, PUT, AlertasDirectiva(), metadata (+14 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "ejecutor.ts"
Cohesion: 0.12
Nodes (17): dynamic, GET(), comprobarBaseDatos(), depurarVencidos(), haceDias(), RETENCION_DIAS, VIDA_SESION_DIAS, ahora (+9 more)

### Community 89 - "MensajeEstado"
Cohesion: 0.12
Nodes (16): FormularioClaveNueva(), ClaveNuevaConEnlace(), metadata, FormularioClave(), FormularioAccesoEquipo(), CrearAccesoEquipo(), metadata, CambiarRol() (+8 more)

### Community 90 - "aplicacion/mapa.ts"
Cohesion: 0.15
Nodes (21): manzanasDelBarrio(), ESTADO_EN_EL_MAPA, mapaDeIncidentes(), ROLES, descripcionTextualAlternativa(), DIAS_DEL_MAPA, ESTADOS_EN_EL_MAPA, FilaMapa (+13 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.12
Nodes (32): plantillaNumeroCambiado(), aFila(), AnonimizarEnOtroModulo, aplicarRectificacion(), avisarCambioDeNumero(), insignia(), Solicitud, titulo() (+24 more)

### Community 92 - "garita.test.ts"
Cohesion: 0.13
Nodes (16): GET, PATCH, buscarCasas(), consultar(), guardarRespuesta(), hashDeDni(), instantanea(), marcarRespuestaTelefono() (+8 more)

### Community 93 - "instantaneaLocal.ts"
Cohesion: 0.26
Nodes (12): buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea, leerInstantanea(), refrescarInstantanea() (+4 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.16
Nodes (15): GET, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, anonimizar(), datosPersonales(), ESCALAS (+7 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.14
Nodes (20): Auditoria(), enlace(), metadata, ACCIONES, accionesDelModulo(), ACTOR_ANONIMO, describirAccion(), ModuloAuditoria (+12 more)

### Community 96 - "resolverSolicitudArco"
Cohesion: 0.48
Nodes (7): exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco(), verSolicitudArco(), anonimizarIdentidad(), cerrarSolicitud(), solicitudConVecino()

### Community 100 - "Plan de implementación"
Cohesion: 0.37
Nodes (12): CLAUDE.md (instrucciones del proyecto), Guía visual · Plataforma Junta Vecinal, Plan de implementación, LEEME del prototipo de referencia, M6 · Accesibilidad y Diseño Centrado en el Usuario, M5 · Aportes Vecinales y Vigilancia, M4 · Asambleas y eventos pro fondos, M1 · Identidad: Usuarios y Control de Acceso (+4 more)

### Community 101 - "next"
Cohesion: 0.08
Nodes (41): metadata, PoliticaDePrivacidad(), SECCIONES, Equipo(), metadata, BotonReenviar(), FichaVivienda(), metadata (+33 more)

### Community 102 - "balance.ts"
Cohesion: 0.20
Nodes (12): desdeHoraDeLima(), calcularTotales(), esFechaReal(), esMontoValido(), hoyEnLima(), MAXIMO_CONCEPTO, MAXIMO_EGRESOS, MAXIMO_MONTO (+4 more)

### Community 103 - "cuentas/route.ts"
Cohesion: 0.19
Nodes (11): deAfuera, esquema, POST, rol, POST, POST, esquema, POST (+3 more)

### Community 104 - "repositorioArco.ts"
Cohesion: 0.16
Nodes (18): esquema, POST, cambiarOposicion(), cargarUsuario(), miPerfil(), prefiereUbicacionGeneralizada(), solicitarCancelacion(), solicitarCopia() (+10 more)

### Community 105 - "Boton"
Cohesion: 0.14
Nodes (20): enlaceFiltro(), metadata, Padron(), Parametros, plural(), DemoConfirmacion(), Catalogo(), MarcarLeido() (+12 more)

### Community 106 - "fechas.ts"
Cohesion: 0.21
Nodes (16): metadata, PanelAdministracion(), metadata, ResumenDirectiva(), Inicio(), metadata, fechaLarga(), primerNombre() (+8 more)

### Community 107 - "entrarConEnlace.test.ts"
Cohesion: 0.15
Nodes (15): registrarAuditoria(), crearAdministradorInicial(), cifrarClave(), claveCoincide(), derivar(), aceptarPolitica(), crearClaveRespaldo(), MENSAJE_FALTA_ACEPTAR (+7 more)

### Community 108 - "cliente.ts"
Cohesion: 0.17
Nodes (10): EntradaAuditoria, global, Transaccion, encolarAvisos(), ADR-0006, ADR-0007, vecinosDeLaComunidad(), idsDeVecinosActivos() (+2 more)

### Community 109 - "administracion/privacidad/page.tsx"
Cohesion: 0.22
Nodes (6): ESTILO_INSIGNIA, FILTROS, metadata, bandejaArco(), FilaArco, solicitudesParaLaBandeja()

### Community 110 - "Reglas duras del proyecto"
Cohesion: 0.16
Nodes (9): Anexo H de la tesis (arquitectura 4+1), Equivalencia de nombres Anexo H -> repositorio, AC-7 Confidencialidad (404 a datos ajenos), Casos de uso (una función por archivo), Errores tipados de dominio (compartido/errores.ts), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio) (+1 more)

### Community 112 - "acta.ts"
Cohesion: 0.21
Nodes (11): DatosActa, esFechaReal(), hoyEnLima(), MAXIMO_ACUERDOS, MAXIMO_COMPROMISOS, MAXIMO_CONCLUSIONES, MAXIMO_TITULO, porLinea() (+3 more)

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 125 - "perfil/page.tsx"
Cohesion: 0.17
Nodes (16): DescargarCopia(), OposicionUbicacion(), cambiar(), Dato(), metadata, MiPerfil(), clasesBotonBarra(), Encabezado() (+8 more)

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

### Community 129 - "aplicacion/historial.ts"
Cohesion: 0.21
Nodes (9): ActasYBalances(), metadata, Actas, Balance, historialPublico(), RegistroDeHistorial, ROLES_VECINO, ordenarHistorial() (+1 more)

### Community 131 - "balances/[id]/page.tsx"
Cohesion: 0.35
Nodes (7): revisar(), Balance(), metadata, aCentimos(), soles(), GraficoBalance(), Totales

### Community 132 - "tokens/generar-css.mjs"
Cohesion: 0.25
Nodes (10): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+2 more)

### Community 133 - "Plantilla de evidencia de cierre de módulo"
Cohesion: 0.13
Nodes (18): Plantilla de PR, Plataforma web Junta Vecinal Villa de Fátima (R3.1), AC-1 Accesibilidad (0 violaciones axe), Lenguaje llano (R-07, HU-ACC-08), Lista de comprobación por pantalla, WCAG 2.2 AA, Semillas ficticias (personajes del prototipo), Plantilla de evidencia de cierre de módulo (+10 more)

### Community 134 - "direccion"
Cohesion: 0.29
Nodes (18): esquema, POST, vecino, horaCorta(), abrirPorEmergencia(), aFila(), anotarEntradaVecino(), anotarEntradaVisita() (+10 more)

### Community 136 - "(vecino)/incidentes/page.tsx"
Cohesion: 0.17
Nodes (15): OfertaDeGuia(), CALOR, cantidad(), CORTO, ICONOS, IncidentesDelBarrio(), TIPOS, Vista (+7 more)

### Community 137 - "lintear.mjs"
Cohesion: 0.40
Nodes (4): casos, eslint, resultados, eslint

### Community 141 - "repositorioGarita.ts"
Cohesion: 0.16
Nodes (11): inicioDelDiaEnLima(), bitacora(), marcarSalida(), anotarSalida(), buscarRegistro(), directivaActiva(), entradasSinSalida(), predioConResidentes() (+3 more)

### Community 142 - "registrarQueja"
Cohesion: 0.18
Nodes (13): anonimizar(), datosPersonales(), registrarQueja(), anonimizarQuejasDe(), quejasConNombreDe(), reportar(), reportar(), reportar() (+5 more)

### Community 143 - "queja.ts"
Cohesion: 0.19
Nodes (12): archivosSubidosPor(), validar(), Categoria, codigoTicket(), DatosQueja, esCoordenada(), ESTADOS, MAXIMO_EVIDENCIAS (+4 more)

### Community 144 - "avisarDenunciante.ts"
Cohesion: 0.25
Nodes (11): plantillaNovedadReporte(), telefonoDe(), avisarAlDenunciante(), ADR-0006, cifrar(), clave(), descifrar(), Entorno (+3 more)

### Community 145 - "Comprobante"
Cohesion: 0.18
Nodes (12): Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-11 Cobro en efectivo sin conexión, Pago (abstracta), PagoDigital, PagoPresencial (+4 more)

### Community 146 - "ConsultarGarita.tsx"
Cohesion: 0.22
Nodes (7): Consulta, ConsultarGarita(), abrirPorEmergencia(), MOTIVOS, Respuesta, Consultar(), metadata

### Community 147 - "BuscarConCodigo.tsx"
Cohesion: 0.31
Nodes (6): BuscarConCodigo(), metadata, Seguimiento(), AvanceReporte(), ICONO, AvanceDto

### Community 148 - "Evidencia de cierre · M1 Identidad: usuarios y control de acceso"
Cohesion: 0.22
Nodes (8): 1. HU del módulo, 2. Cobertura de Jest (unitarias + integración), 3. Matriz HU → código → prueba, 4. Reporte axe por pantalla, 5. Revisión manual de accesibilidad, 6. Capturas, 7. Pendientes y decisiones, Evidencia de cierre · M1 Identidad: usuarios y control de acceso

### Community 149 - "verVivienda"
Cohesion: 0.32
Nodes (5): Actualizar(), metadata, Baja(), metadata, verVivienda()

### Community 150 - "ADR-007 Esquema único con separación lógica por módulo"
Cohesion: 0.25
Nodes (4): Convenciones de nombres de BD, Esquema Prisma por módulo, Migraciones Prisma, Rollback por pieza

### Community 151 - "Preferencias.tsx"
Cohesion: 0.38
Nodes (3): OPCIONES, Preferencias(), Interruptor()

### Community 152 - "Procedimiento por HU"
Cohesion: 0.40
Nodes (4): Uso del grafo graphify en el repo, Conventional Commits en español, Procedimiento por HU, Etiquetas @HU

## Knowledge Gaps
- **673 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+668 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 910 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Evidencia de cierre · M1 Identidad: usuarios y control de acceso`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`, `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `Evidencia de cierre · M3 Demandas e incidentes` connect `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido` to `ErrorNoEncontrado`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `3. Matriz HU → código → prueba` connect `ErrorNoEncontrado` to `(vecino)/incidentes/page.tsx`, `aplicacion/mapa.ts`, `Evidencia de cierre · Fase 0b Base de accesibilidad (M6) y núcleo compartido`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _673 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.08547008547008547 - nodes in this community are weakly interconnected._
- **Should `ErrorNoEncontrado` be split into smaller, more focused modules?**
  _Cohesion score 0.10459183673469388 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10887096774193548 - nodes in this community are weakly interconnected._