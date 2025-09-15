import { NextRequest, NextResponse } from 'next/server';
import { logger, logApiRequest, logApiError } from '@/lib/logger';

// Example API route showing how to integrate New Relic logging
export async function GET(request: NextRequest) {
  // Log the incoming request
  logApiRequest(request, { endpoint: 'example-with-logging' });

  try {
    // Your business logic here
    const data = { message: 'Hello from API with logging!' };
    
    // Log successful operations
    logger.info('API operation completed successfully', {
      endpoint: 'example-with-logging',
      method: 'GET',
      responseData: data
    });

    // Wait 500ms to allow logging to complete before lambda termination
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(data);
  } catch (error) {
    // Log errors automatically with context
    logApiError(request, error as Error, { 
      endpoint: 'example-with-logging',
      operation: 'get_data'
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  logApiRequest(request, { endpoint: 'example-with-logging' });

  try {
    const body = await request.json();
    
    // Log business logic events
    logger.info('Processing POST request', {
      endpoint: 'example-with-logging',
      bodyKeys: Object.keys(body)
    });

    // Simulate some processing
    if (!body.name) {
      logger.warn('Missing required field in POST request', {
        endpoint: 'example-with-logging',
        missingField: 'name',
        providedFields: Object.keys(body)
      });
      
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const result = { id: Date.now(), name: body.name, status: 'created' };
    
    logger.info('Resource created successfully', {
      endpoint: 'example-with-logging',
      resourceId: result.id,
      resourceName: result.name
    });

    // Wait 500ms to allow logging to complete before lambda termination
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logApiError(request, error as Error, {
      endpoint: 'example-with-logging',
      operation: 'create_resource'
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}