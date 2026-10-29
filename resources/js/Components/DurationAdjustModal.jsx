import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, Calendar, Clock, ShieldAlert } from 'lucide-react';
import ModalPortal from './ui/ModalPortal';

export default function DurationAdjustModal({ isOpen, onClose, subscriptionId, currentEndDate }) {
    const { props } = usePage();
    const isSuperAdmin = props?.auth?.user?.role === 'superadmin';

    if (!isOpen || !isSuperAdmin) return null;

    const [days, setDays] = useState(30);
    const [reason, setReason] = useState('');
    const [isCustomDate, setIsCustomDate] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(currentEndDate ? currentEndDate.split('T')[0] : '');
    const [processing, setProcessing] = useState(false);

    const handleQuickAdd = (addDays) => {
        setDays(addDays);
        setReason(`Penambahan ${addDays} hari langganan oleh Super Admin.`);
        setIsCustomDate(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        if (isCustomDate) {
            router.post('/subscriptions/set-custom-dates', {
                subscription_id: subscriptionId,
                start_date: customStartDate,
                end_date: customEndDate,
                reason: reason || 'Penyesuaian tanggal manual oleh Super Admin',
            }, {
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                }
            });
        } else {
            router.post('/subscriptions/adjust-duration', {
                subscription_id: subscriptionId,
                days: parseInt(days),
                reason: reason || `Perpanjangan masa aktif ${days} hari`,
            }, {
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                }
            });
        }
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                onClick={onClose}
            >
                <div
                    className="relative bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto text-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#0f172a]">Atur Masa Aktif Langganan</h3>
                                <p className="text-xs text-[#64748b]">Kontrol durasi kontrak & grace period (Super Admin)</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        {/* Mode Toggle */}
                        <div className="flex bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0]">
                            <button
                            type="button"
                            onClick={() => setIsCustomDate(false)}
                            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${!isCustomDate ? 'bg-white text-emerald-700 shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'}`}
                        >
                            Quick Adjust (+/- Hari)
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCustomDate(true)}
                            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${isCustomDate ? 'bg-white text-emerald-700 shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'}`}
                        >
                            Pilih Tanggal Kalender
                        </button>
                    </div>

                    {!isCustomDate ? (
                        <div className="space-y-3">
                            <label className="block font-semibold text-[#334155]">Pilihan Cepat Tambah Durasi Hari</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[7, 30, 90, 365].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => handleQuickAdd(d)}
                                        className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all ${
                                            days === d
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                        }`}
                                    >
                                        +{d >= 365 ? '1 Tahun' : `${d} Hari`}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2">
                                <label className="block font-semibold text-[#334155] mb-1">Jumlah Hari Kustom</label>
                                <input
                                    type="number"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs font-mono focus:border-emerald-600 focus:outline-none"
                                    placeholder="Contoh: 14 atau -5"
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-[#334155] mb-1">Tanggal Mulai (Starts At)</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs font-mono focus:border-emerald-600 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-[#334155] mb-1">Tanggal Berakhir (Ends At)</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs font-mono focus:border-emerald-600 focus:outline-none"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block font-semibold text-[#334155] mb-1">Alasan Penyesuaian (Audit Log Wajib)</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Contoh: Pembayaran invoice #INV-992 atau kompensasi maintenance"
                            className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-xs focus:border-emerald-600 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="p-3 bg-[#fffbeb] border border-[#fef3c7] rounded-xl flex items-start gap-2.5 text-[#d97706]">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-[#64748b]">
                            Tindakan ini dicatat permanen dalam riwayat audit log untuk transparansi penagihan.
                        </p>
                    </div>

                    <div className="pt-3 border-t border-[#e2e8f0] flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold text-[#334155] hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-press px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </ModalPortal>
    );
}
