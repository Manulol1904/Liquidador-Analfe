# Liquidador ANALFE

Simulación de la compensación variable (política **PCV-COM-001**).  
**Simulación. No es un pago oficial.**

## Apps

| App | Carpeta | Uso |
|-----|---------|-----|
| **Liquidador** | [`liquidador-web/`](liquidador-web/) | Liquidación del equipo (finanzas) |
| **Simulador** | [`simulador-web/`](simulador-web/) | Simulación individual con perfil |

Demo estática (GitHub Pages): solo el **liquidador** (el simulador no se publica aún).

## Datos personales

No se versionan nombres, salarios ni encabezados reales.

- Liquidador: cargar `encabezados_comerciales.json` en la app (botón correspondiente).
- Tras clonar, si falta `liquidador-web/js/equipo.js`, cópialo desde `equipo_vacio.js`:

```bash
copy liquidador-web\js\equipo_vacio.js liquidador-web\js\equipo.js
```

(En macOS/Linux: `cp liquidador-web/js/equipo_vacio.js liquidador-web/js/equipo.js`)

## Desarrollo local

- **Liquidador / Simulador:** Live Server sobre `index.html` de cada carpeta.
- Empaquetar HTML de doble clic:

```bash
cd liquidador-web
node herramientas/empaquetar.mjs

cd ../simulador-web
node herramientas/empaquetar.mjs
```

## GitHub Pages

La carpeta [`docs/`](docs/) publica solo el liquidador empaquetado (sin datos personales ni simulador).  
En el repo: **Settings → Pages → Deploy from branch → `main` / `/docs`**.  
URL típica: `https://manulol1904.github.io/Liquidador-Analfe/` (redirige a `liquidador.html`).
