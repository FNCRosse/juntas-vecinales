// @HU-GAR-01
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { ErrorConflicto, ErrorValidacion } from "@/compartido/errores";
import {
  NOMBRE_RELACION,
  type PersonaEnFormulario,
  type PersonaNueva,
  revisarPersonas,
  telefonoCompleto,
} from "@/modulos/identidad/dominio/empadronamiento";
import { type DatosPredio, direccion, normalizarPredio } from "@/modulos/identidad/dominio/predio";
import {
  buscarPersonasPorDni,
  buscarPredioPorLote,
  crearVivienda,
  esDuplicado,
} from "@/modulos/identidad/infraestructura/repositorioPadron";
import { emitirEnlace } from "./emitirEnlace";
import { exigirRol, type SesionDto } from "./sesion";

export type DatosEmpadronamiento = {
  vivienda: DatosPredio;
  titular?: Omit<PersonaNueva, "relacion" | "cuentaPropia">;
  otros?: (Omit<PersonaNueva, "relacion"> & { relacion: Exclude<PersonaNueva["relacion"], "TITULAR"> })[];
};

export type ViviendaEmpadronada = {
  predioId: string;
  direccion: string;
  titular: string;
  enlacesEnviados: { nombre: string; relacion: string; telefono: string }[];
  registradoEn: string;
  registradoPor: string;
};

export const MENSAJE_YA_REGISTRADO =
  "Mientras revisaba, alguien registró este lote o uno de estos DNI. Revise los datos y vuelva a intentarlo.";

function personasDe(datos: DatosEmpadronamiento): PersonaEnFormulario[] {
  const limpiar = (persona: PersonaNueva) => ({
    ...persona,
    nombreCompleto: persona.nombreCompleto.trim(),
    telefono: persona.cuentaPropia ? persona.telefono : undefined,
  });
  return [
    ...(datos.titular
      ? [
          {
            prefijo: "titular",
            persona: limpiar({ ...datos.titular, relacion: "TITULAR", cuentaPropia: true }),
          },
        ]
      : []),
    ...(datos.otros ?? []).map((persona, i) => ({ prefijo: `otros.${i}`, persona: limpiar(persona) })),
  ];
}

/**
 * Revisa todo lo que se puede revisar antes de guardar: el lote libre, los DNI que no están en el
 * padrón (CA3) y las reglas de las personas. Sirve a cada paso del asistente y al guardar.
 */
export async function validarEmpadronamiento(sesion: SesionDto, datos: DatosEmpadronamiento) {
  exigirRol(sesion, "ADMINISTRADOR");
  const normalizado = normalizarPredio(datos.vivienda);
  const { predio } = normalizado;
  const errores = Object.fromEntries(
    Object.entries(normalizado.errores).map(([campo, mensaje]) => [`vivienda.${campo}`, mensaje]),
  );
  const personas = personasDe(datos);
  Object.assign(errores, revisarPersonas(personas));

  if (predio.manzana && predio.lote) {
    const ocupado = await buscarPredioPorLote(predio.manzana, predio.lote);
    if (ocupado) {
      const titular = ocupado.residencias[0]?.usuario.nombreCompleto;
      errores["vivienda.lote"] =
        `Ese lote ya está en el padrón${titular ? `: es de ${titular}` : ""}. Si quiere agregar a alguien, hágalo desde su ficha.`;
    }
  }
  const registradas = await buscarPersonasPorDni(personas.map(({ persona }) => persona.dni));
  for (const { prefijo, persona } of personas) {
    const registrada = registradas.find((r) => r.dni === persona.dni);
    if (!registrada) continue;
    const residencia = registrada.residencias[0];
    errores[`${prefijo}.dni`] = residencia
      ? `Este DNI ya está en el padrón: ${registrada.nombreCompleto}, ${direccion(residencia.predio)}. Una persona no puede estar dos veces. Si se mudó, primero dele de baja en esa vivienda.`
      : `Este DNI ya tiene una cuenta: ${registrada.nombreCompleto}. Una persona no puede estar dos veces.`;
  }

  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  return { predio, personas: personas.map(({ persona }) => persona) };
}

/**
 * Empadrona una vivienda con sus residentes y envía el enlace de entrada a cada cuenta propia
 * (HU-GAR-01). Todo en una transacción, con la auditoría del administrador que lo hizo (CA3, AC-6).
 */
export async function empadronar(
  sesion: SesionDto,
  datos: DatosEmpadronamiento,
  origen: string,
  ahora = new Date(),
): Promise<ViviendaEmpadronada> {
  if (!datos.titular)
    throw new ErrorValidacion(undefined, { "titular.dni": "Faltan los datos del titular." });
  const { predio, personas } = await validarEmpadronamiento(sesion, datos);
  const conTelefono = personas.map((p) => ({ ...p, telefono: p.telefono && telefonoCompleto(p.telefono) }));
  try {
    return await prisma.$transaction(async (tx) => {
      const { predioId, usuarios } = await crearVivienda(tx, predio, conTelefono);
      const enviados = [];
      for (const [i, usuario] of usuarios.entries()) {
        if (!conTelefono[i].cuentaPropia) continue;
        await emitirEnlace(tx, usuario, origen, ahora);
        enviados.push({
          nombre: usuario.nombreCompleto,
          relacion: NOMBRE_RELACION[conTelefono[i].relacion],
          telefono: personas[i].telefono ?? "",
        });
      }
      const { fecha } = await registrarAuditoria(
        {
          actorId: sesion.usuarioId,
          accion: "empadronar",
          entidad: "Predio",
          entidadId: predioId,
          antes: null,
          despues: {
            ...predio,
            residentes: usuarios.map((usuario, i) => ({
              usuarioId: usuario.id,
              relacion: conTelefono[i].relacion,
              dniVerificadoEnFisico: true,
              enlaceEnviado: conTelefono[i].cuentaPropia,
            })),
          },
        },
        tx,
      );
      return {
        predioId,
        direccion: direccion(predio),
        titular: usuarios[0].nombreCompleto,
        enlacesEnviados: enviados,
        registradoEn: fecha.toISOString(),
        registradoPor: sesion.nombreCompleto,
      };
    });
  } catch (error) {
    if (esDuplicado(error)) throw new ErrorConflicto(MENSAJE_YA_REGISTRADO);
    throw error;
  }
}
