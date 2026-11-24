import { esNumero } from "../utilidades.js";
import { factorCurva, pagoVariable } from "./curva.js";
import { calcularTransicion } from "./transicion.js";
import { liquidarBtlDirector } from "./btl.js";

function puntosConRegla(peso, cump, tope, regla100) {
  if (!esNumero(cump)) return null;
  if (regla100 && cump < 1) return 0;
  return peso * Math.min(tope, cump);
}

/**
 * Ventas director: no se limita cada producto; solo el ponderado con Tope_dir.
 */
export function ventasDirector(productos, pesoVentas, topeDir) {
  const activos = productos.filter((p) => esNumero(p.meta) && p.meta > 0 && esNumero(p.cump));
  const suma = activos.reduce((s, p) => s + p.meta, 0);
  if (suma <= 0) return { ponderado: 0, puntos: 0 };
  const ponderado = activos.reduce((s, p) => s + (p.meta / suma) * p.cump, 0);
  return { ponderado, puntos: pesoVentas * Math.min(topeDir, ponderado) };
}

/**
 * Score del director según método.
 */
export function scoreDirector(entradas, perfil, parametros) {
  const p = parametros;
  const tope = p.director.tope;
  const regla100 = p.director.regla100;
  const metodo = entradas?.metodo || p.director.metodoScore;

  if (metodo === "promedio-simple" || metodo === "promedio-ponderado") {
    const pts = perfil?.equipo?.puntosIndividuales;
    if (!Array.isArray(pts) || !pts.length) {
      return { puntaje: null, estado: "Pendiente: faltan puntos individuales del equipo", metodo };
    }
    if (metodo === "promedio-simple") {
      const s = pts.reduce((a, x) => a + (x.puntaje || 0), 0) / pts.length;
      return { puntaje: Math.min(120, s), estado: "ok", metodo };
    }
    const w = pts.reduce((a, x) => a + (x.metaVentas || 0), 0);
    if (w <= 0) return { puntaje: null, estado: "Pendiente", metodo };
    const s = pts.reduce((a, x) => a + (x.puntaje || 0) * (x.metaVentas || 0), 0) / w;
    return { puntaje: Math.min(120, s), estado: "ok", metodo };
  }

  // Totales del equipo
  const v = ventasDirector(entradas?.productos || [], p.pesos.ventas, tope);
  let ptsBase = puntosConRegla(p.pesos.baseSocial, entradas?.baseSocial?.cump, tope, regla100);
  let ptsSer = puntosConRegla(p.pesos.serfiscal, entradas?.serfiscal?.cump, tope, regla100);
  let ptsInn = puntosConRegla(p.pesos.innovacion, entradas?.innovacion?.cump, tope, regla100);
  let ptsSat = puntosConRegla(p.pesos.satisfaccion, entradas?.satisfaccion?.cump, tope, regla100);

  // Puntos transitorios si vacíos
  if (ptsSer === null) ptsSer = 10;
  if (ptsInn === null) ptsInn = 10;
  if (ptsSat === null) ptsSat = 15;
  if (ptsBase === null) ptsBase = 0;

  const diversificacion = Math.min(24, (ptsSer || 0) + (ptsInn || 0));
  const puntaje = Math.min(120, v.puntos + (ptsBase || 0) + diversificacion + (ptsSat || 0));

  return {
    puntaje,
    estado: "ok",
    metodo,
    detalle: { ventas: v, ptsBase, ptsSer, ptsInn, ptsSat, diversificacion },
  };
}

export function liquidarDirector(entradas, perfil, parametros) {
  const sc = scoreDirector(entradas, perfil, parametros);
  const factor = esNumero(sc.puntaje) ? factorCurva(sc.puntaje, parametros.curva) : 0;
  const oportunidad = perfil?.compensacion?.oportunidad;
  const comisionNueva = esNumero(oportunidad)
    ? pagoVariable(oportunidad, Math.min(parametros.director.tope, factor))
    : null;

  const baseFacturada = entradas?.anterior?.baseFacturada;
  const comisionAnterior = esNumero(baseFacturada)
    ? baseFacturada * parametros.director.tasaAnterior
    : entradas?.anterior?.comision ?? null;

  const baseBtl = entradas?.anterior?.baseBtl;
  const btlAnterior = esNumero(baseBtl)
    ? baseBtl * parametros.director.tasaBtlAnterior
    : null;

  const transicion = calcularTransicion(comisionNueva, comisionAnterior, {
    btlAnterior,
    btlEntraTransicion: parametros.director.btlEntraTransicion,
  });

  const btl = liquidarBtlDirector(entradas?.btl || {}, perfil, parametros, {
    btlComercialPrelim: entradas?.btl?.comercialPrelim,
    puntajeMes: sc.puntaje,
  });

  return {
    puntaje: sc.puntaje,
    factor,
    comisionNueva,
    transicion,
    btl,
    score: sc,
    estado: sc.estado,
  };
}
