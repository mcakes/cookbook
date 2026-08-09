import "@testing-library/jest-dom/vitest";

// Node >=22 defines its own experimental localStorage/sessionStorage globals
// (undefined unless --localstorage-file is set), which vitest won't override
// with jsdom's implementations. Bridge them from the real jsdom window.
const jsdom = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (jsdom) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    if (globalThis[key] === undefined) {
      Object.defineProperty(globalThis, key, {
        value: jsdom.window[key],
        configurable: true,
      });
    }
  }
}
