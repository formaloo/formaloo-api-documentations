// openapi-merge retains securitySchemes only from its first input. Prepare all
// service inputs before merging so security references keep their owning realm.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const methods=new Set(['get','post','put','patch','delete','head','options','trace']);
const escapePointer=value=>value.replaceAll('~','~0').replaceAll('/','~1');
export function prepareSecuritySources(inputs){
 const result=inputs.map(({name,spec},index)=>{
  const copy=structuredClone(spec),prefix=name.replace(/[^a-zA-Z0-9_]/g,'_')+'__';
  const schemes=copy.components?.securitySchemes||{};
  const names=new Map(Object.keys(schemes).map(key=>[key,index===0||key.startsWith(prefix)?key:prefix+key]));
  if(new Set(names.values()).size!==names.size)throw new Error(`Security scheme namespace collision in ${name}`);
  const security=(requirements,label)=>{
   if(!Array.isArray(requirements))throw new Error(`Invalid source security in ${name}: ${label}`);
   return requirements.map(requirement=>{
    if(!requirement||typeof requirement!=='object'||Array.isArray(requirement))throw new Error(`Invalid security alternative in ${name}: ${label}`);
    return Object.fromEntries(Object.entries(requirement).map(([key,scopes])=>{
     if(!names.has(key))throw new Error(`Unresolved security scheme ${key} in ${name}: ${label}`);
     return [names.get(key),scopes];
    }));
   });
  };
  const mapped=Object.fromEntries(Object.entries(schemes).map(([key,value])=>{
   const schema=structuredClone(value);
   if(schema.$ref?.startsWith('#/components/securitySchemes/')){
    const original=schema.$ref.slice('#/components/securitySchemes/'.length).replaceAll('~1','/').replaceAll('~0','~');
    if(!names.has(original))throw new Error(`Unresolved security reference ${original} in ${name}`);
    schema.$ref='#/components/securitySchemes/'+escapePointer(names.get(original));
   }
   return [names.get(key),schema];
  }));
  copy.components={...copy.components,securitySchemes:mapped};
  // Materialize each source's own inheritance before the shell's global policy
  // can apply. No declaration means anonymous under OpenAPI, not shell auth.
  const visitPathItem=(item,label)=>{
   for(const [method,operation] of Object.entries(item||{}))if(methods.has(method)&&operation&&typeof operation==='object'){
    operation.security=security(operation.security??copy.security??[],operation.operationId||`${method} ${label}`);
    for(const callback of Object.values(operation.callbacks||{}))for(const [expression,callbackPath] of Object.entries(callback))if(expression!=='$ref')visitPathItem(callbackPath,expression);
   }
  };
  for(const [route,item] of Object.entries(copy.paths||{}))visitPathItem(item,route);
  for(const callback of Object.values(copy.components.callbacks||{}))for(const [expression,item] of Object.entries(callback))if(expression!=='$ref')visitPathItem(item,expression);
  for(const [route,item] of Object.entries(copy.components.pathItems||{}))visitPathItem(item,route);
  for(const [route,item] of Object.entries(copy.webhooks||{}))visitPathItem(item,route);
  if(copy.security!==undefined)copy.security=security(copy.security,'global');
  return {name,spec:copy};
 });
 const combined={};
 for(const {name,spec} of result)for(const [key,value] of Object.entries(spec.components.securitySchemes)){
  if(combined[key]&&JSON.stringify(combined[key])!==JSON.stringify(value))throw new Error(`Conflicting security scheme ${key} from ${name}`);
  combined[key]=value;
 }
 result[0].spec.components.securitySchemes=combined;
 return result;
}
export async function prepareMergeSecurity(configPath){
 const config=JSON.parse(await fs.readFile(configPath,'utf8'));
 const paths=config.inputs.map(input=>path.resolve(path.dirname(configPath),input.inputFile));
 const inputs=await Promise.all(paths.map(async file=>({name:path.basename(file).replace(/-bundled\.json$/,''),spec:JSON.parse(await fs.readFile(file,'utf8'))})));
 const prepared=prepareSecuritySources(inputs);
 for(let index=0;index<paths.length;index++)await fs.writeFile(paths[index],JSON.stringify(prepared[index].spec,null,2)+'\n');
 return prepared;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await prepareMergeSecurity(path.resolve(process.argv[2]));
