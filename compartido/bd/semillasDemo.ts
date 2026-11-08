import { createHash } from "node:crypto";
import { prisma } from "./cliente";
import type { NombreRol, Prisma } from "./generado/client";
import { sembrar } from "./semillas";

// Datos de demostración (docs/DATOS.md §5): un barrio con vida para ver las pantallas con datos en cada perfil.
// Todo es ficticio: nombres, DNI (4100xxxx), teléfonos (51900001xxx) y placas inventados. Va aparte de `semillas.ts`
// a propósito: el CI y las pruebas e2e parten de un barrio casi vacío. Se puede correr varias veces sin duplicar:
// cada fila lleva su `idOperacion` («demo-…») o se busca antes de crearla. Las fechas son relativas a hoy.
//
// Local:       npm run semillas:demo
// Producción:  SEMILLA_EN_NUBE=si DATABASE_URL=<la de Neon> npm run semillas:demo   (el sitio es una demostración)

const VERSION_POLITICA = "2026-10";
const DIA = 86_400_000;

// ---------- Fechas (hora de Lima, sin horario de verano) ----------
const diaLima = (f: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(f);
const mediodia = (d: string) => new Date(`${d}T12:00:00Z`);
const sumarDias = (d: string, n: number) =>
  new Date(mediodia(d).getTime() + n * DIA).toISOString().slice(0, 10);
const lunesDe = (f: Date) => {
  const d = diaLima(f);
  return sumarDias(d, -((mediodia(d).getUTCDay() + 6) % 7));
};
const inicioSemana = (lunes: string) => new Date(`${lunes}T00:00:00-05:00`);
const fechaLimite = (lunes: string) => new Date(`${sumarDias(lunes, 6)}T23:59:59-05:00`);
const enLima = (dia: string, hora: string) => new Date(`${dia}T${hora}:00-05:00`);

const AHORA = new Date();
const haceDias = (n: number, hora = "10:00") => enLima(sumarDias(diaLima(AHORA), -n), hora);
const dentroDe = (n: number, hora = "19:00") => enLima(sumarDias(diaLima(AHORA), n), hora);
const hash = (texto: string) => createHash("sha256").update(texto).digest("hex");

// ---------- Vecinos que no inician sesión (los que llenan el padrón) ----------
type Vecino = {
  nombre: string;
  dni: string;
  manzana: string;
  lote: string;
  uso?: "VIVIENDA" | "NEGOCIO" | "VIVIENDA_Y_NEGOCIO";
  inquilinos?: number;
  autos?: number;
  motos?: number;
  triciclos?: number;
  negocios?: number;
  placas?: [string, "AUTO_O_CAMIONETA" | "MOTO" | "TRICICLO_O_CARRETA"][];
  /** Cómo va con su cuota: «aldia», «atraso:N» (semanas sin pagar), «revision», «observado». */
  cuota: string;
};

const VECINOS: Vecino[] = [
  { nombre: "Teresa Quispe Mamani", dni: "41000001", manzana: "A", lote: "1", cuota: "aldia" },
  {
    nombre: "Ricardo Alva Pinedo",
    dni: "41000002",
    manzana: "A",
    lote: "5",
    autos: 1,
    placas: [["RAP-451", "AUTO_O_CAMIONETA"]],
    cuota: "aldia",
  },
  { nombre: "Doris Cárdenas Vela", dni: "41000003", manzana: "A", lote: "8", cuota: "atraso:2" },
  {
    nombre: "Manuel Torres Ccoa",
    dni: "41000004",
    manzana: "A",
    lote: "15",
    motos: 1,
    placas: [["MTC-072", "MOTO"]],
    cuota: "aldia",
  },
  {
    nombre: "Gladys Rivera Salazar",
    dni: "41000005",
    manzana: "B",
    lote: "4",
    inquilinos: 1,
    cuota: "aldia",
  },
  {
    nombre: "Fernando Ochoa Lazo",
    dni: "41000006",
    manzana: "B",
    lote: "7",
    autos: 1,
    placas: [["FOL-188", "AUTO_O_CAMIONETA"]],
    cuota: "revision",
  },
  { nombre: "Inés Palomino Huaraca", dni: "41000007", manzana: "B", lote: "9", cuota: "aldia" },
  {
    nombre: "Walter Ramos Ticona",
    dni: "41000008",
    manzana: "B",
    lote: "14",
    triciclos: 1,
    placas: [["WRT-003", "TRICICLO_O_CARRETA"]],
    cuota: "atraso:4",
  },
  { nombre: "Norma Echevarría Paz", dni: "41000009", manzana: "C", lote: "2", cuota: "aldia" },
  {
    nombre: "Héctor Sandoval Rojas",
    dni: "41000010",
    manzana: "C",
    lote: "5",
    autos: 2,
    placas: [
      ["HSR-912", "AUTO_O_CAMIONETA"],
      ["HSR-377", "AUTO_O_CAMIONETA"],
    ],
    cuota: "aldia",
  },
  { nombre: "Lucía Benavides Cruz", dni: "41000011", manzana: "C", lote: "10", cuota: "observado" },
  {
    nombre: "Óscar Gutiérrez Mena",
    dni: "41000012",
    manzana: "C",
    lote: "12",
    uso: "VIVIENDA_Y_NEGOCIO",
    negocios: 1,
    cuota: "aldia",
  },
  { nombre: "Silvia Montoya Arce", dni: "41000013", manzana: "D", lote: "1", cuota: "aldia" },
  {
    nombre: "Raúl Cahuana Soto",
    dni: "41000014",
    manzana: "D",
    lote: "4",
    autos: 1,
    motos: 1,
    placas: [
      ["RCS-640", "AUTO_O_CAMIONETA"],
      ["RCM-215", "MOTO"],
    ],
    cuota: "atraso:3",
  },
  {
    nombre: "Marisol Fuentes León",
    dni: "41000015",
    manzana: "D",
    lote: "6",
    uso: "NEGOCIO",
    negocios: 1,
    cuota: "aldia",
  },
  { nombre: "Alberto Medina Quiroz", dni: "41000016", manzana: "D", lote: "12", cuota: "aldia" },
];

type ModoDePago = "YAPE_O_PLIN" | "TRANSFERENCIA" | "EFECTIVO";

const NOMBRE_MEDIO = {
  YAPE_O_PLIN: "Yape o Plin",
  TRANSFERENCIA: "Transferencia bancaria",
  EFECTIVO: "Efectivo, en su casa",
} as const;

function permitirNube() {
  const url = process.env.DATABASE_URL ?? "";
  const nube = process.env.NODE_ENV === "production" || !!process.env.VERCEL_ENV || /neon\.tech/.test(url);
  if (nube && process.env.SEMILLA_EN_NUBE !== "si") {
    throw new Error(
      "Contra Neon los datos de demostración necesitan SEMILLA_EN_NUBE=si (el sitio publicado es una demostración).",
    );
  }
  return nube;
}

type Casa = {
  predioId: string;
  usuarioId: string;
  titular: string;
  vivienda: string;
  cuota: string;
  ocupacion: Record<string, number>;
};

// ---------- Padrón ----------
async function sembrarPadron() {
  for (const v of VECINOS) {
    const usuario = await prisma.usuario.upsert({
      where: { dni: v.dni },
      create: {
        nombreCompleto: v.nombre,
        dni: v.dni,
        telefonoWhatsApp: `51900001${v.dni.slice(-3)}`,
        roles: ["VECINO"] as NombreRol[],
        fechaEmpadronamiento: haceDias(200),
        politicaAceptadaEn: haceDias(60),
        politicaVersion: VERSION_POLITICA,
      },
      update: {},
    });
    const predio = await prisma.predio.upsert({
      where: { manzana_lote: { manzana: v.manzana, lote: v.lote } },
      create: {
        manzana: v.manzana,
        lote: v.lote,
        uso: v.uso ?? "VIVIENDA",
        inquilinos: v.inquilinos ?? 0,
        autos: v.autos ?? 0,
        motos: v.motos ?? 0,
        triciclos: v.triciclos ?? 0,
        negocios: v.negocios ?? 0,
      },
      update: {},
    });
    if (!(await prisma.residencia.count({ where: { usuarioId: usuario.id, fechaFin: null } }))) {
      await prisma.residencia.create({
        data: { usuarioId: usuario.id, predioId: predio.id, relacion: "TITULAR", fechaInicio: haceDias(200) },
      });
    }
    for (const [placa, tipo] of v.placas ?? []) {
      await prisma.vehiculo.upsert({
        where: { placa },
        create: { placa, tipo, predioId: predio.id },
        update: {},
      });
    }
  }
  // Los que ya vivían en el barrio también aceptaron la política y tienen familia: Marta con su cónyuge, Carmen con su hijo.
  await prisma.usuario.updateMany({
    where: { politicaAceptadaEn: null, anonimizadaEn: null },
    data: { politicaAceptadaEn: haceDias(60), politicaVersion: VERSION_POLITICA },
  });
  const casaDe = async (
    manzana: string,
    lote: string,
    nombre: string,
    relacion: "CONYUGE" | "HIJO",
    dniResidente: string,
  ) => {
    const predio = await prisma.predio.findUnique({ where: { manzana_lote: { manzana, lote } } });
    if (!predio || (await prisma.usuario.findUnique({ where: { dni: dniResidente } }))) return;
    const residente = await prisma.usuario.create({
      data: {
        nombreCompleto: nombre,
        dni: dniResidente,
        roles: ["VECINO"],
        politicaAceptadaEn: haceDias(60),
        politicaVersion: VERSION_POLITICA,
      },
    });
    await prisma.residencia.create({
      data: { usuarioId: residente.id, predioId: predio.id, relacion, fechaInicio: haceDias(150) },
    });
  };
  await casaDe("A", "12", "Jorge Salazar Pinto", "CONYUGE", "41000101");
  await casaDe("C", "7", "Andrés Huamán Rivas", "HIJO", "41000102");
}

// ---------- Cuotas, pagos y recibos ----------
const CLAVES_OCUPACION: [
  string,
  (p: {
    familias: number;
    inquilinos: number;
    autos: number;
    motos: number;
    triciclos: number;
    negocios: number;
  }) => number,
][] = [
  ["casa", (p) => p.familias],
  ["inquilino", (p) => p.inquilinos],
  ["auto", (p) => p.autos],
  ["moto", (p) => p.motos],
  ["triciclo", (p) => p.triciclos],
  ["negocio", (p) => p.negocios],
];

const PERFIL_DE: Record<string, string> = {
  "40000002": "aldia", // Marta
  "08123478": "atraso:2", // Carmen (adulto mayor: pide que vayan a cobrarle)
  "40000006": "atraso:9", // Julio: la reja ya no se abre sola
  "40000007": "revision", // Rosa: mandó su pago y espera
  "40000008": "reclamo", // Elena: vendió la moto
  "40000009": "aldia", // Víctor
};

const SEMANAS = 10;
/** Cuántas semanas recientes quedan sin pagar según cómo va la casa (las atrasadas dicen cuántas). */
const SIN_PAGAR: Record<string, number> = { reclamo: 2, revision: 2, observado: 2 };
const SUFIJOS = ["K7M2", "P4X9", "T8R3", "B6N5", "W2H7", "C9V4", "F3J8", "M5D6", "Z7Q2"];

async function sembrarCobros(
  directiva: { id: string; nombre: string },
  mediador: { id: string; nombre: string },
) {
  const tarifa = await prisma.tarifa.findFirst({
    where: { vigenciaDesde: { lte: AHORA } },
    orderBy: [{ vigenciaDesde: "desc" }, { creadaEn: "desc" }],
    include: { conceptos: { orderBy: { orden: "asc" } } },
  });
  if (!tarifa) throw new Error("Falta la tarifa: corra primero las semillas base.");

  const residencias = await prisma.residencia.findMany({
    where: { fechaFin: null, relacion: "TITULAR" },
    include: { predio: true, usuario: true },
  });
  const casas: Casa[] = residencias.map((r) => ({
    predioId: r.predioId,
    usuarioId: r.usuarioId,
    titular: r.usuario.nombreCompleto,
    vivienda: `Mz. ${r.predio.manzana}, lote ${r.predio.lote}`,
    cuota: PERFIL_DE[r.usuario.dni] ?? VECINOS.find((v) => v.dni === r.usuario.dni)?.cuota ?? "aldia",
    ocupacion: Object.fromEntries(CLAVES_OCUPACION.map(([clave, cuanto]) => [clave, cuanto(r.predio)])),
  }));

  const lunes = lunesDe(AHORA);
  const periodos = Array.from({ length: SEMANAS }, (_, i) => sumarDias(lunes, -7 * (SEMANAS - 1 - i)));
  const medios: ModoDePago[] = ["YAPE_O_PLIN", "EFECTIVO", "TRANSFERENCIA", "YAPE_O_PLIN"];
  let cuentaMedios = 0;
  let archivoN = 0;
  const archivo = async (usuarioId: string, uso: string) =>
    (
      await prisma.archivo.create({
        data: {
          clave: `demo/${uso}/${Date.now()}-${archivoN++}.jpg`,
          tipo: "image/jpeg",
          tamano: 184_320,
          uso,
          subidoPor: usuarioId,
        },
      })
    ).id;

  for (const casa of casas) {
    // 1. Las cuotas de las últimas semanas, con la tarifa vigente (las que ya existen no se tocan).
    const lineas = tarifa.conceptos
      .map((c) => ({ c, cantidad: casa.ocupacion[c.clave] ?? 0 }))
      .filter((l) => l.cantidad > 0);
    const total = lineas.reduce((s, l) => s + l.c.monto * l.cantidad, 0);
    const cuotas: { id: string; periodo: string; monto: number; existia: boolean }[] = [];
    for (const periodo of periodos) {
      const existente = await prisma.cuota.findUnique({
        where: { predioId_periodo: { predioId: casa.predioId, periodo: inicioSemana(periodo) } },
      });
      if (existente) {
        const tienePago = await prisma.pagoCuota.count({ where: { cuotaId: existente.id } });
        cuotas.push({ id: existente.id, periodo, monto: existente.montoCalculado, existia: tienePago > 0 });
        continue;
      }
      const creada = await prisma.cuota.create({
        data: {
          predioId: casa.predioId,
          periodo: inicioSemana(periodo),
          fechaLimite: fechaLimite(periodo),
          tarifaId: tarifa.id,
          montoCalculado: total,
          saldoPendiente: total,
          estado: "PENDIENTE",
          creadaEn: inicioSemana(periodo),
          conceptos: {
            create: lineas.map((l, orden) => ({
              clave: l.c.clave,
              nombre: l.c.nombre,
              unidad: l.c.unidad,
              montoUnitario: l.c.monto,
              cantidad: l.cantidad,
              subtotal: l.c.monto * l.cantidad,
              orden,
            })),
          },
        },
      });
      cuotas.push({ id: creada.id, periodo, monto: total, existia: false });
    }
    // Si ya tiene pagos de verdad, no se mezcla con los de demostración.
    if (cuotas.some((c) => c.existia)) {
      continue;
    }

    // 2. Qué semanas están pagadas, cuáles en revisión y cuáles se deben.
    const [tipo, n] = casa.cuota.split(/:/);
    const debe = tipo === "atraso" ? Number(n) : (SIN_PAGAR[tipo] ?? 0);
    const sinPagar = cuotas.slice(cuotas.length - debe);
    // La semana en curso todavía no vence: un pago al día cubre hasta la semana pasada.
    const hechas = cuotas.slice(0, cuotas.length - Math.max(debe, 1));

    // 3. Pagos aprobados: de a 4 semanas, alternando cómo pagó; cada uno con su recibo.
    for (let i = 0; i < hechas.length; i += 2) {
      const grupo = hechas.slice(i, i + 2);
      const monto = grupo.reduce((s, c) => s + c.monto, 0);
      if (monto === 0) continue;
      const medio = medios[cuentaMedios++ % medios.length];
      // Paga durante la semana siguiente a la última que cubre, a distinta hora y día según la casa, sin pasar de ahora.
      const tarde =
        inicioSemana(sumarDias(grupo[grupo.length - 1].periodo, 7 + (cuentaMedios % 5))).getTime() +
        (9 + (cuentaMedios % 9)) * 3_600_000;
      const cuando = new Date(Math.min(tarde, AHORA.getTime() - 3_600_000));
      const aprobador = casa.usuarioId === directiva.id ? mediador : directiva;
      const idOperacion = `demo-pago-${casa.predioId.slice(0, 8)}-${grupo[0].periodo}`;
      if (await prisma.pago.findUnique({ where: { idOperacion } })) continue;
      const pago = await prisma.pago.create({
        data: {
          idOperacion,
          predioId: casa.predioId,
          autorId: casa.usuarioId,
          medio,
          monto,
          estado: "APROBADO",
          creadoEn: cuando,
          cuotas: { create: grupo.map((c) => ({ cuotaId: c.id, monto: c.monto })) },
          ...(medio === "EFECTIVO"
            ? {}
            : {
                comprobantes: {
                  create: {
                    archivoId: await archivo(casa.usuarioId, "comprobante_pago"),
                    estado: "APROBADO",
                    creadoEn: cuando,
                  },
                },
              }),
        },
      });
      const semanas = grupo.length === 1 ? "1 semana" : `${grupo.length} semanas`;
      await prisma.recibo.create({
        data: {
          pagoId: pago.id,
          predioId: casa.predioId,
          titular: casa.titular,
          vivienda: casa.vivienda,
          concepto: `Cuota de vigilancia: ${semanas}`,
          medio: NOMBRE_MEDIO[medio],
          monto,
          fecha: cuando,
          registradoPor: aprobador.nombre,
          registradoPorId: aprobador.id,
          enviadoEn: cuando,
          confirmadoEn: i === 0 && medio !== "EFECTIVO" ? new Date(cuando.getTime() + 2 * 3_600_000) : null,
        },
      });
      await prisma.cuota.updateMany({
        where: { id: { in: grupo.map((c) => c.id) } },
        data: { estado: "PAGADA", saldoPendiente: 0 },
      });
    }

    // 4. Lo que se debe: vencida si ya pasó el domingo; la de esta semana sigue pendiente.
    for (const c of sinPagar) {
      const venceYa = fechaLimite(c.periodo) < AHORA;
      await prisma.cuota.update({ where: { id: c.id }, data: { estado: venceYa ? "VENCIDA" : "PENDIENTE" } });
    }
    if (tipo === "aldia") {
      const actual = cuotas[cuotas.length - 1];
      await prisma.cuota.update({ where: { id: actual.id }, data: { estado: "PENDIENTE" } });
    }

    // 5. Casos para la bandeja de la directiva y las pantallas del vecino.
    if (tipo === "revision" || tipo === "observado") {
      const monto = sinPagar.reduce((s, c) => s + c.monto, 0);
      const medio: ModoDePago = tipo === "revision" ? "YAPE_O_PLIN" : "TRANSFERENCIA";
      const cuando = haceDias(tipo === "revision" ? 1 : 3, "16:30");
      const idOperacion = `demo-pago-${tipo}-${casa.predioId.slice(0, 8)}`;
      if (!(await prisma.pago.findUnique({ where: { idOperacion } }))) {
        await prisma.pago.create({
          data: {
            idOperacion,
            predioId: casa.predioId,
            autorId: casa.usuarioId,
            medio,
            monto,
            estado: tipo === "revision" ? "REGISTRADO" : "OBSERVADO",
            creadoEn: cuando,
            cuotas: { create: sinPagar.map((c) => ({ cuotaId: c.id, monto: c.monto })) },
            comprobantes: {
              create: {
                archivoId: await archivo(casa.usuarioId, "comprobante_pago"),
                estado: tipo === "revision" ? "PENDIENTE_REVISION" : "OBSERVADO",
                motivoObservacion: tipo === "observado" ? "IMAGEN_BORROSA" : null,
                nota:
                  tipo === "observado"
                    ? "No se lee el número de operación. Mande otra captura, por favor."
                    : null,
                creadoEn: cuando,
              },
            },
          },
        });
      }
    }
    if (
      tipo === "reclamo" &&
      !(await prisma.solicitudAjusteTarifa.findUnique({
        where: { idOperacion: `demo-reclamo-${casa.predioId.slice(0, 8)}` },
      }))
    ) {
      await prisma.solicitudAjusteTarifa.create({
        data: {
          idOperacion: `demo-reclamo-${casa.predioId.slice(0, 8)}`,
          predioId: casa.predioId,
          solicitanteId: casa.usuarioId,
          motivo: "MENOS_VEHICULOS",
          detalle: "Vendí la moto hace tres semanas y mi cuota todavía la incluye.",
          estado: "EN_REVISION",
          creadoEn: haceDias(2, "09:15"),
          cuotas: { create: sinPagar.map((c) => ({ cuotaId: c.id, estadoAnterior: "VENCIDA" as const })) },
        },
      });
      await prisma.cuota.updateMany({
        where: { id: { in: sinPagar.map((c) => c.id) } },
        data: { estado: "EN_DISCREPANCIA" },
      });
    }
    if (tipo === "atraso" && Number(n) >= 2 && casa.cuota !== "atraso:9") {
      const venceda = sinPagar.find((c) => fechaLimite(c.periodo) < AHORA);
      if (venceda && !(await prisma.alertaPreventiva.findUnique({ where: { cuotaId: venceda.id } }))) {
        await prisma.alertaPreventiva.create({
          data: {
            cuotaId: venceda.id,
            predioId: casa.predioId,
            diasDeRetraso: 7,
            debe: venceda.monto,
            residentesAvisados: 1,
            enviadaEn: new Date(fechaLimite(venceda.periodo).getTime() + 7 * DIA),
          },
        });
      }
    }
  }

  // Carmen pide que vayan a cobrarle en efectivo y un recibo en papel; Doris pidió uno ya entregado.
  const carmen = casas.find((c) => c.cuota === "atraso:2" && c.titular.startsWith("Carmen"));
  if (
    carmen &&
    !(await prisma.pedidoCobroEnCasa.findUnique({ where: { idOperacion: "demo-cobro-casa-carmen" } }))
  ) {
    await prisma.pedidoCobroEnCasa.create({
      data: {
        idOperacion: "demo-cobro-casa-carmen",
        predioId: carmen.predioId,
        solicitanteId: carmen.usuarioId,
        semanas: 2,
        monto: 2 * periodoMonto(lineasDe(carmen, tarifa.conceptos)),
        franja: "MANANA",
        nota: "Toque fuerte, por favor, a veces no escucho el timbre.",
        estado: "PENDIENTE",
        creadoEn: haceDias(1, "08:40"),
      },
    });
  }
  const reciboDeRosa = await prisma.recibo.findFirst({
    where: { predioId: casas.find((c) => c.titular.startsWith("Marta"))?.predioId },
    orderBy: { fecha: "desc" },
  });
  if (
    reciboDeRosa &&
    !(await prisma.pedidoReciboPapel.findUnique({ where: { idOperacion: "demo-recibo-papel-marta" } }))
  ) {
    await prisma.pedidoReciboPapel.create({
      data: {
        idOperacion: "demo-recibo-papel-marta",
        reciboId: reciboDeRosa.id,
        solicitanteId: reciboDeRosa.registradoPorId,
        franja: "TARDE",
        estado: "POR_ENTREGAR",
        creadoEn: haceDias(2),
      },
    });
  }
}
const lineasDe = (casa: Casa, conceptos: { clave: string; monto: number }[]) =>
  conceptos.map((c) => c.monto * (casa.ocupacion[c.clave] ?? 0));
const periodoMonto = (montos: number[]) => montos.reduce((s, m) => s + m, 0);

// ---------- Caja, rendiciones y publicaciones ----------
async function sembrarTransparencia(
  directiva: { id: string; nombre: string },
  mediador: { id: string; nombre: string },
) {
  const mes = diaLima(AHORA).slice(0, 7);
  const mesAnterior = (m: string, n: number) => {
    const [a, mm] = m.split("-").map(Number);
    const d = new Date(Date.UTC(a, mm - 1 - n, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const movimientos: [number, "INGRESO" | "GASTO", string, string, number, number][] = [
    // [mesesAtras, tipo, concepto, detalle, monto (céntimos), día del mes]
    [2, "GASTO", "VIGILANTES", "Pago del turno de noche, setiembre", 18000, 28],
    [2, "GASTO", "SERVICIOS", "Recibo de luz de la garita", 2850, 12],
    [2, "INGRESO", "DONACION", "Aporte de la bodega de la esquina", 5000, 15],
    [1, "GASTO", "VIGILANTES", "Pago del turno de noche, octubre", 18000, 28],
    [1, "GASTO", "SERVICIOS", "Recibo de luz de la garita", 3120, 12],
    [1, "GASTO", "UTILES", "Cuaderno de ocurrencias, lapiceros y linterna", 2400, 6],
    [1, "GASTO", "MANTENIMIENTO", "Cambio de candado y bisagras de la reja", 3500, 19],
    [0, "GASTO", "UTILES", "Focos y pilas para la garita", 1800, 5],
    [0, "GASTO", "SERVICIOS", "Recibo de luz de la garita", 2980, 10],
    [0, "INGRESO", "DONACION", "Aporte de una familia del barrio", 2000, 8],
  ];
  for (const [atras, tipo, concepto, detalle, monto, dia] of movimientos) {
    const fecha = enLima(`${mesAnterior(mes, atras)}-${String(Math.min(dia, 28)).padStart(2, "0")}`, "12:00");
    if (fecha > AHORA) continue;
    const idOperacion = `demo-caja-${atras}-${concepto}-${dia}`;
    if (await prisma.movimientoDeCaja.findUnique({ where: { idOperacion } })) continue;
    const autor = tipo === "GASTO" && dia % 2 ? mediador : directiva;
    const archivoId =
      tipo === "GASTO"
        ? (
            await prisma.archivo.create({
              data: {
                clave: `demo/comprobante_gasto/${idOperacion}.jpg`,
                tipo: "image/jpeg",
                tamano: 220_000,
                uso: "comprobante_gasto",
                subidoPor: autor.id,
              },
            })
          ).id
        : null;
    await prisma.movimientoDeCaja.create({
      data: {
        idOperacion,
        tipo,
        concepto,
        detalle,
        monto,
        fecha,
        archivoId,
        autorId: autor.id,
        autor: autor.nombre,
        creadoEn: fecha,
      },
    });
  }

  // La rendición de los dos meses cerrados: lo que ven los vecinos en Transparencia.
  const NOMBRES: Record<string, string> = {
    VIGILANTES: "Pago a vigilantes",
    SERVICIOS: "Luz o agua de la garita",
    UTILES: "Útiles y materiales",
    MANTENIMIENTO: "Mantenimiento o reparación",
  };
  for (const atras of [2, 1]) {
    const m = mesAnterior(mes, atras);
    if (await prisma.rendicionPublicada.findUnique({ where: { mes: m } })) continue;
    const desde = enLima(`${m}-01`, "00:00");
    const hasta = enLima(`${mesAnterior(mes, atras - 1)}-01`, "00:00");
    const [recibos, gastos, ingresos] = await Promise.all([
      prisma.recibo.aggregate({ _sum: { monto: true }, where: { fecha: { gte: desde, lt: hasta } } }),
      prisma.movimientoDeCaja.findMany({ where: { tipo: "GASTO", fecha: { gte: desde, lt: hasta } } }),
      prisma.movimientoDeCaja.aggregate({
        _sum: { monto: true },
        where: { tipo: "INGRESO", fecha: { gte: desde, lt: hasta } },
      }),
    ]);
    const porConcepto = new Map<string, number>();
    for (const g of gastos)
      porConcepto.set(
        NOMBRES[g.concepto] ?? g.concepto,
        (porConcepto.get(NOMBRES[g.concepto] ?? g.concepto) ?? 0) + g.monto,
      );
    await prisma.rendicionPublicada.create({
      data: {
        idOperacion: `demo-rendicion-${m}`,
        mes: m,
        ingresosPorCuotas: recibos._sum.monto ?? 0,
        ingresosOtros: ingresos._sum.monto ?? 0,
        gastos: gastos.reduce((s, g) => s + g.monto, 0),
        comprobantes: gastos.length,
        gastosPorConcepto: [...porConcepto]
          .map(([concepto, monto]) => ({ concepto, monto }))
          .sort((a, b) => b.monto - a.monto),
        publicadaPorId: directiva.id,
        publicadaPor: directiva.nombre,
        publicadaEn: enLima(`${mesAnterior(mes, atras - 1)}-02`, "11:00"),
      },
    });
  }

  // Comunicados.
  const comunicados: [string, number, string, "INFORMATIVO" | "URGENTE", string][] = [
    [
      "demo-comunicado-agua",
      3,
      "Corte de agua el jueves de 8 a. m. a 2 p. m.",
      "URGENTE",
      "Sedapal cortará el agua el jueves por trabajos en la red principal. Les pedimos llenar sus tanques el día anterior. Si alguien necesita agua para una persona enferma, avise en la garita.",
    ],
    [
      "demo-comunicado-poste",
      9,
      "Ya cambiaron la luminaria de la Mz. C",
      "INFORMATIVO",
      "Gracias a todas las familias que reportaron el poste apagado. La municipalidad cambió la luminaria el martes y la calle ya está iluminada.",
    ],
    [
      "demo-comunicado-basura",
      21,
      "Recordatorio: horario del carro de basura",
      "INFORMATIVO",
      "El carro recolector pasa lunes, miércoles y viernes a las 7 p. m. Saque su bolsa cerrada solo a esa hora para que no se acumule frente a las casas.",
    ],
  ];
  for (const [idOperacion, atras, titulo, urgencia, cuerpo] of comunicados) {
    if (await prisma.publicacion.findUnique({ where: { idOperacion } })) continue;
    await prisma.publicacion.create({
      data: {
        idOperacion,
        tipo: "COMUNICADO",
        titulo,
        fechaPublicacion: haceDias(atras, "09:00"),
        autorId: directiva.id,
        autor: directiva.nombre,
        comunicado: { create: { cuerpo, urgencia } },
      },
    });
  }
}

// ---------- Asambleas y actividades ----------
async function sembrarAsambleas(
  directiva: { id: string; nombre: string },
  mediador: { id: string; nombre: string },
) {
  const predios = await prisma.predio.findMany({
    include: { residencias: { where: { fechaFin: null, relacion: "TITULAR" } } },
    orderBy: [{ manzana: "asc" }, { lote: "asc" }],
  });
  const titular = (p: (typeof predios)[number]) => p.residencias[0]?.usuarioId ?? directiva.id;
  const padronTotal = predios.length;
  const quorumRequerido = Math.floor(padronTotal / 2) + 1;

  // 1. La asamblea ordinaria de hace un mes: cerrada, con asistencia y acta.
  const pasada = await prisma.convocatoria.findUnique({ where: { idOperacion: "demo-asamblea-pasada" } });
  let pasadaId = pasada?.id;
  if (!pasada) {
    const c = await prisma.convocatoria.create({
      data: {
        idOperacion: "demo-asamblea-pasada",
        tipo: "ASAMBLEA",
        titulo: "Asamblea ordinaria de octubre",
        fechaHora: haceDias(24, "19:00"),
        lugar: "Parque central, frente a la garita",
        motivo:
          "Rendición de cuentas del trimestre, cambio de la luminaria de la Mz. C y propuesta de la cuota extraordinaria para la reja.",
        estado: "CERRADA",
        autorId: directiva.id,
        autor: directiva.nombre,
        fechaPublicacion: haceDias(34, "10:00"),
        asamblea: {
          create: {
            tipoAsamblea: "ORDINARIA",
            padronTotal,
            quorumRequerido,
            confirmacionesHasta: haceDias(25, "18:00"),
            votacionesAbiertasEn: haceDias(24, "19:20"),
          },
        },
      },
    });
    pasadaId = c.id;
    const asistieron = predios.slice(0, Math.ceil(padronTotal * 0.7));
    await prisma.confirmacionAsistencia.createMany({
      data: asistieron.map((p, i) => ({
        convocatoriaId: c.id,
        predioId: p.id,
        modo: i % 6 === 5 ? ("ASISTIDA" as const) : ("DIGITAL" as const),
        registradaPor: i % 6 === 5 ? mediador.id : null,
        creadaEn: haceDias(30 - (i % 4)),
      })),
    });
    await prisma.checkInPresencial.createMany({
      data: asistieron.map((p) => ({
        convocatoriaId: c.id,
        predioId: p.id,
        acreditadoPor: mediador.id,
        creadoEn: haceDias(24, "19:10"),
      })),
    });
  }
  if (!(await prisma.publicacion.findUnique({ where: { idOperacion: "demo-acta-octubre" } }))) {
    await prisma.publicacion.create({
      data: {
        idOperacion: "demo-acta-octubre",
        tipo: "ACTA",
        titulo: "Acta de la asamblea ordinaria de octubre",
        fechaPublicacion: haceDias(22, "11:00"),
        autorId: directiva.id,
        autor: directiva.nombre,
        acta: {
          create: {
            fechaAsamblea: haceDias(24, "19:00"),
            convocatoriaId: pasadaId,
            acuerdos: [
              "Aprobar el cambio de la luminaria de la Mz. C con fondos de la caja.",
              "Aprobar la rendición de cuentas de julio a setiembre.",
              "Cobrar una cuota extraordinaria de S/ 5 por casa para la reja eléctrica.",
            ],
            compromisos: [
              "La directiva pedirá tres cotizaciones de la reja antes de la próxima asamblea.",
              "El mediador visitará a las casas que no pudieron asistir para contarles los acuerdos.",
            ],
            conclusiones:
              "Asistió el 70 % del padrón. Se cumplió el quórum y todos los puntos se votaron a mano alzada, sin objeciones.",
          },
        },
      },
    });
  }

  // 2. La próxima asamblea: confirmaciones, poderes y temas propuestos.
  let proxima = await prisma.convocatoria.findUnique({ where: { idOperacion: "demo-asamblea-proxima" } });
  if (!proxima) {
    proxima = await prisma.convocatoria.create({
      data: {
        idOperacion: "demo-asamblea-proxima",
        tipo: "ASAMBLEA",
        titulo: "Asamblea ordinaria de noviembre",
        fechaHora: dentroDe(6, "19:00"),
        lugar: "Parque central, frente a la garita",
        motivo:
          "Elegir la cotización de la reja eléctrica y revisar el pago a los vigilantes. También se escucharán los temas que propongan los vecinos.",
        autorId: directiva.id,
        autor: directiva.nombre,
        fechaPublicacion: haceDias(4, "10:00"),
        asamblea: {
          create: {
            tipoAsamblea: "ORDINARIA",
            padronTotal,
            quorumRequerido,
            confirmacionesHasta: dentroDe(5, "18:00"),
          },
        },
      },
    });
    const confirmaron = predios.filter((_, i) => i % 3 !== 2).slice(0, Math.round(padronTotal * 0.45));
    await prisma.confirmacionAsistencia.createMany({
      data: confirmaron.map((p, i) => ({
        convocatoriaId: proxima!.id,
        predioId: p.id,
        modo: i % 5 === 4 ? ("ASISTIDA" as const) : ("DIGITAL" as const),
        registradaPor: i % 5 === 4 ? mediador.id : null,
        creadaEn: haceDias(3 - (i % 3)),
      })),
    });
    const sinConfirmar = predios.filter((p) => !confirmaron.some((c) => c.id === p.id));
    for (const [i, [nombre, dni, condicion]] of (
      [
        ["Sofía Vargas Díaz", "70112233", "FAMILIAR"],
        ["Pablo Meza Cueva", "70445566", "VECINO"],
      ] as const
    ).entries()) {
      const p = sinConfirmar[i];
      if (!p) continue;
      await prisma.delegacionVoto.create({
        data: {
          convocatoriaId: proxima.id,
          predioId: p.id,
          titularId: titular(p),
          apoderadoNombre: nombre,
          apoderadoDniHash: hash(dni),
          apoderadoDniFinal: dni.slice(-2),
          condicion,
          creadaEn: haceDias(1 + i),
        },
      });
    }
    const propuestas: [string, string, "PENDIENTE_REVISION" | "INCLUIDA" | "NO_INCLUIDA", string | null][] = [
      [
        "Instalar un espejo en la esquina de la Mz. B",
        "Los autos salen sin ver a quien cruza y ya hubo dos sustos con niños.",
        "PENDIENTE_REVISION",
        null,
      ],
      [
        "Turno de vigilancia los domingos por la tarde",
        "Los fines de semana entran muchas visitas y solo hay un vigilante.",
        "INCLUIDA",
        null,
      ],
      [
        "Poner macetas en la berma del parque",
        "Se vería más ordenado y los vecinos podrían cuidarlas por turnos.",
        "PENDIENTE_REVISION",
        null,
      ],
      [
        "Cobrar multa a quien saque la basura fuera de hora",
        "Cada semana se acumula bolsas frente a mi casa.",
        "NO_INCLUIDA",
        "Las multas no están en el reglamento. Se propone primero un recordatorio en el comunicado de basura.",
      ],
    ];
    for (const [i, [titulo, justificacion, estado, motivo]] of propuestas.entries()) {
      const p = predios[(i * 4 + 1) % predios.length];
      await prisma.propuestaAgenda.create({
        data: {
          idOperacion: `demo-propuesta-${i}`,
          convocatoriaId: proxima.id,
          autorId: titular(p),
          predioId: p.id,
          titulo,
          justificacion,
          estado,
          motivoDecision: motivo,
          decididaEn: estado === "PENDIENTE_REVISION" ? null : haceDias(1),
          decididaPor: estado === "PENDIENTE_REVISION" ? null : directiva.id,
          creadaEn: haceDias(3 - Math.min(i, 2)),
        },
      });
    }
  }

  // 3. La pollada pro-reja de hace seis semanas, con su balance publicado.
  let pollada = await prisma.convocatoria.findUnique({ where: { idOperacion: "demo-actividad-pasada" } });
  if (!pollada) {
    pollada = await prisma.convocatoria.create({
      data: {
        idOperacion: "demo-actividad-pasada",
        tipo: "EVENTO_PRO_FONDOS",
        titulo: "Pollada pro-reja eléctrica",
        fechaHora: haceDias(40, "13:00"),
        lugar: "Parque central",
        motivo: "Juntar fondos para la reja eléctrica de la garita.",
        estado: "CERRADA",
        autorId: directiva.id,
        autor: directiva.nombre,
        fechaPublicacion: haceDias(55, "10:00"),
        evento: {
          create: {
            tipoActividad: "POLLADA",
            precioUnidad: 1800,
            metaRecaudacion: 90000,
            pagos: "AMBOS",
            pideVoluntarios: true,
          },
        },
      },
    });
    const colaboradores = predios.slice(0, Math.min(14, padronTotal));
    await prisma.colaboracion.createMany({
      data: colaboradores.map((p, i) => ({
        idOperacion: `demo-colab-pasada-${i}`,
        convocatoriaId: pollada!.id,
        predioId: p.id,
        autorId: titular(p),
        cantidad: 1 + (i % 3),
        modalidad: i % 2 ? ("EN_PUERTA" as const) : ("ANTICIPADA" as const),
        monto: (1 + (i % 3)) * 1800,
        estado: "AGENDADA" as const,
        creadaEn: haceDias(48 - i),
      })),
    });
  }
  if (!(await prisma.publicacion.findUnique({ where: { idOperacion: "demo-balance-pollada" } }))) {
    const egresos: [string, number][] = [
      ["Pollos y papas (60 porciones)", 36000],
      ["Carbón, gas y aceite", 6500],
      ["Bebidas y vasos descartables", 9800],
      ["Alquiler de mesas y sillas", 8000],
    ];
    const archivos = await Promise.all(
      egresos.map((_, i) =>
        prisma.archivo.create({
          data: {
            clave: `demo/comprobante_egreso/pollada-${i}.jpg`,
            tipo: "image/jpeg",
            tamano: 210_000,
            uso: "comprobante_egreso",
            subidoPor: directiva.id,
          },
        }),
      ),
    );
    await prisma.publicacion.create({
      data: {
        idOperacion: "demo-balance-pollada",
        tipo: "BALANCE",
        titulo: "Balance de la pollada pro-reja eléctrica",
        fechaPublicacion: haceDias(37, "11:00"),
        autorId: directiva.id,
        autor: directiva.nombre,
        balance: {
          create: {
            fechaActividad: haceDias(40, "13:00"),
            convocatoriaId: pollada.id,
            ingresosVirtuales: 54000,
            ingresosEnPuerta: 41400,
            egresos: {
              create: egresos.map(([concepto, monto], orden) => ({
                orden,
                concepto,
                monto,
                archivoId: archivos[orden].id,
              })),
            },
          },
        },
      },
    });
  }

  // 4. La parrillada que viene, con aportes por revisar y voluntarios.
  let parrillada = await prisma.convocatoria.findUnique({ where: { idOperacion: "demo-actividad-proxima" } });
  if (!parrillada) {
    parrillada = await prisma.convocatoria.create({
      data: {
        idOperacion: "demo-actividad-proxima",
        tipo: "EVENTO_PRO_FONDOS",
        titulo: "Parrillada por las luminarias",
        fechaHora: dentroDe(20, "13:00"),
        lugar: "Parque central",
        motivo: "Comprar dos luminarias nuevas para el pasaje de la Mz. D.",
        autorId: directiva.id,
        autor: directiva.nombre,
        fechaPublicacion: haceDias(2, "10:00"),
        evento: {
          create: {
            tipoActividad: "PARRILLADA",
            precioUnidad: 2500,
            metaRecaudacion: 120000,
            pagos: "AMBOS",
            pideVoluntarios: true,
          },
        },
      },
    });
    for (const [i, p] of predios.slice(2, 8).entries()) {
      const anticipada = i < 3;
      await prisma.colaboracion.create({
        data: {
          idOperacion: `demo-colab-proxima-${i}`,
          convocatoriaId: parrillada.id,
          predioId: p.id,
          autorId: titular(p),
          cantidad: 1 + (i % 2),
          modalidad: anticipada ? "ANTICIPADA" : "EN_PUERTA",
          monto: (1 + (i % 2)) * 2500,
          estado: anticipada ? "POR_REVISAR" : "AGENDADA",
          archivoId: anticipada
            ? (
                await prisma.archivo.create({
                  data: {
                    clave: `demo/comprobante_aporte/parrillada-${i}.jpg`,
                    tipo: "image/jpeg",
                    tamano: 150_000,
                    uso: "comprobante_aporte",
                    subidoPor: titular(p),
                  },
                })
              ).id
            : null,
          creadaEn: haceDias(1 + (i % 2)),
        },
      });
    }
    const ofrecimientos: [string, "PENDIENTE" | "APROBADO", string | null][] = [
      ["Puedo encender la parrilla y cuidar el fuego desde las 11 a. m.", "APROBADO", "Parrillero"],
      ["Llevo mi mesa y ayudo a servir las porciones.", "PENDIENTE", null],
      ["Puedo cobrar en la puerta con mi cuaderno de cuentas.", "PENDIENTE", null],
    ];
    for (const [i, [descripcion, estado, rol]] of ofrecimientos.entries()) {
      const p = predios[(i + 9) % predios.length];
      await prisma.voluntariado.create({
        data: {
          idOperacion: `demo-voluntario-${i}`,
          convocatoriaId: parrillada.id,
          predioId: p.id,
          autorId: titular(p),
          descripcion,
          estado,
          rolAsignado: rol,
          decididoPor: estado === "PENDIENTE" ? null : directiva.id,
          decididoEn: estado === "PENDIENTE" ? null : haceDias(1),
          creadaEn: haceDias(2),
        },
      });
    }
  }
}

// ---------- Ingresos y gastos de las actividades (antes de su balance) ----------
async function sembrarActividades(directiva: { id: string; nombre: string }) {
  const predios = await prisma.predio.findMany({
    include: { residencias: { where: { fechaFin: null, relacion: "TITULAR" } } },
    orderBy: [{ manzana: "asc" }, { lote: "asc" }],
  });
  const titular = (p: (typeof predios)[number]) => p.residencias[0]?.usuarioId ?? directiva.id;
  const comprobante = async (nombre: string, uso: string, subidoPor: string) =>
    (
      await prisma.archivo.create({
        data: { clave: `demo/${uso}/${nombre}.jpg`, tipo: "image/jpeg", tamano: 190_000, uso, subidoPor },
      })
    ).id;
  const anotar = async (
    convocatoriaId: string,
    clave: string,
    tipo: "GASTO" | "INGRESO_EN_PUERTA",
    concepto: string,
    monto: number,
  ) => {
    const idOperacion = `demo-mov-${clave}`;
    if (await prisma.movimientoDeActividad.findUnique({ where: { idOperacion } })) return;
    const archivoId = tipo === "GASTO" ? await comprobante(clave, "comprobante_egreso", directiva.id) : null;
    await prisma.movimientoDeActividad.create({
      data: {
        idOperacion,
        convocatoriaId,
        tipo,
        concepto,
        monto,
        archivoId,
        autorId: directiva.id,
        autor: directiva.nombre,
      },
    });
  };

  // El bingo de hace diez días: ya se hizo y su balance espera que la directiva lo revise y lo publique.
  let bingo = await prisma.convocatoria.findUnique({ where: { idOperacion: "demo-actividad-bingo" } });
  if (!bingo) {
    bingo = await prisma.convocatoria.create({
      data: {
        idOperacion: "demo-actividad-bingo",
        tipo: "EVENTO_PRO_FONDOS",
        titulo: "Bingo familiar por las sillas del local",
        fechaHora: haceDias(10, "16:00"),
        lugar: "Local comunal",
        motivo: "Comprar 30 sillas plegables para las asambleas en el local comunal.",
        autorId: directiva.id,
        autor: directiva.nombre,
        fechaPublicacion: haceDias(28, "10:00"),
        evento: {
          create: {
            tipoActividad: "BINGO",
            precioUnidad: 1000,
            metaRecaudacion: 80000,
            pagos: "AMBOS",
            pideVoluntarios: true,
          },
        },
      },
    });
    for (const [i, p] of predios.slice(0, 12).entries()) {
      const anticipada = i % 3 !== 2;
      await prisma.colaboracion.create({
        data: {
          idOperacion: `demo-colab-bingo-${i}`,
          convocatoriaId: bingo.id,
          predioId: p.id,
          autorId: titular(p),
          cantidad: 1 + (i % 3),
          modalidad: anticipada ? "ANTICIPADA" : "EN_PUERTA",
          monto: (1 + (i % 3)) * 1000,
          estado: anticipada ? "POR_REVISAR" : "AGENDADA",
          archivoId: anticipada
            ? await comprobante(`bingo-aporte-${i}`, "comprobante_aporte", titular(p))
            : null,
          creadaEn: haceDias(14 + (i % 5)),
        },
      });
    }
    for (const [i, [descripcion, estado, rol]] of (
      [
        ["Puedo cantar los números con el micrófono.", "APROBADO", "Cantar los números"],
        ["Llevo mi parlante para la música.", "NO_APROBADO", null],
      ] as const
    ).entries()) {
      const p = predios[(i + 14) % predios.length];
      await prisma.voluntariado.create({
        data: {
          idOperacion: `demo-voluntario-bingo-${i}`,
          convocatoriaId: bingo.id,
          predioId: p.id,
          autorId: titular(p),
          descripcion,
          estado,
          rolAsignado: rol,
          decididoPor: directiva.id,
          decididoEn: haceDias(15),
          creadaEn: haceDias(18),
        },
      });
    }
  }
  await anotar(bingo.id, "bingo-premios", "GASTO", "Premios: licuadora y canasta de víveres", 18500);
  await anotar(bingo.id, "bingo-cartillas", "GASTO", "Cartillas impresas y plumones", 4200);
  await anotar(bingo.id, "bingo-sillas", "GASTO", "Alquiler de mesas y sillas", 6000);
  await anotar(bingo.id, "bingo-puerta", "INGRESO_EN_PUERTA", "38 cartillas vendidas en la puerta", 38000);

  // La parrillada que viene: ya se compró la carne por adelantado.
  const parrillada = await prisma.convocatoria.findUnique({
    where: { idOperacion: "demo-actividad-proxima" },
  });
  if (parrillada)
    await anotar(parrillada.id, "parrillada-carne", "GASTO", "Adelanto por la carne (20 kg)", 30000);
}

// ---------- Incidentes ----------
async function sembrarIncidentes(
  directiva: { id: string; nombre: string },
  mediador: { id: string; nombre: string },
) {
  const personas = Object.fromEntries(
    (await prisma.usuario.findMany({ select: { id: true, dni: true } })).map((u) => [u.dni, u.id]),
  );
  type Caso = {
    n: string;
    categoria: "RUIDOS" | "BASURA" | "COCHERAS" | "SEGURIDAD" | "OTROS";
    descripcion: string;
    manzana: string;
    referencia: string;
    de: string;
    atras: number;
    estado: "RECIBIDO" | "EN_REVISION" | "RECHAZADO" | "RESUELTO" | "DERIVADO_ENTIDAD_EXTERNA";
    prioridad?: "BAJA" | "MEDIA" | "ALTA";
    motivoRechazo?: string;
    accion?: ["MEDIACION" | "LLAMADA_DE_ATENCION", string];
    entidad?: "PNP" | "MUNICIPALIDAD";
  };
  const casos: Caso[] = [
    {
      n: "1",
      categoria: "RUIDOS",
      descripcion:
        "Música a todo volumen pasada la medianoche, tres fines de semana seguidos. Los niños no pueden dormir.",
      manzana: "B",
      referencia: "Frente al lote 7",
      de: "40000007",
      atras: 2,
      estado: "RECIBIDO",
    },
    {
      n: "2",
      categoria: "BASURA",
      descripcion: "Dejaron desmonte y bolsas frente al lote 9 y ya atrae perros y moscas.",
      manzana: "D",
      referencia: "Pasaje de la Mz. D, junto al poste",
      de: "40000008",
      atras: 3,
      estado: "RECIBIDO",
    },
    {
      n: "3",
      categoria: "COCHERAS",
      descripcion: "Una camioneta se estaciona todos los días tapando la cochera del lote 3.",
      manzana: "A",
      referencia: "Lote 3",
      de: "40000006",
      atras: 5,
      estado: "EN_REVISION",
      prioridad: "MEDIA",
    },
    {
      n: "4",
      categoria: "SEGURIDAD",
      descripcion: "Dos personas rondan de noche por la Mz. C y el poste de la esquina está apagado.",
      manzana: "C",
      referencia: "Esquina del lote 10",
      de: "08123478",
      atras: 6,
      estado: "EN_REVISION",
      prioridad: "ALTA",
    },
    {
      n: "5",
      categoria: "SEGURIDAD",
      descripcion:
        "Intentaron abrir un auto estacionado y rompieron el espejo. El vecino tiene el video de su cámara.",
      manzana: "A",
      referencia: "Lote 5",
      de: "40000002",
      atras: 15,
      estado: "DERIVADO_ENTIDAD_EXTERNA",
      prioridad: "ALTA",
      entidad: "PNP",
    },
    {
      n: "6",
      categoria: "BASURA",
      descripcion: "Sacaron la basura fuera del horario y quedó regada por la vereda.",
      manzana: "B",
      referencia: "Lote 11",
      de: "08123478",
      atras: 21,
      estado: "RESUELTO",
      prioridad: "BAJA",
      accion: [
        "LLAMADA_DE_ATENCION",
        "Se conversó con la familia y se recordó el horario del carro recolector.",
      ],
    },
    {
      n: "7",
      categoria: "RUIDOS",
      descripcion: "Taladro y martillo desde las 6 a. m. por una obra en una casa vecina.",
      manzana: "D",
      referencia: "Lote 12",
      de: "40000009",
      atras: 27,
      estado: "RESUELTO",
      prioridad: "MEDIA",
      accion: [
        "MEDIACION",
        "El mediador acordó con el propietario trabajar de 8 a. m. a 5 p. m. de lunes a sábado.",
      ],
    },
    {
      n: "8",
      categoria: "OTROS",
      descripcion: "Una familia me insulta por una deuda personal y pido que la junta intervenga.",
      manzana: "A",
      referencia: "Lote 8",
      de: "40000007",
      atras: 33,
      estado: "RECHAZADO",
      motivoRechazo:
        "Es un asunto entre dos familias y no afecta la convivencia del barrio. Se sugiere acudir a un centro de conciliación.",
    },
    {
      n: "9",
      categoria: "OTROS",
      descripcion: "Hay una fuga de agua en la vereda del parque desde hace una semana.",
      manzana: "C",
      referencia: "Frente al parque central",
      de: "40000002",
      atras: 40,
      estado: "DERIVADO_ENTIDAD_EXTERNA",
      prioridad: "MEDIA",
      entidad: "MUNICIPALIDAD",
    },
  ];
  const coordenadas: Record<string, [number, number]> = {
    A: [-12.0521, -77.0371],
    B: [-12.0526, -77.0364],
    C: [-12.0531, -77.0369],
    D: [-12.0535, -77.0361],
  };
  for (const c of casos) {
    const idOperacion = `demo-queja-${c.n}`;
    if (await prisma.queja.findUnique({ where: { idOperacion } })) continue;
    const registro = haceDias(c.atras, "18:30");
    const [lat, lon] = coordenadas[c.manzana];
    const evaluada = c.estado !== "RECIBIDO";
    const queja = await prisma.queja.create({
      data: {
        codigoTicket: `provisional-${idOperacion}`,
        idOperacion,
        categoria: c.categoria,
        descripcion: c.descripcion,
        manzana: c.manzana,
        referencia: c.referencia,
        latitud: lat + Number(c.n) * 0.00008,
        longitud: lon - Number(c.n) * 0.00006,
        estado: c.estado,
        prioridad: c.prioridad,
        evaluadaPor: evaluada ? (Number(c.n) % 2 ? mediador.id : directiva.id) : null,
        fechaEvaluacion: evaluada ? new Date(registro.getTime() + DIA) : null,
        motivoRechazo: c.motivoRechazo,
        fechaCierre:
          c.estado === "RESUELTO" || c.estado === "DERIVADO_ENTIDAD_EXTERNA"
            ? new Date(registro.getTime() + 4 * DIA)
            : null,
        fechaRegistro: registro,
        denuncianteId: personas[c.de],
        registradaPor: c.n === "4" ? mediador.id : null,
        consentimientoVersion: VERSION_POLITICA,
        consentimientoEn: registro,
      },
    });
    await prisma.queja.update({
      where: { id: queja.id },
      data: {
        codigoTicket: `Q-${registro.getUTCFullYear()}-${String(queja.numero).padStart(5, "0")}-${SUFIJOS[Number(c.n) - 1]}`,
      },
    });
    if (c.accion)
      await prisma.accionCorrectiva.create({
        data: {
          quejaId: queja.id,
          medida: c.accion[0],
          detalle: c.accion[1],
          fecha: new Date(registro.getTime() + 3 * DIA),
          responsableId: mediador.id,
        },
      });
    if (c.entidad)
      await prisma.expedienteDerivacion.create({
        data: {
          quejaId: queja.id,
          entidad: c.entidad,
          fecha: new Date(registro.getTime() + 3 * DIA),
          responsableId: directiva.id,
        },
      });
  }
}

// ---------- Garita, visitas, privacidad, avisos y auditoría ----------
async function sembrarGarita(vigilante: { id: string; nombre: string }) {
  const por = async (dni: string) =>
    prisma.usuario.findUnique({
      where: { dni },
      include: { residencias: { where: { fechaFin: null }, include: { predio: true } } },
    });
  const marta = await por("40000002");
  const carmen = await por("08123478");
  const julio = await por("40000006");
  const rosa = await por("40000007");
  if (!marta || !carmen || !julio || !rosa) return;
  const casaDe = (u: NonNullable<typeof marta>) => u.residencias[0].predio;
  const viv = (u: NonNullable<typeof marta>) => `Mz. ${casaDe(u).manzana}, lote ${casaDe(u).lote}`;

  const visitas: Prisma.VisitaUncheckedCreateInput[] = [
    {
      predioId: casaDe(marta).id,
      registradaPor: marta.id,
      nombre: "Patricia Vílchez (prima)",
      dni: "09876543",
      desde: dentroDe(0, "18:00"),
      hasta: dentroDe(0, "21:00"),
      estado: "PROGRAMADA",
      creadaEn: haceDias(1),
    },
    {
      predioId: casaDe(marta).id,
      registradaPor: marta.id,
      nombre: "Juan Quispe, gasfitero",
      desde: haceDias(1, "10:00"),
      hasta: haceDias(1, "13:00"),
      estado: "LLEGO",
      llegoEn: haceDias(1, "10:12"),
      creadaEn: haceDias(2),
    },
    {
      predioId: casaDe(marta).id,
      registradaPor: marta.id,
      nombre: "Delivery de Rappi",
      desde: haceDias(3, "20:00"),
      hasta: haceDias(3, "23:00"),
      estado: "ANULADA",
      anuladaEn: haceDias(3, "19:30"),
      creadaEn: haceDias(3),
    },
    {
      predioId: casaDe(carmen).id,
      registradaPor: carmen.id,
      nombre: "Dra. Lucía Paredes (visita médica)",
      desde: dentroDe(1, "11:00"),
      hasta: dentroDe(1, "14:00"),
      estado: "PROGRAMADA",
      conVehiculo: true,
      placa: "LPG-452",
      creadaEn: haceDias(1),
    },
    {
      predioId: casaDe(carmen).id,
      registradaPor: vigilante.id,
      nombre: "Repartidor de la botica",
      desde: new Date(AHORA.getTime() - 10 * 60_000),
      hasta: new Date(AHORA.getTime() + 20 * 60_000),
      estado: "ESPERANDO_RESPUESTA",
      anunciada: false,
      motivo: "Trae unas medicinas a nombre de la señora Carmen.",
      creadaEn: new Date(AHORA.getTime() - 10 * 60_000),
    },
    {
      predioId: casaDe(julio).id,
      registradaPor: julio.id,
      nombre: "Carlos Mendoza (hermano)",
      desde: haceDias(2, "15:00"),
      hasta: haceDias(2, "18:00"),
      estado: "LLEGO",
      llegoEn: haceDias(2, "15:20"),
      creadaEn: haceDias(4),
    },
  ];
  for (const v of visitas) {
    if (await prisma.visita.findFirst({ where: { predioId: v.predioId, nombre: v.nombre, desde: v.desde } }))
      continue;
    await prisma.visita.create({ data: v });
  }

  // La bitácora de la garita: tres días de movimiento.
  if (!(await prisma.registroAcceso.count({ where: { detalle: { startsWith: "demo:" } } }))) {
    type R = [
      number,
      string,
      "ENTRADA" | "SALIDA",
      "VECINO_REJA" | "VECINO_A_MANO" | "EMERGENCIA" | "VISITA" | "NO_ENTRO",
      string,
      string | null,
      string,
      string | null,
    ];
    const filas: R[] = [
      [3, "06:40", "SALIDA", "VECINO_REJA", "Marta Rojas", "ABC-123", viv(marta), null],
      [3, "08:15", "ENTRADA", "VISITA", "Delivery de pan", null, "Mz. B, lote 2", "Entregó en la reja"],
      [3, "18:50", "ENTRADA", "VECINO_REJA", "Marta Rojas", "ABC-123", viv(marta), null],
      [
        3,
        "21:30",
        "ENTRADA",
        "NO_ENTRO",
        "Persona sin identificar",
        null,
        "Mz. C, lote 10",
        "No dio el nombre de ninguna familia",
      ],
      [2, "07:05", "SALIDA", "VECINO_REJA", "Rosa Díaz", "CDF-220", "Mz. B, lote 2", null],
      [2, "15:20", "ENTRADA", "VISITA", "Carlos Mendoza", null, viv(julio), null],
      [2, "17:55", "SALIDA", "VISITA", "Carlos Mendoza", null, viv(julio), null],
      [
        2,
        "22:10",
        "ENTRADA",
        "VECINO_A_MANO",
        "Julio Mendoza",
        "JLM-314",
        viv(julio),
        "La reja no se abre sola por su atraso de cuotas",
      ],
      [
        1,
        "02:40",
        "ENTRADA",
        "EMERGENCIA",
        "Ambulancia de la clínica",
        null,
        viv(carmen),
        "Descompensación de la señora Carmen; la reja se abrió por emergencia",
      ],
      [1, "10:12", "ENTRADA", "VISITA", "Juan Quispe, gasfitero", null, viv(marta), null],
      [1, "13:05", "SALIDA", "VISITA", "Juan Quispe, gasfitero", null, viv(marta), null],
      [1, "19:20", "ENTRADA", "VECINO_REJA", "Elena Soto", "EDS-108", "Mz. D, lote 9", null],
      [0, "07:30", "SALIDA", "VECINO_REJA", "Elena Soto", "ESM-021", "Mz. D, lote 9", null],
      [0, "08:50", "ENTRADA", "VISITA", "Técnico de internet", null, "Mz. A, lote 5", "Instalación de fibra"],
    ];
    for (const [atras, hora, tipo, modo, quien, placa, vivienda, detalle] of filas) {
      await prisma.registroAcceso.create({
        data: {
          fecha: haceDias(atras, hora),
          tipo,
          modo,
          quien,
          placa,
          vivienda,
          vigilanteId: vigilante.id,
          detalle: `demo:${detalle ?? "sin observaciones"}`,
        },
      });
    }
  }

  // Solicitudes de privacidad (Ley 29733) para el administrador.
  const arco: [
    string,
    "RECTIFICACION" | "ACCESO" | "OPOSICION" | "CANCELACION",
    "PENDIENTE" | "RESUELTA_SOLA",
    string,
    number,
  ][] = [
    ["40000007", "RECTIFICACION", "PENDIENTE", "Cambié de número de WhatsApp porque perdí mi chip.", 2],
    ["08123478", "ACCESO", "RESUELTA_SOLA", "Quiero saber qué datos suyos tiene la junta.", 9],
    [
      "40000006",
      "OPOSICION",
      "RESUELTA_SOLA",
      "No quiero que se vea la ubicación exacta de mis reportes.",
      14,
    ],
  ];
  for (const [dni, tipo, estado, detalle, atras] of arco) {
    const u = await prisma.usuario.findUnique({ where: { dni } });
    if (!u || (await prisma.solicitudArco.findFirst({ where: { usuarioId: u.id, tipo, detalle } }))) continue;
    await prisma.solicitudArco.create({
      data: {
        usuarioId: u.id,
        tipo,
        estado,
        campo: tipo === "RECTIFICACION" ? "WHATSAPP" : null,
        valorAnterior: tipo === "RECTIFICACION" ? "51900000007" : null,
        valorNuevo: tipo === "RECTIFICACION" ? "51987654321" : null,
        detalle,
        creadaEn: haceDias(atras),
        resueltaEn: estado === "RESUELTA_SOLA" ? haceDias(atras) : null,
        resueltaPor: estado === "RESUELTA_SOLA" ? "El sistema" : null,
      },
    });
  }
}

async function sembrarAvisos() {
  const por = async (dni: string) => (await prisma.usuario.findUnique({ where: { dni } }))?.id;
  const avisos: [
    string,
    "PAGOS" | "ASAMBLEAS" | "REPORTES" | "GARITA" | "NOTICIAS" | "CUENTA",
    string,
    string,
    number,
    boolean,
  ][] = [
    [
      "40000002",
      "ASAMBLEAS",
      "Asamblea ordinaria de noviembre",
      "Quedan pocos días para confirmar su asistencia. La asamblea es el " +
        new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", timeZone: "America/Lima" }).format(
          dentroDe(6),
        ) +
        " a las 7 p. m.",
      3,
      false,
    ],
    [
      "40000002",
      "PAGOS",
      "Aprobamos su pago",
      "Se aprobó el pago de su casa y ya puede ver su recibo.",
      12,
      true,
    ],
    [
      "40000002",
      "NOTICIAS",
      "Corte de agua el jueves",
      "Se cortará el agua de 8 a. m. a 2 p. m. Llene sus tanques el día anterior.",
      3,
      false,
    ],
    [
      "08123478",
      "PAGOS",
      "Su cuota de la semana ya está lista",
      "Su cuota semanal ya está disponible. Puede pagarla o pedir que vayan a cobrarle.",
      1,
      false,
    ],
    [
      "08123478",
      "GARITA",
      "Hay una persona en la puerta",
      "Un repartidor de la botica pregunta por usted. Responda desde la app.",
      0,
      false,
    ],
    [
      "08123478",
      "REPORTES",
      "Su reporte está en revisión",
      "La junta está revisando su reporte del poste apagado en la Mz. C.",
      5,
      true,
    ],
    [
      "40000006",
      "PAGOS",
      "Su casa tiene cuotas atrasadas",
      "Debe 9 semanas. La reja ya no se abre sola; puede ponerse al día pagando en efectivo o por Yape.",
      2,
      false,
    ],
    [
      "40000006",
      "REPORTES",
      "Resolvimos su reporte",
      "El reporte N.º de la cochera tapada ya fue atendido por el mediador.",
      21,
      true,
    ],
    [
      "40000007",
      "PAGOS",
      "Recibimos su comprobante",
      "Su pago está en revisión. Le avisaremos apenas lo revisen.",
      1,
      true,
    ],
    [
      "40000008",
      "PAGOS",
      "Recibimos su reclamo",
      "La directiva revisará el monto de su cuota y le responderá pronto.",
      2,
      false,
    ],
    [
      "40000009",
      "NOTICIAS",
      "Ya cambiaron la luminaria de la Mz. C",
      "Gracias por avisar. La calle ya está iluminada.",
      9,
      true,
    ],
    [
      "40000001",
      "CUENTA",
      "Dos solicitudes de privacidad por resolver",
      "Hay solicitudes que vencen en los próximos días.",
      1,
      false,
    ],
    [
      "40000003",
      "REPORTES",
      "Hay dos reportes por evaluar",
      "Revise los reportes recibidos en la bandeja de incidentes.",
      1,
      false,
    ],
    [
      "40000004",
      "GARITA",
      "Nueva lista de la garita",
      "La lista de casas al día se actualizó. Una casa pasó a rojo.",
      2,
      true,
    ],
  ];
  for (const [dni, tipo, titulo, texto, atras, leida] of avisos) {
    const destinatarioId = await por(dni);
    if (!destinatarioId || (await prisma.notificacion.findFirst({ where: { destinatarioId, titulo } })))
      continue;
    const creada = haceDias(atras, "09:30");
    const aviso = await prisma.avisoEnCola.create({
      data: {
        destinatarioId,
        tipo,
        titulo,
        texto,
        estado: "SIN_CANAL_EXTERNO",
        creadoEn: creada,
        intentos: 0,
      },
    });
    await prisma.notificacion.create({
      data: {
        destinatarioId,
        tipo,
        titulo,
        texto,
        avisoId: aviso.id,
        creadaEn: creada,
        leidaEn: leida ? new Date(creada.getTime() + 2 * 3_600_000) : null,
      },
    });
  }
}

async function sembrarAuditoria(ids: { admin: string; marta: string; pedro: string }) {
  if (await prisma.registroAuditoria.findFirst({ where: { entidadId: "demo" } })) return;
  const hechos: [number, string, string, string, string][] = [
    [18, ids.admin, "empadronar", "predio", "Mz. D, lote 12"],
    [16, ids.marta, "publicar_convocatoria", "convocatoria", "Asamblea ordinaria de octubre"],
    [14, ids.pedro, "registrar_queja_asistida", "queja", "Reporte de seguridad en la Mz. C"],
    [12, ids.marta, "aprobar_pago", "pago", "Pago de Mz. A, lote 5"],
    [9, ids.marta, "publicar_comunicado", "publicacion", "Ya cambiaron la luminaria de la Mz. C"],
    [7, ids.pedro, "registrar_cobro_en_efectivo", "pago", "Cobro en efectivo en Mz. C, lote 2"],
    [5, ids.marta, "registrar_movimiento_caja", "movimiento", "Cambio de candado y bisagras de la reja"],
    [4, ids.admin, "dar_acceso_equipo", "usuario", "Luis Paredes"],
    [3, ids.marta, "publicar_actividad", "convocatoria", "Parrillada por las luminarias"],
    [2, ids.pedro, "admitir_queja", "queja", "Dos personas rondan de noche por la Mz. C"],
    [1, ids.marta, "decidir_propuesta", "propuesta", "Turno de vigilancia los domingos"],
  ];
  for (const [atras, actorId, accion, entidad] of hechos) {
    await prisma.registroAuditoria.create({
      data: {
        fecha: haceDias(atras, "11:00"),
        actorId,
        accion,
        entidad,
        entidadId: "demo",
        despues: { nota: "Dato de demostración" },
      },
    });
  }
}

export async function sembrarDemo() {
  const enNube = permitirNube();
  if (!enNube) await sembrar();
  const por = async (dni: string) => {
    const u = await prisma.usuario.findUnique({ where: { dni } });
    if (!u) throw new Error("Faltan las personas base: corra primero las semillas (npm run semillas).");
    return { id: u.id, nombre: u.nombreCompleto };
  };
  const [admin, marta, pedro, luis] = await Promise.all([
    por("40000001"),
    por("40000002"),
    por("40000003"),
    por("40000004"),
  ]);
  await sembrarPadron();
  await sembrarCobros(marta, pedro);
  await sembrarTransparencia(marta, pedro);
  await sembrarAsambleas(marta, pedro);
  await sembrarActividades(marta);
  await sembrarIncidentes(marta, pedro);
  await sembrarGarita(luis);
  await sembrarAvisos();
  await sembrarAuditoria({ admin: admin.id, marta: marta.id, pedro: pedro.id });
  const [predios, pagos, quejas, convocatorias] = await Promise.all([
    prisma.predio.count(),
    prisma.pago.count(),
    prisma.queja.count(),
    prisma.convocatoria.count(),
  ]);
  return { predios, pagos, quejas, convocatorias };
}

if (require.main === module) {
  sembrarDemo()
    .then((r) =>
      console.log(
        `Datos de demostración listos: ${r.predios} casas, ${r.pagos} pagos, ${r.quejas} reportes y ${r.convocatorias} convocatorias.`,
      ),
    )
    .catch((error: Error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
