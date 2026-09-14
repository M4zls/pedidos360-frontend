import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../auth/auth.service';
import { ROLE_LABELS } from '../user/user.service';
import { AdminUsersService, AppUser } from './users.service';

/** Panel de administración de roles (ruta /admin/users, solo ADMIN). */
@Component({
  selector: 'app-users-page',
  imports: [FormsModule, DatePipe],
  templateUrl: './users-page.html',
})
export class UsersPage implements OnInit {
  protected readonly svc = inject(AdminUsersService);

  protected readonly roles: Role[] = ['ADMIN', 'OPERADOR', 'CLIENTE'];
  protected readonly roleLabels = ROLE_LABELS;
  protected saving = signal<number | null>(null);

  ngOnInit(): void {
    this.svc.load();
  }

  changeRole(user: AppUser, role: Role): void {
    if (role === user.role) return;
    this.saving.set(user.id);
    this.svc.updateRole(user.id, role).subscribe({
      next: () => this.saving.set(null),
      error: (e) => {
        this.saving.set(null);
        alert(this.svc.message(e));
      },
    });
  }
}
