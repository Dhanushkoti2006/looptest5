export const siteConfig = {
  name: 'Loop & Love',
  tagline: 'Handmade with Love, Crafted to Last.',
  description: 'Handmade everlasting crochet flower bouquets, keychains, plush amigurumi, and bespoke artisanal gifts.',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'loopandlove77@gmail.com',
  adminNotificationEmails: (
    process.env.ADMIN_NOTIFICATION_EMAILS ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    'loopandlove77@gmail.com'
  )
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean),
  emailSender: 'notifications@loopandlove.com', // Verified domain sender for transactional emails
  phone: '+91 98765 43210',
  instagram: 'https://www.instagram.com/loop__nd__love?utm_source=ig_web_button_share_sheet&jplx=ZDNlZDc0MzIxNw==',
  instagramHandle: '@loop__nd__love',
  location: 'Tamil Nadu, India',
};
