FROM node:20-bookworm-slim

# Instalar Chromium y dependencias para Puppeteer en Debian 12 (Bookworm)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium
ENV PORT=4000
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads/quotes public

EXPOSE 4000

CMD ["node", "src/index.js"]
