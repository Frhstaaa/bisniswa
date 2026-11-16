import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft, QrCode } from 'lucide-react';

export default function Invoice({ payment, workspace }) {
    const handlePrint = () => {
        window.print();
    };

    const isPaid = payment.status === 'paid' || payment.status === 'approved';

    return (
        <div className="min-h-screen bg-[#f5f7fa] py-6 sm:py-10 px-4 font-sans text-[#262626] antialiased print:bg-white print:py-0 print:px-0">
            <Head title={`Faktur Resmi ${payment.invoice_number} — SAPA Alert Engine`} />

            {/* Print Header Bar (Hidden in Print Mode) */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <Link
                    href="/subscriptions"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1677ff] hover:text-[#0958d9] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Paket &amp; Langganan</span>
                </Link>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] transition-all cursor-pointer"
                >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Cetak / Unduh PDF</span>
                </motion.button>
            </div>

            {/* Invoice Sheet */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl mx-auto bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 sm:p-12 print:border-none print:shadow-none print:p-0 space-y-8"
            >
                {/* Official Letterhead */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#1677ff] pb-6">
                    <div className="flex items-center gap-3.5">
                        <img
                            src="/images/logo-icon.png"
                            alt="SAPA Icon"
                            className="h-14 w-14 object-contain shrink-0"
                        />
                        <div>
                            <h2 className="text-lg font-bold text-[#262626] tracking-tight uppercase">
                                SAPA — SISTEM AUTOMASI PESAN &amp; ALERT
                            </h2>
                            <p className="text-xs font-semibold text-[#595959]">
                                Enterprise WhatsApp Gateway &amp; Real-time Alerting Platform
                            </p>
                            <p className="text-[11px] text-[#8c8c8c]">
                                Email: billing@sapa.id | Web: https://sapa.id | Hotline: +62 838-6012-467
                            </p>
                        </div>
                    </div>

                    <div className="sm:text-right">
                        <div className="text-xs font-bold uppercase tracking-widest text-[#1677ff]">
                            FAKTUR KUITANSI RESMI
                        </div>
                        <div className="font-mono text-base font-bold text-[#262626] mt-0.5">
                            {payment.invoice_number}
                        </div>
                        <div className="text-[11px] text-[#8c8c8c]">
                            {new Date(payment.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </div>
                    </div>
                </div>

                {/* Bill To & Payment Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div>
                        <span className="font-semibold text-[#8c8c8c] uppercase tracking-wider text-[10px] block mb-1">
                            DITAGIHKAN KEPADA:
                        </span>
                        <div className="font-bold text-[#262626] text-sm">{workspace.name}</div>
                        <div className="text-[#595959] mt-0.5">Penanggung Jawab: {workspace.phone || '+6281234567890'}</div>
                        <div className="text-[#8c8c8c]">Workspace ID: #{workspace.id}</div>
                    </div>

                    <div className="sm:text-right space-y-1">
                        <span className="font-semibold text-[#8c8c8c] uppercase tracking-wider text-[10px] block mb-1">
                            METODE &amp; STATUS BAYAR:
                        </span>
                        <div className="font-semibold text-[#262626]">
                            Metode: <span className="uppercase text-[#1677ff] font-mono">{payment.payment_method === 'qris' ? 'QRIS Instan' : payment.payment_method === 'bca_va' ? 'BCA Virtual Account' : 'Transfer Bank'}</span>
                        </div>
                        <div>
                            Status: <strong className={isPaid ? 'text-[#52c41a]' : 'text-[#faad14]'}>{isPaid ? 'LUNAS (TERVERIFIKASI)' : 'BELUM DIBAYAR'}</strong>
                        </div>
                        {payment.paid_at && (
                            <div className="text-[11px] text-[#8c8c8c]">
                                Waktu Bayar: {new Date(payment.paid_at).toLocaleString('id-ID')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-[#e6ebf1] rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                        <thead className="bg-[#1677ff] text-white text-[11px] uppercase font-semibold tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Deskripsi Layanan SaaS</th>
                                <th className="py-3 px-4">Durasi Kontrak</th>
                                <th className="py-3 px-4">Alokasi Kuota</th>
                                <th className="py-3 px-4 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f0f0] text-[#595959]">
                            <tr>
                                <td className="py-4 px-4 font-bold text-[#262626]">
                                    {payment.plan?.name || 'Paket Enterprise Pro'}
                                    <span className="block text-[11px] font-normal text-[#8c8c8c] mt-0.5">
                                        SAPA UltraSync Engine, REST API Bearer Token &amp; Multi-Device
                                    </span>
                                </td>
                                <td className="py-4 px-4 font-medium">30 Hari Kalender</td>
                                <td className="py-4 px-4 font-mono font-bold text-[#1677ff]">
                                    +{payment.plan?.limits?.monthly_message_quota?.toLocaleString('id-ID') || '50.000'} Pesan
                                </td>
                                <td className="py-4 px-4 text-right font-mono font-bold text-[#262626]">
                                    Rp {parseInt(payment.amount).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-[#fafafb] border-t border-[#e6ebf1] text-xs font-semibold">
                            <tr>
                                <td colSpan="3" className="py-2.5 px-4 text-[#595959] text-right">Subtotal:</td>
                                <td className="py-2.5 px-4 text-right font-mono text-[#262626]">Rp {parseInt(payment.amount).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td colSpan="3" className="py-2 px-4 text-[#595959] text-right">PPN (Layanan SaaS):</td>
                                <td className="py-2 px-4 text-right font-mono text-[#52c41a]">Rp 0 (Bebas PPN)</td>
                            </tr>
                            <tr className="border-t border-[#d9d9d9] font-bold text-sm text-[#262626] bg-[#e6f4ff]/50">
                                <td colSpan="3" className="py-3 px-4 text-right">TOTAL PEMBAYARAN:</td>
                                <td className="py-3 px-4 text-right font-mono text-[#1677ff]">
                                    Rp {parseInt(payment.amount).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Stempel & Verification Seal */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-[#f0f0f0]">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-[#fafafb] border border-[#e6ebf1] rounded-xl p-1 flex items-center justify-center shrink-0">
                            <QrCode className="w-10 h-10 text-[#1677ff]" />
                        </div>
                        <div className="text-[10px] text-[#8c8c8c] leading-tight">
                            <strong className="block text-[#262626] text-[11px]">Verifikasi Dokumen Digital</strong>
                            Dokumen ini diterbitkan secara otomatis dan sah menurut hukum IT tanpa tanda tangan basah fisik.
                        </div>
                    </div>

                    {isPaid && (
                        <div className="border-2 border-[#52c41a] rounded-xl px-4 py-2 text-center bg-[#f6ffed] transform -rotate-2">
                            <div className="font-bold text-[#52c41a] tracking-widest text-sm uppercase">
                                ★ LUNAS ★
                            </div>
                            <div className="text-[9px] font-bold text-[#52c41a]/80 uppercase">
                                SAPA ALERT SYSTEM
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Notes */}
                <div className="text-center text-[10px] text-[#8c8c8c] pt-4 border-t border-[#f0f0f0]">
                    Terima kasih atas kepercayaan Anda menggunakan layanan SAPA (Sistem Automasi Pesan &amp; Alert).
                </div>
            </motion.div>
        </div>
    );
}
