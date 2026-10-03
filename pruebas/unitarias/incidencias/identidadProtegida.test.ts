import { randomBytes } from "node:crypto";
import { cifrar, descifrar, hashDenunciante } from "@/modulos/incidencias/infraestructura/identidadProtegida";

const entorno = { CLAVE_CIFRADO: randomBytes(32).toString("base64") };
const otra = { CLAVE_CIFRADO: randomBytes(32).toString("base64") };
const ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";

describe("@HU-QUE-02 Identidad protegida del denunciante", () => {
  it("@HU-QUE-02 CA2 cifra el id con AES-256-GCM: el texto guardado no lo contiene y solo la clave lo abre", () => {
    const datos = cifrar(ID, entorno);
    expect(datos).not.toContain(ID);
    expect(cifrar(ID, entorno)).not.toBe(datos);
    expect(descifrar(datos, entorno)).toBe(ID);
    expect(() => descifrar(datos, otra)).toThrow();
  });

  it("@HU-QUE-02 CA2 el hash es estable para la misma persona y no revela su id", () => {
    const hash = hashDenunciante(ID, entorno);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashDenunciante(ID, entorno)).toBe(hash);
    expect(hashDenunciante("otra-persona", entorno)).not.toBe(hash);
    expect(hashDenunciante(ID, otra)).not.toBe(hash);
  });

  it("@HU-QUE-02 sin CLAVE_CIFRADO válida no registra nada anónimo", () => {
    expect(() => cifrar(ID, {})).toThrow("Falta CLAVE_CIFRADO");
    expect(() => hashDenunciante(ID, { CLAVE_CIFRADO: "corta" })).toThrow("Falta CLAVE_CIFRADO");
  });
});
