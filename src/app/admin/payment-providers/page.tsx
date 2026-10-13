'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { financialAdminApi } from '@/api/financialAdmin';
import {
  PaymentProviderStatusDto,
  PaymentReceivingAccountDto,
  FinancialFeeConfigDto,
} from '@/types/financial';
import {
  Landmark,
  CreditCard,
  Scale,
  Wallet,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Edit2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Sliders,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Layers,
  ChevronLeft,
  Building,
  Smartphone,
  Info,
} from 'lucide-react';

export default function AdminPaymentProvidersPage() {
  const [providers, setProviders] = useState<PaymentProviderStatusDto[]>([]);
  const [accounts, setAccounts] = useState<PaymentReceivingAccountDto[]>([]);
  const [fees, setFees] = useState<FinancialFeeConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Account Modal State
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
  const [feesSuccessMessage, setFeesSuccessMessage] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      setFeesSuccessMessage(null);
      await financialAdminApi.updateFees(fees);
      setFeesSuccessMessage('تم تحديث هيكل الرسوم والعمولات للمنصة بنجاح ✓');
      setTimeout(() => setFeesSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشل تحديث الرسوم.');
    } finally {
      setFeesSubmitting(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-7 text-right max-w-7xl mx-auto pb-16" dir="rtl">
        {/* Navigation Breadcrumbs & Financial Section Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-3.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Link href="/admin" className="text-cyan-400 hover:underline flex items-center gap-1 font-bold">
              لوحة القيادة
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/admin/payments" className="text-cyan-400 hover:underline">
              المالية والمدفوعات
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-black">بوابات الدفع، الحسابات، وهيكل الرسوم</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <Link
              href="/admin/payments"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>سجل العمليات</span>
            </Link>
            <Link
              href="/admin/payments/reconciliation"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>المطابقة المالية</span>
            </Link>
            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-cyan-300" />
              <span>بوابات الدفع والرسوم</span>
            </span>
            <Link
              href="/admin/wallets"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>المحافظ</span>
            </Link>
            <Link
              href="/admin/withdrawals"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <CircleDollarSign className="w-3.5 h-3.5 text-rose-400" />
              <span>السحوبات</span>
            </Link>
          </div>
        </div>

        {/* Hero Banner with Glowing Border */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-cyan-950/40 to-slate-900/95 border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إدارة البنية المالية والتحصيل الرقمي</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Landmark className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                <span>بوابات الدفع، الحسابات، وهيكل الرسوم</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                تحكم فوري بحالة بوابات الدفع الإلكترونية (Paymob، Fawry، InstaPay)، الحسابات البنكية المعتمدة لاستقبال الأموال، وتحديث الرسوم والعمولات المفروضة على عمليات المنصة.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>مفاتيح التشفير والـ Webhooks مؤمنة 100%</span>
              </div>
              <button
                type="button"
                onClick={loadAll}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث البيانات لحظياً</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-white/5">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-cyan-500 border-t-transparent mb-4" />
            <p className="text-sm font-bold text-white">جاري تحميل إعدادات بوابات الدفع والحسابات البنكية...</p>
          </div>
        ) : (
          <>
            {/* 1. Gateway Providers Status Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span>بوابات الدفع الإلكترونية المربوطة (Gateways)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    الربط الآلي مع خوادم الدفع لمعالجة البطاقات البنكية، المحافظ الذكية، وكروت ميزة
                  </p>
                </div>
                <span className="text-xs font-bold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  {providers.length} بوابات نشطة
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {providers.map((p) => {
                  const isEnabled = p.enabled;
                  return (
                    <div
                      key={p.provider}
                      className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/20 hover:border-cyan-500/50 p-5 shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.18)] transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-black text-white text-base group-hover:text-cyan-300 transition">
                              {p.provider}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {p.environment === 'Production' ? '🔴 Live Production' : '🟡 Test Sandbox'}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 border ${
                            isEnabled
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {isEnabled ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>مفعلة ✓</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>معطلة</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">حالة الاتصال (Health):</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            {p.health || 'سليمة ومتصلة'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">آخر إشعار Webhook:</span>
                          <span className="font-mono text-cyan-300 font-semibold text-[11px]">
                            {p.lastWebhookReceivedAt
                              ? new Date(p.lastWebhookReceivedAt).toLocaleString('ar-EG')
                              : 'لم يسجل مؤخراً'}
                          </span>
                        </div>

                        <div className="pt-2">
                          <div className="text-[11px] text-slate-400 mb-1.5 font-bold">القنوات المدعومة:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {p.supportedMethods && p.supportedMethods.length > 0 ? (
                              p.supportedMethods.map((m) => (
                                <span
                                  key={m}
                                  className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-white/10 text-[11px] font-semibold"
                                >
                                  {m}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[11px]">البطاقات والمحافظ وكروت ميزة</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Receiving Accounts (InstaPay & Bank Accounts) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-emerald-400" />
                    <span>حسابات الاستقبال المعتمدة (Payment Accounts)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    حسابات البنوك، عناوين إنستاباي، والمحافظ المعتمدة التي تظهر للمستخدمين عند التحويل اليدوي والمباشر
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAccountModal()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 border border-emerald-400/30 transition active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة حساب استقبال جديد</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-white/5">
                    لا توجد حسابات استقبال مسجلة حالياً. انقر على «إضافة حساب» بالزر أعلاه.
                  </div>
                ) : (
                  accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`relative rounded-2xl p-5 border transition-all ${
                        acc.isDefault
                          ? 'bg-gradient-to-b from-slate-900/90 to-emerald-950/20 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
                          : 'bg-slate-900/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            {acc.accountType === 'InstaPay' ? (
                              <Smartphone className="w-5 h-5" />
                            ) : (
                              <Landmark className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{acc.name}</div>
                            <div className="text-[11px] text-emerald-400 font-semibold">{acc.accountType}</div>
                          </div>
                        </div>

                        {acc.isDefault ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            الافتراضي ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAccount(acc)}
                            className="text-[11px] text-slate-400 hover:text-cyan-300 underline"
                          >
                            تعيين كافتراضي
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/10 font-sans">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">اسم صاحب الحساب:</span>
                          <span className="font-bold text-white">{acc.accountHolderName}</span>
                        </div>

                        {acc.bankName && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">اسم البنك:</span>
                            <span className="text-slate-200">{acc.bankName}</span>
                          </div>
                        )}

                        {acc.instaPayIdentifier && (
                          <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-white/5">
                            <span className="text-slate-400 text-[11px]">معرف إنستاباي (IPA):</span>
                            <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                              <span>{acc.instaPayIdentifier}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(acc.instaPayIdentifier!, acc.id + '-ipa')}
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                                title="نسخ المعرف"
                              >
                                {copiedId === acc.id + '-ipa' ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {acc.accountNumber && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">رقم الحساب:</span>
                            <span className="font-mono text-cyan-300 font-bold">{acc.accountNumber}</span>
                          </div>
                        )}

                        {acc.iban && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">IBAN:</span>
                            <span className="font-mono text-slate-300 truncate max-w-[180px]">{acc.iban}</span>
                          </div>
                        )}

                        {acc.instructions && (
                          <div className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-lg italic">
                            «{acc.instructions}»
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleToggleAccount(acc)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                            acc.isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {acc.isActive ? 'مفعل لاستقبال الدفع' : 'معطل مؤقتاً'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAccountModal(acc)}
                          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Platform Fees Configuration */}
            {fees && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-cyan-400" />
                      <span>هيكل الرسوم والعمولات المفروضة (Platform Fees)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      تطبيق الرسوم الثابتة والنسبية المقتطعة تلقائياً على عمليات الإيداع، التحويل الداخلي، وسحب الأرباح
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleFeesSubmit}
                  className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 space-y-6 shadow-xl backdrop-blur-md"
                >
                  {feesSuccessMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{feesSuccessMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Deposit Fee */}
                    <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <CreditCard className="w-4 h-4 text-cyan-400" />
                        <span>رسوم الإيداع والشحن (Deposit)</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">مبلغ ثابت (ج.م)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={fees.depositFixedFee}
                            onChange={(e) => setFees({ ...fees, depositFixedFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">نسبة مئوية (مثال: 0.02 = 2%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={fees.depositPercentageFee}
                            onChange={(e) => setFees({ ...fees, depositPercentageFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transfer Fee */}
                    <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-white/5 hover:border-amber-500/30 transition">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                        <span>رسوم تحويل الأموال P2P</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">مبلغ ثابت (ج.م)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={fees.transferFixedFee}
                            onChange={(e) => setFees({ ...fees, transferFixedFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">نسبة مئوية (مثال: 0.015 = 1.5%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={fees.transferPercentageFee}
                            onChange={(e) => setFees({ ...fees, transferPercentageFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Withdrawal Fee */}
                    <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-white/5 hover:border-rose-500/30 transition">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <CircleDollarSign className="w-4 h-4 text-rose-400" />
                        <span>رسوم سحب الأرباح (Withdrawal)</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">مبلغ ثابت (ج.م)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={fees.withdrawalFixedFee}
                            onChange={(e) => setFees({ ...fees, withdrawalFixedFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-rose-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">نسبة مئوية (مثال: 0.02 = 2%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={fees.withdrawalPercentageFee}
                            onChange={(e) => setFees({ ...fees, withdrawalPercentageFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-rose-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advertising & Other Fees */}
                    <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition">
                      <div className="flex items-center gap-2 font-bold text-white text-xs">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>عمولة الحملات والترويج</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">مبلغ ثابت (ج.م)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={fees.advertisingFixedFee}
                            onChange={(e) => setFees({ ...fees, advertisingFixedFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">نسبة مئوية (مثال: 0.05 = 5%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={fees.advertisingPercentageFee}
                            onChange={(e) => setFees({ ...fees, advertisingPercentageFee: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-white/10">
                    <button
                      type="submit"
                      disabled={feesSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/30 border border-cyan-400/40 transition active:scale-95 disabled:opacity-50"
                    >
                      {feesSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري الحفظ والاعتماد...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>حفظ واعتماد هيكل الرسوم ✓</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* Account Add/Edit Modal */}
        {accountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-lg w-full p-6 space-y-4 text-right shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-cyan-400" />
                  <span>{editingAccount ? 'تعديل حساب استقبال' : 'إضافة حساب استقبال جديد'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الحساب التوضيحي</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="مثال: حساب إنستاباي الرئيسي - البنك الأهلي المصري"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">نوع الحساب</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="InstaPay">إنستاباي (InstaPay)</option>
                      <option value="BankTransfer">تحويل بنكي مباشر</option>
                      <option value="VodafoneCash">محفظة فودافون كاش</option>
                      <option value="OrangeCash">محفظة أورنج كاش</option>
                      <option value="EtisalatCash">محفظة إتصالات كاش</option>
                      <option value="SmartWallet">محفظة بنكية ذكية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">اسم البنك (إن وجد)</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="مثال: NBE, CIB, QNB..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم صاحب الحساب بالكامل</label>
                  <input
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="كما هو مسجل رسمياً بالبنك أو المحفظة"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">عنوان إنستاباي IPA</label>
                    <input
                      type="text"
                      value={instaPayId}
                      onChange={(e) => setInstaPayId(e.target.value)}
                      placeholder="username@instapay"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رقم الحساب البنكي</label>
                    <input
                      type="text"
                      value={accNumber}
                      onChange={(e) => setAccNumber(e.target.value)}
                      placeholder="رقم الحساب المحلي"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الآيبان الدولي (IBAN)</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="EG0000000000000000000000000"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تعليمات التحويل للعميل</label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="ملاحظات تظهر للمستخدم (مثال: يرجى كتابة رقم الهاتف في خانة ملاحظات التحويل)"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefaultAccount"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-white/20"
                  />
                  <label htmlFor="isDefaultAccount" className="text-slate-300 text-xs font-semibold cursor-pointer">
                    تعيين كحساب افتراضي أول يظهر للعملاء في التطبيق
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setAccountModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={accountSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-lg shadow-emerald-600/30"
                  >
                    {accountSubmitting ? 'جاري الحفظ...' : 'حفظ الحساب ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
