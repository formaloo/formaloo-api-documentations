#!/bin/sh
set -e

cd /files/spec/

echo "Downloading specs from staging.formaloo.com..."

download_spec() {
    _name=$1
    _url=$2
    if wget -O "$_name" "$_url"; then
        echo "Downloaded $_name successfully"
    else
        echo "Failed to download $_name"
        return 1
    fi
}

download_spec "icas.yaml" "https://id.staging.formaloo.com/docs/openapi/yaml/?version=3.0"
download_spec "formz.yaml" "https://api.staging.formaloo.com/docs/openapi/yaml/?version=3.0"
download_spec "authentication.yaml" "https://auth.staging.formaloo.com/docs/openapi/yaml?version=3.0"
download_spec "storage.yaml" "https://storage.staging.formaloo.com/docs/openapi/yaml/?version=3.0"
download_spec "ai.yaml" "https://ai.staging.formaloo.com/docs/openapi/yaml/?version=3.0"

for file in icas.yaml formz.yaml authentication.yaml storage.yaml ai.yaml; do
    if [ -f "$file" ] && [ -s "$file" ]; then
        grep -o 'docs.*.md' "$file" | while read -r line; do
            mkdir -p "${line%/*}" && touch "$line"
        done
    else
        echo "Error: $file is missing or empty"
        exit 1
    fi
done

bundle_spec() {
    _spec=$1
    if [ -f "$_spec" ] && [ -s "$_spec" ]; then
        redocly bundle "$_spec" -o "${_spec%.yaml}-bundeled.yaml"
        echo "Bundled $_spec"
    else
        echo "Error: Cannot bundle $_spec"
        exit 1
    fi
}

bundle_spec "v3.0.yaml"
bundle_spec "icas.yaml"
bundle_spec "formz.yaml"
bundle_spec "authentication.yaml"
bundle_spec "storage.yaml"
bundle_spec "ai.yaml"

npx openapi-merge-cli --config openapi-merge-v3.0.json

if [ ! -f "../openapi-v3.0.yaml" ] || [ ! -s "../openapi-v3.0.yaml" ]; then
    echo "Error: Merged spec not generated"
    exit 1
fi

rm -f formz* icas* authentication* ai* storage-bundeled.yaml v3.0-bundeled.yaml 

mkdir -p /files/html/
rm -rf /files/html/*
cp /files/*.html /files/html/
cp /files/openapi*.yaml /files/html/
cp -r /files/assets /files/html/

echo "Build completed successfully"