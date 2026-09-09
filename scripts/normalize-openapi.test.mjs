import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));

test("normalization preserves the backend answer-restriction list/string/null contract", async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "formaloo-answer-contract-"));
  try {
    const input = path.join(temporary, "input.json");
    const output = path.join(temporary, "output.json");
    await fs.writeFile(input, JSON.stringify({
      openapi: "3.0.3",
      info: { title: "Answer restriction regression", version: "1" },
      paths: { "/contract-probe/": { get: {
        operationId: "contractProbe",
        responses: { 200: { description: "Field", content: { "application/json": {
          schema: { $ref: "#/components/schemas/ProbeFieldRequest" }
        } } } }
      } } },
      components: { schemas: { ProbeFieldRequest: { type: "object", properties: {
        acceptable_answers: { type: "object", additionalProperties: {} },
        unacceptable_answers: { type: "object", additionalProperties: {} }
      } } } }
    }));
    execFileSync(process.execPath, ["scripts/normalize-openapi.mjs"], {
      cwd: root,
      env: {
        ...process.env,
        RAW_SPEC_NAME: path.relative(path.join(root, "artifacts/intermediate"), input),
        NORMALIZED_SPEC_NAME: path.relative(path.join(root, "artifacts/intermediate"), output)
      }
    });
    const schemas = JSON.parse(await fs.readFile(output, "utf8")).components.schemas;
    for (const [property, name] of [
      ["acceptable_answers", "FormalooAcceptableAnswers"],
      ["unacceptable_answers", "FormalooUnacceptableAnswers"]
    ]) {
      assert.deepEqual(schemas.ProbeFieldRequest.properties[property], {
        $ref: `#/components/schemas/${name}`
      });
      const schema = schemas[name];
      assert.equal(schema.nullable, undefined);
      assert.equal(schema.type, undefined, "must not reject arrays with an object type");
      assert.deepEqual(schema.oneOf, [
        { type: "array", nullable: true, items: { type: "string" } },
        { type: "string" }
      ]);
      assert.equal(schema.oneOf[0].minItems, undefined, "empty readback arrays must be writable");
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
