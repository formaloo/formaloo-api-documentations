import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { validateLogicSourceContract } from '../scripts/logic-schema-source.mjs';

const run = promisify(execFile);
const rootUrl = new URL('../', import.meta.url);
// Independent future-source fixture: recursive conditions, nullable template
// defaults and extensible mapping schemas must survive both publisher stages.
const fixture = {
  openapi: '3.0.3', info: { title: 'Backend logic contract fixture', version: '3.0' },
  components: { schemas: {
    FormUpdateRequest: { type: 'object', properties: { logic: { $ref: '#/components/schemas/FormalooFormLogic' } } },
    FormalooFormLogic: { type: 'array', items: { $ref: '#/components/schemas/SourceLogicRule' }, description: 'Source API guide with future capabilities.' },
    SourceLogicRule: { oneOf: [{ type: 'object', properties: {
      type: { enum: ['future_scope'] },
      actions: { type: 'array', items: { $ref: '#/components/schemas/SourceAction' } },
    }, required: ['type', 'actions'] }] },
    SourceAction: { type: 'object', properties: {
      action: { enum: ['future_action'] },
      args: { type: 'array', minItems: 1, maxItems: 3, items: { $ref: '#/components/schemas/SourceArgument' } },
      when: { $ref: '#/components/schemas/FormalooLogicCondition' },
    }, required: ['action', 'args', 'when'] },
    SourceArgument: { oneOf: [
      { type: 'object', properties: { type: { enum: ['future_template'] }, identifier: { type: 'string', nullable: true } }, required: ['type'] },
      { type: 'object', properties: { type: { enum: ['future_mapping'] }, value: { type: 'object', minProperties: 1, additionalProperties: { type: 'array', items: { type: 'string' } } } }, required: ['type', 'value'] },
    ] },
    FormalooLogicCondition: { oneOf: [
      { type: 'object', properties: { operation: { enum: ['future_leaf'] }, args: { type: 'array', minItems: 0, maxItems: 0 } }, required: ['operation', 'args'] },
      { type: 'object', properties: { operation: { enum: ['future_recursive'] }, args: { type: 'array', minItems: 2, items: { $ref: '#/components/schemas/FormalooLogicCondition' } } }, required: ['operation', 'args'] },
    ] },
  } },
  paths: { '/v3.0/forms/{slug}/': { patch: {
    operationId: 'formsPartialUpdate', summary: 'Source form update', description: 'Source form update description.',
    parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/FormUpdateRequest' } } } },
    responses: { 200: { description: 'Updated.' } },
  } } },
};

async function publish(t, source) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'source-logic-publish-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.mkdir(path.join(dir, 'scripts'));
  await fs.mkdir(path.join(dir, 'spec'));
  await fs.mkdir(path.join(dir, 'artifacts/intermediate'), { recursive: true });
  for (const script of ['normalize-openapi.mjs', 'build-mcp-openapi.mjs', 'logic-schema-source.mjs', 'form-answer-contract.mjs']) {
    await fs.copyFile(new URL(`scripts/${script}`, rootUrl), path.join(dir, 'scripts', script));
  }
  for (const filename of ['public-contract.json', 'integration-mapping-schemas.json', 'mcp-openapi-settings.json']) {
    await fs.copyFile(new URL(`spec/${filename}`, rootUrl), path.join(dir, 'spec', filename));
  }
  await fs.writeFile(path.join(dir, 'artifacts/intermediate/openapi-merged.raw.json'), JSON.stringify(source));
  await run(process.execPath, [path.join(dir, 'scripts/normalize-openapi.mjs')]);
  const normalized = JSON.parse(await fs.readFile(path.join(dir, 'artifacts/intermediate/openapi-public.normalized.json')));
  await fs.writeFile(path.join(dir, 'artifacts/intermediate/openapi-mcp-source.normalized.json'), JSON.stringify(normalized));
  await run(process.execPath, [path.join(dir, 'scripts/build-mcp-openapi.mjs')]);
  const mcp = JSON.parse(await fs.readFile(path.join(dir, 'artifacts/intermediate/openapi-mcp.filtered.json')));
  return { normalized, mcp };
}

test('future source semantics, recursion and guide survive normalization and MCP publication', async (t) => {
  const { normalized, mcp } = await publish(t, fixture);
  for (const artifact of [normalized, mcp]) {
    assert.deepEqual(validateLogicSourceContract(artifact, fixture), []);
    const body = artifact.paths['/v3.0/forms/{slug}/'].patch.requestBody.content['application/json'].schema;
    assert.equal(body.$ref, '#/components/schemas/FormUpdateRequest');
    assert.equal(artifact.components.schemas.FormalooFormLogic.description, fixture.components.schemas.FormalooFormLogic.description);
    assert.equal(artifact.components.schemas.SourceArgument.oneOf[0].properties.identifier.nullable, true);
    assert.equal(artifact.components.schemas.SourceAction.properties.args.maxItems, 3);
    assert.equal(artifact.components.schemas.FormalooLogicCondition.oneOf[1].properties.args.items.$ref, '#/components/schemas/FormalooLogicCondition');
  }
});

test('old backend JSON logic is rejected instead of being advertised as a fabricated typed contract', async (t) => {
  const source = structuredClone(fixture);
  source.components.schemas = { FormUpdateRequest: { type: 'object', properties: { logic: { type: 'object', additionalProperties: true } } } };
  await assert.rejects(publish(t, source));
});

test('source graph validation catches missing and modified reachable contracts', () => {
  const missing = structuredClone(fixture);
  delete missing.components.schemas.SourceArgument;
  assert.ok(validateLogicSourceContract(missing, fixture).length);
  const changed = structuredClone(fixture);
  changed.components.schemas.SourceAction.properties.args.maxItems = 2;
  assert.ok(validateLogicSourceContract(changed, fixture).length);
});
