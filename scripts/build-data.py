"""Read immutable CSVs, verify the inventory, and package local browser data. No network."""
import csv
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / 'data/INPUT_MANIFEST.json').read_text(encoding='utf-8-sig'))
tables, hashes = {}, {}
for item in manifest['tables']:
    path = ROOT / 'data/csv' / (item['name'] + '.csv')
    with path.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != item['columns']:
            raise ValueError(f"Column mismatch: {item['name']}")
        rows = list(reader)
    if len(rows) != item['rows']:
        raise ValueError(f"Row count mismatch: {item['name']}")
    tables[item['name']] = rows
    hashes[path.relative_to(ROOT).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
logo = ROOT / 'assets/douglas_county_logo.png'
hashes['assets/douglas_county_logo.png'] = hashlib.sha256(logo.read_bytes()).hexdigest()
public = ROOT / 'public'
public.mkdir(exist_ok=True)
shutil.copyfile(logo, public / 'douglas_county_logo.png')
payload = {'asOf': manifest['as_of'], 'tables': tables, 'hashes': hashes, 'rowCount': sum(map(len, tables.values()))}
(public / 'data.json').write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
print(f"Packaged {len(tables)} tables / {payload['rowCount']:,} rows; verified inventory; copied logo unchanged.")
