import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { of } from 'rxjs';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: MsalService,
          useValue: {
            handleRedirectObservable: () => of(null),
            acquireTokenSilent: () => of({ idToken: '' }),
            instance: {
              getActiveAccount: () => null,
              getAllAccounts: () => [],
              setActiveAccount: () => {},
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
