# Design Tokens & SCSS Variables - React TypeScript Bootstrap Migration

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Engineering Team  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Design Tokens Overview](#design-tokens-overview)
- [Current Branding Palette](#current-branding-palette)
- [Design Token Definitions](#design-token-definitions)
  - [Color Tokens](#color-tokens)
  - [Spacing Tokens](#spacing-tokens)
  - [Typography Tokens](#typography-tokens)
  - [Breakpoint Tokens](#breakpoint-tokens)
  - [Border & Shadow Tokens](#border--shadow-tokens)
  - [Z-Index Tokens](#z-index-tokens)
- [Bootstrap SCSS Variable Mapping](#bootstrap-scss-variable-mapping)
- [SCSS Override Files Structure](#scss-override-files-structure)
- [Import Order & Configuration](#import-order--configuration)
- [SCSS Override Examples](#scss-override-examples)
- [Theming Guidelines](#theming-guidelines)
- [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

This document defines the **design token system** for the Contoso University migration from ASP.NET Core Razor Pages to React TypeScript with Bootstrap 5. Design tokens provide a single source of truth for design decisions (colors, spacing, typography, etc.) and enable consistent theming across the application.

**Key Objectives:**
- Extract current branding and design values from existing implementation
- Define semantic design tokens that map to Bootstrap SCSS variables
- Establish a scalable theming system for the React/TypeScript frontend
- Document override patterns and import order for proper SCSS compilation
- Enable future design system evolution without breaking changes

**Current State:**
- Bootstrap 5.x defaults with minimal customization
- Base font size: 14px (mobile), 16px (desktop)
- Default Bootstrap color palette
- No custom design token system

**Target State:**
- Comprehensive design token definitions
- Custom SCSS variable overrides for branding
- Proper import order for theme customization
- React-compatible CSS modules or styled-components integration

---

## Design Tokens Overview

### What are Design Tokens?

Design tokens are **named entities** that store visual design attributes. They abstract design decisions into reusable, technology-agnostic values.

**Benefits:**
- **Consistency:** Single source of truth for design values
- **Maintainability:** Update once, apply everywhere
- **Scalability:** Easy to add themes (dark mode, high contrast, etc.)
- **Collaboration:** Designers and developers speak the same language
- **Automation:** Tokens can be generated from design tools (Figma, Sketch)

### Token Hierarchy

```
Global Tokens (Primitive Values)
    ↓
Alias Tokens (Semantic Names)
    ↓
Component Tokens (Component-Specific)
```

**Example:**
```scss
// Global Token
$color-blue-500: #0d6efd;

// Alias Token (Semantic)
$color-primary: $color-blue-500;

// Component Token
$button-primary-bg: $color-primary;
```

### Token Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Color** | Brand colors, semantic colors, grayscale | Primary, secondary, success, danger, neutral-100 |
| **Spacing** | Margins, padding, gaps | 4px, 8px, 16px, 24px, 32px, 48px |
| **Typography** | Font sizes, line heights, font families | 14px, 16px, 18px, 24px, 1.5, "Segoe UI" |
| **Breakpoint** | Responsive design breakpoints | 576px, 768px, 992px, 1200px, 1400px |
| **Border** | Border radius, widths | 4px, 8px, 12px, 1px, 2px |
| **Shadow** | Box shadows, elevation | 0 2px 4px rgba(0,0,0,0.1) |
| **Z-Index** | Stacking order | 1000 (dropdown), 1050 (modal) |

---

## Current Branding Palette

### Extracted from Current Implementation

Based on the existing Contoso University application, the following branding values are currently in use:

#### Colors

**Primary Colors (Bootstrap Defaults):**
- **Primary Blue:** `#0d6efd` - Used for primary actions, links
- **Secondary Gray:** `#6c757d` - Used for secondary elements
- **Success Green:** `#198754` - Used for success messages, positive actions
- **Danger Red:** `#dc3545` - Used for errors, delete actions
- **Warning Yellow:** `#ffc107` - Used for warnings
- **Info Cyan:** `#0dcaf0` - Used for informational messages

**Neutral Colors:**
- **Black (Body Text):** `#212529`
- **Gray (Muted Text):** `#6c757d`
- **Light Gray (Borders):** `#dee2e6`
- **White (Backgrounds):** `#ffffff`

#### Typography

**Font Family:**
- Primary: System font stack (Segoe UI, Roboto, Helvetica, Arial, sans-serif)

**Font Sizes:**
- Base: 14px (mobile) → 16px (768px+)
- H1: ~2.5rem (40px at base 16px)
- H2: ~2rem (32px)
- H3: ~1.75rem (28px)
- H4: ~1.5rem (24px)
- H5: ~1.25rem (20px)
- H6: ~1rem (16px)

**Line Heights:**
- Base: 1.5 (Bootstrap default)
- Headings: 1.2

#### Spacing

**Current spacing (derived from Bootstrap):**
- 0: 0
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 1rem (16px)
- 4: 1.5rem (24px)
- 5: 3rem (48px)

#### Responsive Breakpoints

**Bootstrap 5 defaults (currently in use):**
- Extra Small: < 576px
- Small: ≥ 576px
- Medium: ≥ 768px
- Large: ≥ 992px
- Extra Large: ≥ 1200px
- Extra Extra Large: ≥ 1400px

---

## Design Token Definitions

### Color Tokens

#### Brand Colors

```scss
// Primary (Blue)
$color-primary-100: #cfe2ff;
$color-primary-200: #9ec5fe;
$color-primary-300: #6ea8fe;
$color-primary-400: #3d8bfd;
$color-primary-500: #0d6efd;  // Main brand color
$color-primary-600: #0a58ca;
$color-primary-700: #084298;
$color-primary-800: #052c65;
$color-primary-900: #031633;

// Secondary (Gray)
$color-secondary-100: #e2e3e5;
$color-secondary-200: #c4c8cb;
$color-secondary-300: #a7acb1;
$color-secondary-400: #899197;
$color-secondary-500: #6c757d;  // Main secondary color
$color-secondary-600: #565e64;
$color-secondary-700: #41464b;
$color-secondary-800: #2b2f32;
$color-secondary-900: #161719;
```

#### Semantic Colors

```scss
// Success (Green)
$color-success-100: #d1e7dd;
$color-success-200: #a3cfbb;
$color-success-300: #75b798;
$color-success-400: #479f76;
$color-success-500: #198754;  // Main success color
$color-success-600: #146c43;
$color-success-700: #0f5132;
$color-success-800: #0a3622;
$color-success-900: #051b11;

// Danger (Red)
$color-danger-100: #f8d7da;
$color-danger-200: #f1aeb5;
$color-danger-300: #ea868f;
$color-danger-400: #e35d6a;
$color-danger-500: #dc3545;  // Main danger color
$color-danger-600: #b02a37;
$color-danger-700: #842029;
$color-danger-800: #58151c;
$color-danger-900: #2c0b0e;

// Warning (Yellow)
$color-warning-100: #fff3cd;
$color-warning-200: #ffe69c;
$color-warning-300: #ffda6a;
$color-warning-400: #ffcd39;
$color-warning-500: #ffc107;  // Main warning color
$color-warning-600: #cc9a06;
$color-warning-700: #997404;
$color-warning-800: #664d03;
$color-warning-900: #332701;

// Info (Cyan)
$color-info-100: #cff4fc;
$color-info-200: #9eeaf9;
$color-info-300: #6edff6;
$color-info-400: #3dd5f3;
$color-info-500: #0dcaf0;  // Main info color
$color-info-600: #0aa2c0;
$color-info-700: #087990;
$color-info-800: #055160;
$color-info-900: #032830;
```

#### Neutral Colors (Grayscale)

```scss
$color-neutral-100: #f8f9fa;  // Lightest
$color-neutral-200: #e9ecef;
$color-neutral-300: #dee2e6;
$color-neutral-400: #ced4da;
$color-neutral-500: #adb5bd;
$color-neutral-600: #6c757d;
$color-neutral-700: #495057;
$color-neutral-800: #343a40;
$color-neutral-900: #212529;  // Darkest
$color-white: #ffffff;
$color-black: #000000;
```

#### Background & Surface Colors

```scss
$color-bg-default: $color-white;
$color-bg-secondary: $color-neutral-100;
$color-bg-tertiary: $color-neutral-200;
$color-surface-elevated: $color-white;
$color-surface-overlay: rgba(0, 0, 0, 0.5);
```

#### Text Colors

```scss
$color-text-primary: $color-neutral-900;
$color-text-secondary: $color-neutral-600;
$color-text-tertiary: $color-neutral-500;
$color-text-disabled: $color-neutral-400;
$color-text-inverse: $color-white;
$color-text-link: $color-primary-500;
$color-text-link-hover: $color-primary-700;
```

#### Border Colors

```scss
$color-border-default: $color-neutral-300;
$color-border-light: $color-neutral-200;
$color-border-strong: $color-neutral-400;
$color-border-inverse: $color-white;
```

#### State Colors

```scss
$color-focus: $color-primary-500;
$color-focus-ring: rgba(13, 110, 253, 0.25);
$color-hover-bg: $color-neutral-100;
$color-active-bg: $color-neutral-200;
$color-disabled-bg: $color-neutral-200;
$color-disabled-text: $color-neutral-500;
```

---

### Spacing Tokens

#### Base Spacing Scale

```scss
// Base unit: 4px
$spacing-0: 0;
$spacing-1: 0.25rem;   // 4px
$spacing-2: 0.5rem;    // 8px
$spacing-3: 0.75rem;   // 12px
$spacing-4: 1rem;      // 16px
$spacing-5: 1.5rem;    // 24px
$spacing-6: 2rem;      // 32px
$spacing-7: 2.5rem;    // 40px
$spacing-8: 3rem;      // 48px
$spacing-9: 3.5rem;    // 56px
$spacing-10: 4rem;     // 64px
$spacing-12: 6rem;     // 96px
$spacing-16: 8rem;     // 128px
```

#### Semantic Spacing

```scss
// Layout
$spacing-page-margin: $spacing-6;
$spacing-section-gap: $spacing-8;
$spacing-container-padding: $spacing-4;

// Components
$spacing-button-padding-x: $spacing-4;
$spacing-button-padding-y: $spacing-2;
$spacing-card-padding: $spacing-4;
$spacing-form-field-gap: $spacing-3;
$spacing-list-item-gap: $spacing-2;

// Micro-spacing
$spacing-icon-gap: $spacing-2;
$spacing-inline-gap: $spacing-1;
```

---

### Typography Tokens

#### Font Families

```scss
// Primary font stack (System fonts for performance)
$font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                   "Helvetica Neue", Arial, "Noto Sans", sans-serif, 
                   "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", 
                   "Noto Color Emoji";

// Monospace (for code)
$font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, 
                        "Liberation Mono", "Courier New", monospace;

// Headings (can be different from body)
$font-family-headings: $font-family-base;
```

#### Font Sizes

```scss
// Base font size
$font-size-base: 1rem;  // 16px

// Scale
$font-size-xs: 0.75rem;    // 12px
$font-size-sm: 0.875rem;   // 14px
$font-size-md: 1rem;       // 16px (base)
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.25rem;    // 20px
$font-size-2xl: 1.5rem;    // 24px
$font-size-3xl: 1.875rem;  // 30px
$font-size-4xl: 2.25rem;   // 36px
$font-size-5xl: 3rem;      // 48px

// Headings
$font-size-h1: 2.5rem;     // 40px
$font-size-h2: 2rem;       // 32px
$font-size-h3: 1.75rem;    // 28px
$font-size-h4: 1.5rem;     // 24px
$font-size-h5: 1.25rem;    // 20px
$font-size-h6: 1rem;       // 16px
```

#### Font Weights

```scss
$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
$font-weight-extrabold: 800;

// Semantic
$font-weight-body: $font-weight-normal;
$font-weight-heading: $font-weight-bold;
$font-weight-emphasis: $font-weight-semibold;
```

#### Line Heights

```scss
$line-height-none: 1;
$line-height-tight: 1.25;
$line-height-snug: 1.375;
$line-height-normal: 1.5;
$line-height-relaxed: 1.625;
$line-height-loose: 2;

// Semantic
$line-height-body: $line-height-normal;      // 1.5
$line-height-heading: $line-height-tight;    // 1.25
```

#### Letter Spacing

```scss
$letter-spacing-tighter: -0.05em;
$letter-spacing-tight: -0.025em;
$letter-spacing-normal: 0;
$letter-spacing-wide: 0.025em;
$letter-spacing-wider: 0.05em;
$letter-spacing-widest: 0.1em;
```

---

### Breakpoint Tokens

#### Responsive Breakpoints

```scss
// Mobile-first breakpoints
$breakpoint-xs: 0;
$breakpoint-sm: 576px;   // Small devices (landscape phones)
$breakpoint-md: 768px;   // Medium devices (tablets)
$breakpoint-lg: 992px;   // Large devices (desktops)
$breakpoint-xl: 1200px;  // Extra large devices (large desktops)
$breakpoint-xxl: 1400px; // Extra extra large devices (larger desktops)

// Container max-widths
$container-max-width-sm: 540px;
$container-max-width-md: 720px;
$container-max-width-lg: 960px;
$container-max-width-xl: 1140px;
$container-max-width-xxl: 1320px;
```

#### Breakpoint Map (for Bootstrap compatibility)

```scss
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
);

$container-max-widths: (
  sm: 540px,
  md: 720px,
  lg: 960px,
  xl: 1140px,
  xxl: 1320px
);
```

---

### Border & Shadow Tokens

#### Border Radius

```scss
$border-radius-none: 0;
$border-radius-sm: 0.25rem;    // 4px
$border-radius-md: 0.375rem;   // 6px (Bootstrap default)
$border-radius-lg: 0.5rem;     // 8px
$border-radius-xl: 1rem;       // 16px
$border-radius-2xl: 1.5rem;    // 24px
$border-radius-full: 9999px;   // Pill shape
```

#### Border Width

```scss
$border-width-0: 0;
$border-width-1: 1px;
$border-width-2: 2px;
$border-width-4: 4px;
$border-width-8: 8px;

// Semantic
$border-width-default: $border-width-1;
$border-width-thick: $border-width-2;
```

#### Box Shadows

```scss
// Elevation levels
$shadow-none: none;
$shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

// Bootstrap compatible
$box-shadow: $shadow-sm;
$box-shadow-lg: $shadow-lg;

// Focus ring
$shadow-focus: 0 0 0 0.25rem $color-focus-ring;
```

---

### Z-Index Tokens

```scss
// Z-index scale for stacking context
$z-index-dropdown: 1000;
$z-index-sticky: 1020;
$z-index-fixed: 1030;
$z-index-modal-backdrop: 1040;
$z-index-modal: 1050;
$z-index-popover: 1060;
$z-index-tooltip: 1070;
$z-index-toast: 1080;
```

---

## Bootstrap SCSS Variable Mapping

### Bootstrap Variable Override Map

This section maps our design tokens to Bootstrap's SCSS variables for seamless integration.

#### Colors

```scss
// Bootstrap color system
$primary:       $color-primary-500;
$secondary:     $color-secondary-500;
$success:       $color-success-500;
$info:          $color-info-500;
$warning:       $color-warning-500;
$danger:        $color-danger-500;
$light:         $color-neutral-100;
$dark:          $color-neutral-900;

// Body
$body-bg:       $color-bg-default;
$body-color:    $color-text-primary;

// Links
$link-color:                $color-text-link;
$link-decoration:           underline;
$link-hover-color:          $color-text-link-hover;
$link-hover-decoration:     underline;

// Borders
$border-color:              $color-border-default;
$border-width:              $border-width-default;
```

#### Typography

```scss
// Font families
$font-family-sans-serif:    $font-family-base;
$font-family-monospace:     $font-family-monospace;
$font-family-base:          $font-family-base;

// Font sizes
$font-size-base:            $font-size-md;
$font-size-sm:              $font-size-sm;
$font-size-lg:              $font-size-lg;

$h1-font-size:              $font-size-h1;
$h2-font-size:              $font-size-h2;
$h3-font-size:              $font-size-h3;
$h4-font-size:              $font-size-h4;
$h5-font-size:              $font-size-h5;
$h6-font-size:              $font-size-h6;

// Font weights
$font-weight-lighter:       $font-weight-light;
$font-weight-light:         $font-weight-light;
$font-weight-normal:        $font-weight-normal;
$font-weight-bold:          $font-weight-bold;
$font-weight-bolder:        $font-weight-extrabold;

$headings-font-weight:      $font-weight-heading;

// Line heights
$line-height-base:          $line-height-body;
$line-height-sm:            $line-height-tight;
$line-height-lg:            $line-height-relaxed;
```

#### Spacing

```scss
// Spacer scale
$spacer: 1rem;
$spacers: (
  0: 0,
  1: $spacing-1,
  2: $spacing-2,
  3: $spacing-4,
  4: $spacing-5,
  5: $spacing-8,
);
```

#### Grid & Breakpoints

```scss
// Grid breakpoints
$grid-breakpoints: (
  xs: $breakpoint-xs,
  sm: $breakpoint-sm,
  md: $breakpoint-md,
  lg: $breakpoint-lg,
  xl: $breakpoint-xl,
  xxl: $breakpoint-xxl
);

// Container max-widths
$container-max-widths: (
  sm: $container-max-width-sm,
  md: $container-max-width-md,
  lg: $container-max-width-lg,
  xl: $container-max-width-xl,
  xxl: $container-max-width-xxl
);
```

#### Borders & Shadows

```scss
// Border radius
$border-radius:             $border-radius-md;
$border-radius-sm:          $border-radius-sm;
$border-radius-lg:          $border-radius-lg;
$border-radius-pill:        $border-radius-full;

// Box shadows
$box-shadow:                $shadow-sm;
$box-shadow-sm:             $shadow-xs;
$box-shadow-lg:             $shadow-lg;
```

#### Components

```scss
// Buttons
$btn-padding-y:             $spacing-2;
$btn-padding-x:             $spacing-4;
$btn-font-size:             $font-size-base;
$btn-line-height:           $line-height-normal;
$btn-border-radius:         $border-radius-md;
$btn-box-shadow:            $shadow-sm;

// Forms
$input-padding-y:           $spacing-2;
$input-padding-x:           $spacing-3;
$input-font-size:           $font-size-base;
$input-line-height:         $line-height-normal;
$input-bg:                  $color-bg-default;
$input-border-color:        $color-border-default;
$input-border-radius:       $border-radius-md;
$input-focus-border-color:  $color-focus;
$input-focus-box-shadow:    $shadow-focus;

// Cards
$card-spacer-y:             $spacing-4;
$card-spacer-x:             $spacing-4;
$card-border-width:         $border-width-default;
$card-border-radius:        $border-radius-md;
$card-border-color:         $color-border-default;
$card-bg:                   $color-bg-default;
$card-box-shadow:           $shadow-sm;

// Modals
$modal-backdrop-bg:         $color-black;
$modal-backdrop-opacity:    0.5;
$modal-content-bg:          $color-bg-default;
$modal-content-border-color: $color-border-default;
$modal-content-border-radius: $border-radius-lg;
$modal-content-box-shadow:  $shadow-2xl;

// Navbar
$navbar-padding-y:          $spacing-2;
$navbar-padding-x:          $spacing-4;
$navbar-nav-link-padding-x: $spacing-3;
$navbar-brand-font-size:    $font-size-lg;

// Tables
$table-cell-padding-y:      $spacing-2;
$table-cell-padding-x:      $spacing-2;
$table-border-color:        $color-border-default;
```

---

## SCSS Override Files Structure

### Recommended Directory Structure

```
/src
  /styles
    /tokens
      _colors.scss          # Color tokens
      _spacing.scss         # Spacing tokens
      _typography.scss      # Typography tokens
      _breakpoints.scss     # Breakpoint tokens
      _borders.scss         # Border & shadow tokens
      _z-index.scss         # Z-index tokens
    /bootstrap
      _variables.scss       # Bootstrap variable overrides
      _custom.scss          # Custom Bootstrap extensions
    /components
      _buttons.scss         # Custom button styles
      _forms.scss           # Custom form styles
      _cards.scss           # Custom card styles
      _tables.scss          # Custom table styles
    /utilities
      _helpers.scss         # Utility classes
      _mixins.scss          # Custom mixins
    /themes
      _light.scss           # Light theme (default)
      _dark.scss            # Dark theme (future)
    main.scss               # Main entry point
    variables.scss          # Global variables import
```

### File Purposes

#### `/styles/tokens/*.scss`
Contains raw design token definitions. These are the source of truth for all design values.

#### `/styles/bootstrap/_variables.scss`
Overrides Bootstrap's default SCSS variables using design tokens. This file is imported **before** Bootstrap.

#### `/styles/bootstrap/_custom.scss`
Custom extensions to Bootstrap components that don't fit into variable overrides.

#### `/styles/components/*.scss`
Component-specific styles that extend or customize Bootstrap components.

#### `/styles/utilities/*.scss`
Helper classes, mixins, and utility functions.

#### `/styles/themes/*.scss`
Theme-specific overrides (for dark mode, high contrast, etc.).

#### `/styles/main.scss`
Main entry point that orchestrates imports in the correct order.

#### `/styles/variables.scss`
Aggregates all token files for easy import across the application.

---

## Import Order & Configuration

### Critical: Proper Import Order

The order of SCSS imports is **critical** for proper theming. Bootstrap must import **after** variable overrides but **before** custom component styles.

### Main SCSS Entry Point (`main.scss`)

```scss
// =============================================================================
// Contoso University - Main SCSS Entry Point
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Design Tokens (Primitive values)
// -----------------------------------------------------------------------------
@import 'tokens/colors';
@import 'tokens/spacing';
@import 'tokens/typography';
@import 'tokens/breakpoints';
@import 'tokens/borders';
@import 'tokens/z-index';

// -----------------------------------------------------------------------------
// 2. Bootstrap Variable Overrides
// -----------------------------------------------------------------------------
// This MUST come before Bootstrap imports to override default values
@import 'bootstrap/variables';

// -----------------------------------------------------------------------------
// 3. Bootstrap Core
// -----------------------------------------------------------------------------
// Import Bootstrap SCSS from node_modules
@import '~bootstrap/scss/bootstrap';

// Alternative: Selective imports (for smaller bundle size)
// @import '~bootstrap/scss/functions';
// @import '~bootstrap/scss/variables';
// @import '~bootstrap/scss/mixins';
// @import '~bootstrap/scss/root';
// @import '~bootstrap/scss/reboot';
// @import '~bootstrap/scss/type';
// @import '~bootstrap/scss/images';
// @import '~bootstrap/scss/containers';
// @import '~bootstrap/scss/grid';
// @import '~bootstrap/scss/tables';
// @import '~bootstrap/scss/forms';
// @import '~bootstrap/scss/buttons';
// @import '~bootstrap/scss/transitions';
// @import '~bootstrap/scss/dropdown';
// @import '~bootstrap/scss/button-group';
// @import '~bootstrap/scss/nav';
// @import '~bootstrap/scss/navbar';
// @import '~bootstrap/scss/card';
// @import '~bootstrap/scss/pagination';
// @import '~bootstrap/scss/badge';
// @import '~bootstrap/scss/alert';
// @import '~bootstrap/scss/close';
// @import '~bootstrap/scss/modal';
// @import '~bootstrap/scss/tooltip';
// @import '~bootstrap/scss/popover';
// @import '~bootstrap/scss/utilities';
// @import '~bootstrap/scss/utilities/api';

// -----------------------------------------------------------------------------
// 4. Custom Bootstrap Extensions
// -----------------------------------------------------------------------------
@import 'bootstrap/custom';

// -----------------------------------------------------------------------------
// 5. Utility Mixins & Functions
// -----------------------------------------------------------------------------
@import 'utilities/mixins';
@import 'utilities/helpers';

// -----------------------------------------------------------------------------
// 6. Component-Specific Styles
// -----------------------------------------------------------------------------
@import 'components/buttons';
@import 'components/forms';
@import 'components/cards';
@import 'components/tables';

// -----------------------------------------------------------------------------
// 7. Theme Overrides (Optional)
// -----------------------------------------------------------------------------
// For future dark mode or theme switching
// @import 'themes/dark';
```

### Global Variables File (`variables.scss`)

For use in React components via CSS Modules or Sass modules:

```scss
// =============================================================================
// Global Variables - Re-export tokens for component imports
// =============================================================================

// Re-export all token files
@forward 'tokens/colors';
@forward 'tokens/spacing';
@forward 'tokens/typography';
@forward 'tokens/breakpoints';
@forward 'tokens/borders';
@forward 'tokens/z-index';
```

### Using in React Components

**Option 1: CSS Modules**
```scss
// Button.module.scss
@use '@/styles/variables' as *;

.button {
  padding: $spacing-2 $spacing-4;
  background-color: $color-primary-500;
  color: $color-white;
  border-radius: $border-radius-md;
  font-size: $font-size-md;
  
  &:hover {
    background-color: $color-primary-600;
  }
}
```

**Option 2: Styled Components with SCSS**
```typescript
import styled from 'styled-components';

export const Button = styled.button`
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--color-primary-500);
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  
  &:hover {
    background-color: var(--color-primary-600);
  }
`;
```

---

## SCSS Override Examples

### Example 1: Color Customization

**File:** `/styles/tokens/_colors.scss`

```scss
// =============================================================================
// Color Design Tokens
// =============================================================================

// Brand Colors - Primary (Contoso University Blue)
$color-primary-500: #0d6efd;
$color-primary-600: #0a58ca;
$color-primary-700: #084298;

// Override Bootstrap primary color
$primary: $color-primary-500;

// Semantic colors
$color-text-primary: #212529;
$color-text-link: $color-primary-500;
$color-bg-default: #ffffff;
```

**File:** `/styles/bootstrap/_variables.scss`

```scss
// =============================================================================
// Bootstrap Variable Overrides
// =============================================================================

@import '../tokens/colors';

// Override Bootstrap color system
$primary:       $color-primary-500;
$secondary:     $color-secondary-500;
$success:       $color-success-500;
$danger:        $color-danger-500;
$warning:       $color-warning-500;
$info:          $color-info-500;

// Body colors
$body-bg:       $color-bg-default;
$body-color:    $color-text-primary;

// Link colors
$link-color:                $color-text-link;
$link-hover-color:          $color-primary-700;
```

### Example 2: Typography Customization

**File:** `/styles/tokens/_typography.scss`

```scss
// =============================================================================
// Typography Design Tokens
// =============================================================================

// Font families
$font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                   "Helvetica Neue", Arial, sans-serif;

// Font sizes
$font-size-base: 1rem;      // 16px
$font-size-h1: 2.5rem;      // 40px
$font-size-h2: 2rem;        // 32px

// Line heights
$line-height-base: 1.5;
$line-height-heading: 1.25;

// Font weights
$font-weight-normal: 400;
$font-weight-bold: 700;
```

**File:** `/styles/bootstrap/_variables.scss`

```scss
@import '../tokens/typography';

// Override Bootstrap typography
$font-family-sans-serif:    $font-family-base;
$font-size-base:            $font-size-base;
$line-height-base:          $line-height-base;

// Heading overrides
$h1-font-size:              $font-size-h1;
$h2-font-size:              $font-size-h2;
$headings-font-weight:      $font-weight-bold;
$headings-line-height:      $line-height-heading;
```

### Example 3: Spacing & Layout

**File:** `/styles/tokens/_spacing.scss`

```scss
// =============================================================================
// Spacing Design Tokens
// =============================================================================

// Base spacing scale (4px base)
$spacing-0: 0;
$spacing-1: 0.25rem;   // 4px
$spacing-2: 0.5rem;    // 8px
$spacing-3: 0.75rem;   // 12px
$spacing-4: 1rem;      // 16px
$spacing-5: 1.5rem;    // 24px
$spacing-6: 2rem;      // 32px
$spacing-8: 3rem;      // 48px
```

**File:** `/styles/bootstrap/_variables.scss`

```scss
@import '../tokens/spacing';

// Override Bootstrap spacer system
$spacer: 1rem;
$spacers: (
  0: 0,
  1: $spacing-1,
  2: $spacing-2,
  3: $spacing-4,
  4: $spacing-5,
  5: $spacing-8,
);

// Component spacing
$btn-padding-y: $spacing-2;
$btn-padding-x: $spacing-4;
$card-spacer-y: $spacing-4;
$card-spacer-x: $spacing-4;
```

### Example 4: Component Customization

**File:** `/styles/components/_buttons.scss`

```scss
// =============================================================================
// Custom Button Styles
// =============================================================================

@use '../variables' as *;

// Custom button variant
.btn-contoso {
  padding: $spacing-2 $spacing-6;
  background: linear-gradient(135deg, $color-primary-500 0%, $color-primary-700 100%);
  color: $color-white;
  border: none;
  border-radius: $border-radius-lg;
  font-weight: $font-weight-semibold;
  box-shadow: $shadow-md;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: $shadow-sm;
  }
  
  &:focus {
    outline: 2px solid $color-focus;
    outline-offset: 2px;
  }
}

// Button size variants
.btn-xs {
  padding: $spacing-1 $spacing-2;
  font-size: $font-size-xs;
}

.btn-2xl {
  padding: $spacing-4 $spacing-8;
  font-size: $font-size-xl;
}
```

### Example 5: Responsive Typography

**File:** `/styles/bootstrap/_custom.scss`

```scss
// =============================================================================
// Custom Bootstrap Extensions
// =============================================================================

@use '../tokens/breakpoints' as *;
@use '../tokens/typography' as *;

// Responsive font sizes
html {
  font-size: 14px;  // Mobile base
  
  @media (min-width: $breakpoint-md) {
    font-size: 16px;  // Desktop base
  }
}

// Fluid typography for headings
h1, .h1 {
  font-size: clamp(2rem, 5vw, $font-size-h1);
}

h2, .h2 {
  font-size: clamp(1.5rem, 4vw, $font-size-h2);
}

h3, .h3 {
  font-size: clamp(1.25rem, 3vw, $font-size-h3);
}
```

### Example 6: Dark Mode Theme (Future)

**File:** `/styles/themes/_dark.scss`

```scss
// =============================================================================
// Dark Theme Overrides
// =============================================================================

// This file is applied when dark mode is active
[data-theme="dark"] {
  // Color overrides
  --color-bg-default: #{$color-neutral-900};
  --color-text-primary: #{$color-neutral-100};
  --color-border-default: #{$color-neutral-700};
  
  // Bootstrap component overrides
  --bs-body-bg: #{$color-neutral-900};
  --bs-body-color: #{$color-neutral-100};
  --bs-border-color: #{$color-neutral-700};
  
  // Adjust shadows for dark backgrounds
  --bs-box-shadow: 0 0.5rem 1rem rgba(255, 255, 255, 0.15);
}
```

---

## Theming Guidelines

### 1. Use Semantic Tokens

**✅ Good:**
```scss
.card {
  background-color: $color-bg-default;
  color: $color-text-primary;
  border: 1px solid $color-border-default;
}
```

**❌ Bad:**
```scss
.card {
  background-color: #ffffff;
  color: #212529;
  border: 1px solid #dee2e6;
}
```

**Why:** Semantic tokens adapt to theme changes (dark mode, high contrast).

---

### 2. Maintain Token Hierarchy

Always define:
1. **Global tokens** (primitive values)
2. **Alias tokens** (semantic names)
3. **Component tokens** (component-specific)

**Example:**
```scss
// 1. Global token
$color-blue-500: #0d6efd;

// 2. Alias token
$color-primary: $color-blue-500;

// 3. Component token
$button-bg: $color-primary;
```

---

### 3. CSS Custom Properties for Runtime Theming

For dynamic theme switching, export tokens as CSS custom properties:

```scss
// In :root or [data-theme="light"]
:root {
  --color-primary: #{$color-primary-500};
  --color-bg-default: #{$color-bg-default};
  --color-text-primary: #{$color-text-primary};
  --spacing-4: #{$spacing-4};
  --font-size-base: #{$font-size-base};
}

// Then use in components
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-4);
  font-size: var(--font-size-base);
}
```

---

### 4. Avoid Magic Numbers

**✅ Good:**
```scss
.card {
  padding: $spacing-4;
  margin-bottom: $spacing-6;
  border-radius: $border-radius-md;
}
```

**❌ Bad:**
```scss
.card {
  padding: 16px;
  margin-bottom: 32px;
  border-radius: 6px;
}
```

---

### 5. Component Isolation

Keep component styles in separate files that import only what they need:

```scss
// components/Button.module.scss
@use '@/styles/variables' as *;

.button {
  // Component styles using tokens
}
```

---

### 6. Responsive Design with Breakpoint Tokens

**✅ Good:**
```scss
@use '@/styles/tokens/breakpoints' as *;

.hero {
  font-size: $font-size-2xl;
  
  @media (min-width: $breakpoint-md) {
    font-size: $font-size-4xl;
  }
  
  @media (min-width: $breakpoint-xl) {
    font-size: $font-size-5xl;
  }
}
```

**❌ Bad:**
```scss
.hero {
  font-size: 24px;
  
  @media (min-width: 768px) {
    font-size: 36px;
  }
  
  @media (min-width: 1200px) {
    font-size: 48px;
  }
}
```

---

### 7. Accessibility in Theming

Always ensure:
- **Color contrast:** Minimum 4.5:1 for text, 3:1 for UI components
- **Focus indicators:** Visible and high contrast
- **No color-only information:** Use icons or text alongside color

```scss
// Good: High contrast focus indicator
.button:focus {
  outline: 2px solid $color-focus;
  outline-offset: 2px;
  box-shadow: $shadow-focus;
}

// Good: Success state with icon, not just color
.success-message {
  color: $color-success-700;
  background-color: $color-success-100;
  border-left: 4px solid $color-success-500;
  
  &::before {
    content: "✓";
    margin-right: $spacing-2;
  }
}
```

---

### 8. Performance Considerations

**Tree-shaking:** Import only needed Bootstrap components:
```scss
// Instead of full Bootstrap
@import '~bootstrap/scss/bootstrap';

// Import selectively
@import '~bootstrap/scss/functions';
@import '~bootstrap/scss/variables';
@import '~bootstrap/scss/mixins';
@import '~bootstrap/scss/grid';
@import '~bootstrap/scss/buttons';
@import '~bootstrap/scss/forms';
// ... only what you need
```

**CSS-in-JS alternative:** For better code-splitting in React:
```typescript
import styled from 'styled-components';
import { spacing, colors, borderRadius } from '@/styles/tokens';

const Button = styled.button`
  padding: ${spacing[2]} ${spacing[4]};
  background-color: ${colors.primary[500]};
  border-radius: ${borderRadius.md};
`;
```

---

### 9. Documentation & Comments

Document your tokens and overrides:

```scss
// =============================================================================
// Color Tokens - Primary Palette
// =============================================================================
// The primary color represents the Contoso University brand.
// Used for: primary buttons, links, active states, focus indicators
// Accessibility: Maintains 4.5:1 contrast with white backgrounds
// =============================================================================

$color-primary-500: #0d6efd;  // Main brand color
$color-primary-600: #0a58ca;  // Hover state
$color-primary-700: #084298;  // Active/pressed state
```

---

### 10. Version Control & Migration

When updating tokens:
1. **Document changes** in migration notes
2. **Test visual regression** with tools like Percy, Chromatic
3. **Update components incrementally** rather than all at once
4. **Maintain backwards compatibility** with CSS custom properties

---

## Implementation Checklist

### Phase 1: Setup & Foundation

- [ ] **Install dependencies**
  - [ ] `npm install bootstrap sass`
  - [ ] `npm install -D sass-loader`
  
- [ ] **Create directory structure**
  - [ ] `/src/styles/tokens/`
  - [ ] `/src/styles/bootstrap/`
  - [ ] `/src/styles/components/`
  - [ ] `/src/styles/utilities/`
  - [ ] `/src/styles/themes/`

- [ ] **Create token files**
  - [ ] `_colors.scss`
  - [ ] `_spacing.scss`
  - [ ] `_typography.scss`
  - [ ] `_breakpoints.scss`
  - [ ] `_borders.scss`
  - [ ] `_z-index.scss`

- [ ] **Create Bootstrap override files**
  - [ ] `bootstrap/_variables.scss`
  - [ ] `bootstrap/_custom.scss`

- [ ] **Create main entry points**
  - [ ] `main.scss`
  - [ ] `variables.scss`

---

### Phase 2: Token Migration

- [ ] **Extract current values from site.css**
  - [ ] Font sizes
  - [ ] Spacing values
  - [ ] Colors (from Bootstrap defaults)

- [ ] **Define color tokens**
  - [ ] Primary palette (9 shades)
  - [ ] Secondary palette (9 shades)
  - [ ] Semantic colors (success, danger, warning, info)
  - [ ] Neutral/grayscale (9 shades)
  - [ ] Text colors
  - [ ] Background colors
  - [ ] Border colors

- [ ] **Define spacing tokens**
  - [ ] Base scale (0-16)
  - [ ] Semantic spacing (button padding, card spacing, etc.)

- [ ] **Define typography tokens**
  - [ ] Font families
  - [ ] Font sizes (base + scale)
  - [ ] Font weights
  - [ ] Line heights
  - [ ] Letter spacing

- [ ] **Define breakpoint tokens**
  - [ ] Mobile-first breakpoints
  - [ ] Container max-widths

- [ ] **Define border & shadow tokens**
  - [ ] Border radius scale
  - [ ] Border widths
  - [ ] Box shadows (elevation levels)

---

### Phase 3: Bootstrap Integration

- [ ] **Map tokens to Bootstrap variables**
  - [ ] Color system
  - [ ] Typography system
  - [ ] Spacing system
  - [ ] Grid & breakpoints
  - [ ] Component variables (buttons, forms, cards, etc.)

- [ ] **Configure import order in main.scss**
  - [ ] Import tokens first
  - [ ] Import Bootstrap variable overrides
  - [ ] Import Bootstrap core
  - [ ] Import custom extensions
  - [ ] Import component styles

- [ ] **Test Bootstrap component rendering**
  - [ ] Buttons
  - [ ] Forms
  - [ ] Cards
  - [ ] Tables
  - [ ] Navigation
  - [ ] Modals

---

### Phase 4: Component Migration

- [ ] **Create component-specific styles**
  - [ ] `_buttons.scss` (custom button variants)
  - [ ] `_forms.scss` (custom form styles)
  - [ ] `_cards.scss` (custom card styles)
  - [ ] `_tables.scss` (custom table styles)

- [ ] **Migrate existing custom CSS**
  - [ ] Convert hard-coded values to tokens
  - [ ] Remove redundant styles (already in Bootstrap)
  - [ ] Organize by component

- [ ] **Create utility classes**
  - [ ] Helper classes
  - [ ] Custom mixins
  - [ ] Responsive utilities

---

### Phase 5: React Integration

- [ ] **Configure Webpack/Vite for SCSS**
  - [ ] Install sass-loader or configure Vite
  - [ ] Configure module resolution for @imports

- [ ] **Import global styles in React app**
  ```typescript
  // In App.tsx or index.tsx
  import './styles/main.scss';
  ```

- [ ] **Set up CSS Modules or styled-components**
  - [ ] Choose approach (CSS Modules vs. CSS-in-JS)
  - [ ] Configure module naming
  - [ ] Create example components

- [ ] **Create TypeScript types for tokens (optional)**
  ```typescript
  // tokens.ts
  export const spacing = {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    // ...
  };
  
  export const colors = {
    primary: {
      500: '#0d6efd',
      600: '#0a58ca',
      // ...
    },
  };
  ```

---

### Phase 6: Testing & Validation

- [ ] **Visual regression testing**
  - [ ] Compare new styles with old implementation
  - [ ] Test all components
  - [ ] Test responsive breakpoints

- [ ] **Accessibility testing**
  - [ ] Color contrast validation
  - [ ] Focus indicator visibility
  - [ ] Keyboard navigation

- [ ] **Browser compatibility testing**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

- [ ] **Performance testing**
  - [ ] Bundle size analysis
  - [ ] CSS file size
  - [ ] Load time impact

---

### Phase 7: Documentation & Handoff

- [ ] **Create developer documentation**
  - [ ] How to use tokens
  - [ ] How to add new components
  - [ ] How to modify themes
  - [ ] Import order guidelines

- [ ] **Create design documentation**
  - [ ] Token reference guide
  - [ ] Component library
  - [ ] Style guide

- [ ] **Set up Storybook (optional)**
  - [ ] Install Storybook
  - [ ] Create stories for components
  - [ ] Document token usage

- [ ] **Team training**
  - [ ] Conduct walkthrough session
  - [ ] Share best practices
  - [ ] Q&A session

---

## Summary

This document provides a comprehensive design token system for the Contoso University migration to React TypeScript with Bootstrap 5. The token system:

1. **Extracts current branding** from the existing ASP.NET Core implementation
2. **Defines semantic tokens** for colors, spacing, typography, breakpoints, borders, and shadows
3. **Maps tokens to Bootstrap SCSS variables** for seamless integration
4. **Documents proper import order** to ensure correct SCSS compilation
5. **Provides override examples** for common customization scenarios
6. **Establishes theming guidelines** for maintainable and scalable styling

### Key Takeaways

- **Token hierarchy:** Global → Alias → Component
- **Import order matters:** Tokens → Overrides → Bootstrap → Custom
- **Use semantic naming:** `$color-primary` not `$color-blue`
- **Maintain consistency:** All values should come from tokens
- **Plan for themes:** Structure allows for dark mode, high contrast, etc.
- **Accessibility first:** Ensure contrast ratios and focus indicators

### Next Steps

1. **Review** this document with design and development teams
2. **Implement** token files following the structure outlined
3. **Test** Bootstrap integration with overrides
4. **Migrate** existing components to use tokens
5. **Document** any custom tokens or patterns not covered here
6. **Iterate** based on team feedback and real-world usage

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-12-30  
**Next Review:** After Phase 1 implementation  
**Owner:** Frontend Engineering Team
