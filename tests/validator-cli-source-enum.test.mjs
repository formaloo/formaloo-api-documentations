import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const root = new URL('../', import.meta.url);

for (const [script, summaryName] of [
  ['validate-openapi.mjs', 'summary.json'],
  ['validate-mcp-openapi.mjs', 'mcp-summary.json'],
]) {
  test(`${script} reaches source-enum validation and writes a structured failure`, async (t) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'source-enum-validator-'));
    t.after(() => fs.rm(dir, { recursive: true, force: true }));
    await fs.cp(new URL('scripts/', root), path.join(dir, 'scripts'), { recursive: true });
    await fs.cp(new URL('spec/', root), path.join(dir, 'spec'), {
      recursive: true,
      filter: (name) => !/bundled\.(json|yaml)$/.test(name) && !/\/(formz|icas|authentication|storage|ai)(-mcp)?\.yaml$/.test(name),
    });
    const intermediate = path.join(dir, 'artifacts/intermediate');
    await fs.mkdir(intermediate, { recursive: true });
    const spec = { openapi: '3.0.3', info: { title: 'Validation probe', version: '3.0' }, paths: {},
      components: { schemas: { IntegrationAppTypeEnum: { enum: ['mailchimp'] } } } };
    const raw = structuredClone(spec);
    raw.components.schemas.IntegrationAppTypeEnum.enum.push('slack');
    for (const name of ['openapi-public.normalized.json', 'openapi-mcp-source.normalized.json', 'openapi-mcp.filtered.json']) {
      await fs.writeFile(path.join(intermediate, name), JSON.stringify(spec));
    }
    for (const name of ['openapi-merged.raw.json', 'openapi-merged.mcp.raw.json']) {
      await fs.writeFile(path.join(intermediate, name), JSON.stringify(raw));
    }
    await fs.writeFile(path.join(dir, 'openapi-v3.0.yaml'), 'openapi: 3.0.3\n');
    const result = await run(process.execPath, [path.join(dir, 'scripts', script)])
      .then(() => { throw new Error('Incomplete/mismatched contract must fail validation'); }, (error) => error);
    assert.equal(result.code, 1);
    assert.doesNotMatch(result.stderr, /ReferenceError|TypeError/);
    const summary = JSON.parse(await fs.readFile(path.join(dir, 'artifacts/validation', summaryName), 'utf8'));
    assert.ok(summary.errors.includes('IntegrationAppTypeEnum must exactly match the raw backend enum.'));
    assert.ok(summary.errors.includes('Missing source logic component: FormalooFormLogic'));
  });
}
