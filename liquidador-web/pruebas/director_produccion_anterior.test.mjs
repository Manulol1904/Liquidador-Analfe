/**
 * Director / política anterior: sin Jornada; Misión CANCELADA × $1M.
 * Jornada Analfista va a la política nueva (eduAt).
 * node --test pruebas/director_produccion_anterior.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  produccionTotalMes,
  produccionAnterior,
  clasificarProducto,
  esJornadaAnalfista,
  cuentaEnProduccionAnterior,
} from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = structuredClone(PARAMETROS_INICIALES);
const fecha = new Date(Date.UTC(2026, 9, 15, 5, 0, 0));

describe("producción anterior del director", () => {
  it("Jornada Analfista es eduAt (política nueva) y no cuenta en esquema anterior", () => {
    assert.equal(clasificarProducto("Jornada Analfista", "41600511 Jornada Analfista", p), "eduAt");
    assert.equal(esJornadaAnalfista({ grupo: "Jornada Analfista" }, p), true);
    assert.equal(cuentaEnProduccionAnterior({ grupo: "Jornada Analfista", cuenta: "41600511" }, p), false);
  });

  it("suma edu (sin jornada ni BTL) y añade misión CANCELADA completa × 1.000.000", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Consuelo Castro", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, factura: "J1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Lynette Arango", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, factura: "J2", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 10_000_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Tatiana Acuña", grupo: "BTL", cuenta: "27209528 Ant. Bolos", base: 8_400_000, fecha, factura: "B1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M2", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 1_421_600, fecha, factura: "M3", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Carolina Gomez", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 2, base: 42_384_081, fecha, factura: "M4", estado: "NO CANCELADA" },
    ];
    const total = produccionTotalMes(filas, "2026-10", p);
    assert.equal(total.baseFacturacion, 10_000_000);
    assert.equal(total.lineas.some((f) => f.factura === "J1" || f.factura === "J2"), false);
    assert.equal(total.lineas.some((f) => f.factura === "B1"), false);
    assert.equal(total.mision.unidades, 2);
    assert.equal(total.mision.valor, 2_000_000);
    assert.equal(total.base, 12_000_000);

    const comercial = { nombre: "Consuelo Castro", nombreFacturacion: "Consuelo Castro" };
    const ant = produccionAnterior(filas, comercial, "2026-10", p);
    assert.equal(ant.produccionBase, 0);
    assert.equal(ant.produccion, 0);
  });
});
