#!/usr/bin/env node
/**
 * Genera un .perfil.json por persona a partir de encabezados (formato liquidador) o CSV.
 *
 *   node herramientas/generar_perfiles.mjs --entrada datos_ejemplo/encabezados_ejemplo.json
 *   node herramientas/generar_perfiles.mjs --entrada privado/encabezados_comerciales.json
 *   node herramientas/generar_perfiles.mjs --entrada plantillas/plantilla_perfiles.csv
 *   node herramientas/generar_perfiles.mjs --entrada ... --cifrar   (pide contraseña por persona, sin eco)
 *
 * No imprime salarios. Cursor no debe abrir privado/.
 * Simulación. No es un pago oficial.
 */
import { createInterface } from "node:readline";
import { stdin as input, stdout as output, stderr } from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { entrada: null, cifrar: false, salida: "salida_perfiles" };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--cifrar") args.cifrar = true;
    else if (a === "--entrada") args.entrada = rest.shift();
    else if (a === "--salida") args.salida = rest.shift();
    else if (!a.startsWith("-") && !args.entrada) args.entrada = a;
  }
  return args;
}

function aliasDe(nombre) {
  return String(nombre || "persona")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "persona";
}

function idDe(nombre, i) {
  return `c-${aliasDe(nombre).slice(0, 8) || i}`;
}

async function sha256Hex(texto) {
  const data = new TextEncoder().encode(texto);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonico(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonico).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonico(obj[k])}`).join(",")}}`;
}

async function huella(perfil) {
  const copia = structuredClone(perfil);
  if (copia.control) delete copia.control.sha256;
  return sha256Hex(canonico(copia));
}

/** Factores Edu/Asist de la hoja _Datos (oct → nov/dic), p. ej. 42M → 32,7M → 28,65M. */
const FACTOR_EDU_NOV = 32700000 / 42000000;
const FACTOR_EDU_DIC = 28650000 / 42000000;

function nuloONumero(v) {
  if (v === null || v === undefined || v === "" || v === "-") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function metaProducto(m) {
  if (!m || typeof m !== "object") {
    return { educacion: null, mision: null, congreso: null, cultural: null };
  }
  return {
    educacion: nuloONumero(m.educacion ?? m.eduAt),
    mision: nuloONumero(m.mision),
    congreso: nuloONumero(m.congreso),
    cultural: nuloONumero(m.cultural),
  };
}

/** Cultural dic según cartones de la hoja (860 → 34,4M; 425 → 17M). */
function culturalDicPorCartones(cartones) {
  const c = Number(cartones);
  if (!Number.isFinite(c) || c <= 0) return null;
  if (c >= 700) return 34400000;
  if (c >= 300) return 17000000;
  return null;
}

/**
 * Completa Nov/Dic Edu/Asist y Cultural dic cuando la fuente liquidador
 * solo trae octubre (la hoja _Datos sí trae el trimestre).
 */
function completarMetasTrimestre(metas, cartones) {
  const base = structuredClone(metas && typeof metas === "object" ? metas : {});
  for (const mes of ["2026-10", "2026-11", "2026-12"]) {
    base[mes] = { ...(base[mes] || {}) };
  }
  const oct = metaProducto(base["2026-10"]).educacion;
  const nov = metaProducto(base["2026-11"]);
  const dic = metaProducto(base["2026-12"]);

  if (oct != null && nov.educacion == null) {
    base["2026-11"].eduAt = Math.round(oct * FACTOR_EDU_NOV);
    base["2026-11"].educacion = base["2026-11"].eduAt;
  }
  if (oct != null && dic.educacion == null) {
    base["2026-12"].eduAt = Math.round(oct * FACTOR_EDU_DIC);
    base["2026-12"].educacion = base["2026-12"].eduAt;
  }
  if (base["2026-11"].mision === undefined) base["2026-11"].mision = 0;
  if (base["2026-12"].mision === undefined) base["2026-12"].mision = 0;
  if (base["2026-10"].congreso === undefined) base["2026-10"].congreso = 0;
  if (base["2026-11"].congreso == null) base["2026-11"].congreso = 0;
  if (base["2026-12"].congreso == null) base["2026-12"].congreso = 0;
  if (base["2026-10"].cultural == null) base["2026-10"].cultural = 0;
  if (base["2026-11"].cultural == null) base["2026-11"].cultural = 0;
  if (base["2026-12"].cultural == null) {
    base["2026-12"].cultural = culturalDicPorCartones(cartones) ?? 0;
  }
  return base;
}

function metasAPeriodos(metas) {
  const vacio = { educacion: null, mision: null, congreso: null, cultural: null };
  if (!metas || typeof metas !== "object") {
    return [
      { mes: "2026-10", diasMes: 31, diasLaborados: 31, metas: { ...vacio } },
      { mes: "2026-11", diasMes: 30, diasLaborados: 30, metas: { ...vacio } },
      { mes: "2026-12", diasMes: 31, diasLaborados: 31, metas: { ...vacio } },
    ];
  }
  const keys = Object.keys(metas);
  if (keys.some((k) => /^\d{4}-\d{2}$/.test(k))) {
    const meses = ["2026-10", "2026-11", "2026-12"].filter((m) => metas[m] || keys.includes(m));
    const lista = (meses.length ? meses : keys.filter((k) => /^\d{4}-\d{2}$/.test(k)).sort());
    return lista.map((mes) => ({
      mes,
      diasMes: mes.endsWith("-11") ? 30 : 31,
      diasLaborados: mes.endsWith("-11") ? 30 : 31,
      metas: metaProducto(metas[mes]),
    }));
  }
  return [
    {
      mes: "2026-10",
      diasMes: 31,
      diasLaborados: 31,
      metas: {
        educacion: nuloONumero(metas.educacion ?? metas.oct),
        mision: nuloONumero(metas.misionOct ?? metas.mision),
        congreso: nuloONumero(metas.congreso) ?? 0,
        cultural: nuloONumero(metas.cultural) ?? 0,
      },
    },
  ];
}

function regionalDeCargo(cargo) {
  const c = String(cargo || "");
  const m = c.match(/–\s*(.+)$/) || c.match(/-\s*(.+)$/);
  return m ? m[1].trim() : "";
}

function comercialAPerfil(c, i) {
  const basico = Number(c.basico);
  const oportunidad = Number(c.oportunidad);
  const metas = completarMetasTrimestre(c.metas, c.cartones);
  const tieneBase = c.tieneBaseSocial === 0 || c.tieneBaseSocial === false
    ? false
    : c.baseSocialInicial != null && c.baseSocialInicial !== "";
  const perfil = {
    formato: "analfe-simulador-perfil",
    version: 1,
    tipo: c.activoDesde && String(c.activoDesde) > "2026-10" && !tieneBase ? "nuevo-ingreso" : "comercial",
    variante: "trimestre-oct-dic-2026",
    generado: new Date().toISOString().slice(0, 10),
    politica: "PCV-COM-001",
    persona: {
      id: idDe(c.nombreCorto || c.nombre, i),
      nombreVisible: c.nombreCorto || c.nombre || `Comercial ${i}`,
      cargo: c.cargo || "",
      regional: c.regional || regionalDeCargo(c.cargo),
    },
    compensacion: {
      basico: Number.isFinite(basico) ? basico : null,
      oportunidad: Number.isFinite(oportunidad) ? oportunidad : null,
      topeIndividual: 1.2,
      imr: Number.isFinite(basico) && Number.isFinite(oportunidad) ? basico + oportunidad : null,
    },
    periodos: metasAPeriodos(metas),
    baseSocial: {
      fechaCorte: "2026-09-30",
      inicial: tieneBase ? (c.baseSocialInicial ?? null) : null,
      ingresos: c.ingresos ?? 0,
      retiros: c.retiros ?? 0,
      tieneBase,
      certificada: tieneBase,
    },
    cartones: c.cartones ?? null,
    btl: { pagadoEnAnio: c.btlPagadoAnio ?? 0 },
    anterior: {
      comisionPorMes: Object.fromEntries(
        Object.entries(c.anteriorMes || {}).map(([mes, v]) => [mes, v?.produccionManual ?? null]),
      ),
    },
    parametrosPropios: {},
    control: {},
  };
  return perfil;
}

function directorAPerfil(d, equipo) {
  const basico = Number(d.basico);
  const oportunidad = Number(d.oportunidad);
  return {
    formato: "analfe-simulador-perfil",
    version: 1,
    tipo: "director",
    variante: "trimestre-oct-dic-2026",
    generado: new Date().toISOString().slice(0, 10),
    politica: "PCV-COM-001",
    persona: {
      id: "dir-" + aliasDe(d.nombreCorto || d.nombre).slice(0, 8),
      nombreVisible: d.nombreCorto || d.nombre || "Director",
      cargo: "Director Comercial",
      regional: "",
    },
    compensacion: {
      basico: Number.isFinite(basico) ? basico : null,
      oportunidad: Number.isFinite(oportunidad) ? oportunidad : null,
      topeIndividual: 1.2,
    },
    equipo: {
      puntosIndividuales: (equipo?.comerciales || []).map((c, i) => ({
        alias: `Comercial ${i + 1}`,
        puntaje: null,
        metaVentas: null,
      })),
    },
    btl: { pagadoEnAnio: 0 },
    anterior: {},
    parametrosPropios: {},
    control: {},
  };
}

async function leerEntrada(ruta) {
  const abs = path.isAbsolute(ruta) ? ruta : path.join(RAIZ, ruta);
  const texto = await fs.readFile(abs, "utf8");
  if (ruta.endsWith(".csv") || texto.includes("compensacion.basico")) {
    const { csvAPerfil } = await import("../js/perfil.js");
    const lineas = texto.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    const sep = lineas[0].includes(";") ? ";" : ",";
    const headers = lineas[0].split(sep).map((h) => h.trim());
    const perfiles = [];
    for (let i = 1; i < lineas.length; i += 1) {
      if (!lineas[i].trim()) continue;
      const fila = [headers.join(sep), lineas[i]].join("\n");
      const r = csvAPerfil(fila);
      if (!r.ok) throw new Error(`Fila ${i + 1}: ${r.error}`);
      perfiles.push({ alias: aliasDe(r.perfil.persona.nombreVisible), perfil: r.perfil, destinatario: r.perfil.persona.nombreVisible });
    }
    return perfiles;
  }

  const data = JSON.parse(texto);
  // Preferir bloque «equipo» (metas + base social). Completar cargo/nombres
  // desde el arreglo raíz «comerciales» si viene en el mismo JSON.
  const extras = new Map((data.comerciales || []).map((c) => [c.nombre, c]));
  const equipo = data.equipo
    ? structuredClone(data.equipo)
    : {
        comerciales: structuredClone(data.comerciales || []),
        director: data.director ? structuredClone(data.director) : undefined,
      };
  for (const c of equipo.comerciales || []) {
    const x = extras.get(c.nombre);
    if (!x) continue;
    if (!c.cargo && x.cargo) c.cargo = x.cargo;
    if (!c.nombreCorto && x.nombre) c.nombreCorto = x.nombre.split(/\s+/)[0];
    if (!c.nombreOficial && x.nombreOficial) c.nombreOficial = x.nombreOficial;
    if (c.basico == null && x.basico != null) c.basico = x.basico;
    if (c.oportunidad == null && x.oportunidad != null) c.oportunidad = x.oportunidad;
  }
  // Si no hay metas en equipo pero sí comerciales raíz sin metas, no inventar.
  const lista = [];
  (equipo.comerciales || []).forEach((c, i) => {
    lista.push({
      alias: aliasDe(c.nombreCorto || c.nombre || `comercial_${i}`),
      perfil: comercialAPerfil(c, i),
      destinatario: c.nombreCorto || c.nombre || `Comercial ${i + 1}`,
    });
  });
  const dir = equipo.director || data.director;
  if (dir?.nombre || dir?.basico) {
    lista.push({
      alias: aliasDe(dir.nombreCorto || dir.nombre || "director"),
      perfil: directorAPerfil(dir, equipo),
      destinatario: dir.nombreCorto || dir.nombre || "Director",
    });
  }
  return lista;
}

async function cifrarPerfil(perfil, contraseña) {
  const { cifrarPerfil: cifrar } = await import("../js/cifrado.js");
  return cifrar(perfil, contraseña);
}

function pedirContraseña(etiqueta) {
  return new Promise((resolve) => {
    const rl = createInterface({ input, output: stderr, terminal: true });
    stderr.write(`${etiqueta}: `);
    let silent = "";
    if (input.isTTY) {
      input.setRawMode?.(true);
      const onData = (buf) => {
        const s = buf.toString("utf8");
        if (s === "\n" || s === "\r" || s === "\u0004") {
          input.setRawMode?.(false);
          input.removeListener("data", onData);
          stderr.write("\n");
          rl.close();
          resolve(silent);
        } else if (s === "\u0003") {
          process.exit(1);
        } else if (s === "\u007f" || s === "\b") {
          silent = silent.slice(0, -1);
        } else {
          silent += s;
        }
      };
      input.on("data", onData);
    } else {
      rl.question("", (ans) => {
        rl.close();
        resolve(ans);
      });
    }
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.entrada) {
    console.error("Uso: node herramientas/generar_perfiles.mjs --entrada <json|csv> [--cifrar] [--salida salida_perfiles]");
    process.exit(1);
  }

  const items = await leerEntrada(args.entrada);
  const outDir = path.isAbsolute(args.salida) ? args.salida : path.join(RAIZ, args.salida);
  await fs.mkdir(outDir, { recursive: true });

  const leeme = ["Entrega de perfiles del simulador ANALFE", "Simulación. No es un pago oficial.", "", "Entregar UN archivo por persona por el canal interno.", "Nunca por correo personal ni WhatsApp, y nunca el paquete completo.", ""];

  for (const item of items) {
    item.perfil.control = item.perfil.control || {};
    item.perfil.control.sha256 = await huella(item.perfil);

    let nombreArchivo;
    if (args.cifrar) {
      const pass = await pedirContraseña(`Contraseña para ${item.destinatario}`);
      if (!pass) {
        console.error("Contraseña vacía; se omite", item.alias);
        continue;
      }
      const sobre = await cifrarPerfil(item.perfil, pass);
      nombreArchivo = `${item.alias}.analfe`;
      await fs.writeFile(path.join(outDir, nombreArchivo), JSON.stringify(sobre, null, 2), "utf8");
    } else {
      nombreArchivo = `${item.alias}.perfil.json`;
      await fs.writeFile(path.join(outDir, nombreArchivo), JSON.stringify(item.perfil, null, 2), "utf8");
    }
    leeme.push(`- ${nombreArchivo} → ${item.destinatario}`);
    console.log(`OK ${nombreArchivo} → ${item.destinatario}`);
  }

  await fs.writeFile(path.join(outDir, "LEEME_ENTREGA.txt"), leeme.join("\n") + "\n", "utf8");
  console.log(`\n${items.length} perfiles en ${outDir}`);
  console.log("Simulación. No es un pago oficial.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
