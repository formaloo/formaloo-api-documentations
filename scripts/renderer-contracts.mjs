// Renderer rules are frontend facts, separate from the API's JSON storage rules.
import fs from "node:fs/promises";
import {createHash} from "node:crypto";

export async function attachRendererContracts(spec) {
  const directory = new URL("../spec/renderer-contracts/", import.meta.url);
  const source = JSON.parse(await fs.readFile(new URL("background-effect.source.json", directory), "utf8"));
  const bytes = await fs.readFile(new URL("background-effect.schema.json", directory));
  if (createHash("sha256").update(bytes).digest("hex") !== source.sha256) {
    throw new Error("The renderer contract checksum differs from its source pin. Sync the owner artifact and provenance together.");
  }
  spec["x-formaloo-renderer-contracts"] = {
    ...(spec["x-formaloo-renderer-contracts"] || {}),
    background_effect: {contract: "formaloo.background-effect", version: 1, source, schema: JSON.parse(bytes)},
  };
  return spec;
}
