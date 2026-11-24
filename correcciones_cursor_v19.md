# Correcciones para Cursor · ronda v19 · Puntos por producto, director con 4 secciones y BTL con margen bruto

> **Simulación. No es un pago oficial.** No pegues datos reales en el código. Todo sale de **Parámetros** (celdas amarillas). La app sigue funcionando local, con doble clic, sin red.
> Base: la versión v18. Copia los archivos de este zip encima. `js/parametros.js` **no viene en el zip** porque tiene datos personales: aplica a mano los cambios de la sección C.

## Qué se pidió
1. Una **columna de puntos por producto** en la tabla 5.4, y qué pasa cuando hay **sobrecumplimiento**.
2. Que el **director** vea también los otros 3 aspectos de la política: **5.5 Base social**, **5.6 Diversificación e innovación** y **5.7 Satisfacción**.
3. Ajustes BTL (5.11.5) según las respuestas del 23 de noviembre.

## A. Sobrecumplimiento (5.4): qué hacía la app y qué hace ahora
- **Antes:** el cumplimiento de cada producto entraba **sin tope** (solo Congreso tenía tope). Solo el total del indicador se topaba en 120 %. Un producto muy alto **compensaba** a otro bajo.
  - Ejemplo real del director en octubre: Educación 63,65 % y Misión **218,75 %** → Σ peso × cumplimiento = 89,41 % → **40,24 puntos** de ventas → score **91,83**.
- **Ahora:** cada producto se reconoce **hasta el tope por producto** (Parámetros → «Tope por producto (5.4)», 120 %; Congreso con su propio tope, 100 %). **El exceso no compensa otros productos.**
  - Mismo ejemplo: Misión elegible 120,00 % → Educación 23,89 + Misión 8,97 = **32,86 puntos** → score **84,45**.
- Fórmula: **Puntos del producto = 45 × peso × cumplimiento elegible**; **cumplimiento elegible = mínimo(cumplimiento real, tope del producto)**. La suma de la columna es exactamente los puntos de ventas.

## B. Cambios por archivo
| Archivo | Cambio |
|---|---|
| `js/calculos.js` | `cumplimientoVentas(ventas, metas, topeCongreso, topeProducto)` (l. 288): por producto `real`, `elegible = min(real, tope)`, `excede`. Nueva `puntosPorProducto(detalle, pesoVentas, topeIndicador)` (l. 315). `liquidarComercial` y `metodosDirector` usan `parametros.topeProducto` y devuelven `detalleVentas` con `peso`, `cumplimiento`, `elegible`, `puntos`. `liquidarBtl` (l. 900) reescrita: utilidad real y presupuestada con la misma fórmula, margen bruto y neto, margen que decide, topes por persona, reparto, salvaguarda proporcional y carga prestacional informativa. En `liquidarMes` (l. 1105) el reparto solo aplica si está aprobado. |
| `js/btlArchivos.js` | Lee también **TOTAL INGRESOS** y **TOTAL COSTOS** de la columna **PRESUPUESTO**. Nuevas `utilidadBase` (l. 192), `presupuestoCalculado` (l. 197) y `repartoDe` (l. 244). `unirEventos(base, mes, marca, costos)` agrega `presupuestoBtl`, `reparto` y `repartoAprobado`. El excedente neto del archivo queda **solo para comparar**. |
| `js/carga.js` | Pasa `p.costos` a `unirEventos`. |
| `js/cargaBtl.js` | Tabla «Cálculo de la app» Presupuesto vs Ejecución: ingresos, costos, ICA, 4×1000, utilidad base, excedente del archivo y diferencia, **margen bruto (decide la tabla)**, margen neto (informativo) y cumplimiento. Bloque **reparto** `htmlReparto` (l. 147): casilla «Reparto aprobado antes del cierre (5.12)» y % por persona. |
| `js/vistas.js` | Nueva `tablaVentasPuntos` (l. 1601): Producto, Venta, Meta, Peso, Cumplimiento, Cumplimiento elegible (tope), **Puntos**, fila **Total**, celda naranja si real > tope y la nota de sobrecumplimiento. Se usa en la ficha y en el director. Nuevas `encabezadoPagosDirector` (l. 717, tres tarjetas: anterior / nueva / BTL) y `seccionesDirector` (l. 767: 5.4, 5.5, 5.6, 5.7, tabla total «= score del director» y «Cómo se agrega desde el equipo»). Panel BTL con columnas utilidad presupuestada / real / margen bruto / margen neto / cumplimiento y una línea por persona del reparto. |
| `js/exportarIndividual.js` | Nueva `ajustesV19` (l. 170), llamada en `libroDe` después de mover filas. Ver sección D. `eventoEspecial` (l. 457) busca también los eventos del reparto. `Escenarios` B133/B134 ahora llevan el **presupuesto** (antes la ejecución). |
| `js/exportarDirector.js` | Nueva `ajustesDirectorV19` (l. 312). Ver sección D. |
| `js/excel/motor_excel_individual.js` | Nueva `altoFila(lib, hoja, fila, alto)` al final, para que las notas quepan en las filas separadoras (fila 45 del comercial; 45, 54, 68 y 74 del director). |
| `css/estilos.css` | Bloque «v19» al final: `.celda-sobrecumple` (naranja `#ffe3c2`), nota, fila total, tabla BTL, reparto, tarjetas del director. |
| `index.html`, `js/main.js` | Caché `20261123a`. |

## C. `js/parametros.js` (aplicar a mano; no viene en el zip)
- `costos.ica: 0.00966` (9,66 por mil exacto). En `cargarGuardado`: si lo guardado es exactamente `0.009660442`, pasa a `0.00966`.
- `topeProducto: 1.2` (después de `topeCongreso: 1`). Campo «Tope por producto (5.4)» en la tarjeta «Curva de pago», junto a «Tope de Congreso».
- `btlUmbrales.margenDecide: "bruto"`. Selector en la tarjeta BTL (`data-ruta="btlUmbrales.margenDecide" data-tipo="texto"`, opciones bruto / neto).
- `btlComercial.cargaPrestacional: 0.5236` (solo informativa).
- Campos editables en la tarjeta BTL: `btlComercial.topeEvento` (0,8), `btlComercial.topeAnio` (2), `btlDirector.topeEvento` (0,25), `btlDirector.topeAnio` (1), `btlComercial.salvaguarda` (25 %) y la carga prestacional.

## D. Excel exportado
**Comercial** (`ajustesV19`):
- `Escenarios` A34/B34 «Tope por producto (5.4)» → nombre `Tope_producto_5_4`; A13/B13 «Tope de Congreso (5.4)» → `Tope_congreso_5_4`.
- `Motor!K2` = Σ peso × MIN(cumplimiento, tope del producto).
- `Liquidación` I19 «Puntos» e I20/I27/I34/I38 = `Peso_Ventas × peso × MIN(cumplimiento, tope)`. Etiquetas «Cumplimiento real (se reconoce hasta 120 %)», celda naranja si excede, nota en F45.
- BTL: I78 tope por evento × participación; I79 tope anual de Parámetros; I84 con los umbrales y % de Parámetros (antes tenía números fijos); I85 = MIN(topes, IMR × % × participación) × factor de salvaguarda. Filas nuevas: 86 margen neto (informativo), 87 carga prestacional, 88 participación, 89 factor de salvaguarda.
- `Escenarios` B85 = **margen bruto** `(D6 − E6) / D6`, B133/B134 = ingreso y costo **presupuestados**, nota en A136. Sin columna PRESUPUESTO, B83 toma la utilidad presupuestada de la app.
- `_Margenes_especiales` A2 ya no dice «Eventos 567 y 575» fijo: usa los números del comercial.
- El nombre `BTL_ingreso_evento` (B142) estaba vacío en la plantilla: ahora lleva el ingreso de ejecución. Así se ven el ingreso del evento (I77) y la comisión BTL anterior informativa (C27), igual que en la app.

**Director** (`ajustesDirectorV19`):
- `Parámetros` A29/B29 «Tope por producto (5.4)» → `Tope_producto_5_4`.
- `Liquidación` I43 = Σ peso × MIN(cumplimiento, tope); columna «Puntos» I19/I20/I27/I34/I38; nota en F45.
- Las secciones 5.5, 5.6 y 5.7 ya existían en el Excel: se agregó una línea «Agregado: …» (F54, F68, F74).
- BTL: I83 = **margen bruto** con el costo del evento.

## E. Reparto entre comerciales (5.12): supuesto que se programó
- Por defecto liquida **solo el responsable al 100 %**. El reparto aplica **solo si** se marca «Reparto aprobado antes del cierre». Para ver los %, primero hay que marcar a la persona en «También participaron».
- Cada persona recibe **su % × % de la tabla × su propio IMR**, con tope **su % × 0,8 × su IMR** por evento y **su propio tope anual** (2 × IMR − lo ya pagado).
- Cada persona necesita **su propio score** ≥ mínimo y las condiciones del evento.
- **Salvaguarda (25 % de la utilidad real):** si comerciales + director pasan el límite, **todos bajan en la misma proporción**.
- Si la suma pasa de 100 %, los comerciales quedan **Pendiente**. Si suma menos de 100 %, lo que falta **no se paga**.
- La **carga prestacional** (52,36 %) solo se informa aparte. No entra al tope.

## Criterios de aceptación (probados en Chrome, doble clic, file://)
- [x] 0 errores en consola y 0 peticiones de red. El empaquetado dice «Control de datos personales: 0 de 76».
- [x] **Ficha 5.4:** columna Puntos y fila Total que cuadran. Ejemplo de un comercial: 15,76 + 21,22 = 36,98 de 45.
- [x] **Director, octubre:** Educación 23,89 + Misión 8,97 = 32,86. Misión 218,75 % en naranja, elegible 120,00 %, con la nota de sobrecumplimiento.
- [x] **Director, 4 secciones:** 32,86 + 16,59 + 20,00 + 15,00 = **84,45 = score del director**, con «Cómo se agrega desde el equipo» en cada una. Factor 78,89 %, política nueva $6.193.107 (antes $7.208.412).
- [x] **Los 7 comerciales no cambian** en octubre, noviembre y diciembre: ningún producto pasaba de 120 %. Noviembre y diciembre del director siguen en 51,59.
- [x] **BTL, archivo modelo:**
  - presupuestada **$92.700.053** (misma fórmula; archivo $92.308.580, diferencia $391.473);
  - real **$93.305.400**; cumplimiento **100,65 %**;
  - margen bruto **24,00 % (decide)**; neto 22,73 % informativo;
  - director $3.852.459 (0,25 IMR).
- [x] **Reparto 60/40** aprobado (con score mínimo bajado a 40 solo para la prueba): $7.048.407 y $3.723.832; carga informativa aparte. Con suma 110 % los dos quedan «Pendiente».
- [x] **Salvaguarda** (prueba de unidad con 10 %): factor 0,5881. La suma comerciales + director = $9.330.540 = 10 % de la utilidad.
- [x] **Excel** del comercial (con y sin reparto, y sin BTL) y del director: 0 errores después de recalcular. Las cifras son iguales a la app: puntos 36,98 / 18,51 / 32,86, score 84,45, pago $6.193.107, BTL $7.048.407 / $3.723.832 / $3.852.459.

## Pendiente de confirmar (no se programó)
- Meta de base social del equipo: 622 o 524 (hoy 622).
- Evidencia formal del reparto aprobado. Hoy es una casilla.
- El factor de margen de Educación (5.4) sigue con el margen neto. No cambió ningún puntaje.
- Algunos textos largos de la plantilla (Explicación A59, Parámetros B7, Supuestos B11) conservan la narración del evento de referencia.
- En el Excel del comercial, la comisión BTL (I85) no aplica el score mínimo (ya era así en v18). La app sí lo aplica.
- Si guardaron parámetros en el navegador antes de v19, los campos nuevos toman el valor por defecto. Una ICA distinta de la anterior por defecto se respeta.
