/**
 * Edu/AT política nueva: sin informe PRODUCTOS, usa la BASE cancelada del Excel
 * (CANCELADA + fecha de pago en el mes). Con PRODUCTOS, exige margen por evento.
 * node --test pruebas/edu_canceladas.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { liquidarComercial, esRecaudo } from "../js/calculos.js";
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

function filaEdu({ base, estado = "CANCELADA", pagoDia = 20, factura = "FV1", cuenta = "41601103 Seminario" }) {
  return {
    elegida: true,
    hoja: "Facturacion ",
    asesor: "Leidy Lizcano",
    grupo: "Educación",
    cuenta,
    base,
    factura,
    fecha: new Date(Date.UTC(2026, 9, 16, 5, 0, 0)),
    fechaPago: new Date(Date.UTC(2026, 9, pagoDia, 5, 0, 0)),
    estado,
  };
}

describe("Edu/AT desde canceladas del Excel", () => {
  it("esRecaudo exige CANCELADA y pago en el mes", () => {
    const ok = filaEdu({ base: 450_000 });
    const otroMes = filaEdu({ base: 450_000, pagoDia: 3 });
    otroMes.fechaPago = new Date(Date.UTC(2026, 10, 3, 5, 0, 0));
    const noCanc = filaEdu({ base: 900_000, estado: "NO CANCELADA" });
    assert.equal(esRecaudo(ok, "2026-10", PARAMETROS_INICIALES), true);
    assert.equal(esRecaudo(otroMes, "2026-10", PARAMETROS_INICIALES), false);
    assert.equal(esRecaudo(noCanc, "2026-10", PARAMETROS_INICIALES), false);
  });

  it("sin márgenes: suma la BASE cancelada del archivo (no queda pendiente)", () => {
    const filas = [
      filaEdu({ base: 1_800_000, factura: "A" }),
      filaEdu({ base: 450_000, factura: "B" }),
      filaEdu({ base: 5_389_200, factura: "C" }),
      filaEdu({ base: 3_500_000, factura: "D" }),
      // pago fuera del mes → no entra
      (() => {
        const f = filaEdu({ base: 900_000, factura: "E" });
        f.fechaPago = new Date(Date.UTC(2026, 10, 26, 5, 0, 0));
        return f;
      })(),
    ];
    const r = liquidarComercial(comercial, filas, "2026-10", PARAMETROS_INICIALES, new Map(), new Map(), [], []);
    assert.equal(r.ventas.eduAt, 11_139_200);
    assert.equal(r.eduAt.ventaRecaudada, 11_139_200);
    assert.equal(r.eduAt.ventaReconocida, 11_139_200);
    assert.ok(!r.faltantes.includes("eduAt"));
  });

  it("con márgenes cargados y factura ausente: sigue pendiente", () => {
    const filas = [filaEdu({ base: 1_800_000, factura: "A" })];
    const margenes = new Map([["999", 0.2]]);
    const r = liquidarComercial(comercial, filas, "2026-10", PARAMETROS_INICIALES, margenes, new Map(), [], []);
    assert.equal(r.ventas.eduAt, null);
    assert.ok(r.faltantes.includes("eduAt"));
  });
});
