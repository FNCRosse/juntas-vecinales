# Datos

Un único PostgreSQL (Neon) con un único esquema Prisma y separación lógica por módulo (ADR-007).

## 1. Esquema Prisma

- Ubicación: `compartido/bd/esquema/`, un archivo por módulo (`identidad.prisma`, `aportes.prisma`, …) más `base.prisma` con el `generator` y el `datasource`. Prisma los une en un solo esquema; las migraciones viven en `compartido/bd/esquema/migrations/`.
- El cliente se instancia una sola vez en `compartido/bd/cliente.ts`. Solo lo importan los `infraestructura/` de los módulos, `compartido/*` y los guiones de semillas.
- Conexión: la app y el worker usan la URL con pooling (`DATABASE_URL`); las migraciones, la directa (`DATABASE_URL_UNPOOLED`).
- Prisma 7: la URL de las migraciones va en `prisma.config.ts` (que en local lee `.env.local`, porque Prisma ya no carga `.env`), no en el esquema. El generador es `prisma-client` y escribe el cliente en `compartido/bd/generado/` (CommonJS, sin extensión en las importaciones, ignorado por git); se genera en `postinstall`. En ejecución el cliente usa el adaptador `@prisma/adapter-pg` con `DATABASE_URL`.
- Cada módulo es dueño de sus tablas. Un repositorio solo lee y escribe las tablas de su módulo; los datos de otro módulo se piden a su `aplicacion`. Las llaves foráneas entre módulos sí se declaran: la integridad referencial es la razón de tener un solo almacén.

## 2. Convenciones de nombres

| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Modelo | Clase del diagrama, PascalCase singular en español | `SolicitudAjusteTarifa` |
| Tabla | `@@map("<modulo>_<plural_snake>")`: el prefijo es la separación lógica | `aportes_solicitudes_ajuste_tarifa` |
| Campo | camelCase, el nombre del atributo del diagrama | `saldoPendiente`, `idOperacionLocal` |
| Enum | El del diagrama, valores en MAYÚSCULAS | `EstadoCuota { PENDIENTE EN_DISCREPANCIA PAGADA VENCIDA }` |
| Llave primaria | `id String @id @default(uuid())` | — |
| Dinero | `Int` en céntimos | `montoCalculado Int` |
| Fechas | `DateTime` en UTC; se muestran en `America/Lima` | — |
| Índice único de negocio | `@@unique` con nombre explícito | `@@unique([predioId, periodo], name: "cuota_por_predio_y_periodo")` |

Prefijos de tabla (la primera del módulo M6 es `accesibilidad_perfiles`): `identidad_`, `transparencia_`, `incidencias_`, `asambleas_`, `aportes_`, `accesibilidad_` y, para el núcleo, `nucleo_` (`nucleo_auditoria`, `nucleo_cola_avisos`, `nucleo_notificaciones`, `nucleo_archivos`, `nucleo_ejecuciones_worker`).

## 3. Restricciones en la base, no en el código

Se escriben como SQL dentro de la migración que crea la tabla:

- **Solo inserción** (trigger que lanza error en UPDATE y DELETE): `nucleo_auditoria` (HU-GAR-26 CA3), bitácora de garita (HU-GAR-08 CA3), historial de tarifas (HU-COB-16 CA3), publicaciones de transparencia ya emitidas (`esInalterable`).
- **Idempotencia:** `UNIQUE` sobre `idOperacion` / `idOperacionLocal` y sobre `(predioId, periodo)` de la cuota.
- **Unicidad del padrón:** `UNIQUE` sobre el DNI de la persona (HU-GAR-01 CA3).
- **Un reclamo abierto por cuota:** índice único parcial (HU-COB-03 CA3).

## 4. Migraciones

- Se crean en local con `npx prisma migrate dev --name <que_cambia>` contra la BD de desarrollo; el nombre va en español y en snake_case.
- Se aplican con `prisma migrate deploy`, que corre **dentro del build de Vercel** (`prisma migrate deploy && next build`). Cada preview aplica sus migraciones en su propia rama de Neon; producción las aplica al desplegar `main`.
- Nunca se edita una migración que ya llegó a `main`: se corrige con otra nueva.
- Un cambio de esquema que borra o renombra columnas se hace en dos PR (agregar y migrar datos; luego retirar).

## 5. Semillas ficticias

`compartido/bd/semillas.ts`, ejecutado con `npm run semillas` (se compila con `tsc`, como el worker). Se usa en desarrollo y en el CI, **nunca contra Neon**: las ramas de las previews son copias de producción y una clave conocida del repositorio público daría acceso a ellas; el guion se niega a correr con una URL de Neon o en producción. Las cuentas del equipo de las semillas usan la clave `SEMILLA_CLAVE` (por defecto, una clave de prueba).

La cuenta inicial del administrador en producción (el prototipo asume que ya existe, Anexo M §6) la crea la autora con `npm run administrador:crear` y sus datos en `ADMIN_INICIAL_NOMBRE`, `ADMIN_INICIAL_DNI` y `ADMIN_INICIAL_CLAVE` (y la `DATABASE_URL` de producción). Se niega si ya existe un administrador.

Personajes del prototipo (todos ficticios; DNI, teléfonos y placas inventados):

| Persona | Rol | Predio | Uso en las pruebas |
| --- | --- | --- | --- |
| Carmen Huamán, 72 años | Vecina adulta mayor, modo Senior activo | Mz. C, lote 7 (casa + inquilino) | Recorrido principal del vecino, cobro en casa, reclamo de cuota |
| Marta Rojas | Directiva (tesorera), también vecina | Mz. A, lote 12 | Cobros, comprobantes, tarifa, actas |
| Pedro Chávez | Directivo mediador | — | Rutas asistidas, pedidos de ayuda |
| Ana Flores | Administradora | — | Padrón, equipo, ARCO, auditoría |
| Luis Paredes | Vigilante, turno de día | — | Garita, visitas, bitácora |
| Julio Mendoza | Vecino | Mz. A, lote 3 (con auto) | Moroso crítico: semáforo rojo |
| Rosa Díaz | Vecina | Mz. B, lote 2 (auto CDF-220) | Semáforo verde, bitácora |
| Elena Soto | Vecina | Mz. D, lote 9 (auto y moto) | Varios vehículos en la tarifa |
| Víctor Salas | Vecino | Mz. B, lote 11 | Cancelación ARCO |

Tarifa semanal de ejemplo, con la estructura que aprueba la asamblea (HU-COB-16): casa S/ 2.50, auto o camioneta S/ 5.00, moto S/ 2.50, triciclo o carreta S/ 2.50, inquilino S/ 2.50, negocio S/ 5.00.

**Prohibido** copiar al repositorio nombres, DNI, teléfonos, direcciones, placas o recibos reales de la junta, aunque sea para una prueba.

## 6. Ley N.° 29733 (protección de datos personales)

- **Finalidad y consentimiento:** la política de privacidad se acepta al primer ingreso (HU-GAR-02 CA2) y al registrar una queja (HU-QUE-01 CA1); se guarda la versión aceptada y la fecha (`Usuario.politicaVersion` y `politicaAceptadaEn`; la versión vigente es `VERSION_POLITICA` en `modulos/identidad/dominio/politica.ts` y, si sube, se vuelve a pedir).
- **Derechos ARCO** (M1, HU-GAR-12 a 16): plazos del reglamento (D. S. 016-2024-JUS) mostrados al vecino y vigilados en la bandeja del administrador: **20 días hábiles para acceso** y **10 días hábiles para rectificación, cancelación y oposición**.
- **Cancelación:** se anonimizan los datos personales (nombre, DNI, teléfono, coordenadas exactas) y se conservan solo los registros contables exigidos por ley (cuotas, pagos, recibos), enlazados a un titular anonimizado.
- **Retención** (decisión abierta en el Anexo H §11; valores propuestos hasta que la directiva acuerde otros, y se cambian en un solo lugar: `compartido/retencion.ts`):

| Dato | Se conserva | Luego |
| --- | --- | --- |
| Comprobantes de pago y recibos | 5 años | Se borran de R2; queda el registro contable |
| Evidencias de quejas (fotos, videos) | 1 año desde el cierre del ticket | Se borran de R2 |
| Bitácora de garita y visitas | 1 año | Se borra |
| Enlaces de acceso y sesiones vencidas | 30 días | Se borran |
| Auditoría | Indefinida | — |

  La depuración la hace una tarea del worker; se implementa con el primer módulo que guarde ese tipo de dato.
- **Minimización:** la instantánea de la garita guarda el DNI solo como hash; el mapa público generaliza las coordenadas; la identidad del denunciante anónimo se cifra en reposo (AES-256-GCM con `CLAVE_CIFRADO`).
