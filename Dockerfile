FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY bugam-backend/package*.json ./bugam-backend/
COPY bugam-frontend/package*.json ./bugam-frontend/

RUN npm install --workspaces=true

COPY bugam-backend/ ./bugam-backend/
COPY bugam-frontend/ ./bugam-frontend/
COPY init.sql ./

RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD sh -c "echo '=== Starting ===' && sleep 15 && node bugam-backend/src/index.js"
