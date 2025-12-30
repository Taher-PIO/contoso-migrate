# Iconography & Bootstrap Components Guidelines - React + TypeScript Migration

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Engineering Team  
**Target Stack:** React + TypeScript + Bootstrap 5.x

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Icon Library Strategy](#icon-library-strategy)
- [Icon Loading Strategy](#icon-loading-strategy)
- [Bootstrap Components Guidelines](#bootstrap-components-guidelines)
  - [Forms](#forms)
  - [Navigation & Tabs](#navigation--tabs)
  - [Modals](#modals)
  - [Tooltips & Popovers](#tooltips--popovers)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Legacy Component Inventory](#legacy-component-inventory)
- [Do's and Don'ts](#dos-and-donts)
- [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

This document establishes guidelines for iconography and Bootstrap component usage during the migration of Contoso University from ASP.NET Core Razor Pages to React + TypeScript. 

### Key Decisions

✅ **Icon Library:** Bootstrap Icons (bi)  
✅ **Loading Strategy:** SVG React Components (via react-icons)  
✅ **Component Library:** React-Bootstrap + Custom Accessible Wrappers  
✅ **Accessibility:** WCAG 2.1 Level AA compliance mandatory  

### Why These Choices?

1. **Bootstrap Icons** - Native integration with Bootstrap ecosystem, comprehensive coverage (1,800+ icons), MIT licensed
2. **React Components** - Tree-shakeable, type-safe, no runtime sprite loading complexity
3. **React-Bootstrap** - Provides accessible defaults while maintaining Bootstrap design language
4. **Accessibility-First** - Every component must meet WCAG standards from day one

---

## Icon Library Strategy

### Selected Library: Bootstrap Icons

**Official Site:** https://icons.getbootstrap.com/  
**NPM Package:** `bootstrap-icons` (for CSS/fonts) or use via `react-icons`  
**Version:** 1.11.x or latest  
**License:** MIT  

#### Why Bootstrap Icons?

✅ **Ecosystem Alignment**
- Designed specifically for Bootstrap framework
- Visual consistency with Bootstrap design language
- Official Bootstrap project (maintained by Bootstrap team)

✅ **Comprehensive Coverage**
- 1,800+ icons covering all common use cases
- Categories: Actions, Arrows, Communication, Devices, Files, Media, Navigation, etc.
- Regular updates with new icons

✅ **Multiple Usage Options**
- SVG sprites
- Icon fonts
- Individual SVG files
- React components (via react-icons)

✅ **Accessibility Features**
- Clean, simple designs at small sizes
- Works well with Bootstrap's color system
- Good contrast ratios

#### Alternative Considered: Feather Icons

**Pros:**
- Beautiful, minimalist design
- Only 287 icons (very focused)
- Great for modern, clean UIs

**Cons:**
- ❌ Limited coverage (287 vs 1,800+)
- ❌ Less integration with Bootstrap ecosystem
- ❌ Would require supplementing with another library

**Decision:** Bootstrap Icons provides better coverage and ecosystem fit.

---

## Icon Loading Strategy

### Recommended: SVG React Components (via react-icons)

**NPM Package:** `react-icons`  
**Import Path:** `react-icons/bs` (Bootstrap Icons)

#### Why React Components?

✅ **Tree-Shaking**
```typescript
// Only the imported icons are bundled
import { BsPersonFill, BsTrash, BsPencilSquare } from 'react-icons/bs';
```

✅ **Type Safety**
```typescript
import { IconType } from 'react-icons';

interface IconButtonProps {
  icon: IconType;
  label: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, label }) => (
  <button aria-label={label}>
    <Icon />
  </button>
);
```

✅ **Styling Flexibility**
```typescript
<BsPersonFill 
  size={24} 
  color="#0d6efd" 
  className="me-2"
  aria-hidden="true"
/>
```

✅ **No Runtime Loading**
- Icons bundled at build time
- No HTTP requests for icon sprites
- No FOUC (Flash of Unstyled Content)

#### Installation

```bash
npm install react-icons --save
```

#### Basic Usage

```typescript
import { BsPersonFill, BsEnvelopeFill, BsTelephoneFill } from 'react-icons/bs';

const ContactCard: React.FC<{ name: string; email: string; phone: string }> = 
  ({ name, email, phone }) => (
  <div className="card">
    <div className="card-body">
      <h5 className="card-title">
        <BsPersonFill className="me-2" aria-hidden="true" />
        {name}
      </h5>
      <p className="card-text">
        <BsEnvelopeFill className="me-2" aria-hidden="true" />
        {email}
      </p>
      <p className="card-text">
        <BsTelephoneFill className="me-2" aria-hidden="true" />
        {phone}
      </p>
    </div>
  </div>
);
```

### Alternative: SVG Sprites (Not Recommended for React)

**Why Not SVG Sprites?**

❌ **Additional HTTP Request**
```html
<!-- External sprite file -->
<svg><use href="/assets/bootstrap-icons.svg#person-fill" /></svg>
```

❌ **No Type Safety**
```typescript
// Icon name as string - typos not caught at compile time
<Icon name="person-fil" /> // Oops! Should be "person-fill"
```

❌ **CORS Issues**
- External SVG sprites require proper CORS headers
- Can cause issues in development and production

❌ **React Integration Overhead**
- Need custom wrapper components
- More complex than using react-icons

**Decision:** Use React components via `react-icons` for simplicity, performance, and developer experience.

---

## Bootstrap Components Guidelines

### Forms

#### Component: Input Fields

**Legacy (Razor Pages):**
```html
<div class="form-group">
    <label asp-for="Student.LastName" class="control-label"></label>
    <input asp-for="Student.LastName" class="form-control" />
    <span asp-validation-for="Student.LastName" class="text-danger"></span>
</div>
```

**React + TypeScript (Recommended):**
```typescript
import { Form } from 'react-bootstrap';
import { BsExclamationCircle } from 'react-icons/bs';

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  name,
  value,
  error,
  required = false,
  onChange
}) => {
  const inputId = `input-${name}`;
  const errorId = `${inputId}-error`;
  
  return (
    <Form.Group className="mb-3" controlId={inputId}>
      <Form.Label>
        {label}
        {required && <span className="text-danger ms-1" aria-label="required">*</span>}
      </Form.Label>
      <Form.Control
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        isInvalid={!!error}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <Form.Control.Feedback type="invalid" id={errorId} role="alert">
          <BsExclamationCircle className="me-1" aria-hidden="true" />
          {error}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};
```

#### ✅ DO

- Use `Form.Group` to wrap label + input + validation
- Always provide explicit labels with `htmlFor` attribute
- Use `aria-required` for required fields
- Use `aria-invalid` when field has errors
- Use `aria-describedby` to link input with error message
- Mark error messages with `role="alert"` for screen reader announcement
- Use icons in error messages but mark them `aria-hidden="true"`
- Provide both visual and text indicators for required fields

#### ❌ DON'T

- Don't rely on placeholder as label
```typescript
// ❌ BAD
<Form.Control placeholder="Enter your name" />

// ✅ GOOD
<Form.Label htmlFor="name">Name</Form.Label>
<Form.Control id="name" placeholder="e.g., John Doe" />
```

- Don't use color alone to indicate errors
```typescript
// ❌ BAD - Only changes border color
<Form.Control className="error" />

// ✅ GOOD - Color + icon + text message
<Form.Control isInvalid={true} />
<Form.Control.Feedback type="invalid">
  <BsExclamationCircle aria-hidden="true" /> Please enter a valid email
</Form.Control.Feedback>
```

- Don't forget to announce validation errors
```typescript
// ❌ BAD - Error appears but not announced
<div className="error-text">{error}</div>

// ✅ GOOD - Error announced to screen readers
<div className="error-text" role="alert" aria-live="polite">{error}</div>
```

#### Accessibility Checklist for Forms

- [ ] Every input has an associated `<label>` with `htmlFor` matching input `id`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Required fields have visual indicator (*, "Required", etc.)
- [ ] Error messages have `role="alert"` or parent has `aria-live="polite"`
- [ ] Invalid fields have `aria-invalid="true"`
- [ ] Error messages linked via `aria-describedby`
- [ ] Form submission errors move focus to first invalid field
- [ ] Success messages announced after form submission
- [ ] Disabled fields have `disabled` attribute (not just visual styling)
- [ ] All interactive elements are keyboard accessible (Tab, Enter, Escape)

---

### Navigation & Tabs

#### Component: Navigation Bar

**Legacy (Razor Pages):**
```html
<nav class="navbar navbar-expand-sm navbar-toggleable-sm navbar-light bg-white border-bottom box-shadow mb-3">
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target=".navbar-collapse">
        <span class="navbar-toggler-icon"></span>
    </button>
    <div class="navbar-collapse collapse">
        <ul class="navbar-nav flex-grow-1">
            <li class="nav-item">
                <a class="nav-link text-dark" href="/Students">Students</a>
            </li>
        </ul>
    </div>
</nav>
```

**React + TypeScript (Recommended):**
```typescript
import { Navbar, Nav, Container } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { BsPeopleFill, BsBookFill, BsPersonBadgeFill, BsBuilding } from 'react-icons/bs';

export const AppNavbar: React.FC = () => {
  return (
    <Navbar bg="white" expand="sm" className="border-bottom shadow-sm mb-3">
      <Container>
        <Navbar.Brand href="/">Contoso University</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navigation" aria-label="Toggle navigation" />
        <Navbar.Collapse id="main-navigation">
          <Nav className="flex-grow-1" as="nav" aria-label="Main navigation">
            <Nav.Link as={NavLink} to="/about">
              About
            </Nav.Link>
            <Nav.Link as={NavLink} to="/students">
              <BsPeopleFill className="me-1" aria-hidden="true" />
              Students
            </Nav.Link>
            <Nav.Link as={NavLink} to="/courses">
              <BsBookFill className="me-1" aria-hidden="true" />
              Courses
            </Nav.Link>
            <Nav.Link as={NavLink} to="/instructors">
              <BsPersonBadgeFill className="me-1" aria-hidden="true" />
              Instructors
            </Nav.Link>
            <Nav.Link as={NavLink} to="/departments">
              <BsBuilding className="me-1" aria-hidden="true" />
              Departments
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
```

#### Component: Tabs

**React + TypeScript (Recommended):**
```typescript
import { useState } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import { BsPersonFill, BsEnvelopeFill, BsGearFill } from 'react-icons/bs';

export const ProfileTabs: React.FC = () => {
  const [activeKey, setActiveKey] = useState('profile');

  return (
    <Tabs
      activeKey={activeKey}
      onSelect={(k) => setActiveKey(k || 'profile')}
      id="profile-tabs"
      className="mb-3"
    >
      <Tab 
        eventKey="profile" 
        title={
          <>
            <BsPersonFill className="me-1" aria-hidden="true" />
            Profile
          </>
        }
      >
        <div className="p-3">Profile content...</div>
      </Tab>
      <Tab 
        eventKey="contact" 
        title={
          <>
            <BsEnvelopeFill className="me-1" aria-hidden="true" />
            Contact
          </>
        }
      >
        <div className="p-3">Contact content...</div>
      </Tab>
      <Tab 
        eventKey="settings" 
        title={
          <>
            <BsGearFill className="me-1" aria-hidden="true" />
            Settings
          </>
        }
      >
        <div className="p-3">Settings content...</div>
      </Tab>
    </Tabs>
  );
};
```

#### ✅ DO

- Use `<nav>` with `aria-label` for navigation regions
```typescript
<Nav as="nav" aria-label="Main navigation">
```

- Use `NavLink` from `react-router-dom` for client-side routing
- Mark navigation icons as `aria-hidden="true"`
- Provide text labels alongside icons
- Use `Navbar.Toggle` with proper `aria-controls` and `aria-label`
- Ensure mobile menu is keyboard accessible (Enter/Space to toggle, Escape to close)
- Use semantic HTML (`<nav>`, `<ul>`, `<li>`)

#### ❌ DON'T

- Don't use icons without text labels in navigation
```typescript
// ❌ BAD - Icon only, inaccessible to screen readers
<Nav.Link to="/students">
  <BsPeopleFill />
</Nav.Link>

// ✅ GOOD - Icon with text label
<Nav.Link to="/students">
  <BsPeopleFill className="me-1" aria-hidden="true" />
  Students
</Nav.Link>

// ✅ ALSO ACCEPTABLE - Icon with aria-label (for icon-only buttons in constrained spaces)
<Nav.Link to="/students" aria-label="Students">
  <BsPeopleFill aria-hidden="true" />
</Nav.Link>
```

- Don't forget skip navigation link
```typescript
// ✅ GOOD - Add skip link as first focusable element
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
<nav aria-label="Main navigation">...</nav>
<main id="main-content" tabIndex={-1}>...</main>
```

- Don't use `<div>` or `<span>` for clickable items
```typescript
// ❌ BAD
<div onClick={handleClick}>Navigate</div>

// ✅ GOOD
<button onClick={handleClick}>Navigate</button>
// or
<Nav.Link as={Link} to="/path">Navigate</Nav.Link>
```

#### Accessibility Checklist for Navigation

- [ ] Navigation wrapped in `<nav>` with descriptive `aria-label`
- [ ] Current page indicated with `aria-current="page"`
- [ ] Mobile menu toggle has `aria-expanded`, `aria-controls`, and `aria-label`
- [ ] Escape key closes expanded mobile menu
- [ ] Skip navigation link provided
- [ ] All navigation items keyboard accessible
- [ ] Focus indicators visible on all interactive elements
- [ ] Tab panels have proper ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
- [ ] Active tab marked with `aria-selected="true"`
- [ ] Arrow keys navigate between tabs (left/right arrows)

---

### Modals

#### Component: Dialog Modal

**React + TypeScript (Recommended):**
```typescript
import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { BsExclamationTriangle, BsX } from 'react-icons/bs';

interface ConfirmDeleteModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  return (
    <Modal
      show={show}
      onHide={onCancel}
      backdrop="static"
      keyboard={!isLoading}
      centered
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title id="modal-title">
          <BsExclamationTriangle className="me-2 text-danger" aria-hidden="true" />
          {title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <p id="modal-description">{message}</p>
      </Modal.Body>
      
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Usage example
export const StudentDeleteButton: React.FC<{ studentId: number; studentName: string }> = 
  ({ studentId, studentName }) => {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStudent(studentId);
      // Handle success (e.g., navigate away, show toast)
    } catch (error) {
      // Handle error
    } finally {
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setShowModal(true)}>
        Delete
      </Button>
      
      <ConfirmDeleteModal
        show={showModal}
        title="Delete Student"
        message={`Are you sure you want to delete ${studentName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        isLoading={isDeleting}
      />
    </>
  );
};
```

#### ✅ DO

- Use `Modal.Title` with unique `id` and link via `aria-labelledby`
- Provide modal description via `aria-describedby`
- Use `backdrop="static"` for critical actions (prevent accidental dismissal)
- Trap focus within modal (React-Bootstrap does this automatically)
- Return focus to trigger element when modal closes
- Disable Escape key during loading states (`keyboard={false}`)
- Provide clear primary and secondary actions
- Use loading indicators during async operations
- Close modal on successful action completion

#### ❌ DON'T

- Don't allow modal dismissal during async operations
```typescript
// ❌ BAD
<Modal show={show} onHide={onClose}>
  <Button onClick={saveData}>Save</Button>
</Modal>

// ✅ GOOD
<Modal show={show} onHide={isLoading ? undefined : onClose} backdrop={isLoading ? "static" : true}>
  <Button onClick={saveData} disabled={isLoading}>
    {isLoading ? 'Saving...' : 'Save'}
  </Button>
</Modal>
```

- Don't nest modals (avoid modal-within-modal pattern)
```typescript
// ❌ BAD - Modal inside another modal
<Modal show={show1}>
  <Button onClick={() => setShow2(true)}>Open Another Modal</Button>
  <Modal show={show2}>...</Modal>
</Modal>

// ✅ GOOD - Sequential modals
<Modal show={show1} onHide={() => setShow1(false)}>
  <Button onClick={() => { setShow1(false); setShow2(true); }}>
    Next
  </Button>
</Modal>
<Modal show={show2} onHide={() => setShow2(false)}>...</Modal>
```

- Don't forget to handle focus management
```typescript
// ✅ GOOD - React-Bootstrap handles focus automatically
// But for custom modals, always ensure:
// 1. Focus moves to modal on open
// 2. Focus trapped within modal
// 3. Focus returns to trigger on close
```

#### Accessibility Checklist for Modals

- [ ] Modal has `role="dialog"` (React-Bootstrap adds automatically)
- [ ] Modal has `aria-labelledby` pointing to title `id`
- [ ] Modal has `aria-describedby` pointing to description `id`
- [ ] Focus trapped within modal (Tab cycles through modal elements only)
- [ ] Escape key closes modal (when appropriate)
- [ ] Focus returns to trigger element on close
- [ ] Modal overlay prevents interaction with background content
- [ ] Close button has accessible label ("Close", "Dismiss", etc.)
- [ ] Loading states prevent premature dismissal
- [ ] Keyboard users can reach all interactive elements

---

### Tooltips & Popovers

#### Component: Tooltip

**React + TypeScript (Recommended):**
```typescript
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BsInfoCircle, BsQuestionCircle } from 'react-icons/bs';

interface InfoTooltipProps {
  content: string;
  children: React.ReactElement;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  children,
  placement = 'top'
}) => {
  return (
    <OverlayTrigger
      placement={placement}
      overlay={<Tooltip id={`tooltip-${content.substring(0, 20)}`}>{content}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  );
};

// Usage examples

// 1. Icon with tooltip (supplementary information)
<InfoTooltip content="Student enrollment date is the date they first registered for classes">
  <span className="ms-1" tabIndex={0}>
    <BsInfoCircle aria-label="More information about enrollment date" />
  </span>
</InfoTooltip>

// 2. Disabled button with tooltip explaining why
<OverlayTrigger
  placement="top"
  overlay={<Tooltip id="save-disabled-tooltip">Please fill all required fields</Tooltip>}
>
  <span className="d-inline-block" tabIndex={0}>
    <Button disabled style={{ pointerEvents: 'none' }}>
      Save
    </Button>
  </span>
</OverlayTrigger>

// 3. Truncated text with full text in tooltip
<OverlayTrigger
  placement="top"
  overlay={<Tooltip id="full-name-tooltip">{student.fullName}</Tooltip>}
>
  <span className="text-truncate" style={{ maxWidth: '200px' }}>
    {student.fullName}
  </span>
</OverlayTrigger>
```

#### Component: Popover (for richer content)

**React + TypeScript (Recommended):**
```typescript
import { useState } from 'react';
import { OverlayTrigger, Popover, Button } from 'react-bootstrap';
import { BsInfoCircle } from 'react-icons/bs';

interface HelpPopoverProps {
  title: string;
  content: React.ReactNode;
}

export const HelpPopover: React.FC<HelpPopoverProps> = ({ title, content }) => {
  const popover = (
    <Popover id="help-popover">
      <Popover.Header as="h3">{title}</Popover.Header>
      <Popover.Body>{content}</Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="right" overlay={popover} rootClose>
      <Button variant="link" size="sm" aria-label={`Help: ${title}`}>
        <BsInfoCircle aria-hidden="true" />
      </Button>
    </OverlayTrigger>
  );
};

// Usage
<HelpPopover
  title="What is GPA?"
  content={
    <>
      <p>Grade Point Average (GPA) is calculated by:</p>
      <ol>
        <li>Convert each grade to points (A=4.0, B=3.0, etc.)</li>
        <li>Multiply by credit hours</li>
        <li>Divide sum by total credit hours</li>
      </ol>
    </>
  }
/>
```

#### ✅ DO

- Use tooltips for supplementary, non-essential information
- Ensure tooltip trigger is keyboard accessible (`tabIndex={0}` on non-focusable elements)
- Provide `aria-label` on icon-only triggers
- Use unique `id` for each tooltip
- Keep tooltip content concise (1-2 sentences)
- Use popovers for richer content (headings, lists, links)
- Make popovers dismissible (Escape key, click outside)
- Show tooltips on both hover and focus

#### ❌ DON'T

- Don't put essential information in tooltips
```typescript
// ❌ BAD - Required information hidden in tooltip
<Form.Label>
  Username
  <InfoTooltip content="Must be between 3-20 characters">
    <BsInfoCircle />
  </InfoTooltip>
</Form.Label>

// ✅ GOOD - Essential info always visible
<Form.Label>
  Username
  <Form.Text className="text-muted">(3-20 characters)</Form.Text>
</Form.Label>
```

- Don't use tooltips on disabled elements without wrapper
```typescript
// ❌ BAD - Disabled elements don't trigger events
<Button disabled title="Please fill all fields">
  Save
</Button>

// ✅ GOOD - Wrap disabled element
<OverlayTrigger overlay={<Tooltip>Please fill all fields</Tooltip>}>
  <span tabIndex={0}>
    <Button disabled style={{ pointerEvents: 'none' }}>Save</Button>
  </span>
</OverlayTrigger>
```

- Don't use hover-only tooltips
```typescript
// ❌ BAD - Only shows on hover
<OverlayTrigger trigger="hover" overlay={<Tooltip>Info</Tooltip>}>
  <span><BsInfoCircle /></span>
</OverlayTrigger>

// ✅ GOOD - Shows on hover and focus
<OverlayTrigger trigger={['hover', 'focus']} overlay={<Tooltip>Info</Tooltip>}>
  <span tabIndex={0}><BsInfoCircle aria-label="More information" /></span>
</OverlayTrigger>
```

#### Accessibility Checklist for Tooltips

- [ ] Tooltips show on both hover and keyboard focus
- [ ] Tooltip triggers are keyboard accessible
- [ ] Icon-only triggers have `aria-label`
- [ ] Tooltips contain non-essential, supplementary information only
- [ ] Tooltips don't obscure critical content
- [ ] Popovers can be dismissed with Escape key
- [ ] Popovers can be dismissed by clicking outside (`rootClose`)
- [ ] Tooltip content is concise and readable
- [ ] Color is not the only indicator (if tooltip provides status information)

---

## Accessibility Guidelines

### General Accessibility Principles

#### 1. ARIA Usage

**The First Rule of ARIA:** Don't use ARIA unless you have to.

```typescript
// ❌ BAD - Unnecessary ARIA
<button role="button" aria-label="Submit">Submit</button>

// ✅ GOOD - Semantic HTML
<button>Submit</button>
```

**When to Use ARIA:**
- To add labels to icon-only buttons
- To describe dynamic content updates (`aria-live`)
- To indicate current state (`aria-current`, `aria-expanded`, `aria-selected`)
- To provide additional context (`aria-describedby`, `aria-labelledby`)
- To mark invalid form fields (`aria-invalid`)

#### 2. Keyboard Navigation

**All interactive elements must be keyboard accessible:**

- `Tab` - Move focus forward
- `Shift+Tab` - Move focus backward
- `Enter` or `Space` - Activate buttons/links
- `Escape` - Close modals, dismiss overlays
- Arrow keys - Navigate within components (tabs, menus, lists)

**Custom components must handle keyboard events:**

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      handleClick();
      break;
    case 'Escape':
      handleClose();
      break;
  }
};

<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  aria-label="Action"
>
  <BsIcon />
</div>
```

#### 3. Focus Management

**When to manage focus:**
- After form submission: Move to first error or success message
- After modal closes: Return to trigger element
- After delete action: Move to next logical element
- After page navigation: Move to main content (or provide skip link)

**React example:**
```typescript
import { useRef, useEffect } from 'react';

const FormWithFocus: React.FC = () => {
  const firstErrorRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      firstErrorRef.current?.focus();
    }
  }, [errors]);

  return (
    <Form>
      <Form.Control
        ref={errors.name ? firstErrorRef : null}
        isInvalid={!!errors.name}
        aria-invalid={!!errors.name}
      />
    </Form>
  );
};
```

#### 4. Color & Contrast

**WCAG 2.1 Level AA Requirements:**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
- UI components (buttons, borders, icons): 3:1 contrast ratio

**Never use color alone:**
```typescript
// ❌ BAD - Color only
<span className="text-danger">Error</span>

// ✅ GOOD - Color + icon + text
<span className="text-danger">
  <BsExclamationCircle aria-hidden="true" /> Error: Invalid email
</span>
```

#### 5. Focus Indicators

**Always visible focus indicators:**

```css
/* Global focus styles */
*:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Never remove focus outline without replacement */
button:focus {
  outline: none; /* ❌ BAD unless you provide alternative */
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); /* ✅ GOOD alternative */
}
```

#### 6. Live Regions

**Announce dynamic content changes:**

```typescript
import { useState } from 'react';

const SearchResults: React.FC = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      {isLoading && (
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      
      {/* Announce results to screen readers */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {results.length > 0 
          ? `${results.length} results found` 
          : 'No results found'}
      </div>
      
      <ul>
        {results.map(result => <li key={result.id}>{result.name}</li>)}
      </ul>
    </div>
  );
};
```

#### 7. Labels for Icon-Only Buttons

```typescript
// ❌ BAD - No label
<Button>
  <BsPencilSquare />
</Button>

// ✅ GOOD - aria-label
<Button aria-label="Edit student">
  <BsPencilSquare aria-hidden="true" />
</Button>

// ✅ ALSO GOOD - Visually hidden text
<Button>
  <BsPencilSquare aria-hidden="true" />
  <span className="visually-hidden">Edit student</span>
</Button>

// ✅ BEST - Visible text label (when space allows)
<Button>
  <BsPencilSquare className="me-1" aria-hidden="true" />
  Edit
</Button>
```

---

## Legacy Component Inventory

### Current Bootstrap Components in Use (ASP.NET Razor Pages)

Based on analysis of Contoso University legacy codebase:

| Component | Current Usage | Files | Migration Priority |
|-----------|---------------|-------|-------------------|
| **Navbar** | Main navigation with mobile toggle | `_Layout.cshtml` | 🔴 High |
| **Forms** | Create/Edit pages for all entities | `Create.cshtml`, `Edit.cshtml` | 🔴 High |
| **Tables** | List views with sorting | `Index.cshtml` (Students, Courses, etc.) | 🔴 High |
| **Buttons** | Primary actions (Create, Save, Delete) | All pages | 🔴 High |
| **Pagination** | Previous/Next links | `Index.cshtml` pages | 🟠 Medium |
| **Validation** | Form error messages | All forms | 🔴 High |
| **Grid System** | Responsive layout (`.row`, `.col-md-4`) | All pages | 🟠 Medium |
| **Alerts** | Not currently used | None | 🟢 Low (add during migration) |
| **Modals** | Not currently used | None | 🟠 Medium (add for delete confirmations) |
| **Tooltips** | Not currently used | None | 🟢 Low (add for help text) |
| **Tabs** | Not currently used | None | 🟢 Low |
| **Breadcrumbs** | Not currently used | None | 🟢 Low |
| **Cards** | Not currently used | None | 🟠 Medium (consider for About page) |

### Icon Gaps Identified

**Current state:** No icons used (except Bootstrap navbar-toggler-icon)

**Needed icons for React migration:**

| Action | Icon | Bootstrap Icon Class |
|--------|------|---------------------|
| Create/Add | ➕ | `BsPlusCircleFill` or `BsPlusLg` |
| Edit | ✏️ | `BsPencilSquare` or `BsPencilFill` |
| Delete | 🗑️ | `BsTrash` or `BsTrashFill` |
| View Details | 👁️ | `BsEye` or `BsEyeFill` |
| Search | 🔍 | `BsSearch` |
| Filter | 🔽 | `BsFunnel` or `BsFunnelFill` |
| Sort Ascending | ⬆️ | `BsSortUp` or `BsArrowUp` |
| Sort Descending | ⬇️ | `BsSortDown` or `BsArrowDown` |
| Student | 👤 | `BsPersonFill` or `BsPeopleFill` |
| Course | 📚 | `BsBookFill` or `BsBook` |
| Instructor | 👨‍🏫 | `BsPersonBadgeFill` |
| Department | 🏢 | `BsBuilding` or `BsBuildingFill` |
| Calendar | 📅 | `BsCalendar3` or `BsCalendarEventFill` |
| Success | ✅ | `BsCheckCircleFill` |
| Error | ❌ | `BsXCircleFill` or `BsExclamationCircleFill` |
| Warning | ⚠️ | `BsExclamationTriangleFill` |
| Info | ℹ️ | `BsInfoCircleFill` |
| Close | ✖️ | `BsX` or `BsXLg` |
| Menu | ☰ | `BsList` (already used in navbar toggle) |
| Home | 🏠 | `BsHouseFill` |
| Previous | ◀️ | `BsChevronLeft` or `BsArrowLeft` |
| Next | ▶️ | `BsChevronRight` or `BsArrowRight` |

---

## Do's and Don'ts

### Icon Usage

#### ✅ DO

1. **Always provide text alternative**
```typescript
// Text label visible
<Button>
  <BsTrash className="me-1" aria-hidden="true" />
  Delete
</Button>

// Text label hidden visually but available to screen readers
<Button aria-label="Delete student">
  <BsTrash aria-hidden="true" />
</Button>
```

2. **Mark decorative icons as `aria-hidden="true"`**
```typescript
<h2>
  <BsPersonFill className="me-2" aria-hidden="true" />
  Students
</h2>
```

3. **Use consistent icons for same actions**
```typescript
// ✅ Always use BsTrash for delete actions
// ✅ Always use BsPencilSquare for edit actions
```

4. **Size icons appropriately**
```typescript
<BsTrash size={16} /> // Small (inline with text)
<BsTrash size={24} /> // Medium (buttons)
<BsTrash size={32} /> // Large (headers, heroes)
```

5. **Use fill vs. outline variants consistently**
```typescript
// Primary/selected state: Fill variants
<BsPersonFill /> 

// Secondary/unselected state: Outline variants
<BsPerson />
```

#### ❌ DON'T

1. **Don't use icon-only buttons without labels**
```typescript
// ❌ BAD
<Button><BsTrash /></Button>

// ✅ GOOD
<Button aria-label="Delete"><BsTrash aria-hidden="true" /></Button>
```

2. **Don't rely on icon meaning alone**
```typescript
// ❌ BAD - Icon meaning not universally understood
<BsFunnel />

// ✅ GOOD - Icon + text
<BsFunnel aria-hidden="true" /> Filter
```

3. **Don't use too many icons**
```typescript
// ❌ BAD - Visual clutter
<Nav.Link><BsHouseFill /> <BsChevronRight /> Home <BsChevronRight /></Nav.Link>

// ✅ GOOD - Selective use
<Nav.Link><BsHouseFill className="me-1" aria-hidden="true" /> Home</Nav.Link>
```

4. **Don't change icon meanings**
```typescript
// ❌ BAD - Using trash icon for "archive"
<Button onClick={archive}><BsTrash /></Button>

// ✅ GOOD - Use appropriate icon
<Button onClick={archive}><BsArchive /></Button>
```

### Form Components

#### ✅ DO

1. **Group related form fields**
```typescript
<fieldset>
  <legend>Contact Information</legend>
  <TextInput label="Email" name="email" />
  <TextInput label="Phone" name="phone" />
</fieldset>
```

2. **Provide clear error messages**
```typescript
// ✅ GOOD - Specific error message
"Email must be in format user@example.com"

// ❌ BAD - Vague error message
"Invalid input"
```

3. **Validate on blur and submit**
```typescript
<Form.Control
  onBlur={validateField}
  isInvalid={touched && !!error}
/>
```

4. **Show loading state during submission**
```typescript
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Spinner size="sm" className="me-2" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</Button>
```

#### ❌ DON'T

1. **Don't use placeholder as label**
```typescript
// ❌ BAD
<Form.Control placeholder="Enter your email" />

// ✅ GOOD
<Form.Label>Email</Form.Label>
<Form.Control placeholder="user@example.com" />
```

2. **Don't submit forms without confirmation for destructive actions**
```typescript
// ❌ BAD
<Form onSubmit={deleteAllStudents}>
  <Button type="submit">Delete All</Button>
</Form>

// ✅ GOOD
<Button onClick={showConfirmModal}>Delete All</Button>
<ConfirmModal onConfirm={deleteAllStudents} />
```

### Navigation

#### ✅ DO

1. **Indicate current page**
```typescript
<Nav.Link as={NavLink} to="/students" activeClassName="active" aria-current="page">
  Students
</Nav.Link>
```

2. **Provide skip navigation**
```typescript
<a href="#main-content" className="skip-link">Skip to main content</a>
```

3. **Support keyboard navigation**
```typescript
// React-Bootstrap Nav components handle this automatically
// But ensure custom components support Tab, Enter, Escape
```

#### ❌ DON'T

1. **Don't use `<div>` for navigation items**
```typescript
// ❌ BAD
<div onClick={navigate}>Students</div>

// ✅ GOOD
<Nav.Link as={Link} to="/students">Students</Nav.Link>
```

### Modals

#### ✅ DO

1. **Provide clear title and description**
```typescript
<Modal aria-labelledby="modal-title" aria-describedby="modal-desc">
  <Modal.Title id="modal-title">Delete Student</Modal.Title>
  <Modal.Body id="modal-desc">
    Are you sure you want to delete this student?
  </Modal.Body>
</Modal>
```

2. **Trap focus within modal**
```typescript
// React-Bootstrap handles this automatically
```

3. **Provide clear primary/secondary actions**
```typescript
<Modal.Footer>
  <Button variant="secondary" onClick={onCancel}>Cancel</Button>
  <Button variant="danger" onClick={onConfirm}>Delete</Button>
</Modal.Footer>
```

#### ❌ DON'T

1. **Don't nest modals**
```typescript
// ❌ BAD
<Modal show={show1}>
  <Modal show={show2}>...</Modal>
</Modal>
```

---

## Implementation Checklist

### Phase 1: Setup & Foundation

- [ ] Install dependencies
  ```bash
  npm install react-bootstrap bootstrap react-icons
  npm install --save-dev @types/react-bootstrap
  ```

- [ ] Import Bootstrap CSS in main entry file
  ```typescript
  // index.tsx or App.tsx
  import 'bootstrap/dist/css/bootstrap.min.css';
  ```

- [ ] Create custom theme CSS (if needed)
  ```css
  /* theme.css */
  :root {
    --bs-primary: #0d6efd;
    --bs-danger: #dc3545;
    /* ... other Bootstrap variables */
  }
  ```

- [ ] Set up accessibility testing tools
  - [ ] Install `@axe-core/react` for automated testing
  - [ ] Install browser extensions (axe DevTools, Lighthouse)

### Phase 2: Core Component Library

- [ ] Create reusable component library
  - [ ] `<TextInput>` with validation and icons
  - [ ] `<Button>` with loading states and icons
  - [ ] `<ConfirmModal>` for delete confirmations
  - [ ] `<InfoTooltip>` for help text
  - [ ] `<SuccessAlert>` for operation feedback
  - [ ] `<ErrorAlert>` for error messages
  - [ ] `<LoadingSpinner>` for loading states
  - [ ] `<DataTable>` with sorting and pagination
  - [ ] `<SearchBar>` with icon

- [ ] Document each component
  - [ ] Props interface
  - [ ] Usage examples
  - [ ] Accessibility features
  - [ ] Do's and don'ts

### Phase 3: Navigation & Layout

- [ ] Implement `<AppNavbar>` component
  - [ ] Mobile responsive with toggle
  - [ ] Active page indicator
  - [ ] Icons for each section
  - [ ] Keyboard accessible

- [ ] Implement skip navigation
  ```typescript
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
  ```

- [ ] Implement focus management utilities
  ```typescript
  export const useFocusManagement = () => {
    // Custom hook for focus management
  };
  ```

### Phase 4: Forms Migration

- [ ] Migrate Student forms
  - [ ] Create form component
  - [ ] Add validation
  - [ ] Add error handling
  - [ ] Add success feedback
  - [ ] Test keyboard navigation
  - [ ] Test screen reader

- [ ] Migrate Course forms
- [ ] Migrate Instructor forms
- [ ] Migrate Department forms

### Phase 5: Data Tables

- [ ] Implement sortable tables
  - [ ] Sort icons (BsSortUp, BsSortDown)
  - [ ] `aria-sort` attributes
  - [ ] Keyboard sorting (Enter on header)

- [ ] Implement action buttons
  - [ ] Edit icon button
  - [ ] Delete icon button with confirmation
  - [ ] View details icon button
  - [ ] Contextual labels for screen readers

- [ ] Implement pagination
  - [ ] Previous/Next buttons with icons
  - [ ] Disabled state handling
  - [ ] Page number indicator
  - [ ] `aria-label` on controls

### Phase 6: Accessibility Testing

- [ ] Run automated tests
  - [ ] axe-core in CI/CD
  - [ ] Lighthouse in browser
  - [ ] Wave (if deployed)

- [ ] Manual keyboard testing
  - [ ] Tab through all pages
  - [ ] Test all interactive elements
  - [ ] Verify focus indicators
  - [ ] Test modal focus traps

- [ ] Screen reader testing
  - [ ] Test with NVDA (Windows)
  - [ ] Test with VoiceOver (macOS)
  - [ ] Verify announcements
  - [ ] Verify navigation

- [ ] Color contrast testing
  - [ ] Check all text/background combinations
  - [ ] Check all icons against backgrounds
  - [ ] Check focus indicators

### Phase 7: Documentation & Training

- [ ] Create component documentation
  - [ ] Storybook or similar
  - [ ] Usage examples
  - [ ] Accessibility notes

- [ ] Create developer guidelines
  - [ ] Code style guide
  - [ ] Accessibility checklist
  - [ ] Testing requirements

- [ ] Train team
  - [ ] Accessibility basics
  - [ ] Component library usage
  - [ ] Testing procedures

---

## Conclusion

This guideline establishes a comprehensive framework for implementing iconography and Bootstrap components in the React + TypeScript migration of Contoso University. By following these standards, we ensure:

✅ **Consistency** - Same icons and patterns across the application  
✅ **Accessibility** - WCAG 2.1 Level AA compliance  
✅ **Performance** - Tree-shakeable icons, optimized components  
✅ **Developer Experience** - Type-safe, reusable components  
✅ **User Experience** - Clear, intuitive interface

### Key Success Metrics

- **Accessibility:** Zero critical/serious axe violations
- **Performance:** Icon bundle < 50KB (with tree-shaking)
- **Test Coverage:** 100% of interactive components keyboard tested
- **Documentation:** 100% of reusable components documented
- **Compliance:** All forms, modals, navigation pass WCAG 2.1 AA

### Next Steps

1. Review and approve this guideline
2. Set up React + Bootstrap development environment
3. Create component library with accessibility built-in
4. Begin incremental migration starting with highest priority components
5. Test early and often with automated tools and manual testing
6. Iterate based on feedback from accessibility audits

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-12-30  
**Next Review:** After first Sprint of React migration  
**Owner:** Frontend Engineering Team
