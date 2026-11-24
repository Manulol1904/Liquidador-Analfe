import { esNumero } from "../utilidades.js";

/**
 * Factor de margen Educación (núm. 5.4).
 * Exactamente umbralAlto (20 %) → factor medio (90 %), salvo regla matriz.
 */
export function factorMargen(margen, reglas) {
  if (!esNumero(margen)) return null;
  if (margen < reglas.umbralBajo) return reglas.factorBajo;
  if (margen < reglas.umbralAlto - 1e-9) return reglas.factorMedio;
  if (Math.abs(margen - reglas.umbralAlto) <= 1e-9) {
    return reglas.regla20Exacto === "matriz" ? reglas.factorAlto : reglas.factorMedio;
  }
  return reglas.factorAlto;
}

export function calcularMargen(ingreso, costo, margenParams) {
  if (!esNumero(ingreso) || ingreso === 0 || !esNumero(costo)) {
    return { margen: null, ica: null, gmf: null, utilidad: null, estado: "Pendiente" };
  }
  const ica = ingreso * margenParams.ica;
  const gmf = costo * margenParams.gmf;
  const utilidad = ingreso - costo - ica - gmf;
  return { margen: utilidad / ingreso, ica, gmf, utilidad, estado: "ok" };
}

/**
 * Factor de margen Educación: lista Excel 0 / 0,9 / 1 (vacío = 1).
 * Si el usuario escribe 90 o 100 (como %), se normaliza a 0,9 / 1.
 * Valores > 1 y ≤ 100 se interpretan como porcentaje del factor, no como multiplicador.
 */
export function normalizarFactorMargen(inp) {
  if (!esNumero(inp)) return 1;
  if (inp < 0) return 0;
  if (inp <= 1) return inp;
  if (inp <= 100) return inp / 100;
  return 1;
}

/**
 * Un producto del mes.
 * meta ≤ 0 → no pesa. factorMargen null/vacío → 1 (Educación).
 */
export function productoMes({ clave, meta, recaudada, facturas, valorFactura, factorMargenInp, topeCongreso, topeVentas, limitar }) {
  if (!esNumero(meta) || meta <= 0) {
    return { clave, meta: meta ?? null, reconocida: null, cump: 0, peso: 0, participa: false };
  }

  let reconocida = null;
  let cump = 0;
  let factorAplicado = null;

  if (clave === "educacion") {
    if (!esNumero(recaudada)) {
      return { clave, meta, reconocida: null, cump: 0, peso: 0, participa: true, pendiente: true };
    }
    factorAplicado = normalizarFactorMargen(factorMargenInp);
    reconocida = recaudada * factorAplicado;
    cump = reconocida / meta;
  } else if (clave === "mision") {
    if (!esNumero(facturas)) {
      return { clave, meta, reconocida: null, cump: 0, peso: 0, participa: true, pendiente: true };
    }
    reconocida = facturas * valorFactura;
    cump = reconocida / meta;
  } else if (clave === "congreso") {
    if (!esNumero(recaudada)) {
      return { clave, meta, reconocida: null, cump: 0, peso: 0, participa: true, pendiente: true };
    }
    reconocida = recaudada;
    cump = Math.min(topeCongreso, recaudada / meta);
  } else {
    // cultural, pasantia, patrocinios
    if (!esNumero(recaudada)) {
      return { clave, meta, reconocida: null, cump: 0, peso: 0, participa: true, pendiente: true };
    }
    reconocida = recaudada;
    cump = recaudada / meta;
  }

  if (limitar) cump = Math.min(topeVentas, cump);

  const out = { clave, meta, reconocida, cump, peso: 0, participa: true };
  if (factorAplicado != null) out.factorAplicado = factorAplicado;
  return out;
}

/**
 * Cumplimiento ponderado y puntos de ventas de un mes (o trimestre agregado).
 * @param {object[]} productos resultados de productoMes con meta
 */
export function puntosVentas(productos, pesoVentas) {
  const activos = productos.filter((p) => p.participa && esNumero(p.meta) && p.meta > 0);
  const sumaMetas = activos.reduce((s, p) => s + p.meta, 0);
  if (sumaMetas <= 0) {
    return { ponderado: 0, puntos: 0, productos: activos, sumaMetas: 0 };
  }
  const conPeso = activos.map((p) => ({ ...p, peso: p.meta / sumaMetas }));
  const ponderado = conPeso.reduce((s, p) => s + p.peso * (p.cump || 0), 0);
  const puntos = ponderado * pesoVentas;
  return { ponderado, puntos, productos: conPeso, sumaMetas };
}

/** ¿Hay algún número de entrada en el mes? */
export function hasMes(entradasMes) {
  if (!entradasMes) return false;
  const keys = ["educacion", "misionFacturas", "congreso", "inscritos", "cultural", "pasantia", "patrocinios"];
  return keys.some((k) => esNumero(entradasMes[k]));
}

/**
 * Calcula ventas de un mes.
 * entradasMes: { educacion, factorMargen, misionFacturas, congreso, cultural, ... }
 * metasMes: { educacion, mision, congreso, cultural, pasantia, patrocinios }
 */
export function calcularVentasMes(entradasMes, metasMes, parametros) {
  const valorFactura = parametros.mision.valorFactura;
  const limitar = parametros.topes.limitarVentas;
  const topeVentas = parametros.topes.ventas;
  const topeCongreso = parametros.topes.congreso;

  const defs = [
    { clave: "educacion", meta: metasMes.educacion, recaudada: entradasMes?.educacion, factorMargenInp: entradasMes?.factorMargen },
    { clave: "mision", meta: metasMes.mision, facturas: entradasMes?.misionFacturas, valorFactura },
    { clave: "congreso", meta: metasMes.congreso, recaudada: entradasMes?.congreso, topeCongreso },
    { clave: "cultural", meta: metasMes.cultural, recaudada: entradasMes?.cultural },
  ];
  if (metasMes.pasantia != null || entradasMes?.pasantia != null) {
    defs.push({ clave: "pasantia", meta: metasMes.pasantia, recaudada: entradasMes?.pasantia });
  }
  if (metasMes.patrocinios != null || entradasMes?.patrocinios != null) {
    defs.push({ clave: "patrocinios", meta: metasMes.patrocinios, recaudada: entradasMes?.patrocinios });
  }

  const productos = defs.map((d) =>
    productoMes({
      ...d,
      topeCongreso,
      topeVentas,
      limitar,
      valorFactura,
    })
  );

  const resumen = puntosVentas(productos, parametros.pesos.ventas);
  return {
    has: hasMes(entradasMes),
    ...resumen,
  };
}

/**
 * Trimestre: suma metas y ventas solo de meses con datos.
 */
export function calcularVentasTrimestre(meses, parametros) {
  const conDatos = meses.filter((m) => m.has);
  if (!conDatos.length) {
    return { has: false, ponderado: 0, puntos: 0, productos: [], sumaMetas: 0 };
  }

  const claves = ["educacion", "mision", "congreso", "cultural", "pasantia", "patrocinios"];
  const agregados = [];
  for (const clave of claves) {
    let meta = 0;
    let reconocida = 0;
    let hay = false;
    for (const m of conDatos) {
      const p = m.productos.find((x) => x.clave === clave);
      if (p && p.participa && esNumero(p.meta) && p.meta > 0) {
        hay = true;
        meta += p.meta;
        reconocida += esNumero(p.reconocida) ? p.reconocida : 0;
      }
    }
    if (!hay || meta <= 0) continue;
    let cump = reconocida / meta;
    if (clave === "congreso") cump = Math.min(parametros.topes.congreso, cump);
    if (parametros.topes.limitarVentas) cump = Math.min(parametros.topes.ventas, cump);
    agregados.push({ clave, meta, reconocida, cump, participa: true });
  }
  return { has: true, ...puntosVentas(agregados, parametros.pesos.ventas) };
}
