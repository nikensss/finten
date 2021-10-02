# syntax=docker/dockerfile:experimental
FROM node:16-alpine3.14

RUN apk add --no-cache git openssh-client

COPY . ./

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

RUN --mount=type=ssh,id=github npm ci

CMD npm start
