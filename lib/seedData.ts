import { Product, Category, Coupon, User } from './types';

export const INITIAL_HERO = {
  bannerImage: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1200&q=80',
  headline: 'Handmade with Love, Crafted to Last.',
  subtext: 'Explore our exclusive crochet collections.'
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-keychains',
    name: 'Keychains & Charms',
    slug: 'keychains-and-charms',
    description: 'Adorably tiny crochet accents to bring joy to your keys and handbags.',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    displayOrder: 1,
    productCount: 4,
  },
  {
    id: 'cat-toys',
    name: 'Toys',
    slug: 'toys',
    description: 'Lovingly stitched plush companions and soft amigurumi.',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    displayOrder: 2,
    productCount: 4,
  },
  {
    id: 'cat-bouquets',
    name: 'Flower Bouquets',
    slug: 'flower-bouquets',
    description: 'Everlasting handmade flower bouquets that never fade.',
    imageUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
    displayOrder: 3,
    productCount: 3,
  },
  {
    id: 'cat-bookmarks',
    name: 'Bookmarks',
    slug: 'bookmarks',
    description: 'Handcrafted crochet page markers for book lovers.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    displayOrder: 4,
    productCount: 2,
  },
  {
    id: 'cat-home-decor',
    name: 'Home Decor & Crochets',
    slug: 'home-decor-crochets',
    description: 'Cozy artisanal crochet accents, wall hangings, and decor.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    displayOrder: 5,
    productCount: 2,
  },
  {
    id: 'cat-accessories',
    name: 'Crochet Accessories',
    slug: 'crochet-accessories',
    description: 'Hair scrunchies, headbands, and floral fashion accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&w=800&q=80',
    displayOrder: 6,
    productCount: 2,
  },
  {
    id: 'cat-coasters',
    name: 'Coasters',
    slug: 'coasters',
    description: 'Artisanal absorbent crochet drink coasters and mug rugs.',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    displayOrder: 7,
    productCount: 2,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    "name": "batman",
    "slug": "batman",
    "description": "Handmade Batman crochet amigurumi superhero keychain. Stitched with durable dark charcoal and yellow milk cotton yarn, complete with bat cowl and sturdy metal key ring.",
    "price": 999,
    "discountPrice": 800,
    "category": "Keychains & Bag Charms",
    "categoryId": "cat-keychains",
    "images": [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8blEikMyOjaBH4MhGcGqPy-8ocKBBzOnAym9wFWCviq4OWT7IQLWsMJIb&s=10"
    ],
    "materials": "100% Milk Cotton Yarn, Fiberfill, Stainless Steel Keyring",
    "dimensions": "Height: 9 cm | Width: 6 cm",
    "stock": 8,
    "sku": "LL-PROD-8673",
    "prepTimeDays": 2,
    "careInstructions": "Spot clean only with a slightly damp cloth.",
    "tags": [
      "Batman",
      "Keychain",
      "Superhero",
      "Charm",
      "Handmade"
    ],
    "status": "AVAILABLE",
    "isFeatured": false,
    "isBestseller": true,
    "isNewArrival": true,
    "variants": [
      {
        "id": "v-batman-1",
        "productId": "prod-1794922878678-hq6n",
        "colorName": "Midnight Black & Yellow",
        "colorHex": "#111827",
        "sizeName": "Standard Charm (9 cm)",
        "priceModifier": 0,
        "stock": 8,
        "sku": "LL-BAT-01"
      }
    ],
    "averageRating": 5,
    "reviewCount": 0,
    "id": "prod-1794922878678-hq6n",
    "createdAt": "2026-11-17T13:41:18.678Z",
    "updatedAt": "2026-11-17T13:42:43.027Z"
  },
  {
    "id": "prod-custom-graduation-teddy",
    "name": "spiderman toy",
    "slug": "spiderman-toy",
    "description": "Handcrafted Spiderman superhero crochet plush amigurumi. Stitched with vibrant red and royal blue premium milk cotton yarn, featuring signature web pattern and embroidered expressive eyes.",
    "price": 2199,
    "discountPrice": 1899,
    "category": "Soft Toys & Amigurumi",
    "categoryId": "cat-toys",
    "images": [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLZuoNlBD8Vo2kI4JUZH_8fHTgq_hl56yFAhF9KpaULg&s"
    ],
    "materials": "100% Premium Milk Cotton Yarn, Polyester Fiberfill, Embroidered Felt Accents",
    "dimensions": "Height: 25 cm",
    "stock": 12,
    "sku": "LL-TOY-002",
    "prepTimeDays": 2,
    "careInstructions": "Spot clean with mild soapy water or gentle hand wash. Lay flat to dry.",
    "tags": [
      "Spiderman",
      "Superhero",
      "Amigurumi",
      "Marvel",
      "Handmade",
      "Plushie"
    ],
    "status": "AVAILABLE",
    "isFeatured": true,
    "isBestseller": false,
    "isNewArrival": true,
    "variants": [
      {
        "id": "v-spidey-1",
        "productId": "prod-custom-graduation-teddy",
        "colorName": "Classic Red & Blue",
        "colorHex": "#D32F2F",
        "sizeName": "Standard (25 cm)",
        "priceModifier": 0,
        "stock": 8,
        "sku": "LL-SPIDEY-01"
      },
      {
        "id": "v-spidey-2",
        "productId": "prod-custom-graduation-teddy",
        "colorName": "Symbiote Black Suit",
        "colorHex": "#1F2937",
        "sizeName": "Standard (25 cm)",
        "priceModifier": 100,
        "stock": 4,
        "sku": "LL-SPIDEY-BLK"
      }
    ],
    "averageRating": 5,
    "reviewCount": 17,
    "createdAt": "2026-10-28T10:00:00Z",
    "updatedAt": "2026-11-14T07:23:03.867Z"
  },
  {
    "id": "prod-silk-ribbon-crochet-scrunchie",
    "name": "Lilac Cloud Ruffle Crochet Hair Scrunchie",
    "slug": "lilac-cloud-ruffle-crochet-hair-scrunchie",
    "description": "Voluminous, snag-free crochet scrunchie crafted around a durable elastic band. Protects hair from friction and breakage while adding romantic elegance to any updo or wrist.",
    "price": 349,
    "discountPrice": 279,
    "category": "Crochet Accessories",
    "categoryId": "cat-accessories",
    "images": [
      "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80"
    ],
    "materials": "Ultra-soft mercerized cotton yarn, High-stretch seamless elastic core",
    "dimensions": "Outer Diameter: 13 cm",
    "stock": 22,
    "sku": "LL-ACC-001",
    "prepTimeDays": 1,
    "careInstructions": "Hand wash with shampoo or gentle soap, air dry.",
    "tags": [
      "Scrunchie",
      "Hair Accessories",
      "Lilac",
      "Self Care"
    ],
    "status": "AVAILABLE",
    "isFeatured": false,
    "isBestseller": false,
    "isNewArrival": true,
    "variants": [
      {
        "id": "v12",
        "productId": "prod-silk-ribbon-crochet-scrunchie",
        "colorName": "Lilac Mist",
        "colorHex": "#9D7BB0",
        "sizeName": "One Size",
        "priceModifier": 0,
        "stock": 12,
        "sku": "LL-ACC-001-LIL"
      },
      {
        "id": "v13",
        "productId": "prod-silk-ribbon-crochet-scrunchie",
        "colorName": "Buttercream Glow",
        "colorHex": "#FBF5E5",
        "sizeName": "One Size",
        "priceModifier": 0,
        "stock": 10,
        "sku": "LL-ACC-001-BUT"
      }
    ],
    "averageRating": 4.75,
    "reviewCount": 29,
    "createdAt": "2026-10-25T10:00:00Z",
    "updatedAt": "2026-11-12T10:00:00Z"
  },
  {
    "id": "prod-daisy-sunflower-pot",
    "name": "Sunflower boquet",
    "slug": "sunflower-boquet",
    "description": "Vibrant handcrafted crochet sunflower bouquet with cheery golden blossoms and sweet mini daisies. Wrapped in rustic kraft paper with a luxury satin bow that never wilts.",
    "price": 999,
    "discountPrice": 799,
    "category": "Crochet Flowers & Bouquets",
    "categoryId": "cat-flowers",
    "images": [
      "https://www.artsty.com/cdn/shop/files/rn-image_picker_lib_temp_8e481e6d-23cd-4e96-8d2d-930809c76a46.jpg?v=1694774090"
    ],
    "materials": "100% Hypoallergenic Milk Cotton Yarn, Floral Stems, Satin Ribbon, Kraft Wrap",
    "dimensions": "Height: 32 cm | Width: 20 cm",
    "stock": 15,
    "sku": "LL-FLW-002",
    "prepTimeDays": 1,
    "careInstructions": "Dust lightly with a soft brush or hair dryer on cool setting. Keep in a dry spot.",
    "tags": [
      "Sunflower",
      "Bouquet",
      "Flowers",
      "Everlasting",
      "Gifting",
      "Decor"
    ],
    "status": "AVAILABLE",
    "isFeatured": true,
    "isBestseller": false,
    "isNewArrival": true,
    "variants": [
      {
        "id": "v-sun-1",
        "productId": "prod-daisy-sunflower-pot",
        "colorName": "Sunny Golden Yellow",
        "colorHex": "#F59E0B",
        "sizeName": "Standard Bouquet (5 stems)",
        "priceModifier": 0,
        "stock": 10,
        "sku": "LL-SUN-STD"
      },
      {
        "id": "v-sun-2",
        "productId": "prod-daisy-sunflower-pot",
        "colorName": "Grand Sunburst (9 stems)",
        "colorHex": "#D97706",
        "sizeName": "Deluxe Bouquet (9 stems)",
        "priceModifier": 400,
        "stock": 5,
        "sku": "LL-SUN-DLX"
      }
    ],
    "averageRating": 4.8,
    "reviewCount": 19,
    "createdAt": "2026-10-20T10:00:00Z",
    "updatedAt": "2026-11-17T13:47:00.664Z"
  },
  {
    "id": "prod-cozy-granny-square-tote",
    "name": "Artisan Pastel Granny Square Shoulder Tote Bag",
    "slug": "artisan-pastel-granny-square-shoulder-tote-bag",
    "description": "Hand-stitched vintage-modern granny square shoulder bag in our signature palette of lilac, dusty rose, sage, and buttercream. Lined with sturdy natural canvas with an inner pocket for your phone and lip balm.",
    "price": 2499,
    "discountPrice": 2199,
    "category": "Crochet Bags & Totes",
    "categoryId": "cat-bags",
    "images": [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
    ],
    "materials": "High-density Milk Cotton Yarn, 100% Unbleached Cotton Canvas Lining, Reinforced Straps",
    "dimensions": "Width: 35 cm | Height: 33 cm | Strap Drop: 28 cm",
    "stock": 5,
    "sku": "LL-BAG-001",
    "prepTimeDays": 4,
    "careInstructions": "Hand wash gently in cool water. Reshape while damp and dry flat on a clean towel.",
    "tags": [
      "Bags",
      "Granny Square",
      "Boutique",
      "Trending",
      "Eco-friendly"
    ],
    "status": "AVAILABLE",
    "isFeatured": true,
    "isBestseller": true,
    "isNewArrival": true,
    "variants": [
      {
        "id": "v5",
        "productId": "prod-cozy-granny-square-tote",
        "colorName": "Lilac Bloom Harmony",
        "colorHex": "#9D7BB0",
        "sizeName": "Medium (Everyday)",
        "priceModifier": 0,
        "stock": 3,
        "sku": "LL-BAG-001-MED"
      },
      {
        "id": "v6",
        "productId": "prod-cozy-granny-square-tote",
        "colorName": "Rose & Warm Cream",
        "colorHex": "#C98B9E",
        "sizeName": "Large (Laptop friendly)",
        "priceModifier": 400,
        "stock": 2,
        "sku": "LL-BAG-001-LRG"
      }
    ],
    "averageRating": 5,
    "reviewCount": 42,
    "createdAt": "2026-10-18T10:00:00Z",
    "updatedAt": "2026-11-08T10:00:00Z"
  },
  {
    "id": "prod-lavender-tulip-bouquet",
    "name": "Everlasting Lavender & Buttercream Tulip Bouquet",
    "slug": "everlasting-lavender-buttercream-tulip-bouquet",
    "description": "An enchanting hand-tied bouquet featuring 5 blooming tulips, 2 stems of sweet lavender, and fragrant eucalyptus leaves. Wrapped in textured craft paper and tied with a luxury satin ribbon. Perfect for birthdays, anniversaries, graduations, or a cozy bedside display.",
    "price": 1899,
    "discountPrice": 1599,
    "category": "Crochet Flowers & Bouquets",
    "categoryId": "cat-flowers",
    "images": [
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80"
    ],
    "materials": "Premium 100% Milk Cotton Yarn, Floral wire stems, Satin ribbon, Kraft packaging",
    "dimensions": "Height: 38 cm | Width: 24 cm approx.",
    "stock": 12,
    "sku": "LL-FLW-001",
    "prepTimeDays": 2,
    "careInstructions": "Lightly dust with a soft makeup brush or blow on cool hairdryer setting. Keep away from direct dampness.",
    "tags": [
      "Bestseller",
      "Flowers",
      "Gifting",
      "Bouquet",
      "Lilac"
    ],
    "status": "AVAILABLE",
    "isFeatured": true,
    "isBestseller": true,
    "isNewArrival": false,
    "variants": [
      {
        "id": "v1",
        "productId": "prod-lavender-tulip-bouquet",
        "colorName": "Lilac & Buttercream",
        "colorHex": "#9D7BB0",
        "sizeName": "Standard (7 stems)",
        "priceModifier": 0,
        "stock": 8,
        "sku": "LL-FLW-001-LB-STD"
      },
      {
        "id": "v2",
        "productId": "prod-lavender-tulip-bouquet",
        "colorName": "Dusty Rose & Cream",
        "colorHex": "#C98B9E",
        "sizeName": "Standard (7 stems)",
        "priceModifier": 0,
        "stock": 4,
        "sku": "LL-FLW-001-DR-STD"
      },
      {
        "id": "v3",
        "productId": "prod-lavender-tulip-bouquet",
        "colorName": "Grand Deluxe (12 stems)",
        "colorHex": "#9D7BB0",
        "sizeName": "Deluxe",
        "priceModifier": 600,
        "stock": 3,
        "sku": "LL-FLW-001-DLX"
      }
    ],
    "averageRating": 4.9,
    "reviewCount": 38,
    "createdAt": "2026-10-15T10:00:00Z",
    "updatedAt": "2026-11-01T10:00:00Z"
  },
  {
    "id": "prod-strawberry-keychain-charm",
    "name": "Strawberry & Daisy Heart Amigurumi Bag Charm",
    "slug": "strawberry-daisy-heart-amigurumi-bag-charm",
    "description": "The sweetest little accessory for your tote or backpack! Includes a plump hand-crocheted strawberry with seeds, a petite daisy blossom, and a golden lobster clasp with heart bell.",
    "price": 399,
    "discountPrice": 349,
    "category": "Keychains & Bag Charms",
    "categoryId": "cat-keychains",
    "images": [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80"
    ],
    "materials": "Milk Cotton Yarn, Anti-tarnish brass gold lobster clip & swivel keyring",
    "dimensions": "Length: 11 cm total",
    "stock": 24,
    "sku": "LL-KEY-001",
    "prepTimeDays": 1,
    "careInstructions": "Wipe metal parts with dry cloth. Spot clean yarn when needed.",
    "tags": [
      "Keychain",
      "Strawberry",
      "Bag Charm",
      "Cute Gift"
    ],
    "status": "AVAILABLE",
    "isFeatured": false,
    "isBestseller": true,
    "isNewArrival": true,
    "variants": [
      {
        "id": "v9",
        "productId": "prod-strawberry-keychain-charm",
        "colorName": "Ruby Berry",
        "colorHex": "#C94B5E",
        "sizeName": "Standard",
        "priceModifier": 0,
        "stock": 14,
        "sku": "LL-KEY-001-RED"
      },
      {
        "id": "v10",
        "productId": "prod-strawberry-keychain-charm",
        "colorName": "Sweet Lilac Berry",
        "colorHex": "#9D7BB0",
        "sizeName": "Standard",
        "priceModifier": 0,
        "stock": 10,
        "sku": "LL-KEY-001-LAV"
      }
    ],
    "averageRating": 4.85,
    "reviewCount": 64,
    "createdAt": "2026-10-01T10:00:00Z",
    "updatedAt": "2026-11-10T10:00:00Z"
  },
  {
    "id": "prod-sleepy-bunny-amigurumi",
    "name": "Cuddle Bunny Amigurumi Soft Toy with Knit Overalls",
    "slug": "cuddle-bunny-amigurumi-soft-toy-with-knit-overalls",
    "description": "An endearing handmade floppy-eared bunny dressed in sweet removable pastel overalls. Crafted with safety embroidered eyes and super-soft baby-friendly cotton yarn.",
    "price": 1499,
    "discountPrice": 1299,
    "category": "Soft Toys & Amigurumi",
    "categoryId": "cat-toys",
    "images": [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80"
    ],
    "materials": "OEKO-TEX Certified Organic Cotton Yarn, Anti-microbial polyfill, Embroidered details (Baby safe)",
    "dimensions": "Height: 30 cm from tip of ears to toes",
    "stock": 9,
    "sku": "LL-TOY-001",
    "prepTimeDays": 3,
    "careInstructions": "Machine washable in a laundry mesh bag on delicate cycle or gentle hand wash. Air dry.",
    "tags": [
      "Amigurumi",
      "Bunny",
      "Baby Gift",
      "Nursery Decor"
    ],
    "status": "AVAILABLE",
    "isFeatured": true,
    "isBestseller": true,
    "isNewArrival": false,
    "variants": [
      {
        "id": "v7",
        "productId": "prod-sleepy-bunny-amigurumi",
        "colorName": "Lavender Overalls",
        "colorHex": "#9D7BB0",
        "sizeName": "30 cm",
        "priceModifier": 0,
        "stock": 5,
        "sku": "LL-TOY-001-LAV"
      },
      {
        "id": "v8",
        "productId": "prod-sleepy-bunny-amigurumi",
        "colorName": "Sage Green Overalls",
        "colorHex": "#8FA382",
        "sizeName": "30 cm",
        "priceModifier": 0,
        "stock": 4,
        "sku": "LL-TOY-001-SGE"
      }
    ],
    "averageRating": 4.95,
    "reviewCount": 51,
    "createdAt": "2026-09-30T10:00:00Z",
    "updatedAt": "2026-11-02T10:00:00Z"
  },
  {
    "id": "prod-blush-flower-coasters-set",
    "name": "Blooming Blossom Crochet Coasters (Set of 4)",
    "slug": "blooming-blossom-crochet-coasters-set-of-4",
    "description": "Protect your coffee table in aesthetic style. Set of 4 layered petal floral coasters accompanied by a handcrafted mini leaf organizer basket.",
    "price": 799,
    "discountPrice": 649,
    "category": "Home Decor & Coasters",
    "categoryId": "cat-home-decor",
    "images": [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
    ],
    "materials": "Thick absorbant 100% natural cotton cord and yarn",
    "dimensions": "Coaster diameter: 12 cm each",
    "stock": 0,
    "sku": "LL-DEC-001",
    "prepTimeDays": 2,
    "careInstructions": "Machine washable in cold gentle cycle. Lay flat to preserve floral shape.",
    "tags": [
      "Coasters",
      "Home Decor",
      "Tableware",
      "Floral"
    ],
    "status": "SOLD_OUT",
    "isFeatured": false,
    "isBestseller": false,
    "isNewArrival": false,
    "variants": [
      {
        "id": "v11",
        "productId": "prod-blush-flower-coasters-set",
        "colorName": "Pastel Garden Quartet",
        "colorHex": "#DCCCE8",
        "sizeName": "Set of 4",
        "priceModifier": 0,
        "stock": 0,
        "sku": "LL-DEC-001-S4"
      }
    ],
    "averageRating": 4.9,
    "reviewCount": 22,
    "createdAt": "2026-09-15T10:00:00Z",
    "updatedAt": "2026-11-09T10:00:00Z"
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'WELCOME10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 999,
    maxDiscount: 300,
    expiryDate: '2026-12-31T23:59:59Z',
    isActive: true,
    usageCount: 145,
  },
  {
    id: 'coup-2',
    code: 'LOVELOOP',
    discountType: 'FLAT',
    discountValue: 200,
    minOrderValue: 1499,
    expiryDate: '2026-12-31T23:59:59Z',
    isActive: true,
    usageCount: 88,
  },
  {
    id: 'coup-3',
    code: 'FESTIVE15',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderValue: 2499,
    maxDiscount: 600,
    expiryDate: '2026-12-31T23:59:59Z',
    isActive: true,
    usageCount: 52,
  },
];

export const INITIAL_ADMIN_USER: User = {
  id: 'usr-admin-1',
  name: 'Akash (Loop & Love Founder)',
  email: 'admin@loopandlove.com',
  phone: '+91 98765 43210',
  role: 'SUPER_ADMIN',
  isEmailVerified: true,
  isPhoneVerified: true,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

export const INITIAL_SAMPLE_CUSTOMER: User = {
  id: 'usr-cust-1',
  name: 'Priya Sharma',
  email: 'priya@example.com',
  phone: '+91 91234 56789',
  role: 'CUSTOMER',
  isEmailVerified: true,
  isPhoneVerified: true,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};
