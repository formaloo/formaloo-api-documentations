import assert from "node:assert/strict";
import test from "node:test";

import { validateOperationDocumentation } from "../scripts/validate-operation-documentation.mjs";

function specWith(operation) {
  return { paths: { "/items/": { post: operation } } };
}

test("accepts a documented operation regardless of its path or ID", () => {
  const result = validateOperationDocumentation(specWith({
    operationId: "itemsCreate",
    summary: "Create an item",
    description: "Creates an item in the current workspace.",
    requestBody: { content: { "application/json": { schema: { type: "object" } } } },
    responses: { 201: { content: { "application/json": { schema: { type: "object" } } } } },
  }));
  assert.deepEqual(result, { errors: [], warnings: [] });
});

test("rejects incomplete details on any newly added operation", () => {
  const result = validateOperationDocumentation(specWith({
    operationId: "itemsCreate",
    summary: "Create an item",
    requestBody: { content: { "application/json": {} } },
    responses: { 201: { content: { "application/json": {} } } },
  }));
  assert.match(result.errors.join("\n"), /request schema/);
  assert.match(result.errors.join("\n"), /response schema/);
  assert.match(result.warnings.join("\n"), /no description/);
});

test("rejects duplicate operation IDs", () => {
  const operation = {
    operationId: "itemsRetrieve",
    summary: "Get an item",
    responses: { 302: { description: "Redirects to the item." } },
  };
  const result = validateOperationDocumentation({
    paths: { "/one/": { get: operation }, "/two/": { get: operation } },
  });
  assert.match(result.errors.join("\n"), /duplicates operationId/);
});

test("does not require an endpoint to exist", () => {
  assert.deepEqual(validateOperationDocumentation({ paths: {} }), { errors: [], warnings: [] });
});
