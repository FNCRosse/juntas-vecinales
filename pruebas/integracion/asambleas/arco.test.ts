import { randomUUID } from "node:crypto";
import { PATCH as resolverHttp } from "@/app/api/arco/solicitudes/[id]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { colaborar, publicarActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { confirmarAsistencia, publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import { anonimizar, datosPersonales } from "@/modulos/asambleas/aplicacion/datosPersonales";
import { delegarVoto } from "@/modulos/asambleas/aplicacion/delegaciones";
import { proponerTema } from "@/modulos/asambleas/aplicacion/propuestas";
import { ofrecerAyuda } from "@/modulos/asambleas/aplicacion/voluntarios";
import { solicitarCancelacion } from "@/modulos/identidad/aplicacion/arco";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const AHORA = new Date("2026-12-01T12:00:00Z");
const ROSA = { nombre: "Rosa Huamán", dni: "08123456", condicion: "FAMILIAR" as const };

let directiva: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let asambleaId: string;
let actividadId: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

/** Carmen confirma, delega, propone, aporta y se ofrece de voluntaria; Julio solo confirma. */
async function llenar() {
  await confirmarAsistencia(carmen, asambleaId, AHORA);
  await confirmarAsistencia(julio, asambleaId, AHORA);
  await delegarVoto(carmen, asambleaId, ROSA, AHORA);
  await proponerTema(
    carmen,
    asambleaId,
    { titulo: "Cambiar la reja", justificacion: "Está oxidada.", idOperacion: randomUUID() },
    AHORA,
  );
  await colaborar(
    carmen,
    actividadId,
    { cantidad: 2, modalidad: "EN_PUERTA", idOperacion: randomUUID() },
    AHORA,
  );
  await ofrecerAyuda(
    julio,
    actividadId,
    { descripcion: "Atiendo la mesa, llámeme al 987654321.", idOperacion: randomUUID() },
    AHORA,
  );
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones, asambleas_delegaciones, asambleas_propuestas, asambleas_eventos, asambleas_colaboraciones, asambleas_voluntarios CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  asambleaId = (
    await publicarConvocatoria(
      directiva,
      {
        tipoAsamblea: "ORDINARIA",
        fechaHora: new Date("2026-12-14T23:00:00Z"),
        lugar: "Local comunal",
        motivo: "Aprobar el presupuesto.",
        idOperacion: randomUUID(),
      },
      AHORA,
    )
  ).asamblea.id;
  actividadId = (
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
        pideVoluntarios: true,
        idOperacion: randomUUID(),
      },
      AHORA,
    )
  ).actividad.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-12 Asambleas en la copia de datos", () => {
  it("@HU-GAR-12 CA1 la copia trae su asistencia, su poder, su propuesta y su aporte, sin el DNI del apoderado", async () => {
    await llenar();
    const [seccion] = await datosPersonales(carmen.usuarioId);
    expect(seccion.titulo).toBe("Asambleas y actividades");
    const texto = JSON.stringify(seccion.filas);
    expect(texto).toContain("Asistencia a");
    expect(texto).toContain("Rosa Huamán, familiar · DNI terminado en 56");
    expect(texto).toContain("«Cambiar la reja» · Pendiente de revisión");
    expect(texto).toContain("2 · S/ 30.00 · Agendada para el cobro");
    expect(texto).not.toContain("08123456");
  });

  it("@HU-GAR-12 AC-7 la copia de una persona no trae lo de otra casa", async () => {
    await llenar();
    const texto = JSON.stringify(await datosPersonales(julio.usuarioId));
    expect(texto).toContain("Voluntariado en");
    expect(texto).not.toContain("Rosa Huamán");
    expect(texto).not.toContain("Cambiar la reja");
    expect(texto).not.toContain("Aporte a");
  });

  it("@HU-GAR-12 CA1 sin registros la sección lo dice", async () => {
    expect((await datosPersonales(carmen.usuarioId))[0].filas).toEqual([
      ["Asambleas y actividades", "No tiene registros."],
    ]);
  });
});

describe("@HU-GAR-14 Asambleas en la cancelación", () => {
  it("@HU-GAR-14 CA3 anonimizar borra el nombre y el DNI del apoderado y el texto libre; deja la memoria de la junta", async () => {
    await llenar();
    await prisma.$transaction((tx) => anonimizar(carmen.usuarioId, tx));
    await prisma.$transaction((tx) => anonimizar(julio.usuarioId, tx));
    expect(await prisma.delegacionVoto.findFirstOrThrow()).toMatchObject({
      apoderadoNombre: "Persona anonimizada",
      apoderadoDniFinal: "00",
    });
    expect((await prisma.delegacionVoto.findFirstOrThrow()).apoderadoDniHash).toMatch(/^anonimizado-/);
    expect((await prisma.voluntariado.findFirstOrThrow()).descripcion).not.toContain("987654321");
    // La junta conserva qué se propuso y cuánto se aportó, sin nombre (el usuario ya no lo tiene).
    expect(await prisma.propuestaAgenda.count()).toBe(1);
    expect((await prisma.colaboracion.findFirstOrThrow()).monto).toBe(3000);
    expect(await prisma.confirmacionAsistencia.count()).toBe(2);
  });

  it("@HU-GAR-14 CA3 al aprobar la cancelación por la ruta del administrador, también se anonimiza lo de asambleas", async () => {
    await llenar();
    const { token } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" });
    const { id } = await solicitarCancelacion(carmen, { motivo: "MUDANZA" }, AHORA);
    const respuesta = await resolverHttp(
      new Request(`http://localhost/api/arco/solicitudes/${id}`, {
        method: "PATCH",
        headers: { cookie: `sesion=${token}` },
        body: JSON.stringify({ aprobar: true }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(respuesta.status).toBe(200);
    expect((await prisma.delegacionVoto.findFirstOrThrow()).apoderadoNombre).toBe("Persona anonimizada");
  });
});
