import { LogLevel, Configuration } from '@azure/msal-browser';

// ============================================================
//  App Registration de Microsoft Entra External ID (CIAM) - PROPIO.
//
//  El tenant c450c5ae-... (dominio por defecto proyecto3602.onmicrosoft.com)
//  es un tenant EXTERNAL ID (CIAM), no un tenant Entra ID "workforce"
//  clasico. Por eso la authority usa el dominio "ciamlogin.com" y no
//  "login.microsoftonline.com": con este ultimo Azure devuelve
//  AADSTS500208 "The domain is not a valid login domain for the account
//  type" (ver https://medium.com/the-new-control-plane/using-entra-external-id-ciam-with-the-msal-samples-86e6de6a8f20).
//  Las cuentas del proyecto son NATIVAS de ese tenant (no invitados B2B, no
//  "common"): entran directo, sin pantalla de consentimiento de otro tenant.
//
//  Requisitos en Azure para que funcione:
//   - App "Supported account types" = "Accounts in this organizational
//     directory only" (single tenant).
//   - Redirect URI de abajo registradas como "Single-page application
//     (SPA)" (si no, AADSTS50011).
//   - La cuenta con la que se loguea tiene que ser miembro nativo de este
//     tenant (o invitado y con la invitacion aceptada).
//
//  Para cambiar de App Registration: reemplazar MICROSOFT_CLIENT_ID +
//  MICROSOFT_TENANT (y `app.auth.microsoft.client-id` en auth-service /
//  inventory-service / orders-service).
// ============================================================
export const MICROSOFT_CLIENT_ID = '7b48efc0-534c-4b13-9e02-4c60a129f151';
export const MICROSOFT_TENANT = 'c450c5ae-3cee-44d6-b081-b1d7b50eaf5d';

export const msalConfig: Configuration = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: `https://${MICROSOFT_TENANT}.ciamlogin.com/${MICROSOFT_TENANT}`,
    // Relativas al origen desde el que se sirve el SPA: en desarrollo queda
    // http://localhost:4200/... y desplegado, el host real. Antes estaban
    // hardcodeadas a localhost, asi que en el servidor Microsoft redirigia a
    // la maquina del usuario y el login no completaba nunca.
    // AMBAS deben estar registradas como "Single-page application" en el
    // App Registration (ver nota arriba). Entra exige https para cualquier
    // host que no sea localhost.
    redirectUri: `${window.location.origin}/auth/callback`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
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
