# Renderer contracts

The frontend owns these generated renderer authoring rules. The API stores
`theme_config` as JSON, so these rules remain a separate root
`x-formaloo-renderer-contracts` extension. They do not narrow the API's request
or response schemas. MCP can compose strict effect inputs from the extension.

Update from a committed frontend artifact:

```sh
node scripts/sync-renderer-contract.mjs /path/to/frontend-monorepo COMMIT_SHA
npm test
npm run build:docs
```

The source pin records the repository, immutable revision, path, and checksum.
The build rejects a modified artifact unless its source pin is updated too.
