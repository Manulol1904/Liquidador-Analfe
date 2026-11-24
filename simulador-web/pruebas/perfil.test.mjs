import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const {
  validarPerfil,
  csvAPerfil,
  huellaPerfil,
  verificarHuella,
  canonico,
} = await import("../js/perfil.js");
const { cifrarPerfil, descifrarPerfil, esPerfilCifrado } = await import("../js/cifrado.js");

const ejemplo = JSON.parse(
  fs.readFileSync(path.join(RAIZ, "datos_ejemplo", "perfil_ejemplo_comercial.json"), "utf8")
);

describe("validarPerfil", () => {
  it("acepta el ejemplo comercial", () => {
    const r = validarPerfil(ejemplo);
    assert.equal(r.ok, true);
  });

  it("rechaza formato incorrecto", () => {
    const r = validarPerfil({ formato: "otro", version: 1, tipo: "comercial" });
    assert.equal(r.ok, false);
    assert.match(r.error, /no es un perfil/i);
  });

  it("rechaza tope fuera de rango", () => {
    const r = validarPerfil({
      ...ejemplo,
      compensacion: { ...ejemplo.compensacion, topeIndividual: 2 },
    });
    assert.equal(r.ok, false);
    assert.match(r.error, /tope individual/i);
  });

  it("avisa modo director", () => {
    const r = validarPerfil({
      ...JSON.parse(fs.readFileSync(path.join(RAIZ, "datos_ejemplo", "perfil_ejemplo_director.json"), "utf8")),
    });
    assert.equal(r.ok, true);
    assert.ok(r.avisos.some((a) => /Director/i.test(a)));
  });

  it("avisa campos desconocidos", () => {
    const r = validarPerfil({ ...ejemplo, extrano: 1 });
    assert.equal(r.ok, true);
    assert.ok(r.avisos.some((a) => /extraño|extrano|desconocido/i.test(a)));
  });
});

describe("CSV", () => {
  it("convierte la plantilla a perfil válido", () => {
    const csv = fs.readFileSync(path.join(RAIZ, "plantillas", "plantilla_perfiles.csv"), "utf8");
    const r = csvAPerfil(csv);
    assert.equal(r.ok, true, r.error);
    assert.equal(r.perfil.tipo, "comercial");
    assert.equal(r.perfil.compensacion.basico, 5_000_000);
    assert.ok(r.perfil.periodos.length >= 1);
  });
});

describe("huella sha256", () => {
  it("detecta modificación", async () => {
    const h = await huellaPerfil(ejemplo);
    const conHuella = { ...ejemplo, control: { sha256: h } };
    const ok = await verificarHuella(conHuella);
    assert.equal(ok.ok, true);

    const tocado = structuredClone(conHuella);
    tocado.compensacion.basico = 1;
    const bad = await verificarHuella(tocado);
    assert.equal(bad.ok, false);
    assert.match(bad.aviso, /modificado/i);
  });

  it("canonico es estable", () => {
    assert.equal(canonico({ b: 1, a: 2 }), canonico({ a: 2, b: 1 }));
  });
});

describe("cifrado .analfe", () => {
  it("cifra y descifra", async () => {
    const sobre = await cifrarPerfil(ejemplo, "clave-prueba-analfe");
    assert.equal(esPerfilCifrado(sobre), true);
    const plano = await descifrarPerfil(sobre, "clave-prueba-analfe");
    assert.equal(plano.persona.nombreVisible, ejemplo.persona.nombreVisible);
  });

  it("contraseña incorrecta", async () => {
    const sobre = await cifrarPerfil(ejemplo, "buena");
    await assert.rejects(() => descifrarPerfil(sobre, "mala"), /contraseña/i);
  });
});
