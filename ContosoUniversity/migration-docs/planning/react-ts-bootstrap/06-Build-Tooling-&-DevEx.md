---
title: 'Build Tooling & Developer Experience - React TypeScript Bootstrap Migration'
last_updated: '2025-12-30'
owner: 'Frontend Engineering Team'
status: 'Planning'
related_docs: ['../CI-CD-&-DevEx.md', '../Technology-Inventory.md', '../Architecture-Overview.md']
---

# Build Tooling & Developer Experience

## Executive Summary

This document outlines the build tooling strategy, asset pipeline configuration, and developer experience setup for migrating ContosoUniversity from server-rendered Razor Pages to a modern React + TypeScript + Bootstrap frontend stack.

**Recommended Build Tool:** Vite  
**CSS Strategy:** SCSS with Bootstrap 5.x  
**CSS Optimization:** Content-driven tree-shaking via Vite  
**Development Server:** Vite HMR with Hot Module Replacement  
**Target Bundle Size:** < 200KB initial JS (gzipped), < 50KB CSS (minified)

---

## Table of Contents

- [Build Tool Selection](#build-tool-selection)
- [Bootstrap Integration Strategy](#bootstrap-integration-strategy)
- [SCSS Pipeline Configuration](#scss-pipeline-configuration)
- [PostCSS & Autoprefixer Setup](#postcss--autoprefixer-setup)
- [Environment Variable Injection](#environment-variable-injection)
- [CSS Size Control & Optimization](#css-size-control--optimization)
- [Source Maps Configuration](#source-maps-configuration)
- [Hot Module Replacement (HMR)](#hot-module-replacement-hmr)
- [CI Pipeline Integration](#ci-pipeline-integration)
- [Asset Hosting & CDN Strategy](#asset-hosting--cdn-strategy)
- [Build Output & Artifact Versioning](#build-output--artifact-versioning)
- [Developer Workflow](#developer-workflow)
- [Troubleshooting](#troubleshooting)

---

## Build Tool Selection

### Vite vs Webpack Comparison

| Criterion | Vite | Webpack |
|-----------|------|---------|
| **Dev Server Startup** | < 1s (ESM-based) | 10-30s (bundle-based) |
| **HMR Speed** | < 100ms | 1-5s |
| **Production Build** | Rollup-based, optimized | Mature, highly configurable |
| **TypeScript Support** | Built-in (esbuild) | Requires ts-loader/babel |
| **Bootstrap Integration** | Simple SCSS imports | Requires sass-loader config |
| **Learning Curve** | Low (convention over config) | High (extensive configuration) |
| **Community Plugins** | Growing ecosystem | Mature, extensive |
| **Production Ready** | Yes (v5.x stable) | Yes (v5.x stable) |

### Recommendation: **Vite**

**Rationale:**
- ✅ Significantly faster development experience (10-30x faster cold starts)
- ✅ Near-instantaneous HMR improves developer productivity
- ✅ Built-in TypeScript support via esbuild (no additional loaders)
- ✅ Simpler configuration for SCSS/PostCSS pipeline
- ✅ Modern ESM-first approach aligns with React 18+ ecosystem
- ✅ Rollup-based production builds are highly optimized
- ✅ Native support for env variable injection
- ⚠️ Fallback: Webpack remains viable if advanced build customization is required

### Installation

```bash
# Create new React + TypeScript + Vite project
npm create vite@latest contoso-university-frontend -- --template react-ts

# Or add to existing project
npm install --save-dev vite @vitejs/plugin-react typescript
```

---

## Bootstrap Integration Strategy

### Current State Analysis

**Current Setup:**
- Bootstrap 5.x included via `wwwroot/lib/bootstrap/dist/` (static files)
- jQuery and jQuery Validation included for ASP.NET Core validation
- No npm-based dependency management for frontend assets
- No SCSS compilation pipeline

**Target State:**
- Bootstrap 5.x installed via npm with full SCSS source access
- Custom theme variables and component overrides
- JavaScript bundle includes Bootstrap's interactive components
- @popperjs/core for tooltips, popovers, and dropdowns
- Tree-shaken CSS and JS for optimal bundle size

### NPM Installation

```bash
# Install Bootstrap and its peer dependencies
npm install bootstrap@^5.3.0
npm install @popperjs/core@^2.11.8

# Install SCSS compiler
npm install --save-dev sass
```

### Bootstrap SCSS Imports

#### Recommended Approach: Selective Imports

Create a custom `src/styles/main.scss` file:

```scss
// 1. Include functions first (required for variable definitions)
@import 'bootstrap/scss/functions';

// 2. Override default variables BEFORE importing Bootstrap
$primary: #0056b3;        // Contoso University brand color
$secondary: #6c757d;
$success: #28a745;
$info: #17a2b8;
$warning: #ffc107;
$danger: #dc3545;
$font-family-sans-serif: 'Segoe UI', system-ui, -apple-system, sans-serif;
$border-radius: 0.375rem;
$enable-shadows: true;
$enable-rounded: true;

// 3. Include remainder of required Bootstrap stylesheets
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/variables-dark';
@import 'bootstrap/scss/maps';
@import 'bootstrap/scss/mixins';
@import 'bootstrap/scss/utilities';

// 4. Layout & components
@import 'bootstrap/scss/root';
@import 'bootstrap/scss/reboot';
@import 'bootstrap/scss/type';
@import 'bootstrap/scss/images';
@import 'bootstrap/scss/containers';
@import 'bootstrap/scss/grid';
@import 'bootstrap/scss/tables';
@import 'bootstrap/scss/forms';
@import 'bootstrap/scss/buttons';
@import 'bootstrap/scss/transitions';
@import 'bootstrap/scss/dropdown';
@import 'bootstrap/scss/nav';
@import 'bootstrap/scss/navbar';
@import 'bootstrap/scss/card';
@import 'bootstrap/scss/pagination';
@import 'bootstrap/scss/badge';
@import 'bootstrap/scss/alert';
@import 'bootstrap/scss/modal';
@import 'bootstrap/scss/tooltip';
@import 'bootstrap/scss/popover';
@import 'bootstrap/scss/spinners';

// 5. Helpers
@import 'bootstrap/scss/helpers';

// 6. Utilities
@import 'bootstrap/scss/utilities/api';

// 7. Custom overrides
@import './custom/layout';
@import './custom/components';
@import './custom/utilities';
```

**Benefits of Selective Imports:**
- ✅ Only include components used in the application
- ✅ Reduces final CSS bundle size by 30-50%
- ✅ Clear visibility into which Bootstrap features are used
- ❌ Requires maintenance when adding new Bootstrap components

#### Alternative: Full Import (Simpler, Larger Bundle)

```scss
// Import all Bootstrap SCSS
@import 'bootstrap/scss/bootstrap';

// Custom overrides
@import './custom/theme';
```

### Bootstrap JavaScript Integration

#### Importing Bootstrap Components

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Bootstrap JavaScript bundle (includes Popper.js)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import custom styles
import './styles/main.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Selective Component Imports (Recommended for Tree-Shaking)

```typescript
// src/utils/bootstrap.ts
// Import only needed Bootstrap components
import Alert from 'bootstrap/js/dist/alert';
import Button from 'bootstrap/js/dist/button';
import Collapse from 'bootstrap/js/dist/collapse';
import Dropdown from 'bootstrap/js/dist/dropdown';
import Modal from 'bootstrap/js/dist/modal';
import Tooltip from 'bootstrap/js/dist/tooltip';
import Popover from 'bootstrap/js/dist/popover';

// Export for use in React components
export { Alert, Button, Collapse, Dropdown, Modal, Tooltip, Popover };
```

#### Using Bootstrap Components in React

```typescript
// Example: Bootstrap Modal in React
import { useEffect, useRef } from 'react';
import { Modal } from '../utils/bootstrap';

export function ConfirmationModal({ show, onHide, onConfirm }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const bsModalRef = useRef<Modal | null>(null);

  useEffect(() => {
    if (modalRef.current) {
      bsModalRef.current = new Modal(modalRef.current);
    }
    return () => bsModalRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (show) {
      bsModalRef.current?.show();
    } else {
      bsModalRef.current?.hide();
    }
  }, [show]);

  return (
    <div className="modal fade" ref={modalRef} tabIndex={-1}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirm Action</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to proceed?</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={onConfirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Alternative: React-Bootstrap Library

For a more React-idiomatic approach, consider `react-bootstrap`:

```bash
npm install react-bootstrap
```

```typescript
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

function MyModal({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Modal heading</Modal.Title>
      </Modal.Header>
      <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
```

**Trade-offs:**
- ✅ More React-friendly API
- ✅ Better TypeScript definitions
- ✅ No manual Bootstrap JS initialization
- ❌ Adds ~25KB to bundle size
- ❌ Slight API differences from vanilla Bootstrap

---

## SCSS Pipeline Configuration

### Vite SCSS Setup

Vite supports SCSS out of the box once `sass` is installed:

```bash
npm install --save-dev sass
```

#### Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Additional data prepended to every SCSS file
        additionalData: `
          @import "@/styles/variables";
          @import "@/styles/mixins";
        `,
        // Silence deprecation warnings from Bootstrap 5.x
        silenceDeprecations: ['legacy-js-api'],
      },
    },
    devSourcemap: true, // Enable CSS source maps in development
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    },
  },
});
```

### SCSS Architecture

```
src/
├── styles/
│   ├── main.scss                 # Entry point, imports Bootstrap + custom
│   ├── _variables.scss           # Custom Bootstrap variable overrides
│   ├── _mixins.scss              # Custom SCSS mixins
│   ├── custom/
│   │   ├── _layout.scss          # Custom layout styles
│   │   ├── _components.scss      # Custom component styles
│   │   └── _utilities.scss       # Custom utility classes
│   └── pages/
│       ├── _students.scss        # Student page-specific styles
│       ├── _courses.scss         # Course page-specific styles
│       └── _instructors.scss     # Instructor page-specific styles
```

### Example Custom Variables (`_variables.scss`)

```scss
// Color overrides
$primary: #0056b3;
$secondary: #6c757d;
$success: #28a745;
$danger: #dc3545;

// Typography
$font-family-base: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
$font-size-base: 1rem;
$line-height-base: 1.5;
$headings-font-weight: 600;

// Spacing
$spacer: 1rem;
$grid-gutter-width: 1.5rem;

// Borders
$border-radius: 0.375rem;
$border-radius-sm: 0.25rem;
$border-radius-lg: 0.5rem;

// Shadows
$enable-shadows: true;
$box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
$box-shadow-sm: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.075);
$box-shadow-lg: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);

// Component-specific
$navbar-padding-y: 0.75rem;
$navbar-brand-font-size: 1.25rem;
$card-border-radius: $border-radius;
$modal-content-border-radius: $border-radius-lg;
```

---

## PostCSS & Autoprefixer Setup

### Installation

```bash
npm install --save-dev postcss autoprefixer cssnano
```

### PostCSS Configuration (`postcss.config.cjs`)

```javascript
module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11',
      ],
      grid: 'autoplace', // Enable CSS Grid prefixes
    },
    // Only minify in production
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        colormin: true,
        minifyFontValues: true,
        minifyGradients: true,
      }],
    }} : {}),
  },
};
```

### Browser Support Configuration (`.browserslistrc`)

```
# Production browsers
> 0.5%
last 2 versions
not dead
not ie 11

# Development browsers
last 1 chrome version
last 1 firefox version
last 1 safari version
```

### Vite Integration

PostCSS is automatically detected and applied by Vite when `postcss.config.cjs` exists.

---

## Environment Variable Injection

### Vite Environment Variables

Vite exposes environment variables via `import.meta.env`:

#### Environment Files

```bash
# .env (committed to git - defaults)
VITE_APP_NAME=Contoso University
VITE_API_TIMEOUT=30000

# .env.development (committed to git - dev defaults)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEVTOOLS=true

# .env.production (committed to git - prod defaults)
VITE_API_BASE_URL=https://api.contoso.edu
VITE_ENABLE_DEVTOOLS=false

# .env.local (NOT committed - local overrides)
VITE_API_BASE_URL=http://localhost:5001/api
```

#### Type-Safe Environment Variables

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_ENABLE_DEVTOOLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### Usage in Application

```typescript
// src/config/api.ts
export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT, 10),
  enableDevTools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
};

// src/services/api.ts
import axios from 'axios';
import { apiConfig } from '../config/api';

export const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### CI/CD Environment Injection

#### GitHub Actions Example

```yaml
# .github/workflows/frontend-build.yml
name: Frontend Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for production
        env:
          VITE_API_BASE_URL: ${{ secrets.PROD_API_URL }}
          VITE_APP_NAME: 'Contoso University'
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: dist/
          retention-days: 30
```

---

## CSS Size Control & Optimization

### Current Challenge

Bootstrap 5.3 full CSS bundle: ~200KB (unminified), ~25KB (minified + gzipped)

**Goal:** Reduce to < 15KB (minified + gzipped) by removing unused styles.

### Strategy 1: Manual Selective Imports (Recommended)

**Pros:**
- ✅ Most control over bundle size
- ✅ No additional tools required
- ✅ Clear understanding of what's included

**Cons:**
- ❌ Manual maintenance required
- ❌ Risk of missing imports when adding features

**Implementation:** See [Bootstrap SCSS Imports](#bootstrap-scss-imports) section above.

### Strategy 2: PurgeCSS (Automated)

**Note:** PurgeCSS can be overly aggressive and may remove necessary Bootstrap styles (e.g., dynamically applied classes).

```bash
npm install --save-dev @fullhuman/postcss-purgecss
```

#### PostCSS Configuration with PurgeCSS

```javascript
// postcss.config.cjs
const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
  plugins: [
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production' ? [
      purgecss({
        content: [
          './index.html',
          './src/**/*.{ts,tsx,js,jsx}',
        ],
        safelist: [
          // Preserve Bootstrap classes added dynamically by JS
          /^modal/,
          /^dropdown/,
          /^tooltip/,
          /^popover/,
          /^carousel/,
          /^offcanvas/,
          /^alert/,
          /^toast/,
          // Preserve state classes
          /^show$/,
          /^active$/,
          /^disabled$/,
          /^collapse/,
          /^collapsing$/,
          // Preserve utility classes that might be added dynamically
          /^d-/,
          /^flex-/,
          /^text-/,
          /^bg-/,
          /^border-/,
          /^rounded/,
          /^shadow/,
        ],
        defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
      }),
      require('cssnano'),
    ] : []),
  ],
};
```

**Caution:** Test thoroughly after implementing PurgeCSS to ensure no styles are incorrectly removed.

### Strategy 3: Vite's Built-In Tree-Shaking (Recommended)

Vite automatically tree-shakes unused CSS modules when using CSS Modules or selective SCSS imports.

**Best Practice:** Combine selective Bootstrap imports with Vite's native optimization.

### CSS Size Monitoring

Add bundle size tracking to CI:

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "vite build --mode production && vite-bundle-visualizer",
    "size-check": "npm run build && node scripts/check-bundle-size.js"
  }
}
```

```javascript
// scripts/check-bundle-size.js
const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const distPath = path.resolve(__dirname, '../dist');
const cssFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.css'));

const MAX_CSS_SIZE_KB = 50; // 50KB unminified target

cssFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  const content = fs.readFileSync(filePath);
  const sizeKB = (content.length / 1024).toFixed(2);
  const gzippedKB = (gzipSync(content).length / 1024).toFixed(2);
  
  console.log(`${file}: ${sizeKB}KB (${gzippedKB}KB gzipped)`);
  
  if (parseFloat(sizeKB) > MAX_CSS_SIZE_KB) {
    console.error(`❌ CSS bundle exceeds ${MAX_CSS_SIZE_KB}KB limit`);
    process.exit(1);
  }
});

console.log('✅ CSS bundle size within acceptable limits');
```

---

## Source Maps Configuration

### Development Source Maps

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true, // Enable source maps in production
  },
  css: {
    devSourcemap: true, // Enable CSS source maps in development
  },
});
```

### Production Source Maps Strategy

**Option 1: Upload to Error Tracking Service (Recommended)**

```yaml
# .github/workflows/frontend-build.yml
- name: Upload source maps to Sentry
  run: |
    npm install -g @sentry/cli
    sentry-cli releases files ${{ github.sha }} upload-sourcemaps ./dist
    # Remove source maps from public distribution
    find ./dist -name "*.map" -type f -delete
```

**Option 2: Serve via Private URL**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: 'hidden', // Generate but don't reference in bundle
  },
});
```

Then upload `.map` files to a private CDN accessible only by debugging tools.

**Option 3: Disable in Production (Not Recommended)**

```typescript
export default defineConfig({
  build: {
    sourcemap: process.env.NODE_ENV === 'development',
  },
});
```

---

## Hot Module Replacement (HMR)

Vite provides HMR out of the box with near-instantaneous updates.

### Vite Dev Server Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    open: true, // Auto-open browser
    cors: true,
    proxy: {
      // Proxy API requests to .NET backend during development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      overlay: true, // Show error overlay in browser
    },
  },
});
```

### React Fast Refresh

Enabled by default with `@vitejs/plugin-react`:

```typescript
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

### HMR for SCSS Files

SCSS changes trigger HMR automatically:

```typescript
// No additional configuration needed
// Vite watches all imported SCSS files and applies changes instantly
```

### Troubleshooting HMR

**Issue:** HMR not working after Bootstrap imports  
**Solution:** Ensure `sass` package is installed and SCSS files are imported correctly

**Issue:** Full page reload on SCSS changes  
**Solution:** Check that SCSS files don't have syntax errors, which force full reload

---

## CI Pipeline Integration

### GitHub Actions Workflow for Frontend

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  CACHE_VERSION: v1

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint code
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:ci
      
      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        environment: [staging, production]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Restore dependencies cache
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ env.CACHE_VERSION }}-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-${{ env.CACHE_VERSION }}-
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: Build for ${{ matrix.environment }}
        env:
          VITE_API_BASE_URL: ${{ secrets[format('{0}_API_URL', matrix.environment)] }}
          VITE_ENV: ${{ matrix.environment }}
        run: npm run build
      
      - name: Check bundle size
        run: npm run size-check
      
      - name: Generate build report
        run: |
          npm run build:analyze
          echo "### Build Report - ${{ matrix.environment }}" >> $GITHUB_STEP_SUMMARY
          echo "\`\`\`" >> $GITHUB_STEP_SUMMARY
          ls -lh dist/ >> $GITHUB_STEP_SUMMARY
          echo "\`\`\`" >> $GITHUB_STEP_SUMMARY
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist-${{ matrix.environment }}
          path: dist/
          retention-days: 30
          if-no-files-found: error

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.contoso.edu
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-dist-staging
          path: dist/
      
      - name: Deploy to Azure Storage (Static Website)
        uses: azure/CLI@v1
        with:
          azcliversion: 2.50.0
          inlineScript: |
            az storage blob upload-batch \
              --account-name ${{ secrets.AZURE_STORAGE_ACCOUNT }} \
              --auth-mode key \
              --destination '$web' \
              --source ./dist \
              --overwrite \
              --content-cache-control "public, max-age=31536000, immutable"
      
      - name: Purge CDN cache
        run: |
          az cdn endpoint purge \
            --resource-group ${{ secrets.AZURE_RG }} \
            --profile-name ${{ secrets.CDN_PROFILE }} \
            --name ${{ secrets.CDN_ENDPOINT }} \
            --content-paths "/*"

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://contoso.edu
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-dist-production
          path: dist/
      
      - name: Deploy to Azure CDN
        uses: azure/CLI@v1
        with:
          azcliversion: 2.50.0
          inlineScript: |
            az storage blob upload-batch \
              --account-name ${{ secrets.PROD_STORAGE_ACCOUNT }} \
              --auth-mode key \
              --destination '$web' \
              --source ./dist \
              --overwrite
      
      - name: Invalidate CloudFlare cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
```

### CI Caching Strategy

**Dependencies Cache:**
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

**Build Cache (Vite):**
```yaml
- uses: actions/cache@v3
  with:
    path: node_modules/.vite
    key: ${{ runner.os }}-vite-${{ hashFiles('**/package-lock.json') }}
```

**Benefits:**
- ✅ Reduces build time by 50-70%
- ✅ Decreases GitHub Actions costs
- ✅ Faster feedback on pull requests

---

## Asset Hosting & CDN Strategy

### Option 1: Azure Static Web Apps (Recommended)

**Advantages:**
- ✅ Integrated with GitHub Actions
- ✅ Built-in CDN (Azure Front Door)
- ✅ Automatic SSL certificates
- ✅ Global edge network
- ✅ Serverless API integration (optional)
- ✅ Preview deployments for pull requests

**Configuration:**

```yaml
# staticwebapp.config.json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,scss,js,ts,png,gif,ico,jpg,svg}"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "Cache-Control": "public, max-age=31536000, immutable"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".woff2": "font/woff2"
  }
}
```

### Option 2: Azure Blob Storage + Azure CDN

**Advantages:**
- ✅ Lower cost than Static Web Apps
- ✅ Fine-grained CDN control
- ✅ Custom domain support
- ❌ Requires manual HTTPS configuration

**Deployment:**

```bash
# Upload to Azure Blob Storage
az storage blob upload-batch \
  --account-name contosofecdn \
  --source ./dist \
  --destination '$web' \
  --content-cache-control "public, max-age=31536000, immutable"

# Purge CDN cache
az cdn endpoint purge \
  --resource-group contoso-rg \
  --profile-name contoso-cdn \
  --name contoso-endpoint \
  --content-paths "/*"
```

### Option 3: CloudFlare (Third-Party CDN)

**Advantages:**
- ✅ Superior global edge network
- ✅ Advanced caching rules
- ✅ DDoS protection
- ✅ Web Application Firewall (WAF)
- ❌ Additional vendor dependency

### CDN Optimization Headers

```typescript
// vite.config.ts - Set headers via deployment config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Cache-busting via content hashing
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
});
```

**Recommended Headers:**

```http
# Immutable assets (hashed filenames)
Cache-Control: public, max-age=31536000, immutable

# HTML (SPA entry point - never cache)
Cache-Control: no-cache, no-store, must-revalidate

# API responses
Cache-Control: no-cache, must-revalidate
```

---

## Build Output & Artifact Versioning

### Vite Build Output Structure

```
dist/
├── index.html                          # SPA entry point
├── assets/
│   ├── index.[hash].js                 # Main application bundle
│   ├── index.[hash].css                # Main stylesheet
│   ├── vendor.[hash].js                # Third-party dependencies (React, Bootstrap)
│   ├── bootstrap-icons.[hash].woff2    # Icon fonts
│   └── [component].[hash].js           # Code-split chunks
├── favicon.ico
└── robots.txt
```

### Versioning Strategy

**Semantic Versioning in `package.json`:**

```json
{
  "name": "contoso-university-frontend",
  "version": "1.2.3",
  "description": "Contoso University Frontend Application"
}
```

**Git-Based Versioning:**

```json
// package.json scripts
{
  "scripts": {
    "version:set": "node scripts/set-build-version.js",
    "build": "npm run version:set && vite build"
  }
}
```

```javascript
// scripts/set-build-version.js
const fs = require('fs');
const { execSync } = require('child_process');

const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const buildTime = new Date().toISOString();

const versionInfo = {
  version: require('../package.json').version,
  gitHash,
  gitBranch,
  buildTime,
};

// Write to public directory for runtime access
fs.writeFileSync(
  './public/version.json',
  JSON.stringify(versionInfo, null, 2)
);

console.log('Build version:', versionInfo);
```

**Runtime Version Display:**

```typescript
// src/components/Footer.tsx
import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  gitHash: string;
  gitBranch: string;
  buildTime: string;
}

export function Footer() {
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(setVersion)
      .catch(console.error);
  }, []);

  return (
    <footer className="footer mt-auto py-3 bg-light">
      <div className="container text-center">
        <span className="text-muted">
          Contoso University © 2025
          {version && (
            <small className="ms-2">
              v{version.version} ({version.gitHash})
            </small>
          )}
        </span>
      </div>
    </footer>
  );
}
```

### Artifact Retention

**GitHub Actions:**
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: frontend-dist-${{ github.sha }}
    path: dist/
    retention-days: 30  # Keep for 30 days
```

**Azure DevOps:**
```yaml
- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: 'dist'
    artifactName: 'frontend-$(Build.BuildNumber)'
    retentionDays: 90
```

---

## Developer Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/contoso/university-frontend.git
cd university-frontend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start development server
npm run dev

# 5. Open browser (auto-opens to http://localhost:3000)
```

### Common Development Commands

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,scss}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "size-check": "npm run build && node scripts/check-bundle-size.js",
    "analyze": "vite-bundle-visualizer"
  }
}
```

### Pre-Commit Hooks (Optional but Recommended)

```bash
npm install --save-dev husky lint-staged
npx husky install
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run type-check
```

---

## Troubleshooting

### Issue: Bootstrap JavaScript Not Working

**Symptoms:** Dropdowns, modals, tooltips not functioning  
**Cause:** Missing `@popperjs/core` dependency or incorrect import

**Solution:**
```bash
npm install @popperjs/core
```

```typescript
// Use bootstrap.bundle.js which includes Popper
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

### Issue: SCSS Import Errors

**Symptoms:** `Cannot find module 'bootstrap/scss/functions'`  
**Cause:** Incorrect import path or missing `sass` package

**Solution:**
```bash
npm install --save-dev sass
```

```scss
// Correct import path
@import 'bootstrap/scss/functions';
```

### Issue: HMR Full Page Reload on CSS Changes

**Symptoms:** Browser reloads entire page instead of hot-updating CSS  
**Cause:** SCSS syntax error or circular imports

**Solution:**
- Check browser console for SCSS compilation errors
- Ensure no circular `@import` statements
- Verify all imported files exist

### Issue: Large Bundle Size

**Symptoms:** CSS bundle > 100KB, JS bundle > 500KB  
**Cause:** Importing entire Bootstrap library

**Solution:**
- Use selective Bootstrap imports (see [Bootstrap SCSS Imports](#bootstrap-scss-imports))
- Enable tree-shaking via Vite
- Run `npm run analyze` to identify large dependencies

### Issue: Environment Variables Not Loading

**Symptoms:** `import.meta.env.VITE_API_URL` is undefined  
**Cause:** Environment variable not prefixed with `VITE_`

**Solution:**
```bash
# Incorrect
API_URL=http://localhost:5000

# Correct
VITE_API_URL=http://localhost:5000
```

### Issue: CI Build Failing on Bundle Size Check

**Symptoms:** Build passes locally but fails in CI  
**Cause:** Different dependency versions or missing cache

**Solution:**
```yaml
# Use npm ci instead of npm install in CI
- run: npm ci --prefer-offline
```

---

## Next Steps

1. **Create Vite Project:** Initialize new React + TypeScript project with Vite
2. **Install Dependencies:** Add Bootstrap, Sass, and PostCSS tooling
3. **Configure Build Pipeline:** Set up `vite.config.ts` with SCSS and proxy settings
4. **Implement Component Library:** Create reusable Bootstrap-based React components
5. **Set Up CI/CD:** Configure GitHub Actions for automated builds and deployments
6. **Performance Testing:** Run Lighthouse audits to validate bundle size targets
7. **Developer Onboarding:** Document local setup process for team members

---

## References

- [Vite Official Documentation](https://vitejs.dev/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Bootstrap SCSS Customization](https://getbootstrap.com/docs/5.3/customize/sass/)
- [PostCSS Documentation](https://postcss.org/)
- [Autoprefixer Configuration](https://github.com/postcss/autoprefixer)
- [React Bootstrap Library](https://react-bootstrap.github.io/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [PurgeCSS Documentation](https://purgecss.com/)

---

**Document Status:** Planning  
**Last Updated:** 2025-12-30  
**Next Review:** 2026-01-15
