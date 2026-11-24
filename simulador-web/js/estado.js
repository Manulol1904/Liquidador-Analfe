/**
 * Estado de la simulación en memoria. Nada personal en localStorage por defecto.
 */
import { clonar } from "./utilidades.js";
import { PARAMETROS_INICIALES, obtenerParametros, restaurarValoresIniciales } from "./parametros.js";
import { liquidar } from "./motor/index.js";

let perfil = null;
let origenPerfil = "ejemplo"; // ejemplo | archivo
let mes = "Octubre";
let entradas = {
  educacionOct: null,
  factorMargenOct: null,
  misionOct: null,
  congresoOct: null,
  culturalOct: null,
  educacionNov: null,
  misionNov: null,
  congresoNov: null,
  culturalNov: null,
  educacionDic: null,
  misionDic: null,
  congresoDic: null,
  culturalDic: null,
  baseSocial: { base: null, ingresos: null, retiros: null },
  serfiscal: { ventas: null, meta: null },
  innovacion: { oferta1: null, venta1: null, oferta2: null, venta2: null },
  satisfaccion: null,
  comisionAnterior: null,
  btl: {
    ingreso: null,
    costo: null,
    utilidadPresupuestada: null,
    pagadoEnAnio: null,
    participacion: null,
    cierre: null,
    satisfaccionEvento: null,
  },
  medicion: {},
  diasLaborados: null,
  diasMes: null,
};

const listeners = new Set();

export function suscribir(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitir() {
  for (const fn of listeners) fn(obtenerEstado());
}

export function obtenerEstado() {
  return {
    perfil,
    origenPerfil,
    mes,
    entradas: clonar(entradas),
    parametros: obtenerParametros(),
    resultado: calcular(),
  };
}

export function calcular() {
  if (!perfil) return null;
  return liquidar({ ...entradas, mes }, perfil, obtenerParametros());
}

export function establecerPerfil(nuevo, origen = "archivo") {
  perfil = nuevo;
  origenPerfil = origen;
  if (nuevo?.baseSocial) {
    entradas.baseSocial = {
      base: nuevo.baseSocial.inicial ?? null,
      ingresos: nuevo.baseSocial.ingresos ?? null,
      retiros: nuevo.baseSocial.retiros ?? null,
    };
  }
  if (nuevo?.tipo === "nuevo-ingreso") {
    mes = "Diciembre";
  } else if (nuevo?.tipo === "director") {
    mes = "Octubre";
  }
  emitir();
}

export function quitarPerfil() {
  perfil = null;
  origenPerfil = "ninguno";
  emitir();
}

export function establecerMes(nuevoMes) {
  mes = nuevoMes;
  emitir();
}

export function parchearEntradas(parcial) {
  entradas = { ...entradas, ...parcial };
  if (parcial.baseSocial) {
    entradas.baseSocial = { ...entradas.baseSocial, ...parcial.baseSocial };
  }
  if (parcial.serfiscal) {
    entradas.serfiscal = { ...entradas.serfiscal, ...parcial.serfiscal };
  }
  if (parcial.innovacion) {
    entradas.innovacion = { ...entradas.innovacion, ...parcial.innovacion };
  }
  if (parcial.btl) {
    entradas.btl = { ...entradas.btl, ...parcial.btl };
  }
  emitir();
}

export function establecerCampo(ruta, valor) {
  const partes = ruta.split(".");
  let obj = entradas;
  for (let i = 0; i < partes.length - 1; i += 1) {
    if (!obj[partes[i]] || typeof obj[partes[i]] !== "object") obj[partes[i]] = {};
    obj = obj[partes[i]];
  }
  obj[partes[partes.length - 1]] = valor;
  emitir();
}

export function restaurarParametros() {
  restaurarValoresIniciales();
  emitir();
}

export { PARAMETROS_INICIALES };
