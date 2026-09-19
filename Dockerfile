# ─────────────────────────────────────────────────────────────
#  Pedidos360 — Front (Angular 22 SPA)
#  Build multi-stage: compila con Node y sirve el estático con nginx.
#
#  La misma imagen sirve para los dos entornos, segun ROUTING_MODE:
#    ingress (default) -> Kubernetes; el Ingress rutea /api/*.
#    gateway           -> EC2/compose; nginx proxea /api/* a ${API_GATEWAY_URL}.
#  Lo resuelve docker-entrypoint.d/15-pedidos360-routing.sh al arrancar.
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

# Las dos configs viajan en la imagen; el entrypoint copia la que corresponda
# a /etc/nginx/conf.d/default.conf segun ROUTING_MODE.
COPY nginx.k8s.conf      /etc/nginx/pedidos360/ingress.conf
COPY nginx.template.conf /etc/nginx/pedidos360/gateway.conf.template

# chmod explicito: el bit de ejecucion no sobrevive a un checkout en Windows.
COPY docker-entrypoint.d/15-pedidos360-routing.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/15-pedidos360-routing.sh

COPY --from=build /app/dist/pedidos360-front/browser /usr/share/nginx/html

ENV ROUTING_MODE=ingress

EXPOSE 80
