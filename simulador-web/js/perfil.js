/**
 * Perfiles del simulador: validación, CSV, huella, carga JSON/.analfe.
 * Mensajes en español. Sin librerías de JSON Schema.
 */
import { escaparHtml, numeroFlexible, esNumero } from "./utilidades.js";
import { descifrarPerfil, esPerfilCifrado } from "./cifrado.js";

const CLAVE_RECORDAR = "analfe-simulador-perfil-recordado";
const CAMPOS_CONOCIDOS = new Set([
  "formato", "version", "tipo", "variante", "generado", "politica",
  "persona", "compensacion", "periodos", "baseSocial", "cartones",
  "btl", "anterior", "parametrosPropios", "control", "equipo",
]);

/** Contenido canónico (claves ordenadas) para huella. */
export function canonico(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonico).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonico(obj[k])}`).join(",")}}`;
}

export async function sha256Hex(texto) {
  const data = new TextEncoder().encode(texto);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Huella sobre el perfil sin el campo control.sha256. */
export async function huellaPerfil(perfil) {
  const copia = structuredClone(perfil);
  if (copia.control) delete copia.control.sha256;
  return sha256Hex(canonico(copia));
}

function mesValido(m) {
  return typeof m === "string" && /^\d{4}-\d{2}$/.test(m);
}

function numeroNoNegativo(v, nombre, errores) {
  if (v === null || v === undefined || v === "") return;
  const n = typeof v === "number" ? v : numeroFlexible(v);
  if (!esNumero(n) || n < 0) errores.push(`${nombre} debe ser un número ≥ 0.`);
}

/**
 * Valida un objeto perfil. Devuelve { ok, perfil, avisos, error }.
 */
export function validarPerfil(obj) {
  if (!obj || typeof obj !== "object") {
    return { ok: false, error: "Este archivo no es un perfil del simulador ANALFE." };
  }
  if (obj.formato !== "analfe-simulador-perfil") {
    return { ok: false, error: "Este archivo no es un perfil del simulador ANALFE." };
  }
  if (obj.version !== 1) {
    return { ok: false, error: `Versión de perfil no soportada (${obj.version}).` };
  }
  if (!["comercial", "nuevo-ingreso", "director"].includes(obj.tipo)) {
    return { ok: false, error: "El tipo de perfil no es válido." };
  }

  const errores = [];
  const avisos = [];
  const c = obj.compensacion || {};
  numeroNoNegativo(c.basico, "El básico", errores);
  numeroNoNegativo(c.oportunidad, "La oportunidad", errores);
  if (c.topeIndividual != null) {
    const t = Number(c.topeIndividual);
    if (!Number.isFinite(t) || t < 1 || t > 1.5) {
      errores.push("El tope individual debe estar entre 1 y 1,5.");
    }
  }

  for (const per of obj.periodos || []) {
    if (per.mes && !mesValido(per.mes)) errores.push(`Mes inválido: ${per.mes}. Use AAAA-MM.`);
    const metas = per.metas || {};
    for (const [k, v] of Object.entries(metas)) {
      if (v !== null && v !== undefined && v !== "") numeroNoNegativo(v, `Meta ${k}`, errores);
    }
  }

  for (const k of Object.keys(obj)) {
    if (!CAMPOS_CONOCIDOS.has(k)) avisos.push(`Campo desconocido «${k}»: se ignora.`);
  }

  if (obj.tipo === "director") {
    avisos.push("Este perfil es de Director: se abrirá el modo Director.");
  }
  if (obj.tipo === "nuevo-ingreso") {
    avisos.push("Perfil de nuevo ingreso: se usa prorrateo y medición certificada.");
  }

  if (errores.length) return { ok: false, error: errores[0], errores, avisos };

  return { ok: true, perfil: obj, avisos };
}

/** Verifica control.sha256 si existe (aviso, no error). */
export async function verificarHuella(perfil) {
  const guardada = perfil?.control?.sha256;
  if (!guardada || guardada === "ejemplo-sin-huella" || guardada === "…") {
    return { ok: true, aviso: null };
  }
  const calc = await huellaPerfil(perfil);
  if (calc !== guardada) {
    return {
      ok: false,
      aviso: "El archivo fue modificado después de generarse. Los resultados pueden no coincidir con los de finanzas.",
    };
  }
  return { ok: true, aviso: null };
}

/**
 * CSV con separador ; y decimales con coma.
 * Primera fila = claves aplanadas (compensacion.basico, periodos.2026-10.metas.educacion…).
 */
export function csvAPerfil(texto) {
  const lineas = String(texto).replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lineas.length < 2) {
    return { ok: false, error: "El CSV debe tener encabezado y al menos una fila de datos." };
  }
  const sep = lineas[0].includes(";") ? ";" : ",";
  const headers = lineas[0].split(sep).map((h) => h.trim());
  const valores = lineas[1].split(sep).map((v) => v.trim());
  const plano = {};
  headers.forEach((h, i) => {
    plano[h] = valores[i] ?? "";
  });

  const get = (k, def = null) => {
    if (!(k in plano) || plano[k] === "") return def;
    const n = numeroFlexible(plano[k]);
    if (n !== null && /^-?\d/.test(String(plano[k]).replace(/\./g, ""))) return n;
    return plano[k];
  };

  const perfil = {
    formato: get("formato", "analfe-simulador-perfil"),
    version: Number(get("version", 1)) || 1,
    tipo: get("tipo", "comercial"),
    variante: get("variante", "trimestre-oct-dic-2026"),
    generado: get("generado", new Date().toISOString().slice(0, 10)),
    politica: get("politica", "PCV-COM-001"),
    persona: {
      id: get("persona.id", "csv"),
      nombreVisible: get("persona.nombreVisible", "Comercial CSV"),
      cargo: get("persona.cargo", ""),
      regional: get("persona.regional", ""),
    },
    compensacion: {
      basico: get("compensacion.basico"),
      oportunidad: get("compensacion.oportunidad"),
      topeIndividual: get("compensacion.topeIndividual", 1.2),
    },
    periodos: [],
    baseSocial: {
      inicial: get("baseSocial.inicial"),
      ingresos: get("baseSocial.ingresos", 0),
      retiros: get("baseSocial.retiros", 0),
      tieneBase: true,
    },
    cartones: get("cartones"),
    btl: { pagadoEnAnio: get("btl.pagadoEnAnio", 0) },
    anterior: {},
    parametrosPropios: {},
    control: {},
  };

  if (esNumero(perfil.compensacion.basico) && esNumero(perfil.compensacion.oportunidad)) {
    perfil.compensacion.imr = perfil.compensacion.basico + perfil.compensacion.oportunidad;
  }

  const meses = new Set();
  for (const h of headers) {
    const m = h.match(/^periodos\.(\d{4}-\d{2})\./);
    if (m) meses.add(m[1]);
  }
  for (const mes of [...meses].sort()) {
    perfil.periodos.push({
      mes,
      diasMes: get(`periodos.${mes}.diasMes`),
      diasLaborados: get(`periodos.${mes}.diasLaborados`),
      metas: {
        educacion: get(`periodos.${mes}.metas.educacion`),
        mision: get(`periodos.${mes}.metas.mision`),
        congreso: get(`periodos.${mes}.metas.congreso`),
        cultural: get(`periodos.${mes}.metas.cultural`),
        pasantia: get(`periodos.${mes}.metas.pasantia`),
        patrocinios: get(`periodos.${mes}.metas.patrocinios`),
      },
    });
  }

  return validarPerfil(perfil);
}

export async function cargarPerfilDeArchivo(file, { contraseña } = {}) {
  const nombre = file.name || "";
  const texto = await file.text();

  if (nombre.endsWith(".csv") || texto.includes("compensacion.basico")) {
    const esCsv = nombre.endsWith(".csv") || (texto.includes(";") && texto.includes("formato"));
    if (esCsv && !texto.trim().startsWith("{")) return csvAPerfil(texto);
  }

  let obj;
  try {
    obj = JSON.parse(texto);
  } catch {
    if (texto.includes(";")) return csvAPerfil(texto);
    return { ok: false, error: "El archivo no es un JSON válido." };
  }

  if (esPerfilCifrado(obj)) {
    if (!contraseña) {
      return { ok: false, error: "Este archivo está cifrado. Escriba la contraseña.", requiereContraseña: true, cifrado: obj };
    }
    try {
      obj = await descifrarPerfil(obj, contraseña);
    } catch {
      return { ok: false, error: "La contraseña no coincide." };
    }
  }

  const val = validarPerfil(obj);
  if (!val.ok) return val;
  const huella = await verificarHuella(val.perfil);
  if (huella.aviso) val.avisos = [...(val.avisos || []), huella.aviso];
  return val;
}

export async function cargarPerfilEjemplo(tipo = "comercial") {
  const mapa = {
    comercial: "perfil_ejemplo_comercial.json",
    "nuevo-ingreso": "perfil_ejemplo_nuevo_ingreso.json",
    director: "perfil_ejemplo_director.json",
  };
  const clave = mapa[tipo] || mapa.comercial;
  if (typeof window !== "undefined" && window.ANALFE_RECURSOS?.[clave]) {
    return validarPerfil(window.ANALFE_RECURSOS[clave]);
  }
  try {
    const res = await fetch(`datos_ejemplo/${clave}`);
    if (!res.ok) throw new Error("fetch");
    return validarPerfil(await res.json());
  } catch {
    return validarPerfil(window?.ANALFE_RECURSOS?.["perfil_ejemplo_comercial.json"] || {
      formato: "analfe-simulador-perfil",
      version: 1,
      tipo: "comercial",
      variante: "trimestre-oct-dic-2026",
      persona: { id: "c-ejemplo", nombreVisible: "Comercial Ejemplo" },
      compensacion: { basico: 5_000_000, oportunidad: 5_000_000, topeIndividual: 1.2, imr: 10_000_000 },
      periodos: [
        { mes: "2026-10", metas: { educacion: 41_250_000, mision: 49_600_000, congreso: 0, cultural: 0 } },
      ],
      baseSocial: { inicial: 90, ingresos: 0, retiros: 0 },
      btl: { pagadoEnAnio: 0 },
    });
  }
}

export function badgeOrigen(origen, perfil) {
  if (origen === "ejemplo" || origen === "ninguno") {
    return `<span class="badge badge--aviso">Usando datos de ejemplo</span>`;
  }
  const nombre = escaparHtml(perfil?.persona?.nombreVisible || "Perfil");
  const vig = perfil?.variante ? ` · ${escaparHtml(perfil.variante)}` : "";
  return `<span class="badge badge--exito">Perfil cargado: ${nombre}${vig}</span>`;
}

/** Recordar perfil: desmarcado por defecto; advertencia de privacidad. */
export function guardarPerfilRecordado(perfil) {
  localStorage.setItem(CLAVE_RECORDAR, JSON.stringify(perfil));
}

export function leerPerfilRecordado() {
  try {
    const t = localStorage.getItem(CLAVE_RECORDAR);
    if (!t) return null;
    return validarPerfil(JSON.parse(t));
  } catch {
    return null;
  }
}

export function olvidarPerfilRecordado() {
  localStorage.removeItem(CLAVE_RECORDAR);
}

export function hayPerfilRecordado() {
  return Boolean(localStorage.getItem(CLAVE_RECORDAR));
}
