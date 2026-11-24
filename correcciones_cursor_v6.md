# Correcciones para Cursor, ronda 6 (19/11/2026)

La ronda 5 quedó bien en los números. Con los archivos reales de octubre, las 7 fichas, el director y FEDESCO cuadran. Esta ronda corrige la presentación de la ficha, la impresión y algunos rótulos.

No cambies ningún cálculo de `calculos.js`, salvo el punto 1. Antes de seguir con el siguiente punto, explícame cada cambio: archivo, función y cómo probarlo.

Reglas que siguen:
- `calculos.js` puro.
- `escaparHtml` en todo dato.
- Sin CDN.
- Nada fijo en el código.
- `pruebas.html` en verde.

---

## Prioridad media

1. **"Facturas del mes" repite facturas y mezcla productos** (calculos.js `liquidarComercial` → `detalleFacturas`/`totalesFacturas`; vistas.js `fichaFacturas`).
   - Hoy salen dos veces las facturas de Misión y BTL: la línea de la hoja Facturación sin fecha (base $ 1.000.000) y la línea de la hoja complementaria (base $ 15.500.000). Hernando tiene FEC 15198, 15250, 15251, 15291 y 15292 repetidas; Carolina, FEA 4351; Lynette, FEOC 4284; Oriette, FEBA 2910; Tatiana, FEC 15267.
   - Además, el total "Recaudo" de Hernando ($ 288.110.525) suma BTL y Misión con Edu/AT.
   - Agrega a cada fila `origen` (nombre de la hoja) y `uso`, con uno de estos valores:
     - "Edu/AT · política nueva";
     - "Misión · valor fijo por factura";
     - "BTL · se liquida en 5.11.5";
     - "Solo esquema anterior".
   - Muestra la tabla agrupada por `uso`, con subtotal por grupo, y con la columna "Hoja".
   - En las filas de Misión de la hoja complementaria, "Venta reconocida" = valor por factura ($ 15.500.000), no $ 0.
   - Las líneas BTL no suman en "Recaudo" ni en "Venta reconocida".
   - **Prueba:** en Hernando, el subtotal Edu/AT da recaudo $ 34.530.525 y reconocida $ 34.530.525. Misión da 3 facturas → $ 46.500.000. BTL queda aparte, con $ 207.080.000 recaudado.

2. **La impresión es demasiado larga** (css/estilos.css `@media print`; vistas.js `htmlFicha`).
   - "Imprimir todas las fichas" da **95 páginas**, unas 14 por ficha. El Excel es de 1 a 2 hojas.
   - En impresión:
     - letra de 9 pt;
     - bloques 5.4 a 5.7 en dos columnas;
     - los campos editables se imprimen como texto (sin caja);
     - se omiten Congreso y Actividad cultural cuando la meta es 0;
     - la tabla "1. Política anterior" se imprime solo con el total y el número de líneas.
   - Agrega una casilla "Incluir detalle de facturas al imprimir", apagada por defecto. Solo si está marcada se imprimen la tabla de facturas y las líneas del esquema anterior.
   - **Prueba:** las 7 fichas sin detalle salen en ≤ 21 páginas (≤ 3 por ficha), cada una empieza en hoja nueva y lleva el pie "Simulación. No es un pago oficial · <comercial> · <mes>".

3. **SERFISCAL mal rotulado** (vistas.js `fichaInnovacion`, líneas 380-381).
   - La fila "Ventas recaudadas trimestrales" muestra el campo "SERFISCAL" (que es un %).
   - "Meta trimestral de ventas" está escrita a mano como "100 %".
   - Cámbialo a:
     - "Cumplimiento SERFISCAL (%)", con el campo editable;
     - "Meta" leída de parámetros (agrega `serfiscal.meta` si no existe);
     - "Cumplimiento" y "Puntaje".
   - Si no hay dato: "Pendiente · 10 puntos (neutral)", con el número leído del peso.

4. **Innovación muestra puntos que no ganó** (vistas.js `fichaInnovacion`, líneas 393 y 395). "Puntos por oferta aprobada 2" y "Puntos por primera venta 3" son los valores de parámetros, no lo obtenido. Muéstralo como "Puntos por oferta aprobada: 0 (2 por cada oferta)", con el valor que calcula `puntosInnovacion`. En octubre, el Excel muestra 0 y 0, con puntaje 10 (neutral).

5. **Barra llena cuando el dato está pendiente** (vistas.js `fichaSatisfaccion`, línea 409, y cualquier `barraCumplimiento` de un indicador neutral). Con satisfacción neutral, la barra sale al 83 %. Si `neutrales.X` es verdadero, no dibujes la barra.

## Prioridad baja

6. **Rótulos repetidos.** `entradaFicha` dentro de una celda "Valor" repite la etiqueta ("Retiros / Retiros", "Ingresos / Ingresos", "Satisfacción obtenida"). Dentro de tablas usa solo `aria-label`, sin texto visible.

7. **Formatos:**
   - "Porcentaje (curva de pago) 0,0000" debe salir como **"0 %"** (vistas.js `fichaResumen`, línea 263).
   - "Máx. 120,0 %" e "Ingreso máximo mensual (120,0 %)" deben decir "120 %". Los porcentajes enteros van sin decimal.

8. **Documento y cargo.**
   - En el encabezado de la ficha salen dos cajas amarillas vacías.
   - Llévalas a Parámetros → Comerciales.
   - En la ficha y en la hoja exportada, muestra la línea solo si tiene dato.

9. **Congreso y Actividad cultural sin meta.** Con meta 0, "Cumplimiento" debe decir "No aplica", no "Pendiente".

10. **Nombre del evento en "Márgenes de sus eventos".**
    - Hoy muestra el PRODUCTO ("Diplomado temática técnica / virtual") y no el nombre del evento.
    - Mapea la columna `DETALLE` del informe en `CAMPOS_EVENTOS` (alias "detalle") y usa el detalle de la primera fila del #.
    - **Prueba:** el #566 debe decir "PROGRAMA IA HUMAN AL-FIRST-…".

11. **Tarjeta resumen más clara** (`fichaResumen`).
    - "Política nueva" y "Esquema anterior" van en dos recuadros lado a lado. El que paga lleva el distintivo verde "Paga" y el otro va en gris.
    - Debajo, la diferencia en rojo si es negativa.
    - Quita el segundo "Simulación…" que hay dentro de la tarjeta del encabezado: ya está arriba y en el pie.

12. **Tabla BTL demasiado ancha.**
    - Mide 2.452 px dentro de un contenedor de 1.007 px, y los pagos quedan fuera de la vista.
    - Junta las cinco condiciones en una sola columna "Condiciones", con las casillas apiladas y su texto.
    - Pon "Pago comercial" y "Pago director" antes de las condiciones.
    - **Prueba:** a 1366 px, la tabla cabe sin scroll horizontal.

13. **Director con el mismo estilo de la ficha** (`pintarDirector`). Usa:
    - la tabla 5.8 (Indicador | Peso | Máx. 120 % | Puntos), con distintivos y barras;
    - la línea de fórmula "Ventas = 45 × mín(Σ peso × cumplimiento; 120 %) = 45 × 89,4 % = 40,24";
    - la de base social "Cierre 516 de 622 = 83,0 % → 16,59 puntos (sin regla del 100 %)";
    - los dos recuadros nueva/anterior con "Paga".

---

## Prueba de aceptación (archivos reales de octubre + parametros.xlsx)

- **Ficha:** scores 53,51 · 61,41 · 71,98 · 41,90 · 57,08 · 55,34 · 58,41 (Carolina, Consuelo, Hernando, Leidy, Lynette, Oriette, Tatiana).
- **Esquema anterior:** 2.584.400 · 772.050 · 4.729.224 · 1.643.920 · 3.821.877 · 3.838.759 · 4.317.730.
- **Director:** 91,83, factor 0,9183, $ 7.208.412 (política nueva), contra $ 3.545.215 del esquema anterior.
- **FEDESCO 575:** utilidad presupuestada leída sola (92.699.872,906), director $ 3.852.459 y comercial $ 0 con "Score 71,98 < 80".
- **Hernando:** en "Facturas del mes" ninguna factura aparece dos veces dentro del mismo grupo, con los subtotales del punto 1.
- **SERFISCAL, innovación y satisfacción:** se ven como "Pendiente · neutral", sin barras ni puntos de parámetros.
- **Impresión:** ≤ 3 páginas por ficha sin detalle.
- **Ancho:** sin scroll horizontal del documento a 400 px ni a 1366 px. La tabla BTL cabe a 1366 px.
- **Pruebas y consola:** pruebas.html en verde y consola sin errores. Agrega un `favicon.ico` local o `<link rel="icon" href="data:,">` para quitar el 404.
