import { MarcoActor } from "@/componentes/a11y/MarcoActor";
import { modoSeniorAlRenderizar } from "./_accesibilidad/perfil";

// Portada provisional hasta que M1 traiga el acceso y el panel del vecino.
export default async function Inicio() {
  return (
    <MarcoActor modoSenior={await modoSeniorAlRenderizar()}>
      <h1 className="text-titulo-1">Junta Vecinal de Villa de Fátima</h1>
      <p className="mt-4">Estamos preparando la plataforma de la junta. Muy pronto podrá usarla.</p>
    </MarcoActor>
  );
}
