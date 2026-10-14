#!/usr/bin/env python3
"""Genera los efectos retro (public/assets/sfx/*.wav) y, si no existe, la música en bucle
(public/assets/music/loop.ogg + loop.mp3) de Vivienda Survivors.

Requisitos: numpy. Para la música se usa ffmpeg (si no está, se deja loop.wav).
Uso: python3 tools/gen_sfx.py [--music]   (--music regenera la música aunque exista)
"""
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 22050
ROOT = Path(__file__).resolve().parent.parent
SFX_DIR = ROOT / "public" / "assets" / "sfx"
MUSIC_DIR = ROOT / "public" / "assets" / "music"
RNG = np.random.default_rng(7)


def midi(n: float) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(SR * dur)) / SR


def square(freq, dur: float, duty: float = 0.5) -> np.ndarray:
    """Onda cuadrada; `freq` puede ser constante o un array (barrido)."""
    n = int(SR * dur)
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    phase = np.cumsum(f) / SR
    return np.where((phase % 1.0) < duty, 1.0, -1.0)


def triangle(freq, dur: float) -> np.ndarray:
    n = int(SR * dur)
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    phase = np.cumsum(f) / SR
    return 4 * np.abs((phase % 1.0) - 0.5) - 1


def noise(dur: float) -> np.ndarray:
    return RNG.uniform(-1, 1, int(SR * dur))


def env(n: int, attack: float = 0.005, release: float = 0.05, curve: float = 1.0) -> np.ndarray:
    """Envolvente lineal de ataque + decaimiento exponencial suave hasta 0."""
    e = np.ones(n)
    a = min(n, int(SR * attack))
    if a > 0:
        e[:a] = np.linspace(0, 1, a)
    r = min(n - a, int(SR * release))
    if r > 0:
        e[n - r:] *= np.linspace(1, 0, r) ** curve
    return e


def decay(n: int, rate: float) -> np.ndarray:
    return np.exp(-rate * np.arange(n) / SR)


def normalize(x: np.ndarray, peak: float) -> np.ndarray:
    m = np.max(np.abs(x))
    return x if m == 0 else x * (peak / m)


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"  {path.relative_to(ROOT)}  {len(x) / SR:.2f} s")


def concat(*parts: np.ndarray) -> np.ndarray:
    return np.concatenate(parts)


# ---------------------------------------------------------------- efectos

def sfx_shoot() -> np.ndarray:
    d = 0.08
    f = np.linspace(midi(84), midi(72), int(SR * d))
    x = square(f, d, 0.25)
    return normalize(x * env(len(x), 0.002, 0.07), 0.35)


def sfx_hit() -> np.ndarray:
    d = 0.09
    n = int(SR * d)
    f = np.linspace(220, 90, n)
    body = square(f, d, 0.5) * decay(n, 35)
    crack = noise(d) * decay(n, 80)
    return normalize((0.6 * body + 0.5 * crack) * env(n, 0.001, 0.03), 0.4)


def sfx_hurt() -> np.ndarray:
    d = 0.28
    n = int(SR * d)
    f = np.linspace(330, 110, n) * (1 + 0.04 * np.sin(2 * np.pi * 30 * t_axis(d)))
    x = 0.7 * square(f, d, 0.5) + 0.3 * noise(d) * decay(n, 18)
    return normalize(x * env(n, 0.002, 0.15), 0.5)


def sfx_coin() -> np.ndarray:
    a = square(midi(88), 0.04, 0.5)
    b = square(midi(95), 0.11, 0.5)
    x = concat(a, b)
    return normalize(x * env(len(x), 0.001, 0.09), 0.3)


def sfx_levelup() -> np.ndarray:
    notes = [72, 76, 79, 84, 88, 91]
    parts = []
    for i, nte in enumerate(notes):
        d = 0.07 if i < len(notes) - 1 else 0.35
        tone = square(midi(nte), d, 0.5) * 0.7 + square(midi(nte + 12), d, 0.125) * 0.3
        parts.append(tone * env(len(tone), 0.002, d * 0.6 if i < len(notes) - 1 else 0.3))
    return normalize(concat(*parts), 0.45)


def sfx_promise() -> np.ndarray:
    seq = [(67, 0.08), (67, 0.08), (72, 0.3)]
    parts = []
    for nte, d in seq:
        chord = square(midi(nte), d, 0.5) + 0.6 * square(midi(nte + 4), d, 0.25) + 0.5 * square(midi(nte + 7), d, 0.25)
        parts.append(chord * env(len(chord), 0.002, d * 0.5))
    return normalize(concat(*parts), 0.45)


def sfx_death() -> np.ndarray:
    # "Wah wah wah waaah" descendente: el chiste de toda la vida.
    seq = [(67, 0.22), (66, 0.22), (65, 0.22), (64, 0.7)]
    parts = []
    for i, (nte, d) in enumerate(seq):
        tt = t_axis(d)
        vib = 1 + (0.025 * np.sin(2 * np.pi * 6 * tt) if i == len(seq) - 1 else 0)
        f = midi(nte - 12) * vib * np.linspace(1, 0.985 if i < len(seq) - 1 else 0.94, len(tt))
        tone = square(f, d, 0.4) * 0.6 + triangle(f, d) * 0.4
        parts.append(tone * env(len(tone), 0.01, d * (0.35 if i < len(seq) - 1 else 0.6)))
    return normalize(concat(*parts), 0.5)


SFX = {
    "shoot": sfx_shoot,
    "hit": sfx_hit,
    "hurt": sfx_hurt,
    "coin": sfx_coin,
    "levelup": sfx_levelup,
    "promise": sfx_promise,
    "death": sfx_death,
}

# ---------------------------------------------------------------- música

BPM = 140
EIGHTH = 60 / BPM / 2
BAR = EIGHTH * 8
_ = None
# Do mayor, progresión C–G–Am–F (la de toda canción pop "optimista").
CHORDS = [48, 43, 45, 41]  # raíces del bajo (C3, G2, A2, F2)
MELODY_A = [
    [76, _, 79, 76, 72, _, 74, 76],
    [74, _, 71, 74, 79, _, 77, 74],
    [72, _, 76, 72, 69, _, 71, 72],
    [77, 76, 74, 72, 74, _, _, _],
]
MELODY_A2 = MELODY_A[:3] + [[77, 76, 74, 72, 71, _, 67, _]]
MELODY_B = [
    [84, _, 83, _, 81, _, 79, _],
    [79, 78, 79, _, 74, _, _, _],
    [81, _, 79, _, 76, _, 72, _],
    [77, _, 77, 79, 81, _, 79, _],
]
MELODY = MELODY_A + MELODY_A2 + MELODY_B + MELODY_A2  # 16 compases


def add_wrapped(buf: np.ndarray, start: int, x: np.ndarray) -> None:
    """Suma `x` en `buf` desde `start`; lo que sobra da la vuelta (bucle sin cortes)."""
    n = len(buf)
    idx = (start + np.arange(len(x))) % n
    np.add.at(buf, idx, x)


def render_music() -> np.ndarray:
    total = int(round(SR * BAR * len(MELODY)))
    lead = np.zeros(total)
    bass = np.zeros(total)
    drums = np.zeros(total)
    e = int(round(SR * EIGHTH))

    for bar, notes in enumerate(MELODY):
        root = CHORDS[bar % 4]
        for i in range(8):
            start = (bar * 8 + i) * e
            nte = notes[i]
            if nte is not None:
                length = 1
                while i + length < 8 and notes[i + length] is None and length < 2:
                    length += 1
                d = EIGHTH * length * 0.9
                tone = square(midi(nte), d, 0.25)
                add_wrapped(lead, start, tone * env(len(tone), 0.003, d * 0.5))
            bnote = root if i % 2 == 0 else root + 7
            bt = triangle(midi(bnote), EIGHTH * 0.85)
            add_wrapped(bass, start, bt * env(len(bt), 0.003, 0.03))
            hat = noise(0.03) * decay(int(SR * 0.03), 120)
            add_wrapped(drums, start, hat * (0.25 if i % 2 else 0.15))
            if i in (0, 4):
                kd = 0.12
                kf = np.linspace(150, 45, int(SR * kd))
                kick = np.sin(2 * np.pi * np.cumsum(kf) / SR) * decay(int(SR * kd), 25)
                add_wrapped(drums, start, kick * 0.9)
            if i in (2, 6):
                sn = noise(0.1) * decay(int(SR * 0.1), 30)
                add_wrapped(drums, start, sn * 0.45)

    mix = 0.45 * lead + 0.55 * bass + 0.5 * drums
    return normalize(mix, 0.6)


def build_music(force: bool) -> None:
    ogg = MUSIC_DIR / "loop.ogg"
    mp3 = MUSIC_DIR / "loop.mp3"
    if ogg.exists() and mp3.exists() and not force:
        print(f"  {ogg.relative_to(ROOT)} ya existe (usa --music para regenerarla)")
        return
    wav = MUSIC_DIR / "loop.wav"
    write_wav(wav, render_music())
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("  ffmpeg no encontrado: se deja loop.wav; conviértelo a loop.ogg y loop.mp3 a mano.")
        return
    run = lambda *a: subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(wav), *a], check=True)
    # El codificador vorbis nativo de ffmpeg es "experimental" y exige estéreo.
    run("-c:a", "vorbis", "-strict", "-2", "-ac", "2", "-q:a", "4", str(ogg))
    run("-c:a", "libmp3lame", "-q:a", "5", str(mp3))
    wav.unlink()
    for f in (ogg, mp3):
        print(f"  {f.relative_to(ROOT)}  {f.stat().st_size // 1024} KB")


def main() -> None:
    print("Efectos:")
    for name, fn in SFX.items():
        write_wav(SFX_DIR / f"{name}.wav", fn())
    print("Música:")
    build_music("--music" in sys.argv)


if __name__ == "__main__":
    main()
