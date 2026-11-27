/**
 * Cálculos puros de la política PCV-COM-001.
 * No tocan la pantalla. Toda cifra llega en el objeto de parámetros.
 */

import { fechaEnMes, normalizar, textoClave } from "./carga.js";
import { nombreVisible } from "./utilidades.js";

/**
 * Factor de la curva de pago.
 * Recibe el puntaje y el bloque curva (mínimo, anclas y tope).
 * Devuelve el factor entre 0 y el tope.
 * Núm. 5.8. Por debajo del mínimo no hay variable. Entre anclas, línea recta.
 */
export function factorCurva(puntaje, curva) {
  if (puntaje < curva.minimo) return 0;

  const anclas = [...curva.anclas].sort((a, b) => a.puntaje - b.puntaje);
  const ultima = anclas[anclas.length - 1];
  if (puntaje >= ultima.puntaje) return Math.min(ultima.factor, curva.tope);

  for (let i = 0; i < anclas.length - 1; i += 1) {
    const inicio = anclas[i];
    const fin = anclas[i + 1];
    if (puntaje >= inicio.puntaje && puntaje <= fin.puntaje) {
      const tramo = (puntaje - inicio.puntaje) / (fin.puntaje - inicio.puntaje);
      const factor = inicio.factor + tramo * (fin.factor - inicio.factor);
      return Math.min(factor, curva.tope);
    }
  }

  return 0;
}

/**
 * Factor de reconocimiento según el margen del evento.
 * Recibe el margen (0.2 = 20 %) y el bloque margen.
 * Devuelve el factor bajo, medio o alto.
 * Núm. 5.4. Un margen de exactamente 20 % usa el factor medio (90 %).
 */
export function factorMargen(margen, reglasMargen) {
  if (margen < reglasMargen.umbralBajo) return reglasMargen.factorBajo;
  if (margen <= reglasMargen.umbralAlto) return reglasMargen.factorMedio;
  return reglasMargen.factorAlto;
}

/**
 * Margen del evento.
 * Recibe ingreso, costo y el bloque costos (tasas ICA y GMF).
 * Devuelve utilidad ÷ ingreso.
 * ICA es un porcentaje del ingreso. GMF es un porcentaje del costo.
 */
export function calcularMargen(ingreso, costo, costos) {
  const ica = ingreso * costos.ica;
  const gmf = costo * costos.gmf;
  const utilidad = ingreso - costo - ica - gmf;
  return utilidad / ingreso;
}

/**
 * Puntos de un indicador.
 * Recibe el peso, el cumplimiento (1 = 100 %), el tope (1.2 = 120 %) y si aplica la regla del 100 %.
 * Devuelve los puntos, sin pasar del tope del peso.
 * Con regla del 100 % (comerciales en base social, SERFISCAL y satisfacción): bajo 100 % da 0.
 * Sin esa regla (director): desde 0 % ya suma, hasta el tope.
 */
export function puntosIndicador(peso, cumplimiento, tope, reglaDel100) {
  if (reglaDel100 && cumplimiento < 1) return 0;
  return peso * Math.min(cumplimiento, tope);
}

/**
 * Score total.
 * Recibe la lista de puntos de cada indicador.
 * Devuelve la suma.
 */
export function score(puntos) {
  return puntos.reduce((suma, valor) => suma + valor, 0);
}

/**
 * Pago variable.
 * Recibe la oportunidad y el factor de la curva.
 * Devuelve oportunidad × factor.
 * Núm. 5.8.
 */
export function pagoVariable(oportunidad, factor) {
  return oportunidad * factor;
}

function texto(valor) {
  return normalizar(valor);
}

/** Cuántos meses van desde el origen, contando el primero como 1. Octubre 2026 con origen 2026-10 devuelve 1. */
export function pasosDeBaseSocial(mes, origen) {
  const [anioOrigen, mesOrigen] = origen.split("-").map(Number);
  const [anio, numeroMes] = mes.split("-").map(Number);
  const diferencia = (anio - anioOrigen) * 12 + (numeroMes - mesOrigen);
  if (diferencia < 0) return null;
  return diferencia + 1;
}

/** Meta de base social por fórmula: Base 30 sep + pasos × incremento. */
export function metaBaseSocialCalculada(comercial, mes, parametros) {
  const pasos = pasosDeBaseSocial(mes, parametros?.baseSocial?.mesOrigen || "2026-10");
  if (comercial?.baseSocialInicial === null || comercial?.baseSocialInicial === undefined || pasos === null) return null;
  const incremento = Number(parametros?.baseSocial?.incrementoPorMes);
  if (!Number.isFinite(incremento)) return null;
  return comercial.baseSocialInicial + pasos * incremento;
}

/**
 * Meta de base social del mes: si en Parámetros hay valor en baseSocialMes[mes].meta, se usa;
 * si está vacío, aplica la fórmula (Base 30 sep + pasos × incremento).
 */
export function metaBaseSocialDelMes(comercial, mes, parametros) {
  const crudo = comercial?.baseSocialMes?.[mes]?.meta;
  if (crudo !== null && crudo !== undefined && crudo !== "" && Number.isFinite(Number(crudo))) {
    return { meta: Number(crudo), origen: "manual" };
  }
  const calculada = metaBaseSocialCalculada(comercial, mes, parametros);
  return { meta: calculada, origen: calculada === null ? null : "formula" };
}

/**
 * Educación, misión, congreso, cultural, BTL o "otro". Núm. 5.4 y 5.11.
 * El mapa de grupos y cuentas llega en parametros.clasificacion, en orden.
 */
export function clasificarProducto(grupo, cuenta, parametros) {
  const nombre = texto(grupo);
  const codigo = String(cuenta || "").trim().split(/\s/)[0];
  const reglas = parametros?.clasificacion || [];
  for (const regla of reglas) {
    const porGrupo = (regla.grupos || []).some((parte) => nombre.includes(texto(parte)));
    const porCuenta = (regla.cuentas || []).includes(codigo);
    const porPrefijo = (regla.cuentasPrefijo || []).some((prefijo) => codigo.startsWith(prefijo));
    if (porGrupo || porCuenta || porPrefijo) return regla.producto;
  }
  return "otro";
}

function mismaPersona(asesor, comercial) {
  const nombre = texto(asesor);
  return nombre === texto(comercial.nombre) || nombre === texto(comercial.nombreFacturacion);
}

/** Tasa de una celda. Vacío no es cero: null, "" y undefined quedan en null. 10 se lee como 10 %. */
export function leerTasa(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const texto = typeof valor === "string" ? valor.trim().replace(/\s/g, "").replace(",", ".") : valor;
  const numero = Number(texto);
  if (!Number.isFinite(numero)) return null;
  return numero > 1 ? numero / 100 : numero;
}

/** Anticipo (cuentas 27 / 27209…): prefijo en parametros.anticipos. */
export function esCuentaAnticipo(cuenta, parametros) {
  const codigo = String(cuenta || "").trim().split(/\s/)[0];
  if (!codigo) return false;
  const prefijo = String(parametros?.anticipos?.prefijoCuenta || "27209");
  return prefijo.length > 0 && codigo.startsWith(prefijo);
}

/**
 * Facturas de Misión del comercial en el mes (hoja Misión Int. u otras clasificadas como misión).
 * En el esquema anterior cada factura aporta parametros.mision.valorFacturaAnterior (p. ej. $1.000.000).
 */
/** Esquema anterior: solo ESTADO exactamente CANCELADA (NO CANCELADA no entra). */
export function esCancelada(fila) {
  return texto(fila?.estado) === "cancelada";
}

export function misionEsquemaAnterior(filas, comercial, mes, parametros) {
  const vistas = new Set();
  const lineas = [];
  (filas || []).forEach((fila) => {
    if (asesorVacio(fila) || !mismaPersona(fila.asesor, comercial)) return;
    if (clasificarProducto(fila.grupo, fila.cuenta, parametros) !== "mision") return;
    if (!esCancelada(fila)) return;
    if (!(fila.fecha instanceof Date) || !fechaEnMes(fila.fecha, mes)) return;
    const numero = String(fila.factura ?? "").trim();
    const clave = numero || `misi-${fila.hoja || ""}-${fila.numeroFila || lineas.length}`;
    if (vistas.has(clave)) return;
    vistas.add(clave);
    lineas.push(fila);
  });
  const valorUnitario = Number(parametros?.mision?.valorFacturaAnterior) || 0;
  return {
    facturas: lineas.length,
    lineas,
    valorPorFactura: valorUnitario,
    valor: lineas.length * valorUnitario,
  };
}

/**
 * Producción del esquema anterior (comisión por tramos).
 * Suma BASE de la hoja elegida, del comercial, CANCELADA con fecha de facturación en el mes,
 * más Misión CANCELADA: N facturas × valorFacturaAnterior (hoja Misión Int.).
 * - produccion: total con anticipos 27209 + Misión (para % de cumplimiento / tramo).
 * - produccionSinAnticipos: base de la comisión (sin cuentas 27) + Misión.
 * NO CANCELADA no entra. Tampoco BTL ni filas sin asesor / sin fecha / de otro mes.
 */
export function produccionAnterior(filas, comercial, mes, parametros) {
  const lineas = filas.filter((fila) => fila.elegida === true && !asesorVacio(fila) && mismaPersona(fila.asesor, comercial)
    && esCancelada(fila)
    && fila.fecha instanceof Date && fechaEnMes(fila.fecha, mes));
  const lineasSinAnticipos = lineas.filter((fila) => !esCuentaAnticipo(fila.cuenta, parametros));
  const sumar = (lista) => lista.reduce((suma, fila) => suma + (Number(fila.base) || 0), 0);
  const mision = misionEsquemaAnterior(filas, comercial, mes, parametros);
  return {
    produccion: sumar(lineas) + mision.valor,
    produccionSinAnticipos: sumar(lineasSinAnticipos) + mision.valor,
    produccionBase: sumar(lineas),
    produccionBaseSinAnticipos: sumar(lineasSinAnticipos),
    mision,
    lineas,
    lineasSinAnticipos,
  };
}

/**
 * Total de producción del mes para la comisión anterior del director (1,5 % × base).
 * La comisión del director se calcula sin anticipos / cuentas 27 (27209…).
 * Solo CANCELADA. baseConAnticipos queda disponible por si se necesita el total producido.
 */
export function produccionTotalMes(filas, mes, parametros) {
  const lineasTodas = filas.filter((fila) => fila.elegida === true && !asesorVacio(fila)
    && esCancelada(fila)
    && fila.fecha instanceof Date && fechaEnMes(fila.fecha, mes));
  const lineas = lineasTodas.filter((fila) => !esCuentaAnticipo(fila.cuenta, parametros));
  const sumar = (lista) => lista.reduce((suma, fila) => suma + (Number(fila.base) || 0), 0);
  const grupos = new Map();
  lineas.forEach((fila) => {
    const asesor = String(fila.asesor).trim();
    const actual = grupos.get(asesor) || { asesor, base: 0, facturas: 0 };
    actual.base += Number(fila.base) || 0;
    actual.facturas += 1;
    grupos.set(asesor, actual);
  });
  return {
    base: sumar(lineas),
    baseConAnticipos: sumar(lineasTodas),
    lineas,
    lineasTodas,
    porAsesor: [...grupos.values()],
  };
}

/** Tasa del tramo. Los límites son superiores y continuos: 80 % sigue en 5 % y 80,5 % ya es 7 %. */
export function tasaPorTramo(cumplimiento, reglas) {
  if (cumplimiento === null || !Number.isFinite(cumplimiento) || !reglas) return null;
  const ajustado = Math.round(cumplimiento * 1e9) / 1e9;
  if (ajustado < reglas.minimo) return reglas.tasaBajoMinimo;
  const tramo = (reglas.tramos || []).find((item) => item.hasta === null || ajustado <= item.hasta);
  return tramo ? tramo.tasa : null;
}

/**
 * Comisión anterior por tramos.
 * Cumplimiento = producciónConAnticipos / meta (define la tasa).
 * Comisión = producciónSinAnticipos × tasa (si no se pasa, usa la misma producción).
 */
export function comisionAnteriorTramos(meta, produccion, reglas, produccionComision) {
  const baseComision = produccionComision === undefined || produccionComision === null ? produccion : produccionComision;
  if (meta === null || meta === undefined || !(meta > 0) || produccion === null || produccion === undefined) {
    return { meta, produccion, produccionComision: baseComision, cumplimiento: null, tasa: null, comision: null };
  }
  if (baseComision === null || baseComision === undefined) {
    return { meta, produccion, produccionComision: baseComision, cumplimiento: null, tasa: null, comision: null };
  }
  const cumplimiento = produccion / meta;
  const tasa = tasaPorTramo(cumplimiento, reglas);
  return {
    meta,
    produccion,
    produccionComision: baseComision,
    cumplimiento,
    tasa,
    comision: tasa === null ? null : baseComision * tasa,
  };
}

/** Comisión anterior del director: un porcentaje fijo sobre el total de producción del mes. */
export function comisionAnteriorDirector(base, tasa) {
  if (base === null || base === undefined || tasa === null || tasa === undefined) return null;
  return base * tasa;
}

/** Comisión BTL anterior: ingreso de ejecución × tasa. Sin ingreso, null. No usa el recaudo. */
export function comisionBtlAnterior(base, tasa) {
  if (base === null || base === undefined || tasa === null || tasa === undefined) return null;
  const numero = Number(base);
  const tasaNumero = Number(tasa);
  if (!Number.isFinite(numero) || !Number.isFinite(tasaNumero)) return null;
  return numero * tasaNumero;
}

/** Suma el ingreso de ejecución. Sin el dato, pendiente. Un comercial sin eventos queda en 0. */
export function ingresoEjecucionBtl(eventos, comercial) {
  const lista = eventos || [];
  const propios = comercial ? lista.filter((evento) => mismaPersona(evento.comercial, comercial)) : lista;
  if (comercial && !propios.length) return { base: 0, pendiente: false };
  if (!propios.length) return { base: null, pendiente: true };
  const falta = propios.some((evento) => {
    const valor = evento.ingresoEjecucion;
    return valor === null || valor === undefined || valor === "" || !Number.isFinite(Number(valor));
  });
  if (falta) return { base: null, pendiente: true };
  return { base: propios.reduce((suma, evento) => suma + Number(evento.ingresoEjecucion), 0), pendiente: false };
}

/** Facturas BTL del mes (Producción/Facturación), opcionalmente de un evento y un comercial. No usa el recaudo. */
function facturasBtlMes(filas, mes, parametros, facturaAEvento, { comercial = null, eventoId = null } = {}) {
  const claveEv = eventoId === null || eventoId === undefined || String(eventoId).trim() === "" ? "" : textoClave(eventoId);
  return (filas || []).filter((fila) => {
    if (asesorVacio(fila)) return false;
    if (!(fila.fecha instanceof Date) || !fechaEnMes(fila.fecha, mes)) return false;
    if (clasificarProducto(fila.grupo, fila.cuenta, parametros) !== "btl") return false;
    if (comercial && !mismaPersona(fila.asesor, comercial)) return false;
    if (claveEv && textoClave(eventoDeFila(fila, facturaAEvento)) !== claveEv) return false;
    return true;
  });
}

/**
 * Comisión BTL del esquema anterior de un evento.
 * Base: (1) TOTAL INGRESOS ejecución del archivo del evento, (2) suma de bases de facturas BTL en Producción, (3) pendiente.
 * Tasa: (1) % comisión de esas facturas (factura × factura si difieren), (2) anterior.tasaBtl con aviso.
 */
export function detalleBtlAnteriorEvento(evento, filas, comercial, mes, parametros, facturaAEvento, tasaParam) {
  const id = evento?.evento;
  const facturas = facturasBtlMes(filas, mes, parametros, facturaAEvento, { comercial, eventoId: id });
  const deArchivo = Boolean(evento?.origenBtl) && Number.isFinite(Number(evento.ingreso));
  let base = null;
  let origenBase = "";
  if (deArchivo) {
    base = Number(evento.ingreso);
    origenBase = "archivo";
  } else if (facturas.length) {
    base = facturas.reduce((suma, fila) => suma + (Number(fila.base) || 0), 0);
    origenBase = "produccion";
  }
  if (base === null) {
    return {
      evento: id, pendiente: true, base: null, tasa: null, comision: null,
      origenBase: "", origenTasa: "", tasaSupuesta: false, facturas: 0,
    };
  }
  const conTasa = facturas
    .map((fila) => ({ base: Number(fila.base) || 0, tasa: leerTasa(fila.comision) }))
    .filter((linea) => linea.tasa !== null);
  if (conTasa.length) {
    const comisionFacturas = conTasa.reduce((suma, linea) => suma + linea.base * linea.tasa, 0);
    const baseFacturas = conTasa.reduce((suma, linea) => suma + linea.base, 0);
    const tasa = baseFacturas > 0 ? comisionFacturas / baseFacturas : null;
    const comision = origenBase === "archivo" ? comisionBtlAnterior(base, tasa) : comisionFacturas;
    return {
      evento: id, pendiente: false, base, tasa, comision,
      origenBase, origenTasa: "factura", tasaSupuesta: false, facturas: facturas.length,
    };
  }
  const tasa = tasaParam ?? null;
  return {
    evento: id, pendiente: false, base, tasa,
    comision: comisionBtlAnterior(base, tasa),
    origenBase, origenTasa: "parametro", tasaSupuesta: true, facturas: facturas.length,
  };
}

/** Suma la comisión BTL anterior del comercial (con su % de reparto 5.12). */
export function btlAnteriorDeComercial(comercial, btlMes, filas, mes, parametros, facturaAEvento) {
  const tasaParam = parametros.anterior?.tasaBtl ?? null;
  if (!btlMes?.length) {
    return { pendiente: false, base: 0, tasa: null, comision: 0, detalle: [], tasaSupuesta: false };
  }
  const detalle = [];
  let pendiente = false;
  let comision = 0;
  let base = 0;
  let tasaSupuesta = false;
  for (const item of btlMes) {
    const fila = detalleBtlAnteriorEvento(item.evento, filas, comercial, mes, parametros, facturaAEvento, tasaParam);
    const parte = Number(item.porcentajeReparto);
    const participacion = Number.isFinite(parte) ? parte : 1;
    if (fila.pendiente) {
      pendiente = true;
      detalle.push({ ...fila, participacion, comision: null });
      continue;
    }
    const propia = (fila.comision ?? 0) * participacion;
    detalle.push({ ...fila, participacion, comision: propia, comisionEvento: fila.comision });
    comision += propia;
    base += (fila.base ?? 0) * participacion;
    if (fila.tasaSupuesta) tasaSupuesta = true;
  }
  if (pendiente) {
    return { pendiente: true, base: null, tasa: null, comision: null, detalle, tasaSupuesta };
  }
  const tasa = base > 0 ? comision / base : (detalle[0]?.tasa ?? null);
  return { pendiente: false, base, tasa, comision, detalle, tasaSupuesta };
}

/** BTL anterior del director: tasa fija sobre la base de archivos de márgenes del mes. Sin archivo → pendiente. */
export function btlAnteriorDeDirector(eventosBtl, parametros) {
  const tasa = parametros.director?.tasaBtlAnterior ?? null;
  const lista = eventosBtl || [];
  if (!lista.length) return { pendiente: false, base: 0, tasa, comision: 0 };
  const conArchivo = lista.filter((item) => item.evento?.origenBtl && Number.isFinite(Number(item.evento.ingreso)));
  if (!conArchivo.length) return { pendiente: true, base: null, tasa, comision: null };
  const base = conArchivo.reduce((suma, item) => suma + Number(item.evento.ingreso), 0);
  return { pendiente: false, base, tasa, comision: comisionBtlAnterior(base, tasa) };
}

/** Texto del tramo que se aplicó, para la ficha. */
export function describirTramo(cumplimiento, reglas) {
  if (cumplimiento === null || !Number.isFinite(cumplimiento) || !reglas) return "";
  const ajustado = Math.round(cumplimiento * 1e9) / 1e9;
  const enTexto = (valor) => `${Math.round(valor * 100)} %`;
  if (ajustado < reglas.minimo) return `menor a ${enTexto(reglas.minimo)}`;
  let piso = reglas.minimo;
  let primero = true;
  for (const tramo of reglas.tramos || []) {
    if (tramo.hasta === null || ajustado <= tramo.hasta) {
      if (tramo.hasta === null) return `más de ${enTexto(piso)}`;
      return primero ? `de ${enTexto(piso)} a ${enTexto(tramo.hasta)}` : `más de ${enTexto(piso)} y hasta ${enTexto(tramo.hasta)}`;
    }
    piso = tramo.hasta;
    primero = false;
  }
  return "";
}

/**
 * Recaudo de la política nueva: ESTADO exactamente CANCELADA y fecha de facturación en el mes.
 * La BASE sale del Excel; no se filtra por mes de pago (una cancelada pagada en noviembre
 * con factura de octubre cuenta en octubre). «NO CANCELADA» no entra.
 */
export function esRecaudo(fila, mes, _parametros) {
  if (texto(fila.estado) !== "cancelada") return false;
  if (!(fila.fecha instanceof Date)) return false;
  return fechaEnMes(fila.fecha, mes);
}

function asesorVacio(fila) {
  return fila.asesor === null || fila.asesor === undefined || String(fila.asesor).trim() === "";
}

function esHojaComplementaria(fila, parametros) {
  const hoja = texto(fila.hoja);
  const marcas = parametros?.hojas || {};
  const mision = texto(marcas.mision || "mision");
  const btl = texto(marcas.btl || "btl");
  return hoja.includes(mision) || hoja.includes(btl);
}

/** La hoja elegida trae fila.elegida. Si el dato no viene marcado, se asume elegida salvo Misión o BTL. */
function deHojaElegida(fila, parametros) {
  if (typeof fila.elegida === "boolean") return fila.elegida;
  return !esHojaComplementaria(fila, parametros);
}

/** En el esquema anterior: CANCELADA, del mes (o sin fecha). NO CANCELADA y otro mes no entran. */
function cuentaParaAnterior(fila, mes) {
  if (!esCancelada(fila)) return false;
  if (!(fila.fecha instanceof Date)) return true;
  return fechaEnMes(fila.fecha, mes);
}

function eventoDeFila(fila, facturaAEvento) {
  const propio = textoClave(fila.evento);
  if (propio) return propio;
  const factura = textoClave(fila.factura);
  if (factura && facturaAEvento && facturaAEvento.has(factura)) return facturaAEvento.get(factura);
  return "";
}

/**
 * Cumplimiento ponderado por la meta de cada producto.
 * Recibe ventas y metas. Una meta vacía con ventas devuelve faltantes.
 * Núm. 5.4. Congreso no pasa de su tope.
 */
/**
 * Cumplimiento ponderado de ventas (5.3 / 5.4).
 * Cada producto se mide contra su meta y aporta según su participación en la meta (peso).
 * v19: cada producto se reconoce hasta topeProducto (por defecto 120 %) y Congreso hasta topeCongreso (100 %),
 * para que el exceso de un producto no oculte el incumplimiento de otro.
 * Devuelve cumplimiento = Σ peso × cumplimiento elegible, y por producto: cumplimiento real y elegible.
 */
export function cumplimientoVentas(ventas, metas, topeCongreso, topeProducto) {
  const faltantes = [];
  const activos = [];
  Object.keys(ventas).forEach((producto) => {
    const meta = metas[producto];
    const venta = ventas[producto];
    if (venta === null) faltantes.push(producto);
    else if ((meta === null || meta === undefined) && venta > 0) faltantes.push(producto);
    else if (meta > 0) activos.push({ producto, meta, venta });
  });
  if (faltantes.length) return { cumplimiento: null, faltantes, detalle: [] };
  const sumaMetas = activos.reduce((suma, item) => suma + item.meta, 0);
  if (sumaMetas === 0) return { cumplimiento: 0, faltantes: [], detalle: [] };
  const tope = Number.isFinite(Number(topeProducto)) && topeProducto !== null && topeProducto !== "" ? Number(topeProducto) : Infinity;
  let cumplimiento = 0;
  const detalle = activos.map((item) => {
    const real = item.venta / item.meta;
    const topeDe = item.producto === "congreso" ? Math.min(Number(topeCongreso ?? Infinity), tope) : tope;
    const elegible = Math.min(real, topeDe);
    const peso = item.meta / sumaMetas;
    cumplimiento += peso * elegible;
    return { ...item, peso, cumplimiento: real, elegible, topeProducto: topeDe, excede: real > topeDe };
  });
  return { cumplimiento, faltantes: [], detalle };
}

/** Puntos por producto: peso del producto × cumplimiento elegible × peso del indicador. Cuadra con los puntos de ventas. */
export function puntosPorProducto(detalle, pesoVentas, topeIndicador) {
  const suma = detalle.reduce((s, item) => s + item.peso * item.elegible, 0);
  // Si el tope del indicador corta la suma (solo pasa si el tope por producto es mayor), se reparte en proporción.
  const ajuste = suma > topeIndicador && suma > 0 ? topeIndicador / suma : 1;
  return detalle.map((item) => ({ ...item, puntos: pesoVentas * item.peso * item.elegible * ajuste, ajusteIndicador: ajuste }));
}

/** En el primer mes, la meta se multiplica por días trabajados ÷ días del mes. Sin esos días, la meta queda como está. */
function metaProrrateada(comercial, mes, meta) {
  if (meta === null || meta === undefined) return meta;
  if (mes !== comercial.activoDesde) return meta;
  const trabajados = Number(comercial.diasTrabajados);
  const dias = Number(comercial.diasMes);
  if (!Number.isFinite(trabajados) || !Number.isFinite(dias) || dias === 0) return meta;
  return meta * trabajados / dias;
}

function metasDelMes(comercial, mes, parametros) {
  const guardadas = comercial.metas?.[mes] || {};
  const cultural = String(mes).slice(5) === String(parametros.cultural.mes).padStart(2, "0") && comercial.cartones != null
    ? comercial.cartones * parametros.cultural.valorCarton
    : 0;
  return {
    eduAt: metaProrrateada(comercial, mes, guardadas.eduAt ?? null),
    mision: metaProrrateada(comercial, mes, guardadas.mision ?? null),
    congreso: metaProrrateada(comercial, mes, guardadas.congreso ?? null),
    cultural: metaProrrateada(comercial, mes, cultural),
    pasantia: null,
    patrocinio: null,
  };
}

function puntosNeutroOMedido(peso, medida, tope) {
  if (medida === null || medida === undefined || medida === "") {
    return { puntos: peso, neutral: true, cumplimiento: 1 };
  }
  const cumplimiento = Number(medida) / 100;
  return {
    puntos: puntosIndicador(peso, cumplimiento, tope, true),
    neutral: false,
    cumplimiento,
  };
}

function puntosInnovacion(comercial, parametros) {
  const peso = parametros.pesos.innovacion;
  const { ofertasAprobadas, primerasVentas } = comercial;
  if (ofertasAprobadas == null && primerasVentas == null) {
    return { puntos: peso, neutral: true };
  }
  const ofertas = Number(ofertasAprobadas) || 0;
  // La primera venta solo suma si la oferta fue aprobada.
  const primeras = ofertas > 0 ? (Number(primerasVentas) || 0) : 0;
  const bruto = ofertas * parametros.innovacion.puntosOferta + primeras * parametros.innovacion.puntosPrimeraVenta;
  const topeOfertas = ofertas > 0 ? ofertas * parametros.innovacion.maximoPorOferta : 0;
  const usados = Number(comercial.innovacionAcumuladaTrimestre) || 0;
  const disponible = Math.max(0, parametros.innovacion.maximoTrimestre - usados);
  const tope = Math.min(disponible, ofertas > 0 ? topeOfertas : disponible);
  return { puntos: Math.min(bruto, tope), neutral: false };
}

/**
 * Producción de Misión Internacional para la política nueva: sale del archivo de Producción
 * (filas con ASESOR/BASE/GRUPO·SERVICIO clasificadas como misión). Suma la BASE del comercial.
 * Si la fila trae fecha, solo cuenta las del mes; si no trae fecha, cuenta todas.
 */
export function produccionMisionNueva(filasProduccion, comercial, mes, parametros) {
  const lineas = (filasProduccion || []).filter((fila) => {
    if (asesorVacio(fila) || !mismaPersona(fila.asesor, comercial)) return false;
    if (clasificarProducto(fila.grupo, fila.cuenta, parametros) !== "mision") return false;
    if (fila.fecha instanceof Date) return fechaEnMes(fila.fecha, mes);
    return true;
  });
  return {
    produccion: lineas.reduce((suma, fila) => suma + (Number(fila.base) || 0), 0),
    lineas,
    facturas: new Set(lineas.map((fila) => String(fila.factura ?? "").trim()).filter(Boolean)).size,
  };
}

/**
 * Liquidación de un comercial en un mes.
 * Devuelve score, pagos y la lista de datos que faltan. No inventa el margen.
 * filasProduccionDetalle: líneas ASESOR/BASE del libro de Producción (Misión Internacional).
 */
export function liquidarComercial(comercial, filas, mes, parametros, margenesEvento, facturaAEvento, eventos, filasProduccionDetalle = []) {
  const avisos = [];
  const margenes = margenesEvento || new Map();
  const anteriores = filas.filter((fila) => deHojaElegida(fila, parametros)
    && !asesorVacio(fila)
    && mismaPersona(fila.asesor, comercial)
    && cuentaParaAnterior(fila, mes));
  anteriores.forEach((fila) => {
    if (!(fila.fecha instanceof Date)) avisos.push(`La factura ${fila.factura || "sin número"} no tiene fecha.`);
  });

  function sirveParaPoliticaNueva(fila) {
    const producto = clasificarProducto(fila.grupo, fila.cuenta, parametros);
    // La Misión de la política nueva sale del archivo de Producción, no del recaudo de Facturación.
    if (producto === "mision" || producto === "btl") return false;
    if (deHojaElegida(fila, parametros)) return true;
    return esHojaComplementaria(fila, parametros);
  }

  const elegibles = filas.filter((fila) => !asesorVacio(fila)
    && mismaPersona(fila.asesor, comercial)
    && esRecaudo(fila, mes, parametros)
    && sirveParaPoliticaNueva(fila));
  const ventas = { eduAt: 0, mision: 0, congreso: 0, cultural: 0, pasantia: 0, patrocinio: 0 };
  const facturasMision = new Set();
  let eduReconocida = 0;
  let misionDesdeProduccion = null;

  elegibles.forEach((fila) => {
    const producto = clasificarProducto(fila.grupo, fila.cuenta, parametros);
    if (producto === "btl" || producto === "mision") return;
    if (producto === "eduAt") {
      const clave = eventoDeFila(fila, facturaAEvento);
      const margenEvento = clave && margenes.has(clave) ? margenes.get(clave) : null;
      const factorDefecto = parametros.margen.factorPorDefecto;
      const sinFactorDefecto = factorDefecto === null || factorDefecto === undefined || factorDefecto === "";
      // Sin margen del evento: 100 % de la BASE (nunca queda pendiente).
      const factor = margenEvento !== null
        ? factorMargen(margenEvento, parametros.margen)
        : (sinFactorDefecto ? 1 : Number(factorDefecto));
      eduReconocida += (Number(fila.base) || 0) * factor;
      return;
    }
    if (producto === "otro") avisos.push(`Producto sin clasificar en ${fila.factura || "una factura"}.`);
    else ventas[producto] += Number(fila.base) || 0;
  });

  // Preferir detalle del libro de Producción; si no hay, usar hoja Misión Int. del libro de Facturación (suma de BASE).
  misionDesdeProduccion = produccionMisionNueva(filasProduccionDetalle, comercial, mes, parametros);
  if (!misionDesdeProduccion.lineas.length) {
    misionDesdeProduccion = produccionMisionNueva(filas, comercial, mes, parametros);
  }
  if (misionDesdeProduccion.lineas.length) {
    ventas.mision = misionDesdeProduccion.produccion;
    misionDesdeProduccion.lineas.forEach((fila, indice) => {
      const numero = String(fila.factura ?? "").trim();
      facturasMision.add(numero || `misi-${fila.hoja || ""}-${indice}`);
    });
  } else {
    ventas.mision = 0;
  }
  ventas.eduAt = eduReconocida;

  const metas = metasDelMes(comercial, mes, parametros);
  const ponderado = cumplimientoVentas(ventas, metas, parametros.topeCongreso, parametros.topeProducto);
  const faltantes = [...ponderado.faltantes];
  const tope = parametros.topeIndicador;
  const puntos = {};
  puntos.ventas = ponderado.cumplimiento === null
    ? null
    : parametros.pesos.ventas * Math.min(ponderado.cumplimiento, tope);

  const pasos = pasosDeBaseSocial(mes, parametros.baseSocial.mesOrigen);
  const ingresos = comercial.ingresos === undefined ? 0 : comercial.ingresos;
  const retiros = comercial.retiros === undefined ? 0 : comercial.retiros;
  let baseSocial = { cierre: null, meta: null, cumplimiento: null, neutral: false, nota: "" };
  const primerMes = mes === comercial.activoDesde;
  if ((comercial.baseSocialInicial === null || comercial.baseSocialInicial === undefined) && primerMes) {
    puntos.baseSocial = parametros.pesos.baseSocial;
    baseSocial.neutral = true;
    baseSocial.nota = "Neutral: primer mes";
    baseSocial.cumplimiento = 1;
  } else if (comercial.baseSocialInicial === null || ingresos === null || retiros === null || pasos === null) {
    puntos.baseSocial = null;
    faltantes.push("base social");
  } else {
    baseSocial.cierre = Math.round(comercial.baseSocialInicial + ingresos - retiros);
    const metaMes = metaBaseSocialDelMes(comercial, mes, parametros);
    baseSocial.meta = metaMes.meta;
    baseSocial.metaOrigen = metaMes.origen;
    baseSocial.metaCalculada = metaBaseSocialCalculada(comercial, mes, parametros);
    baseSocial.cumplimiento = baseSocial.meta ? baseSocial.cierre / baseSocial.meta : null;
    // Regla del 100 %: bajo 100 % de cumplimiento → 0 puntos de base social.
    puntos.baseSocial = puntosIndicador(parametros.pesos.baseSocial, baseSocial.cumplimiento, tope, true);
  }

  const serfiscal = puntosNeutroOMedido(parametros.pesos.serfiscal, comercial.serfiscal, tope);
  const satisfaccion = comercial.satisfaccion === null || comercial.satisfaccion === undefined || comercial.satisfaccion === ""
    ? { puntos: parametros.pesos.satisfaccion, neutral: true, cumplimiento: 1 }
    : {
      neutral: false,
      cumplimiento: Number(comercial.satisfaccion) / parametros.satisfaccionEsperada,
      puntos: puntosIndicador(
        parametros.pesos.satisfaccion,
        Number(comercial.satisfaccion) / parametros.satisfaccionEsperada,
        tope,
        true
      ),
    };
  const innovacion = puntosInnovacion(comercial, parametros);
  puntos.serfiscal = serfiscal.puntos;
  puntos.satisfaccion = satisfaccion.puntos;
  puntos.innovacion = innovacion.puntos;

  const hayHueco = Object.values(puntos).some((valor) => valor === null) || faltantes.length > 0;
  const total = hayHueco ? null : score([puntos.ventas, puntos.baseSocial, puntos.serfiscal, puntos.innovacion, puntos.satisfaccion]);
  const factorPago = total === null ? null : factorCurva(total, parametros.curva);
  const pagoNuevo = factorPago === null || comercial.oportunidad === null ? null : pagoVariable(comercial.oportunidad, factorPago);

  const produccionMes = produccionAnterior(filas, comercial, mes, parametros);
  let pagoAnterior = null;
  let anteriorTramos = null;
  if (comercial.tieneEsquemaAnterior) {
    const reglas = parametros.anterior;
    const delMes = comercial.anteriorMes?.[mes] || {};
    const manualValor = delMes.produccionManual;
    const manual = manualValor !== null && manualValor !== undefined && manualValor !== "" && Number.isFinite(Number(manualValor));
    // Cumplimiento: BASE elegida (con 27) + Misión (N × valorFacturaAnterior). Comisión: sin anticipos + Misión.
    const produccionUsada = manual ? Number(manualValor) : produccionMes.produccion;
    const produccionComision = manual ? Number(manualValor) : produccionMes.produccionSinAnticipos;
    const meta = delMes.meta === undefined ? null : delMes.meta;
    const calculo = comisionAnteriorTramos(meta, produccionUsada, reglas, produccionComision);
    pagoAnterior = calculo.comision;
    anteriorTramos = {
      meta: calculo.meta,
      produccion: calculo.produccion,
      produccionComision: calculo.produccionComision,
      produccionArchivo: produccionMes.produccion,
      produccionBase: produccionMes.produccionBase,
      produccionSinAnticipos: produccionMes.produccionSinAnticipos,
      mision: produccionMes.mision,
      manual,
      cumplimiento: calculo.cumplimiento,
      tasa: calculo.tasa,
      comision: calculo.comision,
      lineas: produccionMes.lineas,
      lineasSinAnticipos: produccionMes.lineasSinAnticipos,
    };
    if (!(meta > 0)) avisos.push("Falta la meta mensual de la política anterior");
    if (produccionMes.lineas.some((fila) => leerTasa(fila.comision) === null)) avisos.push("El archivo no trae % de comisión");
  }

  const enPeriodo = mes >= parametros.transicion.desde && mes <= parametros.transicion.hasta;
  let transicion = { esquema: "nueva", pagada: pagoNuevo };
  if (pagoNuevo === null) transicion = { esquema: "pendiente", pagada: null };
  else if (enPeriodo && pagoAnterior !== null) {
    // BTL anterior no entra a la transición mientras anterior.btlEntraTransicion sea false.
    transicion = pagoAnterior >= pagoNuevo
      ? { esquema: "anterior", pagada: pagoAnterior }
      : { esquema: "nueva", pagada: pagoNuevo };
  }

  const ajusteValor = Number.isFinite(Number(comercial.ajusteValor)) ? Number(comercial.ajusteValor) : 0;
  const pagoAjustado = transicion.pagada === null
    ? (ajusteValor ? ajusteValor : null)
    : transicion.pagada + ajusteValor;

  const ficha = armarFicha(comercial, filas, mes, parametros, margenes, facturaAEvento, eventos || [], {
    anteriores,
    elegibles,
    eduPendiente: false,
    eduReconocida,
    facturasMision,
    ponderado,
    tope,
    lineasProduccion: produccionMes.lineas,
    misionDesdeProduccion,
    misionAnteriorCalc: produccionMes.mision,
  });

  const trabajados = Number(comercial.diasTrabajados);
  const diasMes = Number(comercial.diasMes);
  const prorrateo = mes === comercial.activoDesde && comercial.activoDesde !== parametros.transicion.desde
    ? {
      diasTrabajados: comercial.diasTrabajados,
      diasMes: comercial.diasMes,
      factor: Number.isFinite(trabajados) && Number.isFinite(diasMes) && diasMes !== 0 ? trabajados / diasMes : null,
    }
    : null;

  return {
    nombre: comercial.nombre,
    comercial,
    ventas,
    metas,
    detalleVentas: puntosPorProducto(ponderado.detalle, parametros.pesos.ventas, tope).map((item) => ({
      ...item,
      conTope: item.elegible,
      aporte: item.puntos,
    })),
    cumplimientoConTope: ponderado.cumplimiento === null ? null : Math.min(ponderado.cumplimiento, tope),
    cumplimientoPonderado: ponderado.cumplimiento,
    puntos,
    baseSocial,
    serfiscal,
    satisfaccion,
    innovacion,
    neutrales: { serfiscal: serfiscal.neutral, satisfaccion: satisfaccion.neutral, innovacion: innovacion.neutral },
    score: total,
    factor: factorPago,
    pagoNuevo,
    pagoAnterior,
    anteriorTramos,
    diferencia: pagoNuevo === null || pagoAnterior === null ? null : pagoNuevo - pagoAnterior,
    transicion,
    ajuste: {
      valor: ajusteValor || null,
      mesReferencia: comercial.ajusteMes || "",
      nota: comercial.ajusteNota || "",
    },
    pagoAjustado,
    faltantes,
    avisos,
    suyas: anteriores,
    prorrateo,
    ...ficha,
  };
}

function textoPorcentaje(valor) {
  return `${Math.round(Number(valor) * 100)} %`;
}

function bandaMargen(margen, reglas) {
  if (margen < reglas.umbralBajo) return `Menor al ${textoPorcentaje(reglas.umbralBajo)} · ${textoPorcentaje(reglas.factorBajo)}`;
  if (margen <= reglas.umbralAlto) return `Entre ${textoPorcentaje(reglas.umbralBajo)} y ${textoPorcentaje(reglas.umbralAlto)} · ${textoPorcentaje(reglas.factorMedio)}`;
  return `Mayor al ${textoPorcentaje(reglas.umbralAlto)} · ${textoPorcentaje(reglas.factorAlto)}`;
}

function factorDeEdu(fila, margenes, facturaAEvento, parametros) {
  const clave = eventoDeFila(fila, facturaAEvento);
  const margenEvento = clave && margenes.has(clave) ? margenes.get(clave) : null;
  const factorDefecto = parametros.margen.factorPorDefecto;
  const sinFactorDefecto = factorDefecto === null || factorDefecto === undefined || factorDefecto === "";
  // Sin margen del evento: 100 % de la BASE (no pendiente).
  const factor = margenEvento !== null
    ? factorMargen(margenEvento, parametros.margen)
    : (sinFactorDefecto ? 1 : Number(factorDefecto));
  return { clave, margenEvento, factor };
}

/** Detalle de la ficha. No cambia el pago: relee las mismas filas que ya liquidó. */
function armarFicha(comercial, filas, mes, parametros, margenes, facturaAEvento, eventos, datos) {
  const vistos = new Set();
  const filasFicha = [];
  [...datos.anteriores, ...datos.elegibles].forEach((fila) => {
    const id = `${fila.hoja || ""}|${fila.numeroFila || ""}|${fila.factura || ""}|${fila.cuenta || ""}`;
    if (vistos.has(id)) return;
    vistos.add(id);
    filasFicha.push(fila);
  });

  let baseEdu = 0;
  let basePorMargen = 0;
  let baseConMargen = 0;
  const facturasMisionReconocidas = new Set();
  const detalleFacturas = filasFicha.map((fila) => {
    const producto = clasificarProducto(fila.grupo, fila.cuenta, parametros);
    const elegible = datos.elegibles.includes(fila);
    const complementaria = esHojaComplementaria(fila, parametros);
    const base = Number(fila.base) || 0;
    const edu = producto === "eduAt" ? factorDeEdu(fila, margenes, facturaAEvento, parametros) : { clave: eventoDeFila(fila, facturaAEvento), margenEvento: null, factor: null };
    let ventaReconocida = 0;
    let uso = "Solo esquema anterior";
    if (producto === "eduAt" && elegible) {
      uso = "Edu/AT · política nueva";
      baseEdu += base;
      ventaReconocida = base * (edu.factor ?? 1);
      if (edu.margenEvento !== null) {
        basePorMargen += base * edu.margenEvento;
        baseConMargen += base;
      }
    } else if (producto === "eduAt") {
      uso = "Edu/AT · no recaudada en el mes";
    } else if (producto === "mision" && complementaria) {
      uso = "Misión · valor fijo por factura";
      const numero = String(fila.factura ?? "").trim();
      if (!facturasMisionReconocidas.has(numero)) {
        facturasMisionReconocidas.add(numero);
        ventaReconocida = parametros.mision.valorFacturaNueva;
      }
    } else if (producto === "mision") {
      uso = "Misión · esquema anterior";
    } else if (producto === "btl" && complementaria) {
      uso = "BTL · se liquida en 5.11.5";
    } else if (producto === "btl") {
      uso = "BTL · referencia (hoja Facturación)";
    }
    return {
      factura: fila.factura || "",
      origen: fila.hoja || "",
      uso,
      producto: nombreVisible(producto),
      productoClave: producto,
      cuenta: fila.cuenta || "",
      evento: edu.clave || eventoDeFila(fila, facturaAEvento),
      base,
      estado: fila.estado || "",
      fechaPago: fila.fechaPago instanceof Date ? fila.fechaPago : null,
      elegible,
      recaudo: elegible ? base : 0,
      margenEvento: edu.margenEvento,
      factorAplicado: producto === "eduAt" && elegible ? edu.factor : null,
      ventaReconocida,
    };
  });
  const ordenUso = [
    "Edu/AT · política nueva",
    "Edu/AT · no recaudada en el mes",
    "Misión · producción (política nueva)",
    "Misión · valor fijo por factura",
    "Misión · esquema anterior",
    "BTL · se liquida en 5.11.5",
    "BTL · referencia (hoja Facturación)",
    "Solo esquema anterior",
  ];
  // El sort de detalleFacturas se hace después de agregar las líneas de Misión de Producción.
  const ventaRecaudada = baseEdu;
  const ventaReconocida = datos.eduReconocida;
  const eduAt = {
    ventaRecaudada,
    ventaReconocida,
    // Solo promedia eventos con margen conocido; el resto ya entró al 100 % de BASE.
    margenComprobado: baseConMargen === 0 ? null : basePorMargen / baseConMargen,
    factorReconocimiento: ventaRecaudada === 0 ? null : ventaReconocida / ventaRecaudada,
  };

  const lineasMisionProd = datos.misionDesdeProduccion?.lineas || [];
  const valorRealMision = lineasMisionProd.reduce((suma, fila) => suma + (Number(fila.base) || 0), 0);
  const mision = {
    facturas: datos.facturasMision.size,
    valorPorFactura: parametros.mision.valorFacturaNueva,
    valorReal: valorRealMision,
    ventaReconocida: valorRealMision,
    origen: "produccion",
    lineas: lineasMisionProd,
  };

  // Añade las líneas de Misión del archivo de Producción al detalle de la ficha.
  lineasMisionProd.forEach((fila) => {
    const id = `prod|${fila.hoja || ""}|${fila.numeroFila || ""}|${fila.factura || ""}|${fila.cuenta || ""}`;
    if (vistos.has(id)) return;
    vistos.add(id);
    detalleFacturas.push({
      factura: fila.factura || "",
      origen: fila.hoja || "Producción",
      uso: "Misión · producción (política nueva)",
      producto: nombreVisible("mision"),
      productoClave: "mision",
      cuenta: fila.cuenta || "",
      evento: eventoDeFila(fila, facturaAEvento),
      base: Number(fila.base) || 0,
      estado: fila.estado || "",
      fechaPago: fila.fechaPago instanceof Date ? fila.fechaPago : null,
      elegible: true,
      recaudo: Number(fila.base) || 0,
      margenEvento: null,
      factorAplicado: null,
      ventaReconocida: Number(fila.base) || 0,
    });
  });
  detalleFacturas.sort((a, b) => ordenUso.indexOf(a.uso) - ordenUso.indexOf(b.uso));

  const detalleAnterior = (datos.lineasProduccion || []).map((fila) => ({
    factura: fila.factura || "",
    cliente: fila.cliente || "",
    cuenta: fila.cuenta || "",
    grupo: fila.grupo || "",
    fecha: fila.fecha instanceof Date ? fila.fecha : null,
    estado: fila.estado || "",
    base: Number(fila.base) || 0,
    producto: nombreVisible(clasificarProducto(fila.grupo, fila.cuenta, parametros)),
  }));
  // BTL anterior se recalcula en liquidarMes (archivo / Producción + % de factura), no desde parametros.btl.eventos.
  const ingresoBtlAnterior = null;
  const tasaBtlAnterior = parametros.anterior?.tasaBtl ?? null;
  const btlAnterior = null;
  const misionAnt = datos.misionAnteriorCalc || { facturas: 0, valorPorFactura: parametros.mision.valorFacturaAnterior, valor: 0, lineas: [] };

  const claves = new Set(detalleFacturas.map((fila) => fila.evento).filter(Boolean));
  const margenesEventos = [...claves].map((clave) => {
    const evento = eventos.find((item) => textoClave(item.evento) === textoClave(clave));
    const ingreso = evento ? Number(evento.ingreso) : null;
    const costo = evento ? Number(evento.costo) : null;
    const ica = ingreso === null ? null : ingreso * parametros.costos.ica;
    const gmf = costo === null ? null : costo * parametros.costos.gmf;
    const margen = ingreso && costo !== null && Number.isFinite(costo) ? calcularMargen(ingreso, costo, parametros.costos) : (margenes.has(clave) ? margenes.get(clave) : null);
    const productos = new Set(detalleFacturas.filter((fila) => fila.evento === clave).map((fila) => fila.productoClave));
    const textoEvento = texto(`${evento?.grupo || ""} ${evento?.producto || ""}`);
    const marcaBtl = texto(parametros.hojas?.btl || "btl");
    const marcaMision = texto(parametros.hojas?.mision || "mision");
    let banda = margen === null ? "" : bandaMargen(margen, parametros.margen);
    if (textoEvento.includes(marcaBtl) || (productos.size && [...productos].every((producto) => producto === "btl"))) {
      banda = "No aplica (BTL: 5.11.5)";
    } else if (textoEvento.includes(marcaMision) || (productos.size && [...productos].every((producto) => producto === "mision"))) {
      banda = "No aplica (Misión: valor fijo)";
    }
    return {
      numero: clave,
      evento: evento?.detalle || evento?.producto || evento?.grupo || clave,
      facturas: [...new Set(detalleFacturas.filter((fila) => fila.evento === clave).map((fila) => fila.factura).filter(Boolean))],
      ingreso,
      costo,
      ica,
      gmf,
      costoTotal: ica === null || gmf === null ? null : costo + ica + gmf,
      margen,
      banda,
    };
  });

  return {
    detalleFacturas,
    eduAt,
    mision,
    detalleAnterior,
    btlAnterior,
    ingresoBtlAnterior,
    tasaBtlAnterior,
    btlAnteriorDetalle: [],
    btlAnteriorTasaSupuesta: false,
    misionAnterior: {
      facturas: misionAnt.facturas,
      valorPorFactura: misionAnt.valorPorFactura,
      valorTotal: misionAnt.valor,
      lineas: misionAnt.lineas || [],
    },
    margenesEventos,
    totalesFacturas: {
      base: detalleFacturas.filter((fila) => !fila.uso.startsWith("BTL")).reduce((suma, fila) => suma + fila.base, 0),
      recaudo: detalleFacturas.filter((fila) => !fila.uso.startsWith("BTL")).reduce((suma, fila) => suma + fila.recaudo, 0),
      reconocida: detalleFacturas.filter((fila) => !fila.uso.startsWith("BTL")).reduce((suma, fila) => suma + fila.ventaReconocida, 0),
    },
  };
}

function pesoMeta(resultado) {
  return Object.values(resultado.metas).reduce((suma, meta) => suma + (meta > 0 ? meta : 0), 0);
}

function promedioMedido(valores) {
  const medidos = valores.filter((valor) => valor !== null && valor !== undefined && valor !== "" && Number.isFinite(Number(valor)));
  if (!medidos.length) return null;
  return medidos.reduce((suma, valor) => suma + Number(valor), 0) / medidos.length;
}

/** SERFISCAL, innovación y satisfacción del director salen del equipo. Sin medición, quedan en el peso completo. */
function indicadoresEquipo(resultados, parametros, tope) {
  const regla = parametros.director.regla100;
  const serfiscal = promedioMedido(resultados.map((item) => item.comercial.serfiscal));
  const satisfaccion = promedioMedido(resultados.map((item) => item.comercial.satisfaccion));
  const innovaciones = resultados.filter((item) => !item.neutrales.innovacion);
  return {
    serfiscal: serfiscal === null
      ? parametros.pesos.serfiscal
      : puntosIndicador(parametros.pesos.serfiscal, serfiscal / 100, tope, regla),
    satisfaccion: satisfaccion === null
      ? parametros.pesos.satisfaccion
      : puntosIndicador(parametros.pesos.satisfaccion, satisfaccion / parametros.satisfaccionEsperada, tope, regla),
    innovacion: innovaciones.length
      ? innovaciones.reduce((suma, item) => suma + item.puntos.innovacion, 0) / innovaciones.length
      : parametros.pesos.innovacion,
  };
}

/**
 * Tres formas de leer el score del director. Núm. 5.9.
 * Devuelve totales, promedio simple y promedio ponderado por meta.
 */
export function metodosDirector(resultados, parametros, mes) {
  const faltantes = [];
  const ventas = { eduAt: 0, mision: 0, congreso: 0, cultural: 0, pasantia: 0, patrocinio: 0 };
  resultados.forEach((resultado) => {
    Object.keys(ventas).forEach((producto) => {
      const valor = resultado.ventas[producto];
      if (valor === null) faltantes.push(`${resultado.nombre}: ${producto}`);
      else ventas[producto] += valor;
    });
  });
  // Meta Edu/AT del director: parámetro fijo (metaEduAtEquipo). Meta misión = suma de comerciales.
  const metaEduAtCrudo = parametros.director.metaEduAtEquipo;
  const metaEduAt = metaEduAtCrudo === null || metaEduAtCrudo === undefined || metaEduAtCrudo === ""
    ? null
    : Number(metaEduAtCrudo);
  const metas = {
    eduAt: Number.isFinite(metaEduAt) ? metaEduAt : null,
    mision: resultados.every((item) => item.metas.mision !== null && item.metas.mision !== undefined)
      ? resultados.reduce((s, item) => s + (Number(item.metas.mision) || 0), 0)
      : null,
    congreso: resultados.every((item) => item.metas.congreso !== null) ? resultados.reduce((s, item) => s + (item.metas.congreso || 0), 0) : null,
    cultural: resultados.reduce((s, item) => s + (item.metas.cultural || 0), 0),
    pasantia: null,
    patrocinio: null,
  };
  if (metas.eduAt === null) faltantes.push("meta Edu/AT del director (Parámetros)");
  if (metas.mision === null) faltantes.push("meta de misión del equipo (faltan metas de comerciales)");
  if (ventas.pasantia === 0) metas.pasantia = 0;
  if (ventas.patrocinio === 0) metas.patrocinio = 0;
  const ponderado = cumplimientoVentas(ventas, metas, parametros.topeCongreso, parametros.topeProducto);
  const tope = parametros.topeIndicador;
  const delEquipo = indicadoresEquipo(resultados, parametros, tope);
  const puntos = {
    ventas: ponderado.cumplimiento === null ? null : parametros.pesos.ventas * Math.min(ponderado.cumplimiento, tope),
    baseSocial: null,
    serfiscal: delEquipo.serfiscal,
    innovacion: delEquipo.innovacion,
    satisfaccion: delEquipo.satisfaccion,
  };
  const sinDato = resultados.filter((item) => !item.baseSocial.neutral && item.baseSocial.cierre === null);
  const medidos = resultados.filter((item) => !item.baseSocial.neutral && item.baseSocial.cierre !== null);
  // Meta del director = suma de metas de base social del mes de los comerciales (no neutrales).
  const conMeta = resultados.filter((item) => !item.baseSocial?.neutral);
  const metaEquipo = !conMeta.length || conMeta.some((item) => item.baseSocial?.meta === null || item.baseSocial?.meta === undefined)
    ? null
    : conMeta.reduce((s, item) => s + (Number(item.baseSocial.meta) || 0), 0);
  if (metaEquipo === null) faltantes.push("meta de base social del equipo (faltan metas de comerciales)");
  const cierreFijoCrudo = parametros.director.baseSocialCierreEquipo;
  const cierreFijo = cierreFijoCrudo === null || cierreFijoCrudo === undefined || cierreFijoCrudo === ""
    ? null
    : Number(cierreFijoCrudo);
  if (Number.isFinite(cierreFijo)) {
    // Suma de cierres del equipo (Parámetros): p. ej. 560.
    const cumplimiento = metaEquipo ? cierreFijo / metaEquipo : 0;
    // Regla del 100 % también para el director en base social.
    puntos.baseSocial = metaEquipo === null ? null : puntosIndicador(parametros.pesos.baseSocial, cumplimiento, tope, true);
    puntos.baseCierre = cierreFijo;
    puntos.baseMeta = metaEquipo;
    puntos.baseCumplimiento = metaEquipo === null ? null : cumplimiento;
  } else if (sinDato.length || !medidos.length) {
    faltantes.push("base social del equipo");
  } else {
    const cierre = medidos.reduce((s, item) => s + item.baseSocial.cierre, 0);
    const cumplimiento = metaEquipo ? cierre / metaEquipo : 0;
    puntos.baseSocial = metaEquipo === null ? null : puntosIndicador(parametros.pesos.baseSocial, cumplimiento, tope, true);
    puntos.baseCierre = cierre;
    puntos.baseMeta = metaEquipo;
    puntos.baseCumplimiento = metaEquipo === null ? null : cumplimiento;
  }
  const faltantesTotales = [...faltantes, ...ponderado.faltantes];
  // Si falta una venta o la base social, el director queda pendiente y no se compara con el esquema anterior.
  const scoreTotales = faltantesTotales.length
    || [puntos.ventas, puntos.baseSocial, puntos.serfiscal, puntos.innovacion, puntos.satisfaccion].some((n) => n === null)
    ? null
    : score([puntos.ventas, puntos.baseSocial, puntos.serfiscal, puntos.innovacion, puntos.satisfaccion]);

  const medibles = resultados.filter((item) => item.score !== null);
  const promedio = medibles.length ? medibles.reduce((s, item) => s + item.score, 0) / medibles.length : null;
  const conPeso = medibles.filter((item) => pesoMeta(item) > 0);
  const sumaPesos = conPeso.reduce((s, item) => s + pesoMeta(item), 0);
  const ponderadoScores = sumaPesos
    ? conPeso.reduce((s, item) => s + item.score * pesoMeta(item), 0) / sumaPesos
    : null;

  function pagoDe(puntaje) {
    if (puntaje === null || parametros.director.oportunidad === null) return null;
    const factor = factorCurva(puntaje, parametros.curva);
    return { factor, pago: pagoVariable(parametros.director.oportunidad, factor), score: puntaje };
  }

  return {
    puntos,
    detalleVentas: puntosPorProducto(ponderado.detalle, parametros.pesos.ventas, tope),
    cumplimientoPonderado: ponderado.cumplimiento,
    ventasEquipo: ventas,
    metasEquipo: metas,
    faltantes: faltantesTotales,
    totales: pagoDe(scoreTotales),
    promedio: pagoDe(promedio),
    ponderado: pagoDe(ponderadoScores),
    mes,
  };
}

/** Porcentaje del IMR según margen y cumplimiento de la utilidad. Núm. 5.11.5. */
export function porcentajeBtl(margen, cumplimiento, rol, parametros) {
  const umbral = parametros.btlUmbrales;
  if (cumplimiento < umbral.cumplimientoMinimo) return 0;
  if (rol === "director") {
    if (margen < umbral.margenMedio) return 0;
    if (cumplimiento < umbral.cumplimientoAlto) return parametros.btlDirector.cump90;
    if (margen <= umbral.margenAlto) return parametros.btlDirector.cump100MargenMedio;
    return parametros.btlDirector.cump100MargenAlto;
  }
  if (margen < umbral.margenBajo) return 0;
  const tabla = parametros.btlComercial;
  const tramo = cumplimiento < umbral.cumplimientoAlto ? "cump90" : "cump100";
  const banda = margen < umbral.margenMedio ? "Margen5" : margen < umbral.margenAlto ? "Margen10" : "Margen15";
  return tabla[`${tramo}${banda}`];
}

/**
 * Bonificación de un evento para comercial y director.
 * Si falta una condición, el pago queda en 0 y el estado en Pendiente.
 */
export function liquidarBtl(evento, contexto, parametros) {
  const ingreso = Number(evento.ingreso);
  const costo = Number(evento.costo);
  const presupuesto = Number(evento.utilidadPresupuestada);
  const pendientes = (falta) => (contexto.participantes || []).map((persona) => ({ ...persona, pago: 0, carga: 0, bloqueos: [falta], estado: "Pendiente", motivo: falta, anual: null }));
  if (!ingreso || !Number.isFinite(costo)) {
    const falta = "Falta ingreso, costo o utilidad presupuestada.";
    return {
      estado: "Pendiente",
      motivo: falta,
      estadoComercial: "Pendiente",
      motivoComercial: falta,
      estadoDirector: "Pendiente",
      motivoDirector: falta,
      pagoComercial: 0,
      pagoDirector: 0,
      porcentajeComercial: null,
      porcentajeDirector: null,
      topeAnualComercial: null,
      topeAnualDirector: null,
      comerciales: pendientes(falta),
    };
  }
  if (!Number.isFinite(presupuesto) || presupuesto === 0) {
    const falta = "Pendiente: falta utilidad presupuestada";
    return {
      estado: "Pendiente",
      motivo: falta,
      estadoComercial: "Pendiente",
      motivoComercial: falta,
      estadoDirector: "Pendiente",
      motivoDirector: falta,
      pagoComercial: 0,
      pagoDirector: 0,
      porcentajeComercial: null,
      porcentajeDirector: null,
      topeAnualComercial: null,
      topeAnualDirector: null,
      comerciales: pendientes(falta),
    };
  }
  const ica = ingreso * parametros.costos.ica;
  const gmf = costo * parametros.costos.gmf;
  // Utilidad base real: ingresos − total costos − ICA (sobre ingresos) − 4×1000 (sobre el costo), sin comisiones.
  const utilidad = ingreso - costo - ica - gmf;
  // v19: la tabla se evalúa con el margen bruto (ingresos − total costos) / ingresos; el neto se informa aparte.
  const margenBruto = (ingreso - costo) / ingreso;
  const margenNeto = calcularMargen(ingreso, costo, parametros.costos);
  const margenDecide = parametros.btlUmbrales?.margenDecide === "neto" ? "neto" : "bruto";
  const margen = margenDecide === "neto" ? margenNeto : margenBruto;
  const cumplimiento = utilidad / presupuesto;
  const condiciones = contexto.condiciones || {};
  const compartidas = [];
  if (!condiciones.cierre) compartidas.push("cierre financiero");
  if (!condiciones.recaudo) compartidas.push("meta de recaudo");
  if (!condiciones.satisfaccion) compartidas.push("satisfacción del evento");
  const bloqueoDirector = [...compartidas];
  if (contexto.scoreDirector === null || contexto.scoreDirector < parametros.curva.minimo) bloqueoDirector.push("score del director");
  if (!condiciones.participacionDirector) bloqueoDirector.push("participación del director");

  // Participantes comerciales: por defecto el responsable al 100 % (5.12). Reparto solo si fue aprobado.
  const participantes = (contexto.participantes && contexto.participantes.length)
    ? contexto.participantes
    : [{ nombre: null, imr: contexto.imrComercial, score: contexto.scoreComercial, pagado: contexto.pagadoComercial, porcentaje: 1 }];
  const porcentajeComercial = porcentajeBtl(margen, cumplimiento, "comercial", parametros);
  const porcentajeDirector = porcentajeBtl(margen, cumplimiento, "director", parametros);
  const tc = parametros.btlComercial;
  const td = parametros.btlDirector;
  const errorReparto = contexto.errorReparto || "";
  const comerciales = participantes.map((persona) => {
    const bloqueos = [...compartidas];
    if (errorReparto) bloqueos.push(errorReparto);
    if (persona.score === null || persona.score === undefined) bloqueos.push("score del comercial");
    else if (persona.score < parametros.curva.minimo) {
      const texto = Number(persona.score).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      bloqueos.push(`Score ${texto} < ${parametros.curva.minimo}`);
    }
    if (!condiciones.participacionComercial) bloqueos.push("participación del comercial");
    const imr = persona.imr;
    const parte = Number(persona.porcentaje) || 0;
    // Supuesto v19 con reparto: cada uno recibe su % del valor de la tabla y del tope por evento, con su propio IMR;
    // el tope anual es el de cada persona (2 IMR − lo ya pagado en el año).
    const anual = imr === null || imr === undefined ? 0 : Math.max(0, tc.topeAnio * imr - (Number(persona.pagado) || 0));
    const bruto = imr === null || imr === undefined ? 0 : parte * porcentajeComercial * imr;
    const porEvento = imr === null || imr === undefined ? 0 : parte * tc.topeEvento * imr;
    const pago = bloqueos.length || imr === null || imr === undefined ? 0 : Math.min(bruto, porEvento, anual);
    return { ...persona, bloqueos, pagoAntes: pago, pago, bruto, porEvento, anual, topado: pago > 0 && pago < bruto - 0.5 };
  });
  const imrD = contexto.imrDirector;
  const anualD = imrD === null ? 0 : Math.max(0, td.topeAnio * imrD - (Number(contexto.pagadoDirector) || 0));
  let pagoDirector = bloqueoDirector.length || imrD === null ? 0 : Math.min(porcentajeDirector * imrD, td.topeEvento * imrD, anualD);
  const pagoDirectorAntes = pagoDirector;
  // Salvaguarda: comerciales + director ≤ % de la utilidad base; si se pasa, todos bajan en la misma proporción.
  const topeSalvaguarda = tc.salvaguarda * utilidad;
  const suma = comerciales.reduce((t, c) => t + c.pago, 0) + pagoDirector;
  let factorSalvaguarda = 1;
  if (utilidad > 0 && suma > topeSalvaguarda) {
    factorSalvaguarda = topeSalvaguarda / suma;
    comerciales.forEach((c) => { c.pago *= factorSalvaguarda; });
    pagoDirector *= factorSalvaguarda;
  }
  const carga = Number(tc.cargaPrestacional) || 0;
  comerciales.forEach((c) => {
    c.carga = c.pago * carga;
    c.estado = c.bloqueos.length ? "Pendiente" : "Calculado";
    c.motivo = c.bloqueos.length ? `Falta: ${c.bloqueos.join(", ")}.` : "";
  });
  const pagoComercial = comerciales.reduce((t, c) => t + c.pago, 0);
  const principal = comerciales[0];
  const faltan = [...new Set([...comerciales.flatMap((c) => c.bloqueos), ...bloqueoDirector])];
  return {
    estado: faltan.length ? "Pendiente" : "Calculado",
    motivo: faltan.length ? `Falta: ${faltan.join(", ")}.` : "",
    estadoComercial: comerciales.every((c) => c.bloqueos.length) ? "Pendiente" : "Calculado",
    motivoComercial: comerciales.length === 1 ? principal.motivo : comerciales.filter((c) => c.motivo).map((c) => `${c.nombre}: ${c.motivo}`).join(" "),
    estadoDirector: bloqueoDirector.length ? "Pendiente" : "Calculado",
    motivoDirector: bloqueoDirector.length ? `Falta: ${bloqueoDirector.join(", ")}.` : "",
    ingreso, costo, ica, gmf,
    utilidad,
    utilidadPresupuestada: presupuesto,
    margen, margenBruto, margenNeto, margenDecide,
    cumplimiento,
    pagoComercial,
    pagoDirector,
    pagoDirectorAntes,
    cargaComercial: pagoComercial * carga,
    cargaDirector: pagoDirector * carga,
    factorSalvaguarda,
    topeSalvaguarda,
    comerciales,
    porcentajeComercial,
    porcentajeDirector,
    topeAnualComercial: principal.anual,
    topeAnualDirector: anualD,
  };
}

/** Arma comerciales, director y eventos BTL del mes. */
function margenesPorEvento(eventos, parametros) {
  const mapa = new Map();
  eventos.forEach((evento) => {
    const clave = textoClave(evento.evento);
    const ingreso = Number(evento.ingreso);
    const costo = Number(evento.costo);
    if (!clave || !Number.isFinite(ingreso) || ingreso === 0 || !Number.isFinite(costo)) return;
    mapa.set(clave, calcularMargen(ingreso, costo, parametros.costos));
  });
  return mapa;
}

function esEventoBtl(evento, parametros) {
  const marca = texto(parametros.hojas?.btl || "btl");
  const textoEvento = texto(`${evento.grupo || ""} ${evento.producto || ""}`);
  return textoEvento.includes(marca);
}

export function liquidarMes(filas, eventos, parametros, mes, facturaAEvento, filasProduccionDetalle = []) {
  const equipo = parametros.comerciales.filter((comercial) => (comercial.activoDesde || "0000-00") <= mes);
  const margenes = margenesPorEvento(eventos, parametros);
  const resultados = equipo.map((comercial) => liquidarComercial(comercial, filas, mes, parametros, margenes, facturaAEvento, eventos, filasProduccionDetalle));
  const director = metodosDirector(resultados, parametros, mes);
  const avisos = [];
  filas.forEach((fila) => {
    if (!deHojaElegida(fila, parametros) || asesorVacio(fila)) return;
    if (!(fila.fecha instanceof Date)) avisos.push(`La factura ${fila.factura || "sin número"} no tiene fecha.`);
  });
  const totalMes = produccionTotalMes(filas, mes, parametros);
  const baseSinBtl = totalMes.base;
  const pagoAnterior = comisionAnteriorDirector(totalMes.base, parametros.director.tasaAnterior);
  const anterior = {
    base: totalMes.base,
    tasa: parametros.director.tasaAnterior,
    comision: pagoAnterior,
    facturas: totalMes.lineas.length,
    porAsesor: totalMes.porAsesor,
  };
  const elegido = director[parametros.director.metodo] || director.totales;
  director.elegido = elegido;
  const enPeriodo = mes >= parametros.transicion.desde && mes <= parametros.transicion.hasta;
  let transicion = { esquema: "nueva", pagada: elegido?.pago ?? null };
  if (!elegido || elegido.pago === null) transicion = { esquema: "pendiente", pagada: null };
  else if (enPeriodo && pagoAnterior !== null) {
    transicion = pagoAnterior >= elegido.pago
      ? { esquema: "anterior", pagada: pagoAnterior }
      : { esquema: "nueva", pagada: elegido.pago };
  }
  const ajusteDir = Number.isFinite(Number(parametros.director.ajusteValor)) ? Number(parametros.director.ajusteValor) : 0;
  const pagoAjustadoDir = transicion.pagada === null
    ? (ajusteDir ? ajusteDir : null)
    : transicion.pagada + ajusteDir;
  director.ajuste = {
    valor: ajusteDir || null,
    mesReferencia: parametros.director.ajusteMes || "",
    nota: parametros.director.ajusteNota || "",
  };
  director.pagoAjustado = pagoAjustadoDir;

  let pagadoComercial = {};
  resultados.forEach((item) => {
    pagadoComercial[item.nombre] = Number(item.comercial.btlPagadoAnio) || 0;
  });
  let pagadoDirector = Number(parametros.director.btlPagadoAnio) || 0;
  const btl = eventos.filter((evento) => evento.delMes).filter((evento) => esEventoBtl(evento, parametros)).map((evento, indice) => {
    const responsable = resultados.find((item) => mismaPersona(evento.comercial, item.comercial));
    const scoreDirector = elegido && elegido.score !== undefined ? elegido.score : null;
    // v19 (5.12): único responsable por defecto. Reparto en % solo si se marcó como aprobado antes del cierre; suma ≤ 100 %.
    const repartoPedido = Array.isArray(evento.reparto) ? evento.reparto.filter((r) => r && r.comercial && Number(r.porcentaje) > 0) : [];
    let errorReparto = "";
    let lista = [{ comercial: evento.comercial, porcentaje: 1 }];
    if (repartoPedido.length && evento.repartoAprobado) {
      const sumaReparto = repartoPedido.reduce((t, r) => t + Number(r.porcentaje), 0);
      if (sumaReparto > 1 + 1e-9) errorReparto = "reparto mayor a 100 %";
      lista = repartoPedido;
    }
    const participantes = lista.map((r) => {
      const persona = resultados.find((item) => mismaPersona(r.comercial, item.comercial));
      return {
        nombre: persona?.nombre || r.comercial,
        imr: persona ? (persona.comercial.basico ?? 0) + (persona.comercial.oportunidad ?? 0) : null,
        score: persona ? persona.score : null,
        pagado: persona ? pagadoComercial[persona.nombre] : 0,
        porcentaje: Number(r.porcentaje),
      };
    });
    const calculo = liquidarBtl(evento, {
      participantes,
      errorReparto,
      imrDirector: (parametros.director.basico ?? 0) + (parametros.director.oportunidad ?? 0),
      scoreDirector,
      pagadoDirector,
      condiciones: evento.condiciones || {},
    }, parametros);
    calculo.comerciales.forEach((c) => { if (pagadoComercial[c.nombre] !== undefined) pagadoComercial[c.nombre] += c.pago; });
    pagadoDirector += calculo.pagoDirector;
    return { evento, indice, responsable: responsable?.nombre || evento.comercial, repartoAplicado: lista.length > 1 || lista[0].porcentaje !== 1, repartoPendiente: repartoPedido.length > 0 && !evento.repartoAprobado, ...calculo };
  });
  resultados.forEach((resultado) => {
    // Cada comercial ve sus eventos con su parte del pago (100 % si es el único responsable).
    resultado.btlMes = btl.flatMap((item) => {
      const propio = item.comerciales.find((c) => c.nombre === resultado.nombre);
      if (!propio) return [];
      return [{ ...item, pagoComercial: propio.pago, cargaComercial: propio.carga, estadoComercial: propio.estado, motivoComercial: propio.motivo, porcentajeReparto: propio.porcentaje, topeAnualComercial: propio.anual, pagoTotalComerciales: item.pagoComercial }];
    });
    const calc = btlAnteriorDeComercial(resultado.comercial, resultado.btlMes, filas, mes, parametros, facturaAEvento);
    resultado.btlAnterior = calc.pendiente ? null : calc.comision;
    resultado.ingresoBtlAnterior = calc.pendiente ? null : calc.base;
    resultado.tasaBtlAnterior = calc.tasa;
    resultado.btlAnteriorDetalle = calc.detalle;
    resultado.btlAnteriorTasaSupuesta = calc.tasaSupuesta;
    if (calc.pendiente) resultado.avisos = [...(resultado.avisos || []), "Pendiente: ingreso de ejecución del evento"];
    else if (calc.tasaSupuesta) resultado.avisos = [...(resultado.avisos || []), "Tasa supuesta: el archivo no trae % de comisión"];
  });

  const calcDirector = btlAnteriorDeDirector(btl, parametros);
  const baseBtl = calcDirector.base;
  const btlAnterior = calcDirector.pendiente ? null : calcDirector.comision;
  if (calcDirector.pendiente) avisos.push("Pendiente: ingreso de ejecución del evento");

  return {
    resultados,
    director: { ...director, pagoAnterior, btlAnterior, baseSinBtl, baseBtl, anterior, transicion, elegido, avisos },
    btl,
  };
}
