/**
 * Encabezado de cada comercial (nombre oficial, documento, cargo, salario, oportunidad y referencia de mercado).
 * Los datos son personales: vienen de datos/encabezados_comerciales.json, que vive solo en este computador.
 * No se envían a internet. El IMR y el ingreso máximo NO se guardan: se calculan (básico + oportunidad, tope de pago).
 */
import { obtenerParametros } from "./parametros.js";

import { empaquetado } from "./recursos.js";

const RUTA = "datos/encabezados_comerciales.json";
let estadoEncabezados = { origen: null, aplicados: 0, avisos: [] };
const porNombre = new Map();
let delDirector = null; // bloque «director» del archivo de encabezados // último archivo cargado (sobrevive a «Restaurar» o «Importar JSON» de parámetros)

const clave = (texto) => String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const numero = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

export function estadoDeEncabezados() {
  return estadoEncabezados;
}

/**
 * v16: el HTML de doble clic no trae el equipo (nombres, salarios, metas). Llega en el bloque «equipo»
 * del archivo de encabezados: { director:{nombre,nombreCorto,basico,oportunidad}, btlEventos:[…], comerciales:[…] }.
 * Solo agrega quien falta y llena lo vacío: no pisa lo que ya está en Parámetros. Devuelve cuántos comerciales agregó.
 */
function aplicarEquipo(p, equipo) {
  let nuevos = 0;
  if (!Array.isArray(p.comerciales)) p.comerciales = [];
  for (const item of equipo.comerciales || []) {
    if (!item?.nombre || p.comerciales.some((c) => clave(c.nombre) === clave(item.nombre))) continue;
    p.comerciales.push(JSON.parse(JSON.stringify(item)));
    nuevos += 1;
  }
  p.director = p.director || {};
  for (const campo of ["nombre", "nombreCorto", "basico", "oportunidad"]) {
    const actual = p.director[campo];
    if ((actual === null || actual === undefined || actual === "") && equipo.director?.[campo] !== undefined) p.director[campo] = equipo.director[campo];
  }
  p.btl = p.btl || {};
  if ((!Array.isArray(p.btl.eventos) || !p.btl.eventos.length) && Array.isArray(equipo.btlEventos)) p.btl.eventos = JSON.parse(JSON.stringify(equipo.btlEventos));
  return nuevos;
}

/** Une los datos del archivo con parametros.comerciales. Devuelve { aplicados, avisos }. */
export function aplicarEncabezados(datos, origen = "archivo") {
  const lista = Array.isArray(datos) ? datos : datos?.comerciales;
  if (!Array.isArray(lista)) throw new Error("El archivo de encabezados no trae la lista «comerciales».");
  const p = obtenerParametros();
  const tope = Number(p.curva?.tope ?? p.topeIndicador);
  const avisos = [];
  let aplicados = 0;
  const equipoNuevo = datos && !Array.isArray(datos) && datos.equipo ? aplicarEquipo(p, datos.equipo) : 0;
  for (const item of lista) {
    const persona = (p.comerciales || []).find((c) => [c.nombre, c.nombreFacturacion, c.nombreOficial].some((n) => clave(n) === clave(item.nombre)));
    if (!persona) { avisos.push(`«${item.nombre}» no está en los parámetros; no se aplicó.`); continue; }
    persona.nombreOficial = item.nombreOficial ?? null;
    persona.documento = item.documento === null || item.documento === undefined ? "" : String(item.documento);
    persona.cargo = item.cargo ?? "";
    if (numero(item.basico) !== null) {
      if (persona.basico !== null && persona.basico !== undefined && Number(persona.basico) !== numero(item.basico)) avisos.push(`${persona.nombre}: el básico cambia de ${persona.basico} a ${item.basico} (matriz).`);
      persona.basico = numero(item.basico);
    }
    if (numero(item.oportunidad) !== null) {
      if (persona.oportunidad !== null && persona.oportunidad !== undefined && Number(persona.oportunidad) !== numero(item.oportunidad)) avisos.push(`${persona.nombre}: la oportunidad cambia de ${persona.oportunidad} a ${item.oportunidad} (matriz).`);
      persona.oportunidad = numero(item.oportunidad);
    }
    persona.referenciaMercado = {
      tipo: item.referenciaMercado?.tipo ?? null,
      nombre: item.referenciaMercado?.nombre ?? null,
      valor: numero(item.referenciaMercado?.valor),
    };
    // Control de coherencia: no se usa para calcular.
    const imr = persona.basico !== null && persona.oportunidad !== null ? persona.basico + persona.oportunidad : null;
    if (item.control?.imr !== undefined && imr !== null && Math.abs(imr - Number(item.control.imr)) > 0.5) avisos.push(`${persona.nombre}: básico + oportunidad = ${imr}, pero el control dice IMR ${item.control.imr}.`);
    if (item.control?.ingresoMaximo !== undefined && imr !== null && Number.isFinite(tope)) {
      const maximo = persona.basico + (imr - persona.basico) * tope;
      if (Math.abs(maximo - Number(item.control.ingresoMaximo)) > 0.5) avisos.push(`${persona.nombre}: ingreso máximo calculado ${maximo}, control ${item.control.ingresoMaximo}.`);
    }
    for (const campo of ["nombreOficial", "documento", "cargo"]) if (!persona[campo]) avisos.push(`${persona.nombre}: falta ${campo}.`);
    if (!persona.referenciaMercado.tipo || persona.referenciaMercado.valor === null) avisos.push(`${persona.nombre}: falta la referencia de mercado.`);
    porNombre.set(clave(persona.nombre), { nombreOficial: persona.nombreOficial, documento: persona.documento, cargo: persona.cargo, basico: persona.basico, oportunidad: persona.oportunidad, referenciaMercado: persona.referenciaMercado, comparaAnterior: item.comparaEsquemaAnterior !== false });
    aplicados += 1;
  }
  if (datos && !Array.isArray(datos) && datos.director) {
    const d = datos.director;
    const dir = p.director || {};
    if (numero(d.basico) !== null && dir.basico !== null && dir.basico !== undefined && Number(dir.basico) !== numero(d.basico)) avisos.push(`Director: el básico cambia de ${dir.basico} a ${d.basico} (matriz).`);
    if (numero(d.oportunidad) !== null && dir.oportunidad !== null && dir.oportunidad !== undefined && Number(dir.oportunidad) !== numero(d.oportunidad)) avisos.push(`Director: la oportunidad cambia de ${dir.oportunidad} a ${d.oportunidad} (matriz).`);
    if (numero(d.basico) !== null) dir.basico = numero(d.basico);
    if (numero(d.oportunidad) !== null) dir.oportunidad = numero(d.oportunidad);
    const imr = dir.basico !== null && dir.oportunidad !== null ? dir.basico + dir.oportunidad : null;
    if (d.control?.imr !== undefined && imr !== null && Math.abs(imr - Number(d.control.imr)) > 0.5) avisos.push(`Director: básico + oportunidad = ${imr}, pero el control dice IMR ${d.control.imr}.`);
    delDirector = {
      nombreOficial: d.nombreOficial || d.nombre || null, documento: d.documento === null || d.documento === undefined ? "" : String(d.documento),
      cargo: d.cargo || "", nivel: d.nivel || "", basico: dir.basico ?? null, oportunidad: dir.oportunidad ?? null,
      referenciaMercado: { tipo: d.referenciaMercado?.tipo ?? null, nombre: d.referenciaMercado?.nombre ?? null, valor: numero(d.referenciaMercado?.valor) },
      historico: d.historico || null,
    };
    for (const campo of ["nombreOficial", "documento", "cargo"]) if (!delDirector[campo]) avisos.push(`Director: falta ${campo}.`);
    aplicados += 1;
  }
  estadoEncabezados = { origen, aplicados, avisos, equipoNuevo };
  if (equipoNuevo) document.dispatchEvent(new CustomEvent("equipo-cargado", { detail: `Equipo cargado desde ${origen}: ${equipoNuevo} personas. Revise y guarde si quiere conservarlo en este navegador.` }));
  document.dispatchEvent(new Event("liquidacion-actualizada"));
  return estadoEncabezados;
}

/** Con Live Server lee datos/encabezados_comerciales.json si existe. Si no existe, no pasa nada. */
export async function cargarEncabezadosLocales() {
  if (empaquetado()) return null; // doble clic: los datos personales no van dentro del HTML; se usa el botón
  try {
    const respuesta = await fetch(RUTA, { cache: "no-store" });
    if (!respuesta.ok) return null;
    return aplicarEncabezados(await respuesta.json(), RUTA);
  } catch {
    return null; // file:// o sin archivo: se usa el botón
  }
}

/** Botón «Cargar encabezados (.json)». */
export async function cargarEncabezadosDeArchivo(archivo) {
  const texto = await archivo.text();
  return aplicarEncabezados(JSON.parse(texto), archivo.name);
}

/**
 * Encabezado vigente de un comercial: lo del archivo de encabezados; si no hay archivo, lo escrito en Parámetros.
 * Devuelve { nombreOficial, documento, cargo, basico, oportunidad, referenciaMercado:{tipo,nombre,valor} }.
 */
export function encabezadoDe(comercial) {
  const del = porNombre.get(clave(comercial?.nombre)) || {};
  const ref = del.referenciaMercado || comercial?.referenciaMercado || {};
  return {
    nombreOficial: del.nombreOficial || comercial?.nombreOficial || comercial?.nombre || "",
    documento: del.documento || comercial?.documento || "",
    cargo: del.cargo || comercial?.cargo || "",
    basico: del.basico ?? comercial?.basico ?? null,
    oportunidad: del.oportunidad ?? comercial?.oportunidad ?? null,
    referenciaMercado: { tipo: ref.tipo ?? null, nombre: ref.nombre ?? null, valor: ref.valor ?? null },
    comparaAnterior: del.comparaAnterior !== false, // v16: false = ingresa nuevo; su Comisión anterior se muestra «No aplica»
  };
}

/** Encabezado vigente del director: el bloque «director» del archivo; si no hay archivo, los parámetros. */
export function encabezadoDirector(director = obtenerParametros().director || {}) {
  const del = delDirector || {};
  return {
    nombreOficial: del.nombreOficial || director.nombreOficial || director.nombre || "",
    documento: del.documento || director.documento || "",
    cargo: del.cargo || director.cargo || "",
    nivel: del.nivel || director.nivel || "",
    basico: del.basico ?? director.basico ?? null,
    oportunidad: del.oportunidad ?? director.oportunidad ?? null,
    referenciaMercado: del.referenciaMercado || { tipo: null, nombre: null, valor: null },
    historico: del.historico || null,
  };
}
