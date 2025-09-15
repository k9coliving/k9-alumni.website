import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';
import { logger, logApiRequest, logApiError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Log incoming request
  logApiRequest(request, {
    endpoint: 'upload-image',
    operation: 'upload'
  });

  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) {
    logger.warn('Image upload blocked - authentication failed', {
      endpoint: 'upload-image',
      method: request.method,
      duration: Date.now() - startTime
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    return authResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      logger.warn('Image upload validation failed - no file provided', {
        endpoint: 'upload-image',
        method: request.method,
        validationError: 'No file provided',
        duration: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Log file details (before validation)
    logger.info('Image upload attempt', {
      endpoint: 'upload-image',
      method: request.method,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileSizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      logger.warn('Image upload validation failed - invalid file type', {
        endpoint: 'upload-image',
        method: request.method,
        validationError: 'File must be an image',
        fileType: file.type,
        fileName: file.name,
        duration: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      logger.warn('Image upload validation failed - file too large', {
        endpoint: 'upload-image',
        method: request.method,
        validationError: 'File size must be less than 5MB',
        fileSize: file.size,
        fileSizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100,
        fileName: file.name,
        duration: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `profiles/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

    // Log image processing start
    const processingStartTime = Date.now();
    logger.info('Starting image processing', {
      endpoint: 'upload-image',
      method: request.method,
      fileName,
      originalName: file.name,
      fileExtension: fileExt
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const processingDuration = Date.now() - processingStartTime;

    // Log image processing performance
    logger.info('Image processing completed', {
      endpoint: 'upload-image',
      method: request.method,
      fileName,
      processingDuration,
      bufferSize: buffer.length
    });

    // Upload to Supabase storage using admin client (bypasses RLS)
    const uploadStartTime = Date.now();
    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      logger.error('Supabase storage upload failed', error, {
        endpoint: 'upload-image',
        method: request.method,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        uploadDuration: Date.now() - uploadStartTime,
        duration: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName);

    const uploadDuration = Date.now() - uploadStartTime;

    // Log successful image upload with enhanced metrics
    logger.info('Image upload completed successfully', {
      endpoint: 'upload-image',
      method: request.method,
      duration: Date.now() - startTime,
      fileName,
      originalName: file.name,
      fileSize: file.size,
      fileSizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100,
      fileType: file.type,
      fileExtension: fileExt,
      processingDuration,
      uploadDuration,
      publicUrl: urlData.publicUrl,
      storagePath: fileName
    });

    // Log successful image upload (existing audit log)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logAuditEvent({
      event_type: 'data_modified',
      ip_address: ip,
      user_agent: userAgent,
      details: {
        action: 'upload_image',
        file_name: fileName,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl
      }
    });

    // Add delay before response (per CLAUDE.md guidelines)
    await new Promise(resolve => setTimeout(resolve, 10));

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName
    });

  } catch (error) {
    // Enhanced error logging
    logApiError(request, error as Error, {
      endpoint: 'upload-image',
      operation: 'upload',
      duration: Date.now() - startTime
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}