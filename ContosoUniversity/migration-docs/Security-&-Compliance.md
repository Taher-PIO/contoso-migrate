# Security & Compliance - Contoso University

**Document Version:** 1.0  
**Date:** 2025-12-30  
**Author:** Security & Compliance Team  

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Threat Model & Risk Assessment](#threat-model--risk-assessment)
- [Authentication & Authorization](#authentication--authorization)
- [Data Security & Encryption](#data-security--encryption)
- [Secrets Management](#secrets-management)
- [Security Scanning & Testing](#security-scanning--testing)
- [Data Handling & Privacy](#data-handling--privacy)
- [Compliance Framework](#compliance-framework)
- [Audit & Monitoring](#audit--monitoring)
- [Security Recommendations](#security-recommendations)

---

## Executive Summary

Contoso University is an ASP.NET Core 6.0 educational management application currently in a **pre-production development state** with significant security gaps that must be addressed before production deployment. The application lacks critical security controls including authentication, authorization, encryption at rest, and comprehensive audit logging.

### Current Security Posture: ⚠️ **HIGH RISK - Not Production Ready**

| Security Domain | Status | Risk Level |
|----------------|--------|------------|
| **Authentication** | ❌ Not Implemented | **CRITICAL** |
| **Authorization** | ❌ Not Implemented | **CRITICAL** |
| **Encryption at Rest** | ❌ Not Implemented | **HIGH** |
| **Encryption in Transit** | ⚠️ Partial (HTTPS capable, HSTS enabled) | **MEDIUM** |
| **Secrets Management** | ❌ Plaintext connection strings | **HIGH** |
| **Security Scanning** | ✅ CodeQL SAST enabled | **LOW** |
| **Audit Logging** | ❌ Minimal logging, no audit trail | **HIGH** |
| **Input Validation** | ⚠️ Partial (ModelState validation) | **MEDIUM** |
| **Data Privacy** | ❌ No privacy controls | **CRITICAL** |

**Key Finding:** The application currently exposes all student, instructor, and department data without any access control, making it unsuitable for handling sensitive educational records in compliance with FERPA, GDPR, or other data protection regulations.

---

## Threat Model & Risk Assessment

### System Trust Boundaries

The application has a significant trust boundary vulnerability where the web application tier lacks authentication, allowing any anonymous user direct access to all data operations.

**Current Architecture:**
- Internet-facing web application with no authentication gateway
- Direct database access via EF Core with Trusted Connection (OS-level auth)
- No network segmentation or DMZ configuration documented

### STRIDE Threat Analysis

#### Spoofing (Identity Threats)
| Threat | Current Risk | Mitigation Status | Recommendation |
|--------|-------------|-------------------|----------------|
| **Unauthenticated Access** | **CRITICAL** | ❌ None | Implement ASP.NET Core Identity or Microsoft Entra ID |
| **Session Hijacking** | **HIGH** | ⚠️ HTTPS only | Add secure cookies, SameSite=Strict, HttpOnly flags |
| **CSRF Attacks** | **MEDIUM** | ✅ Anti-forgery tokens enabled (Razor Pages default) | Maintain token validation |

#### Tampering (Data Integrity Threats)
| Threat | Current Risk | Mitigation Status | Recommendation |
|--------|-------------|-------------------|----------------|
| **SQL Injection** | **LOW** | ✅ Parameterized queries (EF Core) | Continue using EF Core, avoid raw SQL |
| **Request Tampering** | **HIGH** | ⚠️ ModelState validation only | Add authentication, authorization policies |
| **Concurrency Tampering** | **LOW** | ✅ Optimistic concurrency on Department entity | Extend to other sensitive entities |

#### Repudiation (Auditability Threats)
| Threat | Current Risk | Mitigation Status | Recommendation |
|--------|-------------|-------------------|----------------|
| **No Audit Trail** | **HIGH** | ❌ No user action logging | Implement comprehensive audit logging |
| **Anonymous Operations** | **CRITICAL** | ❌ No user identity tracking | Require authentication for all operations |
| **Data Change Tracking** | **HIGH** | ❌ No change history | Implement temporal tables or audit triggers |

#### Information Disclosure (Confidentiality Threats)
| Threat | Current Risk | Mitigation Status | Recommendation |
|--------|-------------|-------------------|----------------|
| **Unrestricted Data Access** | **CRITICAL** | ❌ All data publicly accessible | Implement role-based access control |
| **Sensitive Data in Logs** | **MEDIUM** | ⚠️ Default logging (may leak data) | Sanitize logs, remove PII from error messages |
| **Database Encryption** | **HIGH** | ❌ No encryption at rest | Enable SQL Server TDE |
| **Error Message Disclosure** | **LOW** | ✅ Generic error page in production | Maintain configuration |

#### Denial of Service (Availability Threats)
| Threat | Current Risk | Mitigation Status | Recommendation |
|--------|-------------|-------------------|----------------|
| **Resource Exhaustion** | **MEDIUM** | ⚠️ No rate limiting | Implement API throttling, connection limits |
| **Database Connection Pool Exhaustion** | **LOW** | ✅ EF Core connection pooling | Monitor and tune pool size |

#### Elevation of Privilege (Authorization Threats)
| Threat | Current Risk | Mitigation Status | Recommendation |
|--------|-------------|-------------------|----------------|
| **Horizontal Privilege Escalation** | **CRITICAL** | ❌ No authorization checks | Implement resource-level authorization |
| **Vertical Privilege Escalation** | **CRITICAL** | ❌ No role separation | Define roles (Student, Faculty, Admin) |
| **Insecure Direct Object Reference** | **HIGH** | ❌ IDs in URLs, no ownership checks | Add ownership validation |

### Threat Model Highlights & Mitigations

#### Priority 1: CRITICAL - Must Fix Before Production
1. **Lack of Authentication**
   - **Threat:** Anyone can access, view, modify, and delete all data
   - **Impact:** Complete data breach, FERPA violation, loss of data integrity
   - **Mitigation:** Implement ASP.NET Core Identity with Microsoft Entra ID or self-hosted authentication

2. **No Authorization Controls**
   - **Threat:** No role separation between students, faculty, and administrators
   - **Impact:** Students can modify grades, delete courses, alter budgets
   - **Mitigation:** Implement policy-based authorization with role hierarchies

3. **Unauthenticated Data Access**
   - **Threat:** All student PII (names, enrollment dates) publicly accessible
   - **Impact:** FERPA, GDPR violations; reputational damage
   - **Mitigation:** Require authentication, implement field-level authorization

---

## Authentication & Authorization

### Current State: ❌ **NOT IMPLEMENTED**

**Configuration Analysis:**

Program.cs shows no authentication services registered:
- No `AddAuthentication()` call
- No `AddAuthorization()` with policies
- `UseAuthorization()` is present but ineffective without authentication
- No `[Authorize]` attributes on Razor Pages
- Result: **All endpoints are publicly accessible**

### Authentication Gaps

| Authentication Requirement | Status | Notes |
|----------------------------|--------|-------|
| User registration | ❌ Not implemented | No user accounts exist |
| User login | ❌ Not implemented | No login page or mechanism |
| Password policies | ❌ Not implemented | N/A - no authentication |
| Multi-factor authentication (MFA) | ❌ Not implemented | N/A |
| Session management | ⚠️ Default ASP.NET Core session | No custom logic |
| OAuth/OpenID Connect | ❌ Not implemented | No external providers |

### Recommended Authentication Strategy

**Approach: Microsoft Entra ID (Azure AD) Integration**

**Rationale:**
- Educational institutions commonly use Microsoft 365 / Entra ID
- Supports SSO (Single Sign-On) for students and faculty
- Built-in MFA, conditional access, and security policies
- FERPA-compliant when configured correctly

**Alternative: ASP.NET Core Identity**
- For self-hosted scenarios or non-Azure deployments
- Full control over user database and authentication flow

### Recommended Authorization Model

**Role Hierarchy:**
- **Administrator:** Full CRUD on all entities, manage user roles, access audit logs
- **Faculty:** View all students/courses, edit grades (own courses), create/edit courses (own department)
- **Student:** View own enrollment and grades, view course catalog (read-only), enroll in courses

---

## Data Security & Encryption

### Encryption in Transit: ⚠️ **PARTIAL**

**Current Implementation:**
- ✅ HTTPS redirection configured
- ✅ HSTS (HTTP Strict Transport Security) enabled for non-development
- ⚠️ Certificate management not documented
- ⚠️ TLS version defaults to .NET 6 settings (TLS 1.2+)

**Gaps:**
- No Content Security Policy (CSP) headers
- No X-Frame-Options, X-Content-Type-Options headers

### Encryption at Rest: ❌ **NOT IMPLEMENTED**

**Database Encryption:**

| Encryption Type | Status | Risk |
|----------------|--------|------|
| **Transparent Data Encryption (TDE)** | ❌ Not enabled | **HIGH** |
| **Column-level Encryption** | ❌ Not implemented | **HIGH** |
| **Backup Encryption** | ❌ Unknown | **HIGH** |

**Sensitive Data Inventory:**

The application stores the following sensitive data **in plaintext**:

| Data Type | Fields | Sensitivity | Regulation |
|-----------|--------|-------------|------------|
| **Student PII** | FirstMidName, LastName, EnrollmentDate | **HIGH** | FERPA, GDPR |
| **Instructor PII** | FirstMidName, LastName, HireDate, OfficeLocation | **HIGH** | GDPR |
| **Academic Records** | Course enrollments, grades | **HIGH** | FERPA |
| **Financial Data** | Department budgets | **MEDIUM** | Internal policy |

**Recommendations:**
1. Enable SQL Server TDE (Transparent Data Encryption)
2. Implement column-level encryption for highly sensitive fields
3. Encrypt database backups

### Key Management & Rotation: ❌ **NOT IMPLEMENTED**

**Recommendations:**
- Use Azure Key Vault or AWS KMS for key storage
- Implement automated key rotation (90-day cycle)
- Separate keys for different environments

---

## Secrets Management

### Current State: ❌ **INSECURE - Plaintext Secrets**

**Connection String Storage:**

Connection strings are stored in `appsettings.json` (committed to source control):
```json
{
  "ConnectionStrings": {
    "SchoolContext": "Server=(localdb)\\mssqllocaldb;Database=SchoolContext-...;Trusted_Connection=True"
  }
}
```

**Risk Assessment:**
- ⚠️ Connection string in source control (Git history)
- ⚠️ Uses Trusted Connection (Windows auth) - acceptable for dev, not portable
- ⚠️ No encryption of configuration files

### Recommended Secrets Management Strategy

**Development Environment:**
```bash
# Use .NET User Secrets (not in source control)
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:SchoolContext" "Server=...;Password=..."
```

**Production Environment:**
- Azure: Use Azure Key Vault with Managed Identity
- AWS: Use AWS Secrets Manager
- Implement secret rotation policies

---

## Security Scanning & Testing

### Current Security Scanning: ✅ **SAST Enabled**

**CodeQL Configuration:**

CodeQL is configured in `.github/workflows/codeql-analysis.yml`:
- Runs on push, PR, and weekly schedule (Tuesdays)
- Covers C# and JavaScript
- Security and quality queries enabled

**CodeQL Status:** ✅ **ACTIVE**

### Security Scanning Gaps

| Scan Type | Status | Tool | Recommendation |
|-----------|--------|------|----------------|
| **SAST (Static Analysis)** | ✅ Enabled | CodeQL | Continue using, review alerts |
| **DAST (Dynamic Analysis)** | ❌ Not implemented | OWASP ZAP, Burp Suite | Add to CI/CD pipeline |
| **SCA (Dependency Scan)** | ⚠️ Partial | Dependabot | Enable Dependabot alerts |
| **Secrets Scanning** | ⚠️ GitHub default | GitGuardian | Enable GitHub secret scanning |

### Dependency Audit

**Current Dependencies:**
- .NET 6.0 - ⚠️ **END OF SUPPORT: November 12, 2024**
- All packages at version 6.0.2 (released early 2022)
- **CRITICAL:** Upgrade to .NET 8.0 LTS immediately

**Frontend Dependencies:**
- Bootstrap, jQuery, jQuery Validation (versions unknown, bundled)
- **Risk:** Outdated libraries may contain known vulnerabilities

### Penetration Testing Recommendations

**Pre-Production Testing (REQUIRED):**

| Test Category | Priority |
|--------------|----------|
| **Authentication Bypass** | **CRITICAL** |
| **Authorization Bypass** | **CRITICAL** |
| **SQL Injection** | **HIGH** |
| **XSS (Cross-Site Scripting)** | **HIGH** |
| **CSRF** | **HIGH** |
| **Business Logic Flaws** | **HIGH** |

---

## Data Handling & Privacy

### Data Classification

| Data Category | Classification | Regulatory Requirements |
|---------------|----------------|-------------------------|
| **Student Educational Records** | **Confidential - FERPA Protected** | FERPA (US), GDPR (EU) |
| **Personally Identifiable Information (PII)** | **Confidential** | GDPR, CCPA, PIPEDA |
| **Financial Information** | **Internal Use Only** | SOX (if applicable) |
| **Instructor Employment Data** | **Confidential** | GDPR, employment laws |

### Data Retention & Disposal

**Current State:** ❌ No retention policies implemented

**Recommended Retention Policy:**

| Data Type | Retention Period | Regulation |
|-----------|-----------------|------------|
| **Student Records** | 7 years after graduation/withdrawal | FERPA |
| **Grade Records** | Permanent (archival) | Accreditation requirements |
| **Audit Logs** | 7 years | SOX, GDPR |
| **Backup Files** | 90 days | GDPR |

### Privacy Controls: ❌ **NOT IMPLEMENTED**

**GDPR Compliance Requirements:**

| GDPR Principle | Current Status | Required Actions |
|----------------|----------------|------------------|
| **Lawfulness** | ❌ No legal basis documented | Define processing basis |
| **Data Minimization** | ⚠️ Collects only necessary fields | Document justification |
| **Storage Limitation** | ❌ No retention policy | Implement retention |
| **Integrity & Confidentiality** | ❌ No encryption, no access control | Implement auth, encryption |

**GDPR Rights Implementation:**

| Right | Status | Required Functionality |
|-------|--------|------------------------|
| **Right to Access** | ❌ Not implemented | Provide data export endpoint |
| **Right to Rectification** | ⚠️ Partial | Add self-service editing |
| **Right to Erasure** | ❌ Not implemented | Implement soft delete |
| **Right to Data Portability** | ❌ Not implemented | Provide JSON export |

**FERPA Compliance:**

**Current FERPA Compliance:** ❌ **NON-COMPLIANT**
- No authentication - anyone can access all student records
- No authorization - no consent mechanism
- No audit trail - disclosures not logged
- No access controls - students cannot access only their own records

---

## Compliance Framework

### Regulatory Requirements

#### FERPA (Family Educational Rights and Privacy Act)

**Applicability:** U.S. educational institutions receiving federal funding

**Current Compliance Status:** ❌ **NON-COMPLIANT**

**Gap Analysis:**
- ❌ No authentication - anyone can access all student records
- ❌ No authorization - no consent mechanism for disclosures
- ❌ No audit trail - disclosures not logged
- ✅ Data structure supports FERPA (separates enrollments, grades)

**Remediation Roadmap:**
1. Implement authentication
2. Implement role-based authorization
3. Add consent forms for data sharing
4. Implement audit logging
5. Create student self-service portal

---

#### GDPR (General Data Protection Regulation)

**Applicability:** Processing personal data of EU residents

**Current Compliance Status:** ❌ **NON-COMPLIANT**

**Gap Analysis:**
- ❌ No privacy policy or consent mechanism
- ❌ No data protection impact assessment (DPIA)
- ❌ No Data Protection Officer (DPO)
- ❌ No data breach response plan
- ❌ No implementation of data subject rights

**Remediation Roadmap:**
1. Conduct DPIA
2. Appoint DPO
3. Implement authentication and authorization
4. Add privacy policy and consent forms
5. Implement data subject rights endpoints

---

#### PCI DSS (Payment Card Industry Data Security Standard)

**Current Status:** ✅ **NOT APPLICABLE**
- Application does not process payments
- No credit card data stored or transmitted

---

#### HIPAA (Health Insurance Portability and Accountability Act)

**Current Status:** ✅ **NOT APPLICABLE**
- Application does not store Protected Health Information (PHI)

---

#### CCPA/CPRA (California Consumer Privacy Act)

**Current Status:** ⚠️ **POTENTIALLY APPLICABLE**
- Depends on institution location and revenue
- Similar requirements to GDPR

---

### Compliance Obligations Summary

| Regulation | Applicability | Compliance Status | Priority |
|-----------|--------------|------------------|----------|
| **FERPA** | U.S. educational institutions | ❌ Non-compliant | **CRITICAL** |
| **GDPR** | EU residents' data processing | ❌ Non-compliant | **HIGH** |
| **PCI DSS** | Payment processing | ✅ N/A | N/A |
| **HIPAA** | Health information | ✅ N/A | N/A |
| **CCPA/CPRA** | California residents | ⚠️ Potentially applicable | **MEDIUM** |

---

## Audit & Monitoring

### Current Audit Capabilities: ❌ **INSUFFICIENT**

**Logging Configuration:**

appsettings.json shows default logging configuration:
- ✅ ASP.NET Core default logging to console
- ❌ No structured logging (JSON format)
- ❌ No centralized log aggregation
- ❌ No user action logging
- ❌ No security event logging

**What Is Being Logged:**
- HTTP request logs
- Application startup/shutdown events
- EF Core SQL queries (Development only)
- Unhandled exceptions

**What Is NOT Being Logged (CRITICAL GAPS):**
- User identity (no authentication)
- Data access events
- Data modification events
- Failed access attempts
- Security-relevant events

### Required Audit Events

**Security Events (Priority 1):**

| Event Type | Log Data Required | Retention |
|-----------|------------------|-----------|
| **Authentication Success** | User ID, timestamp, IP, user agent | 1 year |
| **Authentication Failure** | Username, timestamp, IP, reason | 1 year |
| **Authorization Denial** | User ID, resource, action | 1 year |
| **Privileged Action** | User ID, action, entity, old/new values | 7 years |

**Data Access Events (Priority 2):**

| Event Type | Log Data Required | Retention |
|-----------|------------------|-----------|
| **View Student Record** | User ID, student ID, timestamp | 7 years (FERPA) |
| **Edit Grade** | User ID, enrollment ID, old/new grade | Permanent |
| **Create/Delete Record** | User ID, entity type, entity ID | 7 years |

### Recommended Audit Implementation

1. **Implement Structured Logging with Serilog**
2. **Create Audit Logging Service**
3. **Create Audit Table in Database**
4. **Integrate Audit Logging in Page Models**

### Monitoring & Alerting

**Recommended Monitoring Strategy:**

| Metric | Threshold | Alert Priority |
|--------|-----------|---------------|
| **Failed Login Attempts** | >5 per user per 15 min | **HIGH** |
| **Authorization Failures** | >10 per user per hour | **MEDIUM** |
| **Database Errors** | >5 per minute | **HIGH** |
| **Application Errors (5xx)** | >10 per minute | **HIGH** |

**Monitoring Tools (Recommended):**
- Azure Application Insights
- Azure Monitor
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana + Prometheus

---

## Security Recommendations

### Immediate Actions (Before ANY Production Deployment)

**Priority 1 - CRITICAL (Blocking Issues):**

1. **Implement Authentication**
   - Add ASP.NET Core Identity or Microsoft Entra ID
   - Require authentication for ALL pages
   - Estimated Effort: 2-3 weeks

2. **Implement Role-Based Authorization**
   - Define roles: Student, Faculty, Administrator
   - Add resource-level ownership checks
   - Estimated Effort: 2 weeks

3. **Enable Encryption at Rest**
   - Enable SQL Server TDE
   - Encrypt database backups
   - Estimated Effort: 1 week

4. **Implement Secrets Management**
   - Remove connection strings from appsettings.json
   - Use Azure Key Vault or AWS Secrets Manager
   - Estimated Effort: 1 week

5. **Implement Comprehensive Audit Logging**
   - Add structured logging with Serilog
   - Create audit table
   - Estimated Effort: 2 weeks

**Priority 2 - HIGH (Production Hardening):**

6. **Upgrade to .NET 8.0 LTS**
   - .NET 6.0 is out of support (EOL November 2024)
   - Estimated Effort: 1 week

7. **Implement Data Retention Policies**
   - Add soft delete functionality
   - Implement GDPR "right to erasure"
   - Estimated Effort: 1-2 weeks

8. **Add Security Headers**
   - CSP, X-Frame-Options, X-Content-Type-Options
   - Estimated Effort: 1 day

9. **Conduct Security Vulnerability Scan**
   - Run OWASP ZAP DAST scan
   - Estimated Effort: 1 week

10. **Implement Rate Limiting**
    - Add ASP.NET Core rate limiting
    - Estimated Effort: 3 days

**Priority 3 - MEDIUM (Compliance):**

11. **Conduct DPIA**
12. **Implement GDPR Data Subject Rights**
13. **Implement Monitoring and Alerting**
14. **Update Frontend Libraries**
15. **Create Incident Response Plan**

### Long-Term Security Roadmap

**Phase 1 (Months 1-3): Foundation**
- Complete all Priority 1 and Priority 2 items
- Establish security baseline

**Phase 2 (Months 4-6): Compliance**
- Complete DPIA and compliance assessments
- Conduct penetration testing

**Phase 3 (Months 7-12): Maturity**
- Implement advanced security features (MFA)
- Establish SIEM integration
- Conduct regular security audits

### Cost Estimates

| Item | Estimated Cost | Frequency |
|------|---------------|-----------|
| Authentication/Authorization Development | $30K - $50K | One-time |
| Security Audit & Penetration Testing | $15K - $30K | Annual |
| Azure Key Vault | $0.03/10K operations | Monthly (~$10-50/mo) |
| Application Insights | $2.30/GB | Monthly (~$50-200/mo) |
| Security Consultant/CISO | $150K - $250K/year | Annual |

**Total First-Year Estimate:** $200K - $400K

---

## Conclusion

Contoso University application is currently in a **pre-production development state** and **NOT ready for production deployment** due to critical security gaps.

**Security Readiness Assessment: 2/10**

Before deployment to production:
1. All Priority 1 (CRITICAL) items MUST be completed
2. FERPA and GDPR compliance assessments MUST be conducted
3. Security audit and penetration testing MUST be performed
4. DPIA MUST be completed
5. Incident response plan MUST be established

**Estimated Time to Production Readiness:** 8-12 weeks with dedicated security team

---

**Document Status:** ✅ Complete  
**Next Review Date:** Quarterly or upon significant architecture changes  
**Document Owner:** Security Team / CISO  
**Approvers:** CTO, Legal/Compliance Officer, Data Protection Officer
