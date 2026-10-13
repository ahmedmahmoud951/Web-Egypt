'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { financialAdminApi } from '@/api/financialAdmin';
import { AdminPaymentDetailDto } from '@/types/financial';
import {
  CreditCard,
  Scale,
  Landmark,
  Wallet,
  CircleDollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  User,
  Phone,
  MessageCircle,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  DollarSign,
  AlertTriangle,
  History,
  FileText,
} from 'lucide-react';

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [payment, setPayment] = useState<AdminPaymentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refund Modal State
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

  const handleCopy = (text: string, copyKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(copyKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRefundSubmitting(true);
      const parsedAmount = refundAmount ? parseFloat(refundAmount) : undefined;
      await financialAdminApi.refundPayment(id, parsedAmount, refundReason);
      setRefundOpen(false);
      loadDetail();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشلت عملية الاسترداد، يرجى المحاولة لاحقاً.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Succeeded':
      case 'Completed':
        return (
          <span className="px-3 py-1.5 text-xs font-black rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>معاملة ناجحة ومحققة ✓</span>
          </span>
        );
      case 'Pending':
      case 'Processing':
        return (
          <span className="px-3 py-1.5 text-xs font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>قيد الانتظار والمعالجة</span>
          </span>
        );
      case 'Failed':
      case 'Cancelled':
        return (
          <span className="px-3 py-1.5 text-xs font-black rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>عملية فاشلة أو ملغاة</span>
          </span>
        );
      case 'Refunded':
        return (
          <span className="px-3 py-1.5 text-xs font-black rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <RotateCcw className="w-4 h-4 text-purple-400" />
            <span>مستردة بالكامل (Refunded)</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-white/10">
            {st}
          </span>
        );
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
              سجل المدفوعات
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-mono font-bold">{payment?.reference || id}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <Link
              href="/admin/payments"
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>العودة للسجل</span>
            </Link>
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
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-white/5">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-cyan-500 border-t-transparent mb-4" />
            <p className="text-sm font-bold text-white">جاري تحميل تفاصيل المعاملة المالية والقيود المحاسبية...</p>
          </div>
        ) : !payment ? (
          <div className="p-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-white/5 space-y-4">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">المعاملة المالية غير موجودة أو تم حذفها</h2>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة المدفوعات</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-blue-950/40 to-slate-900/95 border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(payment.status)}
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold">
                      {payment.provider} ({payment.paymentMethod})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
                      {payment.amount.toLocaleString()}{' '}
                      <span className="text-xl text-cyan-400 font-bold">{payment.currency || 'EGP'}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">المرجع:</span>
                      <span className="text-cyan-300 font-bold">{payment.reference}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(payment.reference, 'hero-ref')}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                        title="نسخ المرجع"
                      >
                        {copiedId === 'hero-ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {payment.providerTransactionId && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">معرف البوابة:</span>
                        <span className="text-slate-200">{payment.providerTransactionId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(payment.providerTransactionId!, 'hero-pid')}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                          title="نسخ معرف البوابة"
                        >
                          {copiedId === 'hero-pid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={loadDetail}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>تحديث المعاملة</span>
                  </button>

                  {(payment.status === 'Succeeded' || payment.status === 'Completed') && (
                    <button
                      type="button"
                      onClick={() => setRefundOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 border border-rose-400/40 transition active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إجراء استرداد مالي (Refund)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Info 3-Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Financial Breakdown */}
              <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2 font-black text-white text-sm border-b border-white/10 pb-3">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>البيانات المالية المحاسبية</span>
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">المبلغ الإجمالي المحصل:</span>
                    <span className="font-black text-white font-mono text-sm">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">عمولة المعالجة والمنصة:</span>
                    <span className="font-mono text-slate-300 font-semibold">
                      {payment.fee > 0 ? `${payment.fee.toLocaleString()} ${payment.currency}` : '0 ج.م'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-slate-400 font-bold">المبلغ الصافي المستقر:</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">
                      {payment.netAmount.toLocaleString()} {payment.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">العملة المعتمدة:</span>
                    <span className="font-bold text-cyan-300">{payment.currency || 'EGP (جنيه مصري)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">تاريخ الإتمام النهائي:</span>
                    <span className="font-mono text-slate-300">
                      {payment.completedAt ? new Date(payment.completedAt).toLocaleString('ar-EG') : 'قيد الانتظار'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Gateway & Provider Info */}
              <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2 font-black text-white text-sm border-b border-white/10 pb-3">
                  <Landmark className="w-4 h-4 text-cyan-400" />
                  <span>بوابة الدفع والربط الرقمي</span>
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">المزود (Payment Provider):</span>
                    <span className="font-bold text-white">{payment.provider}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">وسيلة الدفع المستخدمة:</span>
                    <span className="font-bold text-cyan-300">{payment.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">معرف المعاملة لدى البوابة:</span>
                    <span className="font-mono text-slate-200 text-[11px] truncate max-w-[160px]">
                      {payment.providerTransactionId || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">المرجع الداخلي:</span>
                    <span className="font-mono text-cyan-300 font-bold">{payment.reference}</span>
                  </div>
                  {payment.failureReason && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                      سبب الفشل: {payment.failureReason}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Customer & Purpose */}
              <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2 font-black text-white text-sm border-b border-white/10 pb-3">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>بيانات العميل والغرض</span>
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">اسم صاحب العملية:</span>
                    <span className="font-bold text-white">{payment.userName || 'مستخدم غير مسجل'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">رقم الهاتف:</span>
                    <div className="flex items-center gap-1.5 font-mono text-cyan-300">
                      <span>{payment.userPhoneNumber || '—'}</span>
                      {payment.userPhoneNumber && (
                        <>
                          <a
                            href={`tel:${payment.userPhoneNumber}`}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                          </a>
                          <a
                            href={`https://wa.me/${payment.userPhoneNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                            title="محادثة واتساب"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">الغرض من الدفع:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-white/10 font-bold">
                      {payment.purpose}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">تاريخ الإنشاء:</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {new Date(payment.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Double-Entry Ledger Breakdown */}
            <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-sm font-black text-white">
                    قيود الأستاذ العام للقيد المزدوج (Double-Entry Ledger)
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تطابق محاسبي متوازن</span>
                </span>
              </div>

              {payment.ledgerEntries && payment.ledgerEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3.5">رمز الحساب (Code)</th>
                        <th className="p-3.5">اسم الحساب المحاسبي</th>
                        <th className="p-3.5">مدين (Debit)</th>
                        <th className="p-3.5">دائن (Credit)</th>
                        <th className="p-3.5">البيان والشرح</th>
                        <th className="p-3.5">التوقيت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {payment.ledgerEntries.map((e) => (
                        <tr key={e.id} className="hover:bg-cyan-500/[0.04] transition">
                          <td className="p-3.5 text-cyan-300 font-bold">{e.accountCode}</td>
                          <td className="p-3.5 text-white font-sans font-bold">{e.accountName}</td>
                          <td className="p-3.5 text-rose-400 font-black">
                            {e.debit > 0 ? `${e.debit.toLocaleString()} ج.م` : '—'}
                          </td>
                          <td className="p-3.5 text-emerald-400 font-black">
                            {e.credit > 0 ? `${e.credit.toLocaleString()} ج.م` : '—'}
                          </td>
                          <td className="p-3.5 text-slate-300 font-sans">{e.description || '—'}</td>
                          <td className="p-3.5 text-slate-500 text-[11px]">
                            {new Date(e.createdAt).toLocaleTimeString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  لا توجد قيود أستاذ عام مباشرة منشأة لهذه المعاملة.
                </div>
              )}
            </div>

            {/* Audit Log Trail */}
            <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <History className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-black text-white">
                  سجل التدقيق المالي والأمني (Financial Audit Trail)
                </h2>
              </div>

              {payment.auditLogs && payment.auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {payment.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-950/70 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-black text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>{log.action}</span>
                        </div>
                        <div className="text-slate-400 pr-4">{log.reason || 'تم تنفيذ العملية وتسجيلها بنجاح'}</div>
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] sm:text-left pr-4 sm:pr-0">
                        <div>{log.adminName ? `المشرف: ${log.adminName}` : 'النظام الآلي (System)'}</div>
                        <div>{new Date(log.createdAt).toLocaleString('ar-EG')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  لا توجد سجلات تدقيق أمنية إضافية لهذه العملية.
                </div>
              )}
            </div>
          </>
        )}

        {/* Refund Modal */}
        {refundOpen && payment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 text-right shadow-[0_0_50px_rgba(244,63,94,0.25)]">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2 text-rose-400">
                  <RotateCcw className="w-5 h-5" />
                  <span>تأكيد عملية الاسترداد المالي (Refund)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setRefundOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                سيتم إرجاع المبلغ المحدد للعميل عبر بوابة الدفع وقيد عملية استرداد عكسية في الأستاذ العام وتوثيقها في سجل التدقيق الأمني.
              </p>

              <form onSubmit={handleRefundSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    مبلغ الاسترداد (الحد الأقصى: {payment.amount} {payment.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={payment.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-rose-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">سبب الاسترداد (يظهر في السجل)</label>
                  <textarea
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:border-rose-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setRefundOpen(false)}
                    disabled={refundSubmitting}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={refundSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black transition shadow-lg shadow-rose-600/30"
                  >
                    {refundSubmitting ? 'جاري التنفيذ...' : 'تأكيد وقيد الاسترداد ✓'}
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
