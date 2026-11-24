# Correcciones para Cursor · ronda v17 (encabezado de la ficha: 3 tarjetas en horizontal)

**Base:** v16. Si te falta, aplica antes `correcciones_cursor_v16.md`.

**Qué pidió Manuel:** que en el encabezado de la ficha de cada comercial se vean en horizontal, y en este orden, tres tarjetas:
1. Esquema anterior
2. Política nueva
3. BTL

Es solo presentación: **no se toca ningún cálculo**. Nunca escribas la clave del simulador.

## Archivos y cambios
Copia los 4 archivos de `ronda_v17_cursor.zip` encima del proyecto. Lleva también `cambios_v17_vs_v16.patch` como referencia.

### 1. `js/vistas.js`
- **Se borran** `lateral()` y `btlLinea()`. Antes eran la columna derecha: «¿Qué se paga este mes?», «BTL 5.11.5» y una tarjeta solo con «Avisos».
- **Se agregan** (hacia la línea 1319, antes de `cuerpoAnteriorPantalla`):
  - **`tarjetaPago({ titulo, monto, paga, lineas, extra, clase })`**: el componente común. Tiene título, monto grande, sello «Paga» si `paga` y de 2 a 4 líneas de detalle.
  - **`tarjetaAnterior(resultado)`**: muestra producción, cumplimiento y tasa del tramo. Si `comercial.tieneEsquemaAnterior === false` (ingreso nuevo), dice «No aplica». Si falta la meta, dice «Pendiente».
  - **`tarjetaNueva(resultado)`**: muestra score (con el mínimo), factor de pago y monto sin BTL.
  - **`tarjetaBtl(resultado)`**: muestra eventos, comisión BTL y director, o «Sin eventos BTL este mes». Si falta la utilidad del evento, conserva el aviso y los botones «Ir a Cargar datos» y «Ver detalle BTL».
  - **`encabezadoPagos(resultado)`**: arma la sección completa:
    - las 3 tarjetas;
    - una franja de resumen con «Diferencia (nueva − anterior)», «Transición oct–dic: el mayor de los dos» y «Básico + transición»;
    - debajo, `<details>` «Avisos (n)» en una sola línea colapsable.
- **Regla del sello «Paga»:** va donde `resultado.transicion.esquema` es `"anterior"` o `"nueva"`. Es la misma regla de transición de antes, «el mayor de los dos». BTL no lleva sello.
- **`htmlFicha()`** (hacia la línea 1868):
  - pon `${encabezadoPagos(resultado)}` justo después de `${subnav(resultado)}`;
  - quita el `<aside class="ficha-lateral">…</aside>`.

### 2. `css/estilos.css`
Bloque nuevo al final, «v17: encabezado de la ficha»:
- `.ficha-cuerpo` pasa a una sola columna;
- `.encabezado-pagos__tarjetas` es una rejilla de 3 columnas iguales;
- `.tarjeta-pago` lleva la variante `--paga` en verde, como el recuadro anterior;
- `.franja-resumen` y `.avisos-ficha--linea`;
- con `@media (max-width: 900px)` las tarjetas se apilan en el mismo orden.

### 3. `index.html` y `js/main.js`
Cambia la versión de caché `?v=20261120j` por `?v=20261122a`:
- en `js/main.js`, en el `import` de vistas;
- en `js/vistas.js`, en el `import` de exportarIndividual;
- en `index.html`, en `main.js` y en `estilos.css`.

Así Live Server no muestra la versión vieja.

### Director
La vista del director usa su propio bloque (`comparativo-esquemas`), no este componente. **No se cambió.** Si se quiere el mismo patrón ahí, va en otra ronda.

## Regenerar el HTML de doble clic
1. `npm install --no-save esbuild`
2. `node herramientas/empaquetar.mjs dist/Liquidador_ANALFE.html`

Debe imprimir «Control de datos personales: 0 de N valores…».

## Criterios de aceptación
1. En la ficha de cada comercial, debajo de las pestañas Resumen · 5.4 …, se ven tres tarjetas del mismo ancho en una fila, en este orden: **Esquema anterior · Política nueva · BTL 5.11.5**. No queda columna derecha.
2. El sello «Paga» aparece solo en la tarjeta que gana la transición. El monto pagado no cambia respecto a v16.
3. Debajo hay una franja con la diferencia, la regla de transición y básico + transición. Los avisos quedan en una línea «▶ Avisos (n)» que se abre y se cierra.
4. Con 900 px de ancho o menos, las tres tarjetas se apilan: anterior arriba, luego nueva y luego BTL.
5. Un comercial sin esquema anterior (ingreso nuevo) muestra «No aplica» en la tarjeta anterior y en la diferencia.
6. Las cifras no cambian. Octubre, con facturación, producción y encabezados:
   - la tabla Equipo es idéntica a v16;
   - el comercial de referencia de la prueba muestra anterior $2.639.910 (Paga), nueva $0 y básico + transición $8.315.829.
7. El HTML empaquetado abre por file://, no hace ninguna petición de red y no da errores de consola.
