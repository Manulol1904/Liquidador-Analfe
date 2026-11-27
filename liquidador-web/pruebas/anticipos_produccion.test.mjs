/**
 * Cuentas 27 / anticipos 27209: se excluyen del esquema anterior
 * (produccionAnterior y produccionTotalMes). La política nueva no usa esa suma.
 */
import { produccionAnterior, produccionTotalMes, esCuentaAnticipo } from "../js/calculos.js";

const mes = "2026-10";
const fecha = new Date(2026, 9, 15);
const parametros = { anticipos: { prefijoCuenta: "27209" }, clasificacion: [{ producto: "btl", cuentasPrefijo: ["27209"] }] };

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
  if (!ok) throw new Error(nombre);
  console.log("OK ", nombre);
};

assert("esCuentaAnticipo 27209", esCuentaAnticipo("27209001 Ant. bolos", parametros) === true);
assert("esCuentaAnticipo edu", esCuentaAnticipo("41600511", parametros) === false);

const anterior = produccionAnterior(filas, comercial, mes, parametros);
assert("esquema anterior excluye anticipo", anterior.produccion === 100);
assert("esquema anterior no lista anticipo", !anterior.lineas.some((f) => f.factura === "B"));

const total = produccionTotalMes(filas, mes, parametros);
assert("total mes (comisión anterior director) excluye anticipo", total.base === 100);
assert("total mes no lista anticipo", !total.lineas.some((f) => f.factura === "B"));

console.log("anticipos_produccion.test.mjs: listo");
