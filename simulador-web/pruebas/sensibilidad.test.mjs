import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tablaSensibilidad } from "../js/motor/sensibilidad.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

describe("sensibilidad", () => {
  it("13 filas de 0 % a 120 %", () => {
    const t = tablaSensibilidad({
      otrosPuntos: 30,
      oportunidad: 5_000_000,
      parametros: PARAMETROS_INICIALES,
    });
    assert.equal(t.filas.length, 13);
    assert.equal(t.filas[0].cumplimiento, 0);
    assert.equal(t.filas[12].cumplimiento, 1.2);
  });

  it("cump necesario para 80", () => {
    const t = tablaSensibilidad({
      otrosPuntos: 35,
      oportunidad: 5_000_000,
      parametros: PARAMETROS_INICIALES,
    });
    // falta 45 pts de ventas → 45/45 = 100 %
    assert.ok(Math.abs(t.cumpNecesario - 1) < 1e-9);
  });

  it("ya llega sin ventas", () => {
    const t = tablaSensibilidad({
      otrosPuntos: 80,
      oportunidad: 5_000_000,
      parametros: PARAMETROS_INICIALES,
    });
    assert.equal(t.cumpNecesario, 0);
  });
});
