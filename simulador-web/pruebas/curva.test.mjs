import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { factorCurva } from "../js/motor/curva.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const curva = PARAMETROS_INICIALES.curva;

describe("factorCurva LINEAL", () => {
  it("bajo el mínimo → 0", () => {
    assert.equal(factorCurva(79.999, curva), 0);
    assert.equal(factorCurva(0, curva), 0);
  });

  it("exactamente 80 → 0,7", () => {
    assert.ok(Math.abs(factorCurva(80, curva) - 0.7) < 1e-9);
  });

  it("entre anclas interpola", () => {
    assert.ok(Math.abs(factorCurva(85, curva) - 0.8) < 1e-9);
    assert.ok(Math.abs(factorCurva(95, curva) - 0.95) < 1e-9);
    assert.ok(Math.abs(factorCurva(105, curva) - 1.05) < 1e-9);
  });

  it("en anclas exactas", () => {
    assert.equal(factorCurva(90, curva), 0.9);
    assert.equal(factorCurva(100, curva), 1);
    assert.equal(factorCurva(120, curva), 1.2);
  });

  it("sobre 120 → tope", () => {
    assert.equal(factorCurva(130, curva), 1.2);
  });
});

describe("factorCurva ESCALONES", () => {
  const esc = { ...curva, tipo: "ESCALONES" };

  it("usa el factor del tramo", () => {
    assert.equal(factorCurva(80, esc), 0.7);
    assert.equal(factorCurva(89.999, esc), 0.7);
    assert.equal(factorCurva(90, esc), 0.9);
    assert.equal(factorCurva(120, esc), 1.2);
  });
});
