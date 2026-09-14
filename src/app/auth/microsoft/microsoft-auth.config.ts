import { LogLevel, Configuration } from '@azure/msal-browser';

// ============================================================
//  App Registration de Azure AD (Microsoft Entra ID).
//
//  Flujo B2B: la app vive en el inquilino `c450c5ae-...` y las cuentas
//  @duocuc.cl entran como INVITADOS (guests) de ese inquilino. Por eso
//  el authority es ese inquilino (el "resource tenant"), no `common`:
//  el consentimiento y la aprobacion los da el admin de `c450c5ae`,
//  sin depender del admin de DuocUC.
//
//  Requisitos en Azure para que funcione:
//   - App "Supported account types" = "Accounts in any organizational
//     directory (Multitenant)".  Con "+ personal accounts" + tenant fijo
//     Azure responde AADSTS500208.
//   - Cada cuenta @duocuc.cl invitada y con la invitacion ACEPTADA.
//   - Enterprise app -> Permissions -> "Grant admin consent".
//   - Redirect URI de abajo registradas como "Single-page application
//     (SPA)" (si no, AADSTS50011).
//
//  Para cambiar de App Registration: reemplazar MICROSOFT_CLIENT_ID +
//  MICROSOFT_TENANT (y `app.auth.microsoft.client-id` en el backend).
// ============================================================
export const MICROSOFT_CLIENT_ID = '89fde275-566d-498a-a663-bbed17a2a29d';
export const MICROSOFT_TENANT = 'c450c5ae-3cee-44d6-b081-b1d7b50eaf5d';

export const msalConfig: Configuration = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT}`,
    // Deben estar registradas como "Single-page application" en el
    // App Registration de referencia (ver nota arriba).
    redirectUri: 'http://localhost:4200/auth/callback',
    postLogoutRedirectUri: 'http://localhost:4200/login',
    // Manejamos la navegacion post-login nosotros (App -> /dashboard),
    // asi MSAL no compite volviendo a la URL original.
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: () => {},
      logLevel: LogLevel.Warning,
    },
  },
};

// Scope minimo para pedir un ID token de OpenID Connect.
export const msalLoginRequest = {
  scopes: ['openid', 'profile', 'email'],
};
