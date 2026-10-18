// @HU-ASA-14
// Re-exporta los motivos que ofrece la pantalla de propuestas. Va aparte de propuestas.ts porque ese archivo
// importa la base de datos y un componente de cliente no puede traerla al navegador.
export { MOTIVOS_DE_DESCARTE } from "@/modulos/asambleas/dominio/propuesta";
