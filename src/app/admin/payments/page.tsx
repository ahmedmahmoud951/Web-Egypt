'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { financialAdminApi } from '@/api/financialAdmin';
import { AdminPaymentListItemDto } from '@/types/financial';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentListItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await financialAdminApi.getPayments({
        search: search || undefined,
        provider: provider || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        purpose: purpose || undefined,
        page,
        pageSize,
      });
      setPayments(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Succeeded':
      case 'Completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">ناجحة</span>;
      case 'Pending':
      case 'Processing':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">قيد الانتظار</span>;
      case 'Failed':
      case 'Cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">فشلت</span>;
      case 'Refunded':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">مستردة</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">{st}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">سجل المدفوعات والعمليات المالية</h1>
          <p className="text-sm text-zinc-400 mt-1">متابعة دقيقة لجميع العمليات الصادرة والواردة عبر بوابات الدفع والمحافظ</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments/reconciliation"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition"
          >
            تقرير المطابقة اليومي
          </Link>
          <Link
            href="/admin/payment-providers"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/20"
          >
            إعدادات البوابات والحسابات
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">بحث عام</label>
            <input
              type="text"
              placeholder="المرجع، العميل، الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">البوابة / المزود</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">الكل</option>
              <option value="Paymob">Paymob</option>
              <option value="Fawry">Fawry</option>
              <option value="Manual">تحويل بنكي / إنستاباي</option>
              <option value="Wallet">المحفظة الإلكترونية</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">طريقة الدفع</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">الكل</option>
              <option value="Card">بطاقة بنكية (Visa/Mastercard)</option>
              <option value="MobileWallet">محفظة هاتف (فودافون/أورنج/اتصالات)</option>
              <option value="InstaPay">إنستاباي (InstaPay)</option>
              <option value="BankTransfer">تحويل بنكي</option>
              <option value="WalletBalance">رصيد المحفظة</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">الحالة</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">الكل</option>
              <option value="Succeeded">ناجحة (Succeeded)</option>
              <option value="Pending">قيد الانتظار (Pending)</option>
              <option value="Processing">قيد المعالجة (Processing)</option>
              <option value="Failed">فشلت (Failed)</option>
              <option value="Refunded">مستردة (Refunded)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">الغرض</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">الكل</option>
              <option value="WalletDeposit">شحن محفظة</option>
              <option value="Advertising">حملة إعلانية</option>
              <option value="Verification">توثيق هوية</option>
              <option value="Marketplace">ترويج إعلان مبوب</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setProvider('');
              setPaymentMethod('');
              setStatus('');
              setPurpose('');
              setPage(1);
            }}
            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            إعادة تعيين
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl transition"
          >
            تطبيق الفلترة
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-zinc-950/60 text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-4">المرجع</th>
                <th className="p-4">العميل</th>
                <th className="p-4">المبلغ الإجمالي</th>
                <th className="p-4">العمولة</th>
                <th className="p-4">الصافي</th>
                <th className="p-4">البوابة / الوسيلة</th>
                <th className="p-4">الغرض</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-2"></div>
                    <p>جاري تحميل سجلات الدفع...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-500">
                    لا توجد عمليات دفع مطابقة للبحث المحدد.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                    <td className="p-4 font-mono font-medium text-zinc-200 text-xs">{p.reference}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{p.userName || 'مستخدم غير معروف'}</div>
                      <div className="text-xs text-zinc-400">{p.userPhoneNumber}</div>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {p.amount.toLocaleString()} <span className="text-xs font-normal text-zinc-400">{p.currency}</span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      {p.fee > 0 ? `${p.fee.toLocaleString()} ${p.currency}` : '—'}
                    </td>
                    <td className="p-4 font-medium text-emerald-400">
                      {p.netAmount.toLocaleString()} <span className="text-xs font-normal text-zinc-400">{p.currency}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-medium text-zinc-200">{p.provider}</div>
                      <div className="text-xs text-zinc-400">{p.paymentMethod}</div>
                    </td>
                    <td className="p-4 text-xs text-zinc-300">{p.purpose}</td>
                    <td className="p-4">{getStatusBadge(p.status)}</td>
                    <td className="p-4 text-xs text-zinc-400 font-mono">
                      {new Date(p.createdAt).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/payments/${p.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                      >
                        تفاصيل
                      </Link>
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
            إجمالي السجلات: <span className="font-semibold text-white">{totalCount}</span>
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
    </div>
  );
}
