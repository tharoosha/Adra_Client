import 'cypress-file-upload';

describe('Balance Management', () => {
  beforeEach(() => {
    // Mock successful login
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Login before each test
    cy.visit('/login');
    cy.get('input[formControlName="name"]').type('admin');
    cy.get('input[formControlName="password"]').type('Admin@123');
    cy.get('button[type="submit"]').click();
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
  });

  // cypress/e2e/balance-upload.cy.ts

  // cypress/e2e/balance-upload.cy.ts

  describe('Balance Upload (Admin only)', () => {
    beforeEach(() => {
      // 1) Visit the Login page and log in as Admin
      cy.visit('/login');

      // 1a) Stub the login request so we get back a JWT with role=Admin
      const fakeAdminTokenPayload = {
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
      };
      const fakeToken = [
        btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })) + '.',
        btoa(JSON.stringify(fakeAdminTokenPayload)) + '.',
        '', // no signature (alg=none)
      ].join('');

      cy.intercept('POST', '**/auth/login', (req) => {
        // Expecting the body to have { username: 'admin01', password: 'Admin@123' }
        expect(req.body).to.deep.equal({
          username: 'admin01',
          password: 'Admin@123',
        });
        req.reply({
          statusCode: 200,
          body: {
            token: fakeToken,
            user: { id: 1, username: 'admin01' },
          },
        });
      }).as('adminLogin');

      // 1b) Fill in “Name” + “Password” and click Sign In
      cy.get('input[formControlName="name"]').type('admin01');
      cy.get('input[formControlName="password"]').type('Admin@123');
      cy.get('button[type="submit"]').should('not.be.disabled').click();
      cy.get('button[type="submit"]').should('not.be.disabled').click();

      // 1c) Wait for login to finish and verify we’re on the “View” page (or homepage)
      cy.wait('@adminLogin');
      cy.url().should('include', '/view');
    });

    it('shows an Upload link in the navbar and displays the upload form', () => {
      // 1) Because isAdmin() === true, the navbar must show “Upload”
      cy.get('nav').contains('Upload').should('exist').click();

      // 2) We should now be on /upload
      cy.url().should('include', '/upload');

      // 3) Verify that the “Choose file” input and button exist
      cy.get('input[type="file"]').should('exist');
      cy.get('button').contains('Upload').should('exist');
    });

    it('should show error for invalid file type (.txt)', () => {
      // 1) Because isAdmin() === true, the navbar must show “Upload”
      cy.get('nav').contains('Upload').should('exist').click();
      cy.get('nav').contains('Upload').should('exist').click();

      // 2) We should now be on /upload
      cy.url().should('include', '/upload');

      // 2) Prepare a fake .txt file in memory
      const txtBlob = new Blob(['dummy content'], { type: 'text/plain' });
      const txtFile = new File([txtBlob], 'test.txt', { type: 'text/plain' });

      // If this test runs in isolation, we need to navigate to /upload again:
      cy.get('nav').contains('Upload').click();
      cy.url().should('include', '/upload');

      // 2) Attach it to the input
      cy.get('input[type="file"]').attachFile({
        fileContent: txtFile,
        fileName: 'test.txt',
        mimeType: 'text/plain',
      });

      // 3) Click upload
      cy.get('button').contains('Upload').click();
      cy.get('button').contains('Upload').click();

      // 4) Because onUpload() will do “if not .csv/.tsv → this.errorMessage = 'Please upload a CSV file';”
      //    we expect one <div class="error-message">Please upload a CSV file</div>
      cy.get('.alert-danger')
        .should('be.visible')
        .and('contain.text', 'Upload failed. Check file format');
    });

    it('should successfully upload a valid CSV file', () => {
      // 1) Navigate to /upload from the navbar
      cy.get('nav').contains('Upload').click();
      cy.url().should('include', '/upload');

      // 2) Stub the POST /api/Account/upload to return 200
      cy.intercept('POST', '**/Account/upload', (req) => {
        // Optional: inspect req.body (the FormData) to confirm the “file” key exists
        // Cypress v12+ will parse FormData for you:
        expect(req.headers['content-type']).to.include('multipart/form-data');
        // expect(req.body.get('file')).to.exist;
        req.reply({
          statusCode: 200,
          body: { success: true, message: 'Updated balances successfully.' },
        });
      }).as('uploadRequest');

      // 3) Prepare an in-memory TSV Blob
      const tsvContent = `Account Balances for July 2025	
R&D	12000.5
Canteen	5000
CEO's car	1500.75
Marketing	7500.25
Parking fines	200`;
      const tsvFile = new File([tsvContent], 'test.tsv', {
        type: 'text/tab-separated-values',
      });

      // 4) Attach and submit
      cy.get('input[type="file"]').attachFile({
        fileContent: tsvFile,
        fileName: 'test.tsv',
        mimeType: 'text/tab-separated-values',
      });
      cy.get('button').contains('Upload').should('not.be.disabled').click();
      // cy.get('button').contains('Upload').should('not.be.disabled').click();

      // 5) Wait for the stub to be invoked
      cy.wait('@uploadRequest');

      // 6) The component will set successMessage = 'File uploaded successfully'
      cy.get('.alert-success').should(
        'contain.text',
        'Balances uploaded successfully.'
      );
    });

    it('should show server error message if upload fails (400)', () => {
      // 1) Click “Upload” in the navbar and verify we’re on /upload
      cy.get('nav').contains('Upload').click();
      cy.url().should('include', '/upload');

      // 2) Stub POST /api/Account/upload so it returns 400 + an “Invalid file format” message
      cy.intercept('POST', '**/Account/upload', (req) => {
        // Verify it really is multipart/form-data:
        expect(req.headers['content-type']).to.include('multipart/form-data');

        // Reply with 400 and the error message we want:
        req.reply({
          statusCode: 400,
          body: {
            success: false,
            message: 'Invalid file format',
          },
        });
      }).as('uploadRequest');

      // 3) Create an “invalid” CSV in memory (contents don’t matter—backend will reject it)
      const invalidCsv = 'this,is,not,a,proper,csv';
      const invalidFile = new File([invalidCsv], 'bad.csv', {
        type: 'text/csv',
      });

      // 4) Attach “bad.csv” to the <input type="file">
      cy.get('input[type="file"]').attachFile({
        fileContent: invalidFile,
        fileName: 'bad.csv',
        mimeType: 'text/csv',
      });

      // 5) Click “Upload” (should be enabled once a file is selected)
      cy.get('button').contains('Upload').should('not.be.disabled').click();

      // 6) Wait for our intercept to fire
      cy.wait('@uploadRequest');

      // 7) Assert that the component shows the server’s error in a red alert
      cy.get('.alert-danger')
        .should('be.visible')
        .and('contain.text', 'Upload failed. Check file format.');
    });
  });

  describe('Balance View', () => {
        beforeEach(() => {
      // 1) Visit the Login page and log in as Admin
      cy.visit('/login');

      // 1a) Stub the login request so we get back a JWT with role=Admin
      const fakeAdminTokenPayload = {
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
      };
      const fakeToken = [
        btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })) + '.',
        btoa(JSON.stringify(fakeAdminTokenPayload)) + '.',
        '', // no signature (alg=none)
      ].join('');

      cy.intercept('POST', '**/auth/login', (req) => {
        // Expecting the body to have { username: 'admin01', password: 'Admin@123' }
        expect(req.body).to.deep.equal({
          username: 'admin01',
          password: 'Admin@123',
        });
        req.reply({
          statusCode: 200,
          body: {
            token: fakeToken,
            user: { id: 1, username: 'admin01' },
          },
        });
      }).as('adminLogin');

      // 1b) Fill in “Name” + “Password” and click Sign In
      cy.get('input[formControlName="name"]').type('admin01');
      cy.get('input[formControlName="password"]').type('Admin@123');
      cy.get('button[type="submit"]').should('not.be.disabled').click();
      cy.get('button[type="submit"]').should('not.be.disabled').click();

      // 1c) Wait for login to finish and verify we’re on the “View” page (or homepage)
      cy.wait('@adminLogin');
      cy.url().should('include', '/view');
    });

    it('should display balance list', () => {
      cy.intercept('GET', '**/Account/latest', {
      statusCode: 200,
      body: {
        year: 2025,
        month: 8,
        rnD: 50.000000000000000000000000000,
        canteen: 5000.0000000000000000000000000,
        ceoCar: 100.00000000000000000000000000,
        marketing: 3000.0000000000000000000000000,
        parkingFines: 100.00000000000000000000000000
      }
    }).as('getLatest');

      cy.visit('/view');
      cy.wait('@getLatest');
    });

    // it('should show loading state while fetching balances', () => {
    //   cy.intercept('GET', '/api/Account/latest', {
    //     delay: 1000,
    //     statusCode: 200,
    //     body: []
    //   }).as('getBalances');

    //   cy.get('.loading-spinner').should('exist');
    //   cy.wait('@getBalances');
    //   cy.get('.loading-spinner').should('not.exist');
    // });

    // it('should show error message when balance fetch fails', () => {
    //   cy.intercept('GET', '/api/Account/latest', {
    //     statusCode: 500,
    //     body: { message: 'Server error' }
    //   }).as('getBalances');

    //   cy.wait('@getBalances');
    //   cy.get('.error-message').should('contain', 'Failed to load balances');
    // });

    
  });
});
