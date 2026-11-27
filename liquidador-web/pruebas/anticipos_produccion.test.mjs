/**
 * Cuentas 27 / anticipos 27209 en esquema anterior:
 * - cumplimiento: producción total (con anticipos)
 * - comisión: base sin anticipos × tasa del tramo
 */
import { produccionAnterior, produccionTotalMes, comisionAnteriorTramos, esCuentaAnticipo } from "../js/calculos.js";

const mes = "2026-10";
const fecha = new Date(2026, 9, 15);
const parametros = { anticipos: { prefijoCuenta: "27209" }, clasificacion: [{ producto: "btl", cuentasPrefijo: ["27209"] }] };
const reglas = {
  minimo: 0.8,
  tasaBajoMinimo: 0,
  tramos: [
    { hasta: 0.9, tasa: 0.05 },
    { hasta: 1, tasa: 0.07 },
    { hasta: null, tasa: 0.09 },
  ],
};

function fila(extra = {}) {
  return {
    elegida: true,
    hoja: "Facturacion",
    asesor: "Hernando Rozo",
    fecha,
    base: 1000,
    cuenta: "41600511",
    ...extra,
  };
}

const comercial = { nombre: "Hernando Rozo", nombreFacturacion: "Hernando Rozo" };
const filas = [
  fila({ factura: "A", base: 100, cuenta: "41600511" }),
  fila({ factura: "B", base: 40, cuenta: "27209001" }),
  fila({ factura: "C", base: 10, elegida: false, hoja: "Misión" }),
];

const assert = (nombre, ok) => {
  if (!ok) throw new Error(`${nombre}`);
  console.log("OK ", nombre);
};

assert("esCuentaAnticipo 27209", esCuentaAnticipo("27209001 Ant. bolos", parametros) === true);
assert("esCuentaAnticipo edu", esCuentaAnticipo("41600511", parametros) === false);

const anterior = produccionAnterior(filas, comercial, mes, parametros);
assert("producción (cumplimiento) incluye anticipo", anterior.produccion === 140);
assert("producción sin anticipos excluye 27209", anterior.produccionSinAnticipos === 100);
assert("lista completa incluye anticipo", anterior.lineas.some((f) => f.factura === "B"));
assert("lista sin anticipos no incluye 27209", !anterior.lineasSinAnticipos.some((f) => f.factura === "B"));

// Meta 100 → cumplimiento 140% → tramo 9 %. Comisión = 100 × 9 % = 9 (no 140 × 9 %).
const calculo = comisionAnteriorTramos(100, anterior.produccion, reglas, anterior.produccionSinAnticipos);
assert("cumplimiento con anticipos", calculo.cumplimiento === 1.4);
assert("tasa del tramo por cumplimiento con 27", calculo.tasa === 0.09);
assert("comisión sobre base sin anticipos", calculo.comision === 9);

const total = produccionTotalMes(filas, mes, parametros);
assert("director: base comisión sin anticipo", total.base === 100);
assert("director: total producido con anticipo", total.baseConAnticipos === 140);

console.log("anticipos_produccion.test.mjs: listo");
