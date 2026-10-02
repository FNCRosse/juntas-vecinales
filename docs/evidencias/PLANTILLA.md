# Evidencia de cierre · M<n> <nombre del módulo>

Copia este archivo como `docs/evidencias/M<n>.md` (o `F0b.md`) y llénalo al cerrar el módulo ([FLUJO_TRABAJO.md §4](../FLUJO_TRABAJO.md#4-cierre-de-módulo)).

- **Fecha de cierre:** <aaaa-mm-dd>
- **URL de producción:** <https://…>
- **Corrida del CI en `main` tras el último merge:** <enlace a GitHub Actions>
- **PR del módulo:** #… a #…

## 1. HU del módulo

| HU | Estado en el PLAN | PR | Notas (partes diferidas y a qué módulo) |
| --- | --- | --- | --- |
| HU-XXX-nn | `[x]` | #… | |

## 2. Cobertura de Jest (unitarias + integración)

| Ámbito | Líneas | Ramas | Funciones |
| --- | ---: | ---: | ---: |
| Global | … % | … % | … % |
| `modulos/<m>/` | … % | … % | … % |

Umbral bloqueante: líneas ≥ 80 % global.

## 3. Matriz HU → código → prueba

Extracto de `docs/evidencias/matriz-hu.md` (`npm run matriz`) para las HU del módulo:

| HU | Código (caso de uso) | Unitarias | Integración | E2E |
| --- | --- | --- | --- | --- |

## 4. Reporte axe por pantalla

| Pantalla | Modo | Tamaño | Violaciones | Reporte |
| --- | --- | --- | ---: | --- |
| VEC-XXX-nn | Normal | 360 × 800 | 0 | `pruebas/e2e/reportes/axe/…` |
| VEC-XXX-nn | Senior | 360 × 800 | 0 | |

## 5. Revisión manual de accesibilidad

Lista de [ACCESIBILIDAD.md §4](../ACCESIBILIDAD.md#4-lista-de-comprobación-por-pantalla) en el flujo principal de cada actor: teclado completo, lector de pantalla (NVDA o TalkBack), zoom 200 %, reflujo a 320 px. Anota lo encontrado y cómo se corrigió.

Criterios que requieren personas (pruebas con adultos mayores): pendientes para R3.2.

## 6. Capturas

En `docs/evidencias/capturas/M<n>/`, tomadas sobre producción con el navegador integrado: una por pantalla en teléfono (360 px) y otra en modo Senior.

| Pantalla | Teléfono | Senior |
| --- | --- | --- |
| VEC-XXX-nn | ![](capturas/M<n>/vec-xxx-nn-normal.png) | ![](capturas/M<n>/vec-xxx-nn-senior.png) |

## 7. Pendientes y decisiones

Lo diferido, lo que queda parcial (`[~]`) y cualquier decisión tomada durante el módulo que cambie un documento de `docs/`.
