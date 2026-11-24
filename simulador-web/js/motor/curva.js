import { esNumero } from "../utilidades.js";

/**
 * Factor de la curva de pago (núm. 5.8).
 * @param {number} puntaje
 * @param {{ minimo: number, tope: number, tipo: string, anclas: {puntaje:number,factor:number}[] }} curva
 */
export function factorCurva(puntaje, curva) {
  if (!esNumero(puntaje) || puntaje < curva.minimo) return 0;

  const anclas = [...curva.anclas].sort((a, b) => a.puntaje - b.puntaje);
  const tipo = String(curva.tipo || "LINEAL").toUpperCase();

  if (tipo === "ESCALONES") {
    let factor = anclas[0].factor;
    for (const a of anclas) {
      if (puntaje + 1e-9 >= a.puntaje) factor = a.factor;
    }
    return Math.min(curva.tope, factor);
  }

  // LINEAL
  const ultima = anclas[anclas.length - 1];
  if (puntaje + 1e-9 >= ultima.puntaje) return Math.min(curva.tope, ultima.factor);

  for (let i = 0; i < anclas.length - 1; i += 1) {
    const a = anclas[i];
    const b = anclas[i + 1];
    if (puntaje + 1e-9 >= a.puntaje && puntaje <= b.puntaje + 1e-9) {
      const t = (puntaje - a.puntaje) / (b.puntaje - a.puntaje);
      return Math.min(curva.tope, a.factor + t * (b.factor - a.factor));
    }
  }
  return 0;
}

export function pagoVariable(oportunidad, factor) {
  if (!esNumero(oportunidad) || !esNumero(factor)) return null;
  return oportunidad * factor;
}
