import { z } from 'zod';

export const normalizePhoneNumber = (val: string): string => {
  if (!val) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleaned = val
    .replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w).toString())
    .replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+20')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('20') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
};

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .transform(normalizePhoneNumber)
    .pipe(
      z.string().regex(/^01[0125][0-9]{8}$/, {
        message: 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)',
      })
    ),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, { message: 'رمز التحقق يجب أن يتكون من 6 أرقام.' })
    .regex(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط.' }),
  name: z.string().trim().max(100).optional(),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, { message: 'الاسم الأول يجب أن يتكون من حرفين على الأقل.' })
      .max(50, { message: 'الاسم الأول يجب ألا يتجاوز 50 حرفاً.' }),
    lastName: z
      .string()
      .trim()
      .min(2, { message: 'الاسم الثاني يجب أن يتكون من حرفين على الأقل.' })
      .max(50, { message: 'الاسم الثاني يجب ألا يتجاوز 50 حرفاً.' }),
    username: z
      .string()
      .trim()
      .min(3, { message: 'اسم المستخدم يجب ألا يقل عن 3 أحرف.' })
      .max(50, { message: 'اسم المستخدم يجب ألا يتجاوز 50 حرفاً.' })
      .regex(/^[a-zA-Z0-9._]+$/, {
        message: 'اسم المستخدم يجب أن يحتوي فقط على حروف وأرقام إنجليزية ونقطة أو شرطة سفلية.',
      }),
    email: z
      .string()
      .trim()
      .email({ message: 'يرجى إدخال بريد إلكتروني صالح.' })
      .max(100, { message: 'البريد الإلكتروني يجب ألا يتجاوز 100 حرف.' }),
    password: z
      .string()
      .min(6, { message: 'كلمة المرور يجب ألا تقل عن 6 خانات.' }),
    confirmPassword: z
      .string()
      .min(6, { message: 'تأكيد كلمة المرور مطلوب.' }),
    phoneNumber: z
      .string()
      .transform(normalizePhoneNumber)
      .pipe(
        z.string().regex(/^01[0125][0-9]{8}$/, {
          message: 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)',
        })
      ),
    otp: z
      .string()
      .trim()
      .length(6, { message: 'رمز التحقق يجب أن يتكون من 6 أرقام.' })
      .regex(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين.',
    path: ['confirmPassword'],
  });

export const loginWithPasswordSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: 'اسم المستخدم أو البريد الإلكتروني أو رقم الهاتف مطلوب.' }),
  password: z
    .string()
    .min(1, { message: 'كلمة المرور مطلوبة.' }),
});

export const forgotPasswordPhoneSchema = z.object({
  phoneNumber: z
    .string()
    .transform(normalizePhoneNumber)
    .pipe(
      z.string().regex(/^01[0125][0-9]{8}$/, {
        message: 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)',
      })
    ),
});

export const verifyResetOtpSchema = z.object({
  phoneNumber: z
    .string()
    .transform(normalizePhoneNumber)
    .pipe(
      z.string().regex(/^01[0125][0-9]{8}$/, {
        message: 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)',
      })
    ),
  otp: z
    .string()
    .trim()
    .length(6, { message: 'رمز التحقق يجب أن يتكون من 6 أرقام.' })
    .regex(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط.' }),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: 'كلمة المرور الجديدة يجب ألا تقل عن 6 خانات.' }),
    confirmPassword: z
      .string()
      .min(6, { message: 'تأكيد كلمة المرور مطلوب.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين.',
    path: ['confirmPassword'],
  });

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginWithPasswordFormValues = z.infer<typeof loginWithPasswordSchema>;
export type ForgotPasswordPhoneFormValues = z.infer<typeof forgotPasswordPhoneSchema>;
export type VerifyResetOtpFormValues = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
