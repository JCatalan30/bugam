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

RUN apk add --no-cache nginx curl

RUN mkdir -p /etc/nginx/conf.d

RUN echo 'server { \
    listen 80; \
    server_name _; \
            root /app/bugam-frontend/dist; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://localhost:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost || exit 1

CMD sh -c "echo waiting for DB && sleep 8 && node bugam-backend/src/index.js & nginx -g 'daemon off;'"