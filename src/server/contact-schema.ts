import { z } from 'zod';

export const needs = {
  web: 'Site ou application web',
  automation: 'Automatisation et intégrations',
  data: 'Données et tableau de bord',
  ai: 'Intelligence artificielle',
  discuss: 'Un besoin à préciser',
} as const;
export const budgets = {
  undecided: 'À déterminer ensemble',
  'under-3000': 'Moins de 3 000 €',
  '3000-7000': '3 000 à 7 000 €',
  '7000-15000': '7 000 à 15 000 €',
  'over-15000': 'Plus de 15 000 €',
} as const;
export const deadlines = {
  flexible: 'À définir / flexible',
  '1-month': 'D’ici un mois',
  '3-months': 'Dans les trois mois',
  later: 'Plus tard, je prépare le terrain',
} as const;

const line = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u001f\u007f]/.test(value),
      'Ce champ ne doit pas contenir de caractères de contrôle.',
    );

export const contactSchema = z
  .object({
    name: line(100).refine(
      (value) => value.length >= 2,
      'Indiquez votre nom (au moins 2 caractères).',
    ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .pipe(z.email('Indiquez une adresse email valide.')),
    company: line(150).optional().default(''),
    phone: line(40)
      .refine(
        (value) => !value || /^[+\d\s().-]{6,40}$/.test(value),
        'Vérifiez ce numéro de téléphone.',
      )
      .optional()
      .default(''),
    need: z.enum(Object.keys(needs) as [keyof typeof needs, ...(keyof typeof needs)[]], {
      error: 'Choisissez le type de besoin.',
    }),
    budget: z.enum(Object.keys(budgets) as [keyof typeof budgets, ...(keyof typeof budgets)[]], {
      error: 'Choisissez un budget indicatif.',
    }),
    deadline: z.enum(
      Object.keys(deadlines) as [keyof typeof deadlines, ...(keyof typeof deadlines)[]],
      { error: 'Choisissez une échéance.' },
    ),
    message: z
      .string()
      .trim()
      .min(20, 'Décrivez votre besoin en au moins 20 caractères.')
      .max(5000, 'Votre description doit rester sous 5 000 caractères.')
      .refine(
        (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
        'La description contient un caractère non accepté.',
      ),
    website: z.string().max(0, 'Soumission non acceptée.').optional().default(''),
    idempotencyKey: z.uuid('Rechargez la page avant de réessayer.'),
  })
  .strict();

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactData = Omit<ContactInput, 'website' | 'idempotencyKey'>;
