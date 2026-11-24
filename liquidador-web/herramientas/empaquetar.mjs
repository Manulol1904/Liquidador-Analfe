#!/usr/bin/env node
/**
 * Empaqueta la app en UN solo HTML que se abre con doble clic (file://) en Chrome o Edge.
 *
 *   npm install --no-save esbuild        (una vez; solo para empaquetar)
 *   node herramientas/empaquetar.mjs [salida.html]
 *
 * Qué hace:
 *  1. Une todos los módulos de js/ (desde js/main.js) en un solo script clásico (IIFE) con esbuild.
 *     Quita los «?v=…» de los import para que cada módulo exista una sola vez.
 *  2. Mete en el HTML el CSS (css/tokens.css, css/estilos.css) y las librerías locales (lib/*.js).
 *  3. Mete las plantillas y mapeos de plantillas/ en window.ANALFE_RECURSOS (xlsx en base64, JSON como objeto).
 *     js/recursos.js los lee de ahí, así que no hay fetch (que falla en file://).
 *  4. NO mete datos personales: datos/encabezados_comerciales.json se carga con el botón «Cargar encabezados (.json)».
 * Simulación. No es un pago oficial.
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = path.resolve(process.argv[2] || path.join(RAIZ, "dist", "Liquidador_ANALFE.html"));

let esbuild;
try {
  esbuild = await import(process.env.ESBUILD_PATH || "esbuild");
} catch {
  console.error("Falta esbuild. Ejecute una vez:  npm install --no-save esbuild   (o defina ESBUILD_PATH).");
  process.exit(1);
}

const sinVersion = {
  name: "sin-version",
  setup(build) {
    build.onResolve({ filter: /\?/ }, (args) => ({ path: path.resolve(args.resolveDir, args.path.replace(/\?.*$/, "")) }));
  },
};
// El equipo (nombres, salarios, metas) NO va dentro del HTML: llega con encabezados_comerciales.json.
const sinEquipo = {
  name: "sin-equipo",
  setup(build) {
    build.onResolve({ filter: /(^|\/)equipo\.js(\?.*)?$/ }, (args) => ({ path: path.join(RAIZ, "js", "equipo_vacio.js") }));
  },
};
const paquete = await esbuild.build({
  entryPoints: [path.join(RAIZ, "js", "main.js")],
  bundle: true, format: "iife", target: ["chrome100", "edge100"], write: false, charset: "utf8",
  plugins: [sinEquipo, sinVersion], logLevel: "warning", legalComments: "none",
});
const js = paquete.outputFiles[0].text;

const seguro = (t) => t.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");
const leer = (r) => readFile(path.join(RAIZ, r), "utf8");

// Recursos de plantillas/: todos los .xlsx y .json.
const recursos = {};
for (const nombre of (await readdir(path.join(RAIZ, "plantillas"))).sort()) {
  const ruta = `plantillas/${nombre}`;
  if (nombre.endsWith(".xlsx")) recursos[ruta] = (await readFile(path.join(RAIZ, ruta))).toString("base64");
  else if (nombre.endsWith(".json")) recursos[ruta] = JSON.parse(await leer(ruta));
}

let html = await leer("index.html");
html = html.replace(/^\uFEFF/, "");
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (t, href) => `@@CSS:${href}@@`);
for (const m of [...html.matchAll(/@@CSS:([^@]+)@@/g)]) {
  html = html.replace(m[0], () => `<style>/* ${m[1]} */\n${"\u0000"}</style>`.replace("\u0000", "@@CSSDATA@@"));
  html = html.replace("@@CSSDATA@@", await leer(m[1].replace(/\?.*$/, "")).then((c) => c.replace(/<\/style/gi, "<\\/style")));
}
const libs = [...html.matchAll(/<script src="(lib\/[^"]+)"><\/script>/g)];
for (const m of libs) {
  const codigo = seguro(await leer(m[1]));
  html = html.replace(m[0], () => `<script>/* ${m[1]} */\n${codigo}\n</script>`);
}
const modulo = /<script type="module" src="js\/main\.js[^"]*"><\/script>/;
if (!modulo.test(html)) throw new Error("No se encontró <script type=module src=js/main.js> en index.html");
const fecha = new Date().toISOString().slice(0, 10);
html = html.replace(modulo, () =>
  `<script>/* recursos (plantillas sin datos reales) */\nwindow.ANALFE_RECURSOS = ${seguro(JSON.stringify(recursos))};\nwindow.ANALFE_EMPAQUETADO = "${fecha}";\n</script>\n` +
  `<script>/* app (js/*.js unidos con esbuild) */\n${seguro(js)}\n</script>`);
if (/\bsrc="(?!data:)[^"]+"|href="(?!data:|#)[^"]+\.(css|js)"/.test(html)) throw new Error("Quedó una referencia a un archivo externo");
// Control: ningún nombre, documento ni cifra del archivo de encabezados puede quedar dentro del HTML.
try {
  const datos = JSON.parse(await leer("datos/encabezados_comerciales.json"));
  const sospechosos = new Set();
  const recorrer = (x) => {
    if (Array.isArray(x)) return x.forEach(recorrer);
    if (x && typeof x === "object") {
      for (const [k, v] of Object.entries(x)) {
        if (["nombre", "nombreOficial", "documento", "basico", "oportunidad"].includes(k) && v !== null && v !== "" && String(v).length >= 5) sospechosos.add(String(v));
        recorrer(v);
      }
    }
  };
  recorrer(datos);
  const hallados = [...sospechosos].filter((t) => html.includes(t));
  if (hallados.length) {
    if (process.env.ANALFE_SKIP_PII_CHECK === "1") {
      console.log(`Control de datos personales: omitido aquí (${hallados.length} hallazgo(s)); lo revisa generar_entrega.mjs.`);
    } else {
      throw new Error(`El HTML trae ${hallados.length} dato(s) personales del archivo de encabezados. Revise js/equipo.js / textos.`);
    }
  } else {
    console.log(`Control de datos personales: 0 de ${sospechosos.size} valores del archivo de encabezados aparecen en el HTML.`);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.log("Control de datos personales: no hay datos/encabezados_comerciales.json para comparar (se omite).");
}
await import("node:fs").then((fs) => fs.mkdirSync(path.dirname(SALIDA), { recursive: true }));
await writeFile(SALIDA, html, "utf8");
const kb = Buffer.byteLength(html) / 1024;
console.log(`Listo: ${SALIDA} · ${kb.toFixed(0)} KB · recursos: ${Object.keys(recursos).join(", ")}`);
