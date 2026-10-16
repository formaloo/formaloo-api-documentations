// Logic payloads and their API guide are authored by Formz. The publisher
// verifies that the reachable source graph survives; it never synthesizes it.
const prefix = "#/components/schemas/";
const canonical = "FormalooFormLogic";

export function reachableLogicSchemas(spec) {
  const schemas = spec.components?.schemas ?? {};
  const names = new Set();
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.$ref === "string" && node.$ref.startsWith(prefix)) {
      const name = node.$ref.slice(prefix.length);
      if (!Object.hasOwn(schemas, name)) throw new Error(`Missing source logic component: ${name}`);
      if (!names.has(name)) {
        names.add(name);
        visit(schemas[name]);
      }
    }
    for (const value of Object.values(node)) visit(value);
  };
  visit({ $ref: prefix + canonical });
  return Object.fromEntries([...names].sort().map((name) => [name, schemas[name]]));
}

export function validateLogicSourceContract(spec, sourceSpec) {
  const schemas = spec.components?.schemas ?? {};
  const hasLogic = Object.values(schemas).some((schema) => schema?.properties && Object.hasOwn(schema.properties, "logic"));
  if (!hasLogic && !schemas[canonical] && !sourceSpec?.components?.schemas?.[canonical]) return [];
  const errors = [];
  try {
    const graph = reachableLogicSchemas(spec);
    const root = graph[canonical];
    if (root?.type !== "array" || typeof root?.description !== "string" || !root.description.trim()) {
      errors.push("The backend must publish its typed logic array and API guide before this contract can be published.");
    }
    const discriminated = Object.values(graph).filter((schema) => Array.isArray(schema.oneOf));
    if (!discriminated.length) errors.push("The backend logic contract must publish typed variants rather than an untyped JSON field.");
    if (sourceSpec) {
      const sourceGraph = reachableLogicSchemas(sourceSpec);
      for (const [name, schema] of Object.entries(sourceGraph)) {
        if (JSON.stringify(graph[name]) !== JSON.stringify(schema)) {
          errors.push(`Published logic component differs from backend source: ${name}`);
        }
      }
    }
  } catch (error) {
    errors.push(error.message);
  }
  return errors;
}
