# Backend

Cómo se escribe el código de servidor: route handlers, casos de uso, dominio, repositorios, adaptadores y worker. La regla de capas está en [ARQUITECTURA.md](ARQUITECTURA.md); aquí va el cómo.

## 1. Recorrido de una petición

```
app/api/<recurso>/route.ts      → valida con zod, obtiene la sesión, llama UNA función de aplicacion
modulos/<m>/aplicacion/<caso>.ts → autoriza por rol, abre la transacción, usa dominio + repositorio, audita, encola avisos
modulos/<m>/dominio/*.ts         → clases del diagrama; aplican las reglas y lanzan errores de dominio
modulos/<m>/infraestructura/*.ts → repositorios Prisma del módulo y adaptadores externos
```

- Los route handlers son delgados: nada de reglas de negocio ni de Prisma en `app/`.
- Las mutaciones van por route handlers (`app/api/**/route.ts`), no por Server Actions: son las que prueba Supertest, las que llama la cola sin conexión y las que lista el Anexo I. Las páginas leen datos llamando directamente a la `aplicacion` desde Server Components.
- Rutas: la notación `{id}` del Anexo I se escribe `[id]` en Next (`app/api/aportes/ajustes/[id]/route.ts`).

```ts
// app/api/aportes/ajustes/route.ts
export const POST = manejar(async (req) => {
  const sesion = await exigirSesion(req);
  const datos = esquemaAjuste.parse(await req.json());
  return Response.json(await registrarAjuste(sesion, datos), { status: 201 });
});
```

## 2. Casos de uso (`aplicacion/`)

- Un archivo por caso de uso, que exporta una función con verbo + objeto: `registrarAjuste`, `empadronar`, `canjearMagicLink`. Sin clases "Service".
- Firma: `(sesion, datos, tx?)`. `tx` es el cliente de transacción de Prisma y permite que otro módulo encadene la operación en la misma transacción (ADR-007).
- Orden dentro del caso de uso: autorizar → cargar → ejecutar en el dominio → guardar → auditar → encolar avisos. Todo lo que escribe va en una sola transacción.
- Devuelve DTO planos, nunca entidades ni filas de Prisma.

## 3. Dominio (`dominio/`)

- Las clases, atributos y operaciones salen del diagrama del módulo (02a–02f), con los mismos nombres. Es el DOO clásico que exige la tesis.
- Sin dependencias: ni Prisma, ni zod, ni fechas del sistema. La fecha actual entra como parámetro (`semanasDeRetraso(hoy)`), así Jest no necesita simular el reloj.
- Los montos se manejan en céntimos enteros (`number`), nunca en coma flotante. S/ 2.50 = `250`.
- Las invariantes se validan en el constructor o en la operación que las cambia, lanzando un error de dominio.

## 4. Validación y errores

- **Frontera:** zod valida todo lo que entra por HTTP (cuerpo, parámetros, cabeceras). El esquema vive junto al route handler. Un `ZodError` se convierte en 400 con el mensaje de cada campo en lenguaje llano, para mostrarlo junto al campo (WCAG 3.3.1).
- **Dominio:** errores tipados en `compartido/errores.ts`. `manejar()` (`compartido/manejar.ts`, el envoltorio de todos los route handlers; `leerJson()` convierte un cuerpo ilegible en 400) los traduce:

| Error | HTTP | Uso |
| --- | --- | --- |
| `ErrorValidacion` | 400 | Dato con forma incorrecta (también `ZodError`) |
| `ErrorNoAutenticado` | 401 | Sin sesión vigente |
| `ErrorNoAutorizado` | 403 | El rol no tiene el permiso |
| `ErrorNoEncontrado` | 404 | No existe **o no es visible para quien pregunta** (AC-7: no revelar existencia) |
| `ErrorConflicto` | 409 | Estado incompatible (reclamo ya abierto, token ya usado) |
| `ErrorReglaNegocio` | 422 | Regla del dominio incumplida (límite de representaciones, visita de moroso crítico) |
| Cualquier otro | 500 | Se registra en el log; el usuario ve "No pudimos completar la acción. Intente de nuevo en unos minutos." |

- Cada error lleva un `mensaje` para el usuario, con trato de usted, que dice qué pasó y cómo seguir (HU-ACC-03 CA2, HU-ACC-08). Nunca códigos técnicos ni culpa.

## 5. Sesión y autorización

- Sesión propia, sin librerías de autenticación: tabla `Sesion` (id aleatorio de 32 bytes con `crypto.randomBytes`), cookie `sesion` `HttpOnly`, `Secure`, `SameSite=Lax`. Persistente para el vecino (HU-GAR-03): se renueva al usarla; solo termina si el vecino cierra sesión o el administrador la revoca.
- `MagicLink`: token aleatorio, se guarda solo su hash SHA-256, vigencia 15 min, un solo uso; el canje lee la fila con `SELECT … FOR UPDATE` dentro de una transacción (figura H9).
- Claves (respaldo del vecino y cuentas internas): `crypto.scrypt` con sal por usuario. Los campos de clave admiten pegar y autocompletar (WCAG 3.3.8). Cinco fallos seguidos bloquean temporalmente la entrada con clave (HU-GAR-24 CA3).
- `middleware.ts` (o `proxy.ts`, si la versión de Next lo exige) solo redirige a `/entrar` cuando no hay cookie. **La autorización real se hace en `aplicacion/`** con `exigirRol(sesion, ...roles)`, porque el middleware no ve la BD.
- Roles (diagrama 02a): `VECINO`, `VECINO_ADULTO_MAYOR`, `DIRECTIVA`, `DIRECTIVO_MEDIADOR`, `VIGILANTE`, `ADMINISTRADOR`. Un usuario puede tener varios (la directiva también es vecina).

## 6. Reglas transversales de calidad (Anexo H §3)

- **AC-5 Idempotencia.** Toda operación que crea dinero, votos o reclamos recibe un `idOperacion` (UUID v4 generado en el dispositivo) con restricción `UNIQUE` en su tabla. Ante el conflicto, el caso de uso devuelve el registro ya creado con 200, sin aplicar dos veces. Obligatorio en `PagoPresencial` (cola sin conexión).
- **AC-6 Auditoría.** Toda acción crítica (pagos, tarifa, padrón, roles y cuentas, ARCO, decisiones sobre quejas, contingencias de asamblea) llama a `registrarAuditoria({ actorId, accion, entidad, entidadId, antes, despues }, tx)` de `compartido/auditoria` **dentro de la misma transacción**. La tabla no admite UPDATE ni DELETE (trigger, ver [DATOS.md](DATOS.md)).
- **AC-7 Confidencialidad.** Toda consulta del vecino se filtra por los predios de su sesión en el repositorio, no en la página. Pedir un recurso ajeno da 404. Cada HU con datos personales lleva una prueba de integración que lo intenta con otro vecino.
- **Retroalimentación inmediata.** Lo asíncrono responde 202 con un estado comprensible ("Le enviamos el enlace por WhatsApp", "Pendiente de sincronizar"), nunca un error técnico (Anexo H §7).

## 7. Adaptadores externos

Son las únicas interfaces con una sola implementación real que se permiten, porque el Anexo H las aísla tras un adaptador.

| Adaptador | Ubicación | Implementaciones | Selección |
| --- | --- | --- | --- |
| WhatsApp | `compartido/notificaciones/whatsapp.ts` | `meta` (Cloud API, número de prueba) y `simulador` | `WHATSAPP_MODO`; fuera de producción el valor por defecto es `simulador` |
| Archivos | `compartido/archivos/` | R2 vía su API compatible con S3 | Única; en pruebas se usa un bucket simulado en memoria |
| Mapas | componente cliente del mapa de incidentes | Leaflet + teselas de `NEXT_PUBLIC_MAPA_URL_TESELAS` | URL configurable |
| PDF | `compartido/archivos/pdf.ts` | `pdfkit` con `tagged: true` y `lang: 'es-PE'` (PDF etiquetado, legible por lector de pantalla) | Única |

- **Simulador de WhatsApp:** no envía nada; guarda el mensaje como si se hubiera enviado (estado `ENVIADA`, canal `simulador`). Admite un modo de fallo (`WHATSAPP_SIMULAR_FALLO=1`) para probar los reintentos.
- **Plantillas de WhatsApp:** fuera de la ventana de 24 h, Meta solo entrega plantillas aprobadas. Los textos de cada plantilla viven en `compartido/notificaciones/plantillas.ts` y se registran en Meta con el mismo nombre.
- **Archivos en R2:** el navegador sube con una URL firmada de `PUT` de vigencia corta (5 min) tras validar en el servidor el tipo (JPG, PNG, PDF; MP4 solo para evidencias) y el tamaño (máx. 5 MB; 20 MB en video). Se descarga con una URL firmada de `GET` de 5 min que se genera solo si quien la pide puede ver el recurso. El bucket nunca es público ni listable.
- **Exportaciones:** CSV en UTF-8 con BOM y separador `;` (abre directo en Excel en es-PE). Cubre "Excel o CSV" (HU-COB-15) sin otra librería.

## 8. Worker

- Servidor Node mínimo en `worker/` con `GET /salud` y `POST /tareas/ejecutar`. Este último exige la cabecera `x-secreto-worker` igual a `SECRETO_WORKER`; si no coincide responde 401 sin tocar la BD.
- Al ejecutar: toma un **advisory lock** de Postgres dentro de una transacción (`pg_try_advisory_xact_lock`, se libera solo al terminar); si no lo obtiene, responde `{ estado: "ocupado" }` sin efecto. Se usa la variante de transacción porque la URL con pooling de Neon reparte las sesiones por transacción y un cerrojo de sesión podría quedar en otra conexión. Registra cada ejecución (inicio, fin, resultado `EXITOSA` o `FALLIDA`) en `nucleo_ejecuciones_worker`.
- El worker se compila con `tsc` (`worker/tsconfig.json`) a `dist/worker/` y por ahora importa `compartido/` con rutas relativas, porque `tsc` no reescribe el alias `@/`. Cuando la primera tarea importe `@/modulos/*/aplicacion`, el build del worker tendrá que resolver ese alias.
- Cada tarea decide si le toca correr según su última ejecución registrada (la deuda es semanal; el despacho de avisos, en cada llamada). Las tareas solo importan `modulos/*/aplicacion` y `compartido/*`.
- **Despacho de notificaciones (ADR-006):** reclama un lote con `SELECT … FOR UPDATE SKIP LOCKED`, escribe primero la copia interna (centro de notificaciones) y después intenta WhatsApp según la `PreferenciaNotificacion`. Si falla, reintenta hasta 3 veces con espera creciente (1, 4 y 16 min, guardada en `reintentarDesde`) y luego la marca `FALLIDA`, sin perder la copia interna.
- **Despertador:** el cron de GitHub Actions llama cada 10 min (ver [DESPLIEGUE.md](DESPLIEGUE.md)). Para que un enlace de acceso no espere al cron, el route handler que encola un aviso urgente llama a `POST /tareas/ejecutar` en segundo plano con `after()` de Next, sin esperar la respuesta.
