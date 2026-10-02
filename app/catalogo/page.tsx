import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { Dialogo } from "@/componentes/a11y/Dialogo";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { Tarjeta, TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { DemoConfirmacion } from "./_componentes/DemoConfirmacion";

// Catálogo interno (fase 0b): cada primitiva de componentes/a11y en sus estados, con los textos del
// prototipo. Cypress + axe lo recorre en Normal y Senior, en teléfono y escritorio.
export default async function Catalogo() {
  return (
    <MarcoActor actor="vecino" modoSenior={await modoSeniorAlRenderizar()}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-titulo-1">Catálogo de componentes</h1>
          <p>Página interna para revisar los componentes base. No se publica en producción.</p>
        </div>

        <Tarjeta titulo="Botones">
          <div className="flex flex-col gap-separacion">
            <Boton variante="secundario">Ver mis recibos</Boton>
            <Boton variante="secundario" aria-disabled="true" aria-describedby="motivo-boton">
              Descargar el recibo
            </Boton>
            <p id="motivo-boton" className="text-pequeno text-texto-secundario">
              El recibo estará listo cuando la directiva revise su pago.
            </p>
          </div>
          <div className="pt-12">
            <Boton variante="peligro" anchoCompleto>
              Dar de baja mi cuenta
            </Boton>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Campos">
          <Campo
            name="dni"
            etiqueta="Número de DNI"
            ayuda="Son 8 números. Por ejemplo: 45678912"
            inputMode="numeric"
            autoComplete="off"
          />
          <Campo
            name="telefono"
            etiqueta="Número de celular"
            ayuda="Son 9 números y empieza con 9"
            inputMode="numeric"
            autoComplete="tel"
            defaultValue="98765"
            error="Al número le faltan 4 números. Escríbalo completo, con sus 9 números."
          />
        </Tarjeta>

        <Tarjeta titulo="Opciones">
          <GrupoOpciones id="metodo" pregunta="¿Cómo pagó?">
            <Opcion tipo="radio" name="metodo" value="yape" etiqueta="Con Yape o Plin" defaultChecked />
            <Opcion tipo="radio" name="metodo" value="transferencia" etiqueta="Con transferencia" />
            <Opcion tipo="radio" name="metodo" value="efectivo" etiqueta="En efectivo, en mi casa" />
          </GrupoOpciones>
          <GrupoOpciones
            id="asistencia"
            pregunta="¿Asistirá a la asamblea?"
            error="Falta su respuesta. Elija una opción para continuar."
          >
            <Opcion tipo="radio" name="asistencia" value="si" etiqueta="Sí, asistiré" />
            <Opcion tipo="radio" name="asistencia" value="no" etiqueta="No podré ir" />
          </GrupoOpciones>
          <Opcion
            tipo="checkbox"
            name="avisos"
            etiqueta="Recibir los avisos también por WhatsApp"
            defaultChecked
          />
        </Tarjeta>

        <section className="flex flex-col gap-4" aria-labelledby="titulo-mensajes">
          <h2 id="titulo-mensajes" className="text-titulo-2">
            Mensajes de estado
          </h2>
          <MensajeEstado tipo="exito" titulo="Su pago está al día">
            <p>No tiene cuotas pendientes.</p>
          </MensajeEstado>
          <MensajeEstado tipo="info" titulo="La asamblea es el sábado 18 de octubre">
            <p>Empieza a las 7:00 p. m. en el local comunal.</p>
          </MensajeEstado>
          <MensajeEstado tipo="aviso" titulo="Tiene 2 semanas pendientes">
            <p>Debe S/ 10.00. Puede pagar cuando pueda.</p>
          </MensajeEstado>
          <MensajeEstado tipo="error" titulo="No pudimos enviar su comprobante">
            <p>Revise su conexión a internet y vuelva a intentarlo.</p>
          </MensajeEstado>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="titulo-tarjetas">
          <h2 id="titulo-tarjetas" className="text-titulo-2">
            Tarjetas
          </h2>
          <Tarjeta titulo="Mi cuota semanal" nivel={3}>
            <p className="text-dato font-bold">S/ 5.00</p>
            <p>Casa e inquilino. Se calcula cada lunes.</p>
          </Tarjeta>
          <TarjetaEnlace href="/catalogo/directiva" titulo="Próxima asamblea">
            <p>Sábado 18 de octubre, 7:00 p. m.</p>
          </TarjetaEnlace>
        </section>

        <Tarjeta titulo="Diálogo y confirmación">
          <Dialogo
            disparador={<Boton variante="secundario">Ver cómo se calcula</Boton>}
            titulo="Cómo se calcula su cuota"
            descripcion="La asamblea aprobó estos montos por semana."
          >
            <ul className="flex list-disc flex-col gap-2 pl-6">
              <li>Casa: S/ 2.50</li>
              <li>Inquilino: S/ 2.50</li>
              <li>Auto o camioneta: S/ 5.00</li>
            </ul>
          </Dialogo>
          <DemoConfirmacion />
        </Tarjeta>
      </div>
    </MarcoActor>
  );
}
