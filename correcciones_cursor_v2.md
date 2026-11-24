# Correcciones para Cursor, ronda 2 (19/11/2026)

Aplícalas una por una. Después de cada una, explícame qué cambiaste (archivo y función) y cómo probarlo.

R1. **El archivo real no trae el evento (alto).** La facturación real no tiene columna de evento. Permite unir factura con evento usando el informe de eventos: si el informe trae una columna "Factura" (o "Facturas", con varias separadas por coma), arma un mapa factura → evento y úsalo cuando la fila no tenga evento. Si aun así falta, deja la factura Pendiente con un aviso. Agrega también un campo opcional en Parámetros, "Factor de margen por defecto", vacío por defecto, para simular.

R2. **El esquema anterior no filtra por mes (medio).** En el esquema anterior (comerciales y director) incluye las filas de la hoja elegida cuya fecha esté en el mes, más las que no tienen fecha (con aviso). Excluye las que tienen fecha de otro mes.

R3. **La pestaña BTL muestra todos los eventos (medio).** Muestra solo los eventos que sean BTL: los que tengan utilidad presupuestada o estén marcados como BTL. Los demás solo sirven para el margen.

R4. **Base social redondeada (bajo).** Muestra los puntos de base social con 2 decimales. Lo que va sin decimales es el cierre y la meta.

R5. **Un solo estado para todo el evento BTL (bajo).** Devuelve `estadoComercial`/`motivoComercial` y `estadoDirector`/`motivoDirector` por separado, y muestra cada uno bajo su pago.

R6. **Columnas aplastadas en Parámetros (bajo).** Dale `min-width: 11ch` a todas las celdas numéricas de `tabla-metas` (Básico, Oportunidad, IMR, Base 30 sep), no solo a las metas.

R7. **Nombres internos y avisos repetidos (bajo).** Traduce el esquema con un diccionario (nueva → "Política nueva", anterior → "Esquema anterior", pendiente → "Pendiente") en vistas.js y en exportar.js. En las tarjetas del equipo, agrupa los avisos: "6 facturas sin fecha", con un botón para ver la lista.

R8. **Casillas BTL que no se guardan (bajo).** No marques "Cambios sin guardar" al cambiar las casillas BTL, o guárdalas en localStorage por evento.

R9. **Importar JSON descarta comerciales nuevos (bajo).** En `combinar`, agrega al final los comerciales que vengan en lo guardado y no estén en los valores iniciales.

R10. **Diana pendiente en su primer mes (bajo).** En el primer mes de un comercial sin base social medida, deja la base social neutral al 100 % (núm. 5.10), con la nota "Neutral: primer mes".

R11. **Nombres de hoja fijos.** Saca a parámetros los textos "mision" y "btl" que se usan para reconocer las hojas (calculos.js y carga.js).

---
## R1 detallada: usar el informe de producción como informe de eventos

El informe de producción (Excel con la hoja **PRODUCTOS**) trae una línea por factura. Las columnas son:
- `Mes`: ej. "OCTUBRE"; puede traer espacios al final.
- `#`: número del evento dentro del mes. Ojo, hay **dos** columnas llamadas "#"; usa la primera, la columna C.
- `GRUPO`, `SUB GRUPO`, `PRODUCTO`, `DETALLE`.
- `FONDO` y `ASESOR`.
- `FACTURA`: ej. "FV FEC 13541".
- `INGRESO`.
- `COSTO TOTAL`: ya incluye los costos generales y el prorrateo de comisiones.

Instrucción para Cursor:
"En carga.js, permite cargar el informe de producción y elegir la hoja PRODUCTOS. Mapea Mes, Evento (la PRIMERA columna llamada '#'), Factura, Ingreso y Costo total. Normaliza Mes y Factura con trim, mayúsculas y espacios simples. La clave del evento es `MES + '|' + #`. Luego:
1. Arma `eventos`: suma de ingreso y de costo total por clave, y calcula el margen con `calcularMargen(ingreso, costo)`.
2. Arma `facturaAEvento`: mapa de factura normalizada a clave de evento, solo con las filas del mes que se liquida.
3. En la facturación, si una fila no tiene evento, búscalo con `facturaAEvento[factura]`. Si no aparece, deja la fila Pendiente con un aviso.
4. Muestra en la vista previa cuántas facturas se unieron (con octubre deben ser 204 de 204).
Explícame cómo quedó la unión antes de seguir."

Pregunta pendiente: ¿el `COSTO TOTAL` de este informe ya incluye el ICA y el GMF? Si no los incluye, la app los descuenta aparte. Si ya los incluye, se descontarían dos veces. Confirmarlo con la jefa o con Financiera.
