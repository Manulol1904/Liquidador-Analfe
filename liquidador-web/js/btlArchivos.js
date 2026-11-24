/**
 * v18 · Eventos BTL desde el archivo de liquidación/ejecución de cada evento (o ingresados a mano).
 * Solo trae datos: el cálculo 5.11.5 sigue en calculos.js (liquidarBtl) con sus parámetros, sin cambios.
 *
 * Qué toma la app de cada evento:
 *   ingreso  = TOTAL INGRESOS · columna EJECUCIÓN
 *   costo    = TOTAL COSTOS   · columna EJECUCIÓN (si falta: costos fijos + variables)
 *   utilidadPresupuestada (v19) = misma fórmula que la real sobre TOTAL INGRESOS y TOTAL COSTOS · columna PRESUPUESTO
 *   (el EXCEDENTE NETO presupuestado del archivo solo se compara; si faltan ingresos o costos presupuestados, se usa)
 * La app recalcula utilidad y margen con sus parámetros (ICA y GMF de Parámetros). Lo demás del archivo
 * (excedente neto y margen neto de ejecución, ICA, 4×1000…) se muestra como referencia y para comparar.
 * Las filas se buscan por etiqueta (sin tildes, mayúsculas ni espacios de más), no por coordenada.
 * Se lee el valor guardado de cada celda (las fórmulas a otros libros no se recalculan).
 */

const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

export const CAMPOS_BTL = [
  { clave: "ingresos", titulo: "Total ingresos", etiquetas: ["TOTAL INGRESOS"], usa: "ingreso (ejecución y presupuesto)" },
  { clave: "costosFijos", titulo: "Total costos fijos", etiquetas: ["TOTAL COSTOS FIJOS"] },
  { clave: "costosVariables", titulo: "Total costos variables", etiquetas: ["TOTAL COSTOS VARIABLES"] },
  { clave: "costos", titulo: "Total costos", etiquetas: ["TOTAL COSTOS"], usa: "costo (ejecución y presupuesto)" },
  { clave: "excedenteBruto", titulo: "Excedente bruto", etiquetas: ["EXCEDENTE BRUTO"] },
  { clave: "margenBruto", titulo: "Margen bruto", etiquetas: ["MARGEN BRUTO"], porcentaje: true },
  { clave: "ica", titulo: "Industria y comercio (ICA)", etiquetas: ["INDUSTRIA Y COMERCIO", "ICA"] },
  { clave: "gmf", titulo: "4 × 1000 (GMF)", etiquetas: ["4*1000", "4X1000", "4 POR 1000", "GMF"] },
  { clave: "totalGastos", titulo: "Total gastos", etiquetas: ["TOTAL GASTOS"] },
  { clave: "costosGastos", titulo: "Total costos y gastos", etiquetas: ["TOTAL COSTOS Y GASTOS"] },
  { clave: "excedenteNeto", titulo: "Excedente neto", etiquetas: ["EXCEDENTE NETO"], compara: true },
  { clave: "margenNeto", titulo: "Margen neto", etiquetas: ["MARGEN NETO"], porcentaje: true },
];

/** Etiqueta comparable: sin tildes, mayúsculas, sin espacios de más ni dos puntos finales. */
export function normalizarEtiqueta(texto) {
  return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/\s*\*\s*/g, "*").replace(/\s+/g, " ").replace(/[:.]+$/, "").trim();
}

/** "octubre 23 de 2026", "23 de octubre de 2026", 23/10/2026 o una fecha de Excel → { fecha: Date|null, mes: "2026-10"|null }. */
export function mesDeFecha(valor) {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return { fecha: valor, mes: `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, "0")}` };
  }
  const t = String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const nombre = Object.keys(MESES).find((m) => new RegExp(`\\b${m}\\b`).test(t));
  const anio = (t.match(/\b(20\d{2})\b/) || [])[1];
  if (nombre && anio) {
    const sinAnio = t.replace(anio, " ");
    const dia = Number((sinAnio.match(/\b(\d{1,2})\b/) || [])[1]) || 1;
    const numero = MESES[nombre];
    return { fecha: new Date(Number(anio), numero - 1, dia), mes: `${anio}-${String(numero).padStart(2, "0")}` };
  }
  const dmy = t.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (dmy) return { fecha: new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])), mes: `${dmy[3]}-${String(Number(dmy[2])).padStart(2, "0")}` };
  return { fecha: null, mes: null };
}

const numeroCelda = (celda) => {
  if (!celda) return null;
  if (typeof celda.v === "number" && Number.isFinite(celda.v)) return celda.v;
  const t = String(celda.v ?? "").replace(/[$\s]/g, "");
  if (!t) return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/**
 * Lee un libro (objeto de SheetJS) y devuelve el evento, o lanza un error con el motivo.
 * XLSX: la librería ya cargada por la app (window.XLSX).
 */
export function leerEventoBtl(libro, nombreArchivo, XLSX) {
  const hojas = libro.SheetNames || [];
  let hoja = null;
  for (const nombre of hojas) {
    const ws = libro.Sheets[nombre];
    if (!ws || !ws["!ref"]) continue;
    const r = XLSX.utils.decode_range(ws["!ref"]);
    let tiene = false;
    for (let f = r.s.r; f <= r.e.r && !tiene; f += 1) {
      for (let c = r.s.c; c <= Math.min(r.e.c, 6); c += 1) {
        const celda = ws[XLSX.utils.encode_cell({ r: f, c })];
        if (celda && normalizarEtiqueta(celda.v) === "EXCEDENTE NETO") { tiene = true; break; }
      }
    }
    if (tiene) { hoja = nombre; break; }
  }
  if (!hoja) throw new Error(`«${nombreArchivo}» no tiene una hoja con «EXCEDENTE NETO». Hojas: ${hojas.join(", ")}.`);
  const ws = libro.Sheets[hoja];
  const rango = XLSX.utils.decode_range(ws["!ref"]);
  const ref = (f, c) => XLSX.utils.encode_cell({ r: f, c });
  const celda = (f, c) => ws[ref(f, c)];
  const donde = (f, c) => `${hoja}!${ref(f, c)}`;

  // Columnas PRESUPUESTO y EJECUCIÓN por su encabezado (si no se encuentran: F y H, como el modelo).
  let colP = null, colE = null, colCant = null, filaEncabezado = null;
  for (let f = rango.s.r; f <= Math.min(rango.e.r, rango.s.r + 20) && filaEncabezado === null; f += 1) {
    for (let c = rango.s.c; c <= rango.e.c; c += 1) {
      const t = normalizarEtiqueta(celda(f, c)?.v);
      if (t.startsWith("PRESUPUESTO") && colP === null) colP = c;
      if ((t.startsWith("EJECUCION") || t === "REAL" || t.startsWith("EJECUTADO")) && colE === null) colE = c;
      if ((t.startsWith("CANTIDAD") || t.startsWith("ASISTENTES")) && colCant === null) colCant = c;
    }
    if (colP !== null && colE !== null) filaEncabezado = f;
  }
  const columnasDeducidas = filaEncabezado === null;
  if (colP === null) colP = 5;
  if (colE === null) colE = 7;
  if (colCant === null) colCant = 2;

  // Filas por etiqueta en las primeras columnas (A–D).
  const filaDe = new Map();
  for (let f = rango.s.r; f <= rango.e.r; f += 1) {
    for (let c = rango.s.c; c <= Math.min(rango.e.c, 3); c += 1) {
      const t = normalizarEtiqueta(celda(f, c)?.v);
      if (t && !filaDe.has(t)) filaDe.set(t, f);
    }
  }
  const campos = {};
  for (const campo of CAMPOS_BTL) {
    const etiqueta = campo.etiquetas.map(normalizarEtiqueta).find((e) => filaDe.has(e));
    if (!etiqueta) { campos[campo.clave] = { presupuesto: null, ejecucion: null, celdaP: null, celdaE: null }; continue; }
    const f = filaDe.get(etiqueta);
    campos[campo.clave] = {
      presupuesto: numeroCelda(celda(f, colP)), ejecucion: numeroCelda(celda(f, colE)),
      celdaP: donde(f, colP), celdaE: donde(f, colE),
    };
  }
  const filaIngresos = filaDe.get("TOTAL INGRESOS");
  let asistentes = filaIngresos === undefined ? null : numeroCelda(celda(filaIngresos, colCant));
  let celdaAsistentes = filaIngresos === undefined ? null : donde(filaIngresos, colCant);
  // Si no está junto a TOTAL INGRESOS: fila «ASISTENTES», primer número a la derecha de la etiqueta (antes de PRESUPUESTO).
  if (!asistentes && filaDe.has("ASISTENTES")) {
    const f = filaDe.get("ASISTENTES");
    for (let c = rango.s.c; c < colP; c += 1) {
      const n = normalizarEtiqueta(celda(f, c)?.v) === "ASISTENTES" ? null : numeroCelda(celda(f, c));
      if (n) { asistentes = n; celdaAsistentes = donde(f, c); break; }
    }
  }
  // Encabezado del evento: textos de la columna A antes de la fila de encabezados (o de las 10 primeras filas).
  // La fecha es el primer texto que se puede leer como fecha; el nombre y el lugar son los dos textos de arriba.
  const textos = [];
  const hasta = filaEncabezado === null ? rango.s.r + 9 : filaEncabezado - 1;
  for (let f = rango.s.r; f <= Math.min(rango.e.r, hasta); f += 1) {
    const c = celda(f, rango.s.c);
    if (c && String(c.v ?? "").trim()) textos.push({ valor: c.v, celda: donde(f, rango.s.c) });
  }
  const iFecha = textos.findIndex((t) => mesDeFecha(t.valor).mes);
  const filaFecha = iFecha >= 0 ? textos[iFecha] : null;
  const antes = iFecha >= 0 ? textos.slice(0, iFecha) : textos.slice(0, 2);
  const nombreT = antes.length >= 2 ? antes[antes.length - 2] : antes[0] || null;
  const lugarT = antes.length >= 2 ? antes[antes.length - 1] : null;
  const nombre = nombreT ? String(nombreT.valor).trim() : "";
  const fecha = filaFecha ? mesDeFecha(filaFecha.valor) : { fecha: null, mes: null };
  return {
    archivo: nombreArchivo, hoja, columnasDeducidas,
    nombre, celdaNombre: nombreT?.celda || null,
    lugar: lugarT ? String(lugarT.valor).trim() : "", celdaLugar: lugarT?.celda || null,
    fechaTexto: filaFecha ? (filaFecha.valor instanceof Date ? filaFecha.valor.toLocaleDateString("es-CO") : String(filaFecha.valor).trim()) : "",
    celdaFecha: filaFecha?.celda || null, mes: fecha.mes,
    asistentes, celdaAsistentes,
    campos,
  };
}

// ───────────── Estado: eventos importados o manuales ─────────────
let eventos = [];
let siguiente = 1;

export const obtenerEventosBtlImportados = () => eventos;

/** Datos que usa el cálculo, con su origen. */
export function valoresParaCalculo(ev) {
  const c = ev.campos || {};
  const costo = c.costos?.ejecucion ?? (c.costosFijos?.ejecucion !== null && c.costosFijos?.ejecucion !== undefined && c.costosVariables?.ejecucion !== null && c.costosVariables?.ejecucion !== undefined
    ? c.costosFijos.ejecucion + c.costosVariables.ejecucion : null);
  const costoP = c.costos?.presupuesto ?? (c.costosFijos?.presupuesto !== null && c.costosFijos?.presupuesto !== undefined && c.costosVariables?.presupuesto !== null && c.costosVariables?.presupuesto !== undefined
    ? c.costosFijos.presupuesto + c.costosVariables.presupuesto : null);
  return {
    ingreso: c.ingresos?.ejecucion ?? null, costo,
    ingresoPresupuesto: c.ingresos?.presupuesto ?? null, costoPresupuesto: costoP,
    excedenteNetoArchivo: c.excedenteNeto?.presupuesto ?? null,
    // Compatibilidad: si no se pasan los costos de Parámetros, la utilidad presupuestada es la del archivo.
    utilidadPresupuestada: c.excedenteNeto?.presupuesto ?? null,
  };
}

/**
 * v19: utilidad base presupuestada con la MISMA fórmula que la real, sobre la columna PRESUPUESTO:
 * ingresos − total costos − ICA (ingresos × tasa) − 4×1000 (costo × tasa), sin comisiones.
 * El excedente neto del archivo (que aplica el 4×1000 sobre ingresos) solo se muestra para comparar.
 */
export function utilidadBase(ingreso, costo, costos) {
  if (ingreso === null || ingreso === undefined || costo === null || costo === undefined || !costos) return null;
  return ingreso - costo - ingreso * Number(costos.ica) - costo * Number(costos.gmf);
}

export function presupuestoCalculado(ev, costos) {
  const v = valoresParaCalculo(ev);
  const calculada = utilidadBase(v.ingresoPresupuesto, v.costoPresupuesto, costos);
  return { ...v, utilidadPresupuestada: calculada ?? v.excedenteNetoArchivo, presupuestoCalculado: calculada !== null, diferenciaArchivo: calculada !== null && v.excedenteNetoArchivo !== null ? calculada - v.excedenteNetoArchivo : null };
}

/** Lo que falta para poder liquidar (se marca en amarillo y se pide). */
export function faltantes(ev) {
  const v = valoresParaCalculo(ev);
  const lista = [];
  if (!ev.nombre) lista.push("nombre del evento");
  if (!ev.mes) lista.push("mes del evento");
  if (v.ingreso === null) lista.push("total ingresos (ejecución)");
  if (v.costo === null) lista.push("total costos (ejecución)");
  if ((v.ingresoPresupuesto === null || v.costoPresupuesto === null) && v.excedenteNetoArchivo === null) lista.push("total ingresos y total costos (presupuesto)");
  if (!ev.responsable) lista.push("comercial responsable");
  return lista;
}

export function agregarEvento(datos, tipo = "archivo") {
  const ev = { id: `BTL-${siguiente}`, tipo, responsable: "", otros: [], unidoA: "", editados: [], ...datos };
  siguiente += 1;
  eventos.push(ev);
  return ev;
}

export function quitarEvento(id) { eventos = eventos.filter((ev) => ev.id !== id); }

export function eventoVacio() {
  const campos = {};
  CAMPOS_BTL.forEach((campo) => { campos[campo.clave] = { presupuesto: null, ejecucion: null, celdaP: null, celdaE: null }; });
  return { archivo: "", hoja: "", nombre: "", lugar: "", fechaTexto: "", mes: null, asistentes: null, campos };
}

/** Clave del evento en la app: la del evento de Producción al que se unió, o una propia. */
export function claveEventoApp(ev) {
  return ev.unidoA || `${ev.tipo === "manual" ? "MANUAL" : "ARCHIVO"} ${ev.id.replace("BTL-", "")}`;
}

export function textoOrigen(ev) {
  if (ev.tipo === "manual") return "Ingresado a mano";
  return `Archivo ${ev.archivo}${ev.hoja ? ` (hoja ${ev.hoja})` : ""}${ev.editados?.length ? " · con valores editados a mano" : ""}`;
}

const clave = (t) => String(t ?? "").trim().toUpperCase().replace(/\s+/g, " ");

/** Reparto en % (5.12): {nombre: fracción}. Sin datos: el responsable al 100 %. */
export function repartoDe(ev) {
  const mapa = ev.reparto || {};
  const nombres = [ev.responsable, ...(ev.otros || [])].filter(Boolean);
  if (!ev.responsable) return [];
  const conDato = nombres.filter((n) => Number(mapa[n]) > 0);
  if (!conDato.length) return [{ comercial: ev.responsable, porcentaje: 1 }];
  return conDato.map((n) => ({ comercial: n, porcentaje: Number(mapa[n]) }));
}

/**
 * Une los eventos de Producción con los importados/manuales.
 * - Unido a un # de Producción: ese evento toma ingreso, costo y utilidad presupuestada del archivo (y el comercial si se eligió).
 * - Sin unir: se agrega como evento BTL propio (grupo «BTL»), del mes asignado.
 */
export function unirEventos(base, mesActual, marcaBtl = "BTL", costos = null) {
  const lista = base.map((ev) => ({ ...ev }));
  for (const ev of eventos) {
    const v = costos ? presupuestoCalculado(ev, costos) : valoresParaCalculo(ev);
    const origenBtl = { tipo: ev.tipo, texto: textoOrigen(ev), archivo: ev.archivo || "", hoja: ev.hoja || "", id: ev.id, otros: ev.otros || [] };
    const delMes = Boolean(ev.mes) && ev.mes === mesActual;
    const comun = {
      ingreso: v.ingreso, costo: v.costo, utilidadPresupuestada: v.utilidadPresupuestada,
      presupuestoBtl: { ingreso: v.ingresoPresupuesto, costo: v.costoPresupuesto, calculado: Boolean(v.presupuestoCalculado), excedenteNetoArchivo: v.excedenteNetoArchivo, diferenciaArchivo: v.diferenciaArchivo ?? null },
      reparto: repartoDe(ev), repartoAprobado: Boolean(ev.repartoAprobado),
      detalle: [ev.nombre, ev.lugar].filter(Boolean).join(" · "), origenBtl, mesBtl: ev.mes,
    };
    if (ev.unidoA) {
      const i = lista.findIndex((x) => clave(x.evento) === clave(ev.unidoA));
      if (i >= 0) {
        lista[i] = { ...lista[i], ...comun, comercial: ev.responsable || lista[i].comercial, delMes: lista[i].delMes || delMes };
        continue;
      }
    }
    lista.push({ evento: claveEventoApp(ev), grupo: marcaBtl.toUpperCase(), producto: ev.nombre || "Evento BTL", comercial: ev.responsable || "", delMes, facturas: [], ...comun });
  }
  return lista;
}

/**
 * Deja en parametros.btl.eventos una fila por evento importado del mes con comercial (referencia).
 * La comisión BTL del esquema anterior ya no se calcula desde aquí: usa archivo / Producción en calculos.js.
 */
export function sincronizarParametrosBtl(p, mesActual) {
  p.btl = p.btl || {};
  const lista = (p.btl.eventos || []).filter((x) => !x.deImportacion);
  for (const ev of eventos) {
    if (!ev.responsable || ev.mes !== mesActual) continue;
    const id = claveEventoApp(ev);
    const ingreso = valoresParaCalculo(ev).ingreso;
    const existente = lista.find((x) => clave(x.evento) === clave(id));
    // Si Parámetros ya trae una fila para ese evento, se respeta (no se modifica).
    if (!existente) lista.push({ evento: id, comercial: ev.responsable, ingresoEjecucion: ingreso, deImportacion: true });
  }
  p.btl.eventos = lista;
}
