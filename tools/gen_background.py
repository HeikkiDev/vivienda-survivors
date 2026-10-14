"""Genera public/assets/bg_acera.png: acera de baldosas de cemento vista desde arriba, repetible sin costuras.

Uso (desde la raíz del repo, requiere Pillow):  python3 tools/gen_background.py
También genera tools/preview_bg.png (mosaico 3×3) para comprobar las uniones.
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

SIZE = 128
SEED = 2026
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'bg_acera.png')
PREVIEW = os.path.join(ROOT, 'tools', 'preview_bg.png')

BASE = (0x62, 0x62, 0x5E)
NOISE_AMP = 5
NOISE_OCTAVES = [(16, 0.5), (32, 0.5)]  # (celdas por lado, peso); divisores de 128 → periódico
SLAB = 64  # 2×2 baldosas por tile
SLAB_TONE = 3  # variación de tono por baldosa (±)
JOINT_COLOR = (0x4C, 0x4C, 0x49)
JOINT_HIGHLIGHT = (0x6C, 0x6C, 0x68)
STAIN_COLORS = [(0x58, 0x58, 0x54), (0x5C, 0x5B, 0x55)]
STAIN_COUNT = 4
STAIN_BLUR = 6
STAIN_ALPHA = 170
GUM_COLORS = [(0x52, 0x52, 0x4F), (0x6E, 0x6E, 0x6A)]
GUM_COUNT = 18
CRACK_COLOR = (0x50, 0x50, 0x4C)
CRACK_COUNT = 2
WEED_COLOR = (0x5B, 0x63, 0x40)
WEED_COUNT = 2

OFFSETS = [(dx, dy) for dx in (-SIZE, 0, SIZE) for dy in (-SIZE, 0, SIZE)]


def smooth(t):
    return t * t * (3 - 2 * t)


def value_noise(rng, cells):
    """Ruido de valor periódico en SIZE, en rango [-1, 1]."""
    lattice = [[rng.uniform(-1, 1) for _ in range(cells)] for _ in range(cells)]
    step = SIZE / cells
    out = [[0.0] * SIZE for _ in range(SIZE)]
    for y in range(SIZE):
        gy, fy = divmod(y / step, 1)
        y0, y1, ty = int(gy) % cells, (int(gy) + 1) % cells, smooth(fy)
        for x in range(SIZE):
            gx, fx = divmod(x / step, 1)
            x0, x1, tx = int(gx) % cells, (int(gx) + 1) % cells, smooth(fx)
            top = lattice[y0][x0] + (lattice[y0][x1] - lattice[y0][x0]) * tx
            bot = lattice[y1][x0] + (lattice[y1][x1] - lattice[y1][x0]) * tx
            out[y][x] = top + (bot - top) * ty
    return out


def base_layer(rng):
    layers = [(value_noise(rng, cells), w) for cells, w in NOISE_OCTAVES]
    per_side = SIZE // SLAB
    tones = [[rng.randint(-SLAB_TONE, SLAB_TONE) for _ in range(per_side)] for _ in range(per_side)]
    img = Image.new('RGB', (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            n = sum(layer[y][x] * w for layer, w in layers)
            d = round(n * NOISE_AMP) + tones[y // SLAB][x // SLAB]
            px[x, y] = tuple(c + d for c in BASE)
    return img


def add_stains(img, rng):
    """Manchas de humedad/aceite: se dibujan en un lienzo 3×3 con copias envolventes y se recorta el centro."""
    for i in range(STAIN_COUNT):
        mask = Image.new('L', (SIZE * 3, SIZE * 3), 0)
        d = ImageDraw.Draw(mask)
        cx, cy = rng.uniform(0, SIZE), rng.uniform(0, SIZE)
        rx, ry = rng.uniform(6, 14), rng.uniform(5, 11)
        for dx, dy in OFFSETS:
            x, y = cx + SIZE + dx, cy + SIZE + dy
            d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=STAIN_ALPHA)
        mask = mask.filter(ImageFilter.GaussianBlur(STAIN_BLUR)).crop((SIZE, SIZE, SIZE * 2, SIZE * 2))
        color = Image.new('RGB', (SIZE, SIZE), STAIN_COLORS[i % len(STAIN_COLORS)])
        img.paste(color, (0, 0), mask)


def put(px, x, y, color):
    px[x % SIZE, y % SIZE] = color


def add_specks(img, rng):
    """Chicles y motas de árido de 1-2 px."""
    px = img.load()
    for _ in range(GUM_COUNT):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        color = rng.choice(GUM_COLORS)
        size = rng.choice((1, 2))
        for oy in range(size):
            for ox in range(size):
                put(px, x + ox, y + oy, color)


def add_cracks(img, rng):
    d = ImageDraw.Draw(img)
    for _ in range(CRACK_COUNT):
        x, y = rng.uniform(0, SIZE), rng.uniform(0, SIZE)
        angle = rng.uniform(0, math.tau)
        pts = [(x, y)]
        for _ in range(rng.randint(5, 8)):
            angle += rng.uniform(-0.7, 0.7)
            length = rng.uniform(2, 5)
            x, y = x + math.cos(angle) * length, y + math.sin(angle) * length
            pts.append((x, y))
        for dx, dy in OFFSETS:
            d.line([(px + dx, py + dy) for px, py in pts], fill=CRACK_COLOR, width=1)


def add_joints(img):
    """Juntas de 2 px entre baldosas (la del borde se reparte entre x=0 y x=SIZE-1) y bisel claro de 1 px."""
    px = img.load()
    for j in range(0, SIZE, SLAB):
        for t in range(SIZE):
            for a in (j, (j - 1) % SIZE):
                put(px, a, t, JOINT_COLOR)
                put(px, t, a, JOINT_COLOR)
            put(px, j + 1, t, JOINT_HIGHLIGHT)
            put(px, t, j + 1, JOINT_HIGHLIGHT)
    for j in range(0, SIZE, SLAB):
        for a in (j, (j - 1) % SIZE):
            for b in range(0, SIZE, SLAB):
                for c in (b, (b - 1) % SIZE):
                    put(px, a, c, JOINT_COLOR)


def add_weeds(img, rng):
    """Hierbajos que asoman por las juntas."""
    px = img.load()
    for _ in range(WEED_COUNT):
        j = rng.randrange(0, SIZE, SLAB)
        along = rng.randrange(SIZE)
        cx, cy = (j, along) if rng.random() < 0.5 else (along, j)
        size = rng.randint(3, 5)
        for _ in range(size * 2):
            ox = rng.randint(-(size // 2), size // 2)
            oy = rng.randint(-(size // 2), size // 2)
            put(px, cx + ox, cy + oy, WEED_COLOR)


def main():
    rng = random.Random(SEED)
    img = base_layer(rng)
    add_stains(img, rng)
    add_specks(img, rng)
    add_cracks(img, rng)
    add_joints(img)
    add_weeds(img, rng)
    img.save(OUT)

    preview = Image.new('RGB', (SIZE * 3, SIZE * 3))
    for ty in range(3):
        for tx in range(3):
            preview.paste(img, (tx * SIZE, ty * SIZE))
    preview.save(PREVIEW)
    print(f'ok {OUT} {img.size} {img.mode}')


if __name__ == '__main__':
    main()
