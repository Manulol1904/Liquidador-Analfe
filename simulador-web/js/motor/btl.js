import { esNumero } from "../utilidades.js";

function siNo(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const t = String(valor).trim().toUpperCase();
  if (t === "SÍ" || t === "SI" || t === "YES" || t === "1" || valor === true) return true;
  if (t === "NO" || t === "0" || valor === false) return false;
  return null;
}

function bandaMargen(margen, btl) {
  if (margen < btl.margenMin) return -1;
  if (margen < btl.margenMed) return 0;
  if (margen < btl.margenAlto) return 1;
  return 2;
}

/**
 * % liquidador BTL según cumplimiento y margen.
 */
export function porcentajeBtl(cump, margen, btl) {
  if (!esNumero(cump) || !esNumero(margen)) return null;
  if (cump < btl.cumpMin || margen < btl.margenMin) return 0;
  const banda = bandaMargen(margen, btl);
  if (banda < 0) return 0;
  if (cump < 1) return btl.p90[banda];
  return btl.p100[banda];
}

/**
 * Puerta de puntaje para BTL (siempre):
 * comercial / nuevo ingreso → scoreMin (fábrica 80);
 * director → director.btlScoreMin (fábrica 70).
 */
export function puertaPuntajeBtl(puntajeMes, scoreMin) {
  if (!esNumero(puntajeMes)) {
    return { ok: false, texto: "Pendiente: puntaje del mes para liquidar BTL" };
  }
  if (puntajeMes + 1e-9 < scoreMin) {
    return {
      ok: false,
      texto: `Puntaje ${puntajeMes.toFixed(2)} < ${scoreMin}: no se liquida BTL`,
    };
  }
  return { ok: true, texto: "Cumple los requisitos" };
}

/**
 * Requisitos 5.11.5 (participación, cierre, sat evento).
 * El corte por puntaje va aparte (puertaPuntajeBtl) y aplica siempre.
 * Corrige el bug del Excel de nuevo ingreso: "Cumple los requisitos." con punto.
 */
export function requisitosBtl(entradas, puntajeMes, btl) {
  const puerta = puertaPuntajeBtl(puntajeMes, btl.scoreMin ?? 80);
  if (!puerta.ok) return puerta;

  if (!btl.aplicarRequisitos) return { ok: true, texto: "Cumple los requisitos" };

  const part = siNo(entradas.participacion);
  if (part !== true) {
    return { ok: false, texto: part === null ? "Pendiente: participación material" : "Sin participación material" };
  }
  const cierre = siNo(entradas.cierre);
  if (cierre !== true) {
    return { ok: false, texto: cierre === null ? "Pendiente: cierre financiero" : "Sin cierre financiero certificado" };
  }
  const sat = entradas.satisfaccionEvento;
  if (!esNumero(sat)) {
    return { ok: false, texto: "Pendiente: satisfacción del evento" };
  }
  const satNorm = sat > 1 ? sat / 100 : sat;
  if (satNorm + 1e-9 < btl.satEventoMin) {
    return { ok: false, texto: "Satisfacción del evento bajo el mínimo" };
  }
  return { ok: true, texto: "Cumple los requisitos" };
}

/**
 * BTL comercial / nuevo ingreso.
 * estimado = min(calculado, topeEvento, topeAnual, tope25%).
 * No suma a la comisión.
 */
export function liquidarBtl(entradas, perfil, parametros, { puntajeMes } = {}) {
  const btl = parametros.btl;
  const basico = perfil?.compensacion?.basico;
  const oportunidad = perfil?.compensacion?.oportunidad;
  const imr = esNumero(perfil?.compensacion?.imr)
    ? perfil.compensacion.imr
    : esNumero(basico) && esNumero(oportunidad)
      ? basico + oportunidad
      : null;

  const ingreso = entradas?.ingreso;
  const costo = entradas?.costo;
  const presup = entradas?.utilidadPresupuestada;
  const pagado = esNumero(entradas?.pagadoEnAnio)
    ? entradas.pagadoEnAnio
    : esNumero(perfil?.btl?.pagadoEnAnio)
      ? perfil.btl.pagadoEnAnio
      : 0;
  const otros = esNumero(entradas?.otrosAsignados) ? entradas.otrosAsignados : 0;

  if (!esNumero(ingreso) || !esNumero(costo) || !esNumero(presup) || !esNumero(imr)) {
    return { estimado: null, estado: "Pendiente", detalle: {} };
  }

  const req = requisitosBtl(entradas || {}, puntajeMes, btl);
  if (!req.ok) {
    return { estimado: 0, estado: req.texto, requisitos: req, detalle: { pct: 0 } };
  }

  const ica = ingreso * parametros.margen.ica;
  const gmf = costo * parametros.margen.gmf;
  const utilidad = ingreso - costo - ica - gmf;
  const margen = ingreso !== 0 ? utilidad / ingreso : null;
  const cump = presup !== 0 ? utilidad / presup : null;
  const pct = porcentajeBtl(cump, margen, btl) || 0;

  const calculado = imr * pct;
  const topeEvento = btl.topeEvento * imr;
  const topeAnual = Math.max(0, btl.topeAnual * imr - pagado);
  const baseSalv = Math.max(0, utilidad - otros);
  const tope25 = Math.max(0, btl.salvaguarda * baseSalv);

  const estimado = Math.min(calculado, topeEvento, topeAnual, tope25);

  return {
    estimado,
    estado: req.texto,
    requisitos: req,
    detalle: {
      ica,
      gmf,
      utilidad,
      margen,
      cump,
      pct,
      calculado,
      topeEvento,
      topeAnual,
      tope25,
      imr,
    },
  };
}

/**
 * BTL del director (§4.3). Exige puntaje ≥ director.btlScoreMin (70).
 */
export function liquidarBtlDirector(entradas, perfil, parametros, { btlComercialPrelim, puntajeMes } = {}) {
  const d = parametros.director;
  const basico = perfil?.compensacion?.basico;
  const oportunidad = perfil?.compensacion?.oportunidad;
  const imr = esNumero(basico) && esNumero(oportunidad) ? basico + oportunidad : null;

  const ingreso = entradas?.ingreso;
  const presup = entradas?.utilidadPresupuestada;
  const utilidad = entradas?.utilidadReal;

  if (!esNumero(ingreso) || !esNumero(presup) || !esNumero(utilidad) || !esNumero(imr) || ingreso === 0) {
    return { estimado: null, estado: "Pendiente" };
  }

  const puerta = puertaPuntajeBtl(puntajeMes, d.btlScoreMin ?? 70);
  if (!puerta.ok) {
    return { estimado: 0, estado: puerta.texto, requisitos: puerta, detalle: { pct: 0 } };
  }

  const margen = utilidad / ingreso;
  const cump = presup !== 0 ? utilidad / presup : 0;

  let pct = 0;
  if (cump < 0.9 || margen < 0.1) pct = 0;
  else if (cump < 1) pct = 0.1;
  else if (margen <= 0.15) pct = 0.2;
  else pct = 0.25;

  let preliminar = imr * pct;
  const topeEvento = d.btlTopeEvento * imr;
  const pagado = esNumero(entradas?.pagadoEnAnio) ? entradas.pagadoEnAnio : 0;
  const cuenta = entradas?.cuentaParaTope;
  const topeAnual =
    cuenta === false
      ? d.btlTopeAnual * imr
      : cuenta === null || cuenta === undefined
        ? null
        : Math.max(0, d.btlTopeAnual * imr - pagado);

  let despues = Math.min(preliminar, topeEvento);
  if (esNumero(topeAnual)) despues = Math.min(despues, topeAnual);

  if (esNumero(btlComercialPrelim) && btlComercialPrelim + preliminar > 0.25 * utilidad) {
    despues = (0.25 * utilidad * preliminar) / (btlComercialPrelim + preliminar);
  }

  return {
    estimado: despues,
    estado: "ok",
    detalle: { pct, preliminar, topeEvento, topeAnual, margen, cump, imr },
  };
}
