#!/bin/sh
# ─────────────────────────────────────────────────────────────
#  Elige la config de nginx segun donde corra el contenedor.
#  Corre dentro del entrypoint de la imagen oficial de nginx, con el
#  prefijo 15- para quedar ANTES de 20-envsubst-on-templates.sh.
#
#    ROUTING_MODE=ingress  (default) -> Kubernetes: el Ingress rutea /api/*,
#                                       nginx solo sirve el SPA.
#    ROUTING_MODE=gateway            -> EC2 suelta con docker compose: nginx
#                                       reenvia /api/* a ${API_GATEWAY_URL},
#                                       que sustituye el envsubst posterior.
# ─────────────────────────────────────────────────────────────
set -eu

MODE="${ROUTING_MODE:-ingress}"

case "$MODE" in
  ingress)
    cp /etc/nginx/pedidos360/ingress.conf /etc/nginx/conf.d/default.conf
    # Sin plantilla no hay nada que sustituir: evita que envsubst deje un
    # segundo server{} en :80 y nginx falle por puerto duplicado.
    rm -f /etc/nginx/templates/default.conf.template
    echo "[pedidos360] routing=ingress (nginx sirve solo el SPA)"
    ;;
  gateway)
    mkdir -p /etc/nginx/templates
    cp /etc/nginx/pedidos360/gateway.conf.template /etc/nginx/templates/default.conf.template
    rm -f /etc/nginx/conf.d/default.conf
    echo "[pedidos360] routing=gateway (proxy /api/* -> \$API_GATEWAY_URL)"
    ;;
  *)
    echo "[pedidos360] ROUTING_MODE invalido: '$MODE' (use 'ingress' o 'gateway')" >&2
    exit 1
    ;;
esac
