/**
 * Excel individual del Director Comercial y de Marketing.
 * Plantilla anónima (plantillas/plantilla_liquidacion_director.xlsx) + JSZip: este módulo solo pone datos,
 * la estructura, las fórmulas y el formato salen de la plantilla. Simulación. No es un pago oficial.
 * No guarda la clave: se recibe al exportar y se olvida.
 */
import * as M from "./excel/motor_excel_individual.js";
import { factorCurva, produccionTotalMes } from "./calculos.js";
import { encabezadoDirector } from "./encabezados.js";
import { obtenerParametros } from "./parametros.js";
import { obtenerFacturacion } from "./carga.js";
import { recurso } from "./recursos.js";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const NUMEROS = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce"];
const METODOS = { totales: "Totales del equipo por indicador", promedio: "Promedio simple de los puntajes", ponderado: "Promedio ponderado por meta de ventas" };
const limpio = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const num = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const siNo = (v) => (v === true ? "SÍ" : null); // sin marcar = pendiente (celda vacía), como en la referencia
const fechaTexto = (f) => (f instanceof Date ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` : (f ? String(f) : null));

// ───────────── Datos (sin formato) ─────────────
/** Arma los datos del libro del director desde la liquidación del mes (la misma que muestra la vista Director). */
export function construirDatosDirector(liquidacion, parametros, filas, mes) {
  const p = parametros;
  const d = liquidacion.director;
  const enc = encabezadoDirector(p.director);
  const [anio, numeroMes] = String(mes).split("-").map(Number);
  const total = produccionTotalMes(filas || [], mes);
  const tasa = p.director.tasaAnterior;
  // Facturación del mes (la base del esquema anterior).
  const facturas = total.lineas.map((fila) => ({
    fila: fila.numeroFila ?? null, factura: limpio(fila.factura) || null, entidad: String(fila.cliente ?? "").trim() || null,
    asesor: limpio(fila.asesor) || null, grupo: limpio(fila.grupo) || null, subgrupo: limpio(fila.subgrupo) || null,
    servicio: limpio(fila.cuenta) || null, base: Number(fila.base) || 0,
    pctDireccion: num(fila.direccion) ?? tasa, fecha: fechaTexto(fila.fecha), estado: limpio(fila.estado) || null,
  }));
  // Desglose por grupo y subgrupo, en el orden en que aparecen.
  const grupos = [];
  const visto = new Set();
  const ordenGrupo = [...new Set(facturas.map((f) => f.grupo || ""))];
  ordenGrupo.forEach((g) => facturas.filter((f) => (f.grupo || "") === g).forEach((f) => {
    const k = `${g}|${f.subgrupo || ""}`;
    if (!visto.has(k)) { visto.add(k); grupos.push({ grupo: g, subgrupo: f.subgrupo || "" }); }
  }));
  // Tabla BTL (filas 74–75 de la referencia): una fila por subgrupo BTL de la facturación del mes
  // (sus líneas ya están en la base del 1,5 %; aquí su ingreso BTL de ejecución es 0) y una por evento BTL
  // de los parámetros, con su ingreso de ejecución (no el recaudo).
  const btlMes = liquidacion.btl || [];
  const subgruposBtl = grupos.filter((g) => sinTildeMin(g.grupo) === "btl").map((g) => ({ grupo: g.grupo, evento: g.subgrupo, facturas: 0, ingreso: 0 }));
  const eventosBtl = subgruposBtl.concat((p.btl?.eventos || []).map((ev) => {
    const delMes = btlMes.find((b) => limpio(b.evento?.evento) === limpio(ev.evento));
    const detalle = limpio(delMes?.evento?.detalle || delMes?.evento?.producto || "");
    const lineas = (filas || []).filter((f) => limpio(f.evento) === limpio(ev.evento)).length;
    return { grupo: "BTL", evento: `Evento ${limpio(ev.evento)}${detalle ? ` · ${detalle}` : ""}`, facturas: lineas || null, ingreso: num(ev.ingresoEjecucion) };
  }));
  // Equipo: lo mismo que usa la app para el score agregado.
  const equipo = (liquidacion.resultados || []).map((r) => ({
    nombre: r.comercial?.nombreFacturacion || r.nombre,
    ventas: num(r.puntos?.ventas), base: num(r.puntos?.baseSocial),
    div: r.puntos?.serfiscal === null || r.puntos?.innovacion === null ? null : (r.puntos?.serfiscal || 0) + (r.puntos?.innovacion || 0),
    sat: num(r.puntos?.satisfaccion), score: num(r.score),
    metaEdu: num(r.metas?.eduAt), ventaReconocida: num(r.eduAt?.ventaReconocida),
    cierreBase: num(r.baseSocial?.cierre), metaBase: num(r.baseSocial?.meta),
    recaudoMision: num(r.mision?.ventaReconocida), metaMision: num(r.metas?.mision), comisionAnterior: r.comercial?.tieneEsquemaAnterior === false ? null : num(r.pagoAnterior),
    // v15 · hoja «Detalle del equipo» (lo mismo que suma la app en metodosDirector)
    recaudadaEdu: num(r.eduAt?.ventaRecaudada), ventaEdu: num(r.ventas?.eduAt), facturasMision: num(r.mision?.facturas), ventaMision: num(r.ventas?.mision),
    metaCongreso: num(r.metas?.congreso), ventaCongreso: num(r.ventas?.congreso), metaCultural: num(r.metas?.cultural), ventaCultural: num(r.ventas?.cultural),
    bsInicial: r.baseSocial?.neutral || r.baseSocial?.cierre === null || r.baseSocial?.cierre === undefined ? null : num(r.comercial?.baseSocialInicial),
    bsCierre: r.baseSocial?.neutral ? null : num(r.baseSocial?.cierre),
    clave: limpio(r.comercial?.nombreFacturacion || r.nombre),
  }));
  const noIncluidos = (p.comerciales || []).filter((c) => !(liquidacion.resultados || []).some((r) => r.nombre === c.nombre))
    .map((c) => ({ nombre: c.nombre, motivo: c.activoDesde && c.activoDesde > mes ? `aún no liquida en ${MESES[numeroMes - 1]}` : "no liquida en el mes" }));
  // Canal nacional (núm. 5.9): líneas a nombre de la Dirección Comercial. Solo informativo.
  const sinTilde = (t) => limpio(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const canal = total.lineas.filter((f) => /direccion comercial/i.test(sinTilde(f.asesor)));
  const sumar = (lista) => lista.reduce((s, f) => s + (Number(f.base) || 0), 0);
  // BTL del director (primer evento BTL del mes).
  const b = btlMes[0];
  const ev = b?.evento || {};
  const ingreso = num(ev.ingreso) ?? eventosBtl[0]?.ingreso ?? null;
  const costo = num(ev.costo);
  const utilidadReal = ingreso !== null && costo !== null ? ingreso - costo - ingreso * p.costos.ica - costo * p.costos.gmf : null;
  const responsable = (liquidacion.resultados || []).find((r) => r.nombre === b?.responsable);
  const imrResp = responsable ? (responsable.comercial.basico ?? 0) + (responsable.comercial.oportunidad ?? 0) : null;
  const pctCom = num(b?.porcentajeComercial);
  // v19: con reparto, la suma de lo que daría cada participante con sus topes (antes de la salvaguarda).
  const conReparto = Array.isArray(b?.comerciales) && b.comerciales.some((c) => Number.isFinite(c.bruto));
  const comercialPreliminar = conReparto
    ? b.comerciales.reduce((s, c) => s + Math.min(c.bruto ?? 0, c.porEvento ?? Infinity, c.anual ?? Infinity), 0)
    : pctCom === null || imrResp === null ? null
    : Math.min(pctCom * imrResp, p.btlComercial.topeEvento * imrResp, Math.max(0, p.btlComercial.topeAnio * imrResp - (Number(responsable.comercial.btlPagadoAnio) || 0)));
  const cond = ev.condiciones || {};
  return {
    mes, anio, numeroMes, topeProducto: num(p.topeProducto) ?? 1.2,
    director: { nombre: enc.nombreOficial || null, cargo: enc.cargo || null, basico: num(enc.basico), oportunidad: num(enc.oportunidad), historico: enc.historico },
    metodo: METODOS[p.director.metodo] || METODOS.totales, regla100: p.director.regla100 ? "SÍ" : "NO",
    metaMision: num(d.metasEquipo?.mision), metaBaseSocial: num(p.director.metaBaseSocialEquipo),
    metaMisionReferencia: num(p.director.metaMisionEquipo),
    equipo, noIncluidos, grupos, eventosBtl, facturas, hojaFacturacion: limpio(total.lineas[0]?.hoja) || null,
    canal: {
      meta: num(p.director.metaCanalNacional), produccion: canal.length ? sumar(canal) : null, ventaReconocida: num(p.director.ventaCanalNacional),
      edu: canal.length ? sumar(canal.filter((f) => !/jornada/i.test(f.grupo || ""))) : null, jornada: canal.length ? sumar(canal.filter((f) => /jornada/i.test(f.grupo || ""))) : null,
    },
    btl: {
      evento: limpio(ev.detalle) || (ev.evento ? `evento ${limpio(ev.evento)}` : null),
      ingreso, costo, utilidadPresupuestada: num(ev.utilidadPresupuestada), utilidadReal,
      margenDecide: p.btlUmbrales?.margenDecide === "neto" ? "neto" : "bruto",
      ingresoPresupuestado: num(ev.ingresoPresupuestado),
      participacion: siNo(cond.participacionDirector), cierre: siNo(cond.cierre), recaudo: siNo(cond.recaudo), satisfaccion: siNo(cond.satisfaccion),
      pagadoAnio: num(p.director.btlPagadoAnio), pagadoCuenta: p.director.btlPagadoCuenta ?? "PENDIENTE",
      pagadoDetalle: p.director.btlPagadoDetalle || null,
      comercialPreliminar, comercialNombre: responsable?.nombre || b?.responsable || null,
    },
    cultural: { cartones: num(p.director.cartonesCultural), valorCarton: num(p.cultural?.valorCarton) },
    param: {
      pesoVentas: p.pesos.ventas, pesoBase: p.pesos.baseSocial, pesoDiv: p.pesos.serfiscal + p.pesos.innovacion, pesoSat: p.pesos.satisfaccion,
      tope: p.curva.tope ?? p.topeIndicador, minimo: p.curva.minimo, tasaAnterior: tasa, tasaBtlAnterior: p.director.tasaBtlAnterior,
      valorFacturaMision: num(p.mision?.valorFacturaNueva),
    },
    resultado: {
      score: num(d.elegido?.score), factor: num(d.elegido?.factor), pagoNueva: num(d.elegido?.pago),
      ptsVentas: num(d.puntos?.ventas), ptsBase: num(d.puntos?.baseSocial), cierreBase: num(d.puntos?.baseCierre), metaBase: num(d.puntos?.baseMeta), cumpBase: num(d.puntos?.baseCumplimiento),
      detalleVentas: d.detalleVentas || [], baseAnterior: num(d.anterior?.base), comisionAnterior: num(d.pagoAnterior), btlAnterior: num(d.btlAnterior), baseBtl: num(d.baseBtl),
      lineas: total.lineas.length,
    },
    curva: p.curva,
    ...extrasV15(liquidacion, p, enc, facturas, equipo, canal),
  };
}

/** v15: datos para el libro con forma de comercial (encabezado, filas del detalle, puntos del equipo, parámetros). */
function extrasV15(liquidacion, p, enc, facturas, equipo, canal) {
  const d = liquidacion.director || {};
  const claveCanal = canal.length ? limpio(canal[0].asesor) : "Direccion Comercial";
  const filas = equipo.map((e) => ({ ...e }));
  filas.push({ nombre: "Canal nacional (Dirección Comercial)", clave: claveCanal });
  const conocidas = new Set(filas.map((f) => f.clave.toLowerCase()));
  const otras = facturas.filter((f) => !conocidas.has(String(f.asesor || "").toLowerCase()));
  if (otras.length) filas.push({ nombre: "Otros asesores o sin asesor", clave: "Otros", baseOtros: otras.reduce((s, f) => s + f.base, 0) });
  const medidos = (liquidacion.resultados || []).map((r) => num(r.comercial?.satisfaccion)).filter((v) => v !== null);
  const anclas = [...(p.curva?.anclas || [])].sort((a, b) => a.puntaje - b.puntaje);
  const pctTxt = (v) => `${Math.round(v * 1000) / 10} %`.replace(".", ",");
  const curvaTabla = [{ etiqueta: `Menor a ${p.curva.minimo} puntos`, factorTexto: "0 %" }, ...anclas.map((a) => ({ etiqueta: `${a.puntaje} puntos`, factorTexto: pctTxt(a.factor) }))].slice(0, 6);
  while (curvaTabla.length < 6) curvaTabla.push({ etiqueta: null, factorTexto: null });
  const nivel = limpio(enc.nivel);
  return {
    director: { nombre: enc.nombreOficial || null, documento: enc.documento || null, cargo: enc.cargo || null, cargoNivel: [limpio(enc.cargo), nivel].filter(Boolean).join(" – ") || null,
      basico: num(enc.basico), oportunidad: num(enc.oportunidad), historico: enc.historico,
      q2: num(enc.referenciaMercado?.valor), q2Nombre: enc.referenciaMercado?.tipo || "Referencia de mercado" },
    filasEquipo: filas, nComerciales: equipo.length,
    puntosEquipo: {
      serfiscal: num(d.puntos?.serfiscal), innovacion: num(d.puntos?.innovacion), satisfaccion: num(d.puntos?.satisfaccion),
      satisfaccionTexto: medidos.length ? Math.round(medidos.reduce((s, v) => s + v, 0) / medidos.length * 100) / 100 : "Sin encuesta (neutral)",
    },
    curvaTabla, curvaAnclas: anclas,
    paramV15: {
      pesoSer: p.pesos.serfiscal, pesoInnovacion: p.pesos.innovacion, topeIndicador: p.topeIndicador, topeCongreso: p.topeCongreso,
      satisfaccionEsperada: p.satisfaccionEsperada, btlCumpMin: p.btlUmbrales.cumplimientoMinimo, btlCumpAlto: p.btlUmbrales.cumplimientoAlto,
      btlMargenMedio: p.btlUmbrales.margenMedio, btlMargenAlto: p.btlUmbrales.margenAlto, btlPct90: p.btlDirector.cump90,
      btlPctMedio: p.btlDirector.cump100MargenMedio, btlPctAlto: p.btlDirector.cump100MargenAlto, btlTopeEvento: p.btlDirector.topeEvento,
      btlTopeAnio: p.btlDirector.topeAnio, btlSalvaguarda: p.btlComercial.salvaguarda,
    },
  };
}

// ───────────── Textos ─────────────
const miles = (v, dec = 0) => Number(v).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const pesos = (v, dec = 0) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "Pendiente" : `$${miles(dec ? v : Math.round(v), dec)}`);
const pct = (v, dec = 2) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "Pendiente" : `${miles(Number(v) * 100, dec)} %`);
const tasaTxt = (v) => (v === null || v === undefined ? "Pendiente" : `${miles(Number(v) * 100, Number(v) * 100 % 1 ? 2 : 0).replace(/,(\d)0$/, ",$1")} %`);
const dos = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "Pendiente" : miles(v, 2));

/** Valores de los marcadores {clave} de plantillas/textos_director.json. */
export function valoresDirector(datos) {
  const r = datos.resultado, dir = datos.director, b = datos.btl;
  const Mes = MESES[datos.numeroMes - 1];
  const opp = dir.oportunidad, bas = dir.basico;
  const imr = bas !== null && opp !== null ? bas + opp : null;
  const tope = datos.param.tope;
  const pagoNueva = r.pagoNueva;
  const anterior = r.comisionAnterior;
  const aplicable = pagoNueva === null && anterior === null ? null : Math.max(pagoNueva ?? -Infinity, anterior ?? -Infinity);
  const metaSuma = datos.equipo.reduce((s, e) => s + (e.metaBase || 0), 0);
  const cumpSuma = metaSuma ? (r.cierreBase ?? 0) / metaSuma : null;
  const ptsSuma = cumpSuma === null ? null : datos.param.pesoBase * Math.min(tope, cumpSuma);
  const scoreSuma = r.score === null || ptsSuma === null ? null : r.score - (r.ptsBase ?? 0) + ptsSuma;
  const pagoSuma = scoreSuma === null || opp === null ? null : opp * Math.min(tope, factorCurva(scoreSuma, datos.curva));
  const ventas = (prod) => datos.resultado.detalleVentas.find((x) => x.producto === prod);
  const cumpUtil = b.utilidadPresupuestada ? (b.utilidadReal ?? 0) / b.utilidadPresupuestada : null;
  const margen = b.ingreso && b.utilidadReal !== null ? b.utilidadReal / b.ingreso : null;
  const totalAnterior = anterior === null || r.btlAnterior === null ? null : anterior + r.btlAnterior;
  const curva = (puntaje) => (opp === null ? null : opp * factorCurva(puntaje, datos.curva));
  const hist = dir.historico || {};
  const n = datos.equipo.length;
  const ganaNueva = pagoNueva !== null && anterior !== null ? pagoNueva >= anterior : null;
  const det = b.pagadoDetalle || {};
  return {
    Mes: Mes[0].toUpperCase() + Mes.slice(1), mes: Mes, anio: String(datos.anio),
    nombre: dir.nombre || "Pendiente", cargo: dir.cargo || "Pendiente",
    basico: pesos(bas), oportunidad: pesos(opp), imr: pesos(imr), maximo: pesos(bas === null || opp === null ? null : bas + opp * tope),
    variableMaxima: pesos(opp === null ? null : opp * tope), curva80: pesos(curva(80)), curva90: pesos(curva(90)), curva110: pesos(curva(110)),
    historico: pesos(hist.ingresoNormalizado), variablePromedio: pesos(hist.variablePromedio),
    mejoraHistorico: pesos(imr !== null && hist.ingresoNormalizado ? imr - hist.ingresoNormalizado : null),
    mejoraHistoricoPct: imr !== null && hist.ingresoNormalizado ? `${miles((imr / hist.ingresoNormalizado - 1) * 100, 1)} %` : "Pendiente",
    cumpEdu: pct(ventas("eduAt")?.cumplimiento), cumpMision: pct(ventas("mision")?.cumplimiento),
    cumpVentas: pct(r.ptsVentas === null ? null : r.ptsVentas / datos.param.pesoVentas), ptsVentas: dos(r.ptsVentas),
    cumpBase: pct(r.cumpBase), ptsBase: dos(r.ptsBase), cierreBase: r.cierreBase === null ? "Pendiente" : miles(r.cierreBase),
    metaBaseSocial: datos.metaBaseSocial === null ? "Pendiente" : miles(datos.metaBaseSocial), metaBaseSuma: miles(metaSuma),
    cumpBaseSuma: pct(cumpSuma), ptsBaseSuma: dos(ptsSuma), scoreConSuma: dos(scoreSuma), pagoConSuma: pesos(pagoSuma, 2),
    score: dos(r.score), factorPct: pct(r.factor), pagoNueva: pesos(pagoNueva, 2),
    metaMision: pesos(datos.metaMision), metaMisionSuma: pesos(datos.equipo.reduce((s, e) => s + (e.metaMision || 0), 0)),
    valorFacturaMision: pesos(datos.param.valorFacturaMision),
    baseAnterior: pesos(r.baseAnterior), comisionAnterior: pesos(anterior, 2), btlAnterior: pesos(r.btlAnterior), baseBtl: pesos(r.baseBtl),
    totalAnterior: pesos(totalAnterior, 2), ingresoTotal: pesos(bas === null || aplicable === null ? null : bas + aplicable, 2),
    tasaAnterior: tasaTxt(datos.param.tasaAnterior), tasaBtl: tasaTxt(datos.param.tasaBtlAnterior), nLineas: String(r.lineas),
    hojaFacturacion: datos.hojaFacturacion || "Facturación", eventosBtl: datos.eventosBtl.map((e) => `${e.evento}: ${pesos(e.ingreso)}`).join("; ") || "sin eventos",
    eventoBtl: b.evento || "sin evento BTL", comercialBtl: b.comercialNombre || "Pendiente", btlComercial: pesos(b.comercialPreliminar),
    btlTopeEvento: pesos(imr === null ? null : 0.25 * imr, 2), btlTopeEventoEntero: pesos(imr === null ? null : 0.25 * imr),
    utilPresup: pesos(b.utilidadPresupuestada), utilReal: pesos(b.utilidadReal), cumpUtil: pct(cumpUtil), margenBtl: pct(margen),
    limiteConjunto: pesos(b.utilidadReal === null ? null : b.utilidadReal * 0.25), ingresoPresupuestado: pesos(b.ingresoPresupuestado),
    btlPagado: pesos(b.pagadoAnio), btlPagadoEvento: det.evento || "(sin dato)", btlPagadoDoc: det.documento || "(sin dato)", btlPagadoFecha: det.fecha || "(sin dato)",
    canalMeta: datos.canal.meta === null ? "(sin dato)" : pesos(datos.canal.meta), canalProduccion: pesos(datos.canal.produccion), canalEdu: pesos(datos.canal.edu), canalJornada: pesos(datos.canal.jornada),
    cartones: datos.cultural.cartones === null ? "(sin dato)" : miles(datos.cultural.cartones), valorCarton: pesos(datos.cultural.valorCarton),
    metaCultural: pesos(datos.cultural.cartones === null || datos.cultural.valorCarton === null ? null : datos.cultural.cartones * datos.cultural.valorCarton),
    nEquipoTexto: NUMEROS[n] || String(n),
    metodo: datos.metodo, regla100: datos.regla100,
    faltantes: [datos.canal.meta === null ? "meta del canal nacional" : null, b.ingresoPresupuestado === null ? "ingreso presupuestado del evento BTL" : null,
      b.pagadoDetalle ? null : "detalle del BTL ya pagado en el año", datos.cultural.cartones === null ? "cartones culturales del director" : null].filter(Boolean).join(", ") || "ninguno",
    fraseNoIncluidos: datos.noIncluidos.length ? ` No se incluye a ${datos.noIncluidos.map((x) => `${x.nombre} (${x.motivo})`).join(" ni a ")}.` : "",
    fraseGana: ganaNueva === null ? "falta un dato para comparar" : ganaNueva ? "la política nueva es más favorable" : "el esquema anterior es más favorable",
    rige: ganaNueva === null ? "lo que resulte al completar los datos" : ganaNueva ? "la política nueva" : "el esquema anterior",
    fraseBtlTransicion: totalAnterior === null || pagoNueva === null ? "" : totalAnterior < pagoNueva
      ? `Aun sumando el BTL anterior (${pesos(r.btlAnterior)}), el esquema anterior (${pesos(totalAnterior, 2)}) queda por debajo.`
      : `Sumando el BTL anterior (${pesos(r.btlAnterior)}), el esquema anterior (${pesos(totalAnterior, 2)}) queda por encima.`,
    fraseCumpUtil: cumpUtil === null ? " Falta la utilidad presupuestada del evento." : cumpUtil >= 1 ? ` En ${b.evento} supera el 100 %.` : ` En ${b.evento} queda en ${pct(cumpUtil)}.`,
    fraseMargen: margen === null ? "" : margen > 0.15 ? ` En ${b.evento} queda por encima del 15 %.` : ` En ${b.evento} queda en ${pct(margen)}.`,
    fraseRecaudo: b.ingresoPresupuestado === null ? "Falta el ingreso presupuestado del evento para confirmar la meta de recaudo. Elija SÍ o NO."
      : `El ingreso de ejecución (${pesos(b.ingreso)}) ${b.ingreso >= b.ingresoPresupuestado ? "supera" : "no alcanza"} el ingreso presupuestado (${pesos(b.ingresoPresupuestado)}). Confírmelo si el criterio oficial es otro.`,
  };
}
const llenar = (plantilla, valores) => plantilla.replace(/\{(\w+)\}/g, (t, k) => (k in valores ? valores[k] : t));

// ───────────── Libro ─────────────
let plantillaBytes = null, textosCache = null, mapeoCache = null;
async function traer(ruta, tipo) {
  try {
    return await recurso(ruta, tipo === "json" ? "json" : "bytes");
  } catch {
    throw new Error(`No se encontró ${ruta} (plantilla del Excel del director)`);
  }
}
const escapeTexto = (t) => String(t ?? "").replace(/"/g, '""');

/**
 * Escribe los datos en la plantilla v15 (misma forma que el libro de un comercial) y devuelve el .xlsx (Uint8Array).
 * Recibe la plantilla, los textos y el mapeo para poder usarse fuera del navegador.
 */
export async function libroDirector(datos, { clave, plantilla, textos, mapeo, JSZip = globalThis.JSZip } = {}) {
  if (!JSZip) throw new Error("No se encontró la librería del Excel individual");
  plantilla = plantilla || plantillaBytes || (plantillaBytes = await traer("plantillas/plantilla_liquidacion_director.xlsx"));
  textos = textos || textosCache || (textosCache = await traer("plantillas/textos_director.json", "json"));
  mapeo = mapeo || mapeoCache || (mapeoCache = await traer("plantillas/mapeo_celdas_director.json", "json"));
  const lib = await M.abrirPlantilla(plantilla, JSZip);
  const valores = valoresDirector(datos);
  const fuente = { ...datos, param: { ...datos.param, ...datos.paramV15 } };
  // 1. Textos con marcadores.
  for (const [celda, texto] of Object.entries(textos)) {
    const [hoja, ref] = celda.split("!");
    M.escribirCelda(lib, hoja, ref, llenar(texto, valores), { sobreFormula: false });
  }
  // 2. Celdas de entrada (ruta con puntos: «director.basico», «curvaAnclas.0.puntaje»).
  const valorDe = (ruta) => ruta.split(".").reduce((o, k) => (o == null ? null : o[k]), fuente);
  for (const [hoja, celdas] of Object.entries(mapeo.entradas)) {
    for (const [ref, ruta] of Object.entries(celdas)) {
      const v = valorDe(ruta);
      M.escribirCelda(lib, hoja, ref, v === undefined ? null : v);
    }
  }
  // La curva usa solo las anclas cargadas (las filas sobrantes de Parámetros quedan vacías).
  const celdasCurva = Object.entries(mapeo.entradas["Parámetros"] || {}).filter(([, r]) => /^curvaAnclas\.\d+\.puntaje$/.test(r)).map(([ref]) => Number(ref.slice(1)));
  if (celdasCurva.length && datos.curvaAnclas.length) {
    const ini = Math.min(...celdasCurva), fin = ini + Math.min(datos.curvaAnclas.length, celdasCurva.length) - 1;
    M.definirNombre(lib, "Curva_puntos", `'Parámetros'!$A$${ini}:$A$${fin}`);
    M.definirNombre(lib, "Curva_factor", `'Parámetros'!$B$${ini}:$B$${fin}`);
  }
  // 3. Tablas (cada una en su hoja): filas al tamaño de los datos y fórmulas por fila.
  const llenarTabla = (T, lista) => {
    M.redimensionarTabla(lib, T.hoja, T.primera, T.ultima, lista.length);
    lista.forEach((fila, i) => {
      const r = T.primera + i;
      for (const [col, campo] of Object.entries(T.columnas)) M.escribirCelda(lib, T.hoja, `${col}${r}`, fila[campo] === undefined ? null : fila[campo], { sobreFormula: true });
      for (const [col, f] of Object.entries(T.formulas || {})) M.escribirFormula(lib, T.hoja, `${col}${r}`, f.replace(/\{r\}/g, r));
    });
  };
  const T = mapeo.tablas;
  llenarTabla(T.facturas, datos.facturas.map((f) => ({ ...f, producto: [f.grupo, f.subgrupo].filter(Boolean).join(" · ") || null })));
  llenarTabla(T.equipo, datos.filasEquipo);
  // Fila «Otros asesores»: su base no tiene clave propia en la facturación.
  datos.filasEquipo.forEach((f, i) => {
    if (f.baseOtros !== undefined) {
      const r = T.equipo.primera + i;
      M.escribirFormula(lib, T.equipo.hoja, `O${r}`, `SUM(Fac_Base)-SUM(O${T.equipo.primera}:O${r - 1})`);
    }
  });
  ajustesDirectorV19(lib, datos);
  if (clave) await M.proteger(lib, clave);
  return M.guardar(lib);
}

// v19: puntos por producto en 5.4 (tope por producto), notas de cómo se agrega 5.5–5.7 y margen bruto en BTL.
function ajustesDirectorV19(lib, datos) {
  const H = "Liquidación";
  const pct = (v) => `${(Number(v) * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })} %`;
  const tope = num(datos.topeProducto) ?? 1.2;
  const topeCongreso = Math.min(num(datos.param?.topeCongreso ?? datos.paramV15?.topeCongreso) ?? 1, tope);
  for (const col of ["A", "B", "C"]) { const s = M.leerEstilo(lib, "Parámetros", `${col}28`); if (s !== null) M.ponerEstilo(lib, "Parámetros", `${col}29`, s); }
  M.escribirCelda(lib, "Parámetros", "A29", "Tope por producto (5.4)");
  M.escribirCelda(lib, "Parámetros", "B29", tope);
  M.escribirCelda(lib, "Parámetros", "C29", "Tope_producto_5_4");
  M.definirNombre(lib, "Tope_producto_5_4", "'Parámetros'!$B$29");
  M.escribirFormula(lib, H, "I43", "H20*MIN(I23,Tope_producto_5_4)+H27*MIN(I33,Tope_producto_5_4)+H34*MIN(I37,Tope_producto_5_4)+H38*MIN(I41,Tope_producto_5_4)");
  M.escribirCelda(lib, H, "F43", "Cumplimiento ponderado (Σ peso × cumplimiento elegible)", { sobreFormula: true });
  M.escribirCelda(lib, H, "F44", "Puntos (= suma de la columna Puntos)", { sobreFormula: true });
  M.escribirCelda(lib, H, "I19", "Puntos", { sobreFormula: true });
  const sH19 = M.leerEstilo(lib, H, "H19"); if (sH19 !== null) M.ponerEstilo(lib, H, "I19", sH19);
  const estiloPuntos = M.estiloConFormato(lib, M.leerEstilo(lib, H, "H20"), "0.00");
  const detalle = datos.resultado?.detalleVentas || [];
  for (const [fila, cumpl, clave] of [[20, 23, "eduAt"], [27, 33, "mision"], [34, 37, "congreso"], [38, 41, "cultural"]]) {
    M.escribirFormula(lib, H, `I${fila}`, `Peso_Ventas*N(H${fila})*MIN(N(I${cumpl}),Tope_producto_5_4)`);
    M.ponerEstilo(lib, H, `I${fila}`, estiloPuntos);
    M.escribirCelda(lib, H, `F${cumpl}`, `Cumplimiento real (se reconoce hasta ${pct(clave === "congreso" ? topeCongreso : tope)})`, { sobreFormula: true });
    const d = detalle.find((x) => x.producto === clave);
    if (d?.excede) M.ponerEstilo(lib, H, `I${cumpl}`, M.estiloConRelleno(lib, M.leerEstilo(lib, H, `I${cumpl}`), "FFFFE3C2"));
  }
  const sNota = M.leerEstilo(lib, H, "F42");
  const nota = (ref, texto) => { M.escribirCelda(lib, H, ref, texto, { sobreFormula: true }); };
  nota("F45", `Sobrecumplimiento: hasta ${pct(tope)} por producto (Congreso ${pct(topeCongreso)}); el exceso no compensa otros.`);
  const metodo = datos.metodo || "";
  for (const fila of [45, 54, 68, 74]) M.altoFila(lib, H, fila, 15);
  nota("F54", `Agregado: suma de cierres del equipo ÷ meta de Parámetros (${metodo}).`);
  nota("F68", "Agregado: promedio de los medidos; sin medición = neutral.");
  nota("F74", "Agregado: promedio del equipo ÷ esperada; sin encuesta = neutral.");
  void sNota;
  // BTL: margen que decide la tabla.
  const b = datos.btl || {};
  if (b.margenDecide !== "neto" && num(b.costo) !== null) {
    M.escribirFormula(lib, H, "I83", `IF(NOT(ISNUMBER(I77)),"Pendiente",IF(I77=0,0,(I77-${num(b.costo)})/I77))`);
    M.escribirCelda(lib, H, "F83", "Margen bruto del evento (decide la tabla)", { sobreFormula: true });
  } else {
    M.escribirCelda(lib, H, "F83", "Margen neto del evento (decide la tabla)", { sobreFormula: true });
  }
  // Condiciones 5.11.5 al final del bloque BTL (Sí/No), sin mover celdas existentes.
  const estiloF = M.leerEstilo(lib, H, "F83");
  const estiloI = M.leerEstilo(lib, H, "I83");
  const filasCond = [
    [90, "Participación director", b.participacion ?? "No"],
    [91, "Cierre o certificación financiera", b.cierre ?? "No"],
    [92, "Meta de recaudo", b.recaudo ?? "No"],
    [93, "Satisfacción del evento", b.satisfaccion ?? "No"],
  ];
  for (const [fila, etiqueta, valor] of filasCond) {
    if (estiloF !== null) M.ponerEstilo(lib, H, `F${fila}`, estiloF);
    if (estiloI !== null) M.ponerEstilo(lib, H, `I${fila}`, estiloI);
    M.escribirCelda(lib, H, `F${fila}`, etiqueta, { sobreFormula: true });
    M.escribirCelda(lib, H, `I${fila}`, valor, { sobreFormula: true });
  }
}

export function nombreArchivoDirector(mes) {
  const [anio, n] = String(mes).split("-").map(Number);
  const m = MESES[n - 1] || "";
  return `Liquidacion_${m.slice(0, 1).toUpperCase()}${m.slice(1, 3)}${anio}_Director.xlsx`;
}

function sinTildeMin(t) { return String(t ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

function mesVisible() {
  const t = obtenerParametros().transicion || {};
  return globalThis.document?.querySelector("#mes-carga")?.value || t.inicio || t.desde || "";
}

/** Excel del director con la liquidación que muestra la app (la de la vista Director). */
export async function generarExcelDirector({ clave, liquidacion } = {}) {
  if (!liquidacion?.director) throw new Error("Carga la facturación para exportar");
  const datos = construirDatosDirector(liquidacion, obtenerParametros(), obtenerFacturacion(), mesVisible());
  return libroDirector(datos, { clave });
}

export async function descargarExcelDirector(opciones = {}) {
  const bytes = await generarExcelDirector(opciones);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivoDirector(mesVisible());
  enlace.click();
  URL.revokeObjectURL(url);
}
