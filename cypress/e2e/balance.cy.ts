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
    cy.wait('@loginRequest');
  });


  describe('Balance Upload (Admin only)', () => {
    beforeEach(() => {
      // Visit the Login page and log in as Admin
      cy.visit('/login');

      // Stub the login request so we get back a JWT with role=Admin
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

      // Fill in “Name” + “Password” and click Sign In
      cy.get('input[formControlName="name"]').type('admin01');
      cy.get('input[formControlName="password"]').type('Admin@123');
      cy.get('button[type="submit"]').should('not.be.disabled').click();

      // Wait for login to finish and verify we’re on the “View” page (or homepage)
      cy.wait('@adminLogin');
      cy.url().should('include', '/view');
    });

    it('shows an Upload link in the navbar and displays the upload form', () => {
      // Because isAdmin() === true, the navbar must show “Upload”
      cy.get('nav').contains('Upload').should('exist').click();

      // We should now be on /upload
      cy.url().should('include', '/upload');

      // Verify that the “Choose file” input and button exist
      cy.get('input[type="file"]').should('exist');
      cy.get('button').contains('Upload').should('exist');
    });

    it('should show error for invalid file type (.txt)', () => {
      // Because isAdmin() === true, the navbar must show “Upload”
      cy.get('nav').contains('Upload').should('exist').click();
      cy.get('nav').contains('Upload').should('exist').click();

      // We should now be on /upload
      cy.url().should('include', '/upload');

      const txtBlob = new Blob(['dummy content'], { type: 'text/plain' });
      const txtFile = new File([txtBlob], 'test.txt', { type: 'text/plain' });

      cy.get('nav').contains('Upload').click();
      cy.url().should('include', '/upload');

      // Attach it to the input
      cy.get('input[type="file"]').attachFile({
        fileContent: txtFile,
        fileName: 'test.txt',
        mimeType: 'text/plain',
      });

      cy.get('button').contains('Upload').click();
      cy.get('button').contains('Upload').click();

      cy.get('.alert-danger')
        .should('be.visible')
        .and('contain.text', 'Upload failed. Check file format');
    });

    it('should successfully upload a valid CSV file', () => {
      cy.get('nav').contains('Upload').click();
      cy.url().should('include', '/upload');

      cy.intercept('POST', '**/Account/upload', (req) => {
        expect(req.headers['content-type']).to.include('multipart/form-data');
        req.reply({
          statusCode: 200,
          body: { success: true, message: 'Updated balances successfully.' },
        });
      }).as('uploadRequest');

      const tsvContent = `Account Balances for July 2025	
R&D	12000.5
Canteen	5000
CEO's car	1500.75
Marketing	7500.25
Parking fines	200`;
      const tsvFile = new File([tsvContent], 'test.tsv', {
        type: 'text/tab-separated-values',
      });

      cy.get('input[type="file"]').attachFile({
        fileContent: tsvFile,
        fileName: 'test.tsv',
        mimeType: 'text/tab-separated-values',
      });
      cy.get('button').contains('Upload').should('not.be.disabled').click();

      cy.wait('@uploadRequest');

      cy.get('.alert-success').should(
        'contain.text',
        'Balances uploaded successfully.'
      );
    });

    it('should show server error message if upload fails (400)', () => {
      cy.get('nav').contains('Upload').click();
      cy.url().should('include', '/upload');

      cy.intercept('POST', '**/Account/upload', (req) => {
        expect(req.headers['content-type']).to.include('multipart/form-data');

        req.reply({
          statusCode: 400,
          body: {
            success: false,
            message: 'Invalid file format',
          },
        });
      }).as('uploadRequest');

      const invalidCsv = 'this,is,not,a,proper,csv';
      const invalidFile = new File([invalidCsv], 'bad.csv', {
        type: 'text/csv',
      });

      cy.get('input[type="file"]').attachFile({
        fileContent: invalidFile,
        fileName: 'bad.csv',
        mimeType: 'text/csv',
      });

      cy.get('button').contains('Upload').should('not.be.disabled').click();

      cy.wait('@uploadRequest');

      cy.get('.alert-danger')
        .should('be.visible')
        .and('contain.text', 'Upload failed. Check file format.');
    });
  });

  describe('Balance View', () => {
        beforeEach(() => {
      cy.visit('/login');

      const fakeAdminTokenPayload = {
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
      };
      const fakeToken = [
        btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })) + '.',
        btoa(JSON.stringify(fakeAdminTokenPayload)) + '.',
        '', // no signature (alg=none)
      ].join('');

      cy.intercept('POST', '**/auth/login', (req) => {
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

      cy.get('input[formControlName="name"]').type('admin01');
      cy.get('input[formControlName="password"]').type('Admin@123');
      cy.get('button[type="submit"]').should('not.be.disabled').click();

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

    
  });
});
