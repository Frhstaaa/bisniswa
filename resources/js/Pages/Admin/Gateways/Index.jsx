import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../../Layouts/AppLayout';
import {
    Cpu,
    Activity,
    Server,
    RotateCw,
    Smartphone,
    Building2,
    Shield,
    CheckCircle2,
    Battery,
    Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../../Components/ui/table';

export default function GatewaysIndex({ devices, stats }) {
    const handleRestartEngine = (engineName) => {
        if (confirm(`Apakah Anda yakin ingin me-restart worker cluster [${engineName}]?`)) {
            router.post('/admin/gateways/restart', { engine: engineName });
        }
    };

    return (
        <AppLayout title="WhatsApp Gateways">
            <Head title="WhatsApp Gateways & Microservices — Super Admin" />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. STANDARDIZED TOP HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Cpu className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>WhatsApp Gateway Microservices & Nodes</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                CLUSTER ONLINE
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                            Pantau alokasi dan beban memori Server 1 dan Server 2 WhatsApp secara realtime di seluruh sesi klien.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestartEngine('all')}
                            className="h-9 px-3.5 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restart Seluruh Worker</span>
                        </Button>
                    </div>
                </div>

                {/* 2. DUAL SERVER & CLUSTER STATUS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Node Cluster */}
                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Gateway Cluster Endpoint
                            </CardTitle>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                {stats.cluster_status}
                            </span>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4 space-y-1">
                            <div className="text-sm font-mono font-bold text-slate-900 truncate">
                                {stats.cluster_endpoint}
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Total Perangkat: <strong>{stats.online_devices}</strong> / {stats.total_devices} Online
                            </p>
                        </CardContent>
                    </Card>

                    {/* Server 1 WhatsApp (Jalur Cepat) */}
                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Server 1 WhatsApp (Jalur Cepat)
                            </CardTitle>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                SERVER 1
                            </span>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4 space-y-1">
                            <div className="text-2xl font-black text-slate-900">
                                {stats.baileys_connected} <span className="text-xs font-normal text-slate-500">instance aktif</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Estimasi RAM: <strong className="font-mono text-emerald-700">~{stats.baileys_ram_mb} MB</strong>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Server 2 WhatsApp (Jalur Stabil) */}
                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Server 2 WhatsApp (Jalur Stabil)
                            </CardTitle>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                SERVER 2
                            </span>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4 space-y-1">
                            <div className="text-2xl font-black text-slate-900">
                                {stats.wwebjs_connected} <span className="text-xs font-normal text-slate-500">instance aktif</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Estimasi RAM: <strong className="font-mono text-amber-800">~{stats.wwebjs_ram_mb} MB</strong>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. ALL CONNECTED DEVICES TABLE */}
                <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900">
                                Distribusi Sesi WhatsApp Seluruh Klien
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                Daftar perangkat WhatsApp yang saat ini terdaftar dalam gateway cluster
                            </CardDescription>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                            {devices.data.length} Perangkat
                        </span>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-b border-slate-200/80">
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[180px]">Perangkat & No. WhatsApp</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[160px]">Workspace / Klien</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-28">Server WhatsApp</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-28">Status Sesi</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-28">Baterai</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 text-right w-36 pr-6">Terakhir Terkoneksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {devices.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                                            Belum ada perangkat yang terdaftar di sistem.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    devices.data.map((device) => {
                                        const serverLabel =
                                            device.engine === 'baileys'
                                                ? 'Server 1 WhatsApp'
                                                : device.engine === 'wwebjs'
                                                ? 'Server 2 WhatsApp'
                                                : 'Server WhatsApp';

                                        return (
                                            <TableRow key={device.id} className="hover:bg-slate-50/80 transition-colors">
                                                <TableCell className="py-3.5">
                                                    <div className="font-bold text-xs text-slate-900">
                                                        {device.name}
                                                    </div>
                                                    <div className="text-[11px] font-mono text-slate-500">
                                                        {device.phone_number || 'Belum Terhubung'}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3.5 text-xs font-semibold text-slate-800">
                                                    {device.workspace?.name || 'Workspace'}
                                                </TableCell>

                                                <TableCell className="py-3.5 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                        {serverLabel}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="py-3.5 whitespace-nowrap">
                                                    {device.status === 'connected' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                            CONNECTED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 text-[10px] font-medium">
                                                            DISCONNECTED
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                                                    {device.battery_level ? `${device.battery_level}%` : 'Multi-Device'}
                                                </TableCell>

                                                <TableCell className="py-3.5 text-xs text-slate-500 text-right pr-6 whitespace-nowrap font-mono">
                                                    {device.last_connected_at
                                                        ? new Date(device.last_connected_at).toLocaleTimeString('id-ID', {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                              timeZone: 'Asia/Jakarta',
                                                          }).replace(':', '.') + ' WIB'
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
