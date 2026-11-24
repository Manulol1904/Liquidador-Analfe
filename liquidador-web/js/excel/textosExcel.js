/** Un texto por celda marcada. Las cifras salen del contexto de la liquidación, no de este archivo. */
const PLANTILLAS = {
  "Liquidación!A1": "ANALFE  –  Liquidación de Compensación Variable  –  Octubre {numero}",
  "Liquidación!C3": "{persona}",
  "Liquidación!C4": "{numero}",
  "Explicación!A1": "ANALFE  –  Explicación de la liquidación  –  Octubre {numero}  ·  v6.7",
  "Explicación!A2": "Política PCV-COM-001 (25 de septiembre de {numero})  ·  Circular al equipo comercial (19 de octubre de {numero})",
  "Explicación!A5": "Este archivo es una simulación de la liquidación de compensación variable de octubre de {numero}, bajo la política nueva PCV-COM-001, comparada con el esquema anterior. Lo elabora el área como un MVP para revisar cifras, supuestos y reglas con la Dirección. No constituye una liquidación oficial de pago: ninguna cifra de este archivo autoriza, por sí sola, un desembolso. Los parámetros son editables en la hoja Escenarios.",
  "Explicación!A6": "El ejercicio cubre a los siete comerciales activos ({persona}, {persona}, {persona}, {persona}, {persona}, {persona} y {persona}). {persona} aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.",
  "Explicación!A23": "Congreso Nacional y Actividad cultural no tienen meta en octubre (el Congreso se fasea en mayo–julio, núm. 5.11.2; la actividad cultural está asignada a diciembre, núm. 5.11.4). Por eso en octubre aparecen en cero: meta, venta, peso y cumplimiento, y no mueven el puntaje de este mes. Para diciembre ya quedó cargada la meta individual de la actividad cultural: la cuota de cartones de cada comercial multiplicada por {valor_pesos} (valor por cartón editable en Escenarios). {persona}, {persona}, {persona} y {persona} tienen 860 cartones ({valor_pesos}); {persona}, {persona} y {persona}, 425 cartones ({valor_pesos}). {persona} (860) y Dirección Comercial (425) aparecen en esa tabla solo como referencia; no liquidan en este archivo de octubre. También quedaron cargadas las metas oficiales de educación y asistencia técnica de noviembre y diciembre; tampoco entran al cálculo de octubre.",
  "Explicación!A26": "La política (numeral 5.11.3) reparte la meta anual {porcentaje} en agosto, {porcentaje} en septiembre y {porcentaje} en octubre. La meta anual del equipo es {valor_pesos} Por instrucción de jefatura, la meta de cada comercial en octubre es {valor_pesos} y cada factura elegible se toma por su valor completo de {valor_pesos} (no por el {valor_pesos} del esquema anterior). Ambos parámetros se pueden ajustar en Escenarios.",
  "Explicación!A27": "La venta reconocida de Misión es el número de facturas elegibles (canceladas, con fecha de pago en octubre) multiplicado por {valor_pesos} En octubre, las facturas elegibles son: {persona} 3, {persona} 1, {persona} 1, {persona} 1 y {persona} 1; {persona} y {persona} no tienen facturas elegibles. Las facturas no canceladas o pagadas fuera de octubre no entran a la venta reconocida. El cumplimiento es la venta reconocida dividida por {valor_pesos}",
  "Explicación!A31": "En el esquema anterior, cada factura de Misión se reconocía a {valor_pesos} con independencia de su valor real. En la columna de política anterior hay un bloque propio, análogo al de BTL, con tres datos: Valor {valor_pesos} Facturas (el mismo número de facturas elegibles) y Valor total = Valor × Facturas. Ese valor total no alimenta los 45 puntos de la política nueva.",
  "Explicación!A57": "El ingreso del evento que se muestra es la ejecución completa, {valor_pesos} y no el recaudo parcial de octubre ({valor_pesos}). Esa es la cifra que pidió usar la jefatura, tomada del informe de ejecución del evento {cliente}, y es también la base de la comisión del esquema anterior.",
  "Explicación!A58": "La comisión del esquema anterior es {valor_pesos} equivalente al {porcentaje} de {valor_pesos} Se muestra en el bloque de política anterior y en el comparativo. No se suma automáticamente a la comisión ordinaria de ventas del esquema anterior (en el caso de {persona}, {valor_pesos}) que alimenta la transición «más favorable»: esa transición sigue comparando solo la comisión ordinaria. Si se quiere incluir el BTL anterior en esa comparación, hay un control en Escenarios para hacerlo.",
  "Explicación!A59": "La comisión de la política nueva, calculada con la metodología de ANALFE (ingreso menos costo, menos ICA y GMF, sin comisiones), queda en {valor_pesos} que es el tope de 0,8 veces el ingreso mensual de referencia de {persona}. La utilidad real es {valor_pesos} y la presupuestada {valor_pesos} (cumplimiento {porcentaje}, margen {porcentaje}, liquidador {porcentaje}). Del tope anual se descuenta lo ya pagado por la Fiesta FEBOR ({valor_pesos}). Siguen pendientes la constancia formal de participación material, el cierre financiero certificado y la satisfacción del cliente. El supuesto de esta simulación es que {persona} participó, porque es el comercial asignado al evento.",
  "Explicación!A67": "Siguen abiertos, y están marcados como tales: las rúbricas y evidencias de SERFISCAL, innovación y satisfacción; la constancia formal de participación material en el BTL, el cierre financiero certificado y la satisfacción del cliente del evento; el básico y la oportunidad del Director Comercial, para completar su línea de BTL; y la confirmación, si la jefatura la quiere revisar, de la meta individual de Misión ({valor_pesos} para cada comercial) frente a la meta de equipo. También queda por confirmar si la meta cultural de equipo de {valor_pesos} debe igualarse a la suma de las cuotas individuales (cartones × {valor_pesos} = {valor_pesos} con {numero} cartones).",
  "Explicación!A69": "Simulación. No es un pago oficial.  ·  12 de noviembre de {numero}.",
  "Escenarios!A1": "ANALFE  –  Parámetros de liquidación  –  Octubre {numero}",
  "Escenarios!B51": "{numero}",
  "Escenarios!C57": "Meta anual de Misión internacional según el Anexo 2 ({valor_pesos}). La meta individual de cada comercial en octubre es el parámetro Meta_Mision_individual ({valor_pesos}), por instrucción de jefatura; no es el {porcentaje} anual prorrateado entre el equipo.",
  "Escenarios!D57": "Anexo 2; instrucción de jefatura, octubre {numero}",
  "Escenarios!C58": "{porcentaje} de la meta anual (núm. 5.11.3: {porcentaje} agosto, {porcentaje} septiembre, {porcentaje} octubre). Es la cifra de referencia del equipo. La meta que entra al cumplimiento de cada comercial es Meta_Mision_individual ({valor_pesos}).",
  "Escenarios!C62": "Valor reconocido por cada factura de Misión internacional elegible (cancelada con pago en el mes). Instrucción de jefatura para la política nueva: {valor_pesos} (el valor real de las facturas elegibles de octubre coincide con esta cifra). Editable.",
  "Escenarios!D62": "Instrucción de jefatura, octubre {numero}; núm. 5.11.3",
  "Escenarios!C83": "Utilidad base esperada del presupuesto aprobado, metodología ANALFE (ingreso − costo − ICA {porcentaje} − GMF 4/{numero} del costo, sin comisiones).",
  "Escenarios!C86": "Supuesto de simulación: SI, porque {persona} es el comercial asignado al evento 575. Falta la constancia formal de participación material (núm. 5.11.5). Editable.",
  "Escenarios!D97": "Facturación {porcentaje} · FEC {numero}, {numero}, {numero} y {numero}",
  "Escenarios!D99": "Fiesta {cliente} / {cliente}",
  "Escenarios!A111": "{persona}",
  "Escenarios!C115": "La meta individual de octubre es {valor_pesos} para cada comercial (instrucción de jefatura). Está cargada en el override de cuota, que tiene prioridad sobre el criterio proporcional a META 5. Si se borra el override, vuelve el criterio de esta fila.",
  "Escenarios!D115": "Instrucción de jefatura, octubre {numero}",
  "Escenarios!C116": "Número de comerciales activos que liquidan en octubre (excluye a {persona}, retirado, y a Dirección).",
  "Escenarios!A122": "{persona}",
  "Escenarios!A123": "{persona}",
  "Escenarios!A124": "{persona}",
  "Escenarios!A125": "{persona}",
  "Escenarios!A126": "{persona}",
  "Escenarios!A127": "{persona}",
  "Escenarios!A128": "{persona}",
  "Escenarios!A130": "v6.3: la venta de Misión de la política nueva se reconoce a {valor_pesos} por factura elegible (Base_Mision_factura) y la meta de cada comercial en octubre es {valor_pesos} (Meta_Mision_individual). Las facturas elegibles de octubre tienen exactamente ese valor de {valor_pesos}; las no canceladas o pagadas fuera de octubre no entran. Los pesos del núm. 5.4 son meta del producto ÷ suma de metas del mes con meta mayor que cero (Congreso y Cultural quedan en cero en octubre). En la política anterior, Misión se cuenta a {valor_pesos} por factura.",
  "Escenarios!A132": "Parámetros de liquidación BTL {cliente} (núm. 5.11.5)",
  "Escenarios!C133": "Presupuesto {numero} del archivo {cliente} (F10), 900 asistentes. Editable.",
  "Escenarios!D133": "Archivo {cliente} {numero}, F10",
  "Escenarios!C134": "Total costos presupuestados del archivo {cliente} (F41 = costos fijos + variables), sin comisiones.",
  "Escenarios!D134": "Archivo {cliente} {numero}, F41",
  "Escenarios!C135": "Comisión directa de la Fiesta FEBOR, nómina del 15 de octubre de {numero}. Se descuenta del tope anual 2 × IMR del comercial que liquida el evento. Editable si el acumulado es otro.",
  "Escenarios!D135": "Nómina 15-oct-{numero}, Fiesta FEBOR",
  "Escenarios!A136": "La utilidad presupuestada (B83) se calcula con la metodología ANALFE: ingreso presupuestado − costo presupuestado − ICA (ingreso × Tasa_ICA) − GMF (costo × Tasa_GMF), sin restar comisiones. La utilidad real (B84) y el margen (B85) salen del evento 575 en _Margenes_especiales (costo del informe de eventos, {valor_pesos}). Los excedentes F54 ({valor_pesos}) y H54 ({valor_pesos}) del archivo {cliente} no se usan para liquidar: aplican GMF sobre el ingreso, ICA a 9,66/{numero} y un costo de ejecución {valor_pesos} mayor (la producción de H15 parece sumar dos veces FE51 de Pika).",
  "Escenarios!D139": "Instrucción de jefatura, octubre {numero}",
  "Escenarios!A142": "Ingreso de ejecución del evento BTL ({cliente})",
  "Escenarios!C142": "Ejecución de ingresos del archivo {cliente} {numero}, celda H10 ({valor_pesos}). Es el valor del evento que se muestra en 5.11.5 y en la política anterior, no el recaudo parcial de octubre ({valor_pesos} de FEC {numero} y FEC {numero}). Editable.",
  "Escenarios!D142": "Archivo {cliente} {numero}, H10; Resumen Asesores, base BTL",
  "Escenarios!C143": "Tasa del esquema anterior sobre el ingreso de ejecución del evento. Fuente: hoja Resumen Asesores ({porcentaje} sobre {valor_pesos}). Editable.",
  "Escenarios!C144": "Comisión BTL del esquema anterior: {porcentaje} sobre el ingreso de ejecución {valor_pesos} = {valor_pesos} Fuente: hoja Resumen Asesores del archivo de facturación ({persona}, BTL, Organización de evento). No se suma automáticamente a la comisión anterior de la Hoja 1 usada en la transición (esa sigue siendo la producción × tasa, sin BTL).",
  "Escenarios!A148": "{persona}",
  "Escenarios!A149": "{persona}",
  "Escenarios!A150": "{persona}",
  "Escenarios!A151": "{persona}",
  "Escenarios!A152": "{persona}",
  "Escenarios!A153": "{persona}",
  "Escenarios!A154": "{persona}",
  "Escenarios!D159": "Instrucción de jefatura, octubre {numero}",
  "Escenarios!C161": "Cuota total del equipo, incluidos {persona} y Dirección Comercial, que no liquidan en octubre. La meta del equipo en pesos es cartones × valor por cartón.",
  "Escenarios!D161": "Instrucción de jefatura, actividad cultural {numero}",
  "Escenarios!C162": "Resultado de la cuota de cartones del equipo por el valor por cartón. Se aplica en diciembre (cierre el 4 de diciembre). No entra al cálculo de octubre. El parámetro «Meta actividad cultural (diciembre)» de más arriba ({valor_pesos}) se conserva como referencia.",
  "Escenarios!A166": "{persona}",
  "Escenarios!A167": "{persona}",
  "Escenarios!A168": "{persona}",
  "Escenarios!A169": "{persona}",
  "Escenarios!A170": "{persona}",
  "Escenarios!A171": "{persona}",
  "Escenarios!A172": "{persona}",
  "Escenarios!A177": "{persona}",
  "Escenarios!A178": "{persona}",
  "Escenarios!A179": "{persona}",
  "Escenarios!A180": "{persona}",
  "Escenarios!A181": "{persona}",
  "Escenarios!A182": "{persona}",
  "Escenarios!A183": "{persona}",
  "Escenarios!A184": "{persona}",
  "Escenarios!A186": "Las metas de educación y asistencia técnica de octubre coinciden con las que ya usa la liquidación de este mes. Noviembre y diciembre quedan cargadas para el futuro; no entran al cálculo de octubre. La meta cultural de cada comercial es su cuota de cartones por el valor por cartón y se aplica en diciembre (cierre el 4 de diciembre). {persona} y Dirección Comercial aparecen solo como referencia de esa campaña; no liquidan en este archivo de octubre. En octubre, Congreso y actividad cultural siguen en cero y no participan del promedio de ventas.",
  "Escenarios!A192": "{persona}",
  "Escenarios!A193": "{persona}",
  "Escenarios!A194": "{persona}",
  "Escenarios!A195": "{persona}",
  "Escenarios!A196": "{persona}",
  "Escenarios!A197": "{persona}",
  "Escenarios!A198": "{persona}",
  "Parámetros!B6": "RESUELTO: margen exactamente {porcentaje} = {porcentaje} (selector por defecto {porcentaje} (política)). PCV-COM-001 §5.4: \"Desde {porcentaje} a {porcentaje} = {porcentaje}\", \">{porcentaje} = {porcentaje}\" y \"reconocimiento pleno cuando su margen sea superior al {porcentaje}\". Circular 19-oct-{numero} punto 11: las matrices se armonizan con la política.",
  "Parámetros!B7": "Bonificación BTL (núm. 5.11.5), evento 575 {cliente}: el ingreso del evento es la ejecución {valor_pesos} (H10 del archivo {cliente}), no el recaudo parcial de octubre ({valor_pesos}). Utilidad real {valor_pesos} y presupuestada {valor_pesos} con metodología ANALFE; cumplimiento {porcentaje}; margen {porcentaje}; liquidador {porcentaje}; comisión {valor_pesos} (tope 0,8 × IMR). Comisión del esquema anterior: {valor_pesos} ({porcentaje} × {valor_pesos} Resumen Asesores). Pendientes la certificación formal de participación, el cierre financiero y la satisfacción del cliente.",
  "Parámetros!A9": "{persona}",
  "Parámetros!B9": "2da8b61f2e5b5e9638c1616d367f3066f52e6b8c4d70b499c3829003f3ba8924.docx — tablas1/4/5/6",
  "Parámetros!B11": "v6.7  ·  12 de noviembre de {numero}. Alineada con PCV-COM-001 (núm. 5.4 a 5.11) y con las instrucciones de jefatura de octubre: meta individual de Misión {valor_pesos} factura de Misión a {valor_pesos} base social con el corte al 30 de septiembre, tope del {porcentaje} por ítem, e ingreso BTL del archivo {cliente} ({valor_pesos}). Documento de simulación, no es liquidación oficial de pago.",
  "Base social!B2": "{persona}",
  "Base social!A12": "Referencia histórica (corte al 31 de julio de {numero})",
  "Anterior detalle!B2": "{persona}",
  "Márgenes eventos!A1": "Márgenes de eventos  –  Octubre {numero}  ·  Eventos del comercial",
  "Márgenes eventos!A2": "Costo = COSTO del informe, sin prorrateo. ICA = ingreso × {porcentaje}. GMF = costo × 4/{numero}. Costo total = Costo + ICA + GMF. Margen bruto = (Ingreso − Costo total) / Ingreso. Bandas: menos de {porcentaje} = 0; de {porcentaje} a {porcentaje} = {porcentaje}; más de {porcentaje} = {porcentaje} (núm. 5.4).",
  "Facturas!A1": "Facturas  –  Octubre {numero}  ·  {persona}",
  "Facturas!A2": "Detalle de facturas del mes. Toda fila incluye cuenta y evento. Los anticipos (cuentas {numero}) no cruzan con un evento de octubre: se identifica la cuenta y el tipo de evento futuro. El recaudo de ventas es la suma de Recaudo × Factor aplicado de las filas elegibles. El BTL no suma a ventas.",
  "Supuestos y pendientes!A2": "Octubre {numero}  ·  v6.7",
  "Supuestos y pendientes!B9": "El margen de educación y asistencia técnica sigue las bandas del núm. 5.4: menos de {porcentaje} = 0; de {porcentaje} a {porcentaje} = {porcentaje}; más de {porcentaje} = {porcentaje}. El costo directo es el COSTO del informe de eventos, sin prorrateo de asesorías, asambleas ni comisiones. El ICA es el ingreso × {porcentaje} y el GMF es el costo × 4/{numero}. El costo total es Costo + ICA + GMF. El margen bruto es (Ingreso − Costo total) / Ingreso. El factor aplicado a las facturas sale de ese margen bruto.",
  "Supuestos y pendientes!B10": "FEOC {numero} de {persona} se trata como seminario de educación (evento 574), no como Misión, según el informe de eventos y la confirmación de jefatura.",
  "Supuestos y pendientes!B11": "La bonificación BTL (núm. 5.11.5) del evento 575 ({cliente}) se liquida con la metodología ANALFE: utilidad = ingreso − costo del informe − ICA {porcentaje} − GMF 4/{numero} del costo, sin restar comisiones. Utilidad real {valor_pesos} y utilidad presupuestada {valor_pesos} (mismo método sobre F10 y F41). Cumplimiento {porcentaje}, margen {porcentaje}, porcentaje liquidador {porcentaje}, comisión {valor_pesos} (tope 0,8 × IMR; el tope anual disponible es {valor_pesos} tras descontar {valor_pesos} de la Fiesta FEBOR). La participación material del comercial se asumió en SI (es el asignado al evento); falta la constancia formal, el cierre financiero firmado y la satisfacción del cliente. La bonificación no entra a ventas ni al score, y no se suma a la comisión ordinaria.",
  "Supuestos y pendientes!B12": "El evento 567 (Misión internacional) queda fuera del detalle: ingreso {valor_pesos} y costo {valor_pesos} (margen negativo). El factor de margen no aplica (circular, punto 6). La sección 2.2 se mantiene.",
  "Supuestos y pendientes!B16": "Facturas no cruzadas con el informe de eventos de octubre: 8 documentos (en su mayoría anticipos de la cuenta {numero} o facturas no canceladas del cierre). No se les asignó costo de evento. No entran al recaudo cuando son anticipo o no están canceladas.",
  "Supuestos y pendientes!B17": "Los anticipos BTL de bolos de {persona} (cuenta {numero} «Ant. Eventos deportivos bolos»: FEC {numero} {valor_pesos} cancelada el 30 de octubre, FEC {numero} {valor_pesos} no cancelada y FEC {numero} {valor_pesos} no cancelada) no corresponden a un evento cerrado. No se liquidan en el núm. 5.11.5 de octubre; quedan pendientes hasta el cierre del evento.",
  "Supuestos y pendientes!B18": "v6.4 — Misión internacional, política nueva: la meta de cada comercial en octubre es {valor_pesos} (instrucción de jefatura, no el reparto de {valor_pesos} por META 5) y cada factura elegible se toma por {valor_pesos} (parámetro Base_Mision_factura). Las facturas elegibles de octubre tienen exactamente ese valor. Este cambio reasigna los pesos de 5.4 (la meta de Misión pasa a pesar cerca de la mitad del indicador) y modifica score y comisión de todo el equipo. Quien no tenga facturas de Misión en el mes queda con cumplimiento {porcentaje} en ese producto, lo que arrastra el puntaje de Ventas.",
  "Supuestos y pendientes!B19": "v6.4 — Misión internacional, política anterior: se muestra un bloque propio con Valor {valor_pesos} el número de facturas elegibles y el Valor total = Valor × Facturas, igual que se hizo con el BTL. Es la práctica del esquema anterior y no alimenta los 45 puntos de la política nueva.",
  "Supuestos y pendientes!B20": "v6.4 — BTL: el ingreso del evento es la ejecución {valor_pesos} del archivo {cliente} (H10), no los {valor_pesos} recaudados en octubre. La comisión del esquema anterior es {valor_pesos} ({porcentaje} × {valor_pesos}), tomada de la hoja Resumen Asesores del archivo de facturación. Esa comisión se muestra en el bloque de política anterior y no se suma sola a la comisión de la Hoja 1 usada en la transición (más favorable).",
  "Supuestos y pendientes!B22": "v6.5 — Metas de los próximos meses: quedaron cargadas las metas oficiales de educación y asistencia técnica de noviembre y diciembre, y la meta de actividad cultural de diciembre (cuota de cartones × {valor_pesos} por cartón, valor editable). Esas cifras no entran al cálculo de octubre. Congreso y actividad cultural siguen en cero en este mes.",
  "Especiales auxiliar!A1": "Movimientos adicionales del auxiliar  –  Octubre {numero}",
};

function rellenar(plantilla, valores) {
  let i = 0;
  return String(plantilla).replace(/\{(\w+)\}/g, () => {
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
  const fila = Number(String(ref).replace(/\D/g, "")) || 0;
  const col = String(ref).replace(/\d/g, "");
  if (hoja === "Escenarios" && col === "A") {
    const tramo = filaEquipo(ctx, fila, 122, 128) || filaEquipo(ctx, fila, 148, 154) || filaEquipo(ctx, fila, 166, 172) || filaEquipo(ctx, fila, 177, 183) || filaEquipo(ctx, fila, 192, 198);
    if (tramo) return tramo;
    if (fila === 184) return [ctx.director || ""];
  }
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    return [...(ctx.equipo || []).map((item) => item.nombre), ctx.fuera || ctx.director || ""];
  }
  const plantilla = String(PLANTILLAS[hoja + "!" + ref] || "").replaceAll("v6.7", ctx.version || "");
  const marcas = [...plantilla.matchAll(/\{(\w+)\}/g)].map((marca) => marca[1]);
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

export function texto_Liquidacion_A1(ctx) {
  const hoja = "Liquidación";
  const ref = "A1";
  const crudo = PLANTILLAS["Liquidación!A1"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Liquidacion_C3(ctx) {
  const hoja = "Liquidación";
  const ref = "C3";
  const crudo = PLANTILLAS["Liquidación!C3"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Liquidacion_C4(ctx) {
  const hoja = "Liquidación";
  const ref = "C4";
  const crudo = PLANTILLAS["Liquidación!C4"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A1(ctx) {
  const hoja = "Explicación";
  const ref = "A1";
  const crudo = PLANTILLAS["Explicación!A1"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A2(ctx) {
  const hoja = "Explicación";
  const ref = "A2";
  const crudo = PLANTILLAS["Explicación!A2"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A5(ctx) {
  const hoja = "Explicación";
  const ref = "A5";
  const crudo = PLANTILLAS["Explicación!A5"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A6(ctx) {
  const hoja = "Explicación";
  const ref = "A6";
  const crudo = PLANTILLAS["Explicación!A6"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A23(ctx) {
  const hoja = "Explicación";
  const ref = "A23";
  const crudo = PLANTILLAS["Explicación!A23"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A26(ctx) {
  const hoja = "Explicación";
  const ref = "A26";
  const crudo = PLANTILLAS["Explicación!A26"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A27(ctx) {
  const hoja = "Explicación";
  const ref = "A27";
  const crudo = PLANTILLAS["Explicación!A27"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A31(ctx) {
  const hoja = "Explicación";
  const ref = "A31";
  const crudo = PLANTILLAS["Explicación!A31"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A57(ctx) {
  const hoja = "Explicación";
  const ref = "A57";
  const crudo = PLANTILLAS["Explicación!A57"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A58(ctx) {
  const hoja = "Explicación";
  const ref = "A58";
  const crudo = PLANTILLAS["Explicación!A58"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A59(ctx) {
  const hoja = "Explicación";
  const ref = "A59";
  const crudo = PLANTILLAS["Explicación!A59"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A67(ctx) {
  const hoja = "Explicación";
  const ref = "A67";
  const crudo = PLANTILLAS["Explicación!A67"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Explicacion_A69(ctx) {
  const hoja = "Explicación";
  const ref = "A69";
  const crudo = PLANTILLAS["Explicación!A69"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A1(ctx) {
  const hoja = "Escenarios";
  const ref = "A1";
  const crudo = PLANTILLAS["Escenarios!A1"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_B51(ctx) {
  const hoja = "Escenarios";
  const ref = "B51";
  const crudo = PLANTILLAS["Escenarios!B51"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C57(ctx) {
  const hoja = "Escenarios";
  const ref = "C57";
  const crudo = PLANTILLAS["Escenarios!C57"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D57(ctx) {
  const hoja = "Escenarios";
  const ref = "D57";
  const crudo = PLANTILLAS["Escenarios!D57"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C58(ctx) {
  const hoja = "Escenarios";
  const ref = "C58";
  const crudo = PLANTILLAS["Escenarios!C58"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C62(ctx) {
  const hoja = "Escenarios";
  const ref = "C62";
  const crudo = PLANTILLAS["Escenarios!C62"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D62(ctx) {
  const hoja = "Escenarios";
  const ref = "D62";
  const crudo = PLANTILLAS["Escenarios!D62"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C83(ctx) {
  const hoja = "Escenarios";
  const ref = "C83";
  const crudo = PLANTILLAS["Escenarios!C83"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C86(ctx) {
  const hoja = "Escenarios";
  const ref = "C86";
  const crudo = PLANTILLAS["Escenarios!C86"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D97(ctx) {
  const hoja = "Escenarios";
  const ref = "D97";
  const crudo = PLANTILLAS["Escenarios!D97"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D99(ctx) {
  const hoja = "Escenarios";
  const ref = "D99";
  const crudo = PLANTILLAS["Escenarios!D99"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A111(ctx) {
  const hoja = "Escenarios";
  const ref = "A111";
  const crudo = PLANTILLAS["Escenarios!A111"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C115(ctx) {
  const hoja = "Escenarios";
  const ref = "C115";
  const crudo = PLANTILLAS["Escenarios!C115"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D115(ctx) {
  const hoja = "Escenarios";
  const ref = "D115";
  const crudo = PLANTILLAS["Escenarios!D115"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C116(ctx) {
  const hoja = "Escenarios";
  const ref = "C116";
  const crudo = PLANTILLAS["Escenarios!C116"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A122(ctx) {
  const hoja = "Escenarios";
  const ref = "A122";
  const crudo = PLANTILLAS["Escenarios!A122"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A123(ctx) {
  const hoja = "Escenarios";
  const ref = "A123";
  const crudo = PLANTILLAS["Escenarios!A123"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A124(ctx) {
  const hoja = "Escenarios";
  const ref = "A124";
  const crudo = PLANTILLAS["Escenarios!A124"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A125(ctx) {
  const hoja = "Escenarios";
  const ref = "A125";
  const crudo = PLANTILLAS["Escenarios!A125"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A126(ctx) {
  const hoja = "Escenarios";
  const ref = "A126";
  const crudo = PLANTILLAS["Escenarios!A126"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A127(ctx) {
  const hoja = "Escenarios";
  const ref = "A127";
  const crudo = PLANTILLAS["Escenarios!A127"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A128(ctx) {
  const hoja = "Escenarios";
  const ref = "A128";
  const crudo = PLANTILLAS["Escenarios!A128"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A130(ctx) {
  const hoja = "Escenarios";
  const ref = "A130";
  const crudo = PLANTILLAS["Escenarios!A130"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A132(ctx) {
  const hoja = "Escenarios";
  const ref = "A132";
  const crudo = PLANTILLAS["Escenarios!A132"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C133(ctx) {
  const hoja = "Escenarios";
  const ref = "C133";
  const crudo = PLANTILLAS["Escenarios!C133"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D133(ctx) {
  const hoja = "Escenarios";
  const ref = "D133";
  const crudo = PLANTILLAS["Escenarios!D133"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C134(ctx) {
  const hoja = "Escenarios";
  const ref = "C134";
  const crudo = PLANTILLAS["Escenarios!C134"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D134(ctx) {
  const hoja = "Escenarios";
  const ref = "D134";
  const crudo = PLANTILLAS["Escenarios!D134"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C135(ctx) {
  const hoja = "Escenarios";
  const ref = "C135";
  const crudo = PLANTILLAS["Escenarios!C135"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D135(ctx) {
  const hoja = "Escenarios";
  const ref = "D135";
  const crudo = PLANTILLAS["Escenarios!D135"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A136(ctx) {
  const hoja = "Escenarios";
  const ref = "A136";
  const crudo = PLANTILLAS["Escenarios!A136"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D139(ctx) {
  const hoja = "Escenarios";
  const ref = "D139";
  const crudo = PLANTILLAS["Escenarios!D139"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A142(ctx) {
  const hoja = "Escenarios";
  const ref = "A142";
  const crudo = PLANTILLAS["Escenarios!A142"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C142(ctx) {
  const hoja = "Escenarios";
  const ref = "C142";
  const crudo = PLANTILLAS["Escenarios!C142"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D142(ctx) {
  const hoja = "Escenarios";
  const ref = "D142";
  const crudo = PLANTILLAS["Escenarios!D142"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C143(ctx) {
  const hoja = "Escenarios";
  const ref = "C143";
  const crudo = PLANTILLAS["Escenarios!C143"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C144(ctx) {
  const hoja = "Escenarios";
  const ref = "C144";
  const crudo = PLANTILLAS["Escenarios!C144"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A148(ctx) {
  const hoja = "Escenarios";
  const ref = "A148";
  const crudo = PLANTILLAS["Escenarios!A148"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A149(ctx) {
  const hoja = "Escenarios";
  const ref = "A149";
  const crudo = PLANTILLAS["Escenarios!A149"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A150(ctx) {
  const hoja = "Escenarios";
  const ref = "A150";
  const crudo = PLANTILLAS["Escenarios!A150"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A151(ctx) {
  const hoja = "Escenarios";
  const ref = "A151";
  const crudo = PLANTILLAS["Escenarios!A151"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A152(ctx) {
  const hoja = "Escenarios";
  const ref = "A152";
  const crudo = PLANTILLAS["Escenarios!A152"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A153(ctx) {
  const hoja = "Escenarios";
  const ref = "A153";
  const crudo = PLANTILLAS["Escenarios!A153"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A154(ctx) {
  const hoja = "Escenarios";
  const ref = "A154";
  const crudo = PLANTILLAS["Escenarios!A154"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D159(ctx) {
  const hoja = "Escenarios";
  const ref = "D159";
  const crudo = PLANTILLAS["Escenarios!D159"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C161(ctx) {
  const hoja = "Escenarios";
  const ref = "C161";
  const crudo = PLANTILLAS["Escenarios!C161"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_D161(ctx) {
  const hoja = "Escenarios";
  const ref = "D161";
  const crudo = PLANTILLAS["Escenarios!D161"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_C162(ctx) {
  const hoja = "Escenarios";
  const ref = "C162";
  const crudo = PLANTILLAS["Escenarios!C162"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A166(ctx) {
  const hoja = "Escenarios";
  const ref = "A166";
  const crudo = PLANTILLAS["Escenarios!A166"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A167(ctx) {
  const hoja = "Escenarios";
  const ref = "A167";
  const crudo = PLANTILLAS["Escenarios!A167"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A168(ctx) {
  const hoja = "Escenarios";
  const ref = "A168";
  const crudo = PLANTILLAS["Escenarios!A168"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A169(ctx) {
  const hoja = "Escenarios";
  const ref = "A169";
  const crudo = PLANTILLAS["Escenarios!A169"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A170(ctx) {
  const hoja = "Escenarios";
  const ref = "A170";
  const crudo = PLANTILLAS["Escenarios!A170"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A171(ctx) {
  const hoja = "Escenarios";
  const ref = "A171";
  const crudo = PLANTILLAS["Escenarios!A171"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A172(ctx) {
  const hoja = "Escenarios";
  const ref = "A172";
  const crudo = PLANTILLAS["Escenarios!A172"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A177(ctx) {
  const hoja = "Escenarios";
  const ref = "A177";
  const crudo = PLANTILLAS["Escenarios!A177"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A178(ctx) {
  const hoja = "Escenarios";
  const ref = "A178";
  const crudo = PLANTILLAS["Escenarios!A178"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A179(ctx) {
  const hoja = "Escenarios";
  const ref = "A179";
  const crudo = PLANTILLAS["Escenarios!A179"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A180(ctx) {
  const hoja = "Escenarios";
  const ref = "A180";
  const crudo = PLANTILLAS["Escenarios!A180"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A181(ctx) {
  const hoja = "Escenarios";
  const ref = "A181";
  const crudo = PLANTILLAS["Escenarios!A181"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A182(ctx) {
  const hoja = "Escenarios";
  const ref = "A182";
  const crudo = PLANTILLAS["Escenarios!A182"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A183(ctx) {
  const hoja = "Escenarios";
  const ref = "A183";
  const crudo = PLANTILLAS["Escenarios!A183"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A184(ctx) {
  const hoja = "Escenarios";
  const ref = "A184";
  const crudo = PLANTILLAS["Escenarios!A184"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A186(ctx) {
  const hoja = "Escenarios";
  const ref = "A186";
  const crudo = PLANTILLAS["Escenarios!A186"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A192(ctx) {
  const hoja = "Escenarios";
  const ref = "A192";
  const crudo = PLANTILLAS["Escenarios!A192"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A193(ctx) {
  const hoja = "Escenarios";
  const ref = "A193";
  const crudo = PLANTILLAS["Escenarios!A193"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A194(ctx) {
  const hoja = "Escenarios";
  const ref = "A194";
  const crudo = PLANTILLAS["Escenarios!A194"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A195(ctx) {
  const hoja = "Escenarios";
  const ref = "A195";
  const crudo = PLANTILLAS["Escenarios!A195"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A196(ctx) {
  const hoja = "Escenarios";
  const ref = "A196";
  const crudo = PLANTILLAS["Escenarios!A196"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A197(ctx) {
  const hoja = "Escenarios";
  const ref = "A197";
  const crudo = PLANTILLAS["Escenarios!A197"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Escenarios_A198(ctx) {
  const hoja = "Escenarios";
  const ref = "A198";
  const crudo = PLANTILLAS["Escenarios!A198"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Parametros_B6(ctx) {
  const hoja = "Parámetros";
  const ref = "B6";
  const crudo = PLANTILLAS["Parámetros!B6"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Parametros_B7(ctx) {
  const hoja = "Parámetros";
  const ref = "B7";
  const crudo = PLANTILLAS["Parámetros!B7"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Parametros_A9(ctx) {
  const hoja = "Parámetros";
  const ref = "A9";
  const crudo = PLANTILLAS["Parámetros!A9"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Parametros_B9(ctx) {
  const hoja = "Parámetros";
  const ref = "B9";
  const crudo = PLANTILLAS["Parámetros!B9"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Parametros_B11(ctx) {
  const hoja = "Parámetros";
  const ref = "B11";
  const crudo = PLANTILLAS["Parámetros!B11"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Base_social_B2(ctx) {
  const hoja = "Base social";
  const ref = "B2";
  const crudo = PLANTILLAS["Base social!B2"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Base_social_A12(ctx) {
  const hoja = "Base social";
  const ref = "A12";
  const crudo = PLANTILLAS["Base social!A12"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Anterior_detalle_B2(ctx) {
  const hoja = "Anterior detalle";
  const ref = "B2";
  const crudo = PLANTILLAS["Anterior detalle!B2"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Margenes_eventos_A1(ctx) {
  const hoja = "Márgenes eventos";
  const ref = "A1";
  const crudo = PLANTILLAS["Márgenes eventos!A1"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Margenes_eventos_A2(ctx) {
  const hoja = "Márgenes eventos";
  const ref = "A2";
  const crudo = PLANTILLAS["Márgenes eventos!A2"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Facturas_A1(ctx) {
  const hoja = "Facturas";
  const ref = "A1";
  const crudo = PLANTILLAS["Facturas!A1"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Facturas_A2(ctx) {
  const hoja = "Facturas";
  const ref = "A2";
  const crudo = PLANTILLAS["Facturas!A2"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_A2(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "A2";
  const crudo = PLANTILLAS["Supuestos y pendientes!A2"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B9(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B9";
  const crudo = PLANTILLAS["Supuestos y pendientes!B9"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B10(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B10";
  const crudo = PLANTILLAS["Supuestos y pendientes!B10"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B11(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B11";
  const crudo = PLANTILLAS["Supuestos y pendientes!B11"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B12(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B12";
  const crudo = PLANTILLAS["Supuestos y pendientes!B12"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B16(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B16";
  const crudo = PLANTILLAS["Supuestos y pendientes!B16"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B17(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B17";
  const crudo = PLANTILLAS["Supuestos y pendientes!B17"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B18(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B18";
  const crudo = PLANTILLAS["Supuestos y pendientes!B18"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B19(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B19";
  const crudo = PLANTILLAS["Supuestos y pendientes!B19"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B20(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B20";
  const crudo = PLANTILLAS["Supuestos y pendientes!B20"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Supuestos_y_pendientes_B22(ctx) {
  const hoja = "Supuestos y pendientes";
  const ref = "B22";
  const crudo = PLANTILLAS["Supuestos y pendientes!B22"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export function texto_Especiales_auxiliar_A1(ctx) {
  const hoja = "Especiales auxiliar";
  const ref = "A1";
  const crudo = PLANTILLAS["Especiales auxiliar!A1"] || "";
  if (ref === "A6" && hoja.startsWith("Explicaci")) {
    const nombres = (ctx.equipo || []).map((item) => item.nombre).filter(Boolean);
    const lista = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "");
    const fuera = ctx.fuera || "Quien no liquida";
    return "El ejercicio cubre a los comerciales activos (" + lista + "). " + fuera + " aparece como retirado y no liquida. Del Director Comercial y de Marketing se espera su básico y su oportunidad para completar el BTL de su línea.";
  }
  const valores = valoresTexto(ctx, hoja, ref);
  const marcas = crudo.match(/\{persona\}/g) || [];
  if (marcas.length === 1 && /\{persona\}\s+\S+/.test(crudo) && !crudo.includes("{valor") && !crudo.includes("{porcentaje") && !crudo.includes("{numero") && !crudo.includes("{cliente")) return valores[0] || "";
  return rellenar(crudo.replaceAll("v6.7", ctx.version || ""), valores);
}

export const TEXTOS = {
  "Liquidación!A1": texto_Liquidacion_A1,
  "Liquidación!C3": texto_Liquidacion_C3,
  "Liquidación!C4": texto_Liquidacion_C4,
  "Explicación!A1": texto_Explicacion_A1,
  "Explicación!A2": texto_Explicacion_A2,
  "Explicación!A5": texto_Explicacion_A5,
  "Explicación!A6": texto_Explicacion_A6,
  "Explicación!A23": texto_Explicacion_A23,
  "Explicación!A26": texto_Explicacion_A26,
  "Explicación!A27": texto_Explicacion_A27,
  "Explicación!A31": texto_Explicacion_A31,
  "Explicación!A57": texto_Explicacion_A57,
  "Explicación!A58": texto_Explicacion_A58,
  "Explicación!A59": texto_Explicacion_A59,
  "Explicación!A67": texto_Explicacion_A67,
  "Explicación!A69": texto_Explicacion_A69,
  "Escenarios!A1": texto_Escenarios_A1,
  "Escenarios!B51": texto_Escenarios_B51,
  "Escenarios!C57": texto_Escenarios_C57,
  "Escenarios!D57": texto_Escenarios_D57,
  "Escenarios!C58": texto_Escenarios_C58,
  "Escenarios!C62": texto_Escenarios_C62,
  "Escenarios!D62": texto_Escenarios_D62,
  "Escenarios!C83": texto_Escenarios_C83,
  "Escenarios!C86": texto_Escenarios_C86,
  "Escenarios!D97": texto_Escenarios_D97,
  "Escenarios!D99": texto_Escenarios_D99,
  "Escenarios!A111": texto_Escenarios_A111,
  "Escenarios!C115": texto_Escenarios_C115,
  "Escenarios!D115": texto_Escenarios_D115,
  "Escenarios!C116": texto_Escenarios_C116,
  "Escenarios!A122": texto_Escenarios_A122,
  "Escenarios!A123": texto_Escenarios_A123,
  "Escenarios!A124": texto_Escenarios_A124,
  "Escenarios!A125": texto_Escenarios_A125,
  "Escenarios!A126": texto_Escenarios_A126,
  "Escenarios!A127": texto_Escenarios_A127,
  "Escenarios!A128": texto_Escenarios_A128,
  "Escenarios!A130": texto_Escenarios_A130,
  "Escenarios!A132": texto_Escenarios_A132,
  "Escenarios!C133": texto_Escenarios_C133,
  "Escenarios!D133": texto_Escenarios_D133,
  "Escenarios!C134": texto_Escenarios_C134,
  "Escenarios!D134": texto_Escenarios_D134,
  "Escenarios!C135": texto_Escenarios_C135,
  "Escenarios!D135": texto_Escenarios_D135,
  "Escenarios!A136": texto_Escenarios_A136,
  "Escenarios!D139": texto_Escenarios_D139,
  "Escenarios!A142": texto_Escenarios_A142,
  "Escenarios!C142": texto_Escenarios_C142,
  "Escenarios!D142": texto_Escenarios_D142,
  "Escenarios!C143": texto_Escenarios_C143,
  "Escenarios!C144": texto_Escenarios_C144,
  "Escenarios!A148": texto_Escenarios_A148,
  "Escenarios!A149": texto_Escenarios_A149,
  "Escenarios!A150": texto_Escenarios_A150,
  "Escenarios!A151": texto_Escenarios_A151,
  "Escenarios!A152": texto_Escenarios_A152,
  "Escenarios!A153": texto_Escenarios_A153,
  "Escenarios!A154": texto_Escenarios_A154,
  "Escenarios!D159": texto_Escenarios_D159,
  "Escenarios!C161": texto_Escenarios_C161,
  "Escenarios!D161": texto_Escenarios_D161,
  "Escenarios!C162": texto_Escenarios_C162,
  "Escenarios!A166": texto_Escenarios_A166,
  "Escenarios!A167": texto_Escenarios_A167,
  "Escenarios!A168": texto_Escenarios_A168,
  "Escenarios!A169": texto_Escenarios_A169,
  "Escenarios!A170": texto_Escenarios_A170,
  "Escenarios!A171": texto_Escenarios_A171,
  "Escenarios!A172": texto_Escenarios_A172,
  "Escenarios!A177": texto_Escenarios_A177,
  "Escenarios!A178": texto_Escenarios_A178,
  "Escenarios!A179": texto_Escenarios_A179,
  "Escenarios!A180": texto_Escenarios_A180,
  "Escenarios!A181": texto_Escenarios_A181,
  "Escenarios!A182": texto_Escenarios_A182,
  "Escenarios!A183": texto_Escenarios_A183,
  "Escenarios!A184": texto_Escenarios_A184,
  "Escenarios!A186": texto_Escenarios_A186,
  "Escenarios!A192": texto_Escenarios_A192,
  "Escenarios!A193": texto_Escenarios_A193,
  "Escenarios!A194": texto_Escenarios_A194,
  "Escenarios!A195": texto_Escenarios_A195,
  "Escenarios!A196": texto_Escenarios_A196,
  "Escenarios!A197": texto_Escenarios_A197,
  "Escenarios!A198": texto_Escenarios_A198,
  "Parámetros!B6": texto_Parametros_B6,
  "Parámetros!B7": texto_Parametros_B7,
  "Parámetros!A9": texto_Parametros_A9,
  "Parámetros!B9": texto_Parametros_B9,
  "Parámetros!B11": texto_Parametros_B11,
  "Base social!B2": texto_Base_social_B2,
  "Base social!A12": texto_Base_social_A12,
  "Anterior detalle!B2": texto_Anterior_detalle_B2,
  "Márgenes eventos!A1": texto_Margenes_eventos_A1,
  "Márgenes eventos!A2": texto_Margenes_eventos_A2,
  "Facturas!A1": texto_Facturas_A1,
  "Facturas!A2": texto_Facturas_A2,
  "Supuestos y pendientes!A2": texto_Supuestos_y_pendientes_A2,
  "Supuestos y pendientes!B9": texto_Supuestos_y_pendientes_B9,
  "Supuestos y pendientes!B10": texto_Supuestos_y_pendientes_B10,
  "Supuestos y pendientes!B11": texto_Supuestos_y_pendientes_B11,
  "Supuestos y pendientes!B12": texto_Supuestos_y_pendientes_B12,
  "Supuestos y pendientes!B16": texto_Supuestos_y_pendientes_B16,
  "Supuestos y pendientes!B17": texto_Supuestos_y_pendientes_B17,
  "Supuestos y pendientes!B18": texto_Supuestos_y_pendientes_B18,
  "Supuestos y pendientes!B19": texto_Supuestos_y_pendientes_B19,
  "Supuestos y pendientes!B20": texto_Supuestos_y_pendientes_B20,
  "Supuestos y pendientes!B22": texto_Supuestos_y_pendientes_B22,
  "Especiales auxiliar!A1": texto_Especiales_auxiliar_A1,
};

const MESES_TITULO = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const TITULOS_CON_MES = new Set(["Liquidación!A1", "Explicación!A1"]);

export function textoDe(ctx, hoja, ref) {
  const funcion = TEXTOS[`${hoja}!${ref}`];
  const texto = funcion ? funcion(ctx) : "";
  // v16: el título traía «Octubre» fijo; ahora dice el mes que se liquida.
  const mes = MESES_TITULO[Number(ctx?.mesNumero) - 1];
  return TITULOS_CON_MES.has(`${hoja}!${ref}`) && mes ? texto.replace(/\bOctubre\b/, mes) : texto;
}
