/// <reference types="jest" />

declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}
