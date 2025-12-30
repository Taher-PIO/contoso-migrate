---
title: 'Backup & Restore Strategy - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'SRE/DevOps & DBA Team'
status: 'Ready for Review'
version: '1.0'
application: 'ContosoUniversity'
---

# Backup & Restore Strategy - ContosoUniversity

## Executive Summary

This document defines the comprehensive backup and restore strategy for the ContosoUniversity application and its supporting infrastructure. It establishes Recovery Time Objectives (RTO), Recovery Point Objectives (RPO), backup schedules, retention policies, and detailed restore procedures to ensure business continuity and data protection.

**Application:** ContosoUniversity  
**Platform:** ASP.NET Core 6.0 on Azure App Service  
**Database:** Azure SQL Database  
**Backup Storage:** Azure geo-redundant storage (GRS)  
**Primary Region:** TBD (e.g., East US)  
**Secondary Region:** TBD (e.g., West US 2)

**Key Objectives:**
- **RTO (Recovery Time Objective):** 2 hours for full system recovery
- **RPO (Recovery Point Objective):** 10 minutes for database, latest commit for application
- **Backup Retention:** 30 days standard, 7 years for compliance
- **Availability Target:** 99.9% uptime

---

## Table of Contents

- [Backup Architecture](#backup-architecture)
- [Database Backup Strategy](#database-backup-strategy)
- [Application Backup Strategy](#application-backup-strategy)
- [Configuration Backup Strategy](#configuration-backup-strategy)
- [Backup Schedules](#backup-schedules)
- [Retention Policies](#retention-policies)
- [Restore Procedures](#restore-procedures)
- [Disaster Recovery](#disaster-recovery)
- [Testing & Validation](#testing--validation)
- [Monitoring & Alerting](#monitoring--alerting)
- [Compliance & Audit](#compliance--audit)
- [Roles & Responsibilities](#roles--responsibilities)

---

## Backup Architecture

### Overview

ContosoUniversity uses a multi-layered backup strategy leveraging Azure native services for automated, geo-redundant backups with point-in-time recovery capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                   Backup Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    Automated     ┌──────────────┐        │
│  │   Azure SQL  │ ──────────────▶  │ SQL Backups  │        │
│  │   Database   │    Backup         │ (GRS)        │        │
│  └──────────────┘    Every 5-10min  └──────────────┘        │
│         │                                   │                │
│         │                            Geo-replicated          │
│         │                                   │                │
│         │                                   ▼                │
│         │                          ┌──────────────┐         │
│         │                          │ Secondary    │         │
│         │                          │ Region       │         │
│         │                          │ Backups      │         │
│         │                          └──────────────┘         │
│         │                                                    │
│  ┌──────────────┐    Manual/CI/CD  ┌──────────────┐        │
│  │  App Service │ ──────────────▶  │  GitHub      │        │
│  │  (Code)      │    Push           │  Repository  │        │
│  └──────────────┘                   └──────────────┘        │
│         │                                   │                │
│         │                            Version Control         │
│         │                                   │                │
│  ┌──────────────┐    Snapshot      ┌──────────────┐        │
│  │ App Settings │ ──────────────▶  │  Key Vault   │        │
│  │ Secrets      │    Backup         │  + Export    │        │
│  └──────────────┘                   └──────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Backup Components

| Component | Backup Method | Frequency | Storage Location | RTO | RPO |
|-----------|---------------|-----------|------------------|-----|-----|
| **Database (Azure SQL)** | Automated full/differential/transaction log | Continuous (every 5-10 min for logs) | Azure GRS (primary + secondary region) | 1-2 hours | 10 minutes |
| **Application Code** | Version control (Git) | On every commit/push | GitHub (with 3x replication) | 30 minutes | Latest commit |
| **Application Configuration** | Manual export + Key Vault | Weekly (manual) + change-triggered | Azure Key Vault + local backup | 30 minutes | 7 days |
| **Infrastructure as Code** | Version control (Git) | On every commit | GitHub | 30 minutes | Latest commit |

---

## Database Backup Strategy

### Azure SQL Database Automated Backups

Azure SQL Database provides built-in, automated backups with no configuration required. These backups are the foundation of our database backup strategy.

#### Backup Types

| Backup Type | Frequency | Purpose | Retention |
|-------------|-----------|---------|-----------|
| **Full Backup** | Weekly (Sunday) | Complete database backup | 7-35 days (configurable) |
| **Differential Backup** | Every 12-24 hours | Changes since last full backup | 7-35 days |
| **Transaction Log Backup** | Every 5-10 minutes | Point-in-time recovery | 7-35 days |

**Storage:** Azure geo-redundant storage (GRS) with automatic replication to paired region

**Backup Size:** Compressed and encrypted (typically 50-70% of database size)

**Cost:** Included in Azure SQL Database pricing (no additional cost for default retention)

---

#### Backup Configuration

**Current Configuration (Verify in Azure Portal):**

```bash
# Check current backup retention policy
az sql db show \
  --resource-group ContosoUniversity \
  --server contoso-sql \
  --name SchoolContext \
  --query "retentionPolicyDays"

# Expected output: 7 (days)
```

**Recommended Configuration:**

- **Short-term retention:** 14 days (increase from default 7 days)
- **Long-term retention:** Enabled with monthly backups for 7 years (compliance requirement)
- **Geo-redundant storage:** Enabled (default)
- **Zone-redundant backup:** Optional (for high availability)

**Update Retention Policy:**

```bash
# Set short-term retention to 14 days
az sql db str-policy set \
  --resource-group ContosoUniversity \
  --server contoso-sql \
  --name SchoolContext \
  --retention-days 14

# Configure long-term retention (monthly for 7 years)
az sql db ltr-policy set \
  --resource-group ContosoUniversity \
  --server contoso-sql \
  --name SchoolContext \
  --monthly-retention 84  # 7 years = 84 months
```

---

#### Point-in-Time Restore (PITR)

Point-in-time restore allows recovery to any moment within the retention window (7-35 days).

**Use Cases:**
- Accidental data deletion or corruption
- Failed database migration
- Rollback after problematic code deployment
- Restore to pre-incident state

**Granularity:** Restore to any point in time down to the second

**Example Restore Scenarios:**

| Scenario | Restore Point | Data Loss |
|----------|---------------|-----------|
| Accidental DELETE executed at 10:30 AM | 10:29 AM | 1 minute |
| Bad migration deployed at 2:00 PM | 1:59 PM | 1 minute |
| Data corruption discovered 2 hours after incident | Time before corruption | 0 (precise recovery) |

---

#### Manual Database Backups

While Azure provides automated backups, manual backups are useful for:
- Pre-migration safety snapshots
- Before major code deployments
- Compliance requirements (local copy)
- Testing restore procedures

**Manual Backup Methods:**

##### Method 1: Export to BACPAC (Recommended)

BACPAC files contain schema + data and can be imported to any SQL Server.

```bash
# Export database to BACPAC file
az sql db export \
  --resource-group ContosoUniversity \
  --server contoso-sql \
  --name SchoolContext \
  --admin-user contoso-admin \
  --admin-password *** PASSWORD *** \
  --storage-key-type StorageAccessKey \
  --storage-key *** STORAGE_KEY *** \
  --storage-uri https://contosounistorage.blob.core.windows.net/backups/SchoolContext-$(date +%Y%m%d).bacpac
```

**Duration:** 5-30 minutes (depends on database size)  
**File Size:** Typically 30-50% of database size (compressed)  
**Storage Location:** Azure Blob Storage with GRS replication

##### Method 2: Database Copy

Create a live copy of the database (useful for testing).

```bash
# Create database copy
az sql db copy \
  --resource-group ContosoUniversity \
  --server contoso-sql \
  --name SchoolContext \
  --dest-name SchoolContext-backup-$(date +%Y%m%d) \
  --dest-resource-group ContosoUniversity-Backups \
  --dest-server contoso-sql-backup
```

**Duration:** 10-60 minutes (depends on database size)  
**Cost:** Full database pricing for the copy (can be lower tier for backup)

---

## Application Backup Strategy

### Source Code Backup

**Strategy:** Version control with Git (GitHub)

**Backup Frequency:** Real-time (every commit/push)

**Storage:**
- **Primary:** GitHub (hosted in multiple Azure regions)
- **Local Clone:** Developer workstations
- **CI/CD Cache:** GitHub Actions artifacts (90-day retention)

**Protection:**
- Branch protection rules (prevent force push to main)
- Required pull request reviews
- Status checks must pass before merge
- Commit signing (recommended)

**Recovery:**
- Clone repository from GitHub
- Checkout specific commit or tag for rollback

**Example:**

```bash
# Clone repository
git clone https://github.com/Taher-PIO/contoso-migrate.git

# Checkout specific commit for rollback
git checkout <commit-sha>

# Checkout specific release tag
git checkout tags/v1.2.3
```

**RTO:** 5-10 minutes (clone + build)  
**RPO:** Latest commit (zero data loss)

---

## Configuration Backup Strategy

### Application Settings

**Strategy:** Manual export + version control

**Backup Frequency:** On every configuration change (manual)

**Storage:** Local backup file + Key Vault + Git (without secrets)

#### Export Configuration

```bash
# Export App Service configuration
az webapp config appsettings list \
  --resource-group ContosoUniversity \
  --name contoso-uni \
  --output json > appSettings-backup-$(date +%Y%m%d).json

# Export connection strings (secrets redacted)
az webapp config connection-string list \
  --resource-group ContosoUniversity \
  --name contoso-uni \
  --output json > connectionStrings-backup-$(date +%Y%m%d).json
```

**Storage Location:** Secure network share or encrypted local backup

**⚠️ IMPORTANT:** Backup files contain sensitive data. Encrypt and store securely.

---

### Secrets Backup (Key Vault)

**Strategy:** Azure Key Vault with soft-delete and purge protection

**Backup Frequency:** Continuous (every secret version)

**Retention:** 90 days (soft-delete retention period)

**Features:**
- **Soft-delete:** Deleted secrets can be recovered within 90 days
- **Purge protection:** Prevents permanent deletion during retention period
- **Versioning:** All secret versions are retained (can rollback)
- **Geo-redundant:** Automatically replicated to paired region

#### Key Vault Configuration

```bash
# Enable soft-delete and purge protection
az keyvault update \
  --name contoso-vault \
  --resource-group ContosoUniversity \
  --enable-soft-delete true \
  --enable-purge-protection true \
  --retention-days 90
```

---

## Backup Schedules

### Automated Backup Schedule

| Component | Backup Type | Frequency | Time (UTC) | Retention | Owner |
|-----------|-------------|-----------|------------|-----------|-------|
| **Database - Full** | Automated (Azure) | Weekly | Sunday 02:00 | 14 days | Azure SQL |
| **Database - Differential** | Automated (Azure) | Daily | Every 12-24 hours | 14 days | Azure SQL |
| **Database - Transaction Log** | Automated (Azure) | Continuous | Every 5-10 minutes | 14 days | Azure SQL |
| **Database - Long-term (Monthly)** | Automated (Azure LTR) | Monthly | 1st Sunday 02:00 | 7 years | Azure SQL |
| **Application Code** | Version control | Continuous | On every commit | Indefinite | GitHub |
| **Deployment Artifacts** | CI/CD build | Continuous | On every build | 90 days | GitHub Actions |

---

### Manual Backup Schedule

| Component | Backup Type | Frequency | Schedule | Owner |
|-----------|-------------|-----------|----------|-------|
| **Database - Manual BACPAC** | Export | Before major changes | As needed (pre-migration, pre-deployment) | DBA |
| **App Settings** | JSON export | On configuration changes | As needed | DevOps Engineer |
| **Key Vault - Manual Export** | Metadata export | Quarterly | First week of quarter | Security Team |
| **Backup Validation** | Test restore | Monthly | First Monday of month | DBA |

---

## Retention Policies

### Database Backup Retention

| Backup Type | Default Retention | Recommended Retention | Compliance Retention | Rationale |
|-------------|-------------------|----------------------|----------------------|-----------|
| **Point-in-time (PITR)** | 7 days | 14 days | N/A | Covers weekly dev cycle + 1 week safety margin |
| **Long-term (Monthly)** | N/A | 7 years | 7 years | FERPA compliance for student records |
| **Long-term (Yearly)** | N/A | 7 years | 7 years | Annual audit requirements |
| **Pre-migration snapshots** | N/A | 30 days | N/A | Rollback window post-migration |

**Compliance Notes:**
- **FERPA:** Family Educational Rights and Privacy Act requires 7-year retention for student records
- **Audit Requirements:** Annual audits require access to historical data for 7 years

---

## Restore Procedures

### Database Restore - Point-in-Time Recovery

**Use Case:** Accidental data deletion, failed migration, data corruption

**Steps:**

1. **Identify Restore Point:**
   - Determine timestamp before incident (e.g., 2025-12-30T10:00:00Z)

2. **Stop Application:**
   ```bash
   az webapp stop --name contoso-uni --resource-group ContosoUniversity
   ```

3. **Restore Database:**
   ```bash
   az sql db restore \
     --resource-group ContosoUniversity \
     --server contoso-sql \
     --name SchoolContext \
     --dest-name SchoolContext-restored \
     --time "2025-12-30T10:00:00Z"
   ```
   **Duration:** 15-60 minutes

4. **Validate Restored Database:**
   ```sql
   USE [SchoolContext-restored];
   SELECT COUNT(*) FROM Student;
   SELECT COUNT(*) FROM Enrollments;
   ```

5. **Update Connection String:**
   ```bash
   az webapp config connection-string set \
     --resource-group ContosoUniversity \
     --name contoso-uni \
     --connection-string-type SQLAzure \
     --settings SchoolContext="Server=tcp:...;Database=SchoolContext-restored;..."
   ```

6. **Restart Application:**
   ```bash
   az webapp start --name contoso-uni --resource-group ContosoUniversity
   ```

**Total Duration:** 30-90 minutes  
**Data Loss:** Minimal (only between incident and restore point)

---

### Application Restore - Rollback Deployment

**Use Case:** Bad deployment, critical bug

**Method 1: Slot Swap (Recommended)**

```bash
az webapp deployment slot swap \
  -g ContosoUniversity \
  -n contoso-uni \
  -s staging
```
**Duration:** 1-2 minutes

**Method 2: Deploy Specific Version**

```bash
git checkout <commit-sha>
dotnet publish -c Release -o ./publish
az webapp deployment source config-zip \
  --resource-group ContosoUniversity \
  --name contoso-uni \
  --src ./publish.zip
```
**Duration:** 10-15 minutes

---

## Disaster Recovery

### RTO & RPO Targets

| Disaster Scenario | RTO | RPO | Recovery Strategy |
|-------------------|-----|-----|-------------------|
| **Regional Outage** | 2 hours | 10 minutes | Geo-restore to secondary region + deploy app |
| **Database Corruption** | 1 hour | 10 minutes | Point-in-time restore |
| **Security Breach** | 4 hours | 24 hours | Restore from clean backup |
| **Accidental Deletion** | 30 minutes | 0 minutes | Recover from soft-delete |

---

### Geo-Restore Procedure

**Use Case:** Primary Azure region unavailable

**Steps:**

1. **Verify Regional Outage:**
   - Check Azure Status: `https://status.azure.com`

2. **Restore to Secondary Region:**
   ```bash
   az sql db restore \
     --resource-group ContosoUniversity-DR \
     --server contoso-sql-westus2 \
     --name SchoolContext \
     --dest-name SchoolContext \
     --source-database-id /subscriptions/.../SchoolContext \
     --edition Standard \
     --service-objective S3
   ```

3. **Deploy Application to Secondary Region:**
   - Create App Service in secondary region
   - Deploy application code
   - Configure connection strings

4. **Update DNS:**
   - Point DNS to secondary region App Service
   - Wait for DNS propagation (5-60 minutes)

**Total Duration:** 2-4 hours

---

## Testing & Validation

### Backup Testing Schedule

| Test Type | Frequency | Duration | Owner | Success Criteria |
|-----------|-----------|----------|-------|------------------|
| **Database PITR** | Monthly | 1 hour | DBA | Restore succeeds, row counts match |
| **Database Long-Term Restore** | Quarterly | 2 hours | DBA | Restore from monthly backup succeeds |
| **Application Rollback** | Quarterly | 30 minutes | DevOps Engineer | Slot swap succeeds, app functions |
| **Full DR Drill** | Quarterly | 4 hours | SRE Team | DR site deployed, RTO < 2 hours |

---

### Monthly Database PITR Test

**Schedule:** First Monday of each month, 10:00 AM EST

**Steps:**

1. **Select Restore Point:** 7 days ago
2. **Perform Test Restore:**
   ```bash
   az sql db restore \
     --resource-group ContosoUniversity-Test \
     --server contoso-sql-test \
     --name SchoolContext-test \
     --dest-name SchoolContext-validation-$(date +%Y%m%d) \
     --time "<7_days_ago_timestamp>"
   ```
3. **Validate:** Check row counts, data integrity
4. **Cleanup:** Delete test database

**Success Criteria:**
- Restore completes in < 60 minutes
- Row counts match expected (±1%)
- No referential integrity violations

---

## Monitoring & Alerting

### Backup Monitoring Metrics

| Metric | Threshold | Alert Severity | Action |
|--------|-----------|----------------|--------|
| **Failed Backup** | Any failure | Critical | Investigate immediately, retry |
| **Backup Duration** | > 2x baseline | Warning | Check DB size, optimize |
| **Backup Storage Full** | > 90% | High | Cleanup old backups |
| **Geo-Replication Lag** | > 60 min | High | Check network, verify status |

---

### Backup Alert Configuration

```bash
# Alert on failed database backup
az monitor metrics alert create \
  --name "Database Backup Failed" \
  --resource-group ContosoUniversity \
  --scopes /subscriptions/.../databases/SchoolContext \
  --condition "count database_backup_failed > 0" \
  --window-size 5m \
  --action email devops-team@contosouniversity.edu
```

---

## Compliance & Audit

### Regulatory Requirements

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| **FERPA** | 7-year retention of student records | Long-term monthly backups for 7 years |
| **GDPR** | Data erasure on request | PITR + selective deletion |
| **SOC 2** | Backup encryption | Azure SQL TDE + TLS 1.2 |
| **ISO 27001** | Regular backup testing | Quarterly DR drills |

---

### Monthly Compliance Report

```
Backup Compliance Report - December 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database Backups:
✅ PITR backups: 100% success rate
✅ Long-term monthly backup: Completed 2025-12-01
✅ Retention: 14 days PITR, 84 months LTR (compliant)

Restore Testing:
✅ Monthly PITR test: Passed (45 min)
✅ Quarterly DR drill: Passed (1h 48min, RTO met)

Compliance Status:
✅ FERPA: Compliant (7-year LTR enabled)
✅ SOC 2: Compliant (encryption + testing)
```

---

## Roles & Responsibilities

### RACI Matrix

| Task | Responsible | Accountable | Consulted | Informed |
|------|-------------|-------------|-----------|----------|
| **Configure automated backups** | DBA | DBA | DevOps Lead | Tech Lead |
| **Monitor backup status** | DevOps Engineer | DevOps Lead | DBA | Tech Lead |
| **Test backup restores** | DBA | DevOps Lead | Tech Lead | Product Owner |
| **Execute disaster recovery** | SRE Team | CTO | Tech Lead, DBA | All stakeholders |

---

## Appendix

### Useful Commands Reference

```bash
# Database Backup
az sql db show --resource-group ContosoUniversity --server contoso-sql --name SchoolContext --query "retentionPolicyDays"
az sql db str-policy set --resource-group ContosoUniversity --server contoso-sql --name SchoolContext --retention-days 14
az sql db ltr-policy set --resource-group ContosoUniversity --server contoso-sql --name SchoolContext --monthly-retention 84
az sql db restore --resource-group ContosoUniversity --server contoso-sql --name SchoolContext --dest-name SchoolContext-restored --time "2025-12-30T10:00:00Z"

# Application Backup
az webapp config appsettings list --resource-group ContosoUniversity --name contoso-uni --output json > appSettings-backup.json
az webapp deployment slot swap -g ContosoUniversity -n contoso-uni -s staging

# Key Vault
az keyvault secret list-deleted --vault-name contoso-vault
az keyvault secret recover --vault-name contoso-vault --name SqlConnectionString
```

---

### Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | SRE/DevOps & DBA Team | Initial backup and restore strategy |

---

**Next Review Date:** 2026-03-30  
**Review Frequency:** Quarterly  
**Owner:** Database Administrator & DevOps Lead

---

_This backup and restore strategy must be reviewed and approved by all stakeholders. All procedures should be tested regularly and updated based on operational experience._
