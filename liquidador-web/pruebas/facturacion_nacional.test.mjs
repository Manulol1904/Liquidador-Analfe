/**
 * Excel «FACTURACION A NIVEL NACIONAL…»: Facturacion + Misión Int. + BTL (sin Anuladas).
 * node --test pruebas/facturacion_nacional.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { armarFacturacionDesdeLibro, libroEsFacturacionDetalle, leerDetalleProduccion, fechaEnMes } from "../js/carga.js";
import { produccionMisionNueva } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

function libroNacionalSintetico() {
  const encabezados = ["FACTURA", "NIT", "ENTIDAD", "ASESOR", "GRUPO", "SUBGRUPO", "SERVICIO", "CANTIDAD", "BASE", "IVA", "VALOR TOTAL", "FECHA FACTURACION", "FECHA DE PAGO", "ESTADO"];
  return {
    "Facturacion ": [
      encabezados,
      ["FV1", "NIT 1", "Fondo A", "Hernando Rozo", "Educación", "Diplomados", "41601303 Diplomado", 1, 3_200_000, 0, 3_200_000, new Date(Date.UTC(2026, 9, 5, 5, 0, 0)), new Date(Date.UTC(2026, 9, 16, 5, 0, 0)), "CANCELADA"],
      ["FV2", "NIT 2", "Fondo B", "Carolina Gomez", "Educación", "Seminario", "41600511 Seminario", 1, 2_000_000, 0, 2_000_000, new Date(Date.UTC(2026, 9, 10, 5, 0, 0)), new Date(Date.UTC(2026, 9, 20, 5, 0, 0)), "CANCELADA"],
    ],
    "Misión Int. ": [
      encabezados,
      ["FV3", "NIT 3", "Fondo C", "Carolina Gomez", "Misión Internacional ", "Misión Internacional ", "41703001 Ingreso Misión Internacional", 1, 15_500_000, 0, 15_500_000, new Date(Date.UTC(2026, 9, 30, 5, 0, 0)), new Date(Date.UTC(2026, 9, 22, 5, 0, 0)), "CANCELADA"],
      ["FV4", "NIT 4", "Fondo D", "Tatiana Acuña", "Misión Internacional ", "Misión Internacional ", "41703001 Ingreso Misión Internacional", 1, 15_500_000, 0, 15_500_000, new Date(Date.UTC(2026, 9, 5, 5, 0, 0)), null, "NO CANCELADA"],
    ],
    "BTL ": [
      encabezados,
      ["FV5", "NIT 5", "Fondo E", "Hernando Rozo", "BTL", "Eventos", "41702003 Eventos Fiestas", 1, 3_580_000, 0, 3_580_000, new Date(Date.UTC(2026, 9, 19, 5, 0, 0)), null, "CANCELADA"],
    ],
    Anuladas: [
      encabezados,
      ["FEA1", "NIT 6", "Fondo F", "Carolina Gomez", "Educación", "Seminario", "27209503 Ant. Seminario", 1, 270_000, 0, 270_000, new Date(Date.UTC(2026, 9, 30, 5, 0, 0)), null, "ANULADA"],
    ],
    "Auxiliar ": [["ANALFE"], ["Informe de Ventas"]],
    Hoja2: [["Factura", "Fecha_"], ["FV1", new Date(Date.UTC(2026, 10, 3, 5, 0, 0))]],
  };
}

describe("facturación nacional (Facturacion + Misión + BTL)", () => {
  it("detecta el libro como facturación detalle", () => {
    assert.equal(libroEsFacturacionDetalle(libroNacionalSintetico()), true);
    assert.equal(libroEsFacturacionDetalle({ PRODUCTOS: [["Mes", "#", "Ingreso", "Costo"], ["OCT", "1", 1, 1]] }), false);
  });

  it("arma elegida + complementarias y omite Anuladas/Auxiliar/Hoja2", () => {
    const armado = armarFacturacionDesdeLibro(libroNacionalSintetico());
    assert.equal(armado.principal.trim(), "Facturacion");
    assert.ok(armado.hojas.some((h) => normaliza(h).includes("mision")));
    assert.ok(armado.hojas.some((h) => normaliza(h).includes("btl")));
    assert.ok(!armado.hojas.some((h) => /anulad|auxiliar|hoja2/i.test(h)));
    assert.equal(armado.filas.length, 5);
    assert.equal(armado.filas.filter((f) => f.elegida).length, 2);
    assert.equal(armado.filas.filter((f) => !f.elegida).length, 3);
  });

  it("mapea fecha, fechaPago y estado; fechas 05:00 UTC cuentan en el mes", () => {
    const armado = armarFacturacionDesdeLibro(libroNacionalSintetico());
    const edu = armado.filas.find((f) => f.factura === "FV1");
    assert.ok(edu.fecha instanceof Date);
    assert.ok(edu.fechaPago instanceof Date);
    assert.equal(edu.estado, "CANCELADA");
    assert.equal(fechaEnMes(edu.fecha, "2026-10"), true);
    assert.equal(fechaEnMes(edu.fecha, "2026-11"), false);
  });

  it("leerDetalleProduccion y Misión suman BASE del comercial", () => {
    const detalle = leerDetalleProduccion(libroNacionalSintetico());
    assert.equal(detalle.length, 5);
    const r = produccionMisionNueva(detalle, { nombre: "Carolina Gómez", nombreFacturacion: "Carolina Gomez" }, "2026-10", PARAMETROS_INICIALES);
    assert.equal(r.produccion, 15_500_000);
    assert.equal(r.facturas, 1);
  });
});

function normaliza(texto) {
  return String(texto ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
