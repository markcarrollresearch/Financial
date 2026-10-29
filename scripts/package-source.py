"""Keep the original download link useful, including easy-open portable files."""
from pathlib import Path
import os
import zipfile

ROOT = Path(__file__).resolve().parent.parent
excluded = {'.git', 'node_modules', '.cache', 'downloads', 'portable', 'test-results', 'playwright-report', '__pycache__'}
entries = []
for directory, folders, names in os.walk(ROOT):
    folders[:] = sorted(name for name in folders if name not in excluded)
    for name in sorted(names):
        path = Path(directory) / name
        relative = path.relative_to(ROOT)
        if name.endswith('.tsbuildinfo') or relative.as_posix() in {'public/data.json', 'desktop/app.html.gz'}:
            continue
        entries.append((path, relative.as_posix()))
for name in ['OPEN FINANCIAL LAB.html', 'Financial Lab.exe', 'START HERE.txt', 'SHA256SUMS.txt']:
    path = ROOT / 'portable' / name
    if path.exists():
        entries.append((path, name))
out = ROOT / 'downloads/financial-lab.zip'
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path, relative in entries:
        archive.write(path, 'Douglas_County_Financial_Lab/' + relative)
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    for path, relative in entries:
        assert archive.read('Douglas_County_Financial_Lab/' + relative) == path.read_bytes()
print(f'Verified complete source + portable ZIP: {len(entries)} files, {out.stat().st_size:,} bytes.')
