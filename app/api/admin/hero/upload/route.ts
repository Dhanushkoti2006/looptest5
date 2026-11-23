import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    // 1. Strict Administrator Authorization Check
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, message: 'Invalid content type. Multipart form data required.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file provided in upload.' },
        { status: 400 }
      );
    }

    // 2. Validate MIME type (strictly jpeg, png, webp; rejects svg)
    const mime = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed (SVG is prohibited).',
        },
        { status: 400 }
      );
    }

    // 3. Validate File Size (max 5MB before compression)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB uploaded).`,
        },
        { status: 400 }
      );
    }

    // 4. Server-side resize to maximum of 1600px width and convert to WebP
    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    const processedBuffer = await sharp(inputBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const randomId = crypto.randomUUID();
    const filename = `hero-${randomId}.webp`;

    // 5. Upload to Supabase Storage 'hero-images' bucket using Admin Client
    const adminSupabase = createAdminClient();

    // Ensure bucket exists
    try {
      await adminSupabase.storage.createBucket('hero-images', {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE_BYTES,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
    } catch (_) {}

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('hero-images')
      .upload(filename, processedBuffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError || !uploadData) {
      console.error('Hero image storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, message: uploadError?.message || 'Failed to upload hero image to storage.' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from('hero-images')
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      filename,
      size: processedBuffer.length,
    });
  } catch (error: any) {
    console.error('Hero image upload exception:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error processing hero image.' },
      { status: 500 }
    );
  }
}
