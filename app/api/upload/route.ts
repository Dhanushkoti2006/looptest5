import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

      // Try saving to public/uploads if filesystem is writable
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const ext =
        path.extname(file.name) ||
        (mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg');
      const filename = `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);
        return NextResponse.json({
          success: true,
          url: `/uploads/${filename}`,
          dataUrl: base64Data,
        });
      } catch (fsErr) {
        // Fallback to data URL on serverless environments
        return NextResponse.json({
          success: true,
          url: base64Data,
          dataUrl: base64Data,
        });
      }
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
    console.error('Upload API error:', error);
    return NextResponse.json({ success: false, message: 'Image upload failed' }, { status: 500 });
  }
}
