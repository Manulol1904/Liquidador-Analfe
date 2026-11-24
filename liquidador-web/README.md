# Liquidador web ANALFE

Simulación local de la compensación variable (política PCV-COM-001). No es un pago oficial.

## Cómo abrirlo

Ábrelo con la extensión Live Server (clic derecho en `index.html` → Open with Live Server).

Con doble clic, Chrome abre la página como archivo (`file://`) y bloquea los módulos de JavaScript, así que las pestañas quedan vacías.

No hace falta npm. SheetJS y Chart.js están en `lib/` y no se piden a internet.

## Qué hace cada fase

1. Estructura: encabezado, aviso de simulación y seis pestañas.
2. Parámetros: valores iniciales, formulario, guardar en el navegador, exportar e importar JSON.
3. Cálculos puros: curva, margen, puntos, score y pago. Los casos están en `pruebas/pruebas.html`.
4. Carga: facturación (incluida la hoja de Misión y la de BTL) e informe de eventos, con mapeo de columnas y advertencias.
5. Resultados del equipo y detalle por comercial, con la transición entre política nueva y esquema anterior.
6. Director: totales del equipo, promedio simple y promedio ponderado por meta.
7. BTL: topes, salvaguarda y condiciones separadas para comercial y director.
8. Exportar el resultado a Excel, con el aviso "Simulación. No es un pago oficial."

## Uso

1. En la pestaña 1 elige el mes y carga la facturación. Si el libro trae hojas de Misión o BTL, se leen solas.
2. Carga el informe de eventos. El margen de cada evento sale de ahí.
3. En la pestaña 2 ajusta lo amarillo. Lo gris se calcula. Una celda vacía es un dato pendiente.
4. Las pestañas 3 a 6 muestran el equipo, el detalle, el director y el BTL.
5. Exportar resultado descarga `liquidacion_AAAA-MM.xlsx`.

**Restaurar valores iniciales** vuelve a las cifras de fábrica y las guarda en este navegador.

**Borrar datos guardados** solo elimina la copia del navegador. Lo que estás viendo sigue en la pestaña hasta que recargues.

Los datos no salen de este computador.
