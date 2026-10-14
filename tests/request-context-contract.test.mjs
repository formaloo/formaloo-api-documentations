import assert from 'node:assert/strict';
import test from 'node:test';
import {validateRequestContextPreservation} from '../scripts/request-context-contract.mjs';
const source = {security: [{jwtAuth: []}], paths: {'/forms/': {
  parameters: [{name: 'x-api-key', in: 'header', required: true, schema: {type:'string'}}],
  get: {parameters: [{name: 'x-workspace', in: 'header', required:false, schema:{type:'string'}, description:'Optional with a tenant-bound key.'}], 'x-formaloo-request-context': {version:1, workspace:{requirement:'required'}}},
  post: {parameters: [{name:'x-api-key',in:'header',required:false,schema:{type:'string'}}],security:[]}
}, '/catalog/': {get:{security:[]}}}};
test('optional selectors, public operations and operation overrides preserve source prerequisites',()=>{
  assert.deepEqual(validateRequestContextPreservation(source,structuredClone(source)),{errors:[]});
});
test('rejects a publishing layer that makes an optional tenant selector mandatory',()=>{
  const changed=structuredClone(source);changed.paths['/forms/'].get.parameters[0].required=true;
  assert.match(validateRequestContextPreservation(source,changed).errors.join('\n'),/header contract changed for x-workspace/);
});
test('rejects invented API-key requirements on public operations and removal from protected operations',()=>{
  for(const mutate of [s=>{s.paths['/catalog/'].get.parameters=[{name:'x-api-key',in:'header',required:true}]},s=>{s.paths['/forms/'].parameters=[]}]) {
    const changed=structuredClone(source);mutate(changed);
    assert.match(validateRequestContextPreservation(source,changed).errors.join('\n'),/x-api-key/);
  }
});
test('rejects changed source security or backend context semantics',()=>{
  for(const mutate of [s=>{s.paths['/forms/'].get.security=[]},s=>{s.paths['/forms/'].get['x-formaloo-request-context'].workspace.requirement='optional'}]) {
    const changed=structuredClone(source);mutate(changed);
    assert.ok(validateRequestContextPreservation(source,changed).errors.length);
  }
});
test('keeps conditional prerequisite descriptions from the backend',()=>{
  const changed=structuredClone(source);changed.paths['/forms/'].get.parameters[0].description='Always required.';
  assert.match(validateRequestContextPreservation(source,changed).errors.join('\n'),/description changed/);
});
