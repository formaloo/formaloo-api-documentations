#!/bin/sh

cd ./spec/

files="/files/icas.yaml /files/formz.yaml /files/actions.yaml /files/crm.yaml /files/storage.yaml"

for file in $files; do
    grep -o 'docs.*.md' $file | while read -r line ; do
        mkdir -p "${line%/*}" && touch "$line"
    done
done