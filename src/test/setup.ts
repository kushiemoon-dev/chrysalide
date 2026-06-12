import '@testing-library/jest-dom'

// Node.js 22+ defines its own experimental localStorage/sessionStorage globals
// that shadow jsdom's working implementations. vitest's populateGlobal() skips
// these keys because they are already present in globalThis but not in its
// hardcoded KEYS allowlist. We fix this by reaching into the actual jsdom
// Window object (exposed as globalThis.jsdom.window) and redefining the
// globals with a get/set pair that delegates to jsdom's Storage.
//
// Must use get/set (not value+writable) because the existing Node descriptor
// is a getter/setter pair — redefining with 'value' would throw TypeError.
const jsdomWindow = (globalThis as unknown as { jsdom: { window: Window } }).jsdom.window
Object.defineProperty(globalThis, 'localStorage', {
  get: () => jsdomWindow.localStorage,
  set: (v) => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: v,
      writable: true,
      configurable: true,
    })
  },
  configurable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  get: () => jsdomWindow.sessionStorage,
  set: (v) => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: v,
      writable: true,
      configurable: true,
    })
  },
  configurable: true,
})
