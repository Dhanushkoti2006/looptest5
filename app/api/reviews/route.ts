import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, message: 'productId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: reviews, error } = await (supabase.from('reviews') as any)
      .select(`
        id,
        product_id,
        user_id,
        rating,
        comment,
        is_verified_purchase,
        created_at,
        profiles (full_name)
      `)
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Reviews GET error:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch reviews' }, { status: 500 });
    }

    const formatted = (reviews || []).map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      userName: r.profiles?.full_name || 'Crochet Collector',
      rating: r.rating,
      comment: r.comment,
      isVerifiedPurchase: r.is_verified_purchase ?? true,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, count: formatted.length, reviews: formatted });
  } catch (error) {
    console.error('Reviews GET exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, userId, rating, comment } = body;

    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: 'productId, rating, and comment are required.' },
        { status: 400 }
      );
    }

    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const adminSupabase = createAdminClient();

    const { data: inserted, error } = await (adminSupabase.from('reviews') as any)
      .insert({
        product_id: productId,
        user_id: userId || null,
        rating: numRating,
        comment: comment.trim(),
        is_approved: true, // Visible immediately
        is_verified_purchase: true,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error('Review insert error:', error);
      return NextResponse.json({ success: false, message: 'Failed to save review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your review has been recorded.',
      review: {
        id: inserted.id,
        productId: inserted.product_id,
        userId: inserted.user_id,
        rating: inserted.rating,
        comment: inserted.comment,
        isVerifiedPurchase: inserted.is_verified_purchase,
        createdAt: inserted.created_at,
      },
    });
  } catch (error) {
    console.error('Review POST exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
