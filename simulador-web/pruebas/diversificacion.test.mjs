import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcularSerfiscal, calcularInnovacion } from "../js/motor/diversificacion.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = PARAMETROS_INICIALES;

describe("SERFISCAL", () => {
  it("99,9 % → 0 puntos", () => {
    const r = calcularSerfiscal({ ventas: 9.99, meta: 10 }, p);
    assert.equal(r.puntos, 0);
  });

  it("100 % → 10 puntos", () => {
    const r = calcularSerfiscal({ ventas: 10, meta: 10 }, p);
    assert.equal(r.puntos, 10);
  });

  it("120 % → 12 puntos", () => {
    const r = calcularSerfiscal({ ventas: 12, meta: 10 }, p);
    assert.equal(r.puntos, 12);
  });
});

describe("innovación", () => {
  it("1 oferta SÍ + primera venta → 5", () => {
    const r = calcularInnovacion({ oferta1: "SÍ", venta1: 5_000_000 }, p);
    assert.equal(r.puntos, 5);
  });

  it("2 ofertas con venta → tope 12 del Excel", () => {
    const r = calcularInnovacion(
      { oferta1: "SÍ", venta1: 1, oferta2: "SÍ", venta2: 1 },
      p
    );
    assert.equal(r.puntos, 10);
  });

  it("oferta NO → 0 de esa oferta", () => {
    const r = calcularInnovacion({ oferta1: "NO" }, p);
    assert.equal(r.puntos, 0);
  });
});
