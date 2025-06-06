// src/app/components/upload/upload.component.ts
import { Component } from '@angular/core';
import { BalanceService } from '../../services/balance.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  selectedFile: File | null = null;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private balanceSvc: BalanceService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.successMessage = '';
      this.errorMessage = '';
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first.';
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.balanceSvc.uploadBalances(this.selectedFile).subscribe({
      next: (res) => {
        this.successMessage = 'Balances uploaded successfully.';
        this.isSubmitting = false;
        this.selectedFile = null;
        // Optionally, you might trigger a refresh of the “view” page
      },
      error: (err) => {
        console.error(err);
        this.errorMessage =
          err.error?.message || 'Upload failed. Check file format.';
        this.isSubmitting = false;
      }
    });
  }
}
