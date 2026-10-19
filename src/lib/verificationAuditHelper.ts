/**
 * Verification Document Audit Helper
 * يقوم بفحص المستندات والصور المرفوعة في طلبات توثيق الحسابات والصفحات وتحديد ما إذا كانت:
 * 1) بطاقة رقم قومي رسمية معتمدة وسليمة (وجه وظهر)
 * 2) هوية مسجلة ومستوردة من حساب منشئ الصفحة
 * 3) مستند قيد المعاينة والفحص اليدوي
 * 4) طلب يفتقر إلى مستندات الهوية
 */

export interface DocumentAuditResult {
  isDummy: boolean;
  isVerifiedId: boolean; // TRUE only if BOTH sides are uploaded and verified!
  hasBothSides: boolean;
  hasFrontOnly: boolean;
  statusLabel: string;
  reason: string;
  details?: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function auditVerificationDocument(request: any): DocumentAuditResult {
  if (!request) {
    return {
      isDummy: false,
      isVerifiedId: false,
      hasBothSides: false,
      hasFrontOnly: false,
      statusLabel: 'غير محدد',
      reason: '',
      badgeBg: 'bg-slate-800',
      badgeText: 'text-slate-300',
      badgeBorder: 'border-slate-700',
    };
  }

  // 1. فحص المستندات للتوثيق الفردي (User Verification)
  const docs: any[] = request.documents || [];
  const docsCount = Number(request.documentsCount ?? docs.length ?? 0);

  const isFront = (d: any) => {
    if (!d) return false;
    const typeId = Number(d.documentType);
    if (typeId === 1) return true;
    if ([2, 3, 4, 5, 6, 7, 8, 99].includes(typeId)) return false;

    const t = String(d.documentType ?? '').toLowerCase();
    const name = String(d.documentTypeName ?? '').toLowerCase();
    const notes = String(d.notes ?? '').toLowerCase();
    const fileName = String(d.fileName ?? '').toLowerCase();

    // Explicit exclusions for selfies, personal photos, passports, etc.
    if (
      t.includes('selfie') || name.includes('selfie') || name.includes('سيلفي') ||
      name.includes('شخصية') || notes.includes('شخصية') || fileName.includes('selfie') ||
      t.includes('passport') || name.includes('جواز') ||
      t.includes('press') || name.includes('صحافة') ||
      t.includes('commercial') || name.includes('سجل') ||
      t.includes('tax') || name.includes('ضريب') ||
      t.includes('other') || name.includes('مستند آخر') || name.includes('أخرى')
    ) {
      return false;
    }

    return (
      t === 'nationalidfront' ||
      t.includes('front') ||
      name.includes('front') ||
      name.includes('وجه') ||
      name.includes('وش') ||
      notes.includes('وجه') ||
      notes.includes('وش')
    );
  };

  const isBack = (d: any) => {
    if (!d) return false;
    const typeId = Number(d.documentType);
    if (typeId === 2) return true;
    if ([1, 3, 4, 5, 6, 7, 8, 99].includes(typeId)) return false;

    const t = String(d.documentType ?? '').toLowerCase();
    const name = String(d.documentTypeName ?? '').toLowerCase();
    const notes = String(d.notes ?? '').toLowerCase();
    const fileName = String(d.fileName ?? '').toLowerCase();

    // Explicit exclusions
    if (
      t.includes('selfie') || name.includes('selfie') || name.includes('سيلفي') ||
      name.includes('شخصية') || notes.includes('شخصية') || fileName.includes('selfie') ||
      t.includes('passport') || name.includes('جواز') ||
      t.includes('press') || name.includes('صحافة') ||
      t.includes('commercial') || name.includes('سجل') ||
      t.includes('tax') || name.includes('ضريب') ||
      t.includes('other') || name.includes('مستند آخر') || name.includes('أخرى')
    ) {
      return false;
    }

    return (
      t === 'nationalidback' ||
      t.includes('back') ||
      name.includes('back') ||
      name.includes('ظهر') ||
      name.includes('ضهر') ||
      notes.includes('ظهر') ||
      notes.includes('ضهر')
    );
  };

  const frontDoc = docs.find(isFront);
  const backDoc = docs.find(isBack);

  // 2. فحص المستندات لتوثيق الصفحات (Page Verification)
  const pageFrontUrl = request.nationalIdFrontUrl;
  const pageBackUrl = request.nationalIdBackUrl;
  const hasOwnerNationalIdOnFile = Boolean(request.hasOwnerNationalIdOnFile);

  // الرقم القومي المستخرج أو المسجل
  const rawNid = (
    request.extractedNationalId ||
    request.applicantNationalId ||
    request.ownerNationalId ||
    request.nationalId ||
    ''
  ).toString().trim();
  const isValid14Digits = /^\d{14}$/.test(rawNid);
  const hasNid = rawNid.length >= 10;

  // Case A: توفر وجه وظهر البطاقة معاً (مكتمل الوجهين)
  // يتحقق فقط إذا كان كلا وجهي البطاقة موجودين بالفعل
  const hasBothDocsUser = (frontDoc != null && backDoc != null) || (docs.length >= 2 && frontDoc != null && backDoc != null);
  const hasBothDocsPage = Boolean(pageFrontUrl && pageBackUrl);

  if (hasBothDocsUser || hasBothDocsPage) {
    if (!isValid14Digits && request.ocrConfidenceScore === 0) {
      return {
        isDummy: false,
        isVerifiedId: false,
        hasBothSides: true,
        hasFrontOnly: false,
        statusLabel: 'مستندات مرفقة قيد الفحص الإداري (لم يتم التأكد من أرقام البطاقة) ⚠️',
        reason: 'تم إرفاق وجهين للمستند، ولكن لم يتعرف الذكاء الاصطناعي على أرقام البطاقة الـ 14 بدقة كافية.',
        details: 'الوثائق بحاجة لمعاينة المشرف يدوياً للتحقق من صحتها.',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/40',
      };
    }

    return {
      isDummy: false,
      isVerifiedId: true,
      hasBothSides: true,
      hasFrontOnly: false,
      statusLabel: 'بطاقة رقم قومي رسمية مكتملة (وجه وظهر) ✓',
      reason: 'تم رفع وجه وظهر بطاقة الرقم القومي بنجاح والوثائق مكتملة للاعتماد.',
      details: hasNid ? `الرقم القومي: ${rawNid}` : 'الوثائق الثبوتية مكتملة (الوجهين).',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/40',
    };
  }

  // Case B: طلب صفحة مع بطاقة هوية مسجلة ومربوطة مسبقاً من حساب المالك المعتمد
  if (hasOwnerNationalIdOnFile) {
    return {
      isDummy: false,
      isVerifiedId: true,
      hasBothSides: true,
      hasFrontOnly: false,
      statusLabel: 'هوية منشئ الصفحة متوفرة ومربوطة رسمياً ✓',
      reason: 'تم ربط بيانات ومستندات الرقم القومي لمنشئ الصفحة تلقائياً من حسابه المعتمد.',
      details: `الرقم القومي لمنشئ الصفحة: ${rawNid || 'مسجل بالنظام'}`,
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/40',
    };
  }

  // Case C: رفع وجه واحد فقط لبطاقة الرقم القومي (وجه البطاقة فقط - ظهر البطاقة مفقود!)
  // يتحقق فقط إذا كان frontDoc أو pageFrontUrl متوفراً بالفعل مع رقم قومي صالح ومطابق!
  const hasFrontDoc = (frontDoc != null || Boolean(pageFrontUrl));
  const hasFrontOnly = hasFrontDoc && !backDoc && !pageBackUrl;
  if (hasFrontOnly) {
    // إذا كانت الصورة غير مؤكدة أو لم يتم استخراج رقم قومي صالح من البطاقة
    if (!isValid14Digits || request.ocrConfidenceScore === 0) {
      return {
        isDummy: false,
        isVerifiedId: false,
        hasBothSides: false,
        hasFrontOnly: false,
        statusLabel: 'صورة مرفقة قيد الفحص — لم يتم التأكد من أنها بطاقة رقم قومي ⚠️',
        reason: 'تم رفع صورة مرفقة، ولكن لم يتعرف النظام على أرقام أو ملامح بطاقة الرقم القومي المصري منها.',
        details: 'الصورة المرفوعة بحاجة لمعاينة إدارية يدوية للتحقق من هويتها.',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/40',
      };
    }

    return {
      isDummy: false,
      isVerifiedId: false, // ليس مكتملاً! لا نعطيه شارة verified
      hasBothSides: false,
      hasFrontOnly: true,
      statusLabel: 'وجه البطاقة مرفوع فقط — ظهر البطاقة غير مرفوع ⚠️',
      reason: 'تم رفع صورة وجه البطاقة فقط، ويجب إلزام العميل برفع ظهر البطاقة لاستكمال الاعتماد الرسمي.',
      details: hasNid ? `الرقم القومي: ${rawNid}` : 'يرجى مراجعة صورة الوجه والمطالبة بظهر البطاقة.',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/40',
    };
  }

  // Case D: مستندات أخرى متوفرة (صورة شخصية / سيلفي / سجل تجاري / جواز سفر) وليست بطاقة هوية
  const hasOtherDocs = docs.length > 0 || Boolean(request.commercialRegisterDocumentUrl) || Boolean(request.commercialRegister);
  if (hasOtherDocs) {
    const isSelfieOnly = docs.some(d => Number(d.documentType) === 8 || String(d.documentTypeName).includes('سيلفي') || String(d.documentTypeName).includes('شخصية') || String(d.documentType).toLowerCase().includes('selfie'));
    return {
      isDummy: false,
      isVerifiedId: false,
      hasBothSides: false,
      hasFrontOnly: false,
      statusLabel: isSelfieOnly
        ? 'مرفق صورة شخصية فقط — بطاقة الرقم القومي غير مرفقة ⚠️'
        : `مستندات بديلة مرفقة (${docsCount || docs.length}) — مطلوب بطاقة الرقم القومي ⚠️`,
      reason: isSelfieOnly
        ? 'المستخدم قام برفع صورة شخصية / سيلفي فقط ولم يقم برفع بطاقة الرقم القومي (الوجه والظهر).'
        : 'الوثائق المرفقة ليست بطاقة رقم قومي، ويجب مطالبة المستخدم برفع وجه وظهر البطاقة.',
      details: 'يرجى إرسال إشعار للمستخدم لإرفاق بطاقة الرقم القومي الرسمية.',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/40',
    };
  }

  // Case E: لا توجد أي مستندات أو روابط هوية إطلاقاً (لم يرفع بطاقة)
  return {
    isDummy: true,
    isVerifiedId: false,
    hasBothSides: false,
    hasFrontOnly: false,
    statusLabel: 'لم يتم إرفاق بطاقة هوية حتى الآن ❌',
    reason: 'لم يقم صاحب الطلب برفع صور بطاقة الرقم القومي أو مستند تحقيق الشخصية.',
    details: 'الطلب بانتظار قيام العميل برفع صور البطاقة من التطبيق.',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
  };
}
