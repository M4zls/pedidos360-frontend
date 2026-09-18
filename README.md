# Pedidos360 — Front

SPA en **Angular 22**. Login **solo con Microsoft (Entra External ID / CIAM)**
vía MSAL (flujo *redirect*).

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
3. `App` procesa la respuesta con `handleRedirectObservable()`, guarda la sesión en `AuthService` y navega a `/home`.
4. `UserService` llama a `GET /api/me` con el `Bearer` token para resolver el rol; `roleGuard` redirige a `/kitchen` si es OPERADOR.

La config de Azure está en [src/app/auth/microsoft/microsoft-auth.config.ts](src/app/auth/microsoft/microsoft-auth.config.ts):
App Registration propio, **single-tenant**, sobre un tenant **Entra External
ID (CIAM)** (`proyecto3602.onmicrosoft.com`) — por eso la `authority` usa el
dominio `ciamlogin.com` y no `login.microsoftonline.com` (con este último
Azure devuelve `AADSTS500208: The domain is not a valid login domain for the
account type`). Solo entran cuentas nativas de ese tenant y la Redirect URI
no se puede cambiar. Para control total, creá tu propio App Registration y
reemplazá `MICROSOFT_CLIENT_ID` / `MICROSOFT_TENANT` (y
`app.auth.microsoft.client-id` en el backend).

## Roles y rutas

Cuentas del tenant (`proyecto3602.onmicrosoft.com`):

| Login | Rol |
| --- | --- |
| **Continuar con Microsoft** — pedro.porro@proyecto3602.onmicrosoft.com | Administrador |
| **Continuar con Microsoft** — juanfaure@proyecto3602.onmicrosoft.com | Operador |
| **Continuar con Microsoft** — cualquier otra cuenta del tenant (ej. raul.perez@) | Cliente |

El rol es **fijo por email** (`app.roles` en el backend): no hay pantalla ni
endpoint para cambiarlo — así ningún usuario puede terminar actuando con un
rol distinto al que le corresponde. `GET /api/me` devuelve `roles[]`.
`UserService` los copia a `AuthService.roles`. El menú de perfil tiene
**"Actualizar permisos"** (`forceRefresh` del token) para tomar cambios de
rol hechos en `application.yml` sin cerrar sesión. `roleGuard(...)` protege
las rutas según el rol.

| Ruta            | Acceso          | Qué es                                                      |
| --------------- | --------------- | --------------------------------------------------------- |
| `/home`         | ADMIN/CLIENTE   | Catálogo. El CLIENTE arma un pedido (carrito) y lo confirma.|
| `/orders`       | ADMIN/CLIENTE   | CLIENTE: sus pedidos. ADMIN: todos + cambio de estado.      |
| `/inventory`    | ADMIN/OPERADOR  | Gestión de productos y stock.                               |
| `/kitchen`      | ADMIN/OPERADOR  | Cocina: pedidos PENDIENTE/EN_PREPARACION. Aterrizaje de OPERADOR. |
| `/dispatch`     | ADMIN/OPERADOR  | Despacho: pedidos LISTO/DESPACHADO.                          |
| `/sales`        | ADMIN           | Reporte de ventas agregado por estado.                       |
| `/dashboard`    | autenticado     | Datos de la cuenta.                                         |

## Estructura (`src/app/`)

- `login/` — pantalla de login a pantalla completa (solo Microsoft).
- `auth/` — `AuthService` (sesión + rol + consentimiento), `authGuard`, `roleGuard`, config MSAL y `callback/`.
- `home/` — `/home`: catálogo + carrito para armar pedidos (CLIENTE).
- `orders/` — `/orders`: `OrdersService` + pantalla de pedidos (cliente y staff).
- `kitchen/`, `dispatch/` — vistas de staff filtradas por estado del pedido, con refresco automático.
- `sales/` — `/sales`: reporte de ventas (solo ADMIN).
- `notifications/` — campana del header (alertas de stock para staff, avisos de pedido para clientes), por polling.
- `consent/` — modal de consentimiento de datos, bloqueante, en el primer login.
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
| `/api/auth`, `/api/me` | `auth-service` (:8080) |

- **Desarrollo** (`npm start`): `proxy.conf.json` (`/api/orders` → :8081,
  `/api/inventory` → :8083, `/api` → :8080).
- **Producción**: `nginx.conf` / `nginx.docker.conf` — nginx sirve el SPA y hace
  de gateway. Se despliega poniendo esa config en un nginx que sirva `dist/`.
