import { esNumero } from "../utilidades.js";

/**
 * Satisfacción: cump = obtenida ÷ esperada; puntos si cump ≥ 1.
 */
export function calcularSatisfaccion(entradas, parametros) {
  const peso = parametros.pesos.satisfaccion;
  const tope = parametros.curva.tope;
  const esperada = esNumero(entradas?.esperada)
    ? entradas.esperada
    : parametros.satisfaccion.esperada;

  if (!esNumero(entradas?.obtenida) || !esNumero(esperada) || esperada <= 0) {
    return { cump: null, puntos: null, estado: "Pendiente" };
  }

  const cump = entradas.obtenida / esperada;
  const puntos = cump + 1e-9 >= 1 ? peso * Math.min(cump, tope) : 0;
  return { cump, puntos, estado: "ok" };
}
