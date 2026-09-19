#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Deploy del front Pedidos360 sobre el cluster k3s de la EC2.
#  Lo invoca el workflow de GitHub Actions por SSH, despues de que el
#  runner construyo y subio la imagen a ECR.
#
#  Variables de entorno que espera:
#    IMAGE_FRONT   URI completa en ECR (con tag)
#
#  Uso: <este script> <directorio con los manifiestos k8s>
# ─────────────────────────────────────────────────────────────
set -euo pipefail

MANIFEST_DIR="${1:?Falta el directorio de manifiestos}"
NS=pedidos360

: "${IMAGE_FRONT:?}"

export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"

echo "[deploy] Namespace..."
kubectl apply -f "$MANIFEST_DIR/00-namespace.yaml"

# El secret ecr-creds lo mantiene el mismo timer que usa el backend; lo
# forzamos aca para que el deploy no dependa de cuando corrio por ultima vez.
echo "[deploy] Renovando credenciales de ECR..."
sudo systemctl start pedidos360-ecr-refresh.service

echo "[deploy] Aplicando manifiestos..."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
for f in "$MANIFEST_DIR"/*.yaml; do
  sed -e "s|__IMAGE_FRONT__|$IMAGE_FRONT|g" "$f" > "$TMP/$(basename "$f")"
done
kubectl apply -f "$TMP"

echo "[deploy] Esperando el rollout..."
kubectl -n "$NS" rollout status deployment/front --timeout=3m

echo "[deploy] Estado:"
kubectl -n "$NS" get pods,svc,ingress -o wide

echo "[deploy] OK."
