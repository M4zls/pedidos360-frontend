import { Component, ElementRef, HostListener, OnInit, inject, output, signal } from '@angular/core';
import { UserService } from './user.service';

/**
 * Menu de perfil del header: un boton con el avatar que despliega un panel
 * con los datos del usuario (Microsoft o login local) y el cierre de sesion.
 */
@Component({
  selector: 'app-user-menu',
  imports: [],
  templateUrl: './user-menu.html',
})
export class UserMenu implements OnInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly users = inject(UserService);

  /** El cierre de sesion vive en App (necesita MsalService). */
  readonly logout = output<void>();
  /** Pide un token nuevo a Azure para tomar cambios de rol (App Roles). */
  readonly refresh = output<void>();

  protected readonly open = signal(false);

  ngOnInit(): void {
    this.users.load();
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
