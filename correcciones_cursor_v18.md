# Correcciones para Cursor · ronda v18 · Eventos BTL desde archivo (y a mano como opción secundaria)

> **Simulación. No es un pago oficial.** Esta ronda **no cambia ninguna regla de cálculo**. Solo agrega de dónde llegan los datos del evento BTL (núm. 5.11.5).
> No pegues datos reales en el código. Los archivos de prueba de `pruebas/` son sintéticos.

## Qué se pidió
"Que lea los archivos de BTL para traer la data, o en su efecto tener donde ingresar la data a mano, como opción seleccionable pero no siendo la opción principal."

## Cómo funciona ahora
1. En **1 Cargar** hay una sección nueva, **«Eventos BTL · 5.11.5»**, con una zona para arrastrar uno o varios Excel de liquidación o ejecución de eventos.
2. Por cada archivo, la app:
   - busca la hoja que tiene la etiqueta **EXCEDENTE NETO** (el nombre de la hoja puede cambiar);
   - ubica las columnas por su encabezado **PRESUPUESTO** / **EJECUCIÓN** (si no los encuentra, usa F y H, como el modelo);
   - ubica las filas por su **etiqueta**, sin importar mayúsculas, tildes o espacios (las filas cambian entre eventos);
   - lee el **valor guardado** de las celdas, aunque tengan fórmulas a otro libro (`[2]Costos!C18`). No recalcula nada.
3. Del archivo se usan solo tres datos para el cálculo:

   | Dato de la app | Sale de | Ejemplo (archivo sintético) |
   |---|---|---|
   | ingreso | TOTAL INGRESOS · EJECUCIÓN | H10 |
   | costo | TOTAL COSTOS · EJECUCIÓN (si falta: fijos + variables) | H41 |
   | utilidad presupuestada | EXCEDENTE NETO · PRESUPUESTO | F54 |

   - La utilidad real y el margen los sigue calculando la app con ICA y 4×1000 de Parámetros, igual que antes.
   - El excedente neto del archivo se muestra solo para comparar.
   - Topes, porcentajes y condiciones salen de Parámetros y del panel 5 BTL, sin cambios.
4. El **mes** sale de la fecha del encabezado ("octubre 23 de 2026" → Octubre 2026) y se puede cambiar.
5. El archivo no dice el comercial, así que se elige en **«Comercial responsable»**. Hay casillas para **«También participaron»** (solo informativas: la política no define el reparto).
6. Si el evento ya está en el informe de Producción, se une con **«Evento del informe de Producción»**. Así ese # toma los datos del archivo y no se cuenta dos veces.
   - La app propone la unión sola cuando el ingreso coincide con un único evento BTL de Producción.
7. **Opción secundaria:** `<details>` **«Ingresar un evento a mano (opción secundaria)»** agrega un evento con los mismos campos vacíos, en celdas amarillas.
8. Lo que falta se marca en amarillo con contorno y se lista ("Falta: comercial responsable…").
9. El **origen** se ve en:
   - la tarjeta **BTL 5.11.5** de la ficha (línea «Origen: Archivo X.xlsx / A mano / Informe de Producción»);
   - el panel **5 BTL**, debajo del #.

## Archivos (copiar tal cual sobre la versión v17)
| Archivo | Cambio |
|---|---|
| `js/btlArchivos.js` | **Nuevo.** Lectura del Excel del evento (`leerEventoBtl`), etiquetas (`CAMPOS_BTL`), mes desde la fecha (`mesDeFecha`), lista de eventos importados o a mano, `unirEventos` (los mezcla con los de Producción) y `sincronizarParametrosBtl` (fila en `parametros.btl.eventos` para el Excel y la comisión BTL anterior informativa). |
| `js/cargaBtl.js` | **Nuevo.** La sección de Cargar: zona de archivos (`data-zona-btl`, distinta de `data-zona`), tarjeta por evento con vista previa y celda de origen, selectores, opción a mano y avisos. |
| `js/carga.js` | Importa los dos módulos. `obtenerEventos()` devuelve Producción **más** los eventos importados del mes elegido (l. 78). Nueva `obtenerEventosProduccion()` (l. 86). `${htmlSeccionBtl()}` en la plantilla (l. 863). `iniciarSeccionBtl(...)` después de `pintarNotaEncabezados()` (l. 1245). |
| `js/vistas.js` | En `armar()`: si el evento trae `origenBtl`, la utilidad presupuestada del archivo gana sobre la hoja BTL_Eventos (lo escrito a mano en 5 BTL sigue ganando). Nueva `origenesBtl()` y línea «Origen» en `tarjetaBtl`. Detalle y origen debajo del # en el panel 5 BTL. Caché `?v=20261122b`. |
| `css/estilos.css` | Bloque «v18» al final (sección, tarjetas de evento, tabla, opción a mano). Los avisos largos de la tarjeta BTL ya no se salen. |
| `index.html`, `js/main.js` | Solo la versión de caché `20261122b`. |
| `pruebas/*.xlsx` | Archivos **sintéticos**: modelo (hoja «FEDESCO 2026», 3 celdas con fórmula externa), desplazado (otra hoja, filas y columnas corridas, etiquetas sin tilde) e incompleto (sin fecha ni excedente presupuestado). |

**No** se tocaron `calculos.js` ni los exportadores: el Excel toma el evento por la misma vía de siempre (`obtenerEventos()` y `parametros.btl.eventos`).

Para el HTML de Financiera: `node herramientas/empaquetar.mjs Liquidador_ANALFE.html` (el control de datos personales debe decir «0 de N»).

## Criterios de aceptación (probados en Chrome, doble clic, file://)
- [x] Sin archivos BTL, todas las cifras quedan iguales a v17 (Equipo, fichas, panel BTL).
- [x] El archivo modelo se lee:
  - mes Octubre 2026; ingreso $410.580.000; costo $312.060.157 (celda con fórmula externa); utilidad presupuestada $92.308.580;
  - celdas F10/H10, H41, F54 visibles.
- [x] El archivo desplazado (hoja «LIQUIDACION EVENTO», columnas E/G, filas +4, «Excedente Neto:») da los mismos valores. El mes sale de «23 de octubre de 2026».
- [x] El archivo incompleto marca «Falta: mes del evento, excedente neto (presupuesto), comercial responsable».
- [x] Asignar el evento nuevo a un comercial:
  - su ficha muestra «Eventos 1 (ARCHIVO 2) · Origen Archivo …»;
  - su Excel trae el evento en `_Margenes_especiales` fila 6 y en `Escenarios` B133/B134;
  - 0 errores al recalcular.
- [x] Unido al # de Producción: la ficha dice «Origen Archivo …». La utilidad calculada pasa de «Pendiente» a $93.305.218 (margen 22,73 %, cumplimiento 101,08 %), y el evento no se duplica.
- [x] Con las cinco condiciones marcadas, el director cobra $3.852.459 (0,25 IMR, tope por evento de Parámetros). El comercial queda en $0 por score < 80.
- [x] Evento a mano: 100.000.000 / 70.000.000 / 25.000.000 → utilidad $28.753.956, margen 28,75 %, origen «Ingresado a mano».
- [x] 0 errores en consola y 0 peticiones de red.

## Pendiente de confirmar con la jefa (no se programó)
- ¿Cómo se reparte un evento entre varios comerciales? Hoy liquida solo el responsable.
- Reglas del archivo «Topes IMR» que la app no tiene, como el reparto 90/10, el 27 %/3 %, la carga prestacional dentro del tope y el margen ≥ 20 %. Ver el informe de la ronda.
