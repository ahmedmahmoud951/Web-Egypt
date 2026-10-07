'use client';

import { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  AtSign,
  Mail,
  Shield,
  Ban,
  KeyRound,
  AlignLeft,
  Check,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useFlash } from '@/components/ui/FlashProvider';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
  isActorSuperAdmin: boolean;
  onSuccess: () => void;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  isActorSuperAdmin,
  onSuccess,
}: EditUserModalProps) {
  const flash = useFlash();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('User');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Extended Profile Attributes
  const [gender, setGender] = useState<string>('');
  const [nationalId, setNationalId] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralsCount, setReferralsCount] = useState<number>(0);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setRole(user.role || 'User');
      setIsBlocked(user.isBlocked || false);
      setBlockReason(user.blockReason || '');
      setNewPassword('');

      // Initial assignment from list row
      setGender(user.gender || '');
      setNationalId(user.nationalId || '');
      setNeedsProfileCompletion(user.needsProfileCompletion ?? !user.gender);
      setReferralCode(user.referralCode || null);
      setReferralsCount(user.referralsCount || 0);

      // Fetch fresh complete user details
      setLoadingDetails(true);
      adminApi.getUserById(user.id)
        .then((fullUser) => {
          if (fullUser) {
            setName(fullUser.name || '');
            setPhoneNumber(fullUser.phoneNumber || '');
            setUsername(fullUser.username || '');
            setEmail(fullUser.email || '');
            setBio(fullUser.bio || '');
            setRole(fullUser.role || 'User');
            setIsBlocked(fullUser.isBlocked || false);
            setBlockReason(fullUser.blockReason || '');
            setGender(fullUser.gender || '');
            setNationalId(fullUser.nationalId || '');
            setNeedsProfileCompletion(fullUser.needsProfileCompletion ?? !fullUser.gender);
            setReferralCode(fullUser.referralCode || null);
            setReferralsCount(fullUser.referralsCount || 0);
          }
        })
        .catch(() => {
          // Fallback to existing list data
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      flash.error('الاسم مطلوب.');
      return;
    }
    if (!phoneNumber.trim()) {
      flash.error('رقم الهاتف مطلوب.');
      return;
    }
    if (nationalId.trim() && (nationalId.trim().length !== 14 || !/^\d+$/.test(nationalId.trim()))) {
      flash.error('الرقم القومي المصري يجب أن يتكون من 14 رقماً بالضبط.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      flash.error('كلمة المرور يجب ألا تقل عن 6 أحرف.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateUser(user.id, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        username: username.trim() || null,
        email: email.trim() || null,
        bio: bio.trim() || null,
        role: isActorSuperAdmin ? role : undefined,
        gender: gender || null,
        nationalId: nationalId.trim() || null,
        isBlocked,
        blockReason: isBlocked ? (blockReason.trim() || 'تم الإيقاف بواسطة الإدارة') : null,
        password: newPassword.trim() || null,
      });

      flash.success('تم حفظ وتحديث بيانات المستخدم والملف الشخصي بنجاح.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تعديل بيانات المستخدم';
      flash.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const isProfileComplete = !!gender && !!gender.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0E1A2B] border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#132238] to-slate-900">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <User className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#F2F6FA]">تعديل بيانات المستخدم</h2>
                {loadingDetails && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
              </div>
              <p className="text-xs text-[#8B9CB0]">
                الرقم القومي، النوع، الصلاحيات، وحالة استكمال الحساب
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8B9CB0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Profile Completion Status Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isProfileComplete
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {isProfileComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                )}
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {isProfileComplete
                      ? 'الملف الشخصي: مُكتمل البيانات'
                      : 'الملف الشخصي: لم يستكمل المستخدم بياناته بعد'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90 text-slate-300">
                    {isProfileComplete
                      ? `تم تحديد النوع: (${gender === 'Male' ? 'ذكر' : gender === 'Female' ? 'أنثى' : gender})${
                          nationalId ? '، والبطاقة القومية مسجلة بنجاح.' : ''
                        }`
                      : 'المستخدم لم يقم بتحديد النوع (ذكر/أنثى) في حسابه بعد. يظهر له تنبيه إجباري لاستكمال البيانات عند تسجيل الدخول أو فتح التطبيق.'}
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                  isProfileComplete
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isProfileComplete ? 'مكتمل ✓' : 'ناقص ⚠️'}
              </span>
            </div>
          </div>

          {/* Gender & National ID Section */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>البيانات الشخصية والهوية الرسمية</span>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-bold text-[#8B9CB0] mb-2">
                النوع (Gender) *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    gender === 'Male'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span className="text-base">👨</span>
                  <span>ذكر (Male)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    gender === 'Female'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/30'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span className="text-base">👩</span>
                  <span>أنثى (Female)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    !gender
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span>⚠️</span>
                  <span>غير محدد</span>
                </button>
              </div>
            </div>

            {/* National ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#8B9CB0]">
                  الرقم القومي المصري (14 رقماً)
                </label>
                {nationalId && nationalId.length === 14 && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    صيغة صحيحة (14 رقماً)
                  </span>
                )}
              </div>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500" />
                <input
                  type="text"
                  maxLength={14}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  className="admin-input pr-10 font-mono text-left tracking-wider"
                  placeholder="29901011234567"
                  dir="ltr"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                الرقم القومي يُستخدم في التحقق الآلي واستخراج تاريخ الميلاد والمحافظة.
              </p>
            </div>
          </div>

          {/* Referral & Growth Info */}
          {(referralCode || referralsCount > 0) && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs font-bold text-purple-200">
                    كود الإحالة الفيروسي: <span className="font-mono text-amber-300">{referralCode || 'غير منشأ'}</span>
                  </div>
                  <div className="text-[11px] text-purple-300/80">
                    عدد المستخدمين المسجلين عبر هذا الحساب: <span className="font-bold text-white">{referralsCount} مستخدم</span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 text-xs font-black border border-purple-500/30">
                {referralsCount} دعوة
              </span>
            </div>
          )}

          {/* Basic Info: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#8B9CB0] mb-1.5">الاسم *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="admin-input pr-10"
                  placeholder="اسم المستخدم"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8B9CB0] mb-1.5">رقم الموبايل *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="admin-input pr-10 font-mono text-left"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  required
                />
              </div>
            </div>
          </div>

          {/* Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#8B9CB0] mb-1.5">اسم المستخدم (Username)</label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="admin-input pr-10 font-mono text-left"
                  placeholder="username"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8B9CB0] mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-input pr-10 font-mono text-left"
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-[#8B9CB0] mb-1.5">النبذة التعريفية (Bio)</label>
            <div className="relative">
              <AlignLeft className="w-4 h-4 absolute right-3 top-3 text-[#1F6B7A]" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="admin-input pr-10 min-h-[60px] resize-none"
                placeholder="نبذة عن المستخدم..."
              />
            </div>
          </div>

          {/* Role (Super Admin only) */}
          {isActorSuperAdmin && !user.isSuperAdmin && (
            <div>
              <label className="block text-xs font-bold text-[#8B9CB0] mb-1.5">الدور في النظام</label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#C4A35A]" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="admin-input pr-10 appearance-none"
                >
                  <option value="User">مستخدم عادي (User)</option>
                  <option value="Admin">مدير (Admin)</option>
                </select>
              </div>
            </div>
          )}

          {/* Block status */}
          {!user.isSuperAdmin && (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBlocked}
                  onChange={(e) => setIsBlocked(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-[#DC2626] focus:ring-[#DC2626] bg-[#0E1A2B]"
                />
                <span className="text-sm font-bold text-[#F2F6FA] flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-[#DC2626]" />
                  إيقاف / حظر الحساب
                </span>
              </label>

              {isBlocked && (
                <div>
                  <label className="block text-xs font-semibold text-[#8B9CB0] mb-1">سبب الحظر</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="admin-input text-xs"
                    placeholder="سبب إيقاف الحساب..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Reset Password */}
          <div>
            <label className="block text-xs font-bold text-[#8B9CB0] mb-1.5">
              تعيين كلمة مرور جديدة <span className="font-normal text-[#8B9CB0]/70">(اختياري — اتركه فارغاً لعدم التغيير)</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="admin-input pr-10 font-mono text-left"
                placeholder="6 أحرف على الأقل..."
                dir="ltr"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-glow btn-glow-ghost px-5 h-10 text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-glow btn-glow-primary px-6 h-10 text-xs font-bold flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  حفظ وتحديث البيانات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
