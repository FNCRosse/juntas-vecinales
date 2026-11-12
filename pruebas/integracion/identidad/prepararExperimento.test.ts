import { prisma } from "@/compartido/bd/cliente";
import { LARGO_MINIMO_CLAVE, prepararExperimento } from "@/compartido/bd/prepararExperimento";
import { LARGO_MINIMO_CLAVE as LARGO_DE_LA_WEB } from "@/modulos/identidad/dominio/credencialRespaldo";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";

// Guion de preparación del experimento R3.2: clave para los vecinos de demostración y cierre de
// las convocatorias de prueba, sin tocar ninguna otra cuenta ni convocatoria.

const CLAVE = "clave-del-experimento";

async function sembrarCaso() {
  await prisma.$executeRaw`TRUNCATE identidad_sesiones, identidad_credenciales, identidad_usuarios, asambleas_convocatorias CASCADE`;
  await prisma.usuario.createMany({
    data: [
      { nombreCompleto: "Vecina de demostración", dni: "41000001", roles: ["VECINO"] },
      { nombreCompleto: "Vecino de demostración", dni: "41000016", roles: ["VECINO"] },
      { nombreCompleto: "Fuera del rango", dni: "41000017", roles: ["VECINO"] },
      { nombreCompleto: "Segundo residente", dni: "41000102", roles: ["VECINO"] },
      { nombreCompleto: "Directiva en el rango", dni: "41000002", roles: ["DIRECTIVA"] },
    ],
  });
  const autor = await prisma.usuario.create({
    data: { nombreCompleto: "Marta", dni: "40000002", roles: ["DIRECTIVA"] },
  });
  const base = {
    tipo: "ASAMBLEA" as const,
    fechaHora: new Date("2026-11-27T00:00:00Z"),
    motivo: "m",
    autorId: autor.id,
    autor: "Marta",
  };
  await prisma.convocatoria.createMany({
    data: [
      { ...base, titulo: "De prueba", lugar: "esvdsvsd", idOperacion: "p1" },
      { ...base, titulo: "Real", lugar: "Local comunal", idOperacion: "p2" },
    ],
  });
}

describe("preparación del experimento R3.2", () => {
  beforeEach(sembrarCaso);
  afterAll(() => prisma.$disconnect());

  it("exige una clave del largo mínimo de la web", async () => {
    expect(LARGO_MINIMO_CLAVE).toBe(LARGO_DE_LA_WEB);
    await expect(prepararExperimento({})).rejects.toThrow("Falta EXPERIMENTO_CLAVE");
    await expect(prepararExperimento({ EXPERIMENTO_CLAVE: "1" })).rejects.toThrow("Falta EXPERIMENTO_CLAVE");
  });

  it("sin --aplicar solo informa", async () => {
    const r = await prepararExperimento({ EXPERIMENTO_CLAVE: CLAVE });
    expect(r.vecinos.map((v) => v.dni)).toEqual(["41000001", "41000016", "41000102"]);
    expect(r.convocatorias.map((c) => c.titulo)).toEqual(["De prueba"]);
    expect(await prisma.credencialRespaldo.count()).toBe(0);
    expect(await prisma.convocatoria.count({ where: { estado: "CERRADA" } })).toBe(0);
  });

  it("con --aplicar da clave solo a los vecinos del rango y cierra solo las convocatorias de prueba", async () => {
    await prepararExperimento({ EXPERIMENTO_CLAVE: CLAVE }, true);
    await expect(iniciarSesionConClave({ dni: "41000001", clave: CLAVE })).resolves.toMatchObject({
      sesion: { roles: ["VECINO"] },
    });
    const conClave = await prisma.credencialRespaldo.findMany({
      select: { usuario: { select: { dni: true } } },
    });
    expect(conClave.map((c) => c.usuario.dni).sort()).toEqual(["41000001", "41000016", "41000102"]);
    const cerradas = await prisma.convocatoria.findMany({
      where: { estado: "CERRADA" },
      select: { titulo: true },
    });
    expect(cerradas).toEqual([{ titulo: "De prueba" }]);
    // Repetirlo no falla y deja la clave vigente.
    await prepararExperimento({ EXPERIMENTO_CLAVE: CLAVE }, true);
    await expect(iniciarSesionConClave({ dni: "41000016", clave: CLAVE })).resolves.toBeTruthy();
  });
});
