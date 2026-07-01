#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
SPEC_DIR="$ROOT_DIR/spec"
HTML_DIR="$ROOT_DIR/html"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
INTERMEDIATE_DIR="$ARTIFACTS_DIR/intermediate"
VALIDATION_DIR="$ARTIFACTS_DIR/validation"
RELEASE_DIR="$ARTIFACTS_DIR/release"

STAGING_DOCS=${STAGING_DOCS:-false}
MCP_DOCS=${MCP_DOCS:-false}
PUBLIC_API_URL=${PUBLIC_API_URL:-}
MCP_OPENAPI_SETTINGS_FILE=${MCP_OPENAPI_SETTINGS_FILE:-}

if [[ -n "${TOOLS_DIR:-}" ]]; then
  TOOL_BIN="$TOOLS_DIR"
elif [[ -d "/tooling/node_modules/.bin" ]]; then
  TOOL_BIN="/tooling/node_modules/.bin"
else
  TOOL_BIN="$ROOT_DIR/node_modules/.bin"
fi

REDOCLY_BIN="$TOOL_BIN/redocly"
OPENAPI_MERGE_BIN="$TOOL_BIN/openapi-merge-cli"

if [[ ! -x "$REDOCLY_BIN" || ! -x "$OPENAPI_MERGE_BIN" ]]; then
  echo "Missing required tooling. Run 'npm ci' or build through Docker first." >&2
  exit 1
fi

mkdir -p "$HTML_DIR" "$INTERMEDIATE_DIR" "$VALIDATION_DIR" "$RELEASE_DIR"
rm -rf "$HTML_DIR"/* "$INTERMEDIATE_DIR"/* "$VALIDATION_DIR"/* "$RELEASE_DIR"/*

echo "Fetching upstream specifications..."
node "$ROOT_DIR/scripts/fetch-specs.mjs"
node "$ROOT_DIR/scripts/prepare-doc-stubs.mjs"

bundle_spec() {
  local input_file="$1"
  local output_file="$2"

  if [[ -s "$input_file" ]]; then
    "$REDOCLY_BIN" bundle "$input_file" --output "$output_file"
  else
    echo "Skipping missing spec: $input_file"
  fi
}

echo "Bundling service specifications..."
bundle_spec "$SPEC_DIR/icas.yaml" "$SPEC_DIR/icas-bundled.json"
bundle_spec "$SPEC_DIR/formz.yaml" "$SPEC_DIR/formz-bundled.json"
bundle_spec "$SPEC_DIR/authentication.yaml" "$SPEC_DIR/authentication-bundled.json"
bundle_spec "$SPEC_DIR/storage.yaml" "$SPEC_DIR/storage-bundled.json"
bundle_spec "$SPEC_DIR/ai.yaml" "$SPEC_DIR/ai-bundled.json"
bundle_spec "$SPEC_DIR/v3.0.yaml" "$SPEC_DIR/v3.0-bundled.json"

echo "Merging public specification shell..."
"$OPENAPI_MERGE_BIN" --config "$SPEC_DIR/openapi-merge-v3.0.json"

echo "Normalizing public contract..."
if [[ -z "$PUBLIC_API_URL" ]]; then
  if [[ "$STAGING_DOCS" == "true" ]]; then
    PUBLIC_API_URL="https://api.staging.formaloo.com"
  else
    PUBLIC_API_URL="https://api.formaloo.me"
  fi
fi
PUBLIC_API_URL="$PUBLIC_API_URL" STAGING_DOCS="$STAGING_DOCS" node "$ROOT_DIR/scripts/normalize-openapi.mjs"

echo "Rendering final YAML artifact..."
"$REDOCLY_BIN" bundle "$INTERMEDIATE_DIR/openapi-public.normalized.json" --output "$ROOT_DIR/openapi-v3.0.yaml"

if [[ "$MCP_DOCS" == "true" ]]; then
  echo "Rendering MCP YAML artifact..."
  MCP_OPENAPI_SETTINGS_FILE="$MCP_OPENAPI_SETTINGS_FILE" \
  node "$ROOT_DIR/scripts/build-mcp-openapi.mjs"
  node "$ROOT_DIR/scripts/prune-unused-mcp-schemas.mjs" "$INTERMEDIATE_DIR/openapi-mcp.filtered.json"
  "$REDOCLY_BIN" bundle "$INTERMEDIATE_DIR/openapi-mcp.filtered.json" --output "$ROOT_DIR/openapi-v3.0.mcp.yaml"
fi

echo "Validating generated public contract..."
node "$ROOT_DIR/scripts/validate-openapi.mjs"
if ! "$REDOCLY_BIN" lint "$ROOT_DIR/openapi-v3.0.yaml" > "$VALIDATION_DIR/redocly-lint.txt" 2>&1; then
  echo "Redocly lint reported issues. Report saved to artifacts/validation/redocly-lint.txt"
fi

echo "Building HTML documentation..."
"$REDOCLY_BIN" build-docs "$ROOT_DIR/openapi-v3.0.yaml" -o "$HTML_DIR/index.html"
cp "$ROOT_DIR/openapi-v3.0.yaml" "$HTML_DIR/openapi-v3.0.yaml"
if [[ "$MCP_DOCS" == "true" ]]; then
  cp "$ROOT_DIR/openapi-v3.0.mcp.yaml" "$HTML_DIR/openapi-v3.0.mcp.yaml"
fi
cp -r "$ROOT_DIR/assets" "$HTML_DIR/"

echo "Packaging release artifacts..."
cp "$ROOT_DIR/openapi-v3.0.yaml" "$RELEASE_DIR/openapi-v3.0.yaml"
if [[ "$MCP_DOCS" == "true" ]]; then
  cp "$ROOT_DIR/openapi-v3.0.mcp.yaml" "$RELEASE_DIR/openapi-v3.0.mcp.yaml"
fi
tar -czf "$RELEASE_DIR/html-docs.tar.gz" -C "$ROOT_DIR" html

echo "Build complete."
