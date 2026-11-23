import { getActiveCategories, getActiveProducts } from '@/lib/supabase/queries';
import ShopClient from '@/components/ShopClient';

export const revalidate = 60;

export const metadata = {
  title: 'Shop All Handcrafted Crochet | Loop & Love',
  description: 'Browse our collection of 100% milk cotton crochet bouquets, bags, accessories, and gifts lovingly crafted in India.',
};

export default async function ShopPage() {
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getActiveProducts({ limit: 48 }),
  ]);

  return <ShopClient initialCategories={categories} initialProducts={products} />;
}
