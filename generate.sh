#!/bin/sh

cd /files/spec/

wget -O icas.yaml https://accounts.formaloo.co/docs/openapi/yaml/
wget -O formz.yaml https://api.formaloo.co/docs/openapi/yaml/
wget -O actions.yaml https://actions.formaloo.co/docs/openapi/yaml
wget -O crm.yaml https://cdpapi.formaloo.co/docs/openapi/yaml
wget -O authentication.yaml https://auth.formaloo.co/docs/openapi/yaml

files=( icas.yaml formz.yaml actions.yaml crm.yaml authentication.yaml )
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
redocly bundle authentication.yaml -o authentication-bundeled.yaml
redocly bundle storage-v1.0.yaml -o storage-bundeled.yaml
redocly bundle v1.0.yaml -o v1.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v1.0.json
rm actions* formz* icas* crm* authentication* storage-bundeled.yaml v1.0-bundeled.yaml

wget -O icas.yaml https://accounts.formaloo.co/docs/openapi/yaml/?version=2.0
wget -O formz.yaml https://api.formaloo.co/docs/openapi/yaml/?version=2.0
wget -O actions.yaml https://actions.formaloo.co/docs/openapi/yaml?version=2.0
wget -O crm.yaml https://cdpapi.formaloo.co/docs/openapi/yaml?version=2.0
wget -O storage.yaml https://storage.formaloo.co/docs/openapi/yaml/?version=2.0
wget -O authentication.yaml https://auth.formaloo.co/docs/openapi/yaml?version=2.0

files=( icas.yaml formz.yaml actions.yaml crm.yaml storage.yaml authentication.yaml )
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
redocly bundle authentication.yaml -o authentication-bundeled.yaml
redocly bundle storage.yaml -o storage-bundeled.yaml
redocly bundle v2.0.yaml -o v2.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v2.0.json
rm actions* formz* icas* crm* authentication* storage-bundeled.yaml v2.0-bundeled.yaml 

wget -O icas.yaml https://accounts.formaloo.co/docs/openapi/yaml/?version=3.0
wget -O formz.yaml https://api.formaloo.co/docs/openapi/yaml/?version=3.0

files=( icas.yml formz.yaml )
for file in "${files[@]}"; 
do
    grep -o 'docs.*.md' $file | while read -r line ; 
    do
        mkdir -p "${line%/*}" && touch "$line"
    done
done

redocly bundle icas.yaml -o icas-bundeled.yaml
redocly bundle formz.yaml -o formz-bundeled.yaml
redocly bundle v3.0.yaml -o v3.0-bundeled.yaml

npx openapi-merge-cli --config openapi-merge-v3.0.json
rm formz* v3.0-bundeled.yaml 

mkdir -p /files/html/ && rm -r /files/html/*
cp /files/v*.html /files/html/
cp /files/openapi*.yaml /files/html/
cp -r /files/assets /files/html/