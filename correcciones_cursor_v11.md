# Correcciones para Cursor, ronda 11, versión 2 (20/11/2026): política anterior desde el archivo de facturación, vista previa y pulido

**Contexto.** Esta es la versión v9 de la app.

**Lo que ya está bien:**
- De la ronda 10 quedaron aplicadas la barra lateral, la barra superior, la ficha 8 + 4, el tablero de Equipo, Cargar, Parámetros, el selector de archivos y `numeroPesos`.
- Las 39 pruebas pasan.

**El archivo de facturación que se usa desde ahora** es el libro con las hojas:
- `Hoja4`, la tabla dinámica "Suma de BASE" por asesor;
- `Facturacion `, 238 facturas del mes y 3 filas de totales al final;
- `Misión Int. `, `BTL `, `Hoja2`, `Anuladas`, `Balance`, `Auxiliar ` y `Hoja3`.

Este libro **no trae** las columnas "% Com", "Comision Comercial" ni "% Direccion".

Va en **3 fases**. Al terminar cada una, **detente**, dime qué archivos y funciones tocaste y por qué, y espera mi visto bueno.

**Reglas de siempre:**
- `tokens.css` es la única fuente de estilos.
- Nada fijo en el código: todo valor de negocio va en `parametros.js` y se edita en amarillo en Parámetros.
- `escaparHtml` en todo dato.
- Sin CDN ni peticiones externas.
- "Simulación. No es un pago oficial" en pantalla, en la impresión y en el Excel.
- `pruebas.html` en verde y consola sin errores.
- Los scores de la política nueva no cambian: 53,51 · 61,41 · 71,98 · 41,90 · 57,08 · 55,34 · 58,41.

---

# FASE 1: comisión de la política anterior igual al Excel (calculos.js, parametros.js, carga.js, vistas.js)

## 1.1 Por qué hoy sale $ 0
`liquidarComercial` calcula la comisión anterior como **Σ base × "% Com" de cada línea**. Con este archivo falla por dos razones:
1. **No existe la columna "% Com"**, así que el mapa automático deja `comision = ""` y cada fila trae `comision: null`.
   - `leerTasa(null)` hace `Number(null)`, que da `0`, y devuelve **tasa 0** en lugar de `null`. Por eso todas las líneas comisionan $ 0 sin ningún aviso.
   - **Corrige `leerTasa`** para que `null`, `""` o `undefined` devuelvan `null`. Si una línea no tiene tasa, debe salir el aviso "El archivo no trae % de comisión".
2. **Se cuentan mal las líneas.** Las cuentas `27209…` (anticipos) se clasifican como BTL por `cuentasPrefijo: ["27209"]` y se sacan del esquema anterior. Hernando muestra 29 líneas, pero en el archivo tiene 37.
   - Esa clasificación sirve para el recaudo de la política nueva, **no** para la producción anterior.

Además, la regla de la política anterior no es por línea. El liquidador (`Hoja4`) hace:
```
Producción  = Suma de BASE de la hoja "Facturacion " por ASESOR, filas con FECHA FACTURACION en el mes
Cumplimiento = Producción ÷ Meta mensual anterior
Tasa aplicada = tramo del cumplimiento
Comisión anterior = Producción × Tasa aplicada
```

## 1.2 Regla exacta de la producción (calculos.js, función pura nueva)
```js
/**
 * Producción de la política anterior, como la tabla dinámica Hoja4 del archivo.
 * Suma BASE de la hoja elegida (fila.elegida === true) del comercial, con fecha de facturación en el mes.
 * No entran: las hojas complementarias (Misión Int., BTL), las filas sin asesor (totales) ni las filas sin fecha.
 * Sí entran todas las cuentas de esa hoja: Educación, Asistencia técnica, Jornada Analfista y anticipos 27209…,
 * incluidos los anticipos BTL de Encuentros deportivos.
 */
export function produccionAnterior(filas, comercial, mes) {
  const lineas = filas.filter((f) => f.elegida === true && !asesorVacio(f) && mismaPersona(f.asesor, comercial)
    && f.fecha instanceof Date && fechaEnMes(f.fecha, mes));
  return { produccion: lineas.reduce((s, f) => s + (Number(f.base) || 0), 0), lineas };
}
```

- **No** uses `clasificarProducto` ni `cuentasPrefijo` aquí.
- La regla se valida contra `Hoja4`: el total de los comerciales, más Dirección Comercial (3.910.000), debe dar **252.848.440**. Es la fila "Total general" de la tabla dinámica y la primera fila de totales de la hoja.
- Si el libro trae `Hoja4`, léela como control: compara asesor por asesor y, si algo no cuadra, muestra un `.badge--aviso` "No cuadra con Hoja4: $ X" en Cargar y en la ficha. Solo se compara la columna B, "Suma de BASE".
- Las columnas C a E de `Hoja4` (redistribución de la Jornada Analfista: −1.200.000 a Consuelo, Lynette y Oriette y +3.600.000 a Dirección) **no** se usan: el Excel tampoco las usa para la comisión.

## 1.3 Parámetros (parametros.js; editables en amarillo en Parámetros ▸ "Política anterior")
```js
anterior: {
  minimo: 0.70,
  tasaBajoMinimo: 0,
  tramos: [                       // límites superiores continuos; se compara cumplimiento <= hasta
    { hasta: 0.80, tasa: 0.05 },
    { hasta: 0.90, tasa: 0.07 },
    { hasta: 1.00, tasa: 0.09 },
    { hasta: 1.10, tasa: 0.10 },
    { hasta: null, tasa: 0.11 },  // 111 % en adelante
  ],
},
// en cada comercial:
anteriorMes: { "2026-10": { meta: 49000000, produccionManual: null }, "2026-11": {...}, "2026-12": {...} }
```

- **La meta mensual es un parámetro por comercial y por mes.** Valores de octubre: Carolina 42.000.000 · Consuelo 25.000.000 · Hernando 49.000.000 · Leidy 23.000.000 · Lynette 41.000.000 · Oriette 30.000.000 · Tatiana 39.000.000.
  - También se leen de la hoja `EsquemaAnterior` de `parametros.xlsx` (columna `meta_anterior`), si se carga.
- **`produccionManual`** queda vacío por defecto. Solo es un respaldo: si se llena, reemplaza la producción calculada y la ficha lo marca con el chip "Producción manual" y la diferencia con el archivo.
- **Huecos de la tabla del Excel** (80–81, 90–91, 100–101, 110–111): se usan límites superiores continuos, como el Liquidador 2 (Hernando con 100,13 % recibe 10 %):
  - < 70 % → 0;
  - de 70 % a 80 % → 5 %;
  - > 80 % y ≤ 90 % → 7 %;
  - > 90 % y ≤ 100 % → 9 %;
  - > 100 % y ≤ 110 % → 10 %;
  - > 110 % → 11 %.
- El director usa 1,5 % fijo (`director.tasaAnterior`). `director.tramosAnterior` queda **solo como parámetro informativo** (ver 1.6).

## 1.4 Funciones de cálculo y cambio en `liquidarComercial`
```js
export function tasaPorTramo(cumplimiento, reglas) {
  if (cumplimiento === null || !Number.isFinite(cumplimiento)) return null;
  const c = Math.round(cumplimiento * 1e9) / 1e9;
  if (c < reglas.minimo) return reglas.tasaBajoMinimo;
  const fila = reglas.tramos.find((t) => t.hasta === null || c <= t.hasta);
  return fila ? fila.tasa : null;
}
export function comisionAnteriorTramos(meta, produccion, reglas) {
  if (meta === null || meta === undefined || !(meta > 0) || produccion === null) return { meta, produccion, cumplimiento: null, tasa: null, comision: null };
  const cumplimiento = produccion / meta;
  const tasa = tasaPorTramo(cumplimiento, reglas);
  return { meta, produccion, cumplimiento, tasa, comision: tasa === null ? null : produccion * tasa };
}
```

**En `liquidarComercial`**, si `comercial.tieneEsquemaAnterior`:
- toma `produccionAnterior(...)`, o `produccionManual` si está lleno;
- calcula `pagoAnterior = comisionAnteriorTramos(meta, produccion, parametros.anterior).comision`;
- devuelve `anteriorTramos = { meta, produccion, produccionArchivo, manual: boolean, cumplimiento, tasa, comision, lineas }`, donde `lineas` son las facturas que suman la producción;
- si falta la meta, `pagoAnterior = null` y se añade el aviso "Falta la meta mensual de la política anterior". **Nunca $ 0 en silencio.**

**Sigue como hoy:**
- El BTL anterior, aparte (3,8 % × $ 410.580.000 = $ 15.602.040). No entra a la transición.
- La transición: el mayor entre `pagoNuevo` y `pagoAnterior`.
- La lista "por línea" desaparece de la ficha. Su lugar lo toma el detalle de 1.5.

## 1.5 Bloque "Política anterior" en la ficha: lo mismo que el Excel
En la sección "Esquema anterior y transición", columna izquierda:

```
Política anterior                                    Fuente: Facturacion (37 facturas) ✓ cuadra con Hoja4
Comisión anterior                         $ 4.906.224     ← destacado (--tipo-kpi, bold)
Meta mensual                             $ 49.000.000     ✎ (enlace a Parámetros)
Producción                               $ 49.062.240
Cumplimiento                                 100,13 %
Tasa aplicada                                 10,00 %     tramo «más de 100 % y hasta 110 %»
Producción × tasa                         $ 4.906.224
▸ Ver tramos        ▸ Ver las 37 facturas de la producción ($ 49.062.240)
BTL política anterior, aparte: 3,8 % × $ 410.580.000 = $ 15.602.040 (no entra a la transición)
```

**Detalles del bloque:**
- Usa `.lista-concepto`: etiqueta a la izquierda y valor `.dinero` a la derecha, `nowrap` y `tabular-nums`.
- **"Ver tramos"** muestra la tabla de 5 tramos con el aplicado resaltado (fondo `primario-50` y borde izquierdo `primario-500`).
- **"Ver las N facturas"** abre una tabla sin scroll propio:
  - columnas: Factura · Cliente (con ellipsis y `title`) · Cuenta (código + nombre corto) · Fecha · Estado (chip) · Base;
  - subtotales por grupo: Educación · Asistencia técnica · Jornada Analfista · Anticipos 27209;
  - fila total = la producción;
  - en impresión solo van los subtotales.
- El panel derecho ("¿Qué se paga?"), Equipo (nuevas columnas Meta anterior · Producción · Cumplimiento · Tasa · Comisión anterior), el Excel exportado y la impresión usan `anteriorTramos`.

## 1.6 Director: comisión anterior = 1,5 % × total de producción del mes (Hoja4)
**Decisión confirmada:** la base del director en el esquema anterior es el **total de producción del mes** de la hoja `Facturacion `, con la misma regla de la tabla dinámica (1.2), es decir, **todas** las filas con asesor y con fecha de facturación en el mes:
- incluye Dirección Comercial, los anticipos `27209…` y los bolos;
- no incluye las hojas Misión Int. ni BTL, ni las filas de totales.

```js
// parametros.js
director: { ..., tasaAnterior: 0.015,               // editable en amarillo
  tramosAnterior: [ { hasta: 0.80, tasa: 0.010 }, { hasta: 1.00, tasa: 0.015 }, { hasta: null, tasa: 0.020 } ] }
  // tramosAnterior: SOLO INFORMATIVO. Nota visible en Parámetros: "Hoy se usa 1,5 % fijo (tasaAnterior). Esta tabla no entra al cálculo."

// calculos.js, función pura nueva
export function produccionTotalMes(filas, mes) {
  const lineas = filas.filter((f) => f.elegida === true && !asesorVacio(f) && f.fecha instanceof Date && fechaEnMes(f.fecha, mes));
  return { base: lineas.reduce((s, f) => s + (Number(f.base) || 0), 0), lineas };
}
export function comisionAnteriorDirector(base, tasa) {
  if (base === null || tasa === null || tasa === undefined) return null;
  return base * tasa;
}
```

**En `liquidarMes`:**
- Reemplaza `pagoAnterior = baseSinBtl * tasaAnterior` por `comisionAnteriorDirector(produccionTotalMes(filas, mes).base, parametros.director.tasaAnterior)`.
- Devuelve `director.anterior = { base, tasa, comision, facturas, porAsesor }`.
- La transición del director sigue pagando **el mayor**: nueva $ 7.208.412 contra anterior $ 3.792.727, así que **paga la nueva**.
- El BTL anterior del director (0,63 %) sigue aparte e informativo. Su base son solo las líneas de la hoja `BTL ` y ya **no** los anticipos `27209…`.
- **Quita el aviso** "Base anterior con este archivo… pendiente".

**El peso de diferencia (252.848.440 contra 252.848.439):**
- La app suma BASE tal cual, sin redondear cada fila. Ninguna BASE trae decimales.
- La suma real es **252.848.440**. Así dan `Facturacion !I243` (`=SUM(I2:I242)`) y la tabla dinámica (`Hoja4!B12`, "Total general").
- El 252.848.439 es un **valor escrito a mano**:
  - está en la celda `Facturacion !I244`, con la etiqueta "Drive" (no es fórmula);
  - coincide con la suma de la columna C de `Hoja4`, donde Tatiana está escrita a mano como 48.449.089 en lugar de 48.449.090 (`D11 = −1`).
- **No lo copies ni lo fuerces.** Si el libro trae `Hoja4`, usa `Hoja4!B` ("Total general") como control: si la suma de la app difiere, se muestra un `.badge--aviso` con la diferencia.
- La comisión redondeada al peso es la misma con cualquiera de los dos totales: 252.848.440 × 1,5 % = 3.792.726,60 y 252.848.439 × 1,5 % = 3.792.726,585. Las dos se muestran como **$ 3.792.727**.

**Bloque "Política anterior" en Director**, igual al Excel. Va en la columna izquierda, junto a "Comparar métodos":
```
Política anterior · director                         Fuente: Facturacion (238 facturas) ✓ cuadra con Hoja4
Comisión anterior                         $ 3.792.727     ← destacado
Base: total de producción del mes      $ 252.848.440
Tasa                                           1,50 %     ✎ Parámetros
Base × tasa                               $ 3.792.727
▸ Ver la base por asesor (8 filas: los 7 comerciales + Dirección Comercial = Hoja4)
BTL anterior, aparte: 0,63 % × base BTL (informativo, no entra a la transición)
```

- En "¿Qué se paga este mes?" del director: Política nueva **Paga $ 7.208.412**, Esquema anterior $ 3.792.727, diferencia + $ 3.415.685.
- Equipo (KPI Director), el Excel exportado y la impresión usan las mismas cifras.

## 1.7 Pruebas nuevas en pruebas.html (mínimo 20)
- **`tasaPorTramo`:**

  | Cumplimiento | 69,99 % | 70 % | 80 % | 80,5 % | 90 % | 100 % | 100,13 % | 110 % | 111 % |
  |---|---|---|---|---|---|---|---|---|---|
  | Tasa | 0 | 5 % | 5 % | 7 % | 7 % | 9 % | 10 % | 10 % | 11 % |

- **`leerTasa`:** `null` → null, `""` → null, `10` → 0,10, `0,1` → 0,1.
- **`produccionAnterior`:** con filas de prueba, excluye la hoja complementaria, la fila sin asesor, la fila sin fecha y la fila de otro mes, e incluye una cuenta 27209.
- **`produccionTotalMes`:** con filas de prueba, suma Dirección Comercial y la cuenta 27209, y excluye la hoja complementaria, la fila de totales sin asesor y la fila sin fecha. Con el archivo real de octubre da **252.848.440**.
- **`comisionAnteriorDirector`:** (252.848.440; 0,015) → **3.792.726,6**, que se muestra como $ 3.792.727; (null; 0,015) → null. Y la transición del director queda en "nueva" con $ 7.208.412.
- **`comisionAnteriorTramos`**, con las cifras de octubre de este archivo, al peso:

| Comercial | Facturas | Meta mensual | Producción (archivo) | Cumplimiento | Tasa | Comisión anterior | Excel v6.7 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Carolina Gómez | 48 | 42.000.000 | 37.713.000 | 89,79 % | 7 % | **2.639.910** | 2.639.910 |
| Consuelo Castro | 39 | 25.000.000 | 17.510.000 | 70,04 % | 5 % | **875.500** | 875.500 |
| Hernando Rozo | 37 | 49.000.000 | 49.062.240 | 100,13 % | 10 % | **4.906.224** | 4.906.224 |
| Leidy Lizcano | 32 | 23.000.000 | 23.841.000 | 103,66 % | 10 % | **2.384.100** | 2.384.100 |
| Lynette Arango | 38 | 41.000.000 | 38.465.300 | 93,82 % | 9 % | **3.461.877** | 3.461.877 |
| Oriette Henríquez | 21 | 30.000.000 | 33.897.810 | 112,99 % | 11 % | **3.728.759,1** | 3.728.759,1 |
| Tatiana Acuña | 19 | 39.000.000 | 48.449.090 | 124,23 % | 11 % | **5.329.399,9** | 5.329.399,9 |
| (Dirección Comercial) | 4 | — | 3.910.000 | — | — | — | — |
| **Total Hoja4** | 238 | | **252.848.440** | | | **23.325.770** | |

**Criterio de aceptación de la fase 1**, cargando `facturacion_manuel_t238.xlsx` y el informe de producción:
- Ninguna comisión anterior en $ 0. Las 7 de la tabla aparecen al peso en la ficha, en Equipo y en el Excel exportado.
- La ficha de Hernando muestra Comisión anterior $ 4.906.224 · Meta $ 49.000.000 · Producción $ 49.062.240 · 100,13 % · 10,00 % · Producción × tasa $ 4.906.224, con 37 facturas y ✓ "cuadra con Hoja4".
- Básico + transición de Hernando: $ 10.641.673. Equipo, total sin BTL: $ 23.325.770.
- **Comerciales:**

  | | Carolina | Consuelo | Leidy | Lynette | Oriette | Tatiana |
  |---|---:|---:|---:|---:|---:|---:|
  | Básico + transición | 8.315.829 | 6.551.419 | 5.656.518 | 9.137.796 | 9.464.209 | 8.062.041 |

- Si cambio el tramo de 101–110 % a 12 %, Hernando y Leidy se recalculan solos.
- Si borro la meta de Hernando, aparece "Falta la meta…" y la comisión queda "Pendiente", no $ 0.
- Si escribo una producción manual, sale el chip "Producción manual" con la diferencia.
- **Unión con producción:** los anticipos `27209…` no se cuentan como facturas por unir; debe decir **183 de 183 unidas** (hoy dice "183 de 236", "Revisar").
- **Director:**
  - comisión anterior **$ 3.792.727** (base $ 252.848.440 × 1,50 %, con ✓ "cuadra con Hoja4");
  - transición: paga la **nueva, $ 7.208.412** (score 91,83);
  - sin aviso de pendiente;
  - la tabla de tramos del director aparece en Parámetros con la nota "solo informativa".
- Los scores no cambian. FEDESCO: director $ 3.852.459 y comercial $ 0.

---

# FASE 2: arreglos visuales (vistas.js, carga.js, estilos.css; solo tokens)

## 2.0 Vista previa del archivo cargado (carga.js `htmlVista`, `pintarEstadoArchivos`; css `.tabla-vista`)
Hoy la tabla mide 1.371 px dentro de una tarjeta de 1.217 px a 1366 × 768: la columna Estado se corta ("CANCELA", "NO CANC") y se sale del contenedor. Además, los 3 avisos se apilan con mucho aire.

**Rediseño:**
1. **Aviso compacto**, una sola línea en `.nota` (12 px, `neutro-700`) con ícono ⓘ: "Hojas: Facturacion + Misión Int. + BTL · 256 líneas útiles · 5 filas de totales excluidas (sin asesor)". Un `details` "Ver cuáles" lista las filas excluidas (hoja, fila y base).
2. **Resumen por asesor arriba**, una tabla pequeña de 3 columnas:
   - columnas: Asesor · Facturas · Suma de BASE con fecha del mes (= producción anterior);
   - una fila Total, que debe dar $ 252.848.440;
   - el chip ✓ "Cuadra con Hoja4" o ⚠ "No cuadra: $ X";
   - clic en un asesor filtra la tabla de abajo.
3. **Filtro**: un `select` "Asesor: Todos ▾", un `input type=search` "Buscar factura o cliente" y el segmentado "Hoja: Facturacion | Misión | BTL".
4. **Tabla sin desbordar**: `table-layout: fixed; width: 100%`, sin scroll horizontal y con columnas prioritarias:

   | Columna | Ancho |
   |---|---|
   | Factura | 110 px |
   | Cliente | 1fr, ellipsis, nombre completo en `title`; en modo cómodo, 2 líneas con `-webkit-line-clamp: 2` |
   | Asesor | 130 px |
   | Cuenta | 150 px, solo el código y la primera palabra, completa en `title` |
   | Fecha | 88 px |
   | Estado | 104 px |
   | Base | 120 px, derecha, `tabular-nums` |

   - Grupo, Subgrupo y Fecha de pago salen de la tabla y se ven en un `title` de la fila, o como columnas opcionales con "Columnas ▾".
   - **Estado como chip**: `.badge--exito` "Cancelada", `.badge--aviso` "No cancelada" y `.badge--neutro` "Sin estado". Texto en minúscula inicial, sin cortar.
   - Montos a la derecha y fechas en `dd/mm`.
5. Muestra 10 filas, con "Ver 10 más" y "Ver todas (238)". Sin scroll interno y con la cabecera de la tabla sticky en la página.
6. La vista previa de Producción usa el mismo componente.

**Criterio:**
- a 1366 y 1920, `table.scrollWidth <= contenedor.clientWidth`;
- ningún chip de Estado cortado;
- el resumen por asesor da los 7 valores de la tabla 1.7 y el total 252.848.440;
- el filtro por asesor muestra 37 filas para Hernando.

## 2.1 Ficha y panel

1. **Tarjeta "BTL 5.11.5" del panel derecho, sin `parametros.xlsx`** (`btlLinea` y `lateral`):
   - Hoy el aviso amarillo va pegado al título, el botón queda desalineado y "Ver detalle BTL" es un enlace azul subrayado por defecto.
   - Usa el patrón `.estado-vacio--aviso` compacto:
     - padding `--espacio-3`, radio `--radio-2`, borde izquierdo 3 px `aviso-700`, fondo `aviso-100`, separado del título con `--espacio-2`;
     - ícono ⚠ y el texto en 2 líneas como máximo: "**Falta la utilidad del evento 575.** Carga parametros.xlsx.";
     - debajo, una fila `display:flex; gap: var(--espacio-2); align-items:center`, con el botón `.boton--primario .boton--sm` "Ir a Cargar datos" y el botón `.boton--texto` "Ver detalle BTL →" (color `primario-700`, sin subrayado y subrayado al pasar el mouse).
   - Con datos, se muestran "Comisión BTL $ 0" con el badge del motivo y, en otra línea, "Director $ 3.852.459 · Paga", con el mismo `.boton--texto`.
   - Aplica lo mismo en la sección 5.11.5 de la ficha: el botón va dentro de la caja, alineado a la izquierda y con margen superior de 8 px, nunca pegado al borde.
2. **Tarjeta "Esquema anterior y transición":**
   - Hoy la columna izquierda está casi vacía (KPI y un enlace) y la derecha parte montos en 2 líneas ("Esquema anterior: $ / 4.729.224").
   - Rejilla `grid-template-columns: minmax(0,1fr) minmax(0,1fr)` y `align-items:start`. A la izquierda va el bloque 1.5; a la derecha, el comparativo.
   - La fila "Resultado de la transición" pasa a "Se paga" con `.badge--paga` y el monto en `.dinero` `nowrap`.
   - Columna de valores de `.lista-concepto` con `minmax(140px, auto)`.
   - Ningún monto en 2 líneas.
3. **Medidor de score:**
   - Las etiquetas "80 90 100 110 120" se montan a 1366 px.
   - Muestra solo 0 · 80 · 100 · 120 (las otras, solo como marca sin texto) y `font-size: var(--tipo-xs)`.
4. **Mini tarjetas de indicador:**
   - "Peso 45 · máx. 54" se parte en 2 líneas.
   - Déjalo en "45 pts", con el máximo en un `title`.
5. **Selector de mes de la barra superior:**
   - Hoy dice "October 2026" (el `input type=month` toma el idioma del navegador).
   - Cámbialo por un `<select>` "Mes · Octubre 2026 ▾" con los meses de la transición en español.
6. **Secciones plegables de la ficha:**
   - Hoy hay mucho aire: unos 64 px por sección cerrada y 16 px entre ellas.
   - `summary` con min-height 48 px (40 px en compacto) y gap 8 px entre secciones.
   - El resumen de la derecha va en `neutro-700` y `tabular-nums`.
7. **Panel derecho:**
   - Las filas de `.lista-concepto` no quedan alineadas ("Diferencia" con su raya más baja que la del valor).
   - Una sola línea por fila con `align-items: baseline`, borde inferior en la fila completa (`li`) y no por celda.
8. Pendientes de la ronda 10 que siguen sin hacer:
   - "Ver detalle BTL" y demás enlaces con estilo de botón de texto;
   - Equipo: la fila Total debe verse sin scroll a 1366 × 768 (hoy el documento mide 913 px). Reduce la altura de las filas del gráfico a 22 px y la de las KPI a 84 px.

**Criterio de aceptación de la fase 2:**
- A 1366 y 1920: ningún monto partido en 2 líneas en la ficha (compruébalo con `getClientRects().length === 1` en `.dinero`);
- sin scroll horizontal;
- la tarjeta BTL, con y sin `parametros.xlsx`, sin elementos pegados;
- etiquetas del medidor sin solaparse;
- el mes en español.

---

# FASE 3: impresión (regresión)

Con puppeteer en A4, la impresión creció:

| | v8 | v9 | Meta |
|---|---:|---:|---:|
| Todas las fichas | 17 páginas | **21** | ≤ 14 |
| Con detalle | 24 páginas | **45** | ≤ 35 |
| Hernando | 3 páginas | 3 | ≤ 2 |

**Qué se ve:**
- la página 2 tiene la mitad derecha vacía (5.5, 5.6 y 5.7 se imprimen como cajas amarillas de formulario);
- en la página 3, "1. Política anterior" ocupa media columna con una sola línea.

**Qué hacer:**
- En impresión, los campos editables se pintan como texto (`.campo-editable` → sin fondo ni borde, solo el valor).
- 5.5, 5.6 y 5.7 van juntas en una fila de 3 columnas.
- "Política anterior" se imprime con el bloque 1.5 de 6 líneas, junto al comparativo, en 2 columnas.
- Márgenes en 7,5 pt, una línea por evento y máximo 12 filas ("+ N eventos más en pantalla").
- Revisa que el detalle de facturas no repita encabezados en páginas casi vacías.

**Criterio de aceptación de la fase 3:** 7 fichas en ≤ 14 páginas, Hernando en ≤ 2 y con detalle ≤ 35, cada página con la etiqueta de simulación.
