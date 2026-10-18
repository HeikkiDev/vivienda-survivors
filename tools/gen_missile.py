"""Genera public/assets/missile.png (128x40 RGBA): el "Euríbor disparado", un misil rojo con un € en el fuselaje,
llama y una ligera estela de humo detrás.

Mira hacia la derecha (ángulo 0): el juego lo rota según su velocidad. El centro del fuselaje queda en el centro
de la imagen (donde está la hitbox); la estela ocupa la parte izquierda. Se dibuja a 4x y se reduce con LANCZOS
(mismo estilo que el resto del arte: contorno oscuro, colores planos y brillos sencillos). Se usa con scale 0.5.

Uso (desde la raíz del repo, requiere Pillow):
  python3 tools/gen_missile.py
"""

import os

from PIL import Image, ImageDraw

W, H = 128, 40
SS = 4  # supersampling
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'missile.png')

OUTLINE = (40, 16, 16, 255)
RED = (0xE0, 0x2A, 0x2A, 255)
RED_DARK = (0xA8, 0x16, 0x16, 255)
RED_LIGHT = (0xFF, 0x74, 0x6A, 255)
NOSE = (0xF2, 0xF2, 0xF2, 255)
NOSE_DARK = (0xB8, 0xB8, 0xC0, 255)
FIN = (0x3A, 0x3A, 0x48, 255)
EURO = (0xFF, 0xD4, 0x47, 255)
FLAME_OUT = (0xFF, 0x8C, 0x1A, 235)
FLAME_IN = (0xFF, 0xEC, 0x7A, 255)
SMOKE = (200, 200, 200)

LINE = 2 * SS
THIN = SS
CY = H / 2

BODY = (34, 12, 98, 28)  # fuselaje (rectángulo)
NOSE_TIP = 114
FINS = ((36, 12, 48, 12, 38, 3, 32, 3), (36, 28, 48, 28, 38, 37, 32, 37))
SMOKE_PUFFS = ((24, 5.5, 110), (15, 5, 80), (7, 4.5, 50))  # (x, radio, alfa)


def s(*values: float) -> list[int]:
    """Escala coordenadas de la rejilla de 128x40 a la de trabajo."""
    return [round(v * SS) for v in values]


def main() -> None:
    size = (W * SS, H * SS)
    img = Image.new('RGBA', size, (0, 0, 0, 0))

    # Estela de humo (círculos grises cada vez más transparentes).
    smoke = Image.new('RGBA', size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(smoke)
    for x, r, a in SMOKE_PUFFS:
        sd.ellipse(s(x - r, CY - r, x + r, CY + r), fill=(*SMOKE, a))
    img = Image.alpha_composite(img, smoke)

    d = ImageDraw.Draw(img)
    # Llama de la tobera.
    d.polygon(s(BODY[0], CY - 6, BODY[0], CY + 6, 18, CY), fill=FLAME_OUT)
    d.polygon(s(BODY[0], CY - 3, BODY[0], CY + 3, 25, CY), fill=FLAME_IN)

    # Aletas.
    for fin in FINS:
        d.polygon(s(*fin), fill=FIN, outline=OUTLINE)

    # Fuselaje con brillo y sombra.
    d.rectangle(s(*BODY), fill=RED)
    d.rectangle(s(BODY[0], BODY[3] - 4, BODY[2], BODY[3]), fill=RED_DARK)
    d.line(s(BODY[0] + 2, BODY[1] + 3, BODY[2] - 2, BODY[1] + 3), fill=RED_LIGHT, width=2 * SS)
    d.rectangle(s(*BODY), outline=OUTLINE, width=LINE)

    # Ojiva.
    d.polygon(s(BODY[2], BODY[1], BODY[2], BODY[3], NOSE_TIP, CY), fill=NOSE)
    d.polygon(s(BODY[2], CY + 2, BODY[2], BODY[3], NOSE_TIP, CY), fill=NOSE_DARK)
    d.line(s(BODY[2], BODY[1], NOSE_TIP, CY, BODY[2], BODY[3]), fill=OUTLINE, width=LINE, joint='curve')
    d.line(s(BODY[2], BODY[1], BODY[2], BODY[3]), fill=OUTLINE, width=THIN)

    # Símbolo € en el fuselaje.
    ex, r = 66, 5.5
    d.arc(s(ex - r, CY - r, ex + r, CY + r), 45, 315, fill=EURO, width=2 * SS)
    for dy in (-1.5, 1.5):
        d.line(s(ex - r - 2.5, CY + dy, ex + 1.5, CY + dy), fill=EURO, width=THIN + SS // 2)

    img = img.resize((W, H), Image.LANCZOS)
    img.save(OUT)
    print(f'ok {OUT} {img.size} {img.mode}')


if __name__ == '__main__':
    main()
