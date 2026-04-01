FROM node:18-alpine

WORKDIR /app

COPY bugam-backend/package*.json ./bugam-backend/
COPY bugam-frontend/package*.json ./bugam-frontend/

WORKDIR /app/bugam-backend
RUN npm install

WORKDIR /app/bugam-frontend
RUN npm install

COPY bugam-backend/ ./bugam-backend/
COPY bugam-frontend/ ./bugam-frontend/
COPY init.sql ./

WORKDIR /app/bugam-frontend
RUN npm run build

WORKDIR /app

RUN mkdir -p nginx

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
}' > nginx/default.conf

FROM nginx:alpine
COPY --from=0 /app/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=0 /app/bugam-backend /app/bugam-backend
COPY --from=0 /app/bugam-frontend/dist /app/bugam-frontend/dist
COPY --from=0 /app/init.sql /init.sql

RUN apk add --no-cache nodejs npm curl

WORKDIR /app/bugam-backend

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/categorias || exit 1

CMD sh -c "echo waiting for DB && sleep 5 && node index.js & nginx -g 'daemon off;'"