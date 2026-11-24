# Prompt para Cursor: checks BTL en la liquidación y comisión BTL del esquema anterior calculada

Antes de cambiar nada, lee estos archivos: `js/vistas.js` (`pintarBtl`, `seccionBtl`, `tarjetaBtl`, `notaBtlAparte`, el mapa `condicionesEvento`), `js/calculos.js` (`comisionBtlAnterior`, `ingresoEjecucionBtl`, la parte de condiciones cerca de la línea 950), `js/btlArchivos.js` (`sincronizarParametrosBtl`, `valoresParaCalculo`), `js/carga.js` y `js/parametros.js`.
No cambies ninguna cifra de la política nueva. Todo lo que hoy ya da un resultado debe dar lo mismo.

## 1. Checks de condiciones BTL dentro de la liquidación

Hoy los checks (Participación comercial, Participación director, Cierre, Recaudo, Satisfacción) solo aparecen en la tabla de la pestaña BTL. Hay que verlos y poder marcarlos también donde se ve la liquidación:

1. **Ficha de cada comercial:** en `seccionBtl`, debajo de cada evento, pon un bloque "Condiciones para pagar (5.11.5)" con estos checks:
   - Participación material del comercial (`participacionComercial`)
   - Cierre o certificación financiera (`cierre`)
   - Meta de recaudo (`recaudo`)
   - Satisfacción del evento (`satisfaccion`)
   - Además, una línea automática que **no se puede editar**: "Score ≥ 80: Sí/No (score X)", tomada del score del comercial.
2. **Vista del director:** el mismo bloque por evento, con `participacionDirector` en lugar de `participacionComercial`.
3. **Tarjeta BTL del encabezado** (`tarjetaBtl`): una línea corta "Condiciones: 4 de 5 ✓". Si falta alguna, un badge que diga cuál falta (por ejemplo "Falta: recaudo").
4. **Un solo estado:** los checks de la ficha, del director y de la pestaña BTL leen y escriben el **mismo** `condicionesEvento` (usa la misma clave, `claveEvento(evento, indice)`). Si marcas una casilla en la ficha, se marca en la pestaña BTL y se recalcula todo: pago, badge y Excel. No dupliques la lógica; saca el render de los checks a una función reutilizable, por ejemplo `checksCondicionesBtl(item, rol)`.
5. Si una condición no se cumple, el pago BTL de ese rol muestra $0 con el motivo, igual que hoy en `calculos.js`.
6. Los valores que vienen de la hoja `BTL_Eventos` (si se cargó) siguen sirviendo como valor inicial.
7. **Excel individual y del director:** agrega las condiciones como "Sí/No" en el bloque BTL. Si no hay espacio en la plantilla, agrégalas al final del bloque sin mover las celdas que ya existen.

## 2. Comisión BTL del esquema anterior calculada, no un valor de relleno

Hoy `btlAnterior` = ingreso × tasa, pero:
- el ingreso sale de `parametros.btl.eventos`, que trae escrito a mano `{ evento: "575", ingresoEjecucion: 410580000 }`;
- la tasa es fija, `anterior.tasaBtl = 0.038`.

En el esquema anterior la tasa **no es fija**: va en la columna "% comisión" de las facturas BTL del informe de Producción, y cambia por evento (por ejemplo, 2,32 % en septiembre y 3,8 % en octubre).

Cambios:
1. **Base (ingreso del evento), en este orden de prioridad:**
   a. Si el evento tiene archivo de márgenes cargado (`btlArchivos`): TOTAL INGRESOS de la columna de **ejecución**.
   b. Si no: la suma de la base de las facturas BTL de ese evento y ese responsable en el informe de Producción del mes.
   c. Si no hay ninguna de las dos: "Pendiente". **Nunca uses el recaudo.**
2. **Tasa, en este orden de prioridad:**
   a. El "% comisión" de las facturas BTL de ese evento en Producción. Si hay varias facturas con tasas distintas, calcula la comisión factura por factura (base × su %) y súmalas.
   b. Si las facturas no traen %: `anterior.tasaBtl` de Parámetros (en amarillo, editable), con el aviso "Tasa supuesta: el archivo no trae % de comisión".
3. **Cálculo por evento:** comisión BTL anterior = Σ (base × tasa). Para el comercial, suma sus eventos del mes. Si hay un reparto aprobado (5.12), aplica su %.
4. **Director:** igual, con `director.tasaBtlAnterior` sobre la base BTL del mes (sin cambiar la fórmula actual). Solo debe tomar la base desde los archivos.
5. **Quita el evento 575 escrito a mano** de `parametros.js` (`btl.eventos` debe empezar vacío). Ese dato tiene que llegar por `sincronizarParametrosBtl` o desde Producción.
6. **Dónde se ve:**
   - Tarjeta "Esquema anterior": la línea "BTL (esquema anterior)" con el monto, y debajo "(tasa X % sobre $Y)". Solo aparece si el comercial tiene BTL ese mes.
   - Tarjeta BTL: "Esquema anterior $A · Política nueva $B".
   - Fórmula detallada solo dentro de "Ver fórmula": evento, base, de dónde salió la base, tasa, de dónde salió la tasa, y comisión.
7. **Transición:** se deja como hoy. El BTL anterior es informativo y **no** entra a la comparación anterior contra nueva, hasta que el jefe decida otra cosa. Usa un parámetro `anterior.btlEntraTransicion = false` para no tener ese valor escrito en el código.
8. **Excel:** `BTL_<Comercial>_anterior` y `Tasa_BTL_…` se llenan con estos valores calculados (si hay varias tasas, la tasa efectiva = comisión / base).

## Criterios de aceptación (revísalos antes de decir que terminaste)
- [ ] En la ficha de Hernando (octubre, evento 575 FEDESCO) se ven los checks. Al desmarcar "Recaudo", el BTL nuevo pasa a $0 con el motivo, y la pestaña BTL muestra la misma casilla desmarcada.
- [ ] El BTL anterior de Hernando sale del archivo o de Producción: base $410.580.000 y la tasa de sus facturas, y no de `parametros.js`.
- [ ] Sin archivos BTL cargados, el BTL anterior dice "Pendiente" y no muestra $15,6 M.
- [ ] Los otros 6 comerciales, el director (score 84,45, pago $6.193.107) y el BTL de prueba del director ($3.852.459) quedan iguales.
- [ ] Los Excel exportados no tienen errores (#NAME?, #REF!).
- [ ] 0 errores en consola y 0 peticiones de red.
- [ ] No pongas nombres, salarios ni datos personales nuevos en el código.
