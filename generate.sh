#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting Formaloo API Documentation Generation..."

cd /files/spec/

echo "📥 Downloading API specifications from services..."

# Download API specs with better error handling
wget -O icas.yaml https://id.staging.formaloo.com/docs/openapi/yaml/?version=3.0 || echo "Warning: Failed to download icas.yaml"
wget -O formz.yaml https://api.staging.formaloo.com/docs/openapi/yaml/?version=3.0 || echo "Warning: Failed to download formz.yaml"
wget -O authentication.yaml https://auth.staging.formaloo.com/docs/openapi/yaml?version=3.0 || echo "Warning: Failed to download authentication.yaml"
wget -O storage.yaml https://storage.staging.formaloo.com/docs/openapi/yaml/?version=3.0 || echo "Warning: Failed to download storage.yaml"
wget -O ai.yaml https://ai.staging.formaloo.com/docs/openapi/yaml/?version=3.0 || echo "Warning: Failed to download ai.yaml"

echo "📝 Creating documentation files..."

# Create documentation files for each service
files=( icas.yaml formz.yaml authentication.yaml storage.yaml ai.yaml )
for file in "${files[@]}"; 
do
    if [ -f "$file" ] && [ -s "$file" ]; then
        echo "Processing $file..."
        grep -o 'docs.*.md' $file | while read -r line ; 
        do
            mkdir -p "${line%/*}" && touch "$line"
        done
    else
        echo "Warning: $file is missing or empty, skipping..."
    fi
done

echo "📦 Bundling API specifications..."

# Bundle API specs with better error handling
[ -f "icas.yaml" ] && [ -s "icas.yaml" ] && redocly bundle icas.yaml -o icas-bundeled.yaml || echo "Skipping icas.yaml bundling"
[ -f "formz.yaml" ] && [ -s "formz.yaml" ] && redocly bundle formz.yaml -o formz-bundeled.yaml || echo "Skipping formz.yaml bundling"
[ -f "authentication.yaml" ] && [ -s "authentication.yaml" ] && redocly bundle authentication.yaml -o authentication-bundeled.yaml || echo "Skipping authentication.yaml bundling"
[ -f "storage.yaml" ] && [ -s "storage.yaml" ] && redocly bundle storage.yaml -o storage-bundeled.yaml || echo "Skipping storage.yaml bundling"
[ -f "ai.yaml" ] && [ -s "ai.yaml" ] && redocly bundle ai.yaml -o ai-bundeled.yaml || echo "Skipping ai.yaml bundling"
[ -f "v3.0.yaml" ] && [ -s "v3.0.yaml" ] && redocly bundle v3.0.yaml -o v3.0-bundeled.yaml || echo "Skipping v3.0.yaml bundling"

echo "🔗 Merging API specifications..."

# Merge API specs
npx openapi-merge-cli --config openapi-merge-v3.0.json

echo "🧹 Cleaning up temporary files..."
rm -f formz* icas* authentication* ai* storage-bundeled.yaml v3.0-bundeled.yaml 

echo "📄 Generating HTML files..."

# Generate HTML files using the template
cd /files
node generate-html-template.js

echo "📁 Preparing output directory..."

# Prepare output directory
mkdir -p /files/html/ && rm -rf /files/html/*
cp /files/*.html /files/html/
cp /files/openapi*.yaml /files/html/
cp -r /files/assets /files/html/

echo "✅ Documentation generation complete!"
echo "📊 Generated files:"
echo "  - HTML files: $(ls /files/html/*.html | wc -l)"
echo "  - YAML specs: $(ls /files/html/*.yaml | wc -l)"
echo "  - Assets: $(ls /files/html/assets/ | wc -l) files"
echo ""
echo "🌐 Serve the files in the 'html' directory to view the documentation."