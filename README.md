# Adra Balance Viewer Portal Client

This is the frontend client for the Adra Balance Viewer Portal, built with Angular.

## Prerequisites

Before you begin, ensure you have met the following requirements:

*   Node.js (LTS version recommended)
*   npm (Node Package Manager) or yarn
*   Angular CLI (install globally using `npm install -g @angular/cli` or `yarn global add @angular/cli`)

## Development Environment Setup

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    cd client
    ```

    *(Replace `<repository_url>` with the actual URL of your repository)*

2.  Install dependencies:

    ```bash
    npm install
    # or using yarn
    # yarn install
    ```

3.  Run the development server:

    ```bash
    ng serve
    ```

    Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Production Build

To build the project for production, run:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/client/browser/` directory, ready for deployment.

## Running Unit Tests

To execute the unit tests via Karma, run:

```bash
ng test
```

To run tests in headless mode (useful for CI environments):

```bash
ng test --watch=false --browsers=ChromeHeadless
```

## Running End-to-End (E2E) Tests

To execute the end-to-end tests in headless mode, run:

```bash
npx ng e2e --headless
```

*Note: This command assumes you have an E2E testing framework (like Cypress or Protractor) set up and configured in your project. Refer to the specific framework documentation for advanced options or setup.*

## Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
