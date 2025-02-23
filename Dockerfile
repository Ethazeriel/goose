# syntax=docker/dockerfile:1
# build the react client package
FROM node:22-alpine AS clientbuild
ENV NODE_ENV=production
WORKDIR /packages/ts-config
COPY packages/ts-config/tsconfig.json ./tsconfig.json
WORKDIR /apps/client
COPY apps/client/package* ./
COPY apps/client/vite.config.ts ./
RUN npm install
COPY apps/client/public ./public
COPY apps/client/src ./src
COPY apps/client/index.html ./
COPY packages/types ./src/@types
COPY apps/client/tsconfig.json ./tsconfig.json
COPY apps/client/eslint.config.mjs ./.eslint.config.mjs
RUN npm run build

# separately build server code so we don't have to package typescript/etc in the final container
FROM node:22-alpine AS serverbuild
RUN apk --no-cache add python3
WORKDIR /packages/ts-config
COPY packages/ts-config/tsconfig.json ./tsconfig.json
WORKDIR /apps/server
COPY apps/server/package* ./
RUN npm install
COPY apps/server/src ./src
COPY packages/types ./src/@types
COPY apps/server/tsconfig.json ./tsconfig.json
COPY apps/server/eslint.config.mjs ./.eslint.config.mjs
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
# youtube-dl-exec needs python
RUN apk --no-cache add python3
RUN apk --no-cache add dumb-init
WORKDIR /goose
COPY --chown=node:node apps/server/package.json apps/server/package-lock.json ./
RUN npm install
COPY --chown=node:node  --from=serverbuild /apps/server/build ./build
WORKDIR /client-assets
COPY --chown=node:node --from=clientbuild /apps/client/build .
WORKDIR /nginx
COPY --chown=node:node nginx.conf ./goose.conf.template
WORKDIR /goose
CMD ["dumb-init", "node", "build/index"]
EXPOSE 2468