/**
 * Parámetros de la liquidación.
 * Los cálculos (fase 3) solo leen este objeto: no llevan cifras propias.
 * Lo que no conocemos queda en null y se marca en pantalla como pendiente.
 */

import { avisarCambiosGuardados, avisarCambiosSinGuardar, avisoBreve, escaparHtml, nombreVisible, numeroFlexible, numeroPesos } from "./utilidades.js";

import { EQUIPO_INICIAL } from "./equipo.js";

const CLAVE_GUARDADO = "liquidador-analfe-parametros";
const clonarEquipo = (x) => JSON.parse(JSON.stringify(x));

/** Copia profunda para no modificar el original al editar. */
function clonar(objeto) {
  return JSON.parse(JSON.stringify(objeto));
}

/**
 * Valores iniciales.
 * Comerciales y base social: matrices y parametros.xlsx de octubre 2026.
 * Reglas (pesos, curva, ICA, GMF, Misión, BTL): política PCV-COM-001.
 * EduAT de noviembre y diciembre de varios comerciales: PENDIENTE (null).
 */
export const PARAMETROS_INICIALES = {
  pesos: {
    ventas: 45,
    baseSocial: 20,
    serfiscal: 10,
    innovacion: 10,
    satisfaccion: 15,
  },
  topeIndicador: 1.2,
  formato: {
    decimalesPorcentaje: 2,
  },
  excel: {
    version: "v6.7",
  },
  encuentros: {
    cuenta: "27209528",
    etiqueta: "Encuentros deportivos",
    opciones: "BTL independiente,Otro producto",
    etiquetaCanal: "CANAL NACIONAL (Hoja4)",
  },
  jornada: {
    etiqueta: "Jornada Analfista (FEA 4342 / 4350)",
    opciones: "Según escenario,A comerciales,A Dirección",
  },
  carga: {
    hojaResumenAnterior: "hoja4",
    toleranciaPesos: 1,
  },
  anticipos: {
    prefijoCuenta: "27209",
    etiqueta: "Anticipos 27209",
  },
  productos: [
    { clave: "educacion", nombre: "Educación", marcas: ["educ"] },
    { clave: "asistencia", nombre: "Asistencia técnica", marcas: ["asist"] },
    { clave: "jornada", nombre: "Jornada Analfista", marcas: ["jornada"] },
    { clave: "anticipos", nombre: "Anticipos 27209", marcas: [] },
  ],
  curva: {
    minimo: 80,
    anclas: [
      { puntaje: 80, factor: 0.7 },
      { puntaje: 90, factor: 0.9 },
      { puntaje: 100, factor: 1 },
      { puntaje: 110, factor: 1.1 },
      { puntaje: 120, factor: 1.2 },
    ],
    tope: 1.2,
  },
  margen: {
    umbralBajo: 0.1,
    umbralAlto: 0.2,
    factorBajo: 0,
    factorMedio: 0.9,
    factorAlto: 1,
    factorPorDefecto: null,
  },
  hojas: {
    mision: "mision",
    btl: "btl",
    facturacion: "facturacion",
  },
  costos: {
    ica: 0.00966,
    gmf: 0.004,
  },
  mision: {
    valorFacturaNueva: 15500000,
    valorFacturaAnterior: 1000000,
  },
  cultural: {
    valorCarton: 40000,
    mes: 12,
  },
  satisfaccionEsperada: 80,
  serfiscal: {
    meta: 100,
  },
  innovacion: {
    puntosOferta: 2,
    puntosPrimeraVenta: 3,
    maximoPorOferta: 5,
    maximoTrimestre: 10,
  },
  baseSocial: {
    incrementoPorMes: 1,
    mesOrigen: "2026-10",
  },
  topeCongreso: 1,
  topeProducto: 1.2,
  clasificacion: [
    // BTL por grupo o cuentas 41702…; los anticipos 27209 de Educación no son BTL (van con su grupo).
    { producto: "btl", grupos: ["btl"], cuentasPrefijo: ["41702"] },
    { producto: "mision", grupos: ["misi"], cuentas: ["41703001", "41600521"] },
    { producto: "congreso", grupos: ["congres"] },
    { producto: "cultural", grupos: ["cultur"] },
    { producto: "pasantia", grupos: ["pasant"] },
    { producto: "patrocinio", grupos: ["patroc"] },
    { producto: "eduAt", grupos: ["educ", "asist", "jornada"], cuentas: ["41600511"] },
  ],
  btlUmbrales: {
    cumplimientoMinimo: 0.9,
    cumplimientoAlto: 1,
    margenBajo: 0.05,
    margenMedio: 0.1,
    margenAlto: 0.15,
    margenDecide: "bruto",
  },
  transicion: {
    inicio: "2026-10",
    fin: "2026-12",
    desde: "2026-10",
    hasta: "2026-12",
  },
  btl: {
    eventos: clonarEquipo(EQUIPO_INICIAL.btlEventos),
  },
  anterior: {
    minimo: 0.70,
    tasaBajoMinimo: 0,
    tasaBtl: 0.038,
    /** Si es true, el BTL del esquema anterior entra a la comparación de transición. Hoy es informativo. */
    btlEntraTransicion: false,
    tramos: [
      { hasta: 0.80, tasa: 0.05 },
      { hasta: 0.90, tasa: 0.07 },
      { hasta: 1.00, tasa: 0.09 },
      { hasta: 1.10, tasa: 0.10 },
      { hasta: null, tasa: 0.11 },
    ],
  },
  director: {
    ...clonarEquipo(EQUIPO_INICIAL.director),
    metodo: "totales",
    regla100: false,
    metaBaseSocialEquipo: 560,
    /** Suma de cierres de base social del equipo (director). */
    baseSocialCierreEquipo: 560,
    metaEduAtEquipo: 280000000,
    metaMisionEquipo: 49600000,
    tasaAnterior: 0.015,
    tasaBtlAnterior: 0.0063,
    tramosAnterior: [
      { hasta: 0.80, tasa: 0.010 },
      { hasta: 1.00, tasa: 0.015 },
      { hasta: null, tasa: 0.020 },
    ],
    btlPagadoAnio: 0,
    ajusteValor: null,
    ajusteMes: "",
    ajusteNota: "",
  },
  btlComercial: {
    cump90Margen5: 0.2,
    cump90Margen10: 0.3,
    cump90Margen15: 0.4,
    cump100Margen5: 0.35,
    cump100Margen10: 0.6,
    cump100Margen15: 0.8,
    topeEvento: 0.8,
    topeAnio: 2,
    salvaguarda: 0.25,
    cargaPrestacional: 0.5236,
  },
  btlDirector: {
    cump90: 0.1,
    cump100MargenMedio: 0.2,
    cump100MargenAlto: 0.25,
    topeEvento: 0.25,
    topeAnio: 1,
  },
  comerciales: clonarEquipo(EQUIPO_INICIAL.comerciales),
};


let parametrosActuales = clonar(PARAMETROS_INICIALES);

/** Devuelve el objeto que usarán los cálculos. Recibe nada. Devuelve el objeto vigente. */
export function obtenerParametros() {
  return parametrosActuales;
}

/** Reemplaza los eventos BTL leídos del archivo. No guarda en el navegador. */
export function fijarEventosBtl(eventos) {
  if (!Array.isArray(eventos)) return;
  if (!parametrosActuales.btl) parametrosActuales.btl = { eventos: [] };
  parametrosActuales.btl.eventos = eventos;
}

/** Escribe la meta mensual leída de la hoja EsquemaAnterior. No guarda en el navegador. */
export function fijarMetaAnterior(nombre, mes, meta) {
  const personaActual = parametrosActuales.comerciales.find((item) => item.nombre === nombre);
  if (!personaActual || !mes) return;
  if (!personaActual.anteriorMes) personaActual.anteriorMes = {};
  const actual = personaActual.anteriorMes[mes] || { meta: null, produccionManual: null };
  personaActual.anteriorMes[mes] = { ...actual, meta };
}

function esObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

/** Completa lo guardado con los valores iniciales. Una clave nueva del programa no se pierde. */
function combinar(base, guardado) {
  if (Array.isArray(base)) {
    if (!Array.isArray(guardado)) return clonar(base);
    const porNombre = base.length > 0 && esObjeto(base[0]) && "nombre" in base[0];
    if (porNombre) {
      const conocidos = new Set(base.map((item) => item.nombre));
      const extras = guardado.filter((candidato) => candidato && candidato.nombre && !conocidos.has(candidato.nombre));
      return base.map((item) => {
        const hallado = guardado.find((candidato) => candidato && candidato.nombre === item.nombre);
        return hallado ? combinar(item, hallado) : clonar(item);
      }).concat(extras.map((candidato) => clonar(candidato)));
    }
    return guardado.map((item, indice) => combinar(base[indice] === undefined ? item : base[indice], item));
  }
  if (esObjeto(base)) {
    const fuente = esObjeto(guardado) ? guardado : {};
    const salida = {};
    Object.keys(base).forEach((clave) => {
      salida[clave] = Object.prototype.hasOwnProperty.call(fuente, clave)
        ? combinar(base[clave], fuente[clave])
        : clonar(base[clave]);
    });
    return salida;
  }
  return guardado === undefined ? base : guardado;
}

function formaValida(datos) {
  return esObjeto(datos) && esObjeto(datos.pesos) && esObjeto(datos.director) && Array.isArray(datos.comerciales);
}

/** Lee lo guardado en este navegador y lo combina con los valores iniciales. */
export function cargarGuardado() {
  const textoGuardado = localStorage.getItem(CLAVE_GUARDADO);
  if (!textoGuardado) {
    parametrosActuales = clonar(PARAMETROS_INICIALES);
    return parametrosActuales;
  }
  let datos;
  try {
    datos = JSON.parse(textoGuardado);
  } catch (error) {
    parametrosActuales = clonar(PARAMETROS_INICIALES);
    return parametrosActuales;
  }
  if (!formaValida(datos)) {
    parametrosActuales = clonar(PARAMETROS_INICIALES);
    return parametrosActuales;
  }
  parametrosActuales = combinar(PARAMETROS_INICIALES, datos);
  // v19: la ICA por defecto pasa de 0,009660442 a 0,00966 (9,66 por mil exacto).
  if (parametrosActuales.costos?.ica === 0.009660442) parametrosActuales.costos.ica = 0.00966;
  return parametrosActuales;
}

/** Guarda el objeto en localStorage. No sale de este computador. */
export function guardarEnNavegador() {
  localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(parametrosActuales));
}

/** Borra la copia del navegador. No cambia lo que está en pantalla. */
export function borrarDatosGuardados() {
  localStorage.removeItem(CLAVE_GUARDADO);
}

/** Vuelve a los valores iniciales y los deja guardados en el navegador. */
export function restaurarValoresIniciales() {
  parametrosActuales = clonar(PARAMETROS_INICIALES);
  guardarEnNavegador();
}

/** Descarga el objeto como archivo JSON. */
export function exportarJson() {
  const blob = new Blob([JSON.stringify(parametrosActuales, null, 2)], {
    type: "application/json",
  });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "parametros-analfe.json";
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

/** Reemplaza los parámetros con un JSON elegido por el usuario. */
export function importarJson(texto) {
  const datos = JSON.parse(texto);
  if (!formaValida(datos)) {
    throw new Error("El archivo no tiene la forma de los parámetros.");
  }
  parametrosActuales = combinar(PARAMETROS_INICIALES, datos);
  guardarEnNavegador();
}

function numeroOVacio(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function valorInput(numero) {
  return numero === null || numero === undefined ? "" : numero;
}

/** IMR = básico + oportunidad. Si falta uno, no se calcula. */
function imrDe(personaActual) {
  if (personaActual.basico === null || personaActual.oportunidad === null) return null;
  return personaActual.basico + personaActual.oportunidad;
}

function sumaPesos(pesos) {
  return pesos.ventas + pesos.baseSocial + pesos.serfiscal + pesos.innovacion + pesos.satisfaccion;
}

let mesMetas = "2026-10";

/** Copia de los parámetros tal como están guardados. Sirve para marcar lo cambiado sin guardar. */
let guardadoSnapshot = "";

function marcarComoGuardado() {
  guardadoSnapshot = JSON.stringify(parametrosActuales);
}

function hayCambiosSinGuardar() {
  return JSON.stringify(parametrosActuales) !== guardadoSnapshot;
}

function leerRuta(objeto, ruta) {
  return ruta.split(".").reduce((actual, parte) => (actual === null || actual === undefined ? undefined : actual[parte]), objeto);
}

function normalizarTexto(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/** Marca cada campo cambiado y sin guardar, y devuelve cuántos son. */
function marcarCambios(contenedor) {
  const guardado = JSON.parse(guardadoSnapshot || "null") || {};
  let cuenta = 0;
  contenedor.querySelectorAll("[data-ruta]").forEach((campoEditable) => {
    const ruta = campoEditable.dataset.ruta;
    const actual = leerRuta(parametrosActuales, ruta);
    const base = leerRuta(guardado, ruta);
    const cambiado = JSON.stringify(actual ?? null) !== JSON.stringify(base ?? null);
    campoEditable.classList.toggle("campo-cambiado", cambiado);
    if (cambiado) {
      cuenta += 1;
      campoEditable.title = `Guardado: ${base === null || base === undefined ? "vacío" : base}`;
    } else {
      campoEditable.removeAttribute("title");
    }
  });
  const aviso = contenedor.querySelector("#aviso-parametros");
  if (aviso) {
    aviso.hidden = cuenta === 0;
    aviso.textContent = `${cuenta} ${cuenta === 1 ? "cambio" : "cambios"} sin guardar`;
  }
  return cuenta;
}

function textoFraccion(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  return (Number(valor) * 100).toLocaleString("es-CO", { maximumFractionDigits: 8 });
}

function celdaNumero(ruta, valor, titulo) {
  return `<input class="entrada campo-editable" type="number" step="any" data-ruta="${ruta}" value="${valorInput(valor)}" aria-label="${escaparHtml(titulo)}">`;
}

function campo(ruta, valor, opciones) {
  const id = `campo-${ruta.replace(/[^a-z0-9]+/gi, "-")}`;
  const unidad = opciones.unidad || "numero";
  let visible = valor === null || valor === undefined ? "" : valor;
  let extra = "";
  if (unidad === "porcentaje") {
    visible = textoFraccion(valor);
    extra = 'data-escala="100" inputmode="decimal"';
  } else if (unidad === "pesos") {
    visible = valor === null || valor === undefined || valor === "" ? "" : Math.round(Number(valor)).toLocaleString("es-CO");
    extra = 'data-unidad="pesos" inputmode="numeric"';
  }
  const tipo = unidad === "porcentaje" || unidad === "pesos" ? "text" : "number";
  const prefijo = unidad === "pesos" ? `<span>$</span>` : "";
  const sufijo = unidad === "porcentaje" || unidad === "porcentaje-directo" ? `<span>%</span>` : unidad === "puntos" ? `<span>pts</span>` : unidad === "veces" ? `<span>veces</span>` : "";
  const ayudaId = `${id}-ayuda`;
  const ayuda = opciones.ayuda ? `<small class="ayuda-campo" id="${ayudaId}">${escaparHtml(opciones.ayuda)}</small>` : "";
  return `<label class="campo-param"><span class="campo-param__etiqueta">${escaparHtml(opciones.titulo)}</span><span class="caja-campo">${prefijo}<input class="entrada campo-editable" id="${id}" type="${tipo}" step="any" data-ruta="${ruta}" ${extra} value="${escaparHtml(visible)}" aria-label="${escaparHtml(opciones.titulo)}" ${opciones.ayuda ? `aria-describedby="${ayudaId}"` : ""}>${sufijo}</span>${ayuda}</label>`;
}

function campoPesos(ruta, valor, titulo) {
  const numero = typeof valor === "number" ? valor : numeroPesos(valor);
  const visible = numero === null || numero === undefined || Number.isNaN(Number(numero)) ? "" : Math.round(Number(numero)).toLocaleString("es-CO");
  return `<input class="entrada campo-editable" type="text" inputmode="numeric" data-ruta="${ruta}" data-unidad="pesos" aria-label="${escaparHtml(titulo)}" value="${escaparHtml(visible)}">`;
}

function svgCurva(anclas) {
  const puntos = [...anclas].sort((a, b) => a.puntaje - b.puntaje);
  const x = (puntaje) => 10 + ((puntaje - 70) / 60) * 180;
  const y = (factor) => 70 - (Number(factor) / 1.3) * 60;
  const poly = [`${x(70)},${y(0)}`, ...puntos.map((ancla) => `${x(ancla.puntaje)},${y(ancla.factor)}`)].join(" ");
  return `<svg class="mini-curva" viewBox="0 0 200 80" role="img" aria-label="Curva de pago"><polyline points="${poly}" fill="none" stroke="currentColor" stroke-width="2"></polyline></svg>`;
}

function mesLegible(mes) {
  const cortos = { "2026-10": "Oct", "2026-11": "Nov", "2026-12": "Dic" };
  return cortos[mes] || mes;
}

function textoPesos(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return `$ ${Math.round(numero).toLocaleString("es-CO")}`;
}

function celdaMeta(ruta, valor, titulo) {
  return `<div class="celda-meta">${celdaNumero(ruta, valor, titulo)}<small class="meta-legible">${escaparHtml(textoPesos(valor))}</small></div>`;
}

function filaComercial(personaActual, indice) {
  const partesDesde = String(personaActual.activoDesde || "").split("-");
  const nombreDesde = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][Number(partesDesde[1]) - 1];
  const desde = personaActual.activoDesde && personaActual.activoDesde !== parametrosActuales.transicion.desde
    ? `<span class="badge badge--neutro">Desde ${escaparHtml(nombreDesde || personaActual.activoDesde)} ${escaparHtml(partesDesde[0] || "")}</span>`
    : "";
  const imr = imrDe(personaActual);
  return `
    <tr>
      <th>
        <strong>${escaparHtml(personaActual.nombre)}</strong> ${desde}
        <label class="sr-solo" for="doc-${indice}">Documento</label>
        <input id="doc-${indice}" class="entrada campo-editable" type="text" data-ruta="comerciales.${indice}.documento" data-tipo="texto" value="${escaparHtml(personaActual.documento || "")}" placeholder="Documento">
        <label class="sr-solo" for="cargo-${indice}">Cargo</label>
        <input id="cargo-${indice}" class="entrada campo-editable" type="text" data-ruta="comerciales.${indice}.cargo" data-tipo="texto" value="${escaparHtml(personaActual.cargo || "")}" placeholder="Cargo, nivel y regional">
      </th>
      <td>${campoPesos(`comerciales.${indice}.basico`, personaActual.basico, "Básico")}</td>
      <td>${campoPesos(`comerciales.${indice}.oportunidad`, personaActual.oportunidad, "Oportunidad")}</td>
      <td><input class="calculado campo-calculado" readonly data-imr="${indice}" value="${imr === null ? "" : Math.round(imr).toLocaleString("es-CO")}"></td>
      <td>${celdaNumero(`comerciales.${indice}.baseSocialInicial`, personaActual.baseSocialInicial, "Base social")}</td>
      <td>${celdaNumero(`comerciales.${indice}.cartones`, personaActual.cartones, "Cartones")}</td>
      <td><input type="checkbox" data-ruta="comerciales.${indice}.tieneEsquemaAnterior" ${personaActual.tieneEsquemaAnterior ? "checked" : ""} aria-label="Esquema anterior"></td>
    </tr>`;
}

function filaMetas(personaActual, indice) {
  const mes = mesMetas;
  const bloqueado = Boolean(personaActual.activoDesde && mes < personaActual.activoDesde);
  const celda = (producto) => {
    const valor = personaActual.metas?.[mes]?.[producto];
    const titulo = `${personaActual.nombre} ${mes} ${nombreVisible(producto)}`;
    if (bloqueado) {
      const texto = valor === null || valor === undefined || valor === "" ? "" : Math.round(Number(valor)).toLocaleString("es-CO");
      return `<td><input class="calculado campo-calculado" readonly value="${escaparHtml(texto)}" aria-label="${escaparHtml(titulo)}"></td>`;
    }
    return `<td>${campoPesos(`comerciales.${indice}.metas.${mes}.${producto}`, valor, titulo)}</td>`;
  };
  const esCultural = Number(String(mes).split("-")[1]) === Number(parametrosActuales.cultural.mes);
  const cultural = !esCultural
    ? "—"
    : personaActual.cartones === null
      ? "Pendiente"
      : Math.round(personaActual.cartones * parametrosActuales.cultural.valorCarton).toLocaleString("es-CO");
  return `<tr><th>${escaparHtml(personaActual.nombre)}</th>${celda("eduAt")}${celda("mision")}${celda("congreso")}<td data-cultural="${indice}">${escaparHtml(cultural)}</td></tr>`;
}

/** Fórmula de referencia para el placeholder de meta de base social. */
function metaBaseSocialPlaceholder(personaActual, mes) {
  const origen = parametrosActuales.baseSocial?.mesOrigen || "2026-10";
  const incremento = Number(parametrosActuales.baseSocial?.incrementoPorMes);
  if (personaActual.baseSocialInicial === null || personaActual.baseSocialInicial === undefined || !Number.isFinite(incremento)) return "";
  const [anioOrigen, mesOrigen] = origen.split("-").map(Number);
  const [anio, numeroMes] = String(mes).split("-").map(Number);
  const diferencia = (anio - anioOrigen) * 12 + (numeroMes - mesOrigen);
  if (diferencia < 0) return "";
  return String(personaActual.baseSocialInicial + (diferencia + 1) * incremento);
}

function filaBaseSocialMes(personaActual, indice) {
  const base = personaActual.baseSocialInicial;
  const baseTxt = base === null || base === undefined || base === "" ? "—" : String(base);
  const celdas = ["2026-10", "2026-11", "2026-12"].map((mes) => {
    const valor = personaActual.baseSocialMes?.[mes]?.meta;
    const titulo = `Meta base social ${mes} de ${personaActual.nombre}`;
    const placeholder = metaBaseSocialPlaceholder(personaActual, mes);
    return `<td><input class="entrada campo-editable" type="number" step="any" data-ruta="comerciales.${indice}.baseSocialMes.${mes}.meta" value="${valorInput(valor)}" placeholder="${escaparHtml(placeholder)}" aria-label="${escaparHtml(titulo)}" title="${placeholder ? `Fórmula si vacío: ${placeholder}` : ""}"></td>`;
  }).join("");
  return `<tr><th>${escaparHtml(personaActual.nombre)}</th><td class="num">${escaparHtml(baseTxt)}</td>${celdas}</tr>`;
}

/** Grupos de la pestaña Parámetros. Se muestra uno a la vez. */
const GRUPOS_PARAMETROS = [
  { id: "reglas", titulo: "Reglas", ayuda: "Cada peso es el máximo de puntos de ese indicador. La suma de pesos debe dar 100." },
  { id: "curva", titulo: "Curva de pago", ayuda: "Por debajo del mínimo el factor es 0. El tope corta el factor. Pon los puntos de la curva en orden." },
  { id: "costos", titulo: "Costos y Misión", ayuda: "ICA y GMF se restan al armar el costo total del evento. Vacío = no se inventa un margen." },
  { id: "anterior", titulo: "Política anterior", ayuda: "La comisión anterior es la producción del mes por la tasa del tramo. La meta es por comercial y por mes. Vacío en producción manual = se usa el archivo." },
  { id: "btl", titulo: "BTL", ayuda: "Umbrales de la tabla de porcentaje liquidador (5.11.5)." },
  { id: "director", titulo: "Director", ayuda: "Datos del director y método para armar el score del equipo." },
  { id: "comerciales", titulo: "Comerciales", ayuda: "Datos por comercial. El documento y el cargo van en la segunda línea de cada nombre." },
  { id: "metas", titulo: "Metas por mes", ayuda: "Congreso de noviembre y diciembre vacío = pendiente. La actividad cultural sale de cartones × valor del cartón. La meta de base social se edita mes a mes; vacío = fórmula Base 30 sep + pasos × incremento." },
];

let grupoParametros = "reglas";

function tarjetaParam(titulo, rutas, cuerpo, intro = "") {
  const restaurar = rutas
    ? `<button type="button" class="boton boton--pequeno" data-restaurar-grupo="${escaparHtml(rutas.join("|"))}">Restaurar grupo</button>`
    : "";
  return `
    <article class="tarjeta tarjeta-param">
      <div class="tarjeta-param__cabeza"><h2>${escaparHtml(titulo)}</h2>${restaurar}</div>
      ${intro ? `<p>${escaparHtml(intro)}</p>` : ""}
      ${cuerpo}
    </article>`;
}

function camposParam(...html) {
  return `<div class="campos-param">${html.join("")}</div>`;
}

function seccionGrupo(grupo, principal) {
  const activo = grupoParametros === grupo.id;
  return `
    <section class="grupo-param" data-grupo="${grupo.id}" role="tabpanel" ${activo ? "" : "hidden"}>
      <div class="grupo-param__principal">${principal}</div>
      <aside class="grupo-param__ayuda">
        <h3>Ayuda del grupo</h3>
        <p>${escaparHtml(grupo.ayuda)}</p>
      </aside>
    </section>`;
}

function htmlFormulario() {
  const p = parametrosActuales;
  const d = p.director;
  const suma = sumaPesos(p.pesos);
  const sumaOk = suma === 100;
  const grupos = Object.fromEntries(GRUPOS_PARAMETROS.map((grupo) => [grupo.id, grupo]));
  const anclas = p.curva.anclas
    .map(
      (ancla, i) => `<tr>
        <td>${campo(`curva.anclas.${i}.puntaje`, ancla.puntaje, { titulo: `Puntaje ${i + 1}`, unidad: "puntos", ayuda: "Puntos de score de esta ancla" })}</td>
        <td>${campo(`curva.anclas.${i}.factor`, ancla.factor, { titulo: `Factor ${i + 1}`, unidad: "porcentaje", ayuda: "Porcentaje de la oportunidad que se paga" })}</td>
      </tr>`
    )
    .join("");
  const principales = {
    reglas: tarjetaParam("Pesos del score (5.8)", ["pesos"], camposParam(
      campo("pesos.ventas", p.pesos.ventas, { titulo: "Ventas", unidad: "puntos", ayuda: "Peso de ventas rentables y recaudadas" }),
      campo("pesos.baseSocial", p.pesos.baseSocial, { titulo: "Base social", unidad: "puntos", ayuda: "Peso de la base social" }),
      campo("pesos.serfiscal", p.pesos.serfiscal, { titulo: "SERFISCAL", unidad: "puntos", ayuda: "Peso de SERFISCAL" }),
      campo("pesos.innovacion", p.pesos.innovacion, { titulo: "Innovación", unidad: "puntos", ayuda: "Peso de innovación comercial" }),
      campo("pesos.satisfaccion", p.pesos.satisfaccion, { titulo: "Satisfacción", unidad: "puntos", ayuda: "Peso de satisfacción" }),
      `<div class="campo-param campo-param--calculo"><span class="campo-param__etiqueta">Suma de pesos</span><span class="caja-campo"><input class="calculado campo-calculado" readonly id="suma-pesos" value="${suma}"></span><span id="marca-suma" class="badge ${sumaOk ? "badge--exito" : "badge--peligro"}">${sumaOk ? "= 100" : "≠ 100"}</span></div>`
    ), "Cada peso es el máximo de puntos de ese indicador.")
      + tarjetaParam("Satisfacción y SERFISCAL", ["serfiscal.meta", "satisfaccionEsperada"], camposParam(
        campo("serfiscal.meta", p.serfiscal.meta, { titulo: "Meta SERFISCAL", unidad: "porcentaje-directo", ayuda: "Porcentaje esperado. 100 es la meta actual" }),
        campo("satisfaccionEsperada", p.satisfaccionEsperada, { titulo: "Satisfacción esperada", unidad: "porcentaje-directo", ayuda: "Resultado mínimo esperado" })
      ))
      + `<p class="aviso">PENDIENTE con la jefa: método del score y si aplica la regla del 100 % en indicadores distintos de base social.</p>`,
    curva: tarjetaParam("Curva de pago (5.8)", ["curva.minimo", "curva.tope", "topeIndicador", "topeCongreso", "topeProducto", "curva.anclas"], `
        ${camposParam(
          campo("curva.minimo", p.curva.minimo, { titulo: "Score mínimo", unidad: "puntos", ayuda: "Se paga 0 si el score queda por debajo" }),
          campo("curva.tope", p.curva.tope, { titulo: "Tope de la curva", unidad: "porcentaje", ayuda: "El factor no pasa de este porcentaje" }),
          campo("topeIndicador", p.topeIndicador, { titulo: "Tope del indicador", unidad: "porcentaje", ayuda: "Tope del cumplimiento de cada indicador" }),
          campo("topeCongreso", p.topeCongreso, { titulo: "Tope de Congreso", unidad: "porcentaje", ayuda: "Tope del cumplimiento de Congreso (5.4)" }),
          campo("topeProducto", p.topeProducto, { titulo: "Tope por producto (5.4)", unidad: "porcentaje", ayuda: "Cada producto se reconoce hasta este cumplimiento; el exceso no compensa otros" })
        )}
        <div class="rejilla-2">
          <table class="tabla"><thead><tr><th>Puntaje</th><th>Factor</th></tr></thead><tbody>${anclas}</tbody></table>
          ${svgCurva(p.curva.anclas)}
        </div>`, "Por debajo del mínimo el factor es 0. El tope corta el factor."),
    costos: tarjetaParam("Costos y margen", ["costos", "margen.factorPorDefecto"], camposParam(
      campo("costos.ica", p.costos.ica, { titulo: "ICA", unidad: "porcentaje", ayuda: "Tasa sobre el ingreso" }),
      campo("costos.gmf", p.costos.gmf, { titulo: "GMF", unidad: "porcentaje", ayuda: "Tasa sobre el costo directo" }),
        campo("margen.factorPorDefecto", p.margen.factorPorDefecto, { titulo: "Factor de margen por defecto", unidad: "porcentaje", ayuda: "Vacío: si la factura no tiene margen en PRODUCTOS, Edu/AT reconoce el 100 % de la BASE" })
    ), "ICA y GMF se restan al armar el costo total del evento.")
      + tarjetaParam("Misión", ["mision"], camposParam(
        campo("mision.valorFacturaNueva", p.mision.valorFacturaNueva, { titulo: "Factura nueva", unidad: "pesos", ayuda: "Valor reconocido por factura de Misión" }),
        campo("mision.valorFacturaAnterior", p.mision.valorFacturaAnterior, { titulo: "Valor por misión (anterior)", unidad: "pesos", ayuda: "Esquema anterior: CANTIDAD del Excel × este valor (p. ej. 2 × $1.000.000)" })
      ), "La política nueva reconoce un valor fijo por factura.")
      + tarjetaParam("Actividad cultural", ["cultural"], camposParam(
        campo("cultural.valorCarton", p.cultural.valorCarton, { titulo: "Valor por cartón", unidad: "pesos", ayuda: "Pesos por cartón" }),
        campo("cultural.mes", p.cultural.mes, { titulo: "Mes cultural", ayuda: "Número de mes, 12 es diciembre" })
      ), "En el mes cultural la meta es cartones × valor del cartón."),
    btl: tarjetaParam("BTL (5.11.5)", ["btlUmbrales", "btl", "btlComercial", "btlDirector"], camposParam(
      campo("btlUmbrales.cumplimientoMinimo", p.btlUmbrales.cumplimientoMinimo, { titulo: "Cumplimiento mínimo", unidad: "porcentaje", ayuda: "Por debajo no liquida" }),
      campo("btlUmbrales.cumplimientoAlto", p.btlUmbrales.cumplimientoAlto, { titulo: "Cumplimiento alto", unidad: "porcentaje", ayuda: "A partir de aquí aplica el tramo alto" }),
      campo("btlUmbrales.margenBajo", p.btlUmbrales.margenBajo, { titulo: "Margen bajo", unidad: "porcentaje", ayuda: "Primer tramo de margen" }),
      campo("btlUmbrales.margenMedio", p.btlUmbrales.margenMedio, { titulo: "Margen medio", unidad: "porcentaje", ayuda: "Segundo tramo de margen" }),
      campo("btlUmbrales.margenAlto", p.btlUmbrales.margenAlto, { titulo: "Margen alto", unidad: "porcentaje", ayuda: "Tercer tramo de margen" }),
      `<label class="campo-param"><span class="campo-param__etiqueta">Margen que decide la tabla</span><span class="caja-campo"><select class="entrada campo-editable" data-ruta="btlUmbrales.margenDecide" data-tipo="texto">
          <option value="bruto" ${p.btlUmbrales.margenDecide === "neto" ? "" : "selected"}>Bruto (ingresos − total costos) / ingresos</option>
          <option value="neto" ${p.btlUmbrales.margenDecide === "neto" ? "selected" : ""}>Neto (informativo si no se elige)</option>
        </select></span><small class="ayuda-campo">Por defecto bruto, según la respuesta del 23 nov</small></label>`,
      campo("btlComercial.topeEvento", p.btlComercial.topeEvento, { titulo: "Tope comercial por evento", unidad: "porcentaje", ayuda: "0,8 × IMR del comercial por evento" }),
      campo("btlComercial.topeAnio", p.btlComercial.topeAnio, { titulo: "Tope comercial anual", unidad: "veces", ayuda: "2 × IMR menos lo ya pagado en el año" }),
      campo("btlDirector.topeEvento", p.btlDirector.topeEvento, { titulo: "Tope director por evento", unidad: "porcentaje", ayuda: "0,25 × IMR del director por evento" }),
      campo("btlDirector.topeAnio", p.btlDirector.topeAnio, { titulo: "Tope director anual", unidad: "veces", ayuda: "1 × IMR del director" }),
      campo("btlComercial.salvaguarda", p.btlComercial.salvaguarda, { titulo: "Salvaguarda", unidad: "porcentaje", ayuda: "Tope conjunto comerciales + director sobre la utilidad real (25 %)" }),
      campo("btlComercial.cargaPrestacional", p.btlComercial.cargaPrestacional, { titulo: "Carga prestacional", unidad: "porcentaje", ayuda: "Solo informativa; no entra al tope (52,36 %)" })
    )
    + `<table class="tabla tabla-fija"><thead><tr><th>Evento</th><th>Comercial</th><th>Ingreso de ejecución</th></tr></thead><tbody>${(p.btl?.eventos || []).map((evento, indice) => `<tr>
      <td><input class="entrada campo-editable" type="text" data-ruta="btl.eventos.${indice}.evento" data-tipo="texto" value="${escaparHtml(evento.evento || "")}" aria-label="Evento ${indice + 1}"></td>
      <td><input class="entrada campo-editable" type="text" data-ruta="btl.eventos.${indice}.comercial" data-tipo="texto" value="${escaparHtml(evento.comercial || "")}" aria-label="Comercial del evento ${indice + 1}"></td>
      <td>${campoPesos(`btl.eventos.${indice}.ingresoEjecucion`, evento.ingresoEjecucion, `Ingreso de ejecución del evento ${indice + 1}`)}</td>
    </tr>`).join("")}</tbody></table>`, "Umbrales de la tabla de porcentaje liquidador. El ingreso de ejecución es la base del BTL anterior. Vacío = pendiente, sin usar el recaudo."),
    anterior: tarjetaParam("Política anterior", ["anterior", "comerciales"], `
        ${camposParam(
          campo("anterior.minimo", p.anterior.minimo, { titulo: "Cumplimiento mínimo", unidad: "porcentaje", ayuda: "Por debajo de este porcentaje la tasa es la de bajo mínimo" }),
          campo("anterior.tasaBajoMinimo", p.anterior.tasaBajoMinimo, { titulo: "Tasa bajo el mínimo", unidad: "porcentaje", ayuda: "Se aplica si el cumplimiento no llega al mínimo" }),
          campo("anterior.tasaBtl", p.anterior.tasaBtl, { titulo: "Tasa BTL anterior", unidad: "porcentaje", ayuda: "Solo si el archivo no trae % de comisión. No entra a la transición" })
        )}
        <table class="tabla tabla-fija">
          <thead><tr><th>Hasta</th><th>Tasa</th></tr></thead>
          <tbody>${p.anterior.tramos.map((tramo, indice) => `<tr>
            <td>${campo(`anterior.tramos.${indice}.hasta`, tramo.hasta, { titulo: `Hasta del tramo ${indice + 1}`, unidad: "porcentaje", ayuda: "Vacío = de aquí en adelante" })}</td>
            <td>${campo(`anterior.tramos.${indice}.tasa`, tramo.tasa, { titulo: `Tasa del tramo ${indice + 1}`, unidad: "porcentaje", ayuda: "Tasa que se aplica hasta este cumplimiento" })}</td>
          </tr>`).join("")}</tbody>
        </table>
        <div class="tabla-scroll">
          <table class="tabla tabla-metas">
            <thead><tr><th>Comercial</th><th>Meta octubre</th><th>Producción manual octubre</th><th>Meta noviembre</th><th>Manual noviembre</th><th>Meta diciembre</th><th>Manual diciembre</th></tr></thead>
            <tbody>${p.comerciales.map((personaActual, indice) => `<tr><th>${escaparHtml(personaActual.nombre)}</th>
              ${["2026-10", "2026-11", "2026-12"].map((mes) => `<td>${campoPesos(`comerciales.${indice}.anteriorMes.${mes}.meta`, personaActual.anteriorMes?.[mes]?.meta, `Meta ${mes} de ${personaActual.nombre}`)}</td><td>${campoPesos(`comerciales.${indice}.anteriorMes.${mes}.produccionManual`, personaActual.anteriorMes?.[mes]?.produccionManual, `Producción manual ${mes} de ${personaActual.nombre}`)}</td>`).join("")}
            </tr>`).join("")}</tbody>
          </table>
        </div>`, "La meta mensual es por comercial. Si escribes una producción manual, reemplaza la del archivo."),
    director: tarjetaParam("Director comercial", [
      "director.basico", "director.oportunidad", "director.metodo", "director.regla100",
      "director.metaBaseSocialEquipo", "director.baseSocialCierreEquipo", "director.metaEduAtEquipo", "director.metaMisionEquipo",
      "director.ajusteValor", "director.ajusteMes", "director.ajusteNota",
      "director.tasaAnterior", "director.tasaBtlAnterior", "director.tramosAnterior",
    ], camposParam(
      `<label class="campo-param"><span class="campo-param__etiqueta">Nombre</span><span class="caja-campo"><input class="calculado campo-calculado" readonly value="${escaparHtml(d.nombre)}"></span></label>`,
      campo("director.basico", d.basico, { titulo: "Básico", unidad: "pesos", ayuda: "Salario básico del director" }),
      campo("director.oportunidad", d.oportunidad, { titulo: "Oportunidad", unidad: "pesos", ayuda: "Base del pago variable" }),
      `<label class="campo-param"><span class="campo-param__etiqueta">IMR</span><span class="caja-campo"><input class="calculado campo-calculado" readonly id="imr-director" value="${d.basico === null || d.oportunidad === null ? "" : Math.round(d.basico + d.oportunidad).toLocaleString("es-CO")}"></span></label>`,
      `<label class="campo-param"><span class="campo-param__etiqueta">Método del score</span><span class="caja-campo"><select class="entrada campo-editable" data-ruta="director.metodo">
          <option value="totales" ${d.metodo === "totales" ? "selected" : ""}>Totales del equipo</option>
          <option value="promedio" ${d.metodo === "promedio" ? "selected" : ""}>Promedio simple de scores</option>
          <option value="ponderado" ${d.metodo === "ponderado" ? "selected" : ""}>Promedio ponderado por meta</option>
        </select></span><small class="ayuda-campo">Cómo se arma el score del director</small></label>`,
      `<label class="campo-param"><span class="campo-param__etiqueta">Regla del 100 %</span><span class="caja-campo"><select class="entrada campo-editable" data-ruta="director.regla100">
          <option value="false" ${d.regla100 ? "" : "selected"}>No</option>
          <option value="true" ${d.regla100 ? "selected" : ""}>Sí</option>
        </select></span></label>`,
      campo("director.baseSocialCierreEquipo", d.baseSocialCierreEquipo, { titulo: "Suma de cierres del equipo", ayuda: "Base computable = suma de cierres de base social del equipo (personas)" }),
      campo("director.metaBaseSocialEquipo", d.metaBaseSocialEquipo, { titulo: "Meta base social (referencia)", ayuda: "Solo referencia. El cálculo usa la suma de las metas de base social del mes de los comerciales" }),
      campo("director.metaEduAtEquipo", d.metaEduAtEquipo, { titulo: "Meta Edu/AT del equipo", unidad: "pesos", ayuda: "Meta de Educación y asistencia técnica del director comercial" }),
      campo("director.metaMisionEquipo", d.metaMisionEquipo, { titulo: "Meta Misión (referencia)", unidad: "pesos", ayuda: "Solo referencia. El cálculo usa la suma de las metas de misión de los comerciales" }),
      `<p class="ayuda-campo">Meta de misión del director = suma de las metas de misión de cada comercial del mes (no este campo fijo).</p>`,
      campo("director.ajusteValor", d.ajusteValor, { titulo: "Ajuste / reliquidación $", unidad: "pesos", ayuda: "Suma o resta a lo que se paga este mes (no cambia score ni factor)" }),
      `<label class="campo-param"><span class="campo-param__etiqueta">Mes que corrige el ajuste</span><span class="caja-campo"><input class="entrada campo-editable" type="text" data-ruta="director.ajusteMes" data-tipo="texto" value="${escaparHtml(d.ajusteMes || "")}" aria-label="Mes que corrige el ajuste" placeholder="2026-10"></span><small class="ayuda-campo">Ej. 2026-10</small></label>`,
      `<label class="campo-param"><span class="campo-param__etiqueta">Nota del ajuste</span><span class="caja-campo"><input class="entrada campo-editable" type="text" data-ruta="director.ajusteNota" data-tipo="texto" value="${escaparHtml(d.ajusteNota || "")}" aria-label="Nota del ajuste"></span><small class="ayuda-campo">Motivo del ajuste</small></label>`,
      campo("director.tasaAnterior", d.tasaAnterior, { titulo: "Tasa anterior", unidad: "porcentaje", ayuda: "1,5 % fijo sobre el total de producción del mes" }),
      campo("director.tasaBtlAnterior", d.tasaBtlAnterior, { titulo: "Tasa BTL anterior", unidad: "porcentaje", ayuda: "Sobre el ingreso de ejecución del evento. No usa el recaudo" }),
      `<p class="ayuda-campo">Hoy se usa 1,5 % fijo (tasaAnterior). Esta tabla no entra al cálculo.</p>`,
      ...d.tramosAnterior.map((tramo, indice) => campo(`director.tramosAnterior.${indice}.hasta`, tramo.hasta, { titulo: `Tramo informativo ${indice + 1}, hasta`, unidad: "porcentaje", ayuda: "Vacío = de aquí en adelante. No entra al cálculo" })),
      ...d.tramosAnterior.map((tramo, indice) => campo(`director.tramosAnterior.${indice}.tasa`, tramo.tasa, { titulo: `Tramo informativo ${indice + 1}, tasa`, unidad: "porcentaje", ayuda: "Solo informativo. No entra al cálculo" }))
    )),
    comerciales: tarjetaParam("Comerciales", null, `
        <div class="tabla-scroll">
          <table class="tabla tabla-metas tabla-comerciales">
            <thead><tr><th>Comercial</th><th>Básico</th><th>Oportunidad</th><th>IMR</th><th>Base 30 sep</th><th>Cartones</th><th>Esquema anterior</th></tr></thead>
            <tbody>${p.comerciales.map(filaComercial).join("")}</tbody>
          </table>
        </div>`),
    metas: tarjetaParam("Metas por mes", ["baseSocial.incrementoPorMes", "baseSocial.mesOrigen"], `
        <p>La actividad cultural del mes ${escaparHtml(p.cultural.mes)} es cartones × valor del cartón. Congreso de noviembre y diciembre vacío = pendiente.</p>
        <div class="segmentos" role="tablist" aria-label="Mes de las metas">
          ${["2026-10", "2026-11", "2026-12"].map((mes) => `<button type="button" data-mes-vista="${mes}" class="${mes === mesMetas ? "activa" : ""}">${mesLegible(mes)}</button>`).join("")}
        </div>
        <div class="tabla-scroll">
          <table class="tabla tabla-metas">
            <thead><tr><th>Comercial</th><th>Edu/AT</th><th>Misión</th><th>Congreso</th><th>Cultural</th></tr></thead>
            <tbody>${p.comerciales.map(filaMetas).join("")}</tbody>
          </table>
        </div>`)
      + tarjetaParam("Meta de base social por mes", ["baseSocial.incrementoPorMes", "baseSocial.mesOrigen", "comerciales"], `
        ${camposParam(
          campo("baseSocial.incrementoPorMes", p.baseSocial.incrementoPorMes, { titulo: "Incremento por mes", ayuda: "Personas que suma la fórmula cada mes (si la celda del mes está vacía)" }),
          `<label class="campo-param"><span class="campo-param__etiqueta">Mes origen</span><span class="caja-campo"><input class="entrada campo-editable" type="text" data-ruta="baseSocial.mesOrigen" data-tipo="texto" value="${escaparHtml(p.baseSocial.mesOrigen || "")}" aria-label="Mes origen" placeholder="2026-10"></span><small class="ayuda-campo">Primer mes de la fórmula (ej. 2026-10). Paso 1 = ese mes</small></label>`
        )}
        <p>Vacío en un mes = se usa la fórmula: Base 30 sep + pasos × incremento. Si escribes un número, reemplaza la fórmula en ese mes.</p>
        <div class="tabla-scroll">
          <table class="tabla tabla-metas">
            <thead><tr><th>Comercial</th><th>Base 30 sep</th><th>Meta octubre</th><th>Meta noviembre</th><th>Meta diciembre</th></tr></thead>
            <tbody>${p.comerciales.map(filaBaseSocialMes).join("")}</tbody>
          </table>
        </div>`, "Edición mes a mes de la meta de base social de cada comercial."),
  };
  return `
    <div class="barra-param">
      <h2 class="titulo-pagina">Parámetros y metas</h2>
      <div class="barra-param__acciones">
        <label class="buscar-param"><span class="sr-solo">Buscar parámetro</span><input type="search" class="entrada" id="buscar-parametro" placeholder="Buscar parámetro…"></label>
        <span id="aviso-parametros" class="badge badge--aviso" hidden></span>
        <button type="button" class="boton boton--primario" id="btn-guardar">Guardar en este navegador</button>
        <details class="menu-mas">
          <summary class="boton">Más ▾</summary>
          <div>
            <button type="button" id="btn-exportar">Exportar JSON</button>
            <label class="boton">Importar JSON <input type="file" id="archivo-json" accept="application/json,.json" hidden></label>
            <button type="button" id="btn-restaurar">Restaurar valores iniciales</button>
            <button type="button" class="boton-peligro" id="btn-borrar">Borrar datos guardados</button>
          </div>
        </details>
      </div>
    </div>
    <p class="mensaje" id="mensaje-parametros"></p>
    <div class="segmentos grupos-param" role="tablist" aria-label="Grupos de parámetros">
      ${GRUPOS_PARAMETROS.map((grupo) => `<button type="button" role="tab" data-grupo-tab="${grupo.id}" aria-selected="${grupo.id === grupoParametros}" class="${grupo.id === grupoParametros ? "activa" : ""}">${escaparHtml(grupo.titulo)}</button>`).join("")}
    </div>
    <p class="leyenda-param"><span class="muestra-color muestra-editable"></span> Lo amarillo se edita · <span class="muestra-color muestra-calculado"></span> lo gris se calcula · vacío = pendiente · <span class="muestra-color muestra-cambiado"></span> cambiado y sin guardar</p>
    ${GRUPOS_PARAMETROS.map((grupo) => seccionGrupo(grupos[grupo.id], principales[grupo.id])).join("")}`;
}

/** Escribe un valor en el objeto siguiendo una ruta como "pesos.ventas". Crea objetos intermedios si faltan. */
function asignarRuta(ruta, valor) {
  const partes = ruta.split(".");
  let actual = parametrosActuales;
  for (let i = 0; i < partes.length - 1; i += 1) {
    const clave = partes[i];
    if (actual[clave] === null || actual[clave] === undefined) {
      actual[clave] = /^\d+$/.test(partes[i + 1]) ? [] : {};
    }
    actual = actual[clave];
  }
  actual[partes[partes.length - 1]] = valor;
}

function refrescarCalculados(contenedor) {
  parametrosActuales.comerciales.forEach((personaActual, indice) => {
    const imr = contenedor.querySelector(`[data-imr="${indice}"]`);
    const cultural = contenedor.querySelector(`[data-cultural="${indice}"]`);
    if (imr) {
      const valor = imrDe(personaActual);
      imr.value = valor === null ? "" : Math.round(valor).toLocaleString("es-CO");
    }
    if (cultural && Number(String(mesMetas).split("-")[1]) === Number(parametrosActuales.cultural.mes)) {
      cultural.textContent = personaActual.cartones === null
        ? "Pendiente"
        : Math.round(personaActual.cartones * parametrosActuales.cultural.valorCarton).toLocaleString("es-CO");
    }
  });
  const sumaValor = sumaPesos(parametrosActuales.pesos);
  const suma = contenedor.querySelector("#suma-pesos");
  if (suma) suma.value = sumaValor;
  const marca = contenedor.querySelector("#marca-suma");
  if (marca) {
    const ok = sumaValor === 100;
    marca.className = `badge ${ok ? "badge--exito" : "badge--peligro"}`;
    marca.textContent = ok ? "= 100" : "≠ 100";
  }
  const imrDirector = contenedor.querySelector("#imr-director");
  if (imrDirector) {
    const basico = parametrosActuales.director.basico;
    const oportunidad = parametrosActuales.director.oportunidad;
    imrDirector.value = basico === null || oportunidad === null ? "" : Math.round(basico + oportunidad).toLocaleString("es-CO");
  }
}

function decir(contenedor, texto) {
  const mensaje = contenedor.querySelector("#mensaje-parametros");
  if (mensaje) mensaje.textContent = texto;
}

/** Pinta el formulario y conecta guardar, exportar, importar y borrar. */
export function iniciarFormularioParametros(contenedor) {
  try {
    cargarGuardado();
  } catch (error) {
    parametrosActuales = clonar(PARAMETROS_INICIALES);
  }
  marcarComoGuardado();
  const grupoGuardado = sessionStorage.getItem("analfe-param-grupo");
  if (GRUPOS_PARAMETROS.some((grupo) => grupo.id === grupoGuardado)) grupoParametros = grupoGuardado;

  function pintar(aviso) {
    contenedor.innerHTML = htmlFormulario();
    marcarCambios(contenedor);
    if (aviso) decir(contenedor, aviso);
  }

  /** Muestra un grupo a la vez y recuerda la elección. */
  function activarGrupo(id) {
    grupoParametros = id;
    sessionStorage.setItem("analfe-param-grupo", id);
    contenedor.querySelectorAll("[data-grupo-tab]").forEach((boton) => {
      const activo = boton.dataset.grupoTab === id;
      boton.classList.toggle("activa", activo);
      boton.setAttribute("aria-selected", String(activo));
    });
    contenedor.querySelectorAll("[data-grupo]").forEach((seccion) => {
      seccion.hidden = seccion.dataset.grupo !== id;
    });
  }

  /** Busca en etiquetas y ayudas de todos los grupos. Salta al primero y resalta los campos. */
  function buscar(texto) {
    const termino = normalizarTexto(texto);
    contenedor.querySelectorAll(".campo-resaltado").forEach((elemento) => elemento.classList.remove("campo-resaltado"));
    if (!termino) return;
    let primero = null;
    contenedor.querySelectorAll(".campo-param").forEach((campoEl) => {
      if (!normalizarTexto(campoEl.textContent).includes(termino)) return;
      campoEl.classList.add("campo-resaltado");
      const seccion = campoEl.closest("[data-grupo]");
      if (primero === null && seccion) primero = seccion.dataset.grupo;
    });
    if (primero) activarGrupo(primero);
    contenedor.querySelector(".campo-resaltado")?.scrollIntoView({ block: "center" });
  }

  /** Vuelve una tarjeta a sus valores iniciales en memoria. No guarda. */
  function restaurarRutas(rutas, boton) {
    const nombre = boton.closest(".tarjeta-param")?.querySelector("h2")?.textContent || "Este grupo";
    if (!window.confirm(`¿Volver "${nombre}" a los valores iniciales? Sigue sin guardar hasta que pulses Guardar.`)) return;
    rutas.forEach((ruta) => {
      const valor = leerRuta(PARAMETROS_INICIALES, ruta);
      asignarRuta(ruta, typeof valor === "object" && valor !== null ? clonar(valor) : valor ?? null);
    });
    pintar(`${nombre} volvió a los valores iniciales. Sin guardar.`);
    avisoBreve(`${nombre}: valores iniciales`);
    avisarCambiosSinGuardar();
    document.dispatchEvent(new Event("liquidacion-actualizada"));
  }

  window.addEventListener("beforeunload", (evento) => {
    if (!hayCambiosSinGuardar()) return;
    evento.preventDefault();
    evento.returnValue = "";
  });

  contenedor.addEventListener("input", (evento) => {
    if (evento.target.id === "buscar-parametro") {
      buscar(evento.target.value);
      return;
    }
    const campo = evento.target;
    if (!campo.dataset || !campo.dataset.ruta) return;
    if (campo.dataset.ruta === "director.metodo" || campo.dataset.ruta === "director.regla100") return;
    if (campo.type === "checkbox") asignarRuta(campo.dataset.ruta, campo.checked);
    else if (campo.dataset.tipo === "texto") asignarRuta(campo.dataset.ruta, campo.value);
    else if (campo.dataset.escala) {
      const numero = numeroFlexible(campo.value);
      asignarRuta(campo.dataset.ruta, numero === null ? null : numero / Number(campo.dataset.escala));
    } else if (campo.dataset.unidad === "pesos") {
      const numero = numeroPesos(campo.value);
      asignarRuta(campo.dataset.ruta, numero === null ? null : Math.round(numero));
    } else asignarRuta(campo.dataset.ruta, numeroFlexible(campo.value));
    refrescarCalculados(contenedor);
    marcarCambios(contenedor);
    if (hayCambiosSinGuardar()) avisarCambiosSinGuardar();
    else avisarCambiosGuardados();
    document.dispatchEvent(new Event("liquidacion-actualizada"));
  });

  contenedor.addEventListener("change", (evento) => {
    const campo = evento.target;
    if (campo.dataset.ruta === "director.metodo") {
      asignarRuta("director.metodo", campo.value);
      avisarCambiosSinGuardar();
      document.dispatchEvent(new Event("liquidacion-actualizada"));
    }
    if (campo.dataset.ruta === "director.regla100") {
      asignarRuta("director.regla100", campo.value === "true");
      avisarCambiosSinGuardar();
      document.dispatchEvent(new Event("liquidacion-actualizada"));
    }
    if (campo.id === "archivo-json" && campo.files[0]) {
      const lector = new FileReader();
      lector.onload = () => {
        try {
          importarJson(String(lector.result));
          marcarComoGuardado();
          pintar("Parámetros importados y guardados en este navegador.");
          avisoBreve("Parámetros importados y guardados en este navegador.");
          avisarCambiosGuardados();
          document.dispatchEvent(new Event("liquidacion-actualizada"));
        } catch (error) {
          decir(contenedor, error.message);
        }
      };
      lector.readAsText(campo.files[0]);
    }
  });

  contenedor.addEventListener("click", (evento) => {
    const id = evento.target.id;
    const pestana = evento.target.closest("[data-grupo-tab]");
    if (pestana) {
      activarGrupo(pestana.dataset.grupoTab);
      return;
    }
    const restaurarGrupo = evento.target.closest("[data-restaurar-grupo]");
    if (restaurarGrupo) {
      restaurarRutas(restaurarGrupo.dataset.restaurarGrupo.split("|"), restaurarGrupo);
      return;
    }
    if (evento.target.dataset.mesVista) {
      mesMetas = evento.target.dataset.mesVista;
      pintar("");
    }
    if (id === "btn-guardar") {
      guardarEnNavegador();
      marcarComoGuardado();
      avisoBreve("Parámetros guardados en este navegador");
      avisarCambiosGuardados();
      decir(contenedor, "Guardado en este navegador. No se envió a internet.");
      marcarCambios(contenedor);
    }
    if (id === "btn-exportar") exportarJson();
    if (id === "btn-restaurar") {
      restaurarValoresIniciales();
      marcarComoGuardado();
      pintar("Volviste a los valores iniciales y quedaron guardados en este navegador.");
      avisoBreve("Valores iniciales restaurados en este navegador");
      avisarCambiosGuardados();
      document.dispatchEvent(new Event("liquidacion-actualizada"));
    }
    if (id === "btn-borrar") {
      if (!window.confirm("¿Borrar los datos guardados en este navegador?")) return;
      borrarDatosGuardados();
      decir(contenedor, "Se borró la copia del navegador. Lo que ves sigue en esta pestaña hasta que recargues o pulses Restaurar.");
    }
  });

  contenedor.addEventListener("focusout", (evento) => {
    const campo = evento.target;
    if (campo.dataset?.unidad !== "pesos") return;
    const numero = numeroPesos(campo.value);
    campo.value = numero === null ? "" : Math.round(numero).toLocaleString("es-CO");
  });

  // Solo se dispara después de importar y guardar un JSON.
  document.addEventListener("parametros-repintar", (evento) => {
    marcarComoGuardado();
    pintar(evento.detail || "");
  });
  // v16: el equipo llegó con el archivo de encabezados (HTML de doble clic).
  document.addEventListener("equipo-cargado", (evento) => {
    pintar(evento.detail || "");
    avisarCambiosSinGuardar();
  });
  document.addEventListener("metas-anteriores-cargadas", () => {
    pintar("Metas de la política anterior leídas del archivo. Sin guardar.");
    avisarCambiosSinGuardar();
  });

  pintar("");
}
