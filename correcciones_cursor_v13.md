# Correcciones v13 · Encabezado del Excel individual con los datos correctos de cada comercial

## Resultado (primero)
- Ya probado en una copia de v11 (`src_v13`): **los 7 Excel salen con el encabezado igual al v6.7** (nombre oficial, documento, cargo, salario base, IMR, ingreso máximo 120 %, Q1/Q2 y su valor). 0 diferencias en C3, C4, C5, F6, I3, I4, I5 e I6, con los dos caminos (Live Server leyendo el archivo solo, y botón «Cargar encabezados»).
- Los datos salen de un archivo local nuevo: `datos/encabezados_comerciales.json`. **No se escribe ningún dato en el código.** El IMR y el 120 % no se guardan: se calculan.
- Falta aparte (no es el encabezado): el verificador `verificar_excel_individual.mjs` todavía dice ✗ en los 7 por el cuerpo del libro (márgenes, facturas, _Datos, BTL anterior en «Comisión anterior»). Ver punto 6.

## 1. Por qué salía mal (diagnóstico)
Lo que salía en v11 (los 7 comerciales):
| Celda | Salía | Debe salir |
|---|---|---|
| C3 Nombre | nombre corto de la app («Leidy Lizcano») | nombre oficial («Leydy Lizcano Guerrero») |
| C4 Documento | «2026» | número de documento (texto) |
| C5 Cargo | otra vez el nombre | «Ejecutivo Comercial II – Santander» |
| F6 | «T4 2026» | Q1 o Q2 (tipo de referencia de mercado) |
| I6 | 15.500.000 | valor de la referencia de mercado |
| I3, I4, I5 | bien | bien |

Causa, línea por línea:
- `js/exportarIndividual.js:180` escribía el trimestre en F6. `:181` escribía `mision.valorFacturaNueva` en I6.
- `js/exportarIndividual.js:344` mandaba C3, C4 y C5 a los textos con marcadores. En `js/excel/textosExcel.js` C3 = `{persona}` (nombre corto) y C4 = `{numero}` (el año).
- `js/exportarIndividual.js:350` armaba C5 con `cargo · nombre`. Como el cargo está vacío, quedaba el nombre.
- `js/parametros.js:242-257` (`persona()`) crea a todos con `documento: ""` y `cargo: ""`. La app nunca tuvo esos datos.
- **Error nuestro en v12:** la tabla de mapeo de la Fase 1 decía «F6 = trimestre» e «I6 valor fijo». Estaba mal: F6 es el tipo de referencia de mercado (Q1/Q2) e I6 su valor. Esta v13 lo corrige.

## 2. Datos correctos por comercial (fuente: cada v6.7 individual y la matriz)
Todos coinciden 100 % entre el Excel v6.7 (hoja Liquidación) y la matriz individual (`fichas.py`, sacado de cada .docx).
| Comercial (nombre en la app) | C3 nombre oficial | C4 documento | C5 cargo | Básico | Oportunidad | IMR (calc.) | Máx. 120 % (calc.) | F6 | I6 |
|---|---|---|---|---|---|---|---|---|---|
| Carolina Gómez | Carolina Gómez Muñoz | 44003845 | Director Regional III – Antioquia | 5.675.919 | 5.961.057 | 11.636.976 | 12.829.187,4 | Q2 | 11.795.544 |
| Consuelo Castro | Maria Consuelo Castro Patiño | 42114104 | Director Regional II – Eje Cafetero | 5.675.919 | 3.250.736 | 8.926.655 | 9.576.802,2 | Q1 | 9.337.638 |
| Hernando Rozo | Hernando Rozo | 79601046 | Ejecutivo Comercial Senior III – Central | 5.735.449 | 8.948.732 | 14.684.181 | 16.473.927,4 | Q2 | 5.996.491 |
| Leidy Lizcano | Leydy Lizcano Guerrero | 63526328 | Ejecutivo Comercial II – Santander | 3.272.418 | 2.479.618 | 5.752.036 | 6.247.959,6 | Q2 | 5.996.491 |
| Lynette Arango | Lynette Astrid Arango Bedoya | 66950651 | Director Regional III – Occidente | 5.675.919 | 5.600.461 | 11.276.380 | 12.396.472,2 | Q2 | 11.795.544 |
| Oriette Henríquez | Oriette Hernandez | 32848239 | Director Regional II – Costa Caribe | 5.735.450 | 3.328.175 | 9.063.625 | 9.729.260 | Q1 | 9.337.638 |
| Tatiana Acuña | Cindy Tatiana Acuña Ortiz | 1023881565 | Ejecutivo Comercial Junior III – Central | 2.732.641 | 5.917.256 | 8.649.897 | 9.833.348,2 | Q2 | 5.996.491 |

Fuentes (también van dentro del JSON, campo `fuentes`):
- `Liquidacion_Oct2026_<Nombre>_v6.7.xlsx`, hoja Liquidación: C3, C4, C5, F6, I6. Control: I4 (= básico + oportunidad) e I5 (= básico + (IMR − básico) × Tope_pago).
- Mismo libro: básico y oportunidad en los nombres `C_<Nombre>_basico` y `C_<Nombre>_opp` (hoja Escenarios).
- Matriz individual de cada uno (archivo .docx citado en `fichas.py`).

Ojo:
- **Oriette:** la matriz y el v6.7 dicen «Oriette **Hernandez**». En la app se llama «Oriette **Henríquez**». No lo cambié: el Excel lleva el nombre de la matriz y la app sigue buscándola por su nombre. **Manuel debe confirmar cuál es el correcto.**
- **Diana Marcela Reyes** (entra en 2026-12): no hay matriz ni v6.7. No está en el JSON. Si se exporta, C3 queda con su nombre de la app y C4, C5, F6 e I6 vacíos, y la app avisa «falta…».
- El nombre largo de la referencia («Mediana de mercado (Q2)» / «Primer cuartil de mercado (Q1)») viene de la matriz. Va en el JSON como dato informativo. El Excel v6.7 solo muestra Q1/Q2.

## 3. El archivo de datos: `datos/encabezados_comerciales.json`
Un objeto por comercial. La llave es `nombre` = el nombre del comercial en Parámetros (el mismo que usa la app). Se compara sin tildes ni mayúsculas.
```json
{
  "_aviso": "DATOS PERSONALES ... No compartir ...",
  "version": 1,
  "mes": "2026-10",
  "comerciales": [
    {
      "nombre": "Hernando Rozo",
      "nombreOficial": "Hernando Rozo",
      "documento": "79601046",
      "cargo": "Ejecutivo Comercial Senior III – Central",
      "basico": 5735449,
      "oportunidad": 8948732,
      "referenciaMercado": { "tipo": "Q2", "nombre": "Mediana de mercado (Q2)", "valor": 5996491 },
      "control": { "imr": 14684181, "ingresoMaximo": 16473927.4 },
      "fuentes": { "documento": "Liquidacion_Oct2026_Hernando_v6.7.xlsx Liquidación!C4", "...": "..." }
    }
  ]
}
```
- `documento` va como **texto**, para no perder ceros ni salir en notación científica.
- `control` **no se usa para calcular**. Solo sirve para revisar: si básico + oportunidad ≠ IMR, o si el 120 % no da, la app muestra un aviso.
- Si un dato falta, va `null` y la app avisa. Nunca se inventa.

## 4. Cómo se conecta (archivos nuevos y cambios)
Archivos nuevos:
- `js/encabezados.js`:
  - `aplicarEncabezados(datos)`: valida, une con `parametros.comerciales` (nombreOficial, documento, cargo, básico, oportunidad, referenciaMercado) y deja avisos.
  - `cargarEncabezadosLocales()`: hace `fetch("datos/encabezados_comerciales.json")`. Con Live Server lo lee solo. Si no existe o es `file://`, no pasa nada (en la consola sale un 404, normal).
  - `cargarEncabezadosDeArchivo(archivo)`: para el botón.
  - `encabezadoDe(comercial)`: devuelve el encabezado vigente. Primero mira el archivo; si no hay, usa lo escrito en Parámetros. Guarda en memoria el último archivo cargado, así que «Restaurar» o «Importar JSON» de parámetros no lo borran.
- `datos/encabezados_comerciales.json` (los datos) y `.gitignore`, que lo excluye.

Cambios:
- `js/main.js`: al final llama `cargarEncabezadosLocales()`.
- `js/carga.js`: tarjeta nueva en «Cargar datos», «Encabezados de los comerciales (opcional)», con el botón «Cargar encabezados (.json)» (`#archivo-encabezados`) y la nota `#nota-encabezados` («Encabezados de 7 comerciales…» y los avisos).
- `js/exportarIndividual.js`, en `celdasNumero`:
  ```js
  const encabezado = encabezadoDe(comercial);
  set("Liquidación", "C3", encabezado.nombreOficial || null);
  set("Liquidación", "C4", encabezado.documento || null);
  set("Liquidación", "C5", encabezado.cargo || null);
  set("Liquidación", "F6", encabezado.referenciaMercado.tipo);
  set("Liquidación", "I6", encabezado.referenciaMercado.valor);
  ...
  set("Escenarios", "C111", encabezado.basico);
  set("Escenarios", "D111", encabezado.oportunidad);
  ```
  - Se quitan C3, C4 y C5 de la lista de textos con marcadores (línea 344) y se borra la línea 350.
  - I3, I4 e I5 siguen siendo las fórmulas de la plantilla: no se escriben números ahí.
- `js/vistas.js`: la ficha (pantalla, línea ~1980, e impresión, línea ~603) muestra «cargo · documento · mes» con `encabezadoDe`.
- Opcional, para limpiar: en `textosExcel.js` y `plantillas/textos_con_marcadores.json` ya no se usan las entradas `Liquidación!C3/C4/C5`. Se pueden borrar.

## 5. Privacidad
- El JSON tiene documento y salario: **es dato personal**. Vive solo en la carpeta del proyecto de Manuel. No se sube a internet ni a repositorios, y no se manda por correo ni chat. `.gitignore` ya lo excluye.
- La plantilla `plantilla_liquidacion_individual.xlsx` **sigue sin datos reales** (revisado: no tiene nombres ni documentos).
- Cada Excel exportado lleva **solo** el encabezado de ese comercial (los datos se escriben por comercial al exportar).
- La protección del libro sigue con la clave del simulador, que se pide al exportar y no se guarda.

## 6. Aceptación
1. Con Live Server, abrir la app y verificar que «Cargar datos» dice «Encabezados de 7 comerciales (datos/encabezados_comerciales.json)» sin avisos. Sin Live Server, usar el botón «Cargar encabezados (.json)».
2. Exportar los 7. En cada uno, Liquidación C3, C4, C5, F6, I3, I4, I5 e I6 = el v6.7 individual (tabla del punto 2). **Probado: 0 diferencias en los 7.**
3. C4 es texto (probado: tipo texto en los 7).
4. Ficha de Hernando: «Ejecutivo Comercial Senior III – Central · 79601046 · Octubre 2026». Probado.
5. Sin archivo de encabezados, no se rompe nada: C3 = nombre de la app, el resto vacío, con aviso.
6. `node herramientas/verificar_excel_individual.mjs <v6.7> <generado> --lib lib` debe decir **✓ IGUALITO**. **Hoy dice ✗ en los 7**, por el cuerpo del libro, no por el encabezado. Pendiente de Fase 1 de v12, por ejemplo en Hernando:
   - `Comisión anterior!T5` sin fórmula del BTL anterior, y Liquidación C26/C27/N25/N27 en 0 (deben ser 410.580.000 y 15.602.040);
   - _Datos sin fórmulas M/V/AF/AG hacia «Márgenes eventos» y sin validaciones ni comentarios en las filas nuevas;
   - filas de «Márgenes eventos» y «Facturas» corridas (combinadas y estilos de la fila total);
   - nombres `Cartones_/Meta_Cultural_Dic_` del director con el nombre del Diana/Juan cambiado;
   - B96 de Escenarios con formato %.

   Sin el encabezado, Hernando tenía 4.747 valores distintos; con el encabezado, 4.739. Las 8 celdas del encabezado ya cuadran.

## 7. Auditoría rápida de la ronda 12 (en src_v11)
- BTL anterior en la app: Hernando **$15.602.040** (410.580.000 × 3,8 %) ✓. Director **$2.586.654** (0,63 % × 410.580.000) ✓. **En el Excel exportado todavía sale 0** (punto 6).
- 2 decimales: ✓ (`porcentaje(valor, decimales)` con `parametros.formato.decimalesPorcentaje = 2`; se ve 82,18 %, 1,50 %, 0,63 %).
- Valores fijos: ✓ en lo pedido. 27209, Hoja4, mes de origen y tolerancia ya están en Parámetros, y las anclas 80/100/120 ya no están escritas en `vistas.js`. Quedan solo textos de etiqueta («Hoja4» en los avisos) y la regla del 100 % (`cumplimiento < 1`), que es la regla de la política, no un dato.
- Verificador en los 7: ✗ (punto 6).

## 8. No hacer
- No escribir nombres, documentos, cargos ni salarios en el código ni en la plantilla.
- No guardar el IMR ni el 120 % como números: se calculan.
- No cambiar a «Hernandez» el nombre de Oriette en la app sin la confirmación de Manuel.
