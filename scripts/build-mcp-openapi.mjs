import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const intermediateDir = path.join(rootDir, "artifacts", "intermediate");
const normalizedSpecPath = path.join(intermediateDir, "openapi-public.normalized.json");
const mcpSpecPath = path.join(intermediateDir, "openapi-mcp.filtered.json");
const defaultSettingsPath = path.join(rootDir, "spec", "mcp-openapi-settings.json");

const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeServiceToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeServiceName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function stripServerPrefix(rawPath) {
  const withoutQuery = String(rawPath ?? "").split("?")[0].split("#")[0];
  return withoutQuery.replace(/^https?:\/\/[^/]+/i, "");
}

function normalizePathForCompare(rawPath) {
  let normalized = stripServerPrefix(rawPath).trim();
  if (!normalized) {
    return "/";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+/g, "/").toLowerCase();
  normalized = normalized.replace(/\{([^}]+)\}/g, "$1");

  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized;
}

function stripVersionPrefix(normalizedPath) {
  const withoutVersion = normalizedPath.replace(/^\/v\d+\.\d+(?=\/|$)/, "");
  return withoutVersion || "/";
}

function hasVersionPrefix(normalizedPath) {
  return /^\/v\d+\.\d+(?=\/|$)/.test(normalizedPath);
}

function preparePathRule(rawPath) {
  const pathValue = normalizePathForCompare(rawPath);
  return {
    path: pathValue,
    includesVersion: hasVersionPrefix(pathValue)
  };
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function wildcardPatternToRegex(pattern) {
  const escapedPattern = escapeRegex(pattern).replace(/\*/g, ".*");
  return new RegExp(`^${escapedPattern}(?:/.*)?$`);
}

function prepareWildcardRule(rawPattern) {
  const pathValue = normalizePathForCompare(rawPattern);
  return {
    pattern: pathValue,
    includesVersion: hasVersionPrefix(pathValue),
    regex: wildcardPatternToRegex(pathValue)
  };
}

async function loadServiceExclusionIndex(serviceNames) {
  const operationIds = new Set();
  const endpointKeys = new Set();
  const missingServices = [];

  for (const serviceName of serviceNames) {
    const normalizedServiceName = normalizeServiceName(serviceName);
    const bundledPath = path.join(rootDir, "spec", `${normalizedServiceName}-bundled.json`);

    let serviceSpec = null;
    try {
      serviceSpec = JSON.parse(await fs.readFile(bundledPath, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") {
        missingServices.push(serviceName);
        continue;
      }
      throw error;
    }

    for (const [pathKey, pathItem] of Object.entries(serviceSpec.paths ?? {})) {
      for (const [method, operation] of Object.entries(pathItem ?? {})) {
        const methodToken = method.toLowerCase();
        if (!httpMethods.has(methodToken) || !operation || typeof operation !== "object") {
          continue;
        }

        if (typeof operation.operationId === "string" && operation.operationId.trim() !== "") {
          operationIds.add(operation.operationId);
        }

        const normalizedPath = normalizePathForCompare(pathKey);
        const versionlessPath = stripVersionPrefix(normalizedPath);
        endpointKeys.add(`${methodToken} ${normalizedPath}`);
        endpointKeys.add(`${methodToken} ${versionlessPath}`);
      }
    }
  }

  return {
    operationIds,
    endpointKeys,
    missingServices
  };
}

const settingsPathInput = defaultSettingsPath;
const settingsPath = path.isAbsolute(settingsPathInput) ? settingsPathInput : path.join(rootDir, settingsPathInput);

let settings = {};
try {
  settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error;
  }
}

const excludeSettings = settings.exclude ?? settings;
const excludedServices = asStringArray(excludeSettings.services);
const excludedServiceTokens = new Set(excludedServices.map(normalizeServiceToken));
const excludedTagTokens = new Set(asStringArray(excludeSettings.tags).map(normalizeServiceToken));
const excludedPathPrefixes = asStringArray(excludeSettings.pathPrefixes).map(preparePathRule);
const excludedPathPatterns = asStringArray(excludeSettings.pathPatterns).map(prepareWildcardRule);
const excludedEndpoints = new Set(asStringArray(excludeSettings.endpoints).map((endpoint) => normalizePathForCompare(endpoint)));
const excludedServiceIndex = await loadServiceExclusionIndex(excludedServices);

const spec = JSON.parse(await fs.readFile(normalizedSpecPath, "utf8"));

const displayNameToSlug = new Map();
for (const tag of spec.tags ?? []) {
  if (!tag || typeof tag.name !== "string") {
    continue;
  }

  const slug = typeof tag["x-formaloo-tag-slug"] === "string" ? tag["x-formaloo-tag-slug"] : null;
  if (slug) {
    displayNameToSlug.set(tag.name, slug);
  }
}

function operationHasExcludedTag(operation) {
  if (excludedTagTokens.size === 0) {
    return false;
  }

  for (const tagName of operation.tags ?? []) {
    const displayToken = normalizeServiceToken(tagName);
    if (excludedTagTokens.has(displayToken)) {
      return true;
    }

    const slug = displayNameToSlug.get(tagName);
    if (slug && excludedTagTokens.has(normalizeServiceToken(slug))) {
      return true;
    }
  }

  return false;
}

function shouldExcludeByService(pathKey, method, operation) {
  if (excludedServices.length === 0) {
    return false;
  }

  if (typeof operation?.operationId === "string" && excludedServiceIndex.operationIds.has(operation.operationId)) {
    return true;
  }

  const methodToken = method.toLowerCase();
  const normalizedPath = normalizePathForCompare(pathKey);
  const versionlessPath = stripVersionPrefix(normalizedPath);
  if (
    excludedServiceIndex.endpointKeys.has(`${methodToken} ${normalizedPath}`) ||
    excludedServiceIndex.endpointKeys.has(`${methodToken} ${versionlessPath}`)
  ) {
    return true;
  }

  return false;
}

function pathMatchesRule(pathKey, includesVersion, value, matcher) {
  const normalizedPath = normalizePathForCompare(pathKey);
  const versionlessPath = stripVersionPrefix(normalizedPath);
  const targetPath = includesVersion ? normalizedPath : versionlessPath;
  return matcher(targetPath, value);
}

function shouldExcludeByPathPrefix(pathKey) {
  return excludedPathPrefixes.some(({ path: prefix, includesVersion }) =>
    pathMatchesRule(pathKey, includesVersion, prefix, (candidate, rulePath) => {
      if (rulePath === "/") {
        return true;
      }

      if (candidate === rulePath) {
        return true;
      }

      return candidate.startsWith(`${rulePath}/`);
    })
  );
}

function shouldExcludeByWildcard(pathKey) {
  return excludedPathPatterns.some(({ includesVersion, regex }) =>
    pathMatchesRule(pathKey, includesVersion, regex, (candidate, ruleRegex) => ruleRegex.test(candidate))
  );
}

function shouldExcludeEndpoint(pathKey) {
  if (excludedEndpoints.size === 0) {
    return false;
  }

  const normalizedPath = normalizePathForCompare(pathKey);
  const versionlessPath = stripVersionPrefix(normalizedPath);
  return excludedEndpoints.has(normalizedPath) || excludedEndpoints.has(versionlessPath);
}

function shouldExcludePath(pathKey) {
  return shouldExcludeByPathPrefix(pathKey) || shouldExcludeByWildcard(pathKey) || shouldExcludeEndpoint(pathKey);
}

function getRefTarget(openapiSpec, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) {
    return null;
  }

  const parts = ref.slice(2).split("/");
  let current = openapiSpec;
  for (const part of parts) {
    current = current?.[part];
    if (!current) {
      return null;
    }
  }

  return current;
}

function relaxWorkspaceHeaderParameter(openapiSpec, parameter) {
  if (!parameter || typeof parameter !== "object") {
    return;
  }

  let target = parameter;
  if (typeof parameter.$ref === "string") {
    target = getRefTarget(openapiSpec, parameter.$ref);
  }

  if (
    target?.in === "header" &&
    typeof target.name === "string" &&
    target.name.toLowerCase() === "x-workspace"
  ) {
    target.required = false;
  }
}

function relaxWorkspaceHeaderRequirements(openapiSpec) {
  for (const pathItem of Object.values(openapiSpec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const parameter of pathItem.parameters ?? []) {
      relaxWorkspaceHeaderParameter(openapiSpec, parameter);
    }

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") {
        continue;
      }

      for (const parameter of operation.parameters ?? []) {
        relaxWorkspaceHeaderParameter(openapiSpec, parameter);
      }
    }
  }

  for (const parameter of Object.values(openapiSpec.components?.parameters ?? {})) {
    relaxWorkspaceHeaderParameter(openapiSpec, parameter);
  }
}

const coreMcpOperations = {
  profileRetrieve: {
    summary: "Get current authenticated user profile",
    description:
      "Returns the authenticated user's profile. Use this for who-am-I checks, account display, and verifying that the current API key and authorization token identify the expected user.",
    mcp: {
      tool_name: "get_profile",
      aliases: ["who_am_i", "get_current_user", "get_my_profile"],
      intent: "Get the current authenticated user's Formaloo profile.",
      requires_workspace: false,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data",
      user_data: false,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        current_user_profile: {
          summary: "Current authenticated profile",
          value: {
            username: "jane@example.com",
            first_name: "Jane",
            last_name: "Doe",
            email: "jane@example.com",
            phone_number: "+15551234567",
            team: "Formaloo Team",
            verified_email: true,
            used_trial: false
          }
        }
      }
    }
  },
  businessesList: {
    summary: "List workspaces available to the authenticated user",
    description:
      "Returns the workspaces available to the authenticated user. In Formaloo API fields and endpoint paths, business and workspace refer to the same resource.",
    mcp: {
      tool_name: "list_workspaces",
      aliases: ["show_workspaces", "list_businesses", "get_workspaces"],
      intent: "List Formaloo workspaces the authenticated user can access.",
      requires_workspace: false,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data",
      user_data: false,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        workspace_list: {
          summary: "Workspace list",
          value: [
            {
              title: "Marketing Team",
              slug: "marketing-team",
              business_identifier: "marketing-team",
              access_level: "owner"
            }
          ]
        }
      }
    }
  },
  businessesRetrieve: {
    summary: "Get one workspace by slug",
    description:
      "Retrieves one workspace by slug. In Formaloo API fields and endpoint paths, business and workspace refer to the same resource.",
    parameterDescriptions: {
      slug: "Workspace slug or business identifier."
    },
    mcp: {
      tool_name: "get_workspace",
      aliases: ["get_business", "show_workspace", "workspace_details"],
      intent: "Get details for one Formaloo workspace.",
      requires_workspace: false,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data",
      user_data: false,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        workspace: {
          summary: "Workspace details",
          value: {
            title: "Marketing Team",
            slug: "marketing-team",
            business_identifier: "marketing-team",
            access_level: "owner",
            timezone: "UTC"
          }
        }
      }
    }
  },
  formsList: {
    summary: "List forms in the active workspace",
    description:
      "Lists forms the authenticated user can access in the active workspace. Send `x-workspace` when the API key does not already identify the workspace.",
    parameterDescriptions: {
      board: "Board or app slug used to filter forms.",
      categories: "Comma-separated category slugs used to filter forms.",
      category: "Category slug used to filter forms.",
      copied_from: "Source form slug used to filter copied forms.",
      slug: "Form slug used to filter the list.",
      tag: "Single tag slug used to filter forms.",
      tags: "Comma-separated tag slugs used to filter forms.",
      version: "Form version filter."
    },
    mcp: {
      tool_name: "list_forms",
      aliases: ["show_forms", "find_forms", "get_forms"],
      intent: "List forms available in the selected Formaloo workspace.",
      requires_workspace: true,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data.data.forms",
      user_data: false,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        form_list: {
          summary: "Paginated form list",
          value: {
            count: 1,
            next: null,
            previous: null,
            page_size: 20,
            page_count: 1,
            current_page: 1,
            forms: [
              {
                title: "Customer Feedback",
                slug: "customer-feedback",
                address: "customer-feedback",
                submit_count: 42
              }
            ]
          }
        }
      }
    }
  },
  formsRetrieve: {
    summary: "Get one form by slug",
    description:
      "Retrieves a form's full admin configuration by slug in the active workspace. Use this before editing a form or inspecting fields, settings, theme, and behavior. The `theme` field is the assigned reusable v5 theme object, or null when no reusable theme is assigned.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "get_form",
      aliases: ["show_form", "form_details", "get_form_by_slug"],
      intent: "Get the full configuration for one Formaloo form.",
      requires_workspace: true,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        form: {
          summary: "Form details",
          value: {
            title: "Customer Feedback",
            slug: "customer-feedback",
            address: "customer-feedback",
            show_title: true,
            theme: {
              title: "Customer Feedback Theme",
              slug: "customer-feedback-theme",
              system_theme: false
            },
            fields_list: [],
            submit_count: 42
          }
        }
      }
    }
  },
  formsRowsList: {
    summary: "List submissions or rows for a form",
    description:
      "Lists submissions, also called rows or records, for a specific form in the active workspace. This may expose customer-submitted data.",
    parameterDescriptions: {
      slug: "Form slug.",
      submit_number: "Submission number filter.",
      tracking_code: "Submission tracking code filter."
    },
    mcp: {
      tool_name: "list_form_rows",
      aliases: ["list_submissions", "show_submissions", "list_form_records"],
      intent: "List submitted rows for a Formaloo form.",
      requires_workspace: true,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data.data.rows",
      user_data: true,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        row_list: {
          summary: "Paginated submission list",
          value: {
            count: 1,
            next: null,
            previous: null,
            page_size: 20,
            page_count: 1,
            current_page: 1,
            rows: [
              {
                slug: "row-123",
                submit_number: 1,
                tracking_code: "TRK-123",
                data: {
                  email: "customer@example.com"
                }
              }
            ]
          }
        }
      }
    }
  },
  boardsList: {
    summary: "List apps or boards in the active workspace",
    description:
      "Lists boards in the active workspace. Boards are commonly shown as apps in the product UI; use app language for users and board language when referring to API fields.",
    parameterDescriptions: {
      copied_from: "Source board slug used to filter copied boards.",
      folders: "Folder slug or comma-separated folder slugs used to filter boards.",
      form: "Form slug used to return boards or apps using that form.",
      slug: "Board or app slug used to filter the list.",
      tag: "Single tag slug used to filter boards.",
      tags: "Comma-separated tag slugs used to filter boards.",
      user_form: "User form slug used to filter boards."
    },
    mcp: {
      tool_name: "list_apps",
      aliases: ["list_boards", "show_apps", "show_boards"],
      intent: "List Formaloo apps or boards in the selected workspace.",
      requires_workspace: true,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data.data.boards",
      user_data: false,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        board_list: {
          summary: "Paginated app or board list",
          value: {
            count: 1,
            next: null,
            previous: null,
            page_size: 20,
            page_count: 1,
            current_page: 1,
            boards: [
              {
                title: "CRM App",
                slug: "crm-app",
                address: "crm-app"
              }
            ]
          }
        }
      }
    }
  },
  boardsDestroy: {
    summary: "Delete an app or board",
    description:
      "Deletes a board, shown as an app in the Formaloo UI. By default this deletes only the board/app. Set `delete_forms` only when the user explicitly confirms that connected forms should also be deleted.",
    parameterDescriptions: {
      boardSlug: "Board or app slug to delete.",
      delete_forms:
        "When true, connected forms and the primary form are deleted asynchronously after the board/app is deleted. Leave false or omit to keep forms."
    },
    mcp: {
      tool_name: "delete_app",
      aliases: ["delete_board", "remove_app", "remove_board"],
      intent: "Delete a Formaloo app/board, optionally also deleting connected forms when explicitly requested.",
      requires_workspace: true,
      read_only: false,
      destructive: true,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      delete_board_only: {
        summary: "Delete the app/board but keep connected forms",
        value: {
          delete_forms: false
        }
      },
      delete_board_and_forms: {
        summary: "Delete the app/board and connected forms",
        value: {
          delete_forms: true
        }
      }
    }
  },
  formsCreate: {
    summary: "Create a simple form",
    description:
      "Creates a form in the active workspace. Start with a title and simple settings, then add or update fields as needed.",
    mcp: {
      tool_name: "create_form",
      aliases: ["new_form", "make_form", "create_form_in_workspace"],
      intent: "Create a new Formaloo form in the selected workspace.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      simple_form: {
        summary: "Create a simple form",
        value: {
          title: "Customer Feedback",
          show_title: true,
          description: "Collect customer feedback."
        }
      }
    },
    responseExamples: {
      "201": {
        created_form: {
          summary: "Created form",
          value: {
            title: "Customer Feedback",
            slug: "customer-feedback",
            address: "customer-feedback",
            show_title: true
          }
        }
      }
    }
  },
  formsUpdate: {
    summary: "Update a form",
    description:
      "Replaces a form's editable configuration in the active workspace. Use only when the caller intends to update the full form resource.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "update_form",
      aliases: ["edit_form", "replace_form", "update_form_title"],
      intent: "Update a Formaloo form's configuration.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: true,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      update_form_title: {
        summary: "Update a form title",
        value: {
          title: "Updated Customer Feedback",
          fixed_payment_amount: "",
          payment_method: "",
          redirection_address: "",
          user_spreadsheet_id: "",
          user_spreadsheet_range: ""
        }
      }
    }
  },
  formsPartialUpdate: {
    summary: "Partially update a form",
    description:
      "Updates selected editable fields on a form in the active workspace. Prefer this operation for small changes such as renaming a form, assigning a reusable theme by slug, or saving reviewed logic changes when field, choice, variable, and page references are known.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "patch_form",
      aliases: ["update_form_title", "rename_form", "partially_update_form"],
      intent: "Partially update a Formaloo form.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      update_form_title: {
        summary: "Update a form title",
        value: {
          title: "Updated Customer Feedback"
        }
      },
      assign_theme: {
        summary: "Assign a reusable theme to a form",
        value: {
          theme: "customer-feedback-theme"
        }
      },
      update_form_logic: {
        summary: "Update reviewed form logic",
        value: {
          run_field_logics_on_update: true,
          logic: [
            {
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
          ]
        }
      }
    },
    responseExamples: {
      "200": {
        updated_form: {
          summary: "Updated form",
          value: {
            title: "Updated Customer Feedback",
            slug: "customer-feedback",
            address: "customer-feedback",
            show_title: true
          }
        }
      }
    }
  },
  formFieldsRetrieve: {
    summary: "Get editable form and fields",
    description:
      "Retrieves the editable form-builder structure for a form, including current field definitions. Use this before adding, deleting, reordering, or changing multiple fields so exact field slugs, choice slugs, aliases, and existing settings can be preserved.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "get_form_builder",
      aliases: ["get_form_fields", "get_editable_form", "inspect_form_builder"],
      intent: "Get a Formaloo form with its editable field configuration.",
      requires_workspace: true,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: false
    },
    responseExamples: {
      "200": {
        form_builder: {
          summary: "Editable form and field structure",
          value: {
            form: {
              status: "not_changed",
              errors: {}
            },
            fields: [
              {
                status: "not_changed",
                errors: {},
                object: {
                  ref_id: "name",
                  slug: "short_text_abc123",
                  type: "short_text",
                  title: "Name",
                  position: 1
                }
              }
            ]
          }
        }
      }
    }
  },
  formFieldsUpdate: {
    summary: "Replace editable form and fields",
    description:
      "Replaces form metadata and field definitions together. Retrieve the current builder payload first, preserve fields that should remain, and use `slug` for existing fields. New fields may use temporary `ref_id` values so related fields can reference each other before real slugs are generated.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "update_form_builder",
      aliases: ["replace_form_fields", "save_form_builder", "bulk_update_form_fields"],
      intent: "Replace a Formaloo form's editable metadata and field list together.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      replace_form_builder: {
        summary: "Replace form settings and fields together",
        value: {
          form: {
            title: "Customer feedback",
            button_text: "Submit"
          },
          fields: [
            {
              ref_id: "name",
              type: "short_text",
              title: "Name",
              required: true
            },
            {
              ref_id: "satisfaction",
              type: "choice",
              title: "How satisfied are you?",
              choice_items: [
                { ref_id: "happy", title: "Happy" },
                { ref_id: "needs_help", title: "Needs help" }
              ]
            }
          ]
        }
      }
    }
  },
  formFieldsPartialUpdate: {
    summary: "Partially update editable form and fields",
    description:
      "Partially updates form metadata and field definitions together. This is the preferred endpoint for agent-driven form building because the response reports per-field status and errors. Include existing field `slug` values to update or keep them; omit a field only when intentionally removing it from the form's field order.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "patch_form_builder",
      aliases: ["patch_form_fields", "edit_form_fields", "bulk_patch_form_fields"],
      intent: "Partially update a Formaloo form's editable metadata and fields together.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      add_choice_field: {
        summary: "Add a choice field while preserving an existing field",
        value: {
          form: {
            title: "Customer feedback"
          },
          fields: [
            {
              ref_id: "existing_name",
              slug: "short_text_abc123"
            },
            {
              ref_id: "satisfaction",
              type: "choice",
              title: "How satisfied are you?",
              choice_items: [
                { ref_id: "happy", title: "Happy" },
                { ref_id: "needs_help", title: "Needs help" }
              ]
            }
          ]
        }
      }
    },
    responseExamples: {
      "200": {
        updated_form_builder: {
          summary: "Per-field update status",
          value: {
            form: {
              status: "updated",
              errors: {}
            },
            fields: [
              {
                status: "not_changed",
                errors: {},
                object: {
                  ref_id: "existing_name",
                  slug: "short_text_abc123",
                  type: "short_text",
                  title: "Name",
                  position: 1
                }
              },
              {
                status: "created",
                errors: {},
                object: {
                  ref_id: "satisfaction",
                  slug: "choice_def456",
                  type: "choice",
                  title: "How satisfied are you?",
                  position: 2
                }
              }
            ]
          }
        }
      }
    }
  },
  formFieldsDestroy: {
    summary: "Delete a form from builder endpoint",
    description:
      "Deletes the form addressed by this builder endpoint. Use the regular delete_form operation when possible; this endpoint exists for builder parity and should only be used when the user explicitly wants to delete the whole form.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "delete_form_builder_form",
      aliases: ["delete_form_fields_resource"],
      intent: "Delete the whole Formaloo form through the form-builder endpoint.",
      requires_workspace: true,
      read_only: false,
      destructive: true,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    }
  },
  formsRowsCreate: {
    summary: "Create a form row or submission",
    description:
      "Creates a submission, also called a row or record, for a specific form in the active workspace. The request body maps field slugs to submitted values.",
    parameterDescriptions: {
      slug: "Form slug."
    },
    mcp: {
      tool_name: "create_form_row",
      aliases: ["create_submission", "submit_form_row", "add_form_record"],
      intent: "Create a new submitted row for a Formaloo form.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: true,
      requires_confirmation: true
    },
    requestExamples: {
      create_submission: {
        summary: "Create a form submission",
        value: {
          email: "customer@example.com",
          message: "I need more information."
        }
      }
    },
    responseExamples: {
      "201": {
        created_submission: {
          summary: "Created submission",
          value: {
            slug: "row-123",
            submit_number: 1,
            tracking_code: "TRK-123"
          }
        }
      }
    }
  },
  themesList: {
    summary: "List v5 form themes",
    description:
      "Lists current v5 form themes available in the active workspace, including system and custom themes. Use this when choosing, previewing, or copying styling for a form. Prefer this operation over legacy form-theme endpoints for current theme workflows.",
    parameterDescriptions: {
      page: "Page number for paginated theme results.",
      page_size: "Number of themes to return per page.",
      pagination: "Pagination toggle when supported by the API.",
      search: "Search text used to filter themes by title or related metadata.",
      sort_by: "Sort expression for theme list ordering.",
      system_theme: "Filter by whether the theme is a system theme."
    },
    mcp: {
      tool_name: "list_themes",
      aliases: ["list_form_themes", "show_themes", "find_themes"],
      intent: "List current Formaloo v5 form themes in the selected workspace.",
      requires_workspace: true,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data.data.themes",
      user_data: false,
      requires_confirmation: false,
      result_path_note:
        "MCP/CLI executors receive the Formaloo response envelope under `data`; direct OpenAPI schema consumers should read the documented response schema."
    },
    responseExamples: {
      "200": {
        theme_list: {
          summary: "Paginated theme list",
          value: {
            count: 1,
            next: null,
            previous: null,
            page_size: 20,
            page_count: 1,
            current_page: 1,
            themes: [
              {
                title: "Customer Feedback Theme",
                slug: "customer-feedback-theme",
                system_theme: false,
                form_type: "simple"
              }
            ]
          }
        }
      }
    }
  },
  themesCreate: {
    summary: "Create a v5 form theme",
    description:
      "Creates a reusable v5 form theme in the active workspace. Use this when saving styling that can be applied across forms. Color fields use the API's stringified RGBA format, for example `{\"r\":31,\"g\":45,\"b\":61,\"a\":1}` encoded as a JSON string.",
    mcp: {
      tool_name: "create_theme",
      aliases: ["create_form_theme", "new_theme", "save_theme"],
      intent: "Create a reusable Formaloo v5 form theme.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true,
      result_path_note:
        "MCP/CLI executors receive the Formaloo response envelope under `data`; direct OpenAPI schema consumers should read the documented response schema."
    },
    requestExamples: {
      create_theme: {
        summary: "Create a simple theme",
        value: {
          title: "Customer Feedback Theme",
          form_type: "simple",
          text_color: "{\"r\":31,\"g\":45,\"b\":61,\"a\":1}",
          button_color: "{\"r\":34,\"g\":197,\"b\":94,\"a\":1}",
          background_color: "{\"r\":248,\"g\":250,\"b\":252,\"a\":1}",
          submit_text_color: "{\"r\":255,\"g\":255,\"b\":255,\"a\":1}",
          logo_position: "center",
          show_title: true,
          theme_config: {
            form_layout: "center",
            modern_view: true,
            font_size: "large"
          }
        }
      }
    },
    responseExamples: {
      "201": {
        created_theme: {
          summary: "Created theme",
          value: {
            title: "Customer Feedback Theme",
            slug: "customer-feedback-theme",
            system_theme: false,
            form_type: "simple"
          }
        }
      }
    }
  },
  themesRetrieve: {
    summary: "Get one v5 form theme",
    description:
      "Retrieves a current v5 form theme by slug. Use this before editing a theme so unknown theme_config keys and existing color values can be preserved.",
    parameterDescriptions: {
      slug: "Theme slug."
    },
    mcp: {
      tool_name: "get_theme",
      aliases: ["show_theme", "theme_details", "get_form_theme"],
      intent: "Get a reusable Formaloo v5 form theme by slug.",
      requires_workspace: true,
      read_only: true,
      destructive: false,
      idempotent: true,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: false,
      result_path_note:
        "MCP/CLI executors receive the Formaloo response envelope under `data`; direct OpenAPI schema consumers should read the documented response schema."
    },
    responseExamples: {
      "200": {
        theme: {
          summary: "Theme details",
          value: {
            title: "Customer Feedback Theme",
            slug: "customer-feedback-theme",
            system_theme: false,
            form_type: "simple",
            theme_config: {
              form_layout: "center",
              modern_view: true
            }
          }
        }
      }
    }
  },
  themesPartialUpdate: {
    summary: "Partially update a v5 form theme",
    description:
      "Updates selected editable fields on a current v5 form theme. Prefer this operation for targeted theme edits. Retrieve the theme first and preserve unknown `theme_config` keys unless the user explicitly asks to reset them.",
    parameterDescriptions: {
      slug: "Theme slug."
    },
    mcp: {
      tool_name: "patch_theme",
      aliases: ["update_theme", "edit_theme", "partially_update_theme"],
      intent: "Partially update a reusable Formaloo v5 form theme.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true,
      result_path_note:
        "MCP/CLI executors receive the Formaloo response envelope under `data`; direct OpenAPI schema consumers should read the documented response schema."
    },
    requestExamples: {
      update_theme_colors: {
        summary: "Update selected theme colors",
        value: {
          button_color: "{\"r\":34,\"g\":197,\"b\":94,\"a\":1}",
          submit_text_color: "{\"r\":255,\"g\":255,\"b\":255,\"a\":1}",
          theme_config: {
            form_layout: "center",
            modern_view: true
          }
        }
      }
    },
    responseExamples: {
      "200": {
        updated_theme: {
          summary: "Updated theme",
          value: {
            title: "Customer Feedback Theme",
            slug: "customer-feedback-theme",
            system_theme: false,
            form_type: "simple"
          }
        }
      }
    }
  },
  themesDestroy: {
    summary: "Delete a v5 form theme",
    description:
      "Deletes a business-owned reusable v5 theme. If forms currently use the theme, ask whether they should be moved to a replacement theme and pass `replace_with_theme` when the user chooses one.",
    parameterDescriptions: {
      slug: "Theme slug to delete."
    },
    mcp: {
      tool_name: "delete_theme",
      aliases: ["remove_theme", "destroy_theme", "delete_form_theme"],
      intent: "Delete a reusable Formaloo v5 form theme.",
      requires_workspace: true,
      read_only: false,
      destructive: true,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      delete_and_replace_theme: {
        summary: "Move linked forms to a replacement theme before deleting",
        value: {
          replace_with_theme: "replacement-theme-slug"
        }
      }
    }
  },
  themesCopyCreate: {
    summary: "Copy a v5 form theme",
    description:
      "Copies an existing workspace or system theme into the active workspace. Use this before customizing a system/shared theme or before making risky changes.",
    parameterDescriptions: {
      slug: "Theme slug to copy."
    },
    mcp: {
      tool_name: "copy_theme",
      aliases: ["duplicate_theme", "fork_theme", "copy_form_theme"],
      intent: "Copy a reusable Formaloo v5 form theme.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      copy_theme: {
        summary: "Copy a theme with a custom title",
        value: {
          title: "Customer Feedback Theme Copy"
        }
      }
    }
  },
  formsCreateThemeCreate: {
    summary: "Create a v5 theme from a form",
    description:
      "Creates a reusable v5 theme from an existing form's current visual styling. Use this when the current form design should become a reusable preset.",
    parameterDescriptions: {
      slug: "Source form slug."
    },
    mcp: {
      tool_name: "create_theme_from_form",
      aliases: ["save_form_theme", "extract_theme_from_form", "make_theme_from_form"],
      intent: "Create a reusable Formaloo v5 theme from a form's current styling.",
      requires_workspace: true,
      read_only: false,
      destructive: false,
      idempotent: false,
      result_path: "data.data",
      user_data: false,
      requires_confirmation: true
    },
    requestExamples: {
      create_theme_from_form: {
        summary: "Create a reusable theme from a form",
        value: {
          title: "Customer Feedback Theme"
        }
      }
    }
  }
};

const localDescriptionFixes = {
  currenciesList: {
    summary: "List currencies",
    description: "Lists currencies available for payment, pricing, and localization workflows."
  },
  fieldsAiBoxCreate: {
    summary: "Create an AI box field",
    description: "Creates an AI box field definition for a form or board."
  },
  filesUnsplashCreate: {
    summary: "Create a file from Unsplash",
    description: "Creates a Formaloo file resource from an Unsplash image selection."
  },
  filesUnsplashSearchList: {
    summary: "Search Unsplash files",
    description: "Searches Unsplash images that can be selected for Formaloo file or media workflows."
  }
};

const mcpApiKeyHeaderDescription = [
  "Formaloo API key.",
  "Required for direct Formaloo API calls.",
  "Hosted MCP servers and CLI clients should supply this from their configured credentials instead of asking the user or agent to pass it on each request."
].join(" ");

function buildMcpAuthMetadata(mcpMetadata) {
  return {
    api_key: {
      required: true,
      header: "x-api-key",
      direct_api_usage: "Callers must send a valid Formaloo API key.",
      mcp_cli_usage:
        "Hosted MCP servers and CLI clients should inject a configured API key; do not model it as a natural-language task argument."
    },
    workspace: {
      required: Boolean(mcpMetadata?.requires_workspace),
      header: "x-workspace",
      usage:
        "Workspace selector for workspace-scoped requests. Use list_workspaces or the businesses endpoints to discover the correct workspace slug."
    }
  };
}

function setResponseExamples(operation, examplesByStatus) {
  for (const [statusCode, examples] of Object.entries(examplesByStatus ?? {})) {
    const response = operation.responses?.[statusCode];
    if (!response || typeof response !== "object") {
      continue;
    }

    for (const mediaType of Object.keys(response.content ?? {})) {
      const media = response.content[mediaType];
      if (media && typeof media === "object") {
        media.examples = {
          ...(media.examples ?? {}),
          ...examples
        };
      }
    }
  }
}

function setRequestExamples(operation, examples) {
  if (!operation.requestBody || typeof operation.requestBody !== "object") {
    return;
  }

  for (const media of Object.values(operation.requestBody.content ?? {})) {
    if (media && typeof media === "object") {
      media.examples = {
        ...(media.examples ?? {}),
        ...examples
      };
    }
  }
}

function applyParameterDescriptions(operation, descriptions = {}) {
  for (const parameter of operation.parameters ?? []) {
    if (!parameter || typeof parameter !== "object" || typeof parameter.$ref === "string") {
      continue;
    }

    const description = descriptions[parameter.name];
    if (description && String(parameter.description ?? "").trim() === "") {
      parameter.description = description;
    }
  }
}

function updateApiKeyHeaderParameter(openapiSpec, parameter) {
  if (!parameter || typeof parameter !== "object") {
    return;
  }

  let target = parameter;
  if (typeof parameter.$ref === "string") {
    target = getRefTarget(openapiSpec, parameter.$ref);
  }

  if (
    target?.in === "header" &&
    typeof target.name === "string" &&
    target.name.toLowerCase() === "x-api-key"
  ) {
    target.description = mcpApiKeyHeaderDescription;
    target.required = true;
  }
}

function updateApiKeyHeaderDescriptions(openapiSpec) {
  for (const pathItem of Object.values(openapiSpec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const parameter of pathItem.parameters ?? []) {
      updateApiKeyHeaderParameter(openapiSpec, parameter);
    }

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") {
        continue;
      }

      for (const parameter of operation.parameters ?? []) {
        updateApiKeyHeaderParameter(openapiSpec, parameter);
      }
    }
  }

  for (const parameter of Object.values(openapiSpec.components?.parameters ?? {})) {
    updateApiKeyHeaderParameter(openapiSpec, parameter);
  }
}

function enrichMcpOperations(openapiSpec) {
  for (const pathItem of Object.values(openapiSpec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") {
        continue;
      }

      const coreDefinition = coreMcpOperations[operation.operationId];
      if (coreDefinition) {
        operation.summary = coreDefinition.summary;
        operation.description = coreDefinition.description;
        operation["x-formaloo-mcp"] = {
          ...coreDefinition.mcp,
          auth: buildMcpAuthMetadata(coreDefinition.mcp)
        };
        applyParameterDescriptions(operation, coreDefinition.parameterDescriptions);
        setRequestExamples(operation, coreDefinition.requestExamples);
        setResponseExamples(operation, coreDefinition.responseExamples);
        continue;
      }

      const descriptionFix = localDescriptionFixes[operation.operationId];
      if (descriptionFix) {
        operation.summary = descriptionFix.summary;
        operation.description = descriptionFix.description;
      }
    }
  }
}

const filteredPaths = {};
const usedTagNames = new Set();
let removedOperations = 0;

for (const [pathKey, pathItem] of Object.entries(spec.paths ?? {})) {
  if (!pathItem || typeof pathItem !== "object") {
    continue;
  }

  const nextPathItem = {};
  const pathExcluded = shouldExcludePath(pathKey);

  for (const [method, operation] of Object.entries(pathItem)) {
    if (!httpMethods.has(method)) {
      nextPathItem[method] = operation;
      continue;
    }

    if (pathExcluded || shouldExcludeByService(pathKey, method, operation) || operationHasExcludedTag(operation)) {
      removedOperations += 1;
      continue;
    }

    nextPathItem[method] = operation;
    for (const tagName of operation.tags ?? []) {
      usedTagNames.add(tagName);
    }
  }

  const hasOperation = Object.keys(nextPathItem).some((key) => httpMethods.has(key));
  if (hasOperation) {
    filteredPaths[pathKey] = nextPathItem;
  }
}

spec.paths = filteredPaths;
spec.tags = (spec.tags ?? []).filter((tag) => typeof tag?.name === "string" && usedTagNames.has(tag.name));
relaxWorkspaceHeaderRequirements(spec);
updateApiKeyHeaderDescriptions(spec);
enrichMcpOperations(spec);

await fs.mkdir(intermediateDir, { recursive: true });
await fs.writeFile(mcpSpecPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`MCP filtered spec -> ${path.relative(rootDir, mcpSpecPath)}`);
console.log(`MCP settings file -> ${path.relative(rootDir, settingsPath)}`);
if (excludedServiceIndex.missingServices.length > 0) {
  console.log(`Unknown services in settings: ${excludedServiceIndex.missingServices.join(", ")}`);
}
console.log(`Removed operations: ${removedOperations}`);
console.log(`Remaining paths: ${Object.keys(spec.paths ?? {}).length}`);
