FROM node:24-alpine AS builder
RUN npm install -g pnpm@11.0.9
WORKDIR /app
ENV CI=true
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ .
RUN API_URL="" pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/index.html /usr/share/nginx/html/index.html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
