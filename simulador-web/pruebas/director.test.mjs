import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { liquidarDirector, scoreDirector } from "../js/motor/director.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const perfil = {
  tipo: "director",
  compensacion: { basico: 8_000_000, oportunidad: 4_000_000 },
};

describe("director", () => {
  it("totales del equipo con regla 100 % = NO", () => {
    const r = scoreDirector(
      {
        metodo: "totales",
        productos: [
          { meta: 100, cump: 0.5 },
          { meta: 100, cump: 1 },
        ],
        baseSocial: { cump: 0.9 },
        serfiscal: { cump: null },
        innovacion: { cump: null },
        satisfaccion: { cump: null },
      },
      perfil,
      PARAMETROS_INICIALES
    );
    assert.equal(r.estado, "ok");
    assert.ok(esNumero(r.puntaje));
    // transitorios: SER 10 + Inn 10 → div 20; Sat 15; base 0 (regla100 false → 0.9*20)
    assert.ok(r.puntaje > 0);
  });

  it("promedio simple pendiente sin puntos individuales", () => {
    const r = scoreDirector({ metodo: "promedio-simple" }, perfil, PARAMETROS_INICIALES);
    assert.equal(r.puntaje, null);
    assert.match(r.estado, /Pendiente/);
  });

  it("transición máx(nueva, anterior 1,5 %)", () => {
    const r = liquidarDirector(
      {
        metodo: "totales",
        productos: [{ meta: 100, cump: 1.2 }],
        baseSocial: { cump: 1.2 },
        serfiscal: { cump: 1.2 },
        innovacion: { cump: 1.2 },
        satisfaccion: { cump: 1.2 },
        anterior: { baseFacturada: 100_000_000 },
      },
      perfil,
      PARAMETROS_INICIALES
    );
    assert.ok(r.transicion.anterior === 1_500_000);
    assert.ok(r.transicion.paga >= 1_500_000);
  });
});

function esNumero(n) {
  return typeof n === "number" && Number.isFinite(n);
}
