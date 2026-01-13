# ---- Base stage: Node.js with corepack ----
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
ENV YARN_ENABLE_GLOBAL_CACHE=0
ENV YARN_CACHE_FOLDER=/app/.yarn/berry/cache

# ---- Dependencies stage ----
FROM base AS deps
COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install

# ---- Development stage ----
FROM base AS dev
COPY .yarnrc.yml package.json yarn.lock ./
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.pnp* ./

COPY . .

EXPOSE 3000

CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "3000"]

# ---- Build stage: compile TypeScript and bundle ----
FROM deps AS builder

COPY . .

ARG API_URL=http://backend:3001
ENV API_URL=${API_URL}

RUN yarn build

# ---- Production stage: serve static files ----
FROM base AS production

ENV NODE_ENV=production

COPY .yarnrc.yml package.json yarn.lock ./
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.pnp* ./

# Copy the built static files from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "3000"]
