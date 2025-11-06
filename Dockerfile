FROM node:20

RUN npm install -g npm@latest && \ 
    npm install -g openapi-merge-cli && \ 
    npm install -g @redocly/cli@1.0.0-beta.129