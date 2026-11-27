/**
 * Director esquema anterior: misma base del Excel ($230.256.640) = Edu/AT + Jornada, sin BTL ni Misión × $1M.
 * node --test pruebas/director_produccion_anterior.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  produccionTotalMes,
  clasificarProducto,
  esJornadaAnalfista,
  cuentaEnProduccionAnterior,
  cuentaEnProduccionAnteriorDirector,
} from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = structuredClone(PARAMETROS_INICIALES);
const fecha = new Date(Date.UTC(2026, 9, 15, 5, 0, 0));

describe("producción anterior del director", () => {
  it("Jornada entra en la base del director, no en la del comercial", () => {
    assert.equal(clasificarProducto("Jornada Analfista", "41600511", p), "eduAt");
    assert.equal(esJornadaAnalfista({ grupo: "Jornada Analfista" }, p), true);
    assert.equal(cuentaEnProduccionAnterior({ grupo: "Jornada Analfista", cuenta: "41600511" }, p), false);
    assert.equal(cuentaEnProduccionAnteriorDirector({ grupo: "Jornada Analfista", cuenta: "41600511" }, p), true);
  });

  it("base del director = Edu/AT + Jornada = 230.256.640 (sin BTL ni Misión × 1M)", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 100_000_000, fecha, factura: "E1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Tatiana Acuña", grupo: "Asistencia Técnica", cuenta: "41707015", base: 122_746_640, fecha, factura: "T1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Consuelo Castro", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, factura: "J1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Lynette Arango", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, factura: "J2", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Oriette Henriquez", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, factura: "J3", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Direccion Comercial ", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, factura: "J4", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Direccion Comercial ", grupo: "Educación", cuenta: "41601201", base: 1_000_000, fecha, factura: "D1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Direccion Comercial ", grupo: "Educación", cuenta: "41601001", base: 1_440_000, fecha, factura: "D2", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Direccion Comercial ", grupo: "Educación", cuenta: "27209504", base: 270_000, fecha, factura: "D3", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Tatiana Acuña", grupo: "BTL", cuenta: "27209528", base: 8_400_000, fecha, factura: "B1", estado: "CANCELADA" },
      { elegida: false, hoja: "Misión Int. ", asesor: "Hernando Rozo", grupo: "Misión Internacional ", cuenta: "41703001", cantidad: 1, base: 15_500_000, fecha, factura: "M1", estado: "CANCELADA" },
    ];
    const total = produccionTotalMes(filas, "2026-10", p);
    assert.equal(total.base, 230_256_640);
    assert.equal(total.lineas.some((f) => f.factura === "B1"), false);
    assert.equal(total.mision.valor, 0);
  });
});
