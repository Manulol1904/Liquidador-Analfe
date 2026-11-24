# Correcciones para Cursor · ronda v12 (sobre liquidador-web v10)

> Pega este archivo en Cursor por fases (Fase 0, luego Fase 1). No pases a la siguiente fase sin cumplir la aceptación de la anterior.
> Reglas que siguen vigentes: todo local (sin internet, sin backend, sin CDN), módulos ES, librerías solo en `lib/`, **nada de cifras de negocio escritas en el código** (todo sale de `parametros.js` / `parametros.xlsx` o de los archivos cargados), y el aviso **"Simulación. No es un pago oficial."** en todo lo que se descargue.

---

## Estado de v10 (ya cumple, no tocar)

Con la facturación de octubre (`facturacion_manuel_t238.xlsx`) y `parametros.xlsx`:

| Comercial | Puntaje | Comisión anterior (= Excel) | Básico + transición |
|---|---|---|---|
| Carolina | 53,51 | 2.639.910 | 8.315.829 |
| Consuelo | 61,41 | 875.500 | 6.551.419 |
| Hernando | 71,98 | 4.906.224 (49.062.240 / 49.000.000 = 100,13 % → 10 %) | 10.641.673 |
| Leidy | 41,90 | 2.384.100 | 5.656.518 |
| Lynette | 57,08 | 3.461.877 | 9.137.796 |
| Oriette | 55,34 | 3.728.759 | 9.464.209 |
| Tatiana | 58,41 | 5.329.400 | 8.062.041 |

Las 7 comisiones anteriores, producciones y metas coinciden con el Excel (Hoja1/Hoja4). Puntajes sin cambios. Total equipo $23.325.770. Director: nueva $7.208.412 (91,83), anterior $3.792.727 (1,5 % × 252.848.440, 238 facturas), la transición paga la nueva. FEDESCO: director $3.852.459. 77 pruebas en verde. Sin errores de consola, sin scroll horizontal. Vista previa sin desborde (tabla 1217 px = contenedor).

---

## FASE 0 · Lo que falta de v11, regresiones y valores fijos en el código

### 0.1 Regresión: BTL de la política anterior (comercial y director)
- **Ahora:** la base BTL anterior se toma de la hoja BTL del archivo (recaudo parcial de octubre, **207.080.000**). Resultado: comercial 3,8 % = **$7.869.040** y director 0,63 % = **$1.304.604**.
- **Debe ser:** la base es el **ingreso de ejecución del evento** registrado en los parámetros BTL (`BTL_Eventos` → ingreso del evento, **410.580.000** para el evento 575). Resultado: comercial **$15.602.040** y director **$2.586.654** (0,63 % × 410.580.000).
- Cambia solo la fuente de la base (`parametros.btl.eventos[i].ingresoEjecucion`). Si falta ese dato, muestra "Pendiente: ingreso de ejecución del evento" y **no** uses el recaudo como sustituto.
- Prueba nueva en `pruebas.html`: base 410.580.000 × tasa comercial 0,038 = 15.602.040; × tasa director 0,0063 = 2.586.654.

### 0.2 Precisión de porcentajes (igual al Excel)
- Cumplimiento con 2 decimales: **100,13 %**, no 100,1 %.
- Tasas con 2 decimales: **10,00 %**, director **1,50 %**, BTL director **0,63 %** (hoy 0,6 %).
- Crea `porcentaje(valor, decimales)` en `utilidades.js`. Los decimales salen de `parametros.formato.decimalesPorcentaje` (valor inicial 2). No escribas el 2 en cada vista.

### 0.3 Valores fijos en el código (hardcode). Respuesta corta: **"nada queda hardcodeado" todavía no es cierto**
El cálculo (`calculos.js`) está limpio: cambiar una meta o un tramo cambia el resultado. Lo probamos con Hernando meta 60M → 81,77 % → 7 % → $3.434.356,8, con tramo 4 al 12 % → Leidy $2.860.920, y con director 2 % → $5.056.968,8. Los valores fijos que quedan están en la **presentación** y en la **carga**. Muévelos a parámetros:

| Archivo:línea | Valor fijo | Debe salir de |
|---|---|---|
| `vistas.js:151-155` | anclas del medidor `[80,90,100,110,120]` y `/120` | `parametros.curva` (puntos) y `parametros.topeIndicador` |
| `vistas.js:1115-1118` | marcas `[80,90,100,110]`, etiquetas `[0,80,100,120]`, `/120` | `parametros.curva` y `topeIndicador` |
| `vistas.js:732`, `vistas.js:1138` | texto aria "sobre 120" | `topeIndicador` |
| `vistas.js:591` | etiqueta "Máximo 120 %" (el valor sí usa `topeIndicador`) | `topeIndicador` |
| `vistas.js:1800` + `estilos.css:681-685` | clase `barra--marca-80` (línea fija en 80) | posición calculada con el mínimo de la curva (`style="--marca: X%"`) |
| `vistas.js:106` | etiqueta "Anticipos 27209" | `parametros.anticipos.prefijoCuenta` |
| `vistas.js:307` | orden fijo de grupos de producto | `parametros.productos` (orden del arreglo) |
| `main.js:128, 129, 131`, `carga.js:271`, `vistas.js:46` | meses por defecto "2026-10" / "2026-12" | `parametros.transicion.inicio` / `.fin` |
| `carga.js:217` | nombre de hoja `"hoja4"` | `parametros.carga.hojaResumenAnterior` |
| `carga.js:587`, `vistas.js:92` | tolerancia `< 1` peso | `parametros.carga.toleranciaPesos` |

Los valores iniciales de `parametros.js` son el almacén de parámetros. Ahí sí van cifras, y se pueden editar.

### 0.4 Impresión de la ficha de Hernando
- Hoy salen 3 páginas. Deben ser **≤ 2**. Fichas todas: 14 páginas ✓. Con detalle: 21 ✓.
- Usa `break-inside: avoid` en las tarjetas y compacta el bloque "Política anterior" a una tabla de 2 columnas en `@media print`.

### 0.5 Vista previa de la carga
- La columna Factura se corta ("FV FEC 152…"). Dale `min-width` suficiente o `white-space: nowrap` con ancho calculado.
- Los montos del resumen están alineados a la izquierda. Deben ir a la derecha, con `font-variant-numeric: tabular-nums`.

**Aceptación Fase 0**
- BTL anterior: Hernando $15.602.040, director $2.586.654.
- Porcentajes con 2 decimales en ficha, director y BTL.
- `rg -n "120|\b80\b|27209|2026-1[02]|hoja4" js/` solo encuentra `parametros.js` o comentarios.
- Ficha de Hernando impresa en ≤ 2 páginas.
- Factura completa en la vista previa.
- Las 77 pruebas siguen en verde y hay pruebas nuevas para 0.1 y 0.2.

---

## FASE 1 · Exportar el Excel de cada comercial, "igualito" al que se genera hoy (v6.7)

### 1.0 Qué se pide
- En la **Ficha**, un botón **"Descargar Excel de ‹comercial›"**.
- En **Exportar**, un botón **"Descargar todos (.zip)"**.
- Cada archivo debe ser **el mismo libro** que `Liquidacion_Oct2026_‹Nombre›_v6.7.xlsx`:
  - 15 hojas en el mismo orden, con las mismas hojas ocultas;
  - las mismas ~1.561 fórmulas vivas, los 322 nombres definidos, las celdas amarillas editables, las validaciones (listas), los formatos condicionales, los comentarios;
  - los mismos anchos, combinaciones, inmovilizados, cuadrícula oculta y configuración de impresión;
  - los mismos valores al recalcular.

### 1.1 Análisis del modelo (para que entiendas qué estás generando)
- El archivo modelo es el individual de **Hernando v6.7**, byte a byte igual al del zip `Liquidaciones_Oct2026_individuales_v6.7.zip`.
- Hojas, en orden:

| Hoja | Visibilidad | Contenido |
|---|---|---|
| Liquidación | visible | 87 fórmulas, 212 combinadas, inmovilizado A7, impresión A1:O86 horizontal |
| Explicación | visible | texto, impresión A1:F69 |
| Escenarios | visible | 74 fórmulas, 195 celdas amarillas, 32 validaciones, 3 formatos condicionales |
| Comisión anterior | visible | 13 fórmulas, 1 validación, 1 comentario |
| _Datos | oculta | 1 fila por factura, 48 columnas, 1.112 fórmulas, 176 comentarios |
| Parámetros | oculta | |
| Base social | oculta | |
| Anterior detalle | oculta | |
| Motor | oculta | |
| Márgenes eventos | visible | 1 fila por evento |
| Facturas | visible | 1 fila por factura visible, enlazada a _Datos |
| Supuestos y pendientes | visible | |
| _Listas | oculta | |
| Especiales auxiliar | visible | |
| _Margenes_especiales | oculta | |

- No tiene gráficos ni imágenes (los `drawing*.xml` están vacíos).
- **No tiene protección**: la etiqueta `<workbookProtection/>` está vacía. "Misma protección que el modelo" = sin protección. La clave es una opción adicional (ver 1.8).
- Fue guardado por LibreOffice: no hay fórmulas compartidas y cada celda lleva su propia fórmula.
- Los 7 individuales v6.7 comparten estructura. Solo cambian:
  1. los datos;
  2. el largo de las tablas (_Datos 20–55 filas, Facturas, Márgenes, Base social, Especiales);
  3. bloques opcionales en Escenarios:
     - "BTL en la política anterior", 4 filas, solo el dueño del evento BTL (Hernando);
     - "Jornada Analfista", 1 fila (Consuelo, Lynette, Oriette);
     - "Encuentros deportivos (27209528)", 1 fila (Tatiana);
  4. la posición del comercial dentro de las listas del equipo, que van en orden alfabético;
  5. los nombres definidos con el nombre corto del comercial (`C_Hernando_basico`, `R_Hernando_13`, `BS_Base_Leidy`…).

### 1.2 Librería elegida: **JSZip + edición directa del XML de una plantilla**. Probado en Node
Rellenamos la plantilla con los datos de Hernando y comparamos celda a celda contra el modelo con tres enfoques:

| Enfoque | Resultado contra el modelo |
|---|---|
| **SheetJS community** (`xlsx` 0.18.5, el que ya está en `lib/`) | ✗ Pierde 9.755 de 10.433 estilos, las 37 validaciones, los 4 formatos condicionales y la configuración de impresión. No sirve para escribir este libro. |
| **ExcelJS 4.4** | ✗ Muestra la cuadrícula en las 15 hojas (pierde `showGridLines=false`). Parte las 37 validaciones en 71. Cambia 1.009 formatos numéricos y reescribe 22 nombres. Además pesa unos 1 MB. |
| **JSZip 3.10 + XML** (motor propio, ~600 líneas) | ✓ **Idéntico**: 15 hojas y visibilidad, 322 nombres, 5.206 celdas, 1.561 fórmulas, 10.433 estilos, 37 validaciones, 4 formatos condicionales, 177 comentarios, anchos, impresión e inmovilizados. Después de recalcular con LibreOffice, **1.561 de 1.561 resultados iguales** al modelo. |

- La misma plantilla sirvió también para **Leidy**: hay que quitar el bloque BTL, ajustar las tablas, reordenar las listas y aplicar sus datos. El resultado tiene los mismos nombres, las mismas fórmulas y **3.520 de 3.520 valores iguales** al recalcular.
- Quedan diferencias cosméticas que **ya existen entre los propios archivos v6.7**:
  - la fila "Satisfacción mínima esperada" está estilizada distinto en el archivo de Hernando;
  - la alineación de 2 columnas de `_Datos` (hoja oculta);
  - un formato en `Motor` (oculta);
  - el rango del autofiltro de `Base social` (oculta).
- La generación tarda unos 0,3 s por comercial.

### 1.3 Archivos que entrego (cópialos al proyecto)
Desde `entregables/excel_individual/`:

| Origen | Destino en el proyecto | Qué es |
|---|---|---|
| `lib/jszip.min.js` | `lib/jszip.min.js` | JSZip 3.10 (MIT). Agrega `<script src="lib/jszip.min.js"></script>` en `index.html` **antes** de `js/main.js`. |
| `motor_excel_individual.js` | `js/excel/motor_excel_individual.js` | Motor probado. **No lo reescribas**: úsalo. Funciones: `abrirPlantilla`, `escribirCelda`, `escribirFormula`, `leerCelda`, `reemplazarFichas`, `insertarFilas`, `eliminarFilas`, `redimensionarTabla`, `copiarFormula`, `ajustarFormula`, `definirNombre`, `eliminarNombre`, `leerNombres`, `leerEstilo`, `ponerEstilo`, `estiloConRelleno`, `proteger`, `hashClave`, `guardar`, `generarLibroIndividual`. |
| `plantilla_liquidacion_individual.xlsx` | `plantillas/plantilla_liquidacion_individual.xlsx` | La plantilla, **sin datos reales**: 2.828 celdas de datos vacías, resultados guardados borrados, nombres de personas cambiados por fichas `COMSEL` (el comercial del archivo), `COMA…COMF` (los otros 6 en orden alfabético) y `COMDIR` (directora). |
| `mapeo_celdas.json` | `plantillas/mapeo_celdas.json` | Lista de las 2.828 celdas que la app escribe: hoja, celda, tipo y etiqueta. Sin valores. |
| `textos_con_marcadores.json` | referencia | Los 111 textos con cifras o nombres, con marcadores `{persona}`, `{valor_pesos}`, `{porcentaje}`, `{numero}`, `{cliente}`. |
| `ejemplo_ensamblado.mjs` | referencia | Ensamblado completo para otro comercial (el que usamos para Leidy). Sigue ese orden. |
| `verificar_excel_individual.mjs` | `herramientas/verificar_excel_individual.mjs` | Verificador en Node (ver 1.10). |

La plantilla se carga con `fetch("plantillas/plantilla_liquidacion_individual.xlsx")`, porque la app se abre con Live Server. Si `fetch` falla, muestra "No se encontró la plantilla del Excel individual" y ofrece un `<input type="file">` para elegirla. Nunca la pidas a internet.

### 1.4 Módulo nuevo `js/exportarIndividual.js`
```js
import * as M from "./excel/motor_excel_individual.js";
// datos = construirDatosExcel(resultado, liquidacion, parametros, filas, eventos, mes)
export async function generarExcelComercial(nombre, { clave } = {}) { /* … devuelve Uint8Array … */ }
export async function descargarExcelComercial(nombre, opciones) { /* Blob + <a download> */ }
export async function descargarTodosZip(opciones) { /* un JSZip con los 7 archivos */ }
```
- `construirDatosExcel` arma **solo datos**: valores, textos y fórmulas-dato. La estructura la pone la plantilla.
- Todo sale de lo que la app ya calculó (`liquidarComercial`, `liquidacion.director`, `liquidacion.btl`), de `obtenerParametros()` y de las filas cargadas. Ninguna cifra va escrita en el módulo.

### 1.5 Orden de ensamblado (importa, porque mover filas mueve referencias)
Usa coordenadas **de la plantilla** (las de `mapeo_celdas.json`) hasta el paso 4:

1. **Abrir:** `lib = await M.abrirPlantilla(bytes, window.JSZip)`.
2. **Posición en las listas del equipo.**
   - `equipo` = nombres cortos de los comerciales que liquidan, en orden alfabético (de parámetros).
   - `p` = posición del comercial en `equipo` (1…7). En la plantilla el comercial ocupa la posición 3, y los demás ocupan `COMA=1, COMB=2, COMC=4, COMD=5, COME=6, COMF=7`.
   - Para cada familia de nombres definidos con ficha que apunte a `Escenarios!$X$fila` dentro de una lista (por ejemplo `BS_Base_*`, `INN_oferta_*`, `SAT_obtenida_*`, `Cartones_*`), reubica cada nombre en `inicioLista + posiciónNueva − 1`. `inicioLista` es la fila de `COMA`. Los otros 6 van en orden alfabético y saltan la posición `p`.
   - Mueve también las **celdas propias** de la fila del comercial (fórmulas como `=INN_oferta_COMSEL`, `=SAT_obtenida_COMSEL`, `=Meta_Mision_individual`) y sus **estilos amarillos** a la fila `inicioLista + p − 1`. La fila vieja toma el patrón de las demás filas.
   - Está implementado en `ejemplo_ensamblado.mjs`, pasos (b) y (c). Cópialo tal cual.
3. **Fichas:** `M.reemplazarFichas(lib, { COMSEL: corto, COMA: otros[0], …, COMF: otros[5], COMDIR: cortoDirector })`. Los nombres cortos salen de `parametros.comerciales[i].nombreCorto` (agrega el campo si no existe).
4. **Celdas fijas** (Liquidación, Escenarios, Comisión anterior, Anterior detalle, Parámetros, Explicación, Supuestos, `_Margenes_especiales`): escribe cada una con `M.escribirCelda(lib, hoja, ref, valor)`, según 1.6.
5. **Bloques opcionales** de Escenarios, en coordenadas de la plantilla:
   - Si el comercial **no** es el dueño de un evento BTL:
     - restaura el amarillo normal (`FFFFF2CC`) en `B84, B85, B133, B134, B135`;
     - quita el gris de `Comisión anterior!T5` (`M.estiloConRelleno(lib, s, null)`);
     - `M.eliminarFilas(lib, "Escenarios", 96, 4)`;
     - borra los nombres que quedaron en `#REF!` (`Base_BTL_‹c›`, `BTL_‹c›_anterior`).
   - Jornada Analfista y Encuentros deportivos: ver 1.9.
6. **Tablas al largo del comercial** con `M.redimensionarTabla(lib, hoja, primera, ultima, n)`, en coordenadas de plantilla:
   - `_Datos` 2–45: n = facturas del comercial (incluye BTL y anticipos);
   - `Facturas` 5–41: n = facturas visibles;
   - `Márgenes eventos` 5–16: n = eventos;
   - `Base social` 26–126: n = clientes de su base social;
   - `Especiales auxiliar` 3–5: n = movimientos especiales.

   El motor amplía o recorta los rangos con nombre (`Datos_nombre`, `Datos_venta`…), las validaciones, los formatos condicionales, los comentarios, el autofiltro y las áreas de impresión, y mueve las notas al pie.
7. **Filas de las tablas:** fila `primera + i` con los valores de la factura, evento o cliente `i` (columnas en 1.6).
8. **Fórmulas-dato** (enlaces que dependen de los datos) con `M.escribirFormula`:
   - `_Datos!M, V, AF, AG` de cada factura = `'Márgenes eventos'!I{5 + índice del evento de esa factura}`. Si la factura no tiene evento con margen, la celda queda **vacía** (`escribirCelda(…, null, {sobreFormula:true})`).
   - `Facturas!I…L` ya vienen enlazadas por fila (`=_Datos!H{fila}`). Revisa que la fila i de Facturas apunte a la fila de su factura en `_Datos`.
9. **Clave opcional:** `await M.proteger(lib, clave)` (ver 1.8).
10. **Guardar:** `await M.guardar(lib)`. Deja `fullCalcOnLoad="1"` para que Excel recalcule todo al abrir.

### 1.6 Mapeo celda → dato (detalle completo en `mapeo_celdas.json`)

| Bloque (coordenadas de plantilla) | Dato de la app |
|---|---|
| Liquidación C3 / C4 / C5 / F6 | nombre completo / documento / cargo, nivel y regional / trimestre (`parametros.comerciales[i]`: agrega `documento`, `cargo`) |
| Liquidación C29, I6, I47–I49 | valor por factura de Misión anterior; valor fijo del encabezado; base social 30-sep, retiros, ingresos del comercial |
| Escenarios B10 | año del mes liquidado |
| Escenarios B15–B19, B23–B33 | pesos 45/20/10/10/15 y modos "fijo"; tope de ventas (`parametros.pesos`, `parametros.topes`) |
| Escenarios B36–B48 | score mínimo, tope de pago, anclas P1..P5 / F1..F5 de la curva (`parametros.curva`) |
| Escenarios B57–B62, B118–B119, B139, B160–B161 | metas de Misión, Congreso, cultural, base Misión por factura, cartones |
| Escenarios B66–B77 | umbrales y factores de margen, GMF, ICA (`parametros.margen`, `parametros.costos`) |
| Escenarios B90–B91 | inicio y fin de la transición (fechas) |
| Escenarios B95, B102:D106, B143 | tasa bajo el mínimo, **tramos anteriores** (`parametros.anterior.tramos`), tasa BTL anterior |
| Escenarios B98–B99 (bloque BTL) | tasa BTL anterior y **base = ingreso de ejecución del evento** |
| Escenarios B133–B135 | ingreso y costo presupuestados del evento BTL, BTL acumulado del año |
| Escenarios fila 111 (B, C, D, J, K, L, P) | meta META5, básico, oportunidad y banderas del comercial |
| Escenarios A/B 122–128 | lista del equipo: nombre y META 5 de cada uno |
| Escenarios 147–153, 166–172, 177–185, 192–198 | listas del equipo: SERFISCAL/innovación, base social (base, retiros, ingresos), metas Edu/Asist oct-nov-dic y cartones, satisfacción |
| Comisión anterior fila 5 (A, B, C, D, F, G, I, J) | nombre, meta anterior, producción anterior y tasa de los tres liquidadores, ajuste Jornada |
| `_Datos` columnas A–G, K, Q, R, AD, AE, AH–AO por factura | comercial, factura, producto, cuenta/servicio, base, estado, fecha de pago, clase, fecha de factura, fuente, evento, estado del margen, fuente del margen, tercero, descripción, cuenta, nombre de la cuenta, evento n.º, mes del evento, regional |
| `Facturas` columnas A–H por factura visible | comercial, factura, producto, "cuenta nombre", evento, base, estado, fecha de pago |
| `Márgenes eventos` A–E por evento | n.º, nombre, número de facturas, ingreso, costo (F–J son fórmulas) |
| `Base social` 13–24 y 26+ (A–M) | referencia histórica y clientes de la base social del comercial |
| `Especiales auxiliar` A–L | movimientos especiales del auxiliar |
| `_Margenes_especiales` filas 5–6 | eventos de Misión y BTL: n.º, nombre, facturas, ingreso, costo |
| 111 textos (`textos_con_marcadores.json`) | arma cada texto con los parámetros del mes (por ejemplo `Liquidación!A1` = `ANALFE – Liquidación de Compensación Variable – ${mesLargo} ${año}`). Crea `js/excel/textosExcel.js` con una función por texto. |

- Fechas: pásalas como `{fecha: "AAAA-MM-DD"}` o como `Date`. El motor las convierte a número de serie y respeta el formato de la celda.
- Porcentajes: como fracción (0,038).
- Pesos: número sin redondear, igual que el modelo.

### 1.7 Nombre de archivo y zip
- Individual: `Liquidacion_${MesCorto}${año}_${nombreCorto}.xlsx`, por ejemplo `Liquidacion_Oct2026_Hernando.xlsx`. Si quieres el sufijo de versión, sale de `parametros.excel.version` (valor inicial "v6.7"); no lo escribas en el código.
- Zip: `Liquidaciones_${MesCorto}${año}_individuales.zip`, con los archivos de todos los que liquidan.
- El aviso **"Simulación. No es un pago oficial."** ya está fijo en la plantilla (`Liquidación!A2` y la nota al pie de Facturas y Márgenes). `Explicación!A69` lo lleva junto con la fecha, así que la app lo escribe con `textosExcel.js`. Muéstralo también en el diálogo de descarga.

### 1.8 Clave del simulador (opcional, **nunca guardada**)
- El modelo no tiene protección. Por defecto exporta **sin protección**, que es lo igual al modelo.
- En el diálogo de exportación agrega una casilla "Proteger con la clave del simulador" y un campo `<input type="password" autocomplete="off">`.
- La clave se lee del campo, se pasa a `M.proteger(lib, clave)` y se descarta. **No** la guardes en `localStorage`, ni en parámetros, ni en el JSON exportado, ni en el código, ni en consola o logs. Limpia el campo después de descargar.
- Qué hace `proteger`:
  - bloquea la estructura del libro, para que no se puedan mostrar las hojas ocultas ni borrar hojas;
  - protege las hojas con el hash SHA-512 de Office (sal aleatoria, 100.000 giros, WebCrypto);
  - **deja editables las celdas amarillas**, para que Escenarios siga funcionando.
- Aclara en la interfaz: "Protege la estructura y las fórmulas; no cifra el archivo". El cifrado al abrir no lo soporta ninguna librería local de navegador.
- Probado: LibreOffice abre el archivo con las 15 hojas protegidas y las celdas amarillas libres. Tarda unos 1,8 s.
- **Acepta en Excel:** intenta mostrar una hoja oculta → pide la clave; escribe la clave del simulador → se desprotege.

### 1.9 Formas que faltan en la plantilla (tarea de esta fase)
La plantilla tiene la forma de Hernando (con bloque BTL) y ya genera bien la forma "sin bloques" (Carolina y Leidy). Faltan dos filas opcionales:

1. **Jornada Analfista** (Consuelo, Lynette, Oriette). Va en `Escenarios` justo después de "Tasa bajo el 70%".
   - Contenido: A = "Jornada Analfista (FEA 4342 / 4350)", B = "Según escenario" con lista `"Según escenario,A comerciales,A Dirección"`, C = descripción, D = fuente.
   - Requiere además:
     - celda auxiliar `Escenarios!Z2` = `IF(OR(B96="Según escenario",B96=""),IF(Escenario_base="Hoja 4 (Jornada a Dirección)","A Dirección","A comerciales"),B96)`;
     - el nombre `Jornada_asignacion` → `Escenarios!$Z$2`;
     - en `_Datos` y `Facturas`, la columna A de las facturas de Jornada lleva la fórmula-dato `IF(Jornada_asignacion="A Dirección","CANAL NACIONAL (Hoja4)","‹nombre›")`.
2. **Encuentros deportivos (27209528)** (Tatiana). Misma posición.
   - Contenido: B = "BTL independiente", con lista `"BTL independiente,Otro producto"`.
   - Nombre `Deportes_tratamiento` → `Escenarios!$B$96`.

Agrégalas a la plantilla como filas presentes y bórralas con `eliminarFilas` cuando no apliquen, igual que el bloque BTL. Toma estilo, alto y validación de los archivos v6.7 de Consuelo y Tatiana. Para agregar la validación al XML, usa el mismo patrón que `proteger`/`estiloConRelleno` (o pídeme el helper).

### 1.10 Pruebas y aceptación (verificable)
1. En `pruebas.html` agrega casos del motor:
   - `copiarFormula("E2*I2+$B$3", 3) === "E5*I5+$B$3"`;
   - `ajustarFormula` al borrar filas (rangos que se achican y `#REF!`);
   - `fechaASerie("2026-10-16") === 46311`;
   - generar un libro y releerlo con `leerCelda`.
2. **Comparación celda a celda** contra los 7 individuales v6.7 (están en `Liquidaciones_Oct2026_individuales_v6.7.zip`). Por cada comercial, descarga su Excel desde la app y corre:
   ```
   node herramientas/verificar_excel_individual.mjs Liquidacion_Oct2026_Hernando_v6.7.xlsx Liquidacion_Oct2026_Hernando.xlsx --lib lib
   ```
   El verificador compara:
   - hojas, orden y visibilidad;
   - nombres definidos;
   - todas las fórmulas;
   - todos los valores, recalculando con LibreOffice si está instalado (si no, abre el archivo en Excel, guárdalo y vuelve a correrlo);
   - estilos por celda, validaciones, formatos condicionales, comentarios, combinadas, anchos, inmovilizado, cuadrícula e impresión;
   - protección.

   Debe decir **"✓ IGUALITO"** para los 7. Diferencias aceptadas, que vienen de los v6.7 y no de la app:
   - el rango del autofiltro oculto de `Base social`;
   - la alineación de `_Datos!AH/AM`;
   - el formato de `Motor!R2`;
   - el estilo de la fila "Satisfacción mínima esperada" entre archivos.
3. Con la clave: el verificador debe decir "Protección: generado sí". La clave no debe aparecer en el repositorio: `rg -n "<la clave>"` devuelve 0 resultados.
4. Con la app vacía o sin facturación cargada, los botones quedan deshabilitados con el texto "Carga la facturación para exportar".
5. Sin errores de consola y sin peticiones de red (pestaña Red vacía al exportar).

---

### Notas para Manuel
- Las cifras de ejemplo (410.580.000, metas, tasas) vienen del Excel v6.7 de octubre y se usan **solo para comparar**. En la app salen de los parámetros y de los archivos que cargues.
- La plantilla y los JSON no tienen nombres, documentos, facturas ni cifras reales.
