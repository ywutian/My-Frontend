// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

beforeAll(() => {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    if (
      args[0]?.includes('React Router') ||
      args[0]?.includes('ReactDOMTestUtils.act') ||
      args[0]?.includes('inside another <Router>')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      args[0]?.includes('React Router Future Flag Warning') ||
      args[0]?.includes('DEP0040')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});
