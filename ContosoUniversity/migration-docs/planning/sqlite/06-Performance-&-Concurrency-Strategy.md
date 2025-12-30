---
title: 'SQLite Performance & Concurrency Strategy - ContosoUniversity'
last_updated: '2025-12-30'
owner: 'Database Migration Team'
status: 'Ready for Review'
database: 'SQLite Migration Plan'
migration_phase: 'Planning - Performance & Concurrency'
---

# SQLite Performance & Concurrency Strategy

## Executive Summary

This document outlines the comprehensive performance tuning and concurrency strategy for migrating ContosoUniversity from SQL Server to SQLite. It provides specific configuration recommendations, pragma settings, connection management strategies, and a benchmarking plan to ensure optimal performance and reliability.

**Key Recommendations:**
- ✅ **WAL Mode (Write-Ahead Logging)** - Essential for read/write concurrency
- ✅ **Optimized Pragma Configuration** - Tuned for web application workload
- ✅ **Connection Pooling** - Proper management for multi-threaded access
- ✅ **Batching & Transaction Strategy** - Minimize write latency
- ✅ **Caching Layer** - Reduce database pressure

**Expected Performance:**
- Read throughput: 10,000+ queries/sec (with WAL mode)
- Write throughput: 1,000+ inserts/sec (with batching)
- Concurrent readers: Unlimited (no blocking with WAL)
- Concurrent writers: 1 at a time (SQLite limitation)
- Database size: < 1 GB (estimated production)

---

## Table of Contents

- [Workload Analysis](#workload-analysis)
- [Journal Mode Selection](#journal-mode-selection)
- [Recommended Pragma Configuration](#recommended-pragma-configuration)
- [Connection Management Strategy](#connection-management-strategy)
- [Concurrency Model](#concurrency-model)
- [Write Optimization Strategy](#write-optimization-strategy)
- [Caching Strategy](#caching-strategy)
- [Performance Tuning Checklist](#performance-tuning-checklist)
- [Benchmarking Plan](#benchmarking-plan)
- [Monitoring & Observability](#monitoring--observability)
- [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Workload Analysis

### Current Application Profile

Based on analysis of the ContosoUniversity application code and Performance-Profile.md:

**Read Operations (Estimated 85-90% of workload):**
- Student list with pagination and search (high frequency)
- Course listings with department joins (moderate frequency)
- Instructor details with eager loading (moderate frequency)
- Statistics and aggregations (low frequency, cacheable)

**Write Operations (Estimated 10-15% of workload):**
- Student enrollment creation (moderate frequency)
- Course and instructor updates (low frequency)
- Department administrative changes (very low frequency)
- Concurrent edit conflicts on Department table (rare, needs optimistic locking)

**Identified Patterns:**
- **Read-Heavy Workload**: 85-90% SELECT queries
- **Small Dataset**: ~38 rows in seed data, estimated < 100,000 rows production
- **Low Write Contention**: Minimal simultaneous writes expected
- **N+1 Query Issues**: Instructor page performs 10-20 queries per request (needs optimization)
- **No Current Caching**: All requests hit database directly

### Contention Points Analysis

| Contention Area | Current Frequency | Risk Level | Mitigation Strategy |
|----------------|-------------------|------------|---------------------|
| **Enrollment Table** | High write | 🟡 MEDIUM | Batch inserts, WAL mode |
| **Department Table** | Concurrent edits | 🟡 MEDIUM | Optimistic locking (already implemented) |
| **Student Search** | High read | 🟢 LOW | Query optimization, caching |
| **Instructor Page** | N+1 queries | 🔴 HIGH | Eager loading optimization (see Performance-Profile.md) |
| **Statistics/About Page** | Aggregation | 🟢 LOW | Result caching (5-minute TTL) |

### Workload Shape Characteristics

**Typical Request Pattern:**
```
09:00-17:00 (Business Hours): 80% of daily traffic
  - Peak: 11:00-13:00 (lunch hours)
  - Average: 50-100 concurrent users
  - Write operations: 10-20/minute

17:00-09:00 (After Hours): 20% of daily traffic
  - Minimal writes
  - Background jobs (if implemented)
  - Batch operations window
```

**Database Size Projection:**
- Students: ~10,000 records × ~100 bytes = ~1 MB
- Enrollments: ~100,000 records × ~50 bytes = ~5 MB
- Courses: ~1,000 records × ~200 bytes = ~0.2 MB
- Instructors: ~500 records × ~100 bytes = ~0.05 MB
- **Total Estimated:** ~10-20 MB (with indexes ~30-50 MB)

**SQLite Suitability:** ✅ EXCELLENT
- Dataset well under SQLite's practical limits (< 100 GB)
- Read-heavy workload perfectly suited for WAL mode
- Low write contention manageable with proper transaction handling

---

## Journal Mode Selection

### Journal Modes Comparison

| Mode | Concurrency | Performance | Durability | Use Case |
|------|-------------|-------------|------------|----------|
| **DELETE** | Poor (readers block writers) | Baseline | Good | Legacy/default |
| **TRUNCATE** | Poor | +10% vs DELETE | Good | Slightly better than DELETE |
| **PERSIST** | Poor | +20% vs DELETE | Good | Reduces file system ops |
| **WAL** ✅ | **Excellent (readers don't block writers)** | **+50-100% vs DELETE** | Excellent | **Web applications** |
| **MEMORY** | N/A | Fastest | None | Testing only |
| **OFF** | N/A | Fast | None | Never use in production |

### Recommended: WAL Mode (Write-Ahead Logging)

**Why WAL Mode:**

1. **Concurrency Benefits:**
   - Readers do NOT block writers (critical for web apps)
   - Writers do NOT block readers
   - Multiple simultaneous readers supported
   - Only writers block each other (SQLite limitation)

2. **Performance Benefits:**
   - 50-100% faster reads under concurrent load
   - Better throughput for mixed read/write workloads
   - Reduced I/O operations (sequential writes to WAL file)

3. **Reliability Benefits:**
   - Better crash recovery
   - Atomic commits even with larger transactions
   - Maintains ACID properties

**WAL Mode Trade-offs:**

❌ **Limitations:**
- Requires shared memory (not suitable for network filesystems like NFS)
- Creates additional files (database.db-wal, database.db-shm)
- Checkpointing overhead (mitigated with proper configuration)
- All processes must use same SQLite version

✅ **Acceptable for ContosoUniversity:**
- Local filesystem deployment (Azure App Service local storage)
- Single application instance per database file
- Read-heavy workload benefits greatly

**Configuration:**
```sql
-- Enable WAL mode (persistent setting stored in database)
PRAGMA journal_mode = WAL;

-- Verify WAL mode is active
PRAGMA journal_mode;
-- Expected output: wal
```

**Checkpointing Strategy:**
```sql
-- Configure automatic checkpointing (default: 1000 pages)
PRAGMA wal_autocheckpoint = 1000;

-- For better control, use manual checkpointing:
-- PRAGMA wal_checkpoint(PASSIVE);  -- Non-blocking
-- PRAGMA wal_checkpoint(FULL);     -- Complete checkpoint
-- PRAGMA wal_checkpoint(RESTART);  -- Reset WAL file
-- PRAGMA wal_checkpoint(TRUNCATE); -- Reset and shrink
```

### Implementation in EF Core

```csharp
// Program.cs or SchoolContext.cs
builder.Services.AddDbContext<SchoolContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("SchoolContext");
    options.UseSqlite(connectionString, sqliteOptions =>
    {
        sqliteOptions.CommandTimeout(30); // 30-second timeout
    });
});

// Connection string with WAL mode
"ConnectionStrings": {
    "SchoolContext": "Data Source=ContosoUniversity.db;Mode=ReadWriteCreate;Cache=Shared"
}

// Enable WAL mode on database initialization
public static class SqliteConfiguration
{
    public static void ConfigureSqlite(DbContext context)
    {
        // Enable WAL mode
        context.Database.ExecuteSqlRaw("PRAGMA journal_mode = WAL;");
        
        // Verify
        var journalMode = context.Database
            .SqlQueryRaw<string>("PRAGMA journal_mode;")
            .AsEnumerable()
            .FirstOrDefault();
        
        Console.WriteLine($"SQLite journal mode: {journalMode}");
    }
}
```

---

## Recommended Pragma Configuration

### Essential Pragmas for Web Applications

These pragmas are tuned specifically for ContosoUniversity's read-heavy, low-write-contention workload:

```sql
-- ========================================
-- CORE CONFIGURATION (Apply on every connection)
-- ========================================

-- Enable WAL mode for concurrency (persistent, only need to set once)
PRAGMA journal_mode = WAL;

-- Set synchronous mode to NORMAL for better performance
-- NORMAL provides good durability with better performance than FULL
-- Acceptable risk: Small window of data loss in case of OS crash
PRAGMA synchronous = NORMAL;

-- Set cache size to 10 MB (10,000 pages × ~1 KB per page)
-- Negative value = size in KB (e.g., -10000 = 10 MB)
PRAGMA cache_size = -10000;

-- Use memory-mapped I/O for better read performance
-- 256 MB mmap size (adjust based on available memory)
PRAGMA mmap_size = 268435456;

-- Set busy timeout to 5 seconds (5000 ms)
-- Wait up to 5 seconds if database is locked
PRAGMA busy_timeout = 5000;

-- Enable foreign key constraints (OFF by default!)
-- CRITICAL: Must be enabled for referential integrity
PRAGMA foreign_keys = ON;

-- Set temp store to memory for faster temp table operations
PRAGMA temp_store = MEMORY;

-- ========================================
-- OPTIMIZATION PRAGMAS (Apply on connection open)
-- ========================================

-- Enable automatic indexing for ad-hoc queries
PRAGMA automatic_index = ON;

-- Set WAL auto-checkpoint to 1000 pages
PRAGMA wal_autocheckpoint = 1000;

-- Set page size (must be set before creating database)
-- 4096 bytes is optimal for most systems
-- PRAGMA page_size = 4096;  -- Only effective before first write

-- ========================================
-- READ-ONLY PRAGMAS (For connection validation)
-- ========================================

-- Query current configuration
PRAGMA journal_mode;       -- Should return: wal
PRAGMA synchronous;        -- Should return: 1 (NORMAL)
PRAGMA foreign_keys;       -- Should return: 1 (ON)
PRAGMA cache_size;         -- Should return: -10000
PRAGMA page_size;          -- Should return: 4096
```

### Pragma Rationale

| Pragma | Value | Rationale | Performance Impact |
|--------|-------|-----------|-------------------|
| `journal_mode` | **WAL** | Enables concurrent reads/writes | +50-100% read throughput |
| `synchronous` | **NORMAL** | Balances durability vs performance | +30-50% write throughput |
| `cache_size` | **-10000 (10 MB)** | Adequate for dataset size | +20-40% query performance |
| `mmap_size` | **256 MB** | Fast read access via memory mapping | +10-30% read performance |
| `busy_timeout` | **5000 ms** | Prevents immediate lock failures | Prevents ~90% of lock errors |
| `foreign_keys` | **ON** | Maintains referential integrity | Critical for data consistency |
| `temp_store` | **MEMORY** | Faster temp operations | +20-50% for complex queries |
| `wal_autocheckpoint` | **1000** | Balances WAL file size vs overhead | Optimal for mixed workload |

### Synchronous Mode Deep Dive

**Options:**

| Mode | Value | Durability | Performance | Use Case |
|------|-------|------------|-------------|----------|
| **OFF** | 0 | ❌ None | Fastest | Testing only, never production |
| **NORMAL** ✅ | 1 | ✅ Good | Fast | **Recommended for most web apps** |
| **FULL** | 2 | ✅✅ Excellent | Slower | Financial/critical data |
| **EXTRA** | 3 | ✅✅✅ Maximum | Slowest | Mission-critical only |

**Chosen: NORMAL (Recommended)**

- Provides fsync() only at critical moments (checkpoint in WAL mode)
- Small window of data loss only if OS crashes (power loss OK)
- 30-50% faster writes compared to FULL
- Acceptable risk for educational application

**If Maximum Durability Required:**
```sql
PRAGMA synchronous = FULL;  -- Use for financial data
```

---

## Connection Management Strategy

### SQLite Connection Pool Anti-Pattern

**IMPORTANT:** Traditional database connection pooling does NOT work well with SQLite!

❌ **Don't Do This:**
```csharp
// ANTI-PATTERN: Multiple connections with pooling
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlite(connectionString)
           .EnableConnectionPooling(true));  // BAD for SQLite
```

✅ **Do This Instead:**

### Recommended: Single Shared Connection with Write Serialization

**Strategy: Use EF Core with proper context lifetime management**

```csharp
// Program.cs - Proper EF Core configuration
builder.Services.AddDbContext<SchoolContext>(options =>
{
    options.UseSqlite(
        "Data Source=ContosoUniversity.db;Mode=ReadWriteCreate;Cache=Shared",
        sqliteOptions =>
        {
            sqliteOptions.CommandTimeout(30);
            
            // Connection resiliency for transient failures
            sqliteOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(2),
                errorNumbersToAdd: null);
        });
    
    // Enable sensitive data logging in development only
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Initialize SQLite pragmas on application startup
public static class DatabaseInitializer
{
    public static void InitializeSqlite(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
        
        // Apply pragmas
        context.Database.ExecuteSqlRaw("PRAGMA journal_mode = WAL;");
        context.Database.ExecuteSqlRaw("PRAGMA synchronous = NORMAL;");
        context.Database.ExecuteSqlRaw("PRAGMA cache_size = -10000;");
        context.Database.ExecuteSqlRaw("PRAGMA mmap_size = 268435456;");
        context.Database.ExecuteSqlRaw("PRAGMA busy_timeout = 5000;");
        context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
        context.Database.ExecuteSqlRaw("PRAGMA temp_store = MEMORY;");
        
        // Run migrations
        context.Database.Migrate();
        
        // Validate configuration
        ValidateConfiguration(context);
    }
    
    private static void ValidateConfiguration(DbContext context)
    {
        var journalMode = context.Database.SqlQueryRaw<string>("PRAGMA journal_mode;")
            .AsEnumerable().FirstOrDefault();
        var foreignKeys = context.Database.SqlQueryRaw<int>("PRAGMA foreign_keys;")
            .AsEnumerable().FirstOrDefault();
        
        if (journalMode != "wal")
            throw new InvalidOperationException("WAL mode not enabled!");
        
        if (foreignKeys != 1)
            throw new InvalidOperationException("Foreign keys not enabled!");
        
        Console.WriteLine("✅ SQLite configured successfully (WAL mode, foreign keys ON)");
    }
}

// Call from Program.cs
using (var scope = app.Services.CreateScope())
{
    DatabaseInitializer.InitializeSqlite(scope.ServiceProvider);
}
```

### Connection String Options

```json
// appsettings.json - Recommended connection strings

// Development
"ConnectionStrings": {
    "SchoolContext": "Data Source=ContosoUniversity.db;Mode=ReadWriteCreate;Cache=Shared;Foreign Keys=True"
}

// Production (relative path)
"ConnectionStrings": {
    "SchoolContext": "Data Source=./data/ContosoUniversity.db;Mode=ReadWriteCreate;Cache=Shared;Foreign Keys=True"
}

// Production (absolute path)
"ConnectionStrings": {
    "SchoolContext": "Data Source=/var/app/data/ContosoUniversity.db;Mode=ReadWriteCreate;Cache=Shared;Foreign Keys=True"
}
```

**Connection String Parameters:**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `Data Source` | File path | Database file location |
| `Mode` | `ReadWriteCreate` | Create if doesn't exist |
| `Cache` | `Shared` | Shared cache for all connections (required for WAL) |
| `Foreign Keys` | `True` | Enable foreign key constraints |

### Context Lifetime Best Practices

```csharp
// ✅ CORRECT: Scoped lifetime (default)
public class StudentsController : Controller
{
    private readonly SchoolContext _context;
    
    public StudentsController(SchoolContext context)
    {
        _context = context; // Injected per request
    }
    
    public async Task<IActionResult> Index()
    {
        var students = await _context.Students.ToListAsync();
        return View(students);
    }
    
    // Context automatically disposed at end of request
}

// ❌ WRONG: Don't create context manually
public class StudentsController : Controller
{
    public async Task<IActionResult> Index()
    {
        // ANTI-PATTERN: Manual context creation
        using var context = new SchoolContext(...);
        var students = await context.Students.ToListAsync();
        return View(students);
    }
}
```

---

## Concurrency Model

### SQLite Concurrency Limitations

**Fundamental Rules:**
1. **Multiple simultaneous readers:** ✅ Unlimited (with WAL mode)
2. **Readers + 1 writer:** ✅ Supported (with WAL mode)
3. **Multiple simultaneous writers:** ❌ NOT supported
4. **Write locks entire database:** ✅ Yes (table-level locking not available)

### Expected Behavior with WAL Mode

```
Timeline of concurrent operations:

T0: Reader A starts query (SELECT * FROM Students)
T1: Reader B starts query (SELECT * FROM Courses)    ✅ No blocking
T2: Writer C starts INSERT INTO Students              ✅ No blocking of readers
T3: Reader D starts query (SELECT * FROM Departments) ✅ No blocking
T4: Writer E tries INSERT INTO Enrollments            ❌ BLOCKED until C commits
T5: Writer C commits                                  ✅ Writer E can now proceed
T6: All readers continue unaffected                   ✅ No blocking
```

### Handling Write Contention

**Strategy 1: Optimistic Concurrency (Already Implemented)**

```csharp
// Models/Department.cs - Already using RowVersion
public class Department
{
    public int DepartmentID { get; set; }
    public string Name { get; set; }
    public decimal Budget { get; set; }
    public DateTime StartDate { get; set; }
    public int? InstructorID { get; set; }
    
    [Timestamp]
    public byte[] ConcurrencyToken { get; set; } // Optimistic locking
    
    public Instructor Administrator { get; set; }
    public ICollection<Course> Courses { get; set; }
}

// Page handler with concurrency check
public async Task<IActionResult> OnPostAsync()
{
    if (!ModelState.IsValid)
        return Page();
    
    _context.Attach(Department).State = EntityState.Modified;
    
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateConcurrencyException ex)
    {
        // Handle optimistic concurrency violation
        var exceptionEntry = ex.Entries.Single();
        var databaseValues = await exceptionEntry.GetDatabaseValuesAsync();
        
        if (databaseValues == null)
        {
            ModelState.AddModelError(string.Empty,
                "Unable to save. The department was deleted by another user.");
        }
        else
        {
            ModelState.AddModelError(string.Empty,
                "The record you attempted to edit was modified by another user. " +
                "Please review the current values and try again.");
            
            // Reload with current database values
            Department = (Department)databaseValues.ToObject();
        }
        
        return Page();
    }
    
    return RedirectToPage("./Index");
}
```

**Strategy 2: Write Serialization with Retry Logic**

```csharp
// Utility/RetryHelper.cs - Retry logic for transient SQLite lock failures
public static class RetryHelper
{
    public static async Task<T> ExecuteWithRetryAsync<T>(
        Func<Task<T>> operation,
        int maxRetries = 3,
        int delayMs = 100)
    {
        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                return await operation();
            }
            catch (DbUpdateException ex) when (IsSqliteBusyException(ex) && i < maxRetries - 1)
            {
                // Exponential backoff: 100ms, 200ms, 400ms
                await Task.Delay(delayMs * (int)Math.Pow(2, i));
            }
        }
        
        // Final attempt without catching
        return await operation();
    }
    
    private static bool IsSqliteBusyException(DbUpdateException ex)
    {
        return ex.InnerException?.Message?.Contains("database is locked") == true ||
               ex.InnerException?.Message?.Contains("SQLITE_BUSY") == true;
    }
}

// Usage in write operations
public async Task<IActionResult> OnPostAsync()
{
    if (!ModelState.IsValid)
        return Page();
    
    await RetryHelper.ExecuteWithRetryAsync(async () =>
    {
        _context.Students.Add(Student);
        await _context.SaveChangesAsync();
        return true;
    });
    
    return RedirectToPage("./Index");
}
```

**Strategy 3: Background Write Queue (For High Write Volumes)**

```csharp
// Services/WriteQueue.cs - For deferring non-critical writes
public class BackgroundWriteQueue : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly Channel<WriteOperation> _queue;
    
    public BackgroundWriteQueue(IServiceProvider services)
    {
        _services = services;
        _queue = Channel.CreateUnbounded<WriteOperation>();
    }
    
    public void QueueWrite(WriteOperation operation)
    {
        _queue.Writer.TryWrite(operation);
    }
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var operation in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            using var scope = _services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
            
            try
            {
                await operation.ExecuteAsync(context);
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error, implement retry logic if needed
                Console.WriteLine($"Background write failed: {ex.Message}");
            }
        }
    }
}

// Usage: Queue non-critical audit logs, statistics updates, etc.
```

### Busy Timeout Configuration

The `PRAGMA busy_timeout = 5000;` setting gives SQLite 5 seconds to retry before failing with "database is locked" error.

**Timeout Selection Guide:**

| Application Type | Recommended Timeout | Rationale |
|-----------------|---------------------|-----------|
| Web Application (ContosoUniversity) | **3000-5000 ms** | Balance between UX and retry attempts |
| Background Jobs | 10000-30000 ms | Can wait longer |
| Real-Time Systems | 100-500 ms | Fail fast |
| Batch Processing | 60000+ ms | Long operations OK |

---

## Write Optimization Strategy

### Batching Writes

**Problem:** Individual inserts are slow due to transaction overhead.

**Solution:** Batch multiple writes into single transaction.

```csharp
// ❌ SLOW: Individual inserts (N transactions)
foreach (var student in students)
{
    _context.Students.Add(student);
    await _context.SaveChangesAsync(); // Each save = 1 transaction
}
// Performance: ~50-100 inserts/second

// ✅ FAST: Batched inserts (1 transaction)
_context.Students.AddRange(students);
await _context.SaveChangesAsync(); // Single transaction
// Performance: ~5,000-10,000 inserts/second (100x faster!)

// ✅ EVEN BETTER: Explicit transaction with batching
using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    // Batch size recommendation: 500-1000 records per transaction
    const int batchSize = 500;
    
    for (int i = 0; i < students.Count; i += batchSize)
    {
        var batch = students.Skip(i).Take(batchSize);
        _context.Students.AddRange(batch);
        await _context.SaveChangesAsync();
    }
    
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

### Transaction Best Practices

```csharp
// Pattern 1: Simple transaction
using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    // Multiple related operations
    _context.Students.Add(student);
    _context.Enrollments.AddRange(enrollments);
    
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}

// Pattern 2: Transaction with isolation level
using var transaction = await _context.Database.BeginTransactionAsync(
    System.Data.IsolationLevel.ReadCommitted);
// ... operations ...

// Pattern 3: Savepoints for partial rollback (SQLite 3.6.8+)
using var transaction = await _context.Database.BeginTransactionAsync();
await _context.Database.ExecuteSqlRawAsync("SAVEPOINT sp1");

try
{
    // Risky operation
    _context.Students.Add(student);
    await _context.SaveChangesAsync();
}
catch
{
    // Rollback to savepoint
    await _context.Database.ExecuteSqlRawAsync("ROLLBACK TO sp1");
}

await transaction.CommitAsync();
```

### Bulk Operations Performance Matrix

| Operation Type | Records | Method | Throughput | Total Time |
|---------------|---------|--------|------------|------------|
| Individual Inserts | 1,000 | SaveChanges() per row | ~50/sec | ~20 seconds |
| AddRange + SaveChanges | 1,000 | Single transaction | ~5,000/sec | ~0.2 seconds |
| Batched (500/batch) | 1,000 | Multiple SaveChanges() | ~3,000/sec | ~0.3 seconds |
| Bulk Insert (raw SQL) | 1,000 | ExecuteSqlRaw | ~8,000/sec | ~0.125 seconds |

**Recommendation:** Use `AddRange()` for most scenarios; raw SQL only for bulk import jobs.

---

## Caching Strategy

### Multi-Tier Caching Architecture

```
┌─────────────────────────────────────────────────┐
│ Tier 1: Response Cache (HTTP Headers)          │
│   - Static pages, CDN-cacheable content        │
│   - Duration: 5-60 minutes                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Tier 2: In-Memory Cache (IMemoryCache)        │
│   - Frequently accessed data (courses, stats)  │
│   - Duration: 1-5 minutes                      │
│   - Size limit: 100 MB                         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Tier 3: Query Result Cache (EF Core)          │
│   - Complex query results                      │
│   - Duration: 30-60 seconds                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Tier 4: SQLite Database                        │
│   - Source of truth                            │
│   - PRAGMA cache_size = 10 MB                  │
└─────────────────────────────────────────────────┘
```

### Implementation: IMemoryCache for Read-Heavy Queries

```csharp
// Services/CachedDataService.cs
public class CachedDataService
{
    private readonly SchoolContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachedDataService> _logger;
    
    public CachedDataService(
        SchoolContext context,
        IMemoryCache cache,
        ILogger<CachedDataService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }
    
    // Cache student enrollment statistics (About page)
    public async Task<List<EnrollmentDateGroup>> GetEnrollmentStatisticsAsync()
    {
        const string cacheKey = "EnrollmentStatistics";
        
        if (!_cache.TryGetValue(cacheKey, out List<EnrollmentDateGroup> statistics))
        {
            _logger.LogInformation("Cache miss for {CacheKey}, querying database", cacheKey);
            
            statistics = await _context.Students
                .GroupBy(s => s.EnrollmentDate)
                .Select(g => new EnrollmentDateGroup
                {
                    EnrollmentDate = g.Key,
                    StudentCount = g.Count()
                })
                .AsNoTracking()
                .ToListAsync();
            
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(5))
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(15))
                .SetSize(1); // Relative size for cache management
            
            _cache.Set(cacheKey, statistics, cacheOptions);
            
            _logger.LogInformation("Cached {CacheKey} for 5 minutes", cacheKey);
        }
        
        return statistics;
    }
    
    // Cache course list
    public async Task<List<Course>> GetCoursesAsync()
    {
        return await _cache.GetOrCreateAsync(
            "CourseList",
            async entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromMinutes(2);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                entry.Size = 1;
                
                return await _context.Courses
                    .Include(c => c.Department)
                    .AsNoTracking()
                    .ToListAsync();
            });
    }
    
    // Invalidate cache when data changes
    public void InvalidateStatistics()
    {
        _cache.Remove("EnrollmentStatistics");
        _logger.LogInformation("Invalidated enrollment statistics cache");
    }
}

// Program.cs - Register caching services
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 100; // Relative size limit
    options.CompactionPercentage = 0.25; // Compact 25% when full
});
builder.Services.AddScoped<CachedDataService>();

// Usage in page handler
public class AboutModel : PageModel
{
    private readonly CachedDataService _cachedData;
    
    public AboutModel(CachedDataService cachedData)
    {
        _cachedData = cachedData;
    }
    
    public async Task OnGetAsync()
    {
        Students = await _cachedData.GetEnrollmentStatisticsAsync();
    }
}

// Invalidate cache on write
public async Task<IActionResult> OnPostAsync()
{
    _context.Students.Add(Student);
    await _context.SaveChangesAsync();
    
    // Invalidate related caches
    _cachedData.InvalidateStatistics();
    
    return RedirectToPage("./Index");
}
```

### Response Caching for Static Pages

```csharp
// Program.cs - Enable response caching
builder.Services.AddResponseCaching();

app.UseResponseCaching();
app.UseStaticFiles();

// Pages/About.cshtml.cs - Cache About page
[ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new string[] { })]
public class AboutModel : PageModel
{
    public async Task OnGetAsync()
    {
        // Cached for 5 minutes
    }
}

// Pages/Courses/Index.cshtml.cs - Cache course list
[ResponseCache(Duration = 120, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new string[] { })]
public class IndexModel : PageModel
{
    public async Task OnGetAsync()
    {
        // Cached for 2 minutes
    }
}
```

### Cache Recommendations by Entity

| Entity | Cache TTL | Invalidation Strategy | Rationale |
|--------|-----------|----------------------|-----------|
| **Students** | 1-2 min | On create/update/delete | Moderate change frequency |
| **Courses** | 5-10 min | On course modification | Low change frequency |
| **Departments** | 10-30 min | On department modification | Very low change frequency |
| **Enrollments** | No cache | N/A | High write frequency |
| **Statistics (About)** | 5-15 min | On student enrollment | Expensive aggregation |
| **Instructor Details** | 2-5 min | On instructor modification | Moderate complexity |

---

## Performance Tuning Checklist

### Pre-Migration Configuration

- [ ] **Enable WAL Mode**
  ```sql
  PRAGMA journal_mode = WAL;
  ```

- [ ] **Set Synchronous to NORMAL**
  ```sql
  PRAGMA synchronous = NORMAL;
  ```

- [ ] **Configure Cache Size (10 MB)**
  ```sql
  PRAGMA cache_size = -10000;
  ```

- [ ] **Enable Memory-Mapped I/O (256 MB)**
  ```sql
  PRAGMA mmap_size = 268435456;
  ```

- [ ] **Set Busy Timeout (5 seconds)**
  ```sql
  PRAGMA busy_timeout = 5000;
  ```

- [ ] **Enable Foreign Keys**
  ```sql
  PRAGMA foreign_keys = ON;
  ```

- [ ] **Set Temp Store to Memory**
  ```sql
  PRAGMA temp_store = MEMORY;
  ```

### Connection Configuration

- [ ] Use `Cache=Shared` in connection string
- [ ] Use `Foreign Keys=True` in connection string
- [ ] Configure EF Core with scoped lifetime (default)
- [ ] Implement retry logic for transient lock failures
- [ ] Validate pragma settings on application startup

### Query Optimization

- [ ] Add `.AsNoTracking()` for read-only queries
- [ ] Fix N+1 query problems (Instructor page - see Performance-Profile.md)
- [ ] Use `.Include()` for eager loading instead of lazy loading
- [ ] Consider `.AsSplitQuery()` for complex joins to avoid cartesian explosion
- [ ] Add appropriate indexes for search and sorting operations

### Write Optimization

- [ ] Use `AddRange()` for batch inserts instead of individual `Add()` calls
- [ ] Wrap bulk operations in explicit transactions
- [ ] Implement retry logic for "database is locked" errors
- [ ] Use batching for large data imports (500-1000 records per batch)
- [ ] Consider background queue for non-critical writes

### Caching Implementation

- [ ] Register `IMemoryCache` in dependency injection
- [ ] Cache expensive queries (statistics, aggregations)
- [ ] Implement cache invalidation on write operations
- [ ] Add response caching for static/semi-static pages
- [ ] Monitor cache hit ratios

### Monitoring Setup

- [ ] Log slow queries (> 100ms)
- [ ] Track database lock failures
- [ ] Monitor WAL file size
- [ ] Alert on checkpoint failures
- [ ] Track cache hit/miss ratios

---

## Benchmarking Plan

### Phase 1: Baseline Performance (Before Migration)

**Objective:** Establish SQL Server performance baseline for comparison

**Metrics to Capture:**
- Average query response time (p50, p95, p99)
- Database connection pool statistics
- Query execution times for critical pages
- Concurrent user capacity

**Tools:**
- k6 load testing (see Performance-Profile.md)
- Application Insights or EF Core logging
- SQL Server Profiler

**Duration:** 30-minute load test with typical traffic pattern

---

### Phase 2: SQLite Baseline (Default Configuration)

**Objective:** Measure SQLite performance with minimal configuration

**Configuration:**
```sql
PRAGMA journal_mode = DELETE;  -- Default mode
PRAGMA synchronous = FULL;     -- Default
-- No other optimizations
```

**Expected Results:**
- Lower throughput than SQL Server
- Reader/writer blocking issues
- Baseline for improvement measurement

**Duration:** 30-minute load test

---

### Phase 3: SQLite Optimized (WAL + Pragmas)

**Objective:** Measure performance with recommended configuration

**Configuration:**
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -10000;
PRAGMA mmap_size = 268435456;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;
```

**Expected Results:**
- 50-100% improvement over default SQLite
- Minimal reader/writer blocking
- Comparable or better than SQL Server for read-heavy workload

**Duration:** 30-minute load test

---

### Phase 4: SQLite + Caching

**Objective:** Measure performance with application-level caching

**Configuration:**
- Phase 3 pragmas
- IMemoryCache for statistics and frequently accessed data
- Response caching for semi-static pages

**Expected Results:**
- 80-95% reduction in database queries for cached data
- 2-5x improvement in cached endpoint response times
- Significantly higher concurrent user capacity

**Duration:** 30-minute load test

---

### Benchmark Test Script

```javascript
// k6-sqlite-benchmark.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const dbErrors = new Rate('db_errors');
const studentListDuration = new Trend('student_list_duration');
const instructorPageDuration = new Trend('instructor_page_duration');
const aboutPageDuration = new Trend('about_page_duration');

export const options = {
    stages: [
        { duration: '2m', target: 10 },   // Warm-up
        { duration: '5m', target: 50 },   // Ramp to normal load
        { duration: '20m', target: 50 },  // Sustained load
        { duration: '5m', target: 100 },  // Stress test
        { duration: '5m', target: 0 },    // Ramp down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
        'http_req_failed': ['rate<0.01'],
        'errors': ['rate<0.01'],
        'db_errors': ['rate<0.001'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
    // Test 1: Student list (high frequency)
    let res = http.get(`${BASE_URL}/Students`, { tags: { name: 'StudentList' } });
    studentListDuration.add(res.timings.duration);
    check(res, {
        'Student list 200': (r) => r.status === 200,
        'Student list fast': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
    
    if (res.body.includes('database is locked') || res.body.includes('SQLITE')) {
        dbErrors.add(1);
    }
    
    sleep(Math.random() * 3 + 2); // 2-5 seconds
    
    // Test 2: Student search
    res = http.get(`${BASE_URL}/Students?searchString=Alexander`);
    check(res, { 'Search 200': (r) => r.status === 200 }) || errorRate.add(1);
    sleep(Math.random() * 2 + 1);
    
    // Test 3: Instructor page (N+1 hotspot)
    res = http.get(`${BASE_URL}/Instructors`, { tags: { name: 'InstructorPage' } });
    instructorPageDuration.add(res.timings.duration);
    check(res, {
        'Instructors 200': (r) => r.status === 200,
        'Instructors under 2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);
    sleep(Math.random() * 5 + 5);
    
    // Test 4: About page (statistics, cacheable)
    res = http.get(`${BASE_URL}/About`, { tags: { name: 'AboutPage' } });
    aboutPageDuration.add(res.timings.duration);
    check(res, {
        'About 200': (r) => r.status === 200,
        'About fast': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
    sleep(Math.random() * 10 + 10);
    
    // Test 5: Write operation (10% of traffic)
    if (Math.random() < 0.1) {
        // Simulate form submission (GET form, POST data)
        res = http.get(`${BASE_URL}/Students/Create`);
        check(res, { 'Create form 200': (r) => r.status === 200 }) || errorRate.add(1);
        
        // Note: Actual POST would require CSRF token parsing
        // For benchmark, just measure GET performance
    }
}

export function handleSummary(data) {
    return {
        'benchmark-results.json': JSON.stringify(data),
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}
```

**Run Benchmarks:**
```bash
# Baseline (SQL Server)
BASE_URL=http://localhost:5000 k6 run --out json=baseline-sqlserver.json k6-sqlite-benchmark.js

# SQLite default
BASE_URL=http://localhost:5000 k6 run --out json=sqlite-default.json k6-sqlite-benchmark.js

# SQLite optimized
BASE_URL=http://localhost:5000 k6 run --out json=sqlite-optimized.json k6-sqlite-benchmark.js

# SQLite + caching
BASE_URL=http://localhost:5000 k6 run --out json=sqlite-cached.json k6-sqlite-benchmark.js
```

### Comparison Metrics

| Metric | SQL Server | SQLite Default | SQLite WAL | SQLite + Cache | Target |
|--------|-----------|----------------|------------|----------------|--------|
| Student List p95 | 250ms | 400ms | 200ms | 50ms | < 300ms |
| Instructor Page p95 | 800ms | 1500ms | 600ms | 400ms | < 1000ms |
| About Page p95 | 450ms | 600ms | 400ms | 50ms | < 500ms |
| Throughput | 100 req/s | 50 req/s | 120 req/s | 200 req/s | > 100 req/s |
| Error Rate | 0.1% | 2-5% | 0.2% | 0.1% | < 1% |
| Lock Errors | 0% | 5-10% | < 0.5% | < 0.1% | < 1% |

---

## Monitoring & Observability

### Key Metrics to Track

```csharp
// Services/SqliteMetricsService.cs
public class SqliteMetricsService
{
    private readonly SchoolContext _context;
    private readonly ILogger<SqliteMetricsService> _logger;
    
    public async Task<SqliteMetrics> GetMetricsAsync()
    {
        var metrics = new SqliteMetrics();
        
        // Journal mode
        metrics.JournalMode = await GetPragmaStringAsync("journal_mode");
        
        // Database size
        var pageSizeResult = await GetPragmaIntAsync("page_size");
        var pageCountResult = await GetPragmaIntAsync("page_count");
        metrics.DatabaseSizeBytes = pageSizeResult * pageCountResult;
        
        // WAL file size
        metrics.WalFileSize = await GetPragmaIntAsync("wal_checkpoint");
        
        // Cache statistics
        metrics.CacheHits = await GetPragmaIntAsync("cache_hit");
        metrics.CacheMisses = await GetPragmaIntAsync("cache_miss");
        metrics.CacheHitRatio = metrics.CacheHits / (double)(metrics.CacheHits + metrics.CacheMisses);
        
        return metrics;
    }
    
    private async Task<string> GetPragmaStringAsync(string pragma)
    {
        return await _context.Database
            .SqlQueryRaw<string>($"PRAGMA {pragma};")
            .AsEnumerable()
            .FirstOrDefaultAsync() ?? "unknown";
    }
    
    private async Task<long> GetPragmaIntAsync(string pragma)
    {
        var result = await _context.Database
            .SqlQueryRaw<int>($"PRAGMA {pragma};")
            .AsEnumerable()
            .FirstOrDefaultAsync();
        return result;
    }
}

public class SqliteMetrics
{
    public string JournalMode { get; set; }
    public long DatabaseSizeBytes { get; set; }
    public long WalFileSize { get; set; }
    public long CacheHits { get; set; }
    public long CacheMisses { get; set; }
    public double CacheHitRatio { get; set; }
}
```

### Health Check Endpoint

```csharp
// HealthChecks/SqliteHealthCheck.cs
public class SqliteHealthCheck : IHealthCheck
{
    private readonly SchoolContext _context;
    
    public SqliteHealthCheck(SchoolContext context)
    {
        _context = context;
    }
    
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Test database connectivity
            await _context.Database.ExecuteSqlRawAsync("SELECT 1;", cancellationToken);
            
            // Verify WAL mode
            var journalMode = await _context.Database
                .SqlQueryRaw<string>("PRAGMA journal_mode;")
                .AsEnumerable()
                .FirstOrDefaultAsync();
            
            if (journalMode != "wal")
            {
                return HealthCheckResult.Degraded(
                    $"SQLite not in WAL mode (current: {journalMode})");
            }
            
            // Check database size
            var pageSize = await _context.Database
                .SqlQueryRaw<int>("PRAGMA page_size;")
                .AsEnumerable()
                .FirstOrDefaultAsync();
            var pageCount = await _context.Database
                .SqlQueryRaw<int>("PRAGMA page_count;")
                .AsEnumerable()
                .FirstOrDefaultAsync();
            
            var dbSizeMB = (pageSize * pageCount) / (1024.0 * 1024.0);
            
            var data = new Dictionary<string, object>
            {
                { "journal_mode", journalMode },
                { "database_size_mb", dbSizeMB },
            };
            
            return HealthCheckResult.Healthy("SQLite database is healthy", data);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("SQLite database check failed", ex);
        }
    }
}

// Program.cs
builder.Services.AddHealthChecks()
    .AddCheck<SqliteHealthCheck>("sqlite", tags: new[] { "database", "sqlite" });

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                data = e.Value.Data
            })
        });
        await context.Response.WriteAsync(result);
    }
});
```

### Logging Slow Queries

```csharp
// Program.cs - Enable query logging
builder.Services.AddDbContext<SchoolContext>(options =>
{
    options.UseSqlite(connectionString)
           .LogTo(
               Console.WriteLine,
               new[] { DbLoggerCategory.Database.Command.Name },
               LogLevel.Information,
               DbContextLoggerOptions.DefaultWithUtcTime)
           .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
           .EnableDetailedErrors(builder.Environment.IsDevelopment());
});

// Custom logging for slow queries
public class SlowQueryLogger : IInterceptor
{
    private readonly ILogger<SlowQueryLogger> _logger;
    private const int SlowQueryThresholdMs = 100;
    
    public SlowQueryLogger(ILogger<SlowQueryLogger> logger)
    {
        _logger = logger;
    }
    
    public DbCommand CommandCreated(CommandEndEventData eventData, DbCommand result)
    {
        var duration = eventData.Duration.TotalMilliseconds;
        
        if (duration > SlowQueryThresholdMs)
        {
            _logger.LogWarning(
                "Slow query detected ({DurationMs}ms): {CommandText}",
                duration,
                eventData.Command.CommandText);
        }
        
        return result;
    }
}
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Database is Locked Errors

**Symptom:** `SqliteException: database is locked`

**Causes:**
- Multiple simultaneous write attempts
- Insufficient busy timeout
- Long-running transactions blocking writes

**Solutions:**
1. Enable WAL mode (eliminates most cases)
2. Increase busy timeout: `PRAGMA busy_timeout = 5000;`
3. Implement retry logic with exponential backoff
4. Keep transactions short
5. Batch writes instead of individual operations

---

### Pitfall 2: Foreign Keys Not Enforced

**Symptom:** Orphaned records, referential integrity violations

**Cause:** Foreign keys disabled by default in SQLite

**Solution:**
```sql
-- MUST be set on EVERY connection
PRAGMA foreign_keys = ON;
```

```csharp
// Include in connection string
"Data Source=db.sqlite;Foreign Keys=True"

// OR set on context initialization
context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
```

---

### Pitfall 3: Poor Performance with Default Settings

**Symptom:** Slow queries, low throughput

**Cause:** Using DELETE journal mode and default cache size

**Solution:** Apply all recommended pragmas (see checklist above)

---

### Pitfall 4: WAL File Growing Unbounded

**Symptom:** Database directory fills up with large -wal file

**Cause:** Automatic checkpointing not occurring

**Solution:**
```sql
-- Configure auto-checkpoint
PRAGMA wal_autocheckpoint = 1000;

-- Manual checkpoint (periodic background job)
PRAGMA wal_checkpoint(TRUNCATE);
```

```csharp
// Background service for periodic checkpointing
public class SqliteMaintenanceService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            
            using var scope = _services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
            
            // Checkpoint WAL
            await context.Database.ExecuteSqlRawAsync("PRAGMA wal_checkpoint(TRUNCATE);");
        }
    }
}
```

---

### Pitfall 5: Connection Pooling Causing Pragma Loss

**Symptom:** Pragmas not applied consistently

**Cause:** Connection pooling reuses connections without reapplying pragmas

**Solution:**
```csharp
// Apply pragmas on connection open event
public class SchoolContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlite(connectionString, options =>
        {
            options.CommandTimeout(30);
        });
        
        // Apply pragmas on every connection
        var connection = Database.GetDbConnection();
        connection.StateChange += (sender, args) =>
        {
            if (args.CurrentState == System.Data.ConnectionState.Open)
            {
                using var command = connection.CreateCommand();
                command.CommandText = @"
                    PRAGMA synchronous = NORMAL;
                    PRAGMA foreign_keys = ON;
                    PRAGMA temp_store = MEMORY;
                    PRAGMA busy_timeout = 5000;
                ";
                command.ExecuteNonQuery();
            }
        };
    }
}
```

---

### Pitfall 6: Using SQLite on Network Filesystem

**Symptom:** Corruption, locking errors, poor performance

**Cause:** SQLite requires local filesystem for locking mechanism

**Solution:**
❌ Never use SQLite on:
- Network drives (NFS, SMB/CIFS)
- Cloud-mounted filesystems (unless specifically supported)
- Distributed filesystems

✅ Use SQLite on:
- Local SSD/HDD
- Azure App Service local storage (`D:\home\data\`)
- Container volumes (local to container)

---

## Summary & Recommendations

### ✅ Recommended Configuration

```sql
-- Essential pragmas for ContosoUniversity
PRAGMA journal_mode = WAL;          -- Concurrency
PRAGMA synchronous = NORMAL;        -- Performance vs durability balance
PRAGMA cache_size = -10000;         -- 10 MB cache
PRAGMA mmap_size = 268435456;       -- 256 MB memory-mapped I/O
PRAGMA busy_timeout = 5000;         -- 5 second retry window
PRAGMA foreign_keys = ON;           -- Referential integrity
PRAGMA temp_store = MEMORY;         -- Fast temp operations
PRAGMA wal_autocheckpoint = 1000;   -- Auto-checkpoint every 1000 pages
```

### 🎯 Performance Targets

| Metric | Target | Validation Method |
|--------|--------|------------------|
| **Read Throughput** | > 5,000 queries/sec | k6 load test |
| **Write Throughput** | > 500 inserts/sec (batched) | Benchmark script |
| **Concurrent Readers** | Unlimited | No blocking with WAL |
| **p95 Response Time** | < 500ms | Load test + APM |
| **Database Lock Errors** | < 0.5% | Error rate monitoring |
| **Cache Hit Ratio** | > 80% for cached queries | IMemoryCache metrics |

### 📋 Implementation Checklist

**Phase 1: Configuration (Week 1)**
- [ ] Enable WAL mode
- [ ] Apply all recommended pragmas
- [ ] Configure connection string with `Cache=Shared`
- [ ] Implement pragma validation on startup

**Phase 2: Optimization (Week 2)**
- [ ] Fix N+1 query on Instructor page
- [ ] Add AsNoTracking() to read-only queries
- [ ] Implement batching for bulk writes
- [ ] Add retry logic for lock failures

**Phase 3: Caching (Week 3)**
- [ ] Implement IMemoryCache service
- [ ] Cache statistics and expensive queries
- [ ] Add response caching for static pages
- [ ] Implement cache invalidation

**Phase 4: Testing & Validation (Week 4)**
- [ ] Run baseline benchmarks
- [ ] Run optimized benchmarks
- [ ] Compare against SQL Server baseline
- [ ] Document performance improvements

### 📊 Expected Performance Improvement

| Scenario | Before (SQL Server) | After (SQLite + Optimizations) | Improvement |
|----------|-------------------|-------------------------------|-------------|
| Student List | 250ms p95 | 150ms p95 | 40% faster |
| Instructor Page | 800ms p95 | 400ms p95 | 50% faster |
| About Page (cached) | 450ms p95 | 50ms p95 | 90% faster |
| Write Operations | 100ms p95 | 80ms p95 | 20% faster |
| Concurrent Users | 100 users | 150+ users | 50% more capacity |

---

## References & Further Reading

### SQLite Documentation
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [SQLite Pragma Reference](https://www.sqlite.org/pragma.html)
- [SQLite Performance Tuning](https://www.sqlite.org/speed.html)
- [SQLite Concurrency](https://www.sqlite.org/lockingv3.html)

### EF Core with SQLite
- [Microsoft.EntityFrameworkCore.Sqlite Documentation](https://docs.microsoft.com/ef/core/providers/sqlite/)
- [EF Core Performance Best Practices](https://docs.microsoft.com/ef/core/performance/)
- [Connection Resiliency in EF Core](https://docs.microsoft.com/ef/core/miscellaneous/connection-resiliency)

### Related ContosoUniversity Documents
- [Performance-Profile.md](../../Performance-Profile.md) - Application performance analysis
- [Data-Model-Catalog.md](../../Data-Model-Catalog.md) - Database schema reference
- [Data-Migration-Runbook.md](../../Data-Migration-Runbook.md) - Migration procedures

---

**Document Status:** ✅ Ready for Review  
**Next Steps:**
1. Review and approve configuration recommendations
2. Implement Phase 1 (pragma configuration)
3. Run baseline benchmarks
4. Proceed with optimization phases

**Document Owner:** Database Migration Team  
**Last Updated:** 2025-12-30  
**Next Review:** After Phase 1 implementation
