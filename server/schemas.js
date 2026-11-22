// Request body schemas. Every write route parses its body with one of these;
// a body that does not match is answered with 400 before any SQL runs.
import { z } from 'zod';

const text = (min, max) => z.string().trim().min(min).max(max);
const optionalText = (max) => z.string().trim().max(max).optional().nullable();

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

// At least 8 characters with upper case, lower case, a digit and a symbol.
export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export const schemas = {
  login: z.object({
    email: z.string().trim().min(1).max(254),
    password: z.string().min(1).max(128),
  }),

  register: z.object({
    name: text(2, 80),
    email: emailSchema,
    password: passwordSchema,
    phone: text(5, 20),
    department: text(2, 80),
    universityName: text(2, 120),
    homeDistrict: text(2, 60),
    currentResidence: text(2, 120),
    consent: z.literal(true).optional(),
  }),

  profile: z
    .object({
      name: text(2, 80).optional(),
      phone: z.string().trim().max(20).optional(),
      department: z.string().trim().max(80).optional(),
      showContact: z.boolean().optional(),
    })
    .refine((v) => Object.values(v).some((x) => x !== undefined), { error: 'No supported profile fields were provided' }),

  changePassword: z.object({
    oldPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
  }),

  notice: z.object({
    title: text(3, 140),
    description: text(1, 4000),
    category: z.enum(['general', 'academic', 'event', 'urgent']),
  }),

  complaint: z.object({
    title: text(3, 120),
    description: text(1, 2000),
    category: z.enum(['hall', 'dining', 'lab', 'academic', 'administration']),
    anonymous: z.boolean().optional().default(false),
  }),

  facultySuggestion: z.object({
    title: text(3, 120),
    faculty_name: text(2, 80),
    subject: optionalText(80),
    rating: z.coerce.number().int().min(1).max(5),
    feedback: text(1, 2000),
    anonymous: z.boolean().optional().default(false),
  }),

  marketplace: z.object({
    title: text(2, 100),
    description: text(1, 1500),
    price: z.coerce.number().finite().min(0).max(10_000_000),
    category: optionalText(40),
    phone: optionalText(20),
  }),

  lostFound: z.object({
    title: text(2, 100),
    description: text(1, 1500),
    item_type: z.enum(['lost', 'found']),
    location: text(1, 120),
    contact_number: optionalText(20),
  }),

  bicycle: z.object({
    brand: text(1, 60),
    color: optionalText(40),
    location: optionalText(120),
    contact_number: optionalText(20),
    description: optionalText(1000),
  }),

  bloodDonor: z.object({
    blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    contact_number: text(5, 20),
    location: text(1, 120),
    available_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    // The donor agreed to show their blood group and phone number on campus.
    consent: z.literal(true, { error: 'Agree to share your details before listing yourself' }),
  }),

  animalReport: z.object({
    title: text(2, 120),
    description: text(1, 1500),
    location: text(1, 120),
    urgency: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  }),

  lendingItem: z.object({
    title: text(1, 100),
    description: text(1, 1200),
    category: text(1, 40),
    itemCondition: text(1, 40),
    handoffLocation: text(1, 120),
  }),

  borrowRequest: z.object({
    message: z.string().trim().max(500).optional().nullable(),
  }),

  lendingAction: z.object({
    action: z.enum(['approve', 'decline', 'return']),
  }),

  page: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    before: z.iso.datetime({ offset: true }).optional(),
  }),

  directoryQuery: z.object({
    q: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).max(100_000).optional(),
  }),
};
