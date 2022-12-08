FROM node:latest

RUN sudo apt-get update -y
RUN sudo apt-get install -y python3

RUN npm install -g npm@8.15.0 && \ 
    npm install -g openapi-merge-cli && \ 
    npm install -g @redocly/cli