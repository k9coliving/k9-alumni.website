import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`newsletter-upload:${ip}`, RATE_LIMITS.uploadImage.limit, RATE_LIMITS.uploadImage.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.', retryAfter: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be smaller than 3 MB' }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // Re-encode through Sharp. This strips ALL metadata (incl. GPS/EXIF) since
    // we never call .withMetadata(). .rotate() first bakes in the EXIF
    // orientation so the stripped image isn't displayed sideways.
    // limitInputPixels stays at its default (~268 MP) to block decompression
    // bombs that a small byte size wouldn't catch.
    let outputBuffer: Buffer;
    try {
      outputBuffer = await sharp(inputBuffer).rotate().jpeg({ quality: 82 }).toBuffer();
    } catch {
      // Sharp throws on malformed / non-decodable image input.
      return NextResponse.json({ error: 'Could not process that image' }, { status: 400 });
    }

    const fileName = `newsletter/${Math.random().toString(36).substring(2)}_${Date.now()}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, outputBuffer, { contentType: 'image/jpeg', upsert: false });

    if (error) {
      logger.error('Newsletter image upload to storage failed', {
        endpoint: 'newsletter/upload-image',
        fileName,
        error: error.message,
      });
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from('images').getPublicUrl(fileName);

    logger.info('Newsletter image uploaded', {
      endpoint: 'newsletter/upload-image',
      fileName,
      originalSize: file.size,
      outputSize: outputBuffer.length,
    });

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    logger.error('Newsletter image upload failed', {
      endpoint: 'newsletter/upload-image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
