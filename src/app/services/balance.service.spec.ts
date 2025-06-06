import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { BalanceService} from './balance.service';
import { AccountBalanceResponse } from '../models/account-balance-response.model';  
import { AccountBalanceUploadResult } from '../models/account-balance-upload-result.model';
import { environment } from '../../environments/environment';

describe('BalanceService', () => {
  let service: BalanceService;
  let httpMock: HttpTestingController;

  const BASE_URL = environment.apiUrl;
  const LATEST_URL = `${BASE_URL}/Account/latest`;
  const UPLOAD_URL = `${BASE_URL}/Account/upload`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BalanceService]
    });

    service = TestBed.inject(BalanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLatest()', () => {
    it('should return AccountBalanceResponse on success', () => {
      const mockResponse: AccountBalanceResponse = {
        year: 2025,
        month: 7,
        rnD: 12000.50,
        canteen: 5000.00,
        ceoCar: 1500.75,
        marketing: 7500.25,
        parkingFines: 200.00
      };

      service.getLatest().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(LATEST_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate an Error when the server returns 404', () => {
      service.getLatest().subscribe({
        next: () => fail('Expected getLatest() to throw'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('No balances found.');
        }
      });

      const req = httpMock.expectOne(LATEST_URL);
      expect(req.request.method).toBe('GET');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('uploadBalances()', () => {
    it('should upload file and return AccountBalanceUploadResult on success', () => {
      const mockFile = new File(['dummy'], 'test.tsv', { type: 'text/tab-separated-values' });
      const mockResponse: AccountBalanceUploadResult = {
        success: true,
        message: 'Uploaded successfully'
      };

      service.uploadBalances(mockFile).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(UPLOAD_URL);
      expect(req.request.method).toBe('POST');

      const formData: FormData = req.request.body as FormData;
      expect(formData.has('file')).toBeTrue();

      req.flush(mockResponse);
    });

    it('should propagate an Error when the server returns 400', () => {
      const mockFile = new File(['dummy'], 'test.tsv', { type: 'text/tab-separated-values' });

      service.uploadBalances(mockFile).subscribe({
        next: () => fail('Expected uploadBalances() to throw'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('Invalid file format');
        }
      });

      const req = httpMock.expectOne(UPLOAD_URL);
      expect(req.request.method).toBe('POST');

      req.flush({ message: 'Invalid file format' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
