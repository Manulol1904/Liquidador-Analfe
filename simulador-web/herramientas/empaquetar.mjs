#!/usr/bin/env node
/**
 * Empaqueta el simulador en UN HTML de doble clic (file://).
 *
 *   npm install --no-save esbuild
 *   node herramientas/empaquetar.mjs              → dist/Simulador_ANALFE.html
 *   node herramientas/empaquetar.mjs --revision   → dist/Simulador_ANALFE_revision.html (+ SheetJS + comparador)
 *
 * Incrusta: CSS, JS (IIFE), datos_ejemplo/*.json en window.ANALFE_RECURSOS.
 * Nunca incrusta privado/, salida_perfiles/ ni referencia/.
 * Simulación. No es un pago oficial.
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const revision = args.includes("--revision");
const SALIDA = path.resolve(
  args.find((a) => !a.startsWith("--")) ||
    path.join(RAIZ, "dist", revision ? "Simulador_ANALFE_revision.html" : "Simulador_ANALFE.html")
);

let esbuild;
const candidatosEsbuild = [
  process.env.ESBUILD_PATH,
  "esbuild",
  path.join(RAIZ, "..", "liquidador-web", "node_modules", "esbuild", "lib", "main.js"),
].filter(Boolean);
for (const c of candidatosEsbuild) {
  try {
    esbuild = await import(c);
    break;
  } catch {
    /* siguiente */
  }
}
if (!esbuild) {
  console.error("Falta esbuild. Ejecute: npm install --no-save esbuild");
  process.exit(1);
}

const sinVersion = {
  name: "sin-version",
  setup(build) {
    build.onResolve({ filter: /\?/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?.*$/, "")),
    }));
  },
};

const paquete = await esbuild.build({
  entryPoints: [path.join(RAIZ, "js", "main.js")],
  bundle: true,
  format: "iife",
  target: ["chrome100", "edge100"],
  write: false,
  charset: "utf8",
  plugins: [sinVersion],
  logLevel: "warning",
  legalComments: "none",
});
const js = paquete.outputFiles[0].text;

const seguro = (t) => String(t).replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");
const leer = (r) => readFile(path.join(RAIZ, r), "utf8");

const recursos = {};
const dirEjemplo = path.join(RAIZ, "datos_ejemplo");
if (existsSync(dirEjemplo)) {
  for (const nombre of (await readdir(dirEjemplo)).sort()) {
    if (!nombre.endsWith(".json")) continue;
    recursos[nombre] = JSON.parse(await leer(`datos_ejemplo/${nombre}`));
  }
}

let html = await leer("index.html");
html = html.replace(/^\uFEFF/, "");

// CSP: en file:// no hace falta connect-src self; dejamos data/blob
html = html.replace(
  /content="default-src 'none';[^"]+"/,
  `content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src data:"`
);

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_t, href) => `@@CSS:${href}@@`);
for (const m of [...html.matchAll(/@@CSS:([^@]+)@@/g)]) {
  const href = m[1].replace(/\?.*$/, "");
  const css = (await leer(href)).replace(/<\/style/gi, "<\\/style");
  html = html.replace(m[0], `<style>/* ${href} */\n${css}\n</style>`);
}

const fecha = new Date().toISOString().slice(0, 10);
const version = "0.1.0";

let xlsxBlock = "";
if (revision) {
  const xlsx = seguro(await leer("lib/xlsx.full.min.js"));
  xlsxBlock = `<script>/* SheetJS solo revisión */\n${xlsx}\n</script>\n`;
}

const modulo = /<script type="module" src="js\/main\.js[^"]*"><\/script>/;
if (!modulo.test(html)) throw new Error("No se encontró <script type=module src=js/main.js>");

html = html.replace(
  modulo,
  () =>
    `${xlsxBlock}<script>/* banner */\nwindow.ANALFE_EMPAQUETADO = ${JSON.stringify(fecha)};\nwindow.ANALFE_VERSION = ${JSON.stringify(version)};\nwindow.ANALFE_REVISION = ${revision ? "true" : "false"};\nwindow.ANALFE_RECURSOS = ${seguro(JSON.stringify(recursos))};\n</script>\n` +
    `<script>/* app */\n${seguro(js)}\n</script>\n` +
    `<!-- Simulador ANALFE ${version} · empaquetado ${fecha} · Simulación. No es un pago oficial. -->`
);

if (/\bsrc="(?!data:)[^"]+"|href="(?!data:|#)[^"]+\.(css|js)"/.test(html)) {
  throw new Error("Quedó una referencia a un archivo externo (src/href).");
}

// http(s) en código ejecutable (salvo licencias SheetJS en revisión)
const sinComentarios = html.replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
const urls = sinComentarios.match(/https?:\/\//g) || [];
if (!revision && urls.length) {
  throw new Error(`Aparecen ${urls.length} URL http(s) en el HTML normal. Revise el código.`);
}

await mkdir(path.dirname(SALIDA), { recursive: true });
await writeFile(SALIDA, html, "utf8");
const kb = Buffer.byteLength(html) / 1024;
console.log(
  `Listo: ${SALIDA} · ${kb.toFixed(0)} KB · recursos: ${Object.keys(recursos).join(", ") || "(ninguno)"}` +
    (revision ? " · revisión (+SheetJS)" : "")
);
console.log(`Versión ${version} · ${fecha} · Simulación. No es un pago oficial.`);
