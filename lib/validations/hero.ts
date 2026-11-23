import { z } from 'zod';

export const heroSlideSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Title cannot exceed 100 characters'),
    subtitle: z
      .string()
      .trim()
      .max(250, 'Subtitle cannot exceed 250 characters')
      .optional()
      .default(''),
    image_url: z.string().trim().optional(),
    image: z.string().trim().optional(),
    button_text: z.string().trim().max(50, 'Button text cannot exceed 50 characters').optional(),
    ctaText: z.string().trim().max(50, 'Button text cannot exceed 50 characters').optional(),
    button_link: z.string().trim().optional(),
    ctaLink: z.string().trim().optional(),
    badge: z.string().optional(),
    accentColor: z.string().optional(),
    sort_order: z.number().int().min(0).optional().default(0),
    is_active: z.boolean().optional().default(true),
  })
  .transform((data) => {
    const imageUrl = data.image_url || data.image || '';
    const buttonText = data.button_text || data.ctaText || 'Explore Collection';
    const buttonLink = data.button_link || data.ctaLink || '/shop';

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }
    if (!imageUrl.startsWith('/') && !imageUrl.startsWith('https://')) {
      throw new Error('Image URL must be an internal path starting with "/" or an https:// URL');
    }
    if (!buttonLink.startsWith('/') && !buttonLink.startsWith('https://')) {
      throw new Error('Button link must be an internal path starting with "/" or an https:// URL');
    }

    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle || '',
      image_url: imageUrl,
      button_text: buttonText,
      button_link: buttonLink,
      badge: data.badge || '✨ Artisanal Crochet Collection',
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    };
  });

export const heroSlidesBatchSchema = z
  .array(heroSlideSchema)
  .min(1, 'At least one slide is required in hero banner')
  .refine(
    (slides) => slides.filter((s) => s.is_active).length <= 6,
    { message: 'A maximum of 6 active slides is permitted' }
  );

export type HeroSlideInput = z.infer<typeof heroSlideSchema>;
