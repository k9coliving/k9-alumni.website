# New Relic Logging Integration Plan for K9 Alumni Website

## Current State Analysis

### Existing API Endpoints:
1. **`/api/auth`** - Authentication (login/logout) ✅ **COMPLETED**
2. **`/api/auth/status`** - Auth status check ✅ **COMPLETED**
3. **`/api/residents`** - Alumni profile management
4. **`/api/newsletter-quotes`** - Newsletter quote retrieval
5. **`/api/tips-and-requests`** - Tips and hold-my-hair requests
6. **`/api/custom-events`** - Event creation and retrieval
7. **`/api/upload-image`** - Image upload functionality
8. **`/api/test-supabase`** - Database connectivity testing

### Current Logging Status:
- ✅ **New Relic logger is implemented** (`/lib/logger.ts`)
- ✅ **Some endpoints already have audit logging** (using `logAuditEvent`)
- ⚠️ **Inconsistent New Relic integration** across endpoints
- ❌ **No request/response logging** for most endpoints
- ❌ **Missing error context** in many catch blocks

## Recommended Logging Strategy

### Phase 1: Add Basic Request/Response Logging (Immediate)

For each endpoint, add:

```typescript
import { logger, logApiRequest, logApiError } from '@/lib/logger';

export async function GET/POST(request: NextRequest) {
  const startTime = Date.now();

  // Log incoming request
  logApiRequest(request, {
    endpoint: 'endpoint-name',
    operation: 'operation-type'
  });

  try {
    // ... existing logic ...

    // Log successful operation
    logger.info('Operation completed successfully', {
      endpoint: 'endpoint-name',
      method: request.method,
      duration: Date.now() - startTime,
      // ... relevant response data
    });

    // Add delay before response (per CLAUDE.md guidelines)
    await new Promise(resolve => setTimeout(resolve, 10));

    return NextResponse.json(result);
  } catch (error) {
    // Enhanced error logging
    logApiError(request, error as Error, {
      endpoint: 'endpoint-name',
      operation: 'operation-type',
      duration: Date.now() - startTime
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    return NextResponse.json({ error: 'Message' }, { status: 500 });
  }
}
```

### Phase 2: Endpoint-Specific Logging Requirements

#### **Authentication Endpoints** (`/api/auth/*`) ✅ **COMPLETED**
**Priority: High** - Security critical
- ✅ Already has audit logging for login attempts
- ✅ Added: Request/response logging with New Relic integration
- ✅ Added: Request timing and IP context for all operations
- ✅ Added: Comprehensive error logging with context
- ✅ Added: Session lifecycle events and rate limiting monitoring

#### **Residents API** (`/api/residents`)
**Priority: High** - Core functionality
- ✅ Already has audit logging for user creation
- ➕ Add: Search/filter operations, data validation failures
- ➕ Add: Profile update tracking, photo upload correlation

#### **Tips & Requests API** (`/api/tips-and-requests`)
**Priority: Medium** - User-generated content
- ✅ Already has audit logging for creation
- ➕ Add: Content moderation flags, search queries
- ➕ Add: Hold-my-hair vs regular tip metrics

#### **Custom Events API** (`/api/custom-events`)
**Priority: Medium** - Event management
- ✅ Already has audit logging for creation
- ➕ Add: Event validation failures, organizer tracking
- ➕ Add: Event popularity metrics

#### **Upload Image API** (`/api/upload-image`)
**Priority: Medium** - File handling
- ✅ Already has audit logging for uploads
- ➕ Add: File type/size validation details, storage metrics
- ➕ Add: Image processing performance

#### **Newsletter Quotes API** (`/api/newsletter-quotes`)
**Priority: Low** - Read-only data
- ❌ No logging currently
- ➕ Add: Query performance, fallback image usage

#### **Test/Status Endpoints**
**Priority: Low** - Infrastructure
- ❌ No logging currently
- ➕ Add: Health check results, database connectivity metrics

### Phase 3: Security Monitoring

#### **Enhanced Security Logging**
- Unusual access patterns
- Failed validation attempts
- Rate limiting triggers
- Suspicious file uploads

## Implementation Priority

1. **Week 1**: ✅ **COMPLETED** - Add basic request/response logging to auth endpoints
2. **Week 2**: Implement logging for residents and upload APIs
3. **Week 3**: Add logging to remaining endpoints
4. **Week 4**: Security monitoring enhancements

## Key Benefits

- **Operational Visibility**: Real-time monitoring of API health
- **Security Insights**: Enhanced threat detection and response
- **Compliance**: Comprehensive audit trail for user data operations

## Implementation Notes

- Follow the 10ms delay pattern established in CLAUDE.md for Vercel lambda logging
- Use existing `logAuditEvent` for security events, `logger` for operational events
- Include timing data for all operations to identify performance bottlenecks
- Ensure sensitive data (passwords, tokens) is never logged