/** La conexión que consulta: la primera IP de x-forwarded-for (Vercel la pone). */
export const ipDe = (peticion: Request) =>
  peticion.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
