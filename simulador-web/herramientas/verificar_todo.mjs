#!/usr/bin/env node
/**
 * Verificación de punta a punta:
 * 1) pruebas unitarias
 * 2) empaquetado
 * 3) control de datos personales
 * 4) humo (si hay navegador)
 *
 * Simulación. No es un pago oficial.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function correr(titulo, comando, args) {
  console.log(`\n══ ${titulo} ══`);
  const r = spawnSync(comando, args, { cwd: RAIZ, stdio: "inherit", shell: true });
  const ok = r.status === 0;
  console.log(ok ? `✔ ${titulo}` : `✖ ${titulo}`);
  return ok;
}

const resultados = [];
resultados.push(["Pruebas unitarias", correr("Pruebas unitarias", "node", ["--test", "pruebas/*.test.mjs"])]);
resultados.push(["Empaquetado", correr("Empaquetado", "node", ["herramientas/empaquetar.mjs"])]);
resultados.push([
  "Control datos personales",
  correr("Control datos personales", "node", ["herramientas/control_datos_personales.mjs"]),
]);
resultados.push(["Humo", correr("Humo", "node", ["pruebas/humo.mjs"])]);

console.log("\n── Resumen ──");
for (const [nombre, ok] of resultados) {
  console.log(`${ok ? "✔" : "✖"} ${nombre}`);
}
const fallas = resultados.filter(([, ok]) => !ok).length;
console.log(fallas ? `\n✖ ${fallas} bloque(s) fallaron` : "\n✔ Todo en verde · Simulación. No es un pago oficial.");
process.exit(fallas ? 1 : 0);
