# ---- build del SPA ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- nginx: gateway + estaticos ----
FROM nginx:1.27-alpine
ENV AUTH_URL=http://127.0.0.1:8080 \
    INVENTORY_URL=http://127.0.0.1:8080
# nginx:alpine corre envsubst sobre /etc/nginx/templates/*.template al arrancar
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY _proxy_headers.conf /etc/nginx/proxy_headers.conf
COPY --from=build /app/dist/pedidos360-front/browser /usr/share/nginx/html
EXPOSE 80
