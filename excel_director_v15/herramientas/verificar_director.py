"""
Verifica el Excel del Director v15.
Uso: python3 herramientas/verificar_director.py <Director.xlsx> <Comercial.xlsx> [--esperado score=91.83 nueva=7208412 anterior=3792727 btl=2586654]
1) Recalcula con LibreOffice y cuenta errores (#NAME?, #VALUE!, Err:…).  2) Compara la forma de la hoja Liquidación con la
de un comercial (anchos, combinaciones, rótulos).  3) Muestra y compara las cifras clave. Sale con código 1 si algo falla.
"""
import sys, os, subprocess, tempfile, warnings
import openpyxl
warnings.filterwarnings("ignore")
dir_x, com_x = sys.argv[1], sys.argv[2]
esperado = dict(a.split("=") for a in sys.argv[3:] if "=" in a)
tmp = tempfile.mkdtemp()
subprocess.run(["soffice", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", tmp, dir_x], capture_output=True)
rc = os.path.join(tmp, os.path.basename(dir_x))
v = openpyxl.load_workbook(rc, data_only=True); f = openpyxl.load_workbook(dir_x); c = openpyxl.load_workbook(com_x)["Liquidación"]
ok = True
err = [f"{s.title}!{x.coordinate}={x.value}" for s in v for r in s.iter_rows() for x in r if isinstance(x.value, str) and x.value.startswith(("#", "Err:"))]
print(f"1) Errores después de recalcular: {len(err)}", err[:10]); ok &= not err
d = f["Liquidación"]
anchos = all(c.column_dimensions[k].width == d.column_dimensions[k].width for k in "ABCDEFGHIJKLMNO")
mc = {str(m) for m in c.merged_cells.ranges if m.max_row <= 85}; md = {str(m) for m in d.merged_cells.ranges}
secciones = ["A7", "L7", "A8", "A9", "A10", "A11", "A12", "A13", "A14", "A18", "A19", "A25", "F19", "F20", "F27", "F34", "F38", "F42", "L18", "L19", "L20", "L21", "L22"]
iguales = [k for k in secciones if str(c[k].value or "").split("  ·  ")[0][:12] == str(d[k].value or "").split("  ·  ")[0][:12]]
print(f"2) Forma: anchos iguales={anchos} · combinaciones del comercial presentes {len(mc & md)}/{len(mc)} · rótulos clave en la misma celda {len(iguales)}/{len(secciones)}")
ok &= anchos and len(mc & md) == len(mc) and len(iguales) == len(secciones)
L = v["Liquidación"]
cifras = {"score": L["G13"].value, "factor": L["G14"].value, "nueva": L["G15"].value, "anterior": L["C24"].value, "btl": L["C27"].value, "transicion": L["N22"].value,
          "control_base": v["Detalle del equipo"].cell(v["Detalle del equipo"].max_row, 15).value}
for r in range(1, v["Detalle del equipo"].max_row + 1):
    if v["Detalle del equipo"].cell(r, 1).value == "Diferencia (debe ser 0)": cifras["control_base"] = v["Detalle del equipo"].cell(r, 15).value
print("3) Cifras:", {k: (round(x, 4) if isinstance(x, (int, float)) else x) for k, x in cifras.items()})
for k, e in esperado.items():
    x = cifras.get(k); bien = isinstance(x, (int, float)) and abs(x - float(e)) <= (0.01 if k == "score" else 1)
    print(f"   {k}: {x} vs {e} -> {'✓' if bien else '✗'}"); ok &= bien
ok &= abs(cifras["control_base"] or 0) < 0.5
print("RESULTADO:", "✓ OK" if ok else "✗ REVISAR"); sys.exit(0 if ok else 1)
