const FORM_ANSWER_PROPERTIES = Object.freeze({
  acceptable_answers: "FormalooAcceptableAnswers",
  unacceptable_answers: "FormalooUnacceptableAnswers"
});

const FORM_ANSWER_COMPONENTS = Object.freeze({
  FormalooAcceptableAnswers: {
    oneOf: [
      { type: "array", nullable: true, items: { type: "string" } },
      { type: "string" }
    ],
    description:
      "Allowed answer values. Accepts a list of strings (including an empty list), null, or a newline-delimited string. Exact values are trimmed and lowercased; slash-delimited regex entries are preserved and validated."
  },
  FormalooUnacceptableAnswers: {
    oneOf: [
      { type: "array", nullable: true, items: { type: "string" } },
      { type: "string" }
    ],
    description:
      "Blocked answer values. Accepts a list of strings (including an empty list), null, or a newline-delimited string. Values are trimmed and lowercased."
  }
});

function isFieldSchema(schemaName) {
  return schemaName.includes("Field");
}

export function normalizeFormAnswerProperties(spec) {
  spec.components ??= {};
  spec.components.schemas ??= {};

  for (const [componentName, schema] of Object.entries(FORM_ANSWER_COMPONENTS)) {
    spec.components.schemas[componentName] = structuredClone(schema);
  }

  for (const [schemaName, schema] of Object.entries(spec.components?.schemas ?? {})) {
    if (!isFieldSchema(schemaName) || !schema?.properties) {
      continue;
    }

    for (const [propertyName, componentName] of Object.entries(FORM_ANSWER_PROPERTIES)) {
      if (schema.properties[propertyName]) {
        schema.properties[propertyName] = {
          $ref: `#/components/schemas/${componentName}`
        };
      }
    }
  }
}

export function validateFormAnswerProperties(spec) {
  const errors = [];

  for (const [componentName, expected] of Object.entries(FORM_ANSWER_COMPONENTS)) {
    const actual = spec.components?.schemas?.[componentName];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      errors.push(`${componentName} must match the backend answer-list contract.`);
    }
  }

  for (const [schemaName, schema] of Object.entries(spec.components?.schemas ?? {})) {
    if (!isFieldSchema(schemaName) || !schema?.properties) {
      continue;
    }

    for (const [propertyName, componentName] of Object.entries(FORM_ANSWER_PROPERTIES)) {
      const property = schema.properties[propertyName];
      if (!property) {
        continue;
      }

      const expectedRef = `#/components/schemas/${componentName}`;
      if (property.$ref !== expectedRef || Object.keys(property).length !== 1) {
        errors.push(
          `${schemaName}.${propertyName} must reference ${componentName}; ` +
            "the backend accepts string arrays, newline-delimited strings, or null."
        );
      }
    }
  }

  return errors;
}
