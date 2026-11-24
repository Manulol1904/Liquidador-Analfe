/**
 * v18 · Sección «Eventos BTL» del paso Cargar.
 * Principal: cargar uno o varios archivos de liquidación/ejecución de evento (arrastrar o elegir).
 * Secundaria: «Ingresar un evento a mano» (mismos campos, celdas amarillas).
 * Todo se lee en este computador con la librería xlsx de la app; nada sale a internet.
 * Simulación. No es un pago oficial.
 */
import { CAMPOS_BTL, agregarEvento, eventoVacio, faltantes, leerEventoBtl, mesDeFecha, obtenerEventosBtlImportados, presupuestoCalculado, quitarEvento, textoOrigen, utilidadBase, valoresParaCalculo } from "./btlArchivos.js";
import { obtenerParametros } from "./parametros.js";
import { avisoBreve, escaparHtml, numeroFlexible, numeroPesos, plural } from "./utilidades.js";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const pesos = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "" : Number(v).toLocaleString("es-CO", { maximumFractionDigits: 2 }));
const pesosTexto = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "Falta" : `$ ${Math.round(Number(v)).toLocaleString("es-CO")}`);
const pct = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "" : (Number(v) * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 }));
const pctTexto = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? "Pendiente" : `${(Number(v) * 100).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`);
const clave = (t) => String(t ?? "").trim().toUpperCase().replace(/\s+/g, " ");

export function htmlSeccionBtl() {
  return `
    <article class="tarjeta seccion-btl" id="seccion-btl" aria-labelledby="titulo-seccion-btl">
      <div class="seccion-btl__cabeza">
        <h3 id="titulo-seccion-btl">Eventos BTL · 5.11.5</h3>
        <span class="badge badge--aviso">Simulación. No es un pago oficial</span>
      </div>
      <p class="nota-union">Cargue el Excel de liquidación / ejecución de cada evento (uno o varios). La app toma <strong>Total ingresos</strong> y <strong>Total costos</strong> de la columna EJECUCIÓN y el <strong>Excedente neto</strong> de la columna PRESUPUESTO; las reglas, topes y porcentajes salen de Parámetros. Asigne cada evento a su comercial: el archivo no lo trae.</p>
      <div class="zona-btl" data-zona-btl role="button" tabindex="0" aria-label="Eventos BTL: arrastra uno o varios Excel o pulsa para elegir">
        <input class="sr-solo" type="file" id="archivo-btl-eventos" accept=".xlsx,.xls" multiple tabindex="-1">
        <span class="zona-archivo__icono" aria-hidden="true">⬆</span>
        <p>Arrastra aquí los Excel de los eventos o <span class="enlace">elige archivos</span></p>
        <small>.xlsx · uno o varios · se leen solo en este computador</small>
      </div>
      <p class="nota-union" id="nota-btl-archivos" role="status"></p>
      <div id="lista-btl-eventos"></div>
      <details class="btl-manual" id="btl-manual">
        <summary>Ingresar un evento a mano (opción secundaria)</summary>
        <p>Úselo solo si no tiene el archivo del evento. Se agrega un evento con los mismos campos en celdas amarillas para escribir.</p>
        <button type="button" class="boton" id="btl-manual-agregar">Agregar evento a mano</button>
      </details>
    </article>`;
}

function opcionesMes(actual) {
  const anio = Number(String(actual || obtenerParametros().transicion?.desde || "2026").slice(0, 4)) || 2026;
  const lista = [];
  for (const a of [anio - 1, anio, anio + 1]) for (let m = 1; m <= 12; m += 1) lista.push(`${a}-${String(m).padStart(2, "0")}`);
  return `<option value="">Elija el mes</option>` + lista.map((m) => `<option value="${m}" ${m === actual ? "selected" : ""}>${MESES[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}</option>`).join("");
}

function htmlEvento(ev, ctx) {
  const comerciales = (obtenerParametros().comerciales || []).map((c) => c.nombre);
  const produccionBtl = ctx.eventosProduccion().filter((x) => clave(`${x.grupo || ""} ${x.producto || ""}`).includes(clave(obtenerParametros().hojas?.btl || "btl")));
  const v = valoresParaCalculo(ev);
  const faltan = faltantes(ev);
  const costos = obtenerParametros().costos || {};
  const pc = presupuestoCalculado(ev, costos);
  const utilidadApp = utilidadBase(v.ingreso, v.costo, costos);
  const margenNeto = utilidadApp !== null && v.ingreso ? utilidadApp / v.ingreso : null;
  const margenBruto = v.ingreso && v.costo !== null ? (v.ingreso - v.costo) / v.ingreso : null;
  const decide = obtenerParametros().btlUmbrales?.margenDecide === "neto" ? "neto" : "bruto";
  const netoArchivoE = ev.campos.excedenteNeto?.ejecucion;
  const netoArchivoP = ev.campos.excedenteNeto?.presupuesto;
  const cumplimiento = utilidadApp !== null && pc.utilidadPresupuestada ? utilidadApp / pc.utilidadPresupuestada : null;
  const icaP = v.ingresoPresupuesto === null ? null : v.ingresoPresupuesto * costos.ica;
  const gmfP = v.costoPresupuesto === null ? null : v.costoPresupuesto * costos.gmf;
  const icaE = v.ingreso === null ? null : v.ingreso * costos.ica;
  const gmfE = v.costo === null ? null : v.costo * costos.gmf;
  const tasaIca = (Number(costos.ica) * 1000).toLocaleString("es-CO", { maximumFractionDigits: 6 });
  const tasaGmf = (Number(costos.gmf) * 1000).toLocaleString("es-CO", { maximumFractionDigits: 6 });
  const filaComp = (t, a, b, clase = "") => `<tr class="${clase}"><th scope="row">${t}</th><td class="dinero">${a}</td><td class="dinero">${b}</td></tr>`;
  const comparacion = `
      <table class="tabla tabla-btl-calculo">
        <caption>Cálculo de la app (5.11.5) · Simulación. No es un pago oficial.</caption>
        <thead><tr><th>Concepto</th><th>Presupuesto</th><th>Ejecución (real)</th></tr></thead>
        <tbody>
          ${filaComp("Total ingresos", pesosTexto(v.ingresoPresupuesto), pesosTexto(v.ingreso))}
          ${filaComp("− Total costos", pesosTexto(v.costoPresupuesto), pesosTexto(v.costo))}
          ${filaComp(`− ICA (${tasaIca} por mil de los ingresos)`, pesosTexto(icaP), pesosTexto(icaE))}
          ${filaComp(`− 4×1000 (${tasaGmf} por mil del costo)`, pesosTexto(gmfP), pesosTexto(gmfE))}
          ${filaComp("<strong>= Utilidad base (app)</strong>", `<strong>${pesosTexto(pc.presupuestoCalculado ? pc.utilidadPresupuestada : null)}</strong>`, `<strong>${pesosTexto(utilidadApp)}</strong>`, "fila-total")}
          ${ev.tipo !== "manual" ? filaComp("Excedente neto del archivo (4×1000 sobre ingresos)", pesosTexto(netoArchivoP), pesosTexto(netoArchivoE), "fila-referencia") : ""}
          ${ev.tipo !== "manual" ? filaComp("Diferencia app − archivo", pesosTexto(pc.presupuestoCalculado && netoArchivoP !== null && netoArchivoP !== undefined ? pc.utilidadPresupuestada - netoArchivoP : null), pesosTexto(utilidadApp !== null && netoArchivoE !== null && netoArchivoE !== undefined ? utilidadApp - netoArchivoE : null), "fila-referencia") : ""}
          ${filaComp(`Margen bruto (ingresos − total costos) / ingresos ${decide === "bruto" ? '<span class="badge badge--paga">decide la tabla</span>' : '<span class="badge badge--neutro">informativo</span>'}`, pctTexto(v.ingresoPresupuesto && v.costoPresupuesto !== null ? (v.ingresoPresupuesto - v.costoPresupuesto) / v.ingresoPresupuesto : null), pctTexto(margenBruto), decide === "bruto" ? "fila-decide" : "")}
          ${filaComp(`Margen neto (con ICA y 4×1000) ${decide === "neto" ? '<span class="badge badge--paga">decide la tabla</span>' : '<span class="badge badge--neutro">informativo</span>'}`, pctTexto(pc.presupuestoCalculado ? pc.utilidadPresupuestada / v.ingresoPresupuesto : null), pctTexto(margenNeto), decide === "neto" ? "fila-decide" : "")}
          ${filaComp("Cumplimiento = utilidad real ÷ presupuestada", "", pctTexto(cumplimiento), "fila-total")}
        </tbody>
      </table>
      ${!pc.presupuestoCalculado && pc.utilidadPresupuestada !== null ? `<p class="estado-vacio estado-vacio--aviso">⚠ Faltan ingresos o costos presupuestados: se usa el excedente neto presupuestado del archivo (${pesosTexto(pc.utilidadPresupuestada)}).</p>` : ""}`;
  const entrada = (campo, col, valor, porcentaje) => {
    const falta = valor === null && Boolean(CAMPOS_BTL.find((c) => c.clave === campo)?.usa);
    return `<input class="entrada campo-editable${falta ? " falta-dato" : ""}" type="text" inputmode="decimal" data-btl="${ev.id}" data-campo="${campo}" data-col="${col}" value="${escaparHtml(porcentaje ? pct(valor) : pesos(valor))}" aria-label="${escaparHtml(campo)} ${col}"${falta ? ' placeholder="Falta: escríbalo"' : ""}>${porcentaje ? " %" : ""}`;
  };
  const filas = CAMPOS_BTL.map((campo) => {
    const d = ev.campos[campo.clave] || {};
    const origen = ev.tipo === "manual" ? "a mano" : [d.celdaP, d.celdaE].filter(Boolean).map((c) => c.split("!")[1]).join(" · ") || "no encontrado";
    return `<tr${campo.usa ? ' class="usa-calculo"' : ""}>
      <th scope="row">${escaparHtml(campo.titulo)}${campo.usa ? ` <span class="badge badge--neutro">→ ${escaparHtml(campo.usa)}</span>` : ""}${campo.compara ? ` <span class="badge badge--neutro">solo para comparar</span>` : ""}</th>
      <td>${entrada(campo.clave, "presupuesto", d.presupuesto, campo.porcentaje)}</td>
      <td>${entrada(campo.clave, "ejecucion", d.ejecucion, campo.porcentaje)}</td>
      <td class="origen-celda"><details class="ver-detalle"><summary>Ver detalle</summary>${escaparHtml(origen)}</details></td>
    </tr>`;
  }).join("");
  const otrosLista = comerciales.filter((n) => n !== ev.responsable);
  return `
    <section class="evento-btl${faltan.length ? " evento-btl--incompleto" : ""}" data-evento-btl="${ev.id}">
      <header class="evento-btl__cabeza">
        <input class="entrada campo-editable evento-btl__nombre${ev.nombre ? "" : " falta-dato"}" data-btl="${ev.id}" data-dato="nombre" value="${escaparHtml(ev.nombre)}" placeholder="Nombre del evento" aria-label="Nombre del evento">
        <span class="badge ${ev.tipo === "manual" ? "badge--neutro" : "badge--exito"}">${ev.tipo === "manual" ? "A mano" : "Archivo"}</span>
        <button type="button" class="boton boton--texto" data-quitar-btl="${ev.id}">Quitar</button>
      </header>
      <p class="evento-btl__origen">${escaparHtml(textoOrigen(ev))}${ev.columnasDeducidas ? " · no se encontraron los encabezados PRESUPUESTO/EJECUCIÓN: se usaron las columnas F y H" : ""}</p>
      <div class="evento-btl__datos">
        <label>Lugar <input class="entrada campo-editable" data-btl="${ev.id}" data-dato="lugar" value="${escaparHtml(ev.lugar)}"></label>
        <label>Fecha <input class="entrada campo-editable" data-btl="${ev.id}" data-dato="fechaTexto" value="${escaparHtml(ev.fechaTexto)}" placeholder="p. ej. octubre 23 de 2026"> <small>${escaparHtml(ev.celdaFecha ? ev.celdaFecha.split("!")[1] : "")}</small></label>
        <label>Mes asignado <select class="entrada campo-editable${ev.mes ? "" : " falta-dato"}" data-btl="${ev.id}" data-dato="mes">${opcionesMes(ev.mes)}</select></label>
        <label>Asistentes <input class="entrada campo-editable" data-btl="${ev.id}" data-dato="asistentes" value="${escaparHtml(ev.asistentes ?? "")}" inputmode="numeric"></label>
      </div>
      <div class="evento-btl__asignar">
        <label>Comercial responsable
          <select class="entrada campo-editable${ev.responsable ? "" : " falta-dato"}" data-btl="${ev.id}" data-dato="responsable">
            <option value="">Elija el comercial</option>
            ${comerciales.map((n) => `<option ${n === ev.responsable ? "selected" : ""}>${escaparHtml(n)}</option>`).join("")}
          </select>
        </label>
        <label>Evento del informe de Producción
          <select class="entrada campo-editable" data-btl="${ev.id}" data-dato="unidoA">
            <option value="">No unir: evento nuevo</option>
            ${produccionBtl.map((x) => `<option value="${escaparHtml(x.evento)}" ${clave(x.evento) === clave(ev.unidoA) ? "selected" : ""}>${escaparHtml(`${x.evento} · ${x.detalle || x.producto || x.grupo || ""}`)}</option>`).join("")}
          </select>
        </label>
        <fieldset class="evento-btl__otros"><legend>También participaron (opcional)</legend>
          ${otrosLista.length ? otrosLista.map((n) => `<label><input type="checkbox" data-btl="${ev.id}" data-otro="${escaparHtml(n)}" ${(ev.otros || []).includes(n) ? "checked" : ""}> ${escaparHtml(n)}</label>`).join("") : "<small>Cargue los encabezados para ver el equipo.</small>"}
        </fieldset>
      </div>
      ${ev.unidoA ? `<p class="nota-union">Unido al evento ${escaparHtml(ev.unidoA)} de Producción: su ingreso, costo y utilidad presupuestada salen de este archivo (no se suma dos veces).${ev.unionAutomatica ? " Se unió solo porque el ingreso coincide; cámbielo si no es el mismo evento." : ""}</p>` : ""}
      ${htmlReparto(ev)}
      <table class="tabla tabla-btl-evento">
        <thead><tr><th>Concepto</th><th>Presupuesto</th><th>Ejecución</th><th>Celda</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      ${comparacion}
      ${faltan.length ? `<p class="estado-vacio estado-vacio--aviso">⚠ Falta: ${escaparHtml(faltan.join(", "))}. Escríbalo en las celdas amarillas.</p>` : ""}
    </section>`;
}

/** v19 (5.12): reparto opcional en %. Por defecto, el responsable al 100 %. Solo aplica si se marca como aprobado antes del cierre. */
function htmlReparto(ev) {
  if (!ev.responsable || !(ev.otros || []).length) return "";
  const nombres = [ev.responsable, ...ev.otros];
  const mapa = ev.reparto || {};
  const suma = nombres.reduce((t, n) => t + (Number(mapa[n]) || 0), 0);
  const filas = nombres.map((n) => `<label>${escaparHtml(n)}${n === ev.responsable ? " (responsable)" : ""} <input class="entrada campo-editable reparto-pct" type="text" inputmode="decimal" data-btl="${ev.id}" data-reparto="${escaparHtml(n)}" value="${mapa[n] ? pct(mapa[n]) : ""}" placeholder="${n === ev.responsable ? "100" : "0"}"> %</label>`).join("");
  const aviso = !ev.repartoAprobado
    ? "Sin aprobación: liquida solo el responsable al 100 % (5.12)."
    : suma === 0 ? "Escriba los porcentajes. Vacío = responsable al 100 %."
      : suma > 1 + 1e-9 ? `⚠ La suma es ${pctTexto(suma)}: no puede pasar de 100 %. El evento queda Pendiente.`
        : `Suma ${pctTexto(suma)}${suma < 1 - 1e-9 ? " (lo que falta para 100 % no se paga)" : ""}.`;
  return `
      <div class="evento-btl__reparto">
        <label class="reparto-aprobado"><input type="checkbox" data-btl="${ev.id}" data-dato="repartoAprobado" ${ev.repartoAprobado ? "checked" : ""}> Reparto aprobado antes del cierre (5.12)</label>
        <div class="reparto-filas">${filas}</div>
        <p class="nota-union${suma > 1 + 1e-9 && ev.repartoAprobado ? " texto-error" : ""}">${escaparHtml(aviso)} Cada uno recibe su % del valor de la tabla y del tope por evento con su propio IMR; el tope anual y el score son de cada persona; la salvaguarda baja a todos en la misma proporción.</p>
      </div>`;
}

export function iniciarSeccionBtl(contenedor, ctx) {
  const seccion = contenedor.querySelector("#seccion-btl");
  if (!seccion) return;
  const lista = seccion.querySelector("#lista-btl-eventos");
  const nota = seccion.querySelector("#nota-btl-archivos");
  const entrada = seccion.querySelector("#archivo-btl-eventos");
  const zona = seccion.querySelector("[data-zona-btl]");
  const avisar = () => document.dispatchEvent(new Event("liquidacion-actualizada"));
  function pintar() {
    const eventos = obtenerEventosBtlImportados();
    lista.innerHTML = eventos.map((ev) => htmlEvento(ev, ctx)).join("");
  }

  async function leerArchivos(archivos) {
    if (!window.XLSX) { nota.textContent = "No se encontró la librería xlsx."; return; }
    const leidos = [], errores = [];
    for (const archivo of archivos) {
      try {
        const libro = window.XLSX.read(await archivo.arrayBuffer(), { type: "array", cellDates: true, cellFormula: false });
        const datos = leerEventoBtl(libro, archivo.name, window.XLSX);
        const ev = agregarEvento(datos, "archivo");
        // Unión sugerida: un evento BTL de Producción con el mismo ingreso.
        const ingreso = valoresParaCalculo(ev).ingreso;
        const marca = clave(obtenerParametros().hojas?.btl || "btl");
        const igual = ctx.eventosProduccion().filter((x) => clave(`${x.grupo || ""} ${x.producto || ""}`).includes(marca) && ingreso !== null && Math.abs(Number(x.ingreso) - ingreso) < 1);
        const yaUnido = (n) => obtenerEventosBtlImportados().some((otro) => otro !== ev && clave(otro.unidoA) === clave(n));
        if (igual.length === 1 && !yaUnido(igual[0].evento)) {
          ev.unidoA = igual[0].evento; ev.unionAutomatica = true;
          if (!ev.responsable && igual[0].comercial) ev.responsable = (obtenerParametros().comerciales || []).find((c) => clave(c.nombre) === clave(igual[0].comercial) || clave(c.nombreFacturacion) === clave(igual[0].comercial))?.nombre || "";
        }
        leidos.push(ev);
      } catch (error) {
        errores.push(`${archivo.name}: ${error.message}`);
      }
    }
    nota.innerHTML = [leidos.length ? `${leidos.length} eventos ✓` : "", ...errores.map((e) => `<span class="texto-error">${escaparHtml(e)}</span>`)].filter(Boolean).join("<br>");
    if (leidos.length) avisoBreve(`Eventos BTL cargados · ${leidos.length}`);
    pintar();
    avisar();
  }

  entrada.addEventListener("change", () => { const archivos = [...entrada.files]; entrada.value = ""; if (archivos.length) leerArchivos(archivos); });
  zona.addEventListener("click", () => entrada.click());
  zona.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); entrada.click(); } });
  zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("arrastrando"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("arrastrando"));
  zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("arrastrando"); const archivos = [...(e.dataTransfer?.files || [])]; if (archivos.length) leerArchivos(archivos); });

  seccion.querySelector("#btl-manual-agregar").addEventListener("click", () => {
    const ev = agregarEvento({ ...eventoVacio(), mes: document.querySelector("#mes-carga")?.value || null }, "manual");
    pintar();
    seccion.querySelector(`[data-evento-btl="${ev.id}"] .evento-btl__nombre`)?.focus();
    avisar();
  });

  lista.addEventListener("click", (e) => {
    const id = e.target.closest("[data-quitar-btl]")?.dataset.quitarBtl;
    if (!id) return;
    quitarEvento(id); pintar(); avisar();
  });

  lista.addEventListener("change", (e) => {
    const el = e.target;
    const ev = obtenerEventosBtlImportados().find((x) => x.id === el.dataset.btl);
    if (!ev) return;
    if (el.dataset.otro) {
      const otros = new Set(ev.otros || []);
      if (el.checked) otros.add(el.dataset.otro); else otros.delete(el.dataset.otro);
      ev.otros = [...otros];
    } else if (el.dataset.reparto) {
      const n = numeroFlexible(el.value);
      ev.reparto = { ...(ev.reparto || {}), [el.dataset.reparto]: n === null ? null : n / 100 };
    } else if (el.dataset.dato === "repartoAprobado") {
      ev.repartoAprobado = el.checked;
    } else if (el.dataset.campo) {
      const campo = CAMPOS_BTL.find((c) => c.clave === el.dataset.campo);
      let n = campo?.porcentaje ? numeroFlexible(el.value) : numeroPesos(el.value);
      if (campo?.porcentaje && n !== null) n = n / 100;
      ev.campos[el.dataset.campo] = { ...(ev.campos[el.dataset.campo] || {}), [el.dataset.col]: n };
      ev.editados = [...new Set([...(ev.editados || []), `${el.dataset.campo}.${el.dataset.col}`])];
    } else if (el.dataset.dato) {
      const dato = el.dataset.dato;
      if (dato === "asistentes") ev.asistentes = numeroFlexible(el.value);
      else ev[dato] = el.value;
      if (dato === "fechaTexto") { const m = mesDeFecha(el.value).mes; if (m) ev.mes = m; }
      if (dato === "unidoA") ev.unionAutomatica = false;
    }
    pintar();
    avisar();
  });

  // Si cambia el equipo (archivo de encabezados) o Producción, se repintan las listas de comerciales y eventos.
  document.addEventListener("liquidacion-actualizada", () => { if (!seccion.contains(document.activeElement)) pintar(); });
  pintar();
}
