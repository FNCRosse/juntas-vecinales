# Pruebas

Los criterios de aceptación de cada HU (tabla del `modulos/<m>/CLAUDE.md`) se convierten en pruebas **antes** de escribir el código.

## 1. Pirámide y ubicación

| Nivel | Herramienta | Qué prueba | Dónde | Archivo |
| --- | --- | --- | --- | --- |
| Unitarias | Jest | Reglas del `dominio` sin BD ni red | `pruebas/unitarias/<modulo>/` | `<clase>.test.ts` |
| Integración | Jest + Supertest | Route handlers → `aplicacion` → BD de pruebas real; autorización, confidencialidad (AC-7), idempotencia (AC-5), auditoría (AC-6) | `pruebas/integracion/<modulo>/` | `<recurso>.test.ts` |
| Extremo a extremo | Cypress + cypress-axe | El flujo principal de cada HU en el navegador, con auditoría axe en cada estado | `pruebas/e2e/<modulo>/` | `<hu>.cy.ts` |

- Cada criterio de aceptación tiene al menos una prueba en el nivel más bajo que lo puede comprobar. Lo que depende de la BD va en integración; lo que depende de la pantalla, en e2e.
- Los criterios que solo se cumplen con personas (HU-ACC-05 CA3 en su parte manual, HU-ACC-08 CA4) se registran como "manual, R3.2" en la evidencia del módulo; no se fingen con una prueba automática.

## 2. Etiquetas `@HU`

Toda prueba lleva en su nombre la HU y, si aplica, el criterio:

```ts
describe('@HU-GAR-01 Empadronar residente', () => {
  it('@HU-GAR-01 CA3 rechaza un DNI ya empadronado', async () => { /* … */ });
});
```

- Formato: `@HU-<EPICA>-<nn>` seguido de ` CA<k>`. Lo transversal de infraestructura usa `@HU-INFRA`.
- El caso de uso principal de cada HU lleva en su primera línea el comentario `// @HU-XXX-nn`, para enlazar la HU con su código.
- Desde la fase 0b, `npm run matriz` (`guiones/matriz-hu.mjs`) recorre `pruebas/`, `modulos/` y `app/`, y escribe `docs/evidencias/matriz-hu.md` con la tabla HU → código → pruebas unitarias, de integración y e2e. Sale con error si una HU marcada `[x]` en [PLAN.md](PLAN.md) no tiene código etiquetado o no tiene e2e. Corre en el CI.

## 3. Umbrales (indicador de la tesis)

| Indicador | Umbral | Dónde se mide | ¿Bloquea? |
| --- | --- | --- | --- |
| Cobertura de líneas de Jest (unitarias + integración juntas) | ≥ 80 % global | `coverageThreshold.global.lines = 80` en `jest.config.ts`; se mide sobre `modulos/**`, `compartido/**`, `worker/**` y `app/api/**` | Sí, desde la fase 0 |
| HU con al menos un e2e de Cypress | 100 % de las HU cerradas | `npm run matriz` | Sí |
| Violaciones axe WCAG 2.2 AA en los e2e | 0 | `cy.checkA11y` en cada estado de cada e2e | Sí |

Etiquetas de axe: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. Cada e2e guarda el resultado de axe por pantalla en `pruebas/e2e/reportes/axe/` (artefacto del CI), que alimenta la evidencia de cierre de módulo.

## 4. Comandos

| Comando | Qué corre | Necesita |
| --- | --- | --- |
| `npm test` | Todo Jest (unitarias + integración) con cobertura y umbral | Postgres de pruebas |
| `npm run test:integracion` | Solo el proyecto de integración, para iterar | Postgres de pruebas |
| `npm run test:e2e` | Build, servidor y Cypress en modo headless con axe | Postgres de pruebas con semillas |

Para una sola HU: `npx jest -t "@HU-GAR-01"` o `npx cypress run --spec pruebas/e2e/identidad/hu-gar-01.cy.ts`.

## 5. Base de datos de pruebas

- **CI:** servicio `postgres:16` de GitHub Actions. **Nunca Neon, R2 ni Meta** desde el CI.
- **Local:** el mismo Postgres en Docker:

  ```bash
  docker run -d --name jv-pruebas -e POSTGRES_PASSWORD=pruebas -e POSTGRES_DB=jv_pruebas -p 5433:5432 postgres:16
  ```

  y en `.env.test.local` la `DATABASE_URL` apuntando a `localhost:5433`.
- Antes de la suite: `prisma migrate deploy` sobre la BD de pruebas (lo hace el `globalSetup` del proyecto `integracion`, `pruebas/integracion/preparar.ts`). Entre pruebas de integración: `TRUNCATE` de las tablas tocadas; nunca depender del orden.
- Jest usa la transformación de Next (`next/jest`), que carga `.env.test.local` (no `.env.local`).
- Supertest contra Next: la prueba levanta `next dev` en un proceso hijo y le hace las peticiones. El código que corre dentro de Next no entra en la cobertura de Jest, así que la misma prueba llama además al route handler directamente.
- Cypress descarga su binario al instalar; donde no hace falta (Vercel, Render, los jobs del CI sin e2e) se instala con `CYPRESS_INSTALL_BINARY=0`.
- Fechas: el dominio recibe `hoy` como parámetro; las pruebas de las tareas del worker llaman a la `aplicacion` con una fecha fija.

## 6. Simuladores

- **WhatsApp:** con `WHATSAPP_MODO=simulador` (valor por defecto fuera de producción) el adaptador no sale a la red y deja el mensaje en `nucleo_notificaciones` con canal `simulador`. La prueba comprueba la notificación en la tabla o en el centro de notificaciones de la pantalla. `WHATSAPP_SIMULAR_FALLO=1` fuerza el fallo para probar los reintentos y la copia interna (ADR-006).
- **R2:** en pruebas, `compartido/archivos` usa un almacén en memoria; las URLs firmadas se comprueban por su forma y caducidad, no contra Cloudflare.
- **Sin conexión:** en Cypress, `cy.intercept` con `forceNetworkError` para la garita y la cola de cobros.

## 7. Qué prueba siempre cada tipo de HU

- Con datos de otro vecino: un vecino ajeno recibe 404 (AC-7).
- Con dinero o votos: repetir la petición con el mismo `idOperacion` no duplica (AC-5).
- Con acción crítica: queda una fila en `nucleo_auditoria` con valores previos y posteriores (AC-6).
- Con aviso: la notificación existe en la copia interna aunque WhatsApp falle (ADR-006).
- Toda pantalla nueva: un e2e en teléfono (360 × 800) en modo Normal y otro en modo Senior, ambos con 0 violaciones axe, y el recorrido completo solo con teclado en el flujo principal.
