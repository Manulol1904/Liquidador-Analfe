# Correcciones para Cursor, ronda 4 (19/11/2026)

1. **Lectura de BTL_Eventos** (carga.js, `CAMPOS_BTL_EVENTOS`).
   - El evento debe ser `evento_id` o "#". Pon los alias en este orden: `['evento_id', '#', 'evento']`, para que nunca tome la columna del nombre.
   - Mapea las condiciones con alias exactos:
     - participacionComercial → 'participacion_material_comercial'
     - participacionDirector → 'participacion_material_director'
     - cierre → 'certificacion_financiera'
     - recaudo → 'meta_recaudo_alcanzada'
     - satisfaccion → 'satisfaccion_cliente'
   - Usa coincidencia exacta (`exacto: true`), así "recaudo" no toma "recaudo_octubre".
   - Si una celda de condición está vacía, déjala sin definir y no la pongas en falso, para que mande la casilla.
   - **Prueba:** al cargar parametros.xlsx, la fila 575 debe mostrar la utilidad presupuestada 92.699.872,906 sin escribirla a mano, y el director debe dar $3.852.459.

2. **Solo eventos BTL del mes.** En la pestaña BTL muestra solo los eventos que tengan al menos una fila del mes que se liquida. Guarda en `armarProduccion` un indicador `delMes: true` y filtra con él en `liquidarMes`, antes de `esEventoBtl`.

3. **Tabla BTL cortada.** Pon la tabla BTL dentro de un div con `overflow-x: auto`. Dale al campo de utilidad presupuestada `min-width: 14ch` y formato de miles al salir del campo.

4. **Vista previa de Producción.** Muestra primero los eventos del mes que se liquida.

Explícame cada cambio (archivo y función) antes de seguir.
