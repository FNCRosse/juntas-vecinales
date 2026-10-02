import { comprobarBaseDatos } from "@/compartido/bd/salud";

export const dynamic = "force-dynamic";

export async function GET() {
  const bd = await comprobarBaseDatos();
  return Response.json({ estado: bd ? "ok" : "sin_bd" }, { status: bd ? 200 : 503 });
}
