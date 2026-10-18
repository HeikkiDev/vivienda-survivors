"""Genera public/assets/chest.png (72x72 RGBA): cofre del tesoro de madera con herrajes dorados.

Se dibuja a 4x y se reduce con LANCZOS para suavizar los bordes (mismo estilo que el resto del arte:
contorno oscuro, colores planos y brillos sencillos). Se usa con scale 0.5 (36 px en pantalla).

Uso (desde la raíz del repo, requiere Pillow):
  python3 tools/gen_chest.py
"""

import os

from PIL import Image, ImageDraw

SIZE = 72
SS = 4  # supersampling
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'chest.png')

OUTLINE = (40, 24, 16, 255)
WOOD = (0x9C, 0x5B, 0x2E, 255)
WOOD_DARK = (0x76, 0x42, 0x20, 255)
WOOD_LIGHT = (0xBE, 0x78, 0x40, 255)
GOLD = (0xFF, 0xC9, 0x3C, 255)
GOLD_DARK = (0xC8, 0x8A, 0x10, 255)
GOLD_LIGHT = (0xFF, 0xEC, 0x9A, 255)
KEYHOLE = (36, 22, 14, 255)
SHADOW = (0, 0, 0, 70)

LINE = 2 * SS  # grosor del contorno
THIN = SS

LID_BOX = (8, 8, 64, 52)  # elipse cuya mitad superior es la tapa abombada
LID_BOTTOM = 30
BODY = (8, 30, 64, 62)
BANDS_X = (15, 51)
BAND_W = 6


def s(*values: float) -> list[int]:
    """Escala coordenadas de la rejilla de 72 px a la de trabajo."""
    return [round(v * SS) for v in values]


def silhouette(size: tuple[int, int]) -> Image.Image:
    """Máscara del cofre (tapa + cuerpo) para recortar las bandas doradas."""
    mask = Image.new('L', size, 0)
    md = ImageDraw.Draw(mask)
    md.pieslice(s(*LID_BOX), 180, 360, fill=255)
    md.rectangle(s(*BODY), fill=255)
    return mask


def main() -> None:
    size = (SIZE * SS, SIZE * SS)

    # Madera: cuerpo y tapa.
    chest = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(chest)
    d.rectangle(s(*BODY), fill=WOOD)
    d.pieslice(s(*LID_BOX), 180, 360, fill=WOOD)
    for y in (44, 53):
        d.line(s(10, y, 62, y), fill=WOOD_DARK, width=THIN)
    d.line(s(11, 22, 61, 22), fill=WOOD_DARK, width=THIN)
    d.arc(s(LID_BOX[0] + 5, LID_BOX[1] + 5, LID_BOX[2] - 5, LID_BOX[3] - 5), 200, 290, fill=WOOD_LIGHT, width=2 * SS)

    # Bandas doradas verticales, recortadas a la silueta.
    bands = Image.new('RGBA', size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(bands)
    for x0 in BANDS_X:
        bd.rectangle(s(x0, 0, x0 + BAND_W, BODY[3]), fill=GOLD, outline=OUTLINE, width=THIN)
        bd.line(s(x0 + 1.5, 0, x0 + 1.5, BODY[3] - 2), fill=GOLD_LIGHT, width=THIN)
        bd.line(s(x0 + BAND_W - 1.5, 0, x0 + BAND_W - 1.5, BODY[3] - 2), fill=GOLD_DARK, width=THIN)
    chest.paste(bands, (0, 0), Image.composite(bands, Image.new('RGBA', size), silhouette(size)))

    # Contornos.
    d = ImageDraw.Draw(chest)
    d.arc(s(*LID_BOX), 180, 360, fill=OUTLINE, width=LINE)
    d.rectangle(s(*BODY), outline=OUTLINE, width=LINE)

    # Franja dorada entre tapa y cuerpo.
    d.rectangle(s(6, LID_BOTTOM - 2, 66, LID_BOTTOM + 4), fill=GOLD, outline=OUTLINE, width=THIN)
    d.line(s(8, LID_BOTTOM - 0.5, 64, LID_BOTTOM - 0.5), fill=GOLD_LIGHT, width=THIN)

    # Cerradura.
    d.rounded_rectangle(s(29, 27, 43, 44), radius=2 * SS, fill=GOLD, outline=OUTLINE, width=THIN)
    d.line(s(31, 30, 31, 41), fill=GOLD_LIGHT, width=THIN)
    d.ellipse(s(34, 31, 38, 35), fill=KEYHOLE)
    d.polygon(s(34.5, 34, 37.5, 34, 38, 40, 34, 40), fill=KEYHOLE)

    # Destellos.
    for cx, cy, r in ((62, 8, 4), (8, 14, 3)):
        d.line(s(cx - r, cy, cx + r, cy), fill=GOLD_LIGHT, width=THIN)
        d.line(s(cx, cy - r, cx, cy + r), fill=GOLD_LIGHT, width=THIN)

    # Sombra en el suelo, por debajo.
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse(s(10, 59, 62, 68), fill=SHADOW)
    img = Image.alpha_composite(img, chest)

    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    img.save(OUT)
    print(f'ok {OUT} {img.size} {img.mode}')


if __name__ == '__main__':
    main()
