# Correcciones para Cursor, ronda 9 (19/11/2026): organización y diseño de toda la app

La ronda 8 aplicó bien los tokens y los números no cambiaron. Ficha, Director y BTL ya tienen el estilo nuevo. Quedan tres cosas:
- un error de CSS que tapa la primera fila de **todas** las tablas;
- la impresión, que sigue larga;
- las pestañas Cargar datos, Parámetros y Resultados del equipo, que siguen con el diseño viejo.

Esta ronda reorganiza la app según el flujo de trabajo y lleva el sistema visual a todas las pestañas.

Referencia visual: https://www.figma.com/design/Fq8LoCWzHwD4SHyuPvZScO. Los tokens y componentes están en `correcciones_cursor_v8.md` y ya existen en `css/tokens.css`. No crees colores nuevos.

**Reglas:**
- `calculos.js` no se toca.
- `escaparHtml` en todo dato.
- Sin CDN ni peticiones externas.
- Nada fijo en el código.
- `pruebas.html` en verde (hoy 35 de 35).
- Consola sin errores.
- No cambies ningún número.
- Antes de pasar al siguiente punto, explícame cada cambio: archivo, función o selector, y cómo probarlo.

---

## Prioridad alta: errores

### 1. El encabezado fijo tapa la primera fila de cada tabla (css/estilos.css, `.tabla thead th`, línea ~454)
- **Causa.** `position: sticky; top: 36px` dentro de `.tabla-scroll`, que tiene `overflow-x: auto`. Así el contenedor de scroll es el `div`, y el encabezado baja 36 px **dentro** de la tabla, encima de la fila 1. Ese valor venía de la ronda 8 y estaba mal planteado.
- **Qué se ve hoy:**
  - Ficha 5.8: la fila "Ventas rentables y recaudadas" no aparece.
  - Ficha 5.4: no aparece "Educación y asistencia técnica".
  - Director 5.8 y 5.4: falta la fila de Ventas y la de Edu/AT.
  - Márgenes y Comerciales y metas: el primer registro queda tapado.
  - BTL: la fila del evento 575 queda debajo del encabezado y las casillas de condiciones no se pueden pulsar con el mouse. Se probó: un clic real no marca "Participación comercial".
  - Encima de cada encabezado queda una franja vacía de 36 px.
- **Corrección:**
  ```css
  .tabla-scroll { overflow: auto; max-height: 70vh; border-radius: var(--radio-md); }
  .tabla thead th, .tabla-fija thead th { position: sticky; top: 0; z-index: 2; }
  ```
  - Las tablas cortas (5.8, curva, 5.4, 5.5 a 5.7, comparativo) no llevan `.tabla-scroll` ni `sticky`.
  - Solo llevan encabezado fijo las tablas largas: Márgenes, Facturas del mes, Comerciales y metas, la vista previa de carga y BTL.
- **Prueba:** en las 7 fichas, 5.8 muestra 4 filas más el total, con "Ventas rentables y recaudadas" primero. En Director también. En BTL, un clic real en cada casilla la marca.

### 2. Tarjetas pegadas dentro de cada pestaña (css `.panel`)
- `main` tiene `gap`, pero cada `section.panel` no es flex. Por eso las tarjetas de una misma pestaña se tocan: Cargar, Parámetros, Director, BTL, KPIs.
- **Corrección:** `.panel { display: flex; flex-direction: column; gap: var(--espacio-5); }`. Cada fila de tarjetas (`.fila-tarjetas`) va con `display: grid; gap: var(--espacio-5); align-items: stretch`.

### 3. La impresión sigue larga (`@media print`, `fichaImpresion`)
- **Hoy:** "Imprimir todas" da **24 páginas** (meta ≤ 14) y Hernando da **4** (meta ≤ 2). Con detalle, 45 (meta ≤ 35).
- **Causas que se ven en el PDF:**
  - Se imprime la tabla "Curva de pago" completa.
  - 5.5, 5.6 y 5.7 salen con los inputs y sus cajas, con mucho aire.
  - `break-inside: avoid` sobre tarjetas grandes deja media hoja 2 en blanco.
  - Márgenes lista los nombres largos de evento en varias líneas.
  - La hoja 4 queda casi vacía: solo la fila BTL referencia y las firmas.
- **Corrección:**
  - **Curva:** en impresión, una línea de texto: "Curva 5.8: < 80 → 0 % · 80 → 70 % · … · 120 → 120 %". Oculta `.tarjeta-curva`.
  - **5.5, 5.6 y 5.7:** en `fichaImpresion`, sin inputs. Cada bloque es una tabla concepto/valor de 2 columnas con el valor como texto. Los tres van en una rejilla de 3 columnas.
  - **`break-inside: avoid`** solo en `tr`, `.recuadro-pago` y `.chips`, nunca en `.tarjeta`.
  - **Página 1:** encabezado, chips, recuadros, 5.8, 5.4, 5.5 a 5.7. Página 2: anterior y comparativo, BTL (5.11.5, en tabla de 2 columnas), márgenes, facturas por uso, avisos y firmas. Pon `break-before: page` en `.impresion-pagina-2`.
  - **Márgenes en impresión:** evento recortado a 1 línea (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55mm`), 8 pt, columnas # · Evento · Fact. · Ingreso · Costo total · Margen · Banda. Sin ICA ni GMF: van en la nota.
- **Prueba:**
  - sin detalle, 7 fichas en ≤ 14 páginas y Hernando en ≤ 2;
  - ninguna hoja con menos de un tercio de contenido;
  - con detalle, ≤ 35 páginas.

### 4. BTL: la tabla mide 1849 px en un contenedor de 1150 (`pintarBtl`, css `.tabla-btl`)
- "Pago comercial" mide 590 px porque el motivo largo va en una sola línea con `nowrap`, y las condiciones quedan fuera de la vista.
- **Corrección:**
  - `nowrap` solo en `.dinero`.
  - El motivo va debajo del monto, en `.badge` que puede partirse (`white-space: normal; max-width: 220px`).
  - Anchos fijos: Evento 70 · Comercial 140 · Utilidad presupuestada 150 · Utilidad 130 · Margen 80 · Cumplimiento 100 · Pago comercial 200 · Pago director 200 · Condiciones 170.
  - La tabla debe caber en 1150 px sin scroll horizontal.
- La utilidad presupuestada sale "92.699.872,906". El campo debe mostrar entero, con miles: `formatoMiles(Math.round(v))`. Solo la vista; el valor interno no cambia.
- "Avisos" de BTL hoy es una tarjeta toda amarilla. Usa la `.tarjeta` normal con una lista de `.badge` + texto, como en Figma.

---

## Prioridad media: organización (arquitectura de información)

### 5. Orden de pestañas según el flujo (index.html, main.js)
Nuevo orden:
1. Cargar datos
2. Parámetros y metas
3. Resultados del equipo
4. Ficha por comercial
5. BTL
6. Director
7. Exportar e imprimir

- BTL va antes de Director porque el pago BTL del director sale de allí.
- **"Exportar e imprimir" es nuevo** (`#panel-exportar`, función `pintarExportar` en vistas.js). Reúne:
  - Exportar resultado a Excel (hoy está en Equipo);
  - Imprimir todas las fichas;
  - Imprimir ficha de… (selector);
  - la casilla de detalle de facturas;
  - Exportar/Importar JSON de parámetros (hoy en Parámetros).
- Cada acción es una tarjeta con título, una línea de qué produce ("Un .xlsx con una hoja por comercial") y su botón. En Ficha se quedan los botones "Imprimir ficha" e "Imprimir todas".

### 6. Pestañas con estado (main.js `mostrarPanel`, css `.pestana`)
- Cada pestaña lleva un indicador a la izquierda del texto:
  - "✓" en `exito-700` cuando su dato está listo (Cargar: facturación + eventos cargados; Parámetros: suma de pesos = 100 y sin pendientes);
  - "!" en `aviso-700` si hay pendientes;
  - nada si no aplica.
- Pestañas 3 a 7 sin facturación cargada: `aria-disabled="true"`, color `neutro-300`, y al pasar el mouse el `title` dice "Primero carga la facturación".
- Recordar la pestaña activa en `sessionStorage` y en el `#hash` (`#ficha`, `#btl`…), para que recargar no te devuelva a Cargar.
- La barra de pestañas debe ser `position: sticky; top: <alto del banner>`, para que siempre se vea.
- **Banner:** hoy tiene 2 líneas. Déjalo en una: "⚠ Simulación. No es un pago oficial · Si recargas la página, vuelve a cargar los archivos." "Cambios sin guardar" va como `.badge--aviso` a la derecha.
- **Pie (`.pie-simulacion`):** queda flotando a mitad de pantalla en las pestañas vacías. Usa `body { min-height: 100vh; display: flex; flex-direction: column }` y `main { flex: 1 }`.

### 7. Estados vacíos (`pintarVistas`, línea ~990)
- Hoy Equipo, Ficha, Director y BTL muestran solo "Todavía no hay facturación cargada…".
- Usa un componente `.estado-vacio`: tarjeta centrada, 480 px, ícono de documento en `primario-100`, título 18 semibold, texto 14 `neutro-500` y un botón primario "Ir a Cargar datos" que llame a `mostrarPanel("cargar")`.
- Debajo, la lista de lo que falta, con `.badge` por archivo:
  - "Facturación · falta" (peligro) o "✓ cargada" (éxito);
  - "Producción · falta" o "✓";
  - "BTL_Eventos · opcional" (neutro).
- En BTL sin eventos del mes, el mismo estado con el texto "No hay eventos BTL este mes" y sin botón.

---

## Prioridad media: diseño por pestaña

### 8. Pestaña 1, Cargar datos (`iniciarCarga`, `htmlVista`, `pintarMapa` en carga.js)
**Problemas de hoy:**
- inputs de archivo nativos ("Choose File", en inglés);
- no hay un resumen de qué está cargado;
- "Se unieron 202 de 202" aparece **antes** del input;
- la vista previa muestra cifras crudas (3200000, 0.1, fechas partidas en 2 líneas) y textos que se parten en 4 líneas;
- 12 advertencias en una lista larga, más "Y 197 advertencias más";
- los 15 selectores de columnas se ven siempre, aunque se asignaron solos.

**Diseño:**
1. **Tarjeta "Mes y archivos"**, arriba:
   - a la izquierda, el mes (`.campo-editable` de 200 px);
   - a la derecha, una **lista de estado de 3 filas**, una por archivo, con ícono, nombre del archivo, hoja, filas leídas, `.badge` y la acción "Cambiar". Ejemplos:
     - Facturación · `archivo.xlsx` · hoja Facturacion + Misión Int., BTL · 222 líneas · ✓ Cargada (éxito).
     - Producción · hoja PRODUCTOS · 582 líneas · 60 eventos del mes · **202 de 202 facturas unidas** · ✓ (éxito si unidas = total; aviso si no).
     - Parámetros BTL (opcional) · 1 evento BTL leído · ✓, o "Opcional" (neutro).
   - debajo, el botón primario "Ver resultados del equipo →", activo cuando facturación y producción están cargadas.
2. **Zonas para soltar archivos** (`.zona-archivo`), una por archivo:
   - borde 2 px discontinuo `neutro-300`, radio 12, padding 24, fondo `neutro-0`;
   - ícono y texto "Arrastra el Excel aquí o **elige un archivo**" (el enlace es un `<label for>` del input oculto). Así se cambia el "Choose File" en inglés.
   - `dragover`: borde `primario-500`, fondo `primario-50`.
   - Al cargar, la zona se encoge a una línea de estado (nombre, ✓ y "Cambiar").
   - Sin librerías: `dragover`/`drop` nativos que llamen a la misma función que hoy usa `change`.
3. **"Columnas detectadas"**, plegable con `<details>`:
   - cerrado si todas se asignaron solas, con el resumen "11 de 11 columnas asignadas ✓";
   - abierto y con `.badge--aviso` si falta alguna obligatoria;
   - dentro, la rejilla de selectores como hoy, 4 columnas, con la columna sugerida marcada.
4. **Vista previa:** `<details>` cerrado, "Vista previa (8 de 222 líneas)".
   - Usa `.tabla` con `.dinero` y `.num`: base con `moneda()`, % como "10 %", fechas `dd/mm/aaaa` sin partir.
   - Texto largo con `max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap` y el texto completo en `title`.
5. **Advertencias agrupadas por tipo**, con un contador: "No tiene fecha de facturación · 26 filas (187, 188, …)" y "Asesor 'Direccion Comercial' no está en parámetros · 3 filas".
   - Cada grupo es un `<details>` con `.badge--aviso` y el número de filas.
   - Para producción: "Ingreso vacío · 209 filas".
   - Agrupa en `advertenciasFacturacion` y `advertenciasEventos` sin cambiar qué se detecta, solo cómo se muestra.

### 9. Pestaña 2, Parámetros y metas (`htmlFormulario`, `filaPersona` en parametros.js)
**Problemas de hoy:**
- 23 campos sueltos en "Reglas", sin grupos ni unidades: "ICA (tasa) 0.009660442", "BTL margen bajo 0.05", "Tope 1.2";
- los botones de guardar parecen tarjetas;
- en la tabla de comerciales, los montos se cortan dentro del input (5675919 se ve "567591"), Documento y Cargo se cortan, y la tabla obliga a scroll lateral con 17 columnas.

**Diseño:**
1. **Barra de acciones fija** arriba de la pestaña (`.barra-acciones`, `position: sticky` bajo las pestañas):
   - a la izquierda, el texto "Lo amarillo se edita · lo gris se calcula · vacío = pendiente", con una muestra de color de cada tipo;
   - a la derecha, `.boton--primario` "Guardar en este navegador" y, en un menú "Más ▾", Exportar JSON, Importar JSON, Restaurar valores iniciales y Borrar datos guardados (este en `peligro-700`, con `confirm()`).
   - Con cambios sin guardar, `.badge--aviso` "Cambios sin guardar".
2. **Agrupa "Reglas" en tarjetas en una rejilla de 2 columnas.** Cada tarjeta lleva título, una línea de ayuda con el numeral de la política y sus campos:
   - **Pesos del score (5.8):** ventas, base social, SERFISCAL, innovación, satisfacción, y "Suma de pesos" calculada, con `.badge--exito` "= 100" o `.badge--peligro` "≠ 100".
   - **Curva de pago (5.8):** score mínimo, tope y las 5 anclas como una **tabla editable de 2 columnas** (Puntaje | Factor) en vez de 10 campos sueltos. Al lado, un mini gráfico SVG de la curva (polilínea, sin librerías).
   - **Costos y margen:** ICA, GMF y factor por defecto.
   - **Misión:** factura nueva y factura anterior.
   - **Actividad cultural:** valor por cartón y mes.
   - **Satisfacción y SERFISCAL:** meta SERFISCAL y satisfacción esperada.
   - **BTL (5.11.5):** cumplimiento mínimo y alto, márgenes bajo, medio y alto.
3. **Unidades visibles:**
   - Cada campo lleva sufijo o prefijo dentro de la caja: "$", "%", "pts", "veces".
   - Las tasas se **muestran** en porcentaje (0,966044 %, 0,4 %, 5 %, 120 %) y se convierten al guardar, `valor / 100`, en la capa de formulario (`asignarRuta` y `valorInput`). El JSON y los cálculos siguen recibiendo la fracción de hoy.
   - Si prefieres no convertir, al menos el sufijo "(fracción, 0,05 = 5 %)" y una ayuda.
   - Los montos se muestran con miles: input `type="text" inputmode="numeric"`, formateado al salir del campo con `numeroFlexible` al leer.
4. **Ayuda por campo:** un texto de 12 px en `neutro-500` debajo de cada campo, de una línea. Por ejemplo, "Se paga 0 si el score queda por debajo" en Score mínimo, o "Tope del cumplimiento de cada indicador" en Tope del indicador. Asócialo con `aria-describedby`.
5. **Director comercial:**
   - Tarjeta de 2 columnas: datos (nombre, básico, oportunidad, IMR calculado) y reglas (método, regla del 100 %, metas del equipo, tasas).
   - El aviso "PENDIENTE con la jefa…" pasa a una caja `.aviso` (fondo `aviso-100`, borde izquierdo 3 px `aviso-700`) arriba de la tarjeta.
6. **Comerciales y metas.** Divide la tabla de 17 columnas:
   - **Tabla "Comerciales"**, 7 columnas: Comercial (nombre en semibold; documento y cargo en una 2.ª línea de 12 px, editables al pulsar "Editar datos" o en campos con `width: 100%`) · Básico · Oportunidad · IMR · Base 30 sep · Cartones · Esquema anterior.
   - **Tabla "Metas por mes"** con un selector de mes arriba (Oct · Nov · Dic, como pestañas segmentadas) y columnas Comercial · Edu/AT · Misión · Congreso · Cultural. Así caben sin scroll lateral.
   - Inputs de dinero con `min-width: 130px`, alineados a la derecha y con miles. Se quita el texto pequeño duplicado de debajo.
   - Una persona que entra después (por ejemplo, desde 2026-12) va con `.badge--neutro` "Desde dic 2026" y sus campos de meses anteriores en gris, solo lectura.

### 10. Pestaña 3, Resultados del equipo (`pintarEquipo`, `tarjetaEquipo`)
**Problemas de hoy:**
- 7 tarjetas con **borde rojo**: el esquema anterior se pinta como error;
- "Factor 0,0000";
- montos en texto plano de 15 px;
- mucho aire entre líneas;
- no hay totales ni ranking;
- el director no aparece;
- el botón de exportar ocupa todo el ancho;
- "1 facturas sin fecha".

**Diseño:**
1. **Encabezado:** "Resultados del equipo · Octubre 2026" (28 bold) y la línea "7 comerciales · transición oct–dic: se paga el mayor de los dos esquemas".
2. **Fila de 4 `.kpi`**, calculados en vistas.js sumando `liquidacion.resultados`:
   - Total a pagar (sin BTL), la suma de `transicion.pagada`;
   - Pagan política nueva, "0 de 7";
   - Pagan esquema anterior, "7 de 7";
   - Score promedio del equipo, con el subtexto "Mínimo para pagar: 80".
   - Si hay BTL o director, una 5.ª tarjeta "Director · $ 7.208.412 · política nueva".
3. **Tabla de ranking** (`.tabla`, ordenada por score de mayor a menor y ordenable al pulsar el encabezado). Columnas:
   - #;
   - Comercial (enlace que abre su ficha: `mostrarPanel("detalle")` + seleccionar);
   - Score, con `.barra` pequeña de 100 px, tope 120 y marca en 80 (el mínimo);
   - Factor de pago, como "0 %" o "91,8 %", nunca "0,0000";
   - Política nueva;
   - Esquema anterior;
   - **Se paga**: `.badge--paga` "Nueva" o `.badge--neutro` "Anterior", y el monto en semibold;
   - Avisos, como `.badge--aviso` "6 sin fecha" que abre la lista.
   - Fila de total en `tfoot`.
   - Montos con `.dinero`.
4. Debajo, una tarjeta "Por qué nadie llega a 80" o, más en general, **"Distribución de score"**: barras horizontales por comercial con líneas verticales en 80 y 100. Es opcional y en SVG, sin librerías.
5. Colores: **el esquema anterior no es un error**. `.resultado.pierde` no debe usar `peligro`. Solo es peligro "Falta un dato para comparar".
6. Plurales: "1 factura sin fecha" y "6 facturas sin fecha". Hazlo con una función `plural(n, "factura", "facturas")` en utilidades.js y úsala en todos los avisos.
7. El botón "Exportar resultado a Excel" pasa a la pestaña 7. Aquí queda un `.boton` secundario pequeño a la derecha del título.

### 11. Pestaña 4, Ficha (retoques)
- **Bloque "5.11.5 Bonificación BTL"** (`fichaBtl`): hoy son 11 párrafos sueltos con mucho aire. Hazlo como en Figma:
  - una tabla concepto/valor de 2 columnas: IMR, ingreso del evento, tope 80 %, tope anual disponible, utilidad presupuestada, utilidad real, cumplimiento, margen, % liquidador, comisión;
  - el resultado en `.recuadro-pago` pequeño;
  - el motivo en `.badge--peligro`: "Score 71,98 < 80".
- **Márgenes de sus eventos:** la columna Facturas hoy lista hasta 8 números en vertical y hace filas de 150 px. Muestra el número ("5 facturas") con `<details>` para ver la lista, y el nombre del evento en 2 líneas como máximo (`-webkit-line-clamp: 2`).
- **Encabezado:** "Octubre 2026" sale solo. Si no hay cargo, muestra "Comercial" y el documento en la misma línea gris.

### 12. Pestaña 6, Director (retoques en `pintarDirector`)
- El chip "IMR $ 15.409.837" confunde, porque la fórmula usa la oportunidad de $ 7.849.838. Muestra 2 chips: "Oportunidad (base del pago) $ 7.849.838" e "IMR $ 15.409.837".
- "Método usado: totales" debe ir con el nombre legible: "Totales del equipo".
- La tabla 5.8 del director no tiene las columnas Peso y Máx. 120 % que sí tiene la ficha. Usa la misma función de tabla 5.8 en los dos lados.
- La fila **Total** muestra "Pendiente" en Cumplimiento. Debe ir vacía.
- **Métodos:** "Factor 0,9183" pasa a "Factor de pago 91,83 %", igual en los 3 métodos.
- "19 facturas sin fecha" va como `.badge--aviso` junto al título, no como `details` suelto.

---

## Prioridad baja: accesibilidad y densidad

13. **Etiquetas:**
    - en Comerciales y metas, Documento y Cargo usan `placeholder` como etiqueta: añade `<label class="sr-solo">`;
    - las casillas de BTL deben estar envueltas en `<label>` con área de clic de al menos 24 × 24 px;
    - el selector de comercial lleva `aria-label="Comercial"`.
14. **Foco:** `:focus-visible` con contorno 2 px `primario-500` también en `select`, `input[type=checkbox]`, `summary` y en los enlaces de la tabla de equipo. Con teclado, ← y → cambian de pestaña (patrón `role="tablist"`/`role="tab"`/`aria-selected`) y de comercial en la Ficha.
15. **Contraste:**
    - "Lo gris se calcula" usa `neutro-100` sobre blanco y casi no se distingue. Usa fondo `neutro-100` **con borde** 1 px `neutro-200` en `.campo-calculado`.
    - Los textos de 11 px en MAYÚSCULAS `neutro-500` pasan AA solo en negrita: no bajes de 11 px ni de peso 600.
16. **Densidad:**
    - En las tablas, filas de 36 px (padding 8px 12px) y 13 px.
    - En las listas concepto/valor, 32 px.
    - Las tarjetas KPI llevan la misma altura.
    - El ancho máximo de 1200 px se mantiene. En pantallas de 1366 px, el margen lateral mínimo es 24 px.
17. **Móvil (≤ 768 px):**
    - las pestañas se vuelven un `select` o una fila con scroll horizontal;
    - las rejillas pasan a 1 columna;
    - las tablas largas van en `.tabla-scroll`.
    - Hoy el ancho ya cabe (400 px sin scroll de página). No lo rompas.

---

## Prueba de aceptación (archivos reales de octubre + parametros.xlsx)

- **Números idénticos:**
  - Scores 53,51 · 61,41 · 71,98 · 41,90 · 57,08 · 55,34 · 58,41.
  - Esquema anterior 2.584.400 · 772.050 · 4.729.224 · 1.643.920 · 3.821.877 · 3.838.759 · 4.317.730.
  - Director 91,83 / $ 7.208.412 contra $ 3.545.215.
  - FEDESCO (575): director $ 3.852.459 con las 5 condiciones, comercial $ 0 ("Score 71,98 < 80"), y la utilidad presupuestada se lee sola.
  - Unión 202 de 202.
  - Hernando, "Total sin BTL": base $ 93.792.240, recaudo $ 81.030.525.
- **Tablas:**
  - en Ficha y Director, la primera fila de 5.8 es "Ventas rentables y recaudadas" y está visible;
  - ninguna fila queda tapada por un encabezado;
  - en BTL, un clic real en cada casilla la marca;
  - la tabla BTL cabe en 1150 px.
- **Navegación:**
  - 7 pestañas en el orden del punto 5, con ✓ o ! según el estado;
  - las pestañas 3 a 7 están desactivadas sin facturación;
  - recargar mantiene la pestaña (`#hash`).
- **Equipo:**
  - 4 o 5 KPIs;
  - ranking por score;
  - columna "Se paga";
  - ningún borde rojo para "esquema anterior";
  - ningún "0,0000".
- **Cargar:**
  - zonas para soltar en español;
  - lista de estado con 3 archivos y ✓;
  - advertencias agrupadas con contador.
- **Parámetros:**
  - campos agrupados en tarjetas con unidades;
  - ningún monto cortado dentro de su caja;
  - la tabla de comerciales sin scroll lateral a 1366 px.
- **Impresión:**
  - 7 fichas en ≤ 14 páginas y Hernando en ≤ 2, sin hoja casi vacía;
  - con detalle, ≤ 35 páginas.
- **Técnico:**
  - ningún color hexadecimal fuera de `tokens.css`;
  - en Network, ninguna petición externa;
  - pruebas.html en verde y consola sin errores.

Al terminar, dame la lista de archivos tocados y, por cada uno, qué cambió y por qué.
