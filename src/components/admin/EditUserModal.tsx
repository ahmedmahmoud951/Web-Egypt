'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, AtSign, Mail, Shield, Ban, KeyRound, AlignLeft, Check } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useFlash } from '@/components/ui/FlashProvider';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    phoneNumber: string;
    username?: string | null;
    email?: string | null;
    bio?: string | null;
    role: string;
    isSuperAdmin: boolean;
    isBlocked: boolean;
    blockReason?: string | null;
  } | null;
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setRole(user.role || 'User');
      setIsBlocked(user.isBlocked || false);
      setBlockReason(user.blockReason || '');
      setNewPassword('');
    }
  }, [user]);

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
        isBlocked,
        blockReason: isBlocked ? (blockReason.trim() || 'تم الإيقاف بواسطة الإدارة') : null,
        password: newPassword.trim() || null,
      });

      flash.success('تم تعديل بيانات المستخدم بنجاح.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تعديل بيانات المستخدم';
      flash.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0E1A2B] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-[#132238]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#1F6B7A]/20 text-[#2AA9B9] flex items-center justify-center">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#F2F6FA]">تعديل المستخدم</h2>
              <p className="text-xs text-[#8B9CB0]">تعديل البيانات الأساسية والصلاحيات وكلمة المرور</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B9CB0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Name */}
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

          {/* Phone */}
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

          {/* Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="admin-input pr-10 min-h-[70px] resize-none"
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
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
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
          <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-glow btn-glow-ghost px-4 h-10 text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-glow btn-glow-primary px-5 h-10 text-xs font-bold"
            >
              <Check className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
