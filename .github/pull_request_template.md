## HU

<!-- Una HU o un grupo pequeño de HU acopladas. Ej.: HU-GAR-01 Empadronar residente. -->
- HU-

## Criterios de aceptación cubiertos

<!-- Uno por línea, con la prueba que lo comprueba. -->
| Criterio | Prueba (`@HU-…`) | Nivel |
| --- | --- | --- |
| CA1 | | unitaria / integración / e2e |

## Pantallas

<!-- Ids del prototipo implementados o tocados. Ej.: ADM-PAD-03. -->
-

## Pruebas

- [ ] `npm run lint` (incluye la regla de arquitectura)
- [ ] `npm run tipos`
- [ ] `npm test` (cobertura global ≥ 80 %)
- [ ] `npm run test:e2e` del flujo principal en teléfono y en modo Senior, 0 violaciones axe
- [ ] AC-5 idempotencia, AC-6 auditoría y AC-7 confidencialidad probadas cuando aplican

## Accesibilidad (docs/ACCESIBILIDAD.md §4)

- [ ] Recorrido completo solo con teclado; foco visible y no tapado
- [ ] Nombre, función y estado de cada control; cambios de estado anunciados
- [ ] Zoom 200 % y 320 px sin pérdida ni scroll horizontal
- [ ] Ningún estado solo con color; ningún color fuera de los tokens
- [ ] Etiquetas visibles; errores junto al campo y que dicen cómo corregir
- [ ] Acciones críticas con confirmación y salida
- [ ] Textos iguales al prototipo, con trato de usted y lenguaje llano
- [ ] Un solo botón primario; "Letra grande" y "Pedir ayuda" en su sitio

## Revisión

- [ ] Preview de Vercel revisada en teléfono y en modo Senior
- [ ] Sin secretos, sin datos reales, sin dependencias nuevas sin justificar
- [ ] Documentos de `docs/` actualizados si cambió una regla
