import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Canonical image uploader: accepts an image, strips ALL metadata (EXIF/GPS) by
// re-encoding to JPEG, and stores it in Supabase. Public + rate-limited. The
// JPEG re-encode is lossy and flattens transparency, which is fine for the photo
// use cases we have today; revisit if a transparent-PNG use case ever needs it.
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — kept consistent with /api/upload-image

// TODO: when DB images (profiles etc.) move onto this endpoint, make the storage
// prefix a request parameter instead of hardcoding `newsletter/`.
const STORAGE_PREFIX = 'newsletter';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`image-upload:${ip}`, RATE_LIMITS.uploadImage.limit, RATE_LIMITS.uploadImage.windowMs);
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
      return NextResponse.json({ error: 'Image must be smaller than 5 MB' }, { status: 400 });
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

    const fileName = `${STORAGE_PREFIX}/${Math.random().toString(36).substring(2)}_${Date.now()}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, outputBuffer, { contentType: 'image/jpeg', upsert: false });

    if (error) {
      logger.error('Image upload to storage failed', {
        endpoint: 'images/upload',
        fileName,
        error: error.message,
      });
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from('images').getPublicUrl(fileName);

    logger.info('Image uploaded', {
      endpoint: 'images/upload',
      fileName,
      originalSize: file.size,
      outputSize: outputBuffer.length,
    });

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    logger.error('Image upload failed', {
      endpoint: 'images/upload',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
