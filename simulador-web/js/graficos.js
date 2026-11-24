/** SVG propios: curva de pago y sensibilidad. Sin librerías externas. */
import { factorCurva } from "./motor/curva.js";

export function svgCurva(puntaje, curva, { ancho = 420, alto = 180 } = {}) {
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const w = ancho - pad.l - pad.r;
  const h = alto - pad.t - pad.b;
  const xMin = 70;
  const xMax = 130;
  const yMin = 0;
  const yMax = curva.tope;

  const X = (s) => pad.l + ((s - xMin) / (xMax - xMin)) * w;
  const Y = (f) => pad.t + h - ((f - yMin) / (yMax - yMin)) * h;

  const anclas = [...curva.anclas].sort((a, b) => a.puntaje - b.puntaje);
  const pts = [];
  pts.push([X(xMin), Y(0)]);
  pts.push([X(curva.minimo), Y(0)]);
  for (const a of anclas) pts.push([X(a.puntaje), Y(a.factor)]);
  pts.push([X(xMax), Y(curva.tope)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  let punto = "";
  if (typeof puntaje === "number" && Number.isFinite(puntaje)) {
    const factor = factorCurva(puntaje, curva);
    const cx = X(Math.min(xMax, Math.max(xMin, puntaje)));
    punto = `<circle cx="${cx}" cy="${Y(factor)}" r="5" fill="var(--color-primario-500)" />
      <title>Puntaje ${puntaje.toFixed(1)} → ${(factor * 100).toFixed(0)} %</title>`;
  }

  return `<svg class="svg-curva" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Curva de pago">
    <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + h}" stroke="var(--color-neutro-300)"/>
    <line x1="${pad.l}" y1="${pad.t + h}" x2="${pad.l + w}" y2="${pad.t + h}" stroke="var(--color-neutro-300)"/>
    <path d="${d}" fill="none" stroke="var(--color-primario-500)" stroke-width="2"/>
    ${punto}
    <text x="${pad.l}" y="${alto - 6}" font-size="11" fill="var(--color-neutro-500)">Puntaje</text>
  </svg>`;
}

export function svgSensibilidad(filas, { ancho = 520, alto = 200 } = {}) {
  if (!filas?.length) return "";
  const pad = { l: 48, r: 12, t: 12, b: 28 };
  const w = ancho - pad.l - pad.r;
  const h = alto - pad.t - pad.b;
  const maxC = Math.max(...filas.map((f) => f.comision || 0), 1);
  const X = (c) => pad.l + (c / 1.2) * w;
  const Y = (v) => pad.t + h - (v / maxC) * h;
  const d = filas
    .map((f, i) => `${i ? "L" : "M"}${X(f.cumplimiento).toFixed(1)},${Y(f.comision || 0).toFixed(1)}`)
    .join(" ");
  return `<svg class="svg-sens" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Comisión según cumplimiento de ventas">
    <line x1="${pad.l}" y1="${pad.t + h}" x2="${pad.l + w}" y2="${pad.t + h}" stroke="var(--color-neutro-300)"/>
    <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + h}" stroke="var(--color-neutro-300)"/>
    <path d="${d}" fill="none" stroke="var(--color-primario-700)" stroke-width="2"/>
    <text x="${pad.l}" y="${alto - 4}" font-size="11" fill="var(--color-neutro-500)">Cumplimiento de ventas</text>
  </svg>`;
}
