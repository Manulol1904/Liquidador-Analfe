import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcularSatisfaccion } from "../js/motor/satisfaccion.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = PARAMETROS_INICIALES;

describe("satisfacción", () => {
  it("79 → 0", () => {
    assert.equal(calcularSatisfaccion({ obtenida: 79 }, p).puntos, 0);
  });

  it("80 → 15", () => {
    assert.equal(calcularSatisfaccion({ obtenida: 80 }, p).puntos, 15);
  });

  it("100 → 18 (tope 1,2 sobre cump 1,25)", () => {
    const r = calcularSatisfaccion({ obtenida: 100 }, p);
    assert.ok(Math.abs(r.puntos - 18) < 1e-9);
  });

  it("85 → 15,9375", () => {
    const r = calcularSatisfaccion({ obtenida: 85 }, p);
    assert.ok(Math.abs(r.puntos - 15.9375) < 1e-9);
  });
});
