import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcularBaseSocial } from "../js/motor/baseSocial.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = PARAMETROS_INICIALES;

describe("base social", () => {
  it("justo bajo la meta → 0 puntos", () => {
    const r = calcularBaseSocial(
      { base: 90, ingresos: 0, retiros: 0 },
      p,
      { mesClave: "Octubre" }
    );
    assert.equal(r.meta, 91);
    assert.equal(r.cierre, 90);
    assert.equal(r.puntos, 0);
  });

  it("en la meta → puntos con tope", () => {
    const r = calcularBaseSocial(
      { base: 90, ingresos: 1, retiros: 0 },
      p,
      { mesClave: "Octubre" }
    );
    assert.equal(r.cierre, 91);
    assert.equal(r.meta, 91);
    assert.equal(r.puntos, 20);
  });

  it("sobre 120 % → tope 1,2", () => {
    const r = calcularBaseSocial(
      { base: 100, ingresos: 50, retiros: 0 },
      p,
      { mesClave: "Octubre" }
    );
    assert.ok(r.cump > 1.2);
    assert.equal(r.puntos, 20 * 1.2);
  });

  it("diciembre k=3", () => {
    const r = calcularBaseSocial(
      { base: 90, ingresos: 0, retiros: 0 },
      p,
      { mesClave: "Diciembre" }
    );
    assert.equal(r.meta, 93);
  });
});
