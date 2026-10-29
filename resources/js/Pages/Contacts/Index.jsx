import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import ModalPortal from '../../Components/ui/ModalPortal';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import {
    Users,
    UserPlus,
    FolderPlus,
    Search,
    Trash2,
    Phone,
    FileSpreadsheet,
    X,
    CheckCircle2,
    Tag,
    Pencil,
    Plus,
} from 'lucide-react';

export default function ContactsIndex({ groups, contacts, filters, stats }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedGroup, setSelectedGroup] = useState(filters.group_id || '');

    // Modals visibility state
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
    const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);

    // Dynamic custom fields state for Add and Edit Contact
    const [addCustomFields, setAddCustomFields] = useState([]);
    const [editCustomFields, setEditCustomFields] = useState([]);

    // Form for Adding Single Contact
    const {
        data: contactData,
        setData: setContactData,
        post: postContact,
        processing: processingContact,
        reset: resetContact,
        errors: addContactErrors,
        transform: transformAddContact,
    } = useForm({
        name: '',
        phone: '+628',
        group_id: '',
        custom_fields: null,
    });

    // Form for Editing Single Contact
    const {
        data: editContactData,
        setData: setEditContactData,
        put: putContact,
        processing: processingEditContact,
        errors: editContactErrors,
        transform: transformEditContact,
        clearErrors: clearEditContactErrors,
    } = useForm({
        id: '',
        name: '',
        phone: '',
        group_id: '',
        custom_fields: null,
    });

    // Form for CSV Import
    const {
        data: importData,
        setData: setImportData,
        post: postImport,
        processing: processingImport,
        reset: resetImport,
    } = useForm({
        group_id: '',
        csv_data: '',
    });

    // Form for Add Group
    const {
        data: groupData,
        setData: setGroupData,
        post: postGroup,
        processing: processingGroup,
        reset: resetGroup,
    } = useForm({
        name: '',
        description: '',
    });

    // Form for Edit Group
    const {
        data: editGroupData,
        setData: setEditGroupData,
        put: putGroup,
        processing: processingEditGroup,
    } = useForm({
        id: '',
        name: '',
        description: '',
    });

    // Search and Filter Handlers
    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/contacts', { search: searchQuery, group_id: selectedGroup }, { preserveState: true });
    };

    const handleGroupFilter = (groupId) => {
        setSelectedGroup(groupId);
        router.get('/contacts', { search: searchQuery, group_id: groupId }, { preserveState: true });
    };

    // Custom Fields Handlers for Add Contact Modal
    const handleAddCustomFieldRow = () => {
        setAddCustomFields([...addCustomFields, { key: '', value: '' }]);
    };

    const handleAddCustomFieldChange = (index, field, value) => {
        const updated = [...addCustomFields];
        updated[index][field] = value;
        setAddCustomFields(updated);
    };

    const handleRemoveAddCustomField = (index) => {
        setAddCustomFields(addCustomFields.filter((_, i) => i !== index));
    };

    // Custom Fields Handlers for Edit Contact Modal
    const handleAddEditCustomFieldRow = () => {
        setEditCustomFields([...editCustomFields, { key: '', value: '' }]);
    };

    const handleEditCustomFieldChange = (index, field, value) => {
        const updated = [...editCustomFields];
        updated[index][field] = value;
        setEditCustomFields(updated);
    };

    const handleRemoveEditCustomField = (index) => {
        setEditCustomFields(editCustomFields.filter((_, i) => i !== index));
    };

    // Open Edit Contact Modal
    const handleOpenEditModal = (contact) => {
        clearEditContactErrors();
        let initialFields = [];
        if (contact.custom_fields && typeof contact.custom_fields === 'object' && !Array.isArray(contact.custom_fields)) {
            initialFields = Object.entries(contact.custom_fields).map(([k, v]) => ({
                key: k,
                value: String(v),
            }));
        }
        setEditCustomFields(initialFields);
        setEditContactData({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            group_id: contact.group_id ? String(contact.group_id) : '',
            custom_fields: null,
        });
        setIsEditContactModalOpen(true);
    };

    // Open Edit Group Modal
    const handleOpenEditGroupModal = (group, e) => {
        e.stopPropagation();
        setEditGroupData({
            id: group.id,
            name: group.name,
            description: group.description || '',
        });
        setIsEditGroupModalOpen(true);
    };

    // Submit Add Contact
    const handleAddContact = (e) => {
        e.preventDefault();
        const fieldsObj = {};
        addCustomFields.forEach(({ key, value }) => {
            if (key.trim()) {
                fieldsObj[key.trim()] = value.trim();
            }
        });

        transformAddContact((data) => ({
            ...data,
            custom_fields: Object.keys(fieldsObj).length > 0 ? fieldsObj : null,
        }));

        postContact('/contacts', {
            onSuccess: () => {
                setIsAddContactModalOpen(false);
                resetContact();
                setAddCustomFields([]);
            },
        });
    };

    // Submit Update Contact
    const handleUpdateContact = (e) => {
        e.preventDefault();
        const fieldsObj = {};
        editCustomFields.forEach(({ key, value }) => {
            if (key.trim()) {
                fieldsObj[key.trim()] = value.trim();
            }
        });

        transformEditContact((data) => ({
            ...data,
            custom_fields: Object.keys(fieldsObj).length > 0 ? fieldsObj : null,
        }));

        putContact(`/contacts/${editContactData.id}`, {
            onSuccess: () => {
                setIsEditContactModalOpen(false);
                setEditCustomFields([]);
            },
        });
    };

    // Submit CSV Import
    const handleImportCsv = (e) => {
        e.preventDefault();
        postImport('/contacts/import', {
            onSuccess: () => {
                setIsImportModalOpen(false);
                resetImport();
            },
        });
    };

    // Submit Add Group
    const handleAddGroup = (e) => {
        e.preventDefault();
        postGroup('/contacts/groups', {
            onSuccess: () => {
                setIsAddGroupModalOpen(false);
                resetGroup();
            },
        });
    };

    // Submit Update Group
    const handleUpdateGroup = (e) => {
        e.preventDefault();
        putGroup(`/contacts/groups/${editGroupData.id}`, {
            onSuccess: () => {
                setIsEditGroupModalOpen(false);
            },
        });
    };

    // Delete Handlers
    const handleDeleteContact = (id, name = 'kontak ini') => {
        if (confirm(`Apakah Anda yakin ingin menghapus kontak "${name}"?`)) {
            router.delete(`/contacts/${id}`);
        }
    };

    const handleDeleteGroup = (id, name) => {
        if (confirm(`Hapus grup "${name}"? Kontak di dalamnya tidak akan terhapus, hanya dilepas dari grup.`)) {
            router.delete(`/contacts/groups/${id}`);
        }
    };

    return (
        <AppLayout title="Buku Kontak & CRM">
            <Head title="Buku Kontak & Segmentasi Audiens — Mardira WA" />

            <div className="space-y-6">
                {/* Header Page */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0f172a]">
                            Buku Kontak & Segmentasi Audiens
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kelola nomor pelanggan, edit identitas kontak, segmentasi grup broadcast, dan variabel personalisasi data.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            variant="outline"
                            className="h-9 px-3 text-xs font-bold border-slate-300 hover:bg-slate-50"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                            <span>Impor CSV / Excel</span>
                        </Button>

                        <Button
                            type="button"
                            onClick={() => setIsAddGroupModalOpen(true)}
                            variant="outline"
                            className="h-9 px-3 text-xs font-bold border-slate-300 hover:bg-slate-50"
                        >
                            <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                            <span>Buat Grup</span>
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                resetContact();
                                setAddCustomFields([]);
                                setIsAddContactModalOpen(true);
                            }}
                            className="h-9 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                            <UserPlus className="w-3.5 h-3.5 mr-1.5 text-white" />
                            <span>Tambah Kontak</span>
                        </Button>
                    </div>
                </div>

                {/* 3 Overview Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.02 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full p-4 sm:p-5 border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Total Nomor Kontak</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-[#0f172a]">{stats.total_contacts.toLocaleString('id-ID')}</div>
                            <p className="text-[11px] text-slate-400">Tersimpan dalam database workspace</p>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.06 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full p-4 sm:p-5 border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Grup Audiens</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Tag className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-[#0f172a]">{stats.total_groups}</div>
                            <p className="text-[11px] text-slate-400">Segmentasi kategori broadcast</p>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.1 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full p-4 sm:p-5 border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Format Validasi</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-emerald-700">Format 62+</div>
                            <p className="text-[11px] text-slate-400">Standar internasional WhatsApp</p>
                        </Card>
                    </motion.div>
                </div>

                {/* Filter and Group Pills Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama atau nomor telepon..."
                                className="w-full pl-9 pr-20 py-2 rounded-lg border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition-colors"
                            >
                                Cari
                            </button>
                        </form>

                        <div className="text-xs text-slate-500 font-medium">
                            Menampilkan <strong className="text-[#0f172a]">{contacts.data.length}</strong> dari {contacts.total} kontak
                        </div>
                    </div>

                    {/* Group Selector Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                        <button
                            type="button"
                            onClick={() => handleGroupFilter('')}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !selectedGroup
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Semua Kontak ({stats.total_contacts})
                        </button>

                        {stats.unassigned_contacts > 0 && (
                            <button
                                type="button"
                                onClick={() => handleGroupFilter('none')}
                                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedGroup === 'none'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                                }`}
                            >
                                Tanpa Grup ({stats.unassigned_contacts})
                            </button>
                        )}

                        {groups.map((group) => (
                            <div key={group.id} className="shrink-0 flex items-center group/chip">
                                <button
                                    type="button"
                                    onClick={() => handleGroupFilter(group.id)}
                                    className={`px-3 py-1.5 rounded-l-lg text-xs font-bold transition-all ${
                                        selectedGroup == group.id
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {group.name} ({group.contacts_count})
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleOpenEditGroupModal(group, e)}
                                    title="Edit nama grup"
                                    className={`px-1.5 py-1.5 text-xs transition-colors ${
                                        selectedGroup == group.id
                                            ? 'bg-emerald-700 text-emerald-100 hover:bg-emerald-800'
                                            : 'bg-slate-200 hover:bg-emerald-100 hover:text-emerald-800 text-slate-500'
                                    }`}
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteGroup(group.id, group.name);
                                    }}
                                    title="Hapus grup"
                                    className={`px-1.5 py-1.5 rounded-r-lg text-xs transition-colors ${
                                        selectedGroup == group.id
                                            ? 'bg-emerald-700 text-emerald-100 hover:bg-red-600 hover:text-white'
                                            : 'bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-500'
                                    }`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contacts Data Table */}
                <Card className="border-slate-200/80 bg-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                                <tr>
                                    <th className="py-3 px-4">Nama Lengkap</th>
                                    <th className="py-3 px-4">Nomor WhatsApp</th>
                                    <th className="py-3 px-4">Grup / Kategori</th>
                                    <th className="py-3 px-4">Variabel Khusus</th>
                                    <th className="py-3 px-4">Terdaftar Sejak</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {contacts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-slate-400">
                                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <p className="font-semibold text-slate-600">Belum ada data kontak</p>
                                            <p className="text-[11px] mt-0.5">Tambahkan kontak manual atau impor file CSV untuk memulai.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    contacts.data.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 font-bold text-[#0f172a]">
                                                {c.name}
                                            </td>
                                            <td className="py-3 px-4 font-mono font-medium text-slate-700">
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                                    <Phone className="w-3 h-3" />
                                                    {c.phone}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {c.group ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                        {c.group.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px] italic">Tanpa Grup</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-[11px]">
                                                {c.custom_fields && typeof c.custom_fields === 'object' && Object.keys(c.custom_fields).length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(c.custom_fields).map(([k, v]) => (
                                                            <span key={k} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                                                                <strong>{k}:</strong> {String(v)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                {new Date(c.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(c)}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                                                        title="Edit Kontak"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteContact(c.id, c.name)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                        title="Hapus Kontak"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {contacts.links && contacts.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Halaman {contacts.current_page} dari {contacts.last_page}
                            </span>
                            <div className="flex items-center gap-1">
                                {contacts.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 rounded text-xs font-semibold ${
                                            link.active
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ================= MODAL: EDIT KONTAK ================= */}
            {isEditContactModalOpen && (
                <ModalPortal isOpen={isEditContactModalOpen} onClose={() => setIsEditContactModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsEditContactModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                        <Pencil className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-[#0f172a]">Edit Data Kontak</h3>
                                        <p className="text-[11px] text-slate-500">Perbarui identitas pelanggan dan variabel personalisasi.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditContactModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateContact} className="space-y-4 text-xs">
                            {/* Nama Lengkap */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editContactData.name}
                                    onChange={(e) => setEditContactData('name', e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                    required
                                />
                                {editContactErrors.name && (
                                    <p className="text-[11px] text-red-600 mt-1">{editContactErrors.name}</p>
                                )}
                            </div>

                            {/* Nomor WhatsApp */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Nomor WhatsApp <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editContactData.phone}
                                    onChange={(e) => setEditContactData('phone', e.target.value)}
                                    placeholder="+6281234567890"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                    required
                                />
                                {editContactErrors.phone ? (
                                    <p className="text-[11px] text-red-600 mt-1 font-medium">{editContactErrors.phone}</p>
                                ) : (
                                    <p className="text-[10px] text-slate-400 mt-0.5">Format internasional (+628xxx atau 08xxx).</p>
                                )}
                            </div>

                            {/* Grup / Kategori */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Grup Audiens / Kategori</label>
                                <select
                                    value={editContactData.group_id}
                                    onChange={(e) => setEditContactData('group_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                >
                                    <option value="">-- Tanpa Grup (Unassigned) --</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Variabel Khusus / Custom Fields */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold text-slate-700 block">Variabel Khusus (Personalisasi)</span>
                                        <span className="text-[10px] text-slate-400">Dapat disisipkan dalam pesan broadcast via tag {'{variabel}'}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddEditCustomFieldRow}
                                        className="h-7 text-[11px] px-2 font-medium border-slate-200 hover:bg-slate-50 text-emerald-700"
                                    >
                                        <Plus className="w-3 h-3 mr-1 text-emerald-600" />
                                        Tambah Variabel
                                    </Button>
                                </div>

                                {editCustomFields.length === 0 ? (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-[11px]">
                                        Belum ada variabel khusus. Klik tombol di atas untuk menambahkan variabel seperti tagihan, jurusan, dll.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {editCustomFields.map((field, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nama Variabel (e.g. tagihan)"
                                                    value={field.key}
                                                    onChange={(e) => handleEditCustomFieldChange(idx, 'key', e.target.value)}
                                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Nilai (e.g. Rp 250.000)"
                                                    value={field.value}
                                                    onChange={(e) => handleEditCustomFieldChange(idx, 'value', e.target.value)}
                                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEditCustomField(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Hapus variabel"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditContactModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processingEditContact}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                    {processingEditContact ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                </ModalPortal>
            )}

            {/* ================= MODAL: TAMBAH KONTAK ================= */}
            {isAddContactModalOpen && (
                <ModalPortal isOpen={isAddContactModalOpen} onClose={() => setIsAddContactModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsAddContactModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <UserPlus className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-[#0f172a]">Tambah Kontak Baru</h3>
                                    <p className="text-[11px] text-slate-500">Daftarkan nomor pelanggan baru ke database CRM.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddContactModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddContact} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={contactData.name}
                                    onChange={(e) => setContactData('name', e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    required
                                />
                                {addContactErrors.name && (
                                    <p className="text-[11px] text-red-600 mt-1">{addContactErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Nomor WhatsApp <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={contactData.phone}
                                    onChange={(e) => setContactData('phone', e.target.value)}
                                    placeholder="+6281234567890"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                                    required
                                />
                                {addContactErrors.phone ? (
                                    <p className="text-[11px] text-red-600 mt-1 font-medium">{addContactErrors.phone}</p>
                                ) : (
                                    <p className="text-[10px] text-slate-400 mt-0.5">Dapat diawali dengan 08xxx atau +628xxx</p>
                                )}
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Grup Audiens (Opsional)</label>
                                <select
                                    value={contactData.group_id}
                                    onChange={(e) => setContactData('group_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                >
                                    <option value="">-- Tanpa Grup (Unassigned) --</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Variabel Khusus / Custom Fields */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold text-slate-700 block">Variabel Khusus (Opsional)</span>
                                        <span className="text-[10px] text-slate-400">Variabel dinamis seperti tagihan, jurusan, paket</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddCustomFieldRow}
                                        className="h-7 text-[11px] px-2 font-medium border-slate-200 hover:bg-slate-50 text-emerald-700"
                                    >
                                        <Plus className="w-3 h-3 mr-1 text-emerald-600" />
                                        Tambah Variabel
                                    </Button>
                                </div>

                                {addCustomFields.length === 0 ? (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-[11px]">
                                        Belum ada variabel tambahan. Klik tombol di atas jika diperlukan.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {addCustomFields.map((field, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nama Variabel (e.g. tagihan)"
                                                    value={field.key}
                                                    onChange={(e) => handleAddCustomFieldChange(idx, 'key', e.target.value)}
                                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Nilai (e.g. Rp 250.000)"
                                                    value={field.value}
                                                    onChange={(e) => handleAddCustomFieldChange(idx, 'value', e.target.value)}
                                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAddCustomField(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Hapus variabel"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddContactModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processingContact}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                    {processingContact ? 'Menyimpan...' : 'Simpan Kontak'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                </ModalPortal>
            )}

            {/* ================= MODAL: IMPOR CSV ================= */}
            {isImportModalOpen && (
                <ModalPortal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsImportModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                                <h3 className="font-bold text-base text-[#0f172a]">Impor Data Kontak (CSV)</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsImportModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500">
                            Salin dan tempel baris data nomor kontak Anda. Format kolom yang didukung:
                        </p>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed">
                            Budi Santoso, 081234567890, Rp 250.000, Teknik Informatika<br />
                            Siti Rahma, +6281987654321, Lunas, Manajemen Bisnis<br />
                            Ahmad Fauzi, 085712345678
                        </div>

                        <form onSubmit={handleImportCsv} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Pilih Grup Tujuan:</label>
                                <select
                                    value={importData.group_id}
                                    onChange={(e) => setImportData('group_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                >
                                    <option value="">-- Masukkan Tanpa Grup --</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Tempel Baris Data CSV:</label>
                                <textarea
                                    rows="6"
                                    value={importData.csv_data}
                                    onChange={(e) => setImportData('csv_data', e.target.value)}
                                    placeholder="Nama, Nomor, Tagihan (opsional), Jurusan (opsional)..."
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none leading-relaxed"
                                    required
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processingImport}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                    {processingImport ? 'Memproses Impor...' : 'Mulai Impor Kontak'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                </ModalPortal>
            )}

            {/* ================= MODAL: BUAT GRUP ================= */}
            {isAddGroupModalOpen && (
                <ModalPortal isOpen={isAddGroupModalOpen} onClose={() => setIsAddGroupModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsAddGroupModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-[#0f172a]">Buat Grup Audiens Baru</h3>
                            <button
                                type="button"
                                onClick={() => setIsAddGroupModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddGroup} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Nama Grup</label>
                                <input
                                    type="text"
                                    value={groupData.name}
                                    onChange={(e) => setGroupData('name', e.target.value)}
                                    placeholder="Contoh: Mahasiswa Baru 2026 / Pelanggan VIP"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat (Opsional)</label>
                                <input
                                    type="text"
                                    value={groupData.description}
                                    onChange={(e) => setGroupData('description', e.target.value)}
                                    placeholder="Tujuan segmentasi pesan broadcast"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddGroupModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processingGroup}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                    {processingGroup ? 'Menyimpan...' : 'Buat Grup'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                </ModalPortal>
            )}

            {/* ================= MODAL: EDIT GRUP ================= */}
            {isEditGroupModalOpen && (
                <ModalPortal isOpen={isEditGroupModalOpen} onClose={() => setIsEditGroupModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsEditGroupModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <FolderPlus className="w-4 h-4 text-emerald-600" />
                                    <h3 className="font-bold text-base text-[#0f172a]">Edit Grup Audiens</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditGroupModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateGroup} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Nama Grup</label>
                                    <input
                                        type="text"
                                        value={editGroupData.name}
                                        onChange={(e) => setEditGroupData('name', e.target.value)}
                                        placeholder="Nama grup audiens"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat (Opsional)</label>
                                    <input
                                        type="text"
                                        value={editGroupData.description}
                                        onChange={(e) => setEditGroupData('description', e.target.value)}
                                        placeholder="Tujuan segmentasi pesan broadcast"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditGroupModalOpen(false)}
                                        className="text-xs"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processingEditGroup}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                    >
                                        {processingEditGroup ? 'Menyimpan...' : 'Perbarui Grup'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </AppLayout>
    );
}
