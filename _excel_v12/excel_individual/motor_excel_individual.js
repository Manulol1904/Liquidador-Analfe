// motor_excel_individual.js — Rellena la plantilla .xlsx de liquidación individual
// editando el XML del libro con JSZip. No reescribe el libro: conserva estilos,
// fórmulas, validaciones, formato condicional, comentarios, nombres definidos,
// hojas ocultas, anchos, inmovilizados e impresión tal como vienen en la plantilla.
// Funciona igual en el navegador (JSZip local en lib/) y en Node.
// No guarda ninguna clave: la clave se recibe como argumento solo al exportar.

const NS_PROTECCION_GIROS = 100000;

const escaparXml = (t) => String(t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const desescaparXml = (t) => String(t)
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const escaparRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function atributos(etiqueta) {
  const a = {};
  for (const m of etiqueta.matchAll(/([\w:]+)="([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}

export function columnaANumero(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function partirRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) throw new Error(`Referencia inválida: ${ref}`);
  return { col: m[1], fila: Number(m[2]) };
}

// Fecha → número de serie de Excel (sistema 1900), sin depender de la zona horaria.
export function fechaASerie(valor) {
  let d = valor instanceof Date ? valor : null;
  let y, mo, da, h = 0, mi = 0, s = 0;
  if (d) { y = d.getFullYear(); mo = d.getMonth(); da = d.getDate(); h = d.getHours(); mi = d.getMinutes(); s = d.getSeconds(); }
  else {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(valor));
    if (!m) throw new Error(`Fecha inválida: ${valor}`);
    [y, mo, da, h, mi, s] = [Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)];
  }
  const dias = (Date.UTC(y, mo, da) - Date.UTC(1899, 11, 30)) / 86400000;
  return dias + (h * 3600 + mi * 60 + s) / 86400;
}

export async function abrirPlantilla(datos, JSZip) {
  const zip = await JSZip.loadAsync(datos);
  const leer = async (p) => (zip.file(p) ? zip.file(p).async("string") : null);
  const libro = await leer("xl/workbook.xml");
  const rels = await leer("xl/_rels/workbook.xml.rels");
  const destinos = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const a = atributos(m[0]);
    destinos[a.Id] = a.Target.replace(/^\/?xl\//, "").replace(/^\//, "");
  }
  const hojas = {}; const orden = [];
  for (const m of libro.matchAll(/<sheet\b[^>]*\/>/g)) {
    const a = atributos(m[0]);
    const nombre = desescaparXml(a.name);
    hojas[nombre] = "xl/" + destinos[a["r:id"]];
    orden.push({ nombre, estado: a.state || "visible" });
  }
  const xml = { "xl/workbook.xml": libro };
  for (const ruta of Object.values(hojas)) xml[ruta] = await leer(ruta);
  const sstXml = await leer("xl/sharedStrings.xml");
  const sst = sstXml ? [...sstXml.matchAll(/<si>[\s\S]*?<\/si>|<si\/>/g)].map((m) => m[0]) : [];
  const indiceSst = new Map();
  sst.forEach((si, i) => { const t = textoDeSi(si); if (!indiceSst.has(t)) indiceSst.set(t, i); });
  xml["xl/styles.xml"] = await leer("xl/styles.xml");
  // Comentarios (y su dibujo VML) de cada hoja, para moverlos cuando se insertan o borran filas.
  const anexos = {};
  for (const [nombre, ruta] of Object.entries(hojas)) {
    const relRuta = ruta.replace(/worksheets\/([^/]+)$/, "worksheets/_rels/$1.rels");
    const r = await leer(relRuta);
    if (!r) continue;
    for (const m of r.matchAll(/<Relationship\b[^>]*>/g)) {
      const a = atributos(m[0]);
      const destino = "xl/" + a.Target.replace(/^\.\.\//, "");
      if (/\/comments$/.test(a.Type)) { (anexos[nombre] ||= {}).comentarios = destino; xml[destino] = await leer(destino); }
      if (/\/vmlDrawing$/.test(a.Type)) { (anexos[nombre] ||= {}).vml = destino; xml[destino] = await leer(destino); }
    }
  }
  return { zip, hojas, orden, xml, sst, indiceSst, sstModificado: false, anexos };
}

function textoDeSi(si) {
  return desescaparXml([...si.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));
}

function xmlHoja(lib, hoja) {
  const ruta = lib.hojas[hoja];
  if (!ruta) throw new Error(`La plantilla no tiene la hoja «${hoja}»`);
  return ruta;
}

function regexCelda(ref) {
  return new RegExp(`<c r="${ref}"(?:\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`);
}

export function leerCelda(lib, hoja, ref) {
  const x = lib.xml[xmlHoja(lib, hoja)];
  const m = regexCelda(ref).exec(x);
  if (!m) return undefined;
  const c = m[0]; const a = atributos(c.slice(0, c.indexOf(">") + 1));
  const f = /<f[^>]*>([\s\S]*?)<\/f>/.exec(c);
  if (f) return { formula: "=" + desescaparXml(f[1]) };
  const v = /<v>([\s\S]*?)<\/v>/.exec(c);
  if (a.t === "s" && v) return textoDeSi(lib.sst[Number(v[1])]);
  if (a.t === "inlineStr") return textoDeSi(c);
  if (!v) return null;
  if (a.t === "str") return desescaparXml(v[1]);
  if (a.t === "b") return v[1] === "1";
  return Number(v[1]);
}

function indiceCadena(lib, texto) {
  if (lib.indiceSst.has(texto)) return lib.indiceSst.get(texto);
  const espacios = /^\s|\s$|\n/.test(texto) ? ' xml:space="preserve"' : "";
  lib.sst.push(`<si><t${espacios}>${escaparXml(texto)}</t></si>`);
  lib.indiceSst.set(texto, lib.sst.length - 1);
  lib.sstModificado = true;
  return lib.sst.length - 1;
}

function construirCelda(lib, ref, estilo, valor) {
  const s = estilo != null ? ` s="${estilo}"` : "";
  if (valor === null || valor === undefined || valor === "") return `<c r="${ref}"${s}/>`;
  if (typeof valor === "object" && !(valor instanceof Date) && "fecha" in valor) valor = fechaASerie(valor.fecha);
  if (valor instanceof Date) valor = fechaASerie(valor);
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) throw new Error(`Valor no numérico en ${ref}`);
    return `<c r="${ref}"${s} t="n"><v>${valor}</v></c>`;
  }
  if (typeof valor === "boolean") return `<c r="${ref}"${s} t="b"><v>${valor ? 1 : 0}</v></c>`;
  return `<c r="${ref}"${s} t="s"><v>${indiceCadena(lib, String(valor))}</v></c>`;
}

// Escribe una fórmula (sin el "=" inicial o con él) conservando el estilo. Se usa para las
// «fórmulas-dato»: enlaces que dependen de los datos (p. ej. factura → fila de su evento en Márgenes).
export function escribirFormula(lib, hoja, ref, formula) {
  const ruta = xmlHoja(lib, hoja);
  const x = lib.xml[ruta];
  const m = regexCelda(ref).exec(x);
  const f = escaparXml(String(formula).replace(/^=/, ""));
  if (!m) { escribirCelda(lib, hoja, ref, null); return escribirFormula(lib, hoja, ref, formula); }
  const a = atributos(m[0].slice(0, m[0].indexOf(">") + 1));
  const s = a.s != null ? ` s="${a.s}"` : "";
  lib.xml[ruta] = x.slice(0, m.index) + `<c r="${ref}"${s}><f aca="false">${f}</f></c>` + x.slice(m.index + m[0].length);
}

// Escribe un valor (número, texto, booleano, fecha o {fecha:"AAAA-MM-DD"}) conservando el estilo de la celda.
// Nunca escribe sobre una celda con fórmula salvo que se pida explícitamente.
export function escribirCelda(lib, hoja, ref, valor, { sobreFormula = false } = {}) {
  const ruta = xmlHoja(lib, hoja);
  let x = lib.xml[ruta];
  const m = regexCelda(ref).exec(x);
  if (m) {
    if (!sobreFormula && /<f[\s>]/.test(m[0])) throw new Error(`${hoja}!${ref} tiene fórmula; no se sobrescribe`);
    const a = atributos(m[0].slice(0, m[0].indexOf(">") + 1));
    lib.xml[ruta] = x.slice(0, m.index) + construirCelda(lib, ref, a.s, valor) + x.slice(m.index + m[0].length);
    return;
  }
  // La celda no existe: se inserta en su fila, en orden de columna.
  const { col, fila } = partirRef(ref);
  const nueva = construirCelda(lib, ref, null, valor);
  const rf = new RegExp(`<row r="${fila}"(?:\\s[^>]*?)?(?:/>|>([\\s\\S]*?)</row>)`).exec(x);
  if (!rf) {
    let insertado = false;
    x = x.replace(/<row r="(\d+)"/g, (t, n) => {
      if (!insertado && Number(n) > fila) { insertado = true; return `<row r="${fila}">${nueva}</row>` + t; }
      return t;
    });
    if (!insertado) x = x.replace(/<\/sheetData>|<sheetData\/>/, (t) => (t === "<sheetData/>" ? `<sheetData><row r="${fila}">${nueva}</row></sheetData>` : `<row r="${fila}">${nueva}</row></sheetData>`));
    lib.xml[ruta] = x; return;
  }
  let filaXml = rf[0];
  if (filaXml.endsWith("/>")) filaXml = filaXml.slice(0, -2) + `>${nueva}</row>`;
  else {
    const n = columnaANumero(col); let hecho = false;
    filaXml = filaXml.replace(/<c r="([A-Z]+)\d+"/g, (t, c2) => {
      if (!hecho && columnaANumero(c2) > n) { hecho = true; return nueva + t; }
      return t;
    });
    if (!hecho) filaXml = filaXml.replace(/<\/row>$/, nueva + "</row>");
  }
  lib.xml[ruta] = x.slice(0, rf.index) + filaXml + x.slice(rf.index + rf[0].length);
}

// Reemplaza fichas (p. ej. "COMSEL" → "Hernando") en los nombres definidos y en todas las fórmulas.
export function reemplazarFichas(lib, mapa) {
  const pares = Object.entries(mapa).sort((a, b) => b[0].length - a[0].length);
  const cambiar = (t) => {
    for (const [de, a] of pares) {
      t = t.replace(new RegExp(`(?<![A-Za-zÀ-ÿ])${escaparRegex(de)}(?![A-Za-zÀ-ÿ])`, "g"), a);
    }
    return t;
  };
  lib.xml["xl/workbook.xml"] = lib.xml["xl/workbook.xml"].replace(/<definedName\b[^>]*>[\s\S]*?<\/definedName>/g, cambiar);
  for (const ruta of Object.values(lib.hojas)) {
    lib.xml[ruta] = lib.xml[ruta].replace(/(<f\b[^>]*>)([\s\S]*?)(<\/f>)/g, (t, a, f, c) => a + cambiar(f) + c);
  }
}

// Quita los resultados guardados de las fórmulas (la plantilla no debe llevar cifras reales).
export function quitarResultadosGuardados(lib) {
  for (const ruta of Object.values(lib.hojas)) {
    lib.xml[ruta] = lib.xml[ruta].replace(/(<c r="[A-Z]+\d+"[^>]*>)(<f\b[^>]*>[\s\S]*?<\/f>)<v>[\s\S]*?<\/v>(<\/c>)/g, "$1$2$3");
  }
}

// Deja en la tabla de cadenas solo las que usa alguna celda (para que la plantilla no arrastre textos reales).
export function compactarCadenas(lib) {
  const usados = new Map(); const nuevas = [];
  for (const ruta of Object.values(lib.hojas)) {
    lib.xml[ruta] = lib.xml[ruta].replace(/(<c r="[A-Z]+\d+"[^>]*\bt="s"[^>]*>)<v>(\d+)<\/v>/g, (t, a, i) => {
      if (!usados.has(i)) { usados.set(i, nuevas.length); nuevas.push(lib.sst[Number(i)]); }
      return `${a}<v>${usados.get(i)}</v>`;
    });
  }
  lib.sst = nuevas; lib.indiceSst = new Map(nuevas.map((si, i) => [textoDeSi(si), i])); lib.sstModificado = true;
}

async function sha512(bytes) {
  const sub = globalThis.crypto && globalThis.crypto.subtle;
  if (!sub) throw new Error("WebCrypto no disponible para la protección con clave");
  return new Uint8Array(await sub.digest("SHA-512", bytes));
}
const aBase64 = (u8) => (typeof btoa === "function" ? btoa(String.fromCharCode(...u8)) : Buffer.from(u8).toString("base64"));

// Hash de protección de Office (ECMA-376, SHA-512, sal aleatoria, 100 000 giros).
export async function hashClave(clave, sal = globalThis.crypto.getRandomValues(new Uint8Array(16)), giros = NS_PROTECCION_GIROS) {
  const u16 = new Uint8Array(clave.length * 2);
  for (let i = 0; i < clave.length; i++) { const c = clave.charCodeAt(i); u16[2 * i] = c & 255; u16[2 * i + 1] = c >> 8; }
  let h = await sha512(new Uint8Array([...sal, ...u16]));
  const buf = new Uint8Array(68);
  for (let i = 0; i < giros; i++) {
    buf.set(h, 0); buf[64] = i & 255; buf[65] = (i >> 8) & 255; buf[66] = (i >> 16) & 255; buf[67] = (i >>> 24) & 255;
    h = await sha512(buf);
  }
  return { hash: aBase64(h), sal: aBase64(sal), giros };
}

// Protección opcional con la clave que el usuario escribe al exportar (no se guarda en ningún lado).
// Bloquea la estructura (no se pueden mostrar hojas ocultas ni borrar hojas) y protege las hojas,
// dejando editables las celdas amarillas (relleno de entrada) para que los escenarios sigan funcionando.
export async function proteger(lib, clave, { hojas = true, rellenoEditable = "FFFFF2CC" } = {}) {
  if (!clave) return;
  const w = await hashClave(clave);
  const etiquetaLibro = `<workbookProtection workbookAlgorithmName="SHA-512" workbookHashValue="${w.hash}" workbookSaltValue="${w.sal}" workbookSpinCount="${w.giros}" lockStructure="1"/>`;
  let libro = lib.xml["xl/workbook.xml"];
  libro = /<workbookProtection\b[^>]*\/>/.test(libro) ? libro.replace(/<workbookProtection\b[^>]*\/>/, etiquetaLibro) : libro.replace(/(<workbookPr\b[^>]*\/>)/, `$1${etiquetaLibro}`);
  lib.xml["xl/workbook.xml"] = libro;
  if (!hojas) return;
  // Desbloquear los estilos de las celdas de entrada (amarillas).
  let est = lib.xml["xl/styles.xml"];
  const rellenos = [...est.match(/<fills\b[^>]*>([\s\S]*?)<\/fills>/)[1].matchAll(/<fill>[\s\S]*?<\/fill>|<fill\/>/g)].map((m) => m[0]);
  const idsAmarillos = new Set(rellenos.map((f, i) => (f.includes(`rgb="${rellenoEditable}"`) ? String(i) : null)).filter((v) => v !== null));
  est = est.replace(/<cellXfs\b[^>]*>[\s\S]*?<\/cellXfs>/, (bloque) => bloque.replace(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g, (xf) => {
    const a = atributos(xf.slice(0, xf.indexOf(">") + 1));
    if (!idsAmarillos.has(a.fillId)) return xf;
    let x2 = xf.replace(/<protection\b[^>]*\/>/, "");
    x2 = x2.replace(/applyProtection="[^"]*"/, "");
    x2 = x2.endsWith("/>") ? x2.replace(/\/>$/, ' applyProtection="true"><protection locked="false" hidden="false"/></xf>') : x2.replace(/^<xf\b/, '<xf applyProtection="true"').replace(/<\/xf>$/, '<protection locked="false" hidden="false"/></xf>');
    return x2;
  }));
  lib.xml["xl/styles.xml"] = est;
  const s = w; // un solo cálculo (100 000 giros) reutilizado en todas las hojas
  for (const { nombre } of lib.orden) {
    const ruta = lib.hojas[nombre];
    const etiqueta = `<sheetProtection algorithmName="SHA-512" hashValue="${s.hash}" saltValue="${s.sal}" spinCount="${s.giros}" sheet="1" objects="1" scenarios="1" formatColumns="0" formatRows="0" autoFilter="0" sort="0"/>`;
    lib.xml[ruta] = lib.xml[ruta].replace(/<sheetProtection\b[^>]*\/>/, "").replace(/<\/sheetData>|<sheetData\/>/, (t) => t + etiqueta);
  }
}

// Genera el archivo. Por defecto marca el libro para recalcular todo al abrirlo (Excel/LibreOffice).
export async function guardar(lib, { recalcularAlAbrir = true, tipo = "uint8array" } = {}) {
  if (recalcularAlAbrir) {
    lib.xml["xl/workbook.xml"] = lib.xml["xl/workbook.xml"].replace(/<calcPr\b([^>]*)\/>/, (t, a) => (/fullCalcOnLoad/.test(a) ? t : `<calcPr${a} fullCalcOnLoad="1"/>`));
  }
  for (const [ruta, contenido] of Object.entries(lib.xml)) if (contenido != null) lib.zip.file(ruta, contenido);
  if (lib.sstModificado) {
    const total = lib.sst.length;
    lib.zip.file("xl/sharedStrings.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${total}" uniqueCount="${total}">${lib.sst.join("")}</sst>`);
  }
  return lib.zip.generateAsync({ type: tipo, compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// Atajo: plantilla + datos → archivo.
//   datos = { fichas: {COMSEL:"Hernando", COMA:"Carolina", ...}, celdas: [{hoja, ref, valor}], clave?: string }
export async function generarLibroIndividual(plantilla, datos, JSZip, opciones = {}) {
  const lib = await abrirPlantilla(plantilla, JSZip);
  reemplazarFichas(lib, datos.fichas || {});
  for (const c of datos.celdas) escribirCelda(lib, c.hoja, c.ref, c.valor);
  if (datos.clave) await proteger(lib, datos.clave, opciones.proteccion || {});
  return guardar(lib, opciones);
}


// ───────────────────────── Filas: insertar / borrar con referencias ajustadas ─────────────────────────
// Equivale a «Insertar filas» / «Eliminar filas» de Excel sobre la plantilla: mueve celdas, combina-
// ciones, validaciones, formatos condicionales, autofiltro, comentarios, nombres definidos, áreas de
// impresión y TODAS las fórmulas del libro que apunten a la hoja.

const RE_REF = /(?<![\w.$'!\u00C0-\u017F])((?:'(?:[^']|'')+'|[A-Za-z_\u00C0-\u017F][\w.\u00C0-\u017F]*)!)?(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?|\$?\d+:\$?\d+)(?![\w(\u00C0-\u017F])/g;

const nombreHojaDePrefijo = (p) => (p ? desescaparXml(p.slice(0, -1)).replace(/^'(.*)'$/, "$1").replace(/''/g, "'") : null);

function moverFila(r, op) {
  if (op.tipo === "insertar") return r >= op.desde ? r + op.k : r;
  if (r >= op.desde + op.k) return r - op.k;
  if (r >= op.desde) return null; // fila borrada
  return r;
}

function moverRango(texto, op) {
  // texto: "A1", "$A$1:$B$9" o "1:6"
  const partes = texto.split(":");
  const filaDe = (t) => Number(/(\d+)$/.exec(t)[1]);
  const conFila = (t, n) => t.replace(/(\d+)$/, String(n));
  if (partes.length === 1) {
    const n = moverFila(filaDe(partes[0]), op);
    return n === null ? null : conFila(partes[0], n);
  }
  let a = filaDe(partes[0]), b = filaDe(partes[1]);
  if (op.tipo === "insertar") {
    const na = a >= op.desde ? a + op.k : a;
    const nb = b >= op.desde ? b + op.k : b;
    return conFila(partes[0], na) + ":" + conFila(partes[1], nb);
  }
  const fin = op.desde + op.k - 1;
  let na = a < op.desde ? a : a > fin ? a - op.k : op.desde;
  let nb = b < op.desde ? b : b > fin ? b - op.k : op.desde - 1;
  if (nb < na) return null;
  return conFila(partes[0], na) + ":" + conFila(partes[1], nb);
}

// Ajusta las referencias de una fórmula (texto sin "=") escrita en la hoja `hojaFormula`.
export function ajustarFormula(f, hojaFormula, op) {
  const trozos = f.split('"');
  for (let i = 0; i < trozos.length; i += 2) {
    trozos[i] = trozos[i].replace(RE_REF, (todo, pref, ref) => {
      const hoja = pref ? nombreHojaDePrefijo(pref) : hojaFormula;
      if (hoja !== op.hoja) return todo;
      const nuevo = moverRango(ref, op);
      return nuevo === null ? (pref || "") + "#REF!" : (pref || "") + nuevo;
    });
  }
  return trozos.join('"');
}

function ajustarSqref(sqref, op) {
  return sqref.split(/\s+/).map((r) => moverRango(r, op)).filter(Boolean).join(" ");
}

function aplicarOperacion(lib, op) {
  const ruta = xmlHoja(lib, op.hoja);
  // 1) Fórmulas de todas las hojas
  for (const [nombre, r] of Object.entries(lib.hojas)) {
    lib.xml[r] = lib.xml[r].replace(/(<f\b[^>]*>)([\s\S]*?)(<\/f>)/g, (t, a, f, c) => a + escaparXml(ajustarFormula(desescaparXml(f), nombre, op)) + c);
  }
  // 2) Nombres definidos (siempre calificados con hoja)
  lib.xml["xl/workbook.xml"] = lib.xml["xl/workbook.xml"].replace(/(<definedName\b[^>]*>)([\s\S]*?)(<\/definedName>)/g, (t, a, f, c) => a + escaparXml(ajustarFormula(desescaparXml(f), null, op)) + c);
  // 3) Hoja afectada: filas, celdas, combinaciones, validaciones, formatos condicionales, autofiltro, dimensión
  let x = lib.xml[ruta];
  if (op.tipo === "eliminar") {
    x = x.replace(/<row r="(\d+)"(?:\s[^>]*?)?(?:\/>|>[\s\S]*?<\/row>)/g, (t, n) => (moverFila(Number(n), op) === null ? "" : t));
  }
  x = x.replace(/<row r="(\d+)"/g, (t, n) => `<row r="${moverFila(Number(n), op)}"`);
  x = x.replace(/<c r="([A-Z]+)(\d+)"/g, (t, c, n) => `<c r="${c}${moverFila(Number(n), op)}"`);
  x = x.replace(/<mergeCell ref="([^"]+)"\/>/g, (t, r) => { const n = moverRango(r, op); return n ? `<mergeCell ref="${n}"/>` : ""; });
  x = x.replace(/<mergeCells count="\d+">/, () => `<mergeCells count="${(x.match(/<mergeCell ref=/g) || []).length}">`);
  x = x.replace(/(<(?:conditionalFormatting|dataValidation)\b[^>]*\bsqref=")([^"]+)(")/g, (t, a, r, c) => a + ajustarSqref(r, op) + c);
  x = x.replace(/(<autoFilter\b[^>]*\bref=")([^"]+)(")/g, (t, a, r, c) => a + (moverRango(r, op) || r) + c);
  x = x.replace(/(<dimension ref=")([^"]+)(")/, (t, a, r, c) => a + (moverRango(r, op) || r) + c);
  x = x.replace(/<conditionalFormatting\b[^>]*\bsqref=""[^>]*>[\s\S]*?<\/conditionalFormatting>/g, "");
  x = x.replace(/<dataValidation\b[^>]*\bsqref=""[^>]*(?:\/>|>[\s\S]*?<\/dataValidation>)/g, "");
  x = x.replace(/<dataValidations count="\d+"/, () => `<dataValidations count="${(x.match(/<dataValidation\b/g) || []).length}"`);
  lib.xml[ruta] = x;
  // 4) Comentarios y su VML
  const an = lib.anexos[op.hoja];
  if (an && an.comentarios) {
    lib.xml[an.comentarios] = lib.xml[an.comentarios].replace(/<comment ref="([A-Z]+)(\d+)"[\s\S]*?<\/comment>/g, (t, c, n) => {
      const nn = moverFila(Number(n), op);
      return nn === null ? "" : t.replace(/^<comment ref="[A-Z]+\d+"/, `<comment ref="${c}${nn}"`);
    });
  }
  if (an && an.vml) {
    lib.xml[an.vml] = lib.xml[an.vml].replace(/<v:shape\b[\s\S]*?<\/v:shape>/g, (t) => {
      const m = /<x:Row>(\d+)<\/x:Row>/.exec(t);
      if (!m) return t;
      const nn = moverFila(Number(m[1]) + 1, op);
      if (nn === null) return "";
      const d = nn - 1 - Number(m[1]);
      return t.replace(/<x:Row>\d+<\/x:Row>/, `<x:Row>${nn - 1}</x:Row>`)
        .replace(/<x:Anchor>([^<]*)<\/x:Anchor>/, (u, v) => { const p = v.split(",").map((z) => z.trim()); p[2] = String(Number(p[2]) + d); p[6] = String(Number(p[6]) + d); return `<x:Anchor>${p.join(", ")}</x:Anchor>`; });
    });
  }
}

export function eliminarFilas(lib, hoja, desde, k) {
  if (k > 0) aplicarOperacion(lib, { tipo: "eliminar", hoja, desde, k });
}

// Inserta k filas antes de `antesDe`, copiando la fila `modelo` (estilos, fórmulas con referencias
// relativas desplazadas, alto de fila y comentarios). Los rangos que la contienen se amplían.
export function insertarFilas(lib, hoja, antesDe, k, modelo = antesDe - 1) {
  if (k <= 0) return;
  const ruta = xmlHoja(lib, hoja);
  const filaXml = new RegExp(`<row r="${modelo}"(?:\\s[^>]*?)?(?:/>|>[\\s\\S]*?</row>)`).exec(lib.xml[ruta]);
  const an = lib.anexos[hoja] || {};
  const comModelo = an.comentarios ? [...lib.xml[an.comentarios].matchAll(new RegExp(`<comment ref="([A-Z]+)${modelo}"[\\s\\S]*?</comment>`, "g"))].map((m) => m[0]) : [];
  const vmlModelo = an.vml ? [...lib.xml[an.vml].matchAll(/<v:shape\b[\s\S]*?<\/v:shape>/g)].map((m) => m[0]).filter((t) => new RegExp(`<x:Row>${modelo - 1}</x:Row>`).test(t)) : [];
  const op = { tipo: "insertar", hoja, desde: antesDe, k };
  aplicarOperacion(lib, op);
  const modeloNuevo = moverFila(modelo, op);
  if (!filaXml) return;
  const nuevas = [];
  for (let i = 0; i < k; i++) {
    const destino = antesDe + i;
    const delta = destino - modelo;
    const opCopia = { tipo: "copiar", hoja, delta };
    let t = filaXml[0].replace(/^<row r="\d+"/, `<row r="${destino}"`).replace(/<c r="([A-Z]+)\d+"/g, (u, c) => `<c r="${c}${destino}"`);
    t = t.replace(/(<f\b[^>]*>)([\s\S]*?)(<\/f>)/g, (u, a, f, c) => a + escaparXml(copiarFormula(desescaparXml(f), delta)) + c);
    t = t.replace(/(<c r="[A-Z]+\d+"[^>]*>)(<f\b[^>]*>[\s\S]*?<\/f>)<v>[\s\S]*?<\/v>(<\/c>)/g, "$1$2$3");
    nuevas.push(t);
  }
  lib.xml[ruta] = lib.xml[ruta].replace(new RegExp(`<row r="${antesDe + k}"`), (u) => nuevas.join("") + u);
  if (!new RegExp(`<row r="${antesDe}"`).test(lib.xml[ruta])) lib.xml[ruta] = lib.xml[ruta].replace("</sheetData>", nuevas.join("") + "</sheetData>");
  if (an.comentarios && comModelo.length) {
    const extra = [];
    for (let i = 0; i < k; i++) for (const c of comModelo) extra.push(c.replace(/^<comment ref="([A-Z]+)\d+"/, (u, col) => `<comment ref="${col}${antesDe + i}"`));
    lib.xml[an.comentarios] = lib.xml[an.comentarios].replace("</commentList>", extra.join("") + "</commentList>");
  }
  if (an.vml && vmlModelo.length) {
    const extra = [];
    for (let i = 0; i < k; i++) for (const v of vmlModelo) {
      const d = antesDe + i - modelo;
      extra.push(v.replace(/<x:Row>\d+<\/x:Row>/, `<x:Row>${antesDe + i - 1}</x:Row>`).replace(/<x:Anchor>([^<]*)<\/x:Anchor>/, (u, w) => { const p = w.split(",").map((z) => z.trim()); p[2] = String(Number(p[2]) + d); p[6] = String(Number(p[6]) + d); return `<x:Anchor>${p.join(", ")}</x:Anchor>`; }));
    }
    lib.xml[an.vml] = lib.xml[an.vml].replace(/<\/xml>\s*$/, extra.join("") + "</xml>");
  }
  return modeloNuevo;
}

// Copia de fórmula a otra fila (como copiar/pegar en Excel): desplaza filas relativas, no las $.
export function copiarFormula(f, delta) {
  const trozos = f.split('"');
  for (let i = 0; i < trozos.length; i += 2) {
    trozos[i] = trozos[i].replace(RE_REF, (todo, pref, ref) => (pref || "") + ref.replace(/(\$?)([A-Z]{0,3})(\$?)(\d+)/g, (u, d1, col, d2, n) => (d2 === "$" || (col === "" && d1 === "$")) ? u : `${d1}${col}${d2}${Number(n) + delta}`));
  }
  return trozos.join('"');
}

// Lleva una tabla de la plantilla (filas primera..ultima) a exactamente `n` filas de datos.
// Para crecer inserta antes de la última fila copiándola (así los rangos y nombres se amplían);
// para achicar borra desde el final. Con n = 0 deja una fila (que el llamador deja vacía) para no
// romper los rangos con nombre. Devuelve la nueva última fila.
export function redimensionarTabla(lib, hoja, primera, ultima, n) {
  const actual = ultima - primera + 1;
  const objetivo = Math.max(n, 1);
  if (objetivo > actual) insertarFilas(lib, hoja, ultima, objetivo - actual, ultima);
  else if (objetivo < actual) eliminarFilas(lib, hoja, primera + objetivo, actual - objetivo);
  return primera + objetivo - 1;
}

// Nombres definidos: crear/cambiar y borrar.
export function definirNombre(lib, nombre, referencia) {
  const w = lib.xml["xl/workbook.xml"];
  const re = new RegExp(`(<definedName\\b[^>]*\\bname="${escaparRegex(nombre)}"[^>]*>)[\\s\\S]*?(</definedName>)`);
  if (re.test(w)) lib.xml["xl/workbook.xml"] = w.replace(re, (t, a, c) => a + escaparXml(referencia) + c);
  else lib.xml["xl/workbook.xml"] = w.replace("</definedNames>", `<definedName function="false" hidden="false" name="${escaparXml(nombre)}" vbProcedure="false">${escaparXml(referencia)}</definedName></definedNames>`);
}
export function eliminarNombre(lib, nombre) {
  lib.xml["xl/workbook.xml"] = lib.xml["xl/workbook.xml"].replace(new RegExp(`<definedName\\b[^>]*\\bname="${escaparRegex(nombre)}"[^>]*>[\\s\\S]*?</definedName>`), "");
}
export function leerNombres(lib) {
  const out = {};
  for (const m of lib.xml["xl/workbook.xml"].matchAll(/<definedName\b([^>]*)>([\s\S]*?)<\/definedName>/g)) {
    const a = atributos(m[1]); if (a.localSheetId == null) out[desescaparXml(a.name)] = desescaparXml(m[2]);
  }
  return out;
}

// ───────────────────────── Estilos de celda ─────────────────────────
export function leerEstilo(lib, hoja, ref) {
  const m = regexCelda(ref).exec(lib.xml[xmlHoja(lib, hoja)]);
  if (!m) return null;
  const a = atributos(m[0].slice(0, m[0].indexOf(">") + 1));
  return a.s != null ? Number(a.s) : 0;
}
export function ponerEstilo(lib, hoja, ref, s) {
  const ruta = xmlHoja(lib, hoja);
  if (!regexCelda(ref).test(lib.xml[ruta])) escribirCelda(lib, hoja, ref, null);
  lib.xml[ruta] = lib.xml[ruta].replace(regexCelda(ref), (c) => {
    const ap = c.indexOf(">") + 1; let et = c.slice(0, ap);
    et = /\ss="\d+"/.test(et) ? et.replace(/\ss="\d+"/, ` s="${s}"`) : et.replace(/^<c r="[A-Z]+\d+"/, (u) => `${u} s="${s}"`);
    return et + c.slice(ap);
  });
}
// Devuelve el índice de un estilo igual a `s` pero con otro relleno sólido (rgb "FFRRGGBB") o sin relleno (null).
export function estiloConRelleno(lib, s, rgb) {
  let est = lib.xml["xl/styles.xml"];
  const bloqueFills = est.match(/<fills\b[^>]*>([\s\S]*?)<\/fills>/);
  const fills = [...bloqueFills[1].matchAll(/<fill>[\s\S]*?<\/fill>|<fill\/>/g)].map((m) => m[0]);
  let fillId = 0;
  if (rgb) {
    fillId = fills.findIndex((f) => f.includes(`fgColor rgb="${rgb}"`) && f.includes('patternType="solid"'));
    if (fillId < 0) {
      fills.push(`<fill><patternFill patternType="solid"><fgColor rgb="${rgb}"/><bgColor indexed="64"/></patternFill></fill>`);
      fillId = fills.length - 1;
      est = est.replace(/<fills\b[^>]*>[\s\S]*?<\/fills>/, `<fills count="${fills.length}">${fills.join("")}</fills>`);
    }
  }
  const bloqueXfs = est.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/);
  const xfs = [...bloqueXfs[1].matchAll(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)].map((m) => m[0]);
  const nuevo = xfs[s].replace(/fillId="\d+"/, `fillId="${fillId}"`).replace(/applyFill="[^"]*"/, 'applyFill="true"');
  const ya = xfs.indexOf(nuevo);
  if (ya >= 0) { lib.xml["xl/styles.xml"] = est; return ya; }
  xfs.push(nuevo);
  lib.xml["xl/styles.xml"] = est.replace(/<cellXfs\b[^>]*>[\s\S]*?<\/cellXfs>/, `<cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs>`);
  return xfs.length - 1;
}
