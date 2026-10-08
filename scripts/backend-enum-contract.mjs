function sameMembers(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    expected.every((value) => actual.includes(value))
  );
}

export function backendEnumContractError({ actual, rawSchemas, schemaName }) {
  const expected = rawSchemas?.[schemaName]?.enum;
  if (!Array.isArray(expected) || expected.length === 0) {
    return `Raw backend ${schemaName} is required for contract validation.`;
  }
  if (!sameMembers(actual, expected)) {
    return `${schemaName} must exactly match the raw backend enum.`;
  }
  return null;
}
