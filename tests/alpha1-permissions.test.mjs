import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function findEngine(dir) {
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      const found = await findEngine(p);
      if (found) return found;
    } else if (name.name === 'game-engine.js') return p;
  }
  return null;
}

test('school-level setters enforce principal-level permissions', async () => {
  const engine = await findEngine(new URL('..', import.meta.url).pathname);
  assert.ok(engine);
  const source = await readFile(engine, 'utf8');
  assert.match(source, /setSchoolBand\(band\).*?career\?\.rank\|\|0\)<7/s);
  assert.match(source, /setSchoolSpecialty\(specialty\).*?career\?\.rank\|\|0\)<7/s);
});
