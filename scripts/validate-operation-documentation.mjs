const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Check every published operation, including endpoints added by the backend.
// This checks documentation shape without requiring any particular endpoint.
export function validateOperationDocumentation(spec) {
  const errors = [];
  const warnings = [];
  const operationIds = new Map();

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(method)) continue;
      const label = `${method.toUpperCase()} ${path}`;
      if (!operation || typeof operation !== "object") {
        errors.push(`${label} must define an operation object.`);
        continue;
      }

      if (!hasText(operation.operationId)) {
        errors.push(`${label} must define an operationId.`);
      } else if (operationIds.has(operation.operationId)) {
        errors.push(`${label} duplicates operationId ${operation.operationId} from ${operationIds.get(operation.operationId)}.`);
      } else {
        operationIds.set(operation.operationId, label);
      }
      if (!hasText(operation.summary)) errors.push(`${label} must have a summary.`);
      if (!hasText(operation.description)) warnings.push(`${label} has no description.`);

      const successResponses = Object.entries(operation.responses ?? {})
        .filter(([status]) => /^[23]\d\d$/.test(status));
      if (successResponses.length === 0) {
        errors.push(`${label} must document a successful response.`);
      }
      for (const [status, response] of successResponses) {
        for (const [mediaType, media] of Object.entries(response?.content ?? {})) {
          if (!media?.schema) errors.push(`${label} ${status} ${mediaType} must define a response schema.`);
        }
      }
      for (const [mediaType, media] of Object.entries(operation.requestBody?.content ?? {})) {
        if (!media?.schema) errors.push(`${label} ${mediaType} must define a request schema.`);
      }
    }
  }

  return { errors, warnings };
}
