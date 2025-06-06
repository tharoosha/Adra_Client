// src/app/services/balance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AccountBalanceResponse } from '../models/account-balance-response.model';
import { AccountBalanceUploadResult } from '../models/account-balance-upload-result.model';

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  // Base API URL (e.g. http://localhost:5000)
  private apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET the single “latest” account balances.
   * Endpoint: GET /api/accountbalances/latest
   */
  getLatest(): Observable<AccountBalanceResponse> {
    const url = `${this.apiBase}/Account/latest`;
    return this.http.get<AccountBalanceResponse>(url).pipe(
      catchError((err: HttpErrorResponse) => {
        let message = 'Failed to load latest balances.';
        if (err.status === 404) {
          message = 'No balances found.';
        }
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * POST a file (multipart/form-data) to upload balances.
   * Endpoint: POST /api/accountbalances/upload
   */
  uploadBalances(file: File): Observable<AccountBalanceUploadResult> {
    const url = `${this.apiBase}/Account/upload`;
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<AccountBalanceUploadResult>(url, formData).pipe(
      catchError((err: HttpErrorResponse) => {
        let message = 'Upload failed.';
        if (err.error && typeof err.error === 'string') {
          message = err.error;
        } else if (err.error && (err.error as any).message) {
          message = (err.error as any).message;
        }
        return throwError(() => new Error(message));
      })
    );
  }
}