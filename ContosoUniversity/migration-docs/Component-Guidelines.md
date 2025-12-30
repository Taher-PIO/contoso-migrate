# Component Guidelines - Contoso University

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Engineering Team  

---

## Table of Contents
- [Introduction](#introduction)
- [Component Architecture](#component-architecture)
- [Navigation Components](#navigation-components)
- [Form Components](#form-components)
- [Data Display Components](#data-display-components)
- [Button Components](#button-components)
- [Alert & Notification Components](#alert--notification-components)
- [Pagination Components](#pagination-components)
- [Layout Components](#layout-components)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Responsive Design Patterns](#responsive-design-patterns)
- [Testing Checklist](#testing-checklist)
- [Migration Recommendations](#migration-recommendations)

---

## Introduction

This document provides comprehensive guidelines for using Bootstrap components in Contoso University. It covers current usage patterns, accessibility best practices, and recommendations for improvement.

### Purpose

- Define standard component usage across the application
- Ensure consistent user experience
- Maintain WCAG 2.1 Level AA accessibility compliance
- Provide examples and code patterns
- Guide developers in making component choices

### Scope

This guide covers:
- Bootstrap 5.x components currently in use
- Custom component patterns
- Accessibility enhancements
- Responsive behavior
- Code examples and anti-patterns

---

## Component Architecture

### Current Pattern: Server-Side Rendered Components

**Technology:** ASP.NET Core Razor Pages + Bootstrap 5.x

**Characteristics:**
- Server-side HTML generation
- Full page refreshes for navigation
- Progressive enhancement via jQuery
- Bootstrap components for UI

**Component Structure:**
```
Page Request → Razor PageModel → HTML Generation → Bootstrap Styling → Browser Rendering
```

### Component Categories

| Category | Components | Usage Frequency |
|----------|-----------|-----------------|
| **Navigation** | Navbar, Nav | Every page |
| **Forms** | Form controls, validation | Create/Edit pages |
| **Data Display** | Tables, lists | Index pages |
| **Buttons** | Buttons, link buttons | All pages |
| **Alerts** | Alerts, validation messages | Forms, CRUD operations |
| **Pagination** | Custom pagination | List pages |
| **Layout** | Container, grid, card | All pages |

---

## Navigation Components

### Navbar (Primary Navigation)

**Current Implementation:**
```cshtml
<!-- Pages/Shared/_Layout.cshtml -->
<nav class="navbar navbar-expand-sm navbar-toggleable-sm navbar-light bg-white border-bottom box-shadow mb-3">
    <div class="container">
        <a class="navbar-brand" asp-area="" asp-page="/Index">Contoso University</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target=".navbar-collapse" 
                aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="navbar-collapse collapse d-sm-inline-flex justify-content-between">
            <ul class="navbar-nav flex-grow-1">
                <li class="nav-item">
                    <a class="nav-link text-dark" asp-area="" asp-page="/About">About</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark" asp-area="" asp-page="/Students/Index">Students</a>
                </li>
                <!-- More items -->
            </ul>
        </div>
    </div>
</nav>
```

**Accessibility Issues:**
- ❌ No `aria-label` on `<nav>` element
- ⚠️ No indication of active page
- ⚠️ Escape key doesn't close mobile menu

**Improved Implementation:**
```cshtml
<nav class="navbar navbar-expand-sm navbar-toggleable-sm navbar-light bg-white border-bottom box-shadow mb-3" 
     aria-label="Main navigation">
    <div class="container">
        <a class="navbar-brand" asp-area="" asp-page="/Index">Contoso University</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div id="navbarNav" class="navbar-collapse collapse d-sm-inline-flex justify-content-between">
            <ul class="navbar-nav flex-grow-1">
                <li class="nav-item">
                    <a class="nav-link text-dark @(ViewContext.RouteData.Values["page"]?.ToString() == "/About" ? "active" : "")" 
                       asp-area="" asp-page="/About" 
                       aria-current="@(ViewContext.RouteData.Values["page"]?.ToString() == "/About" ? "page" : null)">
                        About
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark @(ViewContext.RouteData.Values["page"]?.ToString()?.Contains("/Students") == true ? "active" : "")" 
                       asp-area="" asp-page="/Students/Index"
                       aria-current="@(ViewContext.RouteData.Values["page"]?.ToString()?.Contains("/Students") == true ? "page" : null)">
                        Students
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>
```

**CSS for Active State:**
```css
/* site.css */
.navbar .nav-link.active {
    color: var(--bs-primary) !important;
    font-weight: 600;
    border-bottom: 2px solid var(--bs-primary);
}
```

**JavaScript for Escape Key:**
```javascript
// site.js
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            navbarToggler?.click();
        }
    }
});
```

### Skip Navigation Link

**Purpose:** Allow keyboard users to bypass navigation

**Implementation:**
```cshtml
<!-- Pages/Shared/_Layout.cshtml -->
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <header>
        <nav>
            <!-- navigation -->
        </nav>
    </header>
    
    <div class="container">
        <main role="main" class="pb-3" id="main-content" tabindex="-1">
            @RenderBody()
        </main>
    </div>
</body>
```

**CSS:**
```css
/* site.css */
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px 16px;
    text-decoration: none;
    z-index: 100;
    border-radius: 0 0 4px 0;
}

.skip-link:focus {
    top: 0;
}
```

---

## Form Components

### Form Structure

**Current Pattern:**
```cshtml
<!-- Pages/Students/Create.cshtml -->
<div class="row">
    <div class="col-md-4">
        <form method="post">
            <div asp-validation-summary="ModelOnly" class="text-danger"></div>
            <div class="form-group">
                <label asp-for="Student.LastName" class="control-label"></label>
                <input asp-for="Student.LastName" class="form-control" />
                <span asp-validation-for="Student.LastName" class="text-danger"></span>
            </div>
            <div class="form-group">
                <input type="submit" value="Create" class="btn btn-primary" />
            </div>
        </form>
    </div>
</div>
```

**Accessibility Issues:**
- ⚠️ Validation summary not announced to screen readers
- ⚠️ No indication of required fields
- ⚠️ Focus doesn't move to errors on submit

### Improved Form Pattern

```cshtml
<div class="row">
    <div class="col-md-6 col-lg-4">
        <form method="post" id="studentForm">
            <!-- Validation Summary with ARIA -->
            <div asp-validation-summary="All" 
                 class="alert alert-danger" 
                 role="alert"
                 aria-live="polite"
                 aria-atomic="true"
                 id="validation-summary"
                 style="@(ViewData.ModelState.IsValid ? "display: none;" : "")">
            </div>
            
            <!-- Form Group with Required Indicator -->
            <div class="mb-3">
                <label asp-for="Student.LastName" class="form-label">
                    Last Name <span class="text-danger" aria-label="required">*</span>
                </label>
                <input asp-for="Student.LastName" 
                       class="form-control" 
                       aria-required="true"
                       aria-describedby="lastName-help lastName-validation" />
                <small id="lastName-help" class="form-text text-muted">
                    Enter student's last name (required)
                </small>
                <span id="lastName-validation" 
                      asp-validation-for="Student.LastName" 
                      class="invalid-feedback d-block"
                      role="alert"></span>
            </div>
            
            <div class="mb-3">
                <label asp-for="Student.FirstMidName" class="form-label">
                    First Name <span class="text-danger" aria-label="required">*</span>
                </label>
                <input asp-for="Student.FirstMidName" 
                       class="form-control" 
                       aria-required="true"
                       aria-describedby="firstName-validation" />
                <span id="firstName-validation" 
                      asp-validation-for="Student.FirstMidName" 
                      class="invalid-feedback d-block"
                      role="alert"></span>
            </div>
            
            <div class="mb-3">
                <label asp-for="Student.EnrollmentDate" class="form-label">
                    Enrollment Date
                </label>
                <input asp-for="Student.EnrollmentDate" 
                       class="form-control" 
                       type="date"
                       aria-describedby="enrollmentDate-validation" />
                <span id="enrollmentDate-validation" 
                      asp-validation-for="Student.EnrollmentDate" 
                      class="invalid-feedback d-block"
                      role="alert"></span>
            </div>
            
            <div class="mb-3">
                <button type="submit" class="btn btn-primary">Create Student</button>
                <a asp-page="./Index" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

@section Scripts {
    @{await Html.RenderPartialAsync("_ValidationScriptsPartial");}
    <script>
        // Move focus to validation summary on error
        $(document).ready(function() {
            const validationSummary = document.getElementById('validation-summary');
            if (validationSummary && validationSummary.style.display !== 'none') {
                validationSummary.setAttribute('tabindex', '-1');
                validationSummary.focus();
            }
        });
    </script>
}
```

### Form Component Patterns

#### Text Input

**Standard:**
```cshtml
<div class="mb-3">
    <label for="inputEmail" class="form-label">Email address</label>
    <input type="email" class="form-control" id="inputEmail" 
           aria-describedby="emailHelp" required>
    <small id="emailHelp" class="form-text text-muted">
        We'll never share your email with anyone else.
    </small>
</div>
```

#### Select Dropdown

```cshtml
<div class="mb-3">
    <label asp-for="Student.DepartmentID" class="form-label">Department</label>
    <select asp-for="Student.DepartmentID" 
            class="form-select" 
            asp-items="Model.DepartmentList"
            aria-describedby="department-validation">
        <option value="">-- Select Department --</option>
    </select>
    <span id="department-validation" 
          asp-validation-for="Student.DepartmentID" 
          class="invalid-feedback d-block"></span>
</div>
```

#### Checkbox

```cshtml
<div class="mb-3 form-check">
    <input type="checkbox" class="form-check-input" id="agreeTerms" required>
    <label class="form-check-label" for="agreeTerms">
        I agree to the terms and conditions <span class="text-danger">*</span>
    </label>
</div>
```

#### Radio Buttons

```cshtml
<fieldset class="mb-3">
    <legend class="form-label">Enrollment Status</legend>
    <div class="form-check">
        <input class="form-check-input" type="radio" name="status" id="statusActive" value="active" checked>
        <label class="form-check-label" for="statusActive">
            Active
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="radio" name="status" id="statusInactive" value="inactive">
        <label class="form-check-label" for="statusInactive">
            Inactive
        </label>
    </div>
</fieldset>
```

#### Textarea

```cshtml
<div class="mb-3">
    <label for="comments" class="form-label">Comments</label>
    <textarea class="form-control" id="comments" rows="4" 
              aria-describedby="comments-help"></textarea>
    <small id="comments-help" class="form-text text-muted">
        Optional: Add any additional comments (max 500 characters)
    </small>
</div>
```

### Search Form Pattern

**Current Implementation:**
```cshtml
<!-- Pages/Students/Index.cshtml -->
<form asp-page="./Index" method="get">
    <div class="form-actions no-color">
        <p>
            Find by name: 
            <input type="text" name="SearchString" value="@Model.CurrentFilter" />
            <input type="submit" value="Search" class="btn btn-primary" /> |
            <a asp-page="./Index">Back to full List</a>
        </p>
    </div>
</form>
```

**Improved Implementation:**
```cshtml
<form asp-page="./Index" method="get" class="mb-4" role="search">
    <div class="row g-3 align-items-end">
        <div class="col-md-4">
            <label for="searchString" class="form-label">Search Students</label>
            <input type="search" 
                   class="form-control" 
                   id="searchString"
                   name="SearchString" 
                   value="@Model.CurrentFilter" 
                   placeholder="Enter name to search"
                   aria-label="Search students by name" />
        </div>
        <div class="col-md-auto">
            <button type="submit" class="btn btn-primary">
                <i class="bi bi-search" aria-hidden="true"></i>
                Search
            </button>
        </div>
        <div class="col-md-auto">
            @if (!string.IsNullOrEmpty(Model.CurrentFilter))
            {
                <a asp-page="./Index" class="btn btn-secondary">
                    <i class="bi bi-x-circle" aria-hidden="true"></i>
                    Clear
                </a>
            }
        </div>
    </div>
</form>

@if (!string.IsNullOrEmpty(Model.CurrentFilter))
{
    <div class="alert alert-info" role="status">
        Showing results for: <strong>@Model.CurrentFilter</strong>
    </div>
}
```

---

## Data Display Components

### Tables

**Current Implementation:**
```cshtml
<!-- Pages/Students/Index.cshtml -->
<table class="table">
    <thead>
        <tr>
            <th>
                <a asp-page="./Index" asp-route-sortOrder="@Model.NameSort">
                    Last Name
                </a>
            </th>
            <th>First Name</th>
            <th>Enrollment Date</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        @foreach (var item in Model.Students)
        {
            <tr>
                <td>@Html.DisplayFor(modelItem => item.LastName)</td>
                <td>@Html.DisplayFor(modelItem => item.FirstMidName)</td>
                <td>@Html.DisplayFor(modelItem => item.EnrollmentDate)</td>
                <td>
                    <a asp-page="./Edit" asp-route-id="@item.ID">Edit</a> |
                    <a asp-page="./Details" asp-route-id="@item.ID">Details</a> |
                    <a asp-page="./Delete" asp-route-id="@item.ID">Delete</a>
                </td>
            </tr>
        }
    </tbody>
</table>
```

**Accessibility Issues:**
- ❌ No `<caption>` element
- ❌ Missing `scope` attributes
- ❌ Sortable columns don't indicate current sort
- ❌ Action links lack context

### Improved Table Pattern

```cshtml
<div class="table-responsive">
    <table class="table table-hover" aria-label="Student list">
        <caption class="visually-hidden">
            List of students with sorting and pagination. 
            Currently showing @Model.Students.Count of @Model.TotalCount students.
            @if (!string.IsNullOrEmpty(Model.CurrentFilter))
            {
                <text>Filtered by: @Model.CurrentFilter.</text>
            }
            @if (!string.IsNullOrEmpty(Model.CurrentSort))
            {
                <text>Sorted by: @Model.CurrentSort.</text>
            }
        </caption>
        <thead>
            <tr>
                <th scope="col">
                    <a asp-page="./Index" 
                       asp-route-sortOrder="@Model.NameSort"
                       asp-route-currentFilter="@Model.CurrentFilter"
                       aria-label="Sort by last name @(Model.CurrentSort == "name" ? "descending" : "ascending")"
                       aria-sort="@(Model.CurrentSort == "name" ? "ascending" : Model.CurrentSort == "name_desc" ? "descending" : "none")">
                        Last Name
                        @if (Model.CurrentSort == "name")
                        {
                            <span aria-hidden="true">↑</span>
                        }
                        else if (Model.CurrentSort == "name_desc")
                        {
                            <span aria-hidden="true">↓</span>
                        }
                    </a>
                </th>
                <th scope="col">First Name</th>
                <th scope="col">
                    <a asp-page="./Index" 
                       asp-route-sortOrder="@Model.DateSort"
                       asp-route-currentFilter="@Model.CurrentFilter"
                       aria-label="Sort by enrollment date @(Model.CurrentSort == "date" ? "descending" : "ascending")"
                       aria-sort="@(Model.CurrentSort == "date" ? "ascending" : Model.CurrentSort == "date_desc" ? "descending" : "none")">
                        Enrollment Date
                        @if (Model.CurrentSort == "date")
                        {
                            <span aria-hidden="true">↑</span>
                        }
                        else if (Model.CurrentSort == "date_desc")
                        {
                            <span aria-hidden="true">↓</span>
                        }
                    </a>
                </th>
                <th scope="col">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach (var item in Model.Students)
            {
                <tr>
                    <td>@Html.DisplayFor(modelItem => item.LastName)</td>
                    <td>@Html.DisplayFor(modelItem => item.FirstMidName)</td>
                    <td>@Html.DisplayFor(modelItem => item.EnrollmentDate)</td>
                    <td>
                        <a asp-page="./Edit" 
                           asp-route-id="@item.ID"
                           class="btn btn-sm btn-outline-primary"
                           aria-label="Edit @item.FirstMidName @item.LastName">
                            Edit
                        </a>
                        <a asp-page="./Details" 
                           asp-route-id="@item.ID"
                           class="btn btn-sm btn-outline-secondary"
                           aria-label="View details for @item.FirstMidName @item.LastName">
                            Details
                        </a>
                        <a asp-page="./Delete" 
                           asp-route-id="@item.ID"
                           class="btn btn-sm btn-outline-danger"
                           aria-label="Delete @item.FirstMidName @item.LastName">
                            Delete
                        </a>
                    </td>
                </tr>
            }
        </tbody>
    </table>
</div>

@if (Model.Students.Count == 0)
{
    <div class="alert alert-info" role="status">
        No students found.
        @if (!string.IsNullOrEmpty(Model.CurrentFilter))
        {
            <a asp-page="./Index">Clear search</a>
        }
    </div>
}
```

### Selected Row Pattern

**Current (Instructors page):**
```cshtml
@foreach (var item in Model.InstructorData.Instructors)
{
    string selectedRow = "";
    if (item.ID == Model.InstructorID)
    {
        selectedRow = "table-success";
    }
    <tr class="@selectedRow">
        <!-- row content -->
    </tr>
}
```

**Improved with Non-Color Indicator:**
```cshtml
@foreach (var item in Model.InstructorData.Instructors)
{
    var isSelected = item.ID == Model.InstructorID;
    <tr class="@(isSelected ? "table-success selected-row" : "")"
        aria-current="@(isSelected ? "true" : null)">
        <td>
            @if (isSelected)
            {
                <span class="visually-hidden">Currently selected: </span>
                <i class="bi bi-check-circle-fill text-success" aria-hidden="true"></i>
            }
            @Html.DisplayFor(modelItem => item.LastName)
        </td>
        <!-- rest of row -->
    </tr>
}
```

**CSS:**
```css
/* site.css */
.table .selected-row {
    border-left: 4px solid var(--bs-success);
    background-color: rgba(var(--bs-success-rgb), 0.1);
}
```

### Responsive Table Patterns

**Option 1: Horizontal Scroll (Current)**
```cshtml
<div class="table-responsive">
    <table class="table">
        <!-- table content -->
    </table>
</div>
```

**Option 2: Stacked on Mobile**
```cshtml
<div class="table-responsive-sm">
    <table class="table table-stacked-sm">
        <!-- table content -->
    </table>
</div>
```

**CSS for Stacked Tables:**
```css
@media (max-width: 575.98px) {
    .table-stacked-sm thead {
        display: none;
    }
    
    .table-stacked-sm tbody tr {
        display: block;
        margin-bottom: 1rem;
        border: 1px solid var(--bs-border-color);
        border-radius: var(--bs-border-radius);
    }
    
    .table-stacked-sm tbody td {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem;
        border: none;
        border-bottom: 1px solid var(--bs-border-color);
    }
    
    .table-stacked-sm tbody td::before {
        content: attr(data-label);
        font-weight: 600;
        margin-right: 1rem;
    }
    
    .table-stacked-sm tbody td:last-child {
        border-bottom: none;
    }
}
```

**Usage:**
```cshtml
<tr>
    <td data-label="Last Name">@item.LastName</td>
    <td data-label="First Name">@item.FirstMidName</td>
    <td data-label="Enrollment Date">@item.EnrollmentDate</td>
    <td data-label="Actions">
        <!-- action links -->
    </td>
</tr>
```

---

## Button Components

### Button Variants

**Primary Actions:**
```cshtml
<!-- Create, Save, Submit -->
<button type="submit" class="btn btn-primary">Save Changes</button>
<a asp-page="./Create" class="btn btn-primary">Create New</a>
```

**Secondary Actions:**
```cshtml
<!-- Cancel, Back -->
<a asp-page="./Index" class="btn btn-secondary">Cancel</a>
<a asp-page="./Index" class="btn btn-outline-secondary">Back to List</a>
```

**Destructive Actions:**
```cshtml
<!-- Delete -->
<button type="submit" class="btn btn-danger">Delete</button>
<a asp-page="./Delete" asp-route-id="@item.ID" class="btn btn-outline-danger">Delete</a>
```

**Success Actions:**
```cshtml
<!-- Approve, Confirm -->
<button type="button" class="btn btn-success">Approve</button>
```

### Button Sizes

```cshtml
<!-- Large -->
<button class="btn btn-primary btn-lg">Large Button</button>

<!-- Default -->
<button class="btn btn-primary">Default Button</button>

<!-- Small -->
<button class="btn btn-primary btn-sm">Small Button</button>
```

### Button Groups

```cshtml
<div class="btn-group" role="group" aria-label="Student actions">
    <a asp-page="./Edit" asp-route-id="@item.ID" class="btn btn-outline-primary">Edit</a>
    <a asp-page="./Details" asp-route-id="@item.ID" class="btn btn-outline-secondary">Details</a>
    <a asp-page="./Delete" asp-route-id="@item.ID" class="btn btn-outline-danger">Delete</a>
</div>
```

### Icon Buttons

**With Bootstrap Icons:**
```cshtml
<!-- Add to _Layout.cshtml -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">

<!-- Usage -->
<button type="submit" class="btn btn-primary">
    <i class="bi bi-save" aria-hidden="true"></i>
    Save
</button>

<button type="button" class="btn btn-secondary">
    <i class="bi bi-arrow-left" aria-hidden="true"></i>
    Back
</button>

<!-- Icon only button -->
<button type="button" class="btn btn-sm btn-outline-danger" aria-label="Delete student">
    <i class="bi bi-trash" aria-hidden="true"></i>
</button>
```

### Disabled State

**Correct Implementation:**
```cshtml
<!-- Button element -->
<button type="button" class="btn btn-primary" disabled>Cannot Click</button>

<!-- Link styled as button (when functionally disabled) -->
<a class="btn btn-primary disabled" aria-disabled="true" tabindex="-1" role="button">
    Cannot Click
</a>
```

**Anti-Pattern (Current):**
```cshtml
<!-- DON'T: Using only class for disabled state -->
<a asp-page="./Index" class="btn btn-primary disabled">
    Previous
</a>
```

### Loading State

```cshtml
<button type="submit" class="btn btn-primary" id="submitBtn">
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="display: none;"></span>
    <span class="button-text">Save Changes</span>
</button>

<script>
document.getElementById('submitBtn').addEventListener('click', function() {
    this.disabled = true;
    this.querySelector('.spinner-border').style.display = 'inline-block';
    this.querySelector('.button-text').textContent = 'Saving...';
});
</script>
```

---

## Alert & Notification Components

### Alert Types

**Success:**
```cshtml
<div class="alert alert-success" role="alert">
    <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
    Student created successfully!
</div>
```

**Danger:**
```cshtml
<div class="alert alert-danger" role="alert">
    <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
    <strong>Error:</strong> Unable to save changes. Please try again.
</div>
```

**Warning:**
```cshtml
<div class="alert alert-warning" role="alert">
    <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
    This action will affect multiple records.
</div>
```

**Info:**
```cshtml
<div class="alert alert-info" role="alert">
    <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
    You are viewing archived students.
</div>
```

### Dismissible Alerts

```cshtml
<div class="alert alert-success alert-dismissible fade show" role="alert">
    <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
    Student updated successfully!
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>
```

### Flash Messages (TempData)

**Set in PageModel:**
```csharp
// Pages/Students/Create.cshtml.cs
public async Task<IActionResult> OnPostAsync()
{
    if (!ModelState.IsValid)
    {
        return Page();
    }
    
    _context.Students.Add(Student);
    await _context.SaveChangesAsync();
    
    TempData["SuccessMessage"] = $"Student {Student.FullName} created successfully!";
    return RedirectToPage("./Index");
}
```

**Display in Layout or Page:**
```cshtml
<!-- Pages/Shared/_Layout.cshtml or individual pages -->
@if (TempData["SuccessMessage"] != null)
{
    <div class="alert alert-success alert-dismissible fade show" role="alert" id="flash-message">
        <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
        @TempData["SuccessMessage"]
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
}

@if (TempData["ErrorMessage"] != null)
{
    <div class="alert alert-danger alert-dismissible fade show" role="alert" id="flash-message">
        <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        @TempData["ErrorMessage"]
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
}

@section Scripts {
    <script>
        // Move focus to flash message
        $(document).ready(function() {
            const flashMessage = document.getElementById('flash-message');
            if (flashMessage) {
                flashMessage.setAttribute('tabindex', '-1');
                flashMessage.focus();
                
                // Auto-dismiss after 5 seconds
                setTimeout(function() {
                    const closeBtn = flashMessage.querySelector('.btn-close');
                    closeBtn?.click();
                }, 5000);
            }
        });
    </script>
}
```

---

## Pagination Components

### Current Implementation (Anti-Pattern)

```cshtml
<!-- Pages/Students/Index.cshtml -->
@{
    var prevDisabled = !Model.Students.HasPreviousPage ? "disabled" : "";
    var nextDisabled = !Model.Students.HasNextPage ? "disabled" : "";
}

<a asp-page="./Index"
   asp-route-pageIndex="@(Model.Students.PageIndex - 1)"
   class="btn btn-primary @prevDisabled">
    Previous
</a>
<a asp-page="./Index"
   asp-route-pageIndex="@(Model.Students.PageIndex + 1)"
   class="btn btn-primary @nextDisabled">
    Next
</a>
```

**Issues:**
- ❌ Disabled links are still focusable
- ❌ No indication of current page
- ❌ Not wrapped in semantic `<nav>` element
- ❌ Doesn't use Bootstrap pagination component

### Improved Pagination Pattern

```cshtml
<nav aria-label="Student list pagination" class="mt-4">
    <ul class="pagination justify-content-center">
        <!-- Previous Button -->
        <li class="page-item @(!Model.Students.HasPreviousPage ? "disabled" : "")">
            @if (Model.Students.HasPreviousPage)
            {
                <a class="page-link" 
                   asp-page="./Index" 
                   asp-route-sortOrder="@Model.CurrentSort"
                   asp-route-pageIndex="@(Model.Students.PageIndex - 1)"
                   asp-route-currentFilter="@Model.CurrentFilter">
                    <span aria-hidden="true">&laquo;</span>
                    <span class="visually-hidden">Previous</span>
                </a>
            }
            else
            {
                <span class="page-link">
                    <span aria-hidden="true">&laquo;</span>
                    <span class="visually-hidden">Previous</span>
                </span>
            }
        </li>
        
        <!-- Page Numbers -->
        @{
            var startPage = Math.Max(1, Model.Students.PageIndex - 2);
            var endPage = Math.Min(Model.TotalPages, Model.Students.PageIndex + 2);
        }
        
        @if (startPage > 1)
        {
            <li class="page-item">
                <a class="page-link" 
                   asp-page="./Index" 
                   asp-route-sortOrder="@Model.CurrentSort"
                   asp-route-pageIndex="1"
                   asp-route-currentFilter="@Model.CurrentFilter">
                    1
                </a>
            </li>
            @if (startPage > 2)
            {
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            }
        }
        
        @for (var i = startPage; i <= endPage; i++)
        {
            <li class="page-item @(i == Model.Students.PageIndex ? "active" : "")">
                @if (i == Model.Students.PageIndex)
                {
                    <span class="page-link" aria-current="page">
                        @i
                        <span class="visually-hidden">(current)</span>
                    </span>
                }
                else
                {
                    <a class="page-link" 
                       asp-page="./Index" 
                       asp-route-sortOrder="@Model.CurrentSort"
                       asp-route-pageIndex="@i"
                       asp-route-currentFilter="@Model.CurrentFilter">
                        @i
                    </a>
                }
            </li>
        }
        
        @if (endPage < Model.TotalPages)
        {
            @if (endPage < Model.TotalPages - 1)
            {
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            }
            <li class="page-item">
                <a class="page-link" 
                   asp-page="./Index" 
                   asp-route-sortOrder="@Model.CurrentSort"
                   asp-route-pageIndex="@Model.TotalPages"
                   asp-route-currentFilter="@Model.CurrentFilter">
                    @Model.TotalPages
                </a>
            </li>
        }
        
        <!-- Next Button -->
        <li class="page-item @(!Model.Students.HasNextPage ? "disabled" : "")">
            @if (Model.Students.HasNextPage)
            {
                <a class="page-link" 
                   asp-page="./Index" 
                   asp-route-sortOrder="@Model.CurrentSort"
                   asp-route-pageIndex="@(Model.Students.PageIndex + 1)"
                   asp-route-currentFilter="@Model.CurrentFilter">
                    <span aria-hidden="true">&raquo;</span>
                    <span class="visually-hidden">Next</span>
                </a>
            }
            else
            {
                <span class="page-link">
                    <span aria-hidden="true">&raquo;</span>
                    <span class="visually-hidden">Next</span>
                </span>
            }
        </li>
    </ul>
    
    <!-- Pagination Info -->
    <p class="text-center text-muted">
        Showing @((Model.Students.PageIndex - 1) * Model.PageSize + 1) 
        to @(Math.Min(Model.Students.PageIndex * Model.PageSize, Model.TotalCount)) 
        of @Model.TotalCount students
    </p>
</nav>
```

**Add to PageModel:**
```csharp
public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
public int TotalCount { get; set; }
public int PageSize { get; set; } = 10;
```

### Simple Pagination (Alternative)

**For smaller datasets:**
```cshtml
<nav aria-label="Pagination" class="mt-4">
    <ul class="pagination justify-content-center">
        <li class="page-item @(!Model.Students.HasPreviousPage ? "disabled" : "")">
            @if (Model.Students.HasPreviousPage)
            {
                <a class="page-link" asp-page="./Index" asp-route-pageIndex="@(Model.Students.PageIndex - 1)">
                    Previous
                </a>
            }
            else
            {
                <span class="page-link">Previous</span>
            }
        </li>
        
        <li class="page-item active">
            <span class="page-link">
                Page @Model.Students.PageIndex of @Model.TotalPages
            </span>
        </li>
        
        <li class="page-item @(!Model.Students.HasNextPage ? "disabled" : "")">
            @if (Model.Students.HasNextPage)
            {
                <a class="page-link" asp-page="./Index" asp-route-pageIndex="@(Model.Students.PageIndex + 1)">
                    Next
                </a>
            }
            else
            {
                <span class="page-link">Next</span>
            }
        </li>
    </ul>
</nav>
```

---

## Layout Components

### Container

**Full-width container:**
```cshtml
<div class="container-fluid">
    <!-- Full width content -->
</div>
```

**Fixed-width container (current):**
```cshtml
<div class="container">
    <!-- Max-width content -->
</div>
```

**Responsive container:**
```cshtml
<div class="container-md">
    <!-- Full width on small screens, fixed width on medium+ -->
</div>
```

### Grid System

**Two-column layout:**
```cshtml
<div class="row">
    <div class="col-md-8">
        <!-- Main content -->
    </div>
    <div class="col-md-4">
        <!-- Sidebar -->
    </div>
</div>
```

**Three-column layout:**
```cshtml
<div class="row">
    <div class="col-md-4">
        <!-- Column 1 -->
    </div>
    <div class="col-md-4">
        <!-- Column 2 -->
    </div>
    <div class="col-md-4">
        <!-- Column 3 -->
    </div>
</div>
```

**Form grid:**
```cshtml
<div class="row g-3">
    <div class="col-md-6">
        <label for="firstName" class="form-label">First Name</label>
        <input type="text" class="form-control" id="firstName">
    </div>
    <div class="col-md-6">
        <label for="lastName" class="form-label">Last Name</label>
        <input type="text" class="form-control" id="lastName">
    </div>
</div>
```

### Card Component

**Basic card:**
```cshtml
<div class="card">
    <div class="card-header">
        <h5 class="card-title mb-0">Student Statistics</h5>
    </div>
    <div class="card-body">
        <p class="card-text">Total Students: @Model.TotalStudents</p>
        <p class="card-text">Average GPA: @Model.AverageGPA</p>
    </div>
    <div class="card-footer text-muted">
        Last updated: @DateTime.Now.ToString("g")
    </div>
</div>
```

**Card grid:**
```cshtml
<div class="row g-4">
    @foreach (var department in Model.Departments)
    {
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">@department.Name</h5>
                    <p class="card-text">Budget: @department.Budget.ToString("C")</p>
                    <p class="card-text">
                        <small class="text-muted">
                            Administrator: @department.Administrator
                        </small>
                    </p>
                </div>
                <div class="card-footer">
                    <a asp-page="./Details" asp-route-id="@department.DepartmentID" 
                       class="btn btn-sm btn-outline-primary">
                        View Details
                    </a>
                </div>
            </div>
        </div>
    }
</div>
```

---

## Accessibility Guidelines

### WCAG 2.1 Level AA Checklist

#### Perceivable

- ✅ **1.1.1 Non-text Content:** All images have alt text
- ✅ **1.3.1 Info and Relationships:** Semantic HTML and ARIA labels
- ✅ **1.3.2 Meaningful Sequence:** Logical reading order
- ✅ **1.3.3 Sensory Characteristics:** Not relying only on shape/color
- ✅ **1.4.1 Use of Color:** Not using color alone to convey information
- ✅ **1.4.3 Contrast (Minimum):** 4.5:1 contrast ratio for text
- ✅ **1.4.4 Resize text:** Text can be resized to 200%
- ✅ **1.4.5 Images of Text:** Avoid images of text
- ✅ **1.4.10 Reflow:** Content reflows at 320px width
- ✅ **1.4.11 Non-text Contrast:** 3:1 contrast for UI components
- ✅ **1.4.12 Text Spacing:** Text spacing adjustable
- ✅ **1.4.13 Content on Hover or Focus:** No loss of content

#### Operable

- ✅ **2.1.1 Keyboard:** All functionality available via keyboard
- ✅ **2.1.2 No Keyboard Trap:** Can navigate away with keyboard
- ✅ **2.1.4 Character Key Shortcuts:** No single-key shortcuts (or can disable)
- ✅ **2.2.1 Timing Adjustable:** No time limits (or adjustable)
- ✅ **2.2.2 Pause, Stop, Hide:** No auto-updating content (or can pause)
- ✅ **2.3.1 Three Flashes:** No flashing content
- ✅ **2.4.1 Bypass Blocks:** Skip navigation link provided
- ✅ **2.4.2 Page Titled:** Each page has descriptive title
- ✅ **2.4.3 Focus Order:** Logical focus order
- ✅ **2.4.4 Link Purpose:** Link text describes purpose
- ✅ **2.4.5 Multiple Ways:** Multiple ways to find pages (nav, search)
- ✅ **2.4.6 Headings and Labels:** Descriptive headings and labels
- ✅ **2.4.7 Focus Visible:** Keyboard focus indicator visible
- ✅ **2.5.1 Pointer Gestures:** No multi-point or path-based gestures
- ✅ **2.5.2 Pointer Cancellation:** Can cancel accidental clicks
- ✅ **2.5.3 Label in Name:** Accessible name contains visible label
- ✅ **2.5.4 Motion Actuation:** No motion-only activation

#### Understandable

- ✅ **3.1.1 Language of Page:** `lang` attribute on `<html>`
- ✅ **3.1.2 Language of Parts:** `lang` attribute on foreign text
- ✅ **3.2.1 On Focus:** No context change on focus
- ✅ **3.2.2 On Input:** No unexpected context change on input
- ✅ **3.2.3 Consistent Navigation:** Navigation order consistent
- ✅ **3.2.4 Consistent Identification:** Components labeled consistently
- ✅ **3.3.1 Error Identification:** Errors clearly identified
- ✅ **3.3.2 Labels or Instructions:** Labels provided for input
- ✅ **3.3.3 Error Suggestion:** Error correction suggestions provided
- ✅ **3.3.4 Error Prevention:** Confirm before submitting important data

#### Robust

- ✅ **4.1.1 Parsing:** Valid HTML
- ✅ **4.1.2 Name, Role, Value:** ARIA attributes used correctly
- ✅ **4.1.3 Status Messages:** Status messages announced

### ARIA Attributes Quick Reference

**Landmarks:**
```html
<nav aria-label="Main navigation">
<main id="main-content">
<footer>
<aside aria-label="Related information">
```

**Forms:**
```html
<input aria-required="true">
<input aria-invalid="true" aria-describedby="error-message">
<div role="alert" aria-live="polite">
```

**Tables:**
```html
<table aria-label="Student list">
<caption>List of enrolled students</caption>
<th scope="col">
<tr aria-current="true"> <!-- for selected row -->
```

**Buttons/Links:**
```html
<button aria-label="Delete student John Doe">
<a aria-current="page"> <!-- for active nav link -->
<button aria-expanded="false" aria-controls="menu">
```

---

## Responsive Design Patterns

### Breakpoint Reference

| Breakpoint | Class Infix | Dimensions |
|------------|-------------|------------|
| Extra small | None | <576px |
| Small | `sm` | ≥576px |
| Medium | `md` | ≥768px |
| Large | `lg` | ≥992px |
| Extra large | `xl` | ≥1200px |
| Extra extra large | `xxl` | ≥1400px |

### Responsive Utilities

**Hide on mobile:**
```html
<div class="d-none d-md-block">
    <!-- Hidden on mobile, visible on md and up -->
</div>
```

**Show only on mobile:**
```html
<div class="d-block d-md-none">
    <!-- Visible on mobile only -->
</div>
```

**Responsive text alignment:**
```html
<p class="text-center text-md-start">
    <!-- Centered on mobile, left-aligned on md+ -->
</p>
```

**Responsive spacing:**
```html
<div class="mb-3 mb-md-5">
    <!-- 1rem margin-bottom on mobile, 3rem on md+ -->
</div>
```

### Mobile-First Approach

**Always design for mobile first:**
```cshtml
<!-- Mobile: Full width form -->
<!-- Desktop: Half width centered -->
<div class="row justify-content-center">
    <div class="col-12 col-md-6 col-lg-4">
        <form method="post">
            <!-- form fields -->
        </form>
    </div>
</div>
```

---

## Testing Checklist

### Component Testing Checklist

For each component, verify:

#### Visual Testing
- [ ] Renders correctly on mobile (320px)
- [ ] Renders correctly on tablet (768px)
- [ ] Renders correctly on desktop (1200px)
- [ ] Renders correctly at 200% zoom
- [ ] Renders correctly at 400% zoom
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators are visible
- [ ] Works in high contrast mode

#### Functional Testing
- [ ] All interactive elements work with mouse
- [ ] All interactive elements work with keyboard
- [ ] All interactive elements work with touch
- [ ] Form validation works correctly
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Loading states work correctly

#### Accessibility Testing
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces all content correctly
- [ ] ARIA attributes are correct
- [ ] Semantic HTML is used
- [ ] Alt text on images
- [ ] Labels on form fields
- [ ] Error identification is clear
- [ ] No color-only information

#### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Migration Recommendations

### Short-term Improvements (Next Sprint)

1. **Fix Pagination Component**
   - Replace custom pagination with Bootstrap component
   - Add page numbers
   - Fix disabled state

2. **Enhance Table Accessibility**
   - Add `<caption>` elements
   - Add `scope` attributes
   - Improve sort indicators
   - Add context to action links

3. **Improve Form Validation**
   - Add `aria-live` regions
   - Move focus to errors
   - Add required indicators

4. **Add Skip Navigation**
   - Implement skip link
   - Test keyboard navigation

### Medium-term Improvements (Next Quarter)

5. **Implement Flash Messages**
   - Use TempData for notifications
   - Add auto-dismiss
   - Move focus to messages

6. **Create Reusable Components**
   - Extract pagination to partial view
   - Extract table headers to partial view
   - Create form field partial views

7. **Add Loading States**
   - Implement button loading spinners
   - Add page loading indicators
   - Prevent double submission

8. **Enhance Responsive Design**
   - Implement stacked tables on mobile
   - Optimize form layouts
   - Test all breakpoints

### Long-term Improvements (Future)

9. **Component Library**
   - Document all patterns
   - Create style guide
   - Build pattern library

10. **Advanced Accessibility**
    - Implement keyboard shortcuts
    - Add roving tabindex for tables
    - Enhance focus management

11. **Performance Optimization**
    - Lazy load off-screen components
    - Optimize table rendering
    - Add virtualization for large lists

---

## Conclusion

These component guidelines provide a comprehensive reference for building accessible, consistent, and user-friendly interfaces in Contoso University. By following these patterns, developers can:

- ✅ Ensure WCAG 2.1 Level AA compliance
- ✅ Maintain consistent user experience
- ✅ Build responsive, mobile-friendly interfaces
- ✅ Leverage Bootstrap components effectively
- ✅ Implement accessibility best practices

### Key Takeaways

1. **Always use semantic HTML** - Let HTML do the heavy lifting for accessibility
2. **Test with keyboard only** - Ensure all functionality works without a mouse
3. **Provide context for screen readers** - Use ARIA labels and descriptive text
4. **Don't rely on color alone** - Use icons, text, and borders
5. **Mobile-first approach** - Design for small screens first, then enhance
6. **Validate with real users** - Test with assistive technology users
7. **Document patterns** - Create reusable, documented components

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-12-30  
**Next Review:** After implementing short-term improvements  
**Owner:** Frontend Development Team
