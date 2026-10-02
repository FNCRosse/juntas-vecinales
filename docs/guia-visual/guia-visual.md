# Guía visual · Plataforma Junta Vecinal

**Resultado:** R2.3 · **Versión:** 1.0 · **Fecha:** 24 de setiembre de 2026
**Fuente única de verdad:** `tokens.json`. `tokens.css` se genera con `node generar-css.mjs` y se valida con `node verificar-contraste.mjs`. Si un valor no está en `tokens.json`, no existe.

**Personalidad:** cercana, cálida y comunitaria, como una app del barrio, sin perder la confianza. La calidez la ponen el fondo crema, la terracota decorativa y las ilustraciones. La confianza la ponen el verde petróleo, la tipografía legible y los estados explícitos. Solo hay tema claro.

---

## 0. Cómo se usa

### 0.1 Regla de nombres (idéntica en los cuatro lugares)

| JSON (`tokens.json`) | CSS (`tokens.css`) | Tailwind | Figma (Variable / Text Style) |
| --- | --- | --- | --- |
| `color.texto.principal` | `--color-texto-principal` | `text-texto-principal`, `bg-…`, `border-…` | `color/texto/principal` |
| `text.base` | `--text-base` | `text-base` | `text/base` |
| `spacing.control` | `--spacing-control` | `h-control`, `min-w-control`, `p-control` | `spacing/control` |
| `radius.tarjeta` | `--radius-tarjeta` | `rounded-tarjeta` | `radius/tarjeta` |

Los puntos del JSON se vuelven guiones en CSS y barras en Figma. Los grupos raíz (`color`, `text`, `spacing`, `radius`, `shadow`, `font`, `font-weight`, `leading`) usan los nombres que exige Tailwind v4, y todo lo demás está en español. → Nombre único en JSON, CSS, Tailwind y Figma (requisito de la guía)

### 0.2 Primitivos y semánticos

- **Primitivos** (`color.paleta.*`): paleta cruda. Van en la colección de Figma **Primitivos**, no generan clases de Tailwind y no se usan en componentes. → Obliga a pasar por un token con significado y facilita auditar el contraste.
- **Semánticos** (todo lo demás): van en la colección de Figma **Semánticos**, con los modos **Normal** y **Senior**. Son los únicos que usan componentes y pantallas.

### 0.3 Modo senior

- Se activa con `<html data-mode="senior">`. Todas las variables cambian en cascada, sin recompilar. → HU-ACC-01 CA1 (selector permanente y persistente)
- El servidor pinta el atributo según la preferencia guardada en la cuenta (`<html lang="es" data-mode={modoSenior ? "senior" : undefined}>`), y el switch lo cambia en el cliente con `document.documentElement.dataset.mode = "senior"`. → HU-ACC-01 CA1 (persistencia en la cuenta)
- La variante `senior:` de Tailwind sirve para los cambios que no son un token, por ejemplo `senior:hidden` en adornos o `senior:p-6`. → HU-ACC-01 CA3 (ocultar decorativos)

### 0.4 Instalación en Next.js (App Router, Tailwind v4)

El repositorio todavía no tiene `package.json`, así que se asume **Tailwind v4**, que es lo que instala hoy `create-next-app`. La integración se probó con tailwindcss 4.3.3.

```css
/* app/globals.css */
@import "tailwindcss";
@import "./tokens.css";          /* copia de guia-visual/tokens.css */

body {
  @apply bg-fondo-pagina text-texto-principal text-base leading-texto font-regular;
  font-family: var(--font-texto);
}
h1, h2, h3 { @apply font-bold leading-titulo; }
a { @apply text-texto-enlace underline underline-offset-4; }

/* Foco visible único para toda la app → WCAG 2.4.7, HU-ACC-06 */
:focus-visible {
  outline: var(--foco-ancho) solid var(--color-foco-anillo);
  outline-offset: var(--foco-offset);
}
svg.lucide { stroke-width: var(--icono-trazo); }
```

```tsx
// app/layout.tsx: Atkinson Hyperlegible con next/font, publicada con el mismo nombre de variable
import { Atkinson_Hyperlegible } from "next/font/google";
const atkinson = Atkinson_Hyperlegible({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-texto", display: "swap" });
// <html lang="es" data-mode={...}><body className={atkinson.variable}>…
```

`@theme inline reference` hace que Tailwind lea las variables de `:root` sin volver a declararlas. Además, `--color-*: initial` borra la paleta por defecto de Tailwind: una clase como `bg-red-500` no genera CSS. → Nadie puede usar un color que no esté en la guía

---

## 1. Color

### 1.1 Paleta primitiva

| Rampa | Pasos (hex) | Carácter |
| --- | --- | --- |
| `arena` | 0 #FFFFFF · 50 #FBF7F1 · 100 #F3ECE2 · 200 #E6DCCD · 300 #CDBFAB · 400 #A89886 · 500 #857563 · 600 #66594A · 700 #4F4438 · 800 #3A3129 · 900 #231D18 | Neutros cálidos: dan la sensación de casa y no de oficina |
| `verde` (petróleo) | 50 #E7F3F1 · 100 #C8E5E0 · 200 #93CBC2 · 500 #2A8C80 · 600 #137166 · 700 #0D5C53 · 800 #0A4A43 · 900 #07352F · 950 #042520 | Marca y acción: sereno y de confianza |
| `terracota` | 50 #FCEFE9 · 100 #F7D8CA · 300 #E59A78 · 500 #C8623A · 700 #9B4424 | Calidez de barrio (ladrillo). Solo decoración e ilustración |
| `rojo` | 50 #FDEDEB · 700 #A8231A · 800 #861B14 · 900 #6A150F | Error y peligro |
| `ambar` | 50 #FFF5DC · 400 #F2B53A · 700 #85560A · 800 #6A4406 · 900 #553604 | Aviso |
| `hoja` | 50 #EAF5EC · 700 #1F6B35 · 800 #185429 | Éxito, distinto del verde petróleo |
| `azul` | 50 #EAF1FB · 700 #1F58A6 · 800 #184581 | Información y anillo de foco |

- Acción en verde petróleo y no en azul → el azul se reserva para el foco, así nunca se confunde con un botón.
- Terracota solo decorativa → comparte tono con el rojo de error y no debe competir con él. Todo estado lleva además ícono y texto (WCAG 1.4.1).

### 1.2 Tokens semánticos (Normal → Senior)

| Token | Normal | Senior | Uso |
| --- | --- | --- | --- |
| `color/texto/principal` | #231D18 | #231D18 | Cuerpo y títulos |
| `color/texto/secundario` | #4F4438 | #3A3129 | Apoyo, ayudas de campo |
| `color/texto/enlace` | #0D5C53 | #0A4A43 | Enlaces, siempre subrayados |
| `color/texto/exito` | #1F6B35 | #185429 | Mensaje de éxito |
| `color/texto/error` | #A8231A | #861B14 | Mensaje de error |
| `color/texto/aviso` | #6A4406 | #553604 | Mensaje de aviso |
| `color/texto/info` | #1F58A6 | #184581 | Mensaje informativo |
| `color/texto/deshabilitado` | #66594A | #4F4438 | Control no disponible (se sigue leyendo) |
| `color/texto/invertido` | #FFFFFF | #FFFFFF | Sobre botón primario o de peligro |
| `color/fondo/pagina` | #FBF7F1 | #FFFFFF | Fondo de pantalla. En senior pasa a blanco puro para maximizar el contraste |
| `color/fondo/superficie` | #FFFFFF | #FFFFFF | Tarjetas, campos, diálogos |
| `color/fondo/suave` | #F3ECE2 | #F3ECE2 | Zonas secundarias, filas alternas |
| `color/fondo/destacado` | #FCEFE9 | #FCEFE9 | Anuncio o bienvenida de la junta |
| `color/fondo/exito` · `error` · `aviso` · `info` | #EAF5EC · #FDEDEB · #FFF5DC · #EAF1FB | igual | Fondo de alertas y badges |
| `color/fondo/deshabilitado` | #E6DCCD | #F3ECE2 | Control no disponible |
| `color/borde/sutil` | #E6DCCD | #A89886 | Separadores decorativos (nunca delimita un control) |
| `color/borde/control` | #66594A | #3A3129 | Borde de campos, checkbox, radio, switch |
| `color/borde/fuerte` | #3A3129 | #231D18 | Hover de campos, tarjeta seleccionada |
| `color/borde/exito` · `error` · `aviso` · `info` | #1F6B35 · #A8231A · #85560A · #1F58A6 | igual | Borde de alertas, badges y campo con error |
| `color/accion/primaria` | #0D5C53 | #0A4A43 | Botón primario; texto y borde del secundario |
| `color/accion/primaria-hover` · `-presionada` | #0A4A43 · #07352F | #07352F · #042520 | Estados del primario |
| `color/accion/secundaria-hover` · `-presionada` | #E7F3F1 · #C8E5E0 | igual | Relleno del secundario al interactuar |
| `color/accion/peligro` · `-hover` · `-presionada` | #A8231A · #861B14 · #6A150F | #861B14 · #6A150F · #6A150F | Botón de peligro |
| `color/accion/deshabilitada` | #E6DCCD | #F3ECE2 | Botón no disponible |
| `color/foco/anillo` | #1F58A6 | #184581 | Contorno de foco |
| `color/decoracion/calido` · `suave` | #C8623A · #F7D8CA | igual | Solo ilustraciones. Se ocultan en senior |

### 1.3 Contraste de texto sobre fondo

Mínimo exigido: 4.5:1 en Normal (WCAG 1.4.3) y 7:1 en Senior (meta de HU-ACC-01 CA2: "maximiza contrastes"). El script revisa **las 114 combinaciones de cada modo**. Todos los textos se combinan con todos los fondos, y la tabla muestra las que se usan en la práctica.

| Texto | Fondo | Normal | Senior |
| --- | --- | --- | --- |
| texto/principal | fondo/pagina | #231D18 / #FBF7F1 **15.6:1** | #231D18 / #FFFFFF **16.7:1** |
| texto/principal | fondo/suave | #231D18 / #F3ECE2 **14.2:1** | **14.2:1** |
| texto/principal | fondo/destacado | #231D18 / #FCEFE9 **14.8:1** | **14.8:1** |
| texto/secundario | fondo/pagina | #4F4438 / #FBF7F1 **8.9:1** | #3A3129 / #FFFFFF **12.7:1** |
| texto/secundario | fondo/suave | #4F4438 / #F3ECE2 **8.1:1** | #3A3129 / #F3ECE2 **10.8:1** |
| texto/enlace | fondo/pagina | #0D5C53 / #FBF7F1 **7.4:1** | #0A4A43 / #FFFFFF **10.1:1** |
| texto/enlace | fondo/suave | #0D5C53 / #F3ECE2 **6.7:1** | #0A4A43 / #F3ECE2 **8.6:1** |
| texto/deshabilitado | fondo/deshabilitado | #66594A / #E6DCCD **5.0:1** | #4F4438 / #F3ECE2 **8.1:1** |
| texto/exito | fondo/exito | #1F6B35 / #EAF5EC **5.8:1** | #185429 / #EAF5EC **8.0:1** |
| texto/error | fondo/error | #A8231A / #FDEDEB **6.3:1** | #861B14 / #FDEDEB **8.5:1** |
| texto/aviso | fondo/aviso | #6A4406 / #FFF5DC **7.9:1** | #553604 / #FFF5DC **10.1:1** |
| texto/info | fondo/info | #1F58A6 / #EAF1FB **6.1:1** | #184581 / #EAF1FB **8.4:1** |
| texto/invertido | accion/primaria | #FFFFFF / #0D5C53 **7.9:1** | #FFFFFF / #0A4A43 **10.1:1** |
| texto/invertido | accion/primaria-presionada | #FFFFFF / #07352F **13.5:1** | #FFFFFF / #042520 **16.3:1** |
| texto/invertido | accion/peligro | #FFFFFF / #A8231A **7.2:1** | #FFFFFF / #861B14 **9.6:1** |
| accion/primaria (texto del secundario) | fondo/superficie | #0D5C53 / #FFFFFF **7.9:1** | #0A4A43 / #FFFFFF **10.1:1** |
| accion/primaria (texto del secundario) | accion/secundaria-presionada | #0D5C53 / #C8E5E0 **5.9:1** | #0A4A43 / #C8E5E0 **7.6:1** |

Peor caso de texto: **4.82:1** en Normal (texto/exito sobre fondo/deshabilitado, que no se usa pero igual se valida) y **7.59:1** en Senior.

### 1.4 Contraste de componentes de interfaz (mínimo 3:1, WCAG 1.4.11)

| Elemento | Sobre fondo/pagina (Normal · Senior) | Sobre fondo/superficie (Normal · Senior) |
| --- | --- | --- |
| borde/control | 6.4 · 12.7 | 6.8 · 12.7 |
| borde/error | 6.7 · 7.2 | 7.2 · 7.2 |
| borde/aviso (el más bajo) | 5.9 · 6.3 | 6.3 · 6.3 |
| foco/anillo | 6.5 · 9.5 | 7.0 · 9.5 |
| accion/primaria | 7.4 · 10.1 | 7.9 · 10.1 |
| accion/peligro | 6.7 · 9.6 | 7.2 · 9.6 |

`borde/sutil` (1.4:1) queda fuera a propósito: solo separa bloques y nunca es el único límite de un control. → WCAG 1.4.11 solo aplica a lo necesario para identificar un componente.

---

## 2. Tipografía

**Familia única: Atkinson Hyperlegible** (Google Fonts, pesos 400 y 700 con itálica). → Decisión D11 del alcance R2.3, diseñada para baja visión.
- Tiene soporte completo para español (á é í ó ú ü ñ Ñ ¿ ¡ « ») y distingue bien I/l/1 y O/0, lo que ayuda a leer DNI, placas y montos. → P4 del Anexo K, lenguaje llano y reconocible
- Una sola familia para títulos, cuerpo y cifras → menos carga visual (Zhou, Ye y Lu, 2022: simplicidad y jerarquía clara)
- Solo dos pesos: `font-regular` 400 y `font-bold` 700. Nunca light ni thin. → El bajo contraste dificulta la lectura a adultos mayores (estudio de telemedicina con adultos mayores, estado del arte)
- Nada de texto en mayúsculas sostenidas ni en itálica para párrafos, y alineación siempre a la izquierda. → Legibilidad para adultos mayores, WCAG 1.4.8 como buena práctica

### 2.1 Escala

| Token / Text Style | Normal | Senior | Interlineado | Peso | Uso | Clase Tailwind |
| --- | --- | --- | --- | --- | --- | --- |
| `text/pequeno` | 16 px (1rem) | 20 px | `leading/texto` 1.5 | 400 | Ayuda de campo, etiqueta de la barra de navegación, badge. **Nunca menor** | `text-pequeno` |
| `text/base` | 18 px | 22 px | 1.5 | 400 / 700 | Cuerpo, campos, etiquetas | `text-base` |
| `text/grande` | 20 px | 24 px | 1.5 | 700 | Texto de botones, entradilla | `text-grande` |
| `text/titulo-3` | 22 px | 26 px | `leading/titulo` 1.25 | 700 | Título de tarjeta | `text-titulo-3` |
| `text/titulo-2` | 26 px | 30 px | 1.25 | 700 | Título de sección | `text-titulo-2` |
| `text/titulo-1` | 32 px | 36 px | 1.25 | 700 | Título de pantalla (uno por pantalla) | `text-titulo-1` |
| `text/dato` | 36 px | 44 px | 1.25 | 700 | Cifra clave: deuda, fecha de asamblea | `text-dato` |

- Cuerpo de 18 px en Normal y 22 px en Senior → §9 del alcance R2.3 y HU-ACC-01 CA2. Cumple el criterio de 18 px o más en Senior.
- Mínimo absoluto de 16 px → ningún texto de la interfaz es "letra chica".
- Tamaños en `rem` en el CSS → el texto crece con el zoom del navegador hasta el 200 % (WCAG 1.4.4, HU-ACC-05 CA1).
- Interlineado de 1.5 en el cuerpo y espacio entre párrafos de al menos 1 em (`space-y-4`) → WCAG 1.4.12.
- Largo de línea: máximo 720 px de contenido (`max-w-180`) → §9 del alcance R2.3 (escritorio centrado a 720 px).

En Figma, cada Text Style tiene el tamaño enlazado a la variable `text/*` y el interlineado a `leading/*`. Al cambiar el frame al modo Senior, el texto crece solo.

---

## 3. Íconos

**Librería: Lucide** (`lucide-react` en el código y el plugin "Lucide Icons" o su archivo de la comunidad en Figma, licencia ISC).
- Todos los íconos están dibujados con trazo sobre una rejilla de 24 px y el grosor se puede ajustar, así que en Senior se engrosa sin cambiar de librería. → HU-ACC-01 CA2
- En React cada ícono es un componente importable por separado, sin fuentes de íconos. → Si la fuente no carga, no aparecen "cuadritos" (HU-ACC-07: "si las imágenes no cargan")
- El mismo nombre de ícono sirve en Figma y en el código (`HandCoins` ↔ `hand-coins`). → El diseñador y el desarrollador no tienen que traducir nada.

| Token | Normal | Senior | Uso | Clase |
| --- | --- | --- | --- | --- |
| `spacing/icono` | 24 px | 32 px | Íconos de botón, navegación, alertas | `size-icono` |
| `spacing/icono-pequeno` | 20 px | 24 px | Dentro de badge o texto pequeño | `size-icono-pequeno` |
| `icono/trazo` | 2 | 2.5 | `stroke-width` (regla global `svg.lucide` o prop `strokeWidth`) | `[stroke-width:var(--icono-trazo)]` |

- Íconos más grandes en Senior → en el estado del arte, los usuarios pidieron mejorar el tamaño de los íconos (Azzahra et al., 2025).
- El color del ícono es el mismo token que su texto (`currentColor`) → hereda un contraste de 4.5:1 o más, por encima del 3:1 exigido (WCAG 1.4.11).

**¿Cuándo va con texto?** **Siempre**, con la etiqueta visible al lado o debajo. La única excepción es el botón **Cerrar (X)** de diálogos y avisos, que lleva `aria-label="Cerrar"`, y en Senior también muestra la palabra "Cerrar". → Un ícono solo exige memoria (Anexo K, P4); HU-ACC-08.

**Regla de texto alternativo** → HU-ACC-07
1. Si el ícono va junto a su texto, es decorativo: `aria-hidden="true"`, porque el texto ya lo dice (lucide-react lo pone por defecto; verificar en la versión instalada). → HU-ACC-07 CA3
2. Si el ícono va solo (la X), el botón lleva `aria-label` con el verbo: "Cerrar aviso". → HU-ACC-07 CA1, WCAG 4.1.2
3. Si un ícono transmite un estado, ese estado también aparece en texto: "Al día", "Debe S/ 12.50". → WCAG 1.4.1, HU-ACC-05 CA2
4. En Figma, la capa de cada instancia de ícono se nombra con su texto alternativo o con "decorativo". → La matriz de trazabilidad puede comprobarlo

**Íconos canónicos** (siempre el mismo ícono para el mismo concepto): Inicio `House` · Mi cuota `Wallet` · Pagos/recibo `Receipt` · Asambleas `CalendarDays` · Incidentes `MapPin` · Transparencia `FileText` · Avisos `Bell` · Perfil `CircleUser` · Ayuda humana `LifeBuoy` · Escuchar (voz) `Volume2`, `Pause`, `Square` · Letra grande `AArrowUp` · Éxito `CircleCheck` · Error `CircleX` · Aviso `TriangleAlert` · Info `Info` · Cerrar `X` · Desplegar `ChevronDown`. → WCAG 3.2.4 (identificación coherente)

---

## 4. Espaciado, radios y sombras

### 4.1 Espaciado

| Token | Valor | Clase | Uso |
| --- | --- | --- | --- |
| `spacing/1` | 4 px | `gap-1`, `p-1` | Ícono ↔ texto dentro de un badge |
| `spacing/2` | 8 px | `gap-2` | Ícono ↔ texto en un botón |
| `spacing/3` | 12 px | `gap-3` | Etiqueta ↔ campo ↔ ayuda |
| `spacing/4` | 16 px | `p-4`, `px-4` | Relleno de tarjeta y de campo; margen lateral en el teléfono de 360 px |
| `spacing/6` | 24 px | `p-6`, `px-6` | Relleno horizontal de botón; relleno de tarjeta en Senior (`senior:p-6`) |
| `spacing/8` | 32 px | `gap-8` | Entre secciones |
| `spacing/12` | 48 px | `py-12` | Separación de la zona de peligro |
| `spacing/16` | 64 px | `pt-16` | Respiro superior de estados vacíos |

| Token semántico | Normal | Senior | Clase | Uso |
| --- | --- | --- | --- | --- |
| `spacing/tactil` | 48 px | 56 px | `min-h-tactil min-w-tactil` | Lado mínimo de todo objetivo táctil → HU-ACC-09 CA1 (48 px incluso en Normal), HU-ACC-01 CA2 |
| `spacing/control` | 48 px | 56 px | `h-control` | Alto de botón, campo y select |
| `spacing/separacion` | 8 px | 12 px | `gap-separacion` | Espacio mínimo entre controles contiguos → HU-ACC-09 CA2; §9 del alcance |

- Las acciones destructivas van separadas al menos por `spacing/12` (48 px) o en otra tarjeta. → HU-ACC-09 CA3

### 4.2 Radios

| Token | Valor | Clase | Uso |
| --- | --- | --- | --- |
| `radius/control` | 12 px | `rounded-control` | Botones, campos, alertas |
| `radius/tarjeta` | 16 px | `rounded-tarjeta` | Tarjetas, diálogos |
| `radius/pastilla` | 9999 px | `rounded-pastilla` | Badges, switch |

Radios generosos → un tono amable y cercano, sin llegar a lo infantil (personalidad de la guía).

### 4.3 Sombras

| Token | Valor | Clase | Uso |
| --- | --- | --- | --- |
| `shadow/tarjeta` | 0 1px 2px #231D1814, 0 2px 8px #231D180F | `shadow-tarjeta` | Tarjetas, siempre junto a `border-borde-sutil` |
| `shadow/elevada` | 0 8px 24px #231D1829 | `shadow-elevada` | Diálogos y avisos emergentes |

La sombra nunca es el único límite de un elemento → a una persona con baja visión la sombra no le sirve para ubicar el borde (WCAG 1.4.11).

---

## 5. Componentes base

Estados comunes a todos:
- **Focus** (teclado): contorno de 3 px en Normal y 4 px en Senior, color `foco/anillo`, separado 2 px, con la regla global `:focus-visible`. Nunca `outline-none`. → WCAG 2.4.7, HU-ACC-06
- **Hover**: solo refuerza, nunca revela información nueva. → En el teléfono no hay hover (WCAG 1.4.13)
- **Disabled**: se evita. Es mejor dejar el control activo y explicar qué falta al pulsarlo. Si es inevitable, el texto se sigue leyendo (5:1 o más), el borde es discontinuo y el control lleva `aria-disabled="true"` con la razón escrita al lado. → HU-ACC-03 (retroalimentación no punitiva), HU-ACC-08 CA2

### 5.1 Botón

| | Normal | Senior |
| --- | --- | --- |
| Alto | 48 px (`h-control`) | 56 px |
| Ancho mínimo | 48 px (`min-w-tactil`); primario a todo el ancho en el teléfono (`w-full`) | 56 px |
| Relleno horizontal | 24 px (`px-6`) | 24 px |
| Texto | 20 px bold (`text-grande font-bold`) | 24 px bold |
| Ícono | 24 px, a la izquierda del texto, `gap-2` | 32 px |
| Radio | 12 px (`rounded-control`) | 12 px |

Clases base: `inline-flex items-center justify-center gap-2 h-control min-w-tactil px-6 rounded-control text-grande font-bold`

| Estado | Primario | Secundario | Peligro |
| --- | --- | --- | --- |
| Default | `bg-accion-primaria text-texto-invertido` | `bg-fondo-superficie text-accion-primaria border-(length:--borde-ancho-control) border-accion-primaria` | `bg-accion-peligro text-texto-invertido` + ícono `TriangleAlert` |
| Hover | `hover:bg-accion-primaria-hover` | `hover:bg-accion-secundaria-hover` | `hover:bg-accion-peligro-hover` |
| Focus | anillo global | anillo global | anillo global |
| Pressed | `active:bg-accion-primaria-presionada` | `active:bg-accion-secundaria-presionada` | `active:bg-accion-peligro-presionada` |
| Disabled | `aria-disabled:bg-accion-deshabilitada aria-disabled:text-texto-deshabilitado aria-disabled:border-(length:--borde-ancho-control) aria-disabled:border-dashed aria-disabled:border-borde-control` | igual | igual |
| Error | No aplica: el error se muestra en el campo o en una alerta | — | — |
| Cargando | Texto "Enviando…", `aria-busy="true"`, sin girar solo el ícono | — | — |

- Un solo botón primario por pantalla, abajo. → D6 del alcance R2.3, §9 (acción primaria)
- El texto del botón es un verbo con su objeto: "Pagar mi cuota", nunca "Aceptar" ni "OK". → HU-ACC-08 CA1
- El botón de peligro siempre abre una confirmación en lenguaje llano con "Cancelar" visible. → HU-ACC-03 CA1 y CA3, WCAG 3.3.4
- Primario en verde petróleo y peligro en rojo, y además el de peligro lleva ícono. → No depender solo del color (WCAG 1.4.1)

### 5.2 Campo de texto (input)

| | Normal | Senior |
| --- | --- | --- |
| Alto | 48 px (`h-control`) | 56 px |
| Texto | 18 px (`text-base`) | 22 px |
| Etiqueta | Arriba, siempre visible, `text-base font-bold`, separada 12 px (`gap-3`) | 22 px |
| Ayuda | Debajo, `text-pequeno text-texto-secundario` | 20 px |
| Borde | 2 px `border-borde-control` | 2 px, color más oscuro (automático) |

Clases del campo: `h-control w-full px-4 rounded-control bg-fondo-superficie text-base text-texto-principal border-(length:--borde-ancho-control) border-borde-control`

| Estado | Clases / comportamiento |
| --- | --- |
| Default | como arriba |
| Hover | `hover:border-borde-fuerte` |
| Focus | anillo global (además del borde) |
| Pressed | No aplica |
| Disabled | `disabled:bg-fondo-deshabilitado disabled:text-texto-deshabilitado disabled:border-dashed` + motivo escrito debajo |
| Error | `aria-invalid:border-borde-error` + mensaje debajo con `CircleX` en `text-texto-error`, enlazado con `aria-describedby`. Dice qué pasó y cómo corregirlo, sin culpar: "Falta el número de DNI. Escríbalo con sus 8 números" |

- La etiqueta nunca es el placeholder → el placeholder desaparece al escribir y exige memoria (WCAG 3.3.2, HU-ACC-08).
- El mensaje de error va junto al campo y orienta a la acción → §9 del alcance, WCAG 3.3.1 y 3.3.3, HU-ACC-03 CA2.
- `autocomplete` y `inputmode` correctos (DNI: `inputmode="numeric"`) → WCAG 1.3.5 y 3.3.7.

### 5.3 Select

Es el `<select>` nativo con el mismo aspecto que el campo: `appearance-none` más el ícono `ChevronDown` (`size-icono`, `pointer-events-none`) a la derecha, con relleno derecho de 48 px (`pr-12`). Los estados son los del campo de texto.
- Se usa el control nativo y no un desplegable hecho a mano → teclado, lector de pantalla y selector del sistema en el teléfono funcionan de fábrica (HU-ACC-06).
- Con 5 opciones o menos se usan radios, no un select → así todas las opciones se ven sin abrir nada (Anexo K, P1; HU-ACC-08).

### 5.4 Checkbox y radio

| | Normal | Senior |
| --- | --- | --- |
| Caja o círculo visible | 24 px (`size-icono`) | 32 px |
| Área táctil | Toda la fila etiqueta + control, alto mínimo de 48 px (`min-h-tactil`) | 56 px |
| Etiqueta | `text-base`, a la derecha, `gap-3` | 22 px |
| Entre opciones | `gap-separacion` (8 px) | 12 px |

Estructura: `<label class="flex items-center gap-3 min-h-tactil"> <input type="checkbox" class="size-icono accent-accion-primaria"> Texto </label>`

| Estado | Comportamiento |
| --- | --- |
| Default | control nativo con `accent-accion-primaria` |
| Hover | la fila cambia a `hover:bg-fondo-suave rounded-control` |
| Focus | anillo global sobre el control |
| Pressed / marcado | marca ✓ o punto visible, no solo el color |
| Disabled | `disabled:` más el texto en `text-texto-deshabilitado` y el motivo |
| Error | `<fieldset>` con borde `border-borde-error`, `<legend>` y mensaje con `CircleX` |

- Controles nativos con `accent-color` → la marca y el foco siguen al sistema operativo y funcionan con lector de pantalla (HU-ACC-06).
- Toda la fila es pulsable → 48 px o más aunque la caja mida 24 (HU-ACC-09 CA1).

### 5.5 Tarjeta (card)

| | Normal | Senior |
| --- | --- | --- |
| Relleno | 16 px (`p-4`) | 24 px (`senior:p-6`) |
| Radio / borde / sombra | `rounded-tarjeta border border-borde-sutil shadow-tarjeta` | el borde se oscurece solo |
| Título | `text-titulo-3 font-bold` | 26 px |
| Dato clave | `text-dato font-bold` | 44 px |

Clases: `bg-fondo-superficie rounded-tarjeta border border-borde-sutil shadow-tarjeta p-4 senior:p-6 flex flex-col gap-3`

| Estado (tarjeta pulsable, que es un `<a>` completo) | Clases |
| --- | --- |
| Hover | `hover:border-borde-fuerte` |
| Focus | anillo global en toda la tarjeta |
| Pressed | `active:bg-fondo-suave` |
| Disabled | No aplica |
| Error / estado | la tarjeta de dato lleva un badge de estado arriba; nunca se pinta toda la tarjeta de rojo |

- Una tarjeta pulsable es un solo enlace con un solo destino → no hay objetivos anidados (HU-ACC-09).
- Estado de deuda con texto no punitivo: "Debe S/ 12.50. Puede pagar cuando pueda", nunca "moroso". → Anexo M, ficha P-M1-07; HU-ACC-03

### 5.6 Badge (estado)

| | Normal | Senior |
| --- | --- | --- |
| Texto | 16 px bold (`text-pequeno font-bold`) | 20 px |
| Ícono | 20 px (`size-icono-pequeno`) | 24 px |
| Relleno | `px-3 py-1`, `gap-1` | igual |

Clases: `inline-flex items-center gap-1 px-3 py-1 rounded-pastilla border text-pequeno font-bold`, más la variante:

| Variante | Clases | Ícono | Texto de ejemplo |
| --- | --- | --- | --- |
| Éxito | `bg-fondo-exito text-texto-exito border-borde-exito` | `CircleCheck` | Al día |
| Aviso | `bg-fondo-aviso text-texto-aviso border-borde-aviso` | `TriangleAlert` | En revisión |
| Error | `bg-fondo-error text-texto-error border-borde-error` | `CircleX` | Debe S/ 12.50 |
| Info | `bg-fondo-info text-texto-info border-borde-info` | `Info` | Nuevo |

El badge no es interactivo: no tiene hover, focus, pressed ni disabled. Si algo se puede pulsar, es un botón. → Color + ícono + palabra siempre (WCAG 1.4.1, §9 del alcance, "Estados")

### 5.7 Alerta y aviso emergente (toast)

| | Normal | Senior |
| --- | --- | --- |
| Relleno | 16 px (`p-4`) | 24 px (`senior:p-6`) |
| Ícono | 24 px arriba a la izquierda | 32 px |
| Título / texto | `text-base font-bold` / `text-base` | 22 px |
| Borde | 2 px del color del estado, `rounded-control` | igual |

Alerta en la página: `flex gap-3 p-4 rounded-control border-(length:--borde-ancho-control) bg-fondo-{estado} border-borde-{estado} text-texto-principal`, con el ícono en `text-texto-{estado}`.
Toast: lo mismo más `shadow-elevada fixed inset-x-4 bottom-24` (queda encima de la barra de navegación inferior) y un botón Cerrar de 48 × 48.

| Estado | Comportamiento |
| --- | --- |
| Default | `role="status"` (éxito, info, aviso) o `role="alert"` (error) |
| Hover / Pressed | Solo el botón Cerrar y la acción interna los tienen |
| Focus | El foco no salta al toast; la acción interna es alcanzable por teclado |
| Disabled | No aplica |
| Error | Variante error: dice qué pasó, qué hacer y ofrece una acción ("Volver a intentar") |

- **El toast no desaparece solo**: se queda hasta que la persona lo cierra. → WCAG 2.2.1 (tiempo suficiente); HU-ACC-03
- Después de una acción crítica, el éxito se confirma con una alerta en la página y no solo con un toast → la confirmación tiene que ser un comprobante reconocible (Anexo K, P6).

### 5.8 Switch del modo senior ("Letra grande")

| | Normal | Senior |
| --- | --- | --- |
| Fila pulsable | alto mínimo de 48 px (`min-h-tactil`), etiqueta + switch + estado | 56 px |
| Riel | 56 × 32 px (`w-14 h-8`) | 72 × 40 px (`senior:w-18 senior:h-10`) |
| Perilla | 24 px (`size-6`) | 32 px (`senior:size-8`) |
| Texto | "Letra grande" `text-base font-bold` + estado "Sí"/"No" | 22 px |

Marcado: `<button role="switch" aria-checked="false" class="flex items-center gap-3 min-h-tactil">` con el ícono `AArrowUp`, el texto "Letra grande", el riel y la palabra de estado.

| Estado | Riel / perilla |
| --- | --- |
| Apagado | `bg-fondo-superficie border-(length:--borde-ancho-control) border-borde-control`; perilla `bg-borde-control` a la izquierda; texto "No" |
| Encendido | `bg-accion-primaria`; perilla `bg-fondo-superficie` a la derecha con el ícono `Check`; texto "Sí" |
| Hover | riel `hover:border-borde-fuerte` (apagado) o `hover:bg-accion-primaria-hover` (encendido) |
| Focus | anillo global alrededor de toda la fila |
| Pressed | `active:bg-accion-primaria-presionada` |
| Disabled | No se deshabilita nunca |
| Error | Si no se pudo guardar en la cuenta: el modo se aplica igual en el dispositivo y aparece la alerta de aviso "No pudimos guardar su preferencia. Se mantendrá en este teléfono" |

- Está siempre en la barra superior y también en Perfil. → HU-ACC-01 CA1, WCAG 3.2.6 (misma posición)
- El estado se dice con palabra ("Sí"/"No") y con la posición, no solo con el color. → WCAG 1.4.1
- Se llama "Letra grande" y no "Modo accesible senior" → es lenguaje llano, sin etiquetar a la persona por su edad (HU-ACC-08; así ya se usa en el prototipo de Figma).

---

## 6. Reglas de accesibilidad aplicadas (verificables)

| # | Regla | Cómo se verifica | Origen |
| --- | --- | --- | --- |
| A1 | Todo texto ≥ 4.5:1 en Normal y ≥ 7:1 en Senior; ícono, borde de control y foco ≥ 3:1 | `node verificar-contraste.mjs` sale con código 0; en Figma, plugin de contraste en los dos modos | WCAG 1.4.3, 1.4.11; HU-ACC-01 CA2; HU-ACC-05 CA1 |
| A2 | Solo se usan colores semánticos; ningún hex suelto en el código ni en Figma | En el código, `grep -rE "#[0-9a-fA-F]{6}\|bg-\[#" src/` devuelve 0; en Figma, la opción "Selection colors" no muestra valores sin enlazar | Guía (fuente única) |
| A3 | El foco es visible en todo elemento interactivo y nunca queda tapado por barras fijas | Recorrido con Tab en cada pantalla; `grep -r "outline-none"` devuelve 0; `scroll-padding` igual al alto de la barra | WCAG 2.4.7, 2.4.11; HU-ACC-06 CA1 y CA3 |
| A4 | Todo objetivo táctil mide ≥ 48 × 48 px (≥ 56 en Senior) y hay ≥ 8 px (≥ 12 en Senior) entre objetivos | En Figma, medir la capa pulsable; en el navegador, auditoría de Lighthouse "Touch targets" | HU-ACC-09 CA1 y CA2; HU-ACC-01 CA2 |
| A5 | Ningún estado depende solo del color: siempre color + ícono + palabra | Revisar la pantalla en escala de grises: el estado se sigue entendiendo | WCAG 1.4.1; HU-ACC-05 CA2 |
| A6 | Todo ícono informativo e imagen tiene texto alternativo; lo decorativo lleva `alt=""` o `aria-hidden`; el mapa tiene una vista de lista | axe sin errores "image-alt" ni "svg-img-alt"; en Figma, capas nombradas | WCAG 1.1.1; HU-ACC-07 CA1 a CA3 |
| A7 | Texto base ≥ 18 px (≥ 22 en Senior), nada menor de 16 px, unidades en rem | Zoom del navegador al 200 %: sin cortes ni scroll horizontal a 360 px | WCAG 1.4.4, 1.4.10; HU-ACC-01 CA2 |
| A8 | Modo Senior: tipografía, objetivos, íconos y contraste suben por token; decoración e ilustraciones se ocultan (`senior:hidden`); navegación lineal en una columna | Cambiar `data-mode` en `<html>` y comparar; en Figma, cambiar el modo del frame a Senior | HU-ACC-01 CA2 y CA3 |
| A9 | Toda acción crítica o de peligro pide confirmación en lenguaje llano y se puede cancelar | Recorrido de pago, delegación de voto y queja | HU-ACC-03 CA1 y CA3; WCAG 3.3.4 |
| A10 | Los mensajes emergentes no desaparecen solos | Revisión de código: sin `setTimeout` que cierre avisos | WCAG 2.2.1 |
| A11 | Etiqueta visible en todo campo; error junto al campo que dice cómo corregir | axe "label"; revisión de textos | WCAG 3.3.1, 3.3.2, 3.3.3; HU-ACC-08 |
| A12 | El botón de ayuda humana y el switch "Letra grande" están en la misma posición en todas las pantallas | Comparar frames | WCAG 3.2.6; HU-ACC-04 CA1; HU-ACC-01 CA1 |

---

## 7. Ilustraciones

**Estilo**
- Línea continua de 2 px en `arena/900` (el mismo grosor que los íconos) con rellenos planos, sin degradados, sin 3D y sin texturas. → Coherencia visual con Lucide; simplicidad (Zhou, Ye y Lu, 2022)
- Paleta limitada a los tokens: `decoracion/calido`, `decoracion/suave`, `arena/*` y `verde/100`–`500`. Los tonos de piel salen de las rampas `arena` y `terracota`, del 200 al 700. → No se inventan colores, y los tonos cálidos permiten representar la diversidad de la población de Lima.
- Personas del barrio diversas: adultos mayores **activos y competentes** (usando el teléfono, conversando en la reunión, acompañando a un nieto), personas con bastón o con lentes, jóvenes, familias, vigilante, dirigenta. Aparecen en escenas reconocibles: la calle, la reja, el local comunal, la bodega. → Perfil de usuario (vecinos adultos mayores, directiva A y dirigentes B); aprendizaje intergeneracional (Suárez Vásquez, 2023)

**Dónde usarlas**
- **Estados vacíos** ("Todavía no hay reportes en su zona") → acompañan al mensaje, que igual se entiende sin la imagen.
- **Tutorial de primer uso** (C-M6, HU-ACC-10) → una ilustración por paso, como máximo.
- **Confirmaciones** ("Recibimos su pago") → refuerzan la tranquilidad; el comprobante de texto va primero (Anexo K, P6).
- Máximo 160 px de alto en el teléfono. Siempre `alt=""` y `aria-hidden`, porque son decorativas (HU-ACC-07 CA3), y `senior:hidden` (HU-ACC-01 CA3).

**Fuente libre recomendada: Open Peeps** (Pablo Stanley, licencia CC0, openpeeps.com). Es una biblioteca de personas dibujadas a línea que se arman por partes (cabeza, cuerpo, rostro), con canas, lentes y ropa cotidiana. Se puede recolorear con los tokens y está disponible como archivo de Figma de la comunidad. → Uso libre en una tesis y en producción, sin atribución obligatoria. Conviene verificar la licencia vigente en el sitio antes de publicar.

**Qué evitar**
- Estereotipos de la vejez (persona frágil, confundida, con la mano en la cabeza frente a la pantalla). → Trato digno; DCU
- Medallas, trofeos, confeti, puntos, rachas o mascotas que premian. → El proyecto se basa en accesibilidad y DCU, no en gamificación.
- Ilustraciones que transmiten información (un dato, un estado o una instrucción solo en la imagen). → WCAG 1.1.1; HU-ACC-07
- Texto dentro de la imagen, fotos de stock, personajes infantiles o caricaturescos, metáforas técnicas (nubes, engranajes, candados de "seguridad"). → Lenguaje llano (HU-ACC-08)
- Animaciones en bucle. → WCAG 2.2.2; distraen a quien lee despacio

---

## 8. Mantenimiento

1. Se edita solo `tokens.json`.
2. `node generar-css.mjs` regenera `tokens.css`.
3. `node verificar-contraste.mjs` tiene que terminar en "RESULTADO: todo cumple" (código de salida 0).
4. En Figma se actualizan las Variables con el mismo nombre (`a.b.c` → `a/b/c`).
