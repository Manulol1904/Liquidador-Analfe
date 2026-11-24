/**
 * Descarga el resultado en Excel. No envía los datos a internet.
 */

import { avisoBreve, nombreEsquema, nombreVisible } from "./utilidades.js";
import { obtenerParametros } from "./parametros.js";

function pesos(valor) {
  if (valor === null || valor === undefined || valor === "") return valor;
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero) : valor;
}

function scoreDos(valor) {
  if (valor === null || valor === undefined || valor === "") return valor;
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero * 100) / 100 : valor;
}

function fila(resultado) {
  return {
    Comercial: resultado.nombre,
    Score: scoreDos(resultado.score),
    Factor: resultado.factor,
    "Política nueva": pesos(resultado.pagoNuevo),
    "Esquema anterior": pesos(resultado.pagoAnterior),
    "Esquema que aplica": nombreEsquema(resultado.transicion.esquema),
    "Valor a pagar": pesos(resultado.transicion.pagada),
    Faltantes: nombreVisible(resultado.faltantes.join(", ")),
  };
}

function conAviso(filas) {
  const hoja = window.XLSX.utils.aoa_to_sheet([["Simulación. No es un pago oficial."]]);
  window.XLSX.utils.sheet_add_json(hoja, filas, { origin: "A3" });
  return hoja;
}

/** Recibe la liquidación del mes y dispara la descarga. */
export function exportarResultado(liquidacion, mes) {
  if (!window.XLSX) {
    window.alert("No cargó la librería de Excel.");
    return;
  }
  const libro = window.XLSX.utils.book_new();
  const equipo = conAviso(liquidacion.resultados.map(fila));
  const director = liquidacion.director;
  const metodo = obtenerParametros().director.metodo;
  const nombresMetodo = {
    totales: "Totales del equipo",
    promedio: "Promedio simple",
    ponderado: "Promedio ponderado por meta",
  };
  const hojaDirector = conAviso([
    { Método: "Totales del equipo", Score: scoreDos(director.totales?.score), Pago: pesos(director.totales?.pago) },
    { Método: "Promedio simple", Score: scoreDos(director.promedio?.score), Pago: pesos(director.promedio?.pago) },
    { Método: "Promedio ponderado", Score: scoreDos(director.ponderado?.score), Pago: pesos(director.ponderado?.pago) },
    { Método: `Método usado: ${nombresMetodo[metodo] || metodo}`, Score: scoreDos(director.elegido?.score), Pago: pesos(director.elegido?.pago) },
    { Método: "Anterior sin BTL", Score: "", Pago: pesos(director.pagoAnterior) },
    { Método: "BTL anterior (aparte)", Score: "", Pago: pesos(director.btlAnterior) },
    { Método: "A pagar", Score: "", Pago: pesos(director.transicion.pagada) },
  ]);
  const btl = conAviso(liquidacion.btl.map((item) => ({
    Evento: item.evento.evento,
    Comercial: item.responsable,
    Utilidad: pesos(item.utilidad),
    Margen: item.margen,
    Cumplimiento: item.cumplimiento,
    "Pago comercial": pesos(item.pagoComercial),
    "Pago director": pesos(item.pagoDirector),
    Estado: item.estado,
    Nota: item.motivo,
  })));
  window.XLSX.utils.book_append_sheet(libro, equipo, "Equipo");
  window.XLSX.utils.book_append_sheet(libro, hojaDirector, "Director");
  window.XLSX.utils.book_append_sheet(libro, btl, "BTL");
  liquidacion.resultados.forEach((resultado) => {
    window.XLSX.utils.book_append_sheet(libro, hojaFicha(resultado, mes), nombreHoja(resultado.nombre));
  });
  window.XLSX.writeFile(libro, `liquidacion_${mes}.xlsx`);
  avisoBreve(`Excel descargado: liquidacion_${mes}.xlsx`);
}

function nombreHoja(nombre) {
  const limpio = String(nombre || "Ficha").replace(/[\\/?*[\]:]/g, "").slice(0, 31);
  return limpio || "Ficha";
}

function hojaFicha(resultado, mes) {
  const comercial = resultado.comercial;
  const imr = comercial.basico === null || comercial.oportunidad === null ? null : comercial.basico + comercial.oportunidad;
  const tope = obtenerParametros().topeIndicador;
  const maximo = imr === null ? null : comercial.basico + tope * comercial.oportunidad;
  const edu = resultado.eduAt || {};
  const mision = resultado.mision || {};
  const filas = [
    ["Simulación. No es un pago oficial."],
    ["Trabajador", resultado.nombre],
    ["Mes", mes],
    ["Salario base", pesos(comercial.basico)],
    ["Ingreso objetivo (IMR) mensual", pesos(imr)],
    ["Ingreso máximo mensual", pesos(maximo)],
    ...(comercial.documento ? [["Documento de identidad", comercial.documento]] : []),
    ...(comercial.cargo ? [["Cargo, nivel y regional", comercial.cargo]] : []),
    [],
    ["5.8 Resultado"],
    ["Score", scoreDos(resultado.score)],
    ["Factor", resultado.factor],
    ["Política nueva", pesos(resultado.pagoNuevo)],
    ["Esquema anterior", pesos(resultado.pagoAnterior)],
    ["Esquema que aplica", nombreEsquema(resultado.transicion.esquema)],
    ["Valor a pagar", pesos(resultado.transicion.pagada)],
    ["Indicador", "Puntos"],
    ["Ventas", scoreDos(resultado.puntos.ventas)],
    ["Base social", scoreDos(resultado.puntos.baseSocial)],
    ["SERFISCAL", scoreDos(resultado.puntos.serfiscal)],
    ["Innovación", scoreDos(resultado.puntos.innovacion)],
    ["Satisfacción", scoreDos(resultado.puntos.satisfaccion)],
    [],
    ["1. Política anterior"],
    ["Meta mensual", pesos(resultado.anteriorTramos?.meta)],
    ["Producción", pesos(resultado.anteriorTramos?.produccion)],
    ["Producción del archivo", pesos(resultado.anteriorTramos?.produccionArchivo)],
    ["Producción manual", resultado.anteriorTramos?.manual ? "Sí" : "No"],
    ["Cumplimiento", resultado.anteriorTramos?.cumplimiento],
    ["Tasa aplicada", resultado.anteriorTramos?.tasa],
    ["Comisión anterior", pesos(resultado.pagoAnterior)],
    ["Factura", "Cliente", "Cuenta", "Base"],
    ...(resultado.anteriorTramos?.lineas || []).map((fila) => [fila.factura, fila.cliente, fila.cuenta, pesos(fila.base)]),
    ["Misión anterior facturas", resultado.misionAnterior?.facturas || 0],
    ["Misión anterior valor", pesos(resultado.misionAnterior?.valorTotal)],
    ["BTL anterior ingreso", pesos(resultado.ingresoBtlAnterior)],
    ["BTL anterior comisión", pesos(resultado.btlAnterior)],
    [],
    ["2. Política nueva · 5.4"],
    ["Edu/AT recaudada", pesos(edu.ventaRecaudada)],
    ["Edu/AT reconocida", pesos(edu.ventaReconocida)],
    ["Margen comprobado", edu.margenComprobado],
    ["Factor de reconocimiento", edu.factorReconocimiento],
    ["Misión facturas", mision.facturas],
    ["Misión valor real", pesos(mision.valorReal)],
    ["Misión venta reconocida", pesos(mision.ventaReconocida)],
    ["Cumplimiento ponderado", resultado.cumplimientoPonderado],
    ["Puntos de ventas", scoreDos(resultado.puntos.ventas)],
    [],
    ["5.5 Base social"],
    ["Cierre", resultado.baseSocial.cierre],
    ["Meta", resultado.baseSocial.meta],
    ["Puntos", scoreDos(resultado.puntos.baseSocial)],
    ["Nota", resultado.baseSocial.nota || ""],
    [],
    ["5.6 y 5.7"],
    ["Puntos SERFISCAL", scoreDos(resultado.puntos.serfiscal)],
    ["Puntos innovación", scoreDos(resultado.puntos.innovacion)],
    ["Puntos satisfacción", scoreDos(resultado.puntos.satisfaccion)],
    [],
    ["3. Comparativo y transición"],
    ["Diferencia", pesos(resultado.diferencia)],
    ["Básico contractual", pesos(comercial.basico)],
    ["Básico + transición", comercial.basico === null || resultado.transicion.pagada === null ? null : pesos(comercial.basico + resultado.transicion.pagada)],
    [],
    ["5.11.5 Bonificación BTL"],
    ["Evento", "Ingreso", "Utilidad", "Cumplimiento", "Margen", "Porcentaje", "Comisión", "Motivo"],
    ...(resultado.btlMes || []).map((item) => [item.evento.evento, pesos(item.evento.ingreso), pesos(item.utilidad), item.cumplimiento, item.margen, item.porcentajeComercial, pesos(item.pagoComercial), item.motivoComercial]),
    [],
    ["Márgenes de sus eventos"],
    ["#", "Evento", "Facturas", "Ingreso", "Costo", "ICA", "GMF", "Costo total", "Margen", "Banda"],
    ...(resultado.margenesEventos || []).map((item) => [item.numero, item.evento, (item.facturas || []).join(", "), pesos(item.ingreso), pesos(item.costo), pesos(item.ica), pesos(item.gmf), pesos(item.costoTotal), item.margen, item.banda]),
    [],
    ["Facturas del mes"],
    ["Factura", "Hoja", "Uso", "Producto", "Cuenta", "Evento", "Base", "Estado", "Elegible", "Recaudo", "Factor", "Venta reconocida"],
    ...(resultado.detalleFacturas || []).map((fila) => [fila.factura, fila.origen, fila.uso, fila.producto, fila.cuenta, fila.evento, pesos(fila.base), fila.estado, fila.elegible ? "Sí" : "No", pesos(fila.recaudo), fila.factorAplicado, pesos(fila.ventaReconocida)]),
  ];
  return window.XLSX.utils.aoa_to_sheet(filas);
}
