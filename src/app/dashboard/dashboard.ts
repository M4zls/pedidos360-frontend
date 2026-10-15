import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  protected readonly users = inject(UserService);
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.users.load();
  }

  /**
   * roleGuard manda aca cuando /api/me falla. Si al reintentar ya hay
   * perfil, vuelve al aterrizaje del rol (OPERADOR no tiene /home).
   */
  async retry(): Promise<void> {
    const profile = await this.users.ensureLoaded(true);
    if (profile) {
      this.router.navigateByUrl(this.auth.isOperador() ? '/kitchen' : '/home');
    }
  }
}
