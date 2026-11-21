import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
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

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = adminSupabase.storage
            .from('product-images')
            .getPublicUrl(filename);

          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
          });
        }

        console.warn('Supabase storage upload returned error, falling back:', uploadError);
      } catch (storageErr) {
        console.warn('Supabase storage exception, falling back:', storageErr);
      }

      // 2. Fallback to data URL
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        dataUrl: base64Data,
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
