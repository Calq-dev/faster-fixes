# Self-hosted build of the web app. Build from the repo root:
#   docker build -f deploy/Dockerfile -t faster-fixes-web .
FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate \
 && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /repo
COPY . .

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* values are inlined at build time.
ARG NEXT_PUBLIC_STORAGE_BASE_URL=""
ARG NEXT_PUBLIC_FF_API_ORIGIN=""
ENV NEXT_PUBLIC_IS_CLOUD=false \
    NEXT_PUBLIC_STORAGE_BASE_URL=$NEXT_PUBLIC_STORAGE_BASE_URL \
    NEXT_PUBLIC_FF_API_ORIGIN=$NEXT_PUBLIC_FF_API_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build-time placeholders only; the real values come from the runtime environment.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    BETTER_AUTH_SECRET="build-only-placeholder" \
    DATABASE_DRIVER=pg STORAGE_PROVIDER=s3 STORAGE_REGION=eu-central-1 MAIL_PROVIDER=ses \
    sh -c "pnpm --filter @workspace/db build \
      && pnpm --filter @fasterfixes/core --filter @fasterfixes/react build \
      && pnpm --filter @workspace/widget-embed build \
      && pnpm --filter web build"

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
