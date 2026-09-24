# Despliegue del front en AWS — ECR + k3s

El front se despliega en el **mismo cluster k3s** que el backend, sobre la misma
EC2. Este repo solo aporta su Deployment, su Service y el Ingress de `/`.

> **La guía completa (EC2, k3s, ECR, secrets, gitflow, rollback) está en el repo
> del backend: `deploy/README-aws.md`.** Acá va solo lo específico del front.

```
navegador ──:80──→ Traefik Ingress ──┬─ /        → front (este repo)
                                     └─ /api/*   → auth | inventory | orders
```

## Qué hace el pipeline

| Rama | CI (build+test) | Publica en ECR | Despliega |
| --- | --- | --- | --- |
| `feature/**`, `bugfix/**`, PR | ✅ | — | — |
| `develop` | — | ✅ `develop-<sha>` | — |
| `main` | — | ✅ `main-<sha>` + `latest` | ✅ |

Imagen: `<ECR_REGISTRY>/pedidos360/front`.

## Secrets de este repo

| Nombre | Tipo | Valor | Vence |
| --- | --- | --- | --- |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` | secret | bloque del Learner Lab | **~4 h** |
| `EC2_HOST` | secret | Elastic IP de la instancia | no |
| `EC2_SSH_KEY` | secret | clave **privada** del runner — cómo generarla e instalarla está en *Clave SSH del runner* del README del backend | no |
| `ECR_REGISTRY` | **variable** | `<account>.dkr.ecr.us-east-1.amazonaws.com` | no |

Los tres `AWS_*` se refrescan en los dos repos de una sola pasada con
`deploy/scripts/sync-lab-credentials.ps1` del repo del backend.

Este repo **no** necesita `API_GATEWAY_URL` ni `MICROSOFT_CLIENT_ID`: el ruteo de
`/api/*` lo hace el Ingress, y el client ID de Azure está en el código del SPA.

## Los dos modos de nginx

La misma imagen sirve para Kubernetes y para un `docker compose` suelto. Lo
decide la variable `ROUTING_MODE`, que lee
`docker-entrypoint.d/15-pedidos360-routing.sh` al arrancar el contenedor:

| `ROUTING_MODE` | Config que usa | Cuándo |
| --- | --- | --- |
| `ingress` (default) | `nginx.k8s.conf` | En el cluster. nginx solo sirve el SPA; `/api/*` lo rutea Traefik antes de llegar al pod. |
| `gateway` | `nginx.template.conf` | EC2 suelta / `deploy/docker-compose.yml`. nginx proxea `/api/*` a `${API_GATEWAY_URL}` (envsubst). |

`nginx.docker.conf` sigue siendo el de desarrollo local con el compose que levanta
todo junto, donde nginx resuelve `auth`, `inventory` y `orders` por nombre de red.

## Verificación

```bash
IP=<tu Elastic IP>
curl -i http://$IP/                # index.html del SPA
curl -i http://$IP/healthz         # "ok" — lo que usan las probes
curl -i http://$IP/api/inventory/products   # lo responde el backend, no el front
```

Si `http://$IP/api/...` devuelve **404 con `Content-Type: text/html`**, la request
llegó al pod del front: falta aplicar el Ingress del backend
(`kubectl -n pedidos360 get ingress` debería listar los dos).

## Rollback

**Actions → CD frontend → Run workflow**, con un tag ya publicado en ECR (ej.
`main-a1b2c3d`) en el campo `image_tag`. Saltea el build y redespliega esa imagen.

```bash
aws ecr describe-images --repository-name pedidos360/front --region us-east-1 \
  --query 'sort_by(imageDetails,&imagePushedAt)[-10:].[imageTags[0],imagePushedAt]' \
  --output table
```
