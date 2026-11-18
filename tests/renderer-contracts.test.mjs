import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import {attachRendererContracts} from "../scripts/renderer-contracts.mjs";

test("renderer contract survives publication without changing API JSON storage semantics", async () => {
  const bytes=await fs.readFile(new URL("../spec/renderer-contracts/background-effect.schema.json",import.meta.url));
  const themeConfig={type:"object",additionalProperties:{}};
  const spec={openapi:"3.0.3",components:{schemas:{Theme:{properties:{theme_config:themeConfig}}}}};
  await attachRendererContracts(spec);
  const published=spec["x-formaloo-renderer-contracts"].background_effect;
  assert.deepEqual(published.schema,JSON.parse(bytes));
  assert.equal(published.source.sha256,createHash("sha256").update(bytes).digest("hex"));
  assert.match(published.source.revision,/^[a-f0-9]{40}$/);
  assert.deepEqual(spec.components.schemas.Theme.properties.theme_config,{type:"object",additionalProperties:{}});
});
