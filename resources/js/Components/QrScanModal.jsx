import React, { useState, useEffect } from 'react';
import { router, Link } from '@inertiajs/react';
import { X, QrCode, Smartphone, Cpu, CheckCircle2, RefreshCw, Zap, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ModalPortal from './ui/ModalPortal';

export default function QrScanModal({
    isOpen,
    onClose,
    canAddDevice = true,
    maxDevices = 1,
    currentCount = 0,
    planName = 'Starter Lite',
}) {
    if (!isOpen) return null;

    if (!canAddDevice) {
        return (
            <ModalPortal isOpen={isOpen} onClose={onClose}>
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                    onClick={onClose}
                >
                    <div
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-up my-auto text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Batas Kuota Perangkat Tercapai</h3>
                                    <p className="text-[11px] text-slate-500">Maksimal {maxDevices} perangkat untuk paket ini</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-amber-950">Paket Anda: {planName}</span>
                                <Badge variant="amber" className="text-[10px] font-bold">
                                    {currentCount || maxDevices} / {maxDevices} Terpakai (Penuh)
                                </Badge>
                            </div>
                            <p className="text-xs text-amber-900 leading-relaxed">
                                Paket langganan Anda saat ini hanya mendukung <strong>maksimal {maxDevices} perangkat WhatsApp</strong>. Anda telah menautkan {currentCount || maxDevices} perangkat aktif.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5 text-xs text-slate-700">
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                <span>Tingkatkan ke Enterprise Pro untuk:</span>
                            </p>
                            <ul className="space-y-1.5 text-[11px] text-slate-600 pl-1">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Tautkan <strong>hingga 5 perangkat WhatsApp</strong> secara bersamaan</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong>50.000 kuota pesan</strong> per bulan dengan latensi super cepat</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Integrasi Webhook & REST API tanpa batasan kuota perangkat</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="text-xs h-9 px-4 rounded-lg"
                            >
                                Tutup
                            </Button>
                            <Link href="/subscriptions">
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg shadow-xs flex items-center gap-1.5"
                                >
                                    <span>Tingkatkan Paket Sekarang</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        );
    }

    const [name, setName] = useState('Nomor CS WhatsApp');
    const [engine, setEngine] = useState('wwebjs');
    const [phone, setPhone] = useState('+628');
    const [metaPhoneId, setMetaPhoneId] = useState('');
    const [metaAccessToken, setMetaAccessToken] = useState('');
    const [metaVerifyToken, setMetaVerifyToken] = useState('bisniswa_meta_token');
    const [step, setStep] = useState('form');
    const [createdDeviceId, setCreatedDeviceId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [processing, setProcessing] = useState(false);
    const [connectedPhone, setConnectedPhone] = useState(null);
    const [isConnectingSuccess, setIsConnectingSuccess] = useState(false);

    // Auto-polling for real-time QR scan detection
    useEffect(() => {
        if (step !== 'qr' || !createdDeviceId || isConnectingSuccess) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/devices/${createdDeviceId}/status`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'connected') {
                        setIsConnectingSuccess(true);
                        setConnectedPhone(data.phone_number);
                        clearInterval(interval);
                        setTimeout(() => {
                            onClose();
                            setStep('form');
                            setIsConnectingSuccess(false);
                            router.reload({ preserveScroll: true });
                        }, 1800);
                    } else if (data.qr && data.qr !== qrCodeUrl) {
                        setQrCodeUrl(data.qr);
                    }
                }
            } catch (err) {
                // Ignore poll errors
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [step, createdDeviceId, isConnectingSuccess, qrCodeUrl]);

    const handleCreateDevice = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post(
            '/devices',
            {
                name,
                engine,
                phone_number: phone,
                meta_phone_number_id: metaPhoneId,
                meta_access_token: metaAccessToken,
                meta_verify_token: metaVerifyToken,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    if (engine === 'cloud_api') {
                        setIsConnectingSuccess(true);
                        setConnectedPhone(phone);
                        setTimeout(() => {
                            onClose();
                            setStep('form');
                            setIsConnectingSuccess(false);
                            router.reload({ preserveScroll: true });
                        }, 1200);
                        return;
                    }
                    const cd = page.props?.flash?.created_device;
                    if (cd) {
                        setCreatedDeviceId(cd.id);
                        if (cd.qr) setQrCodeUrl(cd.qr);
                    }
                    setStep('qr');
                },
                onError: (errors) => {
                    alert(Object.values(errors).flat().join('\n') || 'Gagal mendaftarkan perangkat.');
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    const handleQuickConnect = () => {
        if (!createdDeviceId) return;
        setProcessing(true);

        router.post(
            `/devices/${createdDeviceId}/connect`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsConnectingSuccess(true);
                    setTimeout(() => {
                        onClose();
                        setStep('form');
                        setIsConnectingSuccess(false);
                        router.reload({ preserveScroll: true });
                    }, 1400);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
                onClick={onClose}
            >
                <div
                    className="relative bg-white border border-slate-200/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 my-auto text-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <QrCode className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                {step === 'form' ? 'Daftarkan Gateway WhatsApp Baru' : 'Pindai QR Code WhatsApp'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {step === 'form' ? 'Pilih server WhatsApp & identitas nomor' : 'Hubungkan HP melalui tautkan perangkat'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {step === 'form' ? (
                    <form onSubmit={handleCreateDevice} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-medium text-slate-700 mb-1.5">Nama Perangkat / Label Gateway</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: CS Pendaftaran Mahasiswa Baru"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 mb-1.5">Nomor WhatsApp (Opsional)</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+628123456789"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 mb-1.5">Pilih Tipe Koneksi & Server WhatsApp</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <label
                                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all relative ${
                                        engine === 'wwebjs'
                                            ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-slate-900 text-xs">WhatsApp Web JS</span>
                                        <input
                                            type="radio"
                                            name="engine"
                                            value="wwebjs"
                                            checked={engine === 'wwebjs'}
                                            onChange={() => setEngine('wwebjs')}
                                            className="text-emerald-600 accent-emerald-600"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-tight">
                                        Engine Utama: Resmi via Headless Web, anti "menunggu pesan", enkripsi instan & sesi stabil.
                                    </p>
                                    <span className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded w-fit">
                                        ⭐ Direkomendasikan
                                    </span>
                                </label>

                                <label
                                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                                        engine === 'baileys'
                                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                                            : 'border-slate-200 hover:border-slate-300 opacity-80'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-slate-900 text-xs">Baileys Socket</span>
                                        <input
                                            type="radio"
                                            name="engine"
                                            value="baileys"
                                            checked={engine === 'baileys'}
                                            onChange={() => setEngine('baileys')}
                                            className="text-emerald-600 accent-emerald-600"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-tight">
                                        Socket langsung: Hemat RAM, namun sensitif terhadap rotasi protokol enkripsi WhatsApp.
                                    </p>
                                    <span className="mt-2 text-[10px] font-semibold text-slate-600">
                                        ⚡ Alternatif Socket
                                    </span>
                                </label>

                                <label
                                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                                        engine === 'cloud_api'
                                            ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-slate-900 text-xs">Meta Cloud API</span>
                                        <input
                                            type="radio"
                                            name="engine"
                                            value="cloud_api"
                                            checked={engine === 'cloud_api'}
                                            onChange={() => setEngine('cloud_api')}
                                            className="text-blue-600 accent-blue-600"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-tight">
                                        Resmi Meta: Mendukung List Menu popup & tombol [ ↩ ], tanpa scan QR.
                                    </p>
                                    <span className="mt-2 text-[10px] font-semibold text-blue-700">
                                        ✨ Resmi Centang Meta
                                    </span>
                                </label>
                            </div>

                            {/* Additional Meta Cloud API Fields */}
                            {engine === 'cloud_api' && (
                                <div className="mt-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3 animate-fade-in text-left">
                                    <div className="flex items-center justify-between pb-1 border-b border-blue-100">
                                        <span className="font-bold text-xs text-blue-900">Kredensial Meta Developer</span>
                                        <span className="text-[10px] text-blue-600 font-medium">developers.facebook.com</span>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Phone Number ID Meta
                                        </label>
                                        <input
                                            type="text"
                                            value={metaPhoneId}
                                            onChange={(e) => setMetaPhoneId(e.target.value)}
                                            placeholder="Contoh: 104829104829104"
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:border-blue-600 focus:outline-none"
                                            required={engine === 'cloud_api'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                            Permanent Access Token (System User / User Token)
                                        </label>
                                        <input
                                            type="password"
                                            value={metaAccessToken}
                                            onChange={(e) => setMetaAccessToken(e.target.value)}
                                            placeholder="EAAB..."
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:border-blue-600 focus:outline-none"
                                            required={engine === 'cloud_api'}
                                        />
                                    </div>
                                    <p className="text-[10px] text-blue-700 leading-relaxed">
                                        💡 <strong>Webhook URL Meta:</strong> Daftarkan URL <code>{window.location.origin}/api/webhook/meta-whatsapp</code> dengan Verify Token <code>bisniswa_meta_token</code> di Meta WhatsApp Configuration.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="rounded-lg h-9 text-xs font-medium"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 text-xs font-medium shadow-2xs"
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-white" />
                                        <span>Menghubungi Node Gateway...</span>
                                    </>
                                ) : (
                                    <span>Lanjut ke Pindai QR →</span>
                                )}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        {isConnectingSuccess ? (
                            <div className="py-6 space-y-3 animate-fade-in-up">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Perangkat Berhasil Terhubung!</h4>
                                <p className="text-xs text-slate-500 font-mono">
                                    {connectedPhone || phone || 'Nomor WhatsApp terverifikasi'}
                                </p>
                                <span className="inline-block text-[11px] text-emerald-700 font-medium">
                                    Memperbarui dashboard gateway...
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-slate-600 font-medium">Gateway Microservice:</span>
                                    </div>
                                    <strong className="font-mono uppercase font-bold text-emerald-800">
                                        {engine}
                                    </strong>
                                </div>

                                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs inline-block">
                                    {qrCodeUrl ? (
                                        <img
                                            src={qrCodeUrl}
                                            alt="WhatsApp QR Code"
                                            className="w-52 h-52 mx-auto rounded-lg object-contain"
                                        />
                                    ) : (
                                        <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                                            <span className="text-xs">Membuat QR Code WhatsApp...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 text-left bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Cara Pindai di WhatsApp HP:</span>
                                    </p>
                                    <ol className="list-decimal list-inside text-slate-600 text-[11px] space-y-0.5 leading-normal">
                                        <li>Buka WhatsApp di HP Anda</li>
                                        <li>Ketuk Menu (titik tiga) / Pengaturan &gt; <strong>Perangkat Tertaut</strong></li>
                                        <li>Ketuk <strong>Tautkan Perangkat</strong> & arahkan ke QR di atas</li>
                                    </ol>
                                    <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 pt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Deteksi otomatis aktif (otomatis terhubung saat dipindai)</span>
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleQuickConnect}
                                        disabled={processing}
                                        className="w-full h-9 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-2xs flex items-center justify-center gap-1.5"
                                    >
                                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                                        <span>Hubungkan Instan (Bypass Scan untuk Tes)</span>
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => setStep('form')}
                                        className="w-full py-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                        ← Kembali Ubah Pengaturan
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
        </ModalPortal>
    );
}
