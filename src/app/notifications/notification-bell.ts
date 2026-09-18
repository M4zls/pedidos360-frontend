import { DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NotificationsService } from './notifications.service';

/**
 * Campana de notificaciones del header. Mismo patron que UserMenu: boton que
 * despliega un panel, cierre con click afuera o Escape.
 */
@Component({
  selector: 'app-notification-bell',
  imports: [DatePipe],
  templateUrl: './notification-bell.html',
})
export class NotificationBell {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly notifications = inject(NotificationsService);

  protected readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  markRead(id: number): void {
    this.notifications.markRead(id);
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
