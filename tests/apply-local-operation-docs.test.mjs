import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { applyLocalOperationDocs, operationDocPath } from "../scripts/apply-local-operation-docs.mjs";

const repoDocs = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "spec", "docs", "v3.0");

test("maps path parameters to snake_case documentation files", () => {
  assert.equal(
    operationDocPath(repoDocs, "/v3.0/forms/{formSlug}/hubspot-integrations/{slug}/", "patch"),
    path.join(repoDocs, "forms", "form_slug", "hubspot-integrations", "slug", "patch.md")
  );
  assert.equal(
    operationDocPath(repoDocs, "/v3.0/whatsapp-templates/{contentSid}/approval/", "POST"),
    path.join(repoDocs, "whatsapp-templates", "content_sid", "approval", "post.md")
  );
  assert.equal(operationDocPath(repoDocs, "/v1/integration-apps/", "get"), null);
});

test("fills a missing description from the matching markdown file", async () => {
  const docsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "local-op-docs-"));
  await fs.mkdir(path.join(docsRoot, "integration-apps"), { recursive: true });
  await fs.writeFile(
    path.join(docsRoot, "integration-apps", "get.md"),
    "\nLists active integration app definitions.\n",
    "utf8"
  );
  await fs.writeFile(path.join(docsRoot, "integration-apps", "post.md"), "   \n", "utf8");

  const spec = {
    paths: {
      "/v3.0/integration-apps/": {
        get: { operationId: "integrationAppsList", summary: "List", description: "  " },
        post: { operationId: "integrationAppsCreate", summary: "Create" }
      },
      "/v3.0/integration-apps/{slug}/": {
        get: {
          operationId: "integrationAppsRetrieve",
          summary: "Retrieve",
          description: "Upstream description."
        }
      },
      "/v3.0/integration-apps/install-app/": {
        post: {
          operationId: "integrationAppsInstallAppCreate",
          description: { $ref: "./docs/v3.0/integration-apps/install-app/post.md" }
        }
      },
      "/other/": {
        get: { operationId: "otherList" }
      }
    }
  };

  const applied = await applyLocalOperationDocs(spec, docsRoot);
  assert.equal(applied, 1);
  assert.equal(
    spec.paths["/v3.0/integration-apps/"].get.description,
    "Lists active integration app definitions."
  );
  assert.equal(spec.paths["/v3.0/integration-apps/"].post.description, undefined);
  assert.equal(
    spec.paths["/v3.0/integration-apps/{slug}/"].get.description,
    "Upstream description."
  );
  assert.deepEqual(
    spec.paths["/v3.0/integration-apps/install-app/"].post.description,
    { $ref: "./docs/v3.0/integration-apps/install-app/post.md" }
  );
  assert.equal(spec.paths["/other/"].get.description, undefined);
});

test("uses the checked-in integration catalog description", async () => {
  const spec = {
    paths: {
      "/v3.0/integration-apps/": {
        get: { operationId: "integrationAppsList", summary: "List published integration catalog entries" }
      },
      "/v3.0/whatsapp-templates/{contentSid}/approval/": {
        post: { operationId: "whatsappTemplatesApprovalCreate", summary: "Submit a template for approval" }
      }
    }
  };

  const applied = await applyLocalOperationDocs(spec, repoDocs);
  assert.equal(applied, 2);
  assert.match(spec.paths["/v3.0/integration-apps/"].get.description, /integration app definitions/);
  assert.match(
    spec.paths["/v3.0/whatsapp-templates/{contentSid}/approval/"].post.description,
    /provider approval/
  );
});
