FROM node:20.19.0

WORKDIR /tooling

COPY package.json package-lock.json ./

RUN npm ci --omit=dev
