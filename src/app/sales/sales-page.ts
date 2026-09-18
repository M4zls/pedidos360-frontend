import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SalesService } from './sales.service';
import { STATUS_LABELS } from '../orders/orders.models';

@Component({
  selector: 'app-sales-page',
  imports: [CurrencyPipe],
  templateUrl: './sales-page.html',
})
export class SalesPage implements OnInit {
  protected readonly sales = inject(SalesService);
  protected readonly labels = STATUS_LABELS;

  ngOnInit(): void {
    this.sales.load();
  }
}
