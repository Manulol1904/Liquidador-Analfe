// Prueba: genera el libro de OTRO comercial desde la misma plantilla (forma de Hernando)
import fs from "fs"; import JSZip from "jszip";
import * as M from "/workspace/entregables/excel_individual/motor_excel_individual.js";
const OBJ = process.argv[2]; const conBTL = OBJ === "Hernando";
const LISTA = ["Carolina","Consuelo","Hernando","Leidy","Lynette","Oriette","Tatiana"]; // orden alfabético del equipo
const otros = LISTA.filter(n => n !== OBJ); const p = LISTA.indexOf(OBJ) + 1; // posición del comercial en las listas
const FICHAS = ["COMA","COMB","COMC","COMD","COME","COMF"];
const POS_PLANTILLA = { COMA:1, COMB:2, COMSEL:3, COMC:4, COMD:5, COME:6, COMF:7 }; // forma de la plantilla
const posNueva = (t) => t === "COMSEL" ? p : (() => { const j = FICHAS.indexOf(t) + 1; return j < p ? j : j + 1; })();
const datos = JSON.parse(fs.readFileSync(`datos_${OBJ.toLowerCase()}.json  /* datos de prueba (locales, no incluidos) */`, "utf8"));
const lib = await M.abrirPlantilla(fs.readFileSync("/workspace/entregables/excel_individual/plantilla_liquidacion_individual.xlsx"), JSZip);

// (b) re-apuntar los nombres de las listas de 7 comerciales en Escenarios
const nombres = M.leerNombres(lib); const familias = {};
for (const [n, ref] of Object.entries(nombres)) {
  const m = /(?<![A-Za-z])(COMSEL|COM[A-F])(?![A-Za-z])/.exec(n); if (!m) continue;
  const fam = n.replace(m[1], "*"); (familias[fam] ||= {})[m[1]] = ref;
}
const filasLista = new Set();
for (const [fam, miembros] of Object.entries(familias)) {
  if (!miembros.COMA || !/^Escenarios!\$[A-Z]+\$\d+$/.test(miembros.COMA)) continue;
  const inicio = Number(/\d+$/.exec(miembros.COMA)[0]) - (POS_PLANTILLA.COMA - 1);
  filasLista.add(inicio);
  for (const [t, ref] of Object.entries(miembros)) {
    if (!/^Escenarios!\$[A-Z]+\$\d+$/.test(ref)) continue;
    const fila = Number(/\d+$/.exec(ref)[0]);
    if (fila - inicio + 1 !== POS_PLANTILLA[t]) continue; // no pertenece a la lista
    M.definirNombre(lib, fam.replace("*", t), ref.replace(/\d+$/, String(inicio + posNueva(t) - 1)));
  }
}
// (c) celdas propias de la fila del comercial dentro de cada lista (p. ej. =INN_oferta_COMSEL):
// se mueven a la fila de su nueva posición; la fila vieja recibe el patrón de las demás filas.
for (const inicio of filasLista) {
  const filaVieja = inicio + POS_PLANTILLA.COMSEL - 1, filaNueva = inicio + p - 1, filaOtro = inicio; // COMA = fila de referencia
  if (filaVieja === filaNueva) continue;
  for (const col of "ABCDEFGHIJKLMNOP") { // estilos propios (celdas amarillas de la fila del comercial)
    const sP = M.leerEstilo(lib, "Escenarios", col + filaVieja), sO = M.leerEstilo(lib, "Escenarios", col + filaOtro);
    if (sP !== null && sO !== null && sP !== sO) { M.ponerEstilo(lib, "Escenarios", col + filaNueva, sP); M.ponerEstilo(lib, "Escenarios", col + filaVieja, sO); }
  }
  for (const col of "ABCDEFGHIJKLMNOP") {
    const propia = M.leerCelda(lib, "Escenarios", col + filaVieja);
    const otra = M.leerCelda(lib, "Escenarios", col + filaOtro);
    const fP = propia && propia.formula, fO = otra && otra.formula;
    if (!fP) continue;
    if (fO && M.copiarFormula(fO.slice(1), filaVieja - filaOtro) === fP.slice(1)) continue; // columna genérica
    // la fila nueva pasa a ser la propia; la vieja toma el patrón de las otras filas
    M.escribirFormula(lib, "Escenarios", col + filaNueva, M.copiarFormula(fP.slice(1), filaNueva - filaVieja));
    if (fO) M.escribirFormula(lib, "Escenarios", col + filaVieja, M.copiarFormula(fO.slice(1), filaVieja - filaOtro));
    else M.escribirCelda(lib, "Escenarios", col + filaVieja, null, { sobreFormula: true });
  }
}
// fichas → nombres cortos
const fichas = { COMSEL: OBJ, COMDIR: "Diana" }; otros.forEach((n, i) => fichas[FICHAS[i]] = n);
M.reemplazarFichas(lib, fichas);
// (d) bloque BTL de la política anterior solo si el comercial tiene BTL
if (!conBTL) {
  // entradas BTL resaltadas solo para el dueño del evento BTL
  for (const ref of ["B84","B85","B133","B134","B135"]) M.ponerEstilo(lib, "Escenarios", ref, M.estiloConRelleno(lib, M.leerEstilo(lib, "Escenarios", ref), "FFFFF2CC"));
  M.ponerEstilo(lib, "Comisión anterior", "T5", M.estiloConRelleno(lib, M.leerEstilo(lib, "Comisión anterior", "T5"), null));
  M.eliminarFilas(lib, "Escenarios", 96, 4);
  for (const [n, ref] of Object.entries(M.leerNombres(lib))) if (ref.includes("#REF!")) M.eliminarNombre(lib, n);
}
// (e) tablas al tamaño del comercial
const T = JSON.parse(process.argv[3]);
M.redimensionarTabla(lib, "_Datos", 2, 45, T.datos);
M.redimensionarTabla(lib, "Facturas", 5, 41, T.facturas);
M.redimensionarTabla(lib, "Márgenes eventos", 5, 16, T.margenes);
M.redimensionarTabla(lib, "Base social", 26, 126, T.base);
M.redimensionarTabla(lib, "Especiales auxiliar", 3, 5, T.especiales);
// (f) datos
for (const c of datos.celdas) M.escribirCelda(lib, c.hoja, c.ref, c.valor, { sobreFormula: true });
// fórmulas-dato (enlaces que dependen de los datos), si se pasan
if (process.argv[4]) {
  const fd = JSON.parse(fs.readFileSync(process.argv[4], "utf8")); const conLink = new Set(fd.map(c => c.ref));
  for (let r = 2; r <= 1 + T.datos; r++) for (const col of ["M","V","AF","AG"]) if (!conLink.has(col + r)) M.escribirCelda(lib, "_Datos", col + r, null, { sobreFormula: true });
}
if (process.argv[4]) for (const c of JSON.parse(fs.readFileSync(process.argv[4], "utf8"))) M.escribirFormula(lib, c.hoja, c.ref, c.formula);
fs.writeFileSync(`gen_${OBJ}.xlsx`, await M.guardar(lib));
console.log("ok", OBJ);
