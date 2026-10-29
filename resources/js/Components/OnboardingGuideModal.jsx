import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    X,
    QrCode,
    Users,
    Send,
    MessageSquare,
    Sparkles,
    Code2,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Lightbulb,
    ExternalLink,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ModalPortal from './ui/ModalPortal';

export default function OnboardingGuideModal({ isOpen, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const steps = [
        {
            title: '1. Tautkan Nomor WhatsApp Anda',
            subtitle: 'Tersedia Dual Server: Server 1 (Jalur Cepat) atau Server 2 (Jalur Stabil)',
            icon: QrCode,
            color: 'navy',
            description:
                'Buka menu Perangkat WhatsApp atau klik tombol Pindai QR. Pilih server WhatsApp yang Anda inginkan (Server 1 atau Server 2), buka aplikasi WhatsApp di ponsel Anda > Perangkat Tertaut > Tautkan Perangkat, lalu scan QR Code yang muncul di layar dalam hitungan detik.',
            actionLabel: 'Buka Menu Perangkat',
            actionHref: '/devices',
            tip: 'Gunakan Server 1 untuk respon pengiriman kilat atau Server 2 untuk stabilitas sesi jangka panjang.',
        },
        {
            title: '2. Kelola Kontak & Buat Grup CRM',
            subtitle: 'Impor ribuan kontak CSV dengan otomatisasi format internasional E.164',
            icon: Users,
            color: 'navy',
            description:
                'Unggah file CSV kontak Anda melalui menu Buku Kontak. Sistem secara otomatis menormalisasi awalan 08xx menjadi +628xx dan memvalidasi keabsahan nomor. Anda dapat mengelompokkan pelanggan ke grup "Pelanggan VIP", "Mahasiswa", atau "Lead Penjualan".',
            actionLabel: 'Buka Buku Kontak',
            actionHref: '/contacts',
            tip: 'Setiap kontak dapat disimpan dengan atribut Nama, Email, dan Grup untuk memudahkan personalisasi pesan broadcast.',
        },
        {
            title: '3. Kirim Broadcast Massal Anti-Ban',
            subtitle: 'Didukung Spintax dinamis, delay acak, dan penjadwalan masa depan',
            icon: Send,
            color: 'gold',
            description:
                'Buat pesan unik menggunakan spintax {Halo|Hai|Selamat pagi} {{nama}}. Atur jeda pengiriman (misal 8 s/d 18 detik per pesan) untuk menghindari deteksi spam WhatsApp. Anda juga dapat menjadwalkan pengiriman pada jam dan tanggal tertentu secara otomatis.',
            actionLabel: 'Buat Broadcast Baru',
            actionHref: '/broadcast',
            tip: 'Fitur Spintax membuat setiap penerima mendapatkan variasi kata yang berbeda sehingga probabilitas pemblokiran berkurang hingga 95%.',
        },
        {
            title: '4. Kotak Masuk Live Chat & Bot Gemini AI',
            subtitle: 'Interaksi pelanggan 2 arah secara realtime dan balasan cerdas otomatis',
            icon: MessageSquare,
            color: 'navy',
            description:
                'Pantau percakapan masuk dari semua pelanggan di satu tempat melalui menu Kotak Masuk. Anda dapat membalas manual dengan Canned Response atau mengaktifkan Auto-Reply dengan aturan kata kunci dan AI Gemini untuk menjawab FAQ 24/7 tanpa henti.',
            actionLabel: 'Buka Kotak Masuk',
            actionHref: '/inbox',
            tip: 'Anda dapat menguji respon bot AI langsung di halaman Auto-Reply menggunakan widget simulator percakapan interaktif.',
        },
        {
            title: '5. Integrasikan REST API & Webhooks',
            subtitle: 'Kirim OTP, notifikasi pembayaran, dan receipt otomatis dari backend Anda',
            icon: Code2,
            color: 'gold',
            description:
                'Integrasikan sistem website, toko online, atau aplikasi kampus Anda dengan REST API kami. Download koleksi Postman siap pakai, gunakan API Key yang tersedia di dashboard, dan daftarkan URL Webhook untuk menerima status pesan secara realtime.',
            actionLabel: 'Dokumentasi REST API',
            actionHref: '/api-access',
            tip: 'Tersedia endpoint lengkap untuk pengiriman pesan teks, gambar, dokumen PDF faktur, hingga status pengiriman webhook.',
        },
    ];

    const current = steps[currentStep];
    const Icon = current.icon;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                onClick={onClose}
            >
                <div
                    className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] my-auto text-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Panduan Interaktif MARDIRA WA
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Langkah mudah mengoperasikan WhatsApp Gateway & CRM
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="px-6 pt-4 pb-2 flex items-center gap-1.5 border-b border-slate-100 bg-white">
                    {steps.map((s, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentStep(idx)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                                currentStep === idx
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : idx < currentStep
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Langkah {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-5 overflow-y-auto">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <Badge variant={current.color === 'gold' ? 'amber' : 'emerald'} className="text-[10px]">
                                LANGKAH {currentStep + 1} DARI {steps.length}
                            </Badge>
                            <h4 className="text-base font-black text-slate-900 tracking-tight">
                                {current.title}
                            </h4>
                            <p className="text-xs font-semibold text-slate-600">
                                {current.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                        {current.description}
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Tips Profesional: </span>
                            {current.tip}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        className="text-xs font-bold"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        <span>Sebelumnya</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Link href={current.actionHref} onClick={onClose}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-bold border-slate-200 text-emerald-700 hover:border-emerald-600"
                            >
                                <span>{current.actionLabel}</span>
                                <ExternalLink className="w-3 h-3 ml-1 text-emerald-600" />
                            </Button>
                        </Link>

                        {currentStep < steps.length - 1 ? (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                            >
                                <span>Lanjut</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-1 text-white" />
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onClose}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" />
                                <span>Saya Siap Memulai!</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </ModalPortal>
    );
}
