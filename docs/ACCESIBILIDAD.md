# Accesibilidad

La accesibilidad es la base del sistema, no una capa final. Objetivo: **WCAG 2.2 nivel AA** en todas las pantallas, con las reglas propias del proyecto que lo superan. Valores exactos: [guía visual](guia-visual/guia-visual.md) (§6, reglas A1–A12).

## 1. Atributos de calidad que se miden

| Atributo (Anexo H) | Medida | Cómo se comprueba |
| --- | --- | --- |
| AC-1 Accesibilidad | 0 violaciones WCAG 2.2 AA detectadas por axe en el CI | `cy.checkA11y` en cada estado de cada e2e ([PRUEBAS.md](PRUEBAS.md)) |
| AC-2 Baja carga cognitiva | ≤ 3 interacciones desde el ingreso hasta **la deuda, el próximo evento y el estado de la queja**, desde una sola pantalla de inicio | Un e2e (`pruebas/e2e/identidad/ac2-interacciones.cy.ts`) cuenta clics y teclas desde `/` hasta cada dato. El panel los muestra en la primera pantalla (0 interacciones); el detalle queda a 1 toque |

## 2. Modo Senior ("Letra grande")

- Se activa con el switch de la barra superior o desde Perfil; se guarda en el servidor y se aplica al renderizar (ADR-004, [FRONTEND.md §3](FRONTEND.md#3-perfil-de-accesibilidad-al-renderizar-adr-004)).
- Con el modo activo (HU-ACC-01 CA2–CA3): cuerpo de 22 px, contraste de texto ≥ 7:1, objetivos de 56 × 56 px con 12 px de separación, íconos de 32 px, una sola columna, navegación lineal y sin adornos (`senior:hidden`).
- Se llama "Letra grande": no se etiqueta a la persona por su edad. No se activa solo por la edad (ADR-004).

## 3. Tamaños mínimos

| Qué | Normal | Senior | Regla |
| --- | --- | --- | --- |
| Texto más pequeño de la interfaz | 16 px | 20 px | Nada por debajo de 16 px |
| Texto de cuerpo | 18 px | 22 px | En `rem`, crece con el zoom hasta 200 % |
| Objetivo táctil | 48 × 48 px | 56 × 56 px | R-03; supera los 24 × 24 px de WCAG 2.5.8 |
| Separación entre objetivos | 8 px | 12 px | R-03 |
| Contraste de texto | ≥ 4.5:1 | ≥ 7:1 | `verificar-contraste.mjs` convertido en prueba de Jest |
| Contraste de ícono, borde de control y foco | ≥ 3:1 | ≥ 3:1 | WCAG 1.4.11 |
| Ancho de lectura | 720 px máx. | 720 px máx. | Escritorio centrado |

## 4. Lista de comprobación por pantalla

Va en cada PR ([plantilla](../.github/pull_request_template.md)) y en la evidencia de cierre de módulo. Tomada de la auditoría del prototipo; incluye los criterios que el prototipo no podía verificar y quedaron para el código.

**Automática (axe + ESLint + Jest):**
- [ ] 0 violaciones axe en Normal y Senior, a 360 px y a 1280 px.
- [ ] Contraste de los tokens ≥ AA (prueba de Jest de la fase 0b).
- [ ] Ninguna imagen sin alternativa (`jsx-a11y/alt-text`); lo decorativo con `alt=""` o `aria-hidden`.
- [ ] Ningún color fuera de los tokens (grep de hexadecimales) y ningún `outline-none`.

**Manual, en el navegador:**
- [ ] 1.3.1 Semántica: un `<h1>`, encabezados en orden, listas y tablas con cabecera reales.
- [ ] 2.1.1 / 2.1.2 Todo se opera con teclado y no hay trampas de foco (HU-ACC-06).
- [ ] 2.4.3 Orden de foco lógico; 2.4.7 foco visible en todo control; 2.4.11 el foco no queda tapado por barras fijas.
- [ ] 4.1.2 Nombre, función y estado de cada control (lector de pantalla en el flujo principal: NVDA o TalkBack).
- [ ] 4.1.3 Los cambios de estado se anuncian (`role="status"`).
- [ ] 1.4.4 Zoom al 200 % sin pérdida; 1.4.10 sin scroll horizontal a 320 px; 1.4.12 espaciado de texto.
- [ ] 1.4.1 Ningún estado solo con color: color + ícono + palabra.
- [ ] 1.3.3 Ninguna instrucción depende de la forma, el color o la posición ("Toque Sí, asistiré").
- [ ] 2.5.7 Nada exige arrastrar.
- [ ] 3.2.3 / 3.2.4 / 3.2.6 Misma barra, mismos íconos y palabras, "Letra grande" y "Pedir ayuda" en la misma posición.
- [ ] 3.3.1 / 3.3.2 / 3.3.3 Etiqueta visible; error junto al campo que dice cómo corregir; no se borra lo escrito.
- [ ] 3.3.4 Dinero, voto, queja y bajas piden confirmación con resumen y salida.
- [ ] 3.3.7 No se pide de nuevo un dato ya entregado; 3.3.8 entrar no exige recordar una clave ni resolver acertijos.
- [ ] Un solo botón primario; textos idénticos al prototipo, con trato de usted.
- [ ] Los avisos no desaparecen solos; se respeta `prefers-reduced-motion`.

Hallazgos abiertos de la auditoría del prototipo que se resuelven en código (fase 0b): la barra de navegación de escritorio como variante del mismo componente; el estado de foco de botones y opciones como token; los textos de apoyo de 16 px, cuyo alivio es el modo Senior accesible desde la primera pantalla.

## 5. Lenguaje llano (R-07, HU-ACC-08)

- Oraciones de 20 palabras o menos. Trato de usted. Fechas en palabras ("martes 14 de octubre").
- Los botones nombran la acción con un verbo y su objeto: "Enviar mi comprobante", no "Aceptar".
- Los mensajes dicen qué hacer después, no solo el estado.
- El término ineludible se explica la primera vez ("enlace de acceso: un mensaje que le permite entrar sin clave").
- Palabras excluidas y su reemplazo:

| No usar | Usar |
| --- | --- |
| link, token, login, password | enlace, entrar, clave |
| click, clic | toque, toque aquí |
| moroso, deudor | con retraso, tiene pagos pendientes |
| sincronizar, pendiente de sincronización | enviar lo pendiente, pendiente de enviar |
| inválido, error de validación | lo que falta y cómo corregirlo |
| sesión expirada | por su seguridad, vuelva a entrar |
| usuario (para la persona) | usted, vecino o vecina |

## 6. Reparto de las 10 HU de M6

Las tablas completas están en [`modulos/accesibilidad/CLAUDE.md`](../modulos/accesibilidad/CLAUDE.md). Cada HU se cierra una sola vez, en la fase indicada; las RNF se verifican desde entonces en todas las pantallas nuevas.

| Fase | HU | Por qué ahí |
| --- | --- | --- |
| 0b (base) | HU-ACC-03, HU-ACC-05, HU-ACC-06, HU-ACC-08, HU-ACC-09 | Confirmación, auditoría axe, teclado, lenguaje y área táctil son propiedades de los componentes base y del CI |
| M1 | HU-ACC-01, HU-ACC-04 | Necesitan `Usuario`: el perfil guardado en la cuenta y el pedido de ayuda con nombre y pantalla |
| M2 | HU-ACC-02 | El feed de comunicados nace en M2 |
| M3 | HU-ACC-07, HU-ACC-10 | El mapa nace en M3 (la alternativa textual del resto de imágenes ya la exige la 0b); Incidentes es la primera sección principal con tutorial, que M4 y M5 completan con Asambleas y Mi cuota |
