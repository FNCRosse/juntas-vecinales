# Plataforma Junta Vecinal

Aplicación web accesible para la gestión organizativa y la participación inclusiva de la Junta Vecinal de Villa de Fátima (Lima, Perú). Pensada primero para vecinos adultos mayores: WCAG 2.2 AA, modo "Letra grande", entrada sin contraseña y rutas asistidas por la directiva.

Es el software del Resultado R3.1 de una tesis de la PUCP: 76 historias de usuario en seis módulos (usuarios y garita, transparencia, incidencias, asambleas, aportes vecinales y accesibilidad).

## Tecnología

Next.js (App Router, TypeScript) en Vercel · worker Node.js en Render · PostgreSQL en Neon · Prisma · Tailwind v4 + Radix · Cloudflare R2 · WhatsApp Cloud API · Jest, Supertest y Cypress con axe-core.

## Estado

En construcción. El avance por historia está en [docs/PLAN.md](docs/PLAN.md) y la evidencia de cada módulo en [docs/evidencias/](docs/evidencias/).

## Para empezar

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Pruebas, base de datos local y comandos: [docs/PRUEBAS.md](docs/PRUEBAS.md). Arquitectura y reglas: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Datos

Todos los nombres, DNI, direcciones y montos del repositorio son ficticios.
