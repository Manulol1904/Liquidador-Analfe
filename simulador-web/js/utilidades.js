/** Utilidades del simulador. Formato colombiano. Sin DOM obligatorio. */

export function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Acepta 1.234.567, 1234567, 85,5, 85.5, vacío → null. */
export function numeroFlexible(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  let t = String(valor).trim();
  if (!t) return null;
  t = t.replace(/\s/g, "").replace(/\$/g, "");
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (t.includes(",") && !t.includes(".")) {
    t = t.replace(",", ".");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function formatoMiles(n, decimales = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n);
}

export function numeroPesos(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `$${formatoMiles(Math.round(n), 0)}`;
}

export function porcentaje(n, decimales = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${formatoMiles(n * 100, decimales)} %`;
}

export function plural(n, uno, muchos) {
  return Math.abs(n) === 1 ? uno : muchos;
}

export function clonar(objeto) {
  return JSON.parse(JSON.stringify(objeto));
}

/** Vacío ≠ 0: solo números finitos cuentan. */
export function esNumero(valor) {
  return typeof valor === "number" && Number.isFinite(valor);
}

export function redondearExcel(n) {
  if (!esNumero(n)) return n;
  return Math.round(n);
}

/** Comparación con tolerancia (fronteras 80 / 100 % / 20 %). */
export function casiIgual(a, b, tol = 1e-9) {
  if (a === b) return true;
  if (!esNumero(a) || !esNumero(b)) return false;
  return Math.abs(a - b) <= tol;
}
