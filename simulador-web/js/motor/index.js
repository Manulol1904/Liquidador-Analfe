import { esNumero } from "../utilidades.js";
import { PARAMETROS_INICIALES, parametrosParaVariante } from "../parametros.js";
import { factorCurva, pagoVariable } from "./curva.js";
import { calcularVentasMes, calcularVentasTrimestre } from "./ventas.js";
import { calcularBaseSocial } from "./baseSocial.js";
import { calcularDiversificacion } from "./diversificacion.js";
import { calcularSatisfaccion } from "./satisfaccion.js";
import { liquidarBtl } from "./btl.js";
import { calcularTransicion } from "./transicion.js";
import { tablaSensibilidad } from "./sensibilidad.js";
import { liquidarDirector } from "./director.js";

export {
  factorCurva,
  pagoVariable,
  calcularVentasMes,
  calcularVentasTrimestre,
  calcularBaseSocial,
  calcularDiversificacion,
  calcularSatisfaccion,
  liquidarBtl,
  calcularTransicion,
  tablaSensibilidad,
  liquidarDirector,
};

const MES_CLAVE = {
  Octubre: "2026-10",
  Noviembre: "2026-11",
  Diciembre: "2026-12",
  Trimestre: "Trimestre",
};

function metasDePerfil(perfil, mesClave) {
  const per = (perfil?.periodos || []).find((p) => p.mes === mesClave);
  const m = per?.metas || {};
  return {
    educacion: m.educacion ?? null,
    mision: m.mision ?? null,
    congreso: m.congreso ?? null,
    cultural: m.cultural ?? null,
    pasantia: m.pasantia ?? null,
    patrocinios: m.patrocinios ?? null,
    diasMes: per?.diasMes,
    diasLaborados: per?.diasLaborados,
  };
}

function entradasMesDe(entradas, suf) {
  const e = entradas || {};
  return {
    educacion: e[`educacion${suf}`] ?? e.educacion ?? null,
    factorMargen: e[`factorMargen${suf}`] ?? e.factorMargen ?? null,
    misionFacturas: e[`mision${suf}`] ?? e.misionFacturas ?? null,
    congreso: e[`congreso${suf}`] ?? e.congreso ?? null,
    inscritos: e[`inscritos${suf}`] ?? e.inscritos ?? null,
    cultural: e[`cultural${suf}`] ?? e.cultural ?? null,
    pasantia: e.pasantia ?? null,
    patrocinios: e.patrocinios ?? null,
  };
}

function indicadorNeutro(peso, medido) {
  if (medido === false) return { puntos: peso, neutro: true, estado: "Sin medición certificada → 100 %" };
  return null;
}

/**
 * Mensaje «Para llegar a 80».
 */
export function paraLlegarA80(puntaje, parametros) {
  const min = parametros.curva.minimo;
  if (!esNumero(puntaje)) return { faltan: null, mensaje: "Pendiente" };
  if (puntaje + 1e-9 >= min) return { faltan: 0, mensaje: "Ya llega a 80 puntos" };
  const faltan = min - puntaje;
  return { faltan, mensaje: `Faltan ${faltan.toFixed(2)} puntos para llegar a 80` };
}

/**
 * Puntaje total (tope = suma pesos × tope pago).
 */
export function armarPuntaje(partes, parametros) {
  const sumaPesos =
    parametros.pesos.ventas +
    parametros.pesos.baseSocial +
    parametros.pesos.serfiscal +
    parametros.pesos.innovacion +
    parametros.pesos.satisfaccion;
  const tope = sumaPesos * parametros.curva.tope;
  const total =
    (partes.ventas || 0) +
    (partes.baseSocial || 0) +
    (partes.serfiscal || 0) +
    (partes.innovacion || 0) +
    (partes.satisfaccion || 0);
  return Math.min(tope, total);
}

/**
 * Liquidación comercial (o nuevo ingreso).
 */
export function liquidarComercial(entradas, perfil, parametrosEntrada) {
  const variante = perfil?.variante?.includes("nuevo") || perfil?.tipo === "nuevo-ingreso"
    ? "nuevo-ingreso"
    : "comercial";
  const parametros = parametrosParaVariante(variante, parametrosEntrada || PARAMETROS_INICIALES);

  const mesSel = entradas?.mes || "Octubre";
  const mesClave = MES_CLAVE[mesSel] || mesSel;

  const medicion = entradas?.medicion || {};
  const esNuevo = variante === "nuevo-ingreso";

  // Prorrateo (nuevo ingreso)
  let factorProrrateo = 1;
  if (esNuevo) {
    const metas = metasDePerfil(perfil, mesClave);
    const diasMes = esNumero(entradas?.diasMes) ? entradas.diasMes : metas.diasMes;
    const diasLab = esNumero(entradas?.diasLaborados) ? entradas.diasLaborados : metas.diasLaborados;
    if (esNumero(diasMes) && diasMes > 0 && esNumero(diasLab)) {
      factorProrrateo = Math.min(1, Math.max(0, diasLab / diasMes));
    }
  }

  const aplicarProrrateo = (meta) =>
    esNumero(meta) ? meta * factorProrrateo : meta;

  let ventas;
  if (mesSel === "Trimestre") {
    const meses = ["Octubre", "Noviembre", "Diciembre"].map((nombre) => {
      const clave = MES_CLAVE[nombre];
      const metasRaw = metasDePerfil(perfil, clave);
      const metas = {
        educacion: metasRaw.educacion,
        mision: metasRaw.mision,
        congreso: metasRaw.congreso,
        cultural: metasRaw.cultural,
      };
      const suf = nombre.slice(0, 3); // Oct Nov Dic — better use map
      return calcularVentasMes(entradasMesDe(entradas, nombre === "Octubre" ? "Oct" : nombre === "Noviembre" ? "Nov" : "Dic"), metas, parametros);
    });
    // Fix: use proper suffix
    const mesesFixed = [
      calcularVentasMes(entradasMesDe(entradas, "Oct"), metasDePerfil(perfil, "2026-10"), parametros),
      calcularVentasMes(entradasMesDe(entradas, "Nov"), metasDePerfil(perfil, "2026-11"), parametros),
      calcularVentasMes(entradasMesDe(entradas, "Dic"), metasDePerfil(perfil, "2026-12"), parametros),
    ];
    ventas = calcularVentasTrimestre(mesesFixed, parametros);
  } else {
    const metasRaw = metasDePerfil(perfil, mesClave === "Trimestre" ? "2026-10" : mesClave);
    const metas = {
      educacion: aplicarProrrateo(metasRaw.educacion),
      mision: aplicarProrrateo(metasRaw.mision),
      congreso: aplicarProrrateo(metasRaw.congreso),
      cultural: aplicarProrrateo(metasRaw.cultural),
      pasantia: aplicarProrrateo(metasRaw.pasantia),
      patrocinios: aplicarProrrateo(metasRaw.patrocinios),
    };
    const suf = mesSel === "Octubre" ? "Oct" : mesSel === "Noviembre" ? "Nov" : mesSel === "Diciembre" ? "Dic" : "";
    ventas = calcularVentasMes(entradasMesDe(entradas, suf), metas, parametros);
  }

  // Neutro ventas
  let ptsVentas = ventas.puntos;
  if (esNuevo && medicion.ventas === false) {
    ptsVentas = parametros.pesos.ventas;
  }

  const base = (() => {
    if (esNuevo && medicion.baseSocial === false) {
      return { puntos: parametros.pesos.baseSocial, neutro: true, estado: "Sin medición" };
    }
    return calcularBaseSocial(
      {
        base: entradas?.baseSocial?.base ?? perfil?.baseSocial?.inicial,
        ingresos: entradas?.baseSocial?.ingresos ?? perfil?.baseSocial?.ingresos,
        retiros: entradas?.baseSocial?.retiros ?? perfil?.baseSocial?.retiros,
      },
      parametros,
      { mesClave, mesesAContar: entradas?.baseSocial?.mesesAContar }
    );
  })();

  const div = (() => {
    if (esNuevo && medicion.serfiscal === false && medicion.innovacion === false) {
      return {
        puntos: parametros.pesos.serfiscal + parametros.pesos.innovacion,
        serfiscal: { puntos: parametros.pesos.serfiscal, neutro: true },
        innovacion: { puntos: parametros.pesos.innovacion, neutro: true },
      };
    }
    const innOpts = { maxOfertas: esNuevo ? 4 : 2 };
    const result = calcularDiversificacion(
      {
        serfiscal: {
          ventas: entradas?.serfiscal?.ventas,
          meta: entradas?.serfiscal?.meta,
        },
        innovacion: entradas?.innovacion || {},
      },
      parametros,
      innOpts
    );
    if (esNuevo && medicion.serfiscal === false) {
      result.serfiscal = { puntos: parametros.pesos.serfiscal, neutro: true };
      result.puntos = (result.serfiscal.puntos || 0) + (result.innovacion.puntos || 0);
    }
    if (esNuevo && medicion.innovacion === false) {
      result.innovacion = { puntos: parametros.pesos.innovacion, neutro: true };
      result.puntos = (result.serfiscal.puntos || 0) + (result.innovacion.puntos || 0);
    }
    return result;
  })();

  const sat = (() => {
    if (esNuevo && medicion.satisfaccion === false) {
      return { puntos: parametros.pesos.satisfaccion, neutro: true };
    }
    return calcularSatisfaccion(
      { obtenida: entradas?.satisfaccion, esperada: parametros.satisfaccion.esperada },
      parametros
    );
  })();

  const partes = {
    ventas: ptsVentas || 0,
    baseSocial: base.puntos || 0,
    serfiscal: div.serfiscal?.puntos || 0,
    innovacion: div.innovacion?.puntos || 0,
    satisfaccion: sat.puntos || 0,
  };

  const puntaje = armarPuntaje(partes, parametros);
  const factor = factorCurva(puntaje, parametros.curva);
  const oportunidad = perfil?.compensacion?.oportunidad;
  const comision = pagoVariable(oportunidad, factor);

  // Trimestre: comisión = suma de comisiones mensuales
  let comisionFinal = comision;
  if (mesSel === "Trimestre") {
    const mesesNombres = ["Octubre", "Noviembre", "Diciembre"];
    let suma = 0;
    for (const nombre of mesesNombres) {
      const r = liquidarComercial({ ...entradas, mes: nombre }, perfil, parametros);
      if (r.ventas?.has && esNumero(r.comision)) suma += r.comision;
    }
    comisionFinal = suma;
  }

  const transicion = calcularTransicion(comisionFinal, entradas?.comisionAnterior, {
    btlEntraTransicion: false,
  });

  const btl = liquidarBtl(
    {
      ingreso: entradas?.btl?.ingreso,
      costo: entradas?.btl?.costo,
      utilidadPresupuestada: entradas?.btl?.utilidadPresupuestada,
      pagadoEnAnio: entradas?.btl?.pagadoEnAnio,
      participacion: entradas?.btl?.participacion,
      cierre: entradas?.btl?.cierre,
      satisfaccionEvento: entradas?.btl?.satisfaccionEvento,
      otrosAsignados: entradas?.btl?.otrosAsignados,
    },
    perfil,
    parametros,
    { puntajeMes: puntaje }
  );

  const otros = partes.baseSocial + partes.serfiscal + partes.innovacion + partes.satisfaccion;
  const sensibilidad = tablaSensibilidad({
    otrosPuntos: otros,
    oportunidad,
    parametros,
  });

  return {
    variante,
    mes: mesSel,
    factorProrrateo,
    ventas,
    baseSocial: base,
    diversificacion: div,
    satisfaccion: sat,
    partes,
    puntaje,
    factor,
    comision: comisionFinal,
    transicion,
    btl,
    paraLlegar: paraLlegarA80(puntaje, parametros),
    sensibilidad,
    parametrosUsados: parametros,
  };
}

export function liquidar(entradas, perfil, parametros) {
  if (perfil?.tipo === "director") {
    return { tipo: "director", ...liquidarDirector(entradas, perfil, parametros || PARAMETROS_INICIALES) };
  }
  return { tipo: perfil?.tipo || "comercial", ...liquidarComercial(entradas, perfil, parametros) };
}
