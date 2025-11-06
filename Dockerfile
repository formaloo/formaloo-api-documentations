FROM node:20-alpine

WORKDIR /app

RUN npm install -g npm@latest && \
    npm install -g openapi-merge-cli@1.3.2 && \
    npm install -g @redocly/cli@1.0.0-beta.129

RUN apk add --no-cache wget

WORKDIR /files