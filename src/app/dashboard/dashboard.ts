import { Component, OnInit, inject } from '@angular/core';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  protected readonly users = inject(UserService);

  ngOnInit(): void {
    this.users.load();
  }
}
