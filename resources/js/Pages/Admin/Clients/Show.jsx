import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../../Layouts/AppLayout';
import {
    ArrowLeft,
    Building2,
    Calendar,
    Smartphone,
    CreditCard,
    Key,
    Globe,
    Users,
    Shield,
    CheckCircle2,
    AlertCircle,
    Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';
import { Separator } from '../../../Components/ui/separator';

export default function ClientShow({ client }) {
    const sub = client.subscription || {};
    const plan = sub.plan || {};

    const handleToggleStatus = () => {
        const action = client.is_active ? 'menonaktifkan (suspend)' : 'mengaktifkan kembali';
        if (confirm(`Apakah Anda yakin ingin ${action} workspace ini?`)) {
            router.post(`/admin/clients/${client.id}/toggle-status`);
        }
    };

    return (
        <AppLayout title={`Detail Klien: ${client.name}`}>
            <Head title={`Detail Klien: ${client.name} — Super Admin`} />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. STANDARDIZED TOP HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/clients">
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer">
                                <ArrowLeft className="w-4 h-4 text-slate-600" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {client.name}
                                </h1>
                                {client.is_active ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        AKTIF
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                        SUSPENDED
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                UUID: {client.uuid} • Slug: {client.slug}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            onClick={handleToggleStatus}
                            className={`h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                                client.is_active
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                        >
                            {client.is_active ? 'Suspend Workspace' : 'Aktifkan Kembali Workspace'}
                        </Button>
                    </div>
                </div>

                {/* 2. THREE KEY DETAIL CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card 1: Workspace & Team */}
                    <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden h-full">
                        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                                <span>Informasi Profil Klien</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs p-5">
                            <div>
                                <span className="text-slate-400 block text-[11px]">Nomor WhatsApp Kontak:</span>
                                <span className="font-semibold text-slate-800 font-mono">{client.phone || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Terdaftar Pada:</span>
                                <span className="font-semibold text-slate-800">
                                    {new Date(client.created_at).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>

                            <Separator />

                            <div>
                                <span className="text-slate-400 block text-[11px] mb-2 font-bold uppercase tracking-wider">
                                    Anggota / Staff Pengelola:
                                </span>
                                <div className="space-y-2">
                                    {client.users?.map((u) => (
                                        <div key={u.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                            <div className="font-bold text-slate-900">{u.name}</div>
                                            <div className="text-[11px] text-slate-500">{u.email}</div>
                                            <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">Peran: {u.role}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Active Subscription & Quota */}
                    <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden h-full">
                        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                <span>Status Langganan & Masa Aktif</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs p-5">
                            <div>
                                <span className="text-slate-400 block text-[11px]">Paket Berlangganan:</span>
                                <span className="text-sm font-bold text-slate-900">{plan.name || 'Belum ada paket aktif'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Status Masa Aktif:</span>
                                <div className="mt-1">
                                    {sub.status === 'active' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                            AKTIF
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            {sub.status || 'N/A'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <span className="text-slate-400 block text-[11px]">Mulai:</span>
                                    <span className="font-semibold text-slate-700">
                                        {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[11px]">Berakhir:</span>
                                    <span className="font-semibold text-slate-700">
                                        {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Sisa Kuota Pesan:</span>
                                <span className="font-bold text-emerald-700 text-sm">
                                    {sub.remaining_message_quota?.toLocaleString() || 0}
                                </span>
                                <span className="text-slate-500"> / {sub.monthly_message_quota?.toLocaleString() || 0} kuota</span>
                            </div>

                            <Separator />

                            <Link href="/admin/subscriptions">
                                <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-9 rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer">
                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                    <span>Sesuaikan Durasi & Kuota di Modul Langganan</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Card 3: WhatsApp Devices */}
                    <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden h-full">
                        <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-emerald-600" />
                                <span>Perangkat WhatsApp ({client.devices?.length || 0})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs p-5">
                            {(!client.devices || client.devices.length === 0) ? (
                                <p className="text-slate-400 py-6 text-center">Belum ada perangkat WhatsApp yang ditautkan.</p>
                            ) : (
                                client.devices.map((device) => {
                                    const serverLabel =
                                        device.engine === 'baileys'
                                            ? 'Server 1 WhatsApp'
                                            : device.engine === 'wwebjs'
                                            ? 'Server 2 WhatsApp'
                                            : 'Server WhatsApp';

                                    return (
                                        <div key={device.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900">{device.name}</span>
                                                {device.status === 'connected' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                        CONNECTED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 text-[10px] font-medium">
                                                        DISCONNECTED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] font-mono text-slate-600">
                                                {device.phone_number || 'Belum Scan QR'}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                                                <span className="font-mono text-emerald-700 font-semibold">{serverLabel}</span>
                                                <span>Baterai: {device.battery_level ? `${device.battery_level}%` : 'Multi-Device'}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
