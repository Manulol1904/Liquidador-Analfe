import { esNumero } from "../utilidades.js";
import { factorCurva, pagoVariable } from "./curva.js";

/**
 * Tabla «¿Cuánto gano según mi cumplimiento de ventas?»
 * c = 0 %, 10 %, …, 120 %.
 */
export function tablaSensibilidad({ otrosPuntos, oportunidad, parametros }) {
  const peso = parametros.pesos.ventas;
  const limitar = parametros.topes.limitarVentas;
  const topeV = parametros.topes.ventas;
  const topeScore = parametros.pesos.ventas + parametros.pesos.baseSocial + parametros.pesos.serfiscal
    + parametros.pesos.innovacion + parametros.pesos.satisfaccion;
  const topePtsVentas = limitar ? peso * topeV : peso * 9; // como en el prompt

  const filas = [];
  for (let i = 0; i <= 12; i += 1) {
    const c = i / 10;
    let ptsV = c * peso;
    if (limitar) ptsV = Math.min(peso * topeV, ptsV);
    ptsV = Math.min(topePtsVentas, ptsV);
    const score = Math.min(120, ptsV + (otrosPuntos || 0));
    const factor = factorCurva(score, parametros.curva);
    const comision = pagoVariable(oportunidad, factor);
    filas.push({ cumplimiento: c, ptsVentas: ptsV, score, factor, comision });
  }

  let cumpNecesario = null;
  let mensaje = "";
  const falta = parametros.curva.minimo - (otrosPuntos || 0);
  if (falta <= 0) {
    cumpNecesario = 0;
    mensaje = "Ya alcanza 80 sin ventas";
  } else {
    cumpNecesario = falta / peso;
    const maxPts = limitar ? peso * topeV : peso * topeV;
    if (falta > maxPts + 1e-9) {
      mensaje = "No alcanza";
      cumpNecesario = null;
    }
  }

  return { filas, cumpNecesario, mensaje, topeScore };
}

export function probarCumplimiento(c, { otrosPuntos, oportunidad, parametros }) {
  if (!esNumero(c)) return null;
  const tabla = tablaSensibilidad({ otrosPuntos, oportunidad, parametros });
  const peso = parametros.pesos.ventas;
  const limitar = parametros.topes.limitarVentas;
  const topeV = parametros.topes.ventas;
  let ptsV = c * peso;
  if (limitar) ptsV = Math.min(peso * topeV, ptsV);
  const score = Math.min(120, ptsV + (otrosPuntos || 0));
  const factor = factorCurva(score, parametros.curva);
  return { cumplimiento: c, ptsVentas: ptsV, score, factor, comision: pagoVariable(oportunidad, factor), tabla };
}
