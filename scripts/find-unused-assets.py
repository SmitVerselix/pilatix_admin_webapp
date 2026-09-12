#!/usr/bin/env python3
"""
Report assets under src/assets that nothing references.

    python3 scripts/find-unused-assets.py            # report only
    python3 scripts/find-unused-assets.py --delete   # remove them and prune empty dirs

An asset counts as referenced when a resolvable path to it appears in a .ts/.tsx
import, a url() in any .css/.scss, or an href/src in index.html. Matching is by
resolved path, not basename - basenames like `1.png` collide constantly and
would keep dead files alive.

Note the two-step for SCSS: the sources under src/assets/scss use paths relative
to the *compiled* stylesheet (src/assets/css/style.css), so a url() is retried
from that directory before being called unresolved.
"""

import argparse
import collections
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSET_EXT = {'.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.mov', '.avif'}
CSS_DIR = ROOT / 'src' / 'assets' / 'css'

IMPORT_RE = re.compile(r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""")
URL_RE = re.compile(r"""url\(\s*['"]?([^'")]+?)['"]?\s*\)""")
HREF_RE = re.compile(r"""(?:href|src)\s*=\s*['"]([^'"]+)['"]""")

SCANS = (
    ('src/**/*.ts', [IMPORT_RE]),
    ('src/**/*.tsx', [IMPORT_RE]),
    ('src/**/*.scss', [URL_RE, IMPORT_RE]),
    ('src/**/*.css', [URL_RE]),
    ('index.html', [HREF_RE]),
)


def collect_assets() -> set:
    found = set()
    for base in ('src/assets/**/*', 'public/**/*'):
        for p in ROOT.glob(base):
            if p.is_file() and p.suffix.lower() in ASSET_EXT:
                found.add(p.resolve())
    return found


def collect_used(assets: set) -> set:
    used = set()

    def note(base: pathlib.Path, ref: str) -> None:
        ref = ref.split('?')[0].split('#')[0].strip()
        if not ref or ref.startswith(('http://', 'https://', 'data:', '//')):
            return
        if pathlib.Path(ref).suffix.lower() not in ASSET_EXT:
            return
        candidates = [(ROOT / ref.lstrip('/')) if ref.startswith('/') else (base.parent / ref)]
        candidates.append(CSS_DIR / ref)        # scss paths resolve from the compiled css
        for cand in candidates:
            try:
                cand = cand.resolve()
            except OSError:
                continue
            if cand in assets:
                used.add(cand)
                return

    for pattern, regexes in SCANS:
        for p in ROOT.glob(pattern):
            if not p.is_file() or p.suffix.lower() in ASSET_EXT:
                continue
            text = p.read_text(encoding='utf-8', errors='ignore')
            for rx in regexes:
                for m in rx.finditer(text):
                    note(p, m.group(1))

    return used


def prune_empty_dirs() -> int:
    pruned = 0
    for _ in range(12):
        changed = False
        dirs = sorted((d for d in ROOT.glob('src/assets/**/*') if d.is_dir()),
                      key=lambda x: len(x.parts), reverse=True)
        for d in dirs:
            if not any(d.iterdir()):
                d.rmdir()
                pruned += 1
                changed = True
        if not changed:
            break
    return pruned


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--delete', action='store_true', help='remove the unused files')
    args = ap.parse_args()

    assets = collect_assets()
    used = collect_used(assets)
    unused = sorted(assets - used)
    freed = sum(p.stat().st_size for p in unused)

    print(f'assets: {len(assets)}   referenced: {len(used)}   unused: {len(unused)}'
          f'   ({freed / 1024 / 1024:.1f} MB)')

    if unused:
        print('\nunused, by directory:')
        by_dir = collections.Counter(str(p.parent.relative_to(ROOT)) for p in unused)
        for d, n in by_dir.most_common():
            size = sum(p.stat().st_size for p in unused if str(p.parent.relative_to(ROOT)) == d)
            print(f'  {n:5d}  {size / 1024:8.0f} KB  {d}')

    if not args.delete:
        if unused:
            print('\nre-run with --delete to remove them')
        return 0

    for p in unused:
        p.unlink()
    print(f'\ndeleted {len(unused)} files, pruned {prune_empty_dirs()} empty directories')
    return 0


if __name__ == '__main__':
    sys.exit(main())
