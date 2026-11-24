# Correcciones para Cursor, ronda 8 (19/11/2026): sistema visual

Esta ronda es **solo visual**. Implementa el diseño "Liquidador ANALFE – Sistema visual" sin cambiar ningún número.

- Diseño en Figma (referencia): https://www.figma.com/design/Fq8LoCWzHwD4SHyuPvZScO
- Este archivo trae todos los valores. No necesitas abrir Figma.
- El diseño de Figma usa solo datos ficticios ("Comercial A", montos redondos). No copies a la app ningún texto ni cifra de ejemplo.

**Paso 0, ronda 7.** Si `correcciones_cursor_v7.md` todavía no está aplicada, aplícala primero: agrupación de "Facturas del mes", impresión de 1 a 2 páginas, facturas repetidas en márgenes, "Pendiente · neutral", recuadros, `nowrap` y casilla. La copia completa va en el anexo al final. Esta ronda se apoya en ella.

Reglas que siguen:
- `calculos.js` puro, sin tocar: esta ronda no toca la lógica.
- `escaparHtml` en todo dato.
- **Sin CDN:** ni Google Fonts, ni íconos externos, ni `@import` remoto.
- Nada fijo en el código.
- `pruebas.html` en verde y consola sin errores.
- Antes de pasar al siguiente punto, explícame cada cambio: archivo, función o selector, y cómo probarlo.

---

## 1. Tokens: nuevo archivo `css/tokens.css`

Crea `css/tokens.css` y cárgalo en `index.html` **antes** de `estilos.css`. Los nombres y valores deben ser exactamente estos, porque son las variables de Figma (colección "Tokens", modo "Claro"):

```css
/* css/tokens.css. Tomado de las variables de Figma "Liquidador ANALFE – Sistema visual". */
:root {
  /* Primario (azul institucional) */
  --color-primario-900: #0B2545;
  --color-primario-700: #13315C;
  --color-primario-500: #1F4E8C;
  --color-primario-100: #E3ECF7;
  --color-primario-50:  #F2F6FB;
  /* Neutros */
  --color-neutro-900: #1A2230;
  --color-neutro-700: #3D4756;
  --color-neutro-500: #6B7585;
  --color-neutro-300: #C9D0DA;
  --color-neutro-200: #E2E7EE;
  --color-neutro-100: #F1F4F8;
  --color-neutro-0:   #FFFFFF;
  /* Estados */
  --color-exito-700:   #1E7B4B;  --color-exito-100:   #E3F4EA;
  --color-aviso-700:   #9A6400;  --color-aviso-100:   #FFF1D6;
  --color-peligro-700: #B42318;  --color-peligro-100: #FDE7E5;
  /* Parámetros editables (amarillo) */
  --color-editable-fondo: #FFF8D6;
  --color-editable-borde: #E8C547;
  /* Acento */
  --color-acento-oro: #C9A227;

  /* Espaciado (grilla de 4/8) */
  --espacio-1: 4px;  --espacio-2: 8px;  --espacio-3: 12px; --espacio-4: 16px;
  --espacio-5: 24px; --espacio-6: 32px; --espacio-7: 48px;

  /* Radios */
  --radio-sm: 4px; --radio-md: 8px; --radio-lg: 12px; --radio-pill: 999px;

  /* Tipografía (escala en px; Inter o la fuente del sistema) */
  --fuente: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
  --tipo-xs: 12px; --tipo-sm: 13px; --tipo-base: 15px; --tipo-lg: 18px;
  --tipo-xl: 22px; --tipo-2xl: 28px; --tipo-kpi: 32px;
  --peso-regular: 400; --peso-medio: 500; --peso-semibold: 600; --peso-bold: 700;

  /* Sombra de tarjeta */
  --sombra-tarjeta: 0 2px 8px rgba(10, 23, 51, 0.07), 0 1px 2px rgba(10, 23, 51, 0.05);

  /* Contenedor */
  --ancho-contenido: 1200px;
}
```

- **Fuente.** Si quieres Inter, guarda `Inter-Regular/Medium/SemiBold/Bold.woff2` (licencia OFL) en `lib/fonts/` y decláralos con `@font-face` y `font-display: swap`, con ruta relativa `../lib/fonts/...`. Si no hay archivos, no pasa nada: la pila de `--fuente` cae a Segoe UI o system-ui. **Nunca** cargues la fuente desde internet.
- **Variables viejas.** En `estilos.css`, reemplaza `--azul`, `--azul-oscuro`, `--gris-fondo`, `--gris-texto`, `--gris-calculo`, `--amarillo-entrada`, `--borde` y `--sombra` por los tokens nuevos. Equivalencias:
  - `--azul` → `--color-primario-500`
  - `--azul-oscuro` → `--color-primario-900`
  - `--gris-fondo` → `--color-neutro-100`
  - `--gris-texto` → `--color-neutro-900`
  - `--gris-calculo` → `--color-neutro-100`
  - `--amarillo-entrada` → `--color-editable-fondo`
  - `--borde` → `--color-neutro-200`
  - `--sombra` → `--sombra-tarjeta`

  Después de eso no debe quedar ningún color hexadecimal suelto en `estilos.css`, salvo dentro de `tokens.css`.
- **Cifras.** Usa `font-variant-numeric: tabular-nums;` en `body` para que se alineen.

## 2. Componentes: clases en `estilos.css`

Usa estas clases. Si ya existe una clase equivalente, renómbrala o agrégala al lado, y actualiza las plantillas de `vistas.js` (`recuadrosPago`, `distintivo`, `barraCumplimiento`, `fila58`, `bloqueMetodo`, `pintarBtl`, `htmlFicha`).

| Clase | Especificación |
|---|---|
| `.app-bar` | Fondo `--color-primario-900`, padding 16px 32px. Título "Liquidación de compensación variable" en 22px bold blanco. Subtítulo "ANALFE · Política PCV-COM-001" en 13px `--color-primario-100`. A la derecha, una píldora "Mes · Octubre 2026" (radio pill, borde `--color-primario-500`, fondo `--color-primario-700`, 13px semibold blanco). |
| `.banner-simulacion` | Franja de ancho completo bajo la barra. Fondo `--color-aviso-100`, texto `--color-aviso-700` 13px semibold, "⚠ Simulación. No es un pago oficial.", padding 8px 32px. Fija en pantalla (`position: sticky; top: 0; z-index: 10`). |
| `.pestanas` / `.pestana` | Barra blanca con borde inferior 1px `--color-neutro-200`, padding 0 32px. Cada pestaña lleva padding 14px 16px, 14px medium, color `--color-neutro-500`. `.pestana.activa`: color `--color-primario-700`, semibold, borde inferior 3px `--color-primario-500`. `:focus-visible` con contorno 2px `--color-primario-500`. |
| `.tarjeta` | Fondo blanco, borde 1px `--color-neutro-200`, radio `--radio-lg`, padding 24px, `--sombra-tarjeta`, gap interno 16px. El título `h2` va en 18px semibold `--color-primario-900`, con su distintivo opcional en la misma línea. |
| `.kpi` | Una `.tarjeta` con padding 20px 24px. Etiqueta en MAYÚSCULAS 11px semibold `--color-neutro-500`, valor 26px bold y subtexto 12px `--color-neutro-500`. Variantes `.kpi--exito` / `.kpi--aviso` solo cambian el color del valor. En una fila, todas con la misma altura (`align-items: stretch`). |
| `.badge` | Píldora en línea: padding 2px 8px, radio pill, 12px semibold, `white-space: nowrap`. `.badge--exito` (fondo `exito-100`, texto `exito-700`), `.badge--aviso`, `.badge--peligro`, `.badge--neutro` (fondo `neutro-200`, texto `neutro-700`), `.badge--paga` (fondo `exito-700`, texto blanco). Mapeo: ≥ 100 % éxito, 80–99,9 % aviso, < 80 % peligro, Pendiente/neutral/No aplica neutro, y "Paga" para el esquema que se paga. |
| `.recuadro-pago` | Recuadro con padding 20px, radio `--radio-md`, fondo `neutro-100`. Título 13px medium `neutro-500` y monto `--tipo-kpi` (32px) bold `neutro-500`. `.recuadro-pago.paga`: fondo `exito-100`, borde 2px `exito-700`, título y monto `exito-700`, con `.badge--paga` "Paga" junto al título. Van dos recuadros lado a lado (nueva / anterior), en partes iguales. Debajo, la línea "Diferencia (nueva − anterior)" con el valor en bold `exito-700` si es positiva o `peligro-700` si es negativa, con el signo "−". |
| `.tarjeta-score` | Ancho 360px. Etiqueta "SCORE" 12px semibold, valor 44px bold `primario-900`, barra de 10px con radio pill sobre fondo `neutro-200` y relleno `primario-500` (ancho = score/120). Lleva marcas blancas de 2px en 80, 90, 100 y 110, y las etiquetas 0·80·90·100·110·120 debajo en 11px. Texto "Factor de pago 92,58 % · curva 5.8". |
| `.barra` | Fila de indicador: pista de 140–180px × 8px, radio pill, fondo `neutro-200`. `.barra__relleno` con `width: calc(min(var(--pct), 120) / 120 * 100%)`: **tope visual 120 %**. Una `.barra__marca` de 2px × 14px en `neutro-700`, en `left: 83.333%` (el 100 %). Color del relleno: `exito-700` si ≥ 100 %, `aviso-700` si ≥ 80 %, `peligro-700` si menor, `neutro-300` si es neutral. |
| `.tabla` | Ancho 100 %, `border-collapse: separate; border-spacing: 0`, borde 1px `neutro-200`, radio `--radio-md` y `overflow: hidden`. `thead th`: fondo `neutro-100`, 12px semibold `neutro-500`, `position: sticky; top: 36px` (debajo del banner). Celdas con padding 9px 14px, 13px, borde inferior 1px `neutro-200`. Filas de total (`tfoot` / `.fila-total`): fondo `primario-50`, semibold. Filas de grupo (`.fila-grupo`, en "Facturas del mes"): fondo `primario-100`, texto `primario-700` semibold, con una sola celda `colspan` a todo el ancho. Fila resaltada (`.fila-aplica`, el tramo de la curva que aplica): fondo `primario-100`. |
| `.num`, `.dinero` | `text-align: right; white-space: nowrap;` en toda cifra o dinero. `moneda()` dentro de tablas debe salir con `class="dinero"`. |
| `.campo-editable` | Todo parámetro editable (inputs de parámetros y metas, ingresos/retiros, SERFISCAL, satisfacción, ofertas, utilidad presupuestada BTL, selector de comercial): fondo `--color-editable-fondo`, borde 1px `--color-editable-borde`, radio 6px, padding 6px 10px, texto 13px medium, alineado a la derecha si es número. En `:focus`, borde `primario-500` y sombra `0 0 0 3px var(--color-primario-100)`. |
| `.campo-calculado` | Valor calculado de solo lectura: fondo `neutro-100`, sin borde, mismo tamaño que `.campo-editable`. |
| `.formula` | Línea de fórmula: fondo `primario-50`, radio 8px, padding 8px 12px, 12–13px medium. Prefijo "f(x)" en 11px bold `primario-500`. |
| `.boton`, `.boton--primario` | Padding 9px 14px, radio 8px, 13px semibold. El primario va con fondo `primario-700` y texto blanco; el secundario, blanco con borde `neutro-300` y texto `primario-700`. |
| `.pie-simulacion` | Pie de página `primario-900` con el texto "Simulación. No es un pago oficial" en 13px `primario-100`, centrado. |

Accesibilidad: el contraste ya pasa AA con estos pares. No uses solo el color: cada distintivo lleva su texto ("83,5 %", "Pendiente", "Paga").

## 3. Diseño por pantalla (escritorio, 1440 px)

Común a todas: `.app-bar` → `.banner-simulacion` → `.pestanas` → `main` con `max-width: var(--ancho-contenido)` (1200px), centrado, padding 32px 0 y gap vertical 24px entre tarjetas, fondo de página `neutro-100` → `.pie-simulacion`.

### 3.1 Pestaña 4, "Ficha por comercial" (`htmlFicha`)
1. **Barra de herramientas** en una sola fila: "Comercial", luego ◀, selector `.campo-editable` de 280px, ▶; a la derecha, "Imprimir ficha" (primario), "Imprimir todas las fichas" y la casilla "Incluir detalle de facturas" (`nowrap`).
2. **Tarjeta encabezado:** nombre en 28px bold `primario-900`; debajo, "Cargo · Regional · Mes" en 14px `neutro-500`. A la derecha, tres chips (`primario-50`, radio 8, padding 10px 16px): Salario base, Ingreso objetivo (IMR), Ingreso máximo (120 %).
3. **Fila resumen:** `.tarjeta-score` (360px) y, ocupando el resto, la tarjeta "¿Qué se paga este mes?" con los dos `.recuadro-pago` y la línea de diferencia + "Transición oct–dic: se paga el mayor de los dos."
4. **Fila:** "5.8 Resultado", con la tabla Indicador · Peso · Máx. 120 % · Puntos · distintivo de cumplimiento. A la derecha, la tarjeta "Curva de pago · 5.8" (340px), con la tabla de anclas y la fila que aplica resaltada.
5. **"5.4 Ventas rentables y recaudadas"**, con un distintivo de cumplimiento ponderado en el título. Lleva la tabla Producto · Meta · Real reconocido · Cumplimiento · Peso · Avance (`.barra`) · Aporte, más la `.formula` y tres datos pequeños: margen comprobado, factor de reconocimiento y facturas de Misión.
6. **Tres columnas iguales:** 5.5 Base social, 5.6 Diversificación e innovación y 5.7 Satisfacción. Cada una es una lista concepto/valor con separadores de 1px. Los editables van en `.campo-editable` de 90px y la `.formula` va al final de 5.5.
7. **Dos columnas:** "1. Política anterior" (con el enlace "Ver las N líneas ▾", plegable) y "3. Comparativo y transición" (el resultado de la transición con `.badge--paga`).
8. **"Márgenes de sus eventos"**, con tabla y Banda como distintivo: > 20 % éxito, 10–20 % aviso, < 10 % peligro, Misión/BTL "No aplica" neutro.
9. **"Facturas del mes"**, con `.fila-grupo` por cada `uso` de la ronda 7, subtotal por grupo y "Total sin BTL" en `tfoot`.
10. **Avisos** (`aviso-100`/`aviso-700`), plegables.

### 3.2 Pestaña 6, "BTL" (`pintarBtl`)
1. Título "BTL · núm. 5.11.5" (28px bold) y la nota "Si falta una condición, el pago queda en cero y se marca Pendiente. Cada rol necesita score ≥ 80."
2. **Fila de 4 `.kpi`:** Eventos BTL del mes · Pago comerciales · Pago director · Pendientes. Se calculan sumando `liquidacion.btl` en `vistas.js`, sin tocar `calculos.js`.
3. **Tabla**, en este orden de columnas: Evento · Comercial · Utilidad presupuestada (`.campo-editable` de 120px) · Utilidad · Margen · Cumplimiento · **Pago comercial** · **Pago director** · Condiciones.
   - Cada pago es monto (`.dinero`, semibold) con un distintivo debajo: "Paga" (`.badge--paga`), "Pendiente" (aviso) o el motivo, por ejemplo "Score 71,98 < 80" (peligro).
   - Condiciones: las 5 casillas apiladas, una por línea, 12px.
   - Celdas alineadas arriba.
4. **Dos tarjetas:** "Cómo se liquida" (4 pasos en texto) y "Avisos" (lista con distintivos).

### 3.3 Pestaña 5, "Director" (`pintarDirector`)
1. **Tarjeta encabezado:** "Director comercial · mes" y el texto del esquema anterior y del BTL anterior. A la derecha, chips IMR y "Método usado".
2. **Fila resumen:** `.tarjeta-score` y "¿Qué se paga este mes?" con los `.recuadro-pago`, igual que en la ficha.
3. **"5.8 Resultado del director"**: tabla con columnas Puntos, Cumplimiento (distintivo) y Avance (`.barra`, tope 120 %). Debajo, las `.formula` de ventas, base social y pago.
4. **"5.4 Ventas del equipo"** (tabla).
5. **Tres tarjetas de método** en una fila (`bloqueMetodo`): Totales del equipo, Promedio simple y Promedio ponderado por meta, cada una con Score, Factor y Pago. La del método usado lleva fondo `exito-100`, borde 2px `exito-700` y `.badge--paga` "Método usado".

## 4. Impresión: 2 páginas por ficha (`@media print`)

Esto completa el punto 2 de la ronda 7:

```css
@page { size: A4; margin: 10mm; }
@media print {
  body { font-size: 9pt; line-height: 1.2; background: #fff; }
  .app-bar, .pestanas, .barra-herramientas, .banner-simulacion, .pie-simulacion, button { display: none !important; }
  .tarjeta { box-shadow: none; border: 0; padding: 0; margin: 0 0 4mm; border-radius: 0; }
  .tarjeta h2 { font-size: 10pt; border-bottom: 0.75pt solid var(--color-primario-500); padding-bottom: 1mm; }
  .tabla { border-radius: 0; font-size: 8.5pt; }
  .tabla th, .tabla td { padding: 1mm 1.5mm; }
  .tabla thead { display: table-header-group; position: static; }
  .tabla tr, .recuadro-pago, .tarjeta-score { break-inside: avoid; }
  .ficha { break-after: page; }
  .ficha:last-of-type { break-after: auto; }
  .ficha-cabecera-impresion { display: flex; } /* oculto en pantalla */
  .dos-columnas-impresion { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .barra, .formula::before { display: none; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

Estructura de cada ficha impresa:

**Página 1**
- Cabecera propia (`.ficha-cabecera-impresion`): nombre en 14pt bold; "cargo · regional · mes" en 8pt; a la derecha, la etiqueta "Simulación. No es un pago oficial" (`aviso-100`/`aviso-700`).
- Fila de 5 chips: Salario, IMR, Máximo 120 %, Score, Factor.
- Tres recuadros: Política nueva (Paga) · Esquema anterior · Diferencia.
- 5.8 en una tabla con una línea de curva.
- 5.4 en una tabla con una línea de fórmula.
- 5.5 y 5.6/5.7 a dos columnas.

**Página 2**
- 1. Política anterior y 3. Comparativo, a dos columnas.
- Márgenes: solo el número de facturas.
- Facturas del mes resumidas por `uso`: Uso · Facturas · Base · Venta reconocida. El detalle de facturas va solo si la casilla está marcada.
- Avisos y firmas "Elaboró / Revisó".

**Pie en cada página:** "Simulación. No es un pago oficial · {nombre} · {AAAA-MM}" y "Página N de 2". Si el navegador no numera, basta el texto.

## 5. Qué no cambia

- Ningún cálculo, texto de regla ni valor. `calculos.js` no se toca en esta ronda.
- No hay dependencias nuevas. Lo único nuevo en `lib/` son las fuentes, y son opcionales.
- La app sigue funcionando al abrir `index.html` sin internet.

---

## Prueba de aceptación (archivos reales de octubre + parametros.xlsx)

- **Números idénticos a la ronda 7:**
  - Scores 53,51 · 61,41 · 71,98 · 41,90 · 57,08 · 55,34 · 58,41.
  - Esquema anterior 2.584.400 · 772.050 · 4.729.224 · 1.643.920 · 3.821.877 · 3.838.759 · 4.317.730.
  - Director 91,83 / $ 7.208.412 contra $ 3.545.215.
  - FEDESCO: director $ 3.852.459, comercial $ 0 ("Score 71,98 < 80"), y la utilidad presupuestada se lee sola.
  - Unión 202 de 202.
- **Hernando**, "Facturas del mes":
  - Edu/AT · política nueva: 20, $ 34.530.525.
  - Edu/AT · no recaudada: 9, $ 9.761.715.
  - Misión · valor fijo: 3, $ 46.500.000.
  - Misión · esquema anterior: 3, $ 3.000.000.
  - BTL 5.11.5: 2, $ 207.080.000.
  - BTL referencia: 4, $ 410.580.000.
  - Total sin BTL: base $ 93.792.240, recaudo $ 81.030.525.
- **Impresión:** sin detalle, ≤ 14 páginas las 7 fichas y ≤ 2 Hernando, sin hoja en blanco. Con detalle, ≤ 35.
- **Visual:**
  - No queda ningún color hexadecimal fuera de `tokens.css`.
  - Los montos no se parten en dos líneas.
  - El encabezado de las tablas queda fijo al hacer scroll.
  - Las barras no pasan del 120 % y tienen la marca en el 100 %.
  - Todo editable es amarillo.
  - El banner de simulación está visible en las 6 pestañas.
- **Red:** en DevTools → Network, con la app cargada, no hay ninguna petición a un dominio externo.
- **Pruebas y consola:** pruebas.html en verde y consola sin errores.

Al terminar, dame la lista de archivos tocados y, por cada uno, qué cambió y por qué.

---

## Anexo: ronda 7 completa (aplícala si aún no está)

## Correcciones para Cursor, ronda 7 (19/11/2026)

La ronda 6 quedó bien en casi todo, y los números no cambiaron. Quedan dos cosas de fondo: la agrupación de "Facturas del mes" y el largo de la impresión. Además hay detalles visuales.

No cambies ningún cálculo de pago. Antes de seguir con el siguiente punto, explícame cada cambio: archivo, función y cómo probarlo.

Reglas que siguen:
- `calculos.js` puro.
- `escaparHtml` en todo dato.
- Sin CDN.
- Nada fijo en el código.
- `pruebas.html` en verde.

---

### Prioridad media

1. **"Solo esquema anterior" mezcla cosas** (calculos.js `liquidarComercial`, bloque `detalleFacturas`, cerca de la línea 485).
   - Hoy todo lo que no cae en los tres primeros grupos va a "Solo esquema anterior". En Hernando eso suma $ 423.341.715 y hace que "Total sin BTL" dé $ 504.372.240, que en realidad incluye $ 410.580.000 de BTL.
   - Usa estos grupos de `uso`:
     - "Edu/AT · política nueva": Edu/AT recaudada en el mes (como hoy).
     - "Edu/AT · no recaudada en el mes": Edu/AT con estado distinto de CANCELADA o pagada en otro mes.
     - "Misión · valor fijo por factura": hoja complementaria (como hoy).
     - "Misión · esquema anterior": líneas de Misión de la hoja Facturación (base $ 1.000.000).
     - "BTL · se liquida en 5.11.5": hoja complementaria (como hoy).
     - "BTL · referencia (hoja Facturación)": líneas BTL de la hoja Facturación. No cuentan para nada.
   - "Total sin BTL" no debe sumar ninguna línea BTL.
   - **Prueba (Hernando):**

     | Grupo | Facturas | Base | Recaudo / reconocida |
     |---|---|---|---|
     | Edu/AT · política nueva | 20 | $ 34.530.525 | $ 34.530.525 |
     | Edu/AT · no recaudada en el mes | 9 | $ 9.761.715 | $ 0 |
     | Misión · valor fijo por factura | 3 | $ 46.500.000 | $ 46.500.000 |
     | Misión · esquema anterior | 3 | $ 3.000.000 | — |
     | BTL · se liquida en 5.11.5 | 2 | $ 207.080.000 | — |
     | BTL · referencia (hoja Facturación) | 4 | $ 410.580.000 | — |

     "Total sin BTL": base $ 93.792.240, recaudo $ 81.030.525.

2. **La impresión sigue larga** (css/estilos.css `@media print`; vistas.js `fichaMargenes`, `htmlFicha`).
   - Hoy "Imprimir todas las fichas" da **31 páginas** (4 a 5 por ficha) y "Imprimir ficha" da 6 páginas para Hernando, la última en blanco. Con detalle de facturas son 59. La meta es **1 a 2 páginas por ficha**.
   - En impresión:
     - No imprimas el encabezado azul del sitio. La ficha ya trae su título y el aviso de simulación.
     - En "Márgenes de sus eventos", la columna "Facturas" muestra solo el número de facturas, no la lista. Solo con "Incluir detalle de facturas" se imprime la lista.
     - Bloques 5.4, 5.5, 5.6 y 5.7 a dos columnas, sin tarjetas internas para cada producto: una tabla por bloque.
     - Si el último `.ficha` deja una hoja sola con el pie, usa `.ficha:last-of-type { page-break-after: auto; }` para evitarla.
     - Letra de 8,5 a 9 pt e interlineado de 1,2.
   - **Prueba:** sin detalle, las 7 fichas salen en ≤ 14 páginas y Hernando solo en ≤ 2, sin hoja en blanco. Con detalle de facturas, ≤ 35 páginas.

### Prioridad baja

3. **Facturas repetidas en "Márgenes de sus eventos"** (calculos.js, `margenesEventos`, cerca de la línea 578, `facturas: …`).
   - Hoy, en Hernando, el 567 lista FEC 15198/15250/15251 dos veces y el 575 lista FEC 15291/15292 dos veces, por las dos hojas.
   - Quita las repetidas con un `Set`.
   - Para los eventos de Misión y BTL, la "Banda" debe decir "No aplica (Misión: valor fijo)" o "No aplica (BTL: 5.11.5)", en gris. Hoy el 567 sale en rojo "Menor al 10 % · 0 %", y eso sugiere un descuento que no existe.

4. **"Pendiente · neutral" repetido.**
   - En SERFISCAL (`fichaInnovacion`) y en Satisfacción (`fichaSatisfaccion`), el texto "Pendiente · 10/15 puntos (neutral)" sale tres veces: en Cumplimiento, en Puntaje y en la nota.
   - Déjalo así: Cumplimiento "Pendiente", Puntaje "10,00 (neutral)", y quita la nota repetida.

5. **Recuadros de pago** (`recuadrosPago`, css `.recuadro`):
   - El valor va grande (1,6 rem, negrita) y el título pequeño.
   - La diferencia negativa se escribe "− $ 4.729.224", no "$ -4.729.224".
   - En la tarjeta del score, "Factor 0,0000" pasa a "Factor de pago 0 %".

6. **Montos partidos en dos líneas.** En la tabla BTL, "$ 95.257.998" y "$ 3.852.459" se parten después de "$". Dale `white-space: nowrap` a toda celda de dinero (por ejemplo, una clase `.dinero` en `moneda()` dentro de tablas).

7. **Casilla "Incluir detalle de facturas al imprimir"**: hoy se parte en tres líneas a la derecha de los botones. Ponla en la misma fila que los botones, con `white-space: nowrap`, o debajo en una sola línea.

---

### Prueba de aceptación (archivos reales de octubre + parametros.xlsx)

- **Sin cambios en los números:**
  - Scores 53,51 · 61,41 · 71,98 · 41,90 · 57,08 · 55,34 · 58,41.
  - Esquema anterior 2.584.400 · 772.050 · 4.729.224 · 1.643.920 · 3.821.877 · 3.838.759 · 4.317.730.
  - Director 91,83 / $ 7.208.412 contra $ 3.545.215.
  - FEDESCO: director $ 3.852.459, comercial $ 0 ("Score 71,98 < 80"), y la utilidad presupuestada se lee sola.
  - Unión 202 de 202.
- **Hernando:** los grupos y totales del punto 1.
- **Márgenes:** ninguna factura repetida, y Misión/BTL con "No aplica".
- **Impresión:** ≤ 14 páginas las 7 fichas y ≤ 2 Hernando, sin hoja en blanco.
- **Pruebas y consola:** pruebas.html en verde y consola sin errores.
