import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { liquidarBtl, porcentajeBtl, requisitosBtl } from "../js/motor/btl.js";
import { PARAMETROS_INICIALES, parametrosParaVariante } from "../js/parametros.js";

const perfil = {
  compensacion: { basico: 5_000_000, oportunidad: 5_000_000, imr: 10_000_000 },
  btl: { pagadoEnAnio: 0 },
};

describe("porcentaje BTL", () => {
  const b = PARAMETROS_INICIALES.btl;

  it("bajo cump min o margen min → 0", () => {
    assert.equal(porcentajeBtl(0.89, 0.2, b), 0);
    assert.equal(porcentajeBtl(1, 0.04, b), 0);
  });

  it("bandas P90 y P100", () => {
    assert.equal(porcentajeBtl(0.95, 0.06, b), 0.2);
    assert.equal(porcentajeBtl(0.95, 0.12, b), 0.3);
    assert.equal(porcentajeBtl(0.95, 0.16, b), 0.4);
    assert.equal(porcentajeBtl(1, 0.06, b), 0.35);
    assert.equal(porcentajeBtl(1.2, 0.187, b), 0.8);
  });
});

describe("liquidar BTL comercial", () => {
  it("puntaje < 80 → no liquida", () => {
    const r = liquidarBtl(
      { ingreso: 100_000_000, costo: 80_000_000, utilidadPresupuestada: 15_000_000 },
      perfil,
      PARAMETROS_INICIALES,
      { puntajeMes: 76.4 }
    );
    assert.equal(r.estimado, 0);
    assert.match(r.estado, /no se liquida BTL/i);
  });

  it("puntaje ≥ 80 → estimado ≈ 4.678.489", () => {
    const r = liquidarBtl(
      { ingreso: 100_000_000, costo: 80_000_000, utilidadPresupuestada: 15_000_000 },
      perfil,
      PARAMETROS_INICIALES,
      { puntajeMes: 80 }
    );
    assert.ok(Math.abs(r.estimado - 4_678_488.95) < 1);
  });

  it("tope anual con pagos previos", () => {
    const r = liquidarBtl(
      {
        ingreso: 100_000_000,
        costo: 80_000_000,
        utilidadPresupuestada: 15_000_000,
        pagadoEnAnio: 19_000_000,
      },
      perfil,
      PARAMETROS_INICIALES,
      { puntajeMes: 100 }
    );
    assert.ok(r.estimado <= 1_000_000 + 1);
  });
});

describe("BTL director puntaje mínimo 70", () => {
  it("puntaje 65 → 0", async () => {
    const { liquidarBtlDirector } = await import("../js/motor/btl.js");
    const r = liquidarBtlDirector(
      { ingreso: 100_000_000, utilidadPresupuestada: 15_000_000, utilidadReal: 20_000_000 },
      perfil,
      PARAMETROS_INICIALES,
      { puntajeMes: 65 }
    );
    assert.equal(r.estimado, 0);
    assert.match(r.estado, /no se liquida BTL/i);
  });

  it("puntaje 70 → liquida", async () => {
    const { liquidarBtlDirector } = await import("../js/motor/btl.js");
    const r = liquidarBtlDirector(
      { ingreso: 100_000_000, utilidadPresupuestada: 15_000_000, utilidadReal: 20_000_000 },
      perfil,
      PARAMETROS_INICIALES,
      { puntajeMes: 70 }
    );
    assert.ok(r.estimado > 0);
  });
});


describe("requisitos nuevo ingreso (corrige bug del Excel)", () => {
  const p = parametrosParaVariante("nuevo-ingreso");

  it("cumple → texto sin depender del punto final", () => {
    const req = requisitosBtl(
      { participacion: "SÍ", cierre: "SÍ", satisfaccionEvento: 90 },
      100,
      p.btl
    );
    assert.equal(req.ok, true);
    assert.equal(req.texto, "Cumple los requisitos");
  });

  it("puntaje bajo → no liquida", () => {
    const r = liquidarBtl(
      {
        ingreso: 100_000_000,
        costo: 80_000_000,
        utilidadPresupuestada: 15_000_000,
        participacion: "SÍ",
        cierre: "SÍ",
        satisfaccionEvento: 90,
      },
      perfil,
      p,
      { puntajeMes: 70 }
    );
    assert.equal(r.estimado, 0);
  });
});
