// Fija la fecha del código bajo prueba en el T0 de cada archivo; los temporizadores siguen reales.
export function fijarReloj(ahora: Date) {
  jest.useFakeTimers({
    now: ahora,
    advanceTimers: true,
    doNotFake: [
      "nextTick",
      "setImmediate",
      "clearImmediate",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "queueMicrotask",
      "performance",
      "hrtime",
    ],
  });
}
