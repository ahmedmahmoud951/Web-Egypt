'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { financialAdminApi } from '@/api/financialAdmin';
import { AdminPaymentDetailDto } from '@/types/financial';

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [payment, setPayment] = useState<AdminPaymentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('طلب استرداد معتمد من الإدارة');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await financialAdminApi.getPaymentDetail(id);
      setPayment(res);
      setRefundAmount(res.amount.toString());
    } catch (err) {
      console.error('Failed to load payment detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRefundSubmitting(true);
      const parsedAmount = refundAmount ? parseFloat(refundAmount) : undefined;
      await financialAdminApi.refundPayment(id, parsedAmount, refundReason);
      alert('تم تنفيذ الاسترداد المالي بنجاح وقيد العمليات المحاسبية.');
      setRefundOpen(false);
      loadDetail();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشلت عملية الاسترداد، يرجى المحاولة لاحقاً.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400" dir="rtl">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
        <p>جاري تحميل تفاصيل المعاملة المالية...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-12 text-center text-zinc-400 space-y-4" dir="rtl">
        <p>المعاملة المالية غير موجودة.</p>
        <Link href="/admin/payments" className="text-emerald-500 hover:underline">
          العودة لقائمة المدفوعات
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/payments" className="text-zinc-400 hover:text-white text-xs">
              ← المدفوعات
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 text-xs font-mono">{payment.reference}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">تفاصيل المعاملة المالية</h1>
        </div>

        {payment.status === 'Succeeded' && (
          <button
            onClick={() => setRefundOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-rose-900/20"
          >
            إجراء استرداد مالي (Refund)
          </button>
        )}
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Breakdown */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800/80 pb-3">البيانات المالية</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">المبلغ الإجمالي:</span>
              <span className="font-bold text-white">{payment.amount.toLocaleString()} {payment.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">عمولة المعالجة:</span>
              <span className="text-zinc-300 font-medium">{payment.fee.toLocaleString()} {payment.currency}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-400">المبلغ الصافي:</span>
              <span className="font-bold text-emerald-400">{payment.netAmount.toLocaleString()} {payment.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">الحالة الحالية:</span>
              <span className="font-semibold text-zinc-200">{payment.status}</span>
            </div>
          </div>
        </div>

        {/* Gateway & Provider Info */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800/80 pb-3">بوابة الدفع والتتبع</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">المزود (Provider):</span>
              <span className="font-medium text-white">{payment.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">وسيلة الدفع:</span>
              <span className="text-zinc-200">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">معرف بوابة الدفع:</span>
              <span className="font-mono text-xs text-zinc-300">{payment.providerTransactionId || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">المرجع الداخلي:</span>
              <span className="font-mono text-xs text-zinc-300">{payment.reference}</span>
            </div>
          </div>
        </div>

        {/* Customer & Purpose */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800/80 pb-3">بيانات العميل والغرض</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">العميل:</span>
              <span className="font-medium text-white">{payment.userName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">الهاتف:</span>
              <span className="font-mono text-zinc-300">{payment.userPhoneNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">الغرض:</span>
              <span className="text-zinc-200">{payment.purpose}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">تاريخ الإنشاء:</span>
              <span className="text-xs text-zinc-400 font-mono">
                {new Date(payment.createdAt).toLocaleString('ar-EG')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Double-Entry Ledger Breakdown */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h2 className="text-sm font-semibold text-zinc-200">قيود الأستاذ العام (Double-Entry Ledger)</h2>
          <span className="text-xs text-emerald-400 font-medium">متطابق محاسبياً ✓</span>
        </div>

        {payment.ledgerEntries && payment.ledgerEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-3">رمز الحساب</th>
                  <th className="p-3">اسم الحساب</th>
                  <th className="p-3">مدين (Debit)</th>
                  <th className="p-3">دائن (Credit)</th>
                  <th className="p-3">البيان</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 font-mono">
                {payment.ledgerEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-800/20">
                    <td className="p-3 text-zinc-300 font-medium">{e.accountCode}</td>
                    <td className="p-3 text-white font-sans">{e.accountName}</td>
                    <td className="p-3 text-rose-400 font-bold">{e.debit > 0 ? e.debit.toLocaleString() : '—'}</td>
                    <td className="p-3 text-emerald-400 font-bold">{e.credit > 0 ? e.credit.toLocaleString() : '—'}</td>
                    <td className="p-3 text-zinc-400 font-sans">{e.description || '—'}</td>
                    <td className="p-3 text-zinc-500">{new Date(e.createdAt).toLocaleTimeString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-3">لا توجد قيود أستاذ مسجلة لهذه المعاملة مباشرة.</p>
        )}
      </div>

      {/* Audit Log Trail */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800/80 pb-3">سجل التدقيق المالي والأمني (Audit Trail)</h2>

        {payment.auditLogs && payment.auditLogs.length > 0 ? (
          <div className="space-y-3">
            {payment.auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-zinc-200">{log.action}</div>
                  <div className="text-zinc-400 mt-0.5">{log.reason || 'تم تسجيل الحدث بنجاح'}</div>
                </div>
                <div className="text-right text-zinc-500 font-mono">
                  <div>{log.adminName ? `بواسطة: ${log.adminName}` : 'النظام الآلي'}</div>
                  <div>{new Date(log.createdAt).toLocaleString('ar-EG')}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-3">لا توجد سجلات تدقيق إضافية.</p>
        )}
      </div>

      {/* Refund Modal */}
      {refundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white">تأكيد عملية الاسترداد المالي</h3>
            <p className="text-xs text-zinc-400">
              سيتم إرجاع المبلغ للعميل عبر بوابة الدفع، وقيد عملية استرداد عكسية في الأستاذ العام وتوثيقها في سجل التدقيق.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">مبلغ الاسترداد (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  max={payment.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">سبب الاسترداد</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRefundOpen(false)}
                  disabled={refundSubmitting}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition"
                >
                  {refundSubmitting ? 'جاري التنفيذ...' : 'تأكيد الاسترداد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
