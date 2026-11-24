# Prompt para Cursor: script que arma el zip entregable para Financiera

Crea `herramientas/generar_entrega.mjs`. Con un solo comando debe armar el mismo paquete que se venía entregando:

```
node herramientas/generar_entrega.mjs v22
```
El argumento es la versión. Si no se pasa, usa la fecha (`AAAA-MM-DD`).

## Requisito previo
Este script usa `herramientas/empaquetar.mjs` y `js/equipo_vacio.js`, que llegan con la ronda v16 (`ronda_v21_base_v16.zip`).
Si alguno no existe, **detente** con este mensaje y no generes nada: "Falta aplicar ronda_v21_base_v16.zip (empaquetar.mjs / equipo_vacio.js)".
Si falta esbuild, muestra: `npm install --no-save esbuild`.

## Qué debe dejar
La carpeta y el zip van en `entregas/` (no uses `dist/`). Agrega `entregas/` al `.gitignore`.

```
entregas/entrega_financiera_<version>/
  Liquidador_ANALFE.html        ← el HTML de doble clic, hecho con empaquetar.mjs
  encabezados_comerciales.json  ← copia de datos/encabezados_comerciales.json
  Guia_de_uso.md
  Guia_de_uso.pdf               ← opcional, ver paso 4
  capturas/                     ← solo con --capturas, ver paso 5
entregas/entrega_financiera_<version>.zip
```

## Pasos del script
1. **Empaquetar:** ejecuta `empaquetar.mjs` con la salida `entregas/entrega_financiera_<version>/Liquidador_ANALFE.html`.
2. **Revisar que el HTML no lleve datos personales.** Lee los nombres, cédulas y valores de básico y oportunidad del bloque `equipo` de `datos/encabezados_comerciales.json`, y búscalos dentro del HTML. Si aparece **cualquiera**, borra la carpeta y termina con error, diciendo cuántos encontró. **No imprimas los valores encontrados**: muestra solo el campo, por ejemplo "nombre del comercial 3".
3. **Revisar que no use la red.** Busca en el HTML `http://`, `https://` (salvo los que estén en comentarios de licencia de `lib/`), `fetch(` hacia URLs externas, `<script src=` y `<link href=` externos. Si encuentras alguno, error.
4. **Guía de uso:**
   - Genera `Guia_de_uso.md` a partir de una plantilla en `herramientas/guia_plantilla.md` (créala; abajo te digo qué debe tener). Reemplaza `{{version}}` y `{{fecha}}`.
   - Para el PDF: si se pasa `--pdf`, convierte el md a HTML simple y usa Chrome o Edge en modo headless (`--headless --print-to-pdf=...`). Busca el ejecutable en las rutas normales de Windows. Si no lo encuentra, avisa y sigue sin PDF.
5. **Capturas (opcional):** con `--capturas <carpeta>`, copia los PNG de esa carpeta. Por defecto **no** se incluyen, porque las capturas con datos reales deben quedarse en el PC.
6. **Zip:** usa `lib/jszip.min.js`, que ya está en el proyecto, cargado con `createRequire` o leyéndolo y evaluándolo. Así no se instala nada nuevo. El zip lleva la carpeta raíz `entrega_financiera_<version>/`.
7. **Resumen final en consola:** archivos y tamaños, "HTML sin datos personales ✓", "Sin red ✓", y la ruta del zip. **Nunca escribas la clave del simulador** en el script, la guía ni la consola.

## Contenido de `herramientas/guia_plantilla.md`
Toma como base la guía de v19 y actualízala a lo que la app hace hoy. Debe tener estas secciones:
1. **Abrir:** doble clic en `Liquidador_ANALFE.html`, en Chrome o Edge, sin internet.
2. **Cargar los encabezados** cada vez que se abre: botón "Cargar encabezados (.json)". El archivo tiene datos personales y se guarda solo en las carpetas de Financiera.
3. **Cargar los archivos del mes:** mes, Facturación, **Producción**, **Márgenes de eventos** (los Excel de cada evento BTL: se elige el comercial responsable, se une al evento de Producción y el reparto 5.12 es opcional), y la entrada a mano como opción secundaria.
4. **Revisar Parámetros:** las celdas amarillas se editan y se guardan en el navegador.
5. **Ver los resultados:** las tarjetas del esquema anterior, la política nueva y BTL (con las líneas de BTL anterior y nuevo), los **checks de condiciones BTL en la ficha**, "Ver fórmula", la tabla 5.4 con puntos y tope por producto, y el director con 5.4 a 5.7.
6. **Exportar a Excel:** "Proteger con la clave del simulador". Escribe "la clave del simulador", nunca la clave real. La clave se entrega aparte y no se guarda. Cubre la exportación de uno, del director y de todos (.zip), y que al abrir el Excel hay que pulsar "Habilitar edición".
7. **Privacidad:** cada comercial recibe solo su Excel, nunca la app ni el zip de todos. Esto se entrega solo por el canal interno de ANALFE.
8. **Pendientes con la jefatura:** meta de base social 622 o 524, método del score del director y regla del 100 %, evidencia del reparto BTL, si el BTL anterior entra a la transición, y si el factor de margen de Educación usa el bruto. También los datos que faltan del director.
9. La frase "**Simulación. No es un pago oficial.**" arriba y abajo.

## Criterios de aceptación
- [ ] `node herramientas/generar_entrega.mjs v22` termina sin errores y deja la carpeta y el zip en `entregas/`.
- [ ] Al abrir el zip, `Liquidador_ANALFE.html` abre con doble clic (file://), con 0 errores en consola y 0 peticiones de red. Sin encabezados muestra "Falta cargar los encabezados", y al cargar el json aparecen los 7 comerciales con las mismas cifras de Live Server.
- [ ] La revisión de datos personales falla a propósito si pegas un nombre del equipo dentro de `js/` (pruébalo y quítalo).
- [ ] No se agregaron dependencias a `package.json` (esbuild sigue con `--no-save`).
- [ ] La guía no trae la clave ni datos personales.
