#!/usr/bin/env node
/**
 * v16 · Saca los datos del equipo (nombres, básico, oportunidad, metas, base social, cartones) de js/parametros.js
 * a js/equipo.js, y agrega el bloque «equipo» a datos/encabezados_comerciales.json.
 * Así el HTML de doble clic (herramientas/empaquetar.mjs) no lleva datos personales: usa js/equipo_vacio.js
 * y el equipo llega al cargar el archivo de encabezados.
 *
 *   node herramientas/separar_equipo.mjs          (desde la raíz del proyecto; se corre UNA vez)
 *
 * Comprueba al final que PARAMETROS_INICIALES queda idéntico al de antes (con Live Server nada cambia).
 */
import { readFile, writeFile, copyFile, access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const P = path.join(RAIZ, "js", "parametros.js");
const E = path.join(RAIZ, "js", "equipo.js");
let s = await readFile(P, "utf8");
if (s.includes('from "./equipo.js"')) { console.log("parametros.js ya está separado; no hago nada."); process.exit(0); }

const corte = (desde, hasta, texto = s) => { const i = texto.indexOf(desde); const j = texto.indexOf(hasta, i); if (i < 0 || j < 0) throw new Error(`No encontré «${desde.slice(0, 40)}»`); return [i, j]; };
// 1. META_ANTERIOR_OCTUBRE
let [i, j] = corte("/** Meta mensual de la política anterior", "/** Copia profunda");
const meta = s.slice(i, j); s = s.slice(0, i) + s.slice(j);
// 2. comerciales: [ persona(...), ... ]
[i, j] = corte("  comerciales: [\n    persona(", "  ],\n};\n");
const comerciales = s.slice(i + "  comerciales: [".length, j);
s = s.slice(0, i) + "  comerciales: clonarEquipo(EQUIPO_INICIAL.comerciales),\n};\n" + s.slice(j + "  ],\n};\n".length);
// 3. función persona()
i = s.indexOf("function persona(nombre,"); j = s.indexOf("\n}\n", i) + 3;
if (i < 0) throw new Error("No encontré function persona(");
const persona = s.slice(i, j); s = s.slice(0, i) + s.slice(j);
// 4. campos personales del director y eventos BTL
const dir = /  director: \{\n    nombre: ([^\n]*),\n    nombreCorto: ([^\n]*),\n    basico: ([^\n]*),\n    oportunidad: ([^\n]*),\n/.exec(s);
if (!dir) throw new Error("No encontré el bloque director { nombre, nombreCorto, basico, oportunidad }");
s = s.replace(dir[0], "  director: {\n    ...clonarEquipo(EQUIPO_INICIAL.director),\n");
const ev = /    eventos: \[\n([\s\S]*?)    \],/.exec(s.slice(s.indexOf("  btl: {")));
if (!ev) throw new Error("No encontré btl.eventos");
s = s.replace(ev[0], "    eventos: clonarEquipo(EQUIPO_INICIAL.btlEventos),");
s = s.replace('const CLAVE_GUARDADO = "liquidador-analfe-parametros";',
  'import { EQUIPO_INICIAL } from "./equipo.js";\n\nconst CLAVE_GUARDADO = "liquidador-analfe-parametros";\nconst clonarEquipo = (x) => JSON.parse(JSON.stringify(x));');

// Repintar Parámetros cuando el equipo llega con el archivo de encabezados (HTML de doble clic).
const escucha = '  document.addEventListener("metas-anteriores-cargadas", () => {';
if (!s.includes('"equipo-cargado"')) {
  if (!s.includes(escucha)) throw new Error("No encontré el listener metas-anteriores-cargadas");
  s = s.replace(escucha, `  // v16: el equipo llegó con el archivo de encabezados (HTML de doble clic).
  document.addEventListener("equipo-cargado", (evento) => {
    pintar(evento.detail || "");
    avisarCambiosSinGuardar();
  });
${escucha}`);
}

const equipo = `/**
 * Datos del equipo (personas): nombres, básico, oportunidad, metas, base social y cartones.
 * v16: salieron de parametros.js para que el HTML de doble clic no los lleve dentro.
 * - Con Live Server se usan estos valores iniciales (como antes).
 * - herramientas/empaquetar.mjs cambia este módulo por equipo_vacio.js; en ese HTML el equipo llega
 *   en el bloque «equipo» de datos/encabezados_comerciales.json (botón «Cargar encabezados (.json)»).
 * Datos personales: no subir este archivo a repositorios públicos ni a internet.
 */

${meta}${persona}
export const EQUIPO_INICIAL = {
  director: {
    nombre: ${dir[1]},
    nombreCorto: ${dir[2]},
    basico: ${dir[3]},
    oportunidad: ${dir[4]},
  },
  btlEventos: [
${ev[1]}  ],
  comerciales: [${comerciales}  ],
};
`;

// Comprobación: mismo PARAMETROS_INICIALES antes y después.
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.sessionStorage ??= globalThis.localStorage;
globalThis.document ??= { addEventListener() {}, dispatchEvent() {}, querySelector: () => null, querySelectorAll: () => [] };
globalThis.window ??= globalThis;
const antes = (await import(pathToFileURL(P).href + "?antes")).PARAMETROS_INICIALES;
await copyFile(P, P + ".antes_v16");
await writeFile(E, equipo, "utf8");
await writeFile(P, s, "utf8");
const despues = (await import(pathToFileURL(P).href + "?despues")).PARAMETROS_INICIALES;
if (JSON.stringify(antes) !== JSON.stringify(despues)) {
  await copyFile(P + ".antes_v16", P);
  throw new Error("PARAMETROS_INICIALES cambió: se restauró parametros.js. Revise a mano.");
}
console.log("OK: js/equipo.js creado; parametros.js sin datos del equipo (copia en js/parametros.js.antes_v16). PARAMETROS_INICIALES idéntico.");

// Bloque «equipo» en el archivo de encabezados (si existe).
const J = path.join(RAIZ, "datos", "encabezados_comerciales.json");
try {
  await access(J);
  const datos = JSON.parse(await readFile(J, "utf8"));
  const { EQUIPO_INICIAL } = await import(pathToFileURL(E).href);
  datos.equipo = { _uso: "Lo usa el HTML de doble clic (Liquidador_ANALFE.html): nombres, básico, oportunidad, metas, base social y cartones del equipo. Datos personales: no enviar por internet.", ...JSON.parse(JSON.stringify(EQUIPO_INICIAL)) };
  await writeFile(J, JSON.stringify(datos, null, 2) + "\n", "utf8");
  console.log(`OK: bloque «equipo» agregado a datos/encabezados_comerciales.json (${datos.equipo.comerciales.length} comerciales).`);
} catch (error) {
  if (error.code === "ENOENT") console.log("No hay datos/encabezados_comerciales.json: el bloque «equipo» se agrega cuando exista (vuelva a correr la parte final).");
  else throw error;
}
