/**
 * Meta de base social: fórmula por defecto; override mes a mes desde Parámetros.
 * node --test pruebas/base_social_meta_mes.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { metaBaseSocialCalculada, metaBaseSocialDelMes, liquidarComercial } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = structuredClone(PARAMETROS_INICIALES);

describe("meta base social por mes", () => {
  it("fórmula: Base 30 sep + pasos × incremento", () => {
    const comercial = { baseSocialInicial: 100, baseSocialMes: {} };
    assert.equal(metaBaseSocialCalculada(comercial, "2026-10", p), 101); // paso 1
    assert.equal(metaBaseSocialCalculada(comercial, "2026-11", p), 102); // paso 2
    assert.equal(metaBaseSocialCalculada(comercial, "2026-12", p), 103); // paso 3
  });

  it("si hay meta manual en el mes, reemplaza la fórmula", () => {
    const comercial = {
      baseSocialInicial: 100,
      baseSocialMes: { "2026-11": { meta: 150 } },
    };
    assert.deepEqual(metaBaseSocialDelMes(comercial, "2026-10", p), { meta: 101, origen: "formula" });
    assert.deepEqual(metaBaseSocialDelMes(comercial, "2026-11", p), { meta: 150, origen: "manual" });
  });

  it("liquidarComercial usa la meta manual del mes", () => {
    const comercial = {
      ...p.comerciales[0],
      baseSocialInicial: 87,
      ingresos: 0,
      retiros: 0,
      baseSocialMes: {
        "2026-10": { meta: 200 },
        "2026-11": { meta: null },
        "2026-12": { meta: null },
      },
      satisfaccion: 80,
      serfiscal: 100,
      ofertasAprobadas: 0,
      primerasVentas: 0,
    };
    const r = liquidarComercial(comercial, [], "2026-10", p, new Map(), new Map(), []);
    assert.equal(r.baseSocial.meta, 200);
    assert.equal(r.baseSocial.metaOrigen, "manual");
    assert.equal(r.baseSocial.metaCalculada, 88);
  });
});
