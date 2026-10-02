import { cifrarClave } from "../claves";
import { prisma } from "./cliente";

// Cuenta inicial del administrador en producción (el prototipo asume que existe, Anexo M §6). La
// corre la autora con sus datos en variables de entorno: nada de esto se escribe en el repositorio.
//   ADMIN_INICIAL_NOMBRE, ADMIN_INICIAL_DNI, ADMIN_INICIAL_CLAVE y DATABASE_URL de producción.

export async function crearAdministradorInicial(entorno: Record<string, string | undefined> = process.env) {
  const {
    ADMIN_INICIAL_NOMBRE: nombreCompleto,
    ADMIN_INICIAL_DNI: dni,
    ADMIN_INICIAL_CLAVE: clave,
  } = entorno;
  if (!nombreCompleto || !dni || !/^\d{8}$/.test(dni) || !clave || clave.length < 12) {
    throw new Error(
      "Faltan ADMIN_INICIAL_NOMBRE, ADMIN_INICIAL_DNI (8 números) o ADMIN_INICIAL_CLAVE (12 caracteres o más).",
    );
  }
  if (await prisma.usuario.count({ where: { roles: { has: "ADMINISTRADOR" } } })) {
    throw new Error("Ya existe una cuenta de administrador: las siguientes se crean desde Equipo.");
  }
  const usuario = await prisma.usuario.create({
    data: { nombreCompleto, dni, roles: ["ADMINISTRADOR"], credencial: { create: await cifrarClave(clave) } },
  });
  return usuario.id;
}

if (require.main === module) {
  crearAdministradorInicial()
    .then(() => console.log("Cuenta de administrador creada."))
    .catch((error: Error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
