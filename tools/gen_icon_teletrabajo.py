"""Genera public/assets/icon_teletrabajo.png (32x32 RGBA) en pixel art.

Uso (desde la raíz del repo, requiere Pillow):
  python3 tools/gen_icon_teletrabajo.py
"""

import os

from PIL import Image, ImageDraw

SIZE = 32
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'icon_teletrabajo.png')

OUTLINE = (36, 36, 36, 255)
SCREEN = (0x7F, 0xC8, 0xFF, 255)
BODY = (0x9A, 0xA0, 0xA6, 255)
COFFEE = (0x8B, 0x5A, 0x2B, 255)


def rect(draw: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, fill):
    draw.rectangle((x0, y0, x1, y1), fill=fill)


def main() -> None:
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Portátil (frontal), contorno oscuro de 1 px.
    rect(draw, 6, 6, 25, 16, OUTLINE)
    rect(draw, 7, 7, 24, 15, SCREEN)

    rect(draw, 4, 17, 27, 22, OUTLINE)
    rect(draw, 5, 18, 26, 21, BODY)

    # Bisagra/base inferior para mejorar legibilidad a 32 px.
    rect(draw, 8, 23, 23, 24, OUTLINE)
    rect(draw, 9, 23, 22, 23, BODY)

    # Taza de café al lado (derecha), con asa.
    rect(draw, 26, 14, 30, 19, OUTLINE)
    rect(draw, 27, 15, 29, 18, COFFEE)
    rect(draw, 30, 15, 30, 17, OUTLINE)

    img.save(OUT)
    print(f'ok {OUT} {img.size} {img.mode}')


if __name__ == '__main__':
    main()
