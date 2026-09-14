# Pedidos360 — Front

SPA en **Angular 22**. Login con **Microsoft (Azure AD / Entra ID)** vía MSAL
(flujo *redirect*) y un login de **usuario/contraseña** de ejemplo contra el
backend.

Frontend del proyecto Pedidos360 — repo aparte del backend
(`M4zls/pedidos360-backend`). El `MICROSOFT_CLIENT_ID` de acá y el
`app.auth.microsoft.client-id` del backend **tienen que ser el mismo valor**.

## Scripts

| Comando         | Acción                                              |
| --------------- | -------------------------------------------------- |
| `npm start`     | Servidor de desarrollo en `http://localhost:4200`. |
| `npm run build` | Build de producción en `dist/`.                    |
| `npm test`      | Tests unitarios (Vitest).                          |

## Login con Microsoft

1. `/` (pantalla de login) → botón **Continuar con Microsoft** dispara `loginRedirect()`.
2. Azure AD autentica y vuelve a `/auth/callback` (Redirect URI registrada en el App Registration).
3. `App` procesa la respuesta con `handleRedirectObservable()`, guarda la sesión en `AuthService` y navega a `/dashboard`.
4. `/dashboard` (protegida por `authGuard`) llama a `GET /api/me` con el `Bearer` token.

La config de Azure está en [src/app/auth/microsoft/microsoft-auth.config.ts](src/app/auth/microsoft/microsoft-auth.config.ts).
Los valores actuales están tomados del repo de referencia `CVm0/pedidos360-frontend`:
es un App Registration **single-tenant**, así que solo entran cuentas de esa
organización y la Redirect URI no se puede cambiar. Para control total, creá tu
propio App Registration y reemplazá `MICROSOFT_CLIENT_ID` / `MICROSOFT_TENANT`
(y `app.auth.microsoft.client-id` en el backend).

## Roles y rutas

Cuentas de la demo:

| Login | Rol |
| --- | --- |
| **Continuar con Microsoft** (cam.carrascop) | Administrador |
| `operador` / `operador123` | Operador |
| `cliente` / `cliente123` | Cliente |

`GET /api/me` devuelve `roles[]`. `UserService` los copia a `AuthService.roles`.
Si un usuario tuviera más de uno, el header muestra un selector **"Actuar como"**
(`AuthService.activeRole`, solo UI). El menú de perfil tiene **"Actualizar
permisos"** (`forceRefresh` del token) para tomar cambios de rol sin cerrar
sesión. `roleGuard(...)` protege las rutas según el rol activo.

| Ruta            | Acceso          | Qué es                                                      |
| --------------- | --------------- | --------------------------------------------------------- |
| `/home`         | autenticado     | Catálogo. El CLIENTE arma un pedido (carrito) y lo confirma.|
| `/orders`       | autenticado     | CLIENTE: sus pedidos. Staff: todos + cambio de estado.      |
| `/inventory`    | ADMIN/OPERADOR  | Gestión de productos y stock.                               |
| `/admin/users`  | ADMIN           | Cambiar el rol de cada usuario.                             |
| `/dashboard`    | autenticado     | Datos de la cuenta (incluye el rol).                        |

## Estructura (`src/app/`)

- `login/` — pantalla de login a pantalla completa (Microsoft + usuario/contraseña).
- `auth/` — `AuthService` (sesión + rol), `authGuard`, `roleGuard`, config MSAL y `callback/`.
- `home/` — `/home`: catálogo + carrito para armar pedidos (CLIENTE).
- `orders/` — `/orders`: `OrdersService` + pantalla de pedidos (cliente y staff).
- `admin/` — `/admin/users`: administración de roles.
- `dashboard/` — pantalla protegida; consume `GET /api/me`.
- `user/` — `UserService` + menú de perfil del header.
- `inventory/` — pantalla `/inventory`: tabla de productos, filtros, alta/edición y movimientos de stock (consume `/api/inventory/**`).

`authInterceptor` agrega el `Bearer` a todas las llamadas a `/api/*`.

El header de la app solo se muestra cuando hay sesión iniciada.

## API y gateway

El front llama a rutas **relativas** (`/api/...`). El gateway enruta por prefijo:

| Prefijo | Servicio |
| --- | --- |
| `/api/orders` | `orders-service` (:8081) |
| `/api/inventory` | `inventory-service` (:8083) |
| `/api/auth`, `/api/me`, `/api/admin` | `auth-service` (:8080) |

- **Desarrollo** (`npm start`): `proxy.conf.json` (`/api/orders` → :8081,
  `/api/inventory` → :8083, `/api` → :8080).
- **Producción**: `nginx.conf` / `nginx.docker.conf` — nginx sirve el SPA y hace
  de gateway. Se despliega poniendo esa config en un nginx que sirva `dist/`.
