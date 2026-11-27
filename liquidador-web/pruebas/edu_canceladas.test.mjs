/**
 * Edu/AT política nueva: suma BASE de facturas CANCELADA con fecha de facturación en el mes
 * (incluye anticipos 27209 de Educación). No exige pago en el mes.
 * node --test pruebas/edu_canceladas.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { liquidarComercial, esRecaudo, clasificarProducto } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const comercial = {
  ...PARAMETROS_INICIALES.comerciales.find((c) => c.nombre.includes("Leidy")) || PARAMETROS_INICIALES.comerciales[0],
  nombre: "Leidy Lizcano",
  nombreFacturacion: "Leidy Lizcano",
  satisfaccion: 80,
  serfiscal: 100,
  ofertasAprobadas: 0,
  primerasVentas: 0,
};

function filaEdu({ base, estado = "CANCELADA", factura = "FV1", cuenta = "41601103 Seminario", grupo = "Educación", dia = 16 }) {
  return {
    elegida: true,
    hoja: "Facturacion ",
    asesor: "Leidy Lizcano",
    grupo,
    cuenta,
    base,
    factura,
    fecha: new Date(Date.UTC(2026, 9, dia, 5, 0, 0)),
    fechaPago: new Date(Date.UTC(2026, 10, 26, 5, 0, 0)), // pago en noviembre: igual cuenta si está cancelada
    estado,
  };
}

describe("Edu/AT desde canceladas del Excel", () => {
  it("esRecaudo: CANCELADA + fecha facturación en el mes (pago puede ser otro mes)", () => {
    const ok = filaEdu({ base: 450_000 });
    const otroMesFactura = filaEdu({ base: 450_000 });
    otroMesFactura.fecha = new Date(Date.UTC(2026, 8, 16, 5, 0, 0));
    const noCanc = filaEdu({ base: 900_000, estado: "NO CANCELADA " });
    assert.equal(esRecaudo(ok, "2026-10", PARAMETROS_INICIALES), true);
    assert.equal(esRecaudo(otroMesFactura, "2026-10", PARAMETROS_INICIALES), false);
    assert.equal(esRecaudo(noCanc, "2026-10", PARAMETROS_INICIALES), false);
  });

  it("anticipo 27209 de Educación se clasifica como eduAt (no BTL)", () => {
    assert.equal(clasificarProducto("Educación", "27209515 Ant. Diplomado", PARAMETROS_INICIALES), "eduAt");
    assert.equal(clasificarProducto("BTL", "27209528 Ant. Eventos", PARAMETROS_INICIALES), "btl");
  });

  it("suma CANCELADA del mes (incluye anticipo 27209 y pago en noviembre); excluye NO CANCELADA", () => {
    const filas = [
      filaEdu({ base: 10_000_000, factura: "A" }),
      filaEdu({ base: 5_000_000, factura: "B", cuenta: "27209515 Ant. Diplomado" }),
      filaEdu({ base: 5_992_200, factura: "C" }), // pago nov. pero cancelada oct. → entra
      filaEdu({ base: 900_000, factura: "D", estado: "NO CANCELADA " }), // no entra
    ];
    const r = liquidarComercial(comercial, filas, "2026-10", PARAMETROS_INICIALES, new Map(), new Map(), [], []);
    assert.equal(r.ventas.eduAt, 20_992_200);
    assert.equal(r.eduAt.ventaRecaudada, 20_992_200);
    assert.equal(r.eduAt.ventaReconocida, 20_992_200);
  });
});
