import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PARAMETROS_INICIALES, sumaPesos } from "../js/parametros.js";

describe("parámetros de fábrica (= Excel)", () => {
  it("suma de pesos = 100", () => {
    assert.equal(sumaPesos(PARAMETROS_INICIALES), 100);
  });

  it("pesos 45/20/10/10/15", () => {
    const p = PARAMETROS_INICIALES.pesos;
    assert.equal(p.ventas, 45);
    assert.equal(p.baseSocial, 20);
    assert.equal(p.serfiscal, 10);
    assert.equal(p.innovacion, 10);
    assert.equal(p.satisfaccion, 15);
  });

  it("curva 80 → 70 % … 120 → 120 %", () => {
    const c = PARAMETROS_INICIALES.curva;
    assert.equal(c.minimo, 80);
    assert.equal(c.tope, 1.2);
    assert.equal(c.tipo, "LINEAL");
    assert.deepEqual(
      c.anclas.map((a) => [a.puntaje, a.factor]),
      [
        [80, 0.7],
        [90, 0.9],
        [100, 1],
        [110, 1.1],
        [120, 1.2],
      ]
    );
  });

  it("margen, ICA, GMF y BTL comercial", () => {
    const m = PARAMETROS_INICIALES.margen;
    assert.equal(m.umbralBajo, 0.1);
    assert.equal(m.umbralAlto, 0.2);
    assert.equal(m.factorMedio, 0.9);
    assert.ok(Math.abs(m.ica - 0.009660442) < 1e-12);
    assert.equal(m.gmf, 0.004);

    const b = PARAMETROS_INICIALES.btl;
    assert.equal(b.topeEvento, 0.8);
    assert.equal(b.topeAnual, 2);
    assert.equal(b.salvaguarda, 0.25);
    assert.equal(b.cumpMin, 0.9);
    assert.equal(b.margenMin, 0.051);
    assert.equal(b.margenMed, 0.101);
    assert.equal(b.margenAlto, 0.151);
    assert.equal(b.aplicarRequisitos, false);
  });

  it("Misión 15.500.000 y Sat esperada 80", () => {
    assert.equal(PARAMETROS_INICIALES.mision.valorFactura, 15_500_000);
    assert.equal(PARAMETROS_INICIALES.satisfaccion.esperada, 80);
  });
});
