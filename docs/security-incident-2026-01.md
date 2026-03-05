# Security Incident Report: Vulnerable Test Endpoint Exposure

**Date Range:** January 18, 2026 - March 5, 2026
**Severity:** High
**Status:** Resolved

## Executive Summary

A debug endpoint (`/api/test-supabase`) that had existed since the project's creation was discovered on January 18, 2026 to be publicly exposing resident data. The endpoint remained accessible on a frozen Vercel deployment URL (`k9-alumniwebsite.vercel.app`) even after being removed from the codebase. Despite multiple mitigation attempts over 6+ weeks, the endpoint continued to function until the root cause—an overly permissive Row Level Security (RLS) policy—was identified and removed on March 5, 2026.

## Timeline

### Discovery (January 18-31, 2026)

- **January 18, 2026**: Discovered debug endpoint `/api/test-supabase` publicly listing resident data (endpoint had existed since project creation)
- **January 18-31, 2026**: Vercel changed project URL from `k9-alumniwebsite.vercel.app` to `k9-alumni-website.vercel.app` (due to handling of `.` in project name)
- **January 31, 2026**:
  - Hotfix deployed to new URL, removing the vulnerable endpoint
  - Discovered old URL still accessible and frozen on vulnerable deployment
  - Reached out to Vercel requesting removal of old URL
  - Deployments from January 18 deleted from Vercel UI (old URL remained accessible)

### Escalation (February 2026)

- **February 27, 2026**: No response from Vercel; sent follow-up support message
- **February 27, 2026**: Contacted `security@vercel.com` per AI recommendation with detailed report
- **Outcome**: Hobby plan limitations prevented proper support ticket creation

### Investigation Phase (March 5, 2026)

#### Initial Hypothesis: Separate Projects
Theory: Vercel archived old project and created new one, allowing fix via environment variable rotation.

#### Mitigation Attempt #1: API Key Rotation
- **Action**: Rotated Supabase anon key (publishable key)
- **Result**: ❌ Current app broken, old endpoint still functional
- **Conclusion**: Old endpoint not using anon key

#### Mitigation Attempt #2: Delete All API Keys
- **Action**: Deleted all publishable and secret keys from Supabase
- **Result**: ❌ Both localhost and production broken, old endpoint still functional
- **Conclusion**: Old endpoint not using API keys at all

#### Mitigation Attempt #3: Database Password Rotation
- **Action**: Rotated PostgreSQL database password in Supabase
- **Result**: ❌ Old endpoint still functional
- **Conclusion**: Old endpoint not using direct database credentials

#### Breakthrough: Live Database Confirmation
- **Test 1**: Added new fake resident to database
  - Result: Not visible on old endpoint (endpoint had LIMIT 3 clause)
- **Test 2**: Edited existing resident profile (added "cami test" to Cedric's interests)
  - Result: ✅ Change immediately visible on old endpoint
  - **Conclusion**: Old endpoint IS connected to live database despite key/password changes

## Root Cause Analysis

### Discovery
SQL query revealed a critically permissive RLS policy on the `residents` table:

```sql
Policy Name: "Allow all operations on residents"
- Roles: {public}
- Permissions: ALL (SELECT, INSERT, UPDATE, DELETE)
- Condition: qual = true (no restrictions)
- Type: PERMISSIVE
```

### Explanation

**Row Level Security (RLS) with `public` Role:**
- The `public` role in PostgreSQL RLS means **unauthenticated access**
- When a policy grants `public` access, API key validation becomes optional
- The policy essentially made the residents table accessible without any authentication

**Why Previous Mitigations Failed:**
1. **API Key Rotation**: Unnecessary—policy allowed access without valid keys
2. **Delete All Keys**: Irrelevant—policy granted public access regardless
3. **Database Password**: Didn't affect Supabase API layer access

**Why It Worked:**
- Old endpoint made requests to Supabase API
- Even without valid API keys, requests were processed
- RLS policy: "public role can do ALL operations"
- Request succeeded with zero authentication

### Technical Details

The old endpoint returned only 3 residents due to a `LIMIT 3` clause in the original debug code. However, the underlying vulnerability exposed the entire residents table to anyone with knowledge of the endpoint URL.

**Endpoint Characteristics:**
- URL: `https://k9-alumniwebsite.vercel.app/api/test-supabase`
- Response Format: `{"success": true, "count": 3, "data": [...]}`
- Data Exposed: Resident names, locations, professions, interests, years in K9, descriptions, photos
- Access Level: Full read access to residents table (write access theoretically possible)

## Resolution

### Actions Taken (March 5, 2026)

1. **Removed Overly Permissive RLS Policy**
   ```sql
   DROP POLICY "Allow all operations on residents" ON residents;
   ```

2. **Removed All RLS Policies**
   - Decision: Site uses backend-only authentication via service role key
   - RLS policies provided no security benefit and only created vulnerabilities
   - Architecture relies on site-level password protection + backend API routes

3. **Verification**
   - Old endpoint now returns: `{"success": true, "count": 0, "data": []}`
   - Current production application continues to function normally
   - Backend access via `supabaseAdmin` (service role key) unaffected

### Current Security Model

```
User → Site Password (SITE_PASSWORD)
     → Next.js API Routes
     → Service Role Key (supabaseAdmin)
     → Database
```

**Security Layers:**
- ✅ Site-level password protection (shared password)
- ✅ Backend-only database access via service role key
- ✅ No client-side Supabase calls
- ✅ No RLS policies = no public access vectors
- ✅ Service role key bypasses RLS (expected for backend operations)

## Impact Assessment

### Exposure Window
- **Discovery to Resolution**: 46 days (January 18 - March 5, 2026)
- **Total Exposure**: Unknown - endpoint existed since project creation (before January 18, 2026)
- **Affected Data**: Resident profiles (names, locations, professions, interests, descriptions, photos)
- **Scope**: Limited to 3 residents in endpoint response, but full table was vulnerable
- **Access Method**: Required knowledge of specific endpoint URL

### Known Access
- No evidence of unauthorized access beyond testing during investigation
- Endpoint was debug-only and not linked from application UI
- URL was non-obvious: `/api/test-supabase`

## Lessons Learned

### What Went Wrong

1. **Debug Code in Production**: Test endpoint created during initial development and never removed
2. **Vercel URL Management**: Unexpected URL change created frozen deployment
3. **RLS Misunderstanding**: Overly permissive policies created during development, never tightened
4. **Limited Support Options**: Hobby plan limitations prevented timely Vercel support

### What Went Right

1. **Quick Detection**: Issue discovered and hotfix deployed to current URL within 2 weeks
2. **Persistent Investigation**: Continued troubleshooting despite multiple failed mitigation attempts
3. **Thorough Testing**: Systematic elimination of hypotheses led to root cause
4. **Clean Resolution**: Final fix addressed root cause without breaking current functionality

### Prevention Measures

**Immediate:**
- ✅ All RLS policies removed from production database
- ✅ Code review to ensure no other debug endpoints exist
- ✅ Verified all tables have appropriate security configuration

**Recommended:**
1. **Pre-deployment checklist**: Scan for debug/test endpoints before production deployment
2. **RLS policy review**: Audit all database policies for `public` role access
3. **Environment-specific endpoints**: Use environment variables to disable debug features in production
4. **Monitoring**: Set up alerts for unexpected API endpoint access patterns
5. **Documentation**: Document security model and RLS policy decisions

## Related Files

- Supabase configuration: `src/lib/supabase.ts`
- Environment variables: `.env.local`, `.env.local.example`

## Contact

For questions about this incident, contact the website administrator.

---

**Document Version**: 1.0
**Last Updated**: March 5, 2026
**Author**: Cami (with Claude Code assistance)
