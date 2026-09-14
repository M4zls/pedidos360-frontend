# ─────────────────────────────────────────────────────────────
#  Pedidos360 — Front (Angular 22 SPA)
#  Build multi-stage: compila con Node y sirve el estático con nginx,
#  que además hace de API Gateway (/api/* -> backend).
# ─────────────────────────────────────────────────────────────

# --- Stage 1: build ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: runtime ---
FROM nginx:1.27-alpine

COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/pedidos360-front/browser /usr/share/nginx/html

EXPOSE 80
