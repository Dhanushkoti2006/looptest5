import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export interface SiteAnnouncement {
  id: string;
  text: string;
  secondary_text?: string;
  link_text?: string;
  link_url?: string;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  updated_at?: string;
}

const DEFAULT_ANNOUNCEMENT: SiteAnnouncement = {
  id: 'default',
  text: '🌸 Free Handcrafted Gift Box on orders above ₹999 • All India Express Delivery',
  secondary_text: '✨ 100% Milk Cotton',
  link_text: 'Request Custom Crochet',
  link_url: '/custom-orders',
  bg_color: '#2E1D36',
  text_color: '#FBF5E5',
  is_active: true,
};

function getLocalAnnouncement(): SiteAnnouncement {
  try {
    const filePath = path.join(process.cwd(), 'data', 'announcement.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return { ...DEFAULT_ANNOUNCEMENT, ...JSON.parse(raw) };
    }
  } catch (_) {}
  return DEFAULT_ANNOUNCEMENT;
}

function saveLocalAnnouncement(announcement: SiteAnnouncement) {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'announcement.json'), JSON.stringify(announcement, null, 2), 'utf8');
  } catch (_) {}
}

export async function GET() {
  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const { data, error } = await (supabase as any)
      .from('site_announcements')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      const fallback = getLocalAnnouncement();
      return NextResponse.json(
        { success: true, announcement: fallback },
        { headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        announcement: {
          id: data.id || 'default',
          text: data.text || DEFAULT_ANNOUNCEMENT.text,
          secondary_text: data.secondary_text ?? DEFAULT_ANNOUNCEMENT.secondary_text,
          link_text: data.link_text ?? DEFAULT_ANNOUNCEMENT.link_text,
          link_url: data.link_url ?? DEFAULT_ANNOUNCEMENT.link_url,
          bg_color: data.bg_color || DEFAULT_ANNOUNCEMENT.bg_color,
          text_color: data.text_color || DEFAULT_ANNOUNCEMENT.text_color,
          is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
          updated_at: data.updated_at,
        },
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('Failed to query site announcement:', err);
    return NextResponse.json(
      { success: true, announcement: getLocalAnnouncement() },
      { headers: noCacheHeaders }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();

    const text = (body.text || '').trim();
    if (!text) {
      return NextResponse.json(
        { success: false, message: 'Announcement text cannot be empty.' },
        { status: 400 }
      );
    }

    if (text.length > 250) {
      return NextResponse.json(
        { success: false, message: 'Announcement text cannot exceed 250 characters.' },
        { status: 400 }
      );
    }

    const secondaryText = (body.secondary_text || '').trim();
    const linkText = (body.link_text || '').trim();
    let linkUrl = (body.link_url || '').trim();

    if (linkUrl && !linkUrl.startsWith('/') && !linkUrl.startsWith('https://')) {
      linkUrl = '/' + linkUrl;
    }

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const bgColor = hexRegex.test(body.bg_color) ? body.bg_color : '#2E1D36';
    const textColor = hexRegex.test(body.text_color) ? body.text_color : '#FBF5E5';
    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;

    const payload: SiteAnnouncement = {
      id: 'default',
      text,
      secondary_text: secondaryText,
      link_text: linkText,
      link_url: linkUrl,
      bg_color: bgColor,
      text_color: textColor,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    // Always persist to local file as resilient store
    saveLocalAnnouncement(payload);

    // Also persist to Supabase site_announcements table
    try {
      const supabase = createAdminClient();
      await (supabase as any)
        .from('site_announcements')
        .upsert(payload, { onConflict: 'id' });
    } catch (_) {}

    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch (_) {}

    return NextResponse.json({
      success: true,
      announcement: payload,
      message: 'Top announcement bar updated successfully!',
    });
  } catch (error) {
    console.error('Announcement PUT exception:', error);
    return NextResponse.json(
      { success: false, message: 'Server error saving announcement.' },
      { status: 500 }
    );
  }
}
