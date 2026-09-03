import { ApplicationConfig, importProvidersFrom, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';
import {
  MsalBroadcastService,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
  MsalModule,
  MsalService,
} from '@azure/msal-angular';
import { InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { routes } from './app.routes';
import { msalConfig } from './auth/microsoft/microsoft-auth.config';

// Instancia unica de MSAL para toda la app (login con Microsoft).
const msalInstance: IPublicClientApplication = new PublicClientApplication(msalConfig);

// Usamos flujo de REDIRECT (mas robusto que popup: evita el bug de la
// pestaña que se queda en about:blank). No usamos MsalGuard ni
// MsalInterceptor: tenemos nuestro auth.guard.ts y nuestro authInterceptor
// (agrega el Bearer a /api/*), asi que su config va al minimo.
const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
};

const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map(),
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(MsalModule.forRoot(msalInstance, msalGuardConfig, msalInterceptorConfig)),
    MsalService,
    MsalBroadcastService,
    // MSAL v3 exige initialize() (carga el cache, prepara el manejo de
    // redirects) antes de usar loginRedirect / handleRedirectObservable.
    provideAppInitializer(() => msalInstance.initialize()),
  ],
};
