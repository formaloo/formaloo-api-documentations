FROM node:14

RUN npm install -g npm@8.15.0 && \ 
    npm install -g openapi-merge-cli && \ 
    npm install -g @redocly/cli