/**
 * Recursos de la app (plantillas .xlsx y JSON).
 * - Con Live Server: se leen con fetch desde la carpeta del proyecto.
 * - En el HTML empaquetado (doble clic, file://): vienen dentro del archivo en window.ANALFE_RECURSOS
 *   (xlsx en base64, JSON como objeto) y no se hace ninguna petición.
 */
export const empaquetado = () => Boolean(globalThis.ANALFE_RECURSOS);

function deBase64(texto) {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** tipo: "json" | "bytes". Lanza error si no existe. */
export async function recurso(ruta, tipo = "bytes") {
  const embebido = globalThis.ANALFE_RECURSOS?.[ruta];
  if (embebido !== undefined) return tipo === "json" ? structuredClone(embebido) : deBase64(embebido);
  if (empaquetado()) throw new Error(`El archivo empaquetado no trae ${ruta}`);
  const respuesta = await fetch(ruta, { cache: "no-store" });
  if (!respuesta.ok) throw new Error(`No se encontró ${ruta}`);
  return tipo === "json" ? respuesta.json() : new Uint8Array(await respuesta.arrayBuffer());
}
