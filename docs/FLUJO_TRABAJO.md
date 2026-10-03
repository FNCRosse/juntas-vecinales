# Flujo de trabajo

Claude implementa una HU tras otra, en el orden de [PLAN.md](PLAN.md), sin pedir permiso entre HU, y **se detiene al cerrar cada módulo** hasta recibir "aprobado".

## 1. Procedimiento por HU

1. Lee el `modulos/<m>/CLAUDE.md` del módulo y la fila de la HU (criterios, clases, endpoint, pantallas).
2. `graphify query "<HU o concepto>"` antes de abrir archivos; lee solo lo que el grafo señala.
3. Rama desde `main` actualizado: `hu/<id-en-minusculas>-<slug>`, por ejemplo `hu/gar-01-empadronar`. Para un grupo pequeño de HU acopladas: `hu/gar-24-25-clave-respaldo`.
4. Escribe primero las pruebas, una o más por criterio de aceptación, con su etiqueta `@HU` ([PRUEBAS.md](PRUEBAS.md)). Deben fallar.
5. Escribe el código: dominio → aplicación → infraestructura → route handler → pantalla, hasta que pasen.
6. `npm run lint && npm run tipos && npm test`, y `npm run test:e2e -- --spec <la de la HU>`.
7. Commit(s) y push; abre el PR con la plantilla (`gh pr create`), llenando HU, criterios cubiertos, pantallas y la lista de accesibilidad.
8. Espera el CI verde. Si falla, lee el log, corrige y vuelve a empujar; nunca se desactiva una prueba ni se baja un umbral para pasar.
9. Revisa la preview de Vercel con el navegador integrado: teléfono y modo Senior.
10. Merge con squash (`gh pr merge --squash --delete-branch`). El merge despliega a producción.
11. `graphify update .` en `main` actualizado.
12. Marca la casilla de la HU en [PLAN.md](PLAN.md) (`[x]`, con el número de PR) en el siguiente PR o en uno de mantenimiento.

## 2. Definition of Done de una HU

- [ ] Todos sus criterios de aceptación de la v7 tienen prueba etiquetada y pasan.
- [ ] El flujo principal tiene un e2e en teléfono y en modo Senior con 0 violaciones axe.
- [ ] Cobertura global ≥ 80 % (el CI lo exige).
- [ ] Regla de capas y matriz de módulos sin violaciones (`npm run lint`).
- [ ] Pantallas iguales al prototipo: textos, orden y estados (error, confirmación, éxito).
- [ ] Lista de [ACCESIBILIDAD.md §4](ACCESIBILIDAD.md#4-lista-de-comprobación-por-pantalla) revisada.
- [ ] AC-5, AC-6 y AC-7 cubiertos cuando aplican ([PRUEBAS.md §7](PRUEBAS.md#7-qué-prueba-siempre-cada-tipo-de-hu)).
- [ ] Sin secretos, sin datos reales y sin la expresión prohibida del `CLAUDE.md` raíz.
- [ ] CI verde, merge hecho, producción respondiendo, grafo actualizado y casilla marcada.

## 3. Commits y PR

- Conventional Commits en español, en imperativo y en minúscula: `feat(identidad): empadronar residente con acceso inicial`, `fix(aportes): evitar doble abono al reintentar`, `test(incidencias): cubrir anonimato`, `docs: actualizar plan`, `chore(ci): cachear dependencias`.
- Tipos: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`. Ámbito: el módulo, `compartido`, `worker`, `componentes` o `ci`.
- El título del PR es el commit principal con la HU al final: `feat(identidad): empadronar residente (HU-GAR-01)`.
- Un PR por HU o por grupo pequeño de HU acopladas. Nada fuera de su alcance: lo que se descubra va a un PR aparte.

## 4. Cierre de módulo

Cuando todas las casillas del módulo están marcadas:

1. Corre la suite completa en `main` y `npm run matriz`.
2. Borra en Neon las ramas de preview de los PR ya cerrados (el plan gratuito limita las ramas y la integración con Vercel falla al llegar al tope).
3. Crea `docs/evidencias/M<n>.md` (o `F0b.md`) desde [PLANTILLA.md](evidencias/PLANTILLA.md) con:
   - el enlace a la corrida del CI en `main` después del último merge;
   - los números de cobertura (líneas, ramas, funciones; global y del módulo);
   - la matriz HU → código → prueba del módulo (extracto de `docs/evidencias/matriz-hu.md`);
   - el reporte axe por pantalla (pantalla, modo, tamaño, violaciones);
   - capturas de cada pantalla del módulo en teléfono y en modo Senior, tomadas con el navegador integrado sobre producción, en `docs/evidencias/capturas/M<n>/<id-pantalla>-<modo>.png`;
   - la URL de producción y lo que quedó diferido con su motivo.
4. Abre el PR `docs(evidencias): cierre de M<n>`, espera el CI verde y haz el merge.
5. `graphify update .`
6. **Detente.** Entrega a la autora el resumen y la URL de producción, y espera su "aprobado" antes de empezar el siguiente módulo.
