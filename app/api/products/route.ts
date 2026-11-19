import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');

    let products = db.getProducts();

    if (category && category !== 'all') {
      products = products.filter(
        (p) =>
          p.categoryId === category ||
          p.category.toLowerCase().replace(/[^a-z0-9]/g, '-') === category
      );
    }

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (status) {
      products = products.filter((p) => p.status === status);
    }

    if (featured === 'true') {
      products = products.filter((p) => p.isFeatured);
    }

    if (minPrice) {
      products = products.filter((p) => (p.discountPrice || p.price) >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter((p) => (p.discountPrice || p.price) <= Number(maxPrice));
    }

    if (sort === 'price-low') {
      products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sort === 'price-high') {
      products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sort === 'popular') {
      products.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.averageRating - a.averageRating);
    } else {
      // Default: newest
      products.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return NextResponse.json({ success: true, count: products.length, products }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Products API GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve products' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.price || !(body.category || body.categoryId)) {
  return NextResponse.json(
    { success: false, message: 'Name, price and a category are required' },
    { status: 400 }
  );
}

// Resolve a concrete categoryId
let categoryId = body.categoryId;
if (!categoryId) {
  const cat = db.getCategories().find(c => c.name === body.category);
  categoryId = cat?.id ?? 'cat-uncategorized';
}


    const slug =
      body.slug && body.slug.trim().length > 0
        ? body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

    const newProduct = db.createProduct({
      name: body.name,
      slug,
      description: body.description || 'Artisan handmade crochet piece.',
      price: Number(body.price),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      category: body.category,
      categoryId: body.categoryId || 'cat-custom',
      images: body.images && body.images.length > 0
        ? body.images
        : ['https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80'],
      materials: body.materials || '100% Premium Milk Cotton Yarn',
      dimensions: body.dimensions || 'Handmade standard dimension',
      stock: Number(body.stock || 0),
      sku: body.sku || `LL-PROD-${Date.now().toString().slice(-4)}`,
      prepTimeDays: Number(body.prepTimeDays || 2),
      careInstructions: body.careInstructions || 'Gentle hand wash, dry flat.',
      tags: body.tags || ['Handmade', 'Boutique'],
      status: Number(body.stock || 0) <= 0 ? 'SOLD_OUT' : (body.status || 'AVAILABLE'),
      isFeatured: Boolean(body.isFeatured),
      isBestseller: Boolean(body.isBestseller),
      isNewArrival: Boolean(body.isNewArrival),
      variants: body.variants && body.variants.length > 0 ? body.variants : [
        {
          id: `v-${Date.now()}`,
          productId: '',
          colorName: 'Standard',
          colorHex: '#9D7BB0',
          sizeName: 'Standard',
          priceModifier: 0,
          stock: Number(body.stock || 0),
          sku: `LL-VAR-${Date.now().toString().slice(-4)}`,
        },
      ],
      highlights: body.highlights || [],
      customNotice: body.customNotice || '',
      averageRating: 5.0,
      reviewCount: 0,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Products API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    if (updates.slug && updates.slug.trim().length > 0) {
      updates.slug = updates.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    } else if (updates.name && (!updates.slug || updates.slug.trim().length === 0)) {
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.discountPrice !== undefined) updates.discountPrice = updates.discountPrice ? Number(updates.discountPrice) : undefined;
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.prepTimeDays !== undefined) updates.prepTimeDays = Number(updates.prepTimeDays);

    const updated = db.updateProduct(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Products API PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    db.deleteProduct(id);
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Products API DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}
