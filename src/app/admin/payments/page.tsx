'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { financialAdminApi } from '@/api/financialAdmin';
import { AdminPaymentListItemDto } from '@/types/financial';
import {
  CreditCard,
  Scale,
  Landmark,
  Wallet,
  CircleDollarSign,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Check,
  User,
  Phone,
  ArrowUpRight,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentListItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick stats computed from current view
  const succeededCount = payments.filter((p) => p.status === 'Succeeded' || p.status === 'Completed').length;
  const pendingCount = payments.filter((p) => p.status === 'Pending' || p.status === 'Processing').length;
  const refundedCount = payments.filter((p) => p.status === 'Refunded').length;
  const totalVolumeInView = payments
    .filter((p) => p.status === 'Succeeded' || p.status === 'Completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Succeeded':
      case 'Completed':
        return (
          <span className="px-2.5 py-1 text-xs font-black rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ناجحة ✓</span>
          </span>
        );
      case 'Pending':
      case 'Processing':
        return (
          <span className="px-2.5 py-1 text-xs font-black rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>قيد الانتظار</span>
          </span>
        );
      case 'Failed':
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 text-xs font-black rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>فشلت</span>
          </span>
        );
      case 'Refunded':
        return (
          <span className="px-2.5 py-1 text-xs font-black rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>مستردة</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-white/10">
            {st}
          </span>
        );
    }
  };

  const getPurposeLabel = (pur: string) => {
    switch (pur) {
      case 'WalletDeposit':
        return 'شحن محفظة';
      case 'Advertising':
        return 'حملة إعلانية';
      case 'Verification':
        return 'توثيق حساب';
      case 'Marketplace':
        return 'ترويج إعلان';
      case 'Carpool':
      case 'RideFare':
        return 'رحلة عربية رايحة';
      default:
        return pur || 'معاملة مالية';
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
            <span className="text-white font-black">سجل المدفوعات والعمليات المالية</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
              <span>سجل العمليات</span>
            </span>
            <Link
              href="/admin/payments/reconciliation"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>المطابقة المالية</span>
            </Link>
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

        {/* Hero Header with Glowing Border */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-blue-950/40 to-slate-900/95 border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الدفتر المحاسبي والتدقيق المالي</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                <span>سجل المدفوعات والعمليات المالية</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                متابعة فورية ودقيقة لجميع العمليات الصادرة والواردة عبر بوابات الدفع (Paymob، إنستاباي، فوري) ومحافظ المستخدمين مع تتبع المعرفات والعمولات وتفاصيل الاسترداد.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={loadPayments}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition shadow-sm w-full sm:w-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث السجل</span>
              </button>
              <Link
                href="/admin/payments/reconciliation"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-600/25 border border-amber-400/30 transition w-full sm:w-auto"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>المطابقة المالية</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Glowing Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 p-4.5 rounded-2xl shadow-lg transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>إجمالي العمليات</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">سجل مالي مسجل في النظام</div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/50 p-4.5 rounded-2xl shadow-lg shadow-emerald-500/5 transition">
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
              <span>ناجحة ومحصلة</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {totalVolumeInView.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span>
            </div>
            <div className="text-[11px] text-emerald-500 mt-1 font-bold">{succeededCount} عملية ناجحة بالصفحة</div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/50 p-4.5 rounded-2xl shadow-lg shadow-amber-500/5 transition">
            <div className="flex items-center justify-between text-xs text-amber-400 mb-2">
              <span>قيد الانتظار والمعالجة</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">بانتظار إشعار البوابة (Webhook)</div>
          </div>

          <div className="bg-slate-900/80 border border-purple-500/20 hover:border-purple-500/50 p-4.5 rounded-2xl shadow-lg shadow-purple-500/5 transition">
            <div className="flex items-center justify-between text-xs text-purple-400 mb-2">
              <span>مستردة ومعادة</span>
              <RotateCcw className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">{refundedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">تسوية محاسبية مستردة</div>
          </div>
        </div>

        {/* Filter Bar */}
        <form
          onSubmit={handleFilterSubmit}
          className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 shadow-xl space-y-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>فلاتر البحث والتدقيق المالي</span>
            </div>
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
              className="text-xs text-slate-400 hover:text-cyan-300 transition underline"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">بحث عام</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="المرجع، العميل، الهاتف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">البوابة / المزود</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">جميع البوابات</option>
                <option value="Paymob">Paymob (بطاقات ومحافظ)</option>
                <option value="Fawry">Fawry (كود دفع)</option>
                <option value="Manual">تحويل يدوي / إنستاباي</option>
                <option value="Wallet">المحفظة الإلكترونية الداخلية</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">وسيلة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">جميع الوسائل</option>
                <option value="Card">بطاقة بنكية (Visa/Mastercard)</option>
                <option value="MobileWallet">محفظة هاتف (فودافون/أورنج/اتصالات)</option>
                <option value="InstaPay">إنستاباي (InstaPay)</option>
                <option value="BankTransfer">تحويل بنكي</option>
                <option value="WalletBalance">رصيد المحفظة</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">جميع الحالات</option>
                <option value="Succeeded">ناجحة (Succeeded)</option>
                <option value="Pending">قيد الانتظار (Pending)</option>
                <option value="Processing">قيد المعالجة (Processing)</option>
                <option value="Failed">فشلت (Failed)</option>
                <option value="Refunded">مستردة (Refunded)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">الغرض</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">جميع الأغراض</option>
                <option value="WalletDeposit">شحن محفظة</option>
                <option value="Advertising">حملة إعلانية</option>
                <option value="Verification">توثيق حساب أو صفحة</option>
                <option value="Marketplace">ترويج إعلان</option>
                <option value="Carpool">عربية رايحة</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="submit"
              className="px-6 py-2 text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition shadow-lg shadow-cyan-600/20 active:scale-95"
            >
              تطبيق الفلترة والبحث
            </button>
          </div>
        </form>

        {/* Payments Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-white/10">
                <tr>
                  <th className="p-4">المرجع</th>
                  <th className="p-4">العميل والمستخدم</th>
                  <th className="p-4">المبلغ الإجمالي</th>
                  <th className="p-4">الرسوم</th>
                  <th className="p-4">الصافي</th>
                  <th className="p-4">البوابة / الوسيلة</th>
                  <th className="p-4">الغرض</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent mb-3" />
                      <p className="font-bold">جاري تحميل سجلات الدفع...</p>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500">
                      لا توجد عمليات دفع مطابقة لمعايير البحث المحددة.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-cyan-500/[0.04] transition group">
                      {/* Reference */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-bold">
                          <span>{p.reference}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.reference, p.id + '-ref')}
                            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white"
                            title="نسخ المرجع"
                          >
                            {copiedId === p.id + '-ref' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div className="font-bold text-white group-hover:text-cyan-300 transition">
                          {p.userName || 'مستخدم المنصة'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.userPhoneNumber || '—'}</div>
                      </td>

                      {/* Gross Amount */}
                      <td className="p-4 font-black text-white text-sm font-mono">
                        {p.amount.toLocaleString()}{' '}
                        <span className="text-[10px] font-bold text-cyan-400">{p.currency || 'EGP'}</span>
                      </td>

                      {/* Fee */}
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {p.fee > 0 ? `${p.fee.toLocaleString()} ${p.currency || 'EGP'}` : '0'}
                      </td>

                      {/* Net Amount */}
                      <td className="p-4 font-black text-emerald-400 font-mono text-sm">
                        {p.netAmount.toLocaleString()}{' '}
                        <span className="text-[10px] font-bold text-emerald-500">{p.currency || 'EGP'}</span>
                      </td>

                      {/* Provider & Method */}
                      <td className="p-4">
                        <div className="font-bold text-white text-[11px]">{p.provider}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{p.paymentMethod}</div>
                      </td>

                      {/* Purpose */}
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-white/10 text-[11px] font-semibold">
                          {getPurposeLabel(p.purpose)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">{getStatusBadge(p.status)}</td>

                      {/* Date */}
                      <td className="p-4 text-[11px] text-slate-400 font-mono">
                        {new Date(p.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-center">
                        <Link
                          href={`/admin/payments/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition shadow-sm group-hover:border-cyan-500/40"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>التفاصيل</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              إجمالي السجلات: <span className="font-black text-white">{totalCount}</span> عملية مسجلة
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-white font-bold transition flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <span className="px-3 py-1.5 bg-slate-950 rounded-xl text-cyan-300 font-mono font-bold border border-white/5">
                صفحة {page} من {Math.ceil(totalCount / pageSize) || 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= totalCount}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-white font-bold transition flex items-center gap-1"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
