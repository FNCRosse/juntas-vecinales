import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { publicarActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { confirmarAsistencia, publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import { registrarContingencia } from "@/modulos/asambleas/aplicacion/contingencia";
import { bloqueDeInicio } from "@/modulos/asambleas/aplicacion/inicio";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const PUBLICACION = new Date("2026-11-20T12:00:00Z");
const ANTES_DEL_PLAZO = new Date("2026-12-05T12:00:00Z");
const CORTE = new Date("2026-12-14T02:00:00Z");

let directiva: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let asambleaId: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones, asambleas_eventos CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  const { asamblea } = await publicarConvocatoria(
    directiva,
    {
      tipoAsamblea: "ORDINARIA",
      fechaHora: new Date("2026-12-14T23:00:00Z"),
      lugar: "Local comunal",
      motivo: "Aprobar el presupuesto.",
      idOperacion: randomUUID(),
    },
    PUBLICACION,
  );
  asambleaId = asamblea.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-19 Bloque de próximo evento en el inicio (M4)", () => {
  it("@HU-GAR-19 CA1 el inicio muestra la próxima asamblea y si la casa ya confirmó, sin navegar", async () => {
    const antes = await bloqueDeInicio(carmen, ANTES_DEL_PLAZO);
    expect(antes.asamblea).toMatchObject({
      titulo: "Asamblea ordinaria",
      lugar: "Local comunal",
      confirmo: false,
    });

    await confirmarAsistencia(carmen, asambleaId, ANTES_DEL_PLAZO);
    expect((await bloqueDeInicio(carmen, ANTES_DEL_PLAZO)).asamblea?.confirmo).toBe(true);
  });

  it("@HU-GAR-19 AC-7 la confirmación de una casa no aparece en el inicio de otra", async () => {
    await confirmarAsistencia(carmen, asambleaId, ANTES_DEL_PLAZO);
    expect((await bloqueDeInicio(julio, ANTES_DEL_PLAZO)).asamblea?.confirmo).toBe(false);
  });

  it("@HU-GAR-19 CA3 el bloque se actualiza solo: una asamblea convertida en informativa lo dice", async () => {
    await registrarContingencia(
      directiva,
      asambleaId,
      { decision: "INFORMATIVA", nuevaFechaHora: null },
      CORTE,
    );
    expect((await bloqueDeInicio(carmen, CORTE)).asamblea?.estado).toBe("INFORMATIVA");
  });

  it("@HU-GAR-19 sin asamblea convocada el bloque queda vacío", async () => {
    expect((await bloqueDeInicio(carmen, new Date("2027-06-01T12:00:00Z"))).asamblea).toBeNull();
  });

  it("@HU-GAR-19 CA1 el inicio también muestra la próxima actividad pro fondos", async () => {
    expect((await bloqueDeInicio(carmen, ANTES_DEL_PLAZO)).actividad).toBeNull();
    await publicarActividad(
      directiva,
      {
        tipoActividad: "POLLADA",
        nombre: "Pollada pro-fondos para la reja",
        paraQue: "Reparar la reja principal",
        fechaHora: new Date("2026-12-20T17:00:00Z"),
        lugar: "Parque Central",
        precioUnidad: 1500,
        metaRecaudacion: null,
        pagos: "AMBOS",
        pideVoluntarios: false,
        idOperacion: randomUUID(),
      },
      PUBLICACION,
    );
    expect((await bloqueDeInicio(carmen, ANTES_DEL_PLAZO)).actividad).toMatchObject({
      nombre: "Pollada pro-fondos para la reja",
      lugar: "Parque Central",
    });
  });
});
