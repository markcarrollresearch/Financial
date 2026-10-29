"""Package only the generated, self-contained portable release files."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parent.parent
portable = ROOT / 'portable'
files = ['OPEN FINANCIAL LAB.html', 'START HERE.txt']
if (portable / 'Financial Lab.exe').exists():
    files.insert(0, 'Financial Lab.exe')
hashes = '\n'.join(f"{hashlib.sha256((portable / name).read_bytes()).hexdigest()}  {name}" for name in files) + '\n'
(portable / 'SHA256SUMS.txt').write_text(hashes, encoding='utf-8')
files.append('SHA256SUMS.txt')
out = ROOT / 'downloads/financial-lab-portable.zip'
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in files:
        archive.write(portable / name, 'Financial Lab Portable/' + name)
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    for name in files:
        assert archive.read('Financial Lab Portable/' + name) == (portable / name).read_bytes()
print(f'Verified portable ZIP: {out.name}, {out.stat().st_size:,} bytes, {len(files)} files.')
