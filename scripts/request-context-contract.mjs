const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
function resolve(spec, value) {
  if (!value?.$ref) return value;
  if (!value.$ref.startsWith('#/')) throw new Error(`Unsupported parameter reference: ${value.$ref}`);
  const target = value.$ref.slice(2).split('/').reduce((node, key) => node?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], spec);
  if (!target) throw new Error(`Unresolved parameter reference: ${value.$ref}`);
  return target;
}
export function sourceHeaderParameters(spec, pathItem, operation) {
  const headers = new Map();
  for (const raw of [...(pathItem?.parameters ?? []), ...(operation.parameters ?? [])]) {
    const p = resolve(spec, raw);
    if (p.in === 'header') headers.set(p.name.toLowerCase(), p);
  }
  return headers;
}

// Compare published declarations with the owning source contract, rather than
// inventing universal API-key/token/tenant requirements in the publishing layer.
export function validateRequestContextPreservation(source, published) {
  const errors = [];
  for (const [route, item] of Object.entries(published.paths ?? {})) {
    for (const [method, operation] of Object.entries(item)) {
      if (!methods.has(method)) continue;
      const original = source.paths?.[route]?.[method];
      const label = `${method.toUpperCase()} ${route}`;
      if (!original) { errors.push(`${label}: no source operation for prerequisite verification.`); continue; }
      const before = sourceHeaderParameters(source, source.paths[route], original);
      const after = sourceHeaderParameters(published, item, operation);
      for (const name of new Set([...before.keys(), ...after.keys()])) {
        const a = before.get(name), b = after.get(name);
        if (!a || !b || (a.required === true) !== (b.required === true) || JSON.stringify(a.schema) !== JSON.stringify(b.schema)) {
          errors.push(`${label}: source header contract changed for ${name}.`);
        } else if ([...new Set([...Object.keys(a), ...Object.keys(b)])].filter(key => !['description', 'required'].includes(key)).some(key => JSON.stringify(a[key]) !== JSON.stringify(b[key]))) {
          errors.push(`${label}: source header binding changed for ${name}.`);
        } else if (a.description && JSON.stringify(a.description) !== JSON.stringify(b.description)) {
          errors.push(`${label}: source header description changed for ${name}.`);
        }
      }
      if (JSON.stringify(original.security ?? source.security ?? []) !== JSON.stringify(operation.security ?? published.security ?? [])) {
        errors.push(`${label}: source security requirements changed.`);
      }
      if (JSON.stringify(original['x-formaloo-request-context']) !== JSON.stringify(operation['x-formaloo-request-context'])) {
        errors.push(`${label}: source request context changed.`);
      }
    }
  }
  return {errors};
}
