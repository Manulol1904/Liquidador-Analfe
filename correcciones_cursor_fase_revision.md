# Correcciones para Cursor (revisión del 19/11/2026)

Aplica estas correcciones UNA POR UNA. Después de cada una, explícame qué cambiaste (archivo y función) y cómo probarlo. No toques nada más.

1. **Director pendiente si faltan ventas** (calculos.js, `metodosDirector`). Si el arreglo `faltantes` no está vacío, `scoreTotales` debe ser `null`. Así el director queda "Pendiente" y no se compara con el esquema anterior.

2. **Lectura de la facturación real** (carga.js `filasDelMes` / `hojasComplementarias`; calculos.js). Guarda en cada fila la hoja de donde salió (`fila.hoja`). Para el esquema anterior del director y de los comerciales usa solo las filas de la hoja de facturación elegida, aunque no tengan fecha. Descarta las filas de totales (asesor vacío). Las hojas de Misión y BTL úsalas solo para el recaudo de la política nueva. Muestra una advertencia por cada fila sin fecha.
   Prueba: con el archivo de octubre, la base sin BTL debe dar $236.347.640, la de BTL $410.580.000 y la comisión anterior del director $3.545.214,60.

3. **Margen por evento**. Agrega la columna "Evento" al mapeo de facturación. Calcula el margen de cada evento con `calcularMargen(ingreso, costo)` usando el informe de eventos, y aplica `factorMargen` a cada fila según su evento. Si la fila no tiene evento, déjala "Pendiente" con un aviso. Quita el promedio ponderado por comercial.
   Prueba: los scores deben dar Carolina 53,51, Consuelo 61,41, Hernando 71,98, Leidy 41,90, Lynette 57,08, Oriette 55,34 y Tatiana 58,41.

4. **Misión en el esquema anterior** (calculos.js). No sumes un valor fijo por Misión. Incluye las líneas de Misión de la hoja de facturación como cualquier otra línea: base × % comisión.
   Prueba: Carolina $2.584.400 y Hernando $4.729.224.

5. **Condiciones BTL separadas**. Separa `participacionComercial` y `participacionDirector`, cada una con su propia casilla. El score del comercial solo bloquea el pago del comercial, y el score del director solo el del director.

6. **Seguridad (XSS)**. Crea `escaparHtml(texto)` en `js/utilidades.js` (que reemplace & < > " ') y úsala en todo valor que venga de un archivo o del JSON antes de meterlo en `innerHTML`.

7. **Indicadores del director** (calculos.js). Calcula SERFISCAL, innovación y satisfacción del director con los datos del equipo. Si no hay medición, quedan neutrales.

8. **Refresco de la pantalla** (parametros.js). Después de cada cambio de `director.metodo` o `director.regla100`, de importar y de restaurar, dispara `document.dispatchEvent(new Event('liquidacion-actualizada'))`.

9. **README**. Corrige el README: la app debe abrirse con Live Server, porque con doble clic Chrome bloquea los módulos. Actualízalo a las 8 fases.

10. **Quitar valores fijos**. Mueve a parámetros:
    - el mapeo de cuentas a producto;
    - el mes de la meta cultural;
    - `tieneEsquemaAnterior: false` por comercial, en vez de buscar el texto "diana";
    - los umbrales del BTL (0,9 / 1 / 0,05 / 0,10 / 0,15).
    Usa `metaOctubrePorComercial` o bórralo.

11. **Diana**. Pon el básico 3500000 y la oportunidad 2252036, y agrega el prorrateo de metas por días trabajados en su primer mes.

12. **Datos guardados**. Al cargar, combina lo guardado con `PARAMETROS_INICIALES` y valida la forma. "Restaurar" y "Borrar" hoy hacen lo mismo: deja uno o explica la diferencia.

13. **CDN**. Agrega `integrity` y `crossorigin="anonymous"` a los scripts del CDN, o guarda las librerías en `/lib`.

14. **Detalles**:
    - Calcula los puntos de base social sin redondear; solo se muestran sin decimales.
    - Acumula el tope de 10 puntos de innovación por trimestre.
    - No des los 3 puntos de primera venta si la oferta no fue aprobada.
    - Cuenta facturas de Misión, no filas.
    - Guarda las casillas BTL por evento, no por posición, y límpialas al cargar otro archivo.
    - Agrega "Simulación. No es un pago oficial" al Excel exportado.
    - Marca el punto del comercial en la gráfica y las anclas 80/90/100/110/120 en la barra.

## Correcciones adicionales (prueba por la pantalla con archivos reales)

15. **Mapeo de columnas** (carga.js, `indiceSugerido`). La coincidencia parcial debe preferir el encabezado que *empieza* por el alias, y nunca uno que ya usa otro campo. Si hay dos candidatos, deja "No usar" y muestra un aviso para que yo elija. Hoy "Cliente" quedó en `satisfaccion_cliente`.

16. **Advertencias de carga** (carga.js, `advertenciasFacturacion`). Agrega dos advertencias: "Fila N: no tiene fecha de facturación" y "Fila N: no tiene asesor (¿fila de totales?)". Excluye las filas de totales del cálculo y dilo en la vista previa.

17. **Detalle del director** (vistas.js). En la pestaña Director agrega una tabla de indicadores igual a la del Detalle, con los datos de `director.puntos` y `director.detalleVentas`: ventas, base social (cierre / meta), SERFISCAL, innovación, satisfacción y el total.

18. **Tarjetas desalineadas** (css/estilos.css). Limita la regla `.tarjeta + .tarjeta` a las tarjetas que no están dentro de `.rejilla-tarjetas` (`main > .panel > .tarjeta + .tarjeta`).

19. **Tablas demasiado anchas** (css/estilos.css). Pon el `min-width: 1400px` solo en la tabla de metas de Parámetros; las demás tablas, al 100 %. En BTL pon las casillas antes del estado.

20. **Nombres visibles**. Crea un diccionario de nombres visibles (eduAt → "Educación y asistencia técnica", mision → "Misión internacional", etc.) y úsalo en todas las vistas y en el Excel exportado.

21. **Método activo del director**. Agrega la clase `resultado` a las tarjetas del director o crea un estilo `.metodo-activo`, para que se resalte el método elegido.

22. **Cifras de las metas** (parametros.js). Dale un ancho mínimo de 11ch a esas celdas y muestra debajo de cada una el valor con formato `$ 42.000.000`.

23. **Excel exportado** (exportar.js). Redondea los pesos a 0 decimales y los scores a 2. Agrega en la hoja Director una fila "Método usado", y en cada hoja la primera fila "Simulación. No es un pago oficial."

24. **Cambios sin guardar**. Muestra un aviso "Cambios sin guardar" cuando se edite algo, y al recargar recuerda que hay que volver a cargar los archivos.
