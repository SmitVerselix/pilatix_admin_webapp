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

import hashlib
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'brand' / 'pilatix-wordmark.png'
# Optional: the square app icon (the pilates figure on its cream tile). When
# present it supplies the collapsed-sidebar mark and the favicons; without it
# they fall back to a "P" cut from the wordmark.
ICON_SRC = ROOT / 'brand' / 'pilatix-icon.png'
OUT = ROOT / 'src' / 'assets' / 'images' / 'brand-logos'
INDEX_HTML = ROOT / 'index.html'

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


SUPERSAMPLE = 4      # draw large, then downscale, so the corners stay smooth


def tile_background(n: int) -> Image.Image:
    """The app icon's rounded cream-to-yellow tile, at n x n pixels."""
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
    return tile


def centre_on_tile(art: Image.Image, size: int, fill: float) -> Image.Image:
    """
    Centre `art` on the tile, scaled so its *longest* side is `fill` of the tile.

    Scaling by height alone overflows for wide artwork - the figure's extended
    leg makes it about 1.5x wider than tall, which left it touching the tile
    edges and turned into a blob at 16px.
    """
    n = size * SUPERSAMPLE
    tile = tile_background(n)

    scale = (n * fill) / max(art.width, art.height)
    art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), Image.LANCZOS)

    tile.paste(art, ((n - art.width) // 2, (n - art.height) // 2), art)
    return tile.resize((size, size), Image.LANCZOS)


def build_tile(src: Image.Image, size: int) -> Image.Image:
    """Fallback mark: the "P" from the wordmark, on the tile."""
    glyph = src.crop((0, 0, P_RIGHT, src.height))
    glyph = glyph.crop(glyph.getbbox())
    return centre_on_tile(recolour(glyph, GREEN), size, 0.52)


def build_icon_tile(size: int) -> Image.Image:
    """
    The supplied app icon, used exactly as-is: figure, wordmark and tile.

    Nothing is cropped or re-composited - this is the brand lockup, so it is
    reproduced rather than reinterpreted.
    """
    icon = Image.open(ICON_SRC).convert('RGBA')
    return icon.resize((size, size), Image.LANCZOS)


def stamp_favicon_version() -> str:
    """
    Put a short content hash on the favicon href in index.html.

    Vite content-hashes asset filenames in a production build, but in dev the
    path is stable and browsers cache favicons hard enough to ignore a reload -
    so a regenerated icon appears not to have changed. The query string moves
    when the bytes move, which is enough to defeat that.
    """
    digest = hashlib.sha256((OUT / 'favicon.ico').read_bytes()).hexdigest()[:8]
    html = INDEX_HTML.read_text()
    updated = re.sub(
        r'(href="\./src/assets/images/brand-logos/favicon\.ico)(?:\?v=[^"]*)?"',
        rf'\1?v={digest}"',
        html,
    )
    if updated != html:
        INDEX_HTML.write_text(updated)
    return digest


def main() -> None:
    src = Image.open(SRC).convert('RGBA')
    use_icon = ICON_SRC.exists()
    make_tile = build_icon_tile if use_icon else (lambda size: build_tile(src, size))

    wide = fit_height(src, WORDMARK_H)
    recolour(wide, GREEN).save(OUT / 'desktop-logo.png')
    recolour(wide, WHITE).save(OUT / 'desktop-dark.png')
    recolour(wide, WHITE).save(OUT / 'desktop-white.png')

    tile = make_tile(TILE)
    for name in ('toggle-logo.png', 'toggle-dark.png', 'toggle-white.png'):
        tile.save(OUT / name)

    make_tile(512).save(OUT / 'apple-touch-icon.png')
    make_tile(256).save(
        OUT / 'favicon.ico',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    version = stamp_favicon_version()

    source = f'app icon ({ICON_SRC.name})' if use_icon else 'P monogram cut from the wordmark'
    print(f'wordmark {wide.size[0]}x{wide.size[1]}, tile {TILE}x{TILE} from {source}')
    if not use_icon:
        print(f'  tip: drop the square app icon at {ICON_SRC.relative_to(ROOT)} and re-run to use it')
    print(f'  favicon cache-busted as ?v={version} in index.html')
    print(f'  -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
