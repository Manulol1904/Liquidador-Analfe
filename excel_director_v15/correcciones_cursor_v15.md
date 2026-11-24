# Correcciones v15 · Excel del Director con la misma forma que el de un comercial

Base: v14 (`excel_director_v14.zip`). Copia de trabajo: `src_v15/`. No se tocaron los originales ni el libro de los comerciales.

## 1. Resultado

- **La hoja Liquidación del director ahora es igual, en forma, a la de un comercial.** Coinciden:
  - el encabezado;
  - 5.8 Resultado con la curva de pago a la derecha;
  - 1. Política anterior;
  - 2. Política nueva (5.4, 5.5, 5.6, 5.7 y 5.11.5);
  - 3. Comparativo y transición.

  Todo está en las mismas filas y columnas, con los mismos anchos, colores y formatos. La jefa puede poner los dos libros lado a lado (ver `director_rediseno/4_lado_a_lado_*.png`, solo local).
- **El «real» del director es el agregado del equipo.** El aporte de cada comercial va en la hoja nueva **«Detalle del equipo»**: 8 filas (7 comerciales y el canal nacional) más el total.
- **Lo que cargaba la hoja principal salió de ahí.**
  - Las 240 líneas de facturación pasan a la hoja «Facturas».
  - Las explicaciones largas se resumen en 6 secciones en «Explicación».
  - Los pendientes quedan en 8 puntos en «Supuestos y pendientes».
  - Los parámetros van en la hoja oculta «Parámetros», como en el libro del comercial.
- **Verificado con los datos reales de octubre**, recalculado con LibreOffice, con **0 errores**:

| Concepto | Celda | Valor | App |
|---|---|---|---|
| Score | G13 | 91,83 | 91,8288 ✓ |
| Factor de la curva | G14 | 91,83 % | ✓ |
| Política nueva | G15 / N20 | $7.208.412,20 | ✓ |
| Esquema anterior | C24 / N19 | 1,5 % × $252.848.440 = $3.792.726,60 | ✓ |
| BTL anterior | C27 / N27 | $2.586.654 | ✓ |
| Transición (rige la nueva) | N22 | $7.208.412,20 | ✓ |
| Control: base del detalle − base de Facturas | Detalle O15 | 0 | ✓ |

- Diciembre (8 comerciales más el canal) también sale con 0 errores. Su score, 51,59, es igual al de la app.
- Protección con la clave del simulador: las 6 hojas quedan protegidas, tanto en el archivo suelto como dentro de «Descargar todos (.zip)». Se probó con una clave ficticia. La clave no se guarda.
- La plantilla no lleva datos reales: no tiene nombres, documentos, facturas ni cifras del mes. Todo lo pone la app al exportar.

## 2. Por qué era confuso (diagnóstico)

| | Comercial (v6.7) | Director v14 | Director v15 |
|---|---|---|---|
| Hoja principal | A1:O85 | A1:Q147 (columnas P/Q ocultas) | A1:O95 |
| Celdas con contenido | 219 | 618 | 236 |
| Párrafos largos (más de 120 caracteres) en la hoja principal | 0 | 26 | 0 |
| Celdas combinadas | 212 | 358 | 233 (las 212 del comercial y las del bloque BTL) |
| Dónde está el resultado de la transición | Fila 22, arriba a la derecha | Fila 89 | Fila 22, arriba a la derecha |
| Facturación | Hoja aparte (Facturas) | Hoja de 240 filas y una tabla de 10 grupos en la principal | Solo en la hoja «Facturas» |

Lo que sobraba en la hoja principal del v14:
1. La comparación de los tres métodos del score (totales, promedio simple y ponderado).
2. La tabla de los 7 comerciales con 15 columnas.
3. El «cálculo por totales» repetido.
4. El bloque del canal nacional.
5. Una tabla de 10 grupos de facturación más 2 filas de BTL.
6. La escala del BTL en texto.
7. La actividad cultural de diciembre.
8. Un bloque de 8 parámetros editables.
9. 26 párrafos explicativos entre las cifras.

Además, el encabezado y los bloques estaban en posiciones distintas a las del comercial, así que no se podían comparar.

## 3. Estructura nueva, hoja por hoja

1. **Liquidación**: misma plantilla visual que el comercial.
   - **Encabezado (filas 3–6):** nombre, documento, cargo y nivel, salario base, IMR, ingreso máximo (120 %) y Q2.
   - **5.8 Resultado (filas 7–15):** los 4 indicadores con su peso, el máximo al 120 % y los puntos. Debajo, el total, el % de la curva y la comisión de la política nueva. La curva va en L9:O14.
   - **1. Política anterior (A18–C31):**
     - comisión anterior;
     - producción (= facturación del mes) y tasa del 1,5 %;
     - BTL anterior al 0,63 % sobre el ingreso de ejecución;
     - Misión: «No aplica».
   - **2. Política nueva (F18–J95):** el «real» es el agregado del equipo.
     - 5.4 ventas: Educación y asistencia técnica, Misión, Congreso y Cultural, con el mismo orden y las mismas filas que el comercial (peso del producto = meta del producto ÷ suma de metas).
     - 5.5 base social del equipo frente a la meta del equipo (amarilla).
     - 5.6 diversificación e innovación: promedio del equipo.
     - 5.7 satisfacción: promedio del equipo.
     - 5.11.5 BTL del director (filas 75–95): escala sobre el IMR, topes de 0,25 y 1 × IMR, salvaguarda conjunta y las 4 condiciones en amarillo. Mientras no se confirmen, queda «Pendiente».
   - **3. Comparativo y transición (L18–N27):** anterior, nueva, diferencia, resultado de la transición, básico + transición, ingreso BTL, BTL nueva y BTL anterior.
2. **Explicación**: 6 secciones cortas.
   - qué es el archivo;
   - de dónde sale el real del director (núm. 5.9);
   - resultado del mes;
   - política anterior;
   - BTL;
   - celdas amarillas.
3. **Detalle del equipo**: una fila por comercial y una por el canal nacional. Si hubiera facturas de otros asesores, aparece una fila «Otros».
   - Columnas: meta, venta recaudada, venta reconocida y cumplimiento de Edu/AT; facturas y venta de Misión; metas y ventas de Congreso y Cultural; base social al inicio y al cierre; score individual; base facturada (`SUMIF` sobre Facturas); comisión del director al 1,5 %.
   - Abajo, el total y un control contra la hoja Facturas que debe dar 0.
   - Sus columnas tienen nombres (`Eq_*`) que alimentan la Liquidación.
4. **Facturas**: las líneas del mes con estas columnas: comercial, factura, producto, cliente, servicio, base, estado, fecha, % dirección, comisión del director (fórmula) y fila del archivo. Tiene filtro, total y los nombres `Fac_Asesor`, `Fac_Base`, `Fac_Pct` y `Fac_Com`.
5. **Supuestos y pendientes**: 8 puntos numerados, con el mismo formato que el comercial.
6. **Parámetros** (oculta): 26 parámetros con nombre (pesos, topes, tasas, umbrales y porcentajes BTL, regla del 100 %, número de comerciales) y las anclas de la curva (`Curva_puntos`, `Curva_factor`).
   - **La curva ya no está escrita dentro de las fórmulas**: G14 interpola sobre esas anclas, que vienen de los parámetros de la app.

## 4. Qué debe hacer Cursor (archivo:línea en `src_v15`)

1. **Reemplazar los 3 archivos de `plantillas/`**:
   - `plantilla_liquidacion_director.xlsx`
   - `mapeo_celdas_director.json`
   - `textos_director.json`

   Se regeneran con `python3 herramientas/construir_plantilla_director.py plantillas/plantilla_liquidacion_individual.xlsx plantillas/`. El constructor toma estilos, anchos y combinaciones de la plantilla anónima de comerciales; si cambia el libro del comercial, se vuelve a correr y el director lo sigue.
2. **`js/exportarDirector.js`**:
   - En `construirDatosDirector` (l. 23), `equipo` suma los campos del detalle (l. 65–71) y llama a `extrasV15` (l. 127). Esa función arma el encabezado, las filas del detalle con la clave de facturación, los puntos del equipo, la tabla y las anclas de la curva, los parámetros BTL y `nComerciales`.
   - `valoresDirector` (l. 169) suma los marcadores `metodo`, `regla100` y `faltantes`.
   - `libroDirector` (l. 251), nuevo, hace esto en orden:
     1. escribe los textos;
     2. escribe las entradas del mapeo (rutas con punto);
     3. redefine `Curva_puntos` y `Curva_factor` según las anclas (l. 276);
     4. ajusta las tablas «Facturas» y «Detalle del equipo» con sus fórmulas por fila (l. 280);
     5. escribe la fila «Otros», si hace falta (l. 293);
     6. protege con la clave y guarda.
   - `generarExcelDirector` (l. 316), `descargarExcelDirector` (l. 322) y `nombreArchivoDirector` no cambian, así que el botón y el .zip siguen igual.
3. **`js/encabezados.js`**: se lee `nivel` del bloque `director` (l. 70 y l. 123) para C5 «Cargo, nivel y regional».
4. **Nuevo `herramientas/verificar_director.py`**: recalcula, cuenta errores, compara la forma con un libro de comercial y revisa las cifras.
5. **No cambian** `vistas.js`, `exportarIndividual.js`, `carga.js`, el motor ni la plantilla de comerciales.

## 5. Mapeo (resumen; el detalle está en `mapeo_celdas_director.json`)

- **Liquidación (entradas):**
  - C3 nombre, C4 documento, C5 cargo y nivel, I3 básico, F6/I6 referencia Q2;
  - I32 meta de Misión del equipo (amarilla), I51 meta de base social del equipo (amarilla);
  - I58/I63/I73 puntos del equipo en SERFISCAL, innovación y satisfacción, I71 texto de la encuesta;
  - I77, I80 e I81: ingreso, utilidad presupuestada y utilidad real del evento;
  - I86–I92 (amarillas): BTL ya pagado, si cuenta para el tope, las 4 condiciones y la bonificación del comercial;
  - L9:N14: textos de la curva.
- **Parámetros (entradas):** B3:B28 (oportunidad, pesos, topes, tasas, BTL, `N_comerciales`) y A30:B37 (anclas de la curva).
- **Tabla `equipo`** (Detalle, filas 5–12, crece o se achica):
  - A–N con datos y Q con la clave oculta;
  - fórmulas: E `IF(N(B{r})=0,"",D{r}/B{r})`, O `SUMIF(Fac_Asesor,$Q{r},Fac_Base)` y P `O{r}*Tasa_Dir_Anterior`.
- **Tabla `facturas`** (Facturas, filas 5–6, crece): A–I y K con datos; J con la fórmula `F{r}*I{r}`.

## 6. Criterios de aceptación

- [x] La hoja Liquidación tiene los mismos anchos y combinaciones que la de un comercial (212/212) y los rótulos clave en la misma celda (23/23).
- [x] Con los datos de octubre: score 91,83; nueva $7.208.412; anterior $3.792.727; BTL anterior $2.586.654; transición $7.208.412.
- [x] 0 errores después de recalcular, en octubre y en diciembre.
- [x] El total de «Detalle del equipo» es igual a la base de «Facturas» (diferencia 0).
- [x] Aparece el aviso «Simulación. No es un pago oficial» en A2 y en todas las hojas.
- [x] Las celdas amarillas son solo las editables.
- [x] La plantilla no lleva datos personales.
- [x] La clave del simulador se pide al exportar, protege las 6 hojas y nunca se guarda.
- [x] No hay cifras escritas a mano: pesos, topes, tasas, curva y escala BTL salen de los parámetros de la app.
- Comando de prueba: `python3 herramientas/verificar_director.py <Director.xlsx> <Comercial.xlsx> score=91.83 nueva=7208412 anterior=3792727 btl=2586654 transicion=7208412` → `✓ OK`.

## 7. Decisiones abiertas para la jefa

1. **Comparar los 3 métodos del score.** Se quitó de la hoja; solo queda el método vigente (totales del equipo). ¿Se quiere ver la comparación en un anexo?
2. **Meta de base social del equipo.** ¿622 (parámetro) o 524 (suma de metas individuales)? Hoy es amarilla con 622.
3. **Regla del 100 %.** Hoy está en NO, en Parámetros.
4. **Parámetros editables.** Quedaron ocultos, como en el comercial. ¿Se prefieren visibles en el libro del director?
5. **Datos que la app aún no trae:**
   - meta del canal nacional;
   - ingreso presupuestado del evento;
   - detalle del BTL ya pagado (hoy en $0);
   - cartones culturales.

   La actividad cultural de diciembre y el comparativo con el ingreso histórico ya no se muestran. ¿Hacen falta?
6. **Documento de identidad en el encabezado.** Se muestra, como en el comercial (sale del JSON local).
