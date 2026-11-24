import { esNumero } from "../utilidades.js";

/**
 * Transición: máx(comisión nueva, esquema anterior).
 * BTL anterior es informativo y no entra (btlEntraTransicion = false).
 */
export function calcularTransicion(comisionNueva, comisionAnterior, { btlAnterior, btlEntraTransicion = false } = {}) {
  const nueva = esNumero(comisionNueva) ? comisionNueva : 0;
  const ant = esNumero(comisionAnterior) ? comisionAnterior : null;

  if (ant === null) {
    return {
      paga: nueva,
      origen: "nueva",
      anterior: null,
      btlAnterior: esNumero(btlAnterior) ? btlAnterior : null,
      estado: "Sin esquema anterior",
    };
  }

  let baseAnterior = ant;
  if (btlEntraTransicion && esNumero(btlAnterior)) baseAnterior += btlAnterior;

  const paga = Math.max(nueva, baseAnterior);
  return {
    paga,
    origen: paga > nueva + 1e-9 ? "anterior" : "nueva",
    anterior: baseAnterior,
    btlAnterior: esNumero(btlAnterior) ? btlAnterior : null,
    estado: "ok",
  };
}
