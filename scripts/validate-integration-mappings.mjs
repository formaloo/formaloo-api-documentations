import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expected = JSON.parse(await fs.readFile(path.join(root, "spec/integration-mapping-schemas.json"), "utf8"));
const inputs = process.argv.slice(2);
if (!inputs.length) inputs.push(
  path.join(root, "artifacts/intermediate/openapi-public.normalized.json"),
  path.join(root, "artifacts/intermediate/openapi-mcp.filtered.json"),
);

for (const input of inputs) {
  const spec = yaml.load(await fs.readFile(input, "utf8"));
  const schemas = spec.components?.schemas || spec;
  function resolve(value) {
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === "object") {
      if (value.$ref) {
        assert.ok(value.$ref.startsWith("#/components/schemas/"), `Unexpected reference: ${value.$ref}`);
        const target = schemas[value.$ref.split("/").at(-1)];
        assert.ok(target, `Missing reference: ${value.$ref}`);
        return resolve(target);
      }
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item)]));
    }
    return value;
  }
  for (const [name, contract] of Object.entries(expected)) {
    assert.deepEqual(resolve(schemas[name]), contract, `${input}: ${name} differs from backend snapshot`);
  }
  for (const pathItem of Object.values(spec.paths || {})) {
    const patch = pathItem.patch;
    if (patch?.operationId === "formsMailchimpIntegrationsPartialUpdate") {
      assert.equal(patch.requestBody?.required, true, `${input}: Mailchimp PATCH requires a body`);
      const body = resolve(patch.requestBody.content["application/json"].schema);
      assert.ok(body.required?.includes("mapped_fields"), `${input}: Mailchimp PATCH requires mapped_fields`);
      assert.ok(!body.required.includes("list_id"), `${input}: Mailchimp PATCH allows omitted list_id`);
    }
  }
  console.log(`${input}: all six integration mapping schemas match the backend snapshot`);
}
