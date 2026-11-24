/**
 * Arma el Excel individual desde la plantilla.
 * Este módulo solo pone datos. La estructura la escribe el motor, sin reescribirlo.
 */

import { obtenerEventos, obtenerFacturaAEvento, obtenerFacturacion, textoClave } from "./carga.js";
import { liquidarMes } from "./calculos.js";
import * as M from "./excel/motor_excel_individual.js";
import { textoDe } from "./excel/textosExcel.js";
import { obtenerParametros } from "./parametros.js";
import { encabezadoDe } from "./encabezados.js";
import { recurso } from "./recursos.js";
import { generarExcelDirector, nombreArchivoDirector } from "./exportarDirector.js";

const FICHAS = ["COMA", "COMB", "COMC", "COMD", "COME", "COMF"];
const POS_PLANTILLA = { COMA: 1, COMB: 2, COMSEL: 3, COMC: 4, COMD: 5, COME: 6, COMF: 7 };
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

let plantillaElegida = null;
let mapeoCache = null;

function clave(texto) {
  return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function misma(a, b) {
  const uno = clave(a?.nombre || a);
  const otro = clave(b?.nombreFacturacion || b?.nombre || b);
  return Boolean(uno) && (uno === clave(b?.nombre || b) || uno === otro || uno.includes(otro) || otro.includes(uno));
}

function corto(persona) {
  if (!persona) return "";
  return persona.nombreCorto || String(persona.nombre || "").split(" ")[0];
}

function partesMes(mes) {
  const [anio, numero] = String(mes || "").split("-").map(Number);
  return { anio, numero, corto: `${MESES[(numero || 1) - 1] || ""}${anio || ""}`, largo: MESES_LARGOS[(numero || 1) - 1] || "" };
}

function fechaCelda(valor) {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) return null;
  const iso = `${valor.getUTCFullYear()}-${String(valor.getUTCMonth() + 1).padStart(2, "0")}-${String(valor.getUTCDate()).padStart(2, "0")}`;
  return { fecha: iso };
}

/** El motor exige AAAA-MM-DD. Un mes suelto usa el día 1, o el último día si es el cierre. */
function fechaDeMes(valor, cierre = false) {
  const texto = String(valor || "");
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return { fecha: texto.slice(0, 10) };
  const mes = /^(\d{4})-(\d{2})$/.exec(texto);
  if (!mes) return undefined;
  if (!cierre) return { fecha: `${mes[1]}-${mes[2]}-01` };
  const ultimo = new Date(Date.UTC(Number(mes[1]), Number(mes[2]), 0)).getUTCDate();
  return { fecha: `${mes[1]}-${mes[2]}-${String(ultimo).padStart(2, "0")}` };
}

function enMes(fila, mes) {
  if (!(fila.fecha instanceof Date)) return true;
  const { anio, numero } = partesMes(mes);
  return fila.fecha.getUTCFullYear() === anio && fila.fecha.getUTCMonth() + 1 === numero;
}

function esJornada(fila, parametros) {
  const grupo = clave(fila.grupo);
  const marcas = (parametros.productos || []).find((item) => item.clave === "jornada")?.marcas || [];
  return marcas.some((marca) => grupo.includes(clave(marca)));
}

function esDeportes(fila, parametros) {
  const cuenta = String(parametros.encuentros?.cuenta || "");
  return Boolean(cuenta) && String(fila.cuenta || "").replace(/\s+/g, "").startsWith(cuenta);
}

function poner(celdas, hoja, ref, valor) {
  if (valor === undefined) return;
  celdas.push({ hoja, ref, valor });
}

function reubicarListas(lib, p) {
  const posNueva = (t) => (t === "COMSEL" ? p : (() => { const j = FICHAS.indexOf(t) + 1; return j < p ? j : j + 1; })());
  const nombres = M.leerNombres(lib);
  const familias = {};
  for (const [n, ref] of Object.entries(nombres)) {
    const m = /(?<![A-Za-z])(COMSEL|COM[A-F])(?![A-Za-z])/.exec(n);
    if (!m) continue;
    const fam = n.replace(m[1], "*");
    (familias[fam] ||= {})[m[1]] = ref;
  }
  const filasLista = new Set();
  for (const [fam, miembros] of Object.entries(familias)) {
    if (!miembros.COMA || !/^Escenarios!\$[A-Z]+\$\d+$/.test(miembros.COMA)) continue;
    const inicio = Number(/\d+$/.exec(miembros.COMA)[0]) - (POS_PLANTILLA.COMA - 1);
    filasLista.add(inicio);
    for (const [t, ref] of Object.entries(miembros)) {
      if (!/^Escenarios!\$[A-Z]+\$\d+$/.test(ref)) continue;
      const fila = Number(/\d+$/.exec(ref)[0]);
      if (fila - inicio + 1 !== POS_PLANTILLA[t]) continue;
      M.definirNombre(lib, fam.replace("*", t), ref.replace(/\d+$/, String(inicio + posNueva(t) - 1)));
    }
  }
  for (const inicio of filasLista) {
    const filaVieja = inicio + POS_PLANTILLA.COMSEL - 1;
    const filaNueva = inicio + p - 1;
    const filaOtro = inicio;
    if (filaVieja === filaNueva) continue;
    for (const col of "ABCDEFGHIJKLMNOP") {
      const sP = M.leerEstilo(lib, "Escenarios", col + filaVieja);
      const sO = M.leerEstilo(lib, "Escenarios", col + filaOtro);
      if (sP !== null && sO !== null && sP !== sO) {
        M.ponerEstilo(lib, "Escenarios", col + filaNueva, sP);
        M.ponerEstilo(lib, "Escenarios", col + filaVieja, sO);
      }
    }
    for (const col of "ABCDEFGHIJKLMNOP") {
      const propia = M.leerCelda(lib, "Escenarios", col + filaVieja);
      const otra = M.leerCelda(lib, "Escenarios", col + filaOtro);
      const fP = propia && propia.formula;
      const fO = otra && otra.formula;
      if (!fP) continue;
      if (fO && M.copiarFormula(fO.slice(1), filaVieja - filaOtro) === fP.slice(1)) continue;
      M.escribirFormula(lib, "Escenarios", col + filaNueva, M.copiarFormula(fP.slice(1), filaNueva - filaVieja));
      if (fO) M.escribirFormula(lib, "Escenarios", col + filaVieja, M.copiarFormula(fO.slice(1), filaVieja - filaOtro));
      else M.escribirCelda(lib, "Escenarios", col + filaVieja, null, { sobreFormula: true });
    }
  }
}

// v16: quien no se compara con el esquema anterior (encabezados: "comparaEsquemaAnterior": false, p. ej. ingreso nuevo)
// ve «No aplica» en la comisión anterior. Solo cambia el formato: el valor sigue en 0 y ninguna fórmula se rompe.
const NO_APLICA = '"No aplica";"No aplica";"No aplica"';
function marcarNoAplicaAnterior(lib) {
  const celdas = [
    ["Liquidación", "C19"], ["Liquidación", "N19"],
    ["Comisión anterior", "E5"], ["Comisión anterior", "H5"], ["Comisión anterior", "P5"], ["Comisión anterior", "S5"], ["Comisión anterior", "U5"],
    ["Anterior detalle", "B8"],
  ];
  for (const [hoja, ref] of celdas) {
    const s = M.leerEstilo(lib, hoja, ref);
    if (s === null || s === undefined) continue;
    M.ponerEstilo(lib, hoja, ref, M.estiloConFormato(lib, s, NO_APLICA));
  }
}

function quitarBloqueBtl(lib) {
  for (const ref of ["B84", "B85", "B133", "B134", "B135"]) {
    M.ponerEstilo(lib, "Escenarios", ref, M.estiloConRelleno(lib, M.leerEstilo(lib, "Escenarios", ref), "FFFFF2CC"));
  }
  M.ponerEstilo(lib, "Comisión anterior", "T5", M.estiloConRelleno(lib, M.leerEstilo(lib, "Comisión anterior", "T5"), null));
  // v16: sin bloque BTL no existen BTL_<Comercial>_anterior, Base_BTL_… ni Tasa_BTL_…: T5 vale 0 (antes daba #NAME?
  // y arrastraba 12 celdas). B84 sin evento BTL en la fila 6 queda «Pendiente» en vez de #VALUE!.
  M.escribirCelda(lib, "Comisión anterior", "T5", 0, { sobreFormula: true });
  M.escribirFormula(lib, "Escenarios", "B84", 'IF(ISNUMBER(_Margenes_especiales!H6),_Margenes_especiales!D6-_Margenes_especiales!H6,"Pendiente")');
  M.eliminarFilas(lib, "Escenarios", 96, 4);
  for (const [n, ref] of Object.entries(M.leerNombres(lib))) if (String(ref).includes("#REF!")) M.eliminarNombre(lib, n);
}

// ───────── v19: puntos por producto (5.4), tope por producto y BTL con margen bruto ─────────
const num = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const pctTexto = (v) => `${(Number(v) * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })} %`;

function estiloDe(lib, hoja, ref, origen) {
  const s = M.leerEstilo(lib, hoja, origen);
  if (s !== null && s !== undefined) M.ponerEstilo(lib, hoja, ref, s);
  return s;
}

function ajustesV19(lib, datos) {
  const p = datos.ctx.parametros;
  const resultado = datos.ctx.resultado;
  const topeProducto = num(p.topeProducto) ?? 1.2;
  const topeCongreso = Math.min(num(p.topeCongreso) ?? 1, topeProducto);
  // Parámetros nuevos en Escenarios (filas libres 13 y 34), editables en amarillo.
  for (const [fila, etiqueta, valor, ayuda, nombre] of [
    [34, "Tope por producto (5.4)", topeProducto, "Cada producto se reconoce hasta este cumplimiento; el exceso no compensa otros productos (5.3/5.4).", "Tope_producto_5_4"],
    [13, "Tope de Congreso (5.4)", topeCongreso, "Congreso Nacional se reconoce hasta este cumplimiento (5.4).", "Tope_congreso_5_4"],
  ]) {
    estiloDe(lib, "Escenarios", `A${fila}`, "A33");
    estiloDe(lib, "Escenarios", `B${fila}`, "B33");
    estiloDe(lib, "Escenarios", `C${fila}`, "C33");
    M.escribirCelda(lib, "Escenarios", `A${fila}`, etiqueta, { sobreFormula: true });
    M.escribirCelda(lib, "Escenarios", `B${fila}`, valor, { sobreFormula: true });
    M.escribirCelda(lib, "Escenarios", `C${fila}`, ayuda, { sobreFormula: true });
    M.definirNombre(lib, nombre, `Escenarios!$B$${fila}`);
  }
  // Motor: Σ peso × MIN(cumplimiento, tope del producto). Antes sumaba el cumplimiento sin tope por producto.
  M.escribirFormula(lib, "Motor", "K2", "AI2*MIN(AM2,Tope_producto_5_4)+AJ2*MIN(AN2,Tope_producto_5_4)+AK2*MIN(AO2,Tope_congreso_5_4)+AL2*MIN(AP2,Tope_producto_5_4)");
  // Liquidación 5.4: columna Puntos por producto en la fila de cada producto (I20, I27, I34, I38).
  M.escribirCelda(lib, "Liquidación", "I19", "Puntos", { sobreFormula: true });
  estiloDe(lib, "Liquidación", "I19", "H19");
  const sPuntos = M.leerEstilo(lib, "Liquidación", "H20");
  const estiloPuntos = M.estiloConFormato(lib, sPuntos, "0.00");
  const productos = [
    { fila: 20, cumpl: 23, tope: "Tope_producto_5_4", clave: "eduAt" },
    { fila: 27, cumpl: 33, tope: "Tope_producto_5_4", clave: "mision" },
    { fila: 34, cumpl: 37, tope: "Tope_congreso_5_4", clave: "congreso" },
    { fila: 38, cumpl: 41, tope: "Tope_producto_5_4", clave: "cultural" },
  ];
  const detalle = resultado.detalleVentas || [];
  for (const prod of productos) {
    M.escribirFormula(lib, "Liquidación", `I${prod.fila}`, `IF(N(H${prod.fila})=0,0,Peso_Ventas*H${prod.fila}*MIN(N(I${prod.cumpl}),${prod.tope}))`);
    M.ponerEstilo(lib, "Liquidación", `I${prod.fila}`, estiloPuntos);
    const tope = prod.clave === "congreso" ? topeCongreso : topeProducto;
    M.escribirCelda(lib, "Liquidación", `F${prod.cumpl}`, `Cumplimiento real (se reconoce hasta ${pctTexto(tope)})`, { sobreFormula: true });
    const dato = detalle.find((d) => d.producto === prod.clave);
    if (dato && dato.excede) {
      const sC = M.leerEstilo(lib, "Liquidación", `I${prod.cumpl}`);
      M.ponerEstilo(lib, "Liquidación", `I${prod.cumpl}`, M.estiloConRelleno(lib, sC, "FFFFE3C2"));
    }
  }
  M.escribirCelda(lib, "Liquidación", "F43", "Cumplimiento ponderado (Σ peso × cumplimiento elegible)", { sobreFormula: true });
  M.escribirCelda(lib, "Liquidación", "F44", "Puntos (= suma de la columna Puntos)", { sobreFormula: true });
  estiloDe(lib, "Liquidación", "F45", "F41");
  M.altoFila(lib, "Liquidación", 45, 15);
  M.escribirCelda(lib, "Liquidación", "F45", `Sobrecumplimiento: hasta ${pctTexto(topeProducto)} por producto (Congreso ${pctTexto(topeCongreso)}); el exceso no compensa otros.`, { sobreFormula: true });

  // BTL 5.11.5 (Liquidación F76:I89 y Escenarios B83:B85).
  const btl = datos.ctx.btlEvento;
  const tc = p.btlComercial || {};
  const u = p.btlUmbrales || {};
  const f84 = M.leerCelda(lib, "Liquidación", "I84");
  const r10 = (/R_[^,()]+?_10\b/.exec(f84?.formula || "") || [])[0];
  if (!r10) return;
  M.escribirFormula(lib, "Liquidación", "I78", `${num(tc.topeEvento)}*$I$4*N($I$88)`);
  M.escribirCelda(lib, "Liquidación", "F78", `Tope por evento (${num(tc.topeEvento)} IMR × participación)`, { sobreFormula: true });
  M.escribirFormula(lib, "Liquidación", "I79", `MAX(0,${num(tc.topeAnio)}*$I$4-IF(N(${r10})=0,0,N(BTL_acumulado_anual)))`);
  M.escribirCelda(lib, "Liquidación", "F79", `Tope anual disponible (${num(tc.topeAnio)} IMR − pagado en el año)`, { sobreFormula: true });
  M.escribirCelda(lib, "Liquidación", "F80", "Utilidad base presupuestada (col. PRESUPUESTO)", { sobreFormula: true });
  M.escribirCelda(lib, "Liquidación", "F81", "Utilidad base real (− ICA − 4×1000 del costo)", { sobreFormula: true });
  const neto = u.margenDecide === "neto";
  M.escribirCelda(lib, "Liquidación", "F83", neto ? "Margen neto del evento (decide la tabla)" : "Margen bruto del evento (decide la tabla)", { sobreFormula: true });
  const cump = "BTL_utilidad_obtenida/BTL_utilidad_presupuestada";
  const c = tc;
  M.escribirFormula(lib, "Liquidación", "I84",
    `IF(N(${r10})=0,0,IF(OR(COUNT(BTL_utilidad_presupuestada)=0,COUNT(BTL_utilidad_obtenida)=0,COUNT(BTL_margen_base)=0),"Pendiente",IF(OR(${cump}<${num(u.cumplimientoMinimo)},BTL_margen_base<${num(u.margenBajo)}),0,IF(${cump}<${num(u.cumplimientoAlto)},IF(BTL_margen_base<${num(u.margenMedio)},${num(c.cump90Margen5)},IF(BTL_margen_base<${num(u.margenAlto)},${num(c.cump90Margen10)},${num(c.cump90Margen15)})),IF(BTL_margen_base<${num(u.margenMedio)},${num(c.cump100Margen5)},IF(BTL_margen_base<${num(u.margenAlto)},${num(c.cump100Margen10)},${num(c.cump100Margen15)}))))))`);
  const f85 = M.leerCelda(lib, "Liquidación", "I85")?.formula || "";
  if (f85.includes("MIN($I$78,$I$79,$I$4*$I$84)")) {
    M.escribirFormula(lib, "Liquidación", "I85", f85.replace("MIN($I$78,$I$79,$I$4*$I$84)", "MIN($I$78,$I$79,$I$4*$I$84*N($I$88))*N($I$89)"));
  }
  M.escribirCelda(lib, "Liquidación", "F85", "Comisión (pago directo)", { sobreFormula: true });
  // Filas informativas 86 a 89.
  const filas = [
    [86, neto ? "Margen bruto (informativo)" : "Margen neto (informativo)", neto ? "IF(OR(NOT(ISNUMBER(_Margenes_especiales!D6)),N(_Margenes_especiales!D6)=0),0,(_Margenes_especiales!D6-_Margenes_especiales!E6)/_Margenes_especiales!D6)" : "IF(ISNUMBER(_Margenes_especiales!I6),_Margenes_especiales!I6,0)", "I83"],
    [87, `Carga prestacional ${pctTexto(tc.cargaPrestacional)} (aparte)`, `IF(ISNUMBER(I85),I85*${num(tc.cargaPrestacional) ?? 0},0)`, "I85"],
    [88, "Participación (reparto 5.12)", btl?.participacion ?? 1, "I82"],
    [89, `Factor salvaguarda ${pctTexto(tc.salvaguarda)}`, btl?.factorSalvaguarda ?? 1, "I82"],
  ];
  for (const [fila, etiqueta, valor, modelo] of filas) {
    estiloDe(lib, "Liquidación", `F${fila}`, "F84");
    estiloDe(lib, "Liquidación", `I${fila}`, modelo);
    M.escribirCelda(lib, "Liquidación", `F${fila}`, etiqueta, { sobreFormula: true });
    if (typeof valor === "string") M.escribirFormula(lib, "Liquidación", `I${fila}`, valor);
    else M.escribirCelda(lib, "Liquidación", `I${fila}`, valor, { sobreFormula: true });
  }
  // Quien participa por reparto (5.12) sin facturas BTL propias: el bloque se abre con su participación (I88).
  for (let fila = 76; fila <= 89; fila += 1) {
    const f = M.leerCelda(lib, "Liquidación", `I${fila}`)?.formula;
    if (f && f.includes(`N(${r10})=0`)) M.escribirFormula(lib, "Liquidación", `I${fila}`, f.split(`N(${r10})=0`).join(`AND(N(${r10})=0,N($I$88)=0)`));
  }
  if (!btl) M.escribirCelda(lib, "Liquidación", "I88", 0, { sobreFormula: true });
  // Condiciones 5.11.5 (Sí/No) al final del bloque, sin mover celdas existentes.
  const cond = btl?.condiciones || datos.ctx.btlEvento?.condiciones || {};
  const siNo = (v) => (v ? "Sí" : "No");
  const filasCond = [
    [90, "Participación comercial", siNo(cond.participacionComercial)],
    [91, "Cierre o certificación financiera", siNo(cond.cierre)],
    [92, "Meta de recaudo", siNo(cond.recaudo)],
    [93, "Satisfacción del evento", siNo(cond.satisfaccion)],
  ];
  for (const [fila, etiqueta, valor] of filasCond) {
    estiloDe(lib, "Liquidación", `F${fila}`, "F84");
    estiloDe(lib, "Liquidación", `I${fila}`, "I88");
    M.escribirCelda(lib, "Liquidación", `F${fila}`, etiqueta, { sobreFormula: true });
    M.escribirCelda(lib, "Liquidación", `I${fila}`, btl ? valor : "", { sobreFormula: true });
  }
  // Ingreso del evento (I77 y la comisión BTL anterior informativa): la celda del nombre estaba vacía en la plantilla.
  const refIngreso = String(M.leerNombres(lib).BTL_ingreso_evento || "").replace(/\$/g, "");
  const mRef = /^'?([^'!]+)'?!([A-Z]+)(\d+)$/.exec(refIngreso);
  if (mRef && btl) {
    M.escribirCelda(lib, mRef[1], `A${mRef[3]}`, "Ingreso del evento BTL (ejecución, responsable)", { sobreFormula: true });
    M.escribirCelda(lib, mRef[1], `${mRef[2]}${mRef[3]}`, datos.ctx.ingresoBtl ?? null, { sobreFormula: true });
  }
  // Tasa BTL anterior efectiva (comisión / base) en el nombre de la plantilla si existe.
  const refTasa = String(M.leerNombres(lib).Tasa_BTL_anterior || M.leerNombres(lib)[`Tasa_BTL_${(datos.ctx.comercial?.nombreCorto || "").replace(/\s/g, "_")}`] || "").replace(/\$/g, "");
  const mTasa = /^'?([^'!]+)'?!([A-Z]+)(\d+)$/.exec(refTasa);
  if (mTasa) {
    M.escribirCelda(lib, mTasa[1], `${mTasa[2]}${mTasa[3]}`, datos.ctx.tasaBtlEfectiva ?? null, { sobreFormula: true });
  }
  for (const fila of [88, 89]) {
    const sI = M.leerEstilo(lib, "Liquidación", `I${fila}`);
    M.ponerEstilo(lib, "Liquidación", `I${fila}`, M.estiloConRelleno(lib, sI, "FFFFF2CC"));
  }
  // Escenarios: margen que decide y utilidad presupuestada.
  if (btl) {
    M.escribirFormula(lib, "Escenarios", "B85", neto
      ? 'IF(ISNUMBER(_Margenes_especiales!I6),_Margenes_especiales!I6,"Pendiente")'
      : 'IF(OR(NOT(ISNUMBER(_Margenes_especiales!D6)),N(_Margenes_especiales!D6)=0),"Pendiente",(_Margenes_especiales!D6-_Margenes_especiales!E6)/_Margenes_especiales!D6)');
    M.escribirCelda(lib, "Escenarios", "A85", neto ? "Margen neto del evento BTL (decide la tabla)" : "Margen bruto del evento BTL (decide la tabla)", { sobreFormula: true });
    M.escribirCelda(lib, "Escenarios", "C85", neto ? "Utilidad base ÷ ingresos del evento BTL." : "(Ingresos − total costos) ÷ ingresos del evento BTL, sin comisiones, ICA ni 4×1000 (5.11.5).", { sobreFormula: true });
    if (btl.ingresoPresupuesto === null || btl.costoPresupuesto === null) {
      // Sin columna PRESUPUESTO (evento del informe de Producción): la utilidad presupuestada es la de la app.
      if (num(btl.utilidadPresupuestada) !== null) M.escribirCelda(lib, "Escenarios", "B83", num(btl.utilidadPresupuestada), { sobreFormula: true });
    }
  }
  const refPres = /\$?B\$?(\d+)$/.exec(String(M.leerNombres(lib).BTL_ingreso_presupuestado || ""));
  if (btl && datos.conBtl && refPres) {
    const filaNota = Number(refPres[1]) + 3;
    M.escribirCelda(lib, "Escenarios", `C${refPres[1]}`, "Columna PRESUPUESTO del archivo del evento (antes se ponía la ejecución).", { sobreFormula: true });
    M.escribirCelda(lib, "Escenarios", `C${Number(refPres[1]) + 1}`, "Columna PRESUPUESTO del archivo del evento.", { sobreFormula: true });
    M.escribirCelda(lib, "Escenarios", "C84", `Utilidad base del evento ${btl.numero ?? ""}: ingresos − total costos − ICA − 4×1000 del costo, sin comisiones.`, { sobreFormula: true });
    const fuente = btl.ingresoPresupuesto !== null && btl.costoPresupuesto !== null
      ? "ingresos y costos de la columna PRESUPUESTO del archivo del evento (B133 y B134)"
      : "la utilidad presupuestada que muestra la app (el evento no trae columna PRESUPUESTO)";
    M.escribirCelda(lib, "Escenarios", `A${filaNota}`, `v19 · La utilidad presupuestada (B83) usa la misma fórmula que la real sobre ${fuente}: ingresos − costos − ICA (ingresos × Tasa_ICA) − 4×1000 (costo × Tasa_GMF), sin comisiones. Cumplimiento = utilidad real (B84) ÷ presupuestada. La tabla 5.11.5 se evalúa con el margen ${neto ? "neto" : "bruto = (ingresos − total costos) ÷ ingresos"} (B85). El excedente neto del archivo solo se compara.`, { sobreFormula: true });
  }
  // _Margenes_especiales A2: sin números de evento fijos.
  const numeros = [datos.ctx.misionEvento?.numero, btl?.numero].filter(Boolean).map(String);
  M.escribirCelda(lib, "_Margenes_especiales", "A2", numeros.length
    ? `${numeros.length === 1 ? "Evento" : "Eventos"} ${numeros.join(" y ")} de este comercial en el mes. Se conservan para las núm. 5.4 y 5.11.5 y los parámetros BTL.`
    : "Sin eventos de Misión ni BTL de este comercial en el mes.", { sobreFormula: true });
}

function ponerLista(lib, hoja, sqref, opciones) {
  const ruta = lib.hojas[hoja];
  if (!ruta || !lib.xml[ruta]) return;
  const nodo = `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${sqref}"><formula1>"${opciones}"</formula1></dataValidation>`;
  let xml = lib.xml[ruta];
  if (xml.includes("</dataValidations>")) {
    xml = xml.replace(/count="(\d+)"/, (todo, n, posicion) => (posicion < xml.indexOf("</dataValidations>") ? `count="${Number(n) + 1}"` : todo));
    xml = xml.replace("</dataValidations>", `${nodo}</dataValidations>`);
  } else {
    xml = xml.replace("</worksheet>", `<dataValidations count="1">${nodo}</dataValidations></worksheet>`);
  }
  lib.xml[ruta] = xml;
}

function filaOpcional(lib, parametros, tipo) {
  M.insertarFilas(lib, "Escenarios", 96, 1, 95);
  if (tipo === "jornada") {
    M.escribirCelda(lib, "Escenarios", "A96", parametros.jornada?.etiqueta || "Jornada Analfista");
    M.escribirCelda(lib, "Escenarios", "B96", "Según escenario");
    M.escribirCelda(lib, "Escenarios", "C96", "Asignación de la jornada");
    M.escribirCelda(lib, "Escenarios", "D96", "Facturación");
    M.escribirFormula(lib, "Escenarios", "Z2", 'IF(OR(B96="Según escenario",B96=""),IF(Escenario_base="Hoja 4 (Jornada a Dirección)","A Dirección","A comerciales"),B96)');
    M.definirNombre(lib, "Jornada_asignacion", "Escenarios!$Z$2");
    ponerLista(lib, "Escenarios", "B96", parametros.jornada?.opciones || "Según escenario,A comerciales,A Dirección");
    return;
  }
  const cuenta = parametros.encuentros?.cuenta || "";
  M.escribirCelda(lib, "Escenarios", "A96", `${parametros.encuentros?.etiqueta || "Encuentros deportivos"}${cuenta ? ` (${cuenta})` : ""}`);
  M.escribirCelda(lib, "Escenarios", "B96", "BTL independiente");
  M.definirNombre(lib, "Deportes_tratamiento", "Escenarios!$B$96");
  ponerLista(lib, "Escenarios", "B96", parametros.encuentros?.opciones || "BTL independiente,Otro producto");
}

function celdasNumero(ctx) {
  const celdas = [];
  const p = ctx.parametros;
  const pesos = p.pesos || {};
  const curva = p.curva || {};
  const anclas = curva.anclas || [];
  const comercial = ctx.comercial;
  const tramo = ctx.resultado.anteriorTramos || {};
  const metas = comercial.metas || {};
  const set = (hoja, ref, valor) => poner(celdas, hoja, ref, valor);
  // Encabezado (filas 3 a 6). I3, I4 e I5 son fórmulas de la plantilla (básico, básico + oportunidad, tope de pago).
  const encabezado = encabezadoDe(comercial);
  set("Liquidación", "C3", encabezado.nombreOficial || null);
  set("Liquidación", "C4", encabezado.documento || null);
  set("Liquidación", "C5", encabezado.cargo || null);
  set("Liquidación", "F6", encabezado.referenciaMercado.tipo);
  set("Liquidación", "I6", encabezado.referenciaMercado.valor);
  set("Liquidación", "C29", p.mision?.valorFacturaAnterior);
  set("Liquidación", "I47", comercial.baseSocialInicial);
  set("Liquidación", "I48", comercial.retiros);
  set("Liquidación", "I49", comercial.ingresos);
  set("Escenarios", "B10", ctx.anio);
  // Sin prefijo, la fórmula de anticipos (LEFT(cuenta; LEN(prefijo)) = prefijo) da SI en todas las filas y no cuenta nada.
  set("Escenarios", "B51", p.anticipos?.prefijoCuenta || undefined);
  set("Escenarios", "B15", pesos.ventas);
  set("Escenarios", "B16", pesos.baseSocial);
  set("Escenarios", "B17", pesos.serfiscal);
  set("Escenarios", "B18", pesos.innovacion);
  set("Escenarios", "B19", pesos.satisfaccion);
  // Cumplimiento fijo del modo Temporal: 100 % (1). El motor lo multiplica por el peso, así que 1 × 10 = 10 puntos y 1 × 15 = 15.
  set("Escenarios", "B23", 1);
  set("Escenarios", "B25", 1);
  set("Escenarios", "B27", 1);
  set("Escenarios", "B29", 1);
  set("Escenarios", "B31", 1);
  set("Escenarios", "B33", p.topeIndicador);
  set("Escenarios", "B36", curva.minimo);
  set("Escenarios", "B37", curva.tope);
  anclas.forEach((ancla, indice) => {
    set("Escenarios", `B${39 + indice * 2}`, ancla.puntaje);
    set("Escenarios", `B${40 + indice * 2}`, ancla.factor);
  });
  set("Escenarios", "B57", p.director?.metaMisionEquipo);
  set("Escenarios", "B61", ctx.metaCultural);
  set("Escenarios", "B62", p.mision?.valorFacturaNueva);
  set("Escenarios", "B66", p.margen?.umbralBajo);
  set("Escenarios", "B67", p.margen?.umbralAlto);
  set("Escenarios", "B68", p.margen?.factorBajo);
  set("Escenarios", "B69", p.margen?.factorMedio);
  set("Escenarios", "B70", p.margen?.factorAlto);
  set("Escenarios", "B75", p.costos?.gmf);
  set("Escenarios", "B77", p.costos?.ica);
  set("Escenarios", "B90", fechaDeMes(p.transicion?.inicio || p.transicion?.desde));
  set("Escenarios", "B91", fechaDeMes(p.transicion?.fin || p.transicion?.hasta, true));
  set("Escenarios", "B95", p.anterior?.tasaBajoMinimo);
  set("Escenarios", "B98", ctx.tasaBtlEfectiva ?? p.anterior?.tasaBtl);
  set("Escenarios", "B99", ctx.ingresoBtl);
  // Plantilla: B = Desde, C = Hasta, D = Tasa. Desde del tramo siguiente = Hasta anterior + 0,01 (hueco de la v6.7: 0,81, 0,91…).
  (p.anterior?.tramos || []).forEach((item, indice) => {
    const fila = 102 + indice;
    if (fila > 106) return;
    const anteriorHasta = indice > 0 ? p.anterior.tramos[indice - 1]?.hasta : null;
    const desde = indice === 0 ? p.anterior?.minimo : Math.round((Number(anteriorHasta) + 0.01) * 100) / 100;
    set("Escenarios", `B${fila}`, desde);
    if (item.hasta !== null && item.hasta !== undefined) set("Escenarios", `C${fila}`, item.hasta);
    set("Escenarios", `D${fila}`, item.tasa);
  });
  set("Escenarios", "A111", comercial.nombre);
  set("Escenarios", "B111", metas[ctx.mes]?.eduAt ?? undefined);
  set("Escenarios", "C111", encabezado.basico);
  set("Escenarios", "D111", encabezado.oportunidad);
  set("Escenarios", "J111", 1);
  set("Escenarios", "K111", comercial.tieneEsquemaAnterior ? 1 : 0);
  set("Escenarios", "L111", comercial.serfiscal === null || comercial.serfiscal === undefined ? 0 : 1);
  set("Escenarios", "P111", comercial.satisfaccion === null || comercial.satisfaccion === undefined ? 0 : 1);
  set("Escenarios", "B116", ctx.equipo.length);
  set("Escenarios", "B139", metas[ctx.mes]?.mision);
  set("Escenarios", "B140", p.innovacion?.puntosOferta);
  set("Escenarios", "B141", p.innovacion?.puntosPrimeraVenta);
  set("Escenarios", "B143", ctx.tasaBtlEfectiva ?? p.anterior?.tasaBtl);
  set("Escenarios", "B159", p.baseSocial?.incrementoPorMes);
  set("Escenarios", "B160", p.cultural?.valorCarton);
  set("Escenarios", "B161", ctx.cartonesEquipo);
  ctx.equipo.forEach((item, indice) => {
    const base = item.metas || {};
    set("Escenarios", `B${166 + indice}`, item.baseSocialInicial);
    set("Escenarios", `C${166 + indice}`, item.retiros);
    set("Escenarios", `D${166 + indice}`, item.ingresos);
    set("Escenarios", `B${122 + indice}`, base[ctx.mes]?.eduAt ?? undefined);
    set("Escenarios", `B${177 + indice}`, base[ctx.mes]?.eduAt);
    set("Escenarios", `C${177 + indice}`, base[ctx.mesSiguiente]?.eduAt);
    set("Escenarios", `D${177 + indice}`, base[ctx.mesUltimo]?.eduAt);
    set("Escenarios", `E${177 + indice}`, item.cartones);
  });
  set("Comisión anterior", "B5", tramo.meta);
  set("Comisión anterior", "C5", tramo.produccion);
  set("Comisión anterior", "D5", tramo.tasa);
  set("Comisión anterior", "F5", tramo.produccion);
  set("Comisión anterior", "G5", tramo.tasa);
  set("Comisión anterior", "I5", tramo.produccion);
  set("Comisión anterior", "J5", 0);
  if (ctx.misionEvento) {
    set("_Margenes_especiales", "A5", ctx.misionEvento.numero);
    set("_Margenes_especiales", "C5", ctx.misionEvento.facturas);
    set("_Margenes_especiales", "D5", ctx.misionEvento.ingreso);
    set("_Margenes_especiales", "E5", ctx.misionEvento.costo);
  }
  if (ctx.btlEvento) {
    set("_Margenes_especiales", "A6", ctx.btlEvento.numero);
    set("_Margenes_especiales", "C6", ctx.btlEvento.facturas);
    set("_Margenes_especiales", "D6", ctx.btlEvento.ingreso);
    set("_Margenes_especiales", "E6", ctx.btlEvento.costo);
    // v19: B133/B134 son el ingreso y el costo PRESUPUESTADOS (columna PRESUPUESTO del archivo del evento).
    // Antes se ponía la ejecución. Sin presupuesto, quedan vacíos y B83 toma la utilidad presupuestada de la app.
    set("Escenarios", "B133", ctx.btlEvento.ingresoPresupuesto);
    set("Escenarios", "B134", ctx.btlEvento.costoPresupuesto);
    set("Escenarios", "B135", comercial.btlPagadoAnio);
  }
  return celdas;
}

function eventoEspecial(eventos, comercial, marca, btlMes) {
  // v19: con reparto, el evento del comercial puede tener otro responsable: se busca primero en sus eventos BTL del mes.
  const delReparto = marca && btlMes ? btlMes.map((item) => item.evento).filter((ev) => clave(`${ev.grupo || ""} ${ev.producto || ""} ${ev.detalle || ""}`).includes(marca)) : [];
  const propios = delReparto.length ? delReparto : (eventos || []).filter((evento) => misma(evento.comercial, comercial) && clave(`${evento.grupo || ""} ${evento.producto || ""} ${evento.detalle || ""}`).includes(marca));
  const evento = propios.find((item) => item.delMes) || propios[0];
  if (!evento) return null;
  const item = (btlMes || []).find((b) => b.evento === evento || clave(b.evento?.evento) === clave(evento.evento));
  return {
    numero: evento.evento,
    nombre: evento.detalle || evento.producto || evento.grupo || String(evento.evento || ""),
    facturas: Array.isArray(evento.facturas) ? evento.facturas.length : null,
    ingreso: evento.ingreso,
    costo: evento.costo,
    ingresoPresupuesto: num(evento.presupuestoBtl?.ingreso),
    costoPresupuesto: num(evento.presupuestoBtl?.costo),
    utilidadPresupuestada: num(item?.utilidadPresupuestada ?? evento.utilidadPresupuestada),
    participacion: item?.porcentajeReparto ?? 1,
    factorSalvaguarda: item?.factorSalvaguarda ?? 1,
    condiciones: item?.evento?.condiciones || evento.condiciones || {},
  };
}

/** Evento de una factura: su columna Evento, o si no la trae, el mapa factura → evento (igual que en calculos.js). */
function eventoDeFactura(fila, facturaAEvento) {
  return textoClave(fila.evento) || facturaAEvento.get(textoClave(fila.factura)) || "";
}

/** Arma solo datos: celdas, textos y el tamaño de cada tabla. */
export function construirDatosExcel(resultado, liquidacion, parametros, filas, eventos, mes) {
  const comercial = resultado.comercial;
  const info = partesMes(mes);
  const equipo = (parametros.comerciales || [])
    .filter((item) => (item.activoDesde || "0000-00") <= mes && item.tieneEsquemaAnterior !== false)
    .slice()
    .sort((a, b) => corto(a).localeCompare(corto(b), "es"));
  const fuera = (parametros.comerciales || []).find((item) => item.tieneEsquemaAnterior === false);
  const propios = (filas || []).filter((fila) => misma(fila.asesor, comercial) && enMes(fila, mes));
  const visibles = (resultado.detalleFacturas || []).length
    ? propios.filter((fila) => (resultado.detalleFacturas || []).some((item) => String(item.factura || "") === String(fila.factura || "")))
    : propios;
  const facturasVisibles = visibles.length ? visibles : propios;
  const margenes = resultado.margenesEventos || [];
  // Base y comisión BTL anterior: las que calculó la app (archivo / Producción), no parametros.btl.eventos.
  const ingresoBtl = resultado.ingresoBtlAnterior ?? null;
  const tasaBtlEfectiva = resultado.tasaBtlAnterior ?? parametros.anterior?.tasaBtl ?? null;
  // v22: eventos BTL del comercial (Parámetros/importados o base calculada por la app). Solo se usa su cantidad.
  const ingresoEvento = [
    ...(parametros.btl?.eventos || []).filter((evento) => misma(evento.comercial, comercial)),
    ...(ingresoBtl ? [{ ingresoEjecucion: ingresoBtl }] : []),
  ];
  const cartonesEquipo = equipo.reduce((suma, item) => suma + (Number(item.cartones) || 0), 0);
  const [anio, numero] = String(mes).split("-").map(Number);
  const mesSiguiente = `${numero === 12 ? anio + 1 : anio}-${String(numero === 12 ? 1 : numero + 1).padStart(2, "0")}`;
  const fin = parametros.transicion?.fin || parametros.transicion?.hasta;
  const ctx = {
    parametros,
    resultado,
    comercial,
    equipo,
    fuera: fuera?.nombre || "",
    director: parametros.director?.nombre || "",
    nombre: comercial.nombre,
    anio: info.anio,
    mesNumero: info.numero,
    mes,
    mesSiguiente,
    mesUltimo: fin,
    version: parametros.excel?.version || "",
    ingresoBtl,
    comisionBtl: resultado.btlAnterior,
    tasaBtlEfectiva,
    btlAnteriorTasaSupuesta: Boolean(resultado.btlAnteriorTasaSupuesta),
    baseSocial: comercial.baseSocialInicial,
    eventoBtl: (eventos || []).find((evento) => misma(evento.comercial, comercial) && clave(`${evento.grupo || ""} ${evento.producto || ""}`).includes(clave(parametros.hojas?.btl || "btl"))) || null,
    metaCultural: cartonesEquipo * (Number(parametros.cultural?.valorCarton) || 0),
    cartonesEquipo,
    misionEvento: eventoEspecial(eventos, comercial, clave(parametros.hojas?.mision || "mision")),
    btlEvento: eventoEspecial(eventos, comercial, clave(parametros.hojas?.btl || "btl"), resultado.btlMes),
  };
  const celdas = celdasNumero(ctx);
  const textos = [
    ["Liquidación", "A1"],
    ["Explicación", "A1"], ["Explicación", "A2"], ["Explicación", "A5"], ["Explicación", "A6"],
    ["Explicación", "A23"], ["Explicación", "A26"], ["Explicación", "A27"], ["Explicación", "A31"],
    ["Explicación", "A57"], ["Explicación", "A58"], ["Explicación", "A59"], ["Explicación", "A67"], ["Explicación", "A69"],
  ];
  textos.forEach(([hoja, ref]) => poner(celdas, hoja, ref, textoDe(ctx, hoja, ref)));
  poner(celdas, "Comisión anterior", "A5", comercial.nombre);
  if (ctx.misionEvento) poner(celdas, "_Margenes_especiales", "B5", ctx.misionEvento.nombre);
  if (ctx.btlEvento) poner(celdas, "_Margenes_especiales", "B6", ctx.btlEvento.nombre);
  equipo.forEach((item, indice) => {
    ["A122", "A148", "A166", "A177", "A192"].forEach((base) => {
      const fila = Number(base.slice(1)) + indice;
      poner(celdas, "Escenarios", `A${fila}`, item.nombre);
    });
  });
  const indiceMargen = new Map();
  margenes.forEach((evento, indice) => indiceMargen.set(clave(evento.numero), indice));
  const facturaAEvento = obtenerFacturaAEvento();
  // Nombre del evento de una factura (columna Evento de Facturas y _Datos). Si no hay margen, deja su evento tal cual.
  const nombreDeEvento = (fila) => {
    const indice = indiceMargen.get(clave(eventoDeFactura(fila, facturaAEvento)));
    return indice === undefined ? (fila.evento || "") : margenes[indice].evento || "";
  };
  const formulas = [];
  propios.forEach((fila, indice) => {
    const r = 2 + indice;
    const numeroEvento = eventoDeFactura(fila, facturaAEvento);
    const evento = clave(numeroEvento);
    const margen = indiceMargen.has(evento) ? indiceMargen.get(evento) : null;
    poner(celdas, "_Datos", `A${r}`, esJornada(fila, parametros) && !ingresoEvento.length ? null : comercial.nombre);
    if (esJornada(fila, parametros)) {
      const canal = parametros.encuentros?.etiquetaCanal || comercial.nombre;
      formulas.push({ hoja: "_Datos", ref: `A${r}`, formula: `IF(Jornada_asignacion="A Dirección","${canal}","${comercial.nombre}")` });
    }
    poner(celdas, "_Datos", `B${r}`, fila.factura || "");
    poner(celdas, "_Datos", `C${r}`, fila.grupo || "");
    poner(celdas, "_Datos", `D${r}`, fila.cuenta || "");
    poner(celdas, "_Datos", `E${r}`, Number(fila.base) || 0);
    poner(celdas, "_Datos", `F${r}`, fila.estado || "");
    poner(celdas, "_Datos", `G${r}`, fechaCelda(fila.fechaPago));
    poner(celdas, "_Datos", `K${r}`, fila.grupo || "");
    poner(celdas, "_Datos", `Q${r}`, fechaCelda(fila.fecha));
    poner(celdas, "_Datos", `R${r}`, fila.hoja || "");
    // AD = nombre del evento; AM = número del evento (como en la v6.7).
    poner(celdas, "_Datos", `AD${r}`, nombreDeEvento(fila));
    poner(celdas, "_Datos", `AI${r}`, fila.cliente || "");
    poner(celdas, "_Datos", `AK${r}`, fila.cuenta || "");
    poner(celdas, "_Datos", `AM${r}`, /^\d+$/.test(numeroEvento) ? Number(numeroEvento) : numeroEvento);
    ["M", "V", "AF", "AG"].forEach((col) => {
      if (margen === null) formulas.push({ hoja: "_Datos", ref: `${col}${r}`, vacia: true });
      else formulas.push({ hoja: "_Datos", ref: `${col}${r}`, formula: `'Márgenes eventos'!I${5 + margen}` });
    });
  });
  facturasVisibles.forEach((fila, indice) => {
    const r = 5 + indice;
    const datos = 2 + propios.findIndex((item) => item === fila);
    poner(celdas, "Facturas", `A${r}`, comercial.nombre);
    poner(celdas, "Facturas", `B${r}`, fila.factura || "");
    poner(celdas, "Facturas", `C${r}`, fila.grupo || "");
    poner(celdas, "Facturas", `D${r}`, fila.cuenta || "");
    poner(celdas, "Facturas", `E${r}`, nombreDeEvento(fila));
    poner(celdas, "Facturas", `F${r}`, Number(fila.base) || 0);
    poner(celdas, "Facturas", `G${r}`, fila.estado || "");
    poner(celdas, "Facturas", `H${r}`, fechaCelda(fila.fechaPago));
    ["I", "J", "K", "L"].forEach((col, i) => {
      const origen = ["H", "E", "F", "G"][i];
      formulas.push({ hoja: "Facturas", ref: `${col}${r}`, formula: `_Datos!${origen}${datos > 1 ? datos : r}` });
    });
  });
  margenes.forEach((evento, indice) => {
    const r = 5 + indice;
    poner(celdas, "Márgenes eventos", `A${r}`, evento.numero);
    poner(celdas, "Márgenes eventos", `B${r}`, evento.evento);
    poner(celdas, "Márgenes eventos", `C${r}`, (evento.facturas || []).length);
    poner(celdas, "Márgenes eventos", `D${r}`, evento.ingreso);
    poner(celdas, "Márgenes eventos", `E${r}`, evento.costo);
  });
  return {
    ctx,
    celdas,
    formulas,
    // v19: también si participa en un evento BTL del mes por reparto aprobado (5.12) sin ser el responsable.
    conBtl: ingresoEvento.length > 0 || Boolean(ctx.btlEvento && (resultado.btlMes || []).length),
    conJornada: ingresoEvento.length === 0 && propios.some((fila) => esJornada(fila, parametros)),
    conDeportes: ingresoEvento.length === 0 && !propios.some((fila) => esJornada(fila, parametros)) && propios.some((fila) => esDeportes(fila, parametros)),
    tablas: {
      datos: propios.length,
      facturas: facturasVisibles.length,
      margenes: margenes.length,
      base: 0,
      especiales: 0,
    },
    fichas: equipo.map(corto),
    p: equipo.findIndex((item) => misma(item, comercial)) + 1,
  };
}

async function bytesPlantilla() {
  if (plantillaElegida) return plantillaElegida;
  try {
    return await recurso("plantillas/plantilla_liquidacion_individual.xlsx");
  } catch {
    throw new Error("No se encontró la plantilla del Excel individual");
  }
}

async function mapeo() {
  if (mapeoCache) return mapeoCache;
  try {
    mapeoCache = await recurso("plantillas/mapeo_celdas.json", "json");
  } catch {
    return { celdas: [] };
  }
  return mapeoCache;
}

export function elegirPlantilla(bytes) {
  plantillaElegida = bytes ? new Uint8Array(bytes) : null;
}

export function nombreArchivo(comercial, mes, parametros = obtenerParametros()) {
  const info = partesMes(mes);
  return `Liquidacion_${info.corto}_${corto(comercial)}.xlsx`;
}

export function nombreZip(mes) {
  return `Liquidaciones_${partesMes(mes).corto}_individuales.zip`;
}

async function libroDe(datos, clave) {
  if (!window.JSZip) throw new Error("No se encontró la librería del Excel individual");
  const lib = await M.abrirPlantilla(await bytesPlantilla(), window.JSZip);
  if (datos.p > 0) reubicarListas(lib, datos.p);
  const otros = datos.fichas.filter((nombre) => nombre !== corto(datos.ctx.comercial));
  const fichas = { COMSEL: corto(datos.ctx.comercial), COMDIR: corto(datos.ctx.parametros.director) || datos.ctx.parametros.director?.nombreCorto || "" };
  otros.forEach((nombre, indice) => { if (FICHAS[indice]) fichas[FICHAS[indice]] = nombre; });
  M.reemplazarFichas(lib, fichas);
  const mapa = await mapeo();
  const pedidas = new Set((mapa.celdas || []).filter((celda) => celda.tipo !== "fila de tabla").map((celda) => `${celda.hoja}!${celda.ref}`));
  for (const celda of datos.celdas) {
    if (celda.hoja === "_Datos" || celda.hoja === "Facturas" || celda.hoja === "Márgenes eventos") continue;
    if (pedidas.size && !pedidas.has(`${celda.hoja}!${celda.ref}`) && celda.hoja !== "Escenarios" && celda.hoja !== "Comisión anterior" && celda.hoja !== "_Margenes_especiales" && celda.hoja !== "Liquidación") continue;
    M.escribirCelda(lib, celda.hoja, celda.ref, celda.valor, { sobreFormula: true });
  }
  if (!datos.conBtl) quitarBloqueBtl(lib);
  if (datos.conJornada) filaOpcional(lib, datos.ctx.parametros, "jornada");
  else if (datos.conDeportes) filaOpcional(lib, datos.ctx.parametros, "deportes");
  M.redimensionarTabla(lib, "_Datos", 2, 45, datos.tablas.datos);
  M.redimensionarTabla(lib, "Facturas", 5, 41, datos.tablas.facturas);
  M.redimensionarTabla(lib, "Márgenes eventos", 5, 16, datos.tablas.margenes);
  M.redimensionarTabla(lib, "Base social", 26, 126, datos.tablas.base);
  M.redimensionarTabla(lib, "Especiales auxiliar", 3, 5, datos.tablas.especiales);
  for (const celda of datos.celdas) {
    if (celda.hoja !== "_Datos" && celda.hoja !== "Facturas" && celda.hoja !== "Márgenes eventos") continue;
    M.escribirCelda(lib, celda.hoja, celda.ref, celda.valor, { sobreFormula: celda.valor === null });
  }
  for (const formula of datos.formulas) {
    if (formula.vacia) M.escribirCelda(lib, formula.hoja, formula.ref, null, { sobreFormula: true });
    else M.escribirFormula(lib, formula.hoja, formula.ref, formula.formula);
  }
  ajustesV19(lib, datos);
  if (datos.ctx.comercial.tieneEsquemaAnterior === false || encabezadoDe(datos.ctx.comercial).comparaAnterior === false) marcarNoAplicaAnterior(lib);
  if (clave) await M.proteger(lib, clave);
  return M.guardar(lib);
}

function mesVisible() {
  const transicion = obtenerParametros().transicion || {};
  return document.querySelector("#mes-carga")?.value || transicion.inicio || transicion.desde || "";
}

function liquidacionDe(liquidacion) {
  if (liquidacion) return liquidacion;
  return liquidarMes(obtenerFacturacion(), obtenerEventos(), obtenerParametros(), mesVisible(), obtenerFacturaAEvento());
}

export async function generarExcelComercial(nombre, { clave, liquidacion } = {}) {
  const actual = liquidacionDe(liquidacion);
  if (!actual.resultados.length) throw new Error("Carga la facturación para exportar");
  // Nunca usar el libro de otro comercial: si no liquida en este mes (p. ej. quien ingresa después del mes), se avisa.
  const resultado = actual.resultados.find((item) => item.nombre === nombre);
  if (!resultado) throw new Error(`${nombre} no liquida en ${mesVisible()}. Elige un mes desde su fecha de inicio.`);
  const datos = construirDatosExcel(resultado, actual, obtenerParametros(), obtenerFacturacion(), obtenerEventos(), mesVisible());
  return libroDe(datos, clave);
}

function bajar(bytes, nombre) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export async function descargarExcelComercial(nombre, opciones = {}) {
  const bytes = await generarExcelComercial(nombre, opciones);
  const comercial = (opciones.liquidacion?.resultados || []).find((item) => item.nombre === nombre)?.comercial || { nombre };
  bajar(bytes, nombreArchivo(comercial, mesVisible()));
}

export async function descargarTodosZip(opciones = {}) {
  if (!window.JSZip) throw new Error("No se encontró la librería del Excel individual");
  const actual = liquidacionDe(opciones.liquidacion);
  const zip = new window.JSZip();
  for (const resultado of actual.resultados) {
    const bytes = await generarExcelComercial(resultado.nombre, { ...opciones, liquidacion: actual });
    zip.file(nombreArchivo(resultado.comercial, mesVisible()), bytes);
  }
  // El libro del director va en el mismo .zip (misma clave, si se pidió).
  zip.file(nombreArchivoDirector(mesVisible()), await generarExcelDirector({ clave: opciones.clave, liquidacion: actual }));
  const paquete = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  bajar(paquete, nombreZip(mesVisible()));
}
