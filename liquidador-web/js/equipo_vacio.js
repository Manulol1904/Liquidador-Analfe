/**
 * Equipo vacío para el HTML de doble clic (lo usa herramientas/empaquetar.mjs en lugar de equipo.js).
 * Así el archivo no trae nombres, salarios ni metas: llegan al cargar encabezados_comerciales.json (bloque «equipo»).
 */
export const EQUIPO_INICIAL = {
  director: { nombre: "", nombreCorto: "", basico: null, oportunidad: null },
  btlEventos: [],
  comerciales: [],
};
