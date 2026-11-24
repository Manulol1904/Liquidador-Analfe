#!/usr/bin/env node
/**
 * Prueba de humo del HTML empaquetado (file://).
 * Usa puppeteer-core si hay Chrome/Edge; si no, se omite (exit 0, mensaje «omitida»).
 * Simulación. No es un pago oficial.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HTML = path.join(RAIZ, "dist", "Simulador_ANALFE.html");

function buscarNavegador() {
  const candidatos = [
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  return candidatos.find((p) => existsSync(p)) || null;
}

async function main() {
  if (!existsSync(HTML)) {
    console.log("Humo: omitida (no existe dist/Simulador_ANALFE.html; empaquete antes).");
    process.exit(0);
  }

  let puppeteer;
  try {
    puppeteer = await import("puppeteer-core");
  } catch {
    console.log("Humo: omitida (npm install --no-save puppeteer-core).");
    process.exit(0);
  }

  const exe = buscarNavegador();
  if (!exe) {
    console.log("Humo: omitida (no se encontró Chrome ni Edge).");
    process.exit(0);
  }

  const browser = await puppeteer.default.launch({
    executablePath: exe,
    headless: true,
    args: ["--allow-file-access-from-files"],
  });

  const page = await browser.newPage();
  const errores = [];
  const redes = [];
  page.on("pageerror", (e) => errores.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errores.push(msg.text());
  });
  page.on("request", (req) => {
    const u = req.url();
    if (/^https?:/i.test(u)) redes.push(u);
  });

  await page.goto(pathToFileURL(HTML).href, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));

  const info = await page.evaluate(() => ({
    titulo: document.title,
    franja: Boolean(document.getElementById("franja-resultados")),
    api: Boolean(window.ANALFE_SIM),
    empaquetado: window.ANALFE_EMPAQUETADO || null,
    perfil: window.ANALFE_SIM?.obtenerEstado?.()?.perfil?.persona?.nombreVisible || null,
    puntaje: window.ANALFE_SIM?.obtenerEstado?.()?.resultado?.puntaje ?? null,
  }));

  await browser.close();

  console.log(
    `Humo: «${info.titulo}» · empaquetado=${info.empaquetado} · perfil=${info.perfil} · puntaje=${info.puntaje}`
  );
  console.log(`Humo: errores consola=${errores.length} · http(s)=${redes.length}`);

  let fail = false;
  if (redes.length) {
    console.error("✖ Peticiones de red:", redes.slice(0, 5));
    fail = true;
  }
  if (errores.length) {
    console.error("✖ Errores de consola:", errores.slice(0, 5));
    fail = true;
  }
  if (!info.franja || !info.api) {
    console.error("✖ No cargó la app (franja/API).");
    fail = true;
  }
  if (fail) process.exit(1);
  console.log("✔ Humo");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
