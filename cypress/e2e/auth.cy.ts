describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('form').should('exist');
    cy.get('input[formControlName="name"]').should('exist');
    cy.get('input[formControlName="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('input[formControlName="name"]').focus().blur();
    cy.get('.invalid-feedback').should('contain.text', 'Valid Username is required.');
    cy.get('input[formControlName="password"]').focus().blur();
    cy.get('.invalid-feedback').should('contain.text', 'Password is required.');
  });

  it('should show validation error for short password', () => {
    cy.get('input[formControlName="name"]').type('user01');
    cy.get('input[formControlName="password"]').type('12345');

    cy.get('input[formControlName="password"]').blur();

    cy.get('.error-message').should('contain', 'Password must be at least 6 characters');
  });

  it('should successfully login with valid credentials', () => {
    cy.visit('/login');
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token'
      }
    }).as('loginRequest');

    cy.get('input[formControlName="name"]').type('User01');
    cy.get('input[formControlName="password"]').type('User01@123');
    cy.get('button[type="submit"]').should('not.be.disabled').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/view');
  });

  it('should show error message for invalid credentials', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid username or password.' }
    }).as('loginRequest');

    cy.get('input[formControlName="name"]').type('testuser');
    cy.get('input[formControlName="password"]').type('wrongpass');
    cy.get('button[type="submit"]').should('not.be.disabled').click();
    cy.get('button[type="submit"]').should('not.be.disabled').click();

    cy.wait('@loginRequest');
    cy.get('.alert').should('contain.text', 'Login failed. Check credentials.');
    cy.url().should('include', '/login');
  });
}); 