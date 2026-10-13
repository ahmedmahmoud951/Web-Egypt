'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { financialAdminApi } from '@/api/financialAdmin';
import { FinancialReconciliationSummaryDto } from '@/types/financial';
import {
  Scale,
  CreditCard,
  Landmark,
  Wallet,
  CircleDollarSign,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Search,
  ShieldCheck,
  Eye,
  Copy,
  Check,
  Layers,
  ArrowUpRight,
  ChevronLeft,
} from 'lucide-react';

export default function AdminReconciliationPage() {
  const [data, setData] = useState<FinancialReconciliationSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadReconciliation = async () => {
    try {
      setLoading(true);
      const res = await financialAdminApi.getReconciliation();
      setData(res);
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliation();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const summary = data || {
    matchedCount: 0,
    matchedTotalAmount: 0,
    missingWebhookCount: 0,
    missingWebhookTotalAmount: 0,
    duplicateWebhookCount: 0,
    amountMismatchCount: 0,
    statusMismatchCount: 0,
    items: [],
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
            <span className="text-white font-black">تقرير المطابقة المالية وبوابات الدفع</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <Link
              href="/admin/payments"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>سجل العمليات</span>
            </Link>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-300" />
              <span>المطابقة المالية</span>
            </span>
            <Link
              href="/admin/payment-providers"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>بوابات الدفع والرسوم</span>
            </Link>
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-amber-950/30 to-slate-900/95 border border-amber-500/30 p-6 md:p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نظام التدقيق المالي الآلي وإشارات الـ Webhooks</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Scale className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                <span>تقرير المطابقة المالية وبوابات الدفع</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                فحص آلي وتدقيق محاسبي بين سجلات خوادم المنصة الداخلية، استجابات بوابات الدفع الإلكترونية (Paymob، Fawry، InstaPay)، وإشارات الـ Webhooks لمنع الفروقات أو ازدواجية القيد.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={loadReconciliation}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-black shadow-lg shadow-amber-600/25 border border-amber-400/40 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>إعادة الفحص والتدقيق الآلي الآن</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>حماية متقدمة من التكرار (Idempotency Active)</span>
              </div>
            </div>
          </div>
        </div>

        {/* High Impact Glowing KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Matched */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/95 to-emerald-950/30 border border-emerald-500/40 p-5 shadow-lg shadow-emerald-500/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-black mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>عمليات متطابقة 100%</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px]">سليمة ✓</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{summary.matchedCount}</div>
            <div className="text-xs text-slate-300 mt-2 font-sans">
              إجمالي القيمة:{' '}
              <span className="font-black text-emerald-400 font-mono">
                {summary.matchedTotalAmount.toLocaleString()} ج.م
              </span>
            </div>
          </div>

          {/* Missing Webhook */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/95 to-amber-950/30 border border-amber-500/40 p-5 shadow-lg shadow-amber-500/10 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition">
            <div className="flex items-center justify-between text-xs text-amber-400 font-black mb-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>إشعارات مفقودة (Webhook Missing)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px]">قيد المعالجة ⏳</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{summary.missingWebhookCount}</div>
            <div className="text-xs text-slate-300 mt-2 font-sans">
              قيمة العمليات:{' '}
              <span className="font-black text-amber-400 font-mono">
                {summary.missingWebhookTotalAmount.toLocaleString()} ج.م
              </span>
            </div>
          </div>

          {/* Duplicate Webhooks */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/95 to-purple-950/30 border border-purple-500/40 p-5 shadow-lg shadow-purple-500/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition">
            <div className="flex items-center justify-between text-xs text-purple-400 font-black mb-2">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                <span>إشعارات مكررة (Duplicate)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[10px]">تم حظرها 🛡️</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{summary.duplicateWebhookCount}</div>
            <div className="text-[11px] text-slate-400 mt-2">
              تم منع تكرار القيد أو مضاعفة الرصيد بفضل مفتاح Idempotency
            </div>
          </div>

          {/* Mismatches */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/95 to-rose-950/30 border border-rose-500/40 p-5 shadow-lg shadow-rose-500/10 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] transition">
            <div className="flex items-center justify-between text-xs text-rose-400 font-black mb-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>فروقات المبالغ / الحالات</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-[10px]">تدقيق يدوي ✗</span>
            </div>
            <div className="text-3xl font-black text-rose-400 font-mono">
              {summary.amountMismatchCount + summary.statusMismatchCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              تتطلب فحصاً محاسبياً وتأكيداً مباشراً مع تقرير البوابة
            </div>
          </div>
        </div>

        {/* Discrepancy Items Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>سجل العمليات الخاضعة للتدقيق والمطابقة</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تقرير تفصيلي بنتائج المقارنة بين حالة المعاملة في النظام ورد بوابة الدفع
              </p>
            </div>
            <span className="text-xs font-bold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              {summary.items.length} عملية تم تدقيقها
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-white/10">
                <tr>
                  <th className="p-4">المرجع</th>
                  <th className="p-4">البوابة</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">حالة النظام</th>
                  <th className="p-4">نتيجة المطابقة</th>
                  <th className="p-4">التفاصيل والتشخيص</th>
                  <th className="p-4">التوقيت</th>
                  <th className="p-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mb-3" />
                      <p className="font-bold">جاري تحليل ومطابقة العمليات المالية...</p>
                    </td>
                  </tr>
                ) : summary.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p className="font-bold text-white">جميع السجلات سليمة ومتطابقة 100% مع بوابات الدفع.</p>
                      <p className="text-xs text-slate-500 mt-1">لا توجد أي فروقات مفقودة أو استجابات معلقة حالياً.</p>
                    </td>
                  </tr>
                ) : (
                  summary.items.map((item) => (
                    <tr key={item.transactionId} className="hover:bg-amber-500/[0.04] transition group">
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-bold">
                          <span>{item.reference}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.reference, item.transactionId + '-rec')}
                            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white"
                            title="نسخ المرجع"
                          >
                            {copiedId === item.transactionId + '-rec' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="p-4 font-bold text-white">{item.provider}</td>

                      <td className="p-4 font-black text-white font-mono text-sm">
                        {item.amount.toLocaleString()}{' '}
                        <span className="text-[10px] font-bold text-slate-400">{item.currency || 'EGP'}</span>
                      </td>

                      <td className="p-4 font-mono text-slate-300 font-semibold">{item.status}</td>

                      <td className="p-4">
                        {item.discrepancyType === 'Matched' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>متطابقة ✓</span>
                          </span>
                        ) : item.discrepancyType === 'Webhook Missing' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>إشعار مفقود ⏳</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{item.discrepancyType}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-300 max-w-sm text-xs leading-relaxed">
                        {item.details || 'تم التحقق من مطابقة المبلغ ورقم العملية لدى البوابة.'}
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-4 text-center">
                        <Link
                          href={`/admin/payments/${item.transactionId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>فحص</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
