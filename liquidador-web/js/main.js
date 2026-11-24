/**
 * Arranque, riel de pasos y barra superior.
 * La pestaña de parámetros se llena desde parametros.js.
 */

import { iniciarCarga, obtenerEventos, obtenerFacturacion } from "./carga.js";
import { iniciarFormularioParametros, obtenerParametros } from "./parametros.js";
import { cargarEncabezadosLocales } from "./encabezados.js";
import { pintarVistas } from "./vistas.js?v=20261123h";

const pasos = [...document.querySelectorAll(".riel__paso")];
const HASH = {
  cargar: "cargar",
  parametros: "parametros",
  equipo: "equipo",
  detalle: "ficha",
  btl: "btl",
  director: "director",
  exportar: "exportar",
};
const DESDE_HASH = Object.fromEntries(Object.entries(HASH).map(([panel, hash]) => [hash, panel]));
const REQUIERE_FACTURACION = new Set(["equipo", "detalle", "btl", "director", "exportar"]);

function hayFacturacion() {
  return obtenerFacturacion().length > 0;
}

export function mostrarPanel(id, opciones = {}) {
  if (REQUIERE_FACTURACION.has(id) && !hayFacturacion()) return;
  document.querySelectorAll(".panel").forEach((panel) => {
    const visible = panel.id === `panel-${id}`;
    panel.hidden = !visible;
    panel.classList.toggle("activo", visible);
  });
  pasos.forEach((paso) => {
    const activo = paso.dataset.panel === id;
    paso.classList.toggle("activa", activo);
    if (activo) paso.setAttribute("aria-current", "page");
    else paso.removeAttribute("aria-current");
  });
  const hash = HASH[id] || id;
  if (location.hash !== `#${hash}`) history.replaceState(null, "", `#${hash}`);
  sessionStorage.setItem("analfe-pestana", id);
  if (opciones.foco) document.getElementById("contenido")?.focus({ preventScroll: true });
}

function actualizarPasos() {
  const facturas = hayFacturacion();
  const eventos = obtenerEventos().length > 0;
  const pesos = obtenerParametros().pesos;
  const suma = pesos.ventas + pesos.baseSocial + pesos.serfiscal + pesos.innovacion + pesos.satisfaccion;
  const parametrosListos = suma === 100;
  pasos.forEach((paso) => {
    const id = paso.dataset.panel;
    const circulo = paso.querySelector(".riel__circulo");
    const punto = paso.querySelector(".riel__punto");
    const numero = String(pasos.indexOf(paso) + 1);
    let estado = "";
    if (id === "cargar") estado = facturas && eventos ? "listo" : "pendiente";
    if (id === "parametros") estado = parametrosListos ? "listo" : "pendiente";
    paso.dataset.estado = estado;
    paso.classList.toggle("riel__paso--listo", estado === "listo");
    if (circulo) circulo.textContent = estado === "listo" ? "✓" : numero;
    if (punto) punto.hidden = estado !== "pendiente";
    const apagada = REQUIERE_FACTURACION.has(id) && !facturas;
    paso.setAttribute("aria-disabled", apagada ? "true" : "false");
    paso.title = apagada ? "Primero carga la facturación" : "";
  });
  const activa = pasos.find((paso) => paso.getAttribute("aria-current") === "page");
  if (activa && activa.getAttribute("aria-disabled") === "true") mostrarPanel("cargar");
}

pasos.forEach((paso) => {
  paso.addEventListener("click", (evento) => {
    evento.preventDefault();
    if (paso.getAttribute("aria-disabled") === "true") return;
    mostrarPanel(paso.dataset.panel, { foco: true });
  });
});

document.querySelector(".riel").addEventListener("keydown", (evento) => {
  if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return;
  const actual = evento.target.closest(".riel__paso");
  if (!actual) return;
  const habilitados = pasos.filter((paso) => paso.getAttribute("aria-disabled") !== "true");
  const indice = habilitados.indexOf(actual);
  if (indice < 0) return;
  evento.preventDefault();
  const delta = evento.key === "ArrowDown" ? 1 : -1;
  habilitados[(indice + delta + habilitados.length) % habilitados.length].focus();
});

document.addEventListener("mostrar-panel", (evento) => mostrarPanel(evento.detail, { foco: true }));

function aplicarRiel(modo) {
  document.documentElement.dataset.riel = modo;
  localStorage.setItem("analfe-riel", modo);
  const boton = document.querySelector("#plegar-riel");
  const expandido = modo === "expandido";
  boton.textContent = expandido ? "«" : "»";
  boton.setAttribute("aria-label", expandido ? "Contraer el menú" : "Expandir el menú");
}

document.querySelector("#plegar-riel").addEventListener("click", () => {
  aplicarRiel(document.documentElement.dataset.riel === "expandido" ? "colapsado" : "expandido");
});
aplicarRiel(document.documentElement.dataset.riel === "expandido" ? "expandido" : "colapsado");

function aplicarDensidad(modo) {
  document.documentElement.dataset.densidad = modo;
  localStorage.setItem("analfe-densidad", modo);
  const boton = document.querySelector("#btn-densidad");
  const comodo = modo === "comodo";
  boton.textContent = comodo ? "Cómodo" : "Compacto";
  boton.setAttribute("aria-label", comodo ? "Densidad cómoda. Cambiar a compacto" : "Densidad compacta. Cambiar a cómodo");
}

document.querySelector("#btn-densidad").addEventListener("click", () => {
  aplicarDensidad(document.documentElement.dataset.densidad === "compacto" ? "comodo" : "compacto");
});
aplicarDensidad(document.documentElement.dataset.densidad === "comodo" ? "comodo" : "compacto");

function llenarMeses() {
  const select = document.querySelector("#mes-carga");
  if (!select) return;
  const transicion = obtenerParametros().transicion || {};
  const nombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const partes = (valor) => String(valor || "").split("-").map(Number);
  let [anio, mes] = partes(transicion.inicio || transicion.desde);
  const [anioFin, mesFin] = partes(transicion.fin || transicion.hasta);
  if (!anio || !mes || !anioFin || !mesFin) return;
  const actual = select.value || transicion.inicio || transicion.desde || "";
  const opciones = [];
  let guardia = 0;
  while ((anio < anioFin || (anio === anioFin && mes <= mesFin)) && guardia < 36) {
    const valor = `${anio}-${String(mes).padStart(2, "0")}`;
    opciones.push(`<option value="${valor}">${nombres[mes - 1]} ${anio}</option>`);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
    guardia += 1;
  }
  const firma = opciones.join("");
  if (select.dataset.meses === firma) return;
  select.dataset.meses = firma;
  select.innerHTML = firma;
  if ([...select.options].some((opcion) => opcion.value === actual)) select.value = actual;
}

llenarMeses();
iniciarCarga(document.querySelector("#panel-cargar"));
iniciarFormularioParametros(document.querySelector("#panel-parametros"));
pintarVistas();
actualizarPasos();
document.addEventListener("liquidacion-actualizada", () => {
  llenarMeses();
  pintarVistas();
  actualizarPasos();
});
// Encabezados (datos personales locales). Con Live Server se leen de datos/encabezados_comerciales.json; si no, botón en Cargar.
cargarEncabezadosLocales();

const guardada = DESDE_HASH[location.hash.slice(1)] || sessionStorage.getItem("analfe-pestana") || "cargar";
mostrarPanel(REQUIERE_FACTURACION.has(guardada) && !hayFacturacion() ? "cargar" : guardada);