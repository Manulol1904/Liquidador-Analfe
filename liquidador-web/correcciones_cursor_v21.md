# Correcciones v21 — lo que falta o quedó mal del rediseño v20

Contexto: revisé `liquidador-web-v20.zip` contra el prompt `prompt_cursor_rediseno_v20.md`. Las cifras, los cálculos y los Excel están bien y **no deben cambiar**. Casi todo el rediseño visual **no se aplicó**: `css/estilos.css` y `css/tokens.css` son idénticos a v19 y las pantallas se ven igual que antes. Además, falta la ronda v16 completa y se borró una caja que solo había que ocultar.

Haz los puntos en este orden. **No toques `js/calculos.js`, los exportadores Excel ni las plantillas `.xlsx`/mapeos.**

---

## 0) Primero: restaurar la ronda v16, que falta en tu proyecto

Tu proyecto no tiene la separación de datos personales de v16. Por eso hoy no se puede generar el HTML de doble clic sin meterle datos personales (el empaquetador encuentra 24 valores), y el Excel de noviembre o diciembre dice «Octubre» en el título.

- Copia **solo** estos 8 archivos del zip `ronda_v21_base_v16.zip`, sobrescribiendo los tuyos:
  - `herramientas/empaquetar.mjs`
  - `herramientas/separar_equipo.mjs`
  - `js/equipo_vacio.js`
  - `js/encabezados.js`
  - `js/recursos.js`
  - `js/excel/textosExcel.js`
  - `plantillas/textos_con_marcadores.json`
  - `.gitignore`
- **No** apliques el zip v16 entero: tiene versiones viejas de `carga.js`, `estilos.css`, los exportadores y el motor, y desharía v17–v19.
- Luego ejecuta una vez `node herramientas/separar_equipo.mjs`. Crea `js/equipo.js` (ignorado por git), deja `js/parametros.js` sin nombres, salarios ni metas personales, y agrega el bloque «equipo» al JSON de encabezados.

**Aceptación**
- `node herramientas/empaquetar.mjs` imprime «Control de datos personales: 0 de N».
- `js/parametros.js` no contiene nombres ni salarios.
- En el Excel individual de diciembre, `Liquidación!A1` y `Explicación!A1` dicen «Diciembre», no «Octubre».
- (Ya lo probé en una copia: con esos 8 archivos y el script, el HTML empaquetado da 0 datos personales y cifras idénticas.)

---

## 1) Tarjetas de la ficha comercial (no se hizo nada)

- **Línea BTL en la tarjeta «Esquema anterior»:** agregar «BTL (esquema anterior)» con su valor. En «Política nueva», agregar «BTL (política nueva)». Las dos líneas se muestran **solo si el comercial tiene eventos BTL ese mes**; sin BTL no aparece la línea, ni siquiera en $0.
- **Tarjeta BTL:** cada evento muestra lado a lado el valor con el esquema anterior y el valor con la política nueva (dos columnas o dos cifras por fila).
- **Estado vacío:** «Sin eventos BTL este mes» (hoy en `js/vistas.js` ~l.1508) necesita un icono y una tarjeta más baja.
- **Estilo:**
  - paleta azul marino y grises; verde solo para «Paga»;
  - radio 12 px y sombra suave en todas las tarjetas;
  - la franja resumen (`vistas.js` ~l.1546) con aspecto de barra de totales.

**Aceptación**
- Comercial sin BTL: no hay líneas BTL.
- Mismo comercial tras importar un evento BTL y marcar sus condiciones: aparecen las dos líneas, y la tarjeta BTL muestra anterior y nueva por evento.
- Quitar el evento hace que las líneas desaparezcan.

## 2) Menos texto técnico (no se hizo)

- Todas las fórmulas `<p class="formula">` van dentro de un desplegable «Ver fórmula», **cerrado por defecto**. Hoy hay 10 visibles, en `js/vistas.js` l.788, 802, 820, 833, 982–984, 1323, 1654 y 1709.
- Quitar o reducir los textos tipo registro:
  - «✓ Cuadra con Hoja4» con el total (`js/carga.js` l.619 y l.1075): basta con un ✓ y un tooltip;
  - «Columnas (n/m ✓) ▾» (`carga.js` l.989): mostrar solo «Columnas ▾» y un ✓;
  - «Se leyeron N eventos: …» (`js/cargaBtl.js` l.201): dejar «N eventos ✓»;
  - la columna `origen-celda` con «leído de… celda …» (`cargaBtl.js` l.100): ocultar o mover a «Ver detalle».
- El indicador único «Avisos (n)» ya existe; se mantiene.

**Aceptación:** al abrir una ficha no se ve ninguna fórmula ni referencia de celda hasta pulsar «Ver fórmula» o «Ver detalle».

## 3) Score y curva en horizontal (no se hizo)

- **A la izquierda, el score:**
  - número grande y una barra de 0 a 120 con marcas en 80, 90, 100, 110 y 120;
  - tramo bajo 80 en gris o rojo suave, escala azul de 80 a 120, y marcador en el score;
  - debajo: «Faltan X pts para 80» (si está bajo 80) o «Factor de pago Y %».
- **A la derecha, la tabla de la curva 5.8** **siempre visible**, con la fila del tramo actual resaltada. Hoy está dentro de un `<details>` «Ver curva», cerrado (`vistas.js` l.1374): quitar el desplegable.
- En pantallas angostas (800 px) se apilan: score arriba, curva abajo.

**Aceptación**
- A 1366 px, el score y la curva quedan uno al lado del otro.
- A 800 px quedan apilados y sin scroll horizontal.
- La fila resaltada corresponde al score.

## 4) Director con el mismo diseño (no se hizo)

- Las mismas tarjetas, el bloque score + curva del punto 3, y las secciones 5.4–5.7 con su columna de puntos y el mismo estilo de tabla.

**Aceptación:** la vista del director usa los mismos componentes y clases que la ficha comercial.

## 5) Cargar (quedó mal)

- **Nombres de las cajas:**
  - la caja «Facturación» (`carga.js` ~l.841) pasa a llamarse «Producción»;
  - la caja «Producción» (~l.846) pasa a llamarse «Márgenes de eventos».
  - Solo cambia el texto visible; los ids de los `<input>` se mantienen.
- **Caja BTL_Eventos (error):** se **eliminó** la caja «Parámetros BTL (opcional)» con toda su lógica: `#archivo-btl`, `tomarBtlEventos`, `fijarEventosBtl`, `btlEventosManual` y el manejo de soltar archivo. El prompt pedía preguntar y, como propuesta, **ocultarla en «Opciones avanzadas»**, no borrarla.
  - Restaura esa caja y su lógica tal como estaban en v19: `carga.js` v19 l.852, 1161, 1184–1214, 1255–1261 y 1396, e importar `fijarEventosBtl`.
  - Ponla dentro de un desplegable «Opciones avanzadas», cerrado por defecto.
  - Hoy `vistas.js` l.160 sigue llamando a `obtenerBtlEventos()`, que quedó siempre vacío.
- La caja de encabezados se queda como está.
- **Grilla:** todas las cajas del mismo tamaño en una grilla. Cada una con icono, título, una línea de ayuda corta y el estado «Cargado ✓ nombre-del-archivo».

**Aceptación**
- Cargar un archivo BTL_Eventos desde «Opciones avanzadas» vuelve a funcionar como en v19.
- Las cajas miden lo mismo a 1366 px y pasan a una columna a 800 px.

## 6) Armonía general (no se hizo)

- **Variables CSS:** definir en `css/tokens.css` exactamente estas: `--color-primario`, `--gris-1` a `--gris-5`, `--exito`, `--alerta`, `--radio` (12px), `--sombra` y `--espacio-1` a `--espacio-6`.
  - Pueden ser alias de los tokens actuales, por ejemplo `--gris-3: var(--color-neutro-300)`, `--radio: 12px`, `--sombra: var(--sombra-tarjeta)`.
  - Úsalas en el CSS nuevo.
- **Sin colores sueltos:** reemplazar los hex directos de `css/estilos.css` por variables. Están en l.3373, 3374, 3504 (fallback), 3513, 3529, 3547, 3548, 3550 y siguientes hasta ~3556; revisa con `rg -n "#[0-9a-fA-F]{3,6}\b" css/estilos.css`.
- **Tipografía del sistema:** `font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **800 px:** hoy el título del encabezado se corta. Debe verse completo (envolver o reducir el tamaño).

**Aceptación**
- `rg -n "#[0-9a-fA-F]{3,6}\b" css/estilos.css` devuelve 0 líneas; los hex solo viven en `tokens.css`.
- Sin cortes ni scroll horizontal a 1366 y 800 px.

---

## Criterios de aceptación generales (no negociables)

1. **Cifras idénticas** con los archivos de octubre:
   - los 7 comerciales con el mismo score y pago que antes;
   - diciembre con el mismo resultado que antes (el comercial de diciembre, score 55,00);
   - director 84,45 puntos y $6.193.107;
   - con el evento BTL sintético de prueba importado y sus condiciones marcadas, director $3.852.459.
2. `js/calculos.js` sin cambios (diff vacío). Los Excel exportados (ficha y director, con y sin BTL) tienen los mismos valores y fórmulas, 0 errores, y solo cambia el título del mes según el punto 0.
3. **0 errores en consola y 0 peticiones de red**. El HTML empaquetado (`node herramientas/empaquetar.mjs`) abre con doble clic (file://) y funciona completo.
4. **Sin datos personales** en el código ni en el HTML: el empaquetador dice «0 de N», y `js/equipo.js` y el JSON de encabezados no se suben a git.
5. Entregar el zip con la misma estructura de carpetas (rutas con `/`, no `\`).
