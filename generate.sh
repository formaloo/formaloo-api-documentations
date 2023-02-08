#!/bin/sh

cd /files/spec/

wget -O icas.yaml http://icas/docs/openapi/yaml/
wget -O formz.yaml http://formz/docs/openapi/yaml/
wget -O actions.yaml http://actions/docs/openapi/yaml
wget -O crm.yaml http://crm/docs/openapi/yaml

files=( icas.yaml formz.yaml actions.yaml crm.yaml )
for file in "${files[@]}"; 
do
    grep -o 'docs.*.md' $file | while read -r line ; 
    do
        mkdir -p "${line%/*}" && touch "$line"
    done
done

redocly bundle icas.yaml -o icas-bundeled.yaml
redocly bundle formz.yaml -o formz-bundeled.yaml
redocly bundle actions.yaml -o actions-bundeled.yaml
redocly bundle crm.yaml -o crm-bundeled.yaml
redocly bundle storage-v1.0.yaml -o storage-bundeled.yaml
redocly bundle v1.0.yaml -o v1.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v1.0.json
rm actions* formz* icas* crm* storage-bundeled.yaml v1.0-bundeled.yaml

wget -O icas.yaml http://icas/docs/openapi/yaml/?version=2.0
wget -O formz.yaml http://formz/docs/openapi/yaml/?version=2.0
wget -O actions.yaml http://actions/docs/openapi/yaml?version=2.0
wget -O crm.yaml http://crm/docs/openapi/yaml?version=2.0
wget -O storage.yaml http://storage/docs/openapi/yaml/?version=2.0

files=( icas.yaml formz.yaml actions.yaml crm.yaml storage.yaml )
for file in "${files[@]}"; 
do
    grep -o 'docs.*.md' $file | while read -r line ; 
    do
        mkdir -p "${line%/*}" && touch "$line"
    done
done

redocly bundle icas.yaml -o icas-bundeled.yaml
redocly bundle formz.yaml -o formz-bundeled.yaml
redocly bundle actions.yaml -o actions-bundeled.yaml
redocly bundle crm.yaml -o crm-bundeled.yaml
redocly bundle storage.yaml -o storage-bundeled.yaml
redocly bundle v2.0.yaml -o v2.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v2.0.json
rm actions* formz* icas* crm* storage-bundeled.yaml v2.0-bundeled.yaml 

mkdir -p /files/html/ && rm -r /files/html/*
cp /files/v*.html /files/html/
cp /files/openapi*.yaml /files/html/
cp -r /files/assets /files/html/