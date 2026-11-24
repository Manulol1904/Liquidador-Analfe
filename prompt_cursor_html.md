# Prompt para Cursor: Liquidador de Compensación Variable ANALFE en HTML/CSS/JS

## Rol y forma de trabajar
Eres mi mentor y desarrollador. Estoy reaprendiendo programación y necesito AUDITAR y ENTENDER todo el código que generes. Por eso:
- Trabaja por fases. Al terminar cada fase, detente, explícame qué hiciste, qué archivos tocaste y cómo probarlo, y espera mi "siguiente".
- Código simple y legible: nada de frameworks (sin React, sin Vue, sin build, sin npm). Solo HTML, CSS y JavaScript moderno (ES modules) que se abra con doble clic o con la extensión Live Server.
- Nombres de variables y funciones en español, claros (ej. `calcularScore`, `factorCurva`).
- Cada función con un comentario corto: qué recibe, qué devuelve y qué regla de la política aplica (ej. "núm. 5.8").
- Funciones pequeñas y puras para los cálculos (sin tocar el DOM), separadas de la parte visual.
- NADA de valores fijos (hardcode) en los cálculos: todo número de negocio sale de un objeto de parámetros editable.
- Si algo de la regla no está claro, NO lo inventes: márcalo con `// PENDIENTE:` y pregúntame.

## Objetivo
Una aplicación web local que hace lo mismo que mi Excel de liquidación variable:
1. Cargo el Excel de producción/facturación del mes y el informe de eventos (BTL).
2. Defino metas y parámetros desde formularios.
3. La app calcula, por comercial y para el Director Comercial, el score, el factor de la curva y el pago variable, y lo compara con el esquema anterior en el periodo de transición.
4. Muestra todo en una interfaz bonita, clara y manejable, y permite exportar el resultado a Excel.
Todo debe decir visiblemente: "Simulación. No es un pago oficial".

## Estructura de archivos
```
liquidador-web/
  index.html
  css/estilos.css
  js/main.js            (arranque y navegación)
  js/parametros.js      (parámetros por defecto + guardar/cargar en localStorage + exportar/importar JSON)
  js/carga.js           (lectura de Excel con SheetJS desde CDN)
  js/calculos.js        (SOLO funciones puras de cálculo)
  js/vistas.js          (pintar tablas, tarjetas y gráficas)
  js/exportar.js        (descargar resultado en .xlsx)
  pruebas/pruebas.html  (pruebas de las funciones de calculos.js con casos conocidos)
  README.md             (cómo usarlo y qué hace cada archivo)
```
Librerías permitidas solo por CDN: SheetJS (xlsx) para leer/escribir Excel y Chart.js para gráficas.

## Reglas de negocio (Política PCV-COM-001)

### Comerciales
Comerciales: Carolina Gómez, Consuelo Castro, Hernando Rozo, Leidy Lizcano, Lynette Arango, Oriette Henríquez, Tatiana Acuña, y Diana Marcela Reyes (solo desde diciembre 2026). Cada uno tiene en parámetros: salario básico, oportunidad variable, IMR (= básico + oportunidad), metas por mes y producto, base social inicial.

### Score (100 puntos, cada indicador con tope del 120 % de su peso)
| Indicador | Peso | Regla |
|---|---|---|
| Ventas rentables y recaudadas | 45 | Cumplimiento ponderado por producto (ver abajo). Puntos = peso × cumplimiento, tope 120 %. |
| Base social | 20 | Cierre = base inicial + ingresos − retiros. Meta = base inicial + 1 por cada mes (oct +1, nov +2, dic +3). Si cumplimiento < 100 % → 0 puntos; desde 100 % proporcional hasta tope 120 % (24). Mostrar sin decimales. |
| SERFISCAL | 10 | < 100 % → 0; desde 100 % proporcional hasta 12. |
| Innovación | 10 | 2 puntos por oferta aprobada + 3 por su primera venta; máximo 5 por oferta y 10 por trimestre. |
| Satisfacción | 15 | Esperada = 80. Cumplimiento = obtenida ÷ 80. < 100 % → 0; tope 120 %. Si no hay encuesta suficiente (no culpa del comercial) → neutral 100 % (15 puntos). |

Indicadores sin medición certificada antes de su primera medición → neutral 100 % (núm. 5.10).

### Ventas
- Educación y asistencia técnica: solo valor recaudado, multiplicado por factor de margen por evento:
  - margen < 10 % → 0 %
  - 10 % hasta 20 % inclusive → 90 % (un margen de EXACTAMENTE 20 % paga 90 %)
  - > 20 % → 100 %
  - Margen = (ingreso − costo − ICA − GMF) ÷ ingreso; ICA = 0,9660442 % del ingreso; GMF = 4 × 1000 del costo.
- Misión internacional: cada factura vale $15.500.000 completo. Meta $49.600.000 por comercial solo en octubre (sin meta nov/dic).
- Congreso, pasantía, actividad cultural (cartón = $40.000), patrocinios: contra su propia meta, sin factor de margen.
- Cumplimiento de ventas = ponderado por el peso de la meta de cada producto.

### Curva de pago (núm. 5.8), interpolación lineal
| Score | Factor |
|---|---|
| < 80 | 0 |
| 80 | 0,70 |
| 90 | 0,90 |
| 100 | 1,00 |
| 110 | 1,10 |
| ≥ 120 | 1,20 (tope) |
Pago variable = oportunidad × factor. Casos de prueba obligatorios: 79,99→0; 80→0,70; 85→0,80; 90→0,90; 91,83→0,9183; 100→1; 130→1,20.

### Director Comercial y de Marketing (Juan Camilo Rojas Mantilla)
- Básico $7.559.999, oportunidad $7.849.838, IMR $15.409.837.
- Sin meta individual: su score se calcula sobre los TOTALES del equipo en los cuatro indicadores.
- Parámetros configurables (porque están PENDIENTES con la jefa):
  - Método: "totales del equipo" (por defecto) | "promedio simple de scores" | "promedio ponderado por meta".
  - Regla del 100 % para el director: NO por defecto (puntos proporcionales desde 0 hasta 120 %).
  - Meta de base social del equipo: 622 por defecto (alternativa 524).
  - Meta de Misión del equipo: $49.600.000 por defecto.
- Esquema anterior: 1,5 % sobre toda la facturación del mes sin BTL, sin carga prestacional; BTL al 0,63 % aparte (informativo).

### Esquema anterior de comerciales y transición (núm. 8.3)
- Oct, nov y dic 2026: se calculan ambos esquemas y se paga el más favorable. Comisión anterior = % de la columna de comisión de cada línea del archivo (Misión: $1.000.000 por factura en el esquema anterior).
- Diana Reyes no tiene esquema anterior.

### BTL (núm. 5.11.5)
- Utilidad = ingreso − costo − ICA (0,9660442 % del ingreso) − GMF (4×1000 del costo). Margen = utilidad ÷ ingreso. Cumplimiento = utilidad real ÷ utilidad presupuestada.
- Comercial (% del IMR):
| Cumplimiento \ Margen | < 5 % | 5 a < 10 % | 10 a < 15 % | ≥ 15 % |
|---|---|---|---|---|
| < 90 % | 0 | 0 | 0 | 0 |
| 90 a < 100 % | 0 | 20 % | 30 % | 40 % |
| ≥ 100 % | 0 | 35 % | 60 % | 80 % |
  Topes: 0,8 IMR por evento y 2 IMR por año.
- Director (% del IMR): margen < 10 % → 0; 10–15 %: 10 % (cumpl. 90–<100) / 20 % (≥100); > 15 %: 10 % / 25 %. Topes: 0,25 IMR por evento y 1 IMR por año.
- Salvaguarda: la suma comercial + director no puede pasar del 25 % de la utilidad; si pasa, se prorratea.
- Condiciones (checkboxes): score ordinario ≥ 80, participación material, cierre financiero certificado, meta de recaudo, satisfacción del evento ≥ 85 %. Si falta una → 0 o "Pendiente".

## Carga de archivos
- Facturación: Excel del mes. Columnas esperadas (permitir que yo mapee las columnas en pantalla si cambian los nombres): #, Factura, Cliente, Asesor, Grupo, Subgrupo, Cuenta, Base, % comisión, % dirección.
- Informe de eventos: Excel con evento, cliente, comercial, ingreso, costo, utilidad presupuestada.
- Mostrar una vista previa de las primeras filas, el número de líneas leídas y advertencias (asesor desconocido, base vacía, fecha fuera del mes).

## Interfaz
- Pestañas: 1) Cargar datos, 2) Parámetros y metas, 3) Resultados del equipo, 4) Detalle por comercial, 5) Director, 6) BTL.
- Diseño limpio y profesional: tarjetas con sombra suave, paleta azul institucional (#1F4E79) y grises, fuente del sistema, responsive.
- Campos editables resaltados en amarillo suave (como en mi Excel); valores calculados en gris, no editables.
- Resultados arriba: tarjeta por comercial con score, factor, pago nueva política, pago anterior y cuál aplica (verde/rojo).
- Barra o gauge del score con las anclas 80/90/100/110/120 y gráfica de la curva con el punto del comercial.
- Títulos profesionales y textos cortos en español sencillo, nada tipo log.
- Formato de moneda colombiana: `$ 7.208.412` (Intl.NumberFormat 'es-CO').

## Privacidad
Esta app es solo para mí y mi jefa. Los datos personales (salarios, IMR) se guardan en localStorage del navegador; agrega un botón "Borrar datos guardados". No enviar nada a internet (solo cargar las librerías del CDN).

## Fases (detente al final de cada una)
1. Estructura de archivos, index.html con las pestañas vacías y estilos base.
2. parametros.js con valores por defecto + formulario de parámetros y metas + guardar/exportar/importar JSON.
3. calculos.js: factorCurva, factorMargen, puntosIndicador (con y sin regla del 100 %), score, pago; + pruebas.html con los casos de arriba (todas deben pasar).
4. carga.js: leer facturación y eventos, mapeo de columnas, vista previa y advertencias.
5. Resultados del equipo y detalle por comercial (con transición).
6. Director (tres métodos comparados).
7. BTL con topes, salvaguarda y condiciones.
8. Exportar a Excel y README.

Al final de cada fase, dame: (a) resumen de lo hecho, (b) explicación línea por línea de las partes clave, (c) 2 o 3 preguntas para verificar que entendí el código.
