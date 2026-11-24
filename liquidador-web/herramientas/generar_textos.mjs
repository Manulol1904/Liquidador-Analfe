import fs from "fs";

const textos = JSON.parse(fs.readFileSync(new URL("../plantillas/textos_con_marcadores.json", import.meta.url), "utf8"));
const nombreFn = (hoja, ref) => "texto_" + `${hoja}_${ref}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_]/g, "_");
const lineas = [];
lineas.push("/** Un texto por celda marcada. Las cifras salen del contexto de la liquidación, no de este archivo. */");
lineas.push("const PLANTILLAS = {");
for (const item of textos.textos) {
  lineas.push(`  ${JSON.stringify(`${item.hoja}!${item.ref}`)}: ${JSON.stringify(item.texto_con_marcadores)},`);
}
lineas.push("};");
lineas.push(`
function rellenar(plantilla, valores) {
  let i = 0;
  return String(plantilla).replace(/\\{(\\w+)\\}/g, () => {
    const valor = valores[i];
    i += 1;
    return valor === null || valor === undefined ? "" : String(valor);
  });
}

function dinero(valor) {
  if (valor === null || valor === undefined || valor === "" || Number.isNaN(Number(valor))) return "";
  return "$ " + Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

function porc(valor) {
  if (valor === null || valor === undefined || valor === "" || Number.isNaN(Number(valor))) return "";
  return (Number(valor) * 100).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %";
}

function bolsas(ctx) {
  const p = ctx.parametros || {};
  const tramo = ctx.resultado?.anteriorTramos || {};
  const nombres = (ctx.equipo || []).map((item) => item.nombre);
  return {
    persona: [...nombres, ctx.fuera, ctx.director, ctx.nombre].filter(Boolean),
    valor_pesos: [p.cultural?.valorCarton, p.mision?.valorFacturaNueva, p.mision?.valorFacturaAnterior, tramo.meta, tramo.produccion, tramo.comision, ctx.resultado?.pagoNuevo, ctx.ingresoBtl, ctx.comisionBtl, ctx.baseSocial, p.director?.metaMisionEquipo].map(dinero).filter(Boolean),
    porcentaje: [p.anterior?.tasaBtl, p.director?.tasaBtlAnterior, p.anterior?.minimo, p.costos?.ica, p.costos?.gmf, tramo.tasa, tramo.cumplimiento, p.margen?.umbralBajo, p.margen?.umbralAlto].map(porc).filter(Boolean),
    numero: [ctx.anio, ctx.mesNumero, (ctx.equipo || []).length, p.anticipos?.prefijoCuenta, p.cultural?.mes, ctx.version].filter((valor) => valor !== undefined && valor !== null && valor !== "").map(String),
    cliente: [ctx.eventoBtl?.detalle, ctx.eventoBtl?.producto, ctx.eventoBtl?.evento].filter(Boolean),
  };
}

function filaEquipo(ctx, fila, desde, hasta) {
  if (fila < desde || fila > hasta) return null;
  return [(ctx.equipo || [])[fila - desde]?.nombre || ""];
}

export function valoresTexto(ctx, hoja, ref) {
  const fila = Number(String(ref).replace(/\\D/g, "")) || 0;
  const col = String(ref).replace(/\\d/g, "");
  if (hoja === "Escenarios" && col === "A") {
    const tramo = filaEquipo(ctx, fila, 122, 128) || filaEquipo(ctx, fila, 148, 154) || filaEquipo(ctx, fila, 166, 172) || filaEquipo(ctx, fila, 177, 183) || filaEquipo(ctx, fila, 192, 198);
    if (tramo) return tramo;
    if (fila === 184) return [ctx.director || ""];
  }
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    return [...(ctx.equipo || []).map((item) => item.nombre), ctx.fuera || ctx.director || ""];
  }
  const plantilla = String(PLANTILLAS[hoja + "!" + ref] || "").replaceAll("v6.7", ctx.version || "");
  const marcas = [...plantilla.matchAll(/\\{(\\w+)\\}/g)].map((marca) => marca[1]);
  if (marcas.length === 1 && marcas[0] === "numero") return [ctx.anio];
  if (marcas.length === 1 && marcas[0] === "persona") return [ctx.nombre || ""];
  const bolsa = bolsas(ctx);
  const uso = {};
  return marcas.map((tipo) => {
    const lista = bolsa[tipo] || [];
    const indice = uso[tipo] || 0;
    uso[tipo] = indice + 1;
    return lista[indice] ?? "";
  });
}
`);
for (const item of textos.textos) {
  const nombre = nombreFn(item.hoja, item.ref);
  const id = JSON.stringify(`${item.hoja}!${item.ref}`);
  lineas.push(`export function ${nombre}(ctx) {`);
  lineas.push(`  const hoja = ${JSON.stringify(item.hoja)};`);
  lineas.push(`  const ref = ${JSON.stringify(item.ref)};`);
  lineas.push(`  const crudo = PLANTILLAS[${id}] || "";`);
  lineas.push(`  if (ref === "A6" && hoja.startsWith("Explicaci")) {`);
  lineas.push(`    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);`);
  lineas.push(`    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");`);
  lineas.push(`    const fuera = ctx.fuera || "Quien no liquida";`);
  lineas.push(`    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";`);
  lineas.push(`  }`);
  lineas.push(`  const valores = valoresTexto(ctx, hoja, ref);`);
  lineas.push(`  const marcas = crudo.match(/\\{persona\\}/g) || [];`);
  lineas.push(`  if (marcas.length === 1 && /\\{persona\\}\\s+\\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";`);
  lineas.push(`  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);`);
  lineas.push("}");
  lineas.push("");
}
lineas.push("export const TEXTOS = {");
for (const item of textos.textos) {
  lineas.push(`  ${JSON.stringify(`${item.hoja}!${item.ref}`)}: ${nombreFn(item.hoja, item.ref)},`);
}
lineas.push("};");
lineas.push("");
lineas.push("export function textoDe(ctx, hoja, ref) {");
lineas.push("  const funcion = TEXTOS[`${hoja}!${ref}`];");
lineas.push("  return funcion ? funcion(ctx) : \"\";");
lineas.push("}");
lineas.push("");
const destino = new URL("../js/excel/textosExcel.js", import.meta.url);
fs.writeFileSync(destino, lineas.join("\n"));
console.log("textos", textos.textos.length);
