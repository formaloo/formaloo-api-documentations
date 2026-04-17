import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const specDir = path.join(rootDir, "spec");
const artifactsDir = path.join(rootDir, "artifacts", "intermediate");
const manifestPath = path.join(artifactsDir, "generated-doc-stubs.txt");
const specFiles = [
  "icas.yaml",
  "formz.yaml",
  "authentication.yaml",
  "storage.yaml",
  "ai.yaml"
];

const docPattern = /docs[^\s'"]+?\.md/g;
const referenced = new Set();
const created = new Set();

await fs.mkdir(artifactsDir, { recursive: true });

for (const fileName of specFiles) {
  const filePath = path.join(specDir, fileName);

  try {
    const contents = await fs.readFile(filePath, "utf8");
    const matches = contents.match(docPattern) ?? [];

    for (const docRef of matches) {
      const outputPath = path.join(specDir, docRef);
      if (referenced.has(outputPath)) {
        continue;
      }

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      referenced.add(outputPath);

      try {
        await fs.access(outputPath);
      } catch {
        await fs.writeFile(outputPath, "", "utf8");
        created.add(outputPath);
      }
    }
  } catch (error) {
    console.warn(`Skipping doc stub generation for ${fileName}: ${error.message}`);
  }
}

await fs.writeFile(
  manifestPath,
  [...created].sort().join("\n") + ([...created].length > 0 ? "\n" : ""),
  "utf8"
);

console.log(
  `Prepared ${referenced.size} documentation stub paths (${created.size} newly created).`
);
