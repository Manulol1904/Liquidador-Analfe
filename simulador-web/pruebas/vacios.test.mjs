import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcularBaseSocial } from "../js/motor/baseSocial.js";
import { calcularSatisfaccion } from "../js/motor/satisfaccion.js";
import { calcularSerfiscal, calcularInnovacion } from "../js/motor/diversificacion.js";
import { calcularVentasMes } from "../js/motor/ventas.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = PARAMETROS_INICIALES;

describe("vacío ≠ 0", () => {
  it("base social sin base → Pendiente", () => {
    const r = calcularBaseSocial({}, p, { mesClave: "Octubre" });
    assert.equal(r.estado, "Pendiente");
    assert.equal(r.puntos, null);
  });

  it("satisfacción vacía → Pendiente", () => {
    const r = calcularSatisfaccion({}, p);
    assert.equal(r.estado, "Pendiente");
    assert.equal(r.puntos, null);
  });

  it("SERFISCAL vacío → Pendiente", () => {
    const r = calcularSerfiscal({}, p);
    assert.equal(r.estado, "Pendiente");
  });

  it("innovación vacía → Pendiente", () => {
    const r = calcularInnovacion({}, p);
    assert.equal(r.estado, "Pendiente");
    assert.equal(r.puntos, null);
  });

  it("educación vacía con meta → pendiente, no cuenta como 0 cobrado", () => {
    const r = calcularVentasMes(
      {},
      { educacion: 10_000_000, mision: 0, congreso: 0, cultural: 0 },
      p
    );
    const edu = r.productos.find((x) => x.clave === "educacion");
    assert.equal(edu.pendiente, true);
    assert.equal(edu.reconocida, null);
  });
});
