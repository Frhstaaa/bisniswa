import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../../Layouts/AppLayout';
import {
    Settings,
    Shield,
    Server,
    CreditCard,
    Zap,
    Lock,
    Save,
    CheckCircle2,
    Sliders,
    Building2,
    AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';
import { Separator } from '../../../Components/ui/separator';

export default function SettingsIndex({ settings }) {
    const general = settings.general || {};
    const whatsapp = settings.whatsapp || {};
    const throttle = settings.throttle || {};
    const payment = settings.payment || {};

    const [activeTab, setActiveTab] = useState('general');

    const form = useForm({
        settings: {
            platform_name: general.platform_name?.value || 'MARDIRA WA Gateway',
            organization_name: general.organization_name?.value || 'Politeknik Mardira Indonesia',
            support_phone: general.support_phone?.value || '+6281298430911',
            support_email: general.support_email?.value || 'helpdesk@mardira.ac.id',
            maintenance_mode: general.maintenance_mode?.value === 'true',

            whatsapp_gateway_endpoint: whatsapp.whatsapp_gateway_endpoint?.value || 'http://127.0.0.1:3000',
            default_engine: whatsapp.default_engine?.value || 'wwebjs',
            cluster_heartbeat_interval: whatsapp.cluster_heartbeat_interval?.value || '15',
            max_sessions_per_node: whatsapp.max_sessions_per_node?.value || '50',

            default_min_delay: throttle.default_min_delay?.value || '8',
            default_max_delay: throttle.default_max_delay?.value || '18',
            default_grace_period_days: throttle.default_grace_period_days?.value || '3',
            trial_quota: throttle.trial_quota?.value || '500',
            max_messages_per_hour: throttle.max_messages_per_hour?.value || '300',

            payment_gateway_provider: payment.payment_gateway_provider?.value || 'manual_transfer',
            bank_bca_account: payment.bank_bca_account?.value || 'BCA 819-203-912 a/n Politeknik Mardira Indonesia',
            bank_mandiri_account: payment.bank_mandiri_account?.value || 'Mandiri 132-001-928-374 a/n Yayasan Mardira',
            midtrans_server_key: payment.midtrans_server_key?.value || 'SB-Mid-server-PRD8912048X',
            midtrans_client_key: payment.midtrans_client_key?.value || 'SB-Mid-client-KL91823901',
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post('/admin/settings', {
            preserveScroll: true,
        });
    };

    const updateField = (key, val) => {
        form.setData('settings', {
            ...form.data.settings,
            [key]: val,
        });
    };

    return (
        <AppLayout title="Pengaturan Produksi">
            <Head title="Pengaturan Sistem Siap Produksi — Super Admin" />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. STANDARDIZED TOP HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Settings className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>Pengaturan Sistem Siap Produksi</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                PRODUCTION READY
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                            Konfigurasi menyeluruh endpoint WhatsApp cluster, batasan throttle anti-ban, rekening transfer pembayaran, dan identitas institusi.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            variant="default"
                            size="sm"
                            disabled={form.processing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm h-9 px-4 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                        >
                            <Save className="w-4 h-4 stroke-[2.5]" />
                            <span>{form.processing ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
                        </Button>
                    </div>
                </div>

                {/* 2. TABS NAVIGATION */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 shadow-2xs max-w-2xl overflow-x-auto">
                    {[
                        { id: 'general', label: 'Branding & Kontak', icon: Building2 },
                        { id: 'whatsapp', label: 'WhatsApp Cluster', icon: Server },
                        { id: 'throttle', label: 'Anti-Ban & Kuota', icon: Sliders },
                        { id: 'payment', label: 'Metode Pembayaran', icon: CreditCard },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 3. SETTINGS FORM CARDS */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.16 }}
                        >
                            {/* TAB 1: GENERAL BRANDING */}
                            {activeTab === 'general' && (
                                <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden">
                                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Identitas Brand & Dukungan Pelanggan
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                                            Nama resmi yang ditampilkan di antarmuka portal dan dokumen invoice klien
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-5 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Nama Platform / Portal
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.data.settings.platform_name}
                                                    onChange={(e) => updateField('platform_name', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Institusi / Pengelola SaaS
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.data.settings.organization_name}
                                                    onChange={(e) => updateField('organization_name', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Nomor WhatsApp Helpdesk / CS
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.data.settings.support_phone}
                                                    onChange={(e) => updateField('support_phone', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Email Bantuan Resmi
                                                </label>
                                                <input
                                                    type="email"
                                                    value={form.data.settings.support_email}
                                                    onChange={(e) => updateField('support_email', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <div className="font-bold text-amber-900">Mode Pemeliharaan Darurat (Maintenance Mode)</div>
                                                <p className="text-amber-800 text-[11px] leading-relaxed">
                                                    Jika diaktifkan, seluruh antarmuka klien akan dialihkan ke halaman pemeliharaan, namun proses gateway di background tetap beroperasi.
                                                </p>
                                                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.data.settings.maintenance_mode}
                                                        onChange={(e) => updateField('maintenance_mode', e.target.checked)}
                                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                                                    />
                                                    <span className="font-semibold text-slate-800">Aktifkan Maintenance Mode</span>
                                                </label>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* TAB 2: WHATSAPP CLUSTER */}
                            {activeTab === 'whatsapp' && (
                                <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden">
                                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Arsitektur WhatsApp Microservice Cluster
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                                            Parameter koneksi backend gateway Node.js dan pemilihan server pengirim utama
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-5 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Endpoint Microservice Gateway (Cluster URL)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.data.settings.whatsapp_gateway_endpoint}
                                                    onChange={(e) => updateField('whatsapp_gateway_endpoint', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Server WhatsApp Bawaan (Default Server)
                                                </label>
                                                <select
                                                    value={form.data.settings.default_engine}
                                                    onChange={(e) => updateField('default_engine', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                                                >
                                                    <option value="baileys">Server 1 WhatsApp (Jalur Cepat - Ultra Low Memory & Latensi Rendah)</option>
                                                    <option value="wwebjs">Server 2 WhatsApp (Jalur Stabil - Sesi Terisolasi & Anti-Ban)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Interval Heartbeat Ping Gateway (detik)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={form.data.settings.cluster_heartbeat_interval}
                                                    onChange={(e) => updateField('cluster_heartbeat_interval', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Batas Maksimal Sesi WhatsApp per Node Worker
                                                </label>
                                                <input
                                                    type="number"
                                                    value={form.data.settings.max_sessions_per_node}
                                                    onChange={(e) => updateField('max_sessions_per_node', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* TAB 3: ANTI-BAN THROTTLE */}
                            {activeTab === 'throttle' && (
                                <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden">
                                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Anti-Ban Throttle & Toleransi Langganan
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                                            Perlindungan nomor dari pemblokiran Meta serta aturan toleransi keterlambatan
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-5 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Jeda Acak Minimum (Detik)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={form.data.settings.default_min_delay}
                                                    onChange={(e) => updateField('default_min_delay', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Jeda Acak Maksimum (Detik)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={form.data.settings.default_max_delay}
                                                    onChange={(e) => updateField('default_max_delay', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Masa Tenggang Grace Period (Hari)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={form.data.settings.default_grace_period_days}
                                                    onChange={(e) => updateField('default_grace_period_days', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Alokasi Kuota Trial Default
                                                </label>
                                                <input
                                                    type="number"
                                                    value={form.data.settings.trial_quota}
                                                    onChange={(e) => updateField('trial_quota', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Maksimal Pesan / Jam / Perangkat
                                                </label>
                                                <input
                                                    type="number"
                                                    value={form.data.settings.max_messages_per_hour}
                                                    onChange={(e) => updateField('max_messages_per_hour', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* TAB 4: PAYMENT REKENING */}
                            {activeTab === 'payment' && (
                                <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden">
                                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Metode Penerimaan Pembayaran Tagihan
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                                            Nomor rekening bank untuk transfer manual atau kredensial payment gateway
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-5 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Rekening Penerimaan Bank BCA
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.data.settings.bank_bca_account}
                                                    onChange={(e) => updateField('bank_bca_account', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Rekening Penerimaan Bank Mandiri
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.data.settings.bank_mandiri_account}
                                                    onChange={(e) => updateField('bank_mandiri_account', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Midtrans Server Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={form.data.settings.midtrans_server_key}
                                                    onChange={(e) => updateField('midtrans_server_key', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1.5">
                                                    Midtrans Client Key
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.data.settings.midtrans_client_key}
                                                    onChange={(e) => updateField('midtrans_client_key', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            variant="default"
                            size="sm"
                            disabled={form.processing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm h-9 px-4 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                        >
                            <Save className="w-4 h-4 stroke-[2.5]" />
                            <span>{form.processing ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
