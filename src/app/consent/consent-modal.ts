import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { UserService } from '../user/user.service';

/**
 * Modal bloqueante de consentimiento de datos (proteccion de datos): se
 * muestra una sola vez, en el primer login, mientras `AuthService.consentGiven`
 * sea `false` (ver App.ngOnInit). No tiene boton de cerrar: la unica salida es
 * aceptar. Atrapa el foco adentro (Tab no se escapa) para que sea navegable
 * con teclado sin poder "saltarse" el modal.
 */
@Component({
  selector: 'app-consent-modal',
  imports: [],
  templateUrl: './consent-modal.html',
})
export class ConsentModal implements AfterViewInit {
  protected readonly users = inject(UserService);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  @ViewChild('acceptButton') private acceptButton?: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    this.acceptButton?.nativeElement.focus();
  }

  accept(): void {
    this.saving.set(true);
    this.error.set(null);
    this.users.giveConsent().catch(() => {
      this.error.set('No se pudo guardar. Intentá de nuevo.');
      this.saving.set(false);
    });
  }

  /** Focus trap simple: Tab/Shift+Tab nunca sale del modal. */
  @HostListener('keydown.tab', ['$event'])
  onTab(event: Event): void {
    this.trap(event, false);
  }

  @HostListener('keydown.shift.tab', ['$event'])
  onShiftTab(event: Event): void {
    this.trap(event, true);
  }

  private trap(event: Event, backwards: boolean): void {
    const host = event.currentTarget as HTMLElement;
    const focusable = host.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!backwards && active === last) {
      event.preventDefault();
      first.focus();
    } else if (backwards && active === first) {
      event.preventDefault();
      last.focus();
    }
  }
}
