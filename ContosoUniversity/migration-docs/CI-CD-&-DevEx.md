---
title: 'CI/CD Pipelines & Developer Experience'
last_updated: '2025-12-30'
owner: 'DevOps Team'
status: 'Active'
related_docs: ['00-Project-Overview.md', '01-Architecture-Overview.md']
---

# CI/CD Pipelines & Developer Experience

## Executive Summary

This document describes the Continuous Integration/Continuous Deployment (CI/CD) pipelines, quality gates, branch strategy, local development setup, containerization options, and artifact management for the ContosoUniversity application.

**Current CI/CD Platform:** GitHub Actions  
**Build System:** .NET CLI (dotnet)  
**Target Framework:** .NET 6.0  
**Deployment Target:** Azure App Service (with staging slots)

---

## Table of Contents

- [CI/CD Pipeline Overview](#cicd-pipeline-overview)
- [Pipeline Workflows](#pipeline-workflows)
- [Quality Gates](#quality-gates)
- [Branch Strategy](#branch-strategy)
- [Local Development Setup](#local-development-setup)
- [Containerization](#containerization)
- [Artifact Management](#artifact-management)
- [Version & Tag Strategy](#version--tag-strategy)
- [Troubleshooting](#troubleshooting)

---

## CI/CD Pipeline Overview

ContosoUniversity uses **GitHub Actions** for automated build, test, security scanning, and deployment workflows. The CI/CD system provides:

- ✅ Automated builds on push/pull request to `main` branch
- ✅ Automated testing with .NET test framework
- ✅ Security scanning with CodeQL (SAST)
- ✅ Artifact publishing for deployments
- ✅ Multi-stage deployment (Staging → Production)
- ✅ Approval gates for production deployments

### Pipeline Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                            │
│                     (Push/PR to main branch)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│   .NET Build Pipeline     │  │  CodeQL Analysis         │
│   (dotnet.yml)            │  │  (codeql-analysis.yml)   │
│                           │  │                          │
│  1. Checkout Code         │  │  1. Checkout Code        │
│  2. Setup .NET 6.0        │  │  2. Initialize CodeQL    │
│  3. Restore Dependencies  │  │  3. Autobuild            │
│  4. Build Solution        │  │  4. Security Analysis    │
│  5. Run Unit Tests        │  │  5. Upload Results       │
│  6. Publish Application   │  │                          │
│  7. Upload Artifacts      │  │  Languages: C#, JS       │
└───────────┬───────────────┘  └──────────────────────────┘
            │
            ▼
┌───────────────────────────┐
│  Deploy to Staging        │
│  (PRE-PROD Environment)   │
│                           │
│  1. Download Artifacts    │
│  2. Azure Login           │
│  3. Deploy to Staging     │
│  4. Health Check          │
└───────────┬───────────────┘
            │
            │ (Manual Approval Required)
            │
            ▼
┌───────────────────────────┐
│  Deploy to Production     │
│  (PROD Environment)       │
│                           │
│  1. Azure Login           │
│  2. Slot Swap (Blue/Green)│
│  3. Verify Production     │
└───────────────────────────┘
```

---

## Pipeline Workflows

### 1. .NET Build & Deployment Pipeline

**File:** `.github/workflows/dotnet.yml`

**Triggers:**
- Push to `main` branch
- Pull requests targeting `main` branch
- Manual trigger via `workflow_dispatch`

**Pipeline Stages:**

#### Stage 1: Build

```yaml
Runner: ubuntu-latest
Steps:
  1. Checkout repository (actions/checkout@v2)
  2. Setup .NET 6.0 SDK (actions/setup-dotnet@v1)
  3. Restore NuGet packages (dotnet restore)
  4. Build solution (dotnet build --no-restore)
  5. Run tests (dotnet test --no-build --verbosity normal)
  6. Publish application (dotnet publish -c Release -o website)
  7. Upload artifacts (actions/upload-artifact@v3.0.0)

Artifacts:
  - Name: website
  - Path: /home/runner/work/ContosoUniversity/ContosoUniversity/website/**
  - Retention: Default (90 days)
```

**Build Commands:**

| Step | Command | Purpose |
|------|---------|---------|
| Restore | `dotnet restore` | Downloads NuGet packages and dependencies |
| Build | `dotnet build --no-restore` | Compiles the application (skips restore) |
| Test | `dotnet test --no-build --verbosity normal` | Runs unit tests without rebuilding |
| Publish | `dotnet publish -c Release -o website` | Creates deployment-ready output |

#### Stage 2: Deploy to Staging (PRE-PROD)

```yaml
Runner: ubuntu-latest
Environment: PRE-PROD (requires approval)
Dependencies: build job must succeed

Steps:
  1. Download build artifacts (actions/download-artifact@v2.0.8)
  2. Azure CLI login (azure/login@v1) using AZURE_CREDENTIALS secret
  3. Deploy to Azure Web App staging slot (azure/webapps-deploy@v2)
     - App Name: contoso-uni
     - Slot: staging
     - Package: website
  4. Azure logout

Environment Variables:
  - app-name: contoso-uni
  - rg-name: ContosoUniversity
```

#### Stage 3: Deploy to Production (PROD)

```yaml
Runner: ubuntu-latest
Environment: PROD (requires manual approval)
Dependencies: deploy_staging job must succeed

Steps:
  1. Azure CLI login
  2. Perform slot swap (staging → production)
     Command: az webapp deployment slot swap -g ContosoUniversity -n contoso-uni -s staging
  3. Capture production URL
  4. Azure logout

Deployment Strategy: Blue/Green (zero-downtime)
```

**Pipeline Flow Diagram:**

```
Code Push/PR → Build → Test → Publish → Upload Artifact
                  │                           │
                  │                           ▼
                  │                    Download Artifact
                  │                           │
                  └───(if tests fail)         ▼
                      Pipeline STOPS    Deploy Staging
                                              │
                                              ▼
                                        Manual Approval
                                              │
                                              ▼
                                        Slot Swap to Prod
```

### 2. CodeQL Security Analysis Pipeline

**File:** `.github/workflows/codeql-analysis.yml`

**Triggers:**
- Push to `main` branch
- Pull requests targeting `main` branch
- Scheduled scan: Weekly on Tuesday at 17:16 UTC (`cron: '16 17 * * 2'`)

**Configuration:**

```yaml
Runner: ubuntu-latest
Permissions:
  - actions: read
  - contents: read
  - security-events: write

Matrix Strategy:
  - fail-fast: false
  - languages: [csharp, javascript]

Steps per Language:
  1. Checkout repository
  2. Initialize CodeQL with config file (.github/codeql/codeql-config.yml)
  3. Autobuild (automatically detect build system)
  4. Perform CodeQL analysis
  5. Upload results to GitHub Security tab

CodeQL Configuration:
  - Query Suite: security-and-quality
  - Config File: .github/codeql/codeql-config.yml
```

**Security Scan Coverage:**

| Language | Purpose | Vulnerabilities Detected |
|----------|---------|--------------------------|
| C# | Backend application code | SQL injection, XSS, code injection, insecure deserialization |
| JavaScript | Frontend scripts | DOM-based XSS, prototype pollution, path traversal |

---

## Quality Gates

Quality gates ensure code meets standards before merging or deployment.

### 1. Build Quality Gate

**Enforced at:** Every push and pull request

| Check | Tool | Failure Action |
|-------|------|----------------|
| **Compilation** | `dotnet build` | ❌ Pipeline fails, blocks merge |
| **Dependency Restoration** | `dotnet restore` | ❌ Pipeline fails immediately |
| **Unit Tests** | `dotnet test` | ❌ Pipeline fails, blocks deployment |
| **Test Coverage** | Built-in (future: Coverlet) | ⚠️ Warning only (no enforcement yet) |

**Current Test Execution:**
```bash
dotnet test --no-build --verbosity normal
```

**Exit Criteria:**
- All tests must pass (exit code 0)
- No compilation errors
- No missing dependencies

### 2. Security Quality Gate (SAST)

**Enforced at:** Push to main, PRs, and weekly scheduled scans

| Check | Tool | Failure Action |
|-------|------|----------------|
| **Static Analysis** | CodeQL (C#, JavaScript) | ⚠️ Creates security alerts |
| **Dependency Vulnerabilities** | Dependabot (if enabled) | ⚠️ Creates alerts |
| **Secret Scanning** | GitHub Secret Scanning | ⚠️ Blocks push if secrets detected |

**CodeQL Query Suite:** `security-and-quality`
- Includes all security queries (CWE coverage)
- Includes code quality queries (maintainability, reliability)

**Security Alert Workflow:**
1. CodeQL identifies vulnerability
2. Alert appears in Security tab
3. Developer reviews and fixes
4. Re-run CodeQL to verify fix

### 3. Deployment Quality Gate

**Enforced at:** Before production deployment

| Gate | Type | Required Action |
|------|------|-----------------|
| **Staging Approval** | Manual | PRE-PROD environment requires approval |
| **Production Approval** | Manual | PROD environment requires approval |
| **Staging Smoke Tests** | Automated | Must complete successfully (URL check) |

**Environment Protection Rules:**
- PRE-PROD: Requires 1 reviewer approval
- PROD: Requires 1 reviewer approval + successful staging deployment

### Quality Gate Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  Pull Request to main                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                   ┌─────────┐
                   │  Build  │──❌ Fail → Block PR merge
                   └────┬────┘
                        │ ✅ Pass
                        ▼
                   ┌─────────┐
                   │  Tests  │──❌ Fail → Block PR merge
                   └────┬────┘
                        │ ✅ Pass
                        ▼
                   ┌─────────┐
                   │ CodeQL  │──⚠️ Alert → Review required
                   └────┬────┘
                        │ ✅ Pass
                        ▼
                ┌──────────────┐
                │  PR Approved │
                └───────┬──────┘
                        │
                        ▼
                   ┌─────────┐
                   │  Merge  │
                   └────┬────┘
                        │
                        ▼
                ┌──────────────────┐
                │ Deploy to Staging│──⚠️ Requires manual approval
                └───────┬──────────┘
                        │
                        ▼
                ┌─────────────────┐
                │ Deploy to Prod  │──⚠️ Requires manual approval
                └─────────────────┘
```

---

## Branch Strategy

### Branching Model: GitHub Flow (Simplified)

ContosoUniversity follows a **simplified trunk-based development** approach with feature branches.

```
main (protected)
 │
 ├─── feature/add-student-search
 │     │
 │     └─── PR #123 → main (after review + CI pass)
 │
 ├─── bugfix/enrollment-date-validation
 │     │
 │     └─── PR #124 → main (after review + CI pass)
 │
 └─── hotfix/critical-security-patch
       │
       └─── PR #125 → main (expedited review + CI pass)
```

### Branch Protection Rules for `main`

| Rule | Status | Description |
|------|--------|-------------|
| **Require PR reviews** | ✅ Recommended | At least 1 approval before merge |
| **Require status checks** | ✅ Enabled | .NET build and tests must pass |
| **Require branches up to date** | ✅ Recommended | Must rebase/merge main before merging |
| **Require signed commits** | ⚠️ Optional | Enforce commit signing (GPG) |
| **Restrict force push** | ✅ Enabled | Prevent history rewriting |
| **Restrict deletions** | ✅ Enabled | Prevent branch deletion |

### Branch Naming Conventions

| Type | Pattern | Example | Description |
|------|---------|---------|-------------|
| **Feature** | `feature/<description>` | `feature/add-instructor-details` | New functionality |
| **Bugfix** | `bugfix/<description>` | `bugfix/fix-enrollment-validation` | Bug fixes |
| **Hotfix** | `hotfix/<description>` | `hotfix/security-patch-cve-2024` | Critical production fixes |
| **Release** | `release/v<version>` | `release/v1.2.0` | Release preparation (if needed) |
| **Docs** | `docs/<description>` | `docs/update-readme` | Documentation changes |
| **Chore** | `chore/<description>` | `chore/upgrade-dependencies` | Maintenance tasks |

### Deployment Strategy

| Branch | Environment | Deployment Trigger | Approval Required |
|--------|-------------|-------------------|-------------------|
| `main` | Staging (PRE-PROD) | Automatic on merge | Yes (environment approval) |
| `main` | Production (PROD) | Manual (after staging) | Yes (environment approval) |
| `feature/*` | Local/Dev only | N/A | No |

### Workflow Example

**Feature Development:**
```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/add-course-filtering

# 2. Make changes, commit regularly
git add .
git commit -m "feat: Add course filtering by department"

# 3. Push branch and create PR
git push origin feature/add-course-filtering
# Create PR on GitHub → main

# 4. CI runs automatically (build, test, CodeQL)
# 5. Request review, address feedback
# 6. Merge after approval + CI pass
# 7. Automatic deployment to staging
# 8. Manual approval for production
```

**Hotfix Workflow:**
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-sql-injection

# 2. Apply critical fix
git add .
git commit -m "fix: Sanitize SQL query parameters (CVE-2024-XXXX)"

# 3. Push and create expedited PR
git push origin hotfix/fix-sql-injection
# Create PR with "HOTFIX" label

# 4. Fast-track review and merge
# 5. Deploy to staging immediately
# 6. After validation, deploy to production ASAP
```

---

## Local Development Setup

### Prerequisites

Before starting development, ensure you have the following installed:

| Tool | Version | Purpose | Download Link |
|------|---------|---------|---------------|
| **.NET SDK** | 6.0.x or later | Build and run the application | https://dotnet.microsoft.com/download |
| **SQL Server** | LocalDB 2019+ | Local database | Included with Visual Studio or SQL Server Express |
| **Git** | Latest | Version control | https://git-scm.com/ |
| **IDE** | VS 2022 / VS Code / Rider | Code editing | https://visualstudio.microsoft.com/ |

**Optional Tools:**
- **Azure CLI** (for deployment testing): https://aka.ms/installazurecli
- **Docker Desktop** (for containerization): https://www.docker.com/products/docker-desktop

### One-Command Setup

#### Option 1: Windows (PowerShell)

```powershell
# Clone repository
git clone https://github.com/Taher-PIO/contoso-migrate.git
cd contoso-migrate/ContosoUniversity

# Restore, build, and run
dotnet restore && dotnet build && dotnet run --project ContosoUniversity/ContosoUniversity.csproj
```

#### Option 2: Linux/macOS (Bash)

```bash
# Clone repository
git clone https://github.com/Taher-PIO/contoso-migrate.git
cd contoso-migrate/ContosoUniversity

# Restore, build, and run
dotnet restore && dotnet build && dotnet run --project ContosoUniversity/ContosoUniversity.csproj
```

### Detailed Setup Steps

#### 1. Clone Repository

```bash
git clone https://github.com/Taher-PIO/contoso-migrate.git
cd contoso-migrate/ContosoUniversity
```

#### 2. Configure Database Connection

**Default Connection String** (in `appsettings.json`):
```json
{
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=ContosoUniversity;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

**For Custom SQL Server:**

Edit `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "SchoolContext": "Server=YOUR_SERVER;Database=ContosoUniversity;User Id=YOUR_USER;Password=YOUR_PASSWORD;MultipleActiveResultSets=true"
  }
}
```

#### 3. Restore Dependencies

```bash
dotnet restore
```

**Expected Output:**
```
Determining projects to restore...
Restored ContosoUniversity.csproj (in XXX ms).
```

#### 4. Apply Database Migrations

```bash
# Apply existing migrations
dotnet ef database update --project ContosoUniversity/ContosoUniversity.csproj

# (Optional) Seed sample data - runs automatically on first start
```

**Verify Database:**
```bash
# Connect to LocalDB
sqlcmd -S "(localdb)\mssqllocaldb" -d ContosoUniversity -Q "SELECT COUNT(*) FROM Students"
```

#### 5. Build Application

```bash
dotnet build
```

**Expected Output:**
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

#### 6. Run Application

```bash
dotnet run --project ContosoUniversity/ContosoUniversity.csproj
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

**Access Application:**
- HTTPS: https://localhost:5001
- HTTP: http://localhost:5000

#### 7. Run Tests

```bash
# Run all tests
dotnet test

# Run with detailed output
dotnet test --verbosity detailed

# Run specific test project (if exists)
dotnet test ContosoUniversity.Tests/ContosoUniversity.Tests.csproj
```

### Development Commands Cheat Sheet

| Task | Command |
|------|---------|
| **Restore packages** | `dotnet restore` |
| **Build solution** | `dotnet build` |
| **Build (Release mode)** | `dotnet build -c Release` |
| **Run application** | `dotnet run --project ContosoUniversity/ContosoUniversity.csproj` |
| **Run with watch (auto-reload)** | `dotnet watch run --project ContosoUniversity/ContosoUniversity.csproj` |
| **Run tests** | `dotnet test` |
| **Run tests with coverage** | `dotnet test /p:CollectCoverage=true` |
| **Clean build artifacts** | `dotnet clean` |
| **Publish for deployment** | `dotnet publish -c Release -o ./publish` |
| **Create new migration** | `dotnet ef migrations add <MigrationName> --project ContosoUniversity/ContosoUniversity.csproj` |
| **Apply migrations** | `dotnet ef database update --project ContosoUniversity/ContosoUniversity.csproj` |
| **Rollback migration** | `dotnet ef database update <PreviousMigration> --project ContosoUniversity/ContosoUniversity.csproj` |
| **List migrations** | `dotnet ef migrations list --project ContosoUniversity/ContosoUniversity.csproj` |

### IDE Configuration

#### Visual Studio 2022

1. Open `ContosoUniversity.sln`
2. Set `ContosoUniversity` as startup project (right-click → Set as Startup Project)
3. Press F5 to run with debugging
4. Press Ctrl+F5 to run without debugging

**Recommended Extensions:**
- ReSharper (code analysis)
- CodeMaid (code cleanup)
- Entity Framework Power Tools

#### Visual Studio Code

1. Open `ContosoUniversity` folder
2. Install extensions:
   - C# (ms-dotnettools.csharp)
   - C# Dev Kit (ms-dotnettools.csdevkit)
   - NuGet Package Manager
3. Press F5 to launch with debugger

**Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": ".NET Core Launch (web)",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/ContosoUniversity/bin/Debug/net6.0/ContosoUniversity.dll",
      "args": [],
      "cwd": "${workspaceFolder}/ContosoUniversity",
      "stopAtEntry": false,
      "serverReadyAction": {
        "action": "openExternally",
        "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
      },
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  ]
}
```

#### JetBrains Rider

1. Open `ContosoUniversity.sln`
2. Run Configuration will be auto-detected
3. Click Run button or Shift+F10
4. Rider will automatically restore packages and build

### Troubleshooting Local Setup

| Issue | Solution |
|-------|----------|
| **"dotnet command not found"** | Install .NET SDK from https://dotnet.microsoft.com/download |
| **LocalDB connection error** | Install SQL Server LocalDB or update connection string |
| **Port 5000/5001 already in use** | Change ports in `Properties/launchSettings.json` |
| **Migration error** | Delete database and run `dotnet ef database update` again |
| **Missing packages** | Run `dotnet restore --force` |
| **Build errors after git pull** | Run `dotnet clean` then `dotnet build` |
| **SSL certificate error** | Run `dotnet dev-certs https --trust` |

---

## Containerization

ContosoUniversity can be containerized using Docker for consistent development and deployment environments.

### Docker Support (Future Enhancement)

**Status:** 🚧 Not currently implemented, but recommended for future migration

**Proposed Dockerfile:**

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ContosoUniversity/ContosoUniversity.csproj ContosoUniversity/
RUN dotnet restore ContosoUniversity/ContosoUniversity.csproj

# Copy source code and build
COPY ContosoUniversity/ ContosoUniversity/
WORKDIR /src/ContosoUniversity
RUN dotnet build ContosoUniversity.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish ContosoUniversity.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Copy published application
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80

# Run application
ENTRYPOINT ["dotnet", "ContosoUniversity.dll"]
```

### Docker Compose Setup (Proposed)

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: ContosoUniversity/Dockerfile
    ports:
      - "5000:80"
      - "5001:443"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__SchoolContext=Server=sqlserver;Database=ContosoUniversity;User Id=sa;Password=YourStrong@Passw0rd;MultipleActiveResultSets=true
    depends_on:
      - sqlserver
    networks:
      - contoso-network

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong@Passw0rd
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"
    volumes:
      - sqlserver-data:/var/opt/mssql
    networks:
      - contoso-network

networks:
  contoso-network:
    driver: bridge

volumes:
  sqlserver-data:
```

### Running with Docker (Once Implemented)

```bash
# Build Docker image
docker build -t contoso-university:latest -f ContosoUniversity/Dockerfile .

# Run container
docker run -d -p 5000:80 -p 5001:443 --name contoso-uni contoso-university:latest

# Run with Docker Compose (app + SQL Server)
docker-compose up -d

# View logs
docker logs contoso-uni

# Stop and remove
docker-compose down
```

### Dev Containers (VS Code)

**Proposed devcontainer.json:**

```json
{
  "name": "ContosoUniversity Dev Container",
  "dockerComposeFile": "docker-compose.yml",
  "service": "web",
  "workspaceFolder": "/src",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-dotnettools.csharp",
        "ms-dotnettools.csdevkit",
        "ms-azuretools.vscode-docker"
      ],
      "settings": {
        "terminal.integrated.shell.linux": "/bin/bash"
      }
    }
  },
  "forwardPorts": [5000, 5001],
  "postCreateCommand": "dotnet restore && dotnet build"
}
```

**Benefits of Dev Containers:**
- ✅ Consistent environment across team members
- ✅ No local .NET SDK installation required
- ✅ Isolated dependencies
- ✅ Quick onboarding for new developers

### Container Registry (Future)

**Recommended for Production:**

| Registry | Use Case | Cost |
|----------|----------|------|
| **Azure Container Registry (ACR)** | Private, Azure integration | Paid (Basic: ~$5/month) |
| **Docker Hub** | Public images, private repos | Free tier available |
| **GitHub Container Registry (GHCR)** | Tight GitHub integration | Free for public, paid for private |

**Example Push to ACR:**
```bash
# Login to Azure Container Registry
az acr login --name contosoregistry

# Tag image
docker tag contoso-university:latest contosoregistry.azurecr.io/contoso-university:v1.0.0

# Push image
docker push contosoregistry.azurecr.io/contoso-university:v1.0.0
```

---

## Artifact Management

### Build Artifacts

Artifacts are the compiled and published outputs of the build process, ready for deployment.

#### Artifact Configuration

**Artifact Name:** `website`

**Contents:**
```
website/
├── ContosoUniversity.dll          # Main application assembly
├── ContosoUniversity.pdb          # Debug symbols
├── appsettings.json               # Configuration
├── appsettings.Production.json    # Production config
├── web.config                     # IIS configuration
├── wwwroot/                       # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   ├── lib/
│   └── favicon.ico
└── [Other dependencies]           # NuGet packages, runtime files
```

#### Artifact Storage

| Attribute | Value |
|-----------|-------|
| **Storage Location** | GitHub Actions artifact storage |
| **Retention Period** | 90 days (default) |
| **Maximum Size** | 10 GB (per artifact) |
| **Compression** | Automatic (gzip) |
| **Access** | Authenticated users with repo access |

#### Artifact Publishing

**Build Command:**
```bash
dotnet publish ContosoUniversity/ContosoUniversity.csproj \
  -c Release \
  -o website \
  --no-restore
```

**GitHub Actions Upload:**
```yaml
- name: Upload Build Artifact
  uses: actions/upload-artifact@v3.0.0
  with:
    name: website
    path: /home/runner/work/ContosoUniversity/ContosoUniversity/website/**
    if-no-files-found: error
```

#### Artifact Download

**During Deployment:**
```yaml
- name: Download a Build Artifact
  uses: actions/download-artifact@v2.0.8
  with:
    name: website
    path: website
```

**Manual Download:**
1. Navigate to GitHub Actions run
2. Click on completed workflow run
3. Scroll to "Artifacts" section
4. Click "website" to download ZIP file

### Artifact Versioning

Currently, artifacts are identified by:
- **Git Commit SHA:** Unique identifier for source code state
- **Workflow Run ID:** Unique identifier for build execution
- **Branch Name:** Source branch (e.g., `main`)

**Artifact Naming Convention (Proposed):**
```
contoso-university-{version}-{commit-short}.zip

Examples:
- contoso-university-1.0.0-a3b4c5d.zip
- contoso-university-1.1.0-f7e8d9c.zip
```

### Artifact Promotion

```
Build → Staging Artifact → Production Artifact
        (PRE-PROD)          (PROD)

Artifact is downloaded once, deployed twice (staging, then prod)
Same artifact used for both environments (ensures consistency)
```

---

## Version & Tag Strategy

### Current State

**Status:** 🚧 Version tagging not currently implemented

**Current Identification:**
- Commit SHA for tracking changes
- Branch name for environment mapping
- Workflow run number for build identification

### Recommended Semantic Versioning (SemVer)

**Format:** `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

| Component | Increment When | Example |
|-----------|----------------|---------|
| **MAJOR** | Breaking changes, API incompatibilities | `1.0.0` → `2.0.0` |
| **MINOR** | New features (backward compatible) | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes (backward compatible) | `1.0.0` → `1.0.1` |

**Optional Pre-release:**
- `1.0.0-alpha.1` (early testing)
- `1.0.0-beta.2` (feature complete, testing)
- `1.0.0-rc.1` (release candidate)

### Proposed Tagging Workflow

#### 1. Version Tagging (Manual)

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0 - Initial production release"

# Push tag to remote
git push origin v1.0.0

# List all tags
git tag -l
```

#### 2. Automated Versioning (Future)

**Using GitVersion or similar tool:**

**.gitversion.yml:**
```yaml
mode: ContinuousDelivery
branches:
  main:
    tag: ''
    increment: Minor
  feature:
    tag: alpha
    increment: Minor
  hotfix:
    tag: hotfix
    increment: Patch
```

**Integrate in GitHub Actions:**
```yaml
- name: Install GitVersion
  uses: gittools/actions/gitversion/setup@v0.9.7
  with:
    versionSpec: '5.x'

- name: Determine Version
  id: gitversion
  uses: gittools/actions/gitversion/execute@v0.9.7

- name: Display Version
  run: |
    echo "SemVer: ${{ steps.gitversion.outputs.semVer }}"
    echo "Major: ${{ steps.gitversion.outputs.major }}"
    echo "Minor: ${{ steps.gitversion.outputs.minor }}"
```

### Release Notes

**Recommended for Each Release:**

```markdown
# ContosoUniversity v1.2.0

**Release Date:** 2025-01-15

## New Features
- ✨ Added course filtering by department
- ✨ Implemented instructor search functionality

## Bug Fixes
- 🐛 Fixed enrollment date validation
- 🐛 Resolved pagination issue on Students page

## Security
- 🔒 Updated Entity Framework Core to 6.0.25 (CVE-2024-XXXX)

## Breaking Changes
None

## Database Migrations
- Added index on Students.LastName for performance

## Deployment Notes
1. Backup database before deployment
2. Run migration: `dotnet ef database update`
3. Clear application cache after deployment
```

### Version in Application

**Display Version in UI (Proposed):**

Add to `Program.cs`:
```csharp
var assembly = Assembly.GetExecutingAssembly();
var version = assembly.GetName().Version;
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-App-Version", version.ToString());
    await next();
});
```

**Update `.csproj`:**
```xml
<PropertyGroup>
  <TargetFramework>net6.0</TargetFramework>
  <Version>1.0.0</Version>
  <AssemblyVersion>1.0.0.0</AssemblyVersion>
  <FileVersion>1.0.0.0</FileVersion>
</PropertyGroup>
```

### Git Tag Management

| Task | Command |
|------|---------|
| **Create tag** | `git tag -a v1.0.0 -m "Release v1.0.0"` |
| **List tags** | `git tag -l` |
| **Show tag details** | `git show v1.0.0` |
| **Delete local tag** | `git tag -d v1.0.0` |
| **Delete remote tag** | `git push origin --delete v1.0.0` |
| **Push tag** | `git push origin v1.0.0` |
| **Push all tags** | `git push origin --tags` |
| **Checkout tag** | `git checkout v1.0.0` |

---

## Troubleshooting

### Common Pipeline Issues

#### 1. Build Failure: "Restore failed"

**Symptoms:**
```
error: NU1101: Unable to find package Microsoft.EntityFrameworkCore.SqlServer
```

**Solutions:**
- Check internet connectivity on build agent
- Verify NuGet package sources in `NuGet.config`
- Clear NuGet cache: `dotnet nuget locals all --clear`
- Check for typos in package references

#### 2. Test Failure: "Database connection error"

**Symptoms:**
```
System.InvalidOperationException: Cannot create DbContext in test environment
```

**Solutions:**
- Ensure LocalDB is available on build agent (GitHub Actions has it)
- Use in-memory database for tests: `UseInMemoryDatabase("TestDb")`
- Configure test connection string in `appsettings.Test.json`

#### 3. Deployment Failure: "Azure login failed"

**Symptoms:**
```
Error: Azure CLI login failed with error: AADSTS700016
```

**Solutions:**
- Verify `AZURE_CREDENTIALS` secret is correctly set
- Check service principal has Contributor role on resource group
- Ensure service principal credentials haven't expired
- Regenerate service principal: `az ad sp create-for-rbac --name "contoso-uni-sp" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/ContosoUniversity`

#### 4. Artifact Upload Failure: "No files found"

**Symptoms:**
```
Warning: No files were found with the provided path
```

**Solutions:**
- Verify publish output path: `dotnet publish -o website`
- Check path in upload action matches publish output
- Use absolute paths in GitHub Actions
- List directory contents before upload: `ls -R website`

#### 5. CodeQL Failure: "Autobuild failed"

**Symptoms:**
```
Error: Could not auto-detect a suitable build method
```

**Solutions:**
- Manually specify build commands instead of autobuild
- Ensure .NET SDK is set up before CodeQL init
- Check CodeQL supports your .NET version

### Performance Optimization

#### Build Speed Improvements

| Optimization | Implementation | Speed Gain |
|--------------|----------------|------------|
| **Dependency Caching** | Cache `~/.nuget/packages` | ~30-60 seconds |
| **Build Output Caching** | Cache `obj/` and `bin/` folders | ~20-40 seconds |
| **Parallel Builds** | `dotnet build -m` (multi-core) | ~10-30 seconds |
| **Skip Redundant Restores** | `--no-restore` flag | ~5-10 seconds |

**Example: Add NuGet Caching**
```yaml
- name: Cache NuGet packages
  uses: actions/cache@v3
  with:
    path: ~/.nuget/packages
    key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}
    restore-keys: |
      ${{ runner.os }}-nuget-
```

#### Test Execution Optimization

```yaml
# Run tests in parallel
- name: Test
  run: dotnet test --no-build --verbosity normal --parallel

# Run tests with filter (only fast tests in PR)
- name: Test
  run: dotnet test --no-build --filter Category!=Slow
```

### Debugging Pipeline Failures

#### Enable Debug Logging

**In GitHub Actions:**
1. Go to repository Settings → Secrets
2. Add secret: `ACTIONS_STEP_DEBUG` = `true`
3. Re-run workflow to see verbose logs

**In Workflow:**
```yaml
- name: Debug - List files
  run: |
    echo "Current directory:"
    pwd
    echo "Files:"
    ls -la
    echo "Published files:"
    ls -la website/
```

#### Run Pipeline Locally

**Using act (GitHub Actions locally):**
```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act

# Run workflow locally
act push --workflows .github/workflows/dotnet.yml
```

---

## Additional Resources

### Documentation
- [.NET CLI Reference](https://docs.microsoft.com/en-us/dotnet/core/tools/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CodeQL for C#](https://codeql.github.com/docs/codeql-language-guides/codeql-for-csharp/)
- [Azure Web Apps Deployment](https://docs.microsoft.com/en-us/azure/app-service/)

### Tools
- [GitHub CLI (gh)](https://cli.github.com/) - Manage PRs, workflows from terminal
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/) - Azure resource management
- [Entity Framework Core Tools](https://docs.microsoft.com/en-us/ef/core/cli/dotnet) - Database migrations

### Related Documents
- [00-Project-Overview.md](./00-Project-Overview.md) - Project goals and timeline
- [01-Architecture-Overview.md](./01-Architecture-Overview.md) - System architecture
- [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md) - Migration gaps

---

## Document History

| Version | Date       | Author      | Changes                                  |
| ------- | ---------- | ----------- | ---------------------------------------- |
| 1.0     | 2025-12-30 | DevOps Team | Initial CI/CD and DevEx documentation    |

---

## Feedback & Contributions

**Questions or suggestions?**
- Open an issue in the repository with label `documentation`
- Contact the DevOps team
- Submit a PR with improvements to this document

---

_This document is maintained by the DevOps team and should be updated whenever CI/CD processes or development workflows change._
