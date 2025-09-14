// New Relic server-side logging utility
// This sends logs directly to New Relic Logs API from your Next.js API routes

interface LogEntry {
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp?: number;
  [key: string]: any;
}

class NewRelicLogger {
  private licenseKey: string | undefined;
  private apiUrl: string;

  constructor() {
    this.licenseKey = process.env.NEW_RELIC_LICENSE_KEY;
    // Use EU endpoint if license key starts with 'eu', otherwise US
    this.apiUrl = this.licenseKey?.startsWith('eu') 
      ? 'https://log-api.eu.newrelic.com/log/v1'
      : 'https://log-api.newrelic.com/log/v1';
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
      const payload = {
        timestamp: logEntry.timestamp || Date.now(),
        message: logEntry.message,
        level: logEntry.level,
        service: 'k9-alumni-website',
        environment: process.env.NODE_ENV || 'development',
        ...logEntry
      };

      await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': this.licenseKey,
        },
        body: JSON.stringify([payload]),
      });
    } catch (error) {
      // New Relic failed, but console log already happened above
      console.error('Failed to send log to New Relic:', error);
    }
  }

  info(message: string, meta?: any) {
    this.sendToNewRelic({ message, level: 'info', ...meta });
  }

  warn(message: string, meta?: any) {
    this.sendToNewRelic({ message, level: 'warn', ...meta });
  }

  error(message: string, error?: Error | any, meta?: any) {
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

  debug(message: string, meta?: any) {
    this.sendToNewRelic({ message, level: 'debug', ...meta });
  }
}

// Create singleton instance
export const logger = new NewRelicLogger();

// Helper function for API route logging
export function logApiRequest(req: any, additionalData?: any) {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    ...additionalData
  });
}

// Helper function for API errors
export function logApiError(req: any, error: Error | string, additionalData?: any) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = error instanceof Error ? error.stack : undefined;
  
  logger.error('API Error', error, {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    stack,
    ...additionalData
  });
}