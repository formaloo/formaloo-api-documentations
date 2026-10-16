import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {prepareSecuritySources} from '../scripts/merge-security-provenance.mjs';
const require=createRequire(import.meta.url),{merge}=require('openapi-merge');
const spec=(schemes,security,paths)=>({openapi:'3.0.3',info:{title:'test',version:'1'},components:{securitySchemes:schemes},...(security===undefined?{}:{security}),paths});
const operation=security=>({get:{operationId:'read',...(security===undefined?{}:{security}),responses:{200:{description:'OK'}}}});
test('real merge retains per-service authentication schemes and AND/OR alternatives',()=>{
 const inputs=[{name:'shell',spec:spec({ApiKey:{type:'apiKey',in:'header',name:'x-api-key'}},[{ApiKey:[]}],{})},{name:'formz',spec:spec({jwtAuth:{type:'http',scheme:'bearer'},cookieAuth:{type:'apiKey',in:'cookie',name:'sessionid'}},undefined,{'/one':operation([{jwtAuth:[],cookieAuth:[]},{}])})},{name:'icas',spec:spec({jwtAuth:{type:'apiKey',in:'header',name:'Authorization'}},[{jwtAuth:[]}],{'/two':operation()})}];
 const before=structuredClone(inputs),prepared=prepareSecuritySources(inputs),result=merge(prepared.map(input=>({oas:input.spec})));
 assert.ok(result.output,JSON.stringify(result));
 assert.deepEqual(result.output.paths['/one'].get.security,[{formz__jwtAuth:[],formz__cookieAuth:[]},{}]);
 assert.deepEqual(result.output.paths['/two'].get.security,[{icas__jwtAuth:[]}]);
 assert.equal(result.output.components.securitySchemes.formz__jwtAuth.scheme,'bearer');assert.equal(result.output.components.securitySchemes.icas__jwtAuth.type,'apiKey');assert.deepEqual(inputs,before);
});
test('anonymous source operations do not inherit shell authentication',()=>{
 const out=prepareSecuritySources([{name:'shell',spec:spec({key:{type:'apiKey',in:'header',name:'x-api-key'}},[{key:[]}],{})},{name:'source',spec:spec({},undefined,{'/public':operation()})}]);
 assert.deepEqual(out[1].spec.paths['/public'].get.security,[]);
});
test('unresolved source schemes still fail closed; schema preparation is idempotent',()=>{
 assert.throws(()=>prepareSecuritySources([{name:'source',spec:spec({},undefined,{'/broken':operation([{missing:[]}])})}]),/Unresolved security scheme missing/);
 const input=[{name:'shell',spec:spec({},undefined,{})},{name:'service',spec:spec({key:{type:'apiKey',in:'header',name:'x-key'}},[{key:[]}],{'/private':operation()})}];
 const once=prepareSecuritySources(input);assert.deepEqual(prepareSecuritySources(once),once);
});

test('a source cannot collide with a prequalified name or collapse an AND requirement',()=>{
 const schemes={key:{type:'apiKey',in:'header',name:'one'},formz__key:{type:'apiKey',in:'header',name:'two'}};
 assert.throws(()=>prepareSecuritySources([{name:'shell',spec:spec({},undefined,{})},{name:'formz',spec:spec(schemes,undefined,{'/private':operation([{key:[],formz__key:[]}])})}]),/namespace collision/);
});
test('callback operations retain source authentication without rewriting literal example data',()=>{
 const source=spec({key:{type:'http',scheme:'bearer'}},[{key:[]}],{'/callback':{post:{operationId:'start',responses:{200:{description:'OK',content:{'application/json':{example:{security:[{key:[]}]}}}}},callbacks:{completed:{'{$request.body#/url}':{post:{operationId:'callback',responses:{200:{description:'OK'}}}}}}}}});
 const out=prepareSecuritySources([{name:'shell',spec:spec({},undefined,{})},{name:'formz',spec:source}])[1].spec;
 assert.deepEqual(out.paths['/callback'].post.callbacks.completed['{$request.body#/url}'].post.security,[{formz__key:[]}]);
 assert.deepEqual(out.paths['/callback'].post.responses[200].content['application/json'].example.security,[{key:[]}]);
});
