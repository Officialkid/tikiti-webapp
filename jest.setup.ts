import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: function Image(props: any) {
      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
      return require('react').createElement('img', props);
    },
  };
});

// Mock Firebase
jest.mock('@/lib/firebase/config', () => ({
  app: null,
  auth: null,
  db: null,
  storage: null,
  functions: null,
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => require('react').createElement('div', props, children),
    button: ({ children, ...props }: any) => require('react').createElement('button', props, children),
    a: ({ children, ...props }: any) => require('react').createElement('a', props, children),
  },
  AnimatePresence: ({ children }: any) => require('react').createElement(require('react').Fragment, null, children),
  useMotionValue: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
  useSpring: (value: any) => value,
  useTransform: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
}));

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
