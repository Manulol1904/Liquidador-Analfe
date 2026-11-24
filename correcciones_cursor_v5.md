# Correcciones para Cursor, ronda 5 (19/11/2026): ficha por comercial y mejoras visuales

Esta ronda sigue a la ronda 4 (`correcciones_cursor_v4.md`). **Si todavía no aplicaste la ronda 4, aplícala primero** (punto 0). Después aplica los bloques A a E en orden. Antes de seguir con el siguiente bloque, explícame cada cambio: archivo, función y cómo probarlo.

Reglas que no cambian:
- Todo sigue local, sin CDN.
- `calculos.js` sigue puro: sin DOM ni `localStorage`.
- `pruebas/pruebas.html` debe seguir pasando. Agrega pruebas para lo nuevo.
- Todo dato que venga de un archivo pasa por `escaparHtml`.
- No hay valores fijos en el código: todo sale de `parametros.js` o de los archivos.
- Lo editable va en amarillo y lo calculado en gris.
- El aviso "Simulación. No es un pago oficial." aparece en el encabezado, en el pie y en cada ficha impresa.

---

## 0. Ronda 4, si falta

1. `CAMPOS_BTL_EVENTOS` (carga.js):
   - El evento se lee con los alias `['evento_id', '#', 'evento']`, en ese orden.
   - Las condiciones se leen con alias exactos (`exacto: true`):
     - participacionComercial → `participacion_material_comercial`
     - participacionDirector → `participacion_material_director`
     - cierre → `certificacion_financiera`
     - recaudo → `meta_recaudo_alcanzada`
     - satisfaccion → `satisfaccion_cliente`
   - Una celda vacía queda sin definir.
   - **Prueba:** al cargar parametros.xlsx, la fila 575 muestra 92.699.872,906 sin escribirla a mano.
2. La pestaña BTL muestra solo los eventos que tienen filas del mes que se liquida. Para eso, `armarProduccion` marca esos eventos con `delMes: true`.
3. La tabla BTL va dentro de un contenedor con `overflow-x: auto`. El campo de utilidad presupuestada lleva `min-width: 14ch` y formato de miles.
4. La vista previa de Producción muestra primero los eventos del mes.

---

## A. Quitar lo que no aporta

1. **Días trabajados y días del mes** (parametros.js):
   - Quita las columnas de `htmlFormulario` → tabla `tabla-metas` (`<th>Días trabajados</th>`, `<th>Días del mes</th>`) y las celdas de `filaPersona` (`comerciales.N.diasTrabajados`, `comerciales.N.diasMes`).
   - Quita también la frase "En el primer mes, si hay días trabajados y días del mes, la meta se prorratea" del texto de "Comerciales y metas".
   - **La lógica se queda.** `metaProrrateada` (calculos.js) y los campos `diasTrabajados`/`diasMes` de `persona()` siguen porque los necesita Diana Reyes en su mes de ingreso (2026-12), igual que su liquidador de Excel ("Días laborados en el cargo", "Factor de prorrateo").
   - En la interfaz, esos dos campos aparecen **solo** en la ficha de un comercial cuyo `activoDesde` sea el mes que se liquida, dentro de un recuadro "Mes de ingreso: prorrateo". En la misma línea va el resultado: `Factor de prorrateo = días laborados ÷ días del mes = X`.
2. **"Desde AAAA-MM"** debajo de cada nombre en `filaPersona`: muéstralo solo si `activoDesde` es distinto del primer mes de la transición (hoy, solo Diana).
3. **Gráfica de la curva** (`dibujarCurva`, `<canvas id="grafica-curva">` en `pintarDetalle`): no aporta, porque el punto del comercial queda pegado en 0. Cámbiala por la tabla "Curva de pago" del bloque B2, con la fila que aplica resaltada. Si Chart.js ya no se usa en ningún lado, quita `lib/chart.umd.min.js` de index.html.
4. **Listas largas de avisos.** En `pintarDetalle` (al final de "Ventas del mes") y en `pintarDirector` (las 19 líneas "La factura … no tiene fecha"), usa `avisosAgrupados()` en vez de `listaAvisos()`: "N facturas sin fecha" dentro de un `<details>`.
5. **La tabla "Indicadores" de 3 columnas y "Ventas del mes"** de `pintarDetalle` se reemplazan por la ficha del bloque B. No las dejes duplicadas.

## B. Ficha por comercial, igual al Excel individual

Pestaña "4. Detalle por comercial", ahora "4. Ficha por comercial". Arriba va un selector de comercial y botones anterior/siguiente. La ficha replica, bloque por bloque y en este orden, la hoja "Liquidación" de `Liquidacion_Oct2026_<Nombre>_v6.7.xlsx`, con los mismos títulos.

### B0. Datos que debe devolver `liquidarComercial` (calculos.js, puro)

Hoy solo devuelve totales. Agrega, sin cambiar los cálculos actuales:

- `detalleFacturas`: un objeto por factura del comercial, con:
  - `factura`, `producto` (`nombreVisible`), `cuenta`, `evento` (el #), `base`, `estado`, `fechaPago`;
  - `elegible` (pasa `esRecaudo`), `recaudo` (base si es elegible, 0 si no);
  - `margenEvento`, `factorAplicado` y `ventaReconocida` (base × factor).
- `eduAt`: `{ ventaRecaudada, ventaReconocida, margenComprobado, factorReconocimiento }`, donde:
  - `margenComprobado` = Σ(base × margen del evento) ÷ Σ base de las facturas elegibles;
  - `factorReconocimiento` = ventaReconocida ÷ ventaRecaudada.
- `mision`: `{ facturas, valorPorFactura, valorReal, ventaReconocida }`. `valorReal` es la suma de las bases de sus facturas de Misión elegibles.
- `detalleAnterior`: un objeto por línea del esquema anterior, con `factura`, `producto`, `base`, `tasa` y `comision`. Además, `btlAnterior` aparte: base × tasa de sus líneas BTL. Es informativo y **no** se suma a `pagoAnterior`.
- `margenesEventos`: los eventos a los que pertenecen sus facturas del mes, con `#`, `evento`, `facturas`, `ingreso`, `costo` (columna COSTO, costo directo), `ica`, `gmf`, `costoTotal` (= costo + ICA + GMF), `margen` y `banda` ("Menor al 10 % · 0 %", "Entre 10 % y 20 % · 90 %", "Mayor al 20 % · 100 %").

### B1. Encabezado

- Nombre del trabajador.
- Salario base (= básico).
- Ingreso objetivo (IMR) mensual (= básico + oportunidad).
- Ingreso máximo mensual (120 %) (= básico + 1,2 × oportunidad).
- Opcionales: "Documento de identidad" y "Cargo, nivel y regional". Son campos nuevos en Parámetros, vacíos por defecto, y la línea se muestra solo si tiene dato. No los llenes tú.

### B2. Resumen: tarjeta arriba, siempre visible

- Score con dos decimales, barra de 0 a 120 con marcas en 80, 90, 100, 110 y 120, y factor con cuatro decimales.
- **Política nueva** contra **Esquema anterior**, y una etiqueta grande que diga cuál paga y el valor: "Aplica el esquema anterior: $ 4.729.224".
- **5.8 Resultado**, en una tabla con columnas `Indicador | Peso | Máx. 120 % | Puntos obtenidos`:

  | Indicador | Peso | Máx. 120 % |
  |---|---|---|
  | Ventas rentables y recaudadas | 45 | 54 |
  | Base social | 20 | 24 |
  | Diversificación e innovación (SERFISCAL + innovación) | 20 | 24 |
  | Satisfacción | 15 | 18 |
  | **Total** | 100 | 120 |

  Debajo de la tabla van "Porcentaje (curva de pago)" y "Comisión ganada · política nueva (sin BTL)".
- **Curva de pago**, al lado: Menor a 80 puntos → 0 % · 80 → 70 % · 90 → 90 % · 100 → 100 % · 110 → 110 % · 120 → 120 %. Resalta la fila que aplica.
- Pesos, topes y anclas se leen de `parametros`.

### B3. "1. Política anterior"

- Comisión anterior: el valor final.
- Tabla de líneas: `Factura | Producto | Base | % comisión | Comisión`, con total. Los números deben coincidir con los de la sección F.
- Misión internacional · política anterior: Valor por factura × Facturas = Valor total. Solo si tiene Misión.
- BTL · política anterior: Ingreso del evento y Comisión BTL anterior. Va aparte y no se suma.
- Una línea de fórmula: "Comisión anterior = Σ base × % comisión de cada línea del mes (sin BTL)".

### B4. "2. Política nueva · PCV-COM-001"

**5.4 Ventas rentables y recaudadas.** Va un sub-bloque por producto, con su peso, en este orden:

- **Educación y asistencia técnica:**
  - Venta recaudada para Educación y asistencia técnica;
  - Meta del mes;
  - Cumplimiento;
  - Margen comprobado;
  - Factor de reconocimiento;
  - Venta reconocida.
- **Misión internacional:**
  - Facturas de Misión del mes;
  - Valor reconocido por factura;
  - Valor real de las facturas elegibles;
  - Venta recaudada para Misión internacional;
  - Meta individual;
  - Cumplimiento.
- **Congreso Nacional** y **Actividad cultural:** Venta recaudada, Meta del mes y Cumplimiento. Si la meta es 0, el sub-bloque se muestra atenuado con "Sin meta este mes".
- **Cierre:** Cumplimiento ponderado y Puntos.

Además de los sub-bloques, una tabla compacta: `Producto | Meta | Real (reconocido) | % cumplimiento | Con tope 120 % | Peso | Aporte`. Debajo, la fórmula con los números reales, por ejemplo: "Puntos = 45 × mín(Σ peso × cumplimiento; 120 %) = 45 × 82,18 % = 36,98".

**5.5 Base social:**
- Filas: Base social 30 sept · Retiros · Ingresos · Base social cierre · Meta · Resultado · Puntos.
- Ingresos y retiros siguen siendo editables, en amarillo.
- Fórmula: "Cierre = base + ingresos − retiros = 99. Meta = 101. Resultado 98,02 % < 100 % → 0 puntos (regla del 100 %)".
- Si está neutral: "Neutral: primer mes".

**5.6 Diversificación e innovación comercial:**
- *Diversificación de productos SERFISCAL:* Ventas recaudadas trimestrales · Meta trimestral de ventas · Cumplimiento · Puntaje. Sin dato, cada fila dice "Pendiente" y el puntaje queda neutral en 10 puntos.
- *Innovación comercial:* Oferta aprobada y habilitada · Puntos por oferta aprobada · Primera venta rentable y efectivamente recaudada · Puntos por primera venta · Puntaje · Innovación ya usada en el trimestre (editable).

**5.7 Satisfacción:**
- Filas: Satisfacción mínima esperada (de parámetros) · Satisfacción obtenida en encuesta (editable) · Porcentaje de cumplimiento · Puntos ganados.
- Sin encuesta: "Sin encuesta: 15 puntos (neutral)".

En cada tabla de indicador, muestra siempre meta, real, % cumplimiento, el % con tope del 120 %, si aplica la regla del 100 % (sí/no), peso y puntos.

### B5. "3. Comparativo y transición"

- Comisión anterior.
- Valor a pagar (política nueva, sin BTL).
- Diferencia (nueva − anterior), en rojo si es negativa.
- Resultado de la transición (el mayor, entre octubre y diciembre).
- Básico contractual.
- Básico + transición.

### B6. "5.11.5 Bonificación BTL"

Solo si el comercial es responsable de un evento BTL del mes. Filas:
- IMR;
- Ingreso del evento;
- Tope 0,8 (= 0,8 × IMR, leído de `btlComercial.topeEvento`);
- Tope anual disponible;
- Utilidad presupuestada;
- Utilidad real;
- Cumplimiento;
- Margen del evento;
- Porcentaje liquidador;
- Comisión.

Si está bloqueado, muestra el motivo en rojo ("Score 71,98 < 80") y la comisión en $ 0. Los mismos números deben verse en la pestaña BTL.

### B7. "Márgenes de sus eventos"

- Columnas: `# | Evento | Facturas | Ingreso | Costo | ICA | GMF | Costo total | Margen bruto | Banda`.
- Encima de la tabla, la nota: "Costo = columna COSTO del informe (costo directo). Costo total = costo + ICA + GMF; no es la columna COSTO TOTAL del informe."
- La banda va con distintivo de color: rojo 0 %, ámbar 90 %, verde 100 %.

### B8. "Facturas del mes"

- Dentro de un `<details>` abierto por defecto.
- Columnas: `Factura | Producto | Cuenta | Evento | Base | Estado | Fecha de pago | Elegible | Recaudo | Factor aplicado | Venta reconocida`.
- Los totales del pie deben cuadrar con B4.

### B9. Avisos del comercial

Agrupados (ver A4), al final de la ficha.

## C. Mejoras visuales (css/estilos.css + vistas.js)

1. Una sola clase de tarjeta (`.tarjeta`), con el mismo radio, sombra y espaciado en todas las pestañas. Los títulos de bloque llevan su numeral ("5.4", "5.5"…), como el Excel.
2. Distintivos de cumplimiento (`.badge`):
   - **verde** si es ≥ 100 %;
   - **rojo** si es < 100 % en indicadores con regla del 100 % (base social, SERFISCAL, satisfacción);
   - en ventas, **ámbar** entre 80 % y 100 %, y **rojo** por debajo de 80 %.

   Los umbrales se leen de `parametros`. El distintivo lleva texto además del color, para que se lea en impresión en blanco y negro.
3. Barras de progreso en cada cumplimiento, con el ancho limitado al 120 % y una marca en 100 %.
4. Dinero siempre como `$ 1.234.567` (es-CO, sin decimales). Porcentajes con un decimal (`70,5 %`). Puntos con dos decimales.
5. Encabezados de tabla fijos (`position: sticky; top: 0`) en tablas largas: facturas, BTL, metas.
6. Selector de comercial fijo arriba de la ficha, con botones ◀ ▶.
7. Diseño adaptable: en pantallas de 720 px o menos, los bloques de la ficha se apilan y las tablas van dentro de `.tabla-scroll`. Sin scroll horizontal del documento a 400 px ni a 1366 px.
8. Impresión (`@media print`):
   - se ocultan pestañas, selectores, botones y campos de carga;
   - cada ficha ocupa su propia hoja (`page-break-after: always`), en A4 vertical con márgenes de 12 mm;
   - los `<details>` se imprimen abiertos;
   - colores con `print-color-adjust: exact`;
   - pie de página "Simulación. No es un pago oficial · <comercial> · <mes>".
   - Agrega un botón "Imprimir ficha" (solo la ficha visible) y otro "Imprimir todas las fichas" (las 7 seguidas).
9. Exportar a Excel (exportar.js): agrega una hoja por comercial con los mismos bloques y etiquetas de la ficha (B1–B8). Mantén las hojas Equipo, Director y BTL.

## D. Seguridad y orden

- Todo texto de archivos (nombres, facturas, eventos, avisos) pasa por `escaparHtml`, también dentro de `title=""` y `value=""`.
- La ficha se arma con funciones pequeñas en vistas.js (`fichaEncabezado`, `fichaResumen`, `fichaAnterior`, `fichaVentas`, `fichaBaseSocial`, `fichaInnovacion`, `fichaSatisfaccion`, `fichaTransicion`, `fichaBtl`, `fichaMargenes`, `fichaFacturas`). No calcula nada: solo muestra lo que devuelve `liquidarComercial`.
- Nuevas pruebas en pruebas.html, con un comercial de prueba:
  - `margenComprobado`;
  - `factorReconocimiento`;
  - que la Σ de `detalleFacturas.ventaReconocida` sea igual a `ventas.eduAt`;
  - que la Σ de `detalleAnterior.comision` sea igual a `pagoAnterior`;
  - que `btlAnterior` no se sume a `pagoAnterior`.

## E. Prueba de aceptación con los archivos reales de octubre

Usa la facturación de octubre, el informe de producción (hoja PRODUCTOS) y parametros.xlsx. La ficha de cada comercial debe mostrar estos números, que son los mismos de su Excel individual v6.7:

| Comercial | Score | Pts ventas | Edu/AT reconocida / meta | Misión: facturas → venta / meta | Cumpl. ponderado | Base social (cierre / meta → pts) | SERF + innov. | Satisf. | Esquema anterior |
|---|---|---|---|---|---|---|---|---|---|
| Carolina | 53,51 | 18,51 | 22.177.000 / 42.000.000 (52,8 %) | 1 → 15.500.000 / 49.600.000 | 41,13 % | 87 / 88 → 0 | 10 + 10 | 15 | 2.584.400 |
| Consuelo | 61,41 | 6,41 | 10.632.000 / 25.000.000 (42,5 %) | 0 | 14,25 % | 63 / 63 → 20 | 10 + 10 | 15 | 772.050 |
| Hernando | 71,98 | 36,98 | 34.530.525 / 49.000.000 (70,5 %) | 3 → 46.500.000 / 49.600.000 | 82,18 % | 99 / 101 → 0 | 10 + 10 | 15 | 4.729.224 |
| Leidy | 41,90 | 6,90 | 11.139.200 / 23.000.000 (48,4 %) | 0 | 15,34 % | 26 / 27 → 0 | 10 + 10 | 15 | 1.643.920 |
| Lynette | 57,08 | 22,08 | 28.945.300 / 41.000.000 (70,6 %) | 1 → 15.500.000 / 49.600.000 | 49,06 % | 93 / 95 → 0 | 10 + 10 | 15 | 3.821.877 |
| Oriette | 55,34 | 20,34 | 20.472.810 / 30.000.000 (68,2 %) | 1 → 15.500.000 / 49.600.000 | 45,19 % | 69 / 70 → 0 | 10 + 10 | 15 | 3.838.759 |
| Tatiana | 58,41 | 23,41 | 30.599.090 / 39.000.000 (78,5 %) | 1 → 15.500.000 / 49.600.000 | 52,03 % | 79 / 80 → 0 | 10 + 10 | 15 | 4.317.730 |

Además:

- **Factor de reconocimiento de Edu/AT:** 100 % en los 7. Todas sus facturas recaudadas caen en eventos con margen > 20 % usando la columna COSTO.
- **Política nueva:** $ 0 en los 7, porque el score es menor a 80. "Aplica el esquema anterior" en los 7.
- **Encabezado:** debe coincidir con el Excel.

  | Comercial | Salario base | IMR |
  |---|---|---|
  | Carolina | 5.675.919 | 11.636.976 |
  | Consuelo | 5.675.919 | 8.926.655 |
  | Hernando | 5.735.449 | 14.684.181 |
  | Leidy | 3.272.418 | 5.752.036 |
  | Lynette | 5.675.919 | 11.276.380 |
  | Oriette | 5.735.450 | 9.063.625 |
  | Tatiana | 2.732.641 | 8.649.897 |

- **Director:** score 91,83, factor 0,9183, **$ 7.208.412** (política nueva), contra **$ 3.545.215** del esquema anterior (base sin BTL $ 236.347.640; BTL anterior aparte $ 2.586.654).
- **FEDESCO (evento 575):**
  - margen 23,2 % y cumplimiento 102,8 %;
  - **director $ 3.852.459**;
  - **comercial (Hernando) $ 0**, con el motivo "Score 71,98 < 80".
  - En la ficha de Hernando, "BTL · política anterior" muestra el ingreso del evento ($ 410.580.000) y su comisión BTL anterior, aparte.
- **Márgenes de Hernando (B7):** evento 566 con ingreso 42.620.000, costo 30.800.000, margen 26,5 % y banda "Mayor al 20 % · 100 %". Evento 565 con margen 77,5 %.
- **Impresión:** "Imprimir todas las fichas" da 7 hojas, una por comercial. Cada una lleva el aviso de simulación y ninguna corta una tabla a la derecha.
- **Pruebas:** pruebas.html pasa completo.

Explícame cada cambio (archivo y función) y muéstrame la ficha de Hernando antes de dar por terminada la ronda.
