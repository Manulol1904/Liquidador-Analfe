/**
 * Meta misión director = suma de comerciales; pagoAjustado = pagada + ajuste.
 * node --test pruebas/director_meta_ajuste.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { metodosDirector, liquidarComercial, factorCurva } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = structuredClone(PARAMETROS_INICIALES);

function resultadoStub({ nombre, misionMeta, eduAt = 0 }) {
  return {
    nombre,
    ventas: { eduAt: 0, mision: 0, congreso: 0, cultural: 0, pasantia: 0, patrocinio: 0 },
    metas: { eduAt, mision: misionMeta, congreso: 0, cultural: 0 },
    puntos: { ventas: 0, baseSocial: 0, serfiscal: p.pesos.serfiscal, innovacion: p.pesos.innovacion, satisfaccion: p.pesos.satisfaccion },
    baseSocial: { cierre: 90, meta: 91, cumplimiento: 90 / 91, neutral: false },
    neutrales: { serfiscal: true, innovacion: true, satisfaccion: true },
    score: 100,
    comercial: { serfiscal: null, satisfaccion: null },
  };
}

describe("meta misión director", () => {
  it("suma las metas de misión de los comerciales (no el parámetro fijo)", () => {
    const metaUnitaria = 49_600_000;
    const stubs = [
      resultadoStub({ nombre: "A", misionMeta: metaUnitaria, eduAt: 10 }),
      resultadoStub({ nombre: "B", misionMeta: metaUnitaria, eduAt: 10 }),
      resultadoStub({ nombre: "C", misionMeta: metaUnitaria, eduAt: 10 }),
    ];
    const dir = metodosDirector(stubs, p, "2026-10");
    assert.equal(dir.metasEquipo.mision, metaUnitaria * 3);
    assert.notEqual(dir.metasEquipo.mision, p.director.metaMisionEquipo);
  });

  it("queda pendiente si algún comercial no tiene meta de misión", () => {
    const stubs = [
      resultadoStub({ nombre: "A", misionMeta: 49_600_000, eduAt: 10 }),
      resultadoStub({ nombre: "B", misionMeta: null, eduAt: 10 }),
    ];
    const dir = metodosDirector(stubs, p, "2026-10");
    assert.equal(dir.metasEquipo.mision, null);
  });
});

describe("ajuste / reliquidación", () => {
  it("pagoAjustado = transición + ajusteValor", () => {
    const comercial = {
      ...p.comerciales[0],
      ajusteValor: 150_000,
      ajusteMes: "2026-10",
      ajusteNota: "corrección octubre",
      // Forzar liquidación mínima sin archivo
      satisfaccion: 80,
      serfiscal: 100,
      ofertasAprobadas: 0,
      primerasVentas: 0,
      innovacionAcumuladaTrimestre: 0,
    };
    // metas octubre con eduAt
    comercial.metas = {
      "2026-10": { eduAt: 41_250_000, mision: 49_600_000, congreso: 0, cultural: 0 },
      "2026-11": { eduAt: 0, mision: 0, congreso: 0 },
      "2026-12": { eduAt: 0, mision: 0, congreso: 0 },
    };
    const r = liquidarComercial(comercial, [], "2026-10", p, [], {}, []);
    assert.ok(r.transicion?.pagada !== undefined);
    if (r.transicion.pagada === null) {
      // Si falta dato y queda pendiente, el ajuste solo aparece si hay valor
      assert.equal(r.pagoAjustado, 150_000);
    } else {
      assert.equal(r.pagoAjustado, r.transicion.pagada + 150_000);
    }
    assert.equal(r.ajuste.valor, 150_000);
    assert.equal(r.ajuste.mesReferencia, "2026-10");
  });
});

describe("factor curva exacto", () => {
  it("85 puntos → 0,8 (80 %)", () => {
    assert.ok(Math.abs(factorCurva(85, p.curva) - 0.8) < 1e-9);
  });
});
