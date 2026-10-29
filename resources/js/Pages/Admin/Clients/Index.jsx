import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    Users,
    Search,
    Filter,
    Shield,
    Smartphone,
    Send,
    AlertCircle,
    CheckCircle2,
    Ban,
    UserCheck,
    ExternalLink,
    Building2,
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

export default function ClientsIndex({ clients, filters, totalClients, activeClients }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/clients', {
            search: searchTerm,
            status: selectedStatus === 'all' ? '' : selectedStatus,
        }, { preserveState: true });
    };

    const handleToggleStatus = (clientId, currentStatus) => {
        const action = currentStatus ? 'menonaktifkan (suspend)' : 'mengaktifkan kembali';
        if (confirm(`Apakah Anda yakin ingin ${action} workspace ini?`)) {
            router.post(`/admin/clients/${clientId}/toggle-status`);
        }
    };

    return (
        <AppLayout title="Manajemen Klien">
            <Head title="Manajemen Klien & Workspace — Super Admin" />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. STANDARDIZED TOP HEADER & ACTION BAR */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Users className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>Manajemen Klien & Multi-Tenant</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {totalClients} WORKSPACE
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                            Kelola seluruh akun klien, kontrol status operasional workspace, dan pantau pemakaian resource sistem.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white shadow-2xs text-xs font-semibold text-slate-700">
                            Aktif: <strong className="text-emerald-700">{activeClients}</strong> | Suspended: <strong className="text-rose-600">{totalClients - activeClients}</strong>
                        </div>
                    </div>
                </div>

                {/* 2. SEARCH & FILTER TOOLBAR */}
                <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden">
                    <CardContent className="p-4 bg-slate-50/50">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari nama workspace, email owner, atau nomor telepon..."
                                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        router.get('/admin/clients', {
                                            search: searchTerm,
                                            status: e.target.value === 'all' ? '' : e.target.value,
                                        }, { preserveState: true });
                                    }}
                                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-emerald-600 focus:outline-none font-medium"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="active">Hanya Aktif</option>
                                    <option value="suspended">Hanya Suspended</option>
                                </select>

                                <Button
                                    type="submit"
                                    variant="default"
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg shadow-2xs cursor-pointer"
                                >
                                    Cari
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* 3. CLIENTS DATA TABLE */}
                <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-b border-slate-200/80">
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[180px]">Workspace & Owner</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[130px]">Kontak</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[160px]">Paket & Durasi</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-28">Resource</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-24">Status Akun</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 text-right w-28 pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-400">
                                            Tidak ada workspace yang sesuai dengan kriteria pencarian.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    clients.data.map((client) => {
                                        const owner = client.users?.[0] || {};
                                        const sub = client.subscription || {};
                                        const plan = sub.plan || {};

                                        return (
                                            <TableRow key={client.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Workspace & Owner */}
                                                <TableCell className="py-3.5">
                                                    <div className="font-bold text-xs text-slate-900">
                                                        {client.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {owner.name || 'Owner'} ({owner.email || '-'})
                                                    </div>
                                                </TableCell>

                                                {/* Phone */}
                                                <TableCell className="py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                                                    {client.phone || '-'}
                                                </TableCell>

                                                {/* Plan & Subscription */}
                                                <TableCell className="py-3.5 text-xs">
                                                    <div className="font-semibold text-slate-900">
                                                        {plan.name || 'Belum Berlangganan'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {sub.status === 'active' ? (
                                                            <span className="text-emerald-700 font-semibold">Aktif</span>
                                                        ) : (
                                                            <span className="text-amber-700 font-semibold">{sub.status || 'N/A'}</span>
                                                        )}
                                                        {sub.remaining_message_quota !== undefined && ` • ${sub.remaining_message_quota.toLocaleString()} kuota`}
                                                    </div>
                                                </TableCell>

                                                {/* Resource Counts */}
                                                <TableCell className="py-3.5 text-xs text-slate-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <span title="Perangkat Terhubung" className="flex items-center gap-1">
                                                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{client.devices_count || 0}</span>
                                                        </span>
                                                        <span title="Total Pesan" className="flex items-center gap-1">
                                                            <Send className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{client.messages_count || 0}</span>
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Status Badge */}
                                                <TableCell className="py-3.5 whitespace-nowrap">
                                                    {client.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                            AKTIF
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-800 text-[10px] font-bold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                                            SUSPENDED
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Action Buttons */}
                                                <TableCell className="py-3.5 text-right whitespace-nowrap pr-6">
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        <Link href={`/admin/clients/${client.id}`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer">
                                                                Detail
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(client.id, client.is_active)}
                                                            className={`h-7 text-xs px-2.5 rounded-md cursor-pointer ${
                                                                client.is_active
                                                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                            }`}
                                                        >
                                                            {client.is_active ? 'Suspend' : 'Aktifkan'}
                                                        </Button>
                                                    </div>
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
