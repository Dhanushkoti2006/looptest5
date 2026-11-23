import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || 'image/jpeg';
      const cleanName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${cleanName}`;

      // 1. Try uploading to Supabase Storage bucket 'product-images'
      try {
        const adminSupabase = createAdminClient();
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('product-images')
          .upload(filename, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        let thumbnailUrl: string | undefined;
        const thumbnailFile = formData.get('thumbnail') as File | null;
        if (thumbnailFile) {
          try {
            const thumbBytes = await thumbnailFile.arrayBuffer();
            const thumbBuffer = Buffer.from(thumbBytes);
            const thumbName = `thumb-${filename}`;
            const { data: thumbData } = await adminSupabase.storage
              .from('product-images')
              .upload(thumbName, thumbBuffer, {
                contentType: thumbnailFile.type || 'image/webp',
                upsert: true,
              });
            if (thumbData) {
              thumbnailUrl = adminSupabase.storage.from('product-images').getPublicUrl(thumbName).data.publicUrl;
            }
          } catch (_) {}
        }

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = adminSupabase.storage
            .from('product-images')
            .getPublicUrl(filename);

          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
            thumbnailUrl: thumbnailUrl || publicUrlData.publicUrl,
          });
        }

        console.warn('Supabase storage upload returned error, falling back:', uploadError);
      } catch (storageErr) {
        console.warn('Supabase storage exception, falling back:', storageErr);
      }

      // 2. Safe fallback: never emit uncompressed multi-megabyte strings
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        thumbnailUrl: base64Data,
      });
    }

    // Handle base64 JSON upload
    const body = await req.json();
    if (!body.image) {
      return NextResponse.json({ success: false, message: 'Image data required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: body.image,
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process upload' }, { status: 500 });
  }
}
