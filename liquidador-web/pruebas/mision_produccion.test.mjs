/**
 * Misión Internacional (política nueva) = suma de BASE del archivo de Producción.
 * node --test pruebas/mision_produccion.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { produccionMisionNueva, clasificarProducto } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";
import { leerDetalleProduccion } from "../js/carga.js";

const p = structuredClone(PARAMETROS_INICIALES);
const comercial = { nombre: "Tatiana Acuña", nombreFacturacion: "Tatiana Acuña" };

describe("misión desde producción", () => {
  it("clasifica 41703001 / Misión Internac como misión", () => {
    assert.equal(clasificarProducto("Misión Internac", "41703001 Ingreso Misión Internacional", p), "mision");
  });

  it("suma la BASE del comercial (sin usar valor fijo por factura)", () => {
    const filas = [
      { asesor: "Tatiana Acuña", grupo: "Misión Internac", cuenta: "41703001", base: 15_500_000, factura: "A1" },
      { asesor: "Tatiana Acuña", grupo: "Misión Internac", cuenta: "41703001", base: 15_500_000, factura: "A2" },
      { asesor: "Carolina Gomez", grupo: "Misión Internac", cuenta: "41703001", base: 15_500_000, factura: "B1" },
      { asesor: "Tatiana Acuña", grupo: "Educación", cuenta: "41600511", base: 9_000_000, factura: "E1" },
    ];
    const r = produccionMisionNueva(filas, comercial, "2026-10", p);
    assert.equal(r.produccion, 31_000_000);
    assert.equal(r.lineas.length, 2);
    assert.equal(r.facturas, 2);
  });

  it("si hay fecha, solo cuenta las del mes", () => {
    const filas = [
      { asesor: "Tatiana Acuña", grupo: "Misión Internac", cuenta: "41703001", base: 15_500_000, fecha: new Date(2026, 9, 10) },
      { asesor: "Tatiana Acuña", grupo: "Misión Internac", cuenta: "41703001", base: 15_500_000, fecha: new Date(2026, 8, 10) },
    ];
    const r = produccionMisionNueva(filas, comercial, "2026-10", p);
    assert.equal(r.produccion, 15_500_000);
  });

  it("leerDetalleProduccion toma hojas con ASESOR/BASE/GRUPO", () => {
    const libro = {
      PRODUCTOS: [["Mes", "#", "Ingreso", "Costo"], ["OCTUBRE", "1", 100, 50]],
      "Misión": [
        ["NIT", "ENTIDAD", "ASESOR", "GRUPO", "SUBGRUPO", "SERVICIO", "CANTIDAD", "BASE"],
        ["NIT 1", "Fondo", "Tatiana Acuña", "Misión Internac", "Misión Internac", "41703001 Ingreso", 1, 15_500_000],
      ],
    };
    const detalle = leerDetalleProduccion(libro);
    assert.equal(detalle.length, 1);
    assert.equal(detalle[0].asesor, "Tatiana Acuña");
    assert.equal(Number(detalle[0].base), 15_500_000);
  });

  it("si no hay detalle de Producción, usa las filas de Facturación/Misión Int.", async () => {
    const { liquidarComercial } = await import("../js/calculos.js");
    const comercial = {
      ...PARAMETROS_INICIALES.comerciales[0],
      nombre: "Carolina Gómez",
      nombreFacturacion: "Carolina Gomez",
      satisfaccion: 80,
      serfiscal: 100,
      ofertasAprobadas: 0,
      primerasVentas: 0,
      metas: {
        "2026-10": { eduAt: 1, mision: 49_600_000, congreso: 0 },
        "2026-11": { eduAt: 0, mision: 0, congreso: 0 },
        "2026-12": { eduAt: 0, mision: 0, congreso: 0 },
      },
    };
    const filasFacturacion = [
      {
        elegida: false,
        hoja: "Misión Int. ",
        asesor: "Carolina Gomez",
        grupo: "Misión Internacional ",
        cuenta: "41703001 Ingreso Misión Internacional",
        base: 42_384_081,
        factura: "FV1",
        fecha: new Date(Date.UTC(2026, 9, 5, 5, 0, 0)),
        estado: "CANCELADA",
      },
      {
        elegida: false,
        hoja: "Misión Int. ",
        asesor: "Carolina Gomez",
        grupo: "Misión Internacional ",
        cuenta: "41703001 Ingreso Misión Internacional",
        base: 15_500_000,
        factura: "FV2",
        fecha: new Date(Date.UTC(2026, 9, 10, 5, 0, 0)),
        estado: "CANCELADA",
      },
    ];
    const r = liquidarComercial(comercial, filasFacturacion, "2026-10", PARAMETROS_INICIALES, new Map(), new Map(), [], []);
    assert.equal(r.ventas.mision, 57_884_081);
    assert.equal(r.mision.origen, "produccion");
  });
});
