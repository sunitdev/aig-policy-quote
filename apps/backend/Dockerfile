FROM node:22-bookworm-slim AS deps

WORKDIR /workspace

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/api-contract/package.json packages/api-contract/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY apps/backend apps/backend
COPY packages/api-contract packages/api-contract

RUN pnpm --filter @policy-quote/api-contract --filter @policy-quote/backend build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV RISK_KB_PATH=kb/risk-kb.json

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/api-contract/package.json packages/api-contract/package.json
COPY --from=build /workspace/apps/backend/dist apps/backend/dist
COPY --from=build /workspace/packages/api-contract/dist packages/api-contract/dist
COPY kb/risk-kb.json kb/risk-kb.json

RUN pnpm install --prod --frozen-lockfile --ignore-scripts

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["pnpm", "start"]
