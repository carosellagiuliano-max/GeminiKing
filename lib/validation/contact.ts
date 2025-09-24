import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Bitte gib mindestens zwei Zeichen ein.')
    .max(120, 'Bitte kürzer fassen.'),
  email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse an.'),
  message: z
    .string()
    .trim()
    .min(10, 'Bitte schildere dein Anliegen mit mindestens 10 Zeichen.')
    .max(2000, 'Die Nachricht ist zu lang (max. 2000 Zeichen).'),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
