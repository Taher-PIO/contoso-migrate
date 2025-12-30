---
title: 'Testing & Quality Plan - React + TypeScript + Bootstrap Migration'
last_updated: '2025-12-30'
owner: 'Migration Team'
status: 'Planning'
phase: 'Pre-Migration'
related_docs: ['Test-Strategy-&-Coverage.md', 'CI-CD-&-DevEx.md']
---

# Testing & Quality Plan - React + TypeScript + Bootstrap Migration

## Executive Summary

This document defines the comprehensive testing and quality assurance strategy for migrating ContosoUniversity from ASP.NET Core Razor Pages to a modern React + TypeScript + Bootstrap stack. The plan establishes a robust test pyramid, quality gates, and automation processes to ensure feature parity, prevent regressions, and maintain code quality throughout the migration.

**Key Objectives:**
- ✅ Establish comprehensive test coverage with Jest/React Testing Library/Playwright
- ✅ Implement visual regression testing (Chromatic with Storybook or Playwright)
- ✅ Define and enforce code quality standards (ESLint, Prettier, TypeScript)
- ✅ Automate quality checks with commit hooks (Husky, lint-staged)
- ✅ Set up CI/CD quality gates with coverage thresholds
- ✅ Create flake triage and remediation processes

**Target Stack:**
- **Unit/Component Testing:** Jest + React Testing Library
- **E2E Testing:** Playwright
- **Visual Regression:** Chromatic + Storybook (preferred) or Playwright screenshots
- **Code Quality:** ESLint, Prettier, TypeScript strict mode
- **Automation:** Husky, lint-staged, GitHub Actions

---

## Table of Contents

- [Test Pyramid Strategy](#test-pyramid-strategy)
- [Testing Framework Setup](#testing-framework-setup)
- [Test Coverage Requirements](#test-coverage-requirements)
- [Visual Regression Testing](#visual-regression-testing)
- [Code Quality Standards](#code-quality-standards)
- [Commit Hooks & Automation](#commit-hooks--automation)
- [CI/CD Quality Gates](#cicd-quality-gates)
- [Testing Matrix](#testing-matrix)
- [Flake Triage Plan](#flake-triage-plan)
- [Setup Commands](#setup-commands)
- [Migration Testing Strategy](#migration-testing-strategy)

---

## Test Pyramid Strategy

### Testing Philosophy

We follow the **Test Pyramid** principle: many fast unit/component tests, fewer integration tests, and minimal but critical E2E tests.

```
           /\
          /  \         E2E Tests (Playwright)
         /    \        ~10-15 critical user flows
        /------\       Slow, expensive, but high confidence
       /        \      
      /  E2E     \     
     /------------\    Integration Tests (Jest + MSW)
    /              \   ~30-40 tests for API integration
   / Integration   \  Medium speed, API contract validation
  /------------------\
 /                    \ Unit/Component Tests (Jest + RTL)
/   Unit/Component    \ ~200-300 tests
\____________________/ Fast, isolated, comprehensive coverage
```

### Test Distribution Target

| Test Type | Count Target | Coverage | Speed | Confidence |
|-----------|--------------|----------|-------|------------|
| **Unit/Component** | 70% of tests | 80-90% line coverage | < 1 sec each | Medium |
| **Integration** | 20% of tests | API contracts, state management | 1-5 sec each | High |
| **E2E** | 10% of tests | Critical user flows | 10-30 sec each | Highest |

### Testing Layers

#### 1. Unit Tests (Jest)
- Pure functions and utility modules
- Business logic and data transformations
- Custom hooks (isolated)
- Validation logic

#### 2. Component Tests (React Testing Library)
- Component rendering with various props
- User interactions (clicks, typing, form submission)
- Conditional rendering logic
- Accessibility verification
- Component state management

#### 3. Integration Tests (Jest + MSW)
- API integration with mocked backend (Mock Service Worker)
- React Query hooks with API responses
- Form submission flows end-to-end
- State management across components
- Navigation and routing logic

#### 4. E2E Tests (Playwright)
- Complete user workflows across pages
- Authentication flows
- CRUD operations (Create, Read, Update, Delete)
- Error handling and edge cases
- Cross-browser compatibility
- Real backend integration (staging environment)

---

## Testing Framework Setup

### 1. Jest Configuration

**Installation:**
```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testTimeout: 10000,
};
```

**setupTests.ts:**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
} as any;
```

### 2. React Testing Library

**Installation:**
```bash
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**Test Utilities (src/test-utils.tsx):**
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 3. Mock Service Worker (MSW) for API Mocking

**Installation:**
```bash
npm install --save-dev msw
```

**Mock Server Setup (src/mocks/server.ts):**
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup requests interception using the given handlers
export const server = setupServer(...handlers);
```

**Mock Handlers (src/mocks/handlers.ts):**
```typescript
import { rest } from 'msw';

export const handlers = [
  // Students API
  rest.get('/api/students', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        items: [
          { id: 1, firstName: 'John', lastName: 'Doe', enrollmentDate: '2020-09-01' },
          { id: 2, firstName: 'Jane', lastName: 'Smith', enrollmentDate: '2021-09-01' },
        ],
        pageIndex: 1,
        totalPages: 1,
        totalCount: 2,
      })
    );
  }),
  
  rest.get('/api/students/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(id),
        firstName: 'John',
        lastName: 'Doe',
        enrollmentDate: '2020-09-01',
        enrollments: [],
      })
    );
  }),
  
  // Add handlers for other entities (courses, instructors, etc.)
];
```

**MSW Setup in Tests (setupTests.ts):**
```typescript
import { server } from './mocks/server';

// Enable API mocking before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

### 4. Playwright Configuration

**Installation:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Test Coverage Requirements

### Coverage Thresholds

**Global Thresholds (Enforced in CI):**
```javascript
coverageThresholds: {
  global: {
    branches: 70,    // 70% branch coverage
    functions: 75,   // 75% function coverage
    lines: 80,       // 80% line coverage
    statements: 80,  // 80% statement coverage
  },
}
```

**Critical Path Thresholds (Higher Standards):**
```javascript
coverageThresholds: {
  './src/features/students/**/*.{ts,tsx}': {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  './src/features/instructors/**/*.{ts,tsx}': {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  './src/features/courses/**/*.{ts,tsx}': {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  './src/api/**/*.{ts,tsx}': {
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

### Coverage Exclusions

**Files NOT included in coverage:**
- Type definition files (`*.d.ts`)
- Entry point (`main.tsx`, `App.tsx`)
- Storybook stories (`*.stories.tsx`)
- Test files (`*.test.tsx`, `*.spec.tsx`)
- Mock data and fixtures
- Configuration files

### Coverage Reporting

**package.json scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:open": "jest --coverage && open coverage/lcov-report/index.html"
  }
}
```

**CI Coverage Upload:**
```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
    fail_ci_if_error: true
```

---

## Visual Regression Testing

### Strategy: Chromatic + Storybook (Recommended)

**Why Chromatic + Storybook?**
- ✅ Component-level visual testing
- ✅ Automatic baseline management
- ✅ Cross-browser snapshots (Chrome, Firefox, Safari, Edge)
- ✅ Responsive breakpoint testing
- ✅ Review UI for approval workflow
- ✅ Integrates with GitHub PR checks
- ✅ Free for open-source projects

### 1. Storybook Setup

**Installation:**
```bash
npx storybook@latest init
npm install --save-dev @storybook/addon-a11y @storybook/addon-coverage
```

**.storybook/main.ts:**
```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

**.storybook/preview.ts:**
```typescript
import type { Preview } from '@storybook/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
  },
};

export default preview;
```

**Example Story (src/components/StudentCard/StudentCard.stories.tsx):**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { StudentCard } from './StudentCard';

const meta: Meta<typeof StudentCard> = {
  title: 'Features/Students/StudentCard',
  component: StudentCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StudentCard>;

export const Default: Story = {
  args: {
    student: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      enrollmentDate: '2020-09-01',
      enrollments: [],
    },
  },
};

export const WithEnrollments: Story = {
  args: {
    student: {
      id: 1,
      firstName: 'Jane',
      lastName: 'Smith',
      enrollmentDate: '2021-09-01',
      enrollments: [
        { courseId: 101, courseTitle: 'Chemistry', grade: 'A' },
        { courseId: 102, courseTitle: 'Physics', grade: 'B' },
      ],
    },
  },
};

export const Loading: Story = {
  args: {
    student: null,
    isLoading: true,
  },
};
```

### 2. Chromatic Integration

**Installation:**
```bash
npm install --save-dev chromatic
```

**package.json script:**
```json
{
  "scripts": {
    "chromatic": "chromatic --project-token=YOUR_PROJECT_TOKEN"
  }
}
```

**GitHub Actions Workflow (.github/workflows/chromatic.yml):**
```yaml
name: Chromatic

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for Chromatic

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          token: ${{ secrets.GITHUB_TOKEN }}
          buildScriptName: 'build-storybook'
          autoAcceptChanges: 'main'
          exitZeroOnChanges: false  # Fail CI if there are visual changes
```

**Chromatic Configuration (chromatic.config.json):**
```json
{
  "projectId": "your-project-id",
  "buildScriptName": "build-storybook",
  "storybookBuildDir": "storybook-static",
  "externals": ["public/**"],
  "skip": "dependabot/**",
  "ignoreLastBuildOnBranch": "renovate/**",
  "untraced": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"]
}
```

### Alternative: Playwright Visual Regression

**If Chromatic is not feasible (budget constraints), use Playwright:**

**playwright.config.ts (add visual comparison):**
```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,  // Allow minor rendering differences
    threshold: 0.2,      // 20% difference threshold
  },
},
```

**Example Visual Test (e2e/students/student-list.visual.spec.ts):**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Student List Visual Regression', () => {
  test('should match baseline screenshot', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // Take and compare screenshot
    await expect(page).toHaveScreenshot('student-list.png', {
      fullPage: true,
    });
  });

  test('should match mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('student-list-mobile.png');
  });
});
```

**Update Screenshots:**
```bash
# Update all baseline screenshots
npx playwright test --update-snapshots

# Update specific test
npx playwright test student-list.visual.spec.ts --update-snapshots
```

---

## Code Quality Standards

### 1. TypeScript Configuration

**tsconfig.json (Strict Mode):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting - STRICT MODE */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@features/*": ["./src/features/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@api/*": ["./src/api/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2. ESLint Configuration

**Installation:**
```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks
npm install --save-dev eslint-plugin-jsx-a11y eslint-plugin-import
npm install --save-dev eslint-config-prettier
```

**.eslintrc.cjs:**
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // Must be last to override other configs
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react',
    'react-hooks',
    'react-refresh',
    '@typescript-eslint',
    'jsx-a11y',
    'import',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],

    // React
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': 'warn',

    // Accessibility
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',

    // Import
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    'coverage',
    'storybook-static',
    '*.config.js',
    '*.config.ts',
  ],
};
```

**.eslintignore:**
```
dist
node_modules
coverage
storybook-static
public
*.config.js
*.config.ts
vite-env.d.ts
```

### 3. Prettier Configuration

**Installation:**
```bash
npm install --save-dev prettier
```

**.prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false,
  "plugins": ["prettier-plugin-organize-imports"]
}
```

**.prettierignore:**
```
dist
node_modules
coverage
storybook-static
public
package-lock.json
*.min.js
*.min.css
```

### 4. Package Scripts

**package.json:**
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run type-check && npm run lint && npm run format:check && npm run test"
  }
}
```

---

## Commit Hooks & Automation

### Husky + lint-staged Setup

**Installation:**
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**Enable Git Hooks:**
```bash
npx husky install
npm pkg set scripts.prepare="husky install"
```

**Create Pre-commit Hook (.husky/pre-commit):**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Create Commit Message Hook (.husky/commit-msg):**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

**Create Pre-push Hook (.husky/pre-push):**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
npm run test -- --bail --findRelatedTests
```

### lint-staged Configuration

**package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ],
    "*.{css,md,json}": [
      "prettier --write"
    ]
  }
}
```

### Commitlint Configuration

**Installation:**
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

**commitlint.config.js:**
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Build system or dependencies
        'ci',       // CI configuration changes
        'chore',    // Other changes (maintenance)
        'revert',   // Revert a previous commit
      ],
    ],
    'subject-case': [0],
    'subject-max-length': [2, 'always', 100],
  },
};
```

**Commit Message Format:**
```
type(scope?): subject

body?

footer?
```

**Examples:**
```bash
feat(students): add search functionality
fix(api): resolve pagination issue
docs(readme): update setup instructions
test(students): add unit tests for StudentCard component
```

---

## CI/CD Quality Gates

### GitHub Actions Workflow

**.github/workflows/quality.yml:**
```yaml
name: Quality Checks

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # For Chromatic
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      # Type Check
      - name: Type Check
        run: npm run type-check
      
      # Linting
      - name: Run ESLint
        run: npm run lint
      
      # Formatting
      - name: Check Formatting
        run: npm run format:check
      
      # Unit & Component Tests
      - name: Run Unit Tests
        run: npm run test:coverage
      
      # Upload coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: true
      
      # Build
      - name: Build Application
        run: npm run build
        env:
          CI: true
      
      # Storybook Build
      - name: Build Storybook
        run: npm run build-storybook
      
      # Publish to Chromatic (visual regression)
      - name: Publish to Chromatic
        uses: chromaui/action@v1
        if: github.event_name == 'pull_request'
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          token: ${{ secrets.GITHUB_TOKEN }}
          buildScriptName: 'build-storybook'
          exitZeroOnChanges: false
  
  e2e:
    runs-on: ubuntu-latest
    needs: quality
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:5173
      
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 30
```

### Quality Gate Requirements

| Gate | Tool | Threshold | Blocking | Failure Action |
|------|------|-----------|----------|----------------|
| **TypeScript Compilation** | tsc | No errors | ✅ Yes | Fail CI, block merge |
| **ESLint** | eslint | 0 errors, 0 warnings | ✅ Yes | Fail CI, block merge |
| **Prettier** | prettier | All files formatted | ✅ Yes | Fail CI, block merge |
| **Unit Test Pass Rate** | Jest | 100% | ✅ Yes | Fail CI, block merge |
| **Code Coverage** | Jest | 80% lines | ✅ Yes | Fail CI, block merge |
| **E2E Test Pass Rate** | Playwright | 100% | ✅ Yes | Fail CI, block merge |
| **Build Success** | Vite | No errors | ✅ Yes | Fail CI, block merge |
| **Visual Regression** | Chromatic | Approved changes | ⚠️ Warning | Create alert, requires approval |
| **Bundle Size** | bundlesize | < 500KB (gzipped) | ⚠️ Warning | Create alert for review |

### Branch Protection Rules

**Recommended settings for `main` branch:**
- ✅ Require pull request reviews (at least 1 approval)
- ✅ Require status checks to pass before merging:
  - `quality` job must pass
  - `e2e` job must pass
  - Chromatic must be approved (if visual changes exist)
- ✅ Require branches to be up to date before merging
- ✅ Require linear history (no merge commits, use squash/rebase)
- ✅ Require signed commits (optional but recommended)
- ✅ Include administrators (no one can bypass)

---

## Testing Matrix

### Component Test Coverage Matrix

| Component | Unit Tests | Integration Tests | E2E Tests | Visual Tests | Priority |
|-----------|------------|-------------------|-----------|--------------|----------|
| **StudentList** | ✅ Rendering, filtering, sorting | ✅ API integration, pagination | ✅ Full workflow | ✅ Storybook | P0 |
| **StudentDetails** | ✅ Props rendering | ✅ Load student data | ✅ Navigation | ✅ Storybook | P0 |
| **StudentForm** | ✅ Validation, submission | ✅ Create/Update API | ✅ Form flow | ✅ Storybook | P0 |
| **InstructorList** | ✅ Rendering, filtering | ✅ API integration | ✅ Full workflow | ✅ Storybook | P0 |
| **CourseList** | ✅ Rendering, sorting | ✅ API integration | ✅ Full workflow | ✅ Storybook | P0 |
| **EnrollmentForm** | ✅ Validation | ✅ Enrollment API | ✅ Enrollment flow | ✅ Storybook | P0 |
| **Navigation** | ✅ Link rendering | ✅ Route changes | ✅ Navigation | ✅ Storybook | P1 |
| **ErrorBoundary** | ✅ Error handling | ✅ Error states | ❌ N/A | ✅ Storybook | P1 |
| **LoadingSpinner** | ✅ Props | ❌ N/A | ❌ N/A | ✅ Storybook | P2 |

### E2E Test Scenarios

| Test ID | Scenario | User Flow | Priority | Browsers |
|---------|----------|-----------|----------|----------|
| **E2E-STU-001** | View Student List | Navigate → See list → Pagination | P0 | All |
| **E2E-STU-002** | Search Students | Navigate → Search → See results | P0 | Chrome, Firefox |
| **E2E-STU-003** | Create Student | Navigate → Fill form → Submit → Verify | P0 | All |
| **E2E-STU-004** | Edit Student | Navigate → Edit → Update → Verify | P0 | Chrome, Firefox |
| **E2E-STU-005** | Delete Student | Navigate → Delete → Confirm → Verify | P0 | Chrome |
| **E2E-INS-001** | View Instructor List | Navigate → See list | P0 | All |
| **E2E-INS-002** | Assign Course | Navigate → Assign → Verify | P0 | Chrome |
| **E2E-CRS-001** | View Course List | Navigate → See list | P0 | All |
| **E2E-CRS-002** | Create Course | Navigate → Fill form → Submit | P0 | Chrome |
| **E2E-ENR-001** | Enroll Student | Select student → Select course → Submit | P0 | Chrome |
| **E2E-NAV-001** | Navigation Flow | Navigate across all pages | P1 | Chrome |
| **E2E-ERR-001** | Error Handling | Trigger errors → Verify messages | P1 | Chrome |
| **E2E-MOB-001** | Mobile Navigation | Navigate on mobile viewport | P1 | Mobile Chrome, Safari |

### Cross-Browser Testing Matrix

| Browser | Desktop | Mobile | E2E Tests | Visual Tests | Priority |
|---------|---------|--------|-----------|--------------|----------|
| **Chrome** | ✅ Latest | ✅ Pixel 5 | All tests | All | P0 |
| **Firefox** | ✅ Latest | ❌ N/A | Critical only | Critical | P1 |
| **Safari** | ✅ Latest | ✅ iPhone 12 | Critical only | Critical | P1 |
| **Edge** | ✅ Latest | ❌ N/A | Smoke only | Smoke | P2 |

---

## Flake Triage Plan

### Flaky Test Definition

A test is considered **flaky** if it produces inconsistent results (pass/fail) without code changes.

### Common Causes & Solutions

#### 1. Timing Issues

**Symptoms:**
- Tests fail intermittently with "element not found"
- Timeouts in E2E tests
- Race conditions in async operations

**Solutions:**
```typescript
// ❌ Bad: Fixed delays
await page.waitForTimeout(1000);

// ✅ Good: Wait for specific conditions
await page.waitForSelector('[data-testid="student-list"]');
await page.waitForLoadState('networkidle');

// ✅ Good: Wait for API response
await page.waitForResponse(response => 
  response.url().includes('/api/students') && response.status() === 200
);
```

#### 2. Test Isolation Issues

**Symptoms:**
- Tests pass in isolation but fail in suite
- Order-dependent test failures
- Shared state between tests

**Solutions:**
```typescript
// ✅ Good: Clean up after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// ✅ Good: Use unique test data
const uniqueId = `test-${Date.now()}-${Math.random()}`;
const testStudent = {
  id: uniqueId,
  firstName: 'Test',
  lastName: 'Student',
};

// ✅ Good: Reset MSW handlers
afterEach(() => {
  server.resetHandlers();
});
```

#### 3. Network Flakiness

**Symptoms:**
- API timeout errors
- Inconsistent response times
- Network request failures

**Solutions:**
```typescript
// ✅ Good: Increase timeout for slow operations
test('loads students', async () => {
  // ...
}, 15000); // 15 second timeout

// ✅ Good: Retry failed requests in E2E
await expect(async () => {
  await page.goto('/students');
  await expect(page.locator('[data-testid="student-list"]')).toBeVisible();
}).toPass({ timeout: 10000 });
```

#### 4. Date/Time Dependencies

**Symptoms:**
- Tests fail at certain times or dates
- Timezone-related failures

**Solutions:**
```typescript
// ❌ Bad: Using actual date
const today = new Date();

// ✅ Good: Mock date
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01'));

// ✅ Good: Use fixed date in tests
const MOCK_DATE = '2024-01-01T00:00:00Z';
```

### Flake Detection & Monitoring

**CI Configuration (.github/workflows/quality.yml):**
```yaml
- name: Run Tests (with retries)
  run: npm run test
  env:
    JEST_RETRY: 2  # Retry failed tests once
```

**Jest Configuration (jest.config.js):**
```javascript
module.exports = {
  // Retry failed tests once
  testRetries: process.env.CI ? 1 : 0,
  
  // Mark tests as flaky after second attempt
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
  ],
};
```

**Playwright Retry Configuration (playwright.config.ts):**
```typescript
export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // Retry E2E tests twice in CI
  use: {
    trace: 'on-first-retry',  // Capture trace on retry
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
```

### Flake Triage Process

```
┌─────────────────────────────────────────────────────────────┐
│ Test Failure Detected in CI                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Did it retry │
              │ and pass?    │
              └──────┬───────┘
                     │
         ┌───────────┴───────────┐
         │ Yes                   │ No
         ▼                       ▼
    ┌─────────┐          ┌───────────────┐
    │ Mark as │          │ Real failure  │
    │ FLAKY   │          │ Investigate   │
    └────┬────┘          └───────────────┘
         │
         ▼
  ┌──────────────────┐
  │ Create GitHub    │
  │ Issue with       │
  │ label: "flaky"   │
  └────┬─────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Investigate:     │
  │ - Check logs     │
  │ - Review trace   │
  │ - Identify cause │
  └────┬─────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Fix flake:       │
  │ - Add wait       │
  │ - Improve mock   │
  │ - Fix race       │
  └────┬─────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Verify fix with  │
  │ multiple runs    │
  │ (10x locally)    │
  └────┬─────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Close issue      │
  └──────────────────┘
```

### Flaky Test Quarantine

**If a test is consistently flaky and cannot be fixed immediately:**

```typescript
// Temporarily skip flaky test
test.skip('flaky test - see issue #123', async () => {
  // Test code
});

// Or mark as "fixme" to run in isolation
test.fixme('needs investigation - see issue #123', async () => {
  // Test code
});
```

**Track quarantined tests:**
- Create GitHub issue with label `flaky-test`
- Link to test file and line number
- Document observed behavior
- Assign to team member
- Set deadline for fix

### Flake Metrics & Reporting

**Target Metrics:**
- Flake rate: < 1% (< 1 in 100 test runs)
- Time to fix: < 2 sprints
- Zero quarantined tests in production branch

**Weekly Report:**
```markdown
## Flaky Test Report - Week 52

**Summary:**
- Total tests: 345
- Flaky tests: 2 (0.58%)
- New flakes: 1
- Fixed flakes: 3
- Quarantined: 0

**Active Flakes:**
1. `StudentForm.test.tsx` - Issue #456 (assigned to @dev1)
2. `e2e/instructors/list.spec.ts` - Issue #457 (assigned to @dev2)

**Fixed This Week:**
1. `CourseList.test.tsx` - Issue #450 ✅
2. `e2e/students/create.spec.ts` - Issue #451 ✅
3. `Navigation.test.tsx` - Issue #452 ✅
```

---

## Setup Commands

### Initial Project Setup

```bash
# 1. Create React + TypeScript project with Vite
npm create vite@latest contoso-university-react -- --template react-ts
cd contoso-university-react

# 2. Install core dependencies
npm install react-router-dom
npm install @tanstack/react-query
npm install axios
npm install bootstrap react-bootstrap

# 3. Install testing dependencies
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install --save-dev msw
npm install --save-dev @playwright/test

# 4. Install code quality tools
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
npm install --save-dev eslint-plugin-import eslint-config-prettier
npm install --save-dev prettier prettier-plugin-organize-imports

# 5. Install commit hooks
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional

# 6. Install Storybook
npx storybook@latest init
npm install --save-dev @storybook/addon-a11y @storybook/addon-coverage

# 7. Install Chromatic (for visual regression)
npm install --save-dev chromatic

# 8. Initialize Husky
npx husky init
npm pkg set scripts.prepare="husky install"

# 9. Initialize Playwright
npx playwright install
```

### Run All Quality Checks Locally

```bash
# Complete validation before committing
npm run validate

# Or run individually:
npm run type-check      # TypeScript compilation check
npm run lint            # ESLint
npm run format:check    # Prettier formatting
npm run test            # Jest unit/component tests
npm run test:e2e        # Playwright E2E tests
npm run build           # Production build
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Component tests only
npm run test:component

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# E2E tests in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox

# Run specific test file
npm run test StudentList.test.tsx
npm run test:e2e students/list.spec.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Visual Testing Commands

```bash
# Build Storybook
npm run build-storybook

# Run Storybook locally
npm run storybook

# Publish to Chromatic
npm run chromatic

# Update Playwright snapshots
npm run test:e2e -- --update-snapshots
```

### Code Quality Commands

```bash
# Lint and fix
npm run lint:fix

# Format all files
npm run format

# Type check without building
npm run type-check

# All quality checks
npm run validate
```

---

## Migration Testing Strategy

### Phase 1: Pre-Migration (Current ASP.NET App)

**Objective:** Establish baseline test coverage for existing application

**Actions:**
1. Document existing functionality (manual test cases)
2. Create baseline screenshots of all pages
3. Record API contracts and responses
4. Document expected behaviors and edge cases
5. Create migration acceptance criteria

**Deliverables:**
- Manual test case document (100+ test cases)
- Baseline screenshots (all pages, all states)
- API contract documentation
- Migration checklist

### Phase 2: Parallel Implementation (React Development)

**Objective:** Build React app with TDD approach, using existing app as reference

**Actions:**
1. Implement features with tests first (TDD)
2. Compare React app behavior against ASP.NET baseline
3. Run visual regression tests against baseline screenshots
4. Validate API integration with both old and new UIs
5. Track feature parity in migration checklist

**Testing Approach:**
```
For each feature:
1. Write failing test (based on baseline behavior)
2. Implement feature in React
3. Run test until passing
4. Compare visual output with baseline
5. Document any deviations
6. Get approval for deviations
7. Update baseline if approved
8. Mark feature as complete
```

**Quality Gates:**
- All unit tests passing
- All component tests passing
- Visual regression approved
- API integration verified
- Feature parity confirmed

### Phase 3: Cutover Preparation

**Objective:** Validate complete system before production deployment

**Actions:**
1. Run full E2E test suite against React app
2. Perform exploratory testing
3. Load testing and performance validation
4. Accessibility audit
5. Cross-browser testing
6. Security testing (OWASP)
7. UAT (User Acceptance Testing)

**Success Criteria:**
- 100% E2E test pass rate
- Zero critical/high bugs
- Performance meets or exceeds baseline
- WCAG 2.1 Level AA compliance
- All browsers supported
- Security scan passes
- UAT sign-off

### Phase 4: Post-Migration Monitoring

**Objective:** Monitor production and catch any missed issues

**Actions:**
1. Real User Monitoring (RUM)
2. Error tracking (Sentry, LogRocket)
3. Performance monitoring (Web Vitals)
4. User feedback collection
5. Regression test suite runs daily
6. Visual regression tests on each deployment

**Monitoring:**
- Error rate < 0.1%
- Performance within 10% of baseline
- Zero visual regressions
- User satisfaction > 90%

---

## Summary Checklist

### Initial Setup ✅

- [ ] Install Jest + React Testing Library
- [ ] Configure Jest with coverage thresholds
- [ ] Set up MSW for API mocking
- [ ] Install and configure Playwright
- [ ] Set up Storybook
- [ ] Configure Chromatic for visual regression
- [ ] Install and configure ESLint
- [ ] Install and configure Prettier
- [ ] Set up TypeScript strict mode
- [ ] Install Husky and lint-staged
- [ ] Configure commit message linting
- [ ] Create GitHub Actions workflow
- [ ] Set up branch protection rules

### Testing Implementation ✅

- [ ] Write unit tests for utilities (80%+ coverage)
- [ ] Write component tests for all components (80%+ coverage)
- [ ] Write integration tests for API hooks
- [ ] Write E2E tests for critical flows (10-15 tests)
- [ ] Create Storybook stories for all components
- [ ] Set up visual regression baseline
- [ ] Test on all target browsers
- [ ] Perform accessibility testing
- [ ] Load testing and performance validation

### Code Quality ✅

- [ ] All files pass ESLint with zero warnings
- [ ] All files formatted with Prettier
- [ ] TypeScript strict mode with zero errors
- [ ] No console.log statements in production code
- [ ] Proper error boundaries implemented
- [ ] Loading and error states tested

### CI/CD ✅

- [ ] GitHub Actions workflow passing
- [ ] All quality gates enforced
- [ ] Coverage uploaded to Codecov
- [ ] Chromatic integration working
- [ ] E2E tests running in CI
- [ ] Deployment pipeline configured

### Documentation ✅

- [ ] README with setup instructions
- [ ] Testing documentation
- [ ] Component documentation (Storybook)
- [ ] API documentation
- [ ] Architecture Decision Records (ADRs)

---

## Related Documents

- [Test-Strategy-&-Coverage.md](../../Test-Strategy-&-Coverage.md) - Current .NET test strategy
- [CI-CD-&-DevEx.md](../../CI-CD-&-DevEx.md) - Current CI/CD setup
- [Architecture-Overview.md](../../Architecture-Overview.md) - System architecture

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Migration Team | Initial testing & quality plan for React migration |

---

**Last Updated:** 2025-12-30  
**Status:** 📋 Planning Phase  
**Next Review:** After initial setup completion
