import { z } from 'zod';
import { contactOptions, contactValidationCopy } from '../i18n/contact';
import type { Locale } from '../i18n';

export const { needs, budgets, deadlines } = contactOptions.fr;

export function createContactSchema(locale: Locale = 'fr') {
  const copy = contactValidationCopy[locale];
  const line = (max: number) =>
    z
      .string({ error: copy.text })
      .trim()
      .max(max, copy.maxLength(max))
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), copy.controlCharacters);

  return z.strictObject(
    {
      name: line(100).refine((value) => value.length >= 2, copy.name),
      email: z
        .string({ error: copy.email })
        .trim()
        .toLowerCase()
        .max(254, copy.maxLength(254))
        .pipe(z.email(copy.email)),
      company: line(150).optional().default(''),
      phone: line(40)
        .refine((value) => !value || /^[+\d\s().-]{6,40}$/.test(value), copy.phone)
        .optional()
        .default(''),
      need: z.enum(Object.keys(needs) as [keyof typeof needs, ...(keyof typeof needs)[]], {
        error: copy.need,
      }),
      budget: z.enum(Object.keys(budgets) as [keyof typeof budgets, ...(keyof typeof budgets)[]], {
        error: copy.budget,
      }),
      deadline: z.enum(
        Object.keys(deadlines) as [keyof typeof deadlines, ...(keyof typeof deadlines)[]],
        { error: copy.deadline },
      ),
      message: z
        .string({ error: copy.text })
        .trim()
        .min(20, copy.messageMin)
        .max(5000, copy.messageMax)
        .refine(
          (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
          copy.messageCharacters,
        ),
      website: z.string({ error: copy.rejected }).max(0, copy.rejected).optional().default(''),
      idempotencyKey: z.uuid(copy.reload),
    },
    { error: copy.fields },
  );
}

export const contactSchema = createContactSchema();
export type ContactInput = z.infer<typeof contactSchema>;
export type ContactData = Omit<ContactInput, 'website' | 'idempotencyKey'>;
