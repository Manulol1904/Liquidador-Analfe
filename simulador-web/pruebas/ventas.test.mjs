import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularVentasMes,
  factorMargen,
  calcularMargen,
  normalizarFactorMargen,
  productoMes,
} from "../js/motor/ventas.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = PARAMETROS_INICIALES;

describe("ventas", () => {
  it("Misión 3 facturas → 93,75 % de cumplimiento", () => {
    const r = calcularVentasMes(
      { educacion: 41_250_000, misionFacturas: 3 },
      { educacion: 41_250_000, mision: 49_600_000, congreso: 0, cultural: 0 },
      p
    );
    const mis = r.productos.find((x) => x.clave === "mision");
    assert.ok(Math.abs(mis.cump - 0.9375) < 1e-9);
    assert.ok(Math.abs(r.puntos - 43.4645) < 1e-3);
  });

  it("Congreso tope 100 %", () => {
    const r = calcularVentasMes(
      { congreso: 200 },
      { educacion: 0, mision: 0, congreso: 100, cultural: 0 },
      p
    );
    const c = r.productos.find((x) => x.clave === "congreso");
    assert.equal(c.cump, 1);
  });

  it("Limitar ventas al 120 %", () => {
    const r = calcularVentasMes(
      { educacion: 200 },
      { educacion: 100, mision: 0, congreso: 0, cultural: 0 },
      p
    );
    assert.equal(r.productos[0].cump, 1.2);
  });

  it("meta 0 no pesa", () => {
    const r = calcularVentasMes(
      { educacion: 10 },
      { educacion: 0, mision: 0, congreso: 0, cultural: 0 },
      p
    );
    assert.equal(r.sumaMetas, 0);
    assert.equal(r.puntos, 0);
  });
});

describe("factor de margen", () => {
  it("fronteras 10 % y 20 %", () => {
    assert.equal(factorMargen(0.05, p.margen), 0);
    assert.equal(factorMargen(0.1, p.margen), 0.9);
    assert.equal(factorMargen(0.2, p.margen), 0.9);
    assert.equal(factorMargen(0.2000001, p.margen), 1);
  });

  it("calculadora ICA/GMF", () => {
    const r = calcularMargen(100_000_000, 80_000_000, p.margen);
    assert.ok(Math.abs(r.ica - 966_044.2) < 0.1);
    assert.equal(r.gmf, 320_000);
  });

  it("normaliza 20 o 90 escritos como porcentaje, no como ×20", () => {
    assert.equal(normalizarFactorMargen(null), 1);
    assert.equal(normalizarFactorMargen(0.9), 0.9);
    assert.equal(normalizarFactorMargen(90), 0.9);
    assert.equal(normalizarFactorMargen(20), 0.2);
    assert.equal(normalizarFactorMargen(100), 1);
  });

  it("4 M con meta 41,25 M y factor 100 % → ~9,7 %, no 120 %", () => {
    const r = productoMes({
      clave: "educacion",
      meta: 41_250_000,
      recaudada: 4_000_000,
      factorMargenInp: 1,
      limitar: true,
      topeVentas: 1.2,
    });
    assert.ok(Math.abs(r.cump - 4_000_000 / 41_250_000) < 1e-9);
    assert.ok(r.cump < 0.1);

    const malAntes = productoMes({
      clave: "educacion",
      meta: 41_250_000,
      recaudada: 4_000_000,
      factorMargenInp: 20,
      limitar: true,
      topeVentas: 1.2,
    });
    // 20 se lee como 20 % de factor (0,2), no como multiplicar ×20
    assert.ok(Math.abs(malAntes.cump - (4_000_000 * 0.2) / 41_250_000) < 1e-9);
    assert.notEqual(malAntes.cump, 1.2);
  });
});
