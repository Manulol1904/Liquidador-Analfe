/**
 * Esquema anterior: Misión = suma de CANTIDAD × valorFacturaAnterior.
 * node --test pruebas/mision_anterior.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { produccionAnterior, misionEsquemaAnterior, liquidarComercial, cantidadMision } from "../js/calculos.js";
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
  it("cantidadMision usa CANTIDAD (por defecto 1)", () => {
    assert.equal(cantidadMision({ cantidad: 2 }), 2);
    assert.equal(cantidadMision({ cantidad: "2,00" }), 2);
    assert.equal(cantidadMision({}), 1);
    assert.equal(cantidadMision({ cantidad: 0 }), 1);
  });

  it("una fila con CANTIDAD 2 cuenta como 2 misiones, no como 1", () => {
    const filas = [
      {
        elegida: false,
        hoja: "Misión Int. ",
        asesor: "Carolina Gomez",
        grupo: "Misión Interna",
        cuenta: "41703001 Ingreso Misión Internacional",
        cantidad: 2,
        base: 42_384_081,
        fecha,
        factura: "FV-C2",
        // Hoja Misión Int. real: sin columna ESTADO
      },
    ];
    const carolina = { nombre: "Carolina Gómez", nombreFacturacion: "Carolina Gomez" };
    const m = misionEsquemaAnterior(filas, carolina, "2026-10", p);
    assert.equal(m.facturas, 2);
    assert.equal(m.unidades, 2);
    assert.equal(m.valor, 2_000_000);
  });

  it("Misión Int. sin ESTADO suma el millón a la producción", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 37_510_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M1" },
    ];
    const ant = produccionAnterior(filas, comercial, "2026-10", p);
    assert.equal(ant.mision.unidades, 1);
    assert.equal(ant.mision.valor, 1_000_000);
    assert.equal(ant.produccionBase, 37_510_000);
    assert.equal(ant.produccion, 38_510_000);
  });

  it("suma CANTIDAD de varias facturas a valorFacturaAnterior", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 2_000_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M2", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Otro", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 2, base: 15_500_000, fecha, factura: "M3", estado: "CANCELADA" },
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
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M2", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M3", estado: "CANCELADA" },
    ];
    const r = liquidarComercial(comercial, filas, "2026-10", p, new Map(), new Map(), [], []);
    assert.equal(r.anteriorTramos.mision.facturas, 3);
    assert.equal(r.anteriorTramos.produccion, 21_892_200 + 3_000_000);
    assert.equal(r.misionAnterior.valorTotal, 3_000_000);
  });

  it("NO CANCELADA de Facturación no entra; Misión NO CANCELADA sí (por CANTIDAD)", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 2_000_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 900_000, fecha, factura: "E2", estado: "NO CANCELADA " },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 2, base: 42_384_081, fecha, factura: "M2", estado: "NO CANCELADA" },
    ];
    const ant = produccionAnterior(filas, comercial, "2026-10", p);
    assert.equal(ant.produccionBase, 2_000_000);
    assert.equal(ant.mision.facturas, 3);
    assert.equal(ant.produccion, 5_000_000);
  });

  it("Carolina: 31.51M CANCELADA + 8 unidades de Misión = 39.51M", () => {
    const carolina = { nombre: "Carolina Gómez", nombreFacturacion: "Carolina Gomez" };
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Carolina Gomez", grupo: "Educación", cuenta: "41601103", base: 31_510_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 2, base: 42_384_081, fecha, factura: "4344", estado: "NO CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "4351", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "4352", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 1_421_600, fecha, factura: "4353", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "4318", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "4319", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "4323", estado: "CANCELADA" },
    ];
    const ant = produccionAnterior(filas, carolina, "2026-10", p);
    assert.equal(ant.mision.unidades, 8);
    assert.equal(ant.mision.valor, 8_000_000);
    assert.equal(ant.produccion, 39_510_000);
  });
});
