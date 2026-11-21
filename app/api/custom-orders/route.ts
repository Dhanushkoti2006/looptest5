import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatCustomOrder(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    requestNumber: row.request_number,
    userId: row.user_id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    productType: row.product_type,
    description: row.description,
    referenceImages: row.reference_images || [],
    budgetRange: row.budget_range,
    status: row.status,
    adminNotes: row.admin_notes,
    quotationAmount: row.quotation_amount ? Number(row.quotation_amount) : null,
    quotation: row.quotation_amount
      ? {
          quoteAmount: Number(row.quotation_amount),
          breakdown: row.admin_notes || '',
          estimatedPrepDays: 7,
          validUntil: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Database snake_case fallbacks
    request_number: row.request_number,
    customer_name: row.customer_name,
    product_type: row.product_type,
    reference_images: row.reference_images || [],
    budget_range: row.budget_range,
    admin_notes: row.admin_notes,
    quotation_amount: row.quotation_amount,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    const adminSupabase = createAdminClient();

    if (id) {
      const { data: row, error } = await (adminSupabase.from('custom_requests') as any)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !row) {
        return NextResponse.json({ success: false, message: 'Custom order request not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, customOrder: formatCustomOrder(row) });
    }

    let query = (adminSupabase.from('custom_requests') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: rows, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to fetch custom orders' }, { status: 500 });
    }

    const formatted = (rows || []).map(formatCustomOrder);
    return NextResponse.json({ success: true, count: formatted.length, customOrders: formatted });
  } catch (error) {
    console.error('Custom orders GET exception:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch custom orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      customerName,
      email,
      phone,
      productType,
      description,
      budgetRange,
      referenceImages = [],
      additionalNotes,
    } = body;

    if (!customerName || !email || !productType || !description) {
      return NextResponse.json(
        { success: false, message: 'Customer name, email, product type, and description are required.' },
        { status: 400 }
      );
    }

    const requestNumber = `CR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const adminSupabase = createAdminClient();

    const fullDescription = additionalNotes
      ? `${description}\n\nAdditional Notes: ${additionalNotes}`
      : description;

    const { data: inserted, error } = await (adminSupabase.from('custom_requests') as any)
      .insert({
        request_number: requestNumber,
        user_id: userId || null,
        customer_name: customerName,
        email: email,
        phone: phone || '',
        product_type: productType,
        description: fullDescription,
        budget_range: budgetRange || 'Flexible',
        reference_images: Array.isArray(referenceImages) ? referenceImages : [],
        status: 'pending',
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error('Custom request insert error:', error);
      return NextResponse.json({ success: false, message: 'Failed to save custom request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Your custom crochet request has been submitted! Our artisan team will review it and send a custom quote.',
      customOrder: formatCustomOrder(inserted),
    });
  } catch (error) {
    console.error('Custom order POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit custom order request' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, quotation, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Request ID is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const updatePayload: Record<string, any> = {};

    if (status) {
      const lower = String(status).toLowerCase().replace(/_/g, ' ');
      if (lower.includes('quoted')) updatePayload.status = 'quoted';
      else if (lower.includes('accept')) updatePayload.status = 'accepted';
      else if (lower.includes('reject')) updatePayload.status = 'rejected';
      else if (lower.includes('production') || lower.includes('progress')) updatePayload.status = 'in_progress';
      else if (lower.includes('complet')) updatePayload.status = 'completed';
      else if (lower.includes('cancel')) updatePayload.status = 'cancelled';
      else updatePayload.status = 'pending';
    }

    if (quotation && quotation.quoteAmount) {
      updatePayload.quotation_amount = Number(quotation.quoteAmount);
      updatePayload.status = 'quoted';
    }

    if (adminNotes || (quotation && quotation.breakdown)) {
      updatePayload.admin_notes = adminNotes || quotation?.breakdown;
    }

    const { data: updated, error } = await (adminSupabase.from('custom_requests') as any)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ success: false, message: 'Custom order not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customOrder: formatCustomOrder(updated) });
  } catch (error) {
    console.error('Custom order PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update custom order' }, { status: 500 });
  }
}
