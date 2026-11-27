/**
 * BTL / bolos / cultural no entran a la producción del esquema anterior.
 * node --test pruebas/btl_fuera_anterior.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { produccionAnterior, produccionTotalMes, clasificarProducto, cuentaEnProduccionAnterior } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = structuredClone(PARAMETROS_INICIALES);
const fecha = new Date(Date.UTC(2026, 9, 15, 5, 0, 0));
const tatiana = { nombre: "Tatiana Acuña", nombreFacturacion: "Tatiana Acuña" };

describe("BTL/cultural fuera de producción esquema anterior", () => {
  it("anticipo bolos con grupo BTL se clasifica como btl y no cuenta", () => {
    assert.equal(clasificarProducto("BTL", "27209528 Ant. Eventos Deportivos Bolos", p), "btl");
    assert.equal(cuentaEnProduccionAnterior({ grupo: "BTL", cuenta: "27209528 Ant. Eventos Deportivos Bolos" }, p), false);
    assert.equal(cuentaEnProduccionAnterior({ grupo: "Educación", cuenta: "41601103" }, p), true);
  });

  it("Tatiana: bolos 8.4M no suman a la producción", () => {
    const filas = [
      { elegida: true, hoja: "Facturacion ", asesor: "Tatiana Acuña", grupo: "Asistencia Técnica", cuenta: "41707015", base: 17_986_770, fecha, factura: "T1", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Tatiana Acuña", grupo: "Educación", cuenta: "41601203", base: 7_211_439, fecha, factura: "T2", estado: "CANCELADA" },
      { elegida: true, hoja: "Facturacion ", asesor: "Tatiana Acuña", grupo: "BTL", cuenta: "27209528 Ant. Eventos Deportivos Bolos", base: 8_400_000, fecha, factura: "T-BOLOS", estado: "CANCELADA" },
      { elegida: false, hoja: "BTL ", asesor: "Hernando Rozo", grupo: "BTL", cuenta: "41702003 Eventos Fiestas", base: 3_580_000, fecha, factura: "B1", estado: "CANCELADA" },
    ];
    const ant = produccionAnterior(filas, tatiana, "2026-10", p);
    assert.equal(ant.produccionBase, 17_986_770 + 7_211_439);
    assert.equal(ant.lineas.some((f) => f.factura === "T-BOLOS"), false);
    assert.equal(ant.produccion, 25_198_209);

    const total = produccionTotalMes(filas, "2026-10", p);
    assert.equal(total.base, 25_198_209);
    assert.equal(total.lineas.some((f) => f.factura === "T-BOLOS"), false);
  });
});
