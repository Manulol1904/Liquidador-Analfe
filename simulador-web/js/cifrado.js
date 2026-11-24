/**
 * Cifrado opcional de perfiles (.analfe) con WebCrypto.
 * AES-GCM 256 + PBKDF2-SHA256 (310000 iteraciones).
 * La contraseña nunca se guarda.
 */

const ITERACIONES = 310_000;
const FORMATO = "analfe-perfil-cifrado";

function b64(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function deB64(texto) {
  const bin = atob(texto);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export function cryptoDisponible() {
  return Boolean(globalThis.crypto?.subtle) && (typeof window === "undefined" || window.isSecureContext !== false);
}

export function esPerfilCifrado(obj) {
  return obj && obj.formato === FORMATO && obj.version === 1;
}

async function derivarClave(contraseña, sal, iteraciones = ITERACIONES) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(contraseña),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: sal, iterations: iteraciones, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Cifra un perfil JSON → objeto .analfe */
export async function cifrarPerfil(perfil, contraseña) {
  if (!cryptoDisponible()) {
    throw new Error("Este navegador no permite cifrar con file://. Use Chrome o Edge actualizado.");
  }
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clave = await derivarClave(contraseña, sal);
  const plano = new TextEncoder().encode(JSON.stringify(perfil));
  const cifrado = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, clave, plano);
  return {
    formato: FORMATO,
    version: 1,
    kdf: "PBKDF2-SHA256",
    iteraciones: ITERACIONES,
    sal: b64(sal),
    iv: b64(iv),
    datos: b64(cifrado),
  };
}

/** Descifra .analfe → perfil. Lanza si la contraseña no coincide. */
export async function descifrarPerfil(sobre, contraseña) {
  if (!cryptoDisponible()) {
    throw new Error("Este navegador no permite descifrar con file://. Use Chrome o Edge actualizado.");
  }
  if (!esPerfilCifrado(sobre)) throw new Error("No es un perfil cifrado ANALFE.");
  const sal = deB64(sobre.sal);
  const iv = deB64(sobre.iv);
  const clave = await derivarClave(contraseña, sal, sobre.iteraciones || ITERACIONES);
  try {
    const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, clave, deB64(sobre.datos));
    return JSON.parse(new TextDecoder().decode(plano));
  } catch {
    throw new Error("La contraseña no coincide.");
  }
}
