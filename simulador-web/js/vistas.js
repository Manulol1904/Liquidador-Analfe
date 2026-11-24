/**
 * Pintado de paneles del simulador (3 vistas: Simular, Análisis, Archivo).
 * Resultados primero; fórmulas en <details>.
 */
import { escaparHtml, numeroPesos, porcentaje, numeroFlexible, formatoMiles } from "./utilidades.js";
import {
  obtenerEstado,
  establecerMes,
  parchearEntradas,
  establecerCampo,
  establecerPerfil,
  quitarPerfil,
} from "./estado.js";
import {
  badgeOrigen,
  cargarPerfilDeArchivo,
  cargarPerfilEjemplo,
  guardarPerfilRecordado,
  olvidarPerfilRecordado,
  hayPerfilRecordado,
} from "./perfil.js";
import { armarEscenario, descargarEscenario, abrirEscenarioDeArchivo } from "./escenario.js";
import { svgCurva, svgSensibilidad } from "./graficos.js";

const MES_CLAVE = {
  Octubre: "2026-10",
  Noviembre: "2026-11",
  Diciembre: "2026-12",
};

function formulaPlegable(lineas) {
  return `<details class="ver-formula"><summary>Ver fórmula</summary>${lineas
    .map((t) => `<p class="formula">${escaparHtml(t)}</p>`)
    .join("")}</details>`;
}

/** Badge de puntos del indicador (cabecera de tarjeta). */
function ptsBadge(puntos, tope) {
  const n = puntos == null || Number.isNaN(Number(puntos)) ? null : Number(puntos);
  const txt = n == null ? "—" : formatoMiles(n, 2);
  const topeTxt =
    tope != null && tope !== ""
      ? `<span class="pts-badge__tope">/ ${escaparHtml(String(tope))}</span>`
      : "";
  return `<span class="pts-badge" title="Puntos de este indicador">${txt}<span class="pts-badge__u">pts</span>${topeTxt}</span>`;
}

/** Lista compacta de trazabilidad (lab → valor). */
function trazaLista(filas) {
  if (!filas?.length) return "";
  return `<ul class="traza">${filas
    .map(
      (f) => `<li class="traza__item${f.total ? " traza__item--total" : ""}">
      <span class="traza__lab">${escaparHtml(f.lab)}</span>
      <span class="traza__val">${f.valHtml != null ? f.valHtml : escaparHtml(String(f.val ?? "—"))}</span>
    </li>`
    )
    .join("")}</ul>`;
}

const NOMBRE_PROD = {
  educacion: "Educación",
  mision: "Misión",
  congreso: "Congreso",
  cultural: "Cultural",
  pasantia: "Pasantía",
  patrocinios: "Patrocinios",
};

/** Desglose de puntos por producto de ventas. */
function trazaVentas(ventas, pesoVentas) {
  const prods = (ventas?.productos || []).filter((p) => p.participa);
  if (!prods.length) {
    return trazaLista([{ lab: "Sin productos con meta", val: "0 pts", total: true }]);
  }
  const filas = prods.map((p) => {
    const contrib = (p.peso || 0) * (p.cump || 0) * (pesoVentas || 0);
    const cumpTxt = p.pendiente ? "pendiente" : porcentaje(p.cump || 0, 0);
    const pesoTxt = `${((p.peso || 0) * 100).toFixed(0)} %`;
    let extra = "";
    if (p.clave === "educacion" && p.factorAplicado != null && !p.pendiente) {
      extra = ` · factor ${porcentaje(p.factorAplicado, 0)}`;
    }
    if (p.reconocida != null && !p.pendiente) {
      extra += ` · recog. ${numeroPesos(p.reconocida)}`;
    }
    return {
      lab: `${NOMBRE_PROD[p.clave] || p.clave} · ${cumpTxt}${extra} · peso ${pesoTxt}`,
      val: `${formatoMiles(contrib, 2)} pts`,
    };
  });
  filas.push({
    lab: "Total ventas",
    val: `${formatoMiles(ventas?.puntos ?? 0, 2)} pts`,
    total: true,
  });
  return trazaLista(filas);
}

/** Lista Excel: vacío = 100 %, o 0 % / 90 % / 100 %. */
function campoFactorMargen(ruta, valor) {
  const v =
    valor === null || valor === undefined || valor === ""
      ? ""
      : String(valor === 0.9 || valor === "0.9" ? "0.9" : valor === 0 || valor === "0" ? "0" : valor === 1 || valor === "1" ? "1" : valor);
  // Vacío = 100 % (como en Excel); no duplicar otra opción "100 %"
  const normalizado = v === "1" ? "" : v;
  return campoSelect(ruta, "Factor de margen", normalizado, [
    ["", "100 %"],
    ["0.9", "90 %"],
    ["0", "0 %"],
  ]);
}

function campoAmarillo(id, etiqueta, valor, { unidad = "", ayuda = "", meta = null } = {}) {
  const v = valor === null || valor === undefined ? "" : valor;
  const tieneMeta = meta != null && meta !== "";
  const metaTxt = tieneMeta
    ? escaparHtml(typeof meta === "number" ? numeroPesos(meta) : String(meta))
    : "";
  const pista = tieneMeta
    ? `<span class="campo__meta" title="Meta del perfil">Meta ${metaTxt}</span>`
    : ayuda
      ? `<span class="campo__pista">${escaparHtml(ayuda)}</span>`
      : `<span class="campo__pista" aria-hidden="true"></span>`;
  return `<label class="campo" for="${id}">
    <span class="campo__cabeza">
      <span class="campo__etiqueta">${escaparHtml(etiqueta)}${unidad ? ` <span class="campo__unidad">${escaparHtml(unidad)}</span>` : ""}</span>
      ${pista}
    </span>
    <input class="campo__input" id="${id}" inputmode="decimal" autocomplete="off" value="${escaparHtml(String(v))}" data-ruta="${id}" title="${escaparHtml(ayuda || "")}" />
  </label>`;
}

function campoSelect(ruta, etiqueta, valor, opciones) {
  const opts = opciones
    .map(([v, t]) => `<option value="${escaparHtml(v)}" ${valor === v ? "selected" : ""}>${escaparHtml(t)}</option>`)
    .join("");
  return `<label class="campo">
    <span class="campo__cabeza">
      <span class="campo__etiqueta">${escaparHtml(etiqueta)}</span>
    </span>
    <select class="campo__input campo__input--select" data-ruta="${escaparHtml(ruta)}">${opts}</select>
  </label>`;
}

function metaPerfil(perfil, mesNombre, producto) {
  const clave = MES_CLAVE[mesNombre];
  if (!clave || !perfil?.periodos) return null;
  const per = perfil.periodos.find((p) => p.mes === clave);
  const m = per?.metas?.[producto];
  return m == null || m === "" ? null : m;
}

export function pintarFranjaPublica(estado) {
  const el = document.getElementById("franja-resultados");
  if (!el) return;
  const r = estado.resultado;
  if (!r || r.puntaje == null) {
    el.innerHTML = `<p class="franja-kpi"><span>Puntaje</span><strong>—</strong></p>
      <p class="franja-kpi"><span>Comisión</span><strong>—</strong></p>`;
    return;
  }
  el.innerHTML = `
    <p class="franja-kpi"><span>Puntaje</span><strong>${formatoMiles(r.puntaje, 2)}</strong></p>
    <p class="franja-kpi"><span>Comisión</span><strong>${numeroPesos(r.comision ?? r.comisionNueva)}</strong></p>
    <p class="franja-kpi"><span>BTL</span><strong>${numeroPesos(r.btl?.estimado)}</strong></p>`;
}

async function aplicarPerfilCargado(res, panel) {
  const aviso = panel.querySelector("#aviso-perfil");
  if (!res.ok) {
    aviso.hidden = false;
    aviso.textContent = res.error;
    return false;
  }
  const msgs = [...(res.avisos || [])];
  aviso.hidden = msgs.length === 0;
  aviso.textContent = msgs.join(" ");
  establecerPerfil(res.perfil, "archivo");
  if (panel.querySelector("#chk-recordar")?.checked) {
    guardarPerfilRecordado(res.perfil);
  }
  window.ANALFE_PEDIR_REPINTADO?.();
  return true;
}

function bloqueKpi(estado) {
  const r = estado.resultado;
  if (!r) {
    return `<section class="kpi-franja" aria-label="Resultado en vivo">
      <p class="estado-vacio">Carga un perfil en Archivo para ver el resultado.</p>
    </section>`;
  }
  return `<section class="kpi-franja" aria-label="Resultado en vivo">
    <article class="kpi-bloque">
      <p class="kpi-etiqueta">Puntaje</p>
      <p class="kpi-valor">${formatoMiles(r.puntaje, 2)}</p>
    </article>
    <article class="kpi-bloque">
      <p class="kpi-etiqueta">% curva</p>
      <p class="kpi-valor">${porcentaje(r.factor, 1)}</p>
    </article>
    <article class="kpi-bloque kpi-bloque--acento">
      <p class="kpi-etiqueta">Comisión</p>
      <p class="kpi-valor">${numeroPesos(r.comision ?? r.comisionNueva)}</p>
    </article>
    <article class="kpi-bloque">
      <p class="kpi-etiqueta">Transición</p>
      <p class="kpi-valor">${numeroPesos(r.transicion?.paga)}</p>
    </article>
    <div class="kpi-hint">
      <p class="kpi-etiqueta">Para llegar a 80</p>
      <p>${escaparHtml(r.paraLlegar?.mensaje || "—")}</p>
    </div>
  </section>`;
}

function camposVentasMes(estado) {
  const e = estado.entradas;
  const p = estado.perfil;
  const mes = estado.mes;
  if (mes === "Trimestre") {
    return `
      ${campoAmarillo("educacionOct", "Educación octubre", e.educacionOct, { unidad: "$", meta: metaPerfil(p, "Octubre", "educacion") })}
      ${campoFactorMargen("factorMargenOct", e.factorMargenOct)}
      ${campoAmarillo("educacionNov", "Educación noviembre", e.educacionNov, { unidad: "$", meta: metaPerfil(p, "Noviembre", "educacion") })}
      ${campoAmarillo("educacionDic", "Educación diciembre", e.educacionDic, { unidad: "$", meta: metaPerfil(p, "Diciembre", "educacion") })}
      ${campoAmarillo("misionOct", "Misión facturas octubre", e.misionOct, { meta: metaPerfil(p, "Octubre", "mision") })}
      ${campoAmarillo("misionNov", "Misión noviembre", e.misionNov)}
      ${campoAmarillo("misionDic", "Misión diciembre", e.misionDic)}
      ${campoAmarillo("congresoOct", "Congreso octubre", e.congresoOct, { unidad: "$" })}
      ${campoAmarillo("culturalDic", "Cultural diciembre", e.culturalDic, { unidad: "$", meta: metaPerfil(p, "Diciembre", "cultural") })}`;
  }
  if (mes === "Noviembre") {
    return `
      ${campoAmarillo("educacionNov", "Educación / asistencia", e.educacionNov, { unidad: "$", meta: metaPerfil(p, "Noviembre", "educacion") })}
      ${campoAmarillo("misionNov", "Misión · facturas", e.misionNov)}
      ${campoAmarillo("congresoOct", "Congreso (si aplica)", e.congresoOct, { unidad: "$" })}`;
  }
  if (mes === "Diciembre") {
    return `
      ${campoAmarillo("educacionDic", "Educación / asistencia", e.educacionDic, { unidad: "$", meta: metaPerfil(p, "Diciembre", "educacion") })}
      ${campoAmarillo("misionDic", "Misión · facturas", e.misionDic)}
      ${campoAmarillo("culturalDic", "Cultural", e.culturalDic, { unidad: "$", meta: metaPerfil(p, "Diciembre", "cultural") })}`;
  }
  // Octubre (default)
  return `
    ${campoAmarillo("educacionOct", "Educación / asistencia", e.educacionOct, { unidad: "$", meta: metaPerfil(p, "Octubre", "educacion") })}
    ${campoFactorMargen("factorMargenOct", e.factorMargenOct)}
    ${campoAmarillo("misionOct", "Misión · facturas", e.misionOct, { meta: metaPerfil(p, "Octubre", "mision") })}
    ${campoAmarillo("congresoOct", "Congreso", e.congresoOct, { unidad: "$" })}`;
}

function pintarSimular(estado) {
  const panel = document.getElementById("panel-simular");
  if (!panel) return;
  const e = estado.entradas;
  const mes = estado.mes;
  const p = estado.perfil;
  const b = e.baseSocial || {};
  const s = e.serfiscal || {};
  const i = e.innovacion || {};
  const btl = e.btl || {};
  const r = estado.resultado;
  const rBase = r?.baseSocial;
  const rSer = r?.diversificacion?.serfiscal;
  const rInn = r?.diversificacion?.innovacion;
  const rSat = r?.satisfaccion;
  const pesos = r?.parametrosUsados?.pesos || estado.parametros?.pesos || {};
  const innParams = r?.parametrosUsados?.innovacion || estado.parametros?.innovacion || {};
  const scoreMin = p?.tipo === "director" ? 70 : 80;
  const rBtl = r?.btl;
  const topeCurva = r?.parametrosUsados?.curva?.tope ?? 1.2;
  const topeSer = pesos.serfiscal != null ? formatoMiles(pesos.serfiscal * topeCurva, 0) : "12";
  const topeInn = innParams.topeTrimestre ?? 12;

  const nombre = p?.persona?.nombreVisible || "Sin perfil";
  const cargo = [p?.persona?.cargo, p?.persona?.regional].filter(Boolean).join(" · ");

  const trazaBase = trazaLista([
    { lab: "Cierre", val: rBase?.cierre ?? "—" },
    { lab: "Meta", val: rBase?.meta ?? "—" },
    {
      lab: "Cumplimiento",
      val: rBase?.cump != null ? porcentaje(rBase.cump, 1) : "—",
    },
    {
      lab: "Puntos",
      val: `${formatoMiles(rBase?.puntos, 2)} pts`,
      total: true,
    },
  ]);

  const trazaSat = trazaLista([
    {
      lab: "Cumplimiento (umbral ≥ 100 %)",
      val: rSat?.cump != null ? porcentaje(rSat.cump, 1) : "—",
    },
    {
      lab: "Puntos",
      val: `${formatoMiles(r?.partes?.satisfaccion, 2)} pts`,
      total: true,
    },
  ]);

  const trazaSer = trazaLista([
    {
      lab: "Cumplimiento (umbral ≥ 100 %)",
      val: rSer?.cump != null ? porcentaje(rSer.cump, 1) : "—",
    },
    {
      lab: "Puntos",
      val: `${formatoMiles(r?.partes?.serfiscal, 2)} pts`,
      total: true,
    },
  ]);

  const detInn = rInn?.detalle || [];
  const filasInn = [1, 2].map((n) => {
    const d = detInn.find((x) => x.i === n) || { pts: null };
    return {
      lab: `Oferta ${n}`,
      val: d.pts == null ? "—" : `${formatoMiles(d.pts, 2)} pts`,
    };
  });
  filasInn.push({
    lab: `Total (tope ${topeInn})`,
    val: `${formatoMiles(r?.partes?.innovacion, 2)} pts`,
    total: true,
  });
  const trazaInn = trazaLista(filasInn);

  panel.innerHTML = `
    <div class="simular-shell">
      <div class="simular-toolbar">
        <div class="perfil-chip">
          <div class="perfil-chip__texto">
            <strong>${escaparHtml(nombre)}</strong>
            ${cargo ? `<span>${escaparHtml(cargo)}</span>` : ""}
          </div>
          ${badgeOrigen(estado.origenPerfil, p)}
        </div>
        <label class="mes-selector">
          <span class="mes-selector__lab">Mes</span>
          <select id="sel-mes" class="mes-selector__select">
            <option ${mes === "Octubre" ? "selected" : ""}>Octubre</option>
            <option ${mes === "Noviembre" ? "selected" : ""}>Noviembre</option>
            <option ${mes === "Diciembre" ? "selected" : ""}>Diciembre</option>
            <option ${mes === "Trimestre" ? "selected" : ""}>Trimestre</option>
          </select>
        </label>
      </div>

      ${bloqueKpi(estado)}

      <div class="simular-grid">
        <article class="tarjeta tarjeta--sim celda-ventas">
          <header class="tarjeta__cab">
            <div class="tarjeta__cab-izq">
              <h3>1. Ventas</h3>
              <span class="tarjeta__sub">${escaparHtml(mes)}</span>
            </div>
            ${ptsBadge(r?.partes?.ventas, pesos.ventas)}
          </header>
          <div class="campos-rejilla campos-rejilla--2">
            ${camposVentasMes(estado)}
          </div>
          ${trazaVentas(r?.ventas, pesos.ventas)}
          ${formulaPlegable([
            "Educación reconocida = recaudada × factor (0 % / 90 % / 100 %; vacío = 100 %).",
            "Misión reconocida = facturas × valor por factura.",
            `Puntos = cumplimiento ponderado × peso de ventas (${pesos.ventas ?? 45}). Tope de cumplimiento 120 %.`,
          ])}
        </article>

        <article class="tarjeta tarjeta--sim celda-base">
          <header class="tarjeta__cab">
            <h3>2. Base social</h3>
            ${ptsBadge(r?.partes?.baseSocial, pesos.baseSocial)}
          </header>
          <div class="campos-rejilla campos-rejilla--3">
            ${campoAmarillo("baseSocial.base", "Base 30 sept", b.base)}
            ${campoAmarillo("baseSocial.ingresos", "Ingresos", b.ingresos)}
            ${campoAmarillo("baseSocial.retiros", "Retiros", b.retiros)}
          </div>
          ${trazaBase}
        </article>

        <p class="simular-seccion celda-div-titulo">3. Diversificación e innovación</p>

        <article class="tarjeta tarjeta--sim celda-ser">
          <header class="tarjeta__cab">
            <div class="tarjeta__cab-izq">
              <h3>SERFISCAL</h3>
              <span class="tarjeta__sub">conteo · umbral 100 %</span>
            </div>
            ${ptsBadge(r?.partes?.serfiscal, topeSer)}
          </header>
          <div class="campos-rejilla campos-rejilla--2">
            ${campoAmarillo("serfiscal.ventas", "Ventas trimestrales recaudadas", s.ventas, { ayuda: "Conteo, no pesos" })}
            ${campoAmarillo("serfiscal.meta", "Meta del trimestre", s.meta, { ayuda: "Conteo, no pesos" })}
          </div>
          ${trazaSer}
        </article>

        <article class="tarjeta tarjeta--sim celda-innov">
          <header class="tarjeta__cab">
            <div class="tarjeta__cab-izq">
              <h3>Innovación</h3>
              <span class="tarjeta__sub">+${innParams.ptsOferta ?? 2} oferta · +${innParams.ptsPrimeraVenta ?? 3} 1ª venta</span>
            </div>
            ${ptsBadge(r?.partes?.innovacion, topeInn)}
          </header>
          <div class="campos-rejilla campos-rejilla--2">
            ${campoSelect("innovacion.oferta1", "Oferta 1 aprobada", i.oferta1 || "", [["", "—"], ["SÍ", "SÍ"], ["NO", "NO"]])}
            ${campoAmarillo("innovacion.venta1", "Primera venta (valor)", i.venta1, { unidad: "$" })}
            ${campoSelect("innovacion.oferta2", "Oferta 2 (opcional)", i.oferta2 || "", [["", "—"], ["SÍ", "SÍ"], ["NO", "NO"]])}
            ${campoAmarillo("innovacion.venta2", "Primera venta oferta 2", i.venta2, { unidad: "$" })}
          </div>
          ${trazaInn}
        </article>

        <article class="tarjeta tarjeta--sim celda-satisf">
          <header class="tarjeta__cab">
            <h3>4. Satisfacción</h3>
            ${ptsBadge(r?.partes?.satisfaccion, pesos.satisfaccion)}
          </header>
          <div class="campos-rejilla campos-rejilla--2">
            ${campoAmarillo("satisfaccion", "Obtenida", e.satisfaccion, { unidad: "%", ayuda: "Esperada: 80" })}
          </div>
          ${trazaSat}
        </article>

        <details class="tarjeta tarjeta--sim tarjeta--plegable celda-btl">
          <summary>
            <span><strong>BTL</strong> · aparte · exige ≥ ${scoreMin}</span>
            <span class="kpi-mini">${escaparHtml(rBtl?.estado || "—")} · ${numeroPesos(rBtl?.estimado)}</span>
          </summary>
          <div class="campos-rejilla campos-rejilla--2">
            ${campoAmarillo("btl.ingreso", "Ingreso", btl.ingreso, { unidad: "$" })}
            ${campoAmarillo("btl.costo", "Costo", btl.costo, { unidad: "$" })}
            ${campoAmarillo("btl.utilidadPresupuestada", "Utilidad presupuestada", btl.utilidadPresupuestada, { unidad: "$" })}
            ${campoAmarillo("btl.pagadoEnAnio", "Ya pagado en el año", btl.pagadoEnAnio, { unidad: "$" })}
          </div>
        </details>
      </div>
    </div>`;

  panel.querySelector("#sel-mes")?.addEventListener("change", (ev) => {
    establecerMes(ev.target.value);
    window.ANALFE_PEDIR_REPINTADO?.();
  });
  enlazarCampos(panel);
}

function pintarAnalisis(estado) {
  const panel = document.getElementById("panel-analisis");
  if (!panel) return;
  const r = estado.resultado;
  const curva = estado.parametros?.curva;
  const filas = r?.sensibilidad?.filas || [];

  if (!r) {
    panel.innerHTML = `<h2 class="titulo-pagina">Análisis</h2><p class="estado-vacio">Carga un perfil para ver el análisis.</p>`;
    return;
  }

  panel.innerHTML = `
    <h2 class="titulo-pagina">Análisis</h2>
    <p class="zona-ayuda">Sensibilidad y desglose sin salir de la simulación.</p>
    <div class="analisis-grid">
      <article class="tarjeta">
        <h3>¿Cuánto gano si…?</h3>
        <p>Comisión estimada según el cumplimiento de ventas (los demás indicadores fijos).</p>
        ${svgSensibilidad(filas)}
        <div class="tabla-scroll"><table class="tabla">
          <thead><tr><th>Cump. ventas</th><th>Puntaje</th><th>Factor</th><th>Comisión</th></tr></thead>
          <tbody>
            ${filas
              .map(
                (f) => `<tr><td>${porcentaje(f.cumplimiento, 0)}</td><td>${formatoMiles(f.score, 1)}</td>
                <td>${porcentaje(f.factor, 0)}</td><td>${numeroPesos(f.comision)}</td></tr>`
              )
              .join("")}
          </tbody>
        </table></div>
        <p>${escaparHtml(r.sensibilidad?.mensaje || "")}</p>
      </article>
      <article class="tarjeta">
        <h3>Indicadores</h3>
        <div class="kpis kpis--compactos">
          <div><p class="kpi-etiqueta">Puntaje</p><p class="kpi-valor kpi-valor--sm">${formatoMiles(r.puntaje, 2)}</p></div>
          <div><p class="kpi-etiqueta">% curva</p><p class="kpi-valor kpi-valor--sm">${porcentaje(r.factor, 1)}</p></div>
          <div><p class="kpi-etiqueta">Comisión</p><p class="kpi-valor kpi-valor--sm">${numeroPesos(r.comision)}</p></div>
        </div>
        <table class="tabla">
          <thead><tr><th>Indicador</th><th>Puntos</th></tr></thead>
          <tbody>
            <tr><td>1. Ventas</td><td>${formatoMiles(r.partes?.ventas, 2)}</td></tr>
            <tr><td>2. Base social</td><td>${formatoMiles(r.partes?.baseSocial, 2)}</td></tr>
            <tr><td>3. SERFISCAL</td><td>${formatoMiles(r.partes?.serfiscal, 2)}</td></tr>
            <tr><td>3. Innovación</td><td>${formatoMiles(r.partes?.innovacion, 2)}</td></tr>
            <tr><td>4. Satisfacción</td><td>${formatoMiles(r.partes?.satisfaccion, 2)}</td></tr>
          </tbody>
        </table>
        <p>${escaparHtml(r.paraLlegar?.mensaje || "")}</p>
        ${campoAmarillo("comisionAnterior", "Comisión esquema anterior (opcional)", estado.entradas.comisionAnterior, { unidad: "$" })}
        <div class="score-curva">${svgCurva(r.puntaje, curva)}</div>
        ${formulaPlegable([
          "Puntaje = min(120, suma de puntos).",
          "Factor: curva lineal entre anclas; bajo 80 → 0.",
          "Comisión = oportunidad × factor.",
          "Transición = máx(nueva, anterior).",
          "BTL no suma a la comisión.",
        ])}
      </article>
    </div>`;
  enlazarCampos(panel);
}

function pintarArchivo(estado) {
  const panel = document.getElementById("panel-archivo");
  if (!panel) return;
  const p = estado.perfil;
  panel.innerHTML = `
    <h2 class="titulo-pagina">Archivo</h2>
    <article class="tarjeta">
      <p>${badgeOrigen(estado.origenPerfil, p)}</p>
      <p class="zona-ayuda">Cada persona carga <strong>solo su archivo</strong> (.json, .csv o .analfe). Sin archivo se usan datos de ejemplo inventados.</p>
      <div class="zona-archivo" id="zona-perfil" tabindex="0" role="button" aria-label="Cargar perfil">
        <span class="zona-archivo__icono" aria-hidden="true">↑</span>
        <p>Arrastra tu perfil (.json / .csv / .analfe) o <span class="enlace">elige un archivo</span></p>
        <input type="file" id="input-perfil" accept=".json,.csv,.analfe,application/json,text/csv" hidden />
      </div>
      <p id="aviso-perfil" class="aviso-caja" hidden></p>
      <label class="campo-param"><span>Contraseña (solo si el archivo es .analfe)</span>
        <input type="password" id="clave-analfe" class="campo-editable" autocomplete="off" />
      </label>
      <label class="campo-param">
        <input type="checkbox" id="chk-recordar" />
        Recordar mi perfil en este computador
      </label>
      <p class="zona-ayuda">Si marca «Recordar», el perfil queda en este navegador. No lo use en un PC compartido.</p>
      ${p ? `<p class="perfil-resumen"><strong>${escaparHtml(p.persona?.nombreVisible || "")}</strong> · ${escaparHtml(p.tipo)} · oportunidad ${numeroPesos(p.compensacion?.oportunidad)}</p>` : ""}
      <div class="fila-acciones">
        <button type="button" class="boton" id="btn-ejemplo">Usar perfil de ejemplo</button>
        <button type="button" class="boton" id="btn-quitar-perfil" ${p ? "" : "disabled"}>Quitar perfil</button>
        <button type="button" class="boton" id="btn-olvidar" ${hayPerfilRecordado() ? "" : "hidden"}>Olvidar perfil guardado</button>
        <button type="button" class="boton" id="btn-abrir-escenario">Abrir escenario</button>
        <input type="file" id="input-escenario" accept=".json,application/json" hidden />
      </div>
    </article>
    <article class="tarjeta">
      <h3>Guardar e imprimir</h3>
      <p>Simulación. No es un pago oficial.</p>
      <div class="fila-acciones">
        <button type="button" class="boton boton--primario" id="btn-imprimir">Imprimir mi simulación</button>
        <button type="button" class="boton" id="btn-escenario">Descargar escenario</button>
      </div>
      <p class="zona-ayuda">El escenario no incluye salario ni oportunidad, solo el id del perfil y las entradas.</p>
    </article>`;

  const input = panel.querySelector("#input-perfil");
  const zona = panel.querySelector("#zona-perfil");
  zona?.addEventListener("click", () => input?.click());
  input?.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    const clave = panel.querySelector("#clave-analfe")?.value || "";
    let res = await cargarPerfilDeArchivo(file, { contraseña: clave || undefined });
    if (res.requiereContraseña) {
      const pass = prompt("Este archivo está cifrado. Escriba la contraseña:");
      if (!pass) {
        panel.querySelector("#aviso-perfil").hidden = false;
        panel.querySelector("#aviso-perfil").textContent = "Se necesita la contraseña.";
        return;
      }
      res = await cargarPerfilDeArchivo(file, { contraseña: pass });
    }
    await aplicarPerfilCargado(res, panel);
  });
  panel.querySelector("#btn-ejemplo")?.addEventListener("click", async () => {
    const res = await cargarPerfilEjemplo("comercial");
    if (res.ok) {
      establecerPerfil(res.perfil, "ejemplo");
      window.ANALFE_PEDIR_REPINTADO?.();
    }
  });
  panel.querySelector("#btn-quitar-perfil")?.addEventListener("click", () => {
    quitarPerfil();
    window.ANALFE_PEDIR_REPINTADO?.();
  });
  panel.querySelector("#btn-olvidar")?.addEventListener("click", () => {
    olvidarPerfilRecordado();
    window.ANALFE_PEDIR_REPINTADO?.();
  });
  panel.querySelector("#btn-abrir-escenario")?.addEventListener("click", () => {
    panel.querySelector("#input-escenario")?.click();
  });
  panel.querySelector("#input-escenario")?.addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const res = await abrirEscenarioDeArchivo(file);
    if (!res.ok) {
      panel.querySelector("#aviso-perfil").hidden = false;
      panel.querySelector("#aviso-perfil").textContent = res.error || "No se pudo abrir el escenario.";
      return;
    }
    if (res.escenario.mes) {
      establecerMes(res.escenario.mes);
    }
    if (res.escenario.entradas) parchearEntradas(res.escenario.entradas);
    window.ANALFE_PEDIR_REPINTADO?.();
  });
  panel.querySelector("#btn-imprimir")?.addEventListener("click", () => window.print());
  panel.querySelector("#btn-escenario")?.addEventListener("click", () => {
    const data = armarEscenario({
      perfilId: estado.perfil?.persona?.id || null,
      mes: estado.mes,
      entradas: estado.entradas,
    });
    descargarEscenario(data);
  });
}

function enlazarCampos(raiz) {
  raiz.querySelectorAll("[data-ruta]").forEach((el) => {
    const aplicar = () => {
      const ruta = el.dataset.ruta;
      let valor = el.value;
      if (el.tagName === "INPUT" && (el.inputMode === "decimal" || el.classList.contains("campo__input"))) {
        valor = numeroFlexible(valor);
      } else if (el.tagName === "SELECT" && ruta.startsWith("factor")) {
        valor = valor === "" ? null : numeroFlexible(valor);
      }
      if (ruta.includes(".")) {
        const [a, b] = ruta.split(".");
        parchearEntradas({ [a]: { [b]: valor } });
      } else if (
        ruta === "satisfaccion" ||
        ruta === "comisionAnterior" ||
        ruta.startsWith("educacion") ||
        ruta.startsWith("mision") ||
        ruta.startsWith("congreso") ||
        ruta.startsWith("cultural") ||
        ruta.startsWith("factor")
      ) {
        parchearEntradas({ [ruta]: valor });
      } else {
        establecerCampo(ruta, valor);
      }
    };
    el.addEventListener("change", aplicar);
    el.addEventListener("blur", aplicar);
  });
}

export function pintarTodo() {
  const estado = obtenerEstado();
  pintarFranjaPublica(estado);
  pintarSimular(estado);
  pintarAnalisis(estado);
  pintarArchivo(estado);
}
