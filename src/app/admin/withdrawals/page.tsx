'use client';

import React, { useState, useEffect } from 'react';
import { financialAdminApi } from '@/api/financialAdmin';
import { AdminWithdrawalListItemDto } from '@/types/financial';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalListItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState<string>('Pending');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Action Modals State
  const [selectedTx, setSelectedTx] = useState<AdminWithdrawalListItemDto | null>(null);
  const [actionType, setActionType] = useState<'process' | 'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await financialAdminApi.getWithdrawals({
        status: status || undefined,
        page,
        pageSize,
      });
      setWithdrawals(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, [status, page]);

  const handleActionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !actionType) return;

    try {
      setSubmitting(true);
      if (actionType === 'process') {
        await financialAdminApi.markWithdrawalProcessing(selectedTx.id, notes);
        alert('تم تحويل طلب السحب إلى قيد المعالجة بنجاح.');
      } else if (actionType === 'approve') {
        await financialAdminApi.approveWithdrawal(selectedTx.id, notes);
        alert('تمت الموافقة وتأكيد التحويل وإخلاء الرصيد المقفول وترحيل القيود بنجاح.');
      } else if (actionType === 'reject') {
        await financialAdminApi.rejectWithdrawal(selectedTx.id, notes || 'مرفوض بواسطة الإدارة');
        alert('تم رفض طلب السحب واستعادة الرصيد المقفول إلى رصيد العميل المتاح بنجاح.');
      }
      setSelectedTx(null);
      setActionType(null);
      setNotes('');
      loadWithdrawals();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشلت معالجة الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">مكتملة ومحولة ✓</span>;
      case 'Processing':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">قيد التحويل ⏳</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">بانتظار المراجعة 🕒</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">مرفوض ✗</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-500/10 text-zinc-400">{st}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة طلبات سحب الأرباح والأموال</h1>
        <p className="text-sm text-zinc-400 mt-1">
          مراجعة طلبات السحب للعملاء، الموافقة والتحويل البنكي أو المحافظ، أو الرفض مع استعادة الرصيد المقفول تلقائياً
        </p>
      </div>

      {/* Tabs / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="flex gap-2 text-xs font-medium">
          {['Pending', 'Processing', 'Completed', 'Rejected', ''].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition ${
                status === st
                  ? 'bg-zinc-100 text-zinc-900 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {st === 'Pending'
                ? 'بانتظار المراجعة'
                : st === 'Processing'
                ? 'قيد المعالجة'
                : st === 'Completed'
                ? 'المكتملة'
                : st === 'Rejected'
                ? 'المرفوضة'
                : 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-zinc-950/60 text-zinc-400 text-xs font-semibold uppercase border-b border-zinc-800">
              <tr>
                <th className="p-4">المرجع</th>
                <th className="p-4">العميل</th>
                <th className="p-4">المبلغ المطلوب</th>
                <th className="p-4">طريقة الاستلام</th>
                <th className="p-4">رقم الحساب / المحفظة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">تاريخ الطلب</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-2"></div>
                    <p>جاري تحميل طلبات السحب...</p>
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    لا توجد طلبات سحب في هذه الحالة.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-zinc-800/30 transition">
                    <td className="p-4 font-mono font-medium text-xs text-zinc-200">{w.reference}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{w.userName || 'مستخدم غير معروف'}</div>
                      <div className="text-xs text-zinc-400 font-mono">{w.userPhoneNumber}</div>
                    </td>
                    <td className="p-4 font-bold text-white text-base">
                      {w.amount.toLocaleString()} <span className="text-xs font-normal text-zinc-400">{w.currency}</span>
                    </td>
                    <td className="p-4 text-zinc-200 font-medium">{w.destinationType}</td>
                    <td className="p-4 font-mono text-zinc-300 font-medium">{w.destinationAccount}</td>
                    <td className="p-4">{getStatusBadge(w.status)}</td>
                    <td className="p-4 text-xs font-mono text-zinc-400">
                      {new Date(w.createdAt).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {w.status === 'Pending' && (
                          <button
                            onClick={() => {
                              setSelectedTx(w);
                              setActionType('process');
                              setNotes('جاري تنفيذ التحويل المالي عبر ' + w.destinationType);
                            }}
                            className="px-2.5 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition"
                          >
                            بدء المعالجة
                          </button>
                        )}

                        {(w.status === 'Pending' || w.status === 'Processing') && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedTx(w);
                                setActionType('approve');
                                setNotes('تم التحويل بنجاح برقم إشعار: ');
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition"
                            >
                              موافقة وإتمام
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTx(w);
                                setActionType('reject');
                                setNotes('');
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-600/30 transition"
                            >
                              رفض
                            </button>
                          </>
                        )}

                        {(w.status === 'Completed' || w.status === 'Rejected') && (
                          <span className="text-xs text-zinc-500">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div>
            إجمالي الطلبات: <span className="font-semibold text-white">{totalCount}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg text-zinc-200 transition"
            >
              السابق
            </button>
            <span className="px-3 py-1.5 bg-zinc-950 rounded-lg text-zinc-200 font-medium">صفحة {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= totalCount}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg text-zinc-200 transition"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {selectedTx && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white">
              {actionType === 'process'
                ? 'تحويل الطلب إلى قيد المعالجة'
                : actionType === 'approve'
                ? 'تأكيد الموافقة وإتمام التحويل'
                : 'تأكيد رفض طلب السحب'}
            </h3>

            <div className="p-3 bg-zinc-950 rounded-xl text-xs space-y-1 text-zinc-300 border border-zinc-800">
              <div>العميل: <span className="font-semibold text-white">{selectedTx.userName}</span></div>
              <div>المبلغ: <span className="font-bold text-emerald-400">{selectedTx.amount.toLocaleString()} {selectedTx.currency}</span></div>
              <div>الوجهة: <span className="font-mono text-white">{selectedTx.destinationType} - {selectedTx.destinationAccount}</span></div>
            </div>

            <p className="text-xs text-zinc-400">
              {actionType === 'approve'
                ? 'سيتم إخلاء الرصيد المقفول وترحيل القيود المحاسبية النهائية إلى حسابات الأستاذ العام.'
                : actionType === 'reject'
                ? 'سيتم استعادة الرصيد المقفول بالكامل فورياً إلى رصيد العميل المتاح.'
                : 'سيتم إشعار العميل بأن الطلب قيد التنفيذ والتحويل البنكي.'}
            </p>

            <form onSubmit={handleActionConfirm} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  {actionType === 'reject' ? 'سبب الرفض (إلزامي)' : 'ملاحظات ورقم إشعار التحويل'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === 'reject' ? 'اكتب سبب الرفض بالتفصيل...' : 'رقم العملية البنكية أو المحفظة...'}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required={actionType === 'reject'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTx(null);
                    setActionType(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition text-white ${
                    actionType === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {submitting ? 'جاري التنفيذ...' : 'تأكيد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
