'use client';

import React, { useState, useEffect } from 'react';
import { financialAdminApi } from '@/api/financialAdmin';
import { AdminWalletListItemDto, AdminLedgerEntryDto } from '@/types/financial';

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<AdminWalletListItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [isLockedFilter, setIsLockedFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Selected wallet drawer state
  const [selectedWallet, setSelectedWallet] = useState<AdminWalletListItemDto | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<AdminLedgerEntryDto[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'transactions' | 'ledger'>('info');

  // Adjustment Modal State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustWalletTarget, setAdjustWalletTarget] = useState<AdminWalletListItemDto | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [isCredit, setIsCredit] = useState(true);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Lock/Unlock Modal State
  const [lockOpen, setLockOpen] = useState(false);
  const [lockReason, setLockReason] = useState('إيقاف احترازي بواسطة إدارة الحسابات');
  const [lockSubmitting, setLockSubmitting] = useState(false);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const res = await financialAdminApi.getWallets({
        search: search || undefined,
        isLocked: isLockedFilter === '' ? undefined : isLockedFilter === 'true',
        page,
        pageSize,
      });
      setWallets(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadWallets();
  };

  const handleOpenDrawer = async (w: AdminWalletListItemDto) => {
    setSelectedWallet(w);
    setActiveTab('info');
    try {
      const [txs, ledgers] = await Promise.all([
        financialAdminApi.getWalletTransactions(w.userId, 1, 20),
        financialAdminApi.getWalletLedger(w.userId, 1, 20),
      ]);
      setTransactions(txs);
      setLedgerEntries(ledgers);
    } catch (err) {
      console.error('Failed to load wallet details:', err);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustWalletTarget) return;

    try {
      setAdjustSubmitting(true);
      await financialAdminApi.adjustWallet({
        userId: adjustWalletTarget.userId,
        amount: parseFloat(adjustAmount),
        isCredit,
        reason: adjustReason,
      });
      alert('تم تنفيذ التسوية اليدوية بنجاح، وترحيل قيود الأستاذ العام وتسجيل سجل التدقيق.');
      setAdjustOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
      loadWallets();
      if (selectedWallet?.userId === adjustWalletTarget.userId) {
        handleOpenDrawer(adjustWalletTarget);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشلت عملية التسوية.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedWallet) return;
    try {
      setLockSubmitting(true);
      if (selectedWallet.isLocked) {
        await financialAdminApi.unlockWallet(selectedWallet.userId, 'تم إعادة تنشيط المحفظة بعد المراجعة');
        alert('تم إلغاء قفل المحفظة بنجاح.');
      } else {
        await financialAdminApi.lockWallet(selectedWallet.userId, lockReason);
        alert('تم قفل المحفظة بنجاح.');
      }
      setLockOpen(false);
      loadWallets();
      setSelectedWallet((prev) => (prev ? { ...prev, isLocked: !prev.isLocked, status: !prev.isLocked ? 'Locked' : 'Active' } : null));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشل تحديث حالة القفل.');
    } finally {
      setLockSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة محافظ المستخدمين والأرصدة</h1>
          <p className="text-sm text-zinc-400 mt-1">متابعة دقيقة للأرصدة المتاحة، المعلقة، المقفولة، وإجراء التسويات المحاسبية المعيارية</p>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="بحث باسم المستخدم، رقم الهاتف، أو معرف المحفظة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={isLockedFilter}
            onChange={(e) => setIsLockedFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">جميع الحالات</option>
            <option value="false">نشطة (غير مقفلة)</option>
            <option value="true">مقفلة / معلقة</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-2 text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl transition"
        >
          بحث
        </button>
      </form>

      {/* Wallets Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-zinc-950/60 text-zinc-400 text-xs font-semibold uppercase border-b border-zinc-800">
              <tr>
                <th className="p-4">المستخدم</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">الرصيد المتاح</th>
                <th className="p-4">الرصيد المعلق</th>
                <th className="p-4">الرصيد المقفول</th>
                <th className="p-4">إجمالي الرصيد</th>
                <th className="p-4">نقاط المكافآت</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-2"></div>
                    <p>جاري تحميل محافظ المستخدمين...</p>
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500">
                    لا توجد محافظ مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-zinc-800/30 transition">
                    <td className="p-4 font-medium text-white">{w.userName || 'مستخدم غير مسمى'}</td>
                    <td className="p-4 font-mono text-xs text-zinc-400">{w.userPhoneNumber}</td>
                    <td className="p-4 font-semibold text-emerald-400">
                      {w.availableBalance.toLocaleString()} <span className="text-xs font-normal text-zinc-400">{w.currency}</span>
                    </td>
                    <td className="p-4 text-amber-400 font-medium">
                      {w.pendingBalance > 0 ? `${w.pendingBalance.toLocaleString()} ${w.currency}` : '—'}
                    </td>
                    <td className="p-4 text-rose-400 font-medium">
                      {w.lockedBalance > 0 ? `${w.lockedBalance.toLocaleString()} ${w.currency}` : '—'}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {(w.availableBalance + w.pendingBalance + w.lockedBalance).toLocaleString()} <span className="text-xs font-normal text-zinc-400">{w.currency}</span>
                    </td>
                    <td className="p-4 font-mono text-zinc-300">{w.rewardPoints} نقطة</td>
                    <td className="p-4">
                      {w.isLocked ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">مقفلة 🔒</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">نشطة ✓</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDrawer(w)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                        >
                          عرض وتفاصيل
                        </button>
                        <button
                          onClick={() => {
                            setAdjustWalletTarget(w);
                            setAdjustOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 transition"
                        >
                          تسوية يدوية
                        </button>
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
            إجمالي المحافظ: <span className="font-semibold text-white">{totalCount}</span>
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

      {/* Selected Wallet Detail Drawer Modal */}
      {selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 p-0">
          <div className="bg-zinc-900 border-r border-zinc-800 w-full max-w-xl h-full p-6 overflow-y-auto space-y-6 text-right">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <button
                onClick={() => setSelectedWallet(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕ إغلاق
              </button>
              <h2 className="text-lg font-bold text-white">تفاصيل محفظة {selectedWallet.userName}</h2>
            </div>

            {/* Quick Balance Summary */}
            <div className="grid grid-cols-3 gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
              <div>
                <div className="text-xs text-zinc-400">المتاح</div>
                <div className="text-base font-bold text-emerald-400">{selectedWallet.availableBalance.toLocaleString()} {selectedWallet.currency}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">المعلق</div>
                <div className="text-base font-bold text-amber-400">{selectedWallet.pendingBalance.toLocaleString()} {selectedWallet.currency}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">المقفول</div>
                <div className="text-base font-bold text-rose-400">{selectedWallet.lockedBalance.toLocaleString()} {selectedWallet.currency}</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAdjustWalletTarget(selectedWallet);
                  setAdjustOpen(true);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
              >
                إنشاء تسوية يدوية (Adjustment)
              </button>
              <button
                onClick={() => setLockOpen(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedWallet.isLocked
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {selectedWallet.isLocked ? 'إلغاء قفل المحفظة' : 'قفل المحفظة احترازياً'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-2 px-4 font-medium transition ${activeTab === 'info' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-400'}`}
              >
                المعلومات الأساسية
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`pb-2 px-4 font-medium transition ${activeTab === 'transactions' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-400'}`}
              >
                المعاملات الأخيرة ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`pb-2 px-4 font-medium transition ${activeTab === 'ledger' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-400'}`}
              >
                قيود الأستاذ العام ({ledgerEntries.length})
              </button>
            </div>

            {/* Tab: Info */}
            {activeTab === 'info' && (
              <div className="space-y-3 text-xs bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">معرف المحفظة:</span>
                  <span className="font-mono text-zinc-200">{selectedWallet.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">معرف المستخدم:</span>
                  <span className="font-mono text-zinc-200">{selectedWallet.userId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">رقم الهاتف:</span>
                  <span className="text-zinc-200 font-mono">{selectedWallet.userPhoneNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">حالة القفل:</span>
                  <span className={selectedWallet.isLocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedWallet.isLocked ? 'مقفلة' : 'غير مقفلة'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">آخر تحديث:</span>
                  <span className="text-zinc-300 font-mono">{selectedWallet.updatedAt ? new Date(selectedWallet.updatedAt).toLocaleString('ar-EG') : '—'}</span>
                </div>
              </div>
            )}

            {/* Tab: Transactions */}
            {activeTab === 'transactions' && (
              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">لا توجد حركات مسجلة للمحفظة.</p>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-white">{t.transactionType}</span>
                        <span className={t.balanceAfter >= t.balanceBefore ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.balanceAfter >= t.balanceBefore ? '+' : '-'}{t.amount.toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="text-zinc-400 text-[11px]">{t.description}</div>
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-1">
                        <span>الرصيد بعد: {t.balanceAfter.toLocaleString()} ج.م</span>
                        <span>{new Date(t.createdAt).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Ledger */}
            {activeTab === 'ledger' && (
              <div className="space-y-2">
                {ledgerEntries.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">لا توجد قيود أستاذ مباشرة مسجلة.</p>
                ) : (
                  ledgerEntries.map((l) => (
                    <div key={l.id} className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-zinc-300">{l.accountCode} - {l.accountName}</span>
                        <span className={l.credit > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {l.credit > 0 ? `دائن: ${l.credit.toLocaleString()}` : `مدين: ${l.debit.toLocaleString()}`} ج.م
                        </span>
                      </div>
                      <div className="text-zinc-400 text-[11px]">{l.description}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(l.createdAt).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal (Double-Entry + Audit Log) */}
      {adjustOpen && adjustWalletTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white">تسوية رصيد يدوية (Manual Adjustment)</h3>
            <p className="text-xs text-zinc-400">
              تنبيه: التعديل المباشر للأرصدة محظور برمجياً. هذه العملية تنشئ حركة مالية رسمية في المحفظة، قيوداً مزدوجة في الأستاذ العام، وسجل تدقيق إداري دائم.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">نوع التسوية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCredit(true)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      isCredit
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    إيداع / تعويض (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCredit(false)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      !isCredit
                        ? 'bg-rose-600/20 border-rose-500 text-rose-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    خصم / تصحيح (Debit)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">المبلغ (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="مثال: 150.00"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">سبب التسوية وتبرير الإدارة</label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="اكتب التبرير المحاسبي والإداري بالتفصيل..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAdjustOpen(false)}
                  disabled={adjustSubmitting}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/20"
                >
                  {adjustSubmitting ? 'جاري التنفيذ...' : 'تأكيد التسوية وترحيل القيود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock/Unlock Confirm Modal */}
      {lockOpen && selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-right">
            <h3 className="text-lg font-bold text-white">
              {selectedWallet.isLocked ? 'تأكيد إلغاء قفل المحفظة' : 'تأكيد قفل المحفظة احترازياً'}
            </h3>
            <p className="text-xs text-zinc-400">
              {selectedWallet.isLocked
                ? 'سيتم استعادة القدرة على إجراء عمليات الدفع، التحويل، والسحب للمستخدم فورياً.'
                : 'سيتم منع المستخدم من أي حركات خصم أو تحويل رصيد حتى تقوم الإدارة بفك القفل.'}
            </p>

            {!selectedWallet.isLocked && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">سبب القفل</label>
                <textarea
                  rows={2}
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setLockOpen(false)}
                disabled={lockSubmitting}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleToggleLock}
                disabled={lockSubmitting}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition ${
                  selectedWallet.isLocked ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {lockSubmitting ? 'جاري المعالجة...' : 'تأكيد الإجراء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
