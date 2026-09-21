import { z } from 'zod';

export const suggestLocationSchema = z.object({
  nameAr: z
    .string()
    .trim()
    .min(2, { message: 'اسم المكان باللغة العربية يجب ألا يقل عن حرفين.' })
    .max(100, { message: 'اسم المكان يجب ألا يتجاوز 100 حرف.' }),
  nameEn: z.string().trim().max(100).optional(),
  type: z.enum(['Governorate', 'City', 'Center', 'Village', 'Area'] as const, {
    message: 'يرجى اختيار نوع المكان.',
  }),
  parentId: z.number().int().positive().optional(),
});

export type SuggestLocationFormValues = z.infer<typeof suggestLocationSchema>;
