#!/bin/sh

cd /files/spec/

# Default to production (STAGING_DOCS=false)
STAGING_DOCS=${STAGING_DOCS:-false}

if [ "$STAGING_DOCS" = "true" ]; then
    echo "Using STAGING endpoints..."
    BASE_DOMAIN="staging.formaloo.com"
    wget -O icas.yaml https://id.staging.formaloo.com/docs/openapi/yaml/?version=3.0
    wget -O formz.yaml https://api.staging.formaloo.com/docs/openapi/yaml/?version=3.0
    wget -O authentication.yaml https://auth.staging.formaloo.com/docs/openapi/yaml?version=3.0
    wget -O storage.yaml https://storage.staging.formaloo.com/docs/openapi/yaml/?version=3.0
    wget -O ai.yaml https://ai.staging.formaloo.com/docs/openapi/yaml/?version=3.0
else
    echo "Using PRODUCTION endpoints..."
    BASE_DOMAIN="formaloo.me"
    wget -O icas.yaml https://id.formaloo.com/docs/openapi/yaml/?version=3.0
    wget -O formz.yaml https://api.formaloo.me/docs/openapi/yaml/?version=3.0
    wget -O authentication.yaml https://auth.formaloo.me/docs/openapi/yaml?version=3.0
    wget -O storage.yaml https://storage.formaloo.me/docs/openapi/yaml/?version=3.0
    wget -O ai.yaml https://ai-api.formaloo.co/docs/openapi/yaml/?version=3.0
fi

files=( icas.yaml formz.yaml authentication.yaml storage.yaml ai.yaml )
for file in "${files[@]}"; 
do
    if [ -f "$file" ] && [ -s "$file" ]; then
        grep -o 'docs.*.md' $file | while read -r line ; 
        do
            mkdir -p "${line%/*}" && touch "$line"
        done
    else
        echo "Warning: $file is missing or empty, skipping..."
    fi
done

[ -f "icas.yaml" ] && [ -s "icas.yaml" ] && redocly bundle icas.yaml -o icas-bundeled.yaml || echo "Skipping icas.yaml bundling"
[ -f "formz.yaml" ] && [ -s "formz.yaml" ] && redocly bundle formz.yaml -o formz-bundeled.yaml || echo "Skipping formz.yaml bundling"
[ -f "authentication.yaml" ] && [ -s "authentication.yaml" ] && redocly bundle authentication.yaml -o authentication-bundeled.yaml || echo "Skipping authentication.yaml bundling"
[ -f "storage.yaml" ] && [ -s "storage.yaml" ] && redocly bundle storage.yaml -o storage-bundeled.yaml || echo "Skipping storage.yaml bundling"
[ -f "ai.yaml" ] && [ -s "ai.yaml" ] && redocly bundle ai.yaml -o ai-bundeled.yaml || echo "Skipping ai.yaml bundling"
[ -f "v3.0.yaml" ] && [ -s "v3.0.yaml" ] && redocly bundle v3.0.yaml -o v3.0-bundeled.yaml || echo "Skipping v3.0.yaml bundling"

npx openapi-merge-cli --config openapi-merge-v3.0.json
rm -f formz* icas* authentication* ai* storage-bundeled.yaml v3.0-bundeled.yaml 

cd /files

# Update server URL in merged openapi-v3.0.yaml based on environment
if [ "$STAGING_DOCS" = "true" ]; then
    echo "Setting server URL to STAGING..."
    sed -i "s|url: 'https://api\.[^']*'|url: 'https://api.staging.formaloo.com'|g" openapi-v3.0.yaml
    sed -i 's|description: Formaloo Server|description: Formaloo Staging Server|g' openapi-v3.0.yaml
else
    echo "Setting server URL to PRODUCTION..."
    sed -i "s|url: 'https://api\.[^']*'|url: 'https://api.formaloo.me'|g" openapi-v3.0.yaml
fi

mkdir -p /files/html/ && rm -rf /files/html/*
redocly build-docs openapi-v3.0.yaml -o html/index.html
cp /files/openapi*.yaml /files/html/
cp -r /files/assets /files/html/