#!/bin/sh

cd /files/spec/

wget -O icas.yaml https://id.formaloo.com/docs/openapi/yaml/
wget -O formz.yaml https://api.formaloo.me/docs/openapi/yaml/
wget -O authentication.yaml https://auth.formaloo.me/docs/openapi/yaml

files=( icas.yaml formz.yaml authentication.yaml )
for file in "${files[@]}"; 
do
    grep -o 'docs.*.md' $file | while read -r line ; 
    do
        mkdir -p "${line%/*}" && touch "$line"
    done
done

redocly bundle icas.yaml -o icas-bundeled.yaml
redocly bundle formz.yaml -o formz-bundeled.yaml
redocly bundle authentication.yaml -o authentication-bundeled.yaml
redocly bundle storage-v1.0.yaml -o storage-bundeled.yaml
redocly bundle v1.0.yaml -o v1.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v1.0.json
rm formz* icas* authentication* storage-bundeled.yaml v1.0-bundeled.yaml

wget -O icas.yaml https://id.formaloo.com/docs/openapi/yaml/?version=2.0
wget -O formz.yaml https://api.formaloo.me/docs/openapi/yaml/?version=2.0
wget -O authentication.yaml https://auth.formaloo.me/docs/openapi/yaml?version=2.0
wget -O storage.yaml https://storage.formaloo.me/docs/openapi/yaml/?version=2.0

files=( icas.yaml formz.yaml storage.yaml authentication.yaml )
for file in "${files[@]}"; 
do
    grep -o 'docs.*.md' $file | while read -r line ; 
    do
        mkdir -p "${line%/*}" && touch "$line"
    done
done

redocly bundle icas.yaml -o icas-bundeled.yaml
redocly bundle formz.yaml -o formz-bundeled.yaml
redocly bundle authentication.yaml -o authentication-bundeled.yaml
redocly bundle storage.yaml -o storage-bundeled.yaml
redocly bundle v2.0.yaml -o v2.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v2.0.json
rm formz* icas* authentication* storage-bundeled.yaml v2.0-bundeled.yaml 

wget -O icas.yaml https://id.formaloo.com/docs/openapi/yaml/?version=3.0
wget -O formz.yaml https://api.formaloo.me/docs/openapi/yaml/?version=3.0
wget -O authentication.yaml https://auth.formaloo.me/docs/openapi/yaml?version=3.0
wget -O storage.yaml https://storage.formaloo.me/docs/openapi/yaml/?version=3.0
wget -O ai.yaml https://ai-api.formaloo.co/docs/openapi/yaml/?version=3.0

files=( icas.yml formz.yaml authentication.yaml storage.yaml ai.yaml )
for file in "${files[@]}"; 
do
    grep -o 'docs.*.md' $file | while read -r line ; 
    do
        mkdir -p "${line%/*}" && touch "$line"
    done
done

redocly bundle icas.yaml -o icas-bundeled.yaml
redocly bundle formz.yaml -o formz-bundeled.yaml
redocly bundle authentication.yaml -o authentication-bundeled.yaml
redocly bundle storage.yaml -o storage-bundeled.yaml
redocly bundle ai.yaml -o ai-bundeled.yaml
redocly bundle v3.0.yaml -o v3.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v3.0.json
rm formz* icas* authentication* ai* storage-bundeled.yaml v3.0-bundeled.yaml 

mkdir -p /files/html/ && rm -r /files/html/*
cp /files/v*.html /files/html/
cp /files/openapi*.yaml /files/html/
cp -r /files/assets /files/html/