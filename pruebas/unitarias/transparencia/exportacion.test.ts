import {
  BOM,
  celdaCsv,
  csvDeRecaudacion,
  montoCsv,
  nombreDeArchivo,
} from "@/modulos/transparencia/dominio/exportacion";

const DATOS = {
  generado: "2026-09-27 15:00",
  periodo: { desde: "2026-09-01", hasta: "2026-09-30" },
  estado: "Todas las casas",
  tablero: {
    seCobro: 184000,
    recibos: 3,
    digital: { monto: 110500, cantidad: 2 },
    efectivo: { monto: 73500, cantidad: 1 },
    faltaCobrar: { monto: 41000, cuotas: 82 },
    cuadra: { ok: true },
    semanas: [
      { etiqueta: "Semana del 31 de agosto al 6 de setiembre", digital: 50500, efectivo: 0, total: 50500 },
      { etiqueta: "Semana del 7 al 13 de setiembre", digital: 60000, efectivo: 73500, total: 133500 },
    ],
  },
  casas: [
    { vivienda: "Mz. A, lote 3", estado: "AL_DIA" as const, recibos: 2, cobrado: 110500, debe: 0 },
    { vivienda: "Mz. C, lote 7", estado: "ATRASO" as const, recibos: 1, cobrado: 73500, debe: 41000 },
    { vivienda: "Mz. D, lote 1", estado: "CRITICO" as const, recibos: 0, cobrado: 0, debe: 50000 },
  ],
};

describe("@HU-COB-15 CA2 El archivo de la exportación", () => {
  it("@HU-COB-15 CA2 un monto en céntimos sale en soles con dos decimales y punto", () => {
    expect(montoCsv(184000)).toBe("1840.00");
    expect(montoCsv(5)).toBe("0.05");
    expect(montoCsv(0)).toBe("0.00");
  });

  it("@HU-COB-15 CA1 las celdas con comas, comillas o saltos de línea van entre comillas", () => {
    expect(celdaCsv("Mz. A, lote 3")).toBe('"Mz. A, lote 3"');
    expect(celdaCsv('Dijo "hola"')).toBe('"Dijo ""hola"""');
    expect(celdaCsv("uno\ndos")).toBe('"uno\ndos"');
    expect(celdaCsv("Sin nada raro")).toBe("Sin nada raro");
    expect(celdaCsv(12)).toBe("12");
  });

  it("@HU-COB-15 una celda que empieza como fórmula no se ejecuta al abrirla en Excel", () => {
    expect(celdaCsv("=SUMA(A1:A2)")).toBe("'=SUMA(A1:A2)");
    expect(celdaCsv("+51 999")).toBe("'+51 999");
    expect(celdaCsv("@usuario")).toBe("'@usuario");
    expect(celdaCsv("-1")).toBe("'-1");
  });

  it("@HU-COB-15 CA2 trae los mismos totales y desgloses del tablero, por semana, por estado y por casa", () => {
    const filas = csvDeRecaudacion(DATOS).split("\r\n");
    expect(filas).toContain("Total cobrado (S/),1840.00");
    expect(filas).toContain("Recibos emitidos,3");
    expect(filas).toContain("Recibos digitales,2");
    expect(filas).toContain("Monto digital (S/),1105.00");
    expect(filas).toContain("Recibos en efectivo,1");
    expect(filas).toContain("Monto en efectivo (S/),735.00");
    expect(filas).toContain("Falta cobrar (S/),410.00");
    expect(filas).toContain("Cuotas por cobrar,82");
    expect(filas).toContain("¿Cuadra?,Sí");
    expect(filas).toContain("Semana del 7 al 13 de setiembre,600.00,735.00,1335.00");
    expect(filas).toContain("Total,1105.00,735.00,1840.00");
    expect(filas).toContain("Al día,1,2,1105.00,0.00");
    expect(filas).toContain("Atraso de 1 a 7 semanas,1,1,735.00,410.00");
    expect(filas).toContain("8 semanas o más,1,0,0.00,500.00");
    expect(filas).toContain('"Mz. C, lote 7",Atraso de 1 a 7 semanas,1,735.00,410.00');
  });

  it("@HU-COB-15 CA1 dice el periodo y el estado de las casas que se exportaron", () => {
    const filas = csvDeRecaudacion(DATOS).split("\r\n");
    expect(filas[0]).toBe("Recaudación de la cuota de vigilancia");
    expect(filas).toContain("Periodo,2026-09-01 a 2026-09-30");
    expect(filas).toContain("Estado de las casas,Todas las casas");
    expect(filas).toContain("Generado el,2026-09-27 15:00");
  });

  it("@HU-COB-15 si no cuadra, el archivo lo dice", () => {
    const filas = csvDeRecaudacion({ ...DATOS, tablero: { ...DATOS.tablero, cuadra: { ok: false } } }).split(
      "\r\n",
    );
    expect(filas).toContain("¿Cuadra?,No");
  });

  it("@HU-COB-15 el archivo se llama con su periodo y el BOM hace que Excel lea bien las tildes", () => {
    expect(nombreDeArchivo("2026-09-01", "2026-09-30")).toBe("recaudacion-2026-09-01-a-2026-09-30.csv");
    expect(BOM).toBe("﻿");
  });
});
