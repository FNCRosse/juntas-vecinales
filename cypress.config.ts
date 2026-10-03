import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "cypress";
import { Client } from "pg";

const CARPETA_AXE = "pruebas/e2e/reportes/axe";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "pruebas/e2e/**/*.cy.ts",
    supportFile: "pruebas/e2e/soporte/e2e.ts",
    fixturesFolder: false,
    screenshotsFolder: "pruebas/e2e/screenshots",
    videosFolder: "pruebas/e2e/videos",
    video: false,
    allowCypressEnv: false,
    setupNodeEvents(on) {
      on("task", {
        // Guarda el resultado de axe por pantalla: es la evidencia de cierre de cada módulo.
        guardarAxe({ nombre, resultado }: { nombre: string; resultado: unknown }) {
          mkdirSync(CARPETA_AXE, { recursive: true });
          writeFileSync(path.join(CARPETA_AXE, `${nombre}.json`), JSON.stringify(resultado, null, 2));
          return null;
        },
        // El enlace de entrada que se encoló hacia ese WhatsApp: en las pruebas no sale a Meta y el
        // worker no corre, así que sigue en la cola. Solo la BD de pruebas (DATABASE_URL del CI).
        // Avisos ya despachados para una persona: en el CI el worker no corre y la copia interna la
        // escribe él (ADR-006). Solo la BD de pruebas.
        async avisosDePrueba({
          dni,
          avisos,
        }: {
          dni: string;
          avisos: { tipo: string; titulo: string; texto: string }[];
        }) {
          const cliente = new Client({ connectionString: process.env.DATABASE_URL });
          await cliente.connect();
          try {
            const { rows } = await cliente.query<{ id: string }>(
              "SELECT id FROM identidad_usuarios WHERE dni = $1",
              [dni],
            );
            for (const [i, aviso] of avisos.entries()) {
              const cuando = new Date(Date.now() - (avisos.length - i) * 60_000);
              const { rows: cola } = await cliente.query<{ id: string }>(
                `INSERT INTO nucleo_cola_avisos (id, "destinatarioId", tipo, titulo, texto, parametros, estado, "creadoEn", "reintentarDesde")
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, '{}', 'SIN_CANAL_EXTERNO', $5, $5) RETURNING id`,
                [rows[0].id, aviso.tipo, aviso.titulo, aviso.texto, cuando],
              );
              await cliente.query(
                `INSERT INTO nucleo_notificaciones (id, "destinatarioId", tipo, titulo, texto, "avisoId", "creadaEn")
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
                [rows[0].id, aviso.tipo, aviso.titulo, aviso.texto, cola[0].id, cuando],
              );
            }
            return null;
          } finally {
            await cliente.end();
          }
        },
        // Lo que haría el worker con los avisos pendientes de esa persona: escribir su copia interna
        // (ADR-006). En el CI el worker no corre. Solo la BD de pruebas.
        async copiaInternaDeLaCola({ dni }: { dni: string }) {
          const cliente = new Client({ connectionString: process.env.DATABASE_URL });
          await cliente.connect();
          try {
            await cliente.query(
              `WITH pendientes AS (
                 UPDATE nucleo_cola_avisos c SET estado = 'SIN_CANAL_EXTERNO'
                 FROM identidad_usuarios u
                 WHERE u.dni = $1 AND c."destinatarioId" = u.id AND c.estado = 'PENDIENTE'
                 RETURNING c.*)
               INSERT INTO nucleo_notificaciones (id, "destinatarioId", tipo, titulo, texto, "avisoId", "creadaEn")
               SELECT gen_random_uuid(), "destinatarioId", tipo, titulo, texto, id, "creadoEn" FROM pendientes`,
              [dni],
            );
            return null;
          } finally {
            await cliente.end();
          }
        },
        // Deja a una persona del equipo con un solo rol: otra prueba (Equipo) cambia el de Pedro y el
        // orden de los archivos no está garantizado. Solo la BD de pruebas.
        async rolDePrueba({ dni, rol }: { dni: string; rol: string }) {
          const cliente = new Client({ connectionString: process.env.DATABASE_URL });
          await cliente.connect();
          try {
            await cliente.query(
              `UPDATE identidad_usuarios SET roles = ARRAY[$2]::"NombreRol"[], estado = 'ACTIVA' WHERE dni = $1`,
              [dni, rol],
            );
            return null;
          } finally {
            await cliente.end();
          }
        },
        // Un archivo ya "subido" por esa persona (un comprobante o la evidencia de una queja): el CI no
        // habla con R2 (docs/PRUEBAS.md §2), así que la prueba simula la subida y usa este. Solo la BD de pruebas.
        async archivoDePrueba({ dni, uso = "comprobante_egreso" }: { dni: string; uso?: string }) {
          const cliente = new Client({ connectionString: process.env.DATABASE_URL });
          await cliente.connect();
          try {
            const { rows } = await cliente.query<{ id: string }>(
              "SELECT id FROM identidad_usuarios WHERE dni = $1",
              [dni],
            );
            const { rows: archivo } = await cliente.query<{ id: string }>(
              `INSERT INTO nucleo_archivos (id, clave, tipo, tamano, uso, "subidoPor")
               VALUES (gen_random_uuid(), 'pruebas/' || gen_random_uuid() || '.jpg', 'image/jpeg', 1000, $2, $1)
               RETURNING id`,
              [rows[0].id, uso],
            );
            return archivo[0].id;
          } finally {
            await cliente.end();
          }
        },
        async enlaceEnCola({
          telefono,
          plantilla = "enlace_acceso",
        }: {
          telefono: string;
          plantilla?: string;
        }) {
          const cliente = new Client({ connectionString: process.env.DATABASE_URL });
          await cliente.connect();
          try {
            const { rows } = await cliente.query<{ parametros: string[] }>(
              `SELECT parametros FROM nucleo_cola_avisos WHERE telefono = $1 AND plantilla = $2
               ORDER BY "creadoEn" DESC LIMIT 1`,
              [telefono, plantilla],
            );
            return rows[0]?.parametros.find((p) => /^https?:\/\//.test(p)) ?? null;
          } finally {
            await cliente.end();
          }
        },
      });
    },
  },
});
