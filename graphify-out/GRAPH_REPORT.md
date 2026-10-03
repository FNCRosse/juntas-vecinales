# Graph Report - juntas-vecinales  (2026-10-03)

## Corpus Check
- 383 files · ~241,985 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .prisma 5, (none) 3, .example 1)

## Summary
- 2032 nodes · 6054 edges · 131 communities (89 shown, 42 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e952f47d`
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
- Regla de capas dominio/aplicacion/infraestructura
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
- ErrorValidacion
- Worker (GET /salud, POST /tareas/ejecutar)
- Ley N.° 29733 protección de datos personales
- Pirámide de pruebas (Jest, Supertest, Cypress+axe)
- Procedimiento por HU
- GuiaPrimerUso
- postcss.config.mjs
- .prettierrc.json
- inicio.cy.ts
- entrarConEnlace.test.ts
- archivos.test.ts
- repositorioPerfiles.ts
- comunicados.ts
- contraste.ts
- matriz-hu.mjs
- Fase 0b · Base de accesibilidad (M6) y núcleo compartido
- Queja
- cliente.ts
- dependencies
- HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos
- e2e.ts
- avisos.test.ts
- Worker de tareas programadas (advisory lock, cron cada 10 min)
- despachar.ts
- mediacion.ts
- aplicacion/equipo.ts
- lenguajeLlano.test.ts
- aplicacion/sesion.ts
- gestionarPadron.ts
- emitirEnlace.ts
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
- Boton
- modoSeniorAlRenderizar
- exigirSesion
- Opciones.tsx
- sesionActual
- anular/page.tsx
- Opcion
- firma.ts
- compilerOptions
- ejecutor.ts
- MensajeEstado
- dominio/equipo.ts
- aplicacion/arco.ts
- PerfilAccesibilidad
- ConsultarGarita
- arco.test.ts
- auditoria.ts
- ErrorNoEncontrado
- empadronar.cy.ts
- entrar-enlace.cy.ts
- Plan de implementación
- next
- AyudaEquipo
- integracion/identidad/entradaAlterna.test.ts
- repositorioArco.ts
- catalogo/page.tsx
- (vecino)/page.tsx
- salud.test.ts
- Transaccion
- administracion/privacidad/page.tsx
- Desviaciones respecto del Anexo H
- aFila
- claves.ts
- HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa
- avisos.cy.ts
- garita.cy.ts
- padron-gestion.cy.ts
- visitas.cy.ts
- solicitarRectificacion
- escuchar.cy.ts
- catalogo/layout.tsx
- equipo.cy.ts
- comunicados.cy.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 98 edges
2. `MensajeEstado()` - 97 edges
3. `exigirActor()` - 85 edges
4. `Boton()` - 77 edges
5. `exigirSesion()` - 75 edges
6. `lucide-react` - 70 edges
7. `react` - 62 edges
8. `leerJson()` - 61 edges
9. `enviarJson()` - 58 edges
10. `prisma` - 56 edges

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

## Communities (131 total, 42 thin omitted)

### Community 0 - "compartido/archivos (R2 firmado, validación, PDF etiquetado)"
Cohesion: 0.10
Nodes (24): compartido/archivos (R2 firmado, validación, PDF etiquetado), Comprobante, HU-COB-08 Subir comprobante de pago digital, HU-COB-09 Auditar comprobantes, HU-COB-10 Observar comprobante con motivo, HU-COB-12 Recibo digital en PDF, PagoDigital, ReciboDigital (+16 more)

### Community 1 - "Reglas duras del proyecto"
Cohesion: 0.25
Nodes (4): Convenciones de nombres de BD, Esquema Prisma por módulo, Migraciones Prisma, Rollback por pieza

### Community 2 - "aplicacion/garita.ts"
Cohesion: 0.05
Nodes (96): esquema, POST, vecino, GET, PATCH, ErrorConflicto, horaCorta(), inicioDelDiaEnLima() (+88 more)

### Community 3 - "Cierre diferido de HU parciales ([~] / [-])"
Cohesion: 0.12
Nodes (18): Open Peeps (ilustraciones CC0), HU-ACC-10 Tutorial guiado por sección, OnboardingGuiado (tutorial por sección), HU-COB-13 Tablero de recaudación, TableroRecaudacion, HU-GAR-12 Copia de mis datos personales, HU-GAR-13 Rectificación de datos, HU-GAR-14 Cancelación de la cuenta (+10 more)

### Community 4 - "Usuario"
Cohesion: 0.15
Nodes (16): CredencialRespaldo, HU-GAR-01 Empadronar residente y enviar acceso inicial, HU-GAR-02 Entrar con enlace de acceso y clave de respaldo, HU-GAR-03 Abrir desde el ícono del teléfono (PWA), HU-GAR-09 Desvincular a un ex residente, HU-GAR-11 Pedir un enlace nuevo, HU-GAR-21 Crear cuentas internas con rol, HU-GAR-22 Revocar acceso de un miembro interno (+8 more)

### Community 5 - "exigirActor"
Cohesion: 0.07
Nodes (51): InterruptorVoz(), metadata, PoliticaDePrivacidad(), SECCIONES, Agregar(), Equipo(), metadata, enlaceFiltro() (+43 more)

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

### Community 10 - "Regla de capas dominio/aplicacion/infraestructura"
Cohesion: 0.17
Nodes (8): Modo Senior ("Letra grande"), Tamaños mínimos, Funciones de aptitud con ESLint, Matriz de dependencias permitidas entre módulos, Panel de inicio del vecino (HU-GAR-19), Server Components por defecto, Tokens, Tailwind v4 y Radix, Base de datos de pruebas

### Community 11 - "Adaptador WhatsApp"
Cohesion: 0.25
Nodes (7): WhatsApp Cloud API (número de prueba), Adaptador WhatsApp, Despacho de notificaciones con reintentos, Simulador de WhatsApp, Tabla nucleo_notificaciones, Variables de entorno (sin valores), Simuladores de pruebas

### Community 12 - "guia-visual/generar-css.mjs"
Cohesion: 0.29
Nodes (9): aplanar(), css(), linea(), nombreCss(), ref(), REM, TAILWIND, tokens (+1 more)

### Community 13 - "notificaciones.test.ts"
Cohesion: 0.16
Nodes (13): AvisoNuevo, crearCanalMeta(), crearSimulador(), elegirCanal(), Entorno, MensajeWhatsApp, enviar(), encolar() (+5 more)

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
Cohesion: 0.11
Nodes (21): POST, contador, dni, esquemaEmpadronamiento, nombre, otro, telefono, titular (+13 more)

### Community 38 - "Worker (GET /salud, POST /tareas/ejecutar)"
Cohesion: 0.31
Nodes (7): Render (worker Node.js), Vercel (app Next.js), Despertador del worker con after(), Worker (GET /salud, POST /tareas/ejecutar), Política de retención de datos, Cron de GitHub Actions para el worker, Límites de los planes gratuitos

### Community 39 - "Ley N.° 29733 protección de datos personales"
Cohesion: 0.50
Nodes (4): Derechos ARCO, Ley N.° 29733 protección de datos personales, Instantánea del padrón en la garita (AC-4), PWA con service worker propio

### Community 40 - "Pirámide de pruebas (Jest, Supertest, Cypress+axe)"
Cohesion: 0.16
Nodes (13): AC-5 Idempotencia por idOperacion, AC-6 Auditoría en la misma transacción, AC-7 Confidencialidad (404 a datos ajenos), Casos de uso (una función por archivo), Errores tipados de dominio (compartido/errores.ts), exigirRol() autorización en aplicacion, manejar() envoltorio de route handlers, Recorrido de una petición (route handler -> aplicacion -> dominio -> repositorio) (+5 more)

### Community 41 - "Procedimiento por HU"
Cohesion: 0.50
Nodes (3): Uso del grafo graphify en el repo, Conventional Commits en español, Procedimiento por HU

### Community 42 - "GuiaPrimerUso"
Cohesion: 0.50
Nodes (3): GuiaPrimerUso(), Guia(), metadata

### Community 46 - "entrarConEnlace.test.ts"
Cohesion: 0.11
Nodes (17): esquema, POST, esquema, POST, aceptarPolitica(), crearClaveRespaldo(), MENSAJE_FALTA_ACEPTAR, CredencialRespaldo (+9 more)

### Community 47 - "archivos.test.ts"
Cohesion: 0.17
Nodes (12): configuracion(), Entorno, firmarDescarga(), prepararSubida(), Subida, TIPOS, UsoArchivo, validarArchivo() (+4 more)

### Community 48 - "repositorioPerfiles.ts"
Cohesion: 0.24
Nodes (13): cambiarModoSenior(), cambiarSintesisVoz(), ADR-0004, aDto(), cargarPerfil(), DuenoPerfil, esUuid(), PerfilAccesibilidadDto (+5 more)

### Community 49 - "comunicados.ts"
Cohesion: 0.13
Nodes (20): encolarAvisos(), vecinosDeLaComunidad(), idsDeVecinosActivos(), aDto(), Fila, publicarComunicado(), ADR-0006, verNoticias() (+12 more)

### Community 50 - "contraste.ts"
Cohesion: 0.15
Nodes (15): aplanar(), hexadecimal(), luminancia(), MINIMOS, Modo, NodoToken, Par, paresAVerificar() (+7 more)

### Community 51 - "matriz-hu.mjs"
Cohesion: 0.15
Nodes (13): archivos(), casillas, cerradas, CODIGO, conAlgo, errores, ESTADO, filas (+5 more)

### Community 52 - "Fase 0b · Base de accesibilidad (M6) y núcleo compartido"
Cohesion: 0.11
Nodes (28): Token spacing/tactil (48 px Normal, 56 px Senior), Atkinson Hyperlegible, Foco visible global (:focus-visible), generar-css.mjs → tokens.css, Modo Senior (data-mode="senior"), Reglas de accesibilidad verificables A1–A12, Switch "Letra grande", tokens.json (fuente única de verdad) (+20 more)

### Community 53 - "Queja"
Cohesion: 0.13
Nodes (14): compartido/notificaciones (cola, worker, adaptador Meta + simulador), HU-GAR-20 Centro de notificaciones unificado, ConsentimientoInformado, Evidencia (foto/video), HU-QUE-01 Registrar queja con consentimiento y evidencia, HU-QUE-02 Modo anónimo, HU-QUE-04 Ticket correlativo y aviso a la directiva, HU-QUE-09 Seguimiento por código (+6 more)

### Community 54 - "cliente.ts"
Cohesion: 0.06
Nodes (33): esquema, POST, POST, GET, global, prisma, negarseEnNube(), Persona (+25 more)

### Community 55 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, lucide-react, next, pdfkit, pg, @prisma/adapter-pg, @prisma/client, @radix-ui/react-dialog (+3 more)

### Community 56 - "HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos"
Cohesion: 0.29
Nodes (6): HU-ACC-03 Retroalimentación no punitiva y confirmación en dos pasos, HU-COB-11 Cobro en efectivo sin conexión, Pago (abstracta), PagoPresencial, DelegacionVoto, HU-ASA-06 Delegar el voto en un apoderado

### Community 57 - "e2e.ts"
Cohesion: 0.20
Nodes (5): Chainable, Cypress, ETIQUETAS, axe-core, cypress-axe

### Community 58 - "avisos.test.ts"
Cohesion: 0.14
Nodes (19): PATCH, POST, filtro, GET, esquema, PUT, contarNoLeidas(), listarNotificaciones() (+11 more)

### Community 59 - "Worker de tareas programadas (advisory lock, cron cada 10 min)"
Cohesion: 0.14
Nodes (17): Despliegue Vercel + Neon + Render + R2, Fase 0 · Esqueleto, CI/CD y despliegue, Worker de tareas programadas (advisory lock, cron cada 10 min), EstadoMorosidad (SOLVENTE, MOROSO_PREVENTIVO, MOROSO_CRITICO), EvaluadorMorosidad, HU-COB-05 Alerta preventiva a la semana de retraso, HU-COB-06 Moroso crítico a las 8 semanas, HU-COB-07 Liquidar deuda histórica y restituir garita (+9 more)

### Community 60 - "despachar.ts"
Cohesion: 0.15
Nodes (15): despacharAvisos(), escribirCopiaInterna(), ESPERAS_MIN, intentarCanalExterno(), reclamarLote(), ResumenDespacho, ADR-0006, guardarPreferencias() (+7 more)

### Community 61 - "mediacion.ts"
Cohesion: 0.12
Nodes (27): nombreDePantalla(), NOMBRES, Ayuda(), metadata, plantillaPedidoAyuda(), Actor, aDto(), cambiarEstadoApoyo() (+19 more)

### Community 62 - "aplicacion/equipo.ts"
Cohesion: 0.18
Nodes (24): ErrorReglaNegocio, plantillaRolCambiado(), agregarAlEquipo(), buscarEnPadron(), cambiarRol(), listarEquipo(), MiembroDto, miembroGestionable() (+16 more)

### Community 63 - "lenguajeLlano.test.ts"
Cohesion: 0.14
Nodes (10): ADR-0006, archivos(), CARPETAS, EXCLUIDAS, RAIZ, textos, textosVisibles(), casos (+2 more)

### Community 64 - "aplicacion/sesion.ts"
Cohesion: 0.12
Nodes (28): esquema, PUT, ADR-0004, cookieDeSesion(), esquema, POST, esquema, POST (+20 more)

### Community 65 - "gestionarPadron.ts"
Cohesion: 0.10
Nodes (36): metadata, registrarAuditoria(), encolarAviso(), plantillaBajaPadron(), describirAccion(), etiquetaCampo(), Fila, Json (+28 more)

### Community 66 - "emitirEnlace.ts"
Cohesion: 0.14
Nodes (14): plantillaClaveCambiada(), plantillaClaveNueva(), plantillaEnlaceAcceso(), plantillaInvitacionEquipo(), Destinatario, SEGUN_PROPOSITO, NombreRol, NOMBRE_RELACION (+6 more)

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
Cohesion: 0.07
Nodes (36): AsistenteEmpadronar(), guardarOtro(), revisar(), revisarTodo(), siguienteVivienda(), Concepto, CONCEPTOS, direccion() (+28 more)

### Community 78 - "entradaAlterna.ts"
Cohesion: 0.14
Nodes (33): hashDeToken(), nuevoToken(), pasarPerfilALaCuenta(), emitirEnlace(), MENSAJE_MUCHOS, MENSAJE_MUY_SEGUIDO, MENSAJE_SIN_WHATSAPP, restablecerClave() (+25 more)

### Community 79 - "Boton"
Cohesion: 0.12
Nodes (26): Errores, enviarJson(), Resultado, Consulta, MOTIVOS, Respuesta, ICONOS, OPCIONES (+18 more)

### Community 80 - "modoSeniorAlRenderizar"
Cohesion: 0.09
Nodes (34): modoSeniorAlRenderizar, ADR-0004, Layout(), Layout(), MarcoDeActor(), MARCOS, Layout(), Layout() (+26 more)

### Community 81 - "exigirSesion"
Cohesion: 0.09
Nodes (41): esquema, PATCH, GET, esquema, PATCH, esquema, esquema, PATCH (+33 more)

### Community 82 - "Opciones.tsx"
Cohesion: 0.16
Nodes (16): ClaveNueva(), metadata, FormularioPedirEnlace(), ICONOS, OpcionEntrada(), OtrasFormasDeEntrar(), Volver(), EnlaceNuevo() (+8 more)

### Community 83 - "sesionActual"
Cohesion: 0.14
Nodes (14): EntrarConClave(), metadata, FormularioEntradaClave(), FormularioClave(), ClaveRespaldo(), metadata, EntradaEquipo(), metadata (+6 more)

### Community 84 - "anular/page.tsx"
Cohesion: 0.50
Nodes (4): AnularVisita(), anular(), Anular(), metadata

### Community 85 - "Opcion"
Cohesion: 0.06
Nodes (44): Agregado, AgregarAlEquipo(), Encontrada, Errores, CambiarRol(), Lista(), Opcion, CasillaDni() (+36 more)

### Community 86 - "firma.ts"
Cohesion: 0.16
Nodes (11): codificar(), Credenciales, fechaAmz(), firmarUrl(), hmac(), PeticionAFirmar, sha256(), RFC-3986 (+3 more)

### Community 87 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, lib, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 88 - "ejecutor.ts"
Cohesion: 0.23
Nodes (11): depurarVencidos(), haceDias(), RETENCION_DIAS, VIDA_SESION_DIAS, servidor, CERROJO_WORKER, ejecutarTareas(), ResultadoLlamada (+3 more)

### Community 89 - "MensajeEstado"
Cohesion: 0.09
Nodes (22): FormularioClaveNueva(), ClaveNuevaConEnlace(), metadata, FormularioAccesoEquipo(), CrearAccesoEquipo(), metadata, metadata, QuitarAccesoPagina() (+14 more)

### Community 90 - "dominio/equipo.ts"
Cohesion: 0.13
Nodes (14): metadata, CambiarRolPagina(), metadata, diferenciaDePermisos(), HORAS_INVITACION, LARGO_MINIMO_CLAVE_EQUIPO, MotivoBaja, MOTIVOS_BAJA (+6 more)

### Community 91 - "aplicacion/arco.ts"
Cohesion: 0.15
Nodes (23): plantillaNumeroCambiado(), AnonimizarEnOtroModulo, avisarCambioDeNumero(), Solicitud, CampoRectificable, CAMPOS, celularLegible(), diaDeLima() (+15 more)

### Community 92 - "PerfilAccesibilidad"
Cohesion: 0.15
Nodes (4): DatosPerfil, EscalaTipografica, PerfilAccesibilidad, ADR-0004

### Community 93 - "ConsultarGarita"
Cohesion: 0.18
Nodes (16): ConsultarGarita(), abrirPorEmergencia(), buscar(), abrir(), buscarEnInstantanea(), compacto(), guardarInstantanea(), Instantanea (+8 more)

### Community 94 - "arco.test.ts"
Cohesion: 0.12
Nodes (22): GET, DocumentoPdf, generarPdf(), LETRA, SeccionPdf, fechaLarga(), plantillaSolicitudPrivacidad(), anonimizar() (+14 more)

### Community 95 - "auditoria.ts"
Cohesion: 0.23
Nodes (14): ACCIONES, accionesDelModulo(), describirAccion(), ModuloAuditoria, MODULOS_AUDITORIA, actoresDeAuditoria(), leerAuditoria(), auditoriaGlobal() (+6 more)

### Community 96 - "ErrorNoEncontrado"
Cohesion: 0.26
Nodes (9): metadata, Resolver(), ErrorNoEncontrado, exigirAdministracion(), resolverCambioDeNumero(), resolverSolicitudArco(), verSolicitudArco(), solicitudConVecino() (+1 more)

### Community 100 - "Plan de implementación"
Cohesion: 0.06
Nodes (57): Plantilla de PR, CLAUDE.md (instrucciones del proyecto), Plataforma web Junta Vecinal Villa de Fátima (R3.1), aplanar(), css(), linea(), nombreCss(), ref() (+49 more)

### Community 101 - "next"
Cohesion: 0.09
Nodes (32): Auditoria(), enlace(), metadata, MasOpciones(), metadata, MasOpciones(), metadata, Bitacora() (+24 more)

### Community 102 - "AyudaEquipo"
Cohesion: 0.27
Nodes (8): Ayuda(), metadata, AyudaEquipo(), Ayuda(), metadata, Ayuda(), metadata, contactoDeAdministracion()

### Community 103 - "integracion/identidad/entradaAlterna.test.ts"
Cohesion: 0.15
Nodes (18): deAfuera, esquema, POST, rol, POST, esquema, POST, esquema (+10 more)

### Community 104 - "repositorioArco.ts"
Cohesion: 0.15
Nodes (15): esquema, POST, plantillaCancelacionPedida(), cambiarOposicion(), prefiereUbicacionGeneralizada(), solicitarCancelacion(), solicitarCopia(), administradoresActivos() (+7 more)

### Community 105 - "catalogo/page.tsx"
Cohesion: 0.26
Nodes (9): DemoConfirmacion(), Catalogo(), Confirmacion(), FilaResumen, CerrarDialogo, Dialogo(), POSICION, PropsDialogo (+1 more)

### Community 106 - "(vecino)/page.tsx"
Cohesion: 0.33
Nodes (7): TarjetaNoticia(), Inicio(), metadata, obtenerPerfil(), bloqueDeIdentidad(), NoticiaDto, ultimasNoticias()

### Community 107 - "salud.test.ts"
Cohesion: 0.36
Nodes (4): dynamic, GET(), comprobarBaseDatos(), supertest

### Community 108 - "Transaccion"
Cohesion: 0.33
Nodes (3): EntradaAuditoria, Transaccion, ADR-0006

### Community 109 - "administracion/privacidad/page.tsx"
Cohesion: 0.22
Nodes (6): ESTILO_INSIGNIA, FILTROS, metadata, bandejaArco(), FilaArco, solicitudesParaLaBandeja()

### Community 110 - "Desviaciones respecto del Anexo H"
Cohesion: 0.25
Nodes (6): Anexo H de la tesis (arquitectura 4+1), Cloudflare R2, Equivalencia de nombres Anexo H -> repositorio, Neon PostgreSQL, Adaptador de archivos R2 (URLs firmadas), Entornos (local, CI, preview, producción)

### Community 111 - "aFila"
Cohesion: 0.33
Nodes (7): aFila(), insignia(), resumenArco(), titulo(), estadoDelPlazo(), contarPendientes(), nombreDeUsuario()

### Community 112 - "claves.ts"
Cohesion: 0.60
Nodes (4): crearAdministradorInicial(), cifrarClave(), claveCoincide(), derivar()

### Community 113 - "HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa"
Cohesion: 0.40
Nodes (6): Lucide (librería de íconos), ContenidoAccesible (textoAlternativo, sintetizarVoz), HU-ACC-02 Escuchar en voz alta los comunicados, HU-ACC-07 Alternativas textuales de imágenes, íconos y mapa, FeedComunitario, HU-ASA-12 Historial público de actas y balances

### Community 125 - "solicitarRectificacion"
Cohesion: 0.47
Nodes (6): aplicarRectificacion(), solicitarRectificacion(), errorDeRectificacion(), leerCelular(), leerVivienda(), buscarPredioPorLote()

### Community 126 - "escuchar.cy.ts"
Cohesion: 0.33
Nodes (4): Anotada, sufijo, VOZ_PERUANA, Window

## Knowledge Gaps
- **520 isolated node(s):** `printWidth`, `Errores`, `ICONOS`, `metadata`, `metadata` (+515 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 707 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Plan de implementación` connect `Plan de implementación` to `Worker de tareas programadas (advisory lock, cron cada 10 min)`, `Fase 0b · Base de accesibilidad (M6) y núcleo compartido`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `1. HU de la fase` connect `Plan de implementación` to `exigirSesion`, `catalogo/page.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `printWidth`, `Errores`, `ICONOS` to the rest of the system?**
  _520 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compartido/archivos (R2 firmado, validación, PDF etiquetado)` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._
- **Should `aplicacion/garita.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05325260052786834 - nodes in this community are weakly interconnected._
- **Should `Cierre diferido de HU parciales ([~] / [-])` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `exigirActor` be split into smaller, more focused modules?**
  _Cohesion score 0.06506849315068493 - nodes in this community are weakly interconnected._