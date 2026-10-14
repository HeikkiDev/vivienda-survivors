"""Genera public/assets/fondo_sheet.png: hoja de 2 fotogramas (alas arriba / alas abajo) del Fondo buitre.

Parte de public/assets/fondo.png: separa las alas del cuerpo con una máscara, rota el ala izquierda
(la derecha queda tapada por el pico) hacia abajo sobre el hombro, la acorta un poco y la refleja
para el lado derecho. Sin antialiasing (NEAREST).

Uso: python tools/gen_fondo_sheet.py  (requiere Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent.parent / "public" / "assets"
SRC = ASSETS / "fondo.png"
OUT = ASSETS / "fondo_sheet.png"

SHOULDER = (32, 40)  # pivote del ala izquierda
WING_ANGLE = 90  # grados (antihorario): de alas arriba a alas abajo
WING_SCALE = 0.8  # escorzo para que el ala quepa en el lienzo
CENTER_X = 40
PAD = 20
MIN_ALPHA = 64


def body_mask(size: tuple[int, int]) -> Image.Image:
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((24, 0, 52, 30), fill=255)  # cabeza
    d.polygon([(48, 4), (62, 4), (66, 6), (68, 9), (69, 12), (69, 24), (64, 24), (60, 20), (50, 20)], fill=255)  # pico
    d.ellipse((23, 22, 57, 38), fill=255)  # gorguera
    d.ellipse((26, 32, 54, 76), fill=255)  # torso
    d.rectangle((25, 64, 56, 80), fill=255)  # cola y patas
    return mask


def remove_isolated(img: Image.Image) -> None:
    w, h = img.size
    px = img.load()
    alpha = [[px[x, y][3] for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if not alpha[y][x]:
                continue
            neighbours = sum(
                1
                for dx in (-1, 0, 1)
                for dy in (-1, 0, 1)
                if (dx or dy) and 0 <= x + dx < w and 0 <= y + dy < h and alpha[y + dy][x + dx]
            )
            if neighbours < 2:
                px[x, y] = (0, 0, 0, 0)


def wings_down_frame(src: Image.Image) -> Image.Image:
    w, h = src.size
    empty = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mask = body_mask((w, h))
    body = Image.composite(src, empty, mask)
    left_wing = Image.composite(empty, src, mask).crop((0, 0, CENTER_X, h))

    wing = Image.new("RGBA", (w + 2 * PAD, h + 2 * PAD), (0, 0, 0, 0))
    wing.paste(left_wing, (PAD, PAD))
    cx, cy = SHOULDER[0] + PAD, SHOULDER[1] + PAD
    wing = wing.rotate(WING_ANGLE, resample=Image.NEAREST, center=(cx, cy))
    s = WING_SCALE
    wing = wing.transform(wing.size, Image.AFFINE, (1 / s, 0, cx - cx / s, 0, 1 / s, cy - cy / s), resample=Image.NEAREST)
    wing = wing.crop((PAD, PAD, PAD + w, PAD + h))
    wing.putalpha(wing.getchannel("A").point(lambda v: v if v >= MIN_ALPHA else 0))
    remove_isolated(wing)

    frame = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    frame.alpha_composite(wing)
    frame.alpha_composite(wing.transpose(Image.FLIP_LEFT_RIGHT))
    frame.alpha_composite(body)
    return frame


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    w, h = src.size
    sheet = Image.new("RGBA", (w * 2, h), (0, 0, 0, 0))
    sheet.paste(src, (0, 0))
    sheet.paste(wings_down_frame(src), (w, 0))
    sheet.save(OUT)
    print(f"Generado {OUT} ({w * 2}x{h})")


if __name__ == "__main__":
    main()
