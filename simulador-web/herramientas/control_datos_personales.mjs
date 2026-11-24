#!/usr/bin/env node
/**
 * Comprueba que ningún valor personal de privado/ aparece en dist, js, datos_ejemplo, pruebas, referencia.
 * Imprime solo «0 de N valores aparecen», nunca los valores.
 * Simulación. No es un pago oficial.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CAMPOS = new Set([
  "nombre", "nombreCorto", "nombreOficial", "nombreFacturacion", "documento",
  "basico", "oportunidad", "baseSocialInicial",
]);

async function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const nombre of await readdir(dir)) {
    if (nombre === "node_modules" || nombre === ".git") continue;
    const p = path.join(dir, nombre);
    const s = await stat(p);
    if (s.isDirectory()) await walk(p, acc);
    else if (/\.(html|js|mjs|json|md|csv)$/i.test(nombre)) acc.push(p);
  }
  return acc;
}

function sospechososDe(obj, out = new Set()) {
  if (Array.isArray(obj)) {
    obj.forEach((x) => sospechososDe(x, out));
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (CAMPOS.has(k) && v !== null && v !== undefined && v !== "") {
        const t = String(v);
        if (t.length >= 3) out.add(t);
      }
      sospechososDe(v, out);
    }
  }
  return out;
}

async function leerPrivado() {
  const set = new Set();
  const privado = path.join(RAIZ, "privado");
  if (!existsSync(privado)) return set;
  for (const nombre of await readdir(privado)) {
    const p = path.join(privado, nombre);
    if (nombre.endsWith(".json")) {
      try {
        sospechososDe(JSON.parse(await readFile(p, "utf8")), set);
      } catch {
        /* ignore */
      }
    } else if (nombre.endsWith(".csv")) {
      const texto = await readFile(p, "utf8");
      for (const celda of texto.split(/[;\n,]/)) {
        const t = celda.trim();
        if (t.length >= 5 && /[A-Za-zÁÉÍÓÚáéíóú]/.test(t)) set.add(t);
      }
    }
  }
  return set;
}

/** Patrones de documento (8–10 dígitos) que no estén en parámetros/ejemplo. */
function digitosSospechosos(texto, permitidos) {
  const hallados = [];
  const re = /\b\d{8,10}\b/g;
  let m;
  while ((m = re.exec(texto))) {
    if (!permitidos.has(m[0])) hallados.push(m[0]);
  }
  return [...new Set(hallados)];
}

async function main() {
  const sospechosos = await leerPrivado();
  const n = sospechosos.size;

  const zonas = ["dist", "js", "datos_ejemplo", "pruebas", "referencia", "plantillas", "esquemas"];
  const archivos = [];
  for (const z of zonas) await walk(path.join(RAIZ, z), archivos);

  // Permitidos: todo lo que ya está en datos_ejemplo (inventado) y parámetros
  const permitidos = new Set();
  const ejemploDir = path.join(RAIZ, "datos_ejemplo");
  if (existsSync(ejemploDir)) {
    for (const nombre of await readdir(ejemploDir)) {
      if (!nombre.endsWith(".json")) continue;
      const t = await readFile(path.join(ejemploDir, nombre), "utf8");
      for (const m of t.matchAll(/\b\d{8,10}\b/g)) permitidos.add(m[0]);
    }
  }
  try {
    const paramTxt = await readFile(path.join(RAIZ, "js", "parametros.js"), "utf8");
    for (const m of paramTxt.matchAll(/\b\d{8,10}\b/g)) permitidos.add(m[0]);
  } catch {
    /* ignore */
  }

  let hits = 0;
  for (const archivo of archivos) {
    let texto;
    try {
      texto = await readFile(archivo, "utf8");
    } catch {
      continue;
    }
    for (const v of sospechosos) {
      if (texto.includes(v)) hits += 1;
    }
  }

  if (n === 0) {
    console.log("Control de datos personales: 0 de 0 valores (no hay privado/ con datos reales).");
  } else {
    console.log(`Control de datos personales: ${hits} de ${n} valores aparecen.`);
  }

  if (hits > 0) {
    console.error("✖ Aparecen datos de privado/ en el entregable o en el código.");
    process.exit(1);
  }

  // Si hay privado/, además avisa dígitos raros en el HTML normal (no SheetJS)
  if (n > 0) {
    const htmlNormal = path.join(RAIZ, "dist", "Simulador_ANALFE.html");
    if (existsSync(htmlNormal)) {
      const texto = await readFile(htmlNormal, "utf8");
      const malos = digitosSospechosos(texto, permitidos);
      if (malos.length > 20) {
        console.error(`✖ ${malos.length} números de 8–10 dígitos no listados en ejemplos/parámetros.`);
        process.exit(1);
      }
    }
  }

  console.log("✔ Control de datos personales");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
