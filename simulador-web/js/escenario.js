/**
 * Escenarios: guardar/abrir entradas sin salario ni oportunidad.
 */
export function armarEscenario({ perfilId, mes, entradas, parametrosCambiados = {} }) {
  return {
    formato: "analfe-simulador-escenario",
    version: 1,
    perfilId: perfilId || null,
    mes,
    entradas,
    parametrosCambiados,
    aviso: "Simulación. No es un pago oficial.",
  };
}

export function validarEscenario(obj) {
  if (!obj || obj.formato !== "analfe-simulador-escenario") {
    return { ok: false, error: "Este archivo no es un escenario del simulador ANALFE." };
  }
  if (obj.version !== 1) {
    return { ok: false, error: `Versión de escenario no soportada (${obj.version}).` };
  }
  // No debe traer básico/oportunidad
  const texto = JSON.stringify(obj.entradas || {});
  if (/"basico"|"oportunidad"|"imr"/i.test(JSON.stringify(obj)) && obj.compensacion) {
    return { ok: false, error: "El escenario no debe incluir datos de compensación." };
  }
  void texto;
  return { ok: true, escenario: obj };
}

export function descargarEscenario(escenario) {
  const blob = new Blob([JSON.stringify(escenario, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `escenario_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function abrirEscenarioDeArchivo(file) {
  let obj;
  try {
    obj = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: "El archivo no es un JSON válido." };
  }
  return validarEscenario(obj);
}
