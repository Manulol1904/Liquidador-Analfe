/**
 * Lectura de Excel (SheetJS) y revisión de filas.
 * El archivo no se envía a internet: se lee en el navegador.
 */

import { fijarEventosBtl, fijarMetaAnterior, obtenerParametros } from "./parametros.js";
import { sincronizarParametrosBtl, unirEventos } from "./btlArchivos.js";
import { htmlSeccionBtl, iniciarSeccionBtl } from "./cargaBtl.js";
import { avisoBreve, escaparHtml, plural } from "./utilidades.js";
import { cargarEncabezadosDeArchivo, estadoDeEncabezados } from "./encabezados.js";
import { empaquetado } from "./recursos.js";

const CAMPOS_FACTURACION = [
  { clave: "numero", titulo: "#", aliases: ["#", "numero", "número"] },
  { clave: "factura", titulo: "Factura", aliases: ["factura"] },
  { clave: "cliente", titulo: "Cliente", aliases: ["cliente", "entidad"] },
  { clave: "asesor", titulo: "Asesor", aliases: ["asesor"] },
  { clave: "grupo", titulo: "Grupo", aliases: ["grupo"] },
  { clave: "subgrupo", titulo: "Subgrupo", aliases: ["subgrupo"] },
  { clave: "cuenta", titulo: "Cuenta", aliases: ["cuenta", "servicio"] },
  { clave: "evento", titulo: "Evento", aliases: ["evento", "evento_id", "nro evento", "no. evento"] },
  { clave: "base", titulo: "Base", aliases: ["base"] },
  { clave: "comision", titulo: "% comisión", aliases: ["% com", "% comision", "% comisión"] },
  { clave: "direccion", titulo: "% dirección", aliases: ["% direccion", "% dirección"] },
  { clave: "fecha", titulo: "Fecha", aliases: ["fecha facturacion", "fecha de facturacion", "fecha"] },
  { clave: "fechaPago", titulo: "Fecha de pago", aliases: ["fecha de pago", "fecha pago"] },
  { clave: "estado", titulo: "Estado", aliases: ["estado"] },
  { clave: "margen", titulo: "Margen", aliases: ["margen", "margen bruto"] },
];

const CAMPOS_EVENTOS = [
  { clave: "mes", titulo: "Mes", aliases: ["mes"] },
  { clave: "evento", titulo: "Evento", aliases: ["evento", "evento_id", "#"], primero: true },
  { clave: "factura", titulo: "Factura", aliases: ["factura", "facturas"] },
  { clave: "cliente", titulo: "Cliente", aliases: ["cliente", "entidad"] },
  { clave: "comercial", titulo: "Comercial", aliases: ["comercial", "asesor", "comercial_responsable"] },
  { clave: "ingreso", titulo: "Ingreso", aliases: ["ingreso", "ingreso_ejecucion"] },
  { clave: "costo", titulo: "Costo", aliases: ["costo", "costo_real"], exacto: true },
  { clave: "utilidadPresupuestada", titulo: "Utilidad presupuestada", aliases: ["utilidad presupuestada", "utilidad_presupuestada"] },
  { clave: "grupo", titulo: "Grupo", aliases: ["grupo"] },
  { clave: "producto", titulo: "Producto", aliases: ["producto"] },
  { clave: "detalle", titulo: "Detalle", aliases: ["detalle"] },
];

const CAMPOS_BTL_EVENTOS = [
  { clave: "evento", titulo: "Evento", aliases: ["evento_id", "#", "evento"], primero: true, exacto: true },
  { clave: "utilidadPresupuestada", titulo: "Utilidad presupuestada", aliases: ["utilidad_presupuestada", "utilidad presupuestada"], exacto: true },
  { clave: "participacionComercial", titulo: "Participación comercial", aliases: ["participacion_material_comercial"], exacto: true },
  { clave: "participacionDirector", titulo: "Participación director", aliases: ["participacion_material_director"], exacto: true },
  { clave: "cierre", titulo: "Cierre", aliases: ["certificacion_financiera"], exacto: true },
  { clave: "recaudo", titulo: "Recaudo", aliases: ["meta_recaudo_alcanzada"], exacto: true },
  { clave: "satisfaccion", titulo: "Satisfacción", aliases: ["satisfaccion_cliente"], exacto: true },
  { clave: "ingresoEjecucion", titulo: "Ingreso de ejecución", aliases: ["ingreso_ejecucion", "ingreso ejecucion", "ingreso del evento"], exacto: true },
  { clave: "comercial", titulo: "Comercial", aliases: ["comercial", "asesor"], exacto: true },
];

let facturacionCargada = [];
let eventosCargados = [];
let facturaAEventoCargada = new Map();
/** Filas tipo Facturación (ASESOR, BASE, GRUPO, SERVICIO…) leídas del libro de Producción (p. ej. Misión Internacional). */
let produccionDetalleCargada = [];
let btlEventosCargados = new Map();
let btlEventosManual = false;
let controlHoja4 = null;

/** Control de la tabla dinámica Hoja4, si el libro la trae. Compara solo la columna de Suma de BASE. */
export function obtenerControlHoja4() {
  return controlHoja4;
}

/** Devuelve las filas de facturación ya mapeadas. */
export function obtenerFacturacion() {
  return facturacionCargada;
}

/**
 * Devuelve los eventos ya mapeados: los del informe de Producción más los eventos BTL
 * leídos de su archivo de liquidación o ingresados a mano (v18, js/btlArchivos.js).
 */
export function obtenerEventos() {
  const p = obtenerParametros();
  const mes = (typeof document !== "undefined" && document.querySelector("#mes-carga")?.value) || p.transicion?.desde || "";
  sincronizarParametrosBtl(p, mes);
  return unirEventos(eventosCargados, mes, p.hojas?.btl || "btl", p.costos);
}

/** Solo los eventos del informe de Producción (sin los BTL importados). */
export function obtenerEventosProduccion() {
  return eventosCargados;
}

/**
 * Detalle de producción con columnas de facturación (asesor, base, grupo, cuenta…),
 * p. ej. filas de Misión Internacional del archivo de producción.
 */
export function obtenerProduccionDetalle() {
  return produccionDetalleCargada;
}

/** Mapa de factura normalizada a la clave del evento (el #). */
export function obtenerFacturaAEvento() {
  return facturaAEventoCargada;
}

/** Utilidad presupuestada y condiciones leídas de la hoja BTL_Eventos. */
export function obtenerBtlEventos() {
  return btlEventosCargados;
}

/** Texto de factura o de mes: sin espacios de más y en mayúsculas. */
export function textoClave(valor) {
  return String(valor ?? "").trim().toUpperCase().replace(/\s+/g, " ");
}

const NUMERO_MES = {
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, SETIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12,
};

/** True si "OCTUBRE" corresponde al mes "2026-10". */
export function mesDelInforme(textoMes, mes) {
  const numero = NUMERO_MES[textoClave(textoMes)];
  if (!numero || !mes) return false;
  return Number(String(mes).split("-")[1]) === numero;
}

function facturasDeCelda(valor) {
  return textoClave(valor).split(",").map((parte) => parte.trim()).filter(Boolean);
}

/**
 * Junta el informe de producción.
 * El evento es el # (el mismo en todo el año): suma ingreso y costo de todos los meses.
 * factura → evento solo usa las filas del mes que se liquida.
 * Grupo y producto salen de la primera fila de ese #.
 */
export function armarProduccion(filas, mes) {
  const grupos = new Map();
  const facturaAEvento = new Map();
  filas.forEach((fila) => {
    const numero = String(fila.evento ?? "").trim();
    if (!numero) return;
    const clave = textoClave(numero);
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        evento: clave,
        ingreso: 0,
        costo: 0,
        comercial: fila.comercial || "",
        grupo: fila.grupo || "",
        producto: fila.producto || "",
        detalle: fila.detalle || "",
        delMes: false,
      });
    }
    const grupo = grupos.get(clave);
    grupo.ingreso += Number(fila.ingreso) || 0;
    grupo.costo += Number(fila.costo) || 0;
    if (!mesDelInforme(fila.mes, mes)) return;
    grupo.delMes = true;
    facturasDeCelda(fila.factura).forEach((factura) => {
      if (!facturaAEvento.has(factura)) facturaAEvento.set(factura, clave);
    });
  });
  return { eventos: [...grupos.values()], facturaAEvento };
}

function esMarcaSi(valor) {
  if (valor === true || valor === 1) return true;
  const marca = normalizar(valor);
  return marca === "si" || marca === "s" || marca === "1" || marca === "x" || marca === "true" || marca === "verdadero";
}

/** Lee la hoja BTL_Eventos: utilidad presupuestada y, si vienen, las condiciones. */
export function leerBtlEventos(matriz) {
  const encabezados = (matriz[0] || []).map((celda) => celda ?? "");
  const mapa = sugerirColumnas(encabezados, CAMPOS_BTL_EVENTOS).mapa;
  if (mapa.evento === "" || mapa.evento === undefined) return new Map();
  const filas = filasDesdeHoja(matriz, CAMPOS_BTL_EVENTOS, mapa, "BTL_Eventos", true);
  const eventos = new Map();
  filas.forEach((fila) => {
    const clave = textoClave(fila.evento);
    if (!clave) return;
    const condiciones = {};
    ["participacionComercial", "participacionDirector", "cierre", "recaudo", "satisfaccion"].forEach((campo) => {
      if (mapa[campo] === "" || mapa[campo] === undefined || vacio(fila[campo])) return;
      condiciones[campo] = esMarcaSi(fila[campo]);
    });
    eventos.set(clave, { utilidadPresupuestada: fila.utilidadPresupuestada, condiciones });
  });
  return eventos;
}

/** Ingreso de ejecución de BTL_Eventos. Null si la columna no está: no se usa el recaudo. */
export function leerIngresoEjecucion(matriz) {
  const encabezados = (matriz[0] || []).map((celda) => celda ?? "");
  const mapa = sugerirColumnas(encabezados, CAMPOS_BTL_EVENTOS).mapa;
  if (mapa.ingresoEjecucion === "" || mapa.ingresoEjecucion === undefined) return null;
  const filas = filasDesdeHoja(matriz, CAMPOS_BTL_EVENTOS, mapa, "BTL_Eventos", true);
  return filas.filter((fila) => !vacio(fila.evento)).map((fila) => ({
    evento: String(fila.evento).trim(),
    comercial: vacio(fila.comercial) ? "" : String(fila.comercial).trim(),
    ingresoEjecucion: vacio(fila.ingresoEjecucion) ? null : Number(fila.ingresoEjecucion),
  }));
}

function nombreHojaBtl(libro) {
  const compacto = (nombre) => normalizar(nombre).replace(/\s+/g, "");
  return Object.keys(libro).find((nombre) => compacto(nombre) === "btl_eventos" || compacto(nombre) === "btleventos");
}

function mapaDesdeFacturas(filas) {
  const mapa = new Map();
  filas.forEach((fila) => {
    const evento = textoClave(fila.evento);
    if (!evento) return;
    facturasDeCelda(fila.factura).forEach((factura) => {
      if (!mapa.has(factura)) mapa.set(factura, evento);
    });
  });
  return mapa;
}

function pareceProduccion(filas) {
  if (!filas.length) return false;
  const conMes = filas.filter((fila) => !vacio(fila.mes)).length;
  return conMes > 0 && conMes >= filas.length / 2;
}

/** Anticipo BTL: la cuenta empieza por el prefijo de la clasificación (27209). No se une con producción. */
function esAnticipo(fila) {
  const codigo = String(fila.cuenta || "").trim().split(/\s/)[0];
  const regla = (obtenerParametros().clasificacion || []).find((item) => item.producto === "btl");
  return (regla?.cuentasPrefijo || []).some((prefijo) => codigo.startsWith(String(prefijo)));
}

export function resumenUnion(filasFacturacion, facturaAEvento, mes) {
  const facturas = new Set();
  filasFacturacion.forEach((fila) => {
    if (fila.elegida === false || vacio(fila.asesor)) return;
    if (esAnticipo(fila)) return;
    if (fila.fecha instanceof Date && mes && !fechaEnMes(fila.fecha, mes)) return;
    const factura = textoClave(fila.factura);
    if (factura) facturas.add(factura);
  });
  let unidas = 0;
  facturas.forEach((factura) => {
    if (facturaAEvento.has(factura)) unidas += 1;
  });
  return { unidas, total: facturas.size };
}

/** Cuántas facturas de la hoja elegida encontraron evento. El anticipo 27209 no entra en este conteo. */

/** Lee Hoja4: asesor y Suma de BASE. Las columnas de redistribución no se usan. */
export function leerControlHoja4(libro) {
  const esperado = normalizar(obtenerParametros().carga?.hojaResumenAnterior || "").replace(/\s+/g, "");
  const nombre = Object.keys(libro || {}).find((hoja) => normalizar(hoja).replace(/\s+/g, "") === esperado);
  if (!nombre) return null;
  const matriz = libro[nombre] || [];
  let columnaBase = 1;
  let columnaAsesor = 0;
  let inicio = 0;
  for (let i = 0; i < Math.min(matriz.length, 15); i += 1) {
    const fila = matriz[i] || [];
    const indice = fila.findIndex((celda) => {
      const texto = normalizar(celda);
      return texto === "base" || (texto.includes("suma") && texto.includes("base"));
    });
    if (indice >= 0) {
      columnaBase = indice;
      columnaAsesor = Math.max(0, indice - 1);
      inicio = i + 1;
      break;
    }
  }
  const porAsesor = [];
  let total = null;
  for (let i = inicio; i < matriz.length; i += 1) {
    const fila = matriz[i] || [];
    const asesor = String(fila[columnaAsesor] ?? "").trim();
    const base = Number(fila[columnaBase]);
    if (!asesor || !Number.isFinite(base)) continue;
    const clave = normalizar(asesor);
    if (clave.startsWith("total") || clave.includes("etiqueta")) {
      if (clave.startsWith("total")) total = base;
      continue;
    }
    porAsesor.push({ asesor, base });
  }
  if (total === null) total = porAsesor.reduce((suma, fila) => suma + fila.base, 0);
  return { hoja: nombre, porAsesor, total };
}

/** Suma para cuadre con Hoja4: hoja elegida, con asesor y fecha en el mes (incluye anticipos 27209). */
function sumaProduccionMes(filas, mes) {
  return filas.reduce((suma, fila) => {
    if (fila.elegida !== true || vacio(fila.asesor)) return suma;
    if (!(fila.fecha instanceof Date) || !fechaEnMes(fila.fecha, mes)) return suma;
    return suma + (Number(fila.base) || 0);
  }, 0);
}

function aplicarEsquemaAnterior(libro) {
  const nombre = Object.keys(libro || {}).find((hoja) => normalizar(hoja).replace(/\s+/g, "") === "esquemaanterior");
  if (!nombre) return;
  const matriz = libro[nombre] || [];
  const encabezados = (matriz[0] || []).map((celda) => normalizar(celda));
  const columnaMeta = encabezados.findIndex((texto) => texto.includes("meta_anterior") || texto.includes("meta anterior"));
  if (columnaMeta < 0) return;
  const columnaNombre = encabezados.findIndex((texto) => texto.includes("comercial") || texto === "asesor" || texto === "nombre");
  const transicion = obtenerParametros().transicion || {};
  const mes = document.querySelector("#mes-carga")?.value || transicion.inicio || transicion.desde || "";
  const comerciales = obtenerParametros().comerciales;
  let aplicadas = 0;
  matriz.slice(1).forEach((fila) => {
    const crudo = fila[columnaMeta];
    const meta = typeof crudo === "number" ? crudo : Number(String(crudo ?? "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
    const nombreFila = fila[columnaNombre < 0 ? 0 : columnaNombre];
    const comercial = comerciales.find((item) => normalizar(item.nombre) === normalizar(nombreFila) || normalizar(item.nombreFacturacion) === normalizar(nombreFila));
    if (!comercial || !Number.isFinite(meta)) return;
    fijarMetaAnterior(comercial.nombre, mes, meta);
    aplicadas += 1;
  });
  if (aplicadas) document.dispatchEvent(new Event("metas-anteriores-cargadas"));
}

/** Deja el texto comparable: minúsculas y sin tildes. */
export function normalizar(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Elige la columna del archivo que más se parece al nombre esperado.
 * Primero busca el nombre exacto y luego el que empieza por el alias.
 * No usa una columna que ya esté en `usados`. Si hay dos candidatos, no elige.
 * Devuelve { indice, aviso }. indice es "" cuando no hay una sola columna clara.
 */
export function indiceSugerido(encabezados, aliases, usados = new Set(), soloExacto = false) {
  const normales = encabezados.map((encabezado) => normalizar(encabezado));
  const buscados = aliases.map((alias) => normalizar(alias)).filter(Boolean);
  const libre = (indice) => !usados.has(indice) && normales[indice] !== "";

  function elegir(indices, alias) {
    if (indices.length === 1) return { indice: indices[0], aviso: "" };
    if (indices.length > 1) {
      return { indice: "", aviso: `hay varias columnas para "${alias}". Elige cuál usar.` };
    }
    return null;
  }

  for (const buscado of buscados) {
    const exactos = [];
    normales.forEach((encabezado, indice) => {
      if (libre(indice) && encabezado === buscado) exactos.push(indice);
    });
    const elegido = elegir(exactos, buscado);
    if (elegido) return elegido;
  }
  if (soloExacto) return { indice: "", aviso: "" };
  for (const buscado of buscados) {
    const empiezan = [];
    normales.forEach((encabezado, indice) => {
      if (libre(indice) && encabezado.startsWith(buscado)) empiezan.push(indice);
    });
    const elegido = elegir(empiezan, buscado);
    if (elegido) return elegido;
  }
  return { indice: "", aviso: "" };
}

function indicePrimero(encabezados, aliases, usados, soloExacto = false) {
  const normales = encabezados.map((encabezado) => normalizar(encabezado));
  const buscados = aliases.map((alias) => normalizar(alias)).filter(Boolean);
  for (const buscado of buscados) {
    const exacto = normales.findIndex((encabezado, indice) => encabezado === buscado && !usados.has(indice) && encabezado !== "");
    if (exacto >= 0) return { indice: exacto, aviso: "" };
  }
  if (soloExacto) return { indice: "", aviso: "" };
  for (const buscado of buscados) {
    const empieza = normales.findIndex((encabezado, indice) => encabezado.startsWith(buscado) && !usados.has(indice) && encabezado !== "");
    if (empieza >= 0) return { indice: empieza, aviso: "" };
  }
  return { indice: "", aviso: "" };
}

function sugerirColumnas(encabezados, campos) {
  const usados = new Set();
  const mapa = {};
  const avisos = [];
  campos.forEach((campo) => {
    const sugerido = campo.primero
      ? indicePrimero(encabezados, campo.aliases, usados, campo.exacto)
      : indiceSugerido(encabezados, campo.aliases, usados, campo.exacto);
    mapa[campo.clave] = sugerido.indice === "" ? "" : String(sugerido.indice);
    if (sugerido.indice !== "") usados.add(sugerido.indice);
    if (sugerido.aviso) avisos.push({ clave: campo.clave, texto: `${campo.titulo}: ${sugerido.aviso}` });
  });
  return { mapa, avisos };
}

/** True si la fecha cae en el mes "AAAA-MM". Usa UTC cuando la fecha no trae hora. */
export function fechaEnMes(fecha, mes) {
  const [anio, numeroMes] = mes.split("-").map(Number);
  const sinHora = fecha.getUTCHours() === 0 && fecha.getUTCMinutes() === 0;
  const anioFecha = sinHora ? fecha.getUTCFullYear() : fecha.getFullYear();
  const mesFecha = sinHora ? fecha.getUTCMonth() + 1 : fecha.getMonth() + 1;
  return anioFecha === anio && mesFecha === numeroMes;
}

function comoFecha(valor) {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor;
  if (typeof valor === "number" && window.XLSX?.SSF) {
    const partes = window.XLSX.SSF.parse_date_code(valor);
    if (partes) return new Date(Date.UTC(partes.y, partes.m - 1, partes.d));
  }
  if (typeof valor === "string" && valor.trim()) {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) return fecha;
  }
  return null;
}

function vacio(valor) {
  return valor === null || valor === undefined || String(valor).trim() === "";
}

function nombresConocidos() {
  return obtenerParametros().comerciales.flatMap((persona) => [persona.nombre, persona.nombreFacturacion]);
}

/**
 * Revisa facturación ya mapeada.
 * Recibe filas, el mes y los nombres de comerciales.
 * Devuelve textos de advertencia. No corrige los datos.
 */
export function advertenciasFacturacion(filas, mes, nombres, hayColumnaFecha) {
  const avisos = [];
  const conocidos = new Set(nombres.map((nombre) => normalizar(nombre)));
  if (!hayColumnaFecha) {
    avisos.push("No marcaste la columna de fecha: no puedo avisar si hay facturas fuera del mes.");
  }
  filas.forEach((fila, indice) => {
    const numero = indice + 2;
    if (!vacio(fila.asesor) && !conocidos.has(normalizar(fila.asesor))) {
      avisos.push(`Fila ${numero}: el asesor "${fila.asesor}" no está en los parámetros.`);
    }
    if (vacio(fila.base) || Number.isNaN(Number(fila.base))) {
      avisos.push(`Fila ${numero}: la base está vacía.`);
    }
    const numeroFila = fila.numeroFila || numero;
    if (vacio(fila.asesor)) {
      avisos.push(`Fila ${numeroFila}: no tiene asesor (¿fila de totales?).`);
    }
    if (hayColumnaFecha && fila.fecha && !fechaEnMes(fila.fecha, mes)) {
      avisos.push(`Fila ${numeroFila}: la fecha está fuera de ${mes}.`);
    }
    if (hayColumnaFecha && !(fila.fecha instanceof Date)) {
      avisos.push(`Fila ${numeroFila}: no tiene fecha de facturación.`);
    }
  });
  return avisos;
}

/**
 * Revisa el informe de eventos.
 * Recibe filas y los nombres de comerciales. Devuelve advertencias.
 */
export function advertenciasEventos(filas, nombres, mes) {
  const conocidos = new Set(nombres.map((nombre) => normalizar(nombre)));
  const avisos = [];
  filas.forEach((fila, indice) => {
    if (mes && !vacio(fila.mes) && !mesDelInforme(fila.mes, mes)) return;
    const numero = indice + 2;
    if (!vacio(fila.comercial) && !conocidos.has(normalizar(fila.comercial))) {
      avisos.push(`Fila ${numero}: el comercial "${fila.comercial}" no está en los parámetros.`);
    }
    if (vacio(fila.ingreso) || Number.isNaN(Number(fila.ingreso))) {
      avisos.push(`Fila ${numero}: el ingreso está vacío.`);
    }
    if (vacio(fila.costo) || Number.isNaN(Number(fila.costo))) {
      avisos.push(`Fila ${numero}: el costo está vacío.`);
    }
  });
  return avisos;
}

/** Hojas del libro que son facturación complementaria (Misión, BTL), excepto la elegida. */
function hojasComplementarias(libro, hojaElegida) {
  const marcas = obtenerParametros().hojas || {};
  const mision = normalizar(marcas.mision || "mision");
  const btl = normalizar(marcas.btl || "btl");
  const facturacion = normalizar(marcas.facturacion || "facturacion");
  return Object.keys(libro).filter((nombre) => {
    const normal = normalizar(nombre);
    return nombre !== hojaElegida && (normal.includes(mision) || normal.includes(btl) || normal.startsWith(facturacion));
  });
}

/** Mapeo por nombre de encabezado para una hoja que no se eligió a mano. */
let avisosSugerencia = [];

function mapaAutomatico(matriz, campos) {
  const encabezados = (matriz[0] || []).map((celda) => celda ?? "");
  return sugerirColumnas(encabezados, campos).mapa;
}

/** Hoja del libro de Producción con detalle tipo Facturación (ASESOR + BASE + GRUPO/SERVICIO). */
function hojaPareceDetalleFacturacion(matriz) {
  if (!matriz || !matriz.length) return false;
  const encabezados = (matriz[0] || []).map((celda) => normalizar(celda));
  const tiene = (...aliases) => aliases.some((alias) => encabezados.some((h) => h === alias || h.includes(alias)));
  return tiene("asesor") && tiene("base") && (tiene("grupo") || tiene("servicio") || tiene("cuenta"));
}

/** Lee del libro de Producción las hojas con filas ASESOR/BASE (Misión Internacional, etc.). */
export function leerDetalleProduccion(libro) {
  const detalle = [];
  Object.keys(libro || {}).forEach((nombre) => {
    const matriz = libro[nombre] || [];
    if (!hojaPareceDetalleFacturacion(matriz)) return;
    const mapa = mapaAutomatico(matriz, CAMPOS_FACTURACION);
    if (mapa.asesor === "" || mapa.asesor === undefined || mapa.base === "" || mapa.base === undefined) return;
    detalle.push(...filasDesdeHoja(matriz, CAMPOS_FACTURACION, mapa, nombre, false));
  });
  return detalle;
}

function filasDesdeHoja(matriz, campos, mapa, hoja, elegida) {
  const cuerpo = matriz.slice(1);
  const filas = [];
  cuerpo.forEach((fila, indice) => {
    if (!fila.some((celda) => !vacio(celda))) return;
    const objeto = { hoja, elegida, numeroFila: indice + 2 };
    campos.forEach((campo) => {
      const columna = mapa[campo.clave];
      const valor = columna === "" || columna === undefined ? null : fila[Number(columna)];
      const esFecha = campo.clave === "fecha" || campo.clave === "fechaPago";
      objeto[campo.clave] = esFecha ? comoFecha(valor) : valor;
    });
    filas.push(objeto);
  });
  return filas;
}

function textoCelda(valor) {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (valor === null || valor === undefined) return "";
  return escaparHtml(valor);
}

function monedaCelda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return textoCelda(valor);
  return `$ ${Math.round(numero).toLocaleString("es-CO")}`;
}

function marcarSugeridos(contenedor, campos, encabezados, prefijo) {
  const sugerido = sugerirColumnas(encabezados, campos);
  avisosSugerencia = sugerido.avisos;
  campos.forEach((campo) => {
    const select = contenedor.querySelector(`select[data-mapa="${prefijo}"][data-campo="${campo.clave}"]`);
    if (select && sugerido.mapa[campo.clave] !== "") select.value = sugerido.mapa[campo.clave];
  });
}

function mapaDesdeSelects(contenedor, prefijo) {
  const mapa = {};
  contenedor.querySelectorAll(`select[data-mapa="${prefijo}"]`).forEach((select) => {
    mapa[select.dataset.campo] = select.value;
  });
  return mapa;
}

function fechaVisible(valor) {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) return "";
  const dia = String(valor.getDate()).padStart(2, "0");
  const mes = String(valor.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${valor.getFullYear()}`;
}

function celdaVista(campo, valor) {
  if (valor instanceof Date) return `<td class="num">${fechaVisible(valor)}</td>`;
  if (["base", "ingreso", "costo", "utilidadPresupuestada"].includes(campo.clave)) {
    return `<td class="dinero">${monedaCelda(valor)}</td>`;
  }
  if (["comision", "direccion", "margen"].includes(campo.clave)) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "<td></td>";
    const mostrado = Math.abs(numero) <= 1 ? numero * 100 : numero;
    return `<td class="num">${escaparHtml(String(Math.round(mostrado)))} %</td>`;
  }
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return `<td class="texto-recorte" title="${escaparHtml(texto)}">${escaparHtml(texto)}</td>`;
}

function agruparAvisos(avisos) {
  const grupos = new Map();
  avisos.forEach((aviso) => {
    const coincidencia = String(aviso).match(/^Fila (\d+): (.+)$/);
    const clave = coincidencia ? coincidencia[2].replace(/\.$/, "") : String(aviso);
    const fila = coincidencia ? coincidencia[1] : "";
    const actual = grupos.get(clave) || [];
    if (fila) actual.push(fila);
    grupos.set(clave, actual);
  });
  return [...grupos.entries()].map(([texto, filas]) => {
    const titulo = texto.charAt(0).toUpperCase() + texto.slice(1);
    const muestra = filas.slice(0, 8).join(", ");
    const cola = filas.length > 8 ? ", …" : "";
    const detalle = filas.length ? ` · ${plural(filas.length, "fila", "filas")} (${escaparHtml(muestra)}${cola})` : "";
    return `<details><summary><span class="badge badge--aviso">${filas.length || 1}</span> ${escaparHtml(titulo)}${detalle}</summary></details>`;
  }).join("");
}

function grupoHojaVista(fila) {
  const nombre = normalizar(fila.hoja || "");
  if (nombre.includes("btl")) return "btl";
  if (nombre.includes("mision")) return "mision";
  return "facturacion";
}

function fechaDiaMesVista(valor) {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) return "";
  return `${String(valor.getDate()).padStart(2, "0")}/${String(valor.getMonth() + 1).padStart(2, "0")}`;
}

function chipEstadoVista(estado) {
  const texto = normalizar(estado);
  if (!texto) return `<span class="badge badge--neutro">Sin estado</span>`;
  if (texto.includes("no") && texto.includes("canc")) return `<span class="badge badge--aviso">No cancelada</span>`;
  if (texto.includes("canc")) return `<span class="badge badge--exito">Cancelada</span>`;
  const visible = `${String(estado).charAt(0).toUpperCase()}${String(estado).slice(1).toLowerCase()}`;
  return `<span class="badge badge--neutro">${escaparHtml(visible)}</span>`;
}

function cuentaCortaVista(cuenta) {
  const partes = String(cuenta || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return partes[0] || "";
  return `${partes[0]} ${partes[1]}`;
}

function marcaControlHoja4(suma, control) {
  if (!control) return "";
  const diferencia = suma - control.total;
  const tolerancia = Number(obtenerParametros().carga?.toleranciaPesos);
  if (Math.abs(diferencia) < (Number.isFinite(tolerancia) ? tolerancia : 0)) {
    return `<span class="badge badge--exito" title="Cuadra con Hoja4 · $ ${escaparHtml(control.total.toLocaleString("es-CO"))}">✓</span>`;
  }
  return `<span class="badge badge--aviso" title="No cuadra con Hoja4: $ ${escaparHtml(Math.abs(diferencia).toLocaleString("es-CO"))}">!</span>`;
}

/**
 * Vista previa del archivo: aviso de una línea, resumen por persona, filtros y 10 filas.
 * Sin scroll propio. "Ver 10 más" y "Ver todas" amplían la misma tabla.
 */
function htmlVista(tipo, datos, ui, control) {
  if (!datos) return "";
  const filas = datos.filas || [];
  const esFactura = tipo === "facturacion";
  const campoPersona = esFactura ? "asesor" : "comercial";
  const utiles = filas.filter((fila) => !vacio(fila[campoPersona]));
  const excluidas = esFactura ? filas.filter((fila) => vacio(fila.asesor)) : [];
  const delMes = (fila) => (esFactura
    ? fila.elegida === true && fila.fecha instanceof Date && fechaEnMes(fila.fecha, datos.mes)
    : mesDelInforme(fila.mes, datos.mes) || fila.delMes === true);
  const resumen = new Map();
  utiles.forEach((fila) => {
    if (!delMes(fila)) return;
    const nombre = String(fila[campoPersona]).trim();
    const clave = normalizar(nombre);
    const actual = resumen.get(clave) || { nombre, facturas: 0, base: 0 };
    actual.facturas += 1;
    actual.base += Number(esFactura ? fila.base : fila.ingreso) || 0;
    resumen.set(clave, actual);
  });
  const personas = [...resumen.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const totalBase = personas.reduce((suma, fila) => suma + fila.base, 0);
  const totalFacturas = personas.reduce((suma, fila) => suma + fila.facturas, 0);
  const hojas = (datos.hojas || []).filter(Boolean);
  const nota = `Hojas: ${hojas.join(" + ") || "—"} · ${plural(utiles.length, "línea útil", "líneas útiles")}${esFactura ? ` · ${plural(excluidas.length, "fila de totales excluida", "filas de totales excluidas")} (sin asesor)` : ""}`;
  const listaExcluidas = excluidas.slice(0, 40).map((fila) => `<li>${escaparHtml(fila.hoja || "")} · fila ${escaparHtml(fila.numeroFila)} · ${monedaCelda(fila.base)}</li>`).join("");
  const colaExcluidas = excluidas.length > 40 ? `<li>y ${excluidas.length - 40} filas más</li>` : "";
  const opciones = [`<option value="">Todos</option>`, ...personas.map((fila) => `<option value="${escaparHtml(fila.nombre)}"${normalizar(fila.nombre) === normalizar(ui.persona) ? " selected" : ""}>${escaparHtml(fila.nombre)}</option>`)].join("");
  const grupos = esFactura ? ["facturacion", "mision", "btl"].filter((grupo) => utiles.some((fila) => grupoHojaVista(fila) === grupo)) : [];
  const etiquetasHoja = { facturacion: "Facturacion", mision: "Misión", btl: "BTL" };
  const segmentos = grupos.length
    ? `<div class="segmentos" role="tablist" aria-label="Hoja">${grupos.map((grupo) => `<button type="button" role="tab" data-vista-tipo="${tipo}" data-vista-hoja="${grupo}" class="${ui.hoja === grupo ? "activa" : ""}" aria-selected="${ui.hoja === grupo}">${etiquetasHoja[grupo]}</button>`).join("")}</div>`
    : "";
  const filtradas = utiles.filter((fila) => {
    if (esFactura && ui.hoja && grupoHojaVista(fila) !== ui.hoja) return false;
    if (ui.persona && normalizar(fila[campoPersona]) !== normalizar(ui.persona)) return false;
    if (ui.busca) {
      const busca = normalizar(ui.busca);
      const factura = normalizar(fila.factura);
      const cliente = normalizar(fila.cliente);
      const evento = normalizar(fila.evento);
      if (!factura.includes(busca) && !cliente.includes(busca) && !evento.includes(busca)) return false;
    }
    return true;
  });
  const limite = Math.min(filtradas.length, ui.limite || 10);
  const columnas = esFactura
    ? [
      { clave: "factura", titulo: "Factura", ancho: "11rem", clase: "col-factura" },
      { clave: "cliente", titulo: "Cliente", ancho: "", clase: "cliente-vista" },
      { clave: "asesor", titulo: "Asesor", ancho: "130px" },
      { clave: "cuenta", titulo: "Cuenta", ancho: "150px", corta: true },
      { clave: "fecha", titulo: "Fecha", ancho: "88px", fecha: true },
      { clave: "estado", titulo: "Estado", ancho: "104px", estado: true },
      { clave: "base", titulo: "Base", ancho: "7.5rem", dinero: true },
    ]
    : [
      { clave: "evento", titulo: "Evento", ancho: "110px" },
      { clave: "cliente", titulo: "Cliente", ancho: "", clase: "cliente-vista" },
      { clave: "comercial", titulo: "Comercial", ancho: "130px" },
      { clave: "producto", titulo: "Producto", ancho: "150px" },
      { clave: "mes", titulo: "Mes", ancho: "88px" },
      { clave: "delMes", titulo: "Del mes", ancho: "104px", delMes: true },
      { clave: "ingreso", titulo: "Ingreso", ancho: "7.5rem", dinero: true },
    ];
  const opcionales = esFactura
    ? [
      { clave: "grupo", titulo: "Grupo", ancho: "110px" },
      { clave: "subgrupo", titulo: "Subgrupo", ancho: "110px" },
      { clave: "fechaPago", titulo: "Fecha de pago", ancho: "110px", fecha: true },
    ]
    : [{ clave: "grupo", titulo: "Grupo", ancho: "110px" }, { clave: "detalle", titulo: "Detalle", ancho: "140px" }];
  const visibles = ui.extras ? columnas.concat(opcionales) : columnas;
  const colgroup = visibles.map((columna) => `<col${columna.ancho ? ` style="width:${columna.ancho}"` : ""}>`).join("");
  const cabeza = visibles.map((columna) => {
    const clase = [columna.dinero ? "num" : "", columna.clase || ""].filter(Boolean).join(" ");
    return `<th${clase ? ` class="${clase}"` : ""}>${columna.titulo}</th>`;
  }).join("");
  const cuerpo = filtradas.slice(0, limite).map((fila) => {
    const titulo = [fila.grupo, fila.subgrupo, fila.fechaPago instanceof Date ? fechaVisible(fila.fechaPago) : fila.detalle].filter(Boolean).join(" · ");
    const celdas = visibles.map((columna) => {
      if (columna.estado) return `<td class="col-estado">${chipEstadoVista(fila.estado)}</td>`;
      if (columna.delMes) {
        const enMes = delMes(fila);
        return `<td class="col-estado">${enMes ? `<span class="badge badge--exito">Del mes</span>` : `<span class="badge badge--neutro">Otro mes</span>`}</td>`;
      }
      if (columna.fecha) return `<td class="num">${fechaDiaMesVista(fila[columna.clave])}</td>`;
      if (columna.dinero) return `<td class="dinero">${monedaCelda(fila[columna.clave])}</td>`;
      const crudo = columna.corta ? cuentaCortaVista(fila[columna.clave]) : String(fila[columna.clave] ?? "");
      return `<td class="${columna.clase || "texto-recorte"}" title="${escaparHtml(fila[columna.clave] ?? "")}">${escaparHtml(crudo)}</td>`;
    }).join("");
    return `<tr title="${escaparHtml(titulo)}">${celdas}</tr>`;
  }).join("");
  const filasResumen = personas.map((fila) => `
    <tr>
      <td><button type="button" class="boton boton--texto" data-vista-tipo="${tipo}" data-vista-persona="${escaparHtml(fila.nombre)}">${escaparHtml(fila.nombre)}</button></td>
      <td class="num">${fila.facturas}</td>
      <td class="dinero">${monedaCelda(fila.base)}</td>
    </tr>`).join("");
  const mas = filtradas.length > limite
    ? `<div class="vista-mas"><button type="button" class="boton" data-vista-tipo="${tipo}" data-vista-mas="1">Ver 10 más</button><button type="button" class="boton" data-vista-tipo="${tipo}" data-vista-todas="1">Ver todas (${filtradas.length})</button></div>`
    : `<p class="nota-vista">${filtradas.length} ${filtradas.length === 1 ? "fila" : "filas"}</p>`;
  return `
    <p class="nota nota-vista-compacta"><span aria-hidden="true">ⓘ</span> ${escaparHtml(nota)}</p>
    ${excluidas.length ? `<details class="nota-excluidas"><summary>Ver cuáles</summary><ul>${listaExcluidas}${colaExcluidas}</ul></details>` : ""}
    <table class="tabla tabla-fija tabla-resumen-vista">
      <thead><tr><th>${esFactura ? "Asesor" : "Comercial"}</th><th>Facturas</th><th>${esFactura ? "Suma de BASE" : "Ingreso del mes"}</th></tr></thead>
      <tbody>${filasResumen || `<tr><td colspan="3">Sin filas con fecha del mes.</td></tr>`}</tbody>
      <tfoot><tr class="fila-total"><td>Total</td><td class="num">${totalFacturas}</td><td class="dinero">${monedaCelda(totalBase)} ${esFactura ? marcaControlHoja4(totalBase, control) : ""}</td></tr></tfoot>
    </table>
    <div class="vista-filtros">
      <label>${esFactura ? "Asesor" : "Comercial"}
        <select class="entrada" data-vista-tipo="${tipo}" data-vista-campo="persona" aria-label="${esFactura ? "Asesor" : "Comercial"}">${opciones}</select>
      </label>
      <label>Buscar factura o cliente
        <input class="entrada" type="search" data-vista-tipo="${tipo}" data-vista-campo="busca" value="${escaparHtml(ui.busca || "")}" placeholder="Buscar factura o cliente" aria-label="Buscar factura o cliente">
      </label>
      ${segmentos}
      <button type="button" class="boton" data-vista-tipo="${tipo}" data-vista-columnas="1" aria-expanded="${ui.extras ? "true" : "false"}">Columnas ▾</button>
    </div>
    <p class="nota-vista" data-filas-vista="${filtradas.length}">${limite} de ${filtradas.length} filas</p>
    <table class="tabla tabla-fija tabla-vista"><colgroup>${colgroup}</colgroup><thead><tr>${cabeza}</tr></thead><tbody>${cuerpo || `<tr><td colspan="${visibles.length}">Ninguna fila con ese filtro.</td></tr>`}</tbody></table>
    ${mas}`;
}

/** Avisos de una fuente, con su título. Se agrupan igual que antes. */
function bloqueAvisos(titulo, avisos) {
  return `<h3>${escaparHtml(titulo)}</h3>${avisos.length ? agruparAvisos(avisos) : "<p>No hay advertencias.</p>"}`;
}

/** Cuenta grupos y filas de advertencias para el resumen plegable. */
function contarAvisos(avisos) {
  const claves = new Set();
  let filas = 0;
  avisos.forEach((aviso) => {
    const coincidencia = String(aviso).match(/^Fila (\d+): (.+)$/);
    claves.add(coincidencia ? coincidencia[2].replace(/\.$/, "") : String(aviso));
    if (coincidencia) filas += 1;
  });
  return { grupos: claves.size, filas };
}

function leerLibro(buffer) {
  if (!window.XLSX) throw new Error("No cargó la librería de Excel. Revisa la conexión la primera vez.");
  const libro = window.XLSX.read(buffer, { type: "array", cellDates: true });
  const hojas = {};
  libro.SheetNames.forEach((nombre) => {
    hojas[nombre] = window.XLSX.utils.sheet_to_json(libro.Sheets[nombre], {
      header: 1,
      defval: null,
      raw: true,
    });
  });
  return hojas;
}

function leerArchivo(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(leerLibro(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsArrayBuffer(archivo);
  });
}

function zonaArchivo(tipo, titulo, conColumnas = true, ayuda = "") {
  const acciones = conColumnas
    ? `<button type="button" class="boton boton--pequeno" data-accion="cambiar" data-tipo="${tipo}">Cambiar</button>
          <button type="button" class="boton boton--pequeno" data-accion="columnas" data-tipo="${tipo}" aria-expanded="false">Columnas ▾</button>`
    : `<button type="button" class="boton boton--pequeno" data-accion="cambiar" data-tipo="${tipo}">Cambiar</button>`;
  const ayudaHtml = ayuda ? `<p class="zona-ayuda">${escaparHtml(ayuda)}</p>` : "";
  return `
    <div class="zona-archivo" data-zona="${tipo}" role="button" tabindex="0"
         aria-label="${escaparHtml(titulo)}: arrastra el Excel o pulsa para elegir un archivo">
      <input class="entrada-archivo sr-solo" type="file" id="archivo-${tipo}" accept=".xlsx,.xls" tabindex="-1">
      <div class="zona-archivo__cabeza">
        <strong class="zona-titulo">${escaparHtml(titulo)}</strong>
        <span class="zona-estado" data-estado="${tipo}"></span>
      </div>
      ${ayudaHtml}
      <div class="zona-archivo__vacio">
        <span class="zona-archivo__icono" aria-hidden="true">⬆</span>
        <p>Arrastra el Excel aquí o <span class="enlace">elige un archivo</span></p>
        <small>.xlsx o .xls · se lee solo en este computador</small>
      </div>
      <div class="zona-archivo__lista">
        <span class="zona-nombre"></span>
        <span class="zona-detalle" data-detalle="${tipo}"></span>
        <span class="zona-dato" data-dato="${tipo}"></span>
        <div class="zona-acciones">${acciones}</div>
      </div>
    </div>`;
}

/** Pinta la pestaña de carga y deja los datos listos para las fases siguientes. */
export function iniciarCarga(contenedor) {
  const estado = { facturacion: null, eventos: null };
  const nombresArchivo = { facturacion: "", eventos: "", btl: "" };
  const resumenArchivos = { facturacion: null, eventos: null, btl: null };
  const avisosPorTipo = { facturacion: [], eventos: [] };
  const vistas = { facturacion: null, eventos: null };
  const vistaUi = {
    facturacion: { limite: 10, persona: "", busca: "", hoja: "facturacion", extras: false },
    eventos: { limite: 10, persona: "", busca: "", hoja: "", extras: false },
  };

  function pintarVistaTipo(tipo) {
    const caja = contenedor.querySelector(`#vista-${tipo}`);
    if (!caja) return;
    caja.innerHTML = htmlVista(tipo, vistas[tipo], vistaUi[tipo], tipo === "facturacion" ? controlHoja4 : null);
  }

  contenedor.innerHTML = `
    <h2 class="titulo-pagina">Cargar datos</h2>
    <div class="cargar-archivos">
      <article class="tarjeta tarjeta-archivo">
        ${zonaArchivo("facturacion", "Producción", true, "Facturación del mes (hoja Facturación).")}
        <div class="zona-error" data-error="facturacion"></div>
        <p class="nota-union" id="nota-resumen" hidden></p>
      </article>
      <article class="tarjeta tarjeta-archivo">
        ${zonaArchivo("eventos", "Márgenes de eventos", true, "Informe de producción: hoja PRODUCTOS (márgenes) y, si viene, el detalle de Misión Internacional (ASESOR/BASE) para la política nueva.")}
        <div class="zona-error" data-error="eventos"></div>
        <p class="nota-union" id="nota-union" hidden></p>
      </article>
      <article class="tarjeta tarjeta-archivo">
        <h3>Encabezados de los comerciales (opcional)</h3>
        <p class="zona-ayuda">Nombre oficial, documento, cargo y referencia de mercado. Datos personales: se quedan en este computador.</p>
        <label class="boton" for="archivo-encabezados">Cargar encabezados (.json)</label>
        <input class="sr-solo" type="file" id="archivo-encabezados" accept=".json,application/json">
        <p class="nota-union" id="nota-encabezados"></p>
      </article>
    </div>
    ${htmlSeccionBtl()}
    <details class="opciones-avanzadas" id="opciones-avanzadas">
      <summary>Opciones avanzadas</summary>
      <article class="tarjeta tarjeta-archivo">
        ${zonaArchivo("btl", "Parámetros BTL (opcional)", false, "Hoja BTL_Eventos: utilidad presupuestada y condiciones. Preferible usar «Eventos BTL · 5.11.5» arriba.")}
        <p class="nota-union" id="nota-btl"></p>
      </article>
    </details>
    <div class="acciones-derecha">
      <button type="button" class="boton boton--primario" id="ir-resultados" disabled>Ver resultados del equipo →</button>
    </div>
    <section class="columnas-panel" id="panel-columnas" hidden>
      <div class="columnas-bloque" data-bloque="facturacion" hidden>
        <h3>Columnas de Facturación</h3>
        <label>Hoja <select class="entrada campo-editable" id="hoja-facturacion"></select></label>
        <p class="resumen-columnas" id="resumen-columnas-facturacion"></p>
        <div class="rejilla" id="mapa-facturacion"></div>
      </div>
      <div class="columnas-bloque" data-bloque="eventos" hidden>
        <h3>Columnas de Producción</h3>
        <p>Si cargas el informe de producción, elige la hoja PRODUCTOS. El evento es la primera columna llamada #.</p>
        <label>Hoja <select class="entrada campo-editable" id="hoja-eventos"></select></label>
        <p class="resumen-columnas" id="resumen-columnas-eventos"></p>
        <div class="rejilla" id="mapa-eventos"></div>
      </div>
    </section>
    <article class="tarjeta">
      <details id="vista-previa">
        <summary>Vista previa de las primeras líneas</summary>
        <div class="segmentos" role="tablist" aria-label="Vista previa por archivo">
          <button type="button" role="tab" data-vista-tab="facturacion" class="activa" aria-selected="true">Facturación</button>
          <button type="button" role="tab" data-vista-tab="eventos" aria-selected="false">Producción</button>
        </div>
        <div id="vista-facturacion"></div>
        <div id="vista-eventos" hidden></div>
      </details>
    </article>
    <article class="tarjeta">
      <details id="avisos-carga">
        <summary id="resumen-avisos">Advertencias</summary>
        <div id="avisos-facturacion"></div>
        <div id="avisos-eventos"></div>
      </details>
    </article>
  `;

  /** Pinta el estado, el detalle y el dato clave de una tarjeta de archivo. */
  function pintarTarjeta(tipo, { estado, detalle, dato }) {
    const zona = contenedor.querySelector(`[data-zona="${tipo}"]`);
    if (!zona) return;
    zona.querySelector(`[data-estado="${tipo}"]`).innerHTML = estado;
    zona.querySelector(`[data-detalle="${tipo}"]`).textContent = detalle;
    zona.querySelector(`[data-dato="${tipo}"]`).textContent = dato;
  }

  function pintarEstadoArchivos() {
    const facturas = resumenArchivos.facturacion;
    const produccion = resumenArchivos.eventos;
    const btl = resumenArchivos.btl;
    const union = produccion && facturacionCargada.length && facturaAEventoCargada.size
      ? resumenUnion(facturacionCargada, facturaAEventoCargada, document.querySelector("#mes-carga").value)
      : null;
    const cargado = (nombre) => `<span class="badge badge--exito" title="${escaparHtml(nombre || "")}">Cargado ✓</span>`;
    const falta = `<span class="badge badge--peligro">Falta</span>`;
    const aviso = `<span class="badge badge--aviso">Revisar</span>`;
    const opcional = `<span class="badge badge--neutro">Opcional</span>`;
    pintarTarjeta("facturacion", {
      estado: facturas ? cargado(nombresArchivo.facturacion) : falta,
      detalle: facturas ? nombresArchivo.facturacion : "",
      dato: facturas ? plural(facturas.facturas, "factura", "facturas") : "",
    });
    pintarTarjeta("eventos", {
      estado: !produccion ? falta : union && union.unidas !== union.total ? aviso : cargado(nombresArchivo.eventos),
      detalle: produccion ? nombresArchivo.eventos : "",
      dato: produccion
        ? union ? `${union.unidas}/${union.total} unidas` : plural(produccion.eventosMes, "evento", "eventos")
        : "",
    });
    pintarTarjeta("btl", {
      estado: btl ? cargado(nombresArchivo.btl) : opcional,
      detalle: btl ? (nombresArchivo.btl || "") : "",
      dato: btl ? plural(btl.eventos, "evento", "eventos") : "",
    });
    contenedor.querySelector("#ir-resultados").disabled = !(facturas && produccion);
  }

  /** Abre o cierra el panel de columnas de un archivo. */
  function abrirColumnas(tipo, abrir) {
    const bloque = contenedor.querySelector(`[data-bloque="${tipo}"]`);
    if (!bloque) return;
    bloque.hidden = !abrir;
    const algunoAbierto = contenedor.querySelector("[data-bloque]:not([hidden])") !== null;
    contenedor.querySelector("#panel-columnas").hidden = !algunoAbierto;
    contenedor.querySelector(`[data-accion="columnas"][data-tipo="${tipo}"]`)?.setAttribute("aria-expanded", String(abrir));
  }

  /** Pinta los avisos de ambos archivos dentro de una sola tarjeta plegable. */
  function pintarAvisos() {
    const todos = [...avisosPorTipo.facturacion, ...avisosPorTipo.eventos];
    const { grupos, filas } = contarAvisos(todos);
    contenedor.querySelector("#resumen-avisos").textContent = todos.length
      ? `Advertencias · ${plural(grupos, "grupo", "grupos")} · ${plural(filas, "fila", "filas")}`
      : "Advertencias · ninguna";
    contenedor.querySelector("#avisos-facturacion").innerHTML = avisosPorTipo.facturacion.length
      ? bloqueAvisos("Facturación", avisosPorTipo.facturacion)
      : "";
    contenedor.querySelector("#avisos-eventos").innerHTML = avisosPorTipo.eventos.length
      ? bloqueAvisos("Producción", avisosPorTipo.eventos)
      : "";
  }

  function encabezadosDe(tipo) {
    const libro = estado[tipo];
    if (!libro) return [];
    const nombreHoja = contenedor.querySelector(`#hoja-${tipo}`).value;
    const matriz = libro[nombreHoja] || [];
    return (matriz[0] || []).map((celda) => celda ?? "");
  }

  function pintarMapa(tipo) {
    const campos = tipo === "facturacion" ? CAMPOS_FACTURACION : CAMPOS_EVENTOS;
    const encabezados = encabezadosDe(tipo);
    contenedor.querySelector(`#mapa-${tipo}`).innerHTML = campos
      .map((campo) => `<label>${campo.titulo}<select class="entrada" data-mapa="${tipo}" data-campo="${campo.clave}"><option value="">No usar</option>${encabezados
        .map((encabezado, indice) => `<option value="${indice}">${textoCelda(encabezado) || `Columna ${indice + 1}`}</option>`)
        .join("")}</select></label>`)
      .join("");
    marcarSugeridos(contenedor, campos, encabezados, tipo);
    resumirColumnas(tipo);
  }

  function resumirColumnas(tipo) {
    const campos = tipo === "facturacion" ? CAMPOS_FACTURACION : CAMPOS_EVENTOS;
    const obligatorios = tipo === "facturacion" ? ["factura", "asesor", "base", "grupo", "cuenta"] : ["evento", "ingreso", "costo"];
    const selects = [...contenedor.querySelectorAll(`select[data-mapa="${tipo}"]`)];
    const asignadas = selects.filter((select) => select.value !== "").length;
    const faltan = obligatorios.filter((clave) => contenedor.querySelector(`select[data-mapa="${tipo}"][data-campo="${clave}"]`)?.value === "");
    const resumen = contenedor.querySelector(`#resumen-columnas-${tipo}`);
    if (!resumen) return;
    resumen.innerHTML = faltan.length
      ? `${asignadas} de ${campos.length} columnas asignadas <span class="badge badge--aviso">falta ${escaparHtml(faltan.join(", "))}</span>`
      : `${asignadas} de ${campos.length} columnas asignadas ✓`;
    const boton = contenedor.querySelector(`[data-accion="columnas"][data-tipo="${tipo}"]`);
    if (boton) boton.textContent = faltan.length ? "Columnas ▾" : "Columnas ✓ ▾";
    // Si falta una columna obligatoria, el panel se abre solo para que se vea.
    if (faltan.length && estado[tipo]) abrirColumnas(tipo, true);
  }

  function actualizar(tipo) {
    const libro = estado[tipo];
    if (!libro) return;
    const campos = tipo === "facturacion" ? CAMPOS_FACTURACION : CAMPOS_EVENTOS;
    const nombreHoja = contenedor.querySelector(`#hoja-${tipo}`).value;
    const matriz = libro[nombreHoja] || [];
    const mapa = mapaDesdeSelects(contenedor, tipo);
    let filas = filasDesdeHoja(matriz, campos, mapa, nombreHoja, true);
    const mes = document.querySelector("#mes-carga").value;
    const nombres = nombresConocidos();
    if (tipo === "facturacion") {
      // Misión y BTL se leen aparte: solo alimentan el recaudo de la política nueva.
      const extras = hojasComplementarias(libro, nombreHoja);
      extras.forEach((nombre) => {
        filas = filas.concat(filasDesdeHoja(libro[nombre], campos, mapaAutomatico(libro[nombre], campos), nombre, false));
      });
      facturacionCargada = filas;
      const avisos = advertenciasFacturacion(filas, mes, nombres, mapa.fecha !== "");
      avisosSugerencia.forEach((aviso) => {
        if (mapa[aviso.clave] === "") avisos.unshift(aviso.texto);
      });
      const sinAsesor = filas.filter((fila) => vacio(fila.asesor)).length;
      avisosPorTipo.facturacion = avisos;
      controlHoja4 = leerControlHoja4(libro);
      pintarControlHoja4(filas, mes);
      vistas.facturacion = { filas, mes, hojas: [nombreHoja, ...extras] };
      pintarVistaTipo("facturacion");
      resumenArchivos.facturacion = {
        archivo: nombresArchivo.facturacion,
        hojas: [nombreHoja, ...extras].join(" + "),
        lineas: filas.filter((fila) => !vacio(fila.asesor)).length,
        excluidas: sinAsesor,
        facturas: new Set(filas.filter((fila) => !vacio(fila.asesor)).map((fila) => fila.factura)).size,
      };
    } else if (pareceProduccion(filas)) {
      const armado = armarProduccion(filas, mes);
      eventosCargados = armado.eventos;
      facturaAEventoCargada = armado.facturaAEvento;
      produccionDetalleCargada = leerDetalleProduccion(libro);
      const avisos = advertenciasEventos(filas, nombres, mes);
      if (produccionDetalleCargada.length) {
        avisos.push(`Producción: ${produccionDetalleCargada.length} líneas de detalle (Misión Internacional u otras) leídas del mismo libro.`);
      }
      vistas.eventos = { filas, mes, hojas: [nombreHoja], detalle: produccionDetalleCargada };
      pintarVistaTipo("eventos");
      avisosPorTipo.eventos = avisos;
      resumenArchivos.eventos = {
        archivo: nombresArchivo.eventos,
        hoja: nombreHoja,
        lineas: armado.eventos.length,
        eventosMes: armado.eventos.filter((evento) => evento.delMes).length,
        detalle: produccionDetalleCargada.length,
      };
    } else {
      eventosCargados = filas.map((fila) => ({ ...fila, delMes: true }));
      facturaAEventoCargada = mapaDesdeFacturas(filas);
      produccionDetalleCargada = leerDetalleProduccion(libro);
      const avisos = advertenciasEventos(filas, nombres, mes);
      if (produccionDetalleCargada.length) {
        avisos.push(`Producción: ${produccionDetalleCargada.length} líneas de detalle (Misión Internacional u otras) leídas del mismo libro.`);
      }
      vistas.eventos = { filas, mes, hojas: [nombreHoja], detalle: produccionDetalleCargada };
      pintarVistaTipo("eventos");
      avisosPorTipo.eventos = avisos;
      resumenArchivos.eventos = {
        archivo: nombresArchivo.eventos,
        hoja: nombreHoja,
        lineas: filas.length,
        eventosMes: eventosCargados.length,
        detalle: produccionDetalleCargada.length,
      };
    }
    pintarEstadoArchivos();
    pintarNotaUnion();
    pintarAvisos();
    document.dispatchEvent(new Event("liquidacion-actualizada"));
  }

  function pintarControlHoja4(filas, mes) {
    const nota = contenedor.querySelector("#nota-resumen");
    if (!nota) return;
    if (!controlHoja4) {
      nota.hidden = true;
      nota.textContent = "";
      return;
    }
    const suma = sumaProduccionMes(filas, mes);
    const diferencia = suma - controlHoja4.total;
    nota.hidden = false;
    const tolerancia = Number(obtenerParametros().carga?.toleranciaPesos);
    if (Math.abs(diferencia) < (Number.isFinite(tolerancia) ? tolerancia : 0)) {
      nota.innerHTML = `<span class="badge badge--exito" title="Cuadra con Hoja4 · $ ${escaparHtml(controlHoja4.total.toLocaleString("es-CO"))}">✓</span>`;
      return;
    }
    const texto = Math.abs(diferencia).toLocaleString("es-CO");
    nota.innerHTML = `<span class="badge badge--aviso" title="No cuadra con Hoja4: $ ${escaparHtml(texto)}">!</span>`;
  }

  function pintarNotaUnion() {
    const nota = contenedor.querySelector("#nota-union");
    if (!nota) return;
    if (!facturaAEventoCargada.size) {
      nota.textContent = "";
      return;
    }
    if (!facturacionCargada.length) {
      nota.textContent = `Hay ${facturaAEventoCargada.size} facturas con evento. Carga la facturación para ver cuántas se unen.`;
      return;
    }
    const mes = document.querySelector("#mes-carga")?.value;
    const union = resumenUnion(facturacionCargada, facturaAEventoCargada, mes);
    nota.textContent = `Se unieron ${union.unidas} de ${union.total} facturas del mes.`;
  }

  function marcarZona(tipo, nombre) {
    const zona = contenedor.querySelector(`[data-zona="${tipo}"]`);
    if (!zona) return;
    zona.classList.add("zona-archivo--lista");
    // Con archivo cargado la zona no es un botón: los botones "Cambiar" y "Columnas" hacen su trabajo.
    zona.removeAttribute("role");
    zona.removeAttribute("tabindex");
    const etiqueta = zona.querySelector(".zona-nombre");
    etiqueta.textContent = nombre;
    etiqueta.title = nombre;
  }

  function mostrarCargando(tipo, texto) {
    ocultarCargando(tipo);
    const zona = contenedor.querySelector(`[data-zona="${tipo}"]`);
    zona?.insertAdjacentHTML("beforebegin", `<p class="cargando" data-cargando="${tipo}">${escaparHtml(texto)}</p>`);
    const boton = contenedor.querySelector("#ir-resultados");
    if (boton) boton.disabled = true;
  }

  function ocultarCargando(tipo) {
    contenedor.querySelector(`[data-cargando="${tipo}"]`)?.remove();
  }

  function mostrarError(tipo, mensaje) {
    const caja = contenedor.querySelector(`[data-error="${tipo}"]`);
    if (!caja) return;
    caja.innerHTML = `<div class="estado-error"><p>${escaparHtml(mensaje)}</p><button type="button" class="boton" data-elegir="${tipo}">Elegir otro archivo</button></div>`;
  }

  async function alElegirArchivo(tipo, archivo) {
    nombresArchivo[tipo] = archivo.name;
    contenedor.querySelector(`[data-error="${tipo}"]`)?.replaceChildren();
    marcarZona(tipo, archivo.name);
    mostrarCargando(tipo, tipo === "facturacion" ? "Leyendo la facturación…" : "Leyendo hoja PRODUCTOS…");
    let libro;
    try {
      libro = await leerArchivo(archivo);
    } catch (error) {
      ocultarCargando(tipo);
      mostrarError(tipo, error?.message || "No se pudo leer el archivo.");
      return;
    }
    if (tipo === "facturacion" && !Object.keys(libro).some((nombre) => normalizar(nombre).startsWith("facturacion"))) {
      ocultarCargando(tipo);
      mostrarError(tipo, `Este archivo no tiene la hoja Facturación. Hojas encontradas: ${Object.keys(libro).join(", ")}.`);
      return;
    }
    estado[tipo] = libro;
    if (tipo === "eventos") {
      document.dispatchEvent(new Event("eventos-reemplazados"));
      tomarBtlEventos(libro, false, archivo.name);
    }
    const selectHoja = contenedor.querySelector(`#hoja-${tipo}`);
    selectHoja.innerHTML = Object.keys(libro)
      .map((nombre) => `<option value="${escaparHtml(nombre)}">${escaparHtml(nombre)}</option>`)
      .join("");
    const preferida = tipo === "facturacion"
      ? Object.keys(libro).find((nombre) => normalizar(nombre).startsWith("facturacion"))
      : Object.keys(libro).find((nombre) => normalizar(nombre) === "productos" || normalizar(nombre).includes("producto"));
    if (preferida) selectHoja.value = preferida;
    pintarMapa(tipo);
    actualizar(tipo);
    ocultarCargando(tipo);
    if (tipo === "eventos" && facturacionCargada.length && facturaAEventoCargada.size) {
      const union = resumenUnion(facturacionCargada, facturaAEventoCargada, document.querySelector("#mes-carga")?.value);
      avisoBreve(`Producción cargada · ${union.unidas} de ${union.total} facturas unidas`);
    } else if (tipo === "eventos") {
      avisoBreve("Producción cargada");
    } else if (resumenArchivos.facturacion) {
      avisoBreve(`Facturación cargada · ${plural(resumenArchivos.facturacion.lineas, "línea", "líneas")}`);
    }
  }

  function tomarBtlEventos(libro, manual, nombreArchivo) {
    aplicarEsquemaAnterior(libro);
    const nota = contenedor.querySelector("#nota-btl");
    const nombre = nombreHojaBtl(libro);
    if (!nombre) {
      if (manual && nota) {
        nota.innerHTML = `<div class="estado-error"><p>Este archivo no tiene la hoja BTL_Eventos. Hojas encontradas: ${escaparHtml(Object.keys(libro).join(", "))}.</p><button type="button" class="boton" data-elegir="btl">Elegir otro archivo</button></div>`;
      }
      return;
    }
    if (!manual && btlEventosManual) return;
    btlEventosCargados = leerBtlEventos(libro[nombre]);
    const ingresos = leerIngresoEjecucion(libro[nombre]);
    if (ingresos) {
      const actuales = obtenerParametros().btl?.eventos || [];
      const porEvento = new Map(actuales.map((evento) => [textoClave(evento.evento), evento]));
      fijarEventosBtl(ingresos.map((evento) => {
        const previo = porEvento.get(textoClave(evento.evento));
        return {
          evento: evento.evento,
          comercial: evento.comercial || previo?.comercial || "",
          ingresoEjecucion: evento.ingresoEjecucion,
        };
      }));
    }
    if (manual) btlEventosManual = true;
    resumenArchivos.btl = { archivo: nombreArchivo || "parametros.xlsx", eventos: btlEventosCargados.size };
    if (manual) marcarZona("btl", nombreArchivo || "");
    pintarEstadoArchivos();
    if (nota) nota.textContent = btlEventosCargados.size ? `${btlEventosCargados.size} eventos ✓` : "";
    if (manual) avisoBreve(`Parámetros BTL cargados · ${plural(btlEventosCargados.size, "evento", "eventos")}`);
    document.dispatchEvent(new Event("liquidacion-actualizada"));
  }

  contenedor.querySelector("#archivo-facturacion").addEventListener("change", (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (archivo) alElegirArchivo("facturacion", archivo).catch((error) => {
      ocultarCargando("facturacion");
      mostrarError("facturacion", error.message);
    });
  });
  contenedor.querySelector("#archivo-eventos").addEventListener("change", (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (archivo) alElegirArchivo("eventos", archivo).catch((error) => {
      ocultarCargando("eventos");
      mostrarError("eventos", error.message);
    });
  });
  function pintarNotaEncabezados() {
    const nota = contenedor.querySelector("#nota-encabezados");
    const e = estadoDeEncabezados();
    if (!nota) return;
    if (!e.origen) {
      nota.innerHTML = `<strong class="aviso-encabezados">Falta cargar los encabezados.</strong> Use «Cargar encabezados (.json)» con el archivo encabezados_comerciales.json. ${empaquetado() ? "Sin él no aparece el equipo (0 comerciales): este archivo no trae nombres, salarios ni metas." : "Sin él, los Excel salen sin nombre oficial, documento ni cargo."}`;
      return;
    }
    nota.innerHTML = `Encabezados de ${e.aplicados} personas (comerciales y director) (${escaparHtml(e.origen)}).` + (e.avisos.length ? `<br>${e.avisos.map(escaparHtml).join("<br>")}` : "");
  }
  pintarNotaEncabezados();
  iniciarSeccionBtl(contenedor, { eventosProduccion: obtenerEventosProduccion });
  document.addEventListener("liquidacion-actualizada", pintarNotaEncabezados);
  contenedor.querySelector("#archivo-encabezados").addEventListener("change", (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (!archivo) return;
    cargarEncabezadosDeArchivo(archivo)
      .then((e) => avisoBreve(`Encabezados cargados · ${plural(e.aplicados, "comercial", "comerciales")}`))
      .catch((error) => { const nota = contenedor.querySelector("#nota-encabezados"); if (nota) nota.textContent = error.message; });
  });
  contenedor.querySelector("#archivo-btl").addEventListener("change", (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (!archivo) return;
    nombresArchivo.btl = archivo.name;
    mostrarCargando("btl", "Leyendo parametros.xlsx…");
    leerArchivo(archivo).then((libro) => tomarBtlEventos(libro, true, archivo.name)).catch((error) => {
      const nota = contenedor.querySelector("#nota-btl");
      if (nota) nota.innerHTML = `<div class="estado-error"><p>${escaparHtml(error.message)}</p><button type="button" class="boton" data-elegir="btl">Elegir otro archivo</button></div>`;
    }).finally(() => ocultarCargando("btl"));
  });
  function aplicarFiltroVista(control) {
    const tipo = control.dataset.vistaTipo;
    const ui = vistaUi[tipo];
    if (!ui) return;
    ui[control.dataset.vistaCampo] = control.value;
    ui.limite = 10;
    const inicio = control.selectionStart;
    pintarVistaTipo(tipo);
    const nuevo = contenedor.querySelector(`#vista-${tipo} [data-vista-campo="${control.dataset.vistaCampo}"]`);
    if (nuevo) {
      nuevo.focus();
      if (typeof inicio === "number" && nuevo.setSelectionRange) nuevo.setSelectionRange(inicio, inicio);
    }
  }

  contenedor.addEventListener("change", (evento) => {
    if (evento.target.dataset?.vistaCampo) {
      if (evento.target.dataset.vistaCampo === "busca") return;
      aplicarFiltroVista(evento.target);
      return;
    }
    const id = evento.target.id || "";
    if (id === "hoja-facturacion") pintarMapa("facturacion");
    if (id === "hoja-facturacion" || evento.target.dataset.mapa === "facturacion") {
      actualizar("facturacion");
    }
    if (id === "hoja-eventos") pintarMapa("eventos");
    if (id === "hoja-eventos" || evento.target.dataset.mapa === "eventos") {
      actualizar("eventos");
    }
    if (evento.target.dataset.mapa) resumirColumnas(evento.target.dataset.mapa);
  });
  contenedor.addEventListener("input", (evento) => {
    if (evento.target.dataset?.vistaCampo === "busca") aplicarFiltroVista(evento.target);
  });
  document.addEventListener("change", (evento) => {
    if (evento.target?.id !== "mes-carga") return;
    if (estado.facturacion) actualizar("facturacion");
    if (estado.eventos) actualizar("eventos");
  });
  contenedor.addEventListener("click", (evento) => {
    const tipoVista = evento.target.closest("[data-vista-tipo]")?.dataset.vistaTipo;
    const uiVista = tipoVista ? vistaUi[tipoVista] : null;
    if (uiVista && evento.target.closest("[data-vista-persona]")) {
      uiVista.persona = evento.target.closest("[data-vista-persona]").dataset.vistaPersona || "";
      uiVista.limite = 10;
      pintarVistaTipo(tipoVista);
      return;
    }
    if (uiVista && evento.target.closest("[data-vista-hoja]")) {
      uiVista.hoja = evento.target.closest("[data-vista-hoja]").dataset.vistaHoja || "";
      uiVista.limite = 10;
      pintarVistaTipo(tipoVista);
      return;
    }
    if (uiVista && evento.target.closest("[data-vista-columnas]")) {
      uiVista.extras = !uiVista.extras;
      pintarVistaTipo(tipoVista);
      return;
    }
    if (uiVista && evento.target.closest("[data-vista-mas]")) {
      uiVista.limite += 10;
      pintarVistaTipo(tipoVista);
      return;
    }
    if (uiVista && evento.target.closest("[data-vista-todas]")) {
      uiVista.limite = Number.MAX_SAFE_INTEGER;
      pintarVistaTipo(tipoVista);
      return;
    }
    const pestana = evento.target.closest("[data-vista-tab]");
    if (pestana) {
      const tipo = pestana.dataset.vistaTab;
      contenedor.querySelectorAll("[data-vista-tab]").forEach((boton) => {
        const activa = boton.dataset.vistaTab === tipo;
        boton.classList.toggle("activa", activa);
        boton.setAttribute("aria-selected", String(activa));
      });
      contenedor.querySelector("#vista-facturacion").hidden = tipo !== "facturacion";
      contenedor.querySelector("#vista-eventos").hidden = tipo !== "eventos";
      return;
    }
    const accion = evento.target.closest("[data-accion]");
    if (accion) {
      const tipo = accion.dataset.tipo;
      if (accion.dataset.accion === "cambiar") contenedor.querySelector(`#archivo-${tipo}`)?.click();
      if (accion.dataset.accion === "columnas") {
        const bloque = contenedor.querySelector(`[data-bloque="${tipo}"]`);
        abrirColumnas(tipo, bloque ? bloque.hidden : true);
      }
      return;
    }
    const boton = evento.target.closest("[data-elegir]");
    if (!boton) return;
    contenedor.querySelector(`#archivo-${boton.dataset.elegir}`)?.click();
  });

  contenedor.querySelectorAll(".zona-archivo").forEach((zona) => {
    const input = zona.querySelector('input[type="file"]');
    const abrir = () => input.click();
    const cargada = () => zona.classList.contains("zona-archivo--lista");
    zona.addEventListener("click", (evento) => {
      if (evento.target === input || cargada()) return;
      abrir();
    });
    zona.addEventListener("keydown", (evento) => {
      if (cargada()) return;
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        abrir();
      }
    });
    zona.addEventListener("dragenter", (evento) => {
      evento.preventDefault();
      zona.classList.add("zona-archivo--sobre");
    });
    zona.addEventListener("dragover", (evento) => {
      evento.preventDefault();
      zona.classList.add("zona-archivo--sobre");
    });
    zona.addEventListener("dragleave", () => zona.classList.remove("zona-archivo--sobre"));
    zona.addEventListener("drop", (evento) => {
      evento.preventDefault();
      zona.classList.remove("zona-archivo--sobre");
      const archivo = evento.dataTransfer?.files?.[0];
      if (!archivo) return;
      const tipo = zona.dataset.zona;
      if (tipo === "btl") {
        nombresArchivo.btl = archivo.name;
        mostrarCargando("btl", "Leyendo parametros.xlsx…");
        leerArchivo(archivo).then((libro) => tomarBtlEventos(libro, true, archivo.name)).catch((error) => {
          const nota = contenedor.querySelector("#nota-btl");
          if (nota) nota.innerHTML = `<div class="estado-error"><p>${escaparHtml(error.message)}</p><button type="button" class="boton" data-elegir="btl">Elegir otro archivo</button></div>`;
        }).finally(() => ocultarCargando("btl"));
        return;
      }
      alElegirArchivo(tipo, archivo).catch((error) => {
        ocultarCargando(tipo);
        mostrarError(tipo, error.message);
      });
    });
  });

  contenedor.querySelector("#ir-resultados").addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("mostrar-panel", { detail: "equipo" }));
  });
  pintarEstadoArchivos();
}
