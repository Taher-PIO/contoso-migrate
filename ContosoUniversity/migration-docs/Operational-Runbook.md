---
title: 'Operational Runbook - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'SRE/DevOps Team'
status: 'Draft'
version: '1.0'
application: 'ContosoUniversity'
---

# Operational Runbook - ContosoUniversity

## Executive Summary

This operational runbook provides comprehensive guidance for deploying, monitoring, and maintaining the ContosoUniversity application across all environments. It serves as the primary reference for DevOps engineers, SREs, and on-call personnel responsible for the application's operational health.

**Application:** ContosoUniversity  
**Platform:** ASP.NET Core 6.0 on Azure App Service  
**Database:** SQL Server  
**CI/CD:** GitHub Actions  
**Deployment Strategy:** Blue-Green deployment using Azure App Service slots

---

## Table of Contents

- [Environment Overview](#environment-overview)
- [Configuration Management](#configuration-management)
- [Secrets Management](#secrets-management)
- [Deployment Procedures](#deployment-procedures)
- [Rollback Procedures](#rollback-procedures)
- [Observability](#observability)
- [Monitoring & Alerting](#monitoring--alerting)
- [On-Call Procedures](#on-call-procedures)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Disaster Recovery](#disaster-recovery)
- [Contacts & Escalation](#contacts--escalation)

---

## Environment Overview

### Environment Inventory

| Environment | Purpose | URL | Hosting | Database | Approvals Required |
|------------|---------|-----|---------|----------|-------------------|
| **Development** | Local development | `https://localhost:5001` | Developer workstation (Kestrel) | SQL Server LocalDB | None |
| **Staging (PRE-PROD)** | Pre-production testing, UAT | `https://contoso-uni-staging.azurewebsites.net` | Azure App Service (staging slot) | Azure SQL Database (non-prod) | Tech Lead |
| **Production (PROD)** | Live production | `https://contoso-uni.azurewebsites.net` | Azure App Service (production slot) | Azure SQL Database (prod) | Change Advisory Board |

### Environment Characteristics

#### Development Environment

**Purpose:** Local development and debugging  
**Hosting:** Developer workstation  
**Runtime:** .NET 6.0 SDK  
**Web Server:** Kestrel (localhost:5000/5001)  
**Database:** SQL Server LocalDB (local file-based database)

**Key Configuration:**
- `ASPNETCORE_ENVIRONMENT=Development`
- Developer exception page enabled
- Database migrations run automatically on startup
- Seed data initialized if database is empty
- Detailed error messages displayed

**Access:**
- No authentication required
- Local-only access
- No SSL certificate validation

**Data:**
- Synthetic seed data (8 students, 5 instructors, 7 courses)
- Can be reset by deleting LocalDB database file
- No PII or production data

---

#### Staging Environment (PRE-PROD)

**Purpose:** Pre-production testing, UAT, performance testing  
**Hosting:** Azure App Service (staging slot)  
**URL:** `https://contoso-uni-staging.azurewebsites.net` (example)  
**Runtime:** .NET 6.0 Runtime  
**Web Server:** Kestrel behind IIS (reverse proxy)  
**Database:** Azure SQL Database (non-production tier)

**Key Configuration:**
- `ASPNETCORE_ENVIRONMENT=Staging`
- Generic error page enabled (no detailed errors)
- HTTPS enforced with HSTS
- Connection pooling enabled (100 connections)
- Application Insights telemetry enabled

**Access:**
- Azure AD authentication (optional - TBD)
- Restricted to internal network or VPN (TBD)
- TLS 1.2+ required

**Data:**
- Anonymized production-like data (recommended)
- OR synthetic test data
- Refreshed weekly from production backup (with PII masking)

**Deployment Trigger:**
- Automatic deployment on merge to `main` branch
- GitHub Actions workflow deploys to staging slot
- Requires Tech Lead approval in GitHub Actions environment

**Health Checks:**
- HTTP endpoint: `/health` (TBD - not implemented)
- Startup timeout: 120 seconds
- Ping interval: 30 seconds

---

#### Production Environment (PROD)

**Purpose:** Live production serving end users  
**Hosting:** Azure App Service (production slot)  
**URL:** `https://contoso-uni.azurewebsites.net` (example)  
**Runtime:** .NET 6.0 Runtime  
**Web Server:** Kestrel behind IIS (reverse proxy)  
**Database:** Azure SQL Database (production tier)

**Key Configuration:**
- `ASPNETCORE_ENVIRONMENT=Production`
- Generic error page with RequestId tracking
- HTTPS enforced with HSTS (30 days)
- Connection pooling enabled (100 connections)
- Application Insights telemetry enabled
- Logging level: Information (not Debug)

**Access:**
- Azure AD authentication (optional - TBD)
- Public internet access
- TLS 1.2+ required
- WAF protection (if behind Application Gateway)

**Data:**
- Live production data with FERPA-protected student records
- Automated backups: Daily full, hourly differential
- Point-in-time restore enabled (7-day retention minimum)
- Geo-redundant backup storage

**Deployment Trigger:**
- Manual slot swap after staging validation
- Requires Change Advisory Board approval
- Scheduled during maintenance window (if applicable)

**Health Checks:**
- HTTP endpoint: `/health` (TBD - not implemented)
- Startup timeout: 120 seconds
- Ping interval: 30 seconds
- Auto-heal rules configured (restart on failure)

**High Availability:**
- Azure App Service: Built-in redundancy within region
- Database: Zone-redundant configuration (optional)
- Load balancer: Azure Front Door or Traffic Manager (optional)

---

### Environment Differences

| Configuration | Development | Staging | Production |
|--------------|-------------|---------|------------|
| **Error Display** | Detailed stack traces | Generic error page | Generic error page with RequestId |
| **Logging Level** | Debug, Information | Information, Warning | Information, Warning, Error |
| **Database** | LocalDB (file-based) | Azure SQL (Basic/Standard) | Azure SQL (Standard/Premium) |
| **Seed Data** | Auto-seeded on startup | Manual import | Production data only |
| **TLS/SSL** | Self-signed cert | Azure-managed cert | Azure-managed cert |
| **HSTS** | Disabled | Enabled (30 days) | Enabled (30 days) |
| **Connection String** | Trusted_Connection=True | Azure AD or SQL Auth | Azure AD or SQL Auth with encryption |
| **Application Insights** | Disabled | Enabled (dev instrumentation key) | Enabled (prod instrumentation key) |
| **Deployment** | Manual (F5/dotnet run) | Automated (GitHub Actions) | Automated slot swap (manual trigger) |
| **Backup Retention** | None | 7 days | 30 days + long-term backups |

---

## Configuration Management

### Configuration Sources

ContosoUniversity uses a hierarchical configuration model with the following priority (highest to lowest):

1. **Command-line arguments** (if provided)
2. **Environment variables** (highest priority for production)
3. **User secrets** (development only, stored outside source control)
4. **appsettings.{Environment}.json** (environment-specific overrides)
5. **appsettings.json** (base configuration)

### Configuration Files

#### appsettings.json (Base Configuration)

**Location:** `/ContosoUniversity/ContosoUniversity/appsettings.json`

```json
{
  "PageSize": 3,
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext-{guid};Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

**Key Settings:**
- `PageSize`: Number of items per page in paginated lists (default: 3)
- `Logging.LogLevel.Default`: Minimum log level for all categories
- `Logging.LogLevel.Microsoft.AspNetCore`: Log level for ASP.NET Core framework logs
- `AllowedHosts`: Allowed hostnames (use specific domains in production)
- `ConnectionStrings.SchoolContext`: Database connection string (override in production)

---

#### appsettings.Development.json (Development Overrides)

**Location:** `/ContosoUniversity/ContosoUniversity/appsettings.Development.json`

```json
{
  "DetailedErrors": true,
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**Key Settings:**
- `DetailedErrors`: Show detailed exception information in responses (never enable in production)

---

#### appsettings.Production.json (Production Overrides - NOT PRESENT)

**⚠️ MISSING:** This file is not committed to source control. Production configuration should be managed via:

1. **Azure App Service Configuration** (Application Settings)
2. **Azure Key Vault** (for secrets)
3. **Environment Variables**

**Recommended Production Configuration:**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "contoso-uni.azurewebsites.net,www.contosouniversity.edu",
  "PageSize": 10,
  "ApplicationInsights": {
    "InstrumentationKey": "*** USE AZURE KEY VAULT ***"
  }
}
```

**Do NOT include in source control:**
- Connection strings with credentials
- API keys
- Certificates
- Instrumentation keys
- Any secrets or sensitive data

---

### Environment Variables

Environment variables override configuration files. Use these for environment-specific settings.

#### Required Environment Variables (Production)

| Variable Name | Example Value | Purpose | Source |
|--------------|---------------|---------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Production` | Sets runtime environment | Azure App Service Configuration |
| `ConnectionStrings__SchoolContext` | `Server=tcp:contoso-sql.database.windows.net...` | Database connection string | Azure App Service Configuration + Key Vault |
| `ApplicationInsights__InstrumentationKey` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Application Insights telemetry | Azure Key Vault |

**Note:** Double underscore `__` in environment variable names maps to nested JSON configuration (e.g., `ConnectionStrings__SchoolContext` → `ConnectionStrings:SchoolContext`)

#### Optional Environment Variables

| Variable Name | Example Value | Purpose |
|--------------|---------------|---------|
| `PageSize` | `10` | Override default page size |
| `Logging__LogLevel__Default` | `Warning` | Override log level |
| `ASPNETCORE_URLS` | `http://*:8080` | Override default port (container scenarios) |

---

### Azure App Service Configuration

**Location:** Azure Portal → App Service → Configuration → Application Settings

**Configuration Steps:**

1. Navigate to Azure Portal → App Service (`contoso-uni`)
2. Select **Configuration** → **Application Settings**
3. Add/edit application settings:
   - Name: `ASPNETCORE_ENVIRONMENT`
   - Value: `Production`
   - Deployment slot setting: ✅ (checked for production-specific)
4. Add connection string:
   - Name: `SchoolContext`
   - Value: `Server=tcp:contoso-sql.database.windows.net,1433;Database=SchoolContext;User ID=*** VAULT REFERENCE ***;Password=*** VAULT REFERENCE ***;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`
   - Type: `SQLAzure`
   - Deployment slot setting: ✅ (checked)
5. Click **Save** → **Continue** (triggers app restart)

**⚠️ IMPORTANT:** Always use **Key Vault references** for secrets:
```
@Microsoft.KeyVault(SecretUri=https://contoso-vault.vault.azure.net/secrets/SqlConnectionString/)
```

---

## Secrets Management

### Strategy

ContosoUniversity uses **Azure Key Vault** for centralized secrets management in non-development environments.

**Secrets Hierarchy:**
1. **Development:** User Secrets (stored locally, not in source control)
2. **Staging/Production:** Azure Key Vault with Managed Identity authentication

---

### Azure Key Vault Setup

#### Prerequisites

1. Azure Key Vault instance created (`contoso-vault`)
2. Managed Identity enabled for Azure App Service
3. Key Vault access policy grants App Service `Get` and `List` permissions for secrets

#### Key Vault Secrets Inventory

| Secret Name | Description | Rotation Frequency | Owner |
|-------------|-------------|-------------------|-------|
| `SqlConnectionString` | Azure SQL Database connection string with credentials | 90 days | Database Admin |
| `ApplicationInsights-InstrumentationKey` | Application Insights instrumentation key | Annual | DevOps Team |
| `AzureAd-ClientSecret` | Azure AD application client secret (if using auth) | 180 days | Security Team |

#### Creating Secrets

**Azure CLI:**
```bash
# Login to Azure
az login

# Set secret in Key Vault
az keyvault secret set \
  --vault-name contoso-vault \
  --name SqlConnectionString \
  --value "Server=tcp:contoso-sql.database.windows.net,1433;Database=SchoolContext;User ID=contoso-admin;Password=*** SECURE PASSWORD ***;Encrypt=True;"
```

**Azure Portal:**
1. Navigate to Key Vault (`contoso-vault`)
2. Select **Secrets** → **Generate/Import**
3. Upload options: Manual
4. Name: `SqlConnectionString`
5. Value: `Server=tcp:...` (paste connection string)
6. Enabled: Yes
7. Set activation/expiration dates (optional)
8. Create

---

### Referencing Secrets in App Service

**Application Setting Configuration:**

Instead of storing secrets directly in App Service configuration, use Key Vault references:

```
@Microsoft.KeyVault(SecretUri=https://contoso-vault.vault.azure.net/secrets/SqlConnectionString/)
```

**Example:**
- Name: `ConnectionStrings__SchoolContext`
- Value: `@Microsoft.KeyVault(SecretUri=https://contoso-vault.vault.azure.net/secrets/SqlConnectionString/)`

**Validation:**
- App Service automatically resolves the reference at runtime
- Check Application Insights logs for Key Vault access success/failure
- Restart App Service if secrets are rotated

---

### Secret Rotation Procedure

**Frequency:** Every 90 days for database credentials, 180 days for API keys

**Rotation Steps:**

1. **Create New Secret Version:**
   ```bash
   az keyvault secret set \
     --vault-name contoso-vault \
     --name SqlConnectionString \
     --value "Server=tcp:...;Password=*** NEW PASSWORD ***;"
   ```

2. **Update Database Credentials** (if SQL authentication):
   ```sql
   ALTER LOGIN [contoso-admin] WITH PASSWORD = '*** NEW PASSWORD ***'
   ```

3. **Validate Secret Access:**
   - Navigate to Azure Portal → Key Vault → Secrets → SqlConnectionString
   - Verify new version created with current timestamp
   - Check "Enabled" status is Yes

4. **Restart App Service:**
   ```bash
   az webapp restart --name contoso-uni --resource-group ContosoUniversity
   ```

5. **Verify Application Connectivity:**
   - Check Application Insights logs for successful database connections
   - Test key application functionality (student list, enrollment)
   - Monitor error rate for 15 minutes

6. **Disable Old Secret Version** (after 24-hour grace period):
   - Navigate to Key Vault → Secrets → SqlConnectionString → Old Version
   - Click **Disable**
   - Set expiration date to current date

**Rollback:** If issues detected, re-enable old secret version and restart App Service.

---

### Development Environment Secrets

**User Secrets** (Development Only)

**Location:** `%APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json` (Windows)  
**Location:** `~/.microsoft/usersecrets/<user_secrets_id>/secrets.json` (Linux/macOS)

**Setup:**
```bash
# Initialize user secrets
cd ContosoUniversity/ContosoUniversity
dotnet user-secrets init

# Set connection string
dotnet user-secrets set "ConnectionStrings:SchoolContext" "Server=(localdb)\\mssqllocaldb;Database=SchoolContext-dev;Trusted_Connection=True;"

# List secrets
dotnet user-secrets list
```

**⚠️ NEVER commit user secrets to source control.**

---

## Deployment Procedures

### Deployment Strategy

ContosoUniversity uses a **Blue-Green deployment** strategy with Azure App Service deployment slots:

1. **Build:** GitHub Actions builds application and creates deployment artifact
2. **Deploy to Staging:** Artifact deployed to `staging` slot automatically
3. **Validation:** Manual or automated testing on staging slot
4. **Slot Swap:** Promote staging to production by swapping slots (zero downtime)
5. **Monitoring:** Watch for errors post-deployment, rollback if needed

**Advantages:**
- Zero-downtime deployments
- Easy rollback (swap slots back)
- Production validation before go-live
- Identical infrastructure (staging slot becomes production)

---

### Pre-Deployment Checklist

**Before every production deployment:**

- [ ] **Code Review:** All PRs reviewed and approved by at least one reviewer
- [ ] **Tests Passing:** All unit tests, integration tests, and CodeQL scans pass in CI
- [ ] **Staging Validation:** Application tested and validated in staging environment
- [ ] **Database Migrations:** Database schema changes reviewed and tested in staging
- [ ] **Secrets Updated:** All secrets rotated if necessary and validated in staging
- [ ] **Change Ticket:** Change request approved by Change Advisory Board (if applicable)
- [ ] **Communication:** Stakeholders notified of deployment window
- [ ] **Rollback Plan:** Rollback procedure reviewed and understood
- [ ] **Monitoring:** Dashboards and alerts verified and accessible
- [ ] **On-Call:** On-call engineer available during and after deployment

---

### Automated Deployment (GitHub Actions)

#### Workflow: `.github/workflows/dotnet.yml`

**Trigger Events:**
- Push to `main` branch
- Pull request to `main` branch
- Manual workflow dispatch

**Jobs:**

##### 1. Build Job

**Runner:** `ubuntu-latest`

**Steps:**
1. **Checkout code:** `actions/checkout@v2`
2. **Setup .NET:** Install .NET 6.0 SDK (`actions/setup-dotnet@v1`)
3. **Restore dependencies:** `dotnet restore`
4. **Build:** `dotnet build --no-restore`
5. **Test:** `dotnet test --no-build --verbosity normal`
6. **Publish:** `dotnet publish ContosoUniversity/ContosoUniversity.csproj -c Release -o website`
7. **Upload artifact:** Upload `website` folder for deployment jobs

**Duration:** ~2-4 minutes

---

##### 2. Deploy to Staging Job

**Dependencies:** Requires `build` job success  
**Runner:** `ubuntu-latest`  
**Environment:** `PRE-PROD` (requires approval)

**Steps:**
1. **Download artifact:** Download `website` artifact from build job
2. **Azure login:** Authenticate using `AZURE_CREDENTIALS` secret (Service Principal)
3. **Deploy to staging slot:** `azure/webapps-deploy@v2`
   - App name: `contoso-uni`
   - Slot name: `staging`
   - Package: `website` folder
4. **Azure logout:** `az logout`

**Duration:** ~3-5 minutes

**Validation:**
- Navigate to `https://contoso-uni-staging.azurewebsites.net`
- Verify application loads without errors
- Test key workflows: student list, course enrollment, department edit
- Check Application Insights for errors

---

##### 3. Deploy to Production Job

**Dependencies:** Requires `deploy_staging` job success  
**Runner:** `ubuntu-latest`  
**Environment:** `PROD` (requires approval)

**Steps:**
1. **Azure login:** Authenticate using `AZURE_CREDENTIALS` secret
2. **Slot swap:** Swap `staging` slot into `production`
   ```bash
   az webapp deployment slot swap \
     -g ContosoUniversity \
     -n contoso-uni \
     -s staging
   ```
3. **Get production URL:** Query production URL from Azure
4. **Azure logout:** `az logout`

**Duration:** ~1-2 minutes (slot swap is instantaneous)

**Post-Deployment:**
- Production URL now serves content from staging slot
- Staging slot now contains old production content (rollback available)
- Monitor Application Insights for errors
- Validate key functionality in production

---

### Manual Deployment (Emergency/Hotfix)

**Use Case:** Emergency hotfix outside normal CI/CD pipeline

**Prerequisites:**
- Azure CLI installed and authenticated (`az login`)
- .NET 6.0 SDK installed
- Access to Azure subscription and App Service

**Steps:**

1. **Build Application Locally:**
   ```bash
   cd ContosoUniversity
   dotnet restore
   dotnet build -c Release
   dotnet publish ContosoUniversity.csproj -c Release -o ./publish
   ```

2. **Create Deployment Package:**
   ```bash
   cd publish
   zip -r ../deploy.zip .
   cd ..
   ```

3. **Deploy to Staging Slot:**
   ```bash
   az webapp deployment source config-zip \
     --resource-group ContosoUniversity \
     --name contoso-uni \
     --slot staging \
     --src deploy.zip
   ```

4. **Validate Staging:**
   - Navigate to `https://contoso-uni-staging.azurewebsites.net`
   - Test application functionality

5. **Swap to Production:**
   ```bash
   az webapp deployment slot swap \
     -g ContosoUniversity \
     -n contoso-uni \
     -s staging
   ```

6. **Monitor Production:**
   - Check Application Insights dashboard
   - Verify no error spike in logs
   - Test key workflows

**Duration:** ~10-15 minutes (manual process)

---

### Database Migration Deployment

**⚠️ CRITICAL:** Database migrations must be deployed carefully to avoid data loss.

**Strategy:** Migrations are applied automatically on application startup via `Program.cs`:

```csharp
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
    context.Database.Migrate(); // Applies pending migrations
    DbInitializer.Initialize(context); // Seeds data if empty
}
```

**Pros:**
- Simple deployment (no separate migration step)
- Migrations automatically applied on first request

**Cons:**
- Application startup delay during migration
- No explicit migration validation before deployment
- Risk of migration failure causing application unavailability

---

#### Recommended Migration Process (Production)

**Alternative Approach:** Apply migrations manually before deployment to validate success.

**Steps:**

1. **Generate Migration Script:**
   ```bash
   dotnet ef migrations script \
     --idempotent \
     --output migration.sql \
     --project ContosoUniversity \
     --startup-project ContosoUniversity
   ```

2. **Review Migration Script:**
   - Open `migration.sql` and review all changes
   - Verify no unintended table drops or data loss
   - Test script in staging database

3. **Apply Migration to Staging Database:**
   ```bash
   sqlcmd -S contoso-sql-staging.database.windows.net \
     -d SchoolContext \
     -U contoso-admin \
     -P *** PASSWORD *** \
     -i migration.sql
   ```

4. **Validate Migration:**
   - Check table schema matches expected structure
   - Verify data integrity (row counts, foreign keys)
   - Test application against staging database

5. **Apply Migration to Production Database:**
   ```bash
   sqlcmd -S contoso-sql.database.windows.net \
     -d SchoolContext \
     -U contoso-admin \
     -P *** PASSWORD *** \
     -i migration.sql
   ```

6. **Deploy Application:**
   - Proceed with standard deployment process (GitHub Actions or manual)
   - Application startup will detect migrations already applied (no delay)

**Rollback:** Database migration rollback requires manual SQL script execution (see Rollback Procedures).

---

### Post-Deployment Validation

**Checklist (5-10 minutes post-deployment):**

- [ ] **Application Loads:** Homepage loads without errors (`https://contoso-uni.azurewebsites.net`)
- [ ] **Database Connectivity:** Student list page loads (verifies database connection)
- [ ] **Key Workflows:**
  - [ ] View students list (pagination works)
  - [ ] View course details
  - [ ] View instructor list with courses
  - [ ] View department list
- [ ] **Error Rate:** No spike in Application Insights error rate
- [ ] **Response Time:** P95 response time < 200ms (check Application Insights)
- [ ] **Database Queries:** No slow queries or deadlocks (check Azure SQL diagnostics)
- [ ] **Logs:** No unexpected warnings or errors in Application Insights logs

**If any validation fails:** Proceed to rollback procedure immediately.

---

## Rollback Procedures

### Rollback Strategy

ContosoUniversity uses **slot-based rollback** for application deployments and **database restore** for schema/data rollback.

**Rollback Speed:**
- **Application Rollback:** ~1-2 minutes (slot swap)
- **Database Rollback:** ~15-60 minutes (depends on database size)

---

### Application Rollback (Slot Swap)

**Use Case:** Application code issue detected post-deployment

**Prerequisites:**
- Staging slot still contains previous production version (after slot swap)
- No database schema changes that break old code

**Steps:**

1. **Identify Issue:**
   - Error spike in Application Insights
   - Key functionality broken (user reports, monitoring alerts)
   - Performance degradation

2. **Decision to Rollback:**
   - Consult with Tech Lead and on-call engineer
   - Verify issue is not environment-specific (check staging)
   - Confirm rollback is necessary (quick fix not available)

3. **Execute Rollback (Swap Slots Back):**

   **Azure Portal:**
   - Navigate to App Service (`contoso-uni`)
   - Deployment → Deployment slots
   - Click **Swap**
   - Source: `production`, Target: `staging`
   - Click **Swap** → **OK**

   **Azure CLI:**
   ```bash
   az webapp deployment slot swap \
     -g ContosoUniversity \
     -n contoso-uni \
     -s staging \
     --target-slot production
   ```

4. **Validate Rollback:**
   - Navigate to production URL
   - Verify old version is running
   - Test key workflows
   - Check Application Insights for error rate decrease

5. **Incident Report:**
   - Document rollback reason, time, and outcome
   - Create post-mortem ticket for root cause analysis
   - Schedule fix and re-deployment

**Duration:** ~1-2 minutes

**Downside:** Staging slot now contains broken code. Do not deploy from staging until fixed.

---

### Database Rollback (Point-in-Time Restore)

**Use Case:** Database migration failed or corrupted data

**⚠️ WARNING:** Database rollback causes data loss for transactions after restore point.

**Prerequisites:**
- Azure SQL Database point-in-time restore enabled
- Backup available within retention window (7-35 days)
- Application stopped or in read-only mode during restore

**Steps:**

1. **Identify Issue:**
   - Database migration failed mid-execution
   - Data corruption detected
   - Schema change broke application

2. **Decision to Rollback:**
   - Consult with Database Admin and Tech Lead
   - Verify backup exists at desired restore point (pre-migration)
   - **WARNING:** All data changes after restore point will be lost

3. **Stop Application (Prevent Writes):**
   ```bash
   az webapp stop --name contoso-uni --resource-group ContosoUniversity
   ```

4. **Restore Database to Point-in-Time:**

   **Azure Portal:**
   - Navigate to Azure SQL Database (`SchoolContext`)
   - Overview → **Restore**
   - Restore point: Select timestamp (before migration)
   - Destination: `SchoolContext-restored` (new database name)
   - Click **OK** (restore takes 15-60 minutes)

   **Azure CLI:**
   ```bash
   az sql db restore \
     --resource-group ContosoUniversity \
     --server contoso-sql \
     --name SchoolContext \
     --dest-name SchoolContext-restored \
     --time "2025-12-30T08:00:00Z"
   ```

5. **Update Connection String:**
   - Navigate to App Service → Configuration → Connection Strings
   - Update `SchoolContext` to point to `SchoolContext-restored` database
   - Save configuration (triggers app restart)

6. **Start Application:**
   ```bash
   az webapp start --name contoso-uni --resource-group ContosoUniversity
   ```

7. **Validate Rollback:**
   - Navigate to production URL
   - Verify database schema is correct (pre-migration)
   - Test key workflows
   - Check data integrity (row counts, foreign keys)

8. **Cleanup:**
   - Once validated, rename `SchoolContext-restored` to `SchoolContext` (optional)
   - Delete failed database (after 48-hour grace period)

**Duration:** ~15-60 minutes (depends on database size)

**Data Loss:** All transactions after restore point are lost. Communicate to users.

---

### Emergency Rollback (Complete)

**Use Case:** Critical production issue requiring immediate full rollback

**Steps:**

1. **Stop Traffic (if possible):**
   - If using Azure Front Door or Traffic Manager, redirect traffic to maintenance page
   - Otherwise, stop App Service:
     ```bash
     az webapp stop --name contoso-uni --resource-group ContosoUniversity
     ```

2. **Rollback Application:**
   - Follow application rollback procedure (slot swap)

3. **Rollback Database (if needed):**
   - Follow database rollback procedure (point-in-time restore)

4. **Restart Application:**
   ```bash
   az webapp start --name contoso-uni --resource-group ContosoUniversity
   ```

5. **Validate System Health:**
   - Test all key workflows
   - Check Application Insights for errors
   - Monitor database connections

6. **Post-Incident:**
   - Schedule post-mortem meeting
   - Document incident timeline
   - Identify root cause and prevention measures

**Downtime:** ~5-10 minutes (application only) or ~15-60 minutes (with database restore)

---

## Observability

### Observability Strategy

ContosoUniversity uses a **three-pillar observability model**:

1. **Logs:** Application logs, request logs, error logs
2. **Metrics:** Performance counters, request rates, resource utilization
3. **Traces:** Distributed tracing for request flow (TBD - not implemented)

**Primary Tool:** Azure Application Insights (TBD - instrumentation key not configured)

---

### Logging

#### Log Levels

| Level | Use Case | Example | Retention |
|-------|----------|---------|----------|
| **Trace** | Detailed debugging (not used in production) | "Entering method CreateStudent with ID=123" | 1 day |
| **Debug** | Diagnostic information for troubleshooting | "DbContext initialized with connection string" | 3 days |
| **Information** | General informational messages | "Student created successfully: ID=123" | 7 days |
| **Warning** | Unexpected but recoverable situations | "Database query took 5 seconds (slow)" | 14 days |
| **Error** | Error events requiring attention | "Failed to save student: database timeout" | 30 days |
| **Critical** | Fatal errors causing application failure | "Database connection failed, application stopping" | 90 days |

**Production Log Level:** `Information` (Warning, Error, Critical also logged)

---

#### Log Format

**Current Format:** ASP.NET Core default console logging (plain text)

**Example Log Output:**
```
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
info: Microsoft.Hosting.Lifetime[0]
      Hosting environment: Production
info: Microsoft.Hosting.Lifetime[0]
      Content root path: /home/site/wwwroot
```

**Recommended Format:** Structured JSON logging via Serilog (not currently implemented)

**Example Structured Log:**
```json
{
  "Timestamp": "2025-12-30T10:23:30.123Z",
  "Level": "Information",
  "MessageTemplate": "Student created successfully",
  "Properties": {
    "StudentId": 123,
    "RequestId": "0HMVHG9VG3K8F:00000001",
    "UserAgent": "Mozilla/5.0..."
  }
}
```

---

#### Log Destinations

| Environment | Destination | Access Method | Retention |
|------------|-------------|---------------|-----------|
| **Development** | Console output | Visual Studio Output window, terminal | Session only |
| **Staging** | Azure App Service Logs | Azure Portal → Log Stream, Kudu console | 7 days (file system) |
| **Production** | Azure Application Insights | Azure Portal → Application Insights → Logs | 90 days (configurable) |

**Production Log Access:**

1. **Application Insights Logs (Recommended):**
   - Navigate to Azure Portal → Application Insights (`contoso-uni-insights`)
   - Logs → New Query
   - Query language: Kusto Query Language (KQL)

   **Example Queries:**
   ```kql
   // All errors in last 24 hours
   traces
   | where timestamp > ago(24h)
   | where severityLevel >= 3  // Error level
   | project timestamp, message, severityLevel, customDimensions
   | order by timestamp desc

   // Slow requests (> 2 seconds)
   requests
   | where timestamp > ago(1h)
   | where duration > 2000  // milliseconds
   | project timestamp, name, duration, resultCode
   | order by duration desc
   ```

2. **App Service Log Stream (Real-time):**
   - Navigate to Azure Portal → App Service (`contoso-uni`)
   - Monitoring → Log stream
   - View real-time logs from application

3. **Kudu Console (File System Logs):**
   - Navigate to `https://contoso-uni.scm.azurewebsites.net`
   - Debug console → CMD or PowerShell
   - Navigate to `D:\home\LogFiles\Application`
   - Download or view log files

---

#### Correlation IDs

**⚠️ NOT IMPLEMENTED:** Request correlation IDs are not currently tracked.

**Recommendation:** Implement correlation ID middleware to track requests across distributed systems.

**Example Middleware:**
```csharp
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
        ?? Guid.NewGuid().ToString();
    context.Response.Headers.Add("X-Correlation-ID", correlationId);
    using (LogContext.PushProperty("CorrelationId", correlationId))
    {
        await next();
    }
});
```

**Benefit:** Trace a single user request across logs, even in distributed systems.

---

### Metrics

#### Application Performance Metrics

**⚠️ NOT IMPLEMENTED:** Application Insights instrumentation key not configured.

**Recommended Metrics:**

| Metric | Description | Threshold | Action |
|--------|-------------|-----------|--------|
| **Request Rate** | Requests per second | > 100 req/s | Scale up App Service plan |
| **Response Time (P95)** | 95th percentile response time | > 500ms | Investigate slow queries, optimize code |
| **Error Rate** | Percentage of failed requests | > 1% | Investigate errors, rollback if critical |
| **Database Connections** | Active database connections | > 80 (out of 100 max) | Increase connection pool size |
| **CPU Utilization** | App Service CPU usage | > 80% | Scale up or out |
| **Memory Usage** | App Service memory usage | > 80% | Investigate memory leaks, scale up |

**Access Metrics:**
- Azure Portal → Application Insights → Metrics
- Create custom charts and dashboards
- Set up alerts for threshold violations

---

#### Database Performance Metrics

**Azure SQL Database Diagnostics:**

| Metric | Description | Threshold | Action |
|--------|-------------|-----------|--------|
| **DTU Percentage** | Database Transaction Unit utilization | > 80% | Scale up database tier |
| **CPU Percentage** | Database CPU usage | > 80% | Optimize queries, scale up |
| **Log IO Percentage** | Transaction log write utilization | > 80% | Reduce write volume, scale up |
| **Failed Connections** | Failed connection attempts | > 5/min | Check firewall rules, credentials |
| **Deadlocks** | Deadlock count | > 0 | Investigate transaction logic, add retries |
| **Slow Queries** | Queries > 2 seconds | > 10/hour | Optimize queries, add indexes |

**Access Database Metrics:**
- Azure Portal → SQL Database → Monitoring → Metrics
- Query Performance Insight → Top Resource Consuming Queries
- Intelligent Insights → Automatic anomaly detection

---

### Traces (Distributed Tracing)

**⚠️ NOT IMPLEMENTED:** Distributed tracing not configured.

**Recommendation:** Implement distributed tracing with Application Insights or OpenTelemetry.

**Benefits:**
- Visualize request flow through application layers
- Identify bottlenecks and performance issues
- Correlate logs and metrics for a single request

**Example Trace:**
```
Request: GET /Students
  ├─ Database Query: SELECT * FROM Student (120ms)
  ├─ Render View: Index.cshtml (45ms)
  └─ Total Duration: 180ms
```

**Implementation:**
- Application Insights auto-instrumentation (enable in App Service)
- OpenTelemetry SDK for custom instrumentation

---

## Monitoring & Alerting

### Monitoring Dashboards

**⚠️ NOT IMPLEMENTED:** Custom dashboards not created.

**Recommended Dashboards:**

#### 1. Application Health Dashboard

**Metrics:**
- Request rate (last hour)
- Error rate (last hour)
- Response time (P50, P95, P99)
- Active users (last 15 minutes)
- Deployment events (last 7 days)

**Location:** Azure Portal → Dashboards → Create custom dashboard

---

#### 2. Database Health Dashboard

**Metrics:**
- DTU/CPU utilization (last hour)
- Active connections
- Failed connections
- Slow queries (> 2 seconds)
- Deadlock count

**Location:** Azure Portal → SQL Database → Monitoring → Metrics

---

#### 3. Infrastructure Dashboard

**Metrics:**
- App Service CPU/Memory usage
- App Service restarts
- Azure SQL Database availability
- Key Vault access success rate

**Location:** Azure Portal → Monitor → Metrics → Custom dashboard

---

### Alert Rules

**⚠️ NOT IMPLEMENTED:** Alert rules not configured.

**Recommended Alerts:**

| Alert Name | Condition | Threshold | Severity | Action |
|-----------|-----------|-----------|----------|--------|
| **High Error Rate** | Error rate > 5% | 5% over 5 minutes | Critical | Page on-call engineer, auto-rollback (optional) |
| **Slow Response Time** | P95 response time > 1 second | 1000ms over 10 minutes | High | Notify DevOps team, investigate slow queries |
| **Database CPU High** | Azure SQL CPU > 90% | 90% over 5 minutes | High | Scale up database tier (if auto-scale not enabled) |
| **Application Unavailable** | HTTP 503 errors | > 10 errors over 2 minutes | Critical | Page on-call engineer, check App Service status |
| **Failed Database Connections** | Failed connections > 10/min | 10 over 5 minutes | High | Check firewall rules, credentials, network |
| **Deployment Failure** | GitHub Actions workflow failed | Any failure | Medium | Notify DevOps team, investigate logs |
| **Key Vault Access Denied** | Key Vault access denied | > 5 errors over 5 minutes | High | Check Managed Identity permissions |

**Alert Notification Channels:**
- Email: `devops-team@contosouniversity.edu`
- SMS: On-call engineer phone number
- Slack/Teams: `#contoso-alerts` channel
- PagerDuty: Critical alerts only

**Configuration:**
- Azure Portal → Monitor → Alerts → Create alert rule
- Define metric/log query, threshold, action group

---

### Health Checks

**⚠️ NOT IMPLEMENTED:** Health check endpoints not implemented.

**Recommendation:** Implement health check endpoint for monitoring.

**Example Health Check:**

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SchoolContext>();

app.MapHealthChecks("/health");
```

**Health Check Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "Healthy",
  "checks": [
    {
      "name": "SchoolContext",
      "status": "Healthy",
      "duration": "00:00:00.123"
    }
  ]
}
```

**Integration:**
- Azure App Service: Configure health check path in App Service settings
- Load Balancer: Use health check endpoint for backend pool health probes

---

## On-Call Procedures

### On-Call Rotation

**Schedule:** 24/7 on-call rotation  
**Tool:** PagerDuty, Opsgenie, or manual schedule  
**Rotation:** Weekly rotation, primary + secondary on-call  
**Escalation:** Escalate to Tech Lead if issue not resolved in 30 minutes

**Current On-Call:**
- **Primary:** [Name] - [Phone] - [Email]
- **Secondary:** [Name] - [Phone] - [Email]
- **Escalation:** [Tech Lead Name] - [Phone] - [Email]

---

### Alert Response Workflow

**When you receive an alert:**

1. **Acknowledge Alert:**
   - Acknowledge in PagerDuty/Opsgenie within 5 minutes
   - If no acknowledgment, alert escalates to secondary on-call

2. **Assess Severity:**
   - **Critical (P1):** Production outage, data loss, security breach
   - **High (P2):** Degraded performance, partial functionality loss
   - **Medium (P3):** Non-critical issues, can be addressed during business hours

3. **Initial Investigation (5-10 minutes):**
   - Check Azure Portal for App Service and database status
   - Review Application Insights logs for error patterns
   - Verify recent deployments (check GitHub Actions)
   - Check Azure Status page for platform issues

4. **Communication:**
   - Create incident ticket in tracking system
   - Notify stakeholders via Slack/Teams if P1/P2
   - Provide status updates every 30 minutes for critical incidents

5. **Mitigation:**
   - For application issues: Consider rollback (see Rollback Procedures)
   - For database issues: Check connection strings, firewall rules
   - For infrastructure issues: Check Azure service health, scale resources

6. **Resolution:**
   - Verify issue is resolved (metrics return to normal)
   - Monitor for 15 minutes post-resolution
   - Document root cause in incident ticket
   - Schedule post-mortem for P1 incidents

7. **Post-Incident:**
   - Update runbook with lessons learned
   - Create follow-up tasks for permanent fixes
   - Close incident ticket with summary

---

### Common Incident Scenarios

#### Scenario 1: Application Unavailable (HTTP 503)

**Symptoms:**
- Users cannot access application
- HTTP 503 Service Unavailable errors
- Application Insights shows request failures

**Possible Causes:**
- App Service stopped or crashed
- App Service deployment in progress
- Resource exhaustion (CPU/memory)

**Investigation:**
1. Check App Service status in Azure Portal (Running vs Stopped)
2. Check Application Insights for errors/exceptions
3. Check App Service metrics (CPU, memory, restart count)

**Resolution:**
- If stopped: Restart App Service
- If crashed: Check logs for errors, restart App Service
- If resource exhaustion: Scale up App Service plan, investigate memory leaks

**Rollback:** If issue started after deployment, perform slot swap rollback.

---

#### Scenario 2: Database Connection Failures

**Symptoms:**
- "Cannot connect to database" errors
- Timeout errors on database queries
- Application Insights shows SqlException

**Possible Causes:**
- Database server unavailable
- Firewall rules blocking App Service IP
- Connection string incorrect
- Max connections reached

**Investigation:**
1. Check Azure SQL Database status (available, paused, scaling)
2. Check firewall rules (allow App Service outbound IPs)
3. Verify connection string in App Service configuration
4. Check active connection count in database metrics

**Resolution:**
- If database paused: Resume database
- If firewall issue: Add App Service outbound IPs to firewall allow list
- If connection string issue: Update configuration (use Key Vault reference)
- If max connections: Increase connection pool size or database tier

---

#### Scenario 3: Slow Performance (Response Time > 2 seconds)

**Symptoms:**
- Users report slow page loads
- Application Insights shows high P95 response time
- No errors, but degraded experience

**Possible Causes:**
- Slow database queries
- High CPU/memory usage
- Network latency
- Missing indexes

**Investigation:**
1. Check Application Insights for slow requests (drill down by page)
2. Check Azure SQL Database Query Performance Insight for slow queries
3. Check App Service CPU/memory metrics
4. Review recent code changes (query optimization)

**Resolution:**
- Optimize slow queries (add indexes, rewrite queries)
- Scale up App Service plan (more CPU/memory)
- Scale up database tier (more DTUs)
- Enable caching for frequently accessed data (future enhancement)

---

#### Scenario 4: High Error Rate (> 5%)

**Symptoms:**
- Application Insights shows error spike
- Users report intermittent errors
- HTTP 500 Internal Server Error

**Possible Causes:**
- Unhandled exceptions in code
- Database query failures
- External dependency failure (Key Vault, etc.)

**Investigation:**
1. Check Application Insights exception logs (group by exception type)
2. Identify affected pages/endpoints
3. Review recent deployments (correlation with error spike)
4. Check external dependencies (Key Vault, Azure SQL)

**Resolution:**
- If code bug: Rollback deployment, fix bug, redeploy
- If database issue: Investigate query failures, check database health
- If dependency issue: Check service health, verify configuration

---

## Troubleshooting Guide

### Diagnostic Tools

| Tool | Purpose | Access |
|------|---------|--------|
| **Azure Portal** | App Service status, metrics, logs | `https://portal.azure.com` |
| **Application Insights** | Logs, metrics, traces, exceptions | Azure Portal → Application Insights |
| **Kudu Console** | File system access, process explorer | `https://contoso-uni.scm.azurewebsites.net` |
| **Azure CLI** | Command-line management | `az webapp ...` |
| **SQL Server Management Studio (SSMS)** | Database queries, diagnostics | Connect to Azure SQL Database |
| **Azure Storage Explorer** | Backup files, blob storage | Desktop app or Azure Portal |

---

### Common Issues

#### Issue: "Failed to load student list"

**Error Message:** "An error occurred while processing your request. Request ID: ..."

**Possible Causes:**
- Database connection failure
- Slow query timeout
- Missing table or data

**Troubleshooting:**
1. **Check Database Connectivity:**
   - Azure Portal → SQL Database → Connection strings (verify credentials)
   - Test connection from local machine using SSMS
   - Check firewall rules (App Service outbound IPs allowed)

2. **Check Application Insights Logs:**
   ```kql
   exceptions
   | where timestamp > ago(1h)
   | where outerMessage contains "Student"
   | project timestamp, outerMessage, innermostMessage
   ```

3. **Check Database Queries:**
   - Azure Portal → SQL Database → Query Performance Insight
   - Identify slow queries (> 2 seconds)
   - Check for missing indexes

**Resolution:**
- Fix connection string if incorrect
- Add missing indexes to Student table
- Increase database tier if CPU/DTU maxed out

---

#### Issue: "Deployment failed in GitHub Actions"

**Error Message:** "Error: Failed to deploy web package to App Service."

**Possible Causes:**
- Azure credentials expired or incorrect
- App Service stopped or unavailable
- Deployment package too large
- Slot not found

**Troubleshooting:**
1. **Check GitHub Actions Logs:**
   - Navigate to GitHub → Actions → Failed workflow
   - Expand failed step (usually "Deploy to staging slot")
   - Review error message

2. **Verify Azure Credentials:**
   - GitHub → Settings → Secrets → `AZURE_CREDENTIALS`
   - Verify Service Principal credentials not expired
   - Test credentials locally: `az login --service-principal ...`

3. **Check App Service Status:**
   - Azure Portal → App Service → Overview (Running status)
   - Check for scaling operations in progress

**Resolution:**
- Rotate Azure credentials if expired (update GitHub secret)
- Restart App Service if stopped
- Check deployment package size (< 4 GB limit)
- Verify slot name matches workflow configuration

---

#### Issue: "Department edit fails with concurrency error"

**Error Message:** "The record you attempted to edit was modified by another user after you got the original values."

**Possible Cause:**
- Another user edited the same department record simultaneously
- Concurrency token mismatch

**Expected Behavior:**
- This is an expected scenario (optimistic concurrency control)
- Application displays current database values vs. user's submitted values
- User must decide to overwrite or cancel

**Resolution:**
- User reviews field-by-field comparison
- User resubmits with updated values or cancels

**Not a Bug:** This is a feature to prevent lost updates in concurrent edit scenarios.

---

### Log Analysis

#### Finding Recent Errors

**Application Insights Query:**
```kql
traces
| where timestamp > ago(1h)
| where severityLevel >= 3  // Error, Critical
| project timestamp, message, severityLevel, customDimensions
| order by timestamp desc
| take 100
```

#### Finding Slow Requests

**Application Insights Query:**
```kql
requests
| where timestamp > ago(1h)
| where duration > 2000  // > 2 seconds
| project timestamp, name, url, duration, resultCode
| order by duration desc
| take 50
```

#### Finding Database Timeouts

**Application Insights Query:**
```kql
exceptions
| where timestamp > ago(1h)
| where outerMessage contains "timeout"
| project timestamp, outerMessage, operation_Name
| order by timestamp desc
```

---

## Disaster Recovery

### Backup Strategy

#### Application Backup

**Strategy:** Infrastructure as Code (Azure App Service)  
**Backup:** No explicit backup required (redeploy from source control)

**Recovery Steps:**
1. Create new App Service from Azure Portal or ARM template
2. Configure application settings (connection strings, secrets)
3. Deploy application from GitHub Actions or manual deployment
4. Update DNS to point to new App Service (if needed)

**Recovery Time Objective (RTO):** 30 minutes  
**Recovery Point Objective (RPO):** Latest commit in source control

---

#### Database Backup

**Strategy:** Azure SQL Database automated backups

**Backup Schedule:**
- **Full Backup:** Weekly
- **Differential Backup:** Every 12-24 hours
- **Transaction Log Backup:** Every 5-10 minutes
- **Retention:** 7-35 days (configurable)

**Backup Storage:**
- Primary: Azure geo-redundant storage (GRS)
- Replica: Paired Azure region (automatic)

**Recovery Steps:**

1. **Point-in-Time Restore:**
   ```bash
   az sql db restore \
     --resource-group ContosoUniversity \
     --server contoso-sql \
     --name SchoolContext \
     --dest-name SchoolContext-restored \
     --time "2025-12-30T10:00:00Z"
   ```

2. **Geo-Restore (Regional Failure):**
   ```bash
   az sql db restore \
     --resource-group ContosoUniversity \
     --server contoso-sql-eastus2 \
     --name SchoolContext \
     --dest-name SchoolContext \
     --source-database-id /subscriptions/.../SchoolContext \
     --service-objective S3
   ```

**Recovery Time Objective (RTO):** 1-2 hours  
**Recovery Point Objective (RPO):** 5-10 minutes

---

### Disaster Recovery Plan

#### Scenario 1: Regional Outage (Azure Region Down)

**Impact:** App Service and Database unavailable in primary region

**Recovery Steps:**

1. **Verify Outage:**
   - Check Azure Status page: `https://status.azure.com`
   - Confirm primary region outage (East US, West US, etc.)

2. **Activate DR Site:**
   - Deploy application to secondary region (East US 2, West US 2, etc.)
   - Create App Service in secondary region
   - Restore database from geo-backup to secondary region
   - Configure application settings (connection strings, secrets)

3. **Update DNS:**
   - Update DNS CNAME to point to secondary App Service
   - TTL: 5 minutes (minimize DNS propagation delay)

4. **Validate DR Site:**
   - Test application functionality
   - Verify database connectivity
   - Monitor Application Insights for errors

**Duration:** 2-4 hours (depends on database size)

**⚠️ IMPORTANT:** Test DR plan quarterly to validate recovery procedures.

---

#### Scenario 2: Data Corruption

**Impact:** Database data corrupted (accidental deletion, bad migration)

**Recovery Steps:**

1. **Assess Damage:**
   - Identify corrupted tables or records
   - Determine restore point (before corruption)

2. **Restore Database:**
   - Follow Database Rollback procedure (point-in-time restore)
   - Restore to separate database name (validation before cutover)

3. **Validate Restored Data:**
   - Query restored database to verify data integrity
   - Compare row counts, checksums with expected values

4. **Cutover to Restored Database:**
   - Update App Service connection string to point to restored database
   - Restart App Service
   - Validate application functionality

5. **Cleanup:**
   - Delete corrupted database after 48-hour grace period

**Duration:** 1-2 hours

---

## Contacts & Escalation

### Team Contacts

| Role | Name | Email | Phone | Availability |
|------|------|-------|-------|--------------|
| **DevOps Lead** | TBD | devops-lead@contosouniversity.edu | +1-555-0100 | Business hours + on-call |
| **Tech Lead** | TBD | tech-lead@contosouniversity.edu | +1-555-0101 | Business hours + escalation |
| **Database Admin** | TBD | dba@contosouniversity.edu | +1-555-0102 | Business hours + on-call |
| **Security Team** | TBD | security@contosouniversity.edu | +1-555-0103 | Business hours + critical escalation |
| **Product Owner** | TBD | product-owner@contosouniversity.edu | +1-555-0104 | Business hours |

---

### Escalation Matrix

| Severity | Response Time | Escalation Path | Notification |
|----------|--------------|----------------|--------------|
| **P1 (Critical)** | 15 minutes | On-call → Tech Lead → DevOps Lead | PagerDuty, SMS, Email, Slack |
| **P2 (High)** | 30 minutes | On-call → Tech Lead | PagerDuty, Email, Slack |
| **P3 (Medium)** | 2 hours | On-call | Email, Slack |
| **P4 (Low)** | Next business day | Ticket assignment | Email |

**P1 Examples:** Production outage, data loss, security breach  
**P2 Examples:** Degraded performance, partial functionality loss  
**P3 Examples:** Non-critical bugs, minor performance issues  
**P4 Examples:** Feature requests, documentation updates

---

### External Vendor Contacts

| Vendor | Service | Contact | Support Hours |
|--------|---------|---------|---------------|
| **Microsoft Azure** | Cloud platform | Azure Support Portal | 24/7 |
| **GitHub** | Source control, CI/CD | GitHub Support | 24/7 (Premium) |
| **PagerDuty** | Incident management | PagerDuty Support | 24/7 |

---

## Appendix

### Useful Commands

#### Azure CLI

```bash
# Login to Azure
az login

# List App Services
az webapp list --resource-group ContosoUniversity --output table

# Restart App Service
az webapp restart --name contoso-uni --resource-group ContosoUniversity

# View App Service logs
az webapp log tail --name contoso-uni --resource-group ContosoUniversity

# Swap deployment slots
az webapp deployment slot swap \
  -g ContosoUniversity \
  -n contoso-uni \
  -s staging

# List SQL Databases
az sql db list --server contoso-sql --resource-group ContosoUniversity --output table

# Restore SQL Database
az sql db restore \
  --resource-group ContosoUniversity \
  --server contoso-sql \
  --name SchoolContext \
  --dest-name SchoolContext-restored \
  --time "2025-12-30T10:00:00Z"
```

---

#### .NET CLI

```bash
# Build application
dotnet build -c Release

# Run application locally
dotnet run --project ContosoUniversity

# Publish application
dotnet publish -c Release -o ./publish

# Apply database migrations
dotnet ef database update

# Generate migration script
dotnet ef migrations script --idempotent --output migration.sql
```

---

### Configuration Reference

#### Required Azure Resources

| Resource Type | Resource Name | Purpose |
|--------------|---------------|---------|
| **Resource Group** | `ContosoUniversity` | Logical container for all resources |
| **App Service Plan** | `contoso-uni-plan` | Compute resources for web app |
| **App Service** | `contoso-uni` | Web application hosting |
| **Deployment Slot** | `staging` | Pre-production slot for blue-green deployment |
| **SQL Server** | `contoso-sql` | Database server |
| **SQL Database** | `SchoolContext` | Application database |
| **Key Vault** | `contoso-vault` | Secrets management |
| **Application Insights** | `contoso-uni-insights` | Telemetry and monitoring |
| **Storage Account** | `contosounistorage` | Backup storage (optional) |

---

#### Required GitHub Secrets

| Secret Name | Description | How to Generate |
|------------|-------------|-----------------|
| `AZURE_CREDENTIALS` | Service Principal credentials for Azure authentication | `az ad sp create-for-rbac --name contoso-uni-sp --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/ContosoUniversity --sdk-auth` |

**Secret Format (JSON):**
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | SRE/DevOps Team | Initial operational runbook creation |

---

### Document Review

**Next Review Date:** 2026-01-30  
**Review Frequency:** Quarterly  
**Owner:** SRE/DevOps Team

**Review Checklist:**
- [ ] Verify contact information is current
- [ ] Update Azure resource names if changed
- [ ] Validate backup and recovery procedures (test DR)
- [ ] Review alert thresholds based on actual usage
- [ ] Update troubleshooting guide with new issues
- [ ] Verify GitHub Actions workflow configuration
- [ ] Update monitoring dashboards and queries

---

## Related Documents

- [00-Project-Overview.md](./00-Project-Overview.md) - Migration project overview
- [01-Architecture-Overview.md](./01-Architecture-Overview.md) - System architecture
- [Technology-Inventory.md](./Technology-Inventory.md) - Technology stack
- [Data-Model-Catalog.md](./Data-Model-Catalog.md) - Database schema and data model
- [03-Compatibility-Gap-Analysis.md](./03-Compatibility-Gap-Analysis.md) - Migration compatibility analysis

---

_This operational runbook provides comprehensive guidance for deploying, monitoring, and maintaining the ContosoUniversity application. All procedures should be tested regularly and updated based on operational experience._
