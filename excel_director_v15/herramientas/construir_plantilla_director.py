"""
Plantilla del Excel del Director (v15) con la MISMA forma que el libro de un comercial.

Uso:  python3 herramientas/construir_plantilla_director.py plantillas/plantilla_liquidacion_individual.xlsx plantillas/

Toma estilos, anchos, alturas y combinaciones de la plantilla anónima de comerciales (no copia datos)
y arma 6 hojas:  Liquidación · Explicación · Detalle del equipo · Facturas · Supuestos y pendientes · Parámetros (oculta).
Escribe además mapeo_celdas_director.json y textos_director.json. Sin datos reales: todo lo del mes lo pone la app.
"""
import sys, json, re, warnings
warnings.filterwarnings("ignore")
from copy import copy
from pathlib import Path
import openpyxl
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter as COL

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
S = openpyxl.load_workbook(SRC)
W = openpyxl.Workbook(); W.remove(W.active)
TEXTOS, ENTRADAS = {}, {}

def estilo(dst, src):
    dst.font = copy(src.font); dst.fill = copy(src.fill); dst.border = copy(src.border)
    dst.alignment = copy(src.alignment); dst.number_format = src.number_format; dst.protection = copy(src.protection)

def marco(ws, src, filas, cols, desde_fila=None):
    """Copia estilos, alturas, anchos y combinaciones de `src` (mismas coordenadas)."""
    for r in filas:
        sr = desde_fila(r) if desde_fila else r
        if src.row_dimensions[sr].height: ws.row_dimensions[r].height = src.row_dimensions[sr].height
        for c in range(1, cols + 1):
            estilo(ws.cell(r, c), src.cell(sr, c))
    for k, d in src.column_dimensions.items():
        if d.width: ws.column_dimensions[k].width = d.width

def combinar(ws, src, filas):
    for m in src.merged_cells.ranges:
        if m.min_row in filas and m.max_row in filas:
            ws.merge_cells(str(m))

def poner(ws, ref, valor):
    ws[ref].value = valor

def texto(ws, ref, t):
    """Texto con marcadores {x}: la app lo llena al exportar."""
    ws[ref].value = t
    if "{" in t: TEXTOS[f"{ws.title}!{ref}"] = t

def entrada(ws, ref, ruta):
    ENTRADAS.setdefault(ws.title, {})[ref] = ruta

def nombre(n, ref):
    W.defined_names[n] = DefinedName(n, attr_text=ref)

SL = S["Liquidación"]
AMARILLO = SL["I47"]          # celda editable (amarilla) del comercial
VALOR = SL["I50"]             # valor calculado normal
VALOR_PCT = SL["I52"]
ETQ = SL["F50"]

# ═════════════ 1. Liquidación ═════════════
L = W.create_sheet("Liquidación")
marco(L, SL, range(1, 86), 15)
marco(L, SL, range(86, 96), 15, desde_fila=lambda r: 84)       # filas extra del bloque BTL del director
estilo_total = [SL.cell(85, c) for c in range(1, 16)]
for c in range(1, 16): estilo(L.cell(95, c), estilo_total[c - 1])
estilo(L.cell(85, 6), SL.cell(84, 6)); estilo(L.cell(85, 9), SL.cell(84, 9))
combinar(L, SL, range(1, 86))
for r in range(85, 96):
    for rng in (f"F{r}:G{r}", f"I{r}:J{r}"):
        if rng not in [str(m) for m in L.merged_cells.ranges]: L.merge_cells(rng)
L.freeze_panes = SL.freeze_panes
L.sheet_view.showGridLines = SL.sheet_view.showGridLines
L.page_setup.orientation = "landscape"; L.page_setup.fitToWidth = 1; L.page_setup.fitToHeight = 0
L.sheet_properties.pageSetUpPr = copy(SL.sheet_properties.pageSetUpPr)
L.print_area = "A1:O96"

texto(L, "A1", "ANALFE  –  Liquidación de Compensación Variable  –  {Mes} {anio}")
poner(L, "A2", SL["A2"].value)
poner(L, "A3", "Nombre del trabajador"); entrada(L, "C3", "director.nombre")
poner(L, "A4", "Documento de identidad"); entrada(L, "C4", "director.documento")
poner(L, "A5", "Cargo, nivel y regional"); entrada(L, "C5", "director.cargoNivel")
poner(L, "F3", "Salario base"); entrada(L, "I3", "director.basico")
poner(L, "F4", "Ingreso objetivo (IMR) mensual"); poner(L, "I4", "=Dir_Basico+Dir_Opp")
poner(L, "F5", "Ingreso máximo mensual (120 %)"); poner(L, "I5", "=Dir_Basico+($I$4-Dir_Basico)*Tope_curva")
entrada(L, "F6", "director.q2Nombre"); entrada(L, "I6", "director.q2")
# 5.8 Resultado (mismas filas y columnas que el comercial)
for ref in ("A7", "L7", "A8", "E8", "F8", "G8", "L8", "N8", "A9", "A10", "A11", "A12", "A13", "A14"):
    poner(L, ref, SL[ref].value)
poner(L, "A15", "Comisión ganada  ·  política nueva (sin BTL)")
poner(L, "E9", "=Peso_Ventas"); poner(L, "E10", "=Peso_Base"); poner(L, "E11", "=Peso_SER+Peso_Innovacion"); poner(L, "E12", "=Peso_Satisfaccion")
poner(L, "E13", "=SUM(E9:E12)")
for r in range(9, 14): poner(L, f"F{r}", f"=E{r}*Tope_pago")
poner(L, "G9", "=I44"); poner(L, "G10", "=I53"); poner(L, "G11", "=I61+I67"); poner(L, "G12", "=I73")
poner(L, "G13", "=SUM(G9:G12)")
poner(L, "G14", "=IF(G13<Score_minimo,0,MIN(Tope_curva,IF(G13>=MAX(Curva_puntos),MAX(Curva_factor),"
      "INDEX(Curva_factor,MATCH(G13,Curva_puntos,1))+(G13-INDEX(Curva_puntos,MATCH(G13,Curva_puntos,1)))"
      "*(INDEX(Curva_factor,MATCH(G13,Curva_puntos,1)+1)-INDEX(Curva_factor,MATCH(G13,Curva_puntos,1)))"
      "/(INDEX(Curva_puntos,MATCH(G13,Curva_puntos,1)+1)-INDEX(Curva_puntos,MATCH(G13,Curva_puntos,1))))))")
poner(L, "G15", "=IF(G13<Score_minimo,0,Dir_Opp*G14)")
# Curva de pago: textos desde los parámetros
for i, r in enumerate(range(9, 15)):
    entrada(L, f"L{r}", f"curvaTabla.{i}.etiqueta"); entrada(L, f"N{r}", f"curvaTabla.{i}.factorTexto")

# 1. Política anterior
poner(L, "A18", "1.  Política anterior")
poner(L, "A19", "Comisión anterior"); poner(L, "C19", "=C24")
poner(L, "A20", "Meta mensual"); poner(L, "C20", "No aplica")
poner(L, "A21", "Producción (facturación del mes)"); poner(L, "C21", "=SUM(Fac_Base)")
poner(L, "A22", "Cumplimiento"); poner(L, "C22", "No aplica")
poner(L, "A23", "Tasa aplicada"); poner(L, "C23", "=Tasa_Dir_Anterior")
poner(L, "A24", "Producción × tasa"); poner(L, "C24", "=C21*C23")
poner(L, "A25", "BTL  ·  política anterior")
poner(L, "A26", "Ingreso del evento"); poner(L, "C26", "=I77")
poner(L, "A27", "Comisión BTL anterior"); poner(L, "C27", "=N(C26)*Tasa_Dir_BTL_Anterior")
poner(L, "A28", "Misión internacional  ·  política anterior")
poner(L, "A29", "Valor"); poner(L, "C29", "No aplica")
poner(L, "A30", "Facturas"); poner(L, "C30", "No aplica")
poner(L, "A31", "Valor total"); poner(L, "C31", 0)
for ref in ("C20", "C22", "C29", "C30"): L[ref].alignment = copy(L[ref].alignment); L[ref].alignment = L[ref].alignment.copy(horizontal="right")
estilo(L["C30"], SL["C29"])

# 2. Política nueva (el «real» es el agregado del equipo)
poner(L, "F18", "2.  Política nueva  ·  PCV-COM-001  ·  agregado del equipo")
poner(L, "F19", "5.4  Ventas rentables y recaudadas"); poner(L, "H19", "Peso")
den = "(N(I22)+N(I32)+N(I36)+N(I40))"
poner(L, "F20", "Educación y asistencia técnica"); poner(L, "H20", f"=IF({den}=0,0,N(I22)/{den})")
poner(L, "F21", "Venta recaudada del equipo"); poner(L, "I21", "=SUM(Eq_RecEdu)")
poner(L, "F22", "Meta del mes (suma de metas)"); poner(L, "I22", "=IF(COUNT(Eq_MetaEdu)<N_comerciales,0,SUM(Eq_MetaEdu))")  # como la app: sin la meta de todos, no pesa
poner(L, "F23", "Cumplimiento"); poner(L, "I23", "=IF(N(I22)=0,0,I26/I22)")
poner(L, "F24", "Margen comprobado"); poner(L, "I24", "Por comercial")
poner(L, "F25", "Factor de reconocimiento"); poner(L, "I25", "=IF(N(I21)=0,\"\",I26/I21)")
poner(L, "F26", "Venta reconocida del equipo"); poner(L, "I26", "=SUM(Eq_VentaEdu)")
poner(L, "F27", "Misión internacional"); poner(L, "H27", f"=IF({den}=0,0,N(I32)/{den})")
poner(L, "F28", "Facturas de Misión del mes"); poner(L, "I28", "=SUM(Eq_FactMision)")
poner(L, "F29", "Valor reconocido por factura"); poner(L, "I29", "=Valor_factura_Mision")
poner(L, "F30", "Valor real de las facturas elegibles"); poner(L, "I30", "Por comercial")
poner(L, "F31", "Venta recaudada para Misión internacional"); poner(L, "I31", "=SUM(Eq_VentaMision)")
poner(L, "F32", "Meta del equipo"); entrada(L, "I32", "metaMision")
poner(L, "F33", "Cumplimiento"); poner(L, "I33", "=IF(N(I32)=0,0,I31/I32)")
poner(L, "F34", "Congreso Nacional"); poner(L, "H34", f"=IF({den}=0,0,N(I36)/{den})")
poner(L, "F35", "Venta recaudada para Congreso Nacional"); poner(L, "I35", "=SUM(Eq_VentaCongreso)")
poner(L, "F36", "Meta del mes"); poner(L, "I36", "=IF(COUNT(Eq_MetaCongreso)<N_comerciales,0,SUM(Eq_MetaCongreso))")
poner(L, "F37", "Cumplimiento"); poner(L, "I37", "=IF(N(I36)=0,0,MIN(Tope_congreso,I35/I36))")
poner(L, "F38", "Actividad cultural"); poner(L, "H38", f"=IF({den}=0,0,N(I40)/{den})")
poner(L, "F39", "Venta recaudada para Actividad cultural"); poner(L, "I39", "=SUM(Eq_VentaCultural)")
poner(L, "F40", "Meta del mes"); poner(L, "I40", "=SUM(Eq_MetaCultural)")
poner(L, "F41", "Cumplimiento"); poner(L, "I41", "=IF(N(I40)=0,0,I39/I40)")
poner(L, "F42", "Cierre de ventas rentables y recaudadas")
poner(L, "F43", "Cumplimiento ponderado"); poner(L, "I43", "=H20*I23+H27*I33+H34*I37+H38*I41")
poner(L, "F44", "Puntos"); poner(L, "I44", "=Peso_Ventas*MIN(Tope_pago,I43)")
estilo(L["I32"], AMARILLO); L["I32"].number_format = SL["I22"].number_format
# 5.5 Base social
poner(L, "F46", "5.5  Base social  ·  equipo")
poner(L, "F47", "Base social al inicio (suma del equipo)"); poner(L, "I47", "=SUM(Eq_BSInicial)")
poner(L, "F48", "Variación neta (ingresos − retiros)"); poner(L, "I48", "=I50-I47")
poner(L, "F49", ""); 
poner(L, "F50", "Base social cierre (suma del equipo)"); poner(L, "I50", "=SUM(Eq_BSCierre)")
poner(L, "F51", "Meta del equipo"); entrada(L, "I51", "metaBaseSocial")
poner(L, "F52", "Resultado"); poner(L, "I52", "=IF(N(I51)=0,0,I50/I51)")
poner(L, "F53", "Puntos"); poner(L, "I53", "=IF(AND(Umbral_100=\"SÍ\",I52<1),0,Peso_Base*MIN(Tope_pago,I52))")
for ref in ("I47", "I48", "I49"): estilo(L[ref], VALOR)
estilo(L["F49"], ETQ)
estilo(L["I51"], AMARILLO)
# 5.6 Diversificación e innovación (del equipo)
poner(L, "F56", "5.6  Diversificación e innovación comercial  ·  equipo")
poner(L, "F57", "Diversificación de productos SERFISCAL")
poner(L, "F58", "Puntos del equipo (promedio de los medidos)"); entrada(L, "I58", "puntosEquipo.serfiscal")
poner(L, "F59", "Peso del indicador"); poner(L, "I59", "=Peso_SER")
poner(L, "F60", "Cumplimiento"); poner(L, "I60", "=IF(N(I59)=0,0,I58/I59)")
poner(L, "F61", "Puntaje"); poner(L, "I61", "=I58")
poner(L, "F62", "Innovación comercial")
poner(L, "F63", "Puntos del equipo (promedio de los medidos)"); entrada(L, "I63", "puntosEquipo.innovacion")
poner(L, "F64", "Peso del indicador"); poner(L, "I64", "=Peso_Innovacion")
poner(L, "F65", "Cumplimiento"); poner(L, "I65", "=IF(N(I64)=0,0,I63/I64)")
poner(L, "F66", "")
poner(L, "F67", "Puntaje"); poner(L, "I67", "=I63")
for ref in ("I58", "I59", "I60", "I63", "I64", "I65", "I66"): estilo(L[ref], VALOR)
estilo(L["F66"], ETQ)
L["I58"].number_format = "0.00"; L["I63"].number_format = "0.00"; L["I59"].number_format = "0"; L["I64"].number_format = "0"
L["I60"].number_format = "0.00%"; L["I65"].number_format = "0.00%"
# 5.7 Satisfacción
poner(L, "F69", "5.7  Satisfacción  ·  equipo")
poner(L, "F70", "Satisfacción mínima esperada"); poner(L, "I70", "=Sat_Esperada")
poner(L, "F71", "Satisfacción obtenida (equipo)"); entrada(L, "I71", "puntosEquipo.satisfaccionTexto")
poner(L, "F72", "Porcentaje de cumplimiento"); poner(L, "I72", "=IF(Peso_Satisfaccion=0,0,I73/Peso_Satisfaccion)")
poner(L, "F73", "Puntos ganados"); entrada(L, "I73", "puntosEquipo.satisfaccion")
estilo(L["I71"], VALOR); L["I72"].number_format = "0.00%"
# 5.11.5 BTL del director
poner(L, "F75", "5.11.5  Bonificación BTL del director")
filas_btl = [
    (76, "IMR", "=$I$4", None),
    (77, "Ingreso del evento", None, "btl.ingreso"),
    (78, "Tope por evento (0,25 × IMR)", "=BTLd_tope_evento*I76", None),
    (79, "Tope anual disponible", "=MAX(0,BTLd_tope_anio*I76-IF(I87=\"NO\",0,N(I86)))", None),
    (80, "Utilidad presupuestada", None, "btl.utilidadPresupuestada"),
    (81, "Utilidad real", None, "btl.utilidadReal"),
    (82, "Cumplimiento", "=IF(OR(NOT(ISNUMBER(I80)),NOT(ISNUMBER(I81))),\"Pendiente\",IF(I80=0,0,I81/I80))", None),
    (83, "Margen del evento", "=IF(OR(NOT(ISNUMBER(I77)),NOT(ISNUMBER(I81))),\"Pendiente\",IF(I77=0,0,I81/I77))", None),
    (84, "Porcentaje de la escala (sobre el IMR)", "=IF(OR(NOT(ISNUMBER(I82)),NOT(ISNUMBER(I83))),\"Pendiente\",IF(OR(I82<BTL_cump_min,I83<BTL_margen_medio),0,IF(I82<BTL_cump_alto,BTLd_pct90,IF(I83<=BTL_margen_alto,BTLd_pct_medio,BTLd_pct_alto))))", None),
    (85, "Bonificación preliminar (con topes)", "=IF(NOT(ISNUMBER(I84)),\"Pendiente\",MIN(I84*I76,I78,I79))", None),
    (86, "BTL ya pagado en el año", None, "btl.pagadoAnio"),
    (87, "¿Ese pago cuenta para el tope anual?", None, "btl.pagadoCuenta"),
    (88, "¿Participación material y verificable del director?", None, "btl.participacion"),
    (89, "¿Cierre financiero y certificación definitiva?", None, "btl.cierre"),
    (90, "¿Se alcanzó la meta de recaudo del presupuesto?", None, "btl.recaudo"),
    (91, "¿Se cumplió la satisfacción del cliente del evento?", None, "btl.satisfaccion"),
    (92, "Bonificación preliminar del comercial del evento", None, "btl.comercialPreliminar"),
    (93, "Límite conjunto (25 % de la utilidad real)", "=IF(NOT(ISNUMBER(I81)),\"Pendiente\",I81*BTL_salvaguarda)", None),
    (94, "Bonificación después de la salvaguarda", "=IF(OR(NOT(ISNUMBER(I85)),NOT(ISNUMBER(I93))),\"Pendiente\",IF(N(I92)+I85<=I93,I85,IF(N(I92)+I85=0,0,I93*I85/(N(I92)+I85))))", None),
    (95, "Bonificación BTL a reconocer", "=IF(NOT(ISNUMBER(I94)),\"Pendiente\",IF(OR(I88=\"\",I89=\"\",I91=\"\"),\"Pendiente\",IF(OR(I88=\"NO\",I89=\"NO\",I90=\"NO\",I91=\"NO\",$G$13<Score_minimo),0,I94)))", None),
]
for r, etq, f, ruta in filas_btl:
    poner(L, f"F{r}", etq)
    if f: poner(L, f"I{r}", f)
    if ruta: entrada(L, f"I{r}", ruta)
for r in (86, 87, 88, 89, 90, 91, 92): estilo(L[f"I{r}"], AMARILLO)
for r in (77, 80, 81, 85, 86, 92, 93, 94): L[f"I{r}"].number_format = SL["I80"].number_format
for r in (82, 83, 84): L[f"I{r}"].number_format = "0.00%"
for r in (87, 88, 89, 90, 91): L[f"I{r}"].alignment = L[f"I{r}"].alignment.copy(horizontal="center")
dv = DataValidation(type="list", formula1='"SÍ,NO"', allow_blank=True); dv.add("I88:I91"); L.add_data_validation(dv)
dv2 = DataValidation(type="list", formula1='"SÍ,NO,PENDIENTE"', allow_blank=True); dv2.add("I87"); L.add_data_validation(dv2)
# 3. Comparativo y transición
poner(L, "L18", "3.  Comparativo y transición")
for r, etq, f in [(19, "Comisión anterior", "=C24"), (20, "Valor a pagar (política nueva, sin BTL)", "=G15"),
                  (21, "Diferencia (nueva − anterior)", "=N20-N19"), (22, "Resultado de la transición", "=MAX(N19,N20)"),
                  (23, "Básico contractual", "=Dir_Basico"), (24, "Básico + transición", "=N23+N22"),
                  (25, "Ingreso del evento BTL", "=N(I77)"), (26, "Bonificación BTL  ·  política nueva", "=I95"),
                  (27, "Comisión BTL  ·  política anterior", "=C27")]:
    poner(L, f"L{r}", etq); poner(L, f"N{r}", f)
texto(L, "L29", "Aporte de cada comercial: hoja «Detalle del equipo». Facturas del mes: hoja «Facturas».")
estilo(L["L29"], SL["A2"]); L["L29"].font = copy(SL["F21"].font); L["L29"].font = L["L29"].font.copy(i=True, sz=8)
L["L29"].fill = copy(SL["C3"].fill); L.merge_cells("L29:O30"); L["L29"].alignment = L["L29"].alignment.copy(horizontal="left", vertical="top", wrap_text=True)
# nombres de la hoja
nombre("Dir_Basico", "'Liquidación'!$I$3")

# ═════════════ 2. Explicación ═════════════
SE = S["Explicación"]
E = W.create_sheet("Explicación")
for k, d in SE.column_dimensions.items():
    if d.width: E.column_dimensions[k].width = d.width
for c in range(1, 7): estilo(E.cell(1, c), SE.cell(1, c)); estilo(E.cell(2, c), SE.cell(2, c))
E.row_dimensions[1].height = SE.row_dimensions[1].height or 24; E.row_dimensions[2].height = SE.row_dimensions[2].height or 16
E.merge_cells("A1:F1"); E.merge_cells("A2:F2")
texto(E, "A1", "Explicación de la liquidación del Director  ·  {Mes} {anio}")
poner(E, "A2", SL["A2"].value)
SECCIONES = [
    ("Qué es este archivo",
     ["Es la liquidación de {nombre} con la misma forma que el libro de un comercial: la primera hoja tiene el mismo encabezado, el resultado 5.8, la política anterior, la política nueva y el comparativo de transición en las mismas filas y columnas. Así se pueden poner los dos libros lado a lado."]),
    ("De dónde sale el «real» del director",
     ["El director no tiene venta propia en la política nueva. Su real es el agregado del equipo (núm. 5.9, método «{metodo}»): ventas por cumplimiento del equipo ponderado por meta de cada producto, y base social del equipo frente a la meta del equipo. Diversificación, innovación y satisfacción son el promedio del equipo.",
      "La hoja «Detalle del equipo» muestra lo que aporta cada comercial. Sus totales alimentan la hoja Liquidación."]),
    ("Resultado de {mes}",
     ["Score {score}, factor {factorPct}: la política nueva paga {pagoNueva}. El esquema anterior paga {comisionAnterior} ({tasaAnterior} de {baseAnterior}). En la transición rige {rige}."]),
    ("Política anterior",
     ["El director recibe {tasaAnterior} fijo sobre la facturación del mes ({nLineas} líneas, hoja «Facturas») y, aparte, {tasaBtl} sobre el ingreso de ejecución de los eventos BTL ({btlAnterior}). No hay meta ni tramos."]),
    ("Bonificación BTL del director  ·  núm. 5.11.5",
     ["Escala sobre el IMR según el cumplimiento y el margen de la utilidad del evento, con tope de 0,25 × IMR por evento y 1 × IMR al año, y la salvaguarda conjunta con el comercial. Queda «Pendiente» hasta marcar en amarillo la participación material, la certificación financiera y la satisfacción del cliente."]),
    ("Celdas amarillas",
     ["Son las únicas para digitar o confirmar: meta de Misión del equipo, meta de base social del equipo y las condiciones del BTL. El resto son fórmulas."]),
]
r = 4
for titulo, parrafos in SECCIONES:
    for c in range(1, 7): estilo(E.cell(r, c), SE.cell(4, c))
    E.row_dimensions[r].height = 18; E.merge_cells(f"A{r}:F{r}"); texto(E, f"A{r}", titulo); r += 1
    for p in parrafos:
        for c in range(1, 7): estilo(E.cell(r, c), SE.cell(9, c))
        E.row_dimensions[r].height = 48; E.merge_cells(f"A{r}:F{r}"); texto(E, f"A{r}", p); r += 1
    r += 1
estilo(E.cell(r, 1), S["Supuestos y pendientes"]["A27"]); poner(E, f"A{r}", "Documento de simulación. No constituye liquidación oficial de pago.")
E.print_area = f"A1:F{r}"

# ═════════════ 3. Detalle del equipo ═════════════
SF = S["Facturas"]
D = W.create_sheet("Detalle del equipo")
COLS_EQ = [("A", "Comercial", "nombre", 24), ("B", "Meta Edu/AT", "metaEdu", 13), ("C", "Venta recaudada Edu/AT", "recaudadaEdu", 13),
           ("D", "Venta reconocida Edu/AT", "ventaEdu", 13), ("E", "Cumplimiento Edu/AT", None, 10), ("F", "Facturas Misión", "facturasMision", 8),
           ("G", "Venta Misión", "ventaMision", 13), ("H", "Meta Congreso", "metaCongreso", 11), ("I", "Venta Congreso", "ventaCongreso", 11),
           ("J", "Meta cultural", "metaCultural", 11), ("K", "Venta cultural", "ventaCultural", 11), ("L", "Base social inicio", "bsInicial", 9),
           ("M", "Base social cierre", "bsCierre", 9), ("N", "Score individual (total: promedio)", "score", 10), ("O", "Base facturada (esquema anterior)", None, 14),
           ("P", "Comisión del director (1,5 %)", None, 13), ("Q", "Clave en facturación", "clave", 18)]
for col, _, _, w in COLS_EQ: D.column_dimensions[col].width = w
for c in range(1, 18): estilo(D.cell(1, c), SF.cell(1, 1)); estilo(D.cell(2, c), SF.cell(2, 1))
D.row_dimensions[1].height = 22; D.merge_cells("A1:P1"); D.merge_cells("A2:P2"); D.merge_cells("A3:P3")
texto(D, "A1", "Detalle del equipo  ·  aporte de cada comercial al agregado del director  ·  {Mes} {anio}")
poner(D, "A2", "Fuente: liquidador del equipo y facturación cargada en la app  ·  Simulación. No es un pago oficial.")
estilo(D["A3"], SF.cell(5, 1)); D["A3"].font = D["A3"].font.copy(i=True); D.row_dimensions[3].height = 26
poner(D, "A3", "Cada fila es lo que aporta un comercial. Los totales (fila Total del equipo) son el «real» del director en la hoja Liquidación. El canal nacional solo entra en la base del esquema anterior.")
D.row_dimensions[4].height = 36
for col, tit, _, _ in COLS_EQ:
    estilo(D[f"{col}4"], SF["A4"]); D[f"{col}4"].value = tit
FMT_P = SF["F5"].number_format
for r in range(5, 13):
    for col, _, campo, _ in COLS_EQ:
        estilo(D[f"{col}{r}"], SF.cell(5 if r % 2 else 6, 1))
        D[f"{col}{r}"].number_format = {"E": "0.00%", "F": "0", "L": "0", "M": "0", "N": "0.00", "A": "General", "Q": "General"}.get(col, FMT_P)
        if col not in ("A", "Q"): D[f"{col}{r}"].alignment = D[f"{col}{r}"].alignment.copy(horizontal="right")
TOT = 13
for col, _, _, _ in COLS_EQ:
    c = D[f"{col}{TOT}"]; estilo(c, SF.cell(5, 1)); c.font = c.font.copy(b=True); c.fill = copy(SL["A13"].fill)
    c.number_format = D[f"{col}12"].number_format; c.alignment = copy(D[f"{col}12"].alignment)
poner(D, f"A{TOT}", "Total del equipo")
for col in "BCDFGHIJKLMOP": poner(D, f"{col}{TOT}", f"=SUM({col}5:{col}12)")
poner(D, f"E{TOT}", f"=IF(N(B{TOT})=0,\"\",D{TOT}/B{TOT})"); poner(D, f"N{TOT}", f"=IF(COUNT(N5:N12)=0,\"\",AVERAGE(N5:N12))")
for r, etq, f in [(TOT + 1, "Base del mes (hoja Facturas)", "=SUM(Fac_Base)"), (TOT + 2, "Diferencia (debe ser 0)", f"=O{TOT}-O{TOT + 1}")]:
    estilo(D[f"A{r}"], SF.cell(5, 1)); D.merge_cells(f"A{r}:N{r}"); D[f"A{r}"].alignment = D[f"A{r}"].alignment.copy(horizontal="right")
    poner(D, f"A{r}", etq); estilo(D[f"O{r}"], SF.cell(5, 6)); D[f"O{r}"].alignment = D[f"O{r}"].alignment.copy(horizontal="right"); poner(D, f"O{r}", f)
estilo(D[f"A{TOT + 4}"], S["Supuestos y pendientes"]["A27"]); poner(D, f"A{TOT + 4}", "Documento de simulación. No constituye liquidación oficial de pago.")
D.column_dimensions["Q"].hidden = True
D.freeze_panes = "B5"; D.page_setup.orientation = "landscape"; D.page_setup.fitToWidth = 1; D.page_setup.fitToHeight = 0
D.sheet_properties.pageSetUpPr = copy(SL.sheet_properties.pageSetUpPr); D.print_area = f"A1:P{TOT + 4}"
for n, col in [("Eq_MetaEdu", "B"), ("Eq_RecEdu", "C"), ("Eq_VentaEdu", "D"), ("Eq_FactMision", "F"), ("Eq_VentaMision", "G"),
               ("Eq_MetaCongreso", "H"), ("Eq_VentaCongreso", "I"), ("Eq_MetaCultural", "J"), ("Eq_VentaCultural", "K"),
               ("Eq_BSInicial", "L"), ("Eq_BSCierre", "M"), ("Eq_Base", "O")]:
    nombre(n, f"'Detalle del equipo'!${col}$5:${col}$12")

# ═════════════ 4. Facturas ═════════════
F = W.create_sheet("Facturas")
COLS_F = [("A", "Comercial (asesor)", "asesor", 22), ("B", "Factura", "factura", 16), ("C", "Producto (grupo · subgrupo)", "producto", 30),
          ("D", "Cliente", "entidad", 44), ("E", "Servicio", "servicio", 30), ("F", "Base", "base", 14), ("G", "Estado", "estado", 12),
          ("H", "Fecha", "fecha", 12), ("I", "% Dirección", "pctDireccion", 11), ("J", "Comisión del director", None, 14), ("K", "Fila del archivo", "fila", 10)]
for col, _, _, w in COLS_F: F.column_dimensions[col].width = w
for c in range(1, 12): estilo(F.cell(1, c), SF.cell(1, 1)); estilo(F.cell(2, c), SF.cell(2, 1))
F.row_dimensions[1].height = SF.row_dimensions[1].height or 22; F.merge_cells("A1:K1"); F.merge_cells("A2:K2")
texto(F, "A1", "Facturas del mes  ·  base del esquema anterior del director  ·  {Mes} {anio}")
texto(F, "A2", "{nLineas} líneas de la hoja «{hojaFacturacion}» del archivo cargado. La comisión del director es Base × % Dirección.  ·  Simulación. No es un pago oficial.")
F.row_dimensions[4].height = SF.row_dimensions[4].height or 24
for col, tit, _, _ in COLS_F: estilo(F[f"{col}4"], SF["A4"]); F[f"{col}4"].value = tit
for r in (5, 6):
    for col, _, _, _ in COLS_F:
        estilo(F[f"{col}{r}"], SF.cell(r, 1))
        F[f"{col}{r}"].number_format = {"F": FMT_P, "J": FMT_P, "I": "0.00%", "H": "yyyy-mm-dd", "K": "0"}.get(col, "General")
        if col in "FIJK": F[f"{col}{r}"].alignment = F[f"{col}{r}"].alignment.copy(horizontal="right")
    poner(F, f"J{r}", f"=F{r}*I{r}")
for col, _, _, _ in COLS_F:
    c = F[f"{col}7"]; estilo(c, SF.cell(5, 1)); c.font = c.font.copy(b=True); c.fill = copy(SL["A13"].fill); c.number_format = F[f"{col}6"].number_format; c.alignment = copy(F[f"{col}6"].alignment)
poner(F, "A7", "Total"); poner(F, "F7", "=SUM(F5:F6)"); poner(F, "J7", "=SUM(J5:J6)")
F.freeze_panes = "A5"; F.auto_filter.ref = "A4:K6"
F.page_setup.orientation = "landscape"; F.page_setup.fitToWidth = 1; F.page_setup.fitToHeight = 0; F.sheet_properties.pageSetUpPr = copy(SL.sheet_properties.pageSetUpPr)
for n, col in [("Fac_Asesor", "A"), ("Fac_Base", "F"), ("Fac_Pct", "I"), ("Fac_Com", "J")]:
    nombre(n, f"'Facturas'!${col}$5:${col}$6")

# ═════════════ 5. Supuestos y pendientes ═════════════
SS = S["Supuestos y pendientes"]
P = W.create_sheet("Supuestos y pendientes")
for k, d in SS.column_dimensions.items():
    if d.width: P.column_dimensions[k].width = d.width
for c in range(1, 5): estilo(P.cell(1, c), SS.cell(1, c)); estilo(P.cell(2, c), SS.cell(2, c))
P.row_dimensions[1].height = 24; P.merge_cells("A1:D1"); P.merge_cells("A2:D2")
poner(P, "A1", "Supuestos y pendientes"); texto(P, "A2", "Director  ·  {Mes} {anio}  ·  Simulación. No es un pago oficial.")
ITEMS = [
    "El real del director es el agregado del equipo (núm. 5.9). Método usado: {metodo}. Regla del 100 %: {regla100}.",
    "Meta de Misión del equipo: {metaMision} (Anexo 2). Meta de base social del equipo: {metaBaseSocial}. Son celdas amarillas en la Liquidación.",
    "Esquema anterior: {tasaAnterior} sobre toda la facturación del mes ({baseAnterior}, {nLineas} líneas) y {tasaBtl} sobre el ingreso de ejecución BTL.",
    "Transición (octubre a diciembre de 2026): se paga el valor más favorable entre la política nueva y el esquema anterior. Desde enero de 2027 solo aplica la nueva.",
    "BTL del director: Pendiente hasta confirmar participación material, certificación financiera y satisfacción del cliente del evento {eventoBtl}.",
    "Canal nacional (Dirección Comercial): base {canalProduccion}. Solo entra en la base del esquema anterior; no suma al score ni a las metas de los comerciales.",
    "Pendiente con la jefa: método del score, regla del 100 % y si la meta de base social queda en {metaBaseSocial} o en la suma de metas individuales ({metaBaseSuma}).",
    "Datos que la app aún no trae: {faltantes}.",
]
for i, t in enumerate(ITEMS):
    r = 4 + i
    estilo(P[f"A{r}"], SS["A4"]); estilo(P[f"B{r}"], SS["B4"]); P.merge_cells(f"B{r}:D{r}"); P.row_dimensions[r].height = 30
    poner(P, f"A{r}", i + 1); texto(P, f"B{r}", t)
estilo(P.cell(4 + len(ITEMS) + 1, 1), SS["A27"]); poner(P, f"A{4 + len(ITEMS) + 1}", "Documento de simulación. No constituye liquidación oficial de pago.")

# ═════════════ 6. Parámetros (oculta) ═════════════
PA = W.create_sheet("Parámetros"); PA.sheet_state = "hidden"
PA.column_dimensions["A"].width = 42; PA.column_dimensions["B"].width = 18; PA.column_dimensions["C"].width = 60
poner(PA, "A1", "Parámetros del director (los pone la app al exportar)"); PA["A1"].font = PA["A1"].font.copy(b=True)
PARAMS = [("Dir_Opp", "Oportunidad variable", "director.oportunidad"), ("Peso_Ventas", "Peso ventas", "param.pesoVentas"),
          ("Peso_Base", "Peso base social", "param.pesoBase"), ("Peso_SER", "Peso SERFISCAL", "param.pesoSer"),
          ("Peso_Innovacion", "Peso innovación", "param.pesoInnovacion"), ("Peso_Satisfaccion", "Peso satisfacción", "param.pesoSat"),
          ("Tope_pago", "Tope por indicador", "param.topeIndicador"), ("Tope_curva", "Tope de la curva", "param.tope"),
          ("Score_minimo", "Score mínimo", "param.minimo"), ("Tope_congreso", "Tope Congreso", "param.topeCongreso"),
          ("Sat_Esperada", "Satisfacción esperada", "param.satisfaccionEsperada"), ("Valor_factura_Mision", "Valor por factura de Misión", "param.valorFacturaMision"),
          ("Tasa_Dir_Anterior", "Tasa del director · esquema anterior", "param.tasaAnterior"), ("Tasa_Dir_BTL_Anterior", "Tasa BTL · esquema anterior", "param.tasaBtlAnterior"),
          ("Umbral_100", "Regla del 100 % (SÍ/NO)", "regla100"), ("BTL_cump_min", "BTL · cumplimiento mínimo", "param.btlCumpMin"),
          ("BTL_cump_alto", "BTL · cumplimiento alto", "param.btlCumpAlto"), ("BTL_margen_medio", "BTL · margen medio", "param.btlMargenMedio"),
          ("BTL_margen_alto", "BTL · margen alto", "param.btlMargenAlto"), ("BTLd_pct90", "BTL director · % con cumplimiento 90-100 %", "param.btlPct90"),
          ("BTLd_pct_medio", "BTL director · % margen medio", "param.btlPctMedio"), ("BTLd_pct_alto", "BTL director · % margen alto", "param.btlPctAlto"),
          ("BTLd_tope_evento", "BTL director · tope por evento (× IMR)", "param.btlTopeEvento"), ("BTLd_tope_anio", "BTL director · tope anual (× IMR)", "param.btlTopeAnio"),
          ("BTL_salvaguarda", "BTL · salvaguarda conjunta (× utilidad real)", "param.btlSalvaguarda"),
          ("N_comerciales", "Comerciales que liquidan en el mes", "nComerciales")]
for i, (n, etq, ruta) in enumerate(PARAMS):
    r = 3 + i; poner(PA, f"A{r}", etq); entrada(PA, f"B{r}", ruta); poner(PA, f"C{r}", n); nombre(n, f"'Parámetros'!$B${r}")
r0 = 3 + len(PARAMS) + 1
poner(PA, f"A{r0}", "Curva de pago · puntaje"); poner(PA, f"B{r0}", "factor")
for i in range(8):
    entrada(PA, f"A{r0 + 1 + i}", f"curvaAnclas.{i}.puntaje"); entrada(PA, f"B{r0 + 1 + i}", f"curvaAnclas.{i}.factor")
nombre("Curva_puntos", f"'Parámetros'!$A${r0 + 1}:$A${r0 + 8}")
nombre("Curva_factor", f"'Parámetros'!$B${r0 + 1}:$B${r0 + 8}")

# ═════════════ Guardar ═════════════
OUT.mkdir(parents=True, exist_ok=True)
W.save(OUT / "plantilla_liquidacion_director.xlsx")
MAPEO = {
    "nota": "Excel del Director v15 (misma forma que el libro de un comercial). La app escribe en estas celdas; el resto son fórmulas.",
    "entradas": ENTRADAS,
    "tablas": {
        "equipo": {"hoja": "Detalle del equipo", "primera": 5, "ultima": 12,
                   "columnas": {c: campo for c, _, campo, _ in COLS_EQ if campo},
                   "formulas": {"E": "IF(N(B{r})=0,\"\",D{r}/B{r})", "O": "SUMIF(Fac_Asesor,$Q{r},Fac_Base)", "P": "O{r}*Tasa_Dir_Anterior"}},
        "facturas": {"hoja": "Facturas", "primera": 5, "ultima": 6,
                     "columnas": {c: campo for c, _, campo, _ in COLS_F if campo},
                     "formulas": {"J": "F{r}*I{r}"}},
    },
}
(OUT / "mapeo_celdas_director.json").write_text(json.dumps(MAPEO, ensure_ascii=False, indent=1), encoding="utf-8")
(OUT / "textos_director.json").write_text(json.dumps(TEXTOS, ensure_ascii=False, indent=1), encoding="utf-8")
print("hojas:", W.sheetnames, "· entradas:", sum(len(v) for v in ENTRADAS.values()), "· textos:", len(TEXTOS), "· nombres:", len(W.defined_names))
