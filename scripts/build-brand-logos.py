#!/usr/bin/env python3
"""
Regenerate the brand logo set from `brand/pilatix-wordmark.png`.

    python3 scripts/build-brand-logos.py

The Ynex layout swaps between six logo files depending on the menu style and
whether the sidebar is collapsed:

  desktop-logo.png   wide wordmark, dark  - light menu style, auth page (light)
  desktop-dark.png   wide wordmark, light - dark menu style (the default), auth page (dark)
  desktop-white.png  wide wordmark, light - coloured/gradient menu styles
  toggle-*.png       collapsed sidebar

The collapsed sidebar always renders `toggle-logo.png` whatever the menu style,
and the sidebar header is transparent, so that one file has to stay legible on
both the dark navy and the white sidebar. A flat mark cannot, so the collapsed
mark is the app-icon treatment - the "P" on its own cream/yellow tile - which
carries its own background and reads either way.
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'brand' / 'pilatix-wordmark.png'
OUT = ROOT / 'src' / 'assets' / 'images' / 'brand-logos'

GREEN = (51, 78, 63)       # the wordmark's own colour
WHITE = (255, 255, 255)
CREAM = (250, 246, 236)    # app icon gradient, top
YELLOW = (253, 232, 158)   # app icon gradient, bottom

WORDMARK_H = 64            # rendered at h-8 (32px); 2x for retina
TILE = 128                 # collapsed mark, also rendered at 32px

# The wordmark's first glyph gap, i.e. where the "P" ends.
P_RIGHT = 170


def recolour(img: Image.Image, rgb: tuple) -> Image.Image:
    """Swap the RGB but keep the alpha channel, which carries the anti-aliasing."""
    out = Image.new('RGBA', img.size, rgb + (0,))
    out.putalpha(img.getchannel('A'))
    return out


def fit_height(img: Image.Image, h: int) -> Image.Image:
    return img.resize((round(img.width * h / img.height), h), Image.LANCZOS)


def build_tile(src: Image.Image, size: int) -> Image.Image:
    """The "P" on a rounded cream-to-yellow tile, as on the app icon."""
    ss = 4                                   # supersample so the corners stay smooth
    n = size * ss

    tile = Image.new('RGBA', (n, n))
    draw = ImageDraw.Draw(tile)
    for y in range(n):
        t = y / (n - 1)
        draw.line(
            [(0, y), (n, y)],
            fill=tuple(round(a + (b - a) * t) for a, b in zip(CREAM, YELLOW)) + (255,),
        )

    mask = Image.new('L', (n, n), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, n - 1, n - 1], radius=round(n * 0.225), fill=255)
    tile.putalpha(mask)

    glyph = src.crop((0, 0, P_RIGHT, src.height))
    glyph = glyph.crop(glyph.getbbox())
    glyph = fit_height(glyph, round(n * 0.56))
    glyph = recolour(glyph, GREEN)
    tile.paste(glyph, ((n - glyph.width) // 2, (n - glyph.height) // 2), glyph)

    return tile.resize((size, size), Image.LANCZOS)


def main() -> None:
    src = Image.open(SRC).convert('RGBA')

    wide = fit_height(src, WORDMARK_H)
    recolour(wide, GREEN).save(OUT / 'desktop-logo.png')
    recolour(wide, WHITE).save(OUT / 'desktop-dark.png')
    recolour(wide, WHITE).save(OUT / 'desktop-white.png')

    tile = build_tile(src, TILE)
    for name in ('toggle-logo.png', 'toggle-dark.png', 'toggle-white.png'):
        tile.save(OUT / name)

    build_tile(src, 512).save(OUT / 'apple-touch-icon.png')
    build_tile(src, 256).save(
        OUT / 'favicon.ico',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    print(f'wordmark {wide.size[0]}x{wide.size[1]}, tile {TILE}x{TILE} -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
