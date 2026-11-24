# Correcciones para Cursor, ronda 10 (19/11/2026): errores, organización y espacio de pantalla

Esta ronda reemplaza cualquier versión anterior de la v10. Va en **4 fases**.

**Al terminar cada fase, detente.** Muéstrame qué cambió (archivo, función o selector) y cómo probarlo, y **espera mi visto bueno** antes de seguir. No mezcles fases.

**Objetivo:** que la app sea una herramienta de finanzas cómoda para dos usuarios, el analista que liquida y su jefa que revisa. Cada pantalla debe responder su pregunta principal **sin hacer scroll en un portátil de 1366 × 768**.

**Contexto de la versión que tienes (v8):**
- la ronda 9 quedó aplicada;
- `calculos.js` es idéntico al anterior;
- los números están bien.

**Referencias:**
- Diseño: https://www.figma.com/design/Fq8LoCWzHwD4SHyuPvZScO.
- Tokens: `css/tokens.css`.
- Maquetas objetivo, con datos inventados: `ficha_1366x768.png` y `equipo_1366x768.png`, más su HTML estático (`ficha.html`, `equipo.html`, `base.css`). Te los paso aparte. Úsalos solo como referencia visual; **no copies sus cifras**.

**Reglas que siguen:**
- `calculos.js` no se toca.
- `escaparHtml` en todo dato.
- Sin CDN, sin librerías nuevas y sin peticiones externas. Gráficos en CSS o SVG a mano.
- Nada fijo en el código.
- `pruebas.html` en verde. Hoy son 35; con esta ronda quedan 39 o más.
- Consola sin errores.
- **Ningún número cambia.**
- Cada cambio se explica antes de pasar al siguiente.

---

# FASE 1: errores y regresiones (detente al terminar)

## P0-1. El selector de archivos no abre la ventana al hacer clic (carga.js `zonaArchivo`, `iniciarCarga`; css `.zona-archivo`)

**Causa, verificada con el navegador:**
- El `<input type="file" hidden>` solo se abre desde el `<label for>` de las palabras "elige un archivo", un área de 112 × 19 px, y desde "Cambiar".
- Esas palabras tienen el mismo color del texto, sin subrayado y con `cursor: default`, así que no parecen un enlace.
- Clic en cualquier otra parte de la caja de 1102 × 126 px: no pasa nada. Clic en el título "Facturación": nada.
- La zona no recibe foco (`tabIndex = -1`), así que Enter y Espacio tampoco funcionan.
- Solo funciona arrastrar, porque `dragover`/`drop` están en toda la zona.
- Además, si eliges **el mismo archivo** otra vez, `change` no se dispara porque `input.value` no se limpia.

**Corrección (copiar tal cual):**

```js
// carga.js
function zonaArchivo(tipo, titulo) {
  return `
    <div class="zona-archivo" data-zona="${tipo}" role="button" tabindex="0"
         aria-label="${titulo}: arrastra el Excel o pulsa para elegir un archivo">
      <input class="entrada-archivo sr-solo" type="file" id="archivo-${tipo}" accept=".xlsx,.xls" tabindex="-1">
      <div class="zona-archivo__vacio">
        <span class="zona-archivo__icono" aria-hidden="true">⬆</span>
        <strong>${titulo}</strong>
        <p>Arrastra el Excel aquí o <span class="enlace">elige un archivo</span></p>
        <small>.xlsx o .xls · se lee solo en este computador</small>
      </div>
      <div class="zona-archivo__lista">
        <span class="zona-nombre"></span>
        <span class="badge badge--exito">✓ Cargada</span>
        <span class="enlace">Cambiar archivo</span>
      </div>
    </div>`;
}

// dentro de iniciarCarga, en el forEach de .zona-archivo (además de dragover/drop):
const input = zona.querySelector('input[type="file"]');
const abrir = () => input.click();              // gesto del usuario: el navegador lo permite
zona.addEventListener("click", (evento) => {
  if (evento.target === input) return;          // evita doble apertura
  abrir();                                      // sin preventDefault en click
});
zona.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter" || evento.key === " ") {
    evento.preventDefault();                    // solo aquí, para que Espacio no haga scroll
    abrir();
  }
});
zona.addEventListener("dragenter", (evento) => { evento.preventDefault(); zona.classList.add("zona-archivo--sobre"); });

// en los tres listeners "change" (#archivo-facturacion, #archivo-eventos, #archivo-btl),
// al final de cada uno:
evento.target.value = "";                       // permite volver a elegir el mismo archivo
```

```css
.sr-solo { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.zona-archivo { position: relative; cursor: pointer; }
.zona-archivo:hover { border-color: var(--color-primario-500); background: var(--color-primario-50); }
.zona-archivo:focus-visible { outline: 2px solid var(--color-primario-500); outline-offset: 2px; }
.zona-archivo .enlace { color: var(--color-primario-500); font-weight: var(--peso-semibold); text-decoration: underline; }
.zona-archivo__icono { display: block; font-size: 24px; color: var(--color-primario-500); }
```

- No uses `hidden` ni `display:none` en el input; usa `.sr-solo`.
- No pongas `<label>` dentro de la zona: un `label` dentro de un elemento con su propio `click` abre el diálogo dos veces.
- **Prueba:** clic en el centro, en el título y en "elige un archivo" abre el selector **una sola vez**. Tab hasta la zona más Enter o Espacio también lo abre. Elegir dos veces el mismo archivo lo vuelve a leer. Arrastrar sigue funcionando.

## P0-2. Los montos de menos de un millón se leen mal (utilidades.js `numeroFlexible`; parametros.js `focusout` y `input`)

- `numeroFlexible("40.000")` devuelve **40**, porque un solo punto se toma como decimal. Lo mismo con "500.000" → 500.
- En Parámetros, "Valor por cartón" muestra "40.000". Si solo entras y sales del campo, pasa a "40". Si escribes "45.000", queda "4.045", y la actividad cultural de diciembre de Hernando da $ 3.478.700 en vez de $ 38.700.000.
- Afecta a todo campo `data-unidad="pesos"` y a la utilidad presupuestada de BTL con valores menores de 1.000.000.
- **Corrección:** una función para pesos, sin ambigüedad:

```js
// utilidades.js
/** Pesos colombianos: el punto es miles y la coma decimal. "40.000" → 40000; "1.234,5" → 1234.5 */
export function numeroPesos(valor) {
  const texto = String(valor ?? "").trim().replace(/[\s$]/g, "");
  if (!texto) return null;
  const normal = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number(normal);
  return Number.isFinite(numero) ? numero : null;
}
```

- Úsala en parametros.js (las dos ramas `data-unidad === "pesos"`, en `input` y en `focusout`), en `campoPesos` y en vistas.js para `utilidadEditada`.
- `numeroFlexible` queda para porcentajes y números simples.
- Añade a `pruebas.html` estos casos: `numeroPesos("40.000") === 40000`, `numeroPesos("500.000") === 500000`, `numeroPesos("15.500.000") === 15500000` y `numeroPesos("92.699.873") === 92699873`.
- **Prueba:** entrar y salir de "Valor por cartón" deja "40.000". Escribir "45.000" deja "45.000", y la actividad cultural de diciembre de Hernando da $ 38.700.000. Vuelve a 40.000 al terminar.

---

## Regresiones de la ronda 9 (también en la fase 1)

### R1. Impresión: todavía larga (`@media print`, `fichaImpresion`)
- **Hoy:**
  - Las 7 fichas dan **17 páginas** (meta ≤ 14).
  - Hernando da **3** (meta ≤ 2).
  - Con detalle dan 24 (meta ≤ 35, cumple).
- Hernando, Lynette y Oriette pasan a una tercera hoja con "Facturas del mes por uso", avisos y firmas, porque la tabla de márgenes de 14 a 15 eventos llena la hoja 2.
- **Corrección:**
  - "Facturas del mes por uso" (6 filas) va en la **hoja 1**, debajo de 5.5 a 5.7, que hoy deja un tercio libre.
  - En la hoja 2, la tabla de márgenes de impresión va en 7,5 pt, con `padding: 0.6mm 1.2mm`, una sola línea por evento (evento recortado a 50 mm con `text-overflow: ellipsis`) y columnas # · Evento · Fact. · Ingreso · Costo total · Margen · Banda.
  - Avisos y firmas van en una sola fila al final.
  - Si aun así no cabe, la tabla de márgenes impresa muestra los 12 eventos de mayor ingreso y una fila "y N eventos más (ver pantalla)".
- **Prueba:** 7 fichas en ≤ 14 páginas, Hernando en ≤ 2 y ninguna hoja con menos de un tercio de contenido.

### R2. Líneas leídas no coinciden (carga.js `pintarEstadoArchivos` y `htmlVista`)
- La lista de estado dice "Producción · 3690 líneas", pero la vista previa dice "8 de 582 líneas".
- La facturación dice 227 en la lista y 222 líneas útiles en la vista: 5 filas de totales excluidas.
- Usa la misma cifra en los dos sitios: líneas útiles, con "(+5 de totales excluidas)" al lado si aplica.

### R3. BTL en la ficha sin `parametros.xlsx` (vistas.js `fichaBtl`, `pintarBtl`)
- No es un error de cálculo. Con `parametros.xlsx` cargado, FEDESCO (575) da director $ 3.852.459 y comercial $ 0 ("Score 71,98 < 80").
- Sin ese archivo, el bloque 5.11.5 muestra 7 filas "Pendiente" y "Pendiente: falta utilidad presupuestada". No dice qué hacer.
- **Corrección:** si falta la utilidad presupuestada del evento, cambia la tabla por un `.estado-vacio` compacto (fondo `aviso-100`, borde izquierdo 3 px `aviso-700`) con:
  - el texto "**Falta la utilidad presupuestada del evento 575.** Carga `parametros.xlsx` (hoja BTL_Eventos) en 1. Cargar datos, o escríbela en la pestaña 5. BTL.";
  - dos botones, "Ir a Cargar datos" e "Ir a BTL", que llamen a `mostrarPanel`.
  - Debajo, solo IMR, ingreso del evento y tope 80 %, que ya se conocen.
- Lo mismo en la tabla de la pestaña BTL: la celda vacía de utilidad presupuestada lleva el borde `aviso-700` y el texto de ayuda "Falta. Carga parametros.xlsx o escríbela aquí".
---

# FASE 2: armazón de la app (detente al terminar)

## 2.1 Navegación: barra lateral angosta, no pestañas horizontales
**Decisión: un riel lateral izquierdo de 64 px con número de paso y estado. Se expande a 224 px con etiquetas a partir de 1440 px.**

**Por qué:**
- En un portátil de 1366 × 768, el navegador deja unos **1366 × 650 px** útiles. El recurso escaso es la **altura**, no el ancho.
- Hoy la barra azul (64 px), el banner (36 px) y las pestañas (44 px) gastan **unos 145 px**, el 22 % de la altura visible, antes del primer dato.
- El riel cuesta 64 px de ancho (4,7 %) y deja la cabecera en **48 px**, así que se recuperan unos 100 px de alto en cada pantalla.
- Además, un riel vertical muestra mejor el flujo de 7 pasos con su ✓ o !, y no se parte en 2 líneas como las pestañas a 1280 px.

**Especificación:**
- `<nav class="riel" aria-label="Pasos">` con 7 enlaces (`<a href="#ficha">`):
  - un círculo de 26 px con el número del paso; si el paso está listo, "✓" en `exito-700`;
  - un punto de 8 px en `aviso-700` arriba a la derecha si hay pendientes;
  - la etiqueta corta debajo, 10–11 px: Cargar · Parám. · Equipo · Ficha · BTL · Director · Exportar.
- **Activo:** fondo `primario-50`, círculo relleno `primario-700` y `aria-current="page"`.
- **Desactivado (sin facturación):** `aria-disabled="true"`, color `neutro-300` y `title` "Primero carga la facturación".
- **A partir de 1440 px:** ancho 224 px, con número y etiqueta larga en una fila ("4 · Ficha por comercial") y el estado a la derecha.
- Un botón "«" al pie colapsa o expande el riel, y la elección se guarda en `localStorage` (`analfe-riel`).
- **Teclado:** ↑ y ↓ se mueven entre pasos; Enter abre el paso.
- **Pantallas de 768 px o menos:** el riel pasa a una barra inferior fija de 56 px con los 7 íconos.
- Se mantiene `#hash` y `sessionStorage` de la ronda 9.

## 2.2 Barra superior compacta (48 px)
`<header class="barra-app">`, sticky en `top: 0`, fondo `primario-900`. De izquierda a derecha:
- logo de 32 px y el título "Liquidador de compensación variable" (15 px, semibold) con "PCV-COM-001" debajo (12 px, `primario-100`);
- un espacio flexible;
- **selector de mes** (`.campo-editable` compacto, "Mes · Octubre 2026 ▾"). Es el **único** selector de mes de la app: sale de Cargar y se queda aquí;
- **chip de estado** "⚠ Simulación. No es un pago oficial" (`aviso-100`/`aviso-700`, píldora, 12 px semibold);
- **chip "Cambios sin guardar"** (`.badge--aviso`), solo si aplica;
- el botón de **densidad**: "Cómodo / Compacto" (punto 2.5).

El banner amarillo y el pie azul de pantalla desaparecen; su texto vive en el chip. En impresión sí se mantienen la etiqueta de simulación y el pie de cada página.

## 2.3 Rejilla fluida de 12 columnas
```css
:root {
  --riel: 64px;
  --margen-pagina: clamp(16px, 2vw, 32px);
  --ancho-max: 1680px;
  --gutter: 16px;
}
@media (min-width: 1440px) { :root { --riel: 224px; --gutter: 20px; } }
@media (min-width: 1920px) { :root { --gutter: 24px; } }
.app { display: grid; grid-template-columns: var(--riel) minmax(0, 1fr); grid-template-rows: 48px minmax(0, 1fr); min-height: 100vh; }
main { padding: 16px var(--margen-pagina) 32px; max-width: var(--ancho-max); width: 100%; margin-inline: auto; }
.rejilla-12 { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--gutter); }
.col-3 { grid-column: span 3; } .col-4 { grid-column: span 4; } .col-5 { grid-column: span 5; }
.col-6 { grid-column: span 6; } .col-7 { grid-column: span 7; } .col-8 { grid-column: span 8; }
.col-9 { grid-column: span 9; } .col-12 { grid-column: 1 / -1; }
```

Puntos de corte:

| Ancho | Riel | Ficha | Tarjetas |
|---|---|---|---|
| < 1280 px | 64 px | 1 columna; el panel lateral pasa arriba como franja | 2 por fila |
| 1280–1439 px | 64 px | 8 + 4 columnas | 4 por fila |
| 1440–1919 px | 224 px | 8 + 4 columnas | 4 o 5 por fila |
| ≥ 1920 px | 224 px | 9 + 3 columnas | 5 por fila; contenido hasta 1680 px |

- Todas las filas de tarjetas usan `align-items: stretch` y la `.tarjeta` lleva `height: 100%`.
- **Ninguna página tiene scroll horizontal**: compruébalo con `document.documentElement.scrollWidth <= innerWidth`.

## 2.4 Tipografía y números
- Actualiza en `tokens.css`:
  - `--tipo-base: clamp(14px, 0.35vw + 9.5px, 16px)`;
  - `--tipo-sm: clamp(13px, 0.25vw + 9.6px, 15px)`;
  - `--tipo-xs: clamp(12px, 0.15vw + 10px, 13px)`.
  - Nada baja de 12 px.
- `body { font-variant-numeric: tabular-nums; }`.
- Toda cifra va alineada a la derecha con `.num` o `.dinero` (`white-space: nowrap`).
- Las etiquetas van alineadas a la izquierda.
- Montos en tablas con el mismo formato: "$ 4.729.224", porcentajes "82,2 %" y puntos "36,98".

## 2.5 Densidad: Cómodo / Compacto
- `<html data-densidad="comodo|compacto">`, guardado en `localStorage` (`analfe-densidad`). Por defecto, **compacto** en pantallas de 900 px de alto o menos y **cómodo** por encima.
- Variables:

  | Densidad | Fila de tabla | Padding de tarjeta | Gap |
  |---|---|---|---|
  | Cómodo | 40 px | 20 px | 20 px |
  | Compacto | 32 px | 14 px | 12 px |

- Solo cambian espacios, nunca el tamaño de letra.

## 2.6 Estados, mensajes y sin saltos de diseño
- **Carga de archivo:** mientras se lee un Excel, la tarjeta del archivo muestra un `.cargando` (barra indeterminada en CSS) y el texto "Leyendo hoja PRODUCTOS…". Los botones que dependen del archivo quedan desactivados.
- **Error:** `.estado-error`, con fondo `peligro-100`, borde izquierdo 3 px `peligro-700`, el mensaje en lenguaje claro ("Este archivo no tiene la hoja Facturación. Hojas encontradas: …") y el botón "Elegir otro archivo".
- **Vacío:** el `.estado-vacio` de la ronda 9, en todas las pestañas.
- **Avisos breves (toasts):** `<div class="avisos-breves" role="status" aria-live="polite">` abajo a la derecha. Aparecen 4 s al:
  - guardar ("Parámetros guardados en este navegador");
  - exportar ("Excel descargado: liquidacion_2026-10.xlsx");
  - importar;
  - restaurar un grupo;
  - cargar un archivo ("Producción cargada · 202 de 202 facturas unidas").
  - Hazlo con una función `avisoBreve(texto, tono)` en utilidades.js.
- **Sin saltos de diseño:**
  - reserva el alto de KPIs y tarjetas con `min-height` antes de tener datos;
  - los números cambian sin mover el diseño gracias a `tabular-nums`;
  - el paso de repintado (`pintarVistas`) conserva la posición del scroll y el foco: guarda `document.activeElement.id` y `scrollY` y restáuralos.

## 2.7 Accesibilidad básica
- `:focus-visible` con contorno 2 px `primario-500` y `outline-offset: 2px` en **todo** elemento interactivo: enlaces del riel, botones, `summary`, inputs, filas clicables, zonas de archivo.
- Contraste AA:
  - texto `neutro-500` solo en 12 px o más;
  - nunca `neutro-300` para texto;
  - el blanco sobre `exito-700`, `primario-700` y `primario-900` pasa.
- Todo input con `<label>` o `aria-label`, y las ayudas con `aria-describedby`.
- Un enlace "Saltar al contenido" al inicio.
- `<main id="contenido" tabindex="-1">`, que recibe el foco al cambiar de paso.
- Un orden de títulos por pantalla: un solo `h1` y luego `h2` y `h3`.
- Las filas clicables (equipo) son `<tr tabindex="0">`, con Enter para abrir y `aria-label` "Abrir ficha de …".

---

# FASE 3: Ficha y Equipo (detente al terminar)

## 3.1 Ficha por comercial (vistas.js `htmlFicha`, `pintarDetalle` y las funciones `ficha*`)

**Encima del pliegue a 1366 × 768, sin scroll:**
- el nombre;
- el selector de comercial;
- el score con su medidor;
- "¿Qué se paga este mes?";
- las 4 mini tarjetas de indicador;
- la sub-navegación.

```
1366 px ─────────────────────────────────────────────────────────────────────────────
│64│ Barra app 48 px: logo · título ······ Mes ▾ · ⚠ Simulación · Compacto           │
│  ├───────────────────────────────────────────────────────────────────────────────┤
│R │ ◀ [Comercial ▾ 220] ▶  Nombre (22 px) · cargo · salario · IMR · máx.  [Imprimir]│ 56
│I │ Resumen · 5.4 · 5.5 · 5.6 · 5.7 · Anterior y transición · BTL · Márgenes (14)…   │ 36 sub-nav sticky
│E ├──────────────────────────────────────────────┬────────────────────────────────┤
│L │ col 8 (≈ 820 px)                              │ col 4 (≈ 320 px) STICKY        │
│  │ ┌Score 280┐ ┌Indicadores 5.8 ─────────────┐ │ ¿Qué se paga este mes?          │
│  │ │ 71,98   │ │[Ventas][Base][Div.][Satisf.]│ │ ┌ Esquema anterior · Paga ───┐ │
│  │ │ medidor │ │ pts · badge · barra c/u     │ │ │ $ 4.729.224 (28 px)         │ │
│  │ │ faltan… │ └─────────────────────────────┘ │ └─────────────────────────────┘ │
│  │ └─────────┘                                  │ Política nueva          $ 0     │ ~430 px
│  │ ▾ 5.4 Ventas · 82,2 % · 36,98 de 45 pts       │ Diferencia · Transición · Básico│
│  │   tabla 4 filas                               │ BTL 5.11.5: $ 0 · badge motivo  │
│  │ ▸ 5.5 Base social · 99 % · 0,00 de 20 pts     │ Avisos (2)                      │
│  │ ▸ 5.6 … ▸ 5.7 … ▸ Anterior y transición …     │                                 │
│  │ ▸ Márgenes · 14 eventos · 13 > 20 %           │                                 │
│  │ ▸ Facturas del mes · 41 · $ 93.792.240        │                                 │
```

**Componentes:**
1. **Cabecera de ficha** (56 px, una fila):
   - `◀`, el selector `.campo-editable` de 220 px y `▶`;
   - nombre en 22 px bold;
   - una línea gris con cargo · Salario · IMR · Máximo 120 %. Son los chips de hoy pasados a texto: ahorran 60 px de alto;
   - a la derecha, "Imprimir ficha" y un menú "⋯" con "Imprimir todas" e "Incluir detalle de facturas".
   - ← y → siguen cambiando de comercial.
2. **Sub-navegación de anclas** (`<nav class="subnav" aria-label="Secciones de la ficha">`):
   - enlaces a `#ficha-resumen`, `#ficha-54`, `#ficha-55`, `#ficha-56`, `#ficha-57`, `#ficha-transicion`, `#ficha-btl`, `#ficha-margenes` y `#ficha-facturas`, con el conteo entre paréntesis en Márgenes y Facturas;
   - sticky bajo la barra (`top: 48px`), 36 px, con borde inferior;
   - el enlace de la sección visible se resalta con `IntersectionObserver`;
   - al pulsar una sección cerrada, la abre y hace scroll suave.
3. **Columna izquierda (col 8):**
   - **Fila de resumen:**
     - **Tarjeta de score** (280 px): el valor en 40 px, el medidor D5 (abajo) y la línea "Faltan 8,02 pts para 80" en `peligro-700` (o "Factor de pago 91,8 %").
     - **Tarjeta "Indicadores · 5.8"**: 4 mini tarjetas en una fila (Ventas · Base social · Diversificación · Satisfacción), cada una con el nombre y el peso (12 px), los puntos (20 px bold), un `.badge` de cumplimiento y una `.barra` de 6 px con tope en 120 %. **Clic en una mini tarjeta abre su sección.**
     - Esto reemplaza la tabla 5.8 en pantalla. La tabla completa (Peso · Máx. · Puntos · Cumplimiento) queda dentro de "Resumen ▸ Ver tabla 5.8" y en la impresión.
     - La "Curva de pago" pasa a un `title` en el medidor y a un `details` "Ver curva".
   - **Secciones plegables** (`<details class="seccion" id="ficha-54">`). El `summary` lleva todo el resumen en una línea:
     - título · `.badge` de cumplimiento · a la derecha "36,98 de 45 pts · margen 51,4 %".
     - 5.5: "99 % · 0,00 de 20 pts · cierre 99 / meta 101".
     - 5.6: "Pendiente · 20,00 (neutral)".
     - 5.7: "Pendiente · 15,00 (neutral)".
     - "Esquema anterior y transición": "$ 4.729.224 · se paga el anterior".
     - Márgenes: "14 eventos · 13 mayor al 20 % · 1 No aplica".
     - Facturas: "41 facturas · base $ 93.792.240 sin BTL · 7 sin fecha".
     - **Abierta por defecto solo 5.4.** El resto, cerradas. El estado abierto o cerrado de cada sección se recuerda por sesión.
     - Con los editables de 5.5, 5.6 y 5.7 vacíos, el `summary` lleva un `.badge--aviso` "Falta dato" para que no se pase por alto.
   - **Dentro de 5.5, 5.6 y 5.7:** la rejilla etiqueta/valor de D3 (abajo).
   - **"Esquema anterior y transición"**: una sola tarjeta (antes eran dos). A la izquierda, la comisión anterior en `--tipo-kpi`, "Ver las 32 líneas ▾" y la fórmula. A la derecha, la tabla del comparativo.
   - **Márgenes** y **Facturas**: cerradas por defecto, con el formato D4 (abajo).
   - **Facturas** lleva una barra de filtros sobre la tabla:
     - búsqueda de texto (`input type="search"`, filtra por factura, cuenta o evento);
     - un selector "Uso" (los 6 grupos);
     - un selector "Estado" (Cancelada / No cancelada / Sin fecha);
     - el contador "Mostrando 12 de 41".
     - Filtra en vistas.js sin recalcular.
4. **Columna derecha (col 4, `position: sticky; top: 92px`)**, el panel de resumen:
   - "¿Qué se paga este mes?": el recuadro del esquema que paga (`.recuadro-pago.paga`, 28 px) y, debajo, el otro esquema en una fila gris ("Política nueva · $ 0").
   - Una lista concepto/valor: Diferencia · Transición oct–dic ("el mayor") · Básico + transición.
   - **BTL 5.11.5:** la comisión del comercial con el `.badge` del motivo y el pago del director en una línea, o el estado vacío R3 si falta `parametros.xlsx`. Clic lleva a `#ficha-btl`.
   - **Avisos:** el conteo, con un `details` para ver la lista.
   - Por debajo de 1280 px, este panel pasa arriba como franja horizontal de 3 bloques.

## 3.2 Resultados del equipo (`pintarEquipo`)
**Encima del pliegue:** los KPIs, el gráfico nueva contra anterior y el ranking completo de 7 comerciales con su total.

```
│R │ Resultados del equipo · Octubre 2026 · 7 comerciales ············ [Exportar a Excel] │ 40
│I │ [Total sin BTL][Pagan nueva][Pagan anterior][Score promedio][Director]  5 × col ~2,4 │ 84
│E ├──────────── col 5 ────────────┬──────────────────── col 7 ─────────────────────────┤
│L │ Nueva vs anterior (SVG/CSS)     │ Ranking (sticky 1.ª columna)                        │
│  │ Nombre ▬▬▬ nueva                │ Comercial · Score▬ · Factor · Nueva · Anterior ·     │ ~360
│  │        ▬▬▬▬▬▬ anterior  $ monto │ Se paga · Avisos   (7 filas × 32 px + total)        │
│  │ (7 filas × 22 px)               │ Clic en fila → ficha                                │
```

1. **KPIs** (5 tarjetas de 84 px, `white-space: nowrap`, valor `clamp(20px, 1.6vw, 26px)`):
   - Total a pagar sin BTL;
   - Pagan política nueva ("0 de 7", en verde solo si es mayor que 0);
   - Pagan esquema anterior;
   - Score promedio, con "mínimo para pagar 80";
   - Director: el monto, el esquema y el score.
2. **Gráfico "Nueva vs anterior"** (col 5), en CSS puro:
   - por comercial, dos barras de 7 px a la misma escala, nueva en `primario-500` y anterior en `neutro-300`, y el monto pagado a la derecha;
   - una leyenda arriba;
   - `role="img"` con un `aria-label` que resume ("Ninguno supera la política anterior").
   - Escala = el máximo de las dos columnas.
3. **Ranking** (col 7, `.tabla`):
   - la primera columna (Comercial) es `position: sticky; left: 0`;
   - ordenable por cualquier columna; por defecto, score de mayor a menor;
   - Score con mini barra (tope 120, marca en 80);
   - la columna "Se paga" con `.badge` y el monto;
   - Avisos como `.badge--aviso`;
   - fila total en `tfoot`;
   - **la fila entera es clicable** (y con Enter) y abre la ficha de esa persona; al pasar el mouse, fondo `primario-50`;
   - debajo, la ayuda "Clic en una fila para abrir su ficha · ↑↓ para moverse".
4. La "Distribución de score" de la ronda 9 sale de esta pantalla: el ranking y el gráfico ya cubren esa información.

---

# FASE 4: Cargar, Parámetros, BTL, Director y Exportar, más el pulido (detente al terminar)

## 4.1 Cargar datos (`iniciarCarga`)
**Encima del pliegue:** las 3 tarjetas de archivo con su estado y el botón para seguir.

```
│R │ Cargar datos · Octubre 2026 (el mes está en la barra superior)                       │
│I │ ┌ Facturación ──────────┐ ┌ Producción ───────────┐ ┌ Parámetros BTL (opcional) ┐  │
│E │ │ zona (P0-1) o estado: │ │ zona o estado:        │ │ zona o estado:            │  │ ~190
│L │ │ archivo… · ✓ Cargada  │ │ PRODUCTOS · 582 lín.  │ │ 1 evento BTL · ✓          │  │
│  │ │ Facturacion+2 · 222   │ │ 202/202 unidas ✓      │ │                           │  │
│  │ │ [Cambiar] [Columnas ▾]│ │ [Cambiar] [Columnas ▾]│ │ [Cambiar]                 │  │
│  │ └───────────────────────┘ └───────────────────────┘ └───────────────────────────┘  │
│  │                                             [Ver resultados del equipo →] (primario)│
│  │ ▸ Vista previa: Facturación (8 de 222) · ▸ Producción (8 de 582)   (pestañas)        │
│  │ ▸ Advertencias (4 grupos · 238 filas)                                               │
```

- Las 3 tarjetas van en una fila (col 4 cada una), con la misma altura.
  - **Sin archivo:** la zona del P0-1.
  - **Con archivo:** una lista de 3 líneas:
    - nombre recortado con `ellipsis` y el nombre completo en `title`;
    - hoja · líneas útiles (R2);
    - el dato clave: facturas unidas o eventos BTL.
  - Con `.badge` de estado y dos botones pequeños: "Cambiar" y "Columnas (11/11 ✓) ▾", que abre la asignación de columnas en un panel bajo las tarjetas.
- El botón "Ver resultados del equipo →" va alineado a la derecha, con su ancho natural.
- **Vista previa** en una sola tarjeta con 2 pestañas segmentadas (Facturación | Producción), cerrada por defecto. Las tablas siguen el formato D4: sin scroll vertical propio y con texto largo recortado.
- **Advertencias** en una tarjeta plegable con los grupos de la ronda 9.

## 4.2 Parámetros y metas (`htmlFormulario`)
**Encima del pliegue:** la barra de acciones, la búsqueda, las pestañas de grupo y el primer grupo completo.

```
│R │ Parámetros y metas   [🔍 Buscar parámetro…]   ● 2 cambios sin guardar  [Guardar] [⋯]│ 48 sticky
│I │ Reglas · Curva · Costos y Misión · BTL · Director · Comerciales · Metas por mes      │ 36 pestañas de grupo
│E ├──────────────────────── col 8 ─────────────────────────┬───────── col 4 ────────────┤
│L │ Pesos del score (5.8)                [Restaurar grupo] │ Ayuda del grupo             │
│  │ Ventas      [ 45 pts]   Base social [ 20 pts]          │ "Cada peso es el máximo …"   │
│  │ SERFISCAL   [ 10 pts]   Innovación  [ 10 pts]          │ Mini curva SVG (en Curva)    │
│  │ Satisfacción[ 15 pts]   Suma = 100 ✓                   │ Valores iniciales del grupo  │
```

- **Pestañas de grupo**: Reglas (pesos) · Curva de pago · Costos y Misión · BTL · Director · Comerciales · Metas por mes. Van con `role="tablist"`, se muestra un grupo a la vez y la elección se recuerda. Sustituyen las 6 tarjetas largas apiladas.
- **Formulario a 2 columnas** (`grid-template-columns: repeat(2, minmax(0, 1fr))` dentro de col 8):
  - cada campo es una fila etiqueta (izquierda, 40 %) / caja (derecha, 60 %, `max-width: 220px`);
  - la unidad va **dentro** de la caja ("$" a la izquierda; "%", "pts" o "veces" a la derecha, en `neutro-500`);
  - la ayuda va en 12 px debajo, con `aria-describedby`.
- **Búsqueda**: filtra por etiqueta o ayuda en todos los grupos, salta al grupo y resalta el campo (`mark`).
- **"Restaurar grupo"** por tarjeta: vuelve solo ese grupo a `PARAMETROS_INICIALES`, pide confirmación y muestra un aviso breve.
- **Indicador de cambios:**
  - un punto `aviso-700` en cada campo editado y no guardado, con el valor guardado en `title`;
  - el conteo "2 cambios sin guardar" en la barra;
  - el mismo chip en la barra superior;
  - al salir de la página con cambios, `beforeunload`.
- **Comerciales:** la tabla de 7 columnas de la ronda 9, con la primera columna sticky. Documento y Cargo van en una 2.ª línea editable.
- **Metas por mes:** el selector segmentado Oct · Nov · Dic de la ronda 9.
- Los campos de pesos usan `numeroPesos` (P0-2).

## 4.3 BTL (`pintarBtl`)
**Encima del pliegue:** los KPIs y la tabla de eventos con sus pagos.
- Encabezado de 40 px y 4 KPIs de 84 px: Eventos · Pago comerciales · Pago director · Pendientes.
- Tabla en col 12 sin scroll lateral (anchos de la ronda 9), con la utilidad presupuestada editable y el estado vacío R3 si falta. Pagos y condiciones como hoy.
- "Cómo se liquida" y "Avisos" van debajo, en col 6 + col 6, cerrados por defecto ("Cómo se liquida ▸").

## 4.4 Director (`pintarDirector`)
**Encima del pliegue:** el score con su medidor, "¿Qué se paga?", la tabla 5.8 resumida y el método usado. Es el mismo patrón que la Ficha.
- Cabecera de 56 px: "Director comercial · Octubre 2026" y, en gris, Oportunidad (base del pago) · IMR · Método usado · "19 facturas sin fecha" como `.badge--aviso`.
- Columna izquierda (col 8): la fila score + 4 mini tarjetas de indicador (igual que la ficha), y debajo las secciones plegables 5.4 (abierta), Fórmulas y "Comparar métodos".
- Columna derecha sticky (col 4): ¿Qué se paga? y una mini tabla de los 3 métodos (Score · Factor · Pago), con el usado resaltado.

## 4.5 Exportar e imprimir (`pintarExportar`)
- 3 tarjetas en una fila (Excel · Imprimir fichas · Parámetros JSON), cada una con su descripción, sus opciones y su botón.
- Al terminar, un aviso breve.
- Encima del pliegue: todo.

## 4.6 Diseño de detalle (de la versión anterior de esta ronda; se mantiene)

#### D1. Ancho fluido y letra más grande (tokens.css, estilos.css `main`, `body`)
- **Hoy:** `main` tiene 1200 px fijos. A 1920 px quedan 360 px vacíos a cada lado. El cuerpo va en 15 px, pero las tablas en 13 px y las etiquetas en 11 a 12 px, y se ven diminutas en pantallas grandes.
- **Corrección:**

```css
:root {
  --ancho-contenido: min(1560px, 100% - 2 * clamp(16px, 3vw, 48px));
  --tipo-base: clamp(14px, 0.35vw + 9.5px, 16px);   /* 14 px a 1366, ~16 px a 1920 */
  --tipo-sm: clamp(13px, 0.25vw + 9.6px, 15px);     /* tablas */
  --tipo-xs: clamp(12px, 0.15vw + 10px, 13px);      /* etiquetas: nunca menos de 12 px */
}
body { font-size: var(--tipo-base); }
main { width: var(--ancho-contenido); max-width: none; margin-inline: auto; }
.tabla td, .tabla th { font-size: var(--tipo-sm); }
.kpi__etiqueta, .chip small, .tarjeta-score__escala { font-size: var(--tipo-xs); }
```

- Actualiza `tokens.css` con estas fórmulas. Figma sigue siendo la referencia a 1440 px: 15 px de cuerpo y 13 px de tabla.
- **Prueba:** a 1920 × 1080, el margen lateral queda ≤ 180 px y el texto de tabla mide ≥ 14 px. A 1366 × 768, nada se desborda.

#### D2. Rejilla de tarjetas con alturas iguales (`.fila-resumen`, `.fila-58`, `.tres-columnas`, `.dos-columnas`, `.kpis`)
- **Hoy:** `align-items: start` deja tarjetas de alturas distintas: 5.5, 5.6 y 5.7; Política anterior frente a Comparativo; score frente a "¿Qué se paga?".
- **Corrección:** `align-items: stretch` en todas las filas, y en `.tarjeta` añade `height: 100%`.
- Por encima de 1600 px, `.fila-58` pasa a `1fr 380px` y `.tres-columnas` se mantiene.
- **"1. Política anterior"** casi vacía: junta "1. Política anterior" y "3. Comparativo y transición" en **una sola tarjeta**, "Esquema anterior y transición". A la izquierda, el comisión anterior grande (`--tipo-kpi`), el enlace "Ver las 32 líneas ▾" y la fórmula. A la derecha, la tabla del comparativo.
- **KPIs del equipo:** "$ 21.707.960" se parte en 2 líneas a 1366 px. Usa `.kpi__valor { white-space: nowrap; font-size: clamp(22px, 1.6vw, 28px); }`.

#### D3. Formularios como rejilla etiqueta/valor (vistas.js `fichaBaseSocial`, `fichaInnovacion`, `fichaSatisfaccion`; css `.lista-concepto`)
- **Hoy:** en 5.5 a 5.7, la etiqueta y el input se aprietan ("Puntos por oferta aprobada" en 2 líneas al lado de un input), y los textos "0 (2 por cada oferta)" se parten.
- **Corrección:**

```css
.lista-concepto { display: grid; grid-template-columns: minmax(0, 1fr) 140px; column-gap: var(--espacio-4); }
.lista-concepto > li { display: contents; }
.lista-concepto > li > span:first-child { padding: 8px 0; border-bottom: 1px solid var(--color-neutro-200); color: var(--color-neutro-700); }
.lista-concepto > li > :last-child { padding: 6px 0; border-bottom: 1px solid var(--color-neutro-200); text-align: right; justify-self: stretch; }
.lista-concepto .campo-editable { width: 100%; text-align: right; }
.lista-concepto small { grid-column: 1 / -1; color: var(--color-neutro-500); font-size: var(--tipo-xs); }
```

- Las notas como "(2 por cada oferta)" van en una línea `small` debajo, no dentro del valor.
- Cada tarjeta cierra con una fila "Puntos" en semibold.
- En Parámetros pasa lo contrario: el input ocupa todo el ancho de la tarjeta (480 px para "45") y la unidad queda fuera. Pon la unidad **dentro** de `.caja-campo` (prefijo o sufijo en `neutro-500`) y usa una rejilla `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` para los campos de cada tarjeta. Reduce el aire vacío bajo la barra de acciones: hoy son unos 70 px.

#### D4. Márgenes y Facturas sin scroll anidado (vistas.js `fichaMargenes`, `fichaFacturas`; css `.tabla-scroll`)
- **Hoy:**
  - Márgenes: el evento se corta a media palabra en la 3.ª línea, "▸ 5 facturas" ocupa 2 líneas y "26,5 %" se parte.
  - Facturas: va dentro de una caja con scroll propio (`max-height: 70vh`) y barra gruesa, la columna Cuenta ocupa 4 líneas, "FV FEC 15256" ocupa 3 y "Venta reconocida" queda fuera a la derecha.
- **Corrección:**
  - En la ficha, **sin `max-height` ni scroll vertical propio**. La página es el único scroll. Ocultar o mostrar la tabla con `<details>` está bien.
  - `table-layout: fixed` con anchos fijos.
    - Márgenes: # 56 · Evento auto · Facturas 96 · Ingreso 120 · Costo 120 · ICA 96 · GMF 88 · Costo total 120 · Margen 80 · Banda 170.
    - Facturas: Factura 120 · Hoja 96 · Producto 150 · Cuenta auto · Evento 64 · Base 110 · Estado 100 · Fecha de pago 96 · Elegible 64 · Recaudo 110 · Factor 64 · Venta reconocida 120.
  - Evento y Cuenta en **una línea** con `text-overflow: ellipsis` y el texto completo en `title`. Si quieres 2 líneas, usa `-webkit-line-clamp: 2` con `line-height: 1.3` y `max-height: 2.6em`, para que nunca se vea una tercera línea cortada.
  - `white-space: nowrap` en factura, cifras, porcentajes, fechas y "N facturas".
  - Encabezado fijo respecto a la página: `thead th { position: sticky; top: var(--alto-cabecera-fija); }`. `--alto-cabecera-fija` es la suma de la altura del banner, las pestañas y la barra de la ficha, que se calcula en JS con `ResizeObserver`. El contenedor va con `overflow: visible`.
  - En Facturas, "Hoja" y "Producto" pueden ir como texto pequeño debajo de "Cuenta" para ganar ancho. Así no se necesita scroll lateral a 1366 px.
- **Prueba:** a 1366 px, ninguna tabla de la ficha tiene scroll horizontal ni vertical propio, y ninguna celda pasa de 2 líneas.

#### D5. Medidor de score legible (vistas.js `tarjetaScore`; css `.tarjeta-score__*`)
- **Hoy:** pista de 10 px, marcas blancas de 2 px casi invisibles y etiquetas de 11 px. Además, **las etiquetas están mal ubicadas**: `justify-content: space-between` reparte 0 · 80 · 90 · 100 · 110 · 120 a partes iguales, así que el "80" queda al 20 % del ancho y no al 66,7 %.
- **Corrección:**
  - Pista de 14 px.
  - Zona 0–80 en `peligro-100`, 80–100 en `aviso-100` y 100–120 en `exito-100`.
  - Relleno `primario-500`.
  - Marcas de 2 × 22 px en `neutro-700` en 80, 90, 100 y 110.
  - Etiquetas posicionadas en absoluto en `left: calc(valor / 120 * 100%)`, con `transform: translateX(-50%)` y fuente `--tipo-xs` semibold.
  - Un marcador triangular (▼) sobre el score actual.
  - Debajo, en `--tipo-sm`: "Faltan 8,02 puntos para 80 (mínimo para pagar)" si el score es menor de 80, o "Factor de pago 91,8 %" si no.
- Usa el mismo componente en Director y en la tabla del equipo (versión mini sin etiquetas).

#### D6. Detalles
- **"Cambiar" en la zona ya cargada:** se ve como texto plano. Es parte del P0-1 (`.enlace`).
- **Lista de estado de archivos:** el nombre largo del archivo (hash) parte la fila en 3 líneas. Recórtalo con `text-overflow: ellipsis` y `max-width: 40ch`, con el nombre completo en `title`. Pon el badge a la derecha en la misma línea, con una rejilla de 3 columnas: nombre · detalle · estado.
- **Botón "Ver resultados del equipo →":** ocupa todo el ancho. Déjalo con su ancho natural, alineado a la derecha.
- **Tabla "Curva de pago":** resalta "Menor a 80 puntos · 0 %" en `peligro-100`, no en `primario-100`, cuando ese es el tramo que aplica.
- **Equipo:** "Pagan política nueva 0 de 7" sale en verde. Usa el verde solo si es mayor que 0; con 0, usa `neutro-900`.
- **Barra superior fija:** la barra de herramientas de la ficha (`position: sticky`) tapa el título de la tarjeta al hacer scroll. Dale fondo `neutro-100`, sombra inferior y `z-index` por debajo de pestañas y banner.
> Ajuste a D1: el `--ancho-contenido` de D1 queda sustituido por la rejilla de 2.3, con máximo de 1680 px.
> Ajuste a D2: "Política anterior + Comparativo" se juntan como dice 3.1.
> Ajuste a D4: en la ficha, Márgenes y Facturas quedan **cerradas por defecto**. En el `summary` van el conteo y los totales.

## 4.7 Impresión (se mantiene: ≤ 2 páginas por ficha)
- La impresión **no** usa el diseño de pantalla. Sigue usando `fichaImpresion`, con el ajuste R1.
- No se imprimen el riel, la barra superior, la sub-navegación, los filtros, el panel sticky ni los avisos breves.
- Las secciones plegables se imprimen **abiertas** según su versión impresa: 5.8 como tabla completa y facturas solo por uso, salvo que esté marcado "Incluir detalle".

---

## Componentes que se reutilizan (de tokens.css y Figma; no crees nuevos sin necesidad)

`.barra-app` · `.riel` · `.subnav` · `.tarjeta` · `.kpi` · `.badge--exito/aviso/peligro/neutro/paga` · `.recuadro-pago(.paga)` · `.tarjeta-score` con el medidor D5 · `.mini-indicador` (nuevo: tarjeta pequeña de indicador) · `.barra` (tope 120 %, marca 100 %) · `.tabla` (`.num`, `.dinero`, `.fila-total`, `.fila-grupo`, sticky) · `.seccion` (details con summary-resumen) · `.lista-concepto` (D3) · `.campo-editable` · `.campo-calculado` · `.caja-campo` (unidad dentro) · `.formula` · `.zona-archivo` (P0-1) · `.estado-vacio` · `.estado-error` · `.cargando` · `.avisos-breves` · `.boton` · `.boton--primario` · `.segmentado` (pestañas pequeñas) · `.chip-estado`.

---

## Prueba de aceptación (archivos reales de octubre + parametros.xlsx)

**Números idénticos**, sin editar ingresos ni retiros:
- Scores 53,51 · 61,41 · 71,98 · 41,90 · 57,08 · 55,34 · 58,41.
- Esquema anterior 2.584.400 · 772.050 · 4.729.224 · 1.643.920 · 3.821.877 · 3.838.759 · 4.317.730.
- Director 91,83 / $ 7.208.412 contra $ 3.545.215.
- FEDESCO (575): director $ 3.852.459 con las 5 condiciones y `parametros.xlsx` cargado, comercial $ 0 ("Score 71,98 < 80"), utilidad presupuestada 92.699.873 leída sola.
- Unión 202 de 202.
- Hernando, "Total sin BTL": base $ 93.792.240, recaudo $ 81.030.525.
- Si en la ficha de Hernando se suben los ingresos de base social hasta un cierre de 101, el score pasa a 91,98 ($ 8.231.176). Es correcto.

**Fase 1:**
- **Selector:** clic en cualquier parte de la zona abre el selector **una vez**; Tab + Enter o Espacio también lo abre; se puede elegir de nuevo el mismo archivo; arrastrar funciona.
- **Montos:** "40.000" se mantiene al entrar y salir del campo; "45.000" queda 45000; hay 4 pruebas nuevas de `numeroPesos` en verde.
- **Impresión:** 7 fichas en ≤ 14 páginas, Hernando en ≤ 2 y, con detalle, ≤ 35. Ninguna hoja con menos de un tercio de contenido.
- **Datos:** líneas leídas iguales en la lista de estado y en la vista previa; el estado vacío de BTL dice qué archivo cargar.

**Fase 2 y siguientes, a 1366 × 768** (prueba con puppeteer y viewport de 1366 × 768; si el navegador real deja 1366 × 650, lo esencial debe seguir visible):

| Pantalla | Visible sin scroll (`getBoundingClientRect().bottom <= innerHeight`) |
|---|---|
| Ficha | nombre, medidor de score, "¿Qué se paga?" con monto y esquema, las 4 mini tarjetas, la sub-navegación |
| Equipo | 5 KPIs, el gráfico completo y la fila Total del ranking |
| Cargar | las 3 tarjetas de archivo y el botón "Ver resultados" |
| BTL | KPIs y la fila del evento 575 con ambos pagos |
| Director | score, "¿Qué se paga?" y método usado |
| Parámetros | barra de acciones, pestañas de grupo y el grupo Reglas completo |
| Exportar | las 3 tarjetas |

**Diseño y uso:**
- Ninguna página con scroll horizontal a 1280, 1366, 1440 y 1920 px (`scrollWidth <= innerWidth`).
- Ninguna tabla de la ficha con scroll propio.
- Ninguna celda de más de 2 líneas.
- Tarjetas de una misma fila con la misma altura.
- La cabecera de la app (barra superior) mide ≤ 48 px. No hay banner ni pie en pantalla.
- La densidad se guarda y se mantiene al recargar. En Compacto, las filas de tabla miden 32 px.
- La sub-navegación de la ficha resalta la sección visible.
- Facturas se puede filtrar por texto, uso y estado, con el contador correcto.
- Clic o Enter en una fila del ranking abre esa ficha.
- Aparecen avisos breves al guardar, exportar, importar, restaurar un grupo y cargar.
- Al editar un campo de la ficha no se pierde el foco ni la posición del scroll.

**Accesibilidad básica** (tipo Lighthouse):
- todo control con nombre accesible;
- contraste AA en textos;
- foco visible en todo elemento interactivo, y se llega a todo con Tab;
- un solo `h1` por pantalla;
- `lang="es"`;
- botones de verdad (`button`) y enlaces de verdad (`a href`);
- "Saltar al contenido" funciona;
- ningún texto menor de 12 px.

**Técnico:**
- ningún color hexadecimal fuera de `tokens.css`;
- ninguna petición externa (pestaña Network);
- pruebas.html en verde (≥ 39) y consola sin errores.

Al terminar **cada fase**, dame la lista de archivos tocados y, por cada uno, qué cambió y por qué, y espera mi visto bueno.
