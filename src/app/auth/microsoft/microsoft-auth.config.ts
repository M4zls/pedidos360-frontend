import { LogLevel, Configuration } from '@azure/msal-browser';

// ============================================================
//  App Registration de Azure AD (Microsoft Entra ID).
//
//  Estos valores estan tomados del repo de referencia
//  https://github.com/CVm0/pedidos360-frontend
//  (src/environments/environment.ts). Son de un App Registration
//  ajeno, asi que hay dos limitaciones que NO se pueden cambiar
//  desde este codigo:
//
//   1. Es "single tenant": solo pueden iniciar sesion cuentas del
//      directorio c450c5ae-... (la organizacion de ese registro).
//      Cuentas personales u otras organizaciones -> AADSTS50020.
//   2. Las Redirect URI validas son las que registraron ellos en
//      Azure. Por eso `redirectUri` / `postLogoutRedirectUri` de
//      abajo tienen que coincidir EXACTAMENTE con
//      http://localhost:4200/auth/callback  y  .../login
//      Si se cambian, Azure responde AADSTS50011.
//
//  Para tener control total (multi-tenant, cuentas personales, otras
//  Redirect URI) hay que crear un App Registration propio y reemplazar
//  MICROSOFT_CLIENT_ID + MICROSOFT_TENANT.
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
