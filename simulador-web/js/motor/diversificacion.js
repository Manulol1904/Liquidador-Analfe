import { esNumero } from "../utilidades.js";

function siNo(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const t = String(valor).trim().toUpperCase();
  if (t === "SÍ" || t === "SI" || t === "YES" || t === "1" || valor === true) return true;
  if (t === "NO" || t === "0" || valor === false) return false;
  return null;
}

/**
 * SERFISCAL: cump = ventas ÷ meta; puntos con umbral 100 % y tope.
 */
export function calcularSerfiscal(entradas, parametros) {
  const peso = parametros.pesos.serfiscal;
  const tope = parametros.curva.tope;

  if (!esNumero(entradas?.ventas) || !esNumero(entradas?.meta) || entradas.meta <= 0) {
    return { cump: null, puntos: null, estado: "Pendiente" };
  }

  const cump = entradas.ventas / entradas.meta;
  const puntos = cump + 1e-9 >= 1 ? peso * Math.min(cump, tope) : 0;
  return { cump, puntos, estado: "ok" };
}

/**
 * Innovación comercial: hasta 2 ofertas (SÍ/NO + primera venta).
 * Tope = innovacion.topeTrimestre (12 en Excel comercial).
 */
export function calcularInnovacion(entradas, parametros, { maxOfertas = 2 } = {}) {
  const ptsOferta = parametros.innovacion.ptsOferta;
  const ptsVenta = parametros.innovacion.ptsPrimeraVenta;
  const tope = parametros.innovacion.topeTrimestre;
  const topeOferta = parametros.innovacion.topeOfertaNuevoIngreso;

  let suma = 0;
  let alguna = false;
  const detalle = [];

  for (let i = 1; i <= maxOfertas; i += 1) {
    const aprobada = siNo(entradas?.[`oferta${i}`]);
    const venta = entradas?.[`venta${i}`];
    let pts = 0;

    if (aprobada === null && !esNumero(venta)) {
      detalle.push({ i, pts: null, estado: "—" });
      continue;
    }
    alguna = true;

    if (aprobada === true) pts += ptsOferta;
    else if (aprobada === false) pts += 0;
    // vacío de oferta pero con venta: solo venta

    if (esNumero(venta) && venta > 0) pts += ptsVenta;

    if (maxOfertas > 2) pts = Math.min(topeOferta, pts);
    suma += pts;
    detalle.push({ i, pts, estado: "ok" });
  }

  if (!alguna) return { puntos: null, detalle, estado: "Pendiente" };

  return { puntos: Math.min(tope, suma), detalle, estado: "ok" };
}

export function calcularDiversificacion(entradas, parametros, opts) {
  const ser = calcularSerfiscal(entradas?.serfiscal || {}, parametros);
  const inn = calcularInnovacion(entradas?.innovacion || {}, parametros, opts);

  let puntos = null;
  if (ser.puntos !== null || inn.puntos !== null) {
    puntos = (ser.puntos || 0) + (inn.puntos || 0);
  }

  return { serfiscal: ser, innovacion: inn, puntos, estado: puntos === null ? "Pendiente" : "ok" };
}
