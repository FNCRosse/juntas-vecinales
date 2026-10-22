import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado } from "@/compartido/errores";
import { cambiarTarifa } from "@/modulos/aportes/aplicacion/tarifa";
import { historialDeLaDirectiva } from "@/modulos/identidad/aplicacion/auditoria";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const AHORA = new Date("2026-09-26T15:00:00Z");

let marta: SesionDto;
let pedro: SesionDto;
let carmen: SesionDto;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
  await sembrar("clave-de-prueba");
  marta = await sesionDe("40000002");
  pedro = await sesionDe("40000003");
  carmen = await sesionDe("08123478");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-16 CA3 Historial de acciones de la directiva (DIR-INI-05)", () => {
  it("@HU-COB-16 CA3 la directiva y el mediador ven qué se hizo, quién y cuándo; el vecino no", async () => {
    await cambiarTarifa(
      marta,
      {
        concepto: "auto",
        monto: 250,
        vigencia: "2026-10-05",
        acta: "Acta de asamblea del 20 de setiembre de 2026",
        idOperacion: randomUUID(),
      },
      AHORA,
    );
    for (const sesion of [marta, pedro]) {
      const [primera] = await historialDeLaDirectiva(sesion);
      expect(primera).toMatchObject({
        texto: "Programó un cambio de tarifa",
        responsable: "Marta Rojas",
      });
      expect(primera.detalle).toContain("Concepto: Auto o camioneta");
      expect(primera.detalle).toContain("Monto: S/ 2.50");
    }
    await expect(historialDeLaDirectiva(carmen)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-16 CA3 solo trae cobros, asambleas y transparencia, y del resto solo lo que se hizo", async () => {
    await prisma.$transaction(async (tx) => {
      await registrarAuditoria(
        {
          actorId: marta.usuarioId,
          accion: "empadronar",
          entidad: "Predio",
          entidadId: "p1",
          antes: null,
          despues: { manzana: "A" },
        },
        tx,
      );
      await registrarAuditoria(
        {
          actorId: carmen.usuarioId,
          accion: "delegar_voto",
          entidad: "Delegacion",
          entidadId: "d1",
          antes: null,
          despues: { apoderado: "Rosa Huamán", dniFinal: "56" },
        },
        tx,
      );
    });
    const historial = await historialDeLaDirectiva(marta);
    const delegacion = historial.find((h) => h.texto === "Registró una delegación de voto");
    expect(delegacion).toMatchObject({ responsable: "Carmen Huamán", detalle: null });
    expect(historial.map((h) => h.texto)).not.toContain("Empadronó una vivienda");
  });
});
