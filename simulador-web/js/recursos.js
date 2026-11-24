/**
 * Recursos incrustados para file:// (sin fetch a red).
 * Los JSON de datos_ejemplo se copian aquí para el arranque.
 */
export const RECURSOS = {
  "perfil_ejemplo_comercial.json": {
    formato: "analfe-simulador-perfil",
    version: 1,
    tipo: "comercial",
    variante: "trimestre-oct-dic-2026",
    generado: "2026-11-24",
    politica: "PCV-COM-001",
    persona: {
      id: "c-ejemplo",
      nombreVisible: "Comercial Ejemplo",
      cargo: "Ejecutivo Comercial II",
      regional: "Regional Centro",
    },
    compensacion: {
      basico: 5000000,
      oportunidad: 5000000,
      topeIndividual: 1.2,
      imr: 10000000,
    },
    periodos: [
      {
        mes: "2026-10",
        diasMes: 31,
        diasLaborados: 31,
        metas: { educacion: 41250000, mision: 49600000, congreso: 0, cultural: 0 },
      },
      {
        mes: "2026-11",
        diasMes: 30,
        diasLaborados: 30,
        metas: { educacion: 33100000, mision: 0, congreso: 0, cultural: 0 },
      },
      {
        mes: "2026-12",
        diasMes: 31,
        diasLaborados: 31,
        metas: { educacion: 28700000, mision: 0, congreso: 0, cultural: 34400000 },
      },
    ],
    baseSocial: {
      fechaCorte: "2026-09-30",
      inicial: 90,
      ingresos: 0,
      retiros: 0,
      tieneBase: true,
      certificada: true,
    },
    cartones: 860,
    btl: { pagadoEnAnio: 0 },
    anterior: { comisionPorMes: { "2026-10": null } },
    parametrosPropios: {},
    control: { sha256: "ejemplo-sin-huella" },
  },
};

if (typeof window !== "undefined") {
  window.ANALFE_RECURSOS = { ...RECURSOS, ...(window.ANALFE_RECURSOS || {}) };
}
