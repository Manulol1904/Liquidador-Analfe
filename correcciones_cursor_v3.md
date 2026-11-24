# Correcciones para Cursor, ronda 3 (19/11/2026)

Corrige la R1:

1. En `CAMPOS_EVENTOS`, el costo debe mapear la columna "COSTO" (col R, costo directo), NO "COSTO TOTAL". Quita "costo total" de los aliases de costo. `calcularMargen` sigue restando ICA y GMF.
2. En `armarProduccion`, la clave del evento es solo el "#" (consecutivo anual), sin el mes. Suma ingreso y costo de TODAS las filas de ese "#" en cualquier mes, y arma `facturaAEvento` solo con las filas del mes que se liquida.
3. Guarda en cada evento el grupo y el producto de su primera fila, para que `esEventoBtl` reconozca GRUPO "BTL".
4. La utilidad presupuestada de los BTL no viene en la producción. Toma `utilidad_presupuestada` (y las condiciones, si las hay) de la hoja `BTL_Eventos` de `parametros.xlsx`, o de un campo editable por evento en la pestaña BTL. Si falta, muestra "Pendiente: falta utilidad presupuestada".
5. Si hay eventos pero ninguno es BTL, muestra "No hay eventos BTL este mes" en vez de "Carga el informe de eventos".
6. En la vista previa, formatea ingreso y costo con `moneda()`.
7. Genera las advertencias del informe de producción solo para las filas del mes que se liquida.
8. En el motivo BTL del comercial, muestra "Score X < 80".

**Prueba.** Octubre debe dar:
- Scores: Carolina 53,51 · Consuelo 61,41 · Hernando 71,98 · Leidy 41,90 · Lynette 57,08 · Oriette 55,34 · Tatiana 58,41.
- Director: 91,83 / $7.208.412.
- FEDESCO, director: $3.852.459.

Explícame cada cambio (archivo y función) antes de seguir.
