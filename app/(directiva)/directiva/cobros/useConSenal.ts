// @HU-COB-11
import { useSyncExternalStore } from "react";

const suscribir = (alCambiar: () => void) => {
  window.addEventListener("online", alCambiar);
  window.addEventListener("offline", alCambiar);
  return () => {
    window.removeEventListener("online", alCambiar);
    window.removeEventListener("offline", alCambiar);
  };
};

/** Si el teléfono tiene señal ahora; se actualiza solo cuando se va o vuelve. En el servidor se supone que sí hay. */
export const useConSenal = () =>
  useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true,
  );
