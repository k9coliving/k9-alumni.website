# New Relic Server-Side Logging Setup

## Overview
This setup enables server-side log aggregation for your Next.js API routes on Vercel, sending logs directly to New Relic's Logs API.

## Setup Steps

### 1. Get Your New Relic License Key
1. Go to your New Relic account
2. Navigate to: **Account Settings** > **API Keys** 
3. Create or find a **License Key** (you may need an "Ingest - License" key for Logs API)
4. Copy the license key (should be 40 characters, format: `eu01xx...` or `us01xx...`)

**Important:** 
- The logger automatically detects your region based on license key prefix
- EU accounts (keys starting with 'eu') use `https://log-api.eu.newrelic.com/log/v1`
- US accounts use `https://log-api.newrelic.com/log/v1`
- Use an "Ingest - License" key for best compatibility

### 2. Add Environment Variable
Add this to your Vercel environment variables (and `.env.local` for local development):

```
NEW_RELIC_LICENSE_KEY=your_license_key_here
```

**In Vercel:**
1. Go to your project dashboard
2. Settings > Environment Variables
3. Add: `NEW_RELIC_LICENSE_KEY` = `your_license_key_here`
4. Redeploy your application

**Locally:**
Add to `.env.local`:
```
NEW_RELIC_LICENSE_KEY=your_license_key_here
```

### 3. Test the Setup

#### Test the example endpoint:
```bash
# Test GET request
curl http://localhost:3000/api/example-with-logging

# Test POST request  
curl -X POST http://localhost:3000/api/example-with-logging \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'

# Test POST request with missing field (to trigger warning log)
curl -X POST http://localhost:3000/api/example-with-logging \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Check Logs in New Relic
1. Go to New Relic dashboard
2. Navigate to **Logs** 
3. Search for: `service:"k9-alumni-website"`
4. You should see logs with different levels (info, warn, error)

### 5. Integration with Existing API Routes

To add logging to your existing API routes, import the logger:

```typescript
import { logger, logApiRequest, logApiError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Log incoming requests
  logApiRequest(request, { endpoint: 'your-endpoint-name' });
  
  try {
    // Your existing logic...
    
    // Log successful operations
    logger.info('Operation completed', { 
      endpoint: 'your-endpoint-name',
      details: 'any relevant data' 
    });
    
    return NextResponse.json(result);
  } catch (error) {
    // Log errors with context
    logApiError(request, error as Error, { 
      endpoint: 'your-endpoint-name',
      operation: 'what_was_being_done'
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## What Gets Logged

The logger automatically includes:
- **Timestamp**
- **Log Level** (info, warn, error, debug)
- **Service Name** ("k9-alumni-website")
- **Environment** (development/production)
- **Request Context** (method, URL, IP, user agent)
- **Custom Metadata** (whatever you pass in)

## Fallback Behavior

If the New Relic license key is missing or if New Relic is unavailable:
- Logs will fall back to `console.log()` 
- Your application will continue to work normally
- No errors will be thrown

## Files Created
- `src/lib/logger.ts` - Main logging utility
- `src/app/api/example-with-logging/route.ts` - Example implementation
- This setup guide

## Next Steps
Once verified working:
1. Integrate logging into your existing API routes
2. Remove the example API route
3. Add client-side browser monitoring (separate commit)