FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
ENV YARN_ENABLE_GLOBAL_CACHE=0
ENV YARN_CACHE_FOLDER=/app/.yarn/berry/cache

FROM base AS deps
COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install

FROM base AS dev
COPY .yarnrc.yml package.json yarn.lock ./
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.pnp* ./

COPY . .

EXPOSE 3001

CMD ["yarn", "dev"]

# ---- Build stage: compile TypeScript to JavaScript ----
FROM deps AS builder

# Copy source code and build scripts
COPY . .

# Optional: build-time argument to influence the build
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Compile src/index.ts -> dist/index.js using your build.mjs script
RUN yarn build

# ---- Production image ----
FROM base AS production

ENV NODE_ENV=production

# Copy only what's needed to run the app with Yarn PnP
COPY .yarnrc.yml package.json yarn.lock ./
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.pnp* ./

# Copy the compiled JS from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["yarn", "start"]
