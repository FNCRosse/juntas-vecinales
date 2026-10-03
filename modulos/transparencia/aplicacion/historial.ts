// @HU-ASA-12
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { ordenarHistorial } from "@/modulos/transparencia/dominio/historial";
import {
  listarActas,
  listarBalances,
} from "@/modulos/transparencia/infraestructura/repositorioPublicaciones";
import { actaADto } from "./actas";
import { balanceADto } from "./balances";

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

type Actas = ReturnType<typeof actaADto>;
type Balance = ReturnType<typeof balanceADto>;
export type RegistroDeHistorial =
  (Actas & { tipo: "ACTA"; fechaEvento: string }) | (Balance & { tipo: "BALANCE"; fechaEvento: string });

/**
 * El historial público (HU-ASA-12): actas y balances de asambleas y actividades anteriores, del evento más
 * nuevo al más antiguo, para todo vecino con sesión (CA1 y CA3). Cada balance trae sus ingresos, egresos y
 * saldo final (CA2); los comprobantes de los gastos solo los ve la directiva.
 */
export async function historialPublico(sesion: SesionDto): Promise<RegistroDeHistorial[]> {
  exigirRol(sesion, ...ROLES_VECINO);
  const [actas, balances] = await Promise.all([listarActas(), listarBalances()]);
  const registros = [
    ...actas.map((fila) => {
      const dto = actaADto(fila);
      return {
        fechaEvento: fila.acta!.fechaAsamblea,
        fechaPublicacion: fila.fechaPublicacion,
        registro: { ...dto, tipo: "ACTA" as const, fechaEvento: dto.fechaAsamblea },
      };
    }),
    ...balances.map((fila) => {
      const dto = balanceADto(fila, sesion);
      return {
        fechaEvento: fila.balance!.fechaActividad,
        fechaPublicacion: fila.fechaPublicacion,
        registro: { ...dto, tipo: "BALANCE" as const, fechaEvento: dto.fechaActividad },
      };
    }),
  ];
  return ordenarHistorial(registros).map((r) => r.registro);
}
