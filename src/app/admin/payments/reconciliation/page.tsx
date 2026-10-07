'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { financialAdminApi } from '@/api/financialAdmin';
import { FinancialReconciliationSummaryDto } from '@/types/financial';

export default function AdminReconciliationPage() {
  const [data, setData] = useState<FinancialReconciliationSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400" dir="rtl">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
        <p>جاري تحليل ومطابقة العمليات المالية وبوابات الدفع...</p>
      </div>
    );
  }

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
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/payments" className="text-zinc-400 hover:text-white text-xs">
              ← المدفوعات
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 text-xs font-mono">Reconciliation</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">تقرير المطابقة المالية وبوابات الدفع</h1>
          <p className="text-sm text-zinc-400 mt-1">
            فحص آلي وتدقيق يومي بين سجلات الخادم، استجابات بوابات الدفع (Webhooks)، وقيود الأستاذ العام
          </p>
        </div>

        <button
          onClick={loadReconciliation}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 transition"
        >
          إعادة الفحص والمطابقة الآن ⟳
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Matched */}
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold">
            <span>عمليات متطابقة (Matched)</span>
            <span>✓</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.matchedCount}</div>
          <div className="text-xs text-zinc-400">
            إجمالي: <span className="font-semibold text-emerald-400">{summary.matchedTotalAmount.toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* Missing Webhook */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-amber-400 font-semibold">
            <span>إشعارات مفقودة (Webhook Missing)</span>
            <span>⚠️</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.missingWebhookCount}</div>
          <div className="text-xs text-zinc-400">
            إجمالي: <span className="font-semibold text-amber-400">{summary.missingWebhookTotalAmount.toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* Duplicate Webhooks */}
        <div className="bg-purple-950/20 border border-purple-800/40 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-purple-400 font-semibold">
            <span>إشعارات مكررة (Duplicate)</span>
            <span>🔁</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.duplicateWebhookCount}</div>
          <div className="text-xs text-zinc-400">تم حظر تكرار القيد عبر Idempotency</div>
        </div>

        {/* Mismatches */}
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-rose-400 font-semibold">
            <span>فروقات المبالغ / الحالات</span>
            <span>✗</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.amountMismatchCount + summary.statusMismatchCount}</div>
          <div className="text-xs text-zinc-400">تتطلب فحصاً وتدخلاً يدوياً من الإدارة</div>
        </div>
      </div>

      {/* Discrepancy Items Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden space-y-0">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">سجل العمليات الخاضعة للتدقيق والمطابقة</h2>
          <span className="text-xs text-zinc-400">{summary.items.length} عملية تم فحصها</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="p-3.5">المرجع</th>
                <th className="p-3.5">البوابة</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">حالة النظام</th>
                <th className="p-3.5">نتيجة المطابقة</th>
                <th className="p-3.5">التفاصيل والتشخيص</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {summary.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    جميع السجلات نظيفة ولا توجد أي فروقات مطابقة حالياً.
                  </td>
                </tr>
              ) : (
                summary.items.map((item) => (
                  <tr key={item.transactionId} className="hover:bg-zinc-800/20">
                    <td className="p-3.5 font-mono text-zinc-200">{item.reference}</td>
                    <td className="p-3.5 text-zinc-300">{item.provider}</td>
                    <td className="p-3.5 font-bold text-white">{item.amount.toLocaleString()} {item.currency}</td>
                    <td className="p-3.5 font-mono text-zinc-400">{item.status}</td>
                    <td className="p-3.5">
                      {item.discrepancyType === 'Matched' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          متطابقة ✓
                        </span>
                      ) : item.discrepancyType === 'Webhook Missing' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          معلقة دون رد ⏳
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                          {item.discrepancyType}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-zinc-400 max-w-xs">{item.details}</td>
                    <td className="p-3.5 font-mono text-zinc-500">
                      {new Date(item.createdAt).toLocaleTimeString('ar-EG')}
                    </td>
                    <td className="p-3.5 text-center">
                      <Link
                        href={`/admin/payments/${item.transactionId}`}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] transition"
                      >
                        فحص
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
  );
}
