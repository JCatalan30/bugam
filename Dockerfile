FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY bugam-backend/package*.json ./bugam-backend/
WORKDIR /app/bugam-backend
RUN npm install

COPY bugam-frontend/package*.json ./bugam-frontend/
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
    location / { \
        root /app/bugam-frontend/dist; \
        index index.html; \
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
COPY --from=0 /app/init.sql /init.sql

RUN apk add --no-cache nodejs npm

WORKDIR /app/bugam-backend

EXPOSE 80

CMD sh -c "sleep 3 && nginx -g 'daemon off;' & node index.js"