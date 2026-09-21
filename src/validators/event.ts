import { z } from 'zod';

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: 'عنوان الحدث يجب ألا يقل عن 5 أحرف.' })
    .max(150, { message: 'عنوان الحدث يجب ألا يتجاوز 150 حرفًا.' }),
  description: z
    .string()
    .trim()
    .min(10, { message: 'وصف الحدث يجب ألا يقل عن 10 أحرف.' })
    .max(2000, { message: 'وصف الحدث يجب ألا يتجاوز 2000 حرف.' }),
  categoryId: z.number().int().positive({ message: 'يرجى اختيار تصنيف الحدث.' }),
  locationId: z.number().int().positive({ message: 'يرجى اختيار موقع الحدث.' }),
  imageUrl: z.string().nullable().optional(),
  mediaIds: z.array(z.string()).optional(),
});

export const reportEventSchema = z.object({
  reason: z.enum(
    ['FalseInformation', 'WrongLocation', 'OldEvent', 'Spam', 'Inappropriate', 'Other'] as const,
    {
      message: 'يرجى اختيار سبب الإبلاغ.',
    }
  ),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, { message: 'نص التعليق يجب ألا يقل عن حرفين.' })
    .max(1000, { message: 'نص التعليق يجب ألا يتجاوز 1000 حرف.' }),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
export type ReportEventFormValues = z.infer<typeof reportEventSchema>;
export type CreateCommentFormValues = z.infer<typeof createCommentSchema>;
