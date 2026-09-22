'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Phone, KeyRound, Check, Sparkles } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useFlash } from '@/components/ui/FlashProvider';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: string;
    name: string;
    phoneNumber: string;
    isSuperAdmin: boolean;
  } | null;
  onSuccess: () => void;
}

export function EditStaffModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: EditStaffModalProps) {
  const flash = useFlash();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setPhoneNumber(staff.phoneNumber || '');
      setNewPassword('');
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

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
      await adminApi.updateStaff(staff.id, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        password: newPassword.trim() || null,
      });

      flash.success('تم تعديل بيانات عضو الإدارة بنجاح.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تعديل بيانات عضو الإدارة';
      flash.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0E1A2B] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-[#132238]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#C4A35A]/20 text-[#C4A35A] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#F2F6FA]">تعديل حساب الأدمن</h2>
              <p className="text-xs text-[#8B9CB0]">تعديل الاسم أو رقم الموبايل أو كلمة المرور</p>
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
              <Sparkles className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#C4A35A]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="admin-input pr-10"
                placeholder="اسم المسؤول"
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
