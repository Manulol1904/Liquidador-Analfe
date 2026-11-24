import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { liquidarComercial } from "../js/motor/index.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const perfil = JSON.parse(
  fs.readFileSync(path.join(RAIZ, "datos_ejemplo", "perfil_ejemplo_comercial.json"), "utf8")
);

/** Tolerancias §7.2 */
function cercaPesos(a, b) {
  assert.ok(Math.abs(a - b) <= 1, `${a} ≈ ${b} (±1 peso)`);
}
function cercaNum(a, b, tol = 1e-4) {
  assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b} (±${tol})`);
}

describe("caso semilla Comercial A · Octubre (prompt §7.1)", () => {
  const entradas = {
    mes: "Octubre",
    educacionOct: 41_250_000,
    misionOct: 3,
    baseSocial: { base: 90, ingresos: 0, retiros: 0 },
    serfiscal: { ventas: 12, meta: 10 },
    innovacion: { oferta1: "SÍ", venta1: 5_000_000 },
    satisfaccion: 85,
    comisionAnterior: 1_500_000,
    btl: {
      ingreso: 100_000_000,
      costo: 80_000_000,
      utilidadPresupuestada: 15_000_000,
      pagadoEnAnio: 0,
    },
  };

  const r = liquidarComercial(entradas, perfil, PARAMETROS_INICIALES);

  it("puntos de ventas ≈ 43,4645", () => {
    cercaNum(r.partes.ventas, 43.4645, 1e-3);
  });

  it("base social 0 (cierre 90 / meta 91)", () => {
    assert.equal(r.baseSocial.cierre, 90);
    assert.equal(r.baseSocial.meta, 91);
    assert.equal(r.partes.baseSocial, 0);
  });

  it("diversificación 17 (SER 12 + Inn 5)", () => {
    cercaNum(r.partes.serfiscal, 12, 1e-6);
    cercaNum(r.partes.innovacion, 5, 1e-6);
  });

  it("satisfacción ≈ 15,9375", () => {
    cercaNum(r.partes.satisfaccion, 15.9375, 1e-4);
  });

  it("puntaje ≈ 76,402 → factor 0 → comisión 0", () => {
    cercaNum(r.puntaje, 76.402, 1e-3);
    assert.equal(r.factor, 0);
    assert.equal(r.comision, 0);
  });

  it("transición = $1.500.000", () => {
    cercaPesos(r.transicion.paga, 1_500_000);
  });

  it("BTL = 0 porque puntaje < 80 (regla de negocio; Excel comercial sí liquidaba)", () => {
    assert.equal(r.btl.estimado, 0);
    assert.match(r.btl.estado, /no se liquida BTL/i);
  });
});

