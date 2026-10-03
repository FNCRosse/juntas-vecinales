import { manejar } from "@/compartido/manejar";
import { oficioPorCodigo } from "@/modulos/incidencias/aplicacion/seguimiento";
import { ipDe } from "../../ip";
import { respuestaPdf } from "../../../pdf";

/** El oficio de un reporte derivado, con el código y sin sesión (HU-QUE-07 CA3, HU-QUE-09). */
export const GET = manejar<{ params: Promise<{ codigo: string }> }>(async (peticion, { params }) =>
  respuestaPdf(await oficioPorCodigo(decodeURIComponent((await params).codigo), ipDe(peticion))),
);
