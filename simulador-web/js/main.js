/**
 * Arranque del simulador: 3 pestañas superiores, perfil y repintado.
 */
import "./recursos.js";
import { suscribir, obtenerEstado, establecerPerfil } from "./estado.js";
import { cargarPerfilEjemplo, leerPerfilRecordado } from "./perfil.js";
import { pintarTodo, pintarFranjaPublica } from "./vistas.js";

const VISTAS = ["simular", "analisis", "archivo"];
const pasos = [...document.querySelectorAll(".tabs-vista__item")];
let panelActivo = "simular";
let pintarCompleto = true;

export function mostrarPanel(id) {
  if (!VISTAS.includes(id)) id = "simular";
  panelActivo = id;
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
  if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  pintarCompleto = true;
  pintarTodo();
  pintarCompleto = false;
}

pasos.forEach((paso) => {
  paso.addEventListener("click", (ev) => {
    ev.preventDefault();
    mostrarPanel(paso.dataset.panel);
  });
});

suscribir(() => {
  if (pintarCompleto) return;
  pintarFranjaPublica(obtenerEstado());
  if (panelActivo === "simular" || panelActivo === "analisis") {
    pintarCompleto = true;
    pintarTodo();
    pintarCompleto = false;
    document.querySelectorAll(".panel").forEach((panel) => {
      const visible = panel.id === `panel-${panelActivo}`;
      panel.hidden = !visible;
      panel.classList.toggle("activo", visible);
    });
  }
});

export function pedirRepintado() {
  pintarCompleto = true;
  pintarTodo();
  pintarCompleto = false;
  document.querySelectorAll(".panel").forEach((panel) => {
    const visible = panel.id === `panel-${panelActivo}`;
    panel.hidden = !visible;
    panel.classList.toggle("activo", visible);
  });
}

window.ANALFE_PEDIR_REPINTADO = pedirRepintado;
window.ANALFE_SIM = { obtenerEstado, mostrarPanel };

async function arrancar() {
  const hash = (location.hash || "#simular").slice(1);
  const legacy = {
    perfil: "archivo",
    ventas: "simular",
    base: "simular",
    diversificacion: "simular",
    satisfaccion: "simular",
    btl: "simular",
    resultado: "analisis",
    sensibilidad: "analisis",
    guardar: "archivo",
  };
  const vista = VISTAS.includes(hash) ? hash : legacy[hash] || "simular";
  pintarCompleto = true;
  const recordado = leerPerfilRecordado();
  if (recordado?.ok) {
    establecerPerfil(recordado.perfil, "archivo");
  } else {
    const res = await cargarPerfilEjemplo("comercial");
    if (res.ok) establecerPerfil(res.perfil, "ejemplo");
  }
  mostrarPanel(vista);
}

arrancar().catch((e) => {
  console.error(e);
  document.body?.insertAdjacentHTML(
    "afterbegin",
    `<p class="aviso-caja">No se pudo iniciar el simulador. ${String(e.message || e)}</p>`
  );
});
