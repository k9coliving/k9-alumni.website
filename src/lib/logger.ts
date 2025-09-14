// New Relic server-side logging utility
// This sends logs directly to New Relic Logs API from your Next.js API routes

interface LogEntry {
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp?: number;
  [key: string]: unknown;
}

class NewRelicLogger {
  private licenseKey: string | undefined;
  private apiUrl: string;

  constructor() {
    this.licenseKey = process.env.NEW_RELIC_LICENSE_KEY;
    // TEMPORARY: Force US endpoint for testing
    this.apiUrl = 'https://log-api.newrelic.com/log/v1';
    // Use EU endpoint if license key starts with 'eu', otherwise US
    // this.apiUrl = this.licenseKey?.startsWith('eu')
    //   ? 'https://log-api.eu.newrelic.com/log/v1'
    //   : 'https://log-api.newrelic.com/log/v1';
  }


  private async sendToNewRelic(logEntry: LogEntry) {
    // Log to console with appropriate verbosity based on level
    if (logEntry.level === 'info') {
      // Succinct info logs - just the message
      console.log(`[INFO]`, logEntry.message);
    } else {
      // Detailed logs for warn/error with full context
      console.log(`[${logEntry.level.toUpperCase()}]`, logEntry.message, logEntry);
    }
    
    if (!this.licenseKey) {
      // If no license key, only console logging is available
      return;
    }

    try {
      const { message, level, timestamp, ...otherProps } = logEntry;
      const payload = {
        timestamp: timestamp || Date.now(),
        message,
        level,
        service: 'k9-alumni-website',
        environment: process.env.NODE_ENV || 'development',
        ...otherProps
      };

      console.log(`[DEBUG] Sending to New Relic endpoint: ${this.apiUrl}`);
      console.log(`[DEBUG] Environment: ${process.env.NODE_ENV}, License key starts with: ${this.licenseKey?.substring(0, 4)}...`);

      await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': this.licenseKey,
        },
        body: JSON.stringify([payload]),
      });

      console.log(`[DEBUG] Successfully sent log to New Relic`);
    } catch (error) {
      // New Relic failed, but console log already happened above
      console.error('Failed to send log to New Relic:', {
        endpoint: this.apiUrl,
        environment: process.env.NODE_ENV,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          cause: error.cause,
          stack: error.stack
        } : error
      });
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.sendToNewRelic({ message, level: 'info', ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.sendToNewRelic({ message, level: 'warn', ...meta });
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    const errorData = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
    } : { error };

    this.sendToNewRelic({ 
      message, 
      level: 'error', 
      ...errorData,
      ...meta 
    });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.sendToNewRelic({ message, level: 'debug', ...meta });
  }
}

// Create singleton instance
export const logger = new NewRelicLogger();

// Helper function for API route logging
export function logApiRequest(req: unknown, additionalData?: Record<string, unknown>) {
  const request = req as { method?: string; url?: string; headers?: { get?: (name: string) => string | null } | Record<string, string>; connection?: { remoteAddress?: string } };
  const headers = request.headers;

  let userAgent: string | null | undefined;
  let forwardedFor: string | null | undefined;

  if (headers && typeof headers === 'object' && 'get' in headers && typeof headers.get === 'function') {
    userAgent = headers.get('user-agent');
    forwardedFor = headers.get('x-forwarded-for');
  } else if (headers && typeof headers === 'object') {
    const headersRecord = headers as Record<string, string>;
    userAgent = headersRecord['user-agent'];
    forwardedFor = headersRecord['x-forwarded-for'];
  }

  logger.info('API Request', {
    method: request.method,
    url: request.url,
    userAgent,
    ip: forwardedFor || request.connection?.remoteAddress,
    ...additionalData
  });
}

// Helper function for API errors
export function logApiError(req: unknown, error: Error | string, additionalData?: Record<string, unknown>) {
  const stack = error instanceof Error ? error.stack : undefined;
  const request = req as { method?: string; url?: string; headers?: { get?: (name: string) => string | null } | Record<string, string>; connection?: { remoteAddress?: string } };
  const headers = request.headers;

  let userAgent: string | null | undefined;
  let forwardedFor: string | null | undefined;

  if (headers && typeof headers === 'object' && 'get' in headers && typeof headers.get === 'function') {
    userAgent = headers.get('user-agent');
    forwardedFor = headers.get('x-forwarded-for');
  } else if (headers && typeof headers === 'object') {
    const headersRecord = headers as Record<string, string>;
    userAgent = headersRecord['user-agent'];
    forwardedFor = headersRecord['x-forwarded-for'];
  }

  logger.error('API Error', error, {
    method: request.method,
    url: request.url,
    userAgent,
    ip: forwardedFor || request.connection?.remoteAddress,
    stack,
    ...additionalData
  });
}