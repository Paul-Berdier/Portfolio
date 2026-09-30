FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG PUBLIC_BRAND_NAME=MorphAI
ARG PUBLIC_SITE_MODE=preproduction
ARG PUBLIC_LEGAL_VALIDATED=false
ARG PUBLIC_SITE_URL
ARG PUBLIC_CONTACT_EMAIL
ARG PUBLIC_BOOKING_URL
ARG PUBLIC_GITHUB_URL
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/src/server ./src/server
COPY --from=build --chown=node:node /app/migrations ./migrations
USER node
EXPOSE 4321
CMD ["node", "scripts/start.mjs"]
