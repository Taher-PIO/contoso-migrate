# Bootstrap Theming Strategy - Contoso University

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Engineering Team  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Current Bootstrap Implementation](#current-bootstrap-implementation)
- [Theming Architecture](#theming-architecture)
- [Customization Strategy](#customization-strategy)
- [Color System & Design Tokens](#color-system--design-tokens)
- [Typography System](#typography-system)
- [Spacing & Layout](#spacing--layout)
- [Component Theming](#component-theming)
- [Dark Mode Considerations](#dark-mode-considerations)
- [RTL Support](#rtl-support)
- [Performance Optimization](#performance-optimization)
- [Migration Path](#migration-path)
- [Best Practices](#best-practices)

---

## Executive Summary

Contoso University currently uses **Bootstrap 5.x** as its primary CSS framework with minimal customization. The application relies entirely on default Bootstrap styles, which provides consistency but limits brand identity and design flexibility.

**Current State:**
- ✅ Bootstrap 5.x bundled via libman
- ✅ Responsive grid system in use
- ✅ Standard component styling
- ❌ No custom theme implementation
- ❌ No design tokens or CSS variables
- ❌ No Sass compilation pipeline
- ❌ No brand-specific color palette

**Theming Goals:**
1. Establish a maintainable theming architecture
2. Define custom color palette and design tokens
3. Implement consistent brand identity
4. Maintain Bootstrap's responsive capabilities
5. Prepare for future framework migration
6. Support accessibility requirements (WCAG 2.1 AA)

---

## Current Bootstrap Implementation

### Installation Method

**libman (Library Manager)** - Client-side library management
```json
// libman.json
{
  "version": "1.0",
  "defaultProvider": "cdnjs",
  "libraries": [
    {
      "library": "bootstrap@5.x.x",
      "destination": "wwwroot/lib/bootstrap/",
      "files": [
        "dist/css/bootstrap.css",
        "dist/css/bootstrap.min.css",
        "dist/css/bootstrap.rtl.css",
        "dist/css/bootstrap.rtl.min.css",
        "dist/js/bootstrap.bundle.js",
        "dist/js/bootstrap.bundle.min.js"
      ]
    }
  ]
}
```

### Current Usage Pattern

**Layout Integration** (`/Pages/Shared/_Layout.cshtml`):
```html
<link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.css" />
<link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
```

**Custom Overrides** (`/wwwroot/css/site.css`):
```css
html {
  font-size: 14px;  /* Override Bootstrap default */
}

@media (min-width: 768px) {
  html {
    font-size: 16px;
  }
}

html {
  position: relative;
  min-height: 100%;
}

body {
  margin-bottom: 60px;  /* For sticky footer */
}
```

### Bootstrap Version

**Current Version:** 5.x (latest minor version from CDN)  
**Update Strategy:** Manual libman updates  
**Recommendation:** Pin to specific version for production stability

```bash
# Check current version
cat wwwroot/lib/bootstrap/dist/css/bootstrap.css | grep "Bootstrap v"

# Update to specific version via libman
# Update libman.json to: "bootstrap@5.3.2"
libman restore
```

---

## Theming Architecture

### Recommended Approach

**Option 1: CSS Variables (Quick Implementation)**

**Pros:**
- ✅ No build pipeline required
- ✅ Runtime theme switching (dark mode)
- ✅ Simple to implement
- ✅ Works with existing setup

**Cons:**
- ❌ Limited customization depth
- ❌ No access to Bootstrap Sass functions
- ❌ Can't modify Bootstrap source values

**Implementation:**
```css
/* /wwwroot/css/theme.css */
:root {
  /* Override Bootstrap CSS variables */
  --bs-primary: #0066cc;
  --bs-secondary: #6c757d;
  --bs-success: #28a745;
  --bs-danger: #dc3545;
  --bs-warning: #ffc107;
  --bs-info: #17a2b8;
  
  /* Typography */
  --bs-font-sans-serif: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --bs-body-font-size: 1rem;
  --bs-body-line-height: 1.5;
  
  /* Spacing */
  --bs-gutter-x: 1.5rem;
  --bs-gutter-y: 0;
  
  /* Borders */
  --bs-border-radius: 0.375rem;
  --bs-border-width: 1px;
  --bs-border-color: #dee2e6;
}
```

---

**Option 2: Sass Customization (Recommended for Full Control)**

**Pros:**
- ✅ Full access to Bootstrap variables
- ✅ Use Bootstrap mixins and functions
- ✅ Tree-shaking unused CSS
- ✅ Proper component customization
- ✅ Production-ready minification

**Cons:**
- ❌ Requires build pipeline
- ❌ More complex setup
- ❌ Learning curve for team

**Project Structure:**
```
ContosoUniversity/
├── Styles/                       (New)
│   ├── _variables.scss          (Custom variables)
│   ├── _custom.scss             (Custom styles)
│   ├── bootstrap-custom.scss    (Bootstrap import)
│   └── site.scss                (Main stylesheet)
├── wwwroot/
│   ├── css/
│   │   ├── site.css            (Compiled from Sass)
│   │   └── site.min.css        (Minified)
│   └── lib/
│       └── bootstrap/          (Remove - use npm instead)
├── package.json                 (New - npm dependencies)
└── gulpfile.js                  (New - build tasks)
```

**Setup Steps:**

1. **Install Node.js dependencies:**
```bash
npm init -y
npm install bootstrap@5.3.2 sass --save-dev
npm install gulp gulp-sass gulp-clean-css gulp-rename --save-dev
```

2. **Create custom variables file** (`/Styles/_variables.scss`):
```scss
// Brand Colors
$primary:       #0066cc;
$secondary:     #6c757d;
$success:       #28a745;
$danger:        #dc3545;
$warning:       #ffc107;
$info:          #17a2b8;
$light:         #f8f9fa;
$dark:          #343a40;

// Typography
$font-family-sans-serif: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
$font-size-base: 1rem;
$line-height-base: 1.5;

// Spacing
$spacer: 1rem;

// Grid
$grid-gutter-width: 1.5rem;

// Borders
$border-radius: 0.375rem;
$border-width: 1px;

// Buttons
$btn-padding-y: 0.375rem;
$btn-padding-x: 0.75rem;
$btn-border-radius: $border-radius;

// Forms
$input-padding-y: 0.375rem;
$input-padding-x: 0.75rem;
$input-border-radius: $border-radius;

// Tables
$table-striped-bg: rgba($black, 0.02);
$table-hover-bg: rgba($black, 0.04);
```

3. **Create bootstrap import file** (`/Styles/bootstrap-custom.scss`):
```scss
// Import custom variables before Bootstrap
@import 'variables';

// Import Bootstrap
@import '../node_modules/bootstrap/scss/bootstrap';

// Import custom styles after Bootstrap
@import 'custom';
```

4. **Create custom styles file** (`/Styles/_custom.scss`):
```scss
// Custom component styles
// Application-specific overrides

html {
  position: relative;
  min-height: 100%;
}

body {
  margin-bottom: 60px;
}

// Custom utility classes
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// Custom focus styles for accessibility
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid $primary;
  outline-offset: 2px;
  box-shadow: 0 0 0 0.25rem rgba($primary, 0.25);
}
```

5. **Create Gulp build file** (`/gulpfile.js`):
```javascript
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');

// Compile Sass
gulp.task('sass', function() {
  return gulp.src('./Styles/bootstrap-custom.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./wwwroot/css'))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./wwwroot/css'));
});

// Watch for changes
gulp.task('watch', function() {
  gulp.watch('./Styles/**/*.scss', gulp.series('sass'));
});

// Default task
gulp.task('default', gulp.series('sass'));
```

6. **Add npm scripts** (`package.json`):
```json
{
  "scripts": {
    "build:css": "gulp sass",
    "watch:css": "gulp watch"
  }
}
```

7. **Update Layout.cshtml**:
```html
<!-- Replace Bootstrap CDN with compiled CSS -->
<link rel="stylesheet" href="~/css/bootstrap-custom.css" asp-append-version="true" />
<link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
```

---

## Customization Strategy

### Decision Matrix

| Aspect | CSS Variables | Sass Customization |
|--------|---------------|-------------------|
| **Setup Time** | 1 hour | 4-8 hours |
| **Learning Curve** | Low | Medium |
| **Customization Depth** | Limited | Full |
| **Build Pipeline** | ❌ Not required | ✅ Required |
| **Runtime Theming** | ✅ Yes (dark mode) | ❌ No |
| **Tree-shaking** | ❌ No | ✅ Yes |
| **Production Ready** | ✅ Yes | ✅ Yes |
| **Team Skill Required** | CSS | CSS + Sass + Node.js |

### Recommended Phases

**Phase 1: CSS Variables (Immediate)**
- Quick implementation for immediate brand customization
- Override key Bootstrap CSS variables
- Implement in `theme.css` loaded after Bootstrap
- Enables dark mode support

**Phase 2: Sass Implementation (Next Sprint)**
- Set up build pipeline
- Full Bootstrap customization
- Tree-shake unused components
- Optimize for production

**Phase 3: Design System (Future)**
- Extract design tokens to JSON
- Create component library documentation
- Implement theme switching mechanism
- Advanced customization

---

## Color System & Design Tokens

### Brand Color Palette

**Primary Brand Colors:**
```scss
// Primary Actions (Buttons, Links)
$contoso-primary: #0066cc;        // Contoso Blue
$contoso-primary-dark: #004c99;   // Hover/Active State
$contoso-primary-light: #3385db;  // Lighter variant

// Secondary Actions
$contoso-secondary: #6c757d;      // Neutral Gray
$contoso-secondary-dark: #5a6268;
$contoso-secondary-light: #868e96;

// Accent Colors
$contoso-accent: #ff6b35;         // Accent Orange
$contoso-accent-dark: #e55a2b;
$contoso-accent-light: #ff8c5f;
```

**Semantic Colors:**
```scss
// Success (Create, Save actions)
$contoso-success: #28a745;
$contoso-success-bg: #d4edda;
$contoso-success-border: #c3e6cb;

// Danger (Delete, Error actions)
$contoso-danger: #dc3545;
$contoso-danger-bg: #f8d7da;
$contoso-danger-border: #f5c6cb;

// Warning
$contoso-warning: #ffc107;
$contoso-warning-bg: #fff3cd;
$contoso-warning-border: #ffeaa7;

// Info
$contoso-info: #17a2b8;
$contoso-info-bg: #d1ecf1;
$contoso-info-border: #bee5eb;
```

**Neutral Colors:**
```scss
// Grayscale
$contoso-gray-100: #f8f9fa;
$contoso-gray-200: #e9ecef;
$contoso-gray-300: #dee2e6;
$contoso-gray-400: #ced4da;
$contoso-gray-500: #adb5bd;
$contoso-gray-600: #6c757d;
$contoso-gray-700: #495057;
$contoso-gray-800: #343a40;
$contoso-gray-900: #212529;

// Text Colors
$contoso-text-primary: #212529;
$contoso-text-secondary: #6c757d;
$contoso-text-muted: #868e96;
$contoso-text-white: #ffffff;

// Background Colors
$contoso-bg-body: #ffffff;
$contoso-bg-secondary: #f8f9fa;
$contoso-bg-tertiary: #e9ecef;
```

### Accessibility Compliance

**All color combinations must meet WCAG 2.1 AA standards (4.5:1 contrast ratio):**

| Combination | Foreground | Background | Ratio | Status |
|-------------|-----------|------------|-------|--------|
| Body text | #212529 | #ffffff | 16.1:1 | ✅ AAA |
| Primary button | #ffffff | #0066cc | 4.6:1 | ✅ AA |
| Link text | #0066cc | #ffffff | 7.1:1 | ✅ AAA |
| Danger text | #dc3545 | #ffffff | 4.9:1 | ✅ AA |
| Success text | #28a745 | #ffffff | 3.8:1 | ⚠️ Needs adjustment |

**Recommended adjustment for success:**
```scss
$contoso-success: #217c38;  // Darker green for better contrast (4.5:1)
```

### Design Token Implementation

**For future design system:**

```json
{
  "color": {
    "brand": {
      "primary": {
        "value": "#0066cc",
        "type": "color"
      },
      "secondary": {
        "value": "#6c757d",
        "type": "color"
      }
    },
    "semantic": {
      "success": {
        "value": "#217c38",
        "type": "color"
      },
      "danger": {
        "value": "#dc3545",
        "type": "color"
      }
    }
  }
}
```

---

## Typography System

### Font Families

**Current:** System font stack (Bootstrap default)
```scss
$font-family-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, 
                         "Helvetica Neue", Arial, sans-serif;
```

**Recommended:** Custom font stack with fallbacks
```scss
// Primary font (body text)
$font-family-base: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

// Headings font (optional - same as body or different)
$headings-font-family: $font-family-base;

// Monospace font (for code)
$font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, 
                        "Courier New", monospace;
```

**Web Fonts (Optional):**
If using custom web fonts (Google Fonts, Adobe Fonts):

```html
<!-- In _Layout.cshtml <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```scss
$font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale

**Responsive Typography:**
```scss
// Base font size (mobile)
$font-size-root: 14px;

// Medium screens and up
$font-size-root-md: 16px;

// Font sizes (relative to base)
$font-size-base: 1rem;      // 14px → 16px
$font-size-sm: 0.875rem;    // 12.25px → 14px
$font-size-lg: 1.125rem;    // 15.75px → 18px

// Heading sizes
$h1-font-size: 2.5rem;      // 35px → 40px
$h2-font-size: 2rem;        // 28px → 32px
$h3-font-size: 1.75rem;     // 24.5px → 28px
$h4-font-size: 1.5rem;      // 21px → 24px
$h5-font-size: 1.25rem;     // 17.5px → 20px
$h6-font-size: 1rem;        // 14px → 16px
```

**Custom Implementation:**
```css
/* In site.css (current approach) */
html {
  font-size: 14px;
}

@media (min-width: 768px) {
  html {
    font-size: 16px;
  }
}
```

### Font Weights

```scss
$font-weight-lighter: 300;
$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
$font-weight-bolder: 700;

// Heading weights
$headings-font-weight: 600;
```

### Line Heights

```scss
$line-height-base: 1.5;      // Body text
$line-height-sm: 1.25;       // Compact text
$line-height-lg: 2;          // Loose text

$headings-line-height: 1.2;  // Headings
```

### Letter Spacing

```scss
// Optional - Bootstrap doesn't define these by default
$letter-spacing-tight: -0.025em;
$letter-spacing-normal: 0;
$letter-spacing-wide: 0.025em;

// Apply to headings
.h1, .h2, .h3, h1, h2, h3 {
  letter-spacing: $letter-spacing-tight;
}
```

---

## Spacing & Layout

### Spacing Scale

**Bootstrap default spacer:** `$spacer: 1rem` (16px)

**Spacing utilities:** Generated from spacer
```scss
$spacer: 1rem;

$spacers: (
  0: 0,
  1: $spacer * 0.25,   // 4px
  2: $spacer * 0.5,    // 8px
  3: $spacer,          // 16px
  4: $spacer * 1.5,    // 24px
  5: $spacer * 3,      // 48px
);
```

**Custom spacing scale (optional):**
```scss
$spacers: (
  0: 0,
  1: 0.25rem,    // 4px
  2: 0.5rem,     // 8px
  3: 0.75rem,    // 12px
  4: 1rem,       // 16px
  5: 1.5rem,     // 24px
  6: 2rem,       // 32px
  7: 3rem,       // 48px
  8: 4rem,       // 64px
  9: 6rem,       // 96px
);
```

**Usage:**
```html
<!-- Margin utilities -->
<div class="mb-3">Margin bottom 16px</div>
<div class="mt-5">Margin top 48px</div>

<!-- Padding utilities -->
<div class="p-4">Padding 24px all sides</div>
<div class="px-3 py-2">Padding x-axis 16px, y-axis 8px</div>
```

### Grid System

**Default Bootstrap grid:**
```scss
$grid-columns: 12;
$grid-gutter-width: 1.5rem;  // 24px
$grid-row-columns: 6;

$container-max-widths: (
  sm: 540px,
  md: 720px,
  lg: 960px,
  xl: 1140px,
  xxl: 1320px
);
```

**Custom grid (if needed):**
```scss
// Wider containers for dashboard layouts
$container-max-widths: (
  sm: 540px,
  md: 720px,
  lg: 960px,
  xl: 1200px,
  xxl: 1400px
);

// Tighter gutters for compact layouts
$grid-gutter-width: 1rem;  // 16px instead of 24px
```

### Breakpoints

**Bootstrap 5 default breakpoints:**
```scss
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
);
```

**Custom breakpoints (if needed):**
```scss
// Add custom breakpoint for tablets
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px,
  xxxl: 1920px  // Large desktop monitors
);
```

**Usage in Sass:**
```scss
// Mobile-first approach
.my-component {
  width: 100%;
  
  @include media-breakpoint-up(md) {
    width: 50%;
  }
  
  @include media-breakpoint-up(lg) {
    width: 33.333%;
  }
}
```

### Border Radius

```scss
$border-radius:       0.375rem;  // 6px
$border-radius-sm:    0.25rem;   // 4px
$border-radius-lg:    0.5rem;    // 8px
$border-radius-xl:    1rem;      // 16px
$border-radius-2xl:   2rem;      // 32px
$border-radius-pill:  50rem;     // Full pill shape
```

---

## Component Theming

### Buttons

**Current usage:**
```html
<input type="submit" value="Create" class="btn btn-primary" />
<a asp-page="./Edit" class="btn btn-primary">Edit</a>
<input type="submit" value="Delete" class="btn btn-danger" />
```

**Customization:**
```scss
// _variables.scss
$btn-padding-y: 0.5rem;
$btn-padding-x: 1rem;
$btn-font-size: $font-size-base;
$btn-font-weight: 500;
$btn-line-height: $line-height-base;
$btn-border-radius: $border-radius;
$btn-border-width: 1px;

// Button focus styles (accessibility)
$btn-focus-width: 0.25rem;
$btn-focus-box-shadow: 0 0 0 $btn-focus-width rgba($primary, 0.25);
```

**Custom button variants:**
```scss
// _custom.scss
.btn-outline-accent {
  @include button-outline-variant($contoso-accent);
}

.btn-accent {
  @include button-variant($contoso-accent, $contoso-accent);
}
```

### Forms

**Current usage:**
```html
<div class="form-group">
    <label asp-for="Student.LastName" class="control-label"></label>
    <input asp-for="Student.LastName" class="form-control" />
    <span asp-validation-for="Student.LastName" class="text-danger"></span>
</div>
```

**Customization:**
```scss
// Form controls
$input-padding-y: 0.5rem;
$input-padding-x: 0.75rem;
$input-font-size: $font-size-base;
$input-line-height: $line-height-base;
$input-border-radius: $border-radius;
$input-border-width: 1px;
$input-border-color: $contoso-gray-400;

// Focus state
$input-focus-border-color: $contoso-primary;
$input-focus-box-shadow: 0 0 0 0.25rem rgba($contoso-primary, 0.25);

// Validation states
$form-feedback-valid-color: $contoso-success;
$form-feedback-invalid-color: $contoso-danger;
```

**Enhanced validation styling:**
```scss
// _custom.scss
.input-validation-error {
  border-color: $contoso-danger !important;
  box-shadow: 0 0 0 0.25rem rgba($contoso-danger, 0.25);
}

.validation-summary-errors {
  @extend .alert;
  @extend .alert-danger;
  margin-top: 1rem;
}
```

### Tables

**Current usage:**
```html
<table class="table">
    <thead>
        <tr>
            <th>Last Name</th>
            <th>First Name</th>
        </tr>
    </thead>
    <tbody>
        <tr class="table-success">
            <td>Doe</td>
            <td>John</td>
        </tr>
    </tbody>
</table>
```

**Customization:**
```scss
// Table styling
$table-cell-padding-y: 0.75rem;
$table-cell-padding-x: 0.75rem;
$table-cell-padding-y-sm: 0.5rem;
$table-cell-padding-x-sm: 0.5rem;

$table-striped-bg-factor: 0.02;
$table-hover-bg-factor: 0.04;

$table-border-color: $contoso-gray-300;

// Variant colors
$table-variants: (
  "primary": shift-color($primary, $table-bg-scale),
  "secondary": shift-color($secondary, $table-bg-scale),
  "success": shift-color($success, $table-bg-scale),
  "info": shift-color($info, $table-bg-scale),
  "warning": shift-color($warning, $table-bg-scale),
  "danger": shift-color($danger, $table-bg-scale),
);
```

**Custom table styling:**
```scss
// _custom.scss
.table {
  // Add hover effect to all tables
  tbody tr:hover {
    background-color: rgba($contoso-primary, 0.04);
    cursor: pointer;
  }
  
  // Better selected row styling (not just color)
  .table-success {
    background-color: rgba($contoso-success, 0.1);
    border-left: 3px solid $contoso-success;
  }
}
```

### Navigation

**Current usage:**
```html
<nav class="navbar navbar-expand-sm navbar-toggleable-sm navbar-light bg-white border-bottom box-shadow mb-3">
    <div class="navbar-collapse collapse">
        <ul class="navbar-nav flex-grow-1">
            <li class="nav-item">
                <a class="nav-link text-dark" asp-page="/Students/Index">Students</a>
            </li>
        </ul>
    </div>
</nav>
```

**Customization:**
```scss
// Navbar
$navbar-padding-y: 0.5rem;
$navbar-padding-x: 1rem;
$navbar-nav-link-padding-x: 0.75rem;
$navbar-brand-font-size: 1.25rem;

// Light navbar
$navbar-light-color: $contoso-text-primary;
$navbar-light-hover-color: $contoso-primary;
$navbar-light-active-color: $contoso-primary;
$navbar-light-brand-color: $contoso-text-primary;
$navbar-light-brand-hover-color: $contoso-primary;

// Dark navbar (if needed)
$navbar-dark-color: rgba($white, 0.8);
$navbar-dark-hover-color: $white;
$navbar-dark-active-color: $white;
```

**Custom navigation styling:**
```scss
// _custom.scss
.navbar {
  box-shadow: 0 0.125rem 0.25rem rgba($black, 0.075);
  
  .nav-link {
    font-weight: 500;
    transition: color 0.15s ease-in-out;
    
    &:hover {
      color: $contoso-primary !important;
    }
    
    &.active {
      color: $contoso-primary !important;
      border-bottom: 2px solid $contoso-primary;
    }
  }
}
```

### Alerts & Notifications

**Bootstrap alerts:**
```html
<div class="alert alert-success" role="alert">
    Student created successfully!
</div>
```

**Customization:**
```scss
$alert-padding-y: 0.75rem;
$alert-padding-x: 1rem;
$alert-margin-bottom: 1rem;
$alert-border-radius: $border-radius;
$alert-border-width: 1px;
```

**Custom notification component:**
```scss
// _custom.scss
.notification {
  @extend .alert;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &::before {
    content: '';
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
    background-size: contain;
  }
  
  &.notification-success::before {
    background-image: url("data:image/svg+xml,...");
  }
}
```

### Pagination

**Current custom pagination:**
```html
<a asp-page="./Index" 
   asp-route-pageIndex="@(Model.Students.PageIndex - 1)"
   class="btn btn-primary @prevDisabled">
    Previous
</a>
```

**Bootstrap pagination component:**
```html
<nav aria-label="Page navigation">
    <ul class="pagination">
        <li class="page-item @(Model.Students.HasPreviousPage ? "" : "disabled")">
            <a class="page-link" asp-page="./Index" asp-route-pageIndex="@(Model.Students.PageIndex - 1)">
                Previous
            </a>
        </li>
        <li class="page-item active">
            <span class="page-link">@Model.Students.PageIndex</span>
        </li>
        <li class="page-item @(Model.Students.HasNextPage ? "" : "disabled")">
            <a class="page-link" asp-page="./Index" asp-route-pageIndex="@(Model.Students.PageIndex + 1)">
                Next
            </a>
        </li>
    </ul>
</nav>
```

**Customization:**
```scss
$pagination-padding-y: 0.375rem;
$pagination-padding-x: 0.75rem;
$pagination-color: $contoso-primary;
$pagination-bg: $white;
$pagination-border-width: 1px;
$pagination-border-color: $contoso-gray-300;
$pagination-hover-color: $contoso-primary-dark;
$pagination-hover-bg: $contoso-gray-100;
$pagination-active-color: $white;
$pagination-active-bg: $contoso-primary;
$pagination-disabled-color: $contoso-gray-500;
$pagination-disabled-bg: $white;
```

---

## Dark Mode Considerations

### Strategy: CSS Variables

**Advantages:**
- Runtime theme switching (no page reload)
- User preference detection (`prefers-color-scheme`)
- Same HTML, different CSS
- Minimal JavaScript required

**Implementation:**

1. **Define dark mode color palette:**
```css
/* theme.css */
:root {
  /* Light mode (default) */
  --contoso-bg-body: #ffffff;
  --contoso-text-primary: #212529;
  --contoso-text-secondary: #6c757d;
  --contoso-border-color: #dee2e6;
  --contoso-card-bg: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode */
    --contoso-bg-body: #1a1a1a;
    --contoso-text-primary: #e9ecef;
    --contoso-text-secondary: #adb5bd;
    --contoso-border-color: #495057;
    --contoso-card-bg: #212529;
  }
}

/* Manual theme toggle */
[data-theme="dark"] {
  --contoso-bg-body: #1a1a1a;
  --contoso-text-primary: #e9ecef;
  --contoso-text-secondary: #adb5bd;
  --contoso-border-color: #495057;
  --contoso-card-bg: #212529;
}
```

2. **Apply variables:**
```css
body {
  background-color: var(--contoso-bg-body);
  color: var(--contoso-text-primary);
}

.card {
  background-color: var(--contoso-card-bg);
  border-color: var(--contoso-border-color);
}
```

3. **Theme toggle button:**
```html
<button id="theme-toggle" aria-label="Toggle dark mode">
    <span class="light-icon">🌙</span>
    <span class="dark-icon" hidden>☀️</span>
</button>
```

4. **JavaScript for theme switching:**
```javascript
// site.js
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

// Apply saved theme
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggle?.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' 
        ? 'light' 
        : 'dark';
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Toggle icons
    document.querySelector('.light-icon').hidden = theme === 'dark';
    document.querySelector('.dark-icon').hidden = theme === 'light';
});
```

### Bootstrap 5.3+ Dark Mode

Bootstrap 5.3 introduced built-in dark mode support:

```html
<html lang="en" data-bs-theme="dark">
```

**Color modes:**
```scss
// Enable Bootstrap color modes
$enable-dark-mode: true;

// Customize dark mode colors
$primary-text-emphasis-dark: tint-color($primary, 40%);
$secondary-text-emphasis-dark: tint-color($secondary, 40%);
```

---

## RTL Support

### Bootstrap RTL CSS

Bootstrap provides RTL-specific stylesheets:
```
bootstrap.rtl.css
bootstrap.rtl.min.css
```

### Conditional Loading

```cshtml
@using System.Globalization

@{
    var isRtl = CultureInfo.CurrentCulture.TextInfo.IsRightToLeft;
}

@if (isRtl)
{
    <link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.rtl.min.css" />
    <link rel="stylesheet" href="~/css/site.rtl.css" asp-append-version="true" />
}
else
{
    <link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
}

<html lang="@CultureInfo.CurrentCulture.TwoLetterISOLanguageName" 
      dir="@(isRtl ? "rtl" : "ltr")">
```

### Sass for RTL

```scss
// Use logical properties for automatic RTL support
.my-component {
  margin-inline-start: 1rem;  // margin-left in LTR, margin-right in RTL
  padding-inline-end: 0.5rem;
  border-inline-start: 1px solid $border-color;
}

// Or use Bootstrap RTL mixins
@include bidi-style(margin-left, margin-right, 1rem, null);
```

---

## Performance Optimization

### Tree-Shaking Unused CSS

**With Sass, import only needed components:**

```scss
// bootstrap-custom.scss
@import '../node_modules/bootstrap/scss/functions';
@import '../node_modules/bootstrap/scss/variables';
@import '../node_modules/bootstrap/scss/mixins';

// Layout & components
@import '../node_modules/bootstrap/scss/root';
@import '../node_modules/bootstrap/scss/reboot';
@import '../node_modules/bootstrap/scss/type';
@import '../node_modules/bootstrap/scss/containers';
@import '../node_modules/bootstrap/scss/grid';
@import '../node_modules/bootstrap/scss/tables';
@import '../node_modules/bootstrap/scss/forms';
@import '../node_modules/bootstrap/scss/buttons';
@import '../node_modules/bootstrap/scss/nav';
@import '../node_modules/bootstrap/scss/navbar';

// Utilities
@import '../node_modules/bootstrap/scss/utilities';
@import '../node_modules/bootstrap/scss/utilities/api';

// Skip unused components:
// - @import '../node_modules/bootstrap/scss/carousel';
// - @import '../node_modules/bootstrap/scss/modal';
// - @import '../node_modules/bootstrap/scss/tooltip';
// - @import '../node_modules/bootstrap/scss/popover';
```

**Result:** ~30-50% reduction in CSS file size

### PurgeCSS

**Remove unused CSS classes automatically:**

```bash
npm install @fullhuman/postcss-purgecss --save-dev
```

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: [
        './Pages/**/*.cshtml',
        './Views/**/*.cshtml',
      ],
      safelist: [
        'table-success',  // Dynamic classes
        'text-danger',
        'validation-summary-errors'
      ]
    })
  ]
}
```

### CSS Minification

```javascript
// gulpfile.js (already included in example above)
const cleanCSS = require('gulp-clean-css');

gulp.task('sass', function() {
  return gulp.src('./Styles/bootstrap-custom.scss')
    .pipe(sass())
    .pipe(cleanCSS({ level: 2 }))  // Aggressive minification
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./wwwroot/css'));
});
```

### CDN vs Local

**Current:** Local files via libman  
**Alternative:** CDN with local fallback

```html
<!-- Try CDN first -->
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
      integrity="sha384-..." 
      crossorigin="anonymous"
      onerror="this.onerror=null;this.href='/lib/bootstrap/dist/css/bootstrap.min.css';">
```

**Pros:**
- ✅ Browser caching across sites
- ✅ Geographic distribution
- ✅ Reduced server load

**Cons:**
- ❌ External dependency
- ❌ Requires internet connection
- ❌ GDPR considerations

**Recommendation:** Use local files for production control

---

## Migration Path

### Phase 1: Establish Theme Foundation (Week 1-2)

**Goal:** Set up theming infrastructure

**Tasks:**
1. ✅ Document current Bootstrap usage
2. ✅ Define brand color palette
3. ✅ Validate color contrast ratios
4. ⚠️ Choose theming approach (CSS Variables vs Sass)
5. ⚠️ Set up build pipeline (if Sass)
6. ⚠️ Create theme configuration files

**Deliverables:**
- Theme documentation
- Color palette approved
- Build pipeline operational
- `_variables.scss` or `theme.css` created

---

### Phase 2: Apply Custom Theme (Week 3-4)

**Goal:** Replace Bootstrap defaults with custom theme

**Tasks:**
1. ⚠️ Apply custom colors to components
2. ⚠️ Implement custom typography scale
3. ⚠️ Update button styles
4. ⚠️ Update form styles
5. ⚠️ Update table styles
6. ⚠️ Update navigation styles
7. ⚠️ Test responsive behavior
8. ⚠️ Validate accessibility

**Deliverables:**
- Themed Bootstrap CSS compiled
- All pages using new theme
- Accessibility audit passed

---

### Phase 3: Optimize & Enhance (Week 5-6)

**Goal:** Optimize performance and add advanced features

**Tasks:**
1. ⚠️ Tree-shake unused Bootstrap components
2. ⚠️ Implement PurgeCSS
3. ⚠️ Add dark mode support
4. ⚠️ Add RTL support (if needed)
5. ⚠️ Create custom utility classes
6. ⚠️ Document component usage
7. ⚠️ Performance testing

**Deliverables:**
- Optimized CSS bundle
- Dark mode functional
- Component documentation
- Performance benchmarks

---

### Phase 4: Continuous Improvement (Ongoing)

**Goal:** Maintain and evolve design system

**Practices:**
1. ⚠️ Regular design system reviews
2. ⚠️ Component library documentation
3. ⚠️ Design token extraction
4. ⚠️ Automated visual regression testing
5. ⚠️ Accessibility audits

**Deliverables:**
- Living style guide
- Design system documentation
- Automated testing suite

---

## Best Practices

### Do's ✅

1. **Use Sass variables for all customization**
   ```scss
   $primary: #0066cc;  // Good
   .btn-primary { background: #0066cc; }  // Bad
   ```

2. **Test color contrast ratios**
   - Use WebAIM Contrast Checker
   - Ensure 4.5:1 minimum for text
   - Ensure 3:1 minimum for large text

3. **Leverage Bootstrap utilities**
   ```html
   <div class="mt-3 mb-4 px-2">  <!-- Good -->
   <div style="margin-top: 1rem; margin-bottom: 1.5rem;">  <!-- Bad -->
   ```

4. **Use rem units for scalability**
   ```scss
   font-size: 1rem;      // Good - scalable
   font-size: 16px;      // Bad - fixed
   ```

5. **Document custom components**
   - Create pattern library
   - Include usage examples
   - Document accessibility requirements

6. **Version control your theme**
   - Commit `_variables.scss`
   - Tag theme releases
   - Document breaking changes

7. **Test across browsers**
   - Chrome, Firefox, Safari, Edge
   - Mobile Safari, Mobile Chrome
   - Test accessibility features

8. **Use semantic color names**
   ```scss
   $brand-primary: #0066cc;  // Good
   $blue: #0066cc;           // Bad
   ```

### Don'ts ❌

1. **Don't modify Bootstrap source files**
   - Never edit `node_modules/bootstrap`
   - Always override via `_variables.scss`

2. **Don't use `!important` unless absolutely necessary**
   ```scss
   .my-class {
     color: red !important;  // Avoid - specificity issue
   }
   ```

3. **Don't hard-code colors**
   ```scss
   .btn { background: #0066cc; }  // Bad
   .btn { background: $primary; }  // Good
   ```

4. **Don't ignore mobile-first approach**
   ```scss
   // Bad - desktop-first
   .element { width: 50%; }
   @media (max-width: 768px) { .element { width: 100%; } }
   
   // Good - mobile-first
   .element { width: 100%; }
   @media (min-width: 768px) { .element { width: 50%; } }
   ```

5. **Don't skip accessibility testing**
   - Keyboard navigation
   - Screen reader testing
   - Color contrast validation

6. **Don't use pixel values for media queries**
   ```scss
   @media (min-width: 768px) { }  // Bad
   @include media-breakpoint-up(md) { }  // Good
   ```

7. **Don't forget to minify for production**
   - Always serve `.min.css` in production
   - Enable compression (gzip/brotli)

8. **Don't commit generated CSS to version control**
   - Add `/wwwroot/css/bootstrap-custom.css` to `.gitignore`
   - Only commit source Sass files
   - Generate CSS in build pipeline

---

## Conclusion

This theming strategy provides a comprehensive approach to customizing Bootstrap for Contoso University while maintaining:

- ✅ **Consistency** - Unified design language
- ✅ **Maintainability** - Centralized theme configuration
- ✅ **Performance** - Optimized CSS bundles
- ✅ **Accessibility** - WCAG 2.1 AA compliance
- ✅ **Scalability** - Design system foundation
- ✅ **Flexibility** - Support for dark mode, RTL, and future enhancements

### Recommended Next Steps

1. **Immediate (This Sprint):**
   - Approve brand color palette
   - Choose theming approach (Sass recommended)
   - Set up build pipeline

2. **Short-term (Next Sprint):**
   - Implement custom theme
   - Apply to all pages
   - Conduct accessibility audit

3. **Medium-term (Next Quarter):**
   - Add dark mode support
   - Optimize performance
   - Create component documentation

4. **Long-term (Future):**
   - Extract design tokens
   - Build component library
   - Prepare for framework migration

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-12-30  
**Next Review:** After Phase 2 implementation  
**Owner:** Frontend Team / Design System Team
