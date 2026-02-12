# ─── Stage 1: Build ───────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY cloud/worker/package.json ./
RUN npm install

COPY cloud/worker/tsconfig.json ./
COPY cloud/worker/src/ ./src/

RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────
FROM node:22-slim

# Install Playwright system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libwayland-client0 \
    fonts-noto-color-emoji \
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY cloud/worker/package.json ./
RUN npm install --omit=dev

# Install Playwright Chromium
RUN npx playwright install chromium

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
