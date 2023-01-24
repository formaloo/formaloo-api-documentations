#!/bin/sh

cd /files/spec/

urls=( "icas/docs/openapi/yaml" "formz/docs/openapi/yaml" "actions/docs/openapi/yaml" "crm/docs/openapi/yaml" )

for version in 1.0 2.0; do
  for url in "${urls[@]}"; do
    wget -O "${url##*/}-raw.yaml" "http://$url/?version=$version"
  done

  files=( "${urls[@]##*/}-raw.yaml" )
  for file in "${files[@]}"; do
    grep -o 'docs.*.md' $file | while read -r line ; do
        mkdir -p "${line%/*}" && touch "$line"
    done
  done

  bundle_and_merge() {
    redocly bundle $1 -o "$1-bundled.yaml"
    npx openapi-merge-cli --config "openapi-merge-$version.json"
  }

  for file in "${files[@]}"; do
    bundle_and_merge $file
  done

  rm -f "${files[@]/raw/bundled}"
done

# Create and prepare the output folder
mkdir -p /files/html/
rm -rf /files/html/*

# Copy the relevant files to the output folder
cp /files/v*.html /files/html/
cp /files/openapi*.yaml /files/html/
cp -r /files/assets /files/html/
