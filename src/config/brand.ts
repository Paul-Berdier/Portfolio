import { tagline } from '../brand/palette.mjs';
const optionalUrl = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.origin : undefined;
  } catch {
    return undefined;
  }
};

export const brand = {
  name: import.meta.env.PUBLIC_BRAND_NAME || 'MorphAI',
  tagline,
  owner: 'Paul Berdier',
  location: 'Toulouse · France à distance',
  description:
    'Sites et applications web, automatisation, data et intelligence artificielle. Des outils sur mesure, du besoin à la livraison, par Paul Berdier.',
  siteUrl: optionalUrl(import.meta.env.PUBLIC_SITE_URL),
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || '',
  bookingUrl: import.meta.env.PUBLIC_BOOKING_URL || '',
  githubUrl: import.meta.env.PUBLIC_GITHUB_URL || '',
  production: import.meta.env.PUBLIC_SITE_MODE === 'production',
  legalValidated: import.meta.env.PUBLIC_LEGAL_VALIDATED === 'true',
  retentionMonths: 12,
} as const;

export const navigation = [
  { href: '/services', label: 'Expertises' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/lab', label: 'Le lab' },
];
