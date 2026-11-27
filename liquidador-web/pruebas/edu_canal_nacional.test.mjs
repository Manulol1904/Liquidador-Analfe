/**
 * Política nueva: Edu/AT del director incluye Dirección Comercial (canal) + Jornada.
 * Cuadra con la suma del Excel: $230.256.640.
 * node --test pruebas/edu_canal_nacional.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ventaEduAtReconocida, metodosDirector, clasificarProducto } from "../js/calculos.js";
import { PARAMETROS_INICIALES } from "../js/parametros.js";

const p = structuredClone(PARAMETROS_INICIALES);
const fecha = new Date(Date.UTC(2026, 9, 15, 5, 0, 0));

function esCanal(asesor) {
  return /direccion|dirección/i.test(String(asesor || ""));
}

describe("Edu/AT canal nacional en política nueva", () => {
  it("Jornada Analfista cuenta como eduAt", () => {
    assert.equal(clasificarProducto("Jornada Analfista", "41600511", p), "eduAt");
  });

  it("suma equipo + Dirección Comercial = 230.256.640 (como el Excel)", () => {
    const filas = [
      { elegida: true, asesor: "Hernando Rozo", grupo: "Educación", cuenta: "41601103", base: 100_000_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Tatiana Acuña", grupo: "Asistencia Técnica", cuenta: "41707015", base: 122_746_640, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Lynette Arango", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Oriette Henriquez", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Consuelo Castro", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Direccion Comercial ", grupo: "Educación", cuenta: "41601201", base: 1_000_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Direccion Comercial ", grupo: "Jornada Analfista", cuenta: "41600511", base: 1_200_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Direccion Comercial ", grupo: "Educación", cuenta: "41601001", base: 1_440_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Direccion Comercial ", grupo: "Educación", cuenta: "27209504", base: 270_000, fecha, estado: "CANCELADA" },
      { elegida: true, asesor: "Tatiana Acuña", grupo: "BTL", cuenta: "27209528", base: 8_400_000, fecha, estado: "CANCELADA" },
    ];

    assert.equal(ventaEduAtReconocida(filas, "2026-10", p, new Map(), new Map()), 230_256_640);

    const sinCanal = ventaEduAtReconocida(filas, "2026-10", p, new Map(), new Map(), (asesor) => !esCanal(asesor));
    assert.equal(sinCanal, 226_346_640);

    const canal = ventaEduAtReconocida(filas, "2026-10", p, new Map(), new Map(), (asesor) => esCanal(asesor));
    assert.equal(canal, 3_910_000);

    const stubs = [
      {
        nombre: "A",
        ventas: { eduAt: sinCanal, mision: 0, congreso: 0, cultural: 0, pasantia: 0, patrocinio: 0 },
        metas: { eduAt: 1, mision: 1, congreso: 0, cultural: 0 },
        puntos: { ventas: 0, baseSocial: 0, serfiscal: 0, innovacion: 0, satisfaccion: 0 },
        baseSocial: { cierre: 90, meta: 91, cumplimiento: 1, neutral: false },
        neutrales: {},
        score: 100,
        comercial: {},
      },
    ];
    const dir = metodosDirector(stubs, p, "2026-10", { eduAtExtra: canal });
    assert.equal(dir.ventasEquipo.eduAt, 230_256_640);
  });
});
