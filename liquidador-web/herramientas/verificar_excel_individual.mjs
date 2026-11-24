// verificar_excel_individual.mjs — Compara un Excel individual generado por la app contra el de referencia (v6.7).
// Uso:  node verificar_excel_individual.mjs <referencia.xlsx> <generado.xlsx> [--sin-recalculo] [--lib <carpeta lib/ del proyecto>]
// Revisa: hojas (orden y visibilidad), nombres definidos, fórmulas, valores (tras recalcular con LibreOffice
// si está instalado), estilos por celda, validaciones, formatos condicionales, comentarios, combinaciones,
// anchos de columna, áreas de impresión, inmovilizados, cuadrícula y protección.
// No envía nada a internet. No imprime claves.
import fs from "fs"; import path from "path"; import os from "os"; import { createRequire } from "module"; import { execFileSync } from "child_process";
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const libDir = args.includes("--lib") ? args[args.indexOf("--lib") + 1] : null;
const [REF, GEN] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--lib");
if (!REF || !GEN) { console.log("Uso: node verificar_excel_individual.mjs <referencia.xlsx> <generado.xlsx> [--sin-recalculo] [--lib ./lib]"); process.exit(2); }
const cargar = (archivo, paquete) => { for (const p of [libDir && path.join(libDir, archivo), path.resolve("lib", archivo), paquete]) { try { if (p) return require(p); } catch {} } throw new Error(`No encuentro ${archivo} (use --lib)`); };
const JSZip = cargar("jszip.min.js", "jszip"); const XLSX = cargar("xlsx.full.min.js", "xlsx");

function recalcular(archivo) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recalc-"));
  try { execFileSync("soffice", ["--headless", "--norestore", "--convert-to", "xlsx:Calc MS Excel 2007 XML", "--outdir", dir, archivo], { stdio: "ignore", timeout: 180000 }); }
  catch { return null; }
  const salida = path.join(dir, path.basename(archivo).replace(/\.[^.]+$/, ".xlsx"));
  return fs.existsSync(salida) ? salida : null;
}

const attrs = (t) => { const a = {}; for (const m of t.matchAll(/([\w:]+)="([^"]*)"/g)) a[m[1]] = m[2]; return a; };
async function estructura(archivo) {
  const z = await JSZip.loadAsync(fs.readFileSync(archivo));
  const txt = async (p) => (z.file(p) ? z.file(p).async("string") : "");
  const wb = await txt("xl/workbook.xml"); const rels = await txt("xl/_rels/workbook.xml.rels");
  const destino = {}; for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) { const a = attrs(m[0]); destino[a.Id] = "xl/" + a.Target.replace(/^\/?xl\//, ""); }
  const hojas = [...wb.matchAll(/<sheet\b[^>]*\/>/g)].map((m) => { const a = attrs(m[0]); return { nombre: a.name, estado: a.state || "visible", ruta: destino[a["r:id"]] }; });
  const nombres = {}; for (const m of wb.matchAll(/<definedName\b([^>]*)>([\s\S]*?)<\/definedName>/g)) { const a = attrs(m[1]); nombres[(a.localSheetId ?? "") + "|" + a.name] = m[2].replace(/&apos;/g, "'").replace(/'([A-Za-z_][\w.]*)'!/g, "$1!"); }
  const protLibro = /<workbookProtection\b[^>]*lockStructure="(1|true)"/.test(wb);
  const est = await txt("xl/styles.xml");
  const bloque = (n) => (est.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`)) || [, ""])[1];
  const items = (b, n) => [...b.matchAll(new RegExp(`<${n}\\b[^>]*?(?:/>|>[\\s\\S]*?</${n}>)`, "g"))].map((m) => m[0]);
  const numFmts = { 0: "General", 1: "0", 2: "0.00", 3: "#,##0", 4: "#,##0.00", 9: "0%", 10: "0.00%", 14: "m/d/yyyy", 49: "@" }; for (const m of bloque("numFmts").matchAll(/<numFmt\b[^>]*>/g)) { const a = attrs(m[0]); numFmts[a.numFmtId] = a.formatCode; }
  const fills = items(bloque("fills"), "fill").map((f) => (/patternType="solid"/.test(f) ? (f.match(/fgColor rgb="([^"]+)"/) || [, "?"])[1] : "-"));
  const fonts = items(bloque("fonts"), "font").map((f) => `${/<b\b(?![^>]*val="(0|false)")/.test(f) ? "N" : ""}${(f.match(/<color rgb="([^"]+)"/) || [, ""])[1]}`);
  const borders = items(bloque("borders"), "border").map((b) => (b.match(/<left style="([^"]+)"/) || [, "-"])[1]);
  const xfs = items(bloque("cellXfs"), "xf").map((x) => { const a = attrs(x.slice(0, x.indexOf(">") + 1)); const al = attrs((x.match(/<alignment\b[^>]*>/) || [""])[0]); const pr = attrs((x.match(/<protection\b[^>]*>/) || [""])[0]);
    return [numFmts[a.numFmtId] ?? a.numFmtId, fills[a.fillId], fonts[a.fontId], borders[a.borderId], al.horizontal && al.horizontal !== "general" ? al.horizontal : "", al.wrapText === "true" || al.wrapText === "1" ? "w" : "", pr.locked === "false" || pr.locked === "0" ? "desbloq" : ""].join("·"); });
  const porHoja = {};
  for (const h of hojas) {
    const x = await txt(h.ruta);
    const estilos = {}; for (const m of x.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)\/?>/g)) { const a = attrs(m[2]); estilos[m[1]] = xfs[Number(a.s || 0)]; }
    const formulas = {}; for (const m of x.matchAll(/<c r="([A-Z]+\d+)"[^>]*>\s*<f\b[^>]*>([\s\S]*?)<\/f>/g)) formulas[m[1]] = m[2].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    const relsH = await txt(h.ruta.replace(/worksheets\/([^/]+)$/, "worksheets/_rels/$1.rels"));
    let comentarios = []; const rc = [...relsH.matchAll(/<Relationship\b[^>]*>/g)].map((m) => attrs(m[0])).find((a) => /\/comments$/.test(a.Type));
    if (rc) comentarios = [...(await txt("xl/" + rc.Target.replace(/^\.\.\//, ""))).matchAll(/<comment ref="([A-Z]+\d+)"/g)].map((m) => m[1]).sort();
    porHoja[h.nombre] = {
      estilos, comentarios, formulas,
      validaciones: [...x.matchAll(/<dataValidation\b([^>]*)>([\s\S]*?)<\/dataValidation>/g)].map((m) => `${attrs(m[1]).sqref}=${(m[2].match(/<formula1>([\s\S]*?)<\/formula1>/) || [, ""])[1]}`).sort(),
      condicionales: [...x.matchAll(/<conditionalFormatting\b[^>]*sqref="([^"]+)"[^>]*>([\s\S]*?)<\/conditionalFormatting>/g)].map((m) => `${m[1]}×${(m[2].match(/<cfRule\b/g) || []).length}`).sort(),
      combinadas: [...x.matchAll(/<mergeCell ref="([^"]+)"/g)].map((m) => m[1]).sort(),
      columnas: [...x.matchAll(/<col\b[^>]*>/g)].map((m) => { const a = attrs(m[0]); return `${a.min}-${a.max}:${Number(a.width || 0).toFixed(2)}${a.hidden === "true" || a.hidden === "1" ? "h" : ""}`; }),
      inmovilizado: (x.match(/<pane\b[^>]*topLeftCell="([^"]+)"[^>]*state="frozen"/) || [, ""])[1],
      cuadricula: (x.match(/showGridLines="([^"]+)"/) || [, "true"])[1],
      pagina: (x.match(/<pageSetup\b[^>]*>/) || [""])[0].replace(/\s(r:id|paperSize|useFirstPageNumber|horizontalDpi|verticalDpi|copies)="[^"]*"/g, ""),
      proteccion: /<sheetProtection\b[^>]*sheet="(1|true)"/.test(x),
    };
  }
  return { hojas, nombres, protLibro, porHoja };
}

const problemas = []; const ok = (cond, msg) => { if (!cond) problemas.push(msg); return cond; };
const lista = (a, b) => { const sa = new Set(a), sb = new Set(b); return [...a.filter((x) => !sb.has(x)).map((x) => "falta " + x), ...b.filter((x) => !sa.has(x)).map((x) => "sobra " + x)]; };

const A = await estructura(REF), B = await estructura(GEN);
ok(JSON.stringify(A.hojas.map((h) => [h.nombre, h.estado])) === JSON.stringify(B.hojas.map((h) => [h.nombre, h.estado])), `Hojas/orden/visibilidad distintos: ${JSON.stringify(B.hojas.map((h) => h.nombre + ":" + h.estado))}`);
const dn = [...new Set([...Object.keys(A.nombres), ...Object.keys(B.nombres)])].filter((k) => A.nombres[k] !== B.nombres[k]);
ok(dn.length === 0, `Nombres definidos distintos (${dn.length}): ${dn.slice(0, 8).map((k) => `${k} ${A.nombres[k]} ≠ ${B.nombres[k]}`).join("; ")}`);
let difEst = 0, ejEst = [];
for (const h of A.hojas) {
  const a = A.porHoja[h.nombre], b = B.porHoja[h.nombre]; if (!b) continue;
  for (const campo of ["validaciones", "condicionales", "combinadas", "comentarios", "columnas"]) { const d = lista(a[campo], b[campo]); ok(d.length === 0, `${h.nombre}: ${campo} distintas: ${d.slice(0, 5).join(", ")}`); }
  for (const campo of ["inmovilizado", "cuadricula", "pagina"]) ok(a[campo] === b[campo], `${h.nombre}: ${campo} distinto (${a[campo]} ≠ ${b[campo]})`);
  for (const [ref, e] of Object.entries(a.estilos)) if (b.estilos[ref] !== undefined && e !== b.estilos[ref]) { difEst++; if (ejEst.length < 6) ejEst.push(`${h.nombre}!${ref} ${e} ≠ ${b.estilos[ref]}`); }
}
ok(difEst === 0, `Estilos de celda distintos: ${difEst} (${ejEst.join(" | ")})`);
const protRef = A.protLibro || Object.values(A.porHoja).some((h) => h.proteccion);
const protGen = B.protLibro || Object.values(B.porHoja).some((h) => h.proteccion);
console.log(`Protección: referencia ${protRef ? "sí" : "no"} · generado ${protGen ? "sí (con la clave escrita al exportar)" : "no"}`);

const leer = (f) => XLSX.read(fs.readFileSync(f), { cellFormula: true, cellNF: false, cellDates: false });
const wa = leer(REF);
let wbVal = null;
if (!args.includes("--sin-recalculo")) { const r = recalcular(GEN); if (r) wbVal = leer(r); else console.log("Aviso: LibreOffice (soffice) no disponible; abra el generado en Excel, guárdelo y repita con ese archivo. Se comparan solo fórmulas."); }
const wf = leer(GEN);
let nForm = 0, difForm = [], nVal = 0, difVal = [];
for (const h of wa.SheetNames) {
  const sa = wa.Sheets[h], sf = wf.Sheets[h], sv = wbVal && wbVal.Sheets[h]; if (!sf) continue;
  for (const ref of Object.keys(sa)) {
    if (ref[0] === "!") continue;
    const ca = sa[ref], cf = sf[ref] || {};
    const fa = A.porHoja[h].formulas[ref], fb = B.porHoja[h] && B.porHoja[h].formulas[ref];
    if (fa !== undefined) { nForm++; if (fa !== fb) difForm.push(`${h}!${ref}: ${fa} ≠ ${fb}`); }
    else if (fb !== undefined) difForm.push(`${h}!${ref}: (sin fórmula) ≠ ${fb}`);
    else if (ca.v !== undefined && ca.v !== "" && (cf.v === undefined ? true : String(ca.v) !== String(cf.v)) && !(typeof ca.v === "number" && Math.abs(ca.v - cf.v) < 1e-9)) difVal.push(`${h}!${ref} dato: ${ca.v} ≠ ${cf.v}`);
    if (sv) { const cv = sv[ref] || {}; nVal++; const va = ca.v, vb = cv.v;
      const igual = va === vb || (typeof va === "number" && typeof vb === "number" && Math.abs(va - vb) <= 1e-6 * Math.max(1, Math.abs(va))) || ((va === undefined || va === "") && (vb === undefined || vb === ""));
      if (!igual) difVal.push(`${h}!${ref} valor: ${va} ≠ ${vb}`); }
  }
}
ok(difForm.length === 0, `Fórmulas distintas: ${difForm.length} de ${nForm} (${difForm.slice(0, 5).join(" | ")})`);
ok(difVal.length === 0, `Valores distintos: ${difVal.length} (${difVal.slice(0, 6).join(" | ")})`);
console.log(`Comparadas ${A.hojas.length} hojas · ${Object.keys(A.nombres).length} nombres · ${nForm} fórmulas · ${wbVal ? nVal + " valores recalculados" : "valores sin recalcular"}`);
if (problemas.length) { console.log(`\n✗ ${problemas.length} diferencia(s):`); for (const p of problemas) console.log(" - " + p); process.exit(1); }
console.log("\n✓ IGUALITO: misma estructura, fórmulas, valores y formato que la referencia.");
