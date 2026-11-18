// Run with a committed frontend checkout and its immutable commit SHA.
import fs from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import path from "node:path";

const [checkout, revision] = process.argv.slice(2);
if (!checkout || !/^[a-f0-9]{40}$/.test(revision || "")) throw new Error("Usage: node scripts/sync-renderer-contract.mjs FRONTEND_CHECKOUT COMMIT_SHA");
const ownerPath = "contracts/background-effect.schema.json";
const bytes = execFileSync("git", ["show", `${revision}:${ownerPath}`], {cwd: path.resolve(checkout)});
const directory = new URL("../spec/renderer-contracts/", import.meta.url);
const source = {repository: "formaloo/formaloo-frontend-monorepo", revision, path: ownerPath, sha256: createHash("sha256").update(bytes).digest("hex")};
await fs.writeFile(new URL("background-effect.schema.json", directory), bytes);
await fs.writeFile(new URL("background-effect.source.json", directory), JSON.stringify(source, null, 2) + "\n");
