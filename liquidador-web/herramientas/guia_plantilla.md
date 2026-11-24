# Guía de uso · Liquidador ANALFE · {{version}}

**Simulación. No es un pago oficial.**

Fecha de esta entrega: {{fecha}}.

---

## 1. Abrir

1. Descomprima el zip en una carpeta local.
2. Haga **doble clic** en `Liquidador_ANALFE.html`.
3. Ábralo en **Chrome** o **Edge**. No necesita internet: todo va dentro del HTML.

Si el navegador bloquea scripts locales, use «Permitir» o ábralo desde el menú Archivo → Abrir.

---

## 2. Cargar los encabezados

Cada vez que abre el HTML empaquetado debe cargar el equipo:

1. Vaya a **Cargar datos**.
2. Pulse **Cargar encabezados (.json)**.
3. Elija el archivo `encabezados_comerciales.json` que viene en este paquete.

Ese archivo tiene **datos personales** (nombres, documentos, salarios, metas). Se guarda solo en las carpetas de Financiera; no se sube a internet ni se versiona en repositorios públicos.

Sin encabezados, la app muestra «Falta cargar los encabezados» y el equipo aparece vacío (0 comerciales).

---

## 3. Cargar los archivos del mes

En **Cargar datos**, elija el **mes** de liquidación y cargue:

1. **Facturación** — informe de facturación del mes.
2. **Producción** — informe de producción (márgenes / eventos del mes).
3. **Márgenes de eventos** — Excel de liquidación/ejecución de cada evento BTL:
   - se elige el **comercial responsable**;
   - se **une** al evento de Producción cuando corresponda;
   - el **reparto 5.12** es opcional (solo si está aprobado antes del cierre).
4. Entrada **a mano** — opción secundaria si no hay archivo del evento.

También puede usar «Opciones avanzadas» → BTL_Eventos cuando aplique.

---

## 4. Revisar Parámetros

En **Parámetros**, las celdas **amarillas** se pueden editar. Los cambios se guardan en el navegador de ese equipo (no viajan con el HTML).

Revise, entre otros: tasas del esquema anterior, tasa BTL anterior (solo si el archivo no trae % de comisión), topes BTL, ICA/GMF, método del score del director y metas del equipo.

---

## 5. Ver los resultados

- **Equipo** y **Ficha por comercial:** tarjetas de **esquema anterior**, **política nueva** y **BTL 5.11.5**, con las líneas de BTL anterior y BTL nuevo.
- En la ficha, bajo cada evento BTL: **checks de condiciones** (participación, cierre, recaudo, satisfacción) y la línea automática de score. Los mismos checks están en la pestaña BTL y en la vista del director; todos comparten el mismo estado.
- **Ver fórmula** — detalle de cómo salió cada cifra (incluido el BTL del esquema anterior: base, tasa y origen).
- Tabla **5.4** con puntos por producto y tope por producto (el exceso de uno no compensa a otro).
- **Director:** secciones **5.4 a 5.7**, comparación de métodos del score y BTL del director.

El BTL del esquema anterior es **informativo** y **no** entra a la comparación de transición, salvo que jefatura decida otra cosa.

---

## 6. Exportar a Excel

En **Exportar**:

1. Opcional: marque **Proteger con la clave del simulador**. La clave se entrega **aparte** y **no se guarda** en la app ni en este paquete.
2. Exporte:
   - el Excel de **un comercial**;
   - el Excel del **director**;
   - o **todos** en un `.zip`.
3. Al abrir el Excel en Excel/Office, pulse **Habilitar edición** para que calculen las fórmulas.

---

## 7. Privacidad

- Cada comercial recibe **solo su Excel**, nunca la app ni el zip de todos.
- Este paquete (HTML + encabezados + guía) se entrega **solo** por el canal interno de ANALFE.
- No publique el HTML ni el JSON de encabezados en internet ni en repositorios públicos.

---

## 8. Pendientes con la jefatura

- Meta de base social del equipo: **622** o **524**.
- Método del score del director y regla del 100 %.
- Evidencia / aprobación del **reparto BTL** (5.12).
- Si el **BTL anterior** debe entrar a la transición.
- Si el factor de margen de Educación usa el margen **bruto**.
- Datos que faltan del director (por ejemplo documento).

---

**Simulación. No es un pago oficial.**
