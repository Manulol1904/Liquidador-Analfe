# Simulador web de compensación variable · ANALFE (PCV-COM-001)

**Simulación. No es un pago oficial.**

Proyecto hermano del liquidador (`../liquidador-web/`). No modifica el liquidador: solo reutiliza tokens, estilos, empaquetado y convenciones.

## Qué es (Fase 0 · entendimiento)

Hoy el simulador es un Excel. Esta web lo replica en un **HTML local de un solo archivo** (doble clic en Chrome/Edge), sin servidor ni red.

| Pieza | Origen | Destino en la web |
|---|---|---|
| Entradas amarillas, resultados grises | Hojas `Modelo` | Pasos del riel + casillas editables |
| Pesos, curva, topes, BTL… | Hoja `Parámetros` | `js/parametros.js` (fábrica editable) |
| Fila por persona | `_Datos` | Archivo de **perfil** JSON (uno por persona) |
| «¿Cuánto gano si…?» | `Sensibilidad` | Paso + gráfico SVG propio |
| Explicaciones | `Cómo se calcula` | Textos «Ver fórmula» |

Hay **tres modos** según el perfil:

1. **Comercial** (oct–dic 2026, con BTL y transición opcional) — Excel de referencia anónimo en `referencia/`.
2. **Nuevo ingreso** (dic 2026–jun 2027, prorrateo, 6 productos, medición certificada) — segundo Excel de referencia.
3. **Director** — sin Excel en `referencia/`; lógica descrita en el prompt (§4.3); casos de prueba manuales.

Sin perfil cargado → datos de ejemplo inventados (`datos_ejemplo/`). El HTML **nunca** lleva datos reales. Finanzas genera un `.perfil.json` por persona con `herramientas/generar_perfiles.mjs` (Fase 3).

## Excel de referencia (inventario)

| Archivo | Nombres definidos | Hojas visibles / ocultas |
|---|---|---|
| `Simulador_Comercial_2026_con_BTL_REFERENCIA_ANONIMA.xlsx` | **196** | Instrucciones, Cómo se calcula, Modelo · Sensibilidad, Parámetros, `_Listas`, `_Datos` |
| `Simulador_Nuevo_Ingreso_2026_REFERENCIA_ANONIMA.xlsx` | **136** | Instrucciones, Modelo, Cómo se calcula, Sensibilidad, Parámetros · `_Listas`, `_Datos` |

El mapa completo nombre → celda → campo del motor está en [`referencia/mapeo_nombres.json`](referencia/mapeo_nombres.json) (generado con `node herramientas/_extraer_mapeo.mjs`).

**Caso semilla** (Comercial A · Octubre): puntaje **76,402**, factor **0**, comisión **0**, transición **$1.500.000**, BTL estimado **$4.678.488,95**.

## Qué se reutiliza del liquidador

- `css/tokens.css` (ya copiado), componentes `.tarjeta`, `.kpis`, `.ver-formula`, `.zona-archivo`, riel de pasos.
- Patrón de parámetros amarillo/gris, `numeroFlexible` / pesos colombianos, empaquetado con control de datos personales.
- Cálculos del liquidador son **inspiración**; el motor del simulador debe calzar con las fórmulas del Excel (vacío ≠ 0).

## Privacidad

- `.gitignore` / `.cursorignore` excluyen `privado/`, `salida_perfiles/`, `datos/`, `*.analfe`, `*.perfil.json`, `dist/`.
- Cursor **no abre** `privado/` ni `salida_perfiles/`.
- Nada de CDN, `fetch` a internet ni datos personales en el código.

## Estado del proyecto

- [x] **Fase 0** — lectura, mapeo de nombres, este README.
- [x] **Fase 1** — motor (`js/motor/`), parámetros de fábrica, pruebas `node:test` (caso semilla en verde).
- [x] **Fase 2** — interfaz (riel, franja de resultados, SVG, BTL, imprimir). Abrir `index.html`.
- [x] **Fase 3** — perfiles (validación, CSV, huella, `.analfe`, generador, escenarios).
- [x] **Fase 4** — empaquetado HTML único, control PII, humo, `npm test` en verde.

### Entrega (doble clic)

```bash
npm run empaquetar          # → dist/Simulador_ANALFE.html (~193 KB)
npm run revision            # → dist/Simulador_ANALFE_revision.html (+ SheetJS)
npm test                    # unitarias + empaquetar + PII + humo
```

Abrir `dist/Simulador_ANALFE.html` con Chrome o Edge. Sin red. Con perfil de ejemplo inventado.

### Generar perfiles (Manuel / finanzas)

```bash
# Con datos de ejemplo (inventados):
npm run perfiles

# Con archivo real (solo en el PC de finanzas; no abrir desde Cursor):
node herramientas/generar_perfiles.mjs --entrada privado/encabezados_comerciales.json
node herramientas/generar_perfiles.mjs --entrada privado/encabezados_comerciales.json --cifrar

# Salida: salida_perfiles/<alias>.perfil.json (+ LEEME_ENTREGA.txt)
# Entregar UN archivo por persona por el canal interno de ANALFE.
```

**Cifrado (opción):** `--cifrar` escribe `.analfe` (AES-GCM + PBKDF2). Pros: el archivo no se lee a simple vista. Contras: si se olvida la contraseña hay que regenerar; un JSON sin cifrar sigue siendo válido si se entrega bien.

### Regla BTL (negocio)
- **Comercial / nuevo ingreso:** sin puntaje ≥ **80** el BTL es 0 (el Excel comercial anónimo no cortaba por puntaje; es diferencia esperada).
- **Director:** sin puntaje ≥ **70** el BTL es 0.

### Cómo probar (Fase 1)

```bash
cd simulador-web
npm run test:unit
# o
npm test
```

Caso semilla esperado: puntaje ≈ 76,40 · comisión 0 · transición $1.500.000 · BTL ≈ $4.678.489.

## Cómo abrir (cuando exista el HTML)

1. Desarrollo: abrir `index.html` con Live Server o `npx serve` (solo local).
2. Entrega: `node herramientas/empaquetar.mjs` → `dist/Simulador_ANALFE.html` (doble clic).

Pendientes de negocio (no inventar reglas): ver sección 11 del prompt; van como parámetros + aviso visible.
