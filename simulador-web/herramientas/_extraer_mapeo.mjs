/**
 * Extrae nombres definidos de los Excel de referencia → referencia/mapeo_nombres.json
 * Solo se usa en Fase 0 / desarrollo. No forma parte del HTML entregable.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const XLSX = require(path.join(RAIZ, "lib", "xlsx.full.min.js"));

/** Modelo!$AA$18 → { hoja, celda } */
function parseRef(ref) {
  if (!ref || typeof ref !== "string") return null;
  if (ref.includes("#REF")) return { error: ref };
  const m = String(ref).match(
    /^(?:(?:'([^']+)'|([^'!]+))!)?\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/i
  );
  if (!m) return { raw: ref };
  const hoja = m[1] || m[2] || null;
  const celda = m[5] ? `${m[3]}${m[4]}:${m[5]}${m[6]}` : `${m[3]}${m[4]}`;
  return { hoja, celda };
}

/** Heurística nombre Excel → campo del motor (Fase 1). */
function campoMotor(nombre) {
  const reglas = [
    [/^Peso_Ventas$/, "parametros.pesos.ventas"],
    [/^Peso_Base$/, "parametros.pesos.baseSocial"],
    [/^Peso_SER$/, "parametros.pesos.serfiscal"],
    [/^Peso_Innovacion$/, "parametros.pesos.innovacion"],
    [/^Peso_Satisfaccion$/, "parametros.pesos.satisfaccion"],
    [/^Score_minimo$/, "parametros.curva.minimo"],
    [/^Tope_pago$/, "parametros.curva.tope"],
    [/^Tipo_curva$/, "parametros.curva.tipo"],
    [/^Curva_P(\d)$/, "parametros.curva.anclas[$1-1].puntaje"],
    [/^Curva_F(\d)$/, "parametros.curva.anclas[$1-1].factor"],
    [/^Score_vista$/, "resultado.puntaje"],
    [/^Factor_vista$/, "resultado.factor"],
    [/^Comision_vista$/, "resultado.comision"],
    [/^BTL_Estimado$/, "resultado.btl.estimado"],
    [/^Comercial_sel$/, "entradas.comercial"],
    [/^Mes_sel$/, "entradas.mes"],
    [/^Sim_Basico$/, "perfil.compensacion.basico"],
    [/^Sim_Opp$/, "perfil.compensacion.oportunidad"],
    [/^Sim_IMR$/, "perfil.compensacion.imr"],
    [/^Sim_IngMax$/, "perfil.compensacion.ingresoMaximo"],
    [/^Sim_TopeInd$/, "perfil.compensacion.topeIndividual"],
    [/^Inp_/, "entradas."],
    [/^Has_/, "motor.has."],
    [/^Pts_/, "motor.puntos."],
    [/^Cump_/, "motor.cumplimiento."],
    [/^Factor_/, "motor.factor."],
    [/^Comision_/, "motor.comision."],
    [/^Score_/, "motor.score."],
    [/^Meta_/, "perfil.metas."],
    [/^BTL_/, "motor.btl."],
    [/^Sens_/, "motor.sensibilidad."],
    [/^Tasa_/, "parametros."],
    [/^Umbral_/, "parametros.margen."],
    [/^Tope_/, "parametros."],
    [/^Base_Mision/, "parametros.mision.valorFactura"],
    [/^Incremento_BS$/, "parametros.baseSocial.incremento"],
    [/^Sat_Esperada$/, "parametros.satisfaccion.esperada"],
    [/^Valor_Carton$/, "parametros.cultural.valorCarton"],
    [/^Cartones_/, "perfil.cartones"],
    [/^BS_/, "motor.baseSocial."],
    [/^Calc_/, "motor.calculadoraMargen."],
    [/^Med_/, "entradas.medicion."],
    [/^Dias_/, "entradas.prorrateo."],
    [/^Factor_prorrateo$/, "motor.prorrateo.factor"],
  ];
  for (const [re, dest] of reglas) {
    const m = nombre.match(re);
    if (!m) continue;
    if (dest.includes("$1")) {
      return dest.replace("$1-1", String(Number(m[1]) - 1)).replace("$1", m[1]);
    }
    if (dest.endsWith(".")) return dest + nombre;
    return dest;
  }
  return null;
}

function leerLibro(rutaRel) {
  const ruta = path.join(RAIZ, rutaRel);
  const buf = fs.readFileSync(ruta);
  const wb = XLSX.read(buf, { type: "buffer", cellNF: true, cellDates: true });
  const sheetsMeta = (wb.Workbook && wb.Workbook.Sheets) || [];
  const hojas = wb.SheetNames.map((n, i) => {
    const h = sheetsMeta.find((s) => s.name === n) || sheetsMeta[i] || {};
    const estado = h.Hidden === 1 ? "hidden" : h.Hidden === 2 ? "veryHidden" : "visible";
    return { nombre: n, estado };
  });

  const names = (wb.Workbook && wb.Workbook.Names) || [];
  const mapeo = {};
  for (const n of names) {
    if (!n.Name || String(n.Name).startsWith("_xlnm")) continue;
    const info = parseRef(n.Ref);
    let valor = null;
    if (info?.hoja && info?.celda && !String(info.celda).includes(":")) {
      const hoja = wb.Sheets[info.hoja];
      const addr = String(info.celda).replace(/\$/g, "");
      const cell = hoja && hoja[addr];
      if (cell && cell.v !== undefined) valor = cell.v;
    }
    mapeo[n.Name] = {
      ref: n.Ref,
      hoja: info?.hoja ?? null,
      celda: info?.celda ?? null,
      valorEnArchivo: valor,
      campoMotor: campoMotor(n.Name),
    };
  }

  return {
    archivo: path.basename(ruta),
    hojas,
    cantidadNombres: Object.keys(mapeo).length,
    nombres: mapeo,
  };
}

const comercial = leerLibro(
  "referencia/Simulador_Comercial_2026_con_BTL_REFERENCIA_ANONIMA.xlsx"
);
const nuevoIngreso = leerLibro(
  "referencia/Simulador_Nuevo_Ingreso_2026_REFERENCIA_ANONIMA.xlsx"
);

const salida = {
  generado: new Date().toISOString().slice(0, 10),
  nota: "Mapa nombre definido Excel → celda → campo del motor. Valores son los del archivo anónimo de referencia (pueden ser caché; las pruebas regeneran casos con Excel/LibreOffice).",
  comercial,
  nuevoIngreso,
  casoSemilla: {
    descripcion: "Comercial A · Octubre · ver prompt §7.1",
    entradas: {
      comercial: "Comercial A",
      mes: "Octubre",
      Inp_EAT_Oct: 41250000,
      Inp_Mis_Oct: 3,
      BS_base: 90,
      Inp_SER: 12,
      Meta_SER: 10,
      Inp_Inn1: "SÍ",
      Inp_Inn1_Venta: 5000000,
      Inp_Sat: 85,
      Comision_anterior: 1500000,
      Inp_BTL_Ingreso: 100000000,
      Inp_BTL_Costo: 80000000,
      Inp_BTL_Presup: 15000000,
    },
    esperado: {
      Score_vista: 76.402,
      Factor_vista: 0,
      Comision_vista: 0,
      transicion: 1500000,
      BTL_Estimado: 4678488.95,
      Pts_Ventas: 43.4645,
      Pts_Base: 0,
      Pts_Diversificacion: 17,
      Pts_Satisfaccion: 15.9375,
    },
  },
};

const dest = path.join(RAIZ, "referencia", "mapeo_nombres.json");
fs.writeFileSync(dest, JSON.stringify(salida, null, 2), "utf8");
console.log(
  `OK ${dest}\n  comercial: ${comercial.cantidadNombres} nombres\n  nuevo ingreso: ${nuevoIngreso.cantidadNombres} nombres`
);

const muestra = ["Score_vista", "Peso_Ventas", "BTL_Estimado", "Comercial_sel", "Mes_sel"];
for (const k of muestra) {
  console.log(k, comercial.nombres[k]);
}
