/**
 * Pinta resultados, detalle, director y BTL.
 * Los números salen de calculos.js.
 */

import { encabezadoDe } from "./encabezados.js";
import { normalizar, obtenerControlHoja4, obtenerEventos, obtenerEventosProduccion, obtenerFacturacion, obtenerFacturaAEvento, obtenerBtlEventos, textoClave } from "./carga.js";
import { obtenerEventosBtlImportados } from "./btlArchivos.js";
import { comisionBtlAnterior, describirTramo, detalleBtlAnteriorEvento, liquidarMes } from "./calculos.js";
import { exportarJson, importarJson, obtenerParametros } from "./parametros.js";
import { exportarResultado } from "./exportar.js";
import { descargarExcelComercial, descargarTodosZip, elegirPlantilla } from "./exportarIndividual.js?v=20261123d";
import { descargarExcelDirector } from "./exportarDirector.js";
import { avisarCambiosSinGuardar, avisoBreve, escaparHtml, formatoMiles, nombreEsquema, nombreVisible, numeroPesos, plural, porcentaje as porcentajeTexto } from "./utilidades.js";

const condicionesEvento = new Map();
const utilidadEditada = new Map();

function condicionesVacias() {
  return {
    participacionComercial: false,
    participacionDirector: false,
    cierre: false,
    recaudo: false,
    satisfaccion: false,
  };
}

function claveEvento(evento, indice) {
  const id = evento?.evento;
  if (id === null || id === undefined || String(id).trim() === "") return `fila:${indice}`;
  return `evento:${String(id).trim()}`;
}

const ETIQUETAS_CONDICION_BTL = {
  participacionComercial: "Participación material del comercial",
  participacionDirector: "Participación material del director",
  cierre: "Cierre o certificación financiera",
  recaudo: "Meta de recaudo",
  satisfaccion: "Satisfacción del evento",
};

/** Checks de condiciones 5.11.5. rol: "comercial" | "director" | "todos". */
function checksCondicionesBtl(item, rol, score = null) {
  const cond = item?.evento?.condiciones || condicionesVacias();
  const claves = rol === "comercial"
    ? ["participacionComercial", "cierre", "recaudo", "satisfaccion"]
    : rol === "director"
      ? ["participacionDirector", "cierre", "recaudo", "satisfaccion"]
      : ["participacionComercial", "participacionDirector", "cierre", "recaudo", "satisfaccion"];
  const minimo = obtenerParametros().curva?.minimo;
  const scoreOk = score !== null && score !== undefined && Number.isFinite(Number(score)) && Number(score) >= Number(minimo);
  const scoreTexto = score === null || score === undefined || !Number.isFinite(Number(score))
    ? "Sin score"
    : (scoreOk ? "Sí" : "No") + ` (score ${decimal(Number(score), 2)})`;
  const casillas = claves.map((clave) => `
    <label><input type="checkbox" data-condicion="${clave}" data-indice="${item.indice}" ${cond[clave] ? "checked" : ""}> ${escaparHtml(ETIQUETAS_CONDICION_BTL[clave])}</label>`).join("");
  const lineaScore = rol === "todos"
    ? ""
    : `<p class="condiciones-btl__score">Score ≥ ${escaparHtml(minimo)}: <strong>${escaparHtml(scoreTexto)}</strong></p>`;
  return `
    <div class="condiciones-btl" data-btl-indice="${item.indice}">
      <p class="condiciones-btl__titulo">Condiciones para pagar (5.11.5)</p>
      ${casillas}
      ${lineaScore}
    </div>`;
}

function resumenCondicionesBtl(item, rol = "todos") {
  const cond = item?.evento?.condiciones || condicionesVacias();
  const claves = rol === "comercial"
    ? ["participacionComercial", "cierre", "recaudo", "satisfaccion"]
    : rol === "director"
      ? ["participacionDirector", "cierre", "recaudo", "satisfaccion"]
      : ["participacionComercial", "participacionDirector", "cierre", "recaudo", "satisfaccion"];
  const ok = claves.filter((clave) => cond[clave]).length;
  const faltan = claves.filter((clave) => !cond[clave]).map((clave) => {
    if (clave === "participacionComercial" || clave === "participacionDirector") return "participación";
    return clave;
  });
  const texto = `Condiciones: ${ok} de ${claves.length}${ok === claves.length ? " ✓" : ""}`;
  const badges = faltan.length ? faltan.map((f) => `<span class="badge badge--aviso">Falta: ${escaparHtml(f)}</span>`).join(" ") : "";
  return { texto, badges, ok, total: claves.length };
}

function conectarCondicionesBtl(raiz, liquidacion) {
  raiz.querySelectorAll("input[data-condicion]").forEach((casilla) => {
    casilla.addEventListener("change", () => {
      const indice = Number(casilla.dataset.indice);
      const item = liquidacion.btl[indice];
      const clave = claveEvento(item?.evento, indice);
      const actual = { ...(item.evento.condiciones || condicionesVacias()) };
      actual[casilla.dataset.condicion] = casilla.checked;
      condicionesEvento.set(clave, actual);
      pintarVistas();
    });
  });
}

document.addEventListener("eventos-reemplazados", () => {
  condicionesEvento.clear();
  utilidadEditada.clear();
});
let comercialVisible = "";
let incluirDetalleImpresion = false;
let ordenEquipo = { clave: "score", direccion: -1 };

const NOMBRE_METODO = {
  totales: "Totales del equipo",
  promedio: "Promedio simple",
  ponderado: "Promedio ponderado por meta",
};

function mesActual() {
  const transicion = obtenerParametros().transicion || {};
  return document.querySelector("#mes-carga")?.value || transicion.inicio || transicion.desde || "";
}

function mesTitulo(valor) {
  const nombres = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const [anio, mes] = String(valor || "").split("-");
  const nombre = nombres[Number(mes) - 1];
  if (!nombre) return String(valor || "");
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

function mesCorto(valor) {
  const cortos = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const mes = cortos[Number(String(valor || "").split("-")[1]) - 1];
  return mes || String(valor || "");
}

function moneda(valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "Pendiente";
  return `$ ${Math.round(valor).toLocaleString("es-CO")}`;
}

function decimal(valor, digitos = 2) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "Pendiente";
  return valor.toLocaleString("es-CO", { minimumFractionDigits: digitos, maximumFractionDigits: digitos });
}

function porcentaje(valor, decimales) {
  const digitos = Number.isInteger(decimales) && decimales >= 0
    ? decimales
    : (obtenerParametros().formato?.decimalesPorcentaje ?? 2);
  return porcentajeTexto(valor, digitos);
}

/** Factor de la curva: siempre con 2 decimales (ej. 85,33 %). */
function porcentajeFactor(valor) {
  return porcentaje(valor, 2);
}

function toleranciaPesos() {
  const valor = Number(obtenerParametros().carga?.toleranciaPesos);
  return Number.isFinite(valor) ? valor : 0;
}

function escalaScore() {
  const curva = obtenerParametros().curva || {};
  const anclas = [...(curva.anclas || [])].map((ancla) => Number(ancla.puntaje)).filter((punto) => Number.isFinite(punto)).sort((a, b) => a - b);
  const maximo = anclas.length ? anclas[anclas.length - 1] : Number(curva.minimo) || 0;
  const minimo = Number(curva.minimo);
  const medio = (minimo + maximo) / 2;
  const central = anclas.reduce((mejor, punto) => (Math.abs(punto - medio) < Math.abs(mejor - medio) ? punto : mejor), anclas[0]);
  const etiquetas = [0, minimo, central, maximo].filter((valor, indice, lista) => Number.isFinite(valor) && lista.indexOf(valor) === indice);
  const posicion = (valor) => `${maximo ? (Math.min(Math.max(Number(valor) || 0, 0), maximo) / maximo) * 100 : 0}%`;
  return { maximo, minimo, anclas, etiquetas, posicion };
}

function fechaDiaMes(valor) {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) return "";
  const dia = String(valor.getUTCDate()).padStart(2, "0");
  const mesNumero = String(valor.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mesNumero}`;
}

function marcaHoja4(valor, control) {
  if (control === null || control === undefined || valor === null || valor === undefined) return "";
  const diferencia = Number(valor) - Number(control);
  if (!Number.isFinite(diferencia)) return "";
  if (Math.abs(diferencia) < toleranciaPesos()) return `<span class="badge badge--exito">✓ cuadra con Hoja4</span>`;
  return `<span class="badge badge--aviso">No cuadra con Hoja4: ${moneda(diferencia)}</span>`;
}

function controlDelAsesor(resultado) {
  const control = obtenerControlHoja4();
  if (!control) return null;
  const claves = [normalizar(resultado.nombre), normalizar(resultado.comercial?.nombreFacturacion)];
  return control.porAsesor.find((fila) => claves.includes(normalizar(fila.asesor))) || null;
}

function grupoProduccion(fila) {
  const parametros = obtenerParametros();
  const codigo = String(fila.cuenta || "").trim().split(/\s/)[0];
  const prefijo = String(parametros.anticipos?.prefijoCuenta || "");
  const productos = parametros.productos || [];
  if (prefijo && codigo.startsWith(prefijo)) {
    return productos.find((item) => item.clave === "anticipos")?.nombre || parametros.anticipos?.etiqueta || "Anticipos";
  }
  const grupo = normalizar(fila.grupo);
  const producto = productos.find((item) => (item.marcas || []).some((marca) => grupo.includes(normalizar(marca))));
  return producto?.nombre || String(fila.grupo || "Otros");
}

function chipEstadoFactura(estado) {
  const texto = String(estado || "").trim();
  if (!texto) return `<span class="badge badge--neutro">Sin estado</span>`;
  const clave = normalizar(texto);
  if (clave.includes("no canc")) return `<span class="badge badge--aviso">No cancelada</span>`;
  if (clave.includes("cancel")) return `<span class="badge badge--exito">Cancelada</span>`;
  return `<span class="badge badge--neutro">${escaparHtml(texto)}</span>`;
}

function cuentaCorta(cuenta) {
  const partes = String(cuenta || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "";
  return partes.length > 1 ? `${partes[0]} ${partes[1]}` : partes[0];
}

function textoComisionAnterior(item) {
  if (!item.comercial?.tieneEsquemaAnterior) return "No tiene";
  return item.pagoAnterior === null ? "Pendiente" : moneda(item.pagoAnterior);
}

/** La liquidación tal como la muestra la app (eventos con utilidad y condiciones). Sirve para exportar y para pruebas. */
export function liquidacionVista() {
  return armar();
}

function armar() {
  const hoja = obtenerBtlEventos();
  const eventos = obtenerEventos().map((evento, indice) => {
    const clave = textoClave(evento.evento);
    const deHoja = hoja.get(clave);
    const guardadas = condicionesEvento.get(claveEvento(evento, indice));
    const editada = utilidadEditada.has(clave);
    return {
      ...evento,
      // v18: si el evento viene de su archivo (o a mano), manda su excedente neto presupuestado.
      utilidadPresupuestada: editada ? utilidadEditada.get(clave) : evento.origenBtl ? (evento.utilidadPresupuestada ?? deHoja?.utilidadPresupuestada ?? null) : (deHoja?.utilidadPresupuestada ?? evento.utilidadPresupuestada ?? null),
      condiciones: guardadas || { ...condicionesVacias(), ...(deHoja?.condiciones || {}) },
    };
  });
  return liquidarMes(obtenerFacturacion(), eventos, obtenerParametros(), mesActual(), obtenerFacturaAEvento());
}

function barraScore(score) {
  const escala = escalaScore();
  const ancho = score === null || !escala.maximo ? 0 : Math.min(score, escala.maximo) / escala.maximo * 100;
  const anclas = escala.anclas
    .map((punto) => `<span class="gauge-ancla" style="left:${escala.posicion(punto)}" title="${punto}"></span>`)
    .join("");
  return `<div class="gauge" title="Anclas ${escala.anclas.join(", ")}"><div class="gauge-llena" style="width:${ancho}%"></div>${anclas}</div>`;
}

function listaAvisos(avisos) {
  if (!avisos || !avisos.length) return "";
  return `<ul class="advertencias lista-avisos">${avisos.map((aviso) => `<li>${escaparHtml(aviso)}</li>`).join("")}</ul>`;
}

function avisosAgrupados(avisos) {
  const lista = avisos || [];
  const sinFecha = lista.filter((aviso) => aviso.includes("no tiene fecha"));
  const otros = lista.filter((aviso) => !aviso.includes("no tiene fecha"));
  const grupo = sinFecha.length
    ? `<details><summary><span class="badge badge--aviso">${escaparHtml(plural(sinFecha.length, "factura", "facturas"))} sin fecha</span></summary>${listaAvisos(sinFecha)}</details>`
    : "";
  return grupo + listaAvisos(otros);
}

function entero(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "";
  return Math.round(Number(valor)).toLocaleString("es-CO");
}

function sumaNumeros(lista, leer) {
  let total = 0;
  let alguno = false;
  lista.forEach((item) => {
    const valor = leer(item);
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return;
    total += Number(valor);
    alguno = true;
  });
  return alguno ? total : null;
}

function compararEquipo(a, b) {
  const leer = (item) => {
    if (ordenEquipo.clave === "nombre") return item.nombre || "";
    if (ordenEquipo.clave === "nueva") return item.pagoNuevo;
    if (ordenEquipo.clave === "anterior") return item.pagoAnterior;
    if (ordenEquipo.clave === "metaAnt") return item.anteriorTramos?.meta;
    if (ordenEquipo.clave === "prodAnt") return item.anteriorTramos?.produccion;
    if (ordenEquipo.clave === "cumpAnt") return item.anteriorTramos?.cumplimiento;
    if (ordenEquipo.clave === "tasaAnt") return item.anteriorTramos?.tasa;
    if (ordenEquipo.clave === "paga") return item.pagoAjustado ?? item.transicion.pagada;
    return item[ordenEquipo.clave];
  };
  const va = leer(a);
  const vb = leer(b);
  if (typeof va === "string" || typeof vb === "string") return String(va).localeCompare(String(vb), "es") * ordenEquipo.direccion;
  return ((Number(va) || 0) - (Number(vb) || 0)) * ordenEquipo.direccion;
}

function filaIndicador(nombre, puntos, extra, digitos = 2) {
  return `<tr><td>${escaparHtml(nombre)}</td><td>${puntos === null ? "Pendiente" : decimal(puntos, digitos)}</td><td>${escaparHtml(extra || "")}</td></tr>`;
}

function fechaCorta(valor) {
  if (!(valor instanceof Date)) return "";
  return valor.toLocaleDateString("es-CO");
}

function tablaHtml(cabezas, cuerpo, larga = false) {
  const columnas = cabezas.map((texto) => `<th>${texto}</th>`).join("");
  const tabla = `<table class="tabla"><thead><tr>${columnas}</tr></thead><tbody>${cuerpo}</tbody></table>`;
  return larga ? `<div class="tabla-scroll">${tabla}</div>` : tabla;
}

function distintivo(valor, tipo) {
  if (tipo === "no-aplica") return `<span class="badge badge--neutro">No aplica</span>`;
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return `<span class="badge badge--neutro">Pendiente</span>`;
  const bajo = obtenerParametros().curva.minimo / 100;
  let clase = "badge--exito";
  if (valor < bajo) clase = "badge--peligro";
  else if (valor < 1) clase = "badge--aviso";
  return `<span class="badge ${clase}">${porcentaje(valor)}</span>`;
}

function barraCumplimiento(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "";
  const puntos = Math.max(0, Number(valor) * 100);
  const bajo = obtenerParametros().curva.minimo;
  let tono = "peligro";
  if (puntos >= 100) tono = "exito";
  else if (puntos >= bajo) tono = "aviso";
  return `<span class="barra barra--${tono}" style="--pct:${puntos}"><span class="barra__relleno"></span><i class="barra__marca"></i></span>`;
}

function claseBanda(item) {
  const texto = item?.banda || "";
  if (texto.startsWith("No aplica") || item?.margen === null || item?.margen === undefined) return "badge--neutro";
  const reglas = obtenerParametros().margen;
  if (item.margen < reglas.umbralBajo) return "badge--peligro";
  if (item.margen <= reglas.umbralAlto) return "badge--aviso";
  return "badge--exito";
}

function dineroFirmado(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "Pendiente";
  if (valor < 0) return `− ${moneda(Math.abs(valor))}`;
  return moneda(valor);
}

function cifrasPersona(comercial) {
  const parametros = obtenerParametros();
  const imr = comercial.basico === null || comercial.oportunidad === null ? null : comercial.basico + comercial.oportunidad;
  const maximo = imr === null ? null : comercial.basico + parametros.topeIndicador * comercial.oportunidad;
  return { imr, maximo };
}

function chip(etiqueta, valor) {
  return `<div class="chip"><span>${escaparHtml(etiqueta)}</span><strong>${valor}</strong></div>`;
}

/** v21: las fórmulas no se muestran de entrada; van en un desplegable «Ver fórmula», cerrado por defecto (abierto solo al imprimir). */
function verFormula(textos, abierto = false) {
  const lista = (Array.isArray(textos) ? textos : [textos]).filter(Boolean);
  if (!lista.length) return "";
  return `<details class="ver-formula"${abierto ? " open" : ""}><summary>Ver fórmula</summary>${lista.map((texto) => `<p class="formula">${texto}</p>`).join("")}</details>`;
}

function fichaCurva(resultado) {
  const curva = obtenerParametros().curva;
  const anclas = [...curva.anclas].sort((a, b) => a.puntaje - b.puntaje);
  const score = resultado.score;
  const menor = score !== null && score < curva.minimo;
  let filas = `<tr class="${menor ? "fila-aplica fila-peligro" : ""}"><td>Menor a ${escaparHtml(curva.minimo)} puntos</td><td>0 %</td></tr>`;
  anclas.forEach((ancla, indice) => {
    const siguiente = anclas[indice + 1];
    const aplica = score !== null && score >= ancla.puntaje && (!siguiente || score < siguiente.puntaje);
    filas += `<tr class="${aplica ? "fila-aplica" : ""}"><td>${escaparHtml(ancla.puntaje)}</td><td>${porcentaje(ancla.factor)}</td></tr>`;
  });
  return tablaHtml(["Puntaje", "Factor"], filas);
}

function recuadrosPago(pagoNuevo, pagoAnterior, esquema, diferencia) {
  const transicion = obtenerParametros().transicion || {};
  const caja = (titulo, valor, paga) => `
    <div class="recuadro-pago${paga ? " paga" : ""}">
      <h3>${titulo}${paga ? ' <span class="badge badge--paga">Paga</span>' : ""}</h3>
      <p>${valor}</p>
    </div>`;
  const clase = diferencia === null ? "" : diferencia < 0 ? "diferencia--negativa" : "diferencia--positiva";
  return `
    <div class="comparativo-esquemas">
      ${caja("Política nueva", moneda(pagoNuevo), esquema === "nueva")}
      ${caja("Esquema anterior", pagoAnterior === null ? "Pendiente" : moneda(pagoAnterior), esquema === "anterior")}
    </div>
    <p class="diferencia ${clase}">Diferencia (nueva − anterior) <strong>${dineroFirmado(diferencia)}</strong></p>
    <p>Transición ${escaparHtml(mesCorto(transicion.desde))}–${escaparHtml(mesCorto(transicion.hasta))}: se paga el mayor de los dos.</p>`;
}

function tablaFacturasProduccion(lineas) {
  const grupos = new Map();
  lineas.forEach((fila) => {
    const nombre = grupoProduccion(fila);
    if (!grupos.has(nombre)) grupos.set(nombre, []);
    grupos.get(nombre).push(fila);
  });
  const orden = (obtenerParametros().productos || []).map((item) => item.nombre);
  const nombres = [...grupos.keys()].sort((a, b) => {
    const ia = orden.indexOf(a);
    const ib = orden.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  let cuerpo = "";
  nombres.forEach((nombre) => {
    const filas = grupos.get(nombre);
    const subtotal = filas.reduce((suma, fila) => suma + (Number(fila.base) || 0), 0);
    cuerpo += `<tr class="fila-grupo"><td colspan="5">${escaparHtml(nombre)}</td><td class="dinero">${moneda(subtotal)}</td></tr>`;
    filas.forEach((fila) => {
      const cliente = String(fila.cliente || "");
      const cuenta = String(fila.cuenta || "");
      cuerpo += `<tr class="fila-detalle-anterior" title="${escaparHtml([fila.grupo, fila.cliente, fila.cuenta].filter(Boolean).join(" · "))}">
        <td>${escaparHtml(fila.factura)}</td>
        <td class="texto-recorte" title="${escaparHtml(cliente)}">${escaparHtml(cliente)}</td>
        <td class="texto-recorte" title="${escaparHtml(cuenta)}">${escaparHtml(cuentaCorta(cuenta))}</td>
        <td class="num">${fechaDiaMes(fila.fecha)}</td>
        <td>${chipEstadoFactura(fila.estado)}</td>
        <td class="dinero">${moneda(fila.base)}</td>
      </tr>`;
    });
  });
  const total = lineas.reduce((suma, fila) => suma + (Number(fila.base) || 0), 0);
  cuerpo += `<tr class="fila-total"><td colspan="5">Producción</td><td class="dinero">${moneda(total)}</td></tr>`;
  return tablaHtml(["Factura", "Cliente", "Cuenta", "Fecha", "Estado", "Base"], cuerpo);
}

function notaBtlAparte(resultado) {
  if (!(resultado.btlMes || []).length) return "";
  if (resultado.ingresoBtlAnterior === null || resultado.btlAnterior === null) {
    return `<p>BTL política anterior, aparte: Pendiente (no entra a la transición)</p>`;
  }
  if (!resultado.ingresoBtlAnterior && !resultado.btlAnterior) return "";
  const tasa = resultado.tasaBtlAnterior;
  const formula = tasa === null || tasa === undefined
    ? `${moneda(resultado.ingresoBtlAnterior)}`
    : `${porcentaje(tasa)} × ${moneda(resultado.ingresoBtlAnterior)} = ${moneda(resultado.btlAnterior)}`;
  const aviso = resultado.btlAnteriorTasaSupuesta
    ? ` <span class="badge badge--aviso">Tasa supuesta: el archivo no trae % de comisión</span>`
    : "";
  return `<p>BTL política anterior, aparte: ${formula} (no entra a la transición)${aviso}</p>`;
}

function formulaBtlAnteriorHtml(resultado) {
  const detalle = resultado.btlAnteriorDetalle || [];
  if (!detalle.length) return "<p>Sin eventos BTL este mes.</p>";
  const origenBase = (valor) => (valor === "archivo" ? "archivo de márgenes" : valor === "produccion" ? "facturas BTL de Producción" : "sin dato");
  const origenTasa = (valor) => (valor === "factura" ? "% comisión de las facturas" : valor === "parametro" ? "Parámetros (tasaBtl)" : "sin dato");
  const filas = detalle.map((fila) => {
    if (fila.pendiente) {
      return `<tr><td>${escaparHtml(fila.evento || "")}</td><td colspan="4">Pendiente: sin archivo ni facturas BTL</td></tr>`;
    }
    return `<tr>
      <td>${escaparHtml(fila.evento || "")}</td>
      <td class="dinero">${moneda(fila.base)}<br><small>${escaparHtml(origenBase(fila.origenBase))}</small></td>
      <td class="num">${porcentaje(fila.tasa)}<br><small>${escaparHtml(origenTasa(fila.origenTasa))}${fila.tasaSupuesta ? " · supuesta" : ""}</small></td>
      <td class="num">${fila.participacion !== 1 ? porcentaje(fila.participacion) : "100 %"}</td>
      <td class="dinero">${moneda(fila.comision)}</td>
    </tr>`;
  }).join("");
  return `${tablaHtml(["Evento", "Base", "Tasa", "Reparto", "Comisión"], filas)}
    <p>Total BTL anterior: ${moneda(resultado.btlAnterior)} (informativo; no entra a la transición).</p>`;
}

function tablaAnteriorImpresion(filas) {
  return `<table class="tabla anterior-impresion"><tbody>${filas.map(([nombre, valor]) => `<tr><th>${nombre}</th><td class="dinero">${valor}</td></tr>`).join("")}</tbody></table>`;
}

/** Bloque de la política anterior: lo mismo que el Excel, por tramos. */
function bloquePoliticaAnterior(resultado) {
  const tramo = resultado.anteriorTramos;
  const lineas = tramo?.lineas || resultado.detalleAnterior || [];
  const control = controlDelAsesor(resultado);
  const reglas = obtenerParametros().anterior;
  const manual = tramo?.manual
    ? `<span class="badge badge--aviso">Producción manual</span> <span class="dinero">diferencia ${moneda((tramo.produccion ?? 0) - (tramo.produccionArchivo ?? 0))}</span>`
    : "";
  const fuente = `Fuente: Facturación (${lineas.length} ${lineas.length === 1 ? "factura" : "facturas"})`;
  if (!resultado.comercial?.tieneEsquemaAnterior) {
    return `<p>No tiene política anterior.</p>`;
  }
  if (!tramo || tramo.comision === null) {
    return `
      <p>${escaparHtml(fuente)}</p>
      <ul class="lista-concepto">
        <li><span>Comisión anterior</span><span class="dinero">Pendiente</span></li>
        <li><span>Meta mensual</span><span class="dinero">${tramo && tramo.meta > 0 ? moneda(tramo.meta) : "Pendiente"} <button type="button" class="boton boton--texto" data-ir="parametros">Editar en Parámetros</button></span></li>
      </ul>
      <p>Falta la meta mensual de la política anterior.</p>`;
  }
  const baseComision = tramo.produccionComision ?? tramo.produccionSinAnticipos ?? tramo.produccion;
  return `
    <p>${escaparHtml(fuente)} ${marcaHoja4(tramo.produccionArchivo, control?.base)}</p>
    ${tablaAnteriorImpresion([
      ["Comisión anterior", moneda(tramo.comision)],
      ["Meta mensual", moneda(tramo.meta)],
      ["Producción (con anticipos 27209)", moneda(tramo.produccion)],
      ["Cumplimiento", porcentaje(tramo.cumplimiento)],
      ["Tasa aplicada", porcentaje(tramo.tasa)],
      ["Base comisión (sin anticipos)", moneda(baseComision)],
      ["Base × tasa", moneda(tramo.comision)],
    ])}
    <ul class="lista-concepto anterior-pantalla">
      <li><span>Comisión anterior</span><span class="dinero kpi-numero">${moneda(tramo.comision)}</span></li>
      <li><span>Meta mensual</span><span class="dinero">${moneda(tramo.meta)} <button type="button" class="boton boton--texto" data-ir="parametros">✎</button></span></li>
      <li><span>Producción (cumplimiento)</span><span class="dinero">${moneda(tramo.produccion)} ${manual}</span></li>
      <li><span>Cumplimiento</span><span class="dinero">${porcentaje(tramo.cumplimiento)}</span></li>
      <li><span>Tasa aplicada</span><span class="dinero">${porcentaje(tramo.tasa)} <span class="ayuda-campo">tramo «${escaparHtml(describirTramo(tramo.cumplimiento, reglas))}»</span></span></li>
      <li><span>Base comisión (sin anticipos)</span><span class="dinero">${moneda(baseComision)}</span></li>
      <li><span>Base × tasa</span><span class="dinero">${moneda(tramo.comision)}</span></li>
    </ul>
    <details class="no-imprimir">
      <summary>Ver tramos</summary>
      <table class="tabla tabla-fija tabla-tramos">${tablaTramosHtml(reglas, tramo.tasa)}</table>
    </details>
    <details class="no-imprimir">
      <summary>Ver las ${lineas.length} facturas de la producción (${moneda(tramo.produccionArchivo)})</summary>
      ${tablaFacturasProduccion(lineas)}
    </details>
    ${notaBtlAparte(resultado)}`;
}

function tablaTramosHtml(reglas, tasaAplicada) {
  const cuerpo = (reglas?.tramos || []).map((tramo) => {
    const aplica = tasaAplicada !== null && tramo.tasa === tasaAplicada;
    const hasta = tramo.hasta === null ? "en adelante" : porcentaje(tramo.hasta);
    return `<tr class="${aplica ? "fila-aplica" : ""}"><td>${hasta}</td><td class="num">${porcentaje(tramo.tasa)}</td></tr>`;
  }).join("");
  return `<thead><tr><th>Hasta</th><th>Tasa</th></tr></thead><tbody>${cuerpo}</tbody>`;
}

function fichaAnterior(resultado) {
  return `
    <article class="tarjeta">
      <h2>1. Política anterior</h2>
      ${bloquePoliticaAnterior(resultado)}
    </article>`;
}

function bloqueProducto(titulo, cuerpo, atenuado) {
  return `<section class="sub-bloque${atenuado ? " atenuado sin-meta-impresion" : ""}"><h3>${escaparHtml(titulo)}</h3>${atenuado ? "<p>Sin meta este mes</p>" : ""}${cuerpo}</section>`;
}

function fichaTransicion(resultado) {
  const diferencia = resultado.diferencia;
  const clase = diferencia === null ? "" : diferencia < 0 ? "diferencia--negativa" : "diferencia--positiva";
  const basico = resultado.comercial.basico;
  const conTransicion = basico === null || resultado.transicion.pagada === null ? null : basico + resultado.transicion.pagada;
  const paga = resultado.transicion.esquema === "nueva" || resultado.transicion.esquema === "anterior";
  return `
    <article class="tarjeta">
      <h2>3. Comparativo y transición ${paga ? '<span class="badge badge--paga">Paga</span>' : ""}</h2>
      <ul class="lista-concepto">
        <li><span>Comisión anterior</span><span class="dinero">${moneda(resultado.pagoAnterior)}</span></li>
        <li><span>Política nueva, sin BTL</span><span class="dinero">${moneda(resultado.pagoNuevo)}</span></li>
        <li><span>Diferencia (nueva − anterior)</span><span class="dinero diferencia ${clase}">${dineroFirmado(diferencia)}</span></li>
        <li><span>Se paga</span><span>${resultado.transicion.esquema === "pendiente" ? "Pendiente" : `<span class="badge badge--paga">${escaparHtml(nombreEsquema(resultado.transicion.esquema))}</span>`} <strong class="dinero">${moneda(resultado.transicion.pagada)}</strong></span></li>
        <li><span>Básico contractual</span><span class="dinero">${moneda(basico)}</span></li>
        <li><span>Básico + transición</span><span class="dinero">${moneda(conTransicion)}</span></li>
      </ul>
    </article>`;
}

function parConcepto(nombre, valor) {
  return `<tr><th>${escaparHtml(nombre)}</th><td>${valor}</td></tr>`;
}

function faltaUtilidadPresupuestada(item) {
  const valor = item.evento?.utilidadPresupuestada;
  return valor === null || valor === undefined || valor === "" || Number.isNaN(Number(valor));
}

function gruposFacturas(resultado) {
  const orden = [
    "Edu/AT · política nueva",
    "Edu/AT · no recaudada en el mes",
    "Misión · valor fijo por factura",
    "Misión · esquema anterior",
    "BTL · se liquida en 5.11.5",
    "BTL · referencia (hoja Facturación)",
    "Solo esquema anterior",
  ];
  const grupos = new Map();
  (resultado.detalleFacturas || []).forEach((fila) => {
    const uso = fila.uso || "Solo esquema anterior";
    if (!grupos.has(uso)) grupos.set(uso, []);
    grupos.get(uso).push(fila);
  });
  const claves = [...orden.filter((uso) => grupos.has(uso)), ...[...grupos.keys()].filter((uso) => !orden.includes(uso))];
  return { grupos, claves };
}

function textoGrupo(uso, valor) {
  if (uso.startsWith("BTL") || uso === "Misión · esquema anterior") return "—";
  return moneda(valor);
}

function fichaFacturas(resultado) {
  const { grupos, claves } = gruposFacturas(resultado);
  const filaHtml = (fila) => `
    <tr>
      <td>${escaparHtml(fila.factura)}</td>
      <td>${escaparHtml(fila.origen || "")}</td>
      <td>${escaparHtml(fila.producto)}</td>
      <td>${escaparHtml(fila.cuenta)}</td>
      <td>${escaparHtml(fila.evento)}</td>
      <td class="dinero">${moneda(fila.base)}</td>
      <td>${escaparHtml(fila.estado)}</td>
      <td>${escaparHtml(fechaCorta(fila.fechaPago))}</td>
      <td>${fila.elegible ? "Sí" : "No"}</td>
      <td class="dinero">${moneda(fila.recaudo)}</td>
      <td class="num">${fila.factorAplicado === null || fila.factorAplicado === undefined ? "" : porcentaje(fila.factorAplicado)}</td>
      <td class="dinero">${moneda(fila.ventaReconocida)}</td>
    </tr>`;
  const cuerpo = claves.map((uso) => {
    const items = grupos.get(uso);
    const suma = (campo) => items.reduce((total, fila) => total + (Number(fila[campo]) || 0), 0);
    return `
      <tr class="fila-grupo"><th colspan="12">${escaparHtml(uso)}</th></tr>
      ${items.map(filaHtml).join("")}
      <tr class="fila-total"><td colspan="5">Subtotal · ${items.length}</td><td class="dinero">${moneda(suma("base"))}</td><td></td><td></td><td></td><td class="dinero">${textoGrupo(uso, suma("recaudo"))}</td><td></td><td class="dinero">${textoGrupo(uso, suma("ventaReconocida"))}</td></tr>`;
  }).join("");
  const totales = resultado.totalesFacturas || { base: 0, recaudo: 0, reconocida: 0 };
  const resumen = claves.map((uso) => {
    const items = grupos.get(uso);
    const base = items.reduce((total, fila) => total + (Number(fila.base) || 0), 0);
    const reconocida = items.reduce((total, fila) => total + (Number(fila.ventaReconocida) || 0), 0);
    return `<tr><td>${escaparHtml(uso)}</td><td class="num">${items.length}</td><td class="dinero">${moneda(base)}</td><td class="dinero">${textoGrupo(uso, reconocida)}</td></tr>`;
  }).join("");
  return `
    <article class="tarjeta">
      <h2>Facturas del mes</h2>
      <table class="tabla solo-impresion">
        <thead><tr><th>Uso</th><th>Facturas</th><th>Base</th><th>Venta reconocida</th></tr></thead>
        <tbody>${resumen}</tbody>
        <tfoot><tr class="fila-total"><td>Total sin BTL</td><td></td><td class="dinero">${moneda(totales.base)}</td><td class="dinero">${moneda(totales.reconocida)}</td></tr></tfoot>
      </table>
      <details open class="detalle-impresion">
        <summary>Facturas</summary>
        <div class="tabla-scroll">
          <table class="tabla tabla-fija">
            <thead><tr><th>Factura</th><th>Hoja</th><th>Producto</th><th>Cuenta</th><th>Evento</th><th>Base</th><th>Estado</th><th>Fecha de pago</th><th>Elegible</th><th>Recaudo</th><th>Factor aplicado</th><th>Venta reconocida</th></tr></thead>
            <tbody>${cuerpo}</tbody>
            <tfoot><tr class="fila-total"><td colspan="5">Total sin BTL</td><td class="dinero">${moneda(totales.base)}</td><td></td><td></td><td></td><td class="dinero">${moneda(totales.recaudo)}</td><td></td><td class="dinero">${moneda(totales.reconocida)}</td></tr></tfoot>
          </table>
        </div>
      </details>
    </article>`;
}

function fichaAvisos(resultado) {
  return `<article class="tarjeta aviso-caja"><details><summary>Avisos</summary>${avisosAgrupados(resultado.avisos) || "<p>No hay avisos.</p>"}</details></article>`;
}

function lineaCurva() {
  const curva = obtenerParametros().curva;
  const anclas = [...curva.anclas].sort((a, b) => a.puntaje - b.puntaje);
  const tramos = [`< ${curva.minimo} → 0 %`, ...anclas.map((ancla) => `${ancla.puntaje} → ${porcentaje(ancla.factor)}`)];
  return `<p class="linea-curva">Curva 5.8: ${tramos.map((texto) => escaparHtml(texto)).join(" · ")}</p>`;
}

function tablaIndicadoresImpresion(resultado) {
  const base = resultado.baseSocial;
  const ser = resultado.serfiscal || {};
  const dato = resultado.satisfaccion || {};
  const bloque = (titulo, pares) => `
    <section class="bloque-imp">
      <h2 class="bloque-imp__titulo">${titulo}</h2>
      <table class="tabla tabla-concepto"><tbody>${pares.map(([nombre, valor]) => parConcepto(nombre, valor)).join("")}</tbody></table>
    </section>`;
  return `
    <div class="tres-imp">
      ${bloque("5.5 Base social", [
        ["Base 30 sept", base?.cierre === undefined ? "Pendiente" : entero(resultado.comercial.baseSocialInicial)],
        ["Retiros", entero(resultado.comercial.retiros)],
        ["Ingresos", entero(resultado.comercial.ingresos)],
        ["Cierre", base?.cierre === null || base?.cierre === undefined ? "Pendiente" : entero(base.cierre)],
        ["Meta", base?.meta === null || base?.meta === undefined ? "Pendiente" : entero(base.meta)],
        ["Puntos", resultado.puntos.baseSocial === null ? "Pendiente" : decimal(resultado.puntos.baseSocial, 2)],
      ])}
      ${bloque("5.6 Innovación", [
        ["SERFISCAL", resultado.neutrales.serfiscal ? "Pendiente" : (ser.cumplimiento === null || ser.cumplimiento === undefined ? "Pendiente" : porcentaje(ser.cumplimiento))],
        ["Puntos SERFISCAL", `${decimal(resultado.puntos.serfiscal, 2)}${resultado.neutrales.serfiscal ? " (neutral)" : ""}`],
        ["Puntos innovación", `${decimal(resultado.puntos.innovacion, 2)}${resultado.neutrales.innovacion ? " (neutral)" : ""}`],
      ])}
      ${bloque("5.7 Satisfacción", [
        ["Obtenida", resultado.comercial.satisfaccion === null || resultado.comercial.satisfaccion === undefined ? "Pendiente" : escaparHtml(resultado.comercial.satisfaccion)],
        ["Cumplimiento", resultado.neutrales.satisfaccion ? "Pendiente" : (dato.cumplimiento === null || dato.cumplimiento === undefined ? "Pendiente" : porcentaje(dato.cumplimiento))],
        ["Puntos", `${decimal(resultado.puntos.satisfaccion, 2)}${resultado.neutrales.satisfaccion ? " (neutral)" : ""}`],
      ])}
    </div>`;
}

/** v23 · Curva 5.8 para impresión: tabla horizontal (puntaje / factor) con el tramo que aplica marcado. */
function curvaImpresion(resultado) {
  const curva = obtenerParametros().curva;
  const anclas = [...curva.anclas].sort((a, b) => a.puntaje - b.puntaje);
  const score = resultado.score;
  const celdas = [{ texto: `< ${curva.minimo}`, factor: 0, aplica: score !== null && score < curva.minimo }];
  anclas.forEach((ancla, indice) => {
    const siguiente = anclas[indice + 1];
    celdas.push({ texto: `${ancla.puntaje}`, factor: ancla.factor, aplica: score !== null && score >= ancla.puntaje && (!siguiente || score < siguiente.puntaje) });
  });
  const clase = (c) => (c.aplica ? ' class="curva-imp__aplica"' : "");
  return `
    <table class="tabla curva-imp" aria-label="Curva de pago 5.8">
      <tbody>
        <tr><th>Score desde</th>${celdas.map((c) => `<td${clase(c)}>${escaparHtml(c.texto)}</td>`).join("")}</tr>
        <tr><th>Factor de pago</th>${celdas.map((c) => `<td${clase(c)}>${porcentaje(c.factor)}</td>`).join("")}</tr>
      </tbody>
    </table>
    <p class="imp-nota">Score ${score === null ? "Pendiente" : decimal(score, 2)} → factor ${resultado.factor === null ? "Pendiente" : porcentajeFactor(resultado.factor)}. Comisión ganada · política nueva (sin BTL): <strong>${moneda(resultado.pagoNuevo)}</strong>.</p>`;
}

/** v23 · Tarjetas de pago para impresión (sin botones): política nueva, esquema anterior, diferencia y BTL si aplica. */
function tarjetasPagoImpresion(resultado) {
  const esquema = resultado.transicion.esquema;
  const tramo = resultado.anteriorTramos;
  const sinAnterior = resultado.comercial?.tieneEsquemaAnterior === false;
  const eventos = resultado.btlMes || [];
  const tarjeta = (titulo, monto, lineas, { paga = false, clase = "" } = {}) => `
    <div class="pago-imp${paga ? " pago-imp--paga" : ""}${clase ? ` ${clase}` : ""}">
      <p class="pago-imp__titulo">${escaparHtml(titulo)}${paga ? ' <span class="badge badge--paga">Paga</span>' : ""}</p>
      <p class="pago-imp__monto">${monto}</p>
      <ul class="pago-imp__lineas">${lineas.filter(Boolean).map(([a, b]) => `<li><span>${escaparHtml(a)}</span><span>${b}</span></li>`).join("")}</ul>
    </div>`;
  const basicoImp = resultado.comercial?.basico;
  const oportImp = resultado.comercial?.oportunidad;
  const totalMesImp = basicoImp === null || basicoImp === undefined || resultado.pagoNuevo === null
    ? null
    : basicoImp + resultado.pagoNuevo;
  const nueva = tarjeta("Política nueva", moneda(resultado.pagoNuevo), [
    ["Básico", moneda(basicoImp)],
    ["Oportunidad", moneda(oportImp)],
    ["Score", resultado.score === null ? "Pendiente" : decimal(resultado.score, 2)],
    ["Factor de pago", resultado.factor === null ? "Pendiente" : porcentajeFactor(resultado.factor)],
    ["Variable (oportunidad × factor)", moneda(resultado.pagoNuevo)],
    ["Total del mes (básico + variable)", moneda(totalMesImp)],
  ], { paga: esquema === "nueva" });
  const anterior = sinAnterior
    ? tarjeta("Esquema anterior", "No aplica", [["Motivo", "No se compara"]])
    : tarjeta("Esquema anterior", resultado.pagoAnterior === null ? "Pendiente" : moneda(resultado.pagoAnterior), [
      ["Producción (cumplimiento)", moneda(tramo?.produccion)],
      ["Base comisión (sin anticipos)", moneda(tramo?.produccionComision ?? tramo?.produccionSinAnticipos ?? tramo?.produccion)],
      ["Tasa aplicada", tramo?.tasa === null || tramo?.tasa === undefined ? "Pendiente" : porcentaje(tramo.tasa)],
    ], { paga: esquema === "anterior" });
  const claseDif = resultado.diferencia === null ? "" : resultado.diferencia < 0 ? "diferencia--negativa" : "diferencia--positiva";
  const diferencia = tarjeta("Diferencia (nueva − anterior)", sinAnterior ? "No aplica" : `<span class="diferencia ${claseDif}">${dineroFirmado(resultado.diferencia)}</span>`, [
    ["Se paga", esquema === "pendiente" ? "Pendiente" : escaparHtml(nombreEsquema(esquema))],
    ["Valor de la transición", moneda(resultado.transicion.pagada)],
  ]);
  let btl = "";
  if (eventos.length) {
    const pendiente = eventos.some(faltaUtilidadPresupuestada);
    btl = tarjeta("BTL 5.11.5", pendiente ? "Pendiente" : moneda(sumaNumeros(eventos, (item) => item.pagoComercial)), [
      ["Eventos", String(eventos.length)],
      ["Anterior (informativo)", moneda(resultado.btlAnterior)],
    ], { clase: "pago-imp--btl" });
  }
  return `<div class="pagos-imp pagos-imp--${eventos.length ? 4 : 3}">${nueva}${anterior}${diferencia}${btl}</div>`;
}

/** v23 · BTL de la ficha impresa: una fila por evento, sin casillas ni botones. */
function btlImpresion(resultado) {
  const eventos = resultado.btlMes || [];
  if (!eventos.length) return `<p class="imp-nota">Sin eventos BTL este mes.</p>`;
  const filas = eventos.map((item) => {
    const r = resumenCondicionesBtl(item, "comercial");
    const falta = faltaUtilidadPresupuestada(item);
    const decide = item.margenDecide === "neto" ? item.margenNeto : item.margenBruto;
    const anterior = btlAnteriorEvento(item, resultado.tasaBtlAnterior, true, resultado);
    return `<tr>
      <td>${escaparHtml(item.evento?.evento || "")}</td>
      <td class="dinero">${moneda(item.evento?.ingreso)}</td>
      <td class="dinero">${falta ? "Falta utilidad" : item.utilidad === undefined ? "Pendiente" : moneda(item.utilidad)}</td>
      <td class="num">${item.cumplimiento === undefined ? "Pendiente" : porcentaje(item.cumplimiento)}</td>
      <td class="num">${decide === undefined ? "Pendiente" : `${porcentaje(decide)} <small>${item.margenDecide === "neto" ? "neto" : "bruto"}</small>`}</td>
      <td class="num">${item.porcentajeComercial === null || item.porcentajeComercial === undefined ? "Pendiente" : porcentaje(item.porcentajeComercial)}</td>
      <td class="dinero">${moneda(anterior)}</td>
      <td class="dinero"><strong>${falta ? "Pendiente" : moneda(item.pagoComercial)}</strong>${item.motivoComercial ? `<br><small>${escaparHtml(item.motivoComercial)}</small>` : ""}</td>
      <td class="condiciones-imp">${escaparHtml(r.texto)}${r.badges ? ` ${r.badges}` : ""}</td>
    </tr>`;
  }).join("");
  return `
    <table class="tabla tabla-btl-imp">
      <thead><tr><th>Evento</th><th>Ingreso</th><th>Utilidad real</th><th>Cumpl.</th><th>Margen</th><th>% liquidador</th><th>Anterior <small>(informativo)</small></th><th>Comisión</th><th>Condiciones</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
}

/** v23 · Detalle de facturas para papel: agrupado por uso, columnas que caben en carta vertical. */
function detalleFacturasImpresion(resultado) {
  const { grupos, claves } = gruposFacturas(resultado);
  const cuerpo = claves.map((uso) => {
    const items = grupos.get(uso);
    const suma = (campo) => items.reduce((total, fila) => total + (Number(fila[campo]) || 0), 0);
    const filas = items.map((fila) => `<tr>
      <td class="sin-corte">${escaparHtml(fila.factura)}</td>
      <td>${escaparHtml(cuentaCorta(fila.cuenta))}</td>
      <td class="num">${escaparHtml(fila.evento || "")}</td>
      <td class="dinero">${moneda(fila.base)}</td>
      <td>${escaparHtml(fila.estado)}</td>
      <td class="num">${escaparHtml(fechaCorta(fila.fechaPago))}</td>
      <td>${fila.elegible ? "Sí" : "No"}</td>
      <td class="dinero">${moneda(fila.recaudo)}</td>
      <td class="num">${fila.factorAplicado === null || fila.factorAplicado === undefined ? "" : porcentaje(fila.factorAplicado)}</td>
      <td class="dinero">${moneda(fila.ventaReconocida)}</td>
    </tr>`).join("");
    return `<tbody class="grupo-detalle-imp">
      <tr class="fila-grupo"><th colspan="10">${escaparHtml(uso)} · ${escaparHtml(plural(items.length, "factura", "facturas"))}</th></tr>
      ${filas}
      <tr class="fila-subtotal"><td colspan="3">Subtotal</td><td class="dinero">${moneda(suma("base"))}</td><td colspan="3"></td><td class="dinero">${textoGrupo(uso, suma("recaudo"))}</td><td></td><td class="dinero">${textoGrupo(uso, suma("ventaReconocida"))}</td></tr>
    </tbody>`;
  }).join("");
  const totales = resultado.totalesFacturas || { base: 0, recaudo: 0, reconocida: 0 };
  return `
    <section class="bloque-imp bloque-imp--detalle">
      <h2 class="bloque-imp__titulo">Detalle de facturas del mes</h2>
      <table class="tabla tabla-detalle-imp">
        <thead><tr><th>Factura</th><th>Cuenta</th><th>Evento</th><th>Base</th><th>Estado</th><th>Fecha de pago</th><th>Elegible</th><th>Recaudo</th><th>Factor</th><th>Venta reconocida</th></tr></thead>
        ${cuerpo}
        <tbody><tr class="fila-total"><td colspan="3">Total sin BTL</td><td class="dinero">${moneda(totales.base)}</td><td colspan="3"></td><td class="dinero">${moneda(totales.recaudo)}</td><td></td><td class="dinero">${moneda(totales.reconocida)}</td></tr></tbody>
      </table>
    </section>`;
}

function fichaImpresion(resultado) {
  const comercial = resultado.comercial;
  const { imr, maximo } = cifrasPersona(comercial);
  const transicion = obtenerParametros().transicion || {};
  const pie = `Simulación. No es un pago oficial · ${escaparHtml(resultado.nombre)} · ${escaparHtml(mesTitulo(mesActual()))}`;
  const { grupos, claves } = gruposFacturas(resultado);
  const resumen = claves.map((uso) => {
    const items = grupos.get(uso);
    const base = items.reduce((total, fila) => total + (Number(fila.base) || 0), 0);
    const reconocida = items.reduce((total, fila) => total + (Number(fila.ventaReconocida) || 0), 0);
    return `<tr><td>${escaparHtml(uso)}</td><td class="num">${items.length}</td><td class="dinero">${moneda(base)}</td><td class="dinero">${textoGrupo(uso, reconocida)}</td></tr>`;
  }).join("");
  const totales = resultado.totalesFacturas || { base: 0, reconocida: 0 };
  const encabezado = encabezadoDe(comercial);
  const meta = [encabezado.cargo || "Comercial", encabezado.documento, mesTitulo(mesActual())].filter(Boolean).join(" · ");
  const ordenMargenes = [...(resultado.margenesEventos || [])].sort((a, b) => (Number(b.ingreso) || 0) - (Number(a.ingreso) || 0));
  const visiblesMargenes = ordenMargenes.length > 12 ? ordenMargenes.slice(0, 12) : ordenMargenes;
  const ocultosMargenes = ordenMargenes.length - visiblesMargenes.length;
  const margenes = visiblesMargenes.map((item) => `<tr><td>${escaparHtml(item.numero)}</td><td><span class="evento-recorte">${escaparHtml(item.evento)}</span></td><td class="num">${(item.facturas || []).length}</td><td class="dinero">${moneda(item.ingreso)}</td><td class="dinero">${moneda(item.costoTotal)}</td><td class="num">${item.margen === null ? "" : porcentaje(item.margen)}</td><td>${escaparHtml(item.banda || "")}</td></tr>`).join("");
  const filaMargenesMas = ocultosMargenes > 0 ? `<tr><td colspan="7">y ${ocultosMargenes} eventos más (ver pantalla)</td></tr>` : "";
  const basico = comercial.basico;
  const conTransicion = basico === null || resultado.transicion.pagada === null ? null : basico + resultado.transicion.pagada;
  const avisos = resultado.avisos || [];
  const bloque = (titulo, cuerpo, clase = "") => `<section class="bloque-imp${clase ? ` ${clase}` : ""}"><h2 class="bloque-imp__titulo">${titulo}</h2>${cuerpo}</section>`;
  return `
    <div class="ficha-impresion">
      <header class="cabecera-imp">
        <div class="cabecera-imp__quien">
          <p class="cabecera-imp__nombre">${escaparHtml(resultado.nombre)}</p>
          <p class="cabecera-imp__meta">${escaparHtml(meta)}</p>
        </div>
        <div class="cabecera-imp__aviso">
          <strong>Simulación. No es un pago oficial.</strong>
          <span>Liquidación de comisiones · ${escaparHtml(mesTitulo(mesActual()))}</span>
        </div>
      </header>
      <div class="datos-imp">
        ${chip("Salario", moneda(comercial.basico))}
        ${chip("IMR", moneda(imr))}
        ${chip(`Máximo ${porcentaje(obtenerParametros().topeIndicador)}`, moneda(maximo))}
        ${chip("Básico + transición", moneda(conTransicion))}
      </div>
      ${tarjetasPagoImpresion(resultado)}
      <p class="imp-nota">Transición ${escaparHtml(mesCorto(transicion.desde))}–${escaparHtml(mesCorto(transicion.hasta))}: se paga el mayor de los dos esquemas.</p>
      ${bloque("5.8 Resultado", `${tabla58(resultado, false)}${curvaImpresion(resultado)}`, "bloque-imp--58")}
      ${bloque(`5.4 Ventas rentables y recaudadas ${marcaVentas(resultado)}`, cuerpoVentas(resultado, true), "bloque-imp--54")}
      ${tablaIndicadoresImpresion(resultado)}
      ${bloque("5.11.5 Bonificación BTL", btlImpresion(resultado), "bloque-imp--btl")}
      <div class="dos-imp">
        ${bloque("1. Política anterior", bloquePoliticaAnterior(resultado))}
        ${bloque(`3. Comparativo y transición ${resultado.transicion.esquema === "nueva" || resultado.transicion.esquema === "anterior" ? '<span class="badge badge--paga">Paga</span>' : ""}`, listaTransicionPantalla(resultado))}
      </div>
      ${bloque("Facturas del mes por uso", `<table class="tabla"><thead><tr><th>Uso</th><th>Facturas</th><th>Base</th><th>Venta reconocida</th></tr></thead><tbody>${resumen}</tbody>
          <tfoot><tr class="fila-total"><td>Total sin BTL</td><td></td><td class="dinero">${moneda(totales.base)}</td><td class="dinero">${moneda(totales.reconocida)}</td></tr></tfoot>
        </table>`)}
      ${ordenMargenes.length ? bloque("Márgenes de sus eventos", `<table class="tabla tabla-margenes-impresion"><thead><tr><th>#</th><th>Evento</th><th>Fact.</th><th>Ingreso</th><th>Costo total</th><th>Margen</th><th>Banda</th></tr></thead><tbody>${margenes}${filaMargenesMas}</tbody></table>
          <p class="imp-nota">ICA y GMF van dentro del costo total. Costo total = costo directo + ICA + GMF.</p>`, "bloque-imp--margenes") : ""}
      <div class="detalle-impresion">${detalleFacturasImpresion(resultado)}</div>
      <div class="cierre-imp">
        <div class="cierre-imp__fila">
          ${avisos.length ? bloque(`Avisos (${avisos.length})`, listaAvisos(avisos), "bloque-imp--avisos") : "<div></div>"}
          <div class="firmas-imp"><span>Elaboró</span><span>Revisó</span></div>
        </div>
        <p class="pie-ficha">${pie}</p>
      </div>
    </div>`;
}

function cambiarFicha(nombres, delta) {
  const indice = nombres.indexOf(comercialVisible);
  comercialVisible = nombres[(indice + delta + nombres.length) % nombres.length];
  pintarVistas();
}

function imprimirFichas(todas) {
  document.body.classList.toggle("imprimir-todas", todas);
  document.body.classList.toggle("imprimir-una", !todas);
  document.body.classList.toggle("imprimir-detalle", incluirDetalleImpresion);
  window.print();
}

window.addEventListener("afterprint", () => {
  document.body.classList.remove("imprimir-todas", "imprimir-una", "imprimir-detalle");
});

function filasVentas(detalle) {
  return (detalle || []).map((item) =>
    `<tr><td>${escaparHtml(nombreVisible(item.producto))}</td><td>${moneda(item.venta)}</td><td>${moneda(item.meta)}</td><td>${porcentaje(item.peso)}</td><td>${porcentaje(item.cumplimiento)}</td></tr>`
  ).join("");
}

function totalIndicadores(puntos) {
  const claves = ["ventas", "baseSocial", "serfiscal", "innovacion", "satisfaccion"];
  if (claves.some((clave) => puntos[clave] === null || puntos[clave] === undefined)) return null;
  return claves.reduce((suma, clave) => suma + puntos[clave], 0);
}

function bloqueMetodo(titulo, dato, activo) {
  if (!dato) return `<article class="tarjeta"><h3>${escaparHtml(titulo)}</h3><p>Pendiente</p></article>`;
  return `
    <article class="tarjeta${activo ? " metodo-usado" : ""}">
      <h3>${escaparHtml(titulo)} ${activo ? '<span class="badge badge--paga">Método usado</span>' : ""}</h3>
      <ul class="lista-concepto">
        <li><span>Score</span><span>${decimal(dato.score, 2)}</span></li>
        <li><span>Factor de pago</span><span>${dato.factor === null || dato.factor === undefined ? "Pendiente" : porcentajeFactor(dato.factor)}</span></li>
        <li><span>Pago</span><span class="dinero">${moneda(dato.pago)}</span></li>
      </ul>
    </article>`;
}

function celdaIndicador(cumplimiento, puntos, neutral, tipo) {
  if (neutral) return `Pendiente · ${decimal(puntos, 0)} puntos (neutral)`;
  if (puntos === null || puntos === undefined) return "Pendiente";
  const medida = cumplimiento === null || cumplimiento === undefined ? "" : `${distintivo(cumplimiento, tipo)} ${barraCumplimiento(cumplimiento)}`;
  return `${decimal(puntos, 2)}${medida ? `<br>${medida}` : ""}`;
}

/** v19 · Tres tarjetas horizontales del director (anterior / nueva / BTL), como en la ficha de cada comercial. */
function encabezadoPagosDirector(liquidacion) {
  const director = liquidacion.director;
  const parametros = obtenerParametros();
  const esquema = director.transicion.esquema;
  const pagoNuevo = director.elegido?.pago ?? null;
  const anterior = director.anterior || {};
  const minimo = parametros.curva?.minimo;
  const eventos = liquidacion.btl || [];
  const pagoBtl = sumaNumeros(eventos, (item) => item.pagoDirector);
  const motivos = [...new Set(eventos.map((item) => item.motivoDirector).filter(Boolean))];
  // v21: mismas reglas que la ficha: las líneas BTL aparecen solo si hay eventos BTL este mes.
  const lineasAnterior = [["Base (producción del equipo)", `<span class="dinero">${moneda(anterior.base)}</span>`], ["Tasa", `<span class="dinero">${porcentaje(anterior.tasa)}</span>`]];
  if (eventos.length) {
    const sub = director.btlAnterior === null || director.baseBtl === null
      ? `<br><small>Pendiente</small>`
      : `<br><small>(tasa ${porcentaje(parametros.director.tasaBtlAnterior)} sobre ${moneda(director.baseBtl)})</small>`;
    lineasAnterior.push(["BTL (esquema anterior)", `<span class="dinero">${moneda(director.btlAnterior)}</span>${sub}`]);
  }
  const tarjetaA = tarjetaPago({
    titulo: "Esquema anterior", paga: esquema === "anterior",
    monto: director.pagoAnterior === null || director.pagoAnterior === undefined ? "Pendiente" : moneda(director.pagoAnterior),
    lineas: lineasAnterior,
  });
  const basicoDir = parametros.director.basico;
  const oportDir = parametros.director.oportunidad;
  const totalMesDir = basicoDir === null || basicoDir === undefined || pagoNuevo === null
    ? null
    : basicoDir + pagoNuevo;
  const lineasNueva = [
    ["Básico", `<span class="dinero">${moneda(basicoDir)}</span>`],
    ["Oportunidad", `<span class="dinero">${moneda(oportDir)}</span>`],
    ["Score", director.elegido?.score === null || director.elegido?.score === undefined ? "Pendiente" : `<span class="dinero">${decimal(director.elegido.score, 2)}</span> <span class="ayuda-campo">mínimo ${escaparHtml(minimo)}</span>`],
    ["Factor de pago", director.elegido?.factor === null || director.elegido?.factor === undefined ? "Pendiente" : `<span class="dinero">${porcentajeFactor(director.elegido.factor)}</span>`],
    ["Método", escaparHtml(NOMBRE_METODO[parametros.director.metodo] || parametros.director.metodo)],
    ["Variable (oportunidad × factor)", `<span class="dinero">${moneda(pagoNuevo)}</span>`],
    ["Total del mes (básico + variable)", `<span class="dinero">${moneda(totalMesDir)}</span>`],
  ];
  if (eventos.length) lineasNueva.push(["BTL (política nueva)", `<span class="dinero">${moneda(pagoBtl)}</span>`]);
  const tarjetaN = tarjetaPago({
    titulo: "Política nueva", paga: esquema === "nueva",
    monto: pagoNuevo === null ? "Pendiente" : moneda(pagoNuevo),
    lineas: lineasNueva,
  });
  const condicionesDir = eventos.map((item) => {
    const r = resumenCondicionesBtl(item, "director");
    return `<p class="condiciones-btl__resumen">${escaparHtml(item.evento?.evento || "Evento")}: ${escaparHtml(r.texto)} ${r.badges}</p>`;
  }).join("");
  const tarjetaB = eventos.length
    ? tarjetaPago({
      titulo: "BTL 5.11.5", monto: moneda(pagoBtl),
      lineas: [
        ["Origen", escaparHtml(origenesBtl(eventos))],
        ["Esquema anterior · Política nueva", `<span class="dinero">${moneda(director.btlAnterior)}</span> · <span class="dinero">${moneda(pagoBtl)}</span>`],
        ["Bonificación director", `<span class="dinero">${moneda(pagoBtl)}</span>${motivos.map((m) => ` <span class="badge badge--peligro">${escaparHtml(m)}</span>`).join("")}`],
      ],
      extra: `${condicionesDir}${btlComparativo(eventos.map((item) => ({
        nombre: item.evento?.evento ? `Evento ${item.evento.evento}` : "Evento",
        anterior: item.evento?.origenBtl && Number.isFinite(Number(item.evento.ingreso))
          ? comisionBtlAnterior(item.evento.ingreso, parametros.director.tasaBtlAnterior)
          : null,
        nueva: item.pagoDirector,
      })))}<div class="acciones-btl"><button type="button" class="boton boton--texto" data-ir="btl">Ver detalle BTL →</button></div>`,
    })
    : tarjetaBtlVacia();
  const diferencia = pagoNuevo === null || director.pagoAnterior === null ? null : pagoNuevo - director.pagoAnterior;
  const clase = diferencia === null ? "" : diferencia < 0 ? "diferencia--negativa" : "diferencia--positiva";
  const transicion = parametros.transicion || {};
  return `
    <section class="encabezado-pagos" aria-label="Qué se paga este mes al director">
      <div class="encabezado-pagos__tarjetas">${tarjetaA}${tarjetaN}${tarjetaB}</div>
      <div class="franja-resumen barra-totales" role="group" aria-label="Resumen de la transición">
        <p><span>Diferencia (nueva − anterior)</span> <strong class="dinero diferencia ${clase}">${dineroFirmado(diferencia)}</strong></p>
        <p><span>Transición ${escaparHtml(mesCorto(transicion.desde))}–${escaparHtml(mesCorto(transicion.hasta))}</span> <strong>el mayor de los dos</strong></p>
        ${director.ajuste?.valor ? `<p><span>Ajuste${director.ajuste.mesReferencia ? ` (${escaparHtml(mesCorto(director.ajuste.mesReferencia))})` : ""}</span> <strong class="dinero">${dineroFirmado(director.ajuste.valor)}</strong></p>` : ""}
        <p><span>Se paga</span> <strong class="dinero">${moneda(director.pagoAjustado ?? director.transicion.pagada)}</strong></p>
      </div>
      <details class="avisos-ficha avisos-ficha--linea">
        <summary>Avisos (${(director.avisos || []).length})</summary>
        ${avisosAgrupados(director.avisos) || "<p>No hay avisos.</p>"}
      </details>
    </section>`;
}

/** v21 · Misma estructura que la sección de la ficha (título, resumen de puntos y cuerpo). */
function seccionDirector(titulo, resumen, cuerpo, abierta = false) {
  return `
    <details class="seccion"${abierta ? " open" : ""}>
      <summary>
        <span class="seccion__titulo">${titulo}</span>
        <span class="seccion__resumen">${resumen}</span>
      </summary>
      <div class="seccion__cuerpo">${cuerpo}</div>
    </details>`;
}

/** v23 · Rentabilidad de Educación y AT del equipo: suma de lo recaudado y margen ponderado por lo recaudado de cada comercial. */
function rentabilidadEquipo(director, equipo) {
  const conVenta = equipo.filter((item) => Number(item.eduAt?.ventaRecaudada) > 0);
  const recaudada = sumaNumeros(equipo, (item) => item.eduAt?.ventaRecaudada ?? 0);
  const faltaMargen = conVenta.some((item) => item.eduAt.margenComprobado === null || item.eduAt.margenComprobado === undefined);
  const faltaReconocida = conVenta.some((item) => item.eduAt.ventaReconocida === null || item.eduAt.ventaReconocida === undefined);
  const margen = faltaMargen || !recaudada ? null : conVenta.reduce((t, item) => t + item.eduAt.margenComprobado * item.eduAt.ventaRecaudada, 0) / recaudada;
  const reconocida = faltaReconocida ? null : sumaNumeros(equipo, (item) => item.eduAt?.ventaReconocida ?? 0);
  const factor = reconocida === null || !recaudada ? null : reconocida / recaudada;
  const meta = director.metasEquipo?.eduAt;
  const dato = (director.detalleVentas || []).find((fila) => fila.producto === "eduAt");
  const bandas = bandasMargen();
  const filas = equipo.map((item) => {
    const e = item.eduAt || {};
    const m = e.margenComprobado;
    const banda = m === null || m === undefined ? null : bandas.find((b) => b.aplica(m));
    return `<tr><td>${escaparHtml(item.nombre)}</td><td class="dinero">${moneda(e.ventaRecaudada ?? 0)}</td><td class="num">${Number(e.ventaRecaudada) > 0 ? textoValor(m, porcentaje) : "—"}</td><td>${banda ? escaparHtml(banda.texto) : ""}</td><td class="num">${Number(e.ventaRecaudada) > 0 ? textoValor(e.factorReconocimiento, porcentaje) : "—"}</td><td class="dinero">${moneda(e.ventaReconocida)}</td></tr>`;
  }).join("");
  const porComercial = `<details class="detalle-equipo" open><summary>Por comercial</summary>${tablaHtml(["Comercial", "Venta recaudada", "Margen comprobado", "Banda", "Factor de reconocimiento", "Venta reconocida"], filas)}</details>`;
  return bloqueRentabilidadEdu({
    titulo: "Rentabilidad de Educación y asistencia técnica · equipo",
    ventaRecaudada: recaudada,
    meta,
    cumplimiento: dato?.cumplimiento ?? (meta > 0 ? recaudada / meta : null),
    margen,
    factor,
    ventaReconocida: reconocida,
    porComercial,
  });
}

/** v19 · Secciones 5.4 a 5.7 del director con columna de puntos; muestran cómo se agrega desde el equipo. */
function seccionesDirector(liquidacion) {
  const director = liquidacion.director;
  const parametros = obtenerParametros();
  const pesos = parametros.pesos;
  const tope = parametros.topeIndicador;
  const equipo = liquidacion.resultados || [];
  const metodo = parametros.director.metodo;
  const regla = parametros.director.regla100;
  const notaRegla = regla ? "con regla del 100 % (bajo 100 % da 0)" : "sin regla del 100 % (suma desde 0 %)";
  const pts = (v) => (v === null || v === undefined ? "Pendiente" : decimal(v, 2));
  const tablaPuntos = (filas, total) => tablaHtml(["Comercial", "Dato", "Medición", "Puntos del comercial"], filas + (total || ""));
  const notaMetodo = metodo === "totales"
    ? "Método «Totales del equipo»: el director se mide con los totales del equipo, como si fuera un solo comercial."
    : `Método «${escaparHtml(NOMBRE_METODO[metodo] || metodo)}»: el score del director es el ${metodo === "promedio" ? "promedio simple" : "promedio ponderado por meta"} de los scores del equipo (tabla «Comparar métodos»). Estas secciones muestran el cálculo con totales del equipo como referencia.`;

  // 5.4
  const s54 = `
    ${seccionDirector("5.4 Ventas del equipo", `${pts(director.puntos.ventas)} de ${decimal(pesos.ventas, 0)} pts`, `
      ${tablaVentasPuntos({ detalle: director.detalleVentas, ventas: director.ventasEquipo, metas: director.metasEquipo, puntosVentas: director.puntos.ventas })}
      ${verFormula(`Ventas y metas = suma del equipo (Misión con la meta del equipo de Parámetros). Puntos = ${decimal(pesos.ventas, 0)} × Σ (peso × cumplimiento elegible) = ${pts(director.puntos.ventas)}.`)}
      ${rentabilidadEquipo(director, equipo)}`, true)}`;

  // 5.5
  const filasBase = equipo.map((item) => {
    const b = item.baseSocial || {};
    return `<tr><td>${escaparHtml(item.nombre)}</td><td class="num">${b.neutral ? "Neutral (primer mes)" : b.cierre === null || b.cierre === undefined ? "Pendiente" : entero(b.cierre)}</td><td class="num">${b.neutral ? "" : b.meta === null || b.meta === undefined ? "" : `meta ${entero(b.meta)}`}</td><td class="num">${pts(item.puntos.baseSocial)}</td></tr>`;
  }).join("");
  const s55 = `
    ${seccionDirector("5.5 Base social del equipo", `${pts(director.puntos.baseSocial)} de ${decimal(pesos.baseSocial, 0)} pts`, `
      ${tablaHtml(["Concepto", "Valor", "Cumplimiento", "Peso", "Puntos"], `
        <tr><td>Base computable del equipo (suma de cierres medidos)</td><td class="num">${director.puntos.baseCierre == null ? "Pendiente" : entero(director.puntos.baseCierre)}</td><td class="num" rowspan="2">${director.puntos.baseCumplimiento == null ? "Pendiente" : distintivo(director.puntos.baseCumplimiento, "ventas")}</td><td class="num" rowspan="2">${decimal(pesos.baseSocial, 0)}</td><td class="num" rowspan="2"><strong>${pts(director.puntos.baseSocial)}</strong></td></tr>
        <tr><td>Meta acumulada del equipo (Parámetros)</td><td class="num">${entero(parametros.director.metaBaseSocialEquipo)}</td></tr>`)}
      ${verFormula(`Puntos = ${decimal(pesos.baseSocial, 0)} × mín(cierre ÷ meta; ${porcentaje(tope)}) (sin regla del 100 %).`)}
      <p class="aviso">Pendiente con la jefa: la meta de base social del equipo queda en 622 o en 524. Hoy Parámetros dice ${entero(parametros.director.metaBaseSocialEquipo)}.</p>
      <details class="detalle-equipo"><summary>Cómo se agrega desde el equipo</summary>${tablaPuntos(filasBase)}</details>`)}`;

  // 5.6
  const serMedidos = equipo.filter((item) => !item.neutrales.serfiscal);
  const innMedidos = equipo.filter((item) => !item.neutrales.innovacion);
  const serProm = serMedidos.length ? serMedidos.reduce((t, i) => t + Number(i.comercial.serfiscal), 0) / serMedidos.length : null;
  const filasDiv = equipo.map((item) => `<tr><td>${escaparHtml(item.nombre)}</td><td class="num">SERFISCAL ${item.neutrales.serfiscal ? "sin medición" : `${decimal(item.comercial.serfiscal, 2)} %`}</td><td class="num">Innovación ${item.neutrales.innovacion ? "sin dato" : `${decimal(item.puntos.innovacion, 2)} pts`}</td><td class="num">${pts((item.puntos.serfiscal ?? 0) + (item.puntos.innovacion ?? 0))}</td></tr>`).join("");
  const div = director.puntos.serfiscal === null || director.puntos.innovacion === null ? null : director.puntos.serfiscal + director.puntos.innovacion;
  const s56 = `
    ${seccionDirector("5.6 Diversificación e innovación del equipo", `${pts(div)} de ${decimal(pesos.serfiscal + pesos.innovacion, 0)} pts`, `
      ${tablaHtml(["Concepto", "Valor del equipo", "Cumplimiento", "Peso", "Puntos"], `
        <tr><td>SERFISCAL (promedio de los medidos)</td><td class="num">${serProm === null ? "Sin medición en el equipo" : `${decimal(serProm, 2)} % (${serMedidos.length} de ${equipo.length})`}</td><td class="num">${serProm === null ? '<span class="badge badge--neutro">Neutral 100 %</span>' : distintivo(serProm / 100, regla ? "regla100" : "ventas")}</td><td class="num">${decimal(pesos.serfiscal, 0)}</td><td class="num"><strong>${pts(director.puntos.serfiscal)}</strong>${serProm === null ? " (neutral)" : ""}</td></tr>
        <tr><td>Innovación (promedio de los puntos con dato)</td><td class="num">${innMedidos.length ? `${innMedidos.length} de ${equipo.length} con dato` : "Sin datos en el equipo"}</td><td class="num">${innMedidos.length ? "" : '<span class="badge badge--neutro">Neutral</span>'}</td><td class="num">${decimal(pesos.innovacion, 0)}</td><td class="num"><strong>${pts(director.puntos.innovacion)}</strong>${innMedidos.length ? "" : " (neutral)"}</td></tr>
        <tr class="fila-total"><td><strong>Total 5.6</strong></td><td></td><td></td><td class="num">${decimal(pesos.serfiscal + pesos.innovacion, 0)}</td><td class="num"><strong>${pts(div)}</strong></td></tr>`)}
      ${verFormula(`SERFISCAL = ${decimal(pesos.serfiscal, 0)} × mín(promedio ÷ 100; ${porcentaje(tope)}), ${notaRegla}. Sin medición en el equipo: peso completo (neutral). Innovación = promedio de los puntos de quienes tienen dato; sin datos: peso completo (neutral).`)}
      <details class="detalle-equipo"><summary>Cómo se agrega desde el equipo</summary>${tablaPuntos(filasDiv)}</details>`)}`;

  // 5.7
  const satMedidos = equipo.filter((item) => !item.neutrales.satisfaccion);
  const satProm = satMedidos.length ? satMedidos.reduce((t, i) => t + Number(i.comercial.satisfaccion), 0) / satMedidos.length : null;
  const filasSat = equipo.map((item) => `<tr><td>${escaparHtml(item.nombre)}</td><td class="num">${item.neutrales.satisfaccion ? "Sin medición" : decimal(item.comercial.satisfaccion, 2)}</td><td class="num">${item.neutrales.satisfaccion ? "Neutral 100 %" : porcentaje(item.satisfaccion?.cumplimiento)}</td><td class="num">${pts(item.puntos.satisfaccion)}</td></tr>`).join("");
  const s57 = `
    ${seccionDirector("5.7 Satisfacción del equipo", `${pts(director.puntos.satisfaccion)} de ${decimal(pesos.satisfaccion, 0)} pts`, `
      ${tablaHtml(["Concepto", "Valor del equipo", "Cumplimiento", "Peso", "Puntos"], `
        <tr><td>Satisfacción (promedio de los medidos ÷ esperada ${escaparHtml(parametros.satisfaccionEsperada)})</td><td class="num">${satProm === null ? "Sin medición" : decimal(satProm, 2)}</td><td class="num">${satProm === null ? '<span class="badge badge--neutro">Neutral 100 %</span>' : distintivo(satProm / parametros.satisfaccionEsperada, regla ? "regla100" : "ventas")}</td><td class="num">${decimal(pesos.satisfaccion, 0)}</td><td class="num"><strong>${pts(director.puntos.satisfaccion)}</strong>${satProm === null ? " (neutral)" : ""}</td></tr>`)}
      ${verFormula(`Sin medición: neutral al 100 % (${decimal(pesos.satisfaccion, 0)} puntos).`)}
      <details class="detalle-equipo"><summary>Cómo se agrega desde el equipo</summary>${tablaPuntos(filasSat)}</details>`)}`;

  const total = totalIndicadores(director.puntos);
  const scoreUsado = director.elegido?.score ?? null;
  const resumen = `
    <article class="tarjeta total-director">
      ${tablaHtml(["Sección", "Peso", "Puntos"], `
        <tr><td>5.4 Ventas</td><td class="num">${decimal(pesos.ventas, 0)}</td><td class="num">${pts(director.puntos.ventas)}</td></tr>
        <tr><td>5.5 Base social</td><td class="num">${decimal(pesos.baseSocial, 0)}</td><td class="num">${pts(director.puntos.baseSocial)}</td></tr>
        <tr><td>5.6 Diversificación e innovación</td><td class="num">${decimal(pesos.serfiscal + pesos.innovacion, 0)}</td><td class="num">${pts(div)}</td></tr>
        <tr><td>5.7 Satisfacción</td><td class="num">${decimal(pesos.satisfaccion, 0)}</td><td class="num">${pts(director.puntos.satisfaccion)}</td></tr>
        <tr class="fila-total"><td><strong>Total (totales del equipo)</strong></td><td class="num">100</td><td class="num"><strong>${pts(total)}</strong>${metodo === "totales" && total !== null && scoreUsado !== null ? (Math.abs(total - scoreUsado) < 0.005 ? ' <span class="badge badge--exito">= score del director</span>' : ' <span class="badge badge--peligro">no cuadra</span>') : ""}</td></tr>`)}
      <p class="nota-union">${notaMetodo}${metodo !== "totales" ? ` Score usado: ${pts(scoreUsado)}.` : ""}</p>
    </article>`;
  return s54 + s55 + s56 + s57 + resumen;
}

function pintarDirector(liquidacion) {
  const director = liquidacion.director;
  const parametros = obtenerParametros();
  const metodo = parametros.director.metodo;
  const pesos = parametros.pesos;
  const tope = parametros.topeIndicador;
  const panel = document.querySelector("#panel-director");
  const equipo = liquidacion.resultados || [];
  const serfiscalNeutral = equipo.length > 0 && equipo.every((item) => item.neutrales.serfiscal);
  const innovacionNeutral = equipo.length > 0 && equipo.every((item) => item.neutrales.innovacion);
  const satisfaccionNeutral = equipo.length > 0 && equipo.every((item) => item.neutrales.satisfaccion);
  const diversificacionNeutral = serfiscalNeutral && innovacionNeutral;
  const pesoDiversificacion = pesos.serfiscal + pesos.innovacion;
  const diversificacion = director.puntos.serfiscal === null || director.puntos.innovacion === null
    ? null
    : director.puntos.serfiscal + director.puntos.innovacion;
  const pesoTotal = pesos.ventas + pesos.baseSocial + pesoDiversificacion + pesos.satisfaccion;
  const crudo = (director.detalleVentas || []).reduce((suma, item) => suma + item.peso * (item.elegible ?? item.cumplimiento), 0);
  const conTope = director.detalleVentas?.length ? Math.min(crudo, tope) : null;
  const formulaVentas = director.puntos.ventas === null
    ? "Ventas pendientes: falta una meta o un margen."
    : `Ventas = ${decimal(pesos.ventas, 0)} × mín(Σ peso × cumplimiento elegible; ${porcentaje(tope)}) = ${decimal(pesos.ventas, 0)} × ${porcentaje(conTope)} = ${decimal(director.puntos.ventas, 2)}`;
  const notaRegla = parametros.director.regla100 ? "con regla del 100 %" : "sin regla del 100 %";
  const formulaBase = director.puntos.baseCierre == null
    ? "Base social pendiente."
    : `Cierre ${entero(director.puntos.baseCierre)} de ${entero(director.puntos.baseMeta)} = ${porcentaje(director.puntos.baseCumplimiento)} → ${decimal(director.puntos.baseSocial, 2)} puntos (sin regla del 100 %)`;
  const tipoBase = parametros.director.regla100 ? "regla100" : "ventas";
  const pagoNuevo = director.elegido?.pago ?? director.transicion.pagada;
  const diferencia = pagoNuevo === null || director.pagoAnterior === null ? null : pagoNuevo - director.pagoAnterior;
  const imr = parametros.director.basico === null || parametros.director.oportunidad === null
    ? null
    : parametros.director.basico + parametros.director.oportunidad;
  const fila58 = (nombre, peso, puntos, cumplimiento, neutral, tipo) => `
    <tr>
      <td>${escaparHtml(nombre)}</td>
      <td class="num">${decimal(peso, 0)}</td>
      <td class="num">${decimal(Number(peso) * tope, 0)}</td>
      <td class="num">${puntos === null || puntos === undefined ? "Pendiente" : `${decimal(puntos, 2)}${neutral ? " (neutral)" : ""}`}</td>
      <td>${nombre === "Total" ? "" : neutral ? `<span class="badge badge--neutro">Pendiente</span>` : distintivo(cumplimiento, tipo)}</td>
    </tr>`;
  const factor = director.elegido?.factor ?? null;
  const formulaPago = factor === null || pagoNuevo === null
    ? "Pago pendiente."
    : `Pago = oportunidad × factor = ${moneda(parametros.director.oportunidad)} × ${decimal(factor, 4)} = ${moneda(pagoNuevo)}`;
  const score = director.elegido?.score ?? null;
  // v21: el director usa el mismo bloque score + curva que la ficha de cada comercial.
  const tarjetaScoreDirector = bloqueScoreCurva({ etiqueta: "Score del equipo", score, factor });
  const indicadoresDirector = [
    { nombre: "Ventas", peso: pesos.ventas, puntos: director.puntos.ventas, cumplimiento: conTope, tipo: "ventas", neutral: false },
    { nombre: "Base social", peso: pesos.baseSocial, puntos: director.puntos.baseSocial, cumplimiento: director.puntos.baseCumplimiento, tipo: "ventas", neutral: false },
    { nombre: "Diversificación e innovación", peso: pesoDiversificacion, puntos: diversificacion, cumplimiento: diversificacionNeutral ? null : diversificacion / pesoDiversificacion, tipo: tipoBase, neutral: diversificacionNeutral },
    { nombre: "Satisfacción", peso: pesos.satisfaccion, puntos: director.puntos.satisfaccion, cumplimiento: satisfaccionNeutral ? null : director.puntos.satisfaccion / pesos.satisfaccion, tipo: tipoBase, neutral: satisfaccionNeutral },
  ];
  const miniDirector = indicadoresDirector.map((item) => {
    const estado = item.neutral
      ? `<span class="badge badge--neutro">Neutral</span>`
      : item.cumplimiento === null || item.cumplimiento === undefined
        ? `<span class="badge badge--neutro">Pendiente</span>`
        : distintivo(item.cumplimiento, item.tipo);
    return `
      <div class="mini-indicador">
        <span class="mini-indicador__nombre">${escaparHtml(item.nombre)}</span>
        <span class="mini-indicador__peso" title="Peso ${escaparHtml(decimal(item.peso, 0))} · máximo ${escaparHtml(decimal(Number(item.peso) * tope, 0))}">${decimal(item.peso, 0)} pts</span>
        <strong class="mini-indicador__puntos">${item.puntos === null || item.puntos === undefined ? "Pendiente" : decimal(item.puntos, 2)}</strong>
        <span>${estado}</span>
        ${barraCumplimiento(item.cumplimiento)}
      </div>`;
  }).join("");
  const filasMetodos = [["totales", director.totales], ["promedio", director.promedio], ["ponderado", director.ponderado]]
    .map(([clave, dato]) => {
      const usado = clave === metodo;
      return `<tr class="${usado ? "fila-aplica" : ""}">
        <td>${escaparHtml(NOMBRE_METODO[clave])}${usado ? ' <span class="badge badge--paga">Usado</span>' : ""}</td>
        <td class="num">${dato ? decimal(dato.score, 2) : "Pendiente"}</td>
        <td class="num">${dato && dato.factor !== null && dato.factor !== undefined ? porcentajeFactor(dato.factor) : "Pendiente"}</td>
        <td class="dinero">${dato ? moneda(dato.pago) : "Pendiente"}</td>
      </tr>`;
    }).join("");
  panel.innerHTML = `
    <header class="cabecera-panel">
      <div>
        <h2 class="titulo-pagina">Director comercial · ${escaparHtml(mesTitulo(mesActual()))}</h2>
        <p class="nota-cabecera">Política anterior ${moneda(director.anterior?.comision)} sobre ${moneda(director.anterior?.base)}, tasa ${porcentaje(director.anterior?.tasa)}. BTL anterior, aparte: ${moneda(director.btlAnterior)}.</p>
        ${director.faltantes.length ? `<p class="nota-cabecera">Falta: ${escaparHtml(nombreVisible(director.faltantes.join(", ")))}.</p>` : ""}
      </div>
      <div class="cabecera-panel__derecha">
        <div class="acciones-tarjeta no-imprimir">
          <button type="button" class="boton" id="descargar-excel-director">Descargar Excel del director</button>
        </div>
        <p class="ayuda-equipo">Simulación. No es un pago oficial. La clave del simulador se pide en «Exportar» y no se guarda.</p>
        <div class="chips">
          ${chip("Oportunidad (base del pago)", moneda(parametros.director.oportunidad))}
          ${chip("IMR", moneda(imr))}
          ${chip("Método usado", escaparHtml(NOMBRE_METODO[metodo] || metodo))}
        </div>
      </div>
    </header>
    ${encabezadoPagosDirector(liquidacion)}
    <div class="resumen-ficha">
      ${tarjetaScoreDirector}
      <article class="tarjeta indicadores-ficha">
        <h2>Indicadores · 5.8</h2>
        <div class="indicadores-mini">${miniDirector}</div>
      </article>
    </div>
    <div class="director-layout">
      <div class="director-layout__principal">
        ${seccionesDirector(liquidacion)}
        <details class="seccion">
          <summary>Fórmulas y 5.8</summary>
          ${tablaHtml(["Indicador", "Peso", `Máx. ${porcentaje(tope)}`, "Puntos", "Cumplimiento"], `
            ${fila58("Ventas rentables y recaudadas", pesos.ventas, director.puntos.ventas, conTope, false, "ventas")}
            ${fila58("Base social", pesos.baseSocial, director.puntos.baseSocial, director.puntos.baseCumplimiento, false, "ventas")}
            ${fila58("Diversificación e innovación (SERFISCAL + innovación)", pesoDiversificacion, diversificacion, diversificacionNeutral ? null : diversificacion / pesoDiversificacion, diversificacionNeutral, tipoBase)}
            ${fila58("Satisfacción", pesos.satisfaccion, director.puntos.satisfaccion, satisfaccionNeutral ? null : director.puntos.satisfaccion / pesos.satisfaccion, satisfaccionNeutral, tipoBase)}
            ${fila58("Total", pesoTotal, totalIndicadores(director.puntos), null, false, "ventas")}
          `)}
          ${verFormula([formulaVentas, formulaBase, formulaPago])}
        </details>
        <details class="seccion">
          <summary>Comparar métodos</summary>
          <div class="rejilla-tarjetas">
            ${bloqueMetodo("Totales del equipo", director.totales, metodo === "totales")}
            ${bloqueMetodo("Promedio simple", director.promedio, metodo === "promedio")}
            ${bloqueMetodo("Promedio ponderado por meta", director.ponderado, metodo === "ponderado")}
          </div>
        </details>
        <details class="seccion" open>
          <summary>Política anterior · director</summary>
          ${bloqueAnteriorDirector(director)}
        </details>
        ${seccionBtlDirector(liquidacion)}
      </div>
      <aside class="director-layout__lateral">
        <article class="tarjeta">
          <h2>Métodos del score</h2>
          <table class="tabla tabla-metodos">
            <thead><tr><th>Método</th><th>Score</th><th>Factor</th><th>Pago</th></tr></thead>
            <tbody>${filasMetodos}</tbody>
          </table>
        </article>
      </aside>
    </div>`;
  panel.querySelector("#descargar-excel-director")?.addEventListener("click", (evento) => bajarExcel(DIRECTOR_EXCEL, liquidacion, false, evento.currentTarget));
  conectarCondicionesBtl(panel, liquidacion);
  panel.querySelectorAll("[data-ir]").forEach((boton) => {
    boton.addEventListener("click", () => {
      if (boton.dataset.ir === "parametros") sessionStorage.setItem("analfe-param-grupo", "anterior");
      document.dispatchEvent(new CustomEvent("mostrar-panel", { detail: boton.dataset.ir }));
      document.querySelector('[data-grupo-tab="anterior"]')?.click();
    });
  });
}

function seccionBtlDirector(liquidacion) {
  const eventos = liquidacion.btl || [];
  if (!eventos.length) return "";
  const score = liquidacion.director?.elegido?.score ?? null;
  const bloques = eventos.map((item) => `
    <h3>Evento ${escaparHtml(item.evento?.evento || "")}</h3>
    <p class="nota-union">${escaparHtml(origenesBtl([item]))} · pago director ${moneda(item.pagoDirector)}${item.motivoDirector ? ` · <span class="badge badge--peligro">${escaparHtml(item.motivoDirector)}</span>` : ""}</p>
    ${checksCondicionesBtl(item, "director", score)}`).join("");
  return seccionDirector("5.11.5 Bonificación BTL", `${plural(eventos.length, "evento", "eventos")} · ${moneda(sumaNumeros(eventos, (i) => i.pagoDirector))}`, bloques, true);
}

function bloqueAnteriorDirector(director) {
  const anterior = director.anterior || {};
  const control = obtenerControlHoja4();
  const filas = (anterior.porAsesor || []).map((fila) => `<tr><td>${escaparHtml(fila.asesor)}</td><td class="num">${fila.facturas}</td><td class="dinero">${moneda(fila.base)}</td></tr>`).join("");
  const btl = director.btlAnterior === null
    ? `<p>Pendiente: ingreso de ejecución del evento (solo desde archivos de márgenes)</p>`
    : director.baseBtl
      ? `<p>BTL anterior, aparte: ${porcentaje(obtenerParametros().director.tasaBtlAnterior)} × ${moneda(director.baseBtl)} = ${moneda(director.btlAnterior)} (informativo, no entra a la transición)</p>`
      : "";
  return `
    <p>Fuente: Facturación (${anterior.facturas || 0} facturas) ${marcaHoja4(anterior.base, control?.total)}</p>
    <ul class="lista-concepto">
      <li><span>Comisión anterior</span><span class="dinero kpi-numero">${moneda(anterior.comision)}</span></li>
      <li><span>Base comisión (sin anticipos 27209)</span><span class="dinero">${moneda(anterior.base)}</span></li>
      <li><span>Tasa</span><span class="dinero">${porcentaje(anterior.tasa)} <button type="button" class="boton boton--texto" data-ir="parametros">✎ Parámetros</button></span></li>
      <li><span>Base × tasa</span><span class="dinero">${moneda(anterior.comision)}</span></li>
    </ul>
    <details>
      <summary>Ver la base por asesor (${(anterior.porAsesor || []).length} filas)</summary>
      ${tablaHtml(["Asesor", "Facturas", "Suma de BASE"], filas || `<tr><td colspan="3">Sin filas.</td></tr>`)}
    </details>
    ${btl}`;
}

function pintarBtl(liquidacion) {
  const panel = document.querySelector("#panel-btl");
  if (!obtenerEventos().length) {
    panel.innerHTML = estadoVacio("BTL", "Carga el informe de producción para calcular la bonificación.", true);
    conectarVacios(panel);
    return;
  }
  if (!liquidacion.btl.length) {
    panel.innerHTML = estadoVacio("No hay eventos BTL este mes", "No hay eventos BTL este mes.", false);
    return;
  }
  const pagoDe = (estado, motivo, pago) => {
    if (estado === "Calculado" && Number(pago) > 0) return `<span class="badge badge--paga">Paga</span>`;
    const texto = motivo || estado || "Pendiente";
    const clase = /score|</i.test(texto) ? "badge--peligro" : "badge--aviso";
    return `<span class="badge badge--partido ${clase}">${escaparHtml(texto)}</span>`;
  };
  const sumaPago = (campo) => liquidacion.btl.reduce((total, item) => total + (Number(item[campo]) || 0), 0);
  const pendientes = liquidacion.btl.filter((item) => item.estadoComercial === "Pendiente" || item.estadoDirector === "Pendiente").length;
  const minimo = obtenerParametros().curva.minimo;
  const filas = liquidacion.btl.map((item) => `
    <tr>
      <td>${escaparHtml(item.evento.evento || "")}${item.evento.detalle ? `<br><small>${escaparHtml(item.evento.detalle)}</small>` : ""}<br><small class="origen-btl">${escaparHtml(origenesBtl([item]))}</small></td>
      <td>${escaparHtml(item.responsable || "")}</td>
      <td><input class="entrada campo-editable utilidad-btl${faltaUtilidadPresupuestada(item) ? " falta-utilidad" : ""}" type="text" inputmode="decimal" data-utilidad="${item.indice}" placeholder="${faltaUtilidadPresupuestada(item) ? "Falta. Carga parametros.xlsx o escríbela aquí" : ""}" title="${faltaUtilidadPresupuestada(item) ? "Falta. Carga parametros.xlsx o escríbela aquí" : ""}" value="${escaparHtml(item.evento.utilidadPresupuestada === null || item.evento.utilidadPresupuestada === undefined || item.evento.utilidadPresupuestada === "" ? "" : formatoMiles(Math.round(Number(item.evento.utilidadPresupuestada))))}">${item.evento.presupuestoBtl?.calculado ? `<br><small>Calculada con la columna PRESUPUESTO${item.evento.presupuestoBtl.excedenteNetoArchivo !== null && item.evento.presupuestoBtl.excedenteNetoArchivo !== undefined ? ` · archivo ${moneda(item.evento.presupuestoBtl.excedenteNetoArchivo)} (dif. ${moneda(item.evento.presupuestoBtl.diferenciaArchivo)})` : ""}</small>` : ""}</td>
      <td class="dinero">${item.utilidad === undefined ? "" : moneda(item.utilidad)}</td>
      <td class="num">${item.margenBruto === undefined ? "" : `${porcentaje(item.margenBruto)}${item.margenDecide === "bruto" ? '<br><span class="badge badge--paga" title="Este margen decide la tabla">decide</span>' : ""}`}</td>
      <td class="num">${item.margenNeto === undefined ? "" : `${porcentaje(item.margenNeto)}${item.margenDecide === "neto" ? '<br><span class="badge badge--paga" title="Este margen decide la tabla">decide</span>' : ""}`}</td>
      <td class="num">${item.cumplimiento === undefined ? "" : porcentaje(item.cumplimiento)}</td>
      <td><span class="dinero">${moneda(item.pagoComercial)}</span><br>${pagoDe(item.estadoComercial, item.motivoComercial, item.pagoComercial)}${(item.comerciales || []).length > 1 ? `<br><small>${item.comerciales.map((c) => `${escaparHtml(c.nombre)} ${porcentaje(c.porcentaje)}: ${moneda(c.pago)}`).join("<br>")}</small>` : ""}${item.repartoPendiente ? '<br><small class="texto-error">Reparto sin aprobar: liquida el responsable al 100 %</small>' : ""}${item.cargaComercial ? `<br><small>Carga prestacional (aparte): ${moneda(item.cargaComercial)}</small>` : ""}</td>
      <td><span class="dinero">${moneda(item.pagoDirector)}</span><br>${pagoDe(item.estadoDirector, item.motivoDirector, item.pagoDirector)}${item.cargaDirector ? `<br><small>Carga prestacional (aparte): ${moneda(item.cargaDirector)}</small>` : ""}${item.factorSalvaguarda !== undefined && item.factorSalvaguarda < 1 ? `<br><small>Salvaguarda ${porcentaje(obtenerParametros().btlComercial.salvaguarda)}: × ${decimal(item.factorSalvaguarda, 4)}</small>` : ""}</td>
      <td>${checksCondicionesBtl(item, "todos", item.comerciales?.[0]?.score ?? null)}</td>
    </tr>`).join("");
  panel.innerHTML = `
    <header class="cabecera-panel">
      <h2 class="titulo-pagina">BTL · núm. 5.11.5</h2>
      <p class="nota-cabecera">Si falta una condición, el pago queda en cero y se marca Pendiente. Cada rol necesita score ≥ ${escaparHtml(minimo)}.</p>
    </header>
    <div class="kpis kpis--compactos">
      <article class="tarjeta kpi"><p class="kpi__etiqueta">Eventos BTL del mes</p><p class="kpi__valor">${liquidacion.btl.length}</p></article>
      <article class="tarjeta kpi kpi--exito"><p class="kpi__etiqueta">Pago comerciales</p><p class="kpi__valor">${moneda(sumaPago("pagoComercial"))}</p></article>
      <article class="tarjeta kpi kpi--exito"><p class="kpi__etiqueta">Pago director</p><p class="kpi__valor">${moneda(sumaPago("pagoDirector"))}</p></article>
      <article class="tarjeta kpi kpi--aviso"><p class="kpi__etiqueta">Pendientes</p><p class="kpi__valor">${pendientes}</p></article>
    </div>
    <article class="tarjeta">
        <table class="tabla tabla-btl tabla-fija">
          <thead>
            <tr>
              <th>Evento</th><th>Comercial</th><th>Utilidad base presupuestada</th><th>Utilidad base real</th><th>Margen bruto</th><th>Margen neto</th><th>Cumplimiento</th>
              <th>Pago comercial</th><th>Pago director</th><th>Condiciones</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
    </article>
    <div class="dos-columnas">
      <details class="tarjeta tarjeta-plegable">
        <summary>Cómo se liquida ▸</summary>
        <ol class="pasos">
          <li>La utilidad base real es ingresos − total costos − ICA (sobre ingresos) − 4×1000 (sobre el costo), sin comisiones. La presupuestada usa la misma fórmula con la columna PRESUPUESTO.</li>
          <li>El cumplimiento es la utilidad real dividida por la utilidad presupuestada.</li>
          <li>El porcentaje del IMR sale de la tabla de cumplimiento y margen ${obtenerParametros().btlUmbrales?.margenDecide === "neto" ? "neto" : "bruto (ingresos − total costos) / ingresos"}, en Parámetros.</li>
          <li>Topes sobre el pago directo con el IMR de cada persona: comercial ${decimal(obtenerParametros().btlComercial.topeEvento, 2)} IMR por evento y ${decimal(obtenerParametros().btlComercial.topeAnio, 0)} IMR al año; director ${decimal(obtenerParametros().btlDirector.topeEvento, 2)} y ${decimal(obtenerParametros().btlDirector.topeAnio, 0)}. La carga prestacional se informa aparte.</li>
          <li>Salvaguarda: comerciales + director no pasan del ${porcentaje(obtenerParametros().btlComercial.salvaguarda)} de la utilidad base real; si se pasa, todos bajan en la misma proporción.</li>
          <li>Si falta una condición o el score queda bajo ${escaparHtml(minimo)}, el pago es cero.</li>
        </ol>
      </details>
      <details class="tarjeta tarjeta-plegable">
        <summary>Avisos ▸</summary>
        <ul class="lista-concepto">
          ${liquidacion.btl.filter((item) => item.motivoComercial || item.motivoDirector).map((item) => `<li><span>${escaparHtml(item.evento.evento || "")}</span>${pagoDe(item.estadoComercial, item.motivoComercial, item.pagoComercial)}</li>`).join("") || "<li><span>Sin avisos</span></li>"}
        </ul>
      </details>
    </div>`;
  conectarCondicionesBtl(panel, liquidacion);
  panel.querySelectorAll("input[data-utilidad]").forEach((campo) => {
    campo.addEventListener("change", () => {
      const indice = Number(campo.dataset.utilidad);
      const item = liquidacion.btl[indice];
      const texto = campo.value.trim();
      utilidadEditada.set(textoClave(item?.evento?.evento), texto === "" ? "" : numeroPesos(texto));
      pintarVistas();
    });
  });
}

function estadoVacio(titulo, texto, conBoton) {
  const facturas = obtenerFacturacion().length > 0;
  const eventos = obtenerEventosProduccion().length > 0;
  const btl = obtenerEventosBtlImportados().length > 0 || obtenerBtlEventos().size > 0;
  const marca = (listo) => listo
    ? `<span class="badge badge--exito">✓ cargada</span>`
    : `<span class="badge badge--peligro">falta</span>`;
  return `
    <article class="tarjeta estado-vacio">
      <div class="estado-vacio__icono" aria-hidden="true">▣</div>
      <h2>${escaparHtml(titulo)}</h2>
      <p>${escaparHtml(texto)}</p>
      ${conBoton ? `<button type="button" class="boton boton--primario" data-ir="cargar">Ir a Cargar datos</button>` : ""}
      <ul class="lista-estado">
        <li><span>Facturación</span>${marca(facturas)}</li>
        <li><span>Producción</span>${marca(eventos)}</li>
        <li><span>Eventos BTL</span>${btl ? `<span class="badge badge--exito">✓ cargados</span>` : `<span class="badge badge--neutro">opcional</span>`}</li>
      </ul>
    </article>`;
}

function conectarVacios(panel) {
  panel.querySelectorAll("[data-ir]").forEach((boton) => {
    boton.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("mostrar-panel", { detail: boton.dataset.ir }));
    });
  });
}

function claveExcel() {
  const casilla = document.querySelector("#excel-proteger");
  const campo = document.querySelector("#excel-clave");
  const clave = casilla?.checked ? campo?.value || "" : "";
  if (campo) campo.value = "";
  return clave;
}

const DIRECTOR_EXCEL = "\u0000director";

async function bajarExcel(nombre, liquidacion, todos = false, boton) {
  if (boton?.disabled) return;
  if (boton) boton.disabled = true;
  const clave = claveExcel();
  try {
    if (todos) await descargarTodosZip({ clave: clave || undefined, liquidacion });
    else if (nombre === DIRECTOR_EXCEL) await descargarExcelDirector({ clave: clave || undefined, liquidacion });
    else await descargarExcelComercial(nombre, { clave: clave || undefined, liquidacion });
    avisoBreve("Descargado. Al abrirlo, pulsa «Habilitar edición» para ver los resultados.");
  } catch (error) {
    const nota = document.querySelector("#excel-plantilla");
    const archivo = document.querySelector("#excel-plantilla-archivo");
    if (String(error.message || "").includes("plantilla") && nota && archivo) {
      nota.hidden = false;
      archivo.hidden = false;
    }
    avisoBreve(error.message || "No se pudo crear el Excel", "peligro");
  } finally {
    if (boton) boton.disabled = false;
  }
}

function pintarExportar(liquidacion) {
  const panel = document.querySelector("#panel-exportar");
  if (!panel) return;
  const opciones = liquidacion.resultados.map((item) => `<option value="${escaparHtml(item.nombre)}" ${item.nombre === comercialVisible ? "selected" : ""}>${escaparHtml(item.nombre)}</option>`).join("");
  panel.innerHTML = `
    <header class="cabecera-panel">
      <h2 class="titulo-pagina">Exportar e imprimir</h2>
      <p class="nota-cabecera">Todo sale de los datos del mes y de los parámetros guardados. Nada se envía a internet.</p>
    </header>
    <div class="exportar-tres">
      <article class="tarjeta">
        <h2>Resultado en Excel</h2>
        <p>Un .xlsx con una hoja por comercial, más el equipo, el director y BTL. «Descargar todos (.zip)» trae el Excel individual de cada comercial y el del director.</p>
        <div class="acciones-tarjeta">
          <button type="button" class="boton boton--primario" id="exportar-excel">Exportar resultado a Excel</button>
          <button type="button" class="boton" id="descargar-todos-zip">Descargar todos (.zip)</button>
        </div>
        <p>Simulación. No es un pago oficial.</p>
        <p class="ayuda-equipo">Al abrir el .xlsx, pulsa «Habilitar edición». Excel calcula las fórmulas solo entonces; en Vista protegida las celdas de fórmula salen en blanco.</p>
        <label class="casilla-impresion"><input type="checkbox" id="excel-proteger"> Proteger con la clave del simulador</label>
        <label>Clave <input class="entrada" type="password" id="excel-clave" autocomplete="off" aria-label="Clave del simulador"></label>
        <p class="ayuda-equipo">Protege la estructura y las fórmulas; no cifra el archivo.</p>
        <p id="excel-plantilla" hidden>No se encontró la plantilla del Excel individual</p>
        <input type="file" id="excel-plantilla-archivo" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
      </article>
      <article class="tarjeta">
        <h2>Imprimir fichas</h2>
        <p>Imprime la ficha de cada comercial del mes, o solo la de uno.</p>
        <label class="casilla-impresion"><input type="checkbox" id="exportar-detalle" ${incluirDetalleImpresion ? "checked" : ""}> Incluir detalle de facturas</label>
        <label>Comercial <select class="campo-editable" id="exportar-comercial" aria-label="Comercial">${opciones}</select></label>
        <div class="acciones-tarjeta">
          <button type="button" class="boton" id="exportar-imprimir-una">Imprimir ficha</button>
          <button type="button" class="boton" id="exportar-imprimir-todas">Imprimir todas las fichas</button>
        </div>
      </article>
      <article class="tarjeta">
        <h2>Parámetros JSON</h2>
        <p>Una copia de los parámetros y las metas para llevarla a otro navegador.</p>
        <div class="acciones-tarjeta">
          <button type="button" class="boton" id="exportar-json">Exportar JSON</button>
          <label class="boton">Importar JSON <input type="file" id="importar-json" accept="application/json,.json" hidden></label>
        </div>
      </article>
    </div>`;
  panel.querySelector("#exportar-excel").addEventListener("click", () => {
    exportarResultado(liquidacion, mesActual());
    avisoBreve("Excel generado con el resultado del mes");
  });
  panel.querySelector("#descargar-todos-zip").addEventListener("click", (evento) => bajarExcel("", liquidacion, true, evento.currentTarget));
  panel.querySelector("#excel-plantilla-archivo").addEventListener("change", (evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    archivo.arrayBuffer().then((buffer) => {
      elegirPlantilla(buffer);
      avisoBreve("Plantilla del Excel individual lista en esta pestaña");
    });
  });
  panel.querySelector("#exportar-imprimir-todas").addEventListener("click", () => imprimirFichas(true));
  panel.querySelector("#exportar-imprimir-una").addEventListener("click", () => {
    comercialVisible = panel.querySelector("#exportar-comercial").value;
    pintarDetalle(liquidacion);
    imprimirFichas(false);
  });
  panel.querySelector("#exportar-detalle").addEventListener("change", (evento) => {
    incluirDetalleImpresion = evento.target.checked;
    const casilla = document.querySelector("#imprimir-detalle");
    if (casilla) casilla.checked = incluirDetalleImpresion;
  });
  panel.querySelector("#exportar-json").addEventListener("click", () => exportarJson());
  panel.querySelector("#importar-json").addEventListener("change", (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      try {
        importarJson(String(lector.result));
        avisoBreve("Parámetros importados y guardados en este navegador.");
        document.dispatchEvent(new CustomEvent("parametros-repintar", { detail: "Parámetros importados y guardados en este navegador." }));
        document.dispatchEvent(new Event("liquidacion-actualizada"));
      } catch (error) {
        panel.querySelector("#exportar-json").insertAdjacentHTML("afterend", `<p>${escaparHtml(error.message)}</p>`);
      }
    };
    lector.readAsText(archivo);
  });
}

/** Vuelve a pintar las pestañas de resultado. Conserva el scroll y el foco. */
function entradaFicha(resultado, clave, etiqueta, texto, soloAria) {
  const valor = resultado.comercial[clave];
  const input = `<input class="entrada campo-editable" type="${texto ? "text" : "number"}" data-persona="${escaparHtml(resultado.nombre)}" data-campo="${clave}" ${texto ? 'data-texto="1"' : ""} aria-label="${escaparHtml(etiqueta)}" value="${escaparHtml(valor ?? "")}">`;
  if (soloAria) return input;
  return `<label>${escaparHtml(etiqueta)} ${input}</label>`;
}

function tabla58(resultado, imprimir = false) {
  const parametros = obtenerParametros();
  const pesos = parametros.pesos;
  const tope = parametros.topeIndicador;
  const puntos = resultado.puntos;
  const diversificacion = puntos.serfiscal === null || puntos.innovacion === null ? null : puntos.serfiscal + puntos.innovacion;
  const pesoDiversificacion = pesos.serfiscal + pesos.innovacion;
  const pesoTotal = pesos.ventas + pesos.baseSocial + pesoDiversificacion + pesos.satisfaccion;
  const fila = (nombre, peso, valor, cumplimiento, tipo) => `
    <tr>
      <td>${nombre}</td>
      <td class="num">${decimal(peso, 0)}</td>
      <td class="num">${decimal(peso * tope, 0)}</td>
      <td class="num">${valor === null ? "Pendiente" : decimal(valor, 2)}</td>
      <td>${cumplimiento === null || cumplimiento === undefined ? "" : distintivo(cumplimiento, tipo)}</td>
    </tr>`;
  return `
    ${tablaHtml(["Indicador", "Peso", `Máx. ${porcentaje(tope)}`, "Puntos", "Cumplimiento"], `
          ${fila("Ventas rentables y recaudadas", pesos.ventas, puntos.ventas, resultado.cumplimientoConTope, "ventas")}
          ${fila("Base social", pesos.baseSocial, puntos.baseSocial, resultado.baseSocial?.neutral ? null : resultado.baseSocial?.cumplimiento, "ventas")}
          ${fila("Diversificación e innovación (SERFISCAL + innovación)", pesoDiversificacion, diversificacion, resultado.neutrales.serfiscal && resultado.neutrales.innovacion ? null : diversificacion / pesoDiversificacion, "regla100")}
          ${fila("Satisfacción", pesos.satisfaccion, puntos.satisfaccion, resultado.neutrales.satisfaccion ? null : resultado.satisfaccion?.cumplimiento, "regla100")}
          ${fila("Total", pesoTotal, resultado.score, null, "ventas")}
        `)}
    ${verFormula(`Porcentaje (curva de pago) ${resultado.factor === null ? "Pendiente" : porcentajeFactor(resultado.factor)}. Comisión ganada · política nueva (sin BTL) ${moneda(resultado.pagoNuevo)}.`, imprimir)}`;
}

/** Versión para impresión: la tabla 5.8 completa y la curva. */
function fichaResumen(resultado) {
  return `
    <div class="fila-58">
      <article class="tarjeta">
        <h2>5.8 Resultado</h2>
        ${tabla58(resultado, true)}
      </article>
      <article class="tarjeta tarjeta-curva">
        <h2>Curva de pago · 5.8</h2>
        ${fichaCurva(resultado)}
      </article>
    </div>`;
}

function escalaMedidor(score) {
  const escala = escalaScore();
  const marcas = escala.anclas.map((punto) => `<i class="medidor__marca${punto === escala.maximo ? " medidor__marca--fin" : ""}" style="left:${escala.posicion(punto)}"></i>`).join("");
  // v21: etiquetas en 0 y en cada ancla de la curva (80, 90, 100, 110, 120).
  const puntosEtiqueta = [0, ...escala.anclas].filter((valor, indice, lista) => Number.isFinite(valor) && lista.indexOf(valor) === indice);
  const etiquetas = puntosEtiqueta.map((punto) => {
    const extremo = punto === 0 ? " medidor__etiqueta--inicio" : punto === escala.maximo ? " medidor__etiqueta--fin" : "";
    return `<span class="medidor__etiqueta${extremo}" style="left:${escala.posicion(punto)}">${punto}</span>`;
  }).join("");
  const actual = score === null ? "" : `<i class="medidor__actual" style="left:${escala.posicion(score)}" aria-hidden="true">▼</i>`;
  return { marcas, etiquetas, actual, relleno: score === null ? "0%" : escala.posicion(score), maximo: escala.maximo };
}

/**
 * v21: bloque horizontal score + curva, igual en la ficha y en el director.
 * Izquierda: score grande, barra 0–120 y la línea «Faltan X pts» / «Factor de pago Y %».
 * Derecha: tabla de la curva 5.8 siempre visible, con la fila del tramo actual resaltada.
 */
function bloqueScoreCurva({ etiqueta, score, factor }) {
  const minimo = obtenerParametros().curva.minimo;
  const { marcas, etiquetas, actual, relleno, maximo: topeScore } = escalaMedidor(score);
  const linea = score === null || score === undefined
    ? "Pendiente"
    : score < minimo
      ? `<span class="faltan">Faltan ${decimal(minimo - score, 2)} pts para ${escaparHtml(minimo)}</span>`
      : `Factor de pago ${factor === null || factor === undefined ? "Pendiente" : porcentajeFactor(factor)}`;
  const scoreTexto = score === null || score === undefined ? "Pendiente" : decimal(score, 2);
  return `
    <section class="score-curva" aria-label="${escaparHtml(etiqueta)} y curva de pago">
      <article class="tarjeta score-ficha score-curva__score">
        <p class="tarjeta-score__etiqueta">${escaparHtml(etiqueta)}</p>
        <p class="score-ficha__valor">${scoreTexto}</p>
        <div class="medidor score-barra" role="img" aria-label="${escaparHtml(etiqueta)} ${score === null || score === undefined ? "pendiente" : scoreTexto} sobre ${escaparHtml(topeScore)}. Mínimo para pagar ${escaparHtml(minimo)}.">
          <div class="medidor__pista" style="--pct:${relleno}; --corte:${escalaScore().posicion(minimo)}">
            <span class="medidor__relleno"></span>
            ${marcas}${actual}
          </div>
          <div class="medidor__escala">${etiquetas}</div>
        </div>
        <p class="score-ficha__linea">${linea}</p>
      </article>
      <article class="tarjeta score-curva__curva">
        <h2>Curva de pago · 5.8</h2>
        ${fichaCurva({ score: score ?? null })}
      </article>
    </section>`;
}

function tarjetaScoreFicha(resultado) {
  return bloqueScoreCurva({ etiqueta: "Score", score: resultado.score, factor: resultado.factor });
}

function miniIndicadores(resultado) {
  const parametros = obtenerParametros();
  const pesos = parametros.pesos;
  const tope = parametros.topeIndicador;
  const puntos = resultado.puntos;
  const diversificacion = puntos.serfiscal === null || puntos.innovacion === null ? null : puntos.serfiscal + puntos.innovacion;
  const pesoDiversificacion = pesos.serfiscal + pesos.innovacion;
  const neutroDiversificacion = resultado.neutrales.serfiscal && resultado.neutrales.innovacion;
  const indicadores = [
    { clave: "54", nombre: "Ventas", peso: pesos.ventas, puntos: puntos.ventas, cumplimiento: resultado.cumplimientoConTope, tipo: "ventas", neutral: false },
    { clave: "55", nombre: "Base social", peso: pesos.baseSocial, puntos: puntos.baseSocial, cumplimiento: resultado.baseSocial?.neutral ? null : resultado.baseSocial?.cumplimiento, tipo: "ventas", neutral: Boolean(resultado.baseSocial?.neutral) },
    { clave: "56", nombre: "Diversificación", peso: pesoDiversificacion, puntos: diversificacion, cumplimiento: neutroDiversificacion ? null : diversificacion / pesoDiversificacion, tipo: "regla100", neutral: Boolean(neutroDiversificacion) },
    { clave: "57", nombre: "Satisfacción", peso: pesos.satisfaccion, puntos: puntos.satisfaccion, cumplimiento: resultado.neutrales.satisfaccion ? null : resultado.satisfaccion?.cumplimiento, tipo: "regla100", neutral: Boolean(resultado.neutrales.satisfaccion) },
  ];
  return indicadores.map((item) => {
    const estado = item.neutral
      ? `<span class="badge badge--neutro">Neutral</span>`
      : item.cumplimiento === null || item.cumplimiento === undefined
        ? `<span class="badge badge--neutro">Pendiente</span>`
        : distintivo(item.cumplimiento, item.tipo);
    return `
      <a class="mini-indicador" href="#${idSeccion(resultado, item.clave)}">
        <span class="mini-indicador__nombre">${escaparHtml(item.nombre)}</span>
        <span class="mini-indicador__peso" title="Peso ${escaparHtml(decimal(item.peso, 0))} · máximo ${escaparHtml(decimal(item.peso * tope, 0))}">${decimal(item.peso, 0)} pts</span>
        <strong class="mini-indicador__puntos">${item.puntos === null || item.puntos === undefined ? "Pendiente" : decimal(item.puntos, 2)}</strong>
        <span>${estado}</span>
        ${barraCumplimiento(item.cumplimiento)}
      </a>`;
  }).join("");
}

function resumenFicha(resultado) {
  return `
    <section class="resumen-ficha" id="${idSeccion(resultado, "resumen")}" aria-label="Resumen del score">
      ${tarjetaScoreFicha(resultado)}
      <article class="tarjeta indicadores-ficha">
        <h2>Indicadores · 5.8</h2>
        <div class="indicadores-mini">${miniIndicadores(resultado)}</div>
        <details class="ver-tabla-58">
          <summary>Ver tabla 5.8</summary>
          ${tabla58(resultado)}
        </details>
      </article>
    </section>`;
}

function prorrateoBloque(resultado) {
  if (!resultado.prorrateo) return "";
  return `
    <article class="tarjeta">
      <h2>Mes de ingreso: prorrateo</h2>
      <div class="rejilla">${entradaFicha(resultado, "diasTrabajados", "Días laborados en el cargo")}${entradaFicha(resultado, "diasMes", "Días del mes")}</div>
      <p>Factor de prorrateo = días laborados ÷ días del mes = ${resultado.prorrateo.factor === null ? "Pendiente" : decimal(resultado.prorrateo.factor, 4)}</p>
    </article>`;
}

function subnav(resultado) {
  const enlace = (clave, texto) => `<a href="#${idSeccion(resultado, clave)}">${texto}</a>`;
  return `
    <nav class="subnav" aria-label="Secciones de la ficha">
      ${enlace("resumen", "Resumen")}
      ${enlace("54", "5.4")}
      ${enlace("55", "5.5")}
      ${enlace("56", "5.6")}
      ${enlace("57", "5.7")}
      ${enlace("transicion", "Anterior y transición")}
      ${enlace("btl", "BTL")}
      ${enlace("margenes", `Márgenes (${(resultado.margenesEventos || []).length})`)}
      ${enlace("facturas", `Facturas (${(resultado.detalleFacturas || []).length})`)}
    </nav>`;
}

/**
 * v17: encabezado de la ficha con tres tarjetas en horizontal y en este orden:
 * 1) Esquema anterior · 2) Política nueva · 3) BTL. Igual estructura: título, monto grande, sello «Paga» en la que gana
 * la transición («el mayor de los dos») y 2–4 líneas de detalle. Debajo: franja de resumen y avisos colapsables.
 * Solo presentación: lee lo que ya calculó liquidarMes; no recalcula nada.
 */
function tarjetaPago({ titulo, monto, paga = false, lineas = [], extra = "", clase = "" }) {
  return `
    <article class="tarjeta tarjeta-pago${paga ? " tarjeta-pago--paga" : ""}${clase ? ` ${clase}` : ""}">
      <h2 class="tarjeta-pago__titulo">${escaparHtml(titulo)}${paga ? ' <span class="badge badge--paga">Paga</span>' : ""}</h2>
      <p class="tarjeta-pago__monto">${monto}</p>
      <ul class="tarjeta-pago__lineas">
        ${lineas.map(([etiqueta, valor]) => `<li><span>${escaparHtml(etiqueta)}</span><span>${valor}</span></li>`).join("")}
      </ul>
      ${extra}
    </article>`;
}

function tarjetaAnterior(resultado) {
  const esquema = resultado.transicion.esquema;
  if (resultado.comercial?.tieneEsquemaAnterior === false) {
    return tarjetaPago({ titulo: "Esquema anterior", monto: "No aplica", lineas: [["Motivo", "No se compara con el esquema anterior"]], clase: "tarjeta-pago--no-aplica" });
  }
  const tramo = resultado.anteriorTramos;
  const reglas = obtenerParametros().anterior;
  const monto = resultado.pagoAnterior === null || resultado.pagoAnterior === undefined ? "Pendiente" : moneda(resultado.pagoAnterior);
  const lineas = tramo && tramo.comision !== null
    ? [
      ["Producción (cumplimiento)", `<span class="dinero">${moneda(tramo.produccion)}</span>`],
      ["Cumplimiento", `<span class="dinero">${porcentaje(tramo.cumplimiento)}</span>`],
      ["Tasa del tramo", `<span class="dinero">${porcentaje(tramo.tasa)}</span> <span class="ayuda-campo">«${escaparHtml(describirTramo(tramo.cumplimiento, reglas))}»</span>`],
      ["Base comisión (sin anticipos)", `<span class="dinero">${moneda(tramo.produccionComision ?? tramo.produccionSinAnticipos ?? tramo.produccion)}</span>`],
    ]
    : [["Meta mensual", tramo && tramo.meta > 0 ? moneda(tramo.meta) : "Pendiente"], ["Falta", "la meta de la política anterior"]];
  // v21: la línea BTL solo aparece si el comercial tiene eventos BTL este mes (sin BTL, ni siquiera en $0).
  if ((resultado.btlMes || []).length) {
    const sub = resultado.btlAnterior === null || resultado.ingresoBtlAnterior === null
      ? `<br><small>Pendiente</small>`
      : `<br><small>(tasa ${porcentaje(resultado.tasaBtlAnterior)} sobre ${moneda(resultado.ingresoBtlAnterior)})</small>`;
    lineas.push(["BTL (esquema anterior)", `<span class="dinero">${moneda(resultado.btlAnterior)}</span>${sub}`]);
  }
  return tarjetaPago({ titulo: "Esquema anterior", monto, paga: esquema === "anterior", lineas });
}

function tarjetaNueva(resultado) {
  const esquema = resultado.transicion.esquema;
  const minimo = obtenerParametros().curva?.minimo;
  const score = resultado.score;
  const basico = resultado.comercial?.basico;
  const oportunidad = resultado.comercial?.oportunidad;
  const totalMes = basico === null || basico === undefined || resultado.pagoNuevo === null || resultado.pagoNuevo === undefined
    ? null
    : basico + resultado.pagoNuevo;
  const lineas = [
    ["Básico", `<span class="dinero">${moneda(basico)}</span>`],
    ["Oportunidad", `<span class="dinero">${moneda(oportunidad)}</span>`],
    ["Score", score === null || score === undefined ? "Pendiente" : `<span class="dinero">${decimal(score, 2)}</span>${Number.isFinite(Number(minimo)) ? ` <span class="ayuda-campo">mínimo ${escaparHtml(minimo)}</span>` : ""}`],
    ["Factor de pago", resultado.factor === null || resultado.factor === undefined ? "Pendiente" : `<span class="dinero">${porcentajeFactor(resultado.factor)}</span>`],
    ["Variable (oportunidad × factor)", `<span class="dinero">${moneda(resultado.pagoNuevo)}</span>`],
    ["Total del mes (básico + variable)", `<span class="dinero">${moneda(totalMes)}</span>`],
  ];
  const eventosBtl = resultado.btlMes || [];
  if (eventosBtl.length) lineas.push(["BTL (política nueva)", `<span class="dinero">${moneda(sumaNumeros(eventosBtl, (item) => item.pagoComercial))}</span>`]);
  return tarjetaPago({
    titulo: "Política nueva",
    monto: resultado.pagoNuevo === null || resultado.pagoNuevo === undefined ? "Pendiente" : moneda(resultado.pagoNuevo),
    paga: esquema === "nueva",
    lineas,
  });
}

/** v18: de dónde salieron los datos de los eventos BTL (archivo del evento, a mano o informe de Producción). */
function origenesBtl(eventos) {
  const textos = [...new Set(eventos.map((item) => item.evento?.origenBtl ? (item.evento.origenBtl.tipo === "manual" ? "A mano" : `Archivo ${item.evento.origenBtl.archivo}`) : "Informe de Producción"))];
  return textos.join(" · ");
}

/** v21: estado vacío de la tarjeta BTL (icono + texto, tarjeta más baja). */
function tarjetaBtlVacia() {
  return `
    <article class="tarjeta tarjeta-pago tarjeta-pago--vacia">
      <h2 class="tarjeta-pago__titulo">BTL 5.11.5</h2>
      <p class="tarjeta-pago__vacio"><span class="tarjeta-pago__icono" aria-hidden="true">○</span><span>Sin eventos BTL este mes</span></p>
    </article>`;
}

/** Comisión BTL del esquema anterior de un evento (archivo / Producción). */
function btlAnteriorEvento(item, tasa, esResponsable = true, resultado = null) {
  if (!esResponsable) return 0;
  const delDetalle = (resultado?.btlAnteriorDetalle || []).find((fila) => textoClave(fila.evento) === textoClave(item.evento?.evento));
  if (delDetalle) return delDetalle.pendiente ? null : delDetalle.comision;
  const calc = detalleBtlAnteriorEvento(
    item.evento,
    obtenerFacturacion(),
    resultado?.comercial || null,
    mesActual(),
    obtenerParametros(),
    obtenerFacturaAEvento(),
    tasa ?? obtenerParametros().anterior?.tasaBtl
  );
  return calc.pendiente ? null : calc.comision;
}

/** v21: por cada evento, valor del esquema anterior y de la política nueva lado a lado. */
function btlComparativo(filas) {
  return `
    <div class="btl-comparativo" role="table" aria-label="BTL por evento: esquema anterior y política nueva">
      <div class="btl-comparativo__fila btl-comparativo__fila--cabeza" role="row"><span role="columnheader">Evento</span><span role="columnheader">Anterior</span><span role="columnheader">Nueva</span></div>
      ${filas.map(({ nombre, anterior, nueva }) => `
      <div class="btl-comparativo__fila" role="row"><span role="cell">${escaparHtml(nombre)}</span><span class="dinero" role="cell">${moneda(anterior)}</span><span class="dinero" role="cell">${moneda(nueva)}</span></div>`).join("")}
    </div>`;
}

function tarjetaBtl(resultado) {
  const eventos = resultado.btlMes || [];
  if (!eventos.length) return tarjetaBtlVacia();
  const filasEvento = eventos.map((item) => ({
    nombre: item.evento?.evento ? `Evento ${item.evento.evento}` : "Evento",
    anterior: btlAnteriorEvento(item, resultado.tasaBtlAnterior, true, resultado),
    nueva: item.pagoComercial,
  }));
  const comparativo = btlComparativo(filasEvento);
  const detalle = `<button type="button" class="boton boton--texto" data-ancla="${idSeccion(resultado, "btl")}">Ver detalle BTL →</button>`;
  const condiciones = eventos.map((item) => {
    const r = resumenCondicionesBtl(item, "comercial");
    return `<p class="condiciones-btl__resumen">${escaparHtml(item.evento?.evento || "Evento")}: ${escaparHtml(r.texto)} ${r.badges}</p>`;
  }).join("");
  const anteriorTxt = moneda(resultado.btlAnterior);
  const sinUtilidad = eventos.filter(faltaUtilidadPresupuestada);
  if (sinUtilidad.length) {
    const faltan = sinUtilidad.map((item) => item.evento?.evento || "").filter(Boolean).join(", ");
    return tarjetaPago({
      titulo: "BTL 5.11.5", monto: "Pendiente",
      lineas: [["Origen", escaparHtml(origenesBtl(eventos))], ["Falta", `utilidad del evento ${escaparHtml(faltan)}`]],
      extra: `${condiciones}${comparativo}<div class="acciones-btl"><button type="button" class="boton boton--primario boton--sm" data-ir="cargar">Ir a Cargar datos</button>${detalle}</div>`,
    });
  }
  const pago = sumaNumeros(eventos, (item) => item.pagoComercial);
  const director = sumaNumeros(eventos, (item) => item.pagoDirector);
  const motivos = [...new Set(eventos.map((item) => item.motivoComercial).filter(Boolean))];
  const lineas = [
    ["Origen", escaparHtml(origenesBtl(eventos))],
    ["Esquema anterior · Política nueva", `<span class="dinero">${anteriorTxt}</span> · <span class="dinero">${moneda(pago)}</span>`],
    ["Comisión BTL", `<span class="dinero">${moneda(pago)}</span>${motivos.map((motivo) => ` <span class="badge badge--peligro">${escaparHtml(motivo)}</span>`).join("")}`],
    ["Director", `<span class="dinero">${moneda(director)}</span>`],
  ];
  return tarjetaPago({ titulo: "BTL 5.11.5", monto: moneda(pago), lineas, extra: `${condiciones}${comparativo}<div class="acciones-btl">${detalle}</div>` });
}

function encabezadoPagos(resultado) {
  const transicion = obtenerParametros().transicion || {};
  const clase = resultado.diferencia === null ? "" : resultado.diferencia < 0 ? "diferencia--negativa" : "diferencia--positiva";
  const basico = resultado.comercial.basico;
  const sePaga = resultado.pagoAjustado ?? resultado.transicion.pagada;
  const conTransicion = basico === null || sePaga === null ? null : basico + sePaga;
  const avisos = resultado.avisos || [];
  const diferencia = resultado.comercial?.tieneEsquemaAnterior === false ? "No aplica" : dineroFirmado(resultado.diferencia);
  const ajusteLinea = resultado.ajuste?.valor
    ? `<p><span>Ajuste${resultado.ajuste.mesReferencia ? ` (${escaparHtml(mesCorto(resultado.ajuste.mesReferencia))})` : ""}</span> <strong class="dinero">${dineroFirmado(resultado.ajuste.valor)}</strong></p>`
    : "";
  return `
    <section class="encabezado-pagos" aria-label="Qué se paga este mes">
      <div class="encabezado-pagos__tarjetas">
        ${tarjetaAnterior(resultado)}
        ${tarjetaNueva(resultado)}
        ${tarjetaBtl(resultado)}
      </div>
      <div class="franja-resumen barra-totales" role="group" aria-label="Resumen de la transición">
        <p><span>Diferencia (nueva − anterior)</span> <strong class="dinero diferencia ${clase}">${diferencia}</strong></p>
        <p><span>Transición ${escaparHtml(mesCorto(transicion.desde))}–${escaparHtml(mesCorto(transicion.hasta))}</span> <strong>el mayor de los dos</strong></p>
        ${ajusteLinea}
        <p><span>Básico + se paga</span> <strong class="dinero">${moneda(conTransicion)}</strong></p>
      </div>
      <details class="avisos-ficha avisos-ficha--linea">
        <summary>Avisos (${avisos.length})</summary>
        ${avisosAgrupados(avisos) || "<p>No hay avisos.</p>"}
      </details>
    </section>`;
}

function cuerpoAnteriorPantalla(resultado) {
  return bloquePoliticaAnterior(resultado);
}

function listaTransicionPantalla(resultado) {
  const transicion = obtenerParametros().transicion || {};
  const clase = resultado.diferencia === null ? "" : resultado.diferencia < 0 ? "diferencia--negativa" : "diferencia--positiva";
  const basico = resultado.comercial.basico;
  const conTransicion = basico === null || resultado.transicion.pagada === null ? null : basico + resultado.transicion.pagada;
  const conAjuste = basico === null || resultado.pagoAjustado === null ? null : basico + resultado.pagoAjustado;
  return `
    <ul class="lista-concepto">
      <li><span>Comisión anterior</span><span class="dinero">${moneda(resultado.pagoAnterior)}</span></li>
      <li><span>Política nueva, sin BTL</span><span class="dinero">${moneda(resultado.pagoNuevo)}</span></li>
      <li><span>Diferencia (nueva − anterior)</span><span class="dinero diferencia ${clase}">${dineroFirmado(resultado.diferencia)}</span></li>
      <li><span>Transición ${escaparHtml(mesCorto(transicion.desde))}–${escaparHtml(mesCorto(transicion.hasta))}</span><span>el mayor de los dos</span></li>
      <li><span>Se paga (antes de ajuste)</span><span>${resultado.transicion.esquema === "pendiente" ? "Pendiente" : `<span class="badge badge--paga">${escaparHtml(nombreEsquema(resultado.transicion.esquema))}</span>`} <strong class="dinero">${moneda(resultado.transicion.pagada)}</strong></span></li>
      <li><span>Ajuste / reliquidación</span><span class="dinero">${dineroFirmado(resultado.ajuste?.valor)}</span></li>
      <li><span>Se paga (con ajuste)</span><span class="dinero"><strong>${moneda(resultado.pagoAjustado)}</strong></span></li>
      <li><span>Básico contractual</span><span class="dinero">${moneda(basico)}</span></li>
      <li><span>Básico + transición</span><span class="dinero">${moneda(conTransicion)}</span></li>
      <li><span>Básico + se paga (con ajuste)</span><span class="dinero">${moneda(conAjuste)}</span></li>
    </ul>`;
}

function bloqueAjuste(resultado) {
  const mes = resultado.comercial.ajusteMes || "";
  const opts = ["", "2026-10", "2026-11", "2026-12"]
    .map((m) => `<option value="${escaparHtml(m)}" ${mes === m ? "selected" : ""}>${m ? escaparHtml(mesTitulo(m)) : "— Mes que corrige —"}</option>`)
    .join("");
  return `
    <div class="ajuste-reliquidacion">
      <h3 class="ajuste-reliquidacion__titulo">Ajuste / reliquidación</h3>
      <p class="ayuda-campo">Suma o resta un monto a lo que se paga este mes (no cambia el score ni el factor). Fase 1: ajuste manual.</p>
      <div class="rejilla rejilla--3">
        ${entradaFicha(resultado, "ajusteValor", "Ajuste $")}
        <label>Mes que corrige
          <select class="entrada campo-editable" data-persona="${escaparHtml(resultado.nombre)}" data-campo="ajusteMes" data-texto="1" aria-label="Mes que corrige">
            ${opts}
          </select>
        </label>
        ${entradaFicha(resultado, "ajusteNota", "Nota", true)}
      </div>
    </div>`;
}

function seccionTransicion(resultado) {
  const paga = resultado.transicion.esquema === "nueva" || resultado.transicion.esquema === "anterior";
  const textoPaga = resultado.transicion.esquema === "nueva"
    ? "se paga la nueva"
    : resultado.transicion.esquema === "anterior"
      ? "se paga el anterior"
      : "pendiente";
  const ajusteTxt = resultado.ajuste?.valor ? ` · ajuste ${dineroFirmado(resultado.ajuste.valor)}` : "";
  return seccion(resultado, "transicion", "Esquema anterior y transición", {
    badge: paga ? `<span class="badge badge--paga">Paga</span>` : "",
    resumen: `${moneda(resultado.pagoAjustado ?? resultado.transicion.pagada)} · ${textoPaga}${ajusteTxt}`,
    cuerpo: `
      <div class="anterior-transicion">
        <div>${cuerpoAnteriorPantalla(resultado)}</div>
        <div>${listaTransicionPantalla(resultado)}${bloqueAjuste(resultado)}</div>
      </div>`,
  });
}

/**
 * v19 · Tabla 5.4 con puntos por producto (ficha y director).
 * Puntos = peso del producto × cumplimiento elegible × peso del indicador de ventas.
 * La fila Total cuadra con los puntos de ventas del score.
 */
function tablaVentasPuntos({ detalle, ventas, metas, puntosVentas, claves }) {
  const parametros = obtenerParametros();
  const pesoVentas = parametros.pesos.ventas;
  const item = (clave) => (detalle || []).find((fila) => fila.producto === clave);
  const lista = claves || ["eduAt", "mision", "congreso", "cultural"];
  let hayExceso = false;
  const filas = lista.map((clave) => {
    const dato = item(clave);
    const meta = metas?.[clave];
    const venta = ventas?.[clave];
    const sinMeta = meta === 0 || meta === undefined;
    if (!dato) {
      if (sinMeta && !venta) return "";
      return `<tr><td>${escaparHtml(nombreVisible(clave))}</td><td class="dinero">${moneda(venta)}</td><td class="dinero">${moneda(meta)}</td><td class="num"></td><td>${distintivo(null, sinMeta ? "no-aplica" : undefined)}</td><td></td><td class="num"></td></tr>`;
    }
    if (dato.excede) hayExceso = true;
    const topeTexto = porcentaje(dato.topeProducto);
    return `<tr>
      <td>${escaparHtml(nombreVisible(clave))}</td>
      <td class="dinero">${moneda(dato.venta)}</td>
      <td class="dinero">${moneda(dato.meta)}</td>
      <td class="num">${porcentaje(dato.peso)}</td>
      <td class="num${dato.excede ? " celda-sobrecumple" : ""}" ${dato.excede ? `title="Supera el tope de ${topeTexto}: el exceso no compensa otros productos"` : ""}>${distintivo(dato.cumplimiento, "ventas")}</td>
      <td class="num${dato.excede ? " celda-sobrecumple" : ""}">${porcentaje(dato.elegible)}<br><small>tope ${topeTexto}</small></td>
      <td class="num"><strong>${decimal(dato.puntos, 2)}</strong></td>
    </tr>`;
  }).join("");
  const sumaPuntos = (detalle || []).reduce((t, d) => t + (Number(d.puntos) || 0), 0);
  const sumaPeso = (detalle || []).reduce((t, d) => t + d.peso, 0);
  const sumaElegible = (detalle || []).reduce((t, d) => t + d.peso * d.elegible, 0);
  const cuadra = puntosVentas === null || puntosVentas === undefined ? null : Math.abs(sumaPuntos - puntosVentas) < 0.005;
  const total = `<tr class="fila-total">
      <td><strong>Total</strong></td><td class="dinero">${moneda((detalle || []).reduce((t, d) => t + d.venta, 0))}</td><td class="dinero">${moneda((detalle || []).reduce((t, d) => t + d.meta, 0))}</td>
      <td class="num">${detalle?.length ? porcentaje(sumaPeso) : ""}</td><td></td>
      <td class="num">${detalle?.length ? porcentaje(sumaElegible) : ""}<br><small>Σ peso × elegible</small></td>
      <td class="num"><strong>${puntosVentas === null || puntosVentas === undefined ? "Pendiente" : decimal(puntosVentas, 2)}</strong> <small>de ${decimal(pesoVentas, 0)}</small>${cuadra === false ? ' <span class="badge badge--peligro">no cuadra</span>' : ""}</td>
    </tr>`;
  const nota = `<p class="nota-sobrecumplimiento${hayExceso ? " nota-sobrecumplimiento--activa" : ""}">Sobrecumplimiento: se reconoce hasta ${porcentaje(parametros.topeProducto)} por producto (Congreso hasta ${porcentaje(parametros.topeCongreso)}); el exceso no compensa otros productos.${hayExceso ? " Las celdas en naranja superan el tope." : ""}</p>`;
  return `${tablaHtml(["Producto", "Venta", "Meta", "Peso", "Cumplimiento", "Cumplimiento elegible", "Puntos"], filas + total)}${nota}`;
}

function cuerpoVentas(resultado, imprimir = false) {
  const parametros = obtenerParametros();
  const edu = resultado.eduAt || {};
  const mision = resultado.mision || {};
  const item = (clave) => resultado.detalleVentas.find((fila) => fila.producto === clave);
  const peso = parametros.pesos.ventas;
  const formula = resultado.puntos.ventas === null
    ? "Puntos pendientes: falta una meta o un margen."
    : `Puntos = ${peso} × Σ (peso × cumplimiento elegible) = ${peso} × ${porcentaje(resultado.cumplimientoConTope)} = ${decimal(resultado.puntos.ventas, 2)}`;
  return `
    ${tablaVentasPuntos({ detalle: resultado.detalleVentas, ventas: resultado.ventas, metas: resultado.metas, puntosVentas: resultado.puntos.ventas })}
    ${verFormula(escaparHtml(formula), imprimir)}
    ${bloqueRentabilidadEdu({
      ventaRecaudada: edu.ventaRecaudada,
      meta: resultado.metas?.eduAt,
      cumplimiento: item("eduAt")?.cumplimiento,
      margen: edu.margenComprobado,
      factor: edu.factorReconocimiento,
      ventaReconocida: edu.ventaReconocida,
    })}
    <p class="nota-mision">Facturas de Misión del mes: ${mision.facturas ?? 0}.</p>`;
}

/** v23 · Bandas de margen de Parámetros (sin valores quemados): menor al umbral bajo, entre umbrales, mayor al alto. */
function bandasMargen() {
  const reglas = obtenerParametros().margen || {};
  return [
    { clave: "bajo", texto: `Menor a ${porcentaje(reglas.umbralBajo)}`, factor: reglas.factorBajo, aplica: (m) => m < reglas.umbralBajo },
    { clave: "medio", texto: `De ${porcentaje(reglas.umbralBajo)} a ${porcentaje(reglas.umbralAlto)}`, factor: reglas.factorMedio, aplica: (m) => m >= reglas.umbralBajo && m <= reglas.umbralAlto },
    { clave: "alto", texto: `Mayor a ${porcentaje(reglas.umbralAlto)}`, factor: reglas.factorAlto, aplica: (m) => m > reglas.umbralAlto },
  ];
}

function textoValor(valor, formato) {
  return valor === null || valor === undefined || Number.isNaN(Number(valor)) ? "Pendiente" : formato(valor);
}

/**
 * v23 · Rentabilidad de Educación y asistencia técnica: el mismo bloque del Excel (Liquidación F21:F26).
 * Solo muestra cifras ya calculadas; no cambia el pago.
 */
function bloqueRentabilidadEdu({ ventaRecaudada, meta, cumplimiento, margen, factor, ventaReconocida, titulo = "Rentabilidad de Educación y asistencia técnica", porComercial = "" }) {
  const bandas = bandasMargen();
  const hayMargen = margen !== null && margen !== undefined && !Number.isNaN(Number(margen));
  const banda = hayMargen ? bandas.find((item) => item.aplica(Number(margen))) : null;
  const filas = [
    ["Venta recaudada para Educación y asistencia técnica", textoValor(ventaRecaudada, moneda)],
    ["Meta del mes", meta === 0 || meta === undefined ? "Sin meta" : textoValor(meta, moneda)],
    ["Cumplimiento", textoValor(cumplimiento, porcentaje)],
    ["Margen comprobado", hayMargen ? `${porcentaje(margen)}${banda ? ` <span class="badge badge--${banda.clave === "bajo" ? "peligro" : banda.clave === "medio" ? "aviso" : "exito"}">${escaparHtml(banda.texto)}</span>` : ""}` : '<span class="badge badge--neutro">Pendiente</span>'],
    ["Factor de reconocimiento", textoValor(factor, porcentaje)],
    ["Venta reconocida", textoValor(ventaReconocida, moneda)],
  ];
  const bandasHtml = bandas.map((item) => `<li class="banda-margen${banda && banda.clave === item.clave ? " banda-margen--aplica" : ""}"><span>${escaparHtml(item.texto)}</span><strong>reconoce ${porcentaje(item.factor)}</strong></li>`).join("");
  const significado = hayMargen
    ? `De cada peso recaudado en Educación y asistencia técnica, cuenta para la meta lo que permite el margen del evento. El margen comprobado (${porcentaje(margen)}) es el promedio del margen de sus eventos, ponderado por lo facturado${banda ? `, y cae en la banda «${escaparHtml(banda.texto)}»` : ""}. El factor de reconocimiento (${textoValor(factor, porcentaje)}) es la venta reconocida ÷ la venta recaudada; cada factura se reconoce con la banda de su propio evento.`
    : "Pendiente: falta el margen de uno o más eventos (archivo de márgenes). Sin margen no se puede saber qué parte de la venta se reconoce.";
  return `
    <section class="rentabilidad-edu" aria-label="${escaparHtml(titulo)}">
      <h3 class="rentabilidad-edu__titulo">${escaparHtml(titulo)}</h3>
      <div class="rentabilidad-edu__cuerpo">
        <table class="tabla tabla-concepto rentabilidad-edu__tabla"><tbody>${filas.map(([nombre, valor]) => `<tr><th>${escaparHtml(nombre)}</th><td class="dinero">${valor}</td></tr>`).join("")}</tbody></table>
        <div class="rentabilidad-edu__bandas">
          <p class="rentabilidad-edu__subtitulo">Bandas de margen (Parámetros)</p>
          <ul class="bandas-margen">${bandasHtml}</ul>
        </div>
      </div>
      <p class="rentabilidad-edu__nota">${significado}</p>
      ${porComercial}
    </section>`;
}

function marcaVentas(resultado) {
  return resultado.cumplimientoPonderado === null ? distintivo(null) : distintivo(resultado.cumplimientoPonderado, "ventas");
}

/** Versión para impresión (tarjeta fija). */
function fichaVentas(resultado) {
  return `
    <article class="tarjeta">
      <h2>5.4 Ventas rentables y recaudadas ${marcaVentas(resultado)}</h2>
      ${cuerpoVentas(resultado, true)}
    </article>`;
}

function seccionVentas(resultado) {
  const parametros = obtenerParametros();
  const margen = resultado.eduAt?.margenComprobado;
  const puntos = resultado.puntos.ventas === null ? "Pendiente" : `${decimal(resultado.puntos.ventas, 2)} de ${parametros.pesos.ventas} pts`;
  return seccion(resultado, "54", "5.4 Ventas rentables y recaudadas", {
    badge: marcaVentas(resultado),
    resumen: `${puntos} · margen ${margen === null || margen === undefined ? "Pendiente" : porcentaje(margen)}`,
    cuerpo: cuerpoVentas(resultado),
    defecto: true,
  });
}

function seccionBase(resultado) {
  const parametros = obtenerParametros();
  const base = resultado.baseSocial;
  const comercial = resultado.comercial;
  const formula = base.neutral
    ? "Neutral: primer mes"
    : base.cierre === null
      ? "Pendiente"
      : `Cierre = base + ingresos − retiros = ${entero(base.cierre)}. Meta = ${entero(base.meta)}. Cumplimiento ${porcentaje(base.cumplimiento)}. Puntos = peso × mín(cumplimiento; tope) = ${decimal(resultado.puntos.baseSocial, 2)} (sin regla del 100 %).`;
  const resultadoBase = base.neutral ? "Neutral: primer mes" : `${distintivo(base.cumplimiento, "ventas")} ${barraCumplimiento(base.cumplimiento)}`;
  const cumplimientoTexto = base.cumplimiento === null || base.cumplimiento === undefined ? "Pendiente" : porcentaje(base.cumplimiento);
  const puntosTexto = resultado.puntos.baseSocial === null ? "Pendiente" : `${decimal(resultado.puntos.baseSocial, 2)} de ${parametros.pesos.baseSocial} pts`;
  const resumen = base.neutral
    ? "Neutral: primer mes"
    : `${cumplimientoTexto} · ${puntosTexto} · cierre ${base.cierre === null ? "Pendiente" : entero(base.cierre)} / meta ${base.meta === null ? "Pendiente" : entero(base.meta)}`;
  const cuerpo = `
    <ul class="lista-concepto">
      <li><span>Base social 30 sept</span><span>${comercial.baseSocialInicial === null ? "Pendiente" : entero(comercial.baseSocialInicial)}</span></li>
      <li><span>Retiros</span>${entradaFicha(resultado, "retiros", "Retiros", false, true)}</li>
      <li><span>Ingresos</span>${entradaFicha(resultado, "ingresos", "Ingresos", false, true)}</li>
      <li><span>Base social cierre</span><span>${base.cierre === null ? "Pendiente" : entero(base.cierre)}</span></li>
      <li><span>Meta</span><span>${base.meta === null ? "Pendiente" : `${entero(base.meta)}${base.metaOrigen === "manual" ? ' <span class="badge badge--aviso">editada</span>' : base.metaOrigen === "formula" ? ' <span class="badge badge--neutro">fórmula</span>' : ""}`}</span></li>
      <li><span>Resultado</span><span>${resultadoBase}</span></li>
      <li class="fila-puntos"><span>Puntos</span><span>${resultado.puntos.baseSocial === null ? "Pendiente" : decimal(resultado.puntos.baseSocial, 2)}</span></li>
    </ul>
    ${verFormula(formula)}`;
  return seccion(resultado, "55", "5.5 Base social", {
    badge: base.neutral ? `<span class="badge badge--neutro">Neutral</span>` : distintivo(base.cumplimiento, "ventas"),
    resumen,
    cuerpo,
    falta: faltaDato([comercial.retiros, comercial.ingresos]),
  });
}

function seccionInnovacion(resultado) {
  const parametros = obtenerParametros();
  const neutro = resultado.neutrales.serfiscal;
  const ser = resultado.serfiscal || {};
  const innovaNeutro = resultado.neutrales.innovacion;
  const metaSer = parametros.serfiscal?.meta;
  const ofertas = innovaNeutro ? 0 : (Number(resultado.comercial.ofertasAprobadas) || 0);
  const primeras = innovaNeutro || ofertas === 0 ? 0 : (Number(resultado.comercial.primerasVentas) || 0);
  const puntosDiv = resultado.puntos.serfiscal === null || resultado.puntos.innovacion === null ? null : resultado.puntos.serfiscal + resultado.puntos.innovacion;
  const pesoDiv = parametros.pesos.serfiscal + parametros.pesos.innovacion;
  const neutroDiv = neutro && innovaNeutro;
  const cumplimiento = neutro || ser.cumplimiento === null || ser.cumplimiento === undefined ? "Pendiente" : porcentaje(ser.cumplimiento);
  const resumen = `${cumplimiento} · ${puntosDiv === null ? "Pendiente" : `${decimal(puntosDiv, 2)} de ${pesoDiv} pts`}${neutroDiv ? " (neutral)" : ""}`;
  const cuerpo = `
    <h3>SERFISCAL</h3>
    <ul class="lista-concepto">
      <li><span>Cumplimiento SERFISCAL (%)</span>${entradaFicha(resultado, "serfiscal", "Cumplimiento SERFISCAL", false, true)}</li>
      <li><span>Meta</span><span>${metaSer === null || metaSer === undefined || metaSer === "" ? "Pendiente" : `${escaparHtml(metaSer)} %`}</span></li>
      <li><span>Cumplimiento</span><span>${neutro ? "Pendiente" : distintivo(ser.cumplimiento, "regla100")}</span></li>
      <li class="fila-puntos"><span>Puntaje</span><span>${neutro ? `${decimal(resultado.puntos.serfiscal, 2)} (neutral)` : decimal(resultado.puntos.serfiscal, 2)}</span></li>
    </ul>
    <h3>Innovación comercial</h3>
    <ul class="lista-concepto">
      <li><span>Oferta aprobada y habilitada</span>${entradaFicha(resultado, "ofertasAprobadas", "Oferta aprobada y habilitada", false, true)}</li>
      <li><span>Puntos por oferta aprobada</span><span>${decimal(ofertas * parametros.innovacion.puntosOferta, 0)}</span><small>${decimal(parametros.innovacion.puntosOferta, 0)} por cada oferta</small></li>
      <li><span>Primera venta recaudada</span>${entradaFicha(resultado, "primerasVentas", "Primera venta rentable y efectivamente recaudada", false, true)}</li>
      <li><span>Puntos por primera venta</span><span>${decimal(primeras * parametros.innovacion.puntosPrimeraVenta, 0)}</span><small>${decimal(parametros.innovacion.puntosPrimeraVenta, 0)} por cada primera venta</small></li>
      <li><span>Ya usada en el trimestre</span>${entradaFicha(resultado, "innovacionAcumuladaTrimestre", "Innovación ya usada en el trimestre", false, true)}</li>
      <li class="fila-puntos"><span>Puntaje</span><span>${innovaNeutro ? `${decimal(resultado.puntos.innovacion, 2)} (neutral)` : decimal(resultado.puntos.innovacion, 2)}</span></li>
    </ul>`;
  return seccion(resultado, "56", "5.6 Diversificación e innovación", {
    badge: neutroDiv ? `<span class="badge badge--neutro">Neutral</span>` : "",
    resumen,
    cuerpo,
    falta: faltaDato([
      resultado.comercial.serfiscal,
      resultado.comercial.ofertasAprobadas,
      resultado.comercial.primerasVentas,
      resultado.comercial.innovacionAcumuladaTrimestre,
    ]),
  });
}

function seccionSatisfaccion(resultado) {
  const parametros = obtenerParametros();
  const dato = resultado.satisfaccion || {};
  const neutro = resultado.neutrales.satisfaccion;
  const cumplimiento = neutro || dato.cumplimiento === null || dato.cumplimiento === undefined ? "Pendiente" : porcentaje(dato.cumplimiento);
  const puntosTexto = resultado.puntos.satisfaccion === null ? "Pendiente" : `${decimal(resultado.puntos.satisfaccion, 2)} de ${parametros.pesos.satisfaccion} pts`;
  const resumen = `${cumplimiento} · ${puntosTexto}${neutro ? " (neutral)" : ""}`;
  const cuerpo = `
    <ul class="lista-concepto">
      <li><span>Satisfacción mínima esperada</span><span>${escaparHtml(parametros.satisfaccionEsperada)}</span></li>
      <li><span>Satisfacción obtenida</span>${entradaFicha(resultado, "satisfaccion", "Satisfacción obtenida", false, true)}</li>
      <li><span>Cumplimiento</span><span>${neutro ? "Pendiente" : `${distintivo(dato.cumplimiento, "regla100")} ${barraCumplimiento(dato.cumplimiento)}`}</span></li>
      <li class="fila-puntos"><span>Puntaje</span><span>${neutro ? `${decimal(resultado.puntos.satisfaccion, 2)} (neutral)` : decimal(resultado.puntos.satisfaccion, 2)}</span></li>
    </ul>`;
  return seccion(resultado, "57", "5.7 Satisfacción", {
    badge: neutro ? `<span class="badge badge--neutro">Neutral</span>` : "",
    resumen,
    cuerpo,
    falta: faltaDato([resultado.comercial.satisfaccion]),
  });
}

function seccionBtl(resultado) {
  const eventos = resultado.btlMes || [];
  const parametros = obtenerParametros();
  const imr = resultado.comercial.basico === null || resultado.comercial.oportunidad === null
    ? null
    : resultado.comercial.basico + resultado.comercial.oportunidad;
  const tope = parametros.btlComercial.topeEvento;
  const bloques = eventos.map((item) => {
    const numero = item.evento.evento || "";
    if (faltaUtilidadPresupuestada(item)) {
      return `
        <h3>Evento ${escaparHtml(numero)}</h3>
        <div class="estado-vacio estado-vacio--aviso estado-vacio--btl">
          <p><span aria-hidden="true">⚠</span> <strong>Falta la utilidad del evento ${escaparHtml(numero)}.</strong> Carga parametros.xlsx.</p>
          <div class="acciones-btl">
            <button type="button" class="boton boton--primario boton--sm" data-ir="cargar">Ir a Cargar datos</button>
            <button type="button" class="boton boton--texto" data-ir="btl">Ir a BTL →</button>
          </div>
        </div>
        <table class="tabla tabla-concepto"><tbody>
          ${parConcepto("IMR", moneda(imr))}
          ${parConcepto("Ingreso del evento", moneda(item.evento.ingreso))}
          ${parConcepto(`Tope ${porcentaje(tope)}`, imr === null ? "Pendiente" : moneda(tope * imr))}
        </tbody></table>
        ${checksCondicionesBtl(item, "comercial", resultado.score)}`;
    }
    const motivo = item.motivoComercial || "";
    return `
      <h3>Evento ${escaparHtml(numero)}</h3>
      <table class="tabla tabla-concepto"><tbody>
        ${parConcepto("IMR", moneda(imr))}
        ${parConcepto("Ingreso del evento", moneda(item.evento.ingreso))}
        ${parConcepto(`Tope ${porcentaje(tope)}`, imr === null ? "Pendiente" : moneda(tope * imr))}
        ${parConcepto("Tope anual disponible", moneda(item.topeAnualComercial))}
        ${parConcepto("Utilidad base presupuestada", moneda(item.evento.utilidadPresupuestada))}
        ${item.evento.presupuestoBtl?.excedenteNetoArchivo !== null && item.evento.presupuestoBtl?.excedenteNetoArchivo !== undefined ? parConcepto("Excedente neto presupuestado del archivo (solo comparar)", `${moneda(item.evento.presupuestoBtl.excedenteNetoArchivo)} · dif. ${moneda(item.evento.presupuestoBtl.diferenciaArchivo)}`) : ""}
        ${parConcepto("Utilidad base real", item.utilidad === undefined ? "Pendiente" : moneda(item.utilidad))}
        ${parConcepto("Cumplimiento", item.cumplimiento === undefined ? "Pendiente" : porcentaje(item.cumplimiento))}
        ${parConcepto(`Margen bruto${item.margenDecide === "bruto" ? " (decide)" : ""}`, item.margenBruto === undefined ? "Pendiente" : porcentaje(item.margenBruto))}
        ${parConcepto(`Margen neto${item.margenDecide === "neto" ? " (decide)" : " (informativo)"}`, item.margenNeto === undefined ? "Pendiente" : porcentaje(item.margenNeto))}
        ${parConcepto("% liquidador", item.porcentajeComercial === null || item.porcentajeComercial === undefined ? "Pendiente" : porcentaje(item.porcentajeComercial))}
        ${item.porcentajeReparto !== undefined && item.porcentajeReparto !== 1 ? parConcepto("Participación en el evento (reparto 5.12)", porcentaje(item.porcentajeReparto)) : ""}
        ${item.factorSalvaguarda !== undefined && item.factorSalvaguarda < 1 ? parConcepto(`Ajuste salvaguarda ${porcentaje(parametros.btlComercial.salvaguarda)}`, `× ${decimal(item.factorSalvaguarda, 4)}`) : ""}
      </tbody></table>
      <div class="recuadro-pago recuadro-pago--chico"><h3>Comisión (pago directo)</h3><p>${moneda(item.pagoComercial)}</p></div>
      ${item.cargaComercial ? `<p class="nota-union">Carga prestacional informativa (${porcentaje(parametros.btlComercial.cargaPrestacional)}), aparte del tope: ${moneda(item.cargaComercial)}.</p>` : ""}
      ${motivo ? `<p><span class="badge badge--peligro">${escaparHtml(motivo)}</span></p>` : ""}
      ${checksCondicionesBtl(item, "comercial", resultado.score)}`;
  }).join("");
  const formulaAnterior = eventos.length
    ? `<details class="detalle-formula"><summary>Ver fórmula · BTL esquema anterior</summary>${formulaBtlAnteriorHtml(resultado)}</details>`
    : "";
  const sinUtilidad = eventos.filter(faltaUtilidadPresupuestada).length;
  const pago = sumaNumeros(eventos, (item) => item.pagoComercial);
  const resumen = !eventos.length
    ? "Sin eventos BTL este mes"
    : sinUtilidad
      ? `Falta utilidad en ${plural(sinUtilidad, "evento", "eventos")}`
      : `${plural(eventos.length, "evento", "eventos")} · ${moneda(pago)}`;
  return seccion(resultado, "btl", "5.11.5 Bonificación BTL", {
    resumen,
    cuerpo: eventos.length ? bloques + formulaAnterior : `<p>Este comercial no tiene eventos BTL en el mes.</p>`,
  });
}

function seccionMargenes(resultado) {
  const parametros = obtenerParametros();
  const margenes = resultado.margenesEventos || [];
  const umbral = parametros.margen.umbralAlto;
  const mayor = margenes.filter((item) => item.margen !== null && item.margen !== undefined && item.margen > umbral).length;
  const noAplica = margenes.filter((item) => String(item.banda || "").startsWith("No aplica")).length;
  const filas = margenes.map((item) => {
    const facturas = item.facturas || [];
    const etiqueta = plural(facturas.length, "factura", "facturas");
    return `
    <tr>
      <td>${escaparHtml(item.numero)}</td>
      <td class="recorte" title="${escaparHtml(item.evento)}">${escaparHtml(item.evento)}</td>
      <td><details><summary>${escaparHtml(etiqueta)}</summary><span class="lista-facturas">${escaparHtml(facturas.join(", "))}</span></details></td>
      <td class="dinero">${moneda(item.ingreso)}</td>
      <td class="dinero">${moneda(item.costo)}</td>
      <td class="dinero">${moneda(item.ica)}</td>
      <td class="dinero">${moneda(item.gmf)}</td>
      <td class="dinero">${moneda(item.costoTotal)}</td>
      <td class="num">${item.margen === null ? "Pendiente" : porcentaje(item.margen)}</td>
      <td><span class="badge ${claseBanda(item)}">${escaparHtml(item.banda || "Pendiente")}</span></td>
    </tr>`;
  }).join("");
  const cuerpo = `
    <p>Costo = columna COSTO del informe (costo directo). Costo total = costo + ICA + GMF; no es la columna COSTO TOTAL del informe.</p>
    <table class="tabla tabla-fija tabla-margenes">
      <thead><tr><th>#</th><th>Evento</th><th>Facturas</th><th>Ingreso</th><th>Costo</th><th>ICA</th><th>GMF</th><th>Costo total</th><th>Margen bruto</th><th>Banda</th></tr></thead>
      <tbody>${filas || `<tr><td colspan="10">Sin eventos.</td></tr>`}</tbody>
    </table>`;
  return seccion(resultado, "margenes", "Márgenes de sus eventos", {
    resumen: `${plural(margenes.length, "evento", "eventos")} · ${mayor} mayor al ${porcentaje(umbral)} · ${noAplica} No aplica`,
    cuerpo,
  });
}

function seccionFacturas(resultado) {
  const { grupos, claves } = gruposFacturas(resultado);
  const detalle = resultado.detalleFacturas || [];
  const totales = resultado.totalesFacturas || { base: 0, recaudo: 0, reconocida: 0 };
  const sinFecha = detalle.filter((fila) => !(fila.fechaPago instanceof Date)).length;
  const filaDetalle = (fila, uso) => {
    const busqueda = `${fila.factura || ""} ${fila.cuenta || ""} ${fila.evento || ""}`.toLowerCase();
    const cancelada = /cancel/i.test(String(fila.estado || ""));
    const sinFechaFila = !(fila.fechaPago instanceof Date);
    return `
    <tr data-fila data-uso="${escaparHtml(uso)}" data-busqueda="${escaparHtml(busqueda)}" data-cancelada="${cancelada ? "1" : "0"}" data-sinfecha="${sinFechaFila ? "1" : "0"}">
      <td>${escaparHtml(fila.factura)}</td>
      <td>${escaparHtml(fila.origen || "")}</td>
      <td title="${escaparHtml(fila.producto)}">${escaparHtml(fila.producto)}</td>
      <td title="${escaparHtml(fila.cuenta)}">${escaparHtml(fila.cuenta)}</td>
      <td title="${escaparHtml(fila.evento)}">${escaparHtml(fila.evento)}</td>
      <td class="dinero">${moneda(fila.base)}</td>
      <td>${escaparHtml(fila.estado)}</td>
      <td>${escaparHtml(fechaCorta(fila.fechaPago))}</td>
      <td>${fila.elegible ? "Sí" : "No"}</td>
      <td class="dinero">${moneda(fila.recaudo)}</td>
      <td class="num">${fila.factorAplicado === null || fila.factorAplicado === undefined ? "" : porcentaje(fila.factorAplicado)}</td>
      <td class="dinero">${moneda(fila.ventaReconocida)}</td>
    </tr>`;
  };
  const cuerpo = claves.map((uso) => {
    const items = grupos.get(uso);
    const suma = (campo) => items.reduce((total, fila) => total + (Number(fila[campo]) || 0), 0);
    return `
      <tr class="fila-grupo" data-grupo data-uso="${escaparHtml(uso)}"><th colspan="12">${escaparHtml(uso)}</th></tr>
      ${items.map((fila) => filaDetalle(fila, uso)).join("")}
      <tr class="fila-total" data-total data-uso="${escaparHtml(uso)}"><td colspan="5">Subtotal · ${items.length}</td><td class="dinero">${moneda(suma("base"))}</td><td></td><td></td><td></td><td class="dinero">${textoGrupo(uso, suma("recaudo"))}</td><td></td><td class="dinero">${textoGrupo(uso, suma("ventaReconocida"))}</td></tr>`;
  }).join("");
  const cuerpoSeccion = `
    <div class="filtros-facturas no-imprimir">
      <label>Buscar
        <input type="search" class="entrada" data-filtro="texto" placeholder="Factura, cuenta o evento">
      </label>
      <label>Uso
        <select class="entrada" data-filtro="uso">
          <option value="">Todos</option>
          ${claves.map((uso) => `<option value="${escaparHtml(uso)}">${escaparHtml(uso)}</option>`).join("")}
        </select>
      </label>
      <label>Estado
        <select class="entrada" data-filtro="estado">
          <option value="">Todos</option>
          <option value="cancelada">Cancelada</option>
          <option value="no-cancelada">No cancelada</option>
          <option value="sin-fecha">Sin fecha</option>
        </select>
      </label>
      <p class="contador-facturas" data-contador aria-live="polite">Mostrando ${detalle.length} de ${detalle.length}</p>
    </div>
    <table class="tabla tabla-fija tabla-facturas">
      <thead><tr><th>Factura</th><th>Hoja</th><th>Producto</th><th>Cuenta</th><th>Evento</th><th>Base</th><th>Estado</th><th>Fecha de pago</th><th>Elegible</th><th>Recaudo</th><th>Factor</th><th>Venta reconocida</th></tr></thead>
      <tbody>${cuerpo}</tbody>
      <tfoot><tr class="fila-total"><td colspan="5">Total sin BTL</td><td class="dinero">${moneda(totales.base)}</td><td></td><td></td><td></td><td class="dinero">${moneda(totales.recaudo)}</td><td></td><td class="dinero">${moneda(totales.reconocida)}</td></tr></tfoot>
    </table>`;
  return seccion(resultado, "facturas", "Facturas del mes", {
    resumen: `${plural(detalle.length, "factura", "facturas")} · base ${moneda(totales.base)} sin BTL · ${sinFecha} sin fecha`,
    cuerpo: cuerpoSeccion,
  });
}

function slugFicha(nombre) {
  return String(nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function idSeccion(resultado, clave) {
  return `ficha-${slugFicha(resultado.nombre)}-${clave}`;
}

function faltaDato(valores) {
  return valores.some((valor) => valor === null || valor === undefined || valor === "");
}

function seccionesGuardadas() {
  try {
    return JSON.parse(sessionStorage.getItem("analfe-secciones") || "{}");
  } catch (error) {
    return {};
  }
}

function seccionAbierta(clave, defecto) {
  const guardadas = seccionesGuardadas();
  return Object.prototype.hasOwnProperty.call(guardadas, clave) ? guardadas[clave] === true : defecto;
}

/** Sección plegable de la ficha. El resumen va en la misma línea del título. */
function seccion(resultado, clave, titulo, { badge = "", resumen = "", cuerpo = "", defecto = false, falta = false } = {}) {
  const abierta = seccionAbierta(clave, defecto);
  const aviso = falta ? ` <span class="badge badge--aviso">Falta dato</span>` : "";
  return `
    <details class="seccion" id="${idSeccion(resultado, clave)}" data-clave="${clave}"${abierta ? " open" : ""}>
      <summary>
        <span class="seccion__titulo">${titulo}${badge ? ` ${badge}` : ""}${aviso}</span>
        <span class="seccion__resumen">${resumen}</span>
      </summary>
      <div class="seccion__cuerpo">${cuerpo}</div>
    </details>`;
}

/** Filtra la tabla de facturas de una sección sin recalcular nada. */
function aplicarFiltrosFacturas(seccionEl) {
  const texto = seccionEl.querySelector('[data-filtro="texto"]').value.trim().toLowerCase();
  const uso = seccionEl.querySelector('[data-filtro="uso"]').value;
  const estado = seccionEl.querySelector('[data-filtro="estado"]').value;
  const activo = texto !== "" || uso !== "" || estado !== "";
  const filas = [...seccionEl.querySelectorAll("tr[data-fila]")];
  let visibles = 0;
  filas.forEach((fila) => {
    const coincide = (!texto || fila.dataset.busqueda.includes(texto))
      && (!uso || fila.dataset.uso === uso)
      && (estado !== "cancelada" || fila.dataset.cancelada === "1")
      && (estado !== "no-cancelada" || fila.dataset.cancelada === "0")
      && (estado !== "sin-fecha" || fila.dataset.sinfecha === "1");
    fila.hidden = !coincide;
    if (coincide) visibles += 1;
  });
  seccionEl.querySelectorAll("tr[data-grupo], tr[data-total]").forEach((fila) => {
    fila.hidden = activo;
  });
  seccionEl.querySelector("[data-contador]").textContent = `Mostrando ${visibles} de ${filas.length}`;
}

/** Abre la sección si está cerrada, la lleva a la vista y pone el foco en su resumen. */
function abrirSeccion(id) {
  const destino = document.getElementById(id);
  if (!destino) return;
  if (destino.tagName === "DETAILS") destino.open = true;
  destino.scrollIntoView({ behavior: "smooth", block: "start" });
  const resumen = destino.querySelector(":scope > summary");
  if (resumen) resumen.focus({ preventScroll: true });
}

let observadorFicha = null;

/** Marca en la sub-navegación la sección que se ve en pantalla. */
function conectarActivaIndicador(panel) {
  if (observadorFicha) observadorFicha.disconnect();
  observadorFicha = null;
  const activa = panel.querySelector(".ficha-activa");
  if (!activa || !("IntersectionObserver" in window)) return;
  const enlaces = new Map([...activa.querySelectorAll(".subnav a")].map((enlace) => [enlace.getAttribute("href").slice(1), enlace]));
  const visibles = new Map();
  observadorFicha = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) visibles.set(entrada.target.id, entrada.boundingClientRect.top);
      else visibles.delete(entrada.target.id);
    });
    // Gana la sección visible que empieza más abajo dentro de la franja: es la que se está leyendo.
    let actual = "";
    let mejor = -Infinity;
    visibles.forEach((top, id) => {
      if (enlaces.has(id) && top > mejor) {
        mejor = top;
        actual = id;
      }
    });
    enlaces.forEach((enlace) => enlace.removeAttribute("aria-current"));
    if (actual) enlaces.get(actual).setAttribute("aria-current", "true");
  }, { rootMargin: "-100px 0px -60% 0px" });
  enlaces.forEach((_, id) => {
    const nodo = document.getElementById(id);
    if (nodo) observadorFicha.observe(nodo);
  });
}

function htmlFicha(resultado, activa) {
  return `
    <section class="ficha${activa ? " ficha-activa" : " ficha-reposo"}" data-ficha="${escaparHtml(resultado.nombre)}">
      <div class="ficha-pantalla">
        ${subnav(resultado)}
        ${encabezadoPagos(resultado)}
        <div class="ficha-cuerpo">
          <div class="ficha-principal">
            ${resumenFicha(resultado)}
            ${prorrateoBloque(resultado)}
            ${seccionVentas(resultado)}
            ${seccionBase(resultado)}
            ${seccionInnovacion(resultado)}
            ${seccionSatisfaccion(resultado)}
            ${seccionTransicion(resultado)}
            ${seccionBtl(resultado)}
          </div>
        </div>
        ${seccionMargenes(resultado)}
        ${seccionFacturas(resultado)}
        <p class="pie-ficha">Simulación. No es un pago oficial · ${escaparHtml(resultado.nombre)} · ${escaparHtml(mesActual())}</p>
      </div>
      ${fichaImpresion(resultado)}
    </section>`;
}

function pintarEquipo(liquidacion) {
  const panel = document.querySelector("#panel-equipo");
  const resultados = [...liquidacion.resultados].sort(compararEquipo);
  const parametros = obtenerParametros();
  const transicion = parametros.transicion || {};
  const totalPagar = sumaNumeros(resultados, (item) => item.pagoAjustado ?? item.transicion.pagada);
  const paganNueva = resultados.filter((item) => item.transicion.esquema === "nueva").length;
  const paganAnterior = resultados.filter((item) => item.transicion.esquema === "anterior").length;
  const scores = resultados.map((item) => item.score).filter((valor) => valor !== null && valor !== undefined);
  const promedio = scores.length ? scores.reduce((suma, valor) => suma + valor, 0) / scores.length : null;
  const director = liquidacion.director || {};
  const pagoDirector = director.transicion?.pagada ?? null;
  const esquemaDirector = director.transicion?.esquema;
  const th = (clave, texto) => `<th class="th-ordenable" data-orden="${clave}">${texto}</th>`;
  const filas = resultados.map((item) => {
    const sinFecha = (item.avisos || []).filter((aviso) => aviso.includes("no tiene fecha"));
    const esquema = item.transicion.esquema;
    const marca = esquema === "nueva"
      ? `<span class="badge badge--paga">Nueva</span>`
      : esquema === "anterior"
        ? `<span class="badge badge--neutro">Anterior</span>`
        : `<span class="badge badge--peligro">Falta un dato</span>`;
    const avisos = sinFecha.length
      ? `<details><summary><span class="badge badge--aviso">${escaparHtml(plural(sinFecha.length, "sin fecha", "sin fecha"))}</span></summary>${listaAvisos(sinFecha)}</details>`
      : "";
    return `<tr tabindex="0" data-ficha-nombre="${escaparHtml(item.nombre)}" aria-label="Abrir ficha de ${escaparHtml(item.nombre)}">
      <td class="equipo-nombre">${escaparHtml(item.nombre)}</td>
      <td class="num">${item.score === null ? "Pendiente" : decimal(item.score, 2)} ${item.score === null ? "" : `<span class="barra barra--marca" style="--pct:${item.score};--marca:${escalaScore().posicion(escalaScore().minimo)}"><span class="barra__relleno"></span><i class="barra__marca"></i></span>`}</td>
      <td class="num">${item.factor === null ? "Pendiente" : porcentajeFactor(item.factor)}</td>
      <td class="dinero">${moneda(item.pagoNuevo)}</td>
      <td class="dinero">${item.anteriorTramos ? moneda(item.anteriorTramos.meta) : ""}</td>
      <td class="dinero">${item.anteriorTramos ? moneda(item.anteriorTramos.produccion) : ""}</td>
      <td class="num">${item.anteriorTramos ? porcentaje(item.anteriorTramos.cumplimiento) : ""}</td>
      <td class="num">${item.anteriorTramos ? porcentaje(item.anteriorTramos.tasa) : ""}</td>
      <td class="dinero">${textoComisionAnterior(item)}</td>
      <td>${marca} <strong class="dinero">${moneda(item.pagoAjustado ?? item.transicion.pagada)}</strong>${item.ajuste?.valor ? `<br><small class="ayuda-campo">ajuste ${dineroFirmado(item.ajuste.valor)}</small>` : ""}</td>
      <td>${avisos}</td>
    </tr>`;
  }).join("");
  const maximoPago = Math.max(0, ...resultados.flatMap((item) => [item.pagoNuevo || 0, item.pagoAnterior || 0]));
  const porcentajePago = (valor) => (maximoPago > 0 && valor ? Math.round((valor / maximoPago) * 1000) / 10 : 0);
  const grafico = resultados.map((item) => `
      <div class="grafico-fila">
        <span class="grafico-fila__nombre">${escaparHtml(item.nombre)}</span>
        <span class="grafico-fila__barras">
          <span class="grafico-barra grafico-barra--nueva" style="width:${porcentajePago(item.pagoNuevo)}%"></span>
          <span class="grafico-barra grafico-barra--anterior" style="width:${porcentajePago(item.pagoAnterior)}%"></span>
        </span>
        <span class="grafico-fila__monto dinero">${moneda(item.pagoAjustado ?? item.transicion.pagada)}</span>
      </div>`).join("");
  const resumenGrafico = paganNueva === 0
    ? `Ninguno paga con la política nueva. ${paganAnterior} pagan con el esquema anterior.`
    : `${paganNueva} pagan con la política nueva y ${paganAnterior} con el esquema anterior.`;
  panel.innerHTML = `
    <div class="titulo-con-accion">
      <div>
        <h2 class="titulo-pagina">Resultados del equipo · ${escaparHtml(mesTitulo(mesActual()))}</h2>
        <p>${escaparHtml(plural(resultados.length, "comercial", "comerciales"))} · transición ${escaparHtml(mesCorto(transicion.desde))}–${escaparHtml(mesCorto(transicion.hasta))}: se paga el mayor de los dos esquemas.</p>
      </div>
      <button type="button" class="boton" id="btn-exportar-resultado">Exportar resultado a Excel</button>
    </div>
    <div class="kpis kpis--cinco equipo-kpis">
      <article class="tarjeta kpi"><p class="kpi__etiqueta">Total a pagar (sin BTL)</p><p class="kpi__valor">${moneda(totalPagar)}</p></article>
      <article class="tarjeta kpi${paganNueva > 0 ? " kpi--exito" : ""}"><p class="kpi__etiqueta">Pagan política nueva</p><p class="kpi__valor">${paganNueva} de ${resultados.length}</p></article>
      <article class="tarjeta kpi"><p class="kpi__etiqueta">Pagan esquema anterior</p><p class="kpi__valor">${paganAnterior} de ${resultados.length}</p></article>
      <article class="tarjeta kpi"><p class="kpi__etiqueta">Score promedio</p><p class="kpi__valor">${promedio === null ? "Pendiente" : decimal(promedio, 2)}</p><p class="kpi__etiqueta">Mínimo para pagar: ${escaparHtml(parametros.curva.minimo)}</p></article>
      <article class="tarjeta kpi"><p class="kpi__etiqueta">Director</p><p class="kpi__valor">${moneda(director.pagoAjustado ?? pagoDirector)}</p><p class="kpi__etiqueta">${escaparHtml(nombreEsquema(esquemaDirector || ""))}${director.elegido?.score !== undefined ? ` · score ${escaparHtml(decimal(director.elegido.score, 2))}` : ""}</p></article>
    </div>
    <div class="equipo-cuerpo">
      <article class="tarjeta equipo-grafico">
        <h2>Nueva contra anterior</h2>
        <div class="leyenda-grafico" aria-hidden="true">
          <span><i class="grafico-barra grafico-barra--nueva"></i> Política nueva</span>
          <span><i class="grafico-barra grafico-barra--anterior"></i> Esquema anterior</span>
        </div>
        <div class="grafico-barras" role="img" aria-label="${escaparHtml(resumenGrafico)}">${grafico}</div>
        <p class="ayuda-equipo">Escala común: el mayor pago de las dos columnas. El monto es lo que se paga.</p>
      </article>
      <article class="tarjeta equipo-ranking">
        <div class="ranking-scroll">
          <table class="tabla tabla-fija tabla-ranking">
            <thead><tr>${th("nombre", "Comercial")}${th("score", "Score")}${th("factor", "Factor de pago")}${th("nueva", "Política nueva")}${th("metaAnt", "Meta anterior")}${th("prodAnt", "Producción")}${th("cumpAnt", "Cumplimiento")}${th("tasaAnt", "Tasa")}${th("anterior", "Comisión anterior")}${th("paga", "Se paga")}<th>Avisos</th></tr></thead>
            <tbody>${filas}</tbody>
            <tfoot><tr class="fila-total"><td>Total</td><td class="num">${promedio === null ? "" : decimal(promedio, 2)}</td><td></td><td class="dinero">${moneda(sumaNumeros(resultados, (item) => item.pagoNuevo))}</td><td></td><td class="dinero">${moneda(sumaNumeros(resultados, (item) => item.anteriorTramos?.produccion))}</td><td></td><td></td><td class="dinero">${moneda(sumaNumeros(resultados, (item) => item.pagoAnterior))}</td><td class="dinero">${moneda(totalPagar)}</td><td></td></tr></tfoot>
          </table>
        </div>
        <p class="ayuda-equipo">Clic en una fila para abrir su ficha.</p>
      </article>
    </div>`;
  panel.querySelector("#btn-exportar-resultado").addEventListener("click", () => exportarResultado(liquidacion, mesActual()));
  panel.querySelectorAll("[data-orden]").forEach((cabeza) => {
    cabeza.addEventListener("click", () => {
      const clave = cabeza.dataset.orden;
      if (!clave) return;
      ordenEquipo = { clave, direccion: ordenEquipo.clave === clave ? ordenEquipo.direccion * -1 : -1 };
      pintarEquipo(liquidacion);
    });
  });
  panel.querySelectorAll("[data-ficha-nombre]").forEach((fila) => {
    const abrir = () => {
      comercialVisible = fila.dataset.fichaNombre;
      pintarVistas();
      document.dispatchEvent(new CustomEvent("mostrar-panel", { detail: "detalle" }));
    };
    fila.addEventListener("click", (evento) => {
      if (evento.target.closest("summary, a, button, input")) return;
      abrir();
    });
    fila.addEventListener("keydown", (evento) => {
      if (evento.key !== "Enter" || evento.target !== fila) return;
      evento.preventDefault();
      abrir();
    });
  });
}

function pintarDetalle(liquidacion) {
  const panel = document.querySelector("#panel-detalle");
  const nombres = liquidacion.resultados.map((item) => item.nombre);
  if (!nombres.includes(comercialVisible)) comercialVisible = nombres[0] || "";
  if (!nombres.length) {
    panel.innerHTML = `<article class="tarjeta"><h2>Ficha por comercial</h2><p>Carga la facturación del mes.</p></article>`;
    return;
  }
  const activo = liquidacion.resultados.find((item) => item.nombre === comercialVisible) || liquidacion.resultados[0];
  const opciones = nombres.map((nombre) => `<option value="${escaparHtml(nombre)}" ${nombre === comercialVisible ? "selected" : ""}>${escaparHtml(nombre)}</option>`).join("");
  const { imr, maximo } = cifrasPersona(activo.comercial);
  const linea = [
    encabezadoDe(activo.comercial).cargo || "Comercial",
    `Salario ${moneda(activo.comercial.basico)}`,
    `IMR ${moneda(imr)}`,
    `Máximo ${porcentaje(obtenerParametros().topeIndicador)} ${moneda(maximo)}`,
  ].join(" · ");
  panel.innerHTML = `
    <div class="ficha-barra no-imprimir">
      <div class="ficha-barra__selector">
        <button type="button" class="boton-icono" id="ficha-anterior" aria-label="Comercial anterior">◀</button>
        <select class="entrada campo-editable" id="elige-comercial" aria-label="Comercial">${opciones}</select>
        <button type="button" class="boton-icono" id="ficha-siguiente" aria-label="Comercial siguiente">▶</button>
      </div>
      <div class="ficha-barra__titulo">
        <h2>${escaparHtml(activo.nombre)}</h2>
        <p>${escaparHtml(linea)}</p>
      </div>
      <div class="ficha-barra__acciones">
        <button type="button" class="boton boton--primario" id="imprimir-ficha">Imprimir ficha</button>
        <button type="button" class="boton" id="descargar-excel-ficha">Descargar Excel de ${escaparHtml(activo.nombre)}</button>
        <details class="menu-ficha">
          <summary class="boton" aria-label="Más opciones de impresión">Más ⋯</summary>
          <div class="menu-ficha__panel">
            <button type="button" class="boton" id="imprimir-todas">Imprimir todas las fichas</button>
            <label class="casilla-impresion"><input type="checkbox" id="imprimir-detalle" ${incluirDetalleImpresion ? "checked" : ""}> Incluir detalle de facturas</label>
          </div>
        </details>
      </div>
    </div>
    ${liquidacion.resultados.map((item) => htmlFicha(item, item.nombre === comercialVisible)).join("")}`;
  panel.querySelector("#elige-comercial").addEventListener("change", (evento) => {
    comercialVisible = evento.target.value;
    pintarVistas();
  });
  panel.querySelector("#ficha-anterior").addEventListener("click", () => cambiarFicha(nombres, -1));
  panel.querySelector("#ficha-siguiente").addEventListener("click", () => cambiarFicha(nombres, 1));
  panel.querySelector("#imprimir-ficha").addEventListener("click", () => imprimirFichas(false));
  panel.querySelector("#descargar-excel-ficha").addEventListener("click", (evento) => bajarExcel(activo.nombre, liquidacion, false, evento.currentTarget));
  panel.querySelector("#imprimir-todas").addEventListener("click", () => imprimirFichas(true));
  panel.querySelector("#imprimir-detalle").addEventListener("change", (evento) => {
    incluirDetalleImpresion = evento.target.checked;
  });
  panel.querySelectorAll("input[data-campo], select[data-campo]").forEach((campo) => {
    campo.addEventListener("change", () => {
      // El valor se guarda en la persona de parámetros: así sobrevive a armar() y se guarda con Guardar.
      const persona = obtenerParametros().comerciales.find((item) => item.nombre === campo.dataset.persona);
      if (!persona) return;
      if (campo.dataset.texto || campo.tagName === "SELECT") persona[campo.dataset.campo] = campo.value;
      else {
        const texto = campo.value.trim();
        persona[campo.dataset.campo] = texto === "" ? null : Number(texto);
      }
      avisarCambiosSinGuardar();
      // Se aplaza para que Tab termine de mover el foco al campo siguiente antes de repintar.
      setTimeout(pintarVistas, 0);
    });
  });
  panel.querySelectorAll('details.seccion[data-clave="facturas"]').forEach((seccionEl) => {
    const aplicar = () => aplicarFiltrosFacturas(seccionEl);
    seccionEl.querySelectorAll("[data-filtro]").forEach((control) => {
      control.addEventListener("input", aplicar);
      control.addEventListener("change", aplicar);
    });
    aplicar();
  });
  if (!panel.dataset.escuchas) {
    panel.dataset.escuchas = "1";
    panel.addEventListener("toggle", (evento) => {
      const destino = evento.target;
      if (!(destino instanceof HTMLDetailsElement) || !destino.classList.contains("seccion")) return;
      const guardadas = seccionesGuardadas();
      guardadas[destino.dataset.clave] = destino.open;
      sessionStorage.setItem("analfe-secciones", JSON.stringify(guardadas));
    }, true);
    panel.addEventListener("click", (evento) => {
      const ir = evento.target.closest("[data-ir]");
      if (ir) {
        if (ir.dataset.ir === "parametros") sessionStorage.setItem("analfe-param-grupo", "anterior");
        document.dispatchEvent(new CustomEvent("mostrar-panel", { detail: ir.dataset.ir }));
        document.querySelector(`[data-grupo-tab="${sessionStorage.getItem("analfe-param-grupo")}"]`)?.click();
        return;
      }
      const ancla = evento.target.closest("[data-ancla]");
      if (ancla) {
        abrirSeccion(ancla.dataset.ancla);
        return;
      }
      const enlace = evento.target.closest('a[href^="#ficha-"]');
      if (!enlace) return;
      evento.preventDefault();
      abrirSeccion(enlace.getAttribute("href").slice(1));
    });
  }
  conectarActivaIndicador(panel);
  conectarCondicionesBtl(panel, liquidacion);
  conectarVacios(panel);
}


const atributoSelector = (valor) => String(valor).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/** Selector estable del elemento con foco, para recuperarlo después de repintar. */
function selectorFoco(nodo) {
  if (!nodo || nodo === document.body) return "";
  if (nodo.id) return `#${CSS.escape(nodo.id)}`;
  if (nodo.dataset?.campo && nodo.dataset?.persona) {
    return `input[data-campo="${atributoSelector(nodo.dataset.campo)}"][data-persona="${atributoSelector(nodo.dataset.persona)}"]`;
  }
  if (nodo.dataset?.filtro) {
    const seccionEl = nodo.closest("details.seccion");
    return seccionEl ? `#${CSS.escape(seccionEl.id)} [data-filtro="${atributoSelector(nodo.dataset.filtro)}"]` : "";
  }
  if (nodo.tagName === "SUMMARY" && nodo.parentElement?.id) return `#${CSS.escape(nodo.parentElement.id)} > summary`;
  return "";
}

/** Altura de lo que queda fijo arriba. El encabezado de Facturas se pega justo debajo. */
function medirCabeceraFija() {
  const barra = document.querySelector(".barra-app")?.getBoundingClientRect().height || 0;
  const subnav = document.querySelector(".ficha-pantalla .subnav")?.getBoundingClientRect().height || 0;
  document.documentElement.style.setProperty("--alto-cabecera-fija", `${Math.round(barra + subnav)}px`);
}

window.addEventListener("resize", medirCabeceraFija);

export function pintarVistas() {
  const selector = selectorFoco(document.activeElement);
  const scroll = window.scrollY;
  const restaurar = () => {
    medirCabeceraFija();
    window.scrollTo(0, scroll);
    if (!selector) return;
    let nodo = null;
    try {
      nodo = document.querySelector(selector);
    } catch (error) {
      nodo = null;
    }
    if (nodo) nodo.focus({ preventScroll: true });
  };
  if (obtenerFacturacion().length === 0) {
    ["panel-equipo", "panel-detalle", "panel-director", "panel-btl", "panel-exportar"].forEach((id) => {
      const panel = document.getElementById(id);
      if (!panel) return;
      if (id === "panel-exportar") {
        panel.innerHTML = `<article class="tarjeta"><h2>Excel individual</h2><p>Simulación. No es un pago oficial.</p><button type="button" class="boton" disabled>Carga la facturación para exportar</button><button type="button" class="boton" disabled>Carga la facturación para exportar</button></article>`;
        return;
      }
      panel.innerHTML = estadoVacio("Todavía no hay facturación", "Carga los archivos del mes para ver esta sección.", true);
      conectarVacios(panel);
    });
    restaurar();
    return;
  }
  const liquidacion = armar();
  pintarEquipo(liquidacion);
  pintarDetalle(liquidacion);
  pintarDirector(liquidacion);
  pintarBtl(liquidacion);
  pintarExportar(liquidacion);
  restaurar();
}

document.addEventListener("keydown", (evento) => {
  if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
  if (evento.target.closest("input, textarea, select, .riel")) return;
  if (!document.querySelector("#panel-detalle.activo")) return;
  const nombres = [...document.querySelectorAll("#panel-detalle .ficha")].map((ficha) => ficha.dataset.ficha);
  if (nombres.length < 2) return;
  evento.preventDefault();
  cambiarFicha(nombres, evento.key === "ArrowRight" ? 1 : -1);
});
