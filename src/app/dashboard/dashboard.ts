import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  protected readonly users = inject(UserService);
  protected readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.users.load();
  }

  rolesText(): string {
    const roles = this.users.profile()?.roles ?? [];
    return roles.length ? roles.map((r) => this.users.roleLabel(r)).join(', ') : '—';
  }
}
