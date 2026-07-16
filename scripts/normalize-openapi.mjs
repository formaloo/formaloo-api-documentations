import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const artifactsDir = path.join(rootDir, "artifacts");
const intermediateDir = path.join(artifactsDir, "intermediate");
const rawSpecPath = path.join(intermediateDir, "openapi-merged.raw.json");
const normalizedSpecPath = path.join(intermediateDir, "openapi-public.normalized.json");
const publicContractPath = path.join(rootDir, "spec", "public-contract.json");
const metadataPath = path.join(rootDir, "spec", "operation-metadata.json");
const tagMetadataPath = path.join(rootDir, "spec", "tag-metadata.json");
const apiKeyHeaderDescription = "Your API Key from the Formaloo dashboard.";
const workspaceHeaderDescription =
  "Current workspace identifier for workspace-scoped requests. Send this header when the endpoint requires a workspace context and your API key does not already identify the workspace.";
const appIdHeaderDescription =
  "Optional client portal or public app identifier. Use this header when the app explicitly provides an app identifier for portal-specific form submission.";
const scopeHeaderDescription =
  "Optional client portal scope identifier. Use this header on client portal authentication requests when your app relies on a specific scope.";
const clientCredentialsAuthorizationDescription =
  "Use `Basic {API Secret}`. The API Secret shown in the Formaloo dashboard can be used directly here.";
const endUserSessionAuthorizationDescription =
  "Use the end-user session token returned by the sign-in flow.";

const publicContract = JSON.parse(await fs.readFile(publicContractPath, "utf8"));
const spec = JSON.parse(await fs.readFile(rawSpecPath, "utf8"));

let metadata = null;
try {
  metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
} catch {
  metadata = null;
}

let tagMetadata = {};
try {
  tagMetadata = JSON.parse(await fs.readFile(tagMetadataPath, "utf8"));
} catch {
  tagMetadata = {};
}

const defaultServerUrl =
  process.env.PUBLIC_API_URL ||
  (process.env.STAGING_DOCS === "true"
    ? "https://api.staging.formaloo.com"
    : "https://api.formaloo.me");
const serverDescription =
  process.env.STAGING_DOCS === "true" ? "Formaloo Staging Server" : "Formaloo Server";

spec.externalDocs = spec.externalDocs ?? spec.info?.externalDocs;
if (spec.info?.externalDocs) {
  delete spec.info.externalDocs;
}

spec.servers = [
  {
    url: defaultServerUrl,
    description: serverDescription
  }
];

spec.components = spec.components ?? {};
spec.components.schemas = spec.components.schemas ?? {};
spec.components.securitySchemes = spec.components.securitySchemes ?? {};
spec.components.responses = spec.components.responses ?? {};
if (!spec.components.securitySchemes.ApiKeyAuthentication) {
  spec.components.securitySchemes.ApiKeyAuthentication = {
    type: "apiKey",
    in: "header",
    name: "x-api-key",
    description: apiKeyHeaderDescription
  };
}
if (!spec.components.securitySchemes.JwtAuthentication) {
  spec.components.securitySchemes.JwtAuthentication = {
    type: "apiKey",
    in: "header",
    name: "Authorization",
    description: 'Use `JWT {Authorization Token}` for protected Formaloo API requests.'
  };
}
spec.components.responses.BadRequest = spec.components.responses.BadRequest ?? {
  description: "The request could not be processed. Review request parameters, headers, and payload values."
};
spec.components.responses.Unauthorized = spec.components.responses.Unauthorized ?? {
  description: "Authentication credentials are missing, invalid, or expired."
};
spec.components.responses.NotFound = spec.components.responses.NotFound ?? {
  description: "The requested resource could not be found."
};

const operationMetadata = metadata?.operations ?? {};
const allowedMetadataKeys = new Set([
  "stability",
  "audience",
  "recommended",
  "complexity",
  "statefulness"
]);
const legacySessionSecuritySchemes = new Set(["cookieAuth", "basicAuth"]);
const tagDefinitions = new Map();
const sortedPaths = {};
const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

function titleizeTag(slug) {
  const overrides = {
    oauth2: "OAuth 2.0",
    oembed: "oEmbed"
  };

  if (overrides[slug]) {
    return overrides[slug];
  }

  return slug
    .replace(/[_-]+/g, " ")
    .replace(/\bapi\b/gi, "API")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bnps\b/gi, "NPS")
    .replace(/\bgsheet\b/gi, "GSheet")
    .replace(/\bpdf\b/gi, "PDF")
    .replace(/\boauth\b/gi, "OAuth")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getTagDefinition(slug) {
  const tagInfo = tagMetadata[slug] ?? {};
  const displayName = tagInfo.displayName ?? titleizeTag(slug);

  return {
    name: displayName,
    description: tagInfo.description ?? `Operations for ${displayName.toLowerCase()}.`,
    "x-formaloo-tag-slug": slug
  };
}

function hasHeaderParameter(operation, headerName) {
  return (operation.parameters ?? []).some(
    (parameter) =>
      parameter?.in === "header" &&
      typeof parameter?.name === "string" &&
      parameter.name.toLowerCase() === headerName.toLowerCase()
  );
}

function upsertHeaderParameter(operation, parameter) {
  operation.parameters = operation.parameters ?? [];
  const existingParameter = operation.parameters.find(
    (currentParameter) =>
      currentParameter?.in === "header" &&
      typeof currentParameter?.name === "string" &&
      currentParameter.name.toLowerCase() === parameter.name.toLowerCase()
  );

  if (existingParameter) {
    existingParameter.description = parameter.description;
    existingParameter.required = parameter.required;
    existingParameter.schema = parameter.schema;
    return;
  }

  operation.parameters.push(parameter);
}

function ensureResponse(operation, statusCode, refName) {
  operation.responses = operation.responses ?? {};
  if (!operation.responses[statusCode]) {
    operation.responses[statusCode] = {
      $ref: `#/components/responses/${refName}`
    };
  }
}

function ensureResponseDescriptions(operation, method) {
  const defaults = {
    "200": "Successful response.",
    "201": "Resource created successfully.",
    "202": "Request accepted successfully.",
    "204": "No response body."
  };

  for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
    if (!response || "$ref" in response) {
      continue;
    }

    const description = typeof response.description === "string" ? response.description.trim() : "";
    if (description) {
      continue;
    }

    response.description =
      defaults[statusCode] ??
      (method === "delete" ? "Request completed successfully." : "Successful response.");
  }
}

function normalizeHeaderParameters(pathKey, method, operation) {
  for (const parameter of operation.parameters ?? []) {
    if (parameter?.in !== "header" || typeof parameter?.name !== "string") {
      continue;
    }

    const normalizedName = parameter.name.toLowerCase();

    if (normalizedName === "x-api-key") {
      parameter.description = apiKeyHeaderDescription;
    }

    if (normalizedName === "x-workspace") {
      parameter.description = workspaceHeaderDescription;
    }
  }

  if (pathKey === "/v3.0/oauth2/authorization-token/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "Authorization",
      required: true,
      schema: { type: "string" },
      description: clientCredentialsAuthorizationDescription
    });
  }

  if (pathKey === "/v1.0/end-users/authorize/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "Authorization",
      required: true,
      schema: { type: "string" },
      description: endUserSessionAuthorizationDescription
    });
  }

  if (pathKey === "/v3.0/form-displays/slug/{slug}/submit/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "x-app-id",
      required: false,
      schema: { type: "string" },
      description: appIdHeaderDescription
    });
  }

  if (pathKey === "/v3.0/end-users/request-redirect/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "x-scope",
      required: false,
      schema: { type: "string" },
      description: scopeHeaderDescription
    });
  }

  if (pathKey === "/v3.0/end-users/profile/" && method === "get") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "x-scope",
      required: false,
      schema: { type: "string" },
      description: scopeHeaderDescription
    });
  }
}

function getRefTarget(ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) {
    return null;
  }

  const parts = ref.slice(2).split("/");
  let current = spec;
  for (const part of parts) {
    current = current?.[part];
    if (!current) {
      return null;
    }
  }

  return current;
}

function inferSchemaType(schema, seenRefs = new Set()) {
  if (!schema || typeof schema !== "object") {
    return null;
  }

  if (typeof schema.type === "string") {
    return schema.type;
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return typeof schema.enum[0] === "string" ? "string" : null;
  }

  if (typeof schema.$ref === "string") {
    if (seenRefs.has(schema.$ref)) {
      return null;
    }

    const nextSeenRefs = new Set(seenRefs);
    nextSeenRefs.add(schema.$ref);
    return inferSchemaType(getRefTarget(schema.$ref), nextSeenRefs);
  }

  for (const key of ["allOf", "oneOf", "anyOf"]) {
    if (!Array.isArray(schema[key]) || schema[key].length === 0) {
      continue;
    }

    const inferredTypes = new Set(
      schema[key]
        .map((item) => inferSchemaType(item, seenRefs))
        .filter(Boolean)
    );

    if (inferredTypes.size === 1) {
      return Array.from(inferredTypes)[0];
    }
  }

  return null;
}

function normalizeSecurity(operation) {
  if (!Array.isArray(operation.security) || operation.security.length === 0) {
    return operation;
  }

  const knownSecuritySchemes = new Set(Object.keys(spec.components.securitySchemes ?? {}));
  let shouldUsePublicAuthModel = false;
  const filteredSecurity = [];

  for (const requirement of operation.security) {
    if (!requirement || typeof requirement !== "object") {
      continue;
    }

    const keys = Object.keys(requirement);
    if (keys.length === 0) {
      continue;
    }

    if (keys.every((key) => legacySessionSecuritySchemes.has(key))) {
      shouldUsePublicAuthModel = true;
      continue;
    }

    const safeRequirement = {};
    for (const key of keys) {
      if (knownSecuritySchemes.has(key)) {
        safeRequirement[key] = requirement[key];
      }
    }

    if (Object.keys(safeRequirement).length > 0) {
      filteredSecurity.push(safeRequirement);
    }
  }

  if (shouldUsePublicAuthModel) {
    filteredSecurity.push({
      ApiKeyAuthentication: [],
      JwtAuthentication: []
    });
  }

  if (filteredSecurity.length > 0) {
    operation.security = filteredSecurity;
  } else {
    delete operation.security;
  }

  return operation;
}

function normalizeResponses(pathKey, method, operation) {
  const responseCodes = Object.keys(operation.responses ?? {});
  const has4xxResponse = responseCodes.some((statusCode) => /^4\d\d$/.test(statusCode));
  const requiresAuth = Array.isArray(operation.security) && operation.security.length > 0;
  const hasApiKeyHeader = hasHeaderParameter(operation, "x-api-key");

  if (!has4xxResponse) {
    ensureResponse(operation, "400", "BadRequest");
  }

  if ((requiresAuth || hasApiKeyHeader) && !operation.responses?.["401"]) {
    ensureResponse(operation, "401", "Unauthorized");
  }

  if (pathKey.includes("{") && ["get", "put", "patch", "delete"].includes(method) && !operation.responses?.["404"]) {
    ensureResponse(operation, "404", "NotFound");
  }

  ensureResponseDescriptions(operation, method);
}

function normalizeSchemaTree(node) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (node.nullable === true && typeof node.type !== "string") {
    const inferredType = inferSchemaType(node);
    if (inferredType) {
      node.type = inferredType;
    }
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        normalizeSchemaTree(item);
      }
    } else if (value && typeof value === "object") {
      normalizeSchemaTree(value);
    }
  }
}

function ensureFormalooLogicSchemas() {
  spec.components.schemas.FormalooLogicArgument = {
    type: "object",
    description:
      "Argument object used by Formaloo form logic conditions and actions. Conditions commonly use `value`; action targets commonly use `identifier`.",
    properties: {
      type: {
        type: "string",
        description: "Argument kind.",
        enum: [
          "field",
          "choice",
          "variable",
          "constant",
          "matrix",
          "table",
          "formula",
          "link",
          "send_email_template",
          "webhook",
          "slack",
          "pdf_template",
          "value"
        ]
      },
      value: {
        anyOf: [
          { type: "string", nullable: true },
          { type: "number", nullable: true },
          { type: "boolean", nullable: true }
        ],
        description:
          "Condition-side primitive value or referenced slug. Examples: field slug for `field`, choice slug for `choice`, numeric/text value for `constant`, or `matrix_slug.group_slug` for `matrix`."
      },
      identifier: {
        type: "string",
        nullable: true,
        description:
          "Action-side reference identifier. Examples: target field slug, variable slug, choice slug, email template slug, webhook slug, PDF template slug, or ending page slug. Literal constants, formulas, and links commonly use `value` instead."
      }
    },
    required: ["type"]
  };

  spec.components.schemas.FormalooLogicCondition = {
    type: "object",
    description:
      "Condition object under a Formaloo logic action's `when` property. Use exact field, choice, variable, matrix, and page slugs from the form definition.",
    properties: {
      operation: {
        type: "string",
        description:
          "Condition operation. Common operations include comparison, choice, state, and boolean-composition operations.",
        enum: [
          "is",
          "is_not",
          "equal",
          "not_equal",
          "gt",
          "gte",
          "lt",
          "lte",
          "on",
          "not_on",
          "before",
          "after",
          "before_or_on",
          "after_or_on",
          "contains",
          "not_contains",
          "starts_with",
          "ends_with",
          "is_answered",
          "smallest",
          "greatest",
          "has_changed_to",
          "and",
          "or",
          "always",
          "otherwise"
        ]
      },
      args: {
        type: "array",
        description:
          "Operation arguments. Condition args use `value`, not `identifier`. For `is`, use field ref plus choice/value ref. For comparisons, use field ref plus constant/value ref. For `and`/`or`, args are nested condition objects with their own `operation` and `args`. For `always` and `otherwise`, use an empty array. This intentionally stays non-recursive for MCP/tool-schema compatibility.",
        items: {
          type: "object",
          additionalProperties: true,
          description:
            "Either a FormalooLogicArgument or a nested condition object for `and`/`or`."
        }
      }
    },
    required: ["operation", "args"],
    example: {
      operation: "is",
      args: [
        { type: "field", value: "service_type" },
        { type: "choice", value: "choice_web_design" }
      ]
    }
  };

  spec.components.schemas.FormalooLogicAction = {
    type: "object",
    description: "Action executed when a Formaloo logic condition matches.",
    properties: {
      action: {
        type: "string",
        description: "Action type to execute.",
        enum: [
          "show",
          "hide",
          "jump",
          "jump_to_success_page",
          "submit",
          "set",
          "add",
          "subtract",
          "multiply",
          "divide",
          "send_email",
          "send_webhook",
          "send_slack",
          "generate_pdf",
          "set_related",
          "redirect"
        ]
      },
      args: {
        type: "array",
        description:
          "Action arguments. References such as fields, variables, choices, templates, webhooks, PDFs, and ending pages commonly use `identifier`; literal constants, formulas, and links commonly use `value`.",
        items: { $ref: "#/components/schemas/FormalooLogicArgument" }
      },
      when: {
        $ref: "#/components/schemas/FormalooLogicCondition"
      }
    },
    required: ["action", "args", "when"],
    example: {
      action: "show",
      args: [{ type: "field", identifier: "follow_up_message" }],
      when: {
        operation: "is",
        args: [
          { type: "field", value: "satisfaction_choice" },
          { type: "choice", value: "choice_needs_help" }
        ]
      }
    }
  };

  spec.components.schemas.FormalooLogicRule = {
    type: "object",
    description:
      "One Formaloo form logic rule. `field` rules react to field values, `submit` rules run on submission, and `update` rules run on field edit/update flows.",
    properties: {
      type: {
        type: "string",
        enum: ["field", "submit", "update"],
        description: "Logic rule scope."
      },
      identifier: {
        type: "string",
        nullable: true,
        description:
          "Trigger field slug for field/update rules. Submit rules may omit this when the rule applies to the submit event."
      },
      actions: {
        type: "array",
        items: { $ref: "#/components/schemas/FormalooLogicAction" },
        description: "Actions evaluated for this logic rule."
      }
    },
    required: ["type", "actions"],
    example: {
      type: "field",
      identifier: "satisfaction_choice",
      actions: [
        {
          action: "show",
          args: [{ type: "field", identifier: "follow_up_message" }],
          when: {
            operation: "is",
            args: [
              { type: "field", value: "satisfaction_choice" },
              { type: "choice", value: "choice_needs_help" }
            ]
          }
        }
      ]
    }
  };

  spec.components.schemas.FormalooFormLogic = {
    type: "array",
    description:
      "List of Formaloo form logic rules saved on a form's `logic` property. Reference exact field, choice, variable, matrix, and page slugs from the form definition.",
    items: { $ref: "#/components/schemas/FormalooLogicRule" }
  };
}

function enrichFormLogicSchemas() {
  ensureFormalooLogicSchemas();

  for (const schemaName of [
    "CreateForm",
    "CreateFormRequest",
    "ShowForm",
    "FormUpdateRequest",
    "PatchedFormUpdateRequest"
  ]) {
    const schema = spec.components.schemas[schemaName];
    if (!schema || typeof schema !== "object") {
      continue;
    }

    schema.properties = schema.properties ?? {};
    schema.properties.logic = {
      $ref: "#/components/schemas/FormalooFormLogic"
    };
    schema.properties.run_field_logics_on_update = {
      type: "boolean",
      description:
        "When true, field logic is also evaluated on row update for fields included in the update payload."
    };
  }
}

function ensureFormalooThemeSchemas() {
  spec.components.schemas.FormalooRgbaColorString = {
    type: "string",
    nullable: true,
    maxLength: 63,
    description:
      "Theme color encoded as a JSON string containing RGBA channels, for example `{\"r\":31,\"g\":45,\"b\":61,\"a\":1}`. Preserve existing values when partially updating a theme unless intentionally changing that color.",
    example: "{\"r\":31,\"g\":45,\"b\":61,\"a\":1}"
  };

  spec.components.schemas.FormalooThemeConfig = {
    type: "object",
    additionalProperties: true,
    description:
      "Additional v5 form theme configuration. Preserve unknown keys on partial update because the theme engine may support keys not represented in this schema.",
    properties: {
      form_layout: {
        type: "string",
        nullable: true,
        description: "Primary form layout.",
        enum: ["top", "center", "left", "right", "left-full", "right-full"]
      },
      modern_view: {
        type: "boolean",
        nullable: true,
        description: "Whether the theme uses the modern visual style."
      },
      google_font: {
        type: "string",
        nullable: true,
        description: "Google Font family name used by the form."
      },
      font_size: {
        type: "string",
        nullable: true,
        description: "Base font-size preset.",
        enum: ["small", "large"]
      },
      background_image: {
        type: "object",
        nullable: true,
        additionalProperties: true,
        description: "Background image metadata or reference object returned by the API."
      },
      background_type: {
        type: "string",
        nullable: true,
        description: "Background rendering mode."
      },
      background_shadow: {
        type: "object",
        nullable: true,
        additionalProperties: true,
        properties: {
          r: { type: "number", description: "Red channel." },
          g: { type: "number", description: "Green channel." },
          b: { type: "number", description: "Blue channel." },
          a: { type: "number", description: "Alpha channel." }
        },
        description: "Background shadow color/configuration object when supported."
      },
      widget_settings: {
        type: "object",
        nullable: true,
        additionalProperties: true,
        description: "Widget-specific styling settings."
      },
      customized_texts: {
        type: "object",
        nullable: true,
        additionalProperties: { type: "string" },
        description:
          "Custom UI text labels, such as `start_btn`, `continue_btn`, or other button/message labels supported by the theme renderer."
      },
      display_welcome_page: {
        type: "boolean",
        nullable: true,
        description: "Whether to show the welcome/start page."
      },
      field_background_color: {
        $ref: "#/components/schemas/FormalooRgbaColorString"
      },
      progress_percentage: {
        type: "boolean",
        nullable: true,
        description: "Whether to show progress as a percentage when supported."
      },
      form_width: {
        type: "number",
        nullable: true,
        description: "Numeric form width control. Preserve the returned value unless intentionally changing the width."
      },
      fullwidth_theme: {
        type: "boolean",
        nullable: true,
        description: "Whether the theme should use the full available width."
      },
      theme_background_pattern: {
        type: "string",
        nullable: true,
        description: "Theme background pattern identifier, URL, or file/reference string."
      }
    }
  };
}

function enrichThemeSchemas() {
  ensureFormalooThemeSchemas();

  const colorFields = [
    "text_color",
    "button_color",
    "theme_color",
    "field_color",
    "background_color",
    "border_color",
    "submit_text_color"
  ];

  for (const schemaName of ["FormTheme", "FormThemeRequest", "PatchedFormThemeRequest"]) {
    const schema = spec.components.schemas[schemaName];
    if (!schema?.properties || typeof schema.properties !== "object") {
      continue;
    }

    for (const fieldName of colorFields) {
      if (schema.properties[fieldName]) {
        const existingDescription = schema.properties[fieldName].description;
        schema.properties[fieldName] = {
          allOf: [{ $ref: "#/components/schemas/FormalooRgbaColorString" }],
          description:
            existingDescription ??
            "Theme color encoded as a JSON-stringified RGBA value."
        };
      }
    }

    if (schema.properties.theme_config) {
      schema.properties.theme_config = {
        $ref: "#/components/schemas/FormalooThemeConfig"
      };
    }

    if (schema.properties.form_type) {
      schema.properties.form_type.description =
        "Form presentation type for this theme. Common values include `simple`, `multi_step`, and `nps`.";
    }

    if (schema.properties.logo_position) {
      schema.properties.logo_position.description =
        "Logo position. Common values include `left`, `center`, `right`, or null.";
    }
  }

  for (const schemaName of ["FormUpdateRequest", "PatchedFormUpdateRequest"]) {
    const schema = spec.components.schemas[schemaName];
    if (!schema?.properties || typeof schema.properties !== "object") {
      continue;
    }

    if (schema.properties.theme) {
      schema.properties.theme = {
        type: "string",
        nullable: true,
        description:
          "Theme slug to assign as the form's active reusable v5 theme. Use `/v3.0/themes/` to list or create themes first. Send null or an empty value only when intentionally clearing the assigned theme."
      };
    }

    if (schema.properties.theme_config) {
      schema.properties.theme_config.description =
        "Legacy/fallback form-level theme configuration. For current v5 styling workflows, create or update a reusable theme resource under `/v3.0/themes/` and assign its slug through the form `theme` field.";
    }

    for (const fieldName of colorFields) {
      if (schema.properties[fieldName]) {
        schema.properties[fieldName].description =
          `${schema.properties[fieldName].description ?? "Form-level color field."} Legacy/fallback form-level styling field; prefer reusable v5 theme resources for current theme workflows.`;
      }
    }
  }

  for (const schemaName of ["ShowForm", "FormUpdate"]) {
    const schema = spec.components.schemas[schemaName];
    if (!schema?.properties || typeof schema.properties !== "object") {
      continue;
    }

    schema.properties.theme = {
      allOf: [{ $ref: "#/components/schemas/FormTheme" }],
      nullable: true,
      readOnly: true,
      description:
        "Assigned reusable v5 theme resource for this form, or null when no reusable theme is assigned."
    };
  }
}

function upsertJsonRequestBody(operation, schemaRef, required = false) {
  operation.requestBody = operation.requestBody ?? {};
  operation.requestBody.required = required;
  operation.requestBody.content = operation.requestBody.content ?? {};

  for (const mediaType of [
    "application/json",
    "application/x-www-form-urlencoded",
    "multipart/form-data"
  ]) {
    operation.requestBody.content[mediaType] = {
      schema: { $ref: schemaRef }
    };
  }
}

function upsertJsonResponse(operation, statusCode, schemaRef, description) {
  operation.responses = operation.responses ?? {};
  operation.responses[statusCode] = operation.responses[statusCode] ?? {};
  operation.responses[statusCode].description =
    operation.responses[statusCode].description ?? description;
  operation.responses[statusCode].content = operation.responses[statusCode].content ?? {};
  operation.responses[statusCode].content["application/json"] = {
    schema: { $ref: schemaRef }
  };
}

function enrichThemeOperations() {
  spec.components.schemas.FormThemeCopyRequest = {
    type: "object",
    description:
      "Optional payload for copying an existing workspace or system theme into the active workspace.",
    properties: {
      title: {
        type: "string",
        description:
          "Optional title for the copied theme. If omitted, the copied theme's current title is reused."
      }
    }
  };

  spec.components.schemas.FormThemeCreateFromFormRequest = {
    type: "object",
    description:
      "Optional payload for creating a reusable theme from a form's current visual styling.",
    properties: {
      title: {
        type: "string",
        description:
          "Optional title for the new reusable theme. If omitted, the source form title is used."
      }
    }
  };

  spec.components.schemas.FormThemeDeleteRequest = {
    type: "object",
    description:
      "Optional payload for deleting a theme. Use `replace_with_theme` when existing forms should be moved to another theme before deletion.",
    properties: {
      replace_with_theme: {
        type: "string",
        nullable: true,
        description:
          "Slug of another theme in the same workspace, or a system theme, to assign to forms that currently use the deleted theme. If omitted, linked forms are left without this theme."
      }
    }
  };

  const copyTheme = spec.paths["/v3.0/themes/{slug}/copy/"]?.post;
  if (copyTheme) {
    upsertJsonRequestBody(copyTheme, "#/components/schemas/FormThemeCopyRequest", false);
    upsertJsonResponse(copyTheme, "201", "#/components/schemas/FormTheme", "Copied theme.");
  }

  const createThemeFromForm = spec.paths["/v3.0/forms/{slug}/create-theme/"]?.post;
  if (createThemeFromForm) {
    upsertJsonRequestBody(
      createThemeFromForm,
      "#/components/schemas/FormThemeCreateFromFormRequest",
      false
    );
    upsertJsonResponse(
      createThemeFromForm,
      "201",
      "#/components/schemas/FormTheme",
      "Created reusable theme from form."
    );
  }

  const deleteTheme = spec.paths["/v3.0/themes/{slug}/"]?.delete;
  if (deleteTheme) {
    upsertJsonRequestBody(deleteTheme, "#/components/schemas/FormThemeDeleteRequest", false);
  }
}

function enrichFormBuilderSchemasAndOperations() {
  spec.components.schemas.FormalooBuilderChoiceInput = {
    type: "object",
    additionalProperties: true,
    description:
      "Choice item used when creating or updating choice-like fields through the form builder endpoint. Use `slug` for an existing choice and `ref_id` as a temporary client-side identifier for a new choice before the API returns its generated slug.",
    properties: {
      ref_id: {
        type: "string",
        description:
          "Temporary client-side identifier returned back in the response so callers can map generated choice slugs."
      },
      slug: {
        type: "string",
        description: "Existing choice slug. Include this when updating or preserving an existing choice."
      },
      title: {
        type: "string",
        description: "Choice label shown to respondents."
      },
      image: {
        type: "string",
        nullable: true,
        description: "Optional image URL or file reference when the field type supports image choices."
      },
      color: {
        type: "string",
        nullable: true,
        description: "Optional choice color when supported."
      }
    }
  };

  spec.components.schemas.FormalooBuilderFieldInput = {
    type: "object",
    additionalProperties: true,
    description:
      "Field object accepted by the bulk form builder endpoint. Include `slug` to update or preserve an existing field. Omit `slug` and include `type` to create a new field. Use `ref_id` to preserve client-side ordering and to let dependent fields reference newly-created fields before real slugs are generated.",
    properties: {
      ref_id: {
        type: "string",
        description:
          "Temporary client-side identifier used for response mapping and for same-request references between new fields."
      },
      slug: {
        type: "string",
        description:
          "Existing field slug. If the payload contains only `slug` and `ref_id`, the field is preserved and can be reordered."
      },
      type: {
        type: "string",
        description:
          "Field type for new fields, for example `short_text`, `long_text`, `email`, `number`, `choice`, `dropdown`, `multiple_select`, `lookup`, `linked_rows`, or `profile`."
      },
      title: {
        type: "string",
        description: "Field title shown to respondents or internal users."
      },
      choice_items: {
        type: "array",
        description:
          "Explicit choices for choice-like fields. Do not send `choice_items` and `bulk_choices` together.",
        items: { $ref: "#/components/schemas/FormalooBuilderChoiceInput" }
      },
      bulk_choices: {
        description:
          "Convenience input for appending choices on choice-like fields. May be a list of labels or a newline-separated string. Do not send with `choice_items`."
      },
      linked_rows_field: {
        type: "string",
        description:
          "For lookup fields, slug or same-request `ref_id` of the linked rows field this lookup depends on."
      },
      profile_field: {
        type: "string",
        description:
          "For profile-data fields, slug or same-request `ref_id` of the profile field this field depends on."
      }
    }
  };

  spec.components.schemas.FormalooFormBuilderResultField = {
    type: "object",
    additionalProperties: true,
    description:
      "Per-field result returned by the bulk form builder endpoint. Check `status` and `errors` before assuming a field was saved.",
    properties: {
      status: {
        type: "string",
        description:
          "Result for this field. Common values include `created`, `updated`, `not_changed`, `re_positioned`, and `failed`."
      },
      errors: {
        type: "object",
        additionalProperties: true,
        description: "Validation errors for this field, empty when the field was accepted."
      },
      object: {
        type: "object",
        additionalProperties: true,
        description:
          "Saved field object. For newly created fields this contains the generated `slug`; it also echoes `ref_id` when one was provided."
      }
    }
  };

  for (const schemaName of ["FormAndFieldsUpdateRequest", "PatchedFormAndFieldsUpdateRequest"]) {
    const schema = spec.components.schemas[schemaName];
    if (!schema || typeof schema !== "object") {
      continue;
    }
    schema.description =
      "Bulk form-builder payload for updating form metadata and field definitions together.";
    schema.properties = schema.properties ?? {};
    schema.properties.form = {
      type: "object",
      additionalProperties: true,
      description:
        "Partial form update object using the same editable form fields as `PATCH /v3.0/forms/{slug}/`."
    };
    schema.properties.fields = {
      type: "array",
      description:
        "Ordered list of fields to create, update, preserve, or reposition. Include fields that should remain in the form; omitting an existing field removes it from the submitted field order.",
      items: { $ref: "#/components/schemas/FormalooBuilderFieldInput" }
    };
  }

  const responseSchema = spec.components.schemas.FormAndFieldsUpdate;
  if (responseSchema && typeof responseSchema === "object") {
    responseSchema.description =
      "Bulk form-builder response with form-level status and per-field save results.";
    responseSchema.properties = responseSchema.properties ?? {};
    responseSchema.properties.form = {
      type: "object",
      additionalProperties: true,
      description:
        "Form-level result with `status` and `errors`. Check this before assuming form metadata was saved."
    };
    responseSchema.properties.fields = {
      type: "array",
      description:
        "Per-field result list in requested order, including generated slugs and validation errors.",
      items: { $ref: "#/components/schemas/FormalooFormBuilderResultField" }
    };
  }
}

function enrichBoardDeleteOperation() {
  spec.components.schemas.BoardDeleteRequest = {
    type: "object",
    description:
      "Optional board deletion payload. Use `delete_forms` only when linked forms should also be deleted.",
    properties: {
      delete_forms: {
        type: "boolean",
        default: false,
        description:
          "When true, connected forms and the primary form are deleted asynchronously after the board/app is deleted. When false or omitted, only the board/app is deleted."
      }
    }
  };

  const deleteBoard = spec.paths["/v3.0/boards/{boardSlug}/"]?.delete;
  if (!deleteBoard) {
    return;
  }

  deleteBoard.parameters = deleteBoard.parameters ?? [];
  const hasDeleteFormsParam = deleteBoard.parameters.some(
    (parameter) => parameter?.in === "query" && parameter?.name === "delete_forms"
  );
  if (!hasDeleteFormsParam) {
    deleteBoard.parameters.push({
      in: "query",
      name: "delete_forms",
      required: false,
      schema: { type: "boolean", default: false },
      description:
        "Set to true only when deleting the board/app should also delete its connected forms. This action is asynchronous for the forms."
    });
  }

  upsertJsonRequestBody(deleteBoard, "#/components/schemas/BoardDeleteRequest", false);
}

function enrichChoiceFieldSchemas() {
  const choiceInputDescription =
    "Explicit choices for this field. Do not send `choice_items` together with `bulk_choices`. On update, include existing choice slugs for choices that should remain.";
  const bulkChoicesDescription =
    "Convenience input for appending choices. May be a list of labels or a newline-separated string. Do not send together with `choice_items`.";

  for (const schema of Object.values(spec.components.schemas ?? {})) {
    if (!schema?.properties || typeof schema.properties !== "object") {
      continue;
    }

    if (schema.properties.choice_items) {
      schema.properties.choice_items.description =
        schema.properties.choice_items.description ?? choiceInputDescription;
      if (schema.properties.choice_items.type === "array" && !schema.properties.choice_items.items) {
        schema.properties.choice_items.items = {
          $ref: "#/components/schemas/FormalooBuilderChoiceInput"
        };
      }
    }

    if (schema.properties.bulk_choices) {
      schema.properties.bulk_choices.description =
        schema.properties.bulk_choices.description ?? bulkChoicesDescription;
    }
  }
}

function collectComponentUsage(rootNode) {
  const usedComponents = new Map();
  const visitedRefs = new Set();

  function mark(section, name) {
    if (!usedComponents.has(section)) {
      usedComponents.set(section, new Set());
    }
    usedComponents.get(section).add(name);
  }

  function walk(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    if (typeof node.$ref === "string") {
      const ref = node.$ref;
      const match = ref.match(/^#\/components\/([^/]+)\/(.+)$/);
      if (match) {
        const [, section, name] = match;
        mark(section, name);

        if (!visitedRefs.has(ref)) {
          visitedRefs.add(ref);
          const target = spec.components?.[section]?.[name];
          if (target) {
            walk(target);
          }
        }
      }
    }

    for (const value of Object.values(node)) {
      walk(value);
    }
  }

  walk(rootNode);
  return usedComponents;
}

function pruneUnusedSchemas() {
  if (!spec.components?.schemas) {
    return;
  }

  const usedComponents = collectComponentUsage({
    paths: spec.paths,
    webhooks: spec.webhooks,
    components: {
      responses: spec.components.responses,
      parameters: spec.components.parameters,
      requestBodies: spec.components.requestBodies,
      headers: spec.components.headers,
      examples: spec.components.examples,
      links: spec.components.links,
      callbacks: spec.components.callbacks
    }
  });
  const usedSchemas = usedComponents.get("schemas") ?? new Set();

  for (const schemaName of Object.keys(spec.components.schemas)) {
    if (!usedSchemas.has(schemaName)) {
      delete spec.components.schemas[schemaName];
    }
  }
}

for (const pathKey of Object.keys(spec.paths).sort()) {
  const pathItem = spec.paths[pathKey];
  const sortedPathItem = {};
  const isLegacyPath = Boolean(publicContract.legacyPaths[pathKey]);

  for (const [method, operation] of Object.entries(pathItem)) {
    if (!httpMethods.has(method)) {
      sortedPathItem[method] = operation;
      continue;
    }

    const normalizedOperation = { ...operation };
    normalizeHeaderParameters(pathKey, method, normalizedOperation);
    normalizeSecurity(normalizedOperation);
    normalizeResponses(pathKey, method, normalizedOperation);

    const rawTags =
      Array.isArray(normalizedOperation.tags) && normalizedOperation.tags.length > 0
        ? normalizedOperation.tags
        : [pathKey.split("/").filter(Boolean)[1] ?? "general"];
    normalizedOperation.tags = Array.from(
      new Set(
        rawTags.map((tagSlug) => {
          const tagDefinition = getTagDefinition(tagSlug);
          tagDefinitions.set(tagDefinition.name, tagDefinition);
          return tagDefinition.name;
        })
      )
    );

    if (isLegacyPath) {
      const notice = publicContract.legacyPathNotice;
      const existingDescription = (normalizedOperation.description ?? "").trim();
      if (!existingDescription.startsWith(notice)) {
        normalizedOperation.description = existingDescription
          ? `${notice}\n\n${existingDescription}`
          : notice;
      }
      normalizedOperation["x-formaloo-legacy-path"] = true;
    }

    if (normalizedOperation.operationId && operationMetadata[normalizedOperation.operationId]) {
      const safeMetadata = {};
      for (const [key, value] of Object.entries(operationMetadata[normalizedOperation.operationId])) {
        if (allowedMetadataKeys.has(key)) {
          safeMetadata[key] = value;
        }
      }

      if (Object.keys(safeMetadata).length > 0) {
        normalizedOperation["x-formaloo-metadata"] = safeMetadata;
      }
    }

    sortedPathItem[method] = normalizedOperation;
  }

  sortedPaths[pathKey] = sortedPathItem;
}

spec.paths = sortedPaths;
spec.tags = Array.from(tagDefinitions.values()).sort((left, right) => left.name.localeCompare(right.name));
enrichFormLogicSchemas();
enrichThemeSchemas();
enrichThemeOperations();
enrichFormBuilderSchemasAndOperations();
enrichBoardDeleteOperation();
enrichChoiceFieldSchemas();
normalizeSchemaTree(spec.components?.schemas);
pruneUnusedSchemas();

await fs.mkdir(intermediateDir, { recursive: true });
await fs.writeFile(normalizedSpecPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`Normalized public spec -> ${path.relative(rootDir, normalizedSpecPath)}`);
