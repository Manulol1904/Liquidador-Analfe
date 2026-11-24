# Ronda v20 – Rediseño visual (para Cursor)

Proyecto: liquidador web de compensación variable (HTML/CSS/JS sin frameworks, debe seguir funcionando con doble clic en file:// y empaquetado con `herramientas/empaquetar.mjs`).

**Reglas que NO se tocan:** no cambies ningún cálculo, regla ni parámetro, ni los textos legales: deben seguir "Simulación. No es un pago oficial", las celdas editables en amarillo y cero peticiones de red. No agregues datos personales a ningún archivo. Si algún cambio parece requerir tocar `calculos.js`, detente y pregunta.

## 1. Ficha de cada comercial – tarjetas
Rediseña las tres tarjetas superiores (Esquema anterior · Política nueva · BTL 5.11.5) con un estilo más profesional:
- Usa una paleta sobria: azul marino como color principal, grises neutros y verde solo para el sello «Paga». Deja buen espacio, esquinas de 12 px, una sombra suave y tipografía con jerarquía clara (monto grande y etiquetas pequeñas en gris).
- **Esquema anterior:** producción, cumplimiento y tasa del tramo. Agrega una línea **«BTL (esquema anterior)»** que aparece **solo si** el comercial tiene BTL en el mes; si no tiene, la línea no se muestra.
- **Política nueva:** score, factor de pago y monto. Agrega una línea **«BTL (política nueva)»** con la misma regla: solo aparece si hay BTL.
- **BTL 5.11.5:** muestra los eventos del mes y, para cada uno, el **valor según el esquema anterior** y el **valor según la política nueva**, una al lado de la otra. Si no hay eventos, deja un estado vacío limpio («Sin eventos BTL este mes»), con un ícono discreto y la tarjeta más baja.
- Mantén la franja de resumen: diferencia, regla de transición y básico + transición. Dale estilo de barra de totales.

## 2. Menos texto técnico
- Quita los textos que parecen log o explicación interna: «leído de…», «celda F10:H10», notas largas y avisos repetidos. Deja solo etiquetas cortas.
- Las fórmulas y explicaciones pasan a un control plegable «Ver fórmula» en cada sección, cerrado por defecto.
- Los avisos se reducen a un solo indicador discreto («Avisos (n)») que se puede desplegar.

## 3. Score y curva en horizontal
En una sola fila:
- **A la izquierda**, el score: número grande, una barra horizontal de 0 a 120 con marcas en 80, 90, 100, 110 y 120, la zona menor a 80 en gris o rojo suave, la zona de 80 a 120 en una escala de azul, el marcador en el score actual y debajo el texto «Faltan X pts para 80» o «Factor de pago Y %».
- **A la derecha**, la tabla de la curva 5.8 siempre visible (Puntaje → Factor de pago: <80 → 0 %, 80 → 70 %, 90 → 90 %, 100 → 100 %, 110 → 110 %, 120 → 120 %), con la fila que corresponde al score actual resaltada.
- En pantallas estrechas se apilan.

## 4. Director comercial
Aplica el mismo diseño a la vista del director: las tres tarjetas, el score con la curva en horizontal y las cuatro secciones (5.4–5.7) con el mismo estilo de tabla y su columna de puntos.

## 5. Paso «Cargar»
- La primera caja de archivo se llama **«Producción»** y la segunda **«Márgenes de eventos»**.
- La tercera caja, que lee la hoja `BTL_Eventos` (utilidad presupuestada y casillas de condiciones), **pregúntame antes de quitarla**. La sección «Eventos BTL» que está abajo hace lo mismo y la reemplaza. Mi propuesta es ocultarla dentro de «Opciones avanzadas» en vez de borrar la lógica.
- La caja de encabezados se queda como está.
- Todas las cajas van con el mismo tamaño, alineadas en una cuadrícula, con un ícono, el título, una línea de ayuda corta y el estado («Cargado ✓ nombre del archivo»).

## 6. Armonía general
- Define variables CSS (`--color-primario`, `--gris-1..5`, `--exito`, `--alerta`, `--radio`, `--sombra`, `--espacio-1..6`) y úsalas en todo el archivo. No dejes colores sueltos.
- Usa la misma tipografía en toda la app (fuente del sistema), con títulos de sección del mismo tamaño y alineados.
- Revisa que se vea bien en 1366 px y en 800 px de ancho.

## Criterios de aceptación
- Las cifras de cada ficha son idénticas a las de antes del cambio (compara al menos un comercial y el director).
- Las líneas de BTL aparecen solo cuando hay BTL. Pruébalo con un evento cargado y sin eventos.
- No hay errores en la consola. El HTML empaquetado abre con doble clic y no hace ninguna petición de red.
- Los Excel exportados no cambian.
