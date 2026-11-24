/**
 * Texto seguro para insertar en HTML.
 * Recibe cualquier valor. Devuelve el texto con & < > " ' reemplazados.
 */
export function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const NOMBRES_PRODUCTO = [
  ["eduAt", "Educación y asistencia técnica"],
  ["pasantia", "Pasantía"],
  ["patrocinio", "Patrocinio"],
  ["mision", "Misión internacional"],
  ["congreso", "Congreso"],
  ["cultural", "Actividad cultural"],
  ["btl", "BTL"],
  ["otro", "Sin clasificar"],
];

const NOMBRES_ESQUEMA = {
  nueva: "Política nueva",
  anterior: "Esquema anterior",
  pendiente: "Pendiente",
};

/** Traduce la clave del esquema al texto que se muestra. */
export function nombreEsquema(clave) {
  return NOMBRES_ESQUEMA[clave] || String(clave ?? "");
}

/** Cambia la clave interna de un producto por el nombre que se muestra. */
export function nombreVisible(clave) {
  const texto = String(clave ?? "");
  const exacto = NOMBRES_PRODUCTO.find(([codigo]) => codigo === texto);
  if (exacto) return exacto[1];
  return NOMBRES_PRODUCTO.reduce(
    (salida, [codigo, nombre]) => salida.replaceAll(codigo, nombre),
    texto
  );
}

export function avisarCambiosSinGuardar() {
  const aviso = document.getElementById("aviso-cambios");
  if (aviso) aviso.hidden = false;
}

export function avisarCambiosGuardados() {
  const aviso = document.getElementById("aviso-cambios");
  if (aviso) aviso.hidden = true;
}

/** Muestra un aviso breve abajo a la derecha. Desaparece a los 4 segundos. */
export function avisoBreve(texto, tono = "exito") {
  let caja = document.querySelector(".avisos-breves");
  if (!caja) {
    caja = document.createElement("div");
    caja.className = "avisos-breves";
    caja.setAttribute("role", "status");
    caja.setAttribute("aria-live", "polite");
    document.body.appendChild(caja);
  }
  const item = document.createElement("p");
  item.className = `aviso-breve aviso-breve--${tono}`;
  item.textContent = texto;
  caja.appendChild(item);
  window.setTimeout(() => item.remove(), 4000);
}

/**
 * Pesos colombianos: el punto es miles y la coma es decimal.
 * "40.000" → 40000; "1.234,5" → 1234.5.
 */
export function numeroPesos(valor) {
  const texto = String(valor ?? "").trim().replace(/[\s$]/g, "");
  if (!texto) return null;
  const normal = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number(normal);
  return Number.isFinite(numero) ? numero : null;
}

/** Lee un número escrito con punto de miles y coma decimal, o con punto decimal. */
export function numeroFlexible(valor) {
  const texto = String(valor ?? "").trim().replace(/\s/g, "");
  if (!texto) return null;
  let normal = texto;
  if (texto.includes(",")) normal = texto.replace(/\./g, "").replace(",", ".");
  else if (texto.split(".").length > 2) normal = texto.replace(/\./g, "");
  const numero = Number(normal);
  return Number.isFinite(numero) ? numero : null;
}

/** "1 factura" o "6 facturas", según el número. */
export function plural(numero, uno, varios) {
  const cantidad = Number(numero) || 0;
  return `${cantidad} ${cantidad === 1 ? uno : varios}`;
}

/**
 * Porcentaje con los decimales pedidos.
 * 1,0013 y 2 decimales → "100,13 %". 0,015 y 2 → "1,50 %".
 * El número de decimales lo trae el llamador (parametros.formato).
 */
export function porcentaje(valor, decimales) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "Pendiente";
  const digitos = Number.isInteger(decimales) && decimales >= 0 ? decimales : 0;
  const numero = Number(valor) * 100;
  return `${numero.toLocaleString("es-CO", { minimumFractionDigits: digitos, maximumFractionDigits: digitos })} %`;
}

/** Muestra el número con separador de miles. */
export function formatoMiles(valor) {
  const numero = typeof valor === "number" ? valor : numeroFlexible(valor);
  if (numero === null || !Number.isFinite(numero)) return "";
  return numero.toLocaleString("es-CO", { maximumFractionDigits: 6 });
}
