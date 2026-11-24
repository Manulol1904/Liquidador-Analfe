# Prompt para Cursor · Simulador web de compensación variable ANALFE (PCV-COM-001)

> Pega este archivo completo en Cursor. Trabaja por fases y no saltes ninguna. Al final de cada fase corre las pruebas y dime qué quedó listo.
> **Simulación. No es un pago oficial.**

---

## 0. Qué vas a construir

Hoy el simulador de compensación variable es un Excel. Vas a pasarlo a una **web local**, con la misma estructura, el mismo estilo y las mismas convenciones del **liquidador web** que ya existe en `liquidador-web/`.

- La web replica **todo** lo que hace el Excel: entradas, cálculo, explicaciones, la tabla «¿Cuánto gano según mi cumplimiento?», el gráfico y la bonificación por evento (BTL).
- La web no tiene servidor, no se publica, no usa internet ni CDN. El entregable es **un solo archivo HTML** que se abre con doble clic en Chrome o Edge.
- El HTML **no trae datos de nadie**. Cada persona carga **su propio archivo de perfil** (JSON) y con eso simula. Sin ese archivo, la web funciona con **datos de ejemplo inventados**.
- La carpeta `referencia/` trae el Excel del simulador con datos inventados. Con él armas un **comparador** y **pruebas automáticas** que demuestren que la web calcula igual que el Excel.

Proyecto nuevo, al lado del liquidador: `C:\Users\aprendizpro\Desktop\liquidador_analfe\simulador-web\` (el liquidador está en `...\liquidador_analfe\liquidador-web\`). **No modifiques el liquidador**: solo léelo y copia lo que sirva.

---

## 1. Reglas que no se negocian

1. **Nada sale del computador.** No hay `fetch` a internet, ni CDN, ni fuentes web, ni analítica. Todas las librerías van en `lib/` y se incrustan al empaquetar. Pon en `index.html` una Content-Security-Policy que bloquee la red: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src data:">`. Revisa que funcione con `file://`.
2. **Ningún dato personal dentro del código, las pruebas, los ejemplos ni el HTML.** Los nombres, documentos, salarios, oportunidades, metas individuales y bases sociales reales solo viven en archivos de perfil que Manuel o el equipo financiero generan y entregan uno a uno.
   - Los ejemplos usan nombres inventados («Comercial Ejemplo», «Comercial A», «Director Ejemplo») y cifras inventadas.
   - No escribas contraseñas en ningún archivo. Si alguna vez ves la clave del simulador o del Excel, no la copies.
3. **Archivos privados fuera del alcance de la IA.** Crea `.cursorignore` y `.gitignore` con `privado/`, `salida_perfiles/`, `datos/`, `*.analfe`, `*.perfil.json` y `dist/`. Tú (Cursor) **no abres** archivos de esas carpetas. Si para probar necesitas un perfil, usa los de `datos_ejemplo/`.
4. **Sin valores quemados.** Todo número de la política (pesos, curva, topes, tasas, umbrales, valores por factura y por cartón, incrementos) vive en `js/parametros.js` como valor de fábrica y se puede editar en la pestaña Parámetros. En la interfaz, **amarillo = editable** y **gris = calculado**, igual que en el Excel y en el liquidador.
5. **Lenguaje simple y resultados primero.** Arriba de todo va el puntaje, el porcentaje de la curva, la comisión estimada y lo que falta para llegar a 80. Las fórmulas solo aparecen al pulsar **«Ver fórmula»** (un `<details class="ver-formula">` cerrado; mira `formulaPlegable` en `liquidador-web/js/vistas.js`, alrededor de la línea 361). El aviso **«Simulación. No es un pago oficial.»** aparece en la cabecera, en cada impresión y en cada archivo que se descargue.
6. **No inventes reglas de negocio.** Lo que está pendiente (sección 11) queda como parámetro con un aviso visible, con el valor que hoy trae el Excel.

---

## 2. Qué reutilizar del liquidador web (`liquidador-web/`)

Lee estos archivos antes de escribir código y conserva sus convenciones:

| Qué | Dónde está en el liquidador | Cómo usarlo |
|---|---|---|
| Sistema de diseño | `css/tokens.css` (azul institucional `--color-primario-*`, neutros, `--color-editable-fondo: #FFF8D6`, `--color-editable-borde: #E8C547`, espaciado 4/8, `--radio: 12px`, `--sombra-tarjeta`) | Cópialo tal cual a `css/tokens.css`. No inventes colores nuevos: si falta uno, agrégalo como token. |
| Componentes | `css/estilos.css`: `.tarjeta`, `.kpis`, `.tarjeta-pago`, `.score-curva`, `.score-barra`, `.mini-indicador`, `.campo-param`, `.grupo-param__ayuda`, `.tabla`, `.tabla-scroll`, `.ver-formula`, `.estado-vacio`, `.zona-archivo`, `.badge`, `.aviso`, `.rentabilidad-edu` | Copia solo las reglas que uses a `css/estilos.css`, más un `css/simulador.css` con lo nuevo. |
| Riel de pasos | `index.html` (`<nav class="riel">` con `.riel__paso`, `.riel__circulo`, `.riel__corto`, `.riel__largo`, botón `#plegar-riel`, estado en `localStorage["analfe-riel"]`) y `mostrarPanel()` en `js/main.js` | Mismo patrón de navegación, con los pasos del simulador (sección 5). |
| Impresión carta | `@page` y los `@media print` de `css/estilos.css` (la ficha cabe en 2 páginas carta sin scroll interno; pie «Simulación. No es un pago oficial · Página X de Y») | Botón «Imprimir mi simulación». En papel se abren los «Ver fórmula». |
| Parámetros | `js/parametros.js`: `PARAMETROS_INICIALES`, `obtenerParametros()`, `restaurarValoresIniciales()`, `exportarJson()`, `importarJson()`, `iniciarFormularioParametros()` con `campo(ruta, valor, {titulo, unidad, ayuda})` | Misma forma. |
| Cálculos puros | `js/calculos.js`: `factorCurva`, `factorMargen`, `calcularMargen`, `puntosIndicador`, `score`, `pagoVariable`, `porcentajeBtl`, `liquidarBtl`, `metodosDirector` | Inspírate en ellos, pero el motor del simulador debe calzar con las fórmulas del Excel (sección 4). Funciones puras, sin DOM, importables desde Node. |
| Utilidades | `js/utilidades.js`: `escaparHtml`, `numeroPesos`, `numeroFlexible`, `porcentaje`, `formatoMiles`, `avisoBreve`, `plural` | Copia las que uses. Formato colombiano: `$1.234.567`, `85,5 %`. |
| Recursos sin fetch | `js/recursos.js` + `window.ANALFE_RECURSOS` | Igual: todo lo que el HTML necesita va incrustado. |
| Carga de archivo personal | `js/encabezados.js` (`cargarEncabezadosDeArchivo`, aviso de origen, no pisa lo editado) | Base para `js/perfil.js`. |
| Empaquetado | `herramientas/empaquetar.mjs`: esbuild a IIFE, CSS y `lib/` incrustados, plugin que cambia `equipo.js` por `equipo_vacio.js`, error si queda un `src=`/`href=` externo y **control de datos personales** («0 de N valores aparecen en el HTML») | Cópialo y adáptalo (sección 9). |
| Pruebas | `pruebas/pruebas.html` (pruebas en el navegador) | Aquí las pruebas pasan a `node:test` (sección 8). |

---

## 3. El Excel de referencia: estructura real

En `referencia/` vienen dos copias **anónimas**, con datos inventados, sin protección y con los valores ya recalculados:

- `Simulador_Comercial_2026_con_BTL_REFERENCIA_ANONIMA.xlsx` es la **versión vigente del simulador comercial**: octubre a diciembre de 2026, con BTL. Hay otra variante «sin BTL» igual a esta, pero sin la sección 5.
- `Simulador_Nuevo_Ingreso_2026_REFERENCIA_ANONIMA.xlsx` es la **variante individual de nuevo ingreso**: desde diciembre de 2026, mes a mes hasta junio de 2027, con prorrateo por días.

El **simulador del Director** no viene en `referencia/` porque su copia real trae la facturación y los datos del equipo. Su lógica está descrita en la sección 4.3. Si más adelante llega una copia anónima, súmala al comparador.

Lee los Excel con SheetJS (`lib/xlsx.full.min.js`) o con Python/openpyxl. **Usa los nombres definidos** (`Peso_Ventas`, `Score_vista`, `Inp_BTL_Ingreso`…), no coordenadas sueltas: el libro comercial tiene 196 nombres y el de nuevo ingreso 136. Guarda en `referencia/mapeo_nombres.json` el mapa nombre → celda → campo del motor.

### 3.1 Simulador comercial (vigente, con BTL)

| Hoja | Estado | Qué tiene |
|---|---|---|
| `Instrucciones` | visible | 4 pasos de uso y la leyenda de colores (amarillo = escriba, gris = calculado, azul = título). |
| `Cómo se calcula` | visible | Explicación en lenguaje simple de cada indicador y la tabla de la curva. **Reutiliza esos textos** en los «Ver fórmula» y en la ayuda. |
| `Modelo` | visible | La hoja principal (detalle abajo). La columna `AA` es un motor oculto con `Has_Oct/Nov/Dic`, `Score_*`, `Factor_*`, `Comision_*`, `*_vista`, metas de base social por mes y los datos del comercial elegido (`Sim_Basico`, `Sim_Opp`, `Sim_IMR`, `Sim_IngMax`, `Sim_TopeInd`). |
| `Sensibilidad` | oculta | «¿Cuánto gana según su cumplimiento de ventas?» y un gráfico de línea, «Comisión estimada según el cumplimiento de ventas». |
| `Parámetros` | oculta | Todos los valores editables (sección 3.3). |
| `_Listas` | muy oculta | SÍ/NO, LINEAL/ESCALONES, meses (Octubre, Noviembre, Diciembre, Trimestre) y factores de margen (0 %, 90 %, 100 %). |
| `_Datos` | muy oculta | Una fila por comercial. **Esto es lo que pasa al archivo de perfil.** |

Columnas de `_Datos`: Nombre, Nombre completo, Cargo/nivel/regional, Documento, Banda, Valor de referencia, Salario base, Oportunidad variable, IMR (= salario + oportunidad), Ingreso máximo mensual (= salario + oportunidad × tope), Tope individual, Meta Edu/Asist oct/nov/dic, Meta Misión oct/nov/dic, Meta Congreso oct/nov/dic, Meta Cultural oct/nov/dic, Cartones, Base social 30 sept, Ingresos, Retiros y «Tiene base social».

**Hoja `Modelo`, de arriba abajo:**
- Fila 3: comercial (`Comercial_sel`, lista) y mes (`Mes_sel`: Octubre, Noviembre, Diciembre o Trimestre).
- Filas 4 a 13, **resumen**: puntaje, % de la curva, comisión estimada, tabla de los 4 indicadores (peso, puntos, cumplimiento, máximo al 120 %), rango de la curva en texto, «Para llegar a 80 puntos» y «Comisión del esquema anterior (opcional)» → «En la transición se pagaría» = máx(nueva, anterior).
- Sección 1, **Ventas rentables y recaudadas** (columnas Oct, Nov, Dic, Trimestre):
  - Educación y asistencia técnica: meta, venta recaudada (amarilla), factor de margen (amarillo, lista, vacío = 100 %), venta reconocida, peso y cumplimiento.
  - Misión internacional: meta, número de facturas (amarilla), valor por factura y venta reconocida.
  - Congreso Nacional: meta, recaudo, inscritos y cumplimiento con tope del 100 %.
  - Actividad cultural: meta (cartones × valor por cartón; se aplica en diciembre) y venta recaudada, con los cortes de referencia.
  - Suma de metas, cumplimiento ponderado y puntos de ventas.
  - Calculadora opcional del factor de margen: ingreso y costo → margen → factor sugerido.
- Sección 2, **Base social**: base al 30 de septiembre, retiros e ingresos (vienen del perfil y se pueden ajustar), cierre, meta, cumplimiento y puntos.
- Sección 3, **Diversificación e innovación**: SERFISCAL (ventas del trimestre y meta) e innovación (hasta 2 ofertas: aprobada SÍ/NO y valor de la primera venta).
- Sección 4, **Satisfacción**: esperada y obtenida.
- Sección 5, **Bonificación por evento (BTL)**: ingreso, costo y utilidad presupuestada (amarillos), ICA, GMF, utilidad real, margen, cumplimiento de utilidad, % de la bonificación, BTL calculado, tope por evento, tope anual disponible, BTL ya pagado en el año (amarillo), tope del 25 % y BTL estimado. **No suma a la comisión.**

### 3.2 Variante de nuevo ingreso (diferencias)

Su estructura es igual a la comercial (Instrucciones, Modelo, Cómo se calcula, Sensibilidad, Parámetros, `_Listas`, `_Datos` de una sola persona), con estas diferencias:
- **Meses**: Diciembre 2026 a Junio 2027 (`_Listas` trae los días, el inicio y el fin de cada mes). Se elige un mes a la vez; no hay «Trimestre» ni columnas por mes.
- **Prorrateo** (num. 10.2): `Factor_prorrateo = min(1, max(0, días laborados ÷ días del mes))`. La meta aplicada es la meta oficial × el factor.
- Hay **seis productos**: Educación y asistencia técnica, Misión, Congreso, **Pasantía Nacional**, Actividad cultural (meta en cartones o en pesos) y **Patrocinios**.
- **«¿Hay medición certificada?»** por indicador (ventas, base social, SERFISCAL, innovación y satisfacción). Si la respuesta es NO, el indicador queda **neutro al 100 %** (45, 20, 10, 10 y 15 puntos) y se avisa.
- **Base social**: «Meses a contar para la meta» es una entrada.
- **Innovación**: hasta 4 ofertas, máximo 5 puntos por oferta (`Tope_Inn_oferta`) y 10 por trimestre (`Tope_Inn_trim`).
- **Regla del 20 % exacto** del factor de margen: «90 % (política)» o «100 % (matriz)».
- **BTL con requisitos** (5.11.5): puntaje ordinario ≥ 80, participación material, cierre financiero certificado y satisfacción del evento ≥ 85 %. El tope del 25 % descuenta lo asignado al director u otros.
- **No hay esquema anterior** ni transición.
- Parámetros que se declaran pero **ninguna fórmula usa**: prefijo de anticipo, incluir anticipos e incluir no canceladas. Llévalos como parámetros informativos.

### 3.3 Parámetros y valores de fábrica (hoja `Parámetros`)

| Grupo | Parámetro (nombre en Excel) | Fábrica |
|---|---|---|
| Pesos | `Peso_Ventas`, `Peso_Base`, `Peso_SER`, `Peso_Innovacion`, `Peso_Satisfaccion` (suma `Suma_pesos`) | 45, 20, 10, 10, 15 (= 100) |
| Curva | `Score_minimo`, `Tope_pago`, `Tipo_curva` (LINEAL/ESCALONES), `Curva_P1..P5` / `Curva_F1..F5` | 80; 1,2; LINEAL; (80; 70 %), (90; 90 %), (100; 100 %), (110; 110 %), (120; 120 %) |
| Topes de cumplimiento | `Limitar_ventas` (SÍ/NO), `Tope_ventas`, `Tope_Congreso` | SÍ; 1,2; 1,0 |
| Margen de Educación | `Umbral_bajo`, `Umbral_alto`, `Factor_bajo`, `Factor_medio`, `Factor_alto`, `Tasa_ICA`, `Tasa_GMF` | 10 %, 20 %, 0 %, 90 %, 100 %, 0,9660442 % (9,66 por mil sobre ingresos), 0,4 % (4 × 1.000 sobre costo) |
| Misión, Congreso y cultural | `Base_Mision_factura`, `Meta_Mision_oct/nov/dic`, `Meta_Congreso_oct/nov/dic`, `Valor_Carton`, `Cartones_Equipo`, cortes de la actividad cultural | 15.500.000; 49.600.000 / 0 / 0; 0 / 0 / 0; 40.000; 6.000; 15 nov 30 %, 22 nov 55 %, 29 nov 80 %, 4 dic 100 % |
| Base social e innovación | `Incremento_BS`, `Pts_Oferta`, `Pts_PrimeraVenta` | 1 por mes; 2; 3 |
| Satisfacción | `Sat_Esperada` | 80 |
| BTL comercial | `BTL_Tope_evento`, `BTL_Tope_anual` (múltiplos del IMR), `BTL_Salvaguarda`, `BTL_Cump_min`, `BTL_Margen_min/med/alto`, `BTL_P90_M1..M3`, `BTL_P100_M1..M3` | 0,8; 2; 25 %; 90 %; 5,1 % / 10,1 % / 15,1 % (en nuevo ingreso: 5 / 10 / 15 %); 20/30/40 %; 35/60/80 % |

---

## 4. Motor de cálculo (debe dar lo mismo que el Excel)

Escríbelo en `js/motor/` como **funciones puras** (sin DOM ni `window`), en módulos ES que Node pueda importar. Celda vacía = `null`, no 0: el Excel distingue «vacío» de «cero» con `ISNUMBER` y `N()`. Respeta esa diferencia. Cada función recibe `(entradas, perfil, parametros)` y devuelve valores **y** textos de estado («Pendiente», «—», mensajes).

### 4.1 Comercial (versión vigente)

- **Mes con datos**: `Has_mes` = 1 si hay algún número en Educación, Misión, Congreso, inscritos o cultural de ese mes.
- **Ventas, por producto y mes**:
  - Educación: `reconocida = recaudada × (factor de margen o 1 si está vacío)`.
  - Misión: `reconocida = facturas × Base_Mision_factura`.
  - Congreso: `cump = min(Tope_Congreso, recaudo ÷ meta)`; meta 0 = no participa.
  - Cultural: `cump = recaudada ÷ meta`.
  - Para cada producto: `peso = meta ÷ suma de metas > 0`; `cump = reconocida ÷ meta`, con tope `Tope_ventas` si `Limitar_ventas = SÍ`; meta ≤ 0 → cumplimiento 0 y no pesa.
  - `cumplimiento ponderado = Σ peso × cump` y `puntos de ventas = ponderado × Peso_Ventas` (máximo 54).
  - **Trimestre**: suma metas y ventas solo de los meses con datos y calcula igual.
- **Base social**: `cierre = round(base) + round(ingresos) − round(retiros)`; `meta = round(round(base) + k × Incremento_BS)` con k = 1 en octubre, 2 en noviembre y 3 en diciembre o trimestre; `cump = cierre ÷ meta`; `puntos = cump ≥ 1 ? Peso_Base × min(cump, Tope_pago) : 0`.
- **SERFISCAL**: `cump = ventas trimestrales ÷ meta`; mismos puntos con `Peso_SER` (umbral del 100 % y tope del 120 %).
- **Innovación**: una oferta aprobada SÍ → `Pts_Oferta`; NO → 0; vacío → vacío. Primera venta > 0 → `Pts_PrimeraVenta`. `puntos = min(Peso_Innovacion × Tope_pago, suma)`. Ojo: en este Excel el tope es 12; la política dice 10 (sección 11).
- **Satisfacción**: `cump = obtenida ÷ Sat_Esperada`; `puntos = cump ≥ 1 ? Peso_Satisfaccion × min(cump, Tope_pago) : 0`.
- **Puntaje**: `min(Suma_pesos × Tope_pago, ventas + base + SER + innovación + satisfacción)`.
- **Curva**:
  - Puntaje < `Score_minimo` → 0.
  - LINEAL: interpolación entre puntos consecutivos `(P_i, F_i)`; a partir de P5 → F5. ESCALONES: el F del tramo.
  - Siempre `min(Tope_pago, …)`.
- **Comisión**: `Sim_Opp × factor`. En el trimestre, la comisión es la **suma de las comisiones mensuales** y el puntaje se calcula con las ventas del trimestre.
- **Transición**: si hay comisión del esquema anterior, `máx(comisión nueva, anterior)`.
- **«Para llegar a 80»**: puntos que faltan y mensaje según el Excel.
- **Sensibilidad**:
  - `otros = base + SER + innovación + satisfacción`.
  - Para cumplimiento de ventas c = 0 %, 10 %, …, 120 %: `pts = min(Peso_Ventas × (Limitar? Tope_ventas : 9), c × Peso_Ventas)`, `score = min(120, pts + otros)`, curva y comisión.
  - `cump necesario = (80 − otros) ÷ Peso_Ventas`, con «No alcanza» si pasa de 54 puntos y 0 si ya llega.
  - Hay una casilla «Pruebe un cumplimiento».
- **Calculadora del factor de margen**: `margen = (ing − costo − ing × ICA − costo × GMF) ÷ ing`; `< Umbral_bajo → Factor_bajo`; `≤ Umbral_alto → Factor_medio`; si no, `Factor_alto`.
- **BTL comercial**:
  - `ICA = ingreso × Tasa_ICA` y `GMF = costo × Tasa_GMF`.
  - `utilidad real = ingreso − costo − ICA − GMF`; `margen = utilidad ÷ ingreso`; `cump = utilidad ÷ utilidad presupuestada`.
  - `%`: cump < `BTL_Cump_min` o margen < `BTL_Margen_min` → 0; cump < 1 → P90 según la banda de margen (`< med`, `< alto`, si no alto); cump ≥ 1 → P100 según la banda.
  - `calculado = IMR × %`; `tope evento = BTL_Tope_evento × IMR`; `tope anual = máx(0, BTL_Tope_anual × IMR − pagado en el año)`; `tope 25 % = máx(0, BTL_Salvaguarda × utilidad)`.
  - `BTL estimado = mínimo de los cuatro`. Se muestra aparte y **no suma** a la comisión.
  - `IMR = básico + oportunidad`; viene del perfil y no se muestra por defecto (el Excel no lo muestra).

### 4.2 Nuevo ingreso

Igual que 4.1, con lo de la sección 3.2:
- Prorrateo de metas.
- Seis productos.
- Indicador neutro si no hay medición certificada.
- Innovación con 4 ofertas y topes de 5 por oferta y 10 por trimestre.
- Regla del 20 % exacto.
- BTL con requisitos: el texto de estado sale de la primera condición que falla (puntaje, participación, cierre o satisfacción del evento) y, si no falla ninguna, «Cumple los requisitos». El tope del 25 % descuenta `Inp_BTL_Otros`.

### 4.3 Director Comercial

El Excel `Simulador_Director_Comercial_2026` no está en `referencia/`; impleméntalo con esta lógica:
- **Columnas**: octubre, noviembre y diciembre. Las entradas son los **totales del equipo**: metas y recaudo por producto (Educación, Misión, Congreso y cultural en cartones × valor), base social (base al 30 de septiembre, ingresos, retiros y meta), cumplimiento de SERFISCAL e innovación, y satisfacción.
- **Ventas**: `puntos = Peso_Ventas × min(Tope_dir, Σ peso × cump)`. Aquí el cumplimiento de cada producto **no** se limita; solo el ponderado.
- **Regla del 100 % para el director** (SÍ/NO; el Excel trae NO):
  - Con NO: `puntos = peso × min(Tope_dir, cump)`, sin umbral.
  - Con SÍ: si cump < 1, los puntos son 0.
  - Base social, SERFISCAL, innovación y satisfacción siguen esa regla.
- **Puntos transitorios**: si SERFISCAL o innovación están vacíos, valen 10 cada uno. Si la satisfacción está vacía, vale 15. Diversificación tiene `min(24, …)`.
- **Método del agregado** (lista):
  - «Totales del equipo por indicador» (fábrica).
  - «Promedio simple de los puntajes».
  - «Promedio ponderado por meta de ventas».
  - Los dos promedios usan los puntos individuales de cada comercial del mes, que trae el perfil del director (`equipo.puntosIndividuales`). Si no vienen, esos métodos quedan «Pendiente».
- **Puntaje**: `min(120, suma)`. **Factor**: la misma curva. El Excel del director la escribe fija (0,7 + (s − 80) × 0,02…); tú usa los parámetros y prueba que con los de fábrica da igual.
- **Comisión nueva**: `oportunidad × min(Tope_dir, factor)`. Si falta la oportunidad, «Pendiente».
- **Esquema anterior**:
  - `base facturada sin BTL × Tasa_Dir_Anterior (1,5 %)`; esta comisión entra a la transición.
  - BTL anterior: `base BTL × Tasa_Dir_BTL_Anterior (0,63 %)`. Es informativo y **no** entra a la transición; está en `anterior.btlEntraTransicion = false`, pendiente de definir.
  - Transición: `máx(nueva, anterior sin BTL)` de octubre a diciembre.
- **BTL del director**:
  - Entradas: evento, mes, ingreso, utilidad presupuestada y utilidad real.
  - `%`: cump < 90 % o margen < 10 % → 0; cump < 100 % → 10 %; margen ≤ 15 % → 20 %; si no, 25 %.
  - `preliminar = IMR_dir × %`; tope por evento 0,25 IMR; tope anual 1 IMR menos lo ya pagado (con «¿cuenta para el tope?» SÍ/NO/PENDIENTE).
  - `después de topes = mínimo`.
  - **Salvaguarda conjunta**: si `preliminar del comercial + director > 25 % de la utilidad`, se prorratea: `director = 25 % × utilidad × director ÷ (comercial + director)`.
  - **Condiciones conjuntas**: participación, cierre y certificación, meta de recaudo, satisfacción del cliente y puntaje del mes del evento ≥ 80. Los estados son «Pendiente», 0 o el valor.
- **Datos del director** (perfil): básico, oportunidad y tope. `IMR = básico + oportunidad` e `ingreso máximo = básico + oportunidad × tope`.

### 4.4 Redondeo y formato

- Calcula con precisión completa. Redondea **solo al mostrar**: pesos sin decimales y porcentajes con 1 o 2 decimales.
- Usa `ROUND` solo donde lo usa el Excel (la base social).
- Para no perder la exactitud en la frontera (80,0 exacto, 100 % exacto, 20 % exacto), compara con una tolerancia de `1e-9`, igual que el Excel.

---

## 5. Interfaz (estilo del liquidador)

Usa el riel de pasos del liquidador. Pasos del **modo comercial**:

1. **Mi perfil**:
   - Zona para soltar o elegir el archivo (`.zona-archivo`).
   - Estado: «Usando datos de ejemplo» (insignia de aviso) o «Perfil cargado: Comercial X · vigencia oct–dic 2026».
   - Botones «Quitar perfil» y «Abrir escenario guardado».
2. **Ventas**: por producto y mes, con las casillas amarillas y la calculadora del factor de margen.
3. **Base social**.
4. **Diversificación e innovación**.
5. **Satisfacción**.
6. **Resultado**:
   - Tarjeta grande de resultados con puntaje, % de la curva, comisión y transición.
   - La tabla de los 4 indicadores.
   - La curva en SVG, con el punto del puntaje (reutiliza `.score-curva`).
   - «Para llegar a 80».
7. **¿Cuánto gano si…?**: la tabla de sensibilidad, un gráfico de línea **en SVG propio** (sin Chart.js ni librerías externas) y la casilla «Pruebe un cumplimiento».
8. **BTL**: la bonificación por evento, marcada como «aparte, no suma a la comisión».
9. **Guardar e imprimir**: descargar escenario, imprimir en carta y restaurar.

Además:
- **Cabecera fija** con la franja de resultados: puntaje, % de la curva y comisión del mes. Se actualiza mientras se escribe.
- Selector de mes (Octubre, Noviembre, Diciembre o Trimestre) como en el Excel. En el perfil de nuevo ingreso, el selector va con los días laborados.
- El **modo director** se activa si el perfil es de tipo `director`. Va en columnas por mes, con el selector de método, la regla del 100 %, el esquema anterior, la transición y el BTL del director.
- La pestaña **Parámetros** va plegada en «Opciones avanzadas». Cambiar un parámetro muestra el aviso «Estás simulando con parámetros distintos a los de la política» y ofrece «Restaurar».
- Nada cortado ni apretado: revisa a 1366 × 768, 1920 × 1080 y en impresión carta. Los textos largos hacen salto de línea y no se recortan.
- Accesible: etiquetas `<label>`, foco visible y números con `inputmode="decimal"`. Acepta `1.234.567` y `85,5`; mira `numeroFlexible`.

---

## 6. Perfiles por persona (anonimización)

### 6.1 Idea

El HTML es igual para todos y no trae datos. Cada comercial recibe **solo su archivo** por el canal interno de ANALFE, lo carga y simula. Sin archivo, la web usa `datos_ejemplo/perfil_ejemplo_comercial.json`, con cifras inventadas e incrustado al empaquetar. **Ese ejemplo no puede parecerse a nadie real.**

### 6.2 Esquema del perfil (`esquemas/perfil.schema.json`, versión 1)

```json
{
  "formato": "analfe-simulador-perfil",
  "version": 1,
  "tipo": "comercial",
  "variante": "trimestre-oct-dic-2026",
  "generado": "2026-11-23",
  "politica": "PCV-COM-001",
  "persona": { "id": "c-7f3a", "nombreVisible": "Comercial Ejemplo", "cargo": "Ejecutivo Comercial II", "regional": "Regional Centro" },
  "compensacion": { "basico": 3000000, "oportunidad": 2000000, "topeIndividual": 1.2 },
  "periodos": [
    { "mes": "2026-10", "diasMes": 31, "diasLaborados": 31,
      "metas": { "educacion": 29350000, "mision": 49600000, "congreso": 0, "pasantia": null, "cultural": 0, "patrocinios": null } },
    { "mes": "2026-11", "diasMes": 30, "diasLaborados": 30, "metas": { "educacion": 24000000, "mision": 0, "congreso": 0, "cultural": 0 } },
    { "mes": "2026-12", "diasMes": 31, "diasLaborados": 31, "metas": { "educacion": 21000000, "mision": 0, "congreso": 0, "cultural": 17200000 } }
  ],
  "baseSocial": { "fechaCorte": "2026-09-30", "inicial": 50, "ingresos": 0, "retiros": 0, "tieneBase": true, "certificada": true },
  "cartones": 430,
  "btl": { "pagadoEnAnio": 0 },
  "anterior": { "comisionPorMes": { "2026-10": null } },
  "parametrosPropios": {},
  "control": { "sha256": "…" }
}
```

- **Tipos**: `comercial`, `nuevo-ingreso` (con prorrateo y medición certificada) y `director` (con `equipo` agregado y, opcionalmente, `equipo.puntosIndividuales` con alias «Comercial 1…n», nunca nombres).
- **No van** el documento, el nombre completo ni la banda o valor de referencia: el simulador no los usa.
- **Validaciones**, con mensajes claros en español y sin jerga:
  - `formato` y `version` correctos. Si no: «Este archivo no es un perfil del simulador ANALFE».
  - Números ≥ 0 y meses `AAAA-MM` válidos.
  - `topeIndividual` entre 1 y 1,5.
  - Metas `null` (pendiente) o un número.
  - Si se cargó un archivo de otro tipo: «Este perfil es de Director: se abrirá el modo Director».
  - Campos desconocidos → aviso, no error.
  - `control.sha256` (huella de los datos) no coincide → «El archivo fue modificado después de generarse. Los resultados pueden no coincidir con los de finanzas». Es un aviso de integridad, **no de seguridad**.
- Valida con un validador propio en `js/perfil.js`. No agregues librerías de JSON Schema; el `.schema.json` es documentación y sirve para pruebas.
- **CSV opcional**: una fila con las mismas claves aplanadas (`compensacion.basico`, `periodos.2026-10.metas.educacion`…), separador `;` y decimales con coma. Se convierte a la misma estructura y pasa por el mismo validador.

### 6.3 Generador (solo para Manuel o finanzas)

`herramientas/generar_perfiles.mjs`, con Node y sin dependencias:
- **Entrada A**: `privado/encabezados_comerciales.json`, en el formato del liquidador (`equipo.comerciales[]` con `nombre`, `nombreCorto`, `basico`, `oportunidad`, `metas`, `baseSocialInicial`, `cartones`, `ingresos`, `retiros`, `btlPagadoAnio`; y `equipo.director` / `director`). Mira `js/encabezados.js` del liquidador para el formato. **Cursor no abre ese archivo:** escribe el generador guiándote por el esquema y pruébalo con `datos_ejemplo/encabezados_ejemplo.json`, que creas tú con datos inventados.
- **Entrada B**: `privado/plantilla_perfiles.csv` (crea `plantillas/plantilla_perfiles.csv` vacía, con encabezados y una fila de ejemplo inventada).
- **Salida**:
  - `salida_perfiles/<alias>.perfil.json`, un archivo por persona.
  - `salida_perfiles/LEEME_ENTREGA.txt`, con la lista de archivos y a quién va cada uno, sin cifras.
  - El resumen en consola no muestra salarios.
- **Opción `--cifrar`** (sección 6.4): pide la contraseña en la terminal, sin eco y una por persona, y escribe `<alias>.analfe`. Nunca la escribe en disco ni en el log.
- Calcula `control.sha256` sobre el contenido canónico, con las claves ordenadas.

### 6.4 Límites honestos y opción de cifrado (dejarla como decisión)

- Un JSON **no está cifrado**. Cualquiera que reciba el archivo de otra persona puede abrirlo con el Bloc de notas. La protección real es **entregar a cada quien solo su archivo, por el canal interno**, y que el HTML no traiga datos.
- La huella `sha256` detecta cambios, pero no impide leer el archivo.
- **Opción (decide Manuel con su jefa):** un perfil cifrado `.analfe`:
  - Formato: `{ "formato": "analfe-perfil-cifrado", "version": 1, "kdf": "PBKDF2-SHA256", "iteraciones": 310000, "sal": b64, "iv": b64, "datos": b64 }`, cifrado con **WebCrypto AES-GCM 256** y llave derivada con **PBKDF2**.
  - La web pide la contraseña al cargar y nunca la guarda. Si es incorrecta: «La contraseña no coincide».
  - Verifica que `crypto.subtle` exista con `file://` en Chrome y Edge (`window.isSecureContext`). Si no existe, muestra un error claro.
  - Si se olvida la contraseña, finanzas genera el archivo de nuevo.
  - Deja la opción detrás de un parámetro de empaquetado (`--con-cifrado`) y documenta los pros y contras en el README.
- **Nada en `localStorage` con datos personales.** Solo se guardan preferencias de interfaz, como el riel plegado. Hay una casilla «Recordar mi perfil en este computador», desmarcada por defecto y con advertencia; si se marca, se guarda en `localStorage` y aparece el botón «Olvidar».

### 6.5 Escenarios

- **«Descargar escenario»** guarda `escenario_AAAA-MM-DD.json` con `{ formato: "analfe-simulador-escenario", version: 1, perfilId, mes, entradas, parametrosCambiados }`. **No incluye** el salario ni la oportunidad, solo `perfilId`.
- **«Abrir escenario»** lo restaura. Si el `perfilId` no coincide con el perfil cargado, avisa.

---

## 7. Comparador con el Excel

### 7.1 Casos esperados (salen del Excel, no de tu motor)

`herramientas/generar_casos_excel.*` llena las celdas de entrada del Excel de `referencia/`, recalcula y lee las salidas. Elige el método según lo que haya en el PC:
- **Windows + Excel** (preferido): `herramientas/generar_casos_excel.ps1` con COM (`New-Object -ComObject Excel.Application`, `Visible=$false`, `Calculate()`). Escribe en una **copia temporal** que borra al terminar.
- **LibreOffice** (alternativa): `soffice --headless --convert-to xlsx` recalcula la copia. Luego se leen los valores con SheetJS o openpyxl.

El script lee `pruebas/escenarios.json` (entradas por nombre definido) y escribe `pruebas/casos_excel.json`:

```json
{ "fuente": "Simulador_Comercial_2026_con_BTL_REFERENCIA_ANONIMA.xlsx", "generado": "…",
  "casos": [ { "id": "c01-bajo-80", "variante": "comercial", "comercial": "Comercial A", "mes": "Octubre",
               "entradas": { "Inp_EAT_Oct": 20000000, "Inp_Sat": 70 },
               "esperado": { "Score_vista": 41.2, "Factor_vista": 0, "Comision_vista": 0, "BTL_Estimado": null } } ] }
```

Las pruebas usan ese JSON y **no necesitan Excel para correr**. Cuando cambie el Excel, se regenera.

**Escenarios mínimos** (con datos inventados):
1. Puntaje < 80 (paga 0).
2. Puntaje **exactamente 80** (paga 70 %).
3. Puntajes entre tramos: 85, 95 y 105.
4. Puntaje 100.
5. Puntaje ≥ 120 y ventas al 150 % (tope de ventas 1,2 y del puntaje 120).
6. Congreso por encima del 100 % (se limita).
7. Factor de margen 0 %, 90 % y 100 %, más el margen exactamente en 10 % y en 20 %.
8. Base social justo en la meta, por debajo y por encima del 120 %.
9. SERFISCAL al 99,9 % (0 puntos) y al 100 %.
10. Innovación con 1 y con 2 ofertas (tope).
11. Satisfacción 79, 80 y 100.
12. Trimestre con 1, 2 y 3 meses con datos.
13. `Tipo_curva = ESCALONES`.
14. `Limitar_ventas = NO`.
15. Transición: anterior mayor y anterior menor que la nueva.
16. BTL: margen bajo, medio y alto; cumplimiento < 90 %, 90–99,9 % y ≥ 100 %; tope por evento, tope anual con pagos previos y tope del 25 %.
17. Comercial «sin datos» (fila vacía en `_Datos`).
18. Nuevo ingreso:
    - Prorrateo de 15 de 31 días.
    - Medición NO en cada indicador.
    - 4 ofertas.
    - Regla del 20 % exacto en sus dos opciones.
    - BTL que cumple y que no cumple cada requisito.
19. Director (casos calculados a mano a partir de la sección 4.3 y marcados `"fuente": "manual"`):
    - Los tres métodos.
    - Regla del 100 % SÍ y NO.
    - Puntos transitorios.
    - Transición.
    - BTL con prorrateo por salvaguarda.
    - Condiciones pendientes.

**Caso semilla ya verificado en el Excel anónimo** (úsalo como primera prueba):
- **Entradas**: Comercial A, octubre.
  - Educación: venta recaudada 41.250.000, sin factor de margen. Misión: 3 facturas.
  - Base social: base 90, sin ingresos ni retiros.
  - SERFISCAL: 12 de 10. Innovación: oferta SÍ con primera venta de 5.000.000. Satisfacción: 85. Comisión anterior: 1.500.000.
  - BTL: ingreso 100.000.000, costo 80.000.000, presupuestada 15.000.000.
- **Resultados de ventas, base social y puntaje**:
  - Cumplimiento de Misión 93,75 % y puntos de ventas 43,4645.
  - Base social: cierre 90 y meta 91, así que 0 puntos.
  - Diversificación 17 y satisfacción 15,9375.
  - **Puntaje 76,4020**, factor 0, comisión 0 y transición 1.500.000.
- **Resultados de BTL**:
  - ICA 966.044,2, GMF 320.000, utilidad 18.713.955,8, margen 18,714 % y cumplimiento 124,76 %, así que el % es 80 %.
  - Calculado 8.000.000, tope por evento 8.000.000, tope anual 20.000.000 y tope del 25 % 4.678.488,95.
  - **BTL estimado 4.678.488,95**.

### 7.2 Vista «Comparar con Excel» (solo en la versión de revisión)

- Se empaqueta solo con `--revision`, así que **no va** en el HTML de los comerciales.
- Opción 1: cargar `casos_excel.json` y ver la tabla caso por caso.
- Opción 2: cargar un Excel del simulador **ya llenado y guardado en Excel**. SheetJS lee las entradas y los valores calculados por nombre definido, corre el motor con las mismas entradas y muestra la tabla.
- La tabla tiene estas columnas: nombre o celda, valor del Excel, valor de la web, diferencia y ✔/✖.
- **Tolerancias**: pesos ±1; puntajes y porcentajes ±1e-6; textos iguales después de normalizar espacios.
- Resumen arriba: «312 de 312 valores coinciden».
- Las diferencias **esperadas** (sección 7.3) se muestran en ámbar con su explicación, no en rojo.

### 7.3 Diferencias conocidas del Excel (no las copies a ciegas)

1. **Nuevo ingreso, BTL siempre 0 cuando sí cumple.** La celda de requisitos devuelve `"Cumple los requisitos."` (con punto), pero el BTL estimado compara con `"Cumple los requisitos"` (sin punto). Comprobado: puntaje 100 con todos los requisitos en SÍ da 0 en el Excel, cuando debería dar 4.000.000 en el caso de prueba. La web aplica la regla correcta y el comparador marca el caso como diferencia esperada. Dile a Manuel que el Excel necesita esa corrección.
2. **Tope de innovación** en el comercial: el Excel limita a 12 (`Peso_Innovacion × Tope_pago`), mientras la política y el texto de la misma hoja dicen 10. Hazlo parámetro (`innovacion.topeTrimestre`), con 12 de fábrica para calzar con el Excel y el aviso de que está pendiente.
3. **Requisitos del BTL** (5.11.5): el Excel comercial no los aplica (participación, cierre, satisfacción del evento y puntaje ≥ 80); el de nuevo ingreso sí. Hazlo parámetro (`btl.aplicarRequisitos`). En modo comparación con el Excel comercial va en NO; para los comerciales, decide Manuel (sección 11).
4. **Umbrales de margen del BTL**: 5,1 / 10,1 / 15,1 % en el comercial frente a 5 / 10 / 15 % en el de nuevo ingreso. Son parámetros; la discrepancia queda como pendiente.
5. **Curva del director** escrita a mano en el Excel: usa los parámetros y prueba que coinciden con los de fábrica.

---

## 8. Pruebas automáticas

- Usa **`node:test` + `node:assert`**, sin dependencias. Los archivos van en `pruebas/*.test.mjs`:
  - `curva.test.mjs`: fronteras 79,999 / 80 / 89,999 / 90 / 120 / 130, LINEAL y ESCALONES.
  - `ventas.test.mjs`, `baseSocial.test.mjs`, `diversificacion.test.mjs`, `satisfaccion.test.mjs`, `btl.test.mjs`, `director.test.mjs` y `sensibilidad.test.mjs`.
  - `excel.test.mjs`: recorre `casos_excel.json` con las tolerancias de 7.2. Los casos de 7.3 se esperan con su valor correcto y se anota la diferencia.
  - `perfil.test.mjs`: perfiles válidos e inválidos, mensajes de error exactos, CSV, huella, cifrado y descifrado con WebCrypto de Node (`globalThis.crypto.subtle`), contraseña incorrecta.
  - `parametros.test.mjs`: los valores de fábrica son los del Excel (sección 3.3) y la suma de pesos es 100.
  - `vacios.test.mjs`: vacío ≠ 0 en cada indicador; «—» y «Pendiente» en los mismos casos que el Excel.
- **Prueba de humo del HTML**, `pruebas/humo.mjs`:
  - Abre `dist/Simulador_ANALFE.html` con `file://` en Chrome o Edge headless, con `puppeteer-core` instalado `--no-save`, igual que esbuild en el liquidador, y la ruta del navegador del PC.
  - Comprueba que no hay **errores de consola**.
  - Comprueba **0 peticiones de red**: todas las solicitudes deben ser `data:`/`blob:`/`file:` y cualquier `http(s)` falla.
  - Carga el perfil de ejemplo y un perfil inválido. Llena el caso semilla y verifica el puntaje 76,40 y la comisión.
  - Imprime a PDF en carta y verifica que salen 2 páginas o menos por simulación y que nada se recorta.
  - Si no hay navegador, la prueba se marca «omitida», no «aprobada».
- **Control de datos personales**, `herramientas/control_datos_personales.mjs`:
  - Si existe `privado/encabezados_comerciales.json` o `privado/*.csv`, toma nombres, nombres cortos, documentos, básicos, oportunidades, metas y bases. Comprueba que **ninguno** aparece en `dist/*.html`, ni en `js/`, `datos_ejemplo/`, `pruebas/` o `referencia/`.
  - Imprime solo «0 de N valores aparecen», nunca los valores.
  - Además busca patrones sospechosos: números de 8 a 10 dígitos que no estén en `PARAMETROS_INICIALES` ni en los ejemplos.
- **Un solo comando**, `npm test` (con `package.json` sin dependencias), que llama a `node herramientas/verificar_todo.mjs` y este:
  1. corre `node --test pruebas/`;
  2. empaqueta;
  3. pasa el control de datos personales;
  4. corre la prueba de humo si hay navegador;
  5. imprime un resumen final con ✔/✖ por bloque.
- Sale con código ≠ 0 si algo falla.

---

## 9. Empaquetado

Copia `liquidador-web/herramientas/empaquetar.mjs` a `herramientas/empaquetar.mjs` y adáptalo:
- La salida es `dist/Simulador_ANALFE.html`, con un banner de versión y fecha de empaquetado.
- Incrusta `datos_ejemplo/perfil_ejemplo_*.json` (inventados) en `window.ANALFE_RECURSOS`. **Nunca** incrustes `privado/`, `salida_perfiles/` ni `referencia/`.
- `--revision` → `dist/Simulador_ANALFE_revision.html`, que incluye el comparador y SheetJS. La versión normal no incluye el comparador. SheetJS solo va en la normal si se usa para algo.
- Falla si queda un `src=` o `href=` externo, si aparece `http://` o `https://` en el código ejecutable (salvo texto de licencias) o si el control de datos personales encuentra algo.
- Imprime el tamaño y la lista de recursos incrustados.

---

## 10. Estructura de carpetas propuesta

```
simulador-web/
  index.html
  package.json                 (solo scripts: test, empaquetar, revision; sin dependencias)
  README.md                    (cómo abrir, cómo generar perfiles, límites de privacidad, pendientes)
  .cursorignore  .gitignore    (privado/, salida_perfiles/, datos/, *.analfe, *.perfil.json, dist/)
  css/        tokens.css  estilos.css  simulador.css
  js/
    main.js  parametros.js  utilidades.js  recursos.js  perfil.js  cifrado.js  escenario.js  graficos.js
    motor/    curva.js  ventas.js  baseSocial.js  diversificacion.js  satisfaccion.js  btl.js
              director.js  transicion.js  sensibilidad.js  index.js
    vistas/   perfil.js  ventas.js  baseSocial.js  diversificacion.js  satisfaccion.js  resultado.js
              sensibilidad.js  btl.js  director.js  parametros.js  comparador.js
  lib/        xlsx.full.min.js  (copiado del liquidador; solo revisión)
  esquemas/   perfil.schema.json  escenario.schema.json
  datos_ejemplo/  perfil_ejemplo_comercial.json  perfil_ejemplo_nuevo_ingreso.json
                  perfil_ejemplo_director.json  encabezados_ejemplo.json   (todo inventado)
  plantillas/ plantilla_perfiles.csv
  referencia/ Simulador_Comercial_2026_con_BTL_REFERENCIA_ANONIMA.xlsx
              Simulador_Nuevo_Ingreso_2026_REFERENCIA_ANONIMA.xlsx  mapeo_nombres.json
  pruebas/    *.test.mjs  escenarios.json  casos_excel.json  humo.mjs
  herramientas/ empaquetar.mjs  generar_perfiles.mjs  generar_casos_excel.ps1  generar_casos_excel.py
                control_datos_personales.mjs  verificar_todo.mjs
  privado/    (no versionado; aquí Manuel pone los datos reales; Cursor no lo abre)
  dist/       (salida, se puede regenerar)
```

---

## 11. Pendientes de negocio (no los inventes: parámetro + aviso visible)

| # | Pendiente | Valor de fábrica (igual al Excel) | Dónde se ve |
|---|---|---|---|
| 1 | Meta de base social del equipo del director: **622 o 524** | 622 | Director › Base social, con aviso «Pendiente de confirmar» |
| 2 | **Método del puntaje del director** (totales, promedio simple o ponderado) | Totales del equipo por indicador | Director, lista de método |
| 3 | ¿Aplica la **regla del 100 %** al director? | NO | Director |
| 4 | ¿El **BTL del esquema anterior** entra a la transición? | No (informativo) | Director y comercial › Transición |
| 5 | ¿Un BTL ya pagado en el año **cuenta para el tope anual** del director? | PENDIENTE | Director › BTL |
| 6 | Umbrales de margen del BTL comercial: 5,1/10,1/15,1 % o 5/10/15 % | 5,1/10,1/15,1 % (comercial); 5/10/15 % (nuevo ingreso) | Parámetros › BTL |
| 7 | Tope de innovación: 12 (Excel) o 10 (política) | 12 en comercial; 10 en nuevo ingreso | Parámetros › Innovación |
| 8 | ¿Se aplican los **requisitos 5.11.5** al BTL comercial en el simulador? | NO en comercial; SÍ en nuevo ingreso | Parámetros › BTL |
| 9 | Regla del **20 % exacto** del factor de margen | 90 % (política) | Parámetros › Margen |
| 10 | **Reparto 5.12** de la bonificación entre comerciales (solo si se aprobó antes del cierre) | No se simula; texto informativo | BTL |
| 11 | Anticipos y facturas no canceladas en el recaudo | Parámetros informativos, sin efecto (como en el Excel) | Parámetros |
| 12 | Comisión del esquema anterior del comercial | La escribe el usuario (opcional), como en el Excel | Resultado › Transición |

---

## 12. Orden de trabajo (fases)

1. **Fase 0, lectura.**
   - Lee el liquidador (sección 2) y los dos Excel de `referencia/`.
   - Escribe `referencia/mapeo_nombres.json` y un resumen de 1 página en `README.md` con lo que entendiste.
   - **Detente y muéstramelo** antes de seguir.
2. **Fase 1, motor y pruebas.**
   - `js/parametros.js` con los valores de fábrica, el motor de `js/motor/`, `pruebas/*.test.mjs`, `escenarios.json`, el generador de casos y `casos_excel.json`.
   - Criterio: `node --test pruebas/` en verde, con el caso semilla y todos los casos del Excel dentro de la tolerancia, salvo las diferencias esperadas de 7.3.
3. **Fase 2, interfaz.**
   - Pasos del riel, resultados primero, «Ver fórmula», SVG de la curva y de la sensibilidad, impresión carta y modo director.
   - Todo con el perfil de ejemplo.
4. **Fase 3, perfiles y anonimización.**
   - `perfil.js` con validación y mensajes, CSV, escenarios, `generar_perfiles.mjs`, la opción de cifrado detrás de `--con-cifrado` y `.cursorignore`.
5. **Fase 4, empaquetado y verificación.**
   - `empaquetar.mjs` (normal y `--revision`), control de datos personales, prueba de humo y `npm test` de punta a punta.

No pases de fase con pruebas en rojo.

---

## 13. Criterios de aceptación (todos verificables)

- [ ] `npm test` termina en verde y muestra el resumen por bloque.
- [ ] El **100 %** de los valores de `casos_excel.json` coincide dentro de la tolerancia. Las únicas excepciones son las de la sección 7.3, marcadas y explicadas.
- [ ] Caso semilla: puntaje 76,40, comisión 0, transición $1.500.000 y BTL estimado $4.678.489.
- [ ] `dist/Simulador_ANALFE.html` abre con doble clic en Chrome y Edge, con **0 errores de consola** y **0 peticiones de red**. Trae la CSP de la sección 1.
- [ ] Control de datos personales: «0 de N valores aparecen» en el HTML, `js/`, `pruebas/`, `datos_ejemplo/` y `referencia/`.
- [ ] Sin perfil, la web funciona con el ejemplo inventado y lo dice de forma visible.
- [ ] Un perfil inválido muestra un mensaje claro en español y no rompe la página.
- [ ] Con un perfil cargado, recargar la página no deja datos personales en `localStorage` (salvo que se marque «Recordar»).
- [ ] El escenario descargado no contiene el básico ni la oportunidad.
- [ ] Cada valor de la política se puede editar en Parámetros (en amarillo) y «Restaurar» vuelve a la fábrica.
- [ ] Las fórmulas solo se ven al pulsar «Ver fórmula». «Simulación. No es un pago oficial.» aparece en pantalla, en la impresión y en los archivos descargados.
- [ ] La impresión carta sale en 2 páginas o menos por simulación, sin cortes ni hojas en blanco.
- [ ] A 1366 × 768 no hay textos cortados, tarjetas apretadas ni desbordes horizontales.
- [ ] Los pendientes de la sección 11 se ven como avisos y como parámetros, no como reglas inventadas.

---

## 14. Qué me debes reportar al terminar

1. La lista de archivos creados, con una línea por archivo.
2. La salida completa de `npm test`: pruebas aprobadas, fallidas y omitidas; coincidencias con el Excel («N de N»); control de datos personales; humo (errores de consola y peticiones de red).
3. Una tabla con cada diferencia contra el Excel, su causa y si es esperada (7.3) o un error por corregir.
4. Capturas o descripción de: el resultado con el perfil de ejemplo, el modo director, un error de perfil y la impresión.
5. Las decisiones que tomaste y los pendientes de negocio que siguen abiertos.
6. Los pasos exactos para que Manuel genere los perfiles reales (`node herramientas/generar_perfiles.mjs --entrada privado/... [--cifrar]`) y los entregue **uno por persona por el canal interno de ANALFE**. Nunca por correo personal ni WhatsApp, y nunca el paquete completo.
7. Confirma que no abriste nada de `privado/` ni `salida_perfiles/`.

**Simulación. No es un pago oficial.**
