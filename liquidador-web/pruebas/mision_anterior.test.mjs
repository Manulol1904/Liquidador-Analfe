/**
 * Esquema anterior: cada factura de Misión suma valorFacturaAnterior a la producción.
 * node --test pruebas/mision_anterior.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { produccionAnterior, misionEsquemaAnterior, liquidarComercial } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = structuredClone(PARAMETROS_INICIALES);
assert.equal(p.mision.valorFacturaAnterior, 1_000_000);

const comercial = {
  ...p.comerciales.find((c) => c.nombre.includes("Hernando")) || p.comerciales[0],
  nombre: "Hernando Rozo",
  nombreFacturacion: "Hernando Rozo",
  tieneEsquemaAnterior: true,
  satisfaccion: 80,
  serfiscal: 100,
  ofertasAprobadas: 0,
  primerasVentas: 0,
  anteriorMes: {
    "2026-10": { meta: 50_000_000 },
  },
};

const fecha = new Date(Date.UTC(2026, 9, 15, 5, 0, 0));

describe("misión en producción esquema anterior", () => {
  it("cuenta facturas de la hoja Misión Int. a valorFacturaAnterior", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 2_000_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M2", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Otro", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M3", estado: "CANCELADA" },
    ];
    const m = misionEsquemaAnterior(filas, comercial, "2026-10", p);
    assert.equal(m.facturas, 2);
    assert.equal(m.valor, 2_000_000);

    const ant = produccionAnterior(filas, comercial, "2026-10", p);
    assert.equal(ant.produccionBase, 2_000_000);
    assert.equal(ant.mision.valor, 2_000_000);
    assert.equal(ant.produccion, 4_000_000);
    assert.equal(ant.produccionSinAnticipos, 4_000_000);
  });

  it("liquidarComercial refleja Misión en Producción (cumplimiento)", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 21_892_200, fecha, factura: "E1", estado: "CANCELADA", fechaPago: fecha },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M2", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M3", estado: "CANCELADA" },
    ];
    const r = liquidarComercial(comercial, filas, "2026-10", p, new Map(), new Map(), [], []);
    assert.equal(r.anteriorTramos.mision.facturas, 3);
    assert.equal(r.anteriorTramos.produccion, 21_892_200 + 3_000_000);
    assert.equal(r.misionAnterior.valorTotal, 3_000_000);
  });

  it("NO CANCELADA no entra a la producción del esquema anterior", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 2_000_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 900_000, fecha, factura: "E2", estado: "NO CANCELADA " },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", base: 15_500_000, fecha, factura: "M2", estado: "NO CANCELADA" },
    ];
    const ant = produccionAnterior(filas, comercial, "2026-10", p);
    assert.equal(ant.produccionBase, 2_000_000);
    assert.equal(ant.mision.facturas, 1);
    assert.equal(ant.produccion, 3_000_000);
  });
});
