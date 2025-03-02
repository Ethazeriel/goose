# syntax=docker/dockerfile:1
# build the react client package
FROM node:22-alpine AS clientbuild
RUN apk --no-cache add python3
ENV NODE_ENV=production
WORKDIR /goose
COPY . .
RUN npm install
WORKDIR /goose/packages/utils
RUN npm run build
WORKDIR /goose/apps/client
RUN npm run build

# separately build server code so we don't have to package typescript/etc in the final container
FROM node:22-alpine AS serverbuild
RUN apk --no-cache add python3
WORKDIR /goose
COPY . .
RUN npm install
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
# youtube-dl-exec needs python
RUN apk --no-cache add python3
RUN apk --no-cache add dumb-init
WORKDIR /goose
COPY . .
WORKDIR /goose/apps/server
RUN npm install
COPY --chown=node:node  --from=serverbuild /goose/apps/server/build ./apps/server/build
COPY --chown=node:node  --from=serverbuild /goose/packages/utils/dist ./packages/utils/dist
WORKDIR /client-assets
COPY --chown=node:node --from=clientbuild /goose/apps/client/build .
WORKDIR /nginx
COPY --chown=node:node nginx.conf ./goose.conf.template
WORKDIR /goose
CMD ["dumb-init", "node", "apps/server/build/index"]
EXPOSE 2468