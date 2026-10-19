// Single source of truth for every business detail. Replace each PLACEHOLDER before publishing.
// See PLACEHOLDERS.md for the full checklist.
export const SITE = {
  name: 'Drishti Geo', // PLACEHOLDER: provisional brand, check trademark + domain
  tagline: 'Geospatial intelligence from orbit to decision',
  description:
    'Remote sensing, GIS and GeoAI consultancy. We turn satellite imagery and spatial data into decision-ready information for public and private organisations.',
  url: 'https://drishtigeo.example', // PLACEHOLDER: production URL
  email: 'geodrishti47@gmail.com',
  emailSubject: 'Project enquiry',
  // Web3Forms access key. Empty string => form is not rendered (honest fallback).
  web3formsKey: import.meta.env.PUBLIC_WEB3FORMS_KEY ?? '',
  ogImage: '/og.png', // PLACEHOLDER: replace with a designed 1200x630 image
  social: [] as { label: string; href: string }[], // PLACEHOLDER: e.g. { label: 'LinkedIn', href: '...' }
  legalName: '', // PLACEHOLDER: registered entity name, shown in footer if set
  year: 2026,
} as const;

export const NAV = [
  { label: 'Services', href: '/services/' },
  { label: 'Applications', href: '/applications/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;
