#!/usr/bin/env node
/**
 * Arma el paquete entregable para Financiera (HTML de doble clic + encabezados + guía + zip).
 *
 *   node herramientas/generar_entrega.mjs v22
 *   node herramientas/generar_entrega.mjs v22 --pdf
 *   node herramientas/generar_entrega.mjs v22 --capturas carpeta/png
 *
 * Simulación. No es un pago oficial. Nunca escribe la clave del simulador.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  access, copyFile, mkdir, readdir, readFile, rm, stat, writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = { version: null, pdf: false, capturas: null };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--pdf") args.pdf = true;
    else if (a === "--capturas") args.capturas = rest.shift() || null;
    else if (!a.startsWith("-") && !args.version) args.version = a;
  }
  if (!args.version) args.version = hoy();
  return args;
}

async function existe(rel) {
  try {
    await access(path.join(RAIZ, rel));
    return true;
  } catch {
    return false;
  }
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(bytes >= 1024 * 100 ? 0 : 1)} KB`;
}

async function tamano(ruta) {
  return (await stat(ruta)).size;
}

/** Extrae del bloque equipo los valores a buscar en el HTML, con etiqueta segura (sin el valor). */
function sospechososEquipo(equipo) {
  const lista = [];
  const push = (campo, valor) => {
    if (valor === null || valor === undefined || valor === "") return;
    const texto = String(valor);
    if (texto.length < 3) return;
    lista.push({ campo, texto });
  };
  if (equipo?.director) {
    push("nombre del director", equipo.director.nombre);
    push("básico del director", equipo.director.basico);
    push("oportunidad del director", equipo.director.oportunidad);
    push("documento del director", equipo.director.documento);
  }
  (equipo?.comerciales || []).forEach((c, i) => {
    const n = i + 1;
    push(`nombre del comercial ${n}`, c.nombre);
    push(`nombre oficial del comercial ${n}`, c.nombreOficial);
    push(`nombre de facturación del comercial ${n}`, c.nombreFacturacion);
    push(`documento del comercial ${n}`, c.documento);
    push(`básico del comercial ${n}`, c.basico);
    push(`oportunidad del comercial ${n}`, c.oportunidad);
  });
  // Deduplicar por texto (mismo salario en varios) pero conservar la primera etiqueta.
  const vistos = new Map();
  for (const item of lista) {
    if (!vistos.has(item.texto)) vistos.set(item.texto, item.campo);
  }
  return [...vistos.entries()].map(([texto, campo]) => ({ texto, campo }));
}

function revisarDatosPersonales(html, equipo) {
  const sospechosos = sospechososEquipo(equipo);
  const hallados = sospechosos.filter((s) => html.includes(s.texto));
  return { total: sospechosos.length, hallados };
}

/** Namespaces XML/Office y URLs de licencia: no son peticiones de red. */
function urlPermitida(url) {
  return /schemas\.openxmlformats\.org|schemas\.microsoft\.com|purl\.oclc\.org|www\.w3\.org\/(XML|2000\/xmlns|1999\/xhtml)|creativecommons\.org|opensource\.org|stuartk\.com|sheetjs\.com|github\.com\/[Ss]heetJS|nodejs\.org|mozilla\.org\/MPL/i.test(url);
}

/**
 * Busca uso de red en el HTML empaquetado.
 * Omite bloques de lib/ (licencias) y namespaces XML del motor Excel.
 */
function revisarRed(html) {
  const problemas = [];
  const sinLib = html.replace(/<script>\/\* lib\/[\s\S]*?<\/script>/gi, "<!--lib-->");

  const urls = [...sinLib.matchAll(/\bhttps?:\/\/[^\s"'<>\\]+/gi)].map((m) => m[0]);
  for (const u of urls) {
    if (urlPermitida(u)) continue;
    problemas.push(`URL externa: ${u.slice(0, 80)}`);
  }

  const fetchExt = [...sinLib.matchAll(/\bfetch\s*\(\s*[`'"](https?:\/\/[^`'"]+)/gi)];
  for (const m of fetchExt) problemas.push(`fetch externo: ${m[1].slice(0, 80)}`);

  const scripts = [...sinLib.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
  for (const m of scripts) {
    const src = m[1];
    if (/^(data:|blob:|#)/i.test(src)) continue;
    if (/^https?:\/\//i.test(src) || /^\/\//.test(src)) problemas.push(`<script src> externo: ${src}`);
  }
  const links = [...sinLib.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)];
  for (const m of links) {
    const href = m[1];
    if (/^(data:|blob:|#)/i.test(href)) continue;
    if (/^https?:\/\//i.test(href) || /^\/\//.test(href)) problemas.push(`<link href> externo: ${href}`);
  }
  return problemas;
}

function buscarChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const ruta of candidatos) {
    if (existsSync(ruta)) return ruta;
  }
  return null;
}

function mdAHtml(md, titulo) {
  const escapar = (t) => String(t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lineas = md.replace(/\r\n/g, "\n").split("\n");
  const cuerpo = [];
  let enLista = false;
  const cerrarLista = () => {
    if (enLista) { cuerpo.push("</ul>"); enLista = false; }
  };
  for (const cruda of lineas) {
    const linea = cruda;
    if (/^---\s*$/.test(linea)) { cerrarLista(); cuerpo.push("<hr>"); continue; }
    if (/^#\s+/.test(linea)) { cerrarLista(); cuerpo.push(`<h1>${escapar(linea.replace(/^#\s+/, ""))}</h1>`); continue; }
    if (/^##\s+/.test(linea)) { cerrarLista(); cuerpo.push(`<h2>${escapar(linea.replace(/^##\s+/, ""))}</h2>`); continue; }
    if (/^###\s+/.test(linea)) { cerrarLista(); cuerpo.push(`<h3>${escapar(linea.replace(/^###\s+/, ""))}</h3>`); continue; }
    if (/^\d+\.\s+/.test(linea) || /^[-*]\s+/.test(linea)) {
      if (!enLista) { cuerpo.push("<ul>"); enLista = true; }
      const item = linea.replace(/^\d+\.\s+/, "").replace(/^[-*]\s+/, "");
      const conNegrita = escapar(item).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      cuerpo.push(`<li>${conNegrita}</li>`);
      continue;
    }
    if (!linea.trim()) { cerrarLista(); continue; }
    cerrarLista();
    const conNegrita = escapar(linea).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    cuerpo.push(`<p>${conNegrita}</p>`);
  }
  cerrarLista();
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${escapar(titulo)}</title>
<style>
  body{font-family:Segoe UI,Calibri,sans-serif;max-width:720px;margin:2cm auto;line-height:1.45;color:#222}
  h1{font-size:1.6rem} h2{font-size:1.2rem;margin-top:1.4em} h3{font-size:1.05rem}
  li{margin:0.25em 0} hr{border:none;border-top:1px solid #ccc;margin:1.5em 0}
</style></head><body>${cuerpo.join("\n")}</body></html>`;
}

async function generarPdf(mdRuta, pdfRuta) {
  const chrome = buscarChrome();
  if (!chrome) {
    console.warn("No se encontró Chrome ni Edge: se omite el PDF.");
    return false;
  }
  const htmlTmp = pdfRuta.replace(/\.pdf$/i, ".tmp.html");
  const md = await readFile(mdRuta, "utf8");
  await writeFile(htmlTmp, mdAHtml(md, "Guía de uso"), "utf8");
  const fileUrl = `file:///${htmlTmp.replace(/\\/g, "/")}`;
  const r = spawnSync(chrome, [
    "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
    `--print-to-pdf=${pdfRuta}`, fileUrl,
  ], { encoding: "utf8", timeout: 60000 });
  try { await rm(htmlTmp, { force: true }); } catch { /* ignore */ }
  if (r.status !== 0 || !existsSync(pdfRuta)) {
    console.warn("No se pudo generar el PDF con el navegador; se continúa sin PDF.");
    if (r.stderr) console.warn(String(r.stderr).slice(0, 300));
    return false;
  }
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = args.version.replace(/[^\w.\-]+/g, "_");

  if (!(await existe("herramientas/empaquetar.mjs")) || !(await existe("js/equipo_vacio.js"))) {
    console.error("Falta aplicar ronda_v21_base_v16.zip (empaquetar.mjs / equipo_vacio.js)");
    process.exit(1);
  }
  if (!(await existe("herramientas/guia_plantilla.md"))) {
    console.error("Falta herramientas/guia_plantilla.md");
    process.exit(1);
  }
  if (!(await existe("datos/encabezados_comerciales.json"))) {
    console.error("Falta datos/encabezados_comerciales.json (necesario para el paquete y el control de privacidad).");
    process.exit(1);
  }

  try {
    await import("esbuild");
  } catch {
    console.error("Falta esbuild. Ejecute: npm install --no-save esbuild");
    process.exit(1);
  }

  const nombreCarpeta = `entrega_financiera_${version}`;
  const dirEntrega = path.join(RAIZ, "entregas", nombreCarpeta);
  const htmlSalida = path.join(dirEntrega, "Liquidador_ANALFE.html");
  const zipSalida = path.join(RAIZ, "entregas", `${nombreCarpeta}.zip`);

  await rm(dirEntrega, { recursive: true, force: true });
  await mkdir(dirEntrega, { recursive: true });

  // 1. Empaquetar
  console.log("Empaquetando HTML…");
  const empaquetar = spawnSync(process.execPath, [
    path.join(RAIZ, "herramientas", "empaquetar.mjs"),
    htmlSalida,
  ], {
    cwd: RAIZ,
    encoding: "utf8",
    // La revisión con etiquetas (sin imprimir valores) la hace este script.
    env: { ...process.env, ANALFE_SKIP_PII_CHECK: "1" },
  });
  if (empaquetar.status !== 0) {
    await rm(dirEntrega, { recursive: true, force: true });
    console.error(empaquetar.stderr || empaquetar.stdout || "Error al empaquetar");
    process.exit(empaquetar.status || 1);
  }
  if (empaquetar.stdout) process.stdout.write(empaquetar.stdout);

  const html = await readFile(htmlSalida, "utf8");
  const encabezados = JSON.parse(await readFile(path.join(RAIZ, "datos", "encabezados_comerciales.json"), "utf8"));

  // 2. Datos personales
  const { total, hallados } = revisarDatosPersonales(html, encabezados.equipo || {});
  if (hallados.length) {
    await rm(dirEntrega, { recursive: true, force: true });
    console.error(`Error: el HTML trae ${hallados.length} dato(s) personales del bloque equipo (de ${total} revisados).`);
    for (const h of hallados) console.error(`  - ${h.campo}`);
    process.exit(1);
  }

  // 3. Red
  const red = revisarRed(html);
  if (red.length) {
    await rm(dirEntrega, { recursive: true, force: true });
    console.error(`Error: el HTML usa la red (${red.length}):`);
    for (const p of red.slice(0, 20)) console.error(`  - ${p}`);
    process.exit(1);
  }

  // Encabezados
  await copyFile(
    path.join(RAIZ, "datos", "encabezados_comerciales.json"),
    path.join(dirEntrega, "encabezados_comerciales.json"),
  );

  // 4. Guía
  const plantilla = await readFile(path.join(RAIZ, "herramientas", "guia_plantilla.md"), "utf8");
  const guia = plantilla
    .replaceAll("{{version}}", version)
    .replaceAll("{{fecha}}", hoy());
  const guiaMd = path.join(dirEntrega, "Guia_de_uso.md");
  await writeFile(guiaMd, guia, "utf8");
  let conPdf = false;
  if (args.pdf) {
    conPdf = await generarPdf(guiaMd, path.join(dirEntrega, "Guia_de_uso.pdf"));
  }

  // 5. Capturas
  if (args.capturas) {
    const origen = path.resolve(args.capturas);
    if (!existsSync(origen)) {
      await rm(dirEntrega, { recursive: true, force: true });
      console.error(`No existe la carpeta de capturas: ${origen}`);
      process.exit(1);
    }
    const dest = path.join(dirEntrega, "capturas");
    await mkdir(dest, { recursive: true });
    const pngs = (await readdir(origen)).filter((n) => /\.png$/i.test(n));
    for (const n of pngs) await copyFile(path.join(origen, n), path.join(dest, n));
    console.log(`Capturas: ${pngs.length} PNG copiados.`);
  }

  // 6. Zip con JSZip del proyecto
  let JSZip;
  try {
    JSZip = require(path.join(RAIZ, "lib", "jszip.min.js"));
  } catch (error) {
    await rm(dirEntrega, { recursive: true, force: true });
    console.error("No se pudo cargar lib/jszip.min.js:", error.message);
    process.exit(1);
  }
  const zip = new JSZip();
  async function agregarDir(dirAbs, prefijoZip) {
    const entradas = await readdir(dirAbs, { withFileTypes: true });
    for (const e of entradas) {
      const abs = path.join(dirAbs, e.name);
      const rel = `${prefijoZip}/${e.name}`.replace(/\\/g, "/");
      if (e.isDirectory()) await agregarDir(abs, rel);
      else zip.file(rel, await readFile(abs));
    }
  }
  await agregarDir(dirEntrega, nombreCarpeta);
  const bytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(zipSalida, bytes);

  // 7. Resumen
  const archivos = [];
  async function listar(dirAbs, prefijo = "") {
    for (const e of await readdir(dirAbs, { withFileTypes: true })) {
      const abs = path.join(dirAbs, e.name);
      const rel = prefijo ? `${prefijo}/${e.name}` : e.name;
      if (e.isDirectory()) await listar(abs, rel);
      else archivos.push({ rel, bytes: await tamano(abs) });
    }
  }
  await listar(dirEntrega);

  console.log("");
  console.log(`Entrega ${version}`);
  for (const a of archivos) console.log(`  ${a.rel.padEnd(36)} ${kb(a.bytes)}`);
  console.log(`  ${(nombreCarpeta + ".zip").padEnd(36)} ${kb(bytes.length)}`);
  console.log("HTML sin datos personales ✓");
  console.log("Sin red ✓");
  if (args.pdf) console.log(conPdf ? "PDF ✓" : "PDF omitido");
  console.log(`Carpeta: ${dirEntrega}`);
  console.log(`Zip:     ${zipSalida}`);
}

main().catch(async (error) => {
  console.error(error.message || error);
  process.exit(1);
});
