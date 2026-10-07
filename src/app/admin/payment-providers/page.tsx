'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { financialAdminApi } from '@/api/financialAdmin';
import { PaymentProviderStatusDto, PaymentReceivingAccountDto, FinancialFeeConfigDto } from '@/types/financial';

export default function AdminPaymentProvidersPage() {
  const [providers, setProviders] = useState<PaymentProviderStatusDto[]>([]);
  const [accounts, setAccounts] = useState<PaymentReceivingAccountDto[]>([]);
  const [fees, setFees] = useState<FinancialFeeConfigDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Account Modal
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentReceivingAccountDto | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('InstaPay');
  const [bankName, setBankName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [iban, setIban] = useState('');
  const [instaPayId, setInstaPayId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  // Fees Editing State
  const [feesSubmitting, setFeesSubmitting] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [pRes, aRes, fRes] = await Promise.all([
        financialAdminApi.getPaymentProviders(),
        financialAdminApi.getReceivingAccounts(),
        financialAdminApi.getFees(),
      ]);
      setProviders(pRes);
      setAccounts(aRes);
      setFees(fRes);
    } catch (err) {
      console.error('Failed to load providers settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenAccountModal = (acc?: PaymentReceivingAccountDto) => {
    if (acc) {
      setEditingAccount(acc);
      setAccountName(acc.name);
      setAccountType(acc.accountType);
      setBankName(acc.bankName || '');
      setHolderName(acc.accountHolderName);
      setAccNumber(acc.accountNumber || '');
      setIban(acc.iban || '');
      setInstaPayId(acc.instaPayIdentifier || '');
      setInstructions(acc.instructions || '');
      setIsDefault(acc.isDefault);
    } else {
      setEditingAccount(null);
      setAccountName('');
      setAccountType('InstaPay');
      setBankName('');
      setHolderName('');
      setAccNumber('');
      setIban('');
      setInstaPayId('');
      setInstructions('');
      setIsDefault(false);
    }
    setAccountModalOpen(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAccountSubmitting(true);
      await financialAdminApi.saveReceivingAccount(
        {
          name: accountName,
          accountType,
          bankName: bankName || undefined,
          accountHolderName: holderName,
          accountNumber: accNumber || undefined,
          iban: iban || undefined,
          instaPayIdentifier: instaPayId || undefined,
          instructions: instructions || undefined,
          isDefault,
          displayOrder: 0,
        },
        editingAccount ? editingAccount.id : undefined
      );
      alert('تم حفظ حساب الاستقبال بنجاح.');
      setAccountModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشل حفظ الحساب.');
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleToggleAccount = async (acc: PaymentReceivingAccountDto) => {
    try {
      await financialAdminApi.toggleReceivingAccount(acc.id, !acc.isActive);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشل تحديث حالة الحساب.');
    }
  };

  const handleSetDefaultAccount = async (acc: PaymentReceivingAccountDto) => {
    try {
      await financialAdminApi.setDefaultReceivingAccount(acc.id);
      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشل تعيين الحساب الافتراضي.');
    }
  };

  const handleFeesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fees) return;
    try {
      setFeesSubmitting(true);
      await financialAdminApi.updateFees(fees);
      alert('تم تحديث هيكل الرسوم والعمولات للمنصة بنجاح.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشل تحديث الرسوم.');
    } finally {
      setFeesSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400" dir="rtl">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
        <p>جاري تحميل إعدادات بوابات الدفع والحسابات...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/payments" className="text-zinc-400 hover:text-white text-xs">
            ← المدفوعات
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400 text-xs font-mono">Payment Providers</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">بوابات الدفع، الحسابات، وهيكل الرسوم</h1>
        <p className="text-sm text-zinc-400 mt-1">
          إدارة حالة البوابات الإلكترونية، الحسابات البنكية لاستقبال إنستاباي، والتحكم في رسوم العمليات المالية (دون إظهار أي مفاتيح سرية)
        </p>
      </div>

      {/* 1. Gateway Providers Status */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">بوابات الدفع الإلكترونية (Gateways)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((p) => (
            <div key={p.provider} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-base">{p.provider}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  p.enabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {p.enabled ? 'مفعلة ✓' : 'معطلة'}
                </span>
              </div>

              <div className="text-xs space-y-2 text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex justify-between">
                  <span>البيئة (Environment):</span>
                  <span className="font-mono text-zinc-200">{p.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span>حالة الاتصال (Health):</span>
                  <span className="text-emerald-400 font-semibold">{p.health}</span>
                </div>
                <div className="flex justify-between">
                  <span>آخر إشعار Webhook:</span>
                  <span className="font-mono text-zinc-300">
                    {p.lastWebhookReceivedAt ? new Date(p.lastWebhookReceivedAt).toLocaleDateString('ar-EG') : 'لا يوجد'}
                  </span>
                </div>
                <div>
                  <div className="mb-1">الوسائل المدعومة:</div>
                  <div className="flex flex-wrap gap-1">
                    {p.supportedMethods.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-zinc-950 rounded text-[11px] text-zinc-300 border border-zinc-800">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Receiving Accounts (InstaPay & Bank Accounts) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">حسابات الاستقبال المعتمدة (PaymentReceivingAccounts)</h2>
            <p className="text-xs text-zinc-400">تستخدم للتحويلات اليدوية عبر إنستاباي، التحويل البنكي، وفودافون كاش</p>
          </div>
          <button
            onClick={() => handleOpenAccountModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
          >
            + إضافة حساب استقبال جديد
          </button>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="p-3.5">اسم الحساب</th>
                <th className="p-3.5">النوع</th>
                <th className="p-3.5">اسم صاحب الحساب</th>
                <th className="p-3.5">معرف إنستاباي / الحساب</th>
                <th className="p-3.5">افتراضي</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-zinc-500">
                    لا توجد حسابات استقبال مضافة حالياً.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-zinc-800/20">
                    <td className="p-3.5 font-bold text-white">{acc.name}</td>
                    <td className="p-3.5 text-zinc-300">{acc.accountType}</td>
                    <td className="p-3.5 text-zinc-200">{acc.accountHolderName}</td>
                    <td className="p-3.5 font-mono text-zinc-300">{acc.instaPayIdentifier || acc.accountNumber || '—'}</td>
                    <td className="p-3.5">
                      {acc.isDefault ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          افتراضي ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultAccount(acc)}
                          className="text-zinc-500 hover:text-zinc-300 underline"
                        >
                          جعله افتراضي
                        </button>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleAccount(acc)}
                        className={`px-2.5 py-0.5 rounded-full font-medium transition ${
                          acc.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {acc.isActive ? 'مفعل' : 'معطل'}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleOpenAccountModal(acc)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                      >
                        تعديل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Platform Fees Configuration */}
      {fees && (
        <form onSubmit={handleFeesSubmit} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">هيكل الرسوم والعمولات (Platform Fees)</h2>
              <p className="text-xs text-zinc-400">تطبيق آلي للرسوم الثابتة والنسبية على عمليات الشحن، التحويل، والسحب</p>
            </div>
            <button
              type="submit"
              disabled={feesSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/20"
            >
              {feesSubmitting ? 'جاري الحفظ...' : 'حفظ تعديلات الرسوم'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Deposit Fee */}
            <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="font-semibold text-zinc-200">رسوم الشحن والإيداع (Deposit)</span>
              <div>
                <label className="text-zinc-400 block mb-1">مبلغ ثابت (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fees.depositFixedFee}
                  onChange={(e) => setFees({ ...fees, depositFixedFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">نسبة مئوية (مثال: 0.02 = 2%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={fees.depositPercentageFee}
                  onChange={(e) => setFees({ ...fees, depositPercentageFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Transfer Fee */}
            <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="font-semibold text-zinc-200">رسوم تحويل الأموال P2P</span>
              <div>
                <label className="text-zinc-400 block mb-1">مبلغ ثابت (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fees.transferFixedFee}
                  onChange={(e) => setFees({ ...fees, transferFixedFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">نسبة مئوية</label>
                <input
                  type="number"
                  step="0.001"
                  value={fees.transferPercentageFee}
                  onChange={(e) => setFees({ ...fees, transferPercentageFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Withdrawal Fee */}
            <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="font-semibold text-zinc-200">رسوم سحب الأرباح (Withdrawal)</span>
              <div>
                <label className="text-zinc-400 block mb-1">مبلغ ثابت (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fees.withdrawalFixedFee}
                  onChange={(e) => setFees({ ...fees, withdrawalFixedFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">نسبة مئوية</label>
                <input
                  type="number"
                  step="0.001"
                  value={fees.withdrawalPercentageFee}
                  onChange={(e) => setFees({ ...fees, withdrawalPercentageFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Advertising Fee */}
            <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="font-semibold text-zinc-200">عمولة الإعلانات (Advertising)</span>
              <div>
                <label className="text-zinc-400 block mb-1">مبلغ ثابت (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fees.advertisingFixedFee}
                  onChange={(e) => setFees({ ...fees, advertisingFixedFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">نسبة مئوية</label>
                <input
                  type="number"
                  step="0.001"
                  value={fees.advertisingPercentageFee}
                  onChange={(e) => setFees({ ...fees, advertisingPercentageFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Account Add/Edit Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white">
              {editingAccount ? 'تعديل حساب استقبال' : 'إضافة حساب استقبال جديد'}
            </h3>

            <form onSubmit={handleAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">اسم الحساب التوضيحي</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="مثال: حساب إنستاباي الرئيسي - البنك الأهلي"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 mb-1">نوع الحساب</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  >
                    <option value="InstaPay">إنستاباي (InstaPay)</option>
                    <option value="BankTransfer">تحويل بنكي</option>
                    <option value="VodafoneCash">محفظة هاتف كاش</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">اسم البنك (إن وجد)</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="البنك الأهلي المصري"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">اسم صاحب الحساب الرسمي</label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="شركة كيان للحلول البرمجية"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">معرف إنستاباي (IPA / Mobile Number)</label>
                <input
                  type="text"
                  value={instaPayId}
                  onChange={(e) => setInstaPayId(e.target.value)}
                  placeholder="todayegypt@instapay"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">رقم الحساب / IBAN</label>
                <input
                  type="text"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  placeholder="EG120003000..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">تعليمات التحويل للعميل</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="يرجى كتابة رقم المرجع في خانة الملاحظات عند التحويل..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="defaultCheck" className="text-zinc-300">
                  تعيين كحساب افتراضي للمنصة
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  disabled={accountSubmitting}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={accountSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  {accountSubmitting ? 'جاري الحفظ...' : 'حفظ الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
