"""Genera public/assets/bg_solar.png: solar en obras visto desde arriba, repetible sin costuras.

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
OUT = os.path.join(ROOT, 'public', 'assets', 'bg_solar.png')
PREVIEW = os.path.join(ROOT, 'tools', 'preview_bg.png')

BASE = (0x5A, 0x4A, 0x3A)
NOISE_AMP = 6
NOISE_OCTAVES = [(8, 0.65), (16, 0.35)]  # (celdas por lado, peso); divisores de 128 → periódico
BLOB_COLORS = [(0x62, 0x50, 0x40), (0x52, 0x42, 0x34)]
BLOB_COUNT = 6
BLOB_BLUR = 10
BLOB_ALPHA = 200
STONE_COLORS = [(0x6E, 0x5D, 0x4B), (0x46, 0x3A, 0x2E)]
STONE_COUNT = 25
CRACK_COLOR = (0x4A, 0x3C, 0x2F)
CRACK_COUNT = 2
WEED_COLOR = (0x5B, 0x63, 0x40)
WEED_COUNT = 3

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
    img = Image.new('RGB', (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            n = sum(layer[y][x] * w for layer, w in layers)
            d = round(n * NOISE_AMP)
            px[x, y] = tuple(c + d for c in BASE)
    return img


def add_blobs(img, rng):
    """Manchas difusas: se dibujan en un lienzo 3×3 con copias envolventes y se recorta el centro."""
    for i in range(BLOB_COUNT):
        mask = Image.new('L', (SIZE * 3, SIZE * 3), 0)
        d = ImageDraw.Draw(mask)
        cx, cy = rng.uniform(0, SIZE), rng.uniform(0, SIZE)
        rx, ry = rng.uniform(16, 30), rng.uniform(12, 24)
        for dx, dy in OFFSETS:
            x, y = cx + SIZE + dx, cy + SIZE + dy
            d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=BLOB_ALPHA)
        mask = mask.filter(ImageFilter.GaussianBlur(BLOB_BLUR)).crop((SIZE, SIZE, SIZE * 2, SIZE * 2))
        color = Image.new('RGB', (SIZE, SIZE), BLOB_COLORS[i % len(BLOB_COLORS)])
        img.paste(color, (0, 0), mask)


def put(px, x, y, color):
    px[x % SIZE, y % SIZE] = color


def add_stones(img, rng):
    px = img.load()
    for _ in range(STONE_COUNT):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        color = rng.choice(STONE_COLORS)
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


def add_weeds(img, rng):
    px = img.load()
    for _ in range(WEED_COUNT):
        cx, cy = rng.randrange(SIZE), rng.randrange(SIZE)
        size = rng.randint(3, 5)
        for _ in range(size * 2):
            ox = rng.randint(-(size // 2), size // 2)
            oy = rng.randint(-(size // 2), size // 2)
            put(px, cx + ox, cy + oy, WEED_COLOR)


def main():
    rng = random.Random(SEED)
    img = base_layer(rng)
    add_blobs(img, rng)
    add_stones(img, rng)
    add_cracks(img, rng)
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
