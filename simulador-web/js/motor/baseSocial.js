import { esNumero, redondearExcel } from "../utilidades.js";

/**
 * k = 1 oct, 2 nov, 3 dic o trimestre.
 * meta = round(round(base) + k × Incremento_BS)
 * puntos: cump ≥ 1 ? peso × min(cump, tope) : 0
 */
export function pasosBaseSocial(mesClave) {
  if (mesClave === "2026-10" || mesClave === "Octubre") return 1;
  if (mesClave === "2026-11" || mesClave === "Noviembre") return 2;
  if (mesClave === "2026-12" || mesClave === "Diciembre" || mesClave === "Trimestre") return 3;
  return null;
}

export function calcularBaseSocial(entradas, parametros, { mesClave, mesesAContar } = {}) {
  const peso = parametros.pesos.baseSocial;
  const tope = parametros.curva.tope;
  const incremento = parametros.baseSocial.incremento;

  if (!esNumero(entradas?.base)) {
    return { cierre: null, meta: null, cump: null, puntos: null, estado: "Pendiente" };
  }

  const base = redondearExcel(entradas.base);
  const ingresos = redondearExcel(esNumero(entradas.ingresos) ? entradas.ingresos : 0);
  const retiros = redondearExcel(esNumero(entradas.retiros) ? entradas.retiros : 0);
  const cierre = base + ingresos - retiros;

  let k = esNumero(mesesAContar) ? mesesAContar : pasosBaseSocial(mesClave);
  if (!esNumero(k) || k < 0) k = 1;

  const meta = redondearExcel(base + k * incremento);
  if (meta <= 0) {
    return { cierre, meta, cump: null, puntos: 0, estado: "Sin meta" };
  }

  const cump = cierre / meta;
  const puntos = cump + 1e-9 >= 1 ? peso * Math.min(cump, tope) : 0;

  return { cierre, meta, cump, puntos, estado: "ok", k };
}
