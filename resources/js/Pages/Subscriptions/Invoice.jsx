import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft, CheckCircle2, QrCode, Download, ShieldCheck } from 'lucide-react';

export default function Invoice({ payment, workspace }) {
    const handlePrint = () => {
        window.print();
    };

    const isPaid = payment.status === 'paid' || payment.status === 'approved';

    return (
        <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4 font-sans text-slate-800 antialiased print:bg-white print:py-0 print:px-0">
            <Head title={`Faktur Resmi ${payment.invoice_number} — Politeknik Mardira Indonesia`} />

            {/* Print Header Bar (Hidden in Print Mode) */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <Link
                    href="/subscriptions"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Paket & Langganan</span>
                </Link>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePrint}
                    className="btn-press inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
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
                className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-12 print:border-none print:shadow-none print:p-0 space-y-8"
            >
                {/* Official Letterhead (Kop Kampus) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-emerald-600 pb-6">
                    <div className="flex items-center gap-3.5">
                        <div className="h-16 w-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            <img
                                src="/images/logo-mardira.jpg"
                                alt="Politeknik Mardira Indonesia"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-emerald-700 tracking-tight uppercase">
                                POLITEKNIK MARDIRA INDONESIA
                            </h2>
                            <p className="text-xs font-bold text-slate-600">
                                Pusat Inovasi Teknologi & WhatsApp Gateway Enterprise
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Jl. Soekarno Hatta No. 211, Bandung | Telp: (022) 5202863 | https://pm.ac.id
                            </p>
                        </div>
                    </div>

                    <div className="sm:text-right">
                        <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                            FAKTUR KUITANSI RESMI
                        </div>
                        <div className="font-mono text-base font-black text-slate-900 mt-0.5">
                            {payment.invoice_number}
                        </div>
                        <div className="text-[11px] text-slate-500">
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
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                            DITAGIHKAN KEPADA:
                        </span>
                        <div className="font-black text-slate-900 text-sm">{workspace.name}</div>
                        <div className="text-slate-600 mt-0.5">Penanggung Jawab: {workspace.phone || '+6281234567890'}</div>
                        <div className="text-slate-500">Workspace ID: #{workspace.id}</div>
                    </div>

                    <div className="sm:text-right space-y-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                            METODE & STATUS BAYAR:
                        </span>
                        <div className="font-bold text-slate-800">
                            Metode: <span className="uppercase text-emerald-700 font-mono">{payment.payment_method === 'qris' ? 'QRIS Instan' : payment.payment_method === 'bca_va' ? 'BCA Virtual Account' : 'Transfer Bank'}</span>
                        </div>
                        <div>
                            Status: <strong className={isPaid ? 'text-emerald-700' : 'text-amber-600'}>{isPaid ? 'LUNAS (TERVERIFIKASI)' : 'BELUM DIBAYAR'}</strong>
                        </div>
                        {payment.paid_at && (
                            <div className="text-[11px] text-slate-500">
                                Waktu Bayar: {new Date(payment.paid_at).toLocaleString('id-ID')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                        <thead className="bg-emerald-600 text-white text-[11px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Deskripsi Layanan SaaS</th>
                                <th className="py-3 px-4">Durasi Kontrak</th>
                                <th className="py-3 px-4">Alokasi Kuota</th>
                                <th className="py-3 px-4 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            <tr>
                                <td className="py-4 px-4 font-bold text-slate-900">
                                    {payment.plan?.name || 'Paket Enterprise Pro'}
                                    <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                                        Dual Server WhatsApp (Server 1 & 2), REST API Bearer Token & Multi-Device
                                    </span>
                                </td>
                                <td className="py-4 px-4 font-medium">30 Hari Kalender</td>
                                <td className="py-4 px-4 font-mono font-bold text-emerald-700">
                                    +{payment.plan?.limits?.monthly_message_quota?.toLocaleString('id-ID') || '50.000'} Pesan
                                </td>
                                <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                                    Rp {parseInt(payment.amount).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-semibold">
                            <tr>
                                <td colSpan="3" className="py-2.5 px-4 text-slate-600 text-right">Subtotal:</td>
                                <td className="py-2.5 px-4 text-right font-mono">Rp {parseInt(payment.amount).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td colSpan="3" className="py-2 px-4 text-slate-600 text-right">PPN (Layanan Pendidikan/Kampus):</td>
                                <td className="py-2 px-4 text-right font-mono text-emerald-700">Rp 0 (Bebas PPN)</td>
                            </tr>
                            <tr className="border-t border-slate-300 font-black text-sm text-slate-900 bg-emerald-50/50">
                                <td colSpan="3" className="py-3 px-4 text-right">TOTAL PEMBAYARAN:</td>
                                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                                    Rp {parseInt(payment.amount).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Stempel & Verification Seal */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-center shrink-0">
                            <QrCode className="w-10 h-10 text-emerald-700" />
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight">
                            <strong className="block text-slate-800 text-[11px]">Verifikasi Dokumen Digital</strong>
                            Dokumen ini diterbitkan secara otomatis dan sah menurut hukum IT tanpa tanda tangan basah fisik.
                        </div>
                    </div>

                    {isPaid && (
                        <div className="border-2 border-emerald-600 rounded-xl px-4 py-2 text-center bg-emerald-50/50 transform -rotate-2">
                            <div className="font-black text-emerald-700 tracking-widest text-sm uppercase">
                                ★ LUNAS ★
                            </div>
                            <div className="text-[9px] font-bold text-emerald-700/80 uppercase">
                                POLITEKNIK MARDIRA INDONESIA
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Notes */}
                <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                    Terima kasih atas kepercayaan Anda menggunakan layanan WhatsApp Gateway Enterprise Politeknik Mardira Indonesia.
                </div>
            </motion.div>
        </div>
    );
}
