# Localization & Internationalization (I18n) Analysis

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Migration Architect  
**Status:** Draft

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Current State Assessment](#current-state-assessment)
- [Localization Framework Options](#localization-framework-options)
- [Supported Locales & Coverage](#supported-locales--coverage)
- [Translation Pipeline](#translation-pipeline)
- [Date, Number & Timezone Handling](#date-number--timezone-handling)
- [RTL Support & Bidirectional Text](#rtl-support--bidirectional-text)
- [Resource Loading Strategy](#resource-loading-strategy)
- [Pluralization Rules](#pluralization-rules)
- [Testing Strategy](#testing-strategy)
- [Migration Notes for Target Stack](#migration-notes-for-target-stack)
- [Implementation Recommendations](#implementation-recommendations)

---

## Executive Summary

ContosoUniversity currently **does not implement any localization or internationalization features**. The application is entirely English-language, with hardcoded strings in Razor views, model annotations, and validation messages. All dates, numbers, and currency values use default .NET formatting without culture-specific adaptation.

### Key Findings

- ❌ **No i18n framework**: No evidence of `IStringLocalizer`, resource files (.resx), or third-party i18n libraries
- ❌ **No locale configuration**: No culture setup in `Program.cs` or middleware pipeline
- ❌ **Hardcoded strings**: All UI text embedded directly in `.cshtml` files and data annotations
- ❌ **Default formatting**: Dates use hardcoded format string `{0:yyyy-MM-dd}`, no number localization
- ❌ **No RTL support**: No bidirectional text handling or layout mirroring
- ⚠️ **Limited scope**: Educational domain limits complexity (no e-commerce, multi-currency, etc.)

### Localization Readiness Score: **10/100**

The application would require significant refactoring to support multiple languages and regional formats.

---

## Current State Assessment

### Code Inventory

#### Hardcoded Strings in Views

**Location:** `/Pages/Students/Index.cshtml`

```cshtml
<h2>Students</h2>
<a asp-page="Create">Create New</a>
Find by name: 
<input type="submit" value="Search" class="btn btn-primary" />
<a asp-page="./Index">Back to full List</a>
```

**Assessment:** All UI labels and button text are English strings. No localization keys or resource lookups.

#### Hardcoded Strings in Model Annotations

**Location:** `/Models/Student.cs`

```csharp
[Display(Name = "Last Name")]
public string LastName { get; set; }

[StringLength(50, ErrorMessage = "First name cannot be longer than 50 characters.")]
[Display(Name = "First Name")]
public string FirstMidName { get; set; }

[Display(Name = "Enrollment Date")]
public DateTime EnrollmentDate { get; set; }
```

**Assessment:** Display names and validation error messages are hardcoded. Cannot be translated without code changes.

#### Date Formatting

**Location:** `/Models/Student.cs`

```csharp
[DataType(DataType.Date)]
[DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
public DateTime EnrollmentDate { get; set; }
```

**Assessment:** Fixed ISO 8601 date format. Does not respect user's locale preference (e.g., MM/dd/yyyy for US, dd/MM/yyyy for EU).

#### Name Formatting

**Location:** `/Models/Student.cs`

```csharp
public string FullName
{
    get
    {
        return LastName + ", " + FirstMidName;
    }
}
```

**Assessment:** Name order assumes Western naming convention (LastName, FirstName). Not suitable for cultures with different name ordering (e.g., Hungarian, Japanese).

### Dependencies Analysis

**Current NuGet Packages:**
- No `Microsoft.Extensions.Localization`
- No `Microsoft.AspNetCore.Localization`
- No third-party i18n libraries (ICU, i18next, etc.)

**JavaScript Libraries:**
- jQuery Validation (no i18n)
- Bootstrap (supports RTL via `bootstrap-rtl.css` - not included)

### Configuration Analysis

**appsettings.json:**
```json
{
  "PageSize": 3,
  "Logging": { ... },
  "AllowedHosts": "*",
  "ConnectionStrings": { ... }
}
```

**Assessment:** No locale configuration, supported cultures list, or default culture setting.

**Program.cs:**
```csharp
builder.Services.AddRazorPages();
// No RequestLocalizationOptions
// No culture providers configured
```

**Assessment:** No localization middleware registered. Application runs in invariant culture or server's default culture.

---

## Localization Framework Options

### Option 1: ASP.NET Core Built-in Localization (Recommended for .NET 8)

**Technology Stack:**
- `Microsoft.Extensions.Localization` (IStringLocalizer)
- `.resx` resource files (XML-based)
- `RequestLocalizationMiddleware`
- Data Annotations localization

**Pros:**
- ✅ Native .NET integration, no third-party dependencies
- ✅ Strong typing with `IStringLocalizer<T>`
- ✅ Built-in culture middleware (query string, cookie, Accept-Language header)
- ✅ Supports validation message localization
- ✅ Works seamlessly with Razor Pages and MVC
- ✅ Visual Studio tooling for .resx editing

**Cons:**
- ❌ .resx files are cumbersome (XML, requires recompilation)
- ❌ No runtime translation updates without redeployment
- ❌ Limited pluralization support (requires custom logic)
- ❌ No contextual translations (same key with different meanings)

**Best For:** Server-rendered applications (Razor Pages, MVC) with moderate localization needs.

---

### Option 2: FormatJS / react-intl (JavaScript-based)

**Technology Stack:**
- FormatJS (ECMA-402 Intl API)
- JSON translation files
- ICU MessageFormat syntax
- React integration (if migrating frontend)

**Pros:**
- ✅ Rich pluralization and gender support (ICU MessageFormat)
- ✅ JSON-based translations (easy to edit, CI/CD friendly)
- ✅ Excellent date/number/currency formatting
- ✅ Runtime translation updates without recompilation
- ✅ Strong community and tooling (extract, compile, validate)

**Cons:**
- ❌ Requires React/Angular/Vue frontend (not suitable for Razor Pages)
- ❌ Duplication if backend also needs localization
- ❌ Client-side only (server-rendered pages not supported)
- ❌ Adds JavaScript bundle size (~50KB minified)

**Best For:** Single-page applications (SPA) with client-side rendering.

---

### Option 3: i18next (Multi-platform)

**Technology Stack:**
- i18next core library
- JSON translation files
- Backend plugin for .NET integration (i18next-http-backend)
- Optional: i18next-icu for ICU MessageFormat

**Pros:**
- ✅ Works on both client and server (Node.js, .NET via HTTP API)
- ✅ JSON-based translations with namespaces
- ✅ Rich plugin ecosystem (lazy loading, caching, validation)
- ✅ Runtime translation updates (fetch from CDN or API)
- ✅ Strong pluralization and interpolation

**Cons:**
- ❌ Requires infrastructure for translation file hosting
- ❌ Not native to .NET (integration via REST API or file system)
- ❌ Overkill for server-only Razor Pages application
- ❌ Additional complexity in build/deployment pipeline

**Best For:** Hybrid applications with both server and client-side rendering, or multi-platform projects (web + mobile).

---

### Option 4: GNU gettext (Legacy, Unix-style)

**Technology Stack:**
- `.po` / `.mo` files
- `gettext` CLI tools
- .NET port: `GNU.Gettext` or `NGettext`

**Pros:**
- ✅ Industry standard for open-source projects
- ✅ Extensive tooling (PoEdit, Weblate, Crowdin support)
- ✅ Context and plural forms support
- ✅ Translator-friendly format

**Cons:**
- ❌ Not idiomatic in .NET ecosystem
- ❌ Requires external build steps (msgfmt compilation)
- ❌ Poor Visual Studio integration
- ❌ Limited adoption in ASP.NET Core projects

**Best For:** Cross-platform projects already using gettext, or teams with existing .po translation workflows.

---

### Recommendation Matrix

| Scenario                                           | Recommended Framework                |
| -------------------------------------------------- | ------------------------------------ |
| Razor Pages monolith (current state)               | **ASP.NET Core Localization**        |
| Migrating to Blazor Server                         | **ASP.NET Core Localization**        |
| Migrating to Blazor WebAssembly                    | **Blazor Localization** + JSON       |
| Migrating to React/Angular SPA                     | **FormatJS / react-intl**            |
| Hybrid (Razor Pages + JavaScript-heavy frontend)   | **ASP.NET Core + i18next**           |
| Multi-platform (Web + Mobile)                      | **i18next** (shared translations)    |

**For ContosoUniversity migration to .NET 8 Razor Pages → Use ASP.NET Core Localization**

---

## Supported Locales & Coverage

### Recommended Locale Support

Based on common educational institutions and .NET globalization support:

| Locale Code | Language         | Region         | Priority | Coverage | Notes                                      |
| ----------- | ---------------- | -------------- | -------- | -------- | ------------------------------------------ |
| `en-US`     | English          | United States  | **P0**   | 100%     | Default, current state                     |
| `en-GB`     | English          | United Kingdom | **P1**   | 0%       | Minimal changes (date format, spelling)    |
| `es-ES`     | Spanish          | Spain          | **P1**   | 0%       | Large Spanish-speaking student base        |
| `es-MX`     | Spanish          | Mexico         | **P1**   | 0%       | Latin American variant                     |
| `fr-FR`     | French           | France         | **P2**   | 0%       | European education market                  |
| `de-DE`     | German           | Germany        | **P2**   | 0%       | European education market                  |
| `zh-CN`     | Chinese Simp.    | China          | **P2**   | 0%       | Large international student population     |
| `ja-JP`     | Japanese         | Japan          | **P2**   | 0%       | Asian market, complex pluralization        |
| `ar-SA`     | Arabic           | Saudi Arabia   | **P3**   | 0%       | **Requires RTL support**                   |
| `he-IL`     | Hebrew           | Israel         | **P3**   | 0%       | **Requires RTL support**                   |
| `pt-BR`     | Portuguese       | Brazil         | **P3**   | 0%       | Latin American market                      |
| `ru-RU`     | Russian          | Russia         | **P3**   | 0%       | Eastern European market                    |
| `ko-KR`     | Korean           | South Korea    | **P3**   | 0%       | Asian market                               |
| `it-IT`     | Italian          | Italy          | **P3**   | 0%       | European market                            |

### Coverage Gaps (Current State)

| Component                  | Current Coverage | Required for Full Localization |
| -------------------------- | ---------------- | ------------------------------ |
| UI Labels                  | 0% (hardcoded)   | 100% via `IStringLocalizer`    |
| Validation Messages        | 0% (hardcoded)   | 100% via resource files        |
| Email Templates            | N/A (no emails)  | 100% if email feature added    |
| PDF Reports                | N/A (no reports) | 100% if report feature added   |
| Error Messages             | 0% (hardcoded)   | 100% via localized exceptions  |
| Date/Time Display          | Fixed format     | Culture-aware formatting       |
| Number/Currency            | Default          | Culture-aware formatting       |
| Sorting/Collation          | Default          | Culture-aware sorting          |
| Search (case/diacritics)   | Case-insensitive | Culture-aware search           |

### Translation Workflow Ownership

| Phase                   | Responsible Role             | Tool/Process                              |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| String Extraction       | Developer                    | .resx extraction or `dotnet-gettext`      |
| Context Documentation   | Developer                    | XML comments in resource files            |
| Translation             | Professional Translator      | SDL Trados, Crowdin, or manual editing    |
| Review                  | Native Speaker (QA)          | Linguistic testing in staging environment |
| Integration             | DevOps                       | Embed .resx in build, verify checksums    |
| Validation              | Automated Tests              | i18n test suite (missing keys, encoding)  |

---

## Translation Pipeline

### Proposed Workflow (ASP.NET Core Localization)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Translation Pipeline                               │
└────────────────────────────────────────────────────────────────────────┘

1. Development Phase
   ├─ Developer writes code with IStringLocalizer["Key"]
   ├─ Add entries to Resources/SharedResources.en-US.resx
   └─ Commit .resx files to Git

2. Extraction Phase (CI/CD Trigger)
   ├─ Extract new/modified keys from .resx files
   ├─ Generate translation request CSV/XLIFF
   └─ Upload to Translation Management System (TMS)

3. Translation Phase
   ├─ Translator receives notification via TMS
   ├─ Translate strings with context and screenshots
   ├─ Review by native speaker
   └─ Approve and export translated .resx

4. Integration Phase
   ├─ Download completed .resx files from TMS
   ├─ Validate format and encoding (UTF-8)
   ├─ Run i18n tests (missing keys, encoding issues)
   └─ Merge into main branch

5. Build Phase
   ├─ .resx files compiled into satellite assemblies
   ├─ Package with application
   └─ Deploy to staging/production

6. Validation Phase
   ├─ Smoke tests in each locale
   ├─ Visual regression tests (text overflow, truncation)
   └─ Linguistic QA by native speakers
```

### Translation Management Systems (TMS)

| TMS              | Pros                                          | Cons                            | Cost            |
| ---------------- | --------------------------------------------- | ------------------------------- | --------------- |
| **Crowdin**      | .resx support, GitHub integration, continuous localization | Premium features costly         | Free tier available |
| **Lokalise**     | Developer-friendly, CLI tools, branching      | Learning curve                  | Paid plans only |
| **Transifex**    | Open source friendly, REST API                | UI feels dated                  | Free tier available |
| **SDL Trados**   | Enterprise-grade, translation memory          | Expensive, heavyweight          | Enterprise pricing |
| **POEditor**     | Simple UI, affordable                         | Limited .resx support (via plugin) | Free tier available |
| **Manual (Excel)**| No cost, full control                         | Error-prone, no version control | Free            |

**Recommendation:** Start with **Crowdin Community** (free for open-source) or **manual Excel workflow** for MVP. Scale to Lokalise/Transifex when translation volume increases.

---

## Date, Number & Timezone Handling

### Date Formatting

#### Current Implementation

```csharp
[DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
public DateTime EnrollmentDate { get; set; }
```

**Problem:** Hardcoded ISO 8601 format. Confusing for users in US (expect MM/dd/yyyy) or Europe (dd/MM/yyyy).

#### Recommended Approach

```csharp
// Remove hardcoded format string
[DataType(DataType.Date)]
public DateTime EnrollmentDate { get; set; }
```

**In Razor View:**
```cshtml
@Model.EnrollmentDate.ToString("d", CultureInfo.CurrentCulture)
<!-- Outputs: 12/30/2025 (en-US), 30/12/2025 (en-GB), 30.12.2025 (de-DE) -->
```

**Or using Tag Helpers:**
```cshtml
<span asp-format="{0:d}">@Model.EnrollmentDate</span>
```

### Culture-Aware Date Patterns

| Locale  | Short Date (d) | Long Date (D)                  | Medium Date     |
| ------- | -------------- | ------------------------------ | --------------- |
| en-US   | 12/30/2025     | Monday, December 30, 2025      | Dec 30, 2025    |
| en-GB   | 30/12/2025     | Monday, 30 December 2025       | 30 Dec 2025     |
| de-DE   | 30.12.2025     | Montag, 30. Dezember 2025      | 30. Dez. 2025   |
| fr-FR   | 30/12/2025     | lundi 30 décembre 2025         | 30 déc. 2025    |
| ja-JP   | 2025/12/30     | 2025年12月30日月曜日            | 2025年12月30日  |
| ar-SA   | ٣٠‏/١٢‏/٢٠٢٥   | الاثنين، 30 ديسمبر 2025       | ٣٠‏/١٢‏/٢٠٢٥    |

### Number Formatting

**Current:** No explicit formatting (uses default culture).

**Recommended:**
```csharp
// In models
[DisplayFormat(DataFormatString = "{0:N0}")]  // Thousand separators
public int Credits { get; set; }

[DisplayFormat(DataFormatString = "{0:C}")]  // Currency
public decimal Budget { get; set; }
```

**Culture-Aware Number Examples:**

| Value       | en-US       | de-DE       | fr-FR       | ja-JP       |
| ----------- | ----------- | ----------- | ----------- | ----------- |
| 1234567.89  | 1,234,567.89| 1.234.567,89| 1 234 567,89| 1,234,567.89|
| $50,000     | $50,000.00  | 50.000,00 € | 50 000,00 € | ¥50,000     |

### Timezone Handling

**Current State:** Application stores `DateTime` without timezone information (assumes local server time).

**Challenges:**
- ❌ Students in different timezones see inconsistent enrollment dates
- ❌ No daylight saving time handling
- ❌ Server time may differ from user's time

**Recommended Approach:**

1. **Store UTC in Database:**
```csharp
public DateTime EnrollmentDateUtc { get; set; }  // Always UTC
```

2. **Convert to User's Timezone on Display:**
```csharp
// In Razor view or page model
var userTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
var localTime = TimeZoneInfo.ConvertTimeFromUtc(Model.EnrollmentDateUtc, userTimeZone);
```

3. **Use NodaTime for Complex Scenarios:**
```xml
<PackageReference Include="NodaTime" Version="3.1.0" />
```

**NodaTime Benefits:**
- Explicit timezone handling (no ambiguous DateTime)
- Daylight saving time awareness
- Immutable types (thread-safe)
- Better API for date arithmetic

---

## RTL Support & Bidirectional Text

### Current State

❌ No RTL (Right-to-Left) support implemented.

### RTL Languages

| Language | Locale  | Writing Direction | Complexity     |
| -------- | ------- | ----------------- | -------------- |
| Arabic   | ar-*    | RTL               | High (ligatures, shaping) |
| Hebrew   | he-IL   | RTL               | Medium         |
| Persian  | fa-IR   | RTL               | High (similar to Arabic)  |
| Urdu     | ur-PK   | RTL               | High (Arabic script)      |

### Implementation Requirements

#### 1. HTML Direction Attribute

```cshtml
@{
    var culture = CultureInfo.CurrentUICulture;
    var dir = culture.TextInfo.IsRightToLeft ? "rtl" : "ltr";
}
<!DOCTYPE html>
<html dir="@dir" lang="@culture.TwoLetterISOLanguageName">
```

#### 2. CSS Layout Mirroring

**Current Bootstrap:**
```html
<link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.min.css" />
```

**Add Bootstrap RTL:**
```html
@if (CultureInfo.CurrentUICulture.TextInfo.IsRightToLeft)
{
    <link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.rtl.min.css" />
}
else
{
    <link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.min.css" />
}
```

#### 3. Logical CSS Properties

Replace directional properties with logical equivalents:

| Physical Property | Logical Property   | RTL Behavior           |
| ----------------- | ------------------ | ---------------------- |
| `margin-left`     | `margin-inline-start` | Becomes `margin-right` |
| `padding-right`   | `padding-inline-end`  | Becomes `padding-left` |
| `text-align: left`| `text-align: start`   | Becomes `right`        |
| `float: left`     | `float: inline-start` | Becomes `right`        |

#### 4. Bidirectional Text (Bidi)

**Problem:** Mixing LTR and RTL text (e.g., English name in Arabic sentence).

**Solution:** Use Unicode control characters or HTML elements:

```html
<!-- Isolate LTR text in RTL context -->
<span dir="ltr">John Smith</span> قام بالتسجيل في
```

**Or use CSS:**
```css
.student-name {
    unicode-bidi: isolate;
}
```

#### 5. Number/Date Formatting in RTL

**Arabic Numerals vs. Hindu-Arabic:**

| Locale  | Number System          | Example     |
| ------- | ---------------------- | ----------- |
| ar-SA   | Western Arabic (default) | 1234567   |
| ar-SA   | Eastern Arabic (optional)| ١٢٣٤٥٦٧  |
| fa-IR   | Persian                | ۱۲۳۴۵۶۷   |

**Configuration:**
```csharp
var culture = new CultureInfo("ar-SA");
culture.NumberFormat.DigitSubstitution = DigitShapes.NativeNational;  // Use Eastern numerals
CultureInfo.CurrentCulture = culture;
```

### RTL Testing Checklist

- [ ] Navigation menu reverses (leftmost item becomes rightmost)
- [ ] Tables align right (headers and data cells)
- [ ] Form labels align to the right of inputs
- [ ] Pagination arrows flip direction
- [ ] Breadcrumbs reverse order
- [ ] Icons with directional meaning (arrows, chevrons) mirror
- [ ] Scrollbars appear on left side (browser-dependent)
- [ ] Text truncation uses correct ellipsis direction
- [ ] Modal dialogs align close button to left

---

## Resource Loading Strategy

### File Organization

**Recommended Structure:**

```
/ContosoUniversity/
├── Resources/
│   ├── SharedResources.en-US.resx       (default locale)
│   ├── SharedResources.es-ES.resx       (Spanish)
│   ├── SharedResources.fr-FR.resx       (French)
│   ├── SharedResources.de-DE.resx       (German)
│   ├── SharedResources.ar-SA.resx       (Arabic)
│   ├── Pages/
│   │   ├── Students/
│   │   │   ├── Index.en-US.resx
│   │   │   ├── Index.es-ES.resx
│   │   │   └── ...
│   │   ├── Courses/
│   │   │   ├── Index.en-US.resx
│   │   │   └── ...
│   └── Models/
│       ├── Student.en-US.resx           (data annotations)
│       ├── Student.es-ES.resx
│       └── ...
```

### Loading Strategy

#### Option A: Shared Resources (Simple, Recommended)

**Pros:**
- ✅ Single resource file per locale
- ✅ Easy to manage small applications
- ✅ No duplication of common strings

**Cons:**
- ❌ Namespace collisions (e.g., "Name" used in multiple contexts)
- ❌ Large files become unwieldy

**Implementation:**
```csharp
// Program.cs
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

// Inject in page model
public class IndexModel : PageModel
{
    private readonly IStringLocalizer<SharedResources> _localizer;

    public IndexModel(IStringLocalizer<SharedResources> localizer)
    {
        _localizer = localizer;
    }

    public string Greeting => _localizer["WelcomeMessage"];
}
```

#### Option B: Per-Page Resources (Scalable)

**Pros:**
- ✅ Scoped translations (avoid key conflicts)
- ✅ Easier to parallelize translation work
- ✅ Lazy loading (only load resources for visited pages)

**Cons:**
- ❌ Duplication of common strings (e.g., "Save", "Cancel")
- ❌ More files to manage

**Implementation:**
```csharp
public class IndexModel : PageModel
{
    private readonly IStringLocalizer<IndexModel> _localizer;

    public IndexModel(IStringLocalizer<IndexModel> localizer)
    {
        _localizer = localizer;
    }
}
```

**Recommendation:** Use **Shared Resources** for MVP, migrate to **Per-Page Resources** if application exceeds 500 translation keys.

### Fallback Strategy

**Chain:** User Preferred → Browser Language → Default (en-US)

```csharp
// Program.cs
var supportedCultures = new[] { "en-US", "es-ES", "fr-FR", "de-DE" };
app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture("en-US"),
    SupportedCultures = supportedCultures.Select(c => new CultureInfo(c)).ToList(),
    SupportedUICultures = supportedCultures.Select(c => new CultureInfo(c)).ToList(),
    RequestCultureProviders = new List<IRequestCultureProvider>
    {
        new QueryStringRequestCultureProvider(),  // ?culture=es-ES
        new CookieRequestCultureProvider(),       // .AspNetCore.Culture cookie
        new AcceptLanguageHeaderRequestCultureProvider()  // Accept-Language: es-ES
    }
});
```

**Fallback Logic:**
1. Check query string: `?culture=es-ES` (highest priority)
2. Check cookie: `.AspNetCore.Culture=es-ES`
3. Check HTTP header: `Accept-Language: es-ES,en-US;q=0.9`
4. Use default: `en-US`

### Caching Strategy

**Resource files are compiled into satellite assemblies** (e.g., `es/ContosoUniversity.resources.dll`).

- **Cold Start:** First request loads satellite assembly into memory (~1-5ms penalty).
- **Warm Cache:** Subsequent requests use in-memory cache (no disk I/O).
- **Deployment:** Changes to .resx require recompilation and redeployment.

**For runtime updates without redeployment**, consider:
- JSON files with custom `IStringLocalizer` implementation
- Database-backed translations (e.g., `TranslationRepository`)
- Azure App Configuration or AWS AppConfig

---

## Pluralization Rules

### Challenge

Different languages have different pluralization rules:

| Language   | Plural Forms | Example Rules                          |
| ---------- | ------------ | -------------------------------------- |
| English    | 2            | 1 item, 2 items                        |
| French     | 2            | 0-1 item, 2+ items                     |
| Polish     | 3            | 1 item, 2-4 items, 5+ items            |
| Arabic     | 6            | 0, 1, 2, 3-10, 11-99, 100+             |
| Russian    | 3            | 1, 2-4, 5+ (complex modulo rules)      |
| Chinese    | 1            | No plural distinction                  |

### ASP.NET Core Limitation

**Problem:** .resx files do not support plural forms natively. Requires manual key suffixes:

```xml
<data name="ItemCount_Zero">
  <value>No items</value>
</data>
<data name="ItemCount_One">
  <value>{0} item</value>
</data>
<data name="ItemCount_Other">
  <value>{0} items</value>
</data>
```

**Usage:**
```csharp
var key = count switch
{
    0 => "ItemCount_Zero",
    1 => "ItemCount_One",
    _ => "ItemCount_Other"
};
var message = _localizer[key, count];
```

**Problem:** This approach doesn't scale to 6-form languages like Arabic.

### Recommended Solution: ICU MessageFormat

**Option 1: Use NuGet Package `MessageFormat` (ICU-style)**

```csharp
// Install-Package MessageFormat
var message = MessageFormatter.Format(
    _localizer["ItemCount"],  // "{count, plural, one {# item} other {# items}}"
    new { count = 5 }
);
```

**Option 2: Custom Pluralization Helper**

```csharp
public static class PluralizationHelper
{
    public static string Pluralize(int count, CultureInfo culture, 
        string zero, string one, string few, string many, string other)
    {
        var pluralRule = GetPluralRule(count, culture);
        return pluralRule switch
        {
            "zero" => string.Format(zero, count),
            "one" => string.Format(one, count),
            "few" => string.Format(few, count),
            "many" => string.Format(many, count),
            _ => string.Format(other, count)
        };
    }

    private static string GetPluralRule(int n, CultureInfo culture)
    {
        // CLDR plural rules implementation
        // Reference: https://www.unicode.org/cldr/charts/43/supplemental/language_plural_rules.html
        return culture.TwoLetterISOLanguageName switch
        {
            "en" => n == 1 ? "one" : "other",
            "fr" => n >= 0 && n < 2 ? "one" : "other",
            "ar" => n switch
            {
                0 => "zero",
                1 => "one",
                2 => "two",
                _ when n % 100 >= 3 && n % 100 <= 10 => "few",
                _ when n % 100 >= 11 && n % 100 <= 99 => "many",
                _ => "other"
            },
            _ => "other"
        };
    }
}
```

**Recommendation:** For MVP, use simple English/Spanish dual-form plurals. Add ICU MessageFormat library when expanding to Slavic or Semitic languages.

---

## Testing Strategy

### Unit Tests

#### 1. Resource File Integrity

```csharp
[Fact]
public void AllResourceFilesAreValidXml()
{
    var resourceFiles = Directory.GetFiles("Resources", "*.resx", SearchOption.AllDirectories);
    foreach (var file in resourceFiles)
    {
        Assert.DoesNotThrow(() => XDocument.Load(file));
    }
}

[Fact]
public void AllLocalesHaveSameKeys()
{
    var baseKeys = GetKeys("SharedResources.en-US.resx");
    var esKeys = GetKeys("SharedResources.es-ES.resx");
    
    Assert.Equal(baseKeys.OrderBy(k => k), esKeys.OrderBy(k => k));
}
```

#### 2. Localization Coverage

```csharp
[Fact]
public void AllDataAnnotationsHaveLocalizedErrorMessages()
{
    var model = new Student();
    var validationContext = new ValidationContext(model);
    var culture = new CultureInfo("es-ES");
    CultureInfo.CurrentUICulture = culture;
    
    model.FirstMidName = new string('x', 100);  // Violate max length
    var results = new List<ValidationResult>();
    Validator.TryValidateObject(model, validationContext, results, true);
    
    Assert.Contains(results, r => r.ErrorMessage.Contains("nombre"));  // Spanish word
}
```

#### 3. Culture-Aware Formatting

```csharp
[Theory]
[InlineData("en-US", "12/30/2025")]
[InlineData("en-GB", "30/12/2025")]
[InlineData("de-DE", "30.12.2025")]
public void DateFormatting_RespectsLocale(string locale, string expectedFormat)
{
    var culture = new CultureInfo(locale);
    var date = new DateTime(2025, 12, 30);
    
    var formatted = date.ToString("d", culture);
    
    Assert.Equal(expectedFormat, formatted);
}
```

### Integration Tests

#### 1. End-to-End Locale Switching

```csharp
[Fact]
public async Task HomePage_DisplaysInSpanish_WhenCultureQueryStringProvided()
{
    var client = _factory.CreateClient();
    var response = await client.GetAsync("/?culture=es-ES");
    var content = await response.Content.ReadAsStringAsync();
    
    Assert.Contains("Estudiantes", content);  // Spanish for "Students"
    Assert.DoesNotContain("Students", content);
}
```

#### 2. Cookie Persistence

```csharp
[Fact]
public async Task LanguagePreference_PersistsInCookie()
{
    var client = _factory.CreateClient();
    
    // First request sets cookie
    var response1 = await client.GetAsync("/?culture=fr-FR");
    var cookie = response1.Headers.GetValues("Set-Cookie").First();
    
    // Second request uses cookie
    client.DefaultRequestHeaders.Add("Cookie", cookie);
    var response2 = await client.GetAsync("/");
    var content = await response2.Content.ReadAsStringAsync();
    
    Assert.Contains("Étudiants", content);  // French
}
```

### Manual Testing Checklist

#### Visual QA (Per Locale)

- [ ] **Text Overflow:** No truncated strings or overlapping text
- [ ] **Button Sizing:** Buttons accommodate longer translations (German +35%)
- [ ] **Table Columns:** Headers and data align correctly
- [ ] **Form Validation:** Error messages display in correct language
- [ ] **Dates/Numbers:** Format matches locale conventions
- [ ] **Currency:** Symbols and decimal separators correct
- [ ] **Timezone:** Displays user's local time
- [ ] **RTL (ar-SA, he-IL):** Layout mirrors correctly
- [ ] **Pluralization:** "1 student" vs "2 students" in each language
- [ ] **Diacritics:** Accented characters display correctly (é, ñ, ü, ç)

#### Browser Testing

- [ ] Chrome (Accept-Language detection)
- [ ] Firefox (locale preference)
- [ ] Safari (macOS language settings)
- [ ] Edge (Windows display language)
- [ ] Mobile Safari (iOS language)
- [ ] Chrome Android (device locale)

#### Accessibility Testing

- [ ] Screen readers announce text in correct language (`lang` attribute)
- [ ] Keyboard navigation works in RTL layouts
- [ ] Form labels properly associated with inputs in all locales

---

## Migration Notes for Target Stack

### .NET 6 → .NET 8 Localization Changes

#### Breaking Changes

**1. Minimal API Localization**

If migrating from Razor Pages to Minimal APIs, localization changes:

```csharp
// .NET 6 (not applicable to Razor Pages)
// No change

// .NET 8 Minimal API
app.MapGet("/students", (IStringLocalizer<Program> localizer) => 
{
    return localizer["StudentListTitle"];
});
```

**2. JSON-based Configuration (No Breaking Change)**

.NET 8 continues to support `.resx` files. Optional JSON-based localization:

```json
// wwwroot/locales/en-US.json
{
  "WelcomeMessage": "Welcome to Contoso University",
  "StudentListTitle": "Students"
}
```

**Custom implementation required** (not built-in).

#### New Features in .NET 8

**1. `IStringLocalizer` improvements**

Better handling of missing keys (logs warning instead of returning key):

```csharp
_localizer["NonExistentKey"]  // Logs warning, returns "[NonExistentKey]"
```

**2. Source generators for localization (Preview)**

```csharp
[LocalizedResource]
public partial class StudentResources
{
    // Auto-generated from .resx at compile time
}
```

**Status:** Experimental, not recommended for production.

#### Migration Checklist

- [ ] Update packages to .NET 8:
  ```xml
  <PackageReference Include="Microsoft.Extensions.Localization" Version="8.0.0" />
  <PackageReference Include="Microsoft.AspNetCore.Localization" Version="8.0.0" />
  ```
- [ ] Test existing `.resx` files compile correctly
- [ ] Verify `RequestLocalizationMiddleware` still works
- [ ] Check for deprecated culture provider methods
- [ ] Update unit tests to use new assertion syntax
- [ ] Validate satellite assembly packaging in publish output

---

## Implementation Recommendations

### Phase 1: Foundation (MVP) - 2 Weeks

**Goal:** Support English (en-US) and Spanish (es-ES) only.

**Tasks:**

1. **Install Localization Packages**
   ```bash
   dotnet add package Microsoft.Extensions.Localization
   dotnet add package Microsoft.AspNetCore.Localization
   ```

2. **Configure Middleware**
   ```csharp
   // Program.cs
   builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
   builder.Services.AddRazorPages()
       .AddViewLocalization()
       .AddDataAnnotationsLocalization();
   
   var supportedCultures = new[] { "en-US", "es-ES" };
   app.UseRequestLocalization(new RequestLocalizationOptions
   {
       DefaultRequestCulture = new RequestCulture("en-US"),
       SupportedCultures = supportedCultures.Select(c => new CultureInfo(c)).ToList(),
       SupportedUICultures = supportedCultures.Select(c => new CultureInfo(c)).ToList()
   });
   ```

3. **Create Shared Resources**
   ```
   /Resources/SharedResources.en-US.resx
   /Resources/SharedResources.es-ES.resx
   ```

4. **Refactor Razor Views**
   ```cshtml
   @inject IViewLocalizer Localizer
   
   <h2>@Localizer["Students"]</h2>
   <a asp-page="Create">@Localizer["CreateNew"]</a>
   ```

5. **Localize Data Annotations**
   ```csharp
   [Display(Name = "LastName", ResourceType = typeof(StudentResources))]
   public string LastName { get; set; }
   ```

6. **Add Language Switcher UI**
   ```cshtml
   <form asp-action="SetLanguage" method="post">
       <select name="culture" onchange="this.form.submit()">
           <option value="en-US">English</option>
           <option value="es-ES">Español</option>
       </select>
   </form>
   ```

7. **Write Tests**
   - Resource file integrity tests
   - Locale switching integration tests

**Deliverables:**
- ✅ Application renders in English and Spanish
- ✅ User can switch languages via dropdown
- ✅ Dates/numbers format correctly per locale
- ✅ 80% code coverage for localization logic

---

### Phase 2: Expansion (3-5 Languages) - 3 Weeks

**Goal:** Add French (fr-FR), German (de-DE), Chinese (zh-CN).

**Tasks:**

1. **Translation Work**
   - Export base `.resx` to Excel
   - Send to translation agency or Crowdin
   - Import translated files

2. **RTL Planning**
   - Assess need for Arabic (ar-SA) or Hebrew (he-IL)
   - Document RTL implementation plan (defer to Phase 3 if low priority)

3. **Pluralization**
   - Implement `PluralizationHelper` for Slavic languages (if applicable)
   - Test with Russian (ru-RU) or Polish (pl-PL)

4. **Performance Testing**
   - Load test with multiple locales
   - Verify satellite assembly caching

**Deliverables:**
- ✅ 5 locales fully supported
- ✅ Translation pipeline documented
- ✅ Performance benchmarks documented

---

### Phase 3: Advanced (RTL, Timezone, API) - 4 Weeks

**Goal:** Full internationalization with RTL support and timezone handling.

**Tasks:**

1. **RTL Implementation**
   - Add Bootstrap RTL CSS
   - Implement `dir="rtl"` logic in `_Layout.cshtml`
   - Test Arabic (ar-SA) and Hebrew (he-IL)

2. **Timezone Handling**
   - Migrate `DateTime` to `DateTimeOffset` or UTC storage
   - Add user timezone preference to profile
   - Implement timezone conversion layer

3. **API Localization (if REST API added)**
   - Accept `Accept-Language` header
   - Return localized error messages
   - Document API i18n behavior in OpenAPI spec

4. **Advanced Testing**
   - Visual regression tests (Percy, Chromatic)
   - Linguistic QA by native speakers
   - Accessibility audit in multiple languages

**Deliverables:**
- ✅ RTL languages fully supported
- ✅ Timezone-aware date display
- ✅ API localization (if applicable)
- ✅ Comprehensive i18n test suite

---

### Estimated Effort

| Phase               | Duration | Developer Days | Dependencies                     |
| ------------------- | -------- | -------------- | -------------------------------- |
| Phase 1: Foundation | 2 weeks  | 6-8 days       | None                             |
| Phase 2: Expansion  | 3 weeks  | 8-10 days      | Translation agency, QA resources |
| Phase 3: Advanced   | 4 weeks  | 12-15 days     | Native speakers, design input    |
| **Total**           | **9 weeks** | **26-33 days** |                                  |

**Assumptions:**
- Developer familiar with ASP.NET Core localization
- Translation turnaround time: 1-2 weeks per language
- No major UI refactoring required

---

## Open Questions

1. **Target Locales:** Which languages are business priorities? (Recommend surveying user base)
2. **Translation Budget:** In-house translators or external agency?
3. **RTL Requirement:** Is Arabic or Hebrew support required for MVP?
4. **Timezone Requirement:** Do users span multiple timezones? (e.g., online courses)
5. **Currency Localization:** Will app handle payments in multiple currencies?
6. **Email Localization:** If email notifications added, should they be localized?
7. **Legal/Compliance:** Any requirements for translated terms of service or privacy policies?

---

## References

### Documentation

- [ASP.NET Core Globalization and Localization](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/localization)
- [.NET Globalization and ICU](https://learn.microsoft.com/en-us/dotnet/core/extensions/globalization-icu)
- [CLDR - Unicode Common Locale Data Repository](https://cldr.unicode.org/)
- [ICU MessageFormat Syntax](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Bootstrap RTL Documentation](https://getbootstrap.com/docs/5.3/getting-started/rtl/)

### Tools

- [ResX Resource Manager (Visual Studio Extension)](https://github.com/dotnet/ResXResourceManager)
- [Crowdin (TMS)](https://crowdin.com/)
- [Lokalise (TMS)](https://lokalise.com/)
- [NodaTime (.NET Date/Time Library)](https://nodatime.org/)
- [Pluralization Rules (CLDR)](https://www.unicode.org/cldr/charts/43/supplemental/language_plural_rules.html)

### Sample Projects

- [eShopOnWeb (Microsoft) - ASP.NET Core Localization Example](https://github.com/dotnet-architecture/eShopOnWeb)
- [Orchard Core CMS - Multi-locale Implementation](https://github.com/OrchardCMS/OrchardCore)

---

## Document History

| Version | Date       | Author               | Changes                              |
| ------- | ---------- | -------------------- | ------------------------------------ |
| 1.0     | 2025-12-30 | Migration Architect  | Initial draft - comprehensive i18n analysis |

---

**Next Steps:**

1. **Stakeholder Review:** Present locale priorities and budget requirements
2. **Spike:** Prototype ASP.NET Core localization with 2 locales (1 week)
3. **Decision:** Approve target locales and translation workflow
4. **Implementation:** Execute Phase 1 (MVP)

---

_This document provides the foundation for internationalizing ContosoUniversity. All technical decisions should be validated with stakeholders before implementation._
