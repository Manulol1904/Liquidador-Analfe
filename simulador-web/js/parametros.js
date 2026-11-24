/**
 * Parámetros de fábrica del simulador (hoja Parámetros del Excel).
 * Amarillo = editable en UI; gris = calculado. Sin valores quemados en el motor.
 */
import { clonar } from "./utilidades.js";

export const PARAMETROS_INICIALES = {
  pesos: {
    ventas: 45,
    baseSocial: 20,
    serfiscal: 10,
    innovacion: 10,
    satisfaccion: 15,
  },
  curva: {
    minimo: 80,
    tope: 1.2,
    tipo: "LINEAL", // LINEAL | ESCALONES
    anclas: [
      { puntaje: 80, factor: 0.7 },
      { puntaje: 90, factor: 0.9 },
      { puntaje: 100, factor: 1 },
      { puntaje: 110, factor: 1.1 },
      { puntaje: 120, factor: 1.2 },
    ],
  },
  topes: {
    limitarVentas: true,
    ventas: 1.2,
    congreso: 1.0,
  },
  margen: {
    umbralBajo: 0.1,
    umbralAlto: 0.2,
    factorBajo: 0,
    factorMedio: 0.9,
    factorAlto: 1,
    /** Regla del 20 % exacto: "politica" → 90 %, "matriz" → 100 %. */
    regla20Exacto: "politica",
    ica: 0.009660442,
    gmf: 0.004,
  },
  mision: {
    valorFactura: 15_500_000,
    metaOct: 49_600_000,
    metaNov: 0,
    metaDic: 0,
  },
  congreso: {
    metaOct: 0,
    metaNov: 0,
    metaDic: 0,
  },
  cultural: {
    valorCarton: 40_000,
    cartonesEquipo: 6_000,
    cortes: [
      { etiqueta: "15 nov", factor: 0.3 },
      { etiqueta: "22 nov", factor: 0.55 },
      { etiqueta: "29 nov", factor: 0.8 },
      { etiqueta: "4 dic", factor: 1 },
    ],
  },
  baseSocial: {
    incremento: 1,
    origenMes: "2026-10",
  },
  innovacion: {
    ptsOferta: 2,
    ptsPrimeraVenta: 3,
    /** Excel comercial limita a 12; política dice 10. Pendiente §11. */
    topeTrimestre: 12,
    topeOfertaNuevoIngreso: 5,
    topeTrimestreNuevoIngreso: 10,
  },
  satisfaccion: {
    esperada: 80,
  },
  btl: {
    topeEvento: 0.8,
    topeAnual: 2,
    salvaguarda: 0.25,
    cumpMin: 0.9,
    /** Comercial: 5,1 / 10,1 / 15,1 %. Nuevo ingreso: 5 / 10 / 15 %. */
    margenMin: 0.051,
    margenMed: 0.101,
    margenAlto: 0.151,
    p90: [0.2, 0.3, 0.4],
    p100: [0.35, 0.6, 0.8],
    /** Otros requisitos 5.11.5 (participación, cierre, sat evento): NO en comercial Excel; SÍ en nuevo ingreso. */
    aplicarRequisitos: false,
    satEventoMin: 0.85,
    /** Siempre: sin puntaje ≥ esto no hay BTL del comercial (regla de negocio). */
    scoreMin: 80,
  },
  btlNuevoIngreso: {
    margenMin: 0.05,
    margenMed: 0.1,
    margenAlto: 0.15,
    aplicarRequisitos: true,
  },
  director: {
    tope: 1.2,
    metodoScore: "totales", // totales | promedio-simple | promedio-ponderado
    regla100: false,
    tasaAnterior: 0.015,
    tasaBtlAnterior: 0.0063,
    btlEntraTransicion: false,
    btlTopeEvento: 0.25,
    btlTopeAnual: 1,
    /** Sin puntaje ≥ esto no hay BTL del director. */
    btlScoreMin: 70,
    metaBaseSocialEquipo: 622, // pendiente 622 vs 524
    btlPagadoCuentaTope: null, // PENDIENTE
  },
  anticipos: {
    prefijo: "27209",
    incluirAnticipos: false,
    incluirNoCanceladas: false,
  },
  avisosPendientes: [
    "Tope de innovación comercial: 12 (Excel) vs 10 (política).",
    "Umbrales de margen BTL comercial 5,1/10,1/15,1 % vs 5/10/15 % en nuevo ingreso.",
    "BTL comercial exige puntaje ≥ 80 (el Excel comercial no cortaba por puntaje).",
    "BTL director exige puntaje ≥ 70.",
    "Requisitos 5.11.5 completos (participación/cierre/sat): NO en comercial, SÍ en nuevo ingreso.",
    "Meta base social del director: 622 o 524 (pendiente).",
  ],
};

let parametrosActuales = clonar(PARAMETROS_INICIALES);

export function obtenerParametros() {
  return parametrosActuales;
}

export function restaurarValoresIniciales() {
  parametrosActuales = clonar(PARAMETROS_INICIALES);
  return parametrosActuales;
}

export function establecerParametros(parcial) {
  parametrosActuales = { ...clonar(PARAMETROS_INICIALES), ...clonar(parcial) };
  return parametrosActuales;
}

export function sumaPesos(p = parametrosActuales) {
  const w = p.pesos;
  return w.ventas + w.baseSocial + w.serfiscal + w.innovacion + w.satisfaccion;
}

export function exportarJson() {
  return JSON.stringify(parametrosActuales, null, 2);
}

export function importarJson(texto) {
  const obj = JSON.parse(texto);
  parametrosActuales = { ...clonar(PARAMETROS_INICIALES), ...obj };
  return parametrosActuales;
}

/** Parámetros efectivos según variante (comercial | nuevo-ingreso). */
export function parametrosParaVariante(variante, base = parametrosActuales) {
  const p = clonar(base);
  if (variante === "nuevo-ingreso") {
    p.btl.margenMin = p.btlNuevoIngreso.margenMin;
    p.btl.margenMed = p.btlNuevoIngreso.margenMed;
    p.btl.margenAlto = p.btlNuevoIngreso.margenAlto;
    p.btl.aplicarRequisitos = p.btlNuevoIngreso.aplicarRequisitos;
    p.innovacion.topeTrimestre = p.innovacion.topeTrimestreNuevoIngreso;
  }
  return p;
}
