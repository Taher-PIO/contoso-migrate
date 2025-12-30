# Accessibility & Performance Plan - React/TypeScript/Bootstrap Migration

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Engineering Team  
**Status:** Planning  

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Accessibility Plan (WCAG 2.1 AA)](#accessibility-plan-wcag-21-aa)
  - [WCAG 2.1 AA Compliance Targets](#wcag-21-aa-compliance-targets)
  - [Axe Accessibility Checks](#axe-accessibility-checks)
  - [Focus Management Strategy](#focus-management-strategy)
  - [Bootstrap Component Accessibility](#bootstrap-component-accessibility)
  - [Accessibility Testing Checklist](#accessibility-testing-checklist)
- [Performance Plan](#performance-plan)
  - [Performance Budgets](#performance-budgets)
  - [Core Web Vitals Targets](#core-web-vitals-targets)
  - [Code-Splitting Strategy](#code-splitting-strategy)
  - [Image Optimization](#image-optimization)
  - [CSS Pruning](#css-pruning)
  - [Performance Optimization Plan](#performance-optimization-plan)
- [Monitoring & Dashboards](#monitoring--dashboards)
- [Implementation Roadmap](#implementation-roadmap)
- [Appendices](#appendices)

---

## Executive Summary

This document defines the accessibility and performance standards for the ContosoUniversity migration from ASP.NET Core Razor Pages to a React/TypeScript/Bootstrap-based single-page application (SPA). The goal is to ensure the migrated application meets **WCAG 2.1 Level AA** accessibility standards and achieves modern web performance benchmarks through measurable Core Web Vitals.

### Key Objectives

**Accessibility:**
- Achieve WCAG 2.1 Level AA compliance across all user journeys
- Implement comprehensive keyboard navigation and screen reader support
- Ensure accessible Bootstrap component usage with proper ARIA attributes
- Establish automated and manual accessibility testing processes

**Performance:**
- Target Core Web Vitals scores: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Implement aggressive code-splitting to reduce initial bundle size
- Optimize images and static assets for fast delivery
- Eliminate unused CSS and JavaScript through pruning
- Establish performance budgets and monitoring dashboards

### Current Baseline (from existing analysis)

**Accessibility Status:**
- ❌ No skip navigation links
- ❌ Tables lack semantic accessibility features
- ❌ Insufficient link context for screen readers
- ❌ Color-only indicators (table row selection)
- ⚠️ Basic Bootstrap accessibility (not validated)

**Performance Status:**
- P95 Response Time: 300-400ms (server-side)
- No APM monitoring configured
- No performance budgets defined
- No client-side performance optimization
- Estimated LCP: 1.5-3s (unoptimized SPA)

---

## Accessibility Plan (WCAG 2.1 AA)

### WCAG 2.1 AA Compliance Targets

This plan provides detailed implementation guidance for achieving WCAG 2.1 Level AA compliance. Below are the key success criteria organized by the four WCAG principles: Perceivable, Operable, Understandable, and Robust.



#### Perceivable (Principle 1)

| Success Criterion | Level | Target Status | Implementation Notes |
|------------------|-------|---------------|---------------------|
| **1.1.1 Non-text Content** | A | ✅ Required | All images must have alt text; decorative images use empty alt="" |
| **1.3.1 Info and Relationships** | A | ✅ Required | Semantic HTML5 (header, nav, main, footer); proper heading hierarchy; ARIA landmarks |
| **1.3.2 Meaningful Sequence** | A | ✅ Required | Logical DOM order matches visual presentation; reading order makes sense |
| **1.3.3 Sensory Characteristics** | A | ✅ Required | Instructions don't rely solely on shape, color, size, visual location, orientation, or sound |
| **1.3.4 Orientation** | AA | ✅ Required | Content not restricted to single display orientation (portrait/landscape) |
| **1.3.5 Identify Input Purpose** | AA | ✅ Required | Form inputs use autocomplete attributes (name, email, etc.) |
| **1.4.1 Use of Color** | A | ✅ Required | Color not used as only visual means of conveying info (add icons, text labels) |
| **1.4.3 Contrast (Minimum)** | AA | ✅ Required | 4.5:1 for normal text, 3:1 for large text (18pt+/14pt+ bold) |
| **1.4.4 Resize Text** | AA | ✅ Required | Text can be resized to 200% without loss of content or functionality |
| **1.4.10 Reflow** | AA | ✅ Required | No horizontal scrolling at 320px width (400% zoom) |
| **1.4.11 Non-text Contrast** | AA | ✅ Required | 3:1 contrast for UI components and graphical objects |
| **1.4.12 Text Spacing** | AA | ✅ Required | Support user-defined text spacing without loss of content |

#### Operable (Principle 2)

| Success Criterion | Level | Target Status | Implementation Notes |
|------------------|-------|---------------|---------------------|
| **2.1.1 Keyboard** | A | ✅ Required | All functionality available via keyboard (Tab, Enter, Space, Arrow keys) |
| **2.1.2 No Keyboard Trap** | A | ✅ Required | Focus can be moved away from components using keyboard only |
| **2.4.1 Bypass Blocks** | A | ✅ Required | Skip navigation link to bypass repeated content |
| **2.4.2 Page Titled** | A | ✅ Required | Descriptive page titles (Student List, Edit Instructor, etc.) |
| **2.4.3 Focus Order** | A | ✅ Required | Focus order follows meaningful sequence |
| **2.4.4 Link Purpose (In Context)** | A | ✅ Required | Link text or context makes purpose clear ("Edit Student John Doe") |
| **2.4.5 Multiple Ways** | AA | ✅ Required | Multiple ways to locate pages (navigation, search, breadcrumbs) |
| **2.4.6 Headings and Labels** | AA | ✅ Required | Descriptive headings and labels |
| **2.4.7 Focus Visible** | AA | ✅ Required | Visible keyboard focus indicator (2px outline, 3:1 contrast) |
| **2.5.1 Pointer Gestures** | A | ✅ Required | Multi-point/path-based gestures have single-pointer alternatives |
| **2.5.3 Label in Name** | A | ✅ Required | Accessible name includes visible label text |

#### Understandable (Principle 3)

| Success Criterion | Level | Target Status | Implementation Notes |
|------------------|-------|---------------|---------------------|
| **3.1.1 Language of Page** | A | ✅ Required | HTML lang attribute set (e.g., `<html lang="en">`) |
| **3.2.1 On Focus** | A | ✅ Required | Focus does not trigger unexpected context changes |
| **3.2.2 On Input** | A | ✅ Required | Changing input values does not auto-submit or change context |
| **3.2.3 Consistent Navigation** | AA | ✅ Required | Navigation order consistent across pages |
| **3.2.4 Consistent Identification** | AA | ✅ Required | Components with same functionality have consistent labels/icons |
| **3.3.1 Error Identification** | A | ✅ Required | Form errors clearly identified with text descriptions |
| **3.3.2 Labels or Instructions** | A | ✅ Required | All form fields have labels or instructions |
| **3.3.3 Error Suggestion** | AA | ✅ Required | Provide suggestions for fixing input errors when possible |

#### Robust (Principle 4)

| Success Criterion | Level | Target Status | Implementation Notes |
|------------------|-------|---------------|---------------------|
| **4.1.1 Parsing** | A | ✅ Required | Valid HTML (no duplicate IDs, proper nesting, complete tags) |
| **4.1.2 Name, Role, Value** | A | ✅ Required | All UI components have accessible names, roles, and states (ARIA) |
| **4.1.3 Status Messages** | AA | ✅ Required | Status messages communicated via role="status" or aria-live regions |

---

### Axe Accessibility Checks

#### Automated Testing with axe-core

**Tool Selection:** axe-core (integrated via @axe-core/react or jest-axe)

**Integration Points:**

1. **Development:**
   - Browser extension: axe DevTools (Chrome/Firefox)
   - Run on every page during development before committing

2. **Unit/Component Tests:**
   ```typescript
   // Example: jest-axe integration
   import { render } from '@testing-library/react';
   import { axe, toHaveNoViolations } from 'jest-axe';
   import StudentList from './StudentList';

   expect.extend(toHaveNoViolations);

   test('StudentList should have no accessibility violations', async () => {
     const { container } = render(<StudentList />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

3. **End-to-End Tests:**
   ```typescript
   // Example: Playwright + axe-core
   import { test, expect } from '@playwright/test';
   import AxeBuilder from '@axe-core/playwright';

   test('Students page should pass axe checks', async ({ page }) => {
     await page.goto('/students');
     const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
     expect(accessibilityScanResults.violations).toEqual([]);
   });
   ```

4. **CI/CD Pipeline:**
   - Run axe checks in GitHub Actions on every PR
   - Fail build if critical violations detected
   - Generate accessibility report artifact

#### Axe Rule Configuration

**Critical Rules (Build-Breaking):**
- `color-contrast`: Ensure 4.5:1 contrast ratio
- `label`: Form inputs must have labels
- `button-name`: Buttons must have accessible names
- `link-name`: Links must have discernible text
- `image-alt`: Images must have alt text
- `heading-order`: Heading levels should only increase by one
- `landmark-one-main`: Page must have one main landmark
- `region`: Page content should be contained by landmarks

**Warning Rules (Report Only):**
- `duplicate-id`: Warn on duplicate IDs (but don't break build)
- `aria-allowed-attr`: ARIA attributes valid for role
- `aria-required-attr`: Required ARIA attributes present

#### Axe Testing Schedule

| Phase | Frequency | Scope | Action on Violation |
|-------|-----------|-------|-------------------|
| **Development** | Manual, on-demand | Page/component being worked on | Fix before committing |
| **PR Review** | Automated, every PR | Changed pages/components | Fix critical violations before merge |
| **Integration Tests** | Automated, every commit | All pages | Fix critical violations |
| **Staging Deployment** | Automated, pre-deployment | Full application | Document and fix before prod |
| **Production Monitoring** | Weekly manual scan | Full application | Create tickets for violations |

---

### Focus Management Strategy

#### Focus Indicators

**Visual Design:**
```css
/* Global focus styles - consistent across all interactive elements */
:focus {
  outline: 2px solid #0d6efd; /* Bootstrap primary blue */
  outline-offset: 2px;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Ensure focus visible for keyboard users only (not mouse clicks) */
:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
```

**Requirements:**
- ✅ Minimum 2px outline width
- ✅ 3:1 contrast ratio with adjacent colors (WCAG 2.4.7)
- ✅ Visible on all interactive elements (links, buttons, inputs, custom controls)
- ✅ Never use `outline: none` without replacement
- ✅ Use `:focus-visible` to show focus only for keyboard navigation

#### Focus Order

**Principles:**
1. **DOM Order = Tab Order:** Focus order follows logical reading order (top-to-bottom, left-to-right)
2. **No Positive tabindex:** Never use `tabindex="1"`, `tabindex="2"`, etc. (use only `tabindex="0"` or `tabindex="-1"`)
3. **Skip Links First:** Skip navigation link is the first focusable element
4. **Landmarks Navigation:** Screen readers can jump between landmarks (header, nav, main, aside, footer)

#### Focus Management in SPA

**Route Changes:**
```typescript
// Focus management on route change
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Move focus to main content on route change
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, [location]);

  return (
    <main ref={mainContentRef} tabIndex={-1} id="main-content">
      {/* Page content */}
    </main>
  );
}
```

**Modal Dialogs:**
```typescript
// Focus trap in modal dialog
import FocusTrap from 'focus-trap-react';

function DeleteConfirmationModal({ isOpen, onClose }) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  return (
    <FocusTrap active={isOpen}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Confirm Delete</h2>
        <p>Are you sure you want to delete this student?</p>
        <button ref={firstFocusableRef} onClick={onClose}>Cancel</button>
        <button onClick={handleDelete}>Delete</button>
      </div>
    </FocusTrap>
  );
}
```

#### Skip Links

**Implementation:**
```typescript
// Skip links component
function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
    </div>
  );
}
```

```css
/* Skip link styles - hidden until focused */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 10000;
  border-radius: 0 0 4px 0;
}

.skip-link:focus {
  top: 0;
}
```

---

### Bootstrap Component Accessibility

#### Navbar (Navigation)

**Accessible Implementation:**
```tsx
<nav className="navbar navbar-expand-lg navbar-light bg-light" aria-label="Main navigation">
  <div className="container-fluid">
    <a className="navbar-brand" href="/">
      Contoso University
    </a>
    
    {/* Mobile toggle button */}
    <button 
      className="navbar-toggler" 
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
      aria-controls="navbarNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span className="navbar-toggler-icon"></span>
    </button>
    
    {/* Collapsible navigation */}
    <div className="collapse navbar-collapse" id="navbarNav">
      <ul className="navbar-nav">
        <li className="nav-item">
          <a className="nav-link" href="/students" aria-current="page">
            Students
          </a>
        </li>
        {/* More nav items... */}
      </ul>
    </div>
  </div>
</nav>
```

**Accessibility Requirements:**
- ✅ `<nav>` element with `aria-label` for landmark identification
- ✅ Toggler button has `aria-label`, `aria-expanded`, and `aria-controls`
- ✅ Current page link has `aria-current="page"`
- ✅ Keyboard navigable (Tab through links, Enter/Space to activate toggle)
- ✅ Collapsible menu accessible via keyboard

**Testing Checklist:**
- [ ] Screen reader announces "Main navigation" landmark
- [ ] Toggler button state announced (expanded/collapsed)
- [ ] Current page indicated to screen reader users
- [ ] All links keyboard accessible
- [ ] Escape key closes mobile menu (implement custom behavior)

---

#### Modals (Dialogs)

**Accessible Implementation:**
```tsx
import { Modal } from 'react-bootstrap';

function DeleteStudentModal({ show, onHide, student }) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show && cancelButtonRef.current) {
      // Focus first actionable element (Cancel button)
      cancelButtonRef.current.focus();
    }
  }, [show]);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <Modal.Header closeButton>
        <Modal.Title id="delete-modal-title">
          Delete Student
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body id="delete-modal-description">
        Are you sure you want to delete {student.name}? This action cannot be undone.
      </Modal.Body>
      
      <Modal.Footer>
        <button 
          ref={cancelButtonRef}
          className="btn btn-secondary" 
          onClick={onHide}
        >
          Cancel
        </button>
        <button 
          className="btn btn-danger" 
          onClick={handleDelete}
        >
          Delete
        </button>
      </Modal.Footer>
    </Modal>
  );
}
```

**Accessibility Requirements:**
- ✅ `role="dialog"` and `aria-modal="true"` (Bootstrap Modal provides these)
- ✅ `aria-labelledby` references modal title
- ✅ `aria-describedby` references modal description
- ✅ Focus trapped within modal (cannot tab outside)
- ✅ Focus moves to first interactive element when opened
- ✅ Escape key closes modal
- ✅ Focus returns to trigger element when closed
- ✅ Background content inert (not accessible while modal open)

---

#### Tooltips

**Accessible Implementation:**
```tsx
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

function EnrollmentDateTooltip({ date }) {
  const tooltip = (
    <Tooltip id="enrollment-date-tooltip">
      Enrolled on {date.toLocaleDateString()}
    </Tooltip>
  );

  return (
    <OverlayTrigger 
      placement="top" 
      overlay={tooltip}
      trigger={['hover', 'focus']} // Show on both hover and keyboard focus
    >
      <button 
        className="btn btn-link p-0"
        aria-label={`Enrollment date: ${date.toLocaleDateString()}`}
      >
        <i className="bi bi-info-circle" aria-hidden="true"></i>
      </button>
    </OverlayTrigger>
  );
}
```

**Accessibility Requirements:**
- ✅ Tooltip triggered on both hover AND keyboard focus
- ✅ Tooltip dismissible (mouse out, blur, Escape key)
- ✅ Tooltip content available to screen readers via `aria-label` on trigger
- ✅ Decorative icon marked with `aria-hidden="true"`
- ✅ Tooltip does not disappear while hovering over it

**Best Practices:**
- ⚠️ Don't hide essential information in tooltips (not mobile-friendly)
- ⚠️ Use tooltips for supplementary information only
- ⚠️ Ensure trigger element is keyboard accessible (button, not div)

---

### Accessibility Testing Checklist

#### Automated Testing (Per Component/Page)

- [ ] **axe-core tests pass** with zero violations
- [ ] **ESLint a11y rules pass** (eslint-plugin-jsx-a11y)
- [ ] **Valid HTML** (no duplicate IDs, proper nesting)
- [ ] **Color contrast** meets 4.5:1 minimum (WCAG AA)
- [ ] **Focus indicators** visible (3:1 contrast with background)

#### Manual Keyboard Testing

- [ ] **Tab navigation** works through all interactive elements
- [ ] **Shift+Tab** reverses tab order correctly
- [ ] **Enter/Space** activates buttons and links
- [ ] **Escape key** closes modals and dismisses overlays
- [ ] **No keyboard traps** (can always move focus away)
- [ ] **Skip links** work and are visible on focus
- [ ] **Focus order** logical and follows visual layout

#### Screen Reader Testing

**NVDA (Windows) / VoiceOver (macOS) / JAWS:**

- [ ] **Page title** announced on route change
- [ ] **Landmarks** announced and navigable (header, nav, main, footer)
- [ ] **Headings** provide page structure (H1, H2, H3 hierarchy)
- [ ] **Links** have descriptive text or context
- [ ] **Buttons** have clear labels
- [ ] **Form labels** announced for all inputs
- [ ] **Required fields** announced
- [ ] **Error messages** announced on submission
- [ ] **Table headers** announced when navigating cells
- [ ] **ARIA live regions** announce dynamic content updates
- [ ] **Modal dialogs** trap focus and announce title/description
- [ ] **Images** have meaningful alt text (or empty for decorative)

---

## Performance Plan

### Performance Budgets

**Definition:** Maximum resource limits to ensure fast page loads across all devices and network conditions.

#### Bundle Size Budgets

| Asset Type | Budget (Gzipped) | Target (Gzipped) | Rationale |
|-----------|-----------------|------------------|-----------|
| **Main JavaScript Bundle** | 150 KB | 100 KB | Initial interactive code |
| **Vendor Bundle (React, Bootstrap)** | 100 KB | 75 KB | Framework code (cached long-term) |
| **Route Chunks (per route)** | 50 KB | 30 KB | Lazy-loaded page code |
| **CSS Bundle** | 30 KB | 20 KB | All styles (after pruning) |
| **Total Initial Load** | 280 KB | 195 KB | JS + CSS for first paint |

**Enforcement:**
```javascript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 150000, // 150 KB
    maxEntrypointSize: 280000, // 280 KB
    hints: 'error', // Fail build if exceeded
  },
};
```

#### Network Performance Budgets

| Metric | 3G (Slow) | 4G | Desktop | Rationale |
|--------|-----------|----|---------| --------- |
| **First Contentful Paint (FCP)** | < 3s | < 1.8s | < 1s | User sees content quickly |
| **Largest Contentful Paint (LCP)** | < 4s | < 2.5s | < 1.5s | Main content visible |
| **Time to Interactive (TTI)** | < 7s | < 3.8s | < 2s | Page fully interactive |
| **First Input Delay (FID)** | < 300ms | < 100ms | < 50ms | Responsive to interaction |
| **Cumulative Layout Shift (CLS)** | < 0.1 | < 0.1 | < 0.1 | Visual stability |

**Testing Environment:**
- **Slow 3G:** 400 Kbps, 400ms RTT (Chrome DevTools throttling)
- **4G:** 4 Mbps, 20ms RTT
- **Desktop:** 50 Mbps, 10ms RTT

---

### Core Web Vitals Targets

#### Largest Contentful Paint (LCP)

**Target:** < 2.5 seconds (Good)

**What it measures:** Time until largest content element is visible.

**Optimization Strategies:**

1. **Server-Side Rendering (SSR) or Static Generation:**
   - Use Next.js or Gatsby for pre-rendered HTML
   - Reduces time to first meaningful content

2. **Optimize Critical Resources:**
   - Inline critical CSS
   - Preload hero images: `<link rel="preload" as="image" href="hero.jpg">`
   - Preconnect to external domains: `<link rel="preconnect" href="https://fonts.googleapis.com">`

3. **Image Optimization:**
   - Use next-gen formats (WebP, AVIF)
   - Responsive images with `srcset`
   - Lazy load below-the-fold images

4. **Remove Render-Blocking Resources:**
   - Defer non-critical JavaScript
   - Inline critical CSS, load rest asynchronously

**LCP Elements in ContosoUniversity:**
- Student list table (likely LCP on /students)
- Page heading (`<h1>`)
- Hero image (if added to home page)

---

#### First Input Delay (FID)

**Target:** < 100 milliseconds (Good)

**What it measures:** Time from first user interaction to browser response.

**Optimization Strategies:**

1. **Reduce JavaScript Execution Time:**
   - Code-split to load only necessary JS
   - Defer third-party scripts
   - Use Web Workers for heavy computation

2. **Break Up Long Tasks:**
   - Split long-running functions into smaller chunks
   - Use `setTimeout` or `requestIdleCallback` to yield to browser

3. **Minimize Main Thread Blocking:**
   - Remove unused JavaScript
   - Optimize React renders (React.memo, useMemo, useCallback)
   - Use virtualization for long lists (react-window)

---

#### Cumulative Layout Shift (CLS)

**Target:** < 0.1 (Good)

**What it measures:** Visual stability - how much content shifts unexpectedly.

**Optimization Strategies:**

1. **Reserve Space for Images/Ads:**
   ```html
   <img src="student.jpg" width="800" height="600" alt="Student photo" />
   ```
   Or use aspect-ratio CSS:
   ```css
   .image-container {
     aspect-ratio: 16 / 9;
   }
   ```

2. **Avoid Inserting Content Above Existing Content:**
   - Don't inject alerts/banners at top of page
   - Animate new content in from the side or overlay

3. **Use CSS Transitions for Animations:**
   - Prefer `transform` and `opacity` (GPU-accelerated)
   - Avoid animating `width`, `height`, `top`, `left`

4. **Preload Fonts:**
   ```html
   <link rel="preload" href="/fonts/roboto.woff2" as="font" type="font/woff2" crossorigin>
   ```
   And set `font-display: swap` to avoid invisible text

---

### Code-Splitting Strategy

**Goal:** Load only the JavaScript needed for the current page/feature.

#### Route-Based Code Splitting

```typescript
// App.tsx - Lazy load route components
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Students = lazy(() => import('./pages/Students'));
const StudentDetail = lazy(() => import('./pages/StudentDetail'));
const StudentEdit = lazy(() => import('./pages/StudentEdit'));
const Courses = lazy(() => import('./pages/Courses'));
const Instructors = lazy(() => import('./pages/Instructors'));
const Departments = lazy(() => import('./pages/Departments'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/students/:id/edit" element={<StudentEdit />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/departments" element={<Departments />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Result:** Each route becomes a separate chunk, loaded only when navigating to that route.

---

### Image Optimization

#### Modern Image Formats

**Format Priority:**
1. **AVIF** (best compression, newer)
2. **WebP** (good compression, wide support)
3. **JPEG/PNG** (fallback)

**Implementation:**
```html
<picture>
  <source srcset="student.avif" type="image/avif">
  <source srcset="student.webp" type="image/webp">
  <img src="student.jpg" alt="Student photo" width="800" height="600" loading="lazy">
</picture>
```

#### Responsive Images

```html
<img
  srcset="
    student-320.jpg 320w,
    student-640.jpg 640w,
    student-1280.jpg 1280w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 800px"
  src="student-1280.jpg"
  alt="Student photo"
/>
```

#### Lazy Loading

```html
<!-- Native lazy loading -->
<img src="student.jpg" alt="Student photo" loading="lazy" />
```

---

### CSS Pruning

**Goal:** Remove unused CSS to reduce bundle size.

#### PurgeCSS Integration

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('@fullhuman/postcss-purgecss')({
      content: [
        './src/**/*.tsx',
        './src/**/*.ts',
        './public/index.html',
      ],
      safelist: [
        // Keep dynamically added classes
        'show',
        'modal-open',
        'collapse',
        'collapsing',
        /^alert-/, // Keep all alert variants
        /^btn-/,   // Keep all button variants
      ],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
    }),
  ],
};
```

#### Bootstrap Customization

**Only import needed Bootstrap components:**
```scss
// styles/custom-bootstrap.scss

// Required
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";
@import "~bootstrap/scss/mixins";

// Optional - only import what you use
@import "~bootstrap/scss/root";
@import "~bootstrap/scss/reboot";
@import "~bootstrap/scss/type";
@import "~bootstrap/scss/grid";
@import "~bootstrap/scss/forms";
@import "~bootstrap/scss/buttons";
@import "~bootstrap/scss/tables";
@import "~bootstrap/scss/navbar";
@import "~bootstrap/scss/modal";
@import "~bootstrap/scss/tooltip";
@import "~bootstrap/scss/utilities";
```

**Result:** Reduce Bootstrap CSS from ~150 KB to ~50 KB.

---

### Performance Optimization Plan

#### Phase 1: Foundation (Week 1-2)

**Goal:** Establish performance baseline and tooling.

**Tasks:**

1. **Integrate Web Vitals Monitoring**
   ```bash
   npm install web-vitals
   ```
   Send metrics to Google Analytics or custom analytics.

2. **Set Up Lighthouse CI**
   ```yaml
   # .github/workflows/lighthouse.yml
   - name: Run Lighthouse CI
     run: |
       npm install -g @lhci/cli
       lhci autorun
   ```

3. **Configure Bundle Analyzer**
   ```bash
   npm install --save-dev webpack-bundle-analyzer
   ```

4. **Establish Performance Baselines**
   - Run Lighthouse on all major pages
   - Document current LCP, FID, CLS scores
   - Set improvement targets (20-30% improvement)

**Deliverables:**
- Performance baseline report
- Automated Lighthouse CI in GitHub Actions
- Bundle size analysis report

---

#### Phase 2: Core Optimizations (Week 3-4)

**Goal:** Implement fundamental performance improvements.

**Tasks:**

1. **Implement Code-Splitting**
   - Route-based lazy loading
   - Component-based splitting for heavy components
   - Vendor bundle separation

2. **Optimize Images**
   - Convert to WebP/AVIF
   - Implement lazy loading
   - Add responsive srcset
   - Compress images (target 70-80% quality)

3. **Prune CSS**
   - Configure PurgeCSS
   - Import only used Bootstrap components
   - Remove unused utility classes

4. **Enable Compression**
   - Configure gzip/brotli on server
   - Verify with browser DevTools

**Deliverables:**
- Bundle size reduced by 30-40%
- LCP improved by 20-30%
- Initial load time < 2.5s on 4G

---

#### Phase 3: Advanced Optimizations (Week 5-6)

**Goal:** Fine-tune performance and implement advanced strategies.

**Tasks:**

1. **Implement Prefetching**
   - Prefetch next likely routes on hover/focus
   - Use `<link rel="prefetch">` for future routes

2. **Optimize Fonts**
   - Subset fonts (include only needed characters)
   - Use font-display: swap
   - Preload critical fonts

3. **Add Service Worker (PWA)**
   - Cache static assets
   - Offline fallback pages
   - Background sync for form submissions

4. **Implement Virtual Scrolling**
   - Use react-window for long lists (students, courses)
   - Render only visible items

5. **Optimize React Renders**
   - Use React.memo for expensive components
   - useMemo/useCallback for computed values
   - React DevTools Profiler to identify bottlenecks

**Deliverables:**
- FID < 100ms on all pages
- CLS < 0.1 consistently
- Lighthouse score > 90 on mobile

---

#### Phase 4: Monitoring & Continuous Improvement (Ongoing)

**Goal:** Maintain performance over time.

**Tasks:**

1. **Set Up Real User Monitoring (RUM)**
   - Google Analytics 4 with Web Vitals
   - Or custom RUM solution (Cloudflare, New Relic)

2. **Create Performance Dashboard**
   - Track Core Web Vitals over time
   - Alert on regressions
   - Visualize trends

3. **Performance Budget Enforcement**
   - Fail CI builds if budgets exceeded
   - Review bundle sizes in every PR
   - Set up size-limit or bundlesize tools

4. **Regular Performance Audits**
   - Monthly Lighthouse audits
   - Quarterly third-party script review
   - Annual major performance review

**Deliverables:**
- Live performance dashboard
- Automated performance regression alerts
- Performance optimization backlog

---

## Monitoring & Dashboards

### Real User Monitoring (RUM)

**Tool Selection:** Google Analytics 4 + Web Vitals

**Implementation:**
```typescript
// src/analytics.ts
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Send to Google Analytics
  gtag('event', name, {
    event_category: 'Web Vitals',
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    event_label: id,
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getFCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Synthetic Monitoring

**Tool:** Lighthouse CI + WebPageTest

**Configuration:**
```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/students",
        "http://localhost:3000/courses",
        "http://localhost:3000/instructors"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Performance Dashboard

**Metrics to Track:**

1. **Core Web Vitals (Real Users)**
   - LCP (p75): Target < 2.5s
   - FID (p75): Target < 100ms
   - CLS (p75): Target < 0.1
   - Trend over time (daily/weekly)

2. **Other Performance Metrics**
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
   - Total Blocking Time (TBT)
   - Speed Index

3. **Resource Metrics**
   - Bundle sizes (JS, CSS)
   - Number of HTTP requests
   - Total page weight

4. **User Experience**
   - Bounce rate by performance score
   - Conversion rate by LCP/FID
   - Error rates

---

## Implementation Roadmap

### Month 1: Foundation & Standards

**Weeks 1-2: Setup & Baseline**
- ✅ Create React/TypeScript project structure
- ✅ Configure Bootstrap with accessibility best practices
- ✅ Set up ESLint with jsx-a11y plugin
- ✅ Integrate axe-core for automated testing
- ✅ Run performance baseline with Lighthouse
- ✅ Document current state (this document)

**Weeks 3-4: Core Implementation**
- ✅ Implement skip links and ARIA landmarks
- ✅ Create accessible navigation component
- ✅ Implement focus management on route change
- ✅ Set up code-splitting (route-based)
- ✅ Configure bundle size budgets
- ✅ Integrate Web Vitals monitoring

### Month 2: Component Migration

**Weeks 5-6: Critical Components**
- ✅ Migrate Student list with accessible table
- ✅ Implement accessible forms with validation
- ✅ Create accessible modals (delete confirmation)
- ✅ Optimize images (WebP, lazy loading)
- ✅ Prune unused CSS

**Weeks 7-8: Remaining Components**
- ✅ Migrate Courses, Instructors, Departments
- ✅ Implement accessible tooltips
- ✅ Virtual scrolling for long lists
- ✅ Font optimization
- ✅ Service worker for caching

### Month 3: Testing & Optimization

**Weeks 9-10: Comprehensive Testing**
- ✅ Screen reader testing (NVDA, VoiceOver)
- ✅ Keyboard navigation testing
- ✅ Browser compatibility testing
- ✅ Mobile accessibility testing
- ✅ Performance testing (Lighthouse CI)
- ✅ Address all critical violations

**Weeks 11-12: Fine-Tuning**
- ✅ Performance optimizations (based on profiling)
- ✅ Accessibility refinements (based on user testing)
- ✅ Set up monitoring dashboards
- ✅ Documentation and training
- ✅ Final review and sign-off

### Month 4+: Maintenance & Continuous Improvement

**Ongoing:**
- Monthly accessibility audits
- Monthly performance audits
- Quarterly user testing
- Address new violations promptly
- Keep dependencies updated
- Monitor Core Web Vitals trends

---

## Appendices

### A. Accessibility Resources

**WCAG 2.1 Guidelines:**
- https://www.w3.org/WAI/WCAG21/quickref/

**Testing Tools:**
- axe DevTools: https://www.deque.com/axe/devtools/
- WAVE: https://wave.webaim.org/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- NVDA Screen Reader: https://www.nvaccess.org/

**React Accessibility:**
- React Accessibility: https://react.dev/learn/accessibility
- jsx-a11y ESLint Plugin: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y

**Bootstrap Accessibility:**
- Bootstrap Accessibility: https://getbootstrap.com/docs/5.3/getting-started/accessibility/

### B. Performance Resources

**Core Web Vitals:**
- https://web.dev/vitals/

**Performance Tools:**
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- WebPageTest: https://www.webpagetest.org/
- Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance/

**Optimization Guides:**
- web.dev Performance: https://web.dev/performance/
- React Performance: https://react.dev/learn/render-and-commit#optimizing-performance

### C. Training Materials

**Team Training:**
- WCAG 2.1 AA overview (2 hours)
- Screen reader basics (NVDA/VoiceOver) (1 hour)
- Keyboard navigation best practices (1 hour)
- Performance optimization techniques (2 hours)
- Testing with axe-core and Lighthouse (1 hour)

**Developer Checklist:**
- [ ] Run axe DevTools before committing
- [ ] Test keyboard navigation
- [ ] Verify focus indicators visible
- [ ] Check bundle size impact
- [ ] Run Lighthouse before PR

---

**Document Status:** ✅ Complete - Ready for Implementation  
**Next Review Date:** 2026-01-30 (or after Phase 1 completion)  
**Owner:** Frontend Engineering Team

---

_This document serves as the accessibility and performance blueprint for the ContosoUniversity React/TypeScript/Bootstrap migration. All developers must adhere to the standards and practices outlined here._
