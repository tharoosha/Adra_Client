
import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { BalanceService } from '../../services/balance.service';
import { AuthService } from '../../services/auth.service';
import { AccountBalanceResponse } from '../../models/account-balance-response.model';

interface DisplayRow {
  accountName: string;
  formattedBalance: string;
}

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent implements OnInit {
  loading = true;
  error = '';
  asOfMonthYear = '';
  displayRows: DisplayRow[] = [];

  newUserForm!: FormGroup;
  userFormError = '';
  userFormSuccess = '';
  isAdmin = false;

  constructor(
    private balanceSvc: BalanceService,
    private authSvc: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authSvc.isAdmin();

    this.newUserForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['User', Validators.required] // default to “User”
    });

    this.balanceSvc.getLatest().subscribe({
      next: (dto: AccountBalanceResponse) => {
        if (!dto) {
          this.error = 'No data available.';
          this.loading = false;
          return;
        }

        const dateObj = new Date(dto.year, dto.month - 1, 1);
        this.asOfMonthYear = formatDate(dateObj, 'MMMM yyyy', 'en-US');

        const accountMap: { [acct: string]: number } = {
          'R&D':           dto.rnD,
          'Canteen':       dto.canteen,
          "CEOs car":      dto.ceoCar,
          'Marketing':     dto.marketing,
          'Parking fines': dto.parkingFines
        };

        const desiredOrder = [
          'R&D',
          'Canteen',
          "CEOs car",
          'Marketing',
          'Parking fines'
        ];

        this.displayRows = desiredOrder.map(acctName => {
          const val = accountMap[acctName];
          if (val === undefined || val === null) {
            return { accountName: acctName, formattedBalance: '—' };
          }
          return { accountName: acctName, formattedBalance: this.formatCurrency(val) };
        });

        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.error = err.message || 'Failed to load balances.';
        this.loading = false;
      }
    });
  }

  onAddUser(): void {
    this.userFormError = '';
    this.userFormSuccess = '';

    if (!this.newUserForm.valid) {
      this.userFormError = 'Please fill out all fields (password min‐length 6).';
      return;
    }

    const { username, password, role } = this.newUserForm.value;

    this.authSvc.addUser(username, password, role).subscribe({
      next: (res) => {
        this.userFormSuccess = res.message;
        this.newUserForm.reset({ role: 'User' });
      },
      error: (err: Error) => {
        this.userFormError = err.message;
      }
    });
  }

  private formatCurrency(val: number): string {
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
    return `Rs ${formattedNumber}/=`;
  }
}
