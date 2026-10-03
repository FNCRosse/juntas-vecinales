import { z } from "zod";

export const esquemaActa = z.object({
  titulo: z.string(),
  fechaAsamblea: z.string(),
  acuerdos: z.string(),
  compromisos: z.string().default(""),
  conclusiones: z.string().default(""),
});
