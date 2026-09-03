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
4. `/dashboard` (protegida por `authGuard`) llama a `GET http://localhost:8080/api/me` con el `Bearer` token.

La config de Azure está en [src/app/auth/microsoft/microsoft-auth.config.ts](src/app/auth/microsoft/microsoft-auth.config.ts).
Los valores actuales están tomados del repo de referencia `CVm0/pedidos360-frontend`:
es un App Registration **single-tenant**, así que solo entran cuentas de esa
organización y la Redirect URI no se puede cambiar. Para control total, creá tu
propio App Registration y reemplazá `MICROSOFT_CLIENT_ID` / `MICROSOFT_TENANT`
(y `app.auth.microsoft.client-id` en el backend).

## Estructura (`src/app/`)

- `login/` — pantalla de login a pantalla completa (Microsoft + usuario/contraseña).
- `auth/` — `AuthService` (estado de sesión), `authGuard`, config MSAL y `callback/` (Redirect URI).
- `dashboard/` — pantalla protegida; consume `GET http://localhost:8080/api/me`.

El header de la app solo se muestra cuando hay sesión iniciada.
