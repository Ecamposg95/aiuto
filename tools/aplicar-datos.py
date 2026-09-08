#!/usr/bin/env python3
"""Sustituye los datos de muestra del sitio AIUTO por los reales.

Uso:
    python3 tools/aplicar-datos.py              # simulacro: dice qué cambiaría
    python3 tools/aplicar-datos.py --aplicar    # escribe los cambios
    python3 tools/aplicar-datos.py --estado     # qué datos de muestra siguen vivos

Los valores se editan en tools/datos.json. Un campo vacío se ignora, así que
puedes ir sustituyendo por partes. El script es idempotente: una vez aplicado un
cambio, volver a ejecutarlo no hace nada.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "sitio"
CONFIG = RAIZ / "tools" / "datos.json"

VERDE, AMARILLO, ROJO, GRIS, FIN = "\033[32m", "\033[33m", "\033[31m", "\033[90m", "\033[0m"


def paginas():
    return sorted(SITIO.glob("*.html"))


def cargar_config():
    if not CONFIG.exists():
        sys.exit(f"{ROJO}No encuentro {CONFIG}{FIN}")
    with CONFIG.open(encoding="utf-8") as fh:
        return json.load(fh)


def estado():
    """Reporta qué datos de muestra siguen presentes en el sitio."""
    cfg = cargar_config()
    print(f"\n{GRIS}Datos de muestra que siguen en el sitio:{FIN}\n")

    pendientes = 0
    for clave, campo in cfg["textos"].items():
        buscar = campo["buscar"]
        archivos = [p.name for p in paginas() if buscar in p.read_text(encoding="utf-8")]
        if archivos:
            pendientes += 1
            print(f"  {AMARILLO}●{FIN} {clave:<18} {buscar}")
            print(f"    {GRIS}{len(archivos)} archivo(s): {', '.join(archivos)}{FIN}")
        else:
            print(f"  {VERDE}✓{FIN} {clave:<18} {GRIS}ya sustituido{FIN}")

    print()
    for texto in [k for k in cfg["enlaces"] if not k.startswith("_")]:
        patron = f'<a href="#">{texto}</a>'
        n = sum(p.read_text(encoding="utf-8").count(patron) for p in paginas())
        if n:
            pendientes += 1
            print(f"  {AMARILLO}●{FIN} enlace vacío       {texto} {GRIS}({n} apariciones){FIN}")
        else:
            print(f"  {VERDE}✓{FIN} enlace             {texto} {GRIS}ya enlazado o retirado{FIN}")

    # Fotografía
    print()
    for p in paginas():
        for m in re.finditer(r'<div class="photo[^>]*>\s*<span class="mono">([^<]*)</span>', p.read_text(encoding="utf-8")):
            pendientes += 1
            print(f"  {AMARILLO}●{FIN} foto pendiente     {p.name} {GRIS}— {m.group(1)}{FIN}")

    print(f"\n{GRIS}{pendientes} pendiente(s). Detalle en docs/CONTENIDO.md{FIN}\n")
    return pendientes


def aplicar(escribir):
    cfg = cargar_config()
    cambios = {}

    for p in paginas():
        original = p.read_text(encoding="utf-8")
        nuevo = original

        for clave, campo in cfg["textos"].items():
            valor = campo.get("reemplazar", "").strip()
            if valor:
                nuevo = nuevo.replace(campo["buscar"], valor)

        for texto, url in cfg["enlaces"].items():
            if texto.startswith("_") or not url.strip():
                continue
            nuevo = nuevo.replace(f'<a href="#">{texto}</a>', f'<a href="{url.strip()}">{texto}</a>')

        if nuevo != original:
            # cuenta de líneas modificadas, solo para el reporte
            n = sum(1 for a, b in zip(original.splitlines(), nuevo.splitlines()) if a != b)
            cambios[p.name] = n
            if escribir:
                p.write_text(nuevo, encoding="utf-8")

    if not cambios:
        print(f"\n{GRIS}Nada que cambiar. Llena los campos de tools/datos.json "
              f"o los valores ya están aplicados.{FIN}\n")
        return

    titulo = "Aplicado" if escribir else "Simulacro (nada se escribió)"
    print(f"\n{VERDE if escribir else AMARILLO}{titulo}{FIN}\n")
    for nombre, n in sorted(cambios.items()):
        print(f"  {nombre:<20} {n} línea(s)")
    total = sum(cambios.values())
    print(f"\n  {len(cambios)} archivo(s), {total} línea(s)")
    if escribir:
        print(f"\n{GRIS}Revisa con: git diff sitio/  ·  luego vuelve a subir los "
              f"archivos cambiados al hosting{FIN}\n")
    else:
        print(f"\n{GRIS}Para escribirlos: python3 tools/aplicar-datos.py --aplicar{FIN}\n")


if __name__ == "__main__":
    args = set(sys.argv[1:])
    if args - {"--aplicar", "--estado"}:
        sys.exit(__doc__)
    if "--estado" in args:
        estado()
    else:
        aplicar(escribir="--aplicar" in args)
