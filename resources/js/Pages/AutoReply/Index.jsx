import React, { useState, useRef, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import ModalPortal from '../../Components/ui/ModalPortal';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import { Switch } from '../../Components/ui/switch';
import {
    Bot,
    Sparkles,
    Plus,
    Trash2,
    Send,
    MessageSquare,
    Zap,
    CheckCircle2,
    CheckCheck,
    Clock,
    Pencil,
    ListChecks,
    X,
    Lightbulb,
    Key,
    HelpCircle,
    Smartphone,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Check,
    CornerDownLeft,
    ExternalLink,
    Link2,
    Info,
    ArrowRight,
    Power,
    ShieldAlert,
    AlertCircle,
    ShoppingBag,
    UtensilsCrossed,
    Stethoscope,
    Building2,
    GraduationCap,
    Copy,
    Calendar,
    Sun,
    Moon,
    FileText,
    Store,
    Layers,
    Tags,
} from 'lucide-react';

export default function AutoReplyIndex({
    masterEnabled = true,
    autoReplies = [],
    devices = [],
    menuConfig = {},
    scheduleConfig = {},
    industryTemplates = [],
    aiConfig = {},
    stats = {},
}) {
    const safeAutoReplies = Array.isArray(autoReplies)
        ? autoReplies
        : (Array.isArray(autoReplies?.data) ? autoReplies.data : Object.values(autoReplies || {}));
    const safeDevices = Array.isArray(devices)
        ? devices
        : (Array.isArray(devices?.data) ? devices.data : Object.values(devices || {}));

    // Master switch state
    const [isMasterOn, setIsMasterOn] = useState(Boolean(masterEnabled));
    const [isTogglingMaster, setIsTogglingMaster] = useState(false);

    useEffect(() => {
        setIsMasterOn(Boolean(masterEnabled));
    }, [masterEnabled]);

    const handleToggleMaster = () => {
        const nextState = !isMasterOn;
        setIsMasterOn(nextState);
        setIsTogglingMaster(true);
        router.post(
            '/auto-reply/master-toggle',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsTogglingMaster(false),
                onError: () => setIsMasterOn(!nextState),
            }
        );
    };

    // Navigation Tabs
    const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'greeting' | 'ai' | 'schedule' | 'templates'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isOrderGenModalOpen, setIsOrderGenModalOpen] = useState(false);

    // Filters for rules
    const [ruleSearch, setRuleSearch] = useState('');
    const [ruleDeviceFilter, setRuleDeviceFilter] = useState('');
    const [ruleStatusFilter, setRuleStatusFilter] = useState('');
    const [ruleCategoryFilter, setRuleCategoryFilter] = useState('');

    // Simulator states
    const [simulatedMessage, setSimulatedMessage] = useState('');
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [simulateOutsideHours, setSimulateOutsideHours] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        {
            sender: 'bot',
            text: 'Halo! Saya asisten bot WhatsApp interaktif. Ketik pesan sambutan ("halo", "info", "menu") atau angka menu (1, 2) untuk menguji respon bot bisnis Anda.',
            source: 'Sistem Inisialisasi',
        },
    ]);
    const [isSimulating, setIsSimulating] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isSimulating]);

    // Form for Adding Auto Reply Rule
    const { data: ruleData, setData: setRuleData, post: postRule, processing: processingRule, reset: resetRule } = useForm({
        name: '',
        category: 'Penjualan',
        trigger_type: 'contains',
        keyword: '',
        reply_message: '',
        device_id: '',
        reply_media_url: '',
        cta_text: '',
        cta_url: '',
        action_buttons: '',
    });

    // Form for Editing Auto Reply Rule
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState(null);
    const { data: editData, setData: setEditData, put: putRule, processing: processingEdit, reset: resetEdit } = useForm({
        name: '',
        category: 'Penjualan',
        trigger_type: 'contains',
        keyword: '',
        reply_message: '',
        device_id: '',
        reply_media_url: '',
        cta_text: '',
        cta_url: '',
        action_buttons: '',
        is_active: true,
    });

    const handleOpenEdit = (rule) => {
        setEditingRuleId(rule.id);
        setEditData({
            name: rule.name || '',
            category: rule.category || 'Penjualan',
            trigger_type: rule.trigger_type || 'contains',
            keyword: rule.keyword || '',
            reply_message: rule.reply_message || '',
            device_id: rule.device_id || '',
            reply_media_url: rule.reply_media_url || '',
            cta_text: rule.cta_text || '',
            cta_url: rule.cta_url || '',
            action_buttons: Array.isArray(rule.action_buttons) ? rule.action_buttons.join(', ') : (rule.action_buttons || ''),
            is_active: Boolean(rule.is_active),
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateRule = (e) => {
        e.preventDefault();
        if (!editingRuleId) return;
        putRule(`/auto-reply/${editingRuleId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingRuleId(null);
                resetEdit();
            },
        });
    };

    // Form for Greeting & Menu Config
    const { data: menuFormData, setData: setMenuFormData, post: postMenuConfig, processing: processingMenu } = useForm({
        enabled: Boolean(menuConfig.enabled ?? true),
        style: (menuConfig.style === 'boxed' || menuConfig.style === 'pandawa') ? 'boxed' : 'standard',
        keywords: menuConfig.keywords || 'hi, halo, hai, hello, p, info, menu, bantuan, start, mulai, siang, pagi, malam, assalamualaikum, tes, admin',
        device_id: menuConfig.device_id || '',
        header: menuConfig.header || '',
        footer: menuConfig.footer || '',
    });

    // Form for AI Config
    const { data: aiFormData, setData: setAiFormData, post: postAiConfig, processing: processingAi } = useForm({
        enabled: Boolean(aiConfig.enabled ?? true),
        prompt_context: aiConfig.prompt_context || '',
        api_key: aiConfig.api_key || '',
        persona: aiConfig.persona || 'cs_friendly',
        knowledge_base: aiConfig.knowledge_base || '',
    });

    // Form for Working Hours & Away Schedule
    const { data: scheduleFormData, setData: setScheduleFormData, post: postScheduleConfig, processing: processingSchedule } = useForm({
        enabled: Boolean(scheduleConfig.enabled ?? false),
        days: scheduleConfig.days || [1, 2, 3, 4, 5, 6],
        start: scheduleConfig.start || '08:00',
        end: scheduleConfig.end || '17:00',
        away_mode: scheduleConfig.away_mode || 'fallback_only',
        away_message: scheduleConfig.away_message || "Halo Kak {nama}! 👋\n\nTerima kasih telah menghubungi {workspace}. Saat ini tim kami sedang berada di *LUAR JAM OPERASIONAL* (Buka: Senin - Sabtu, {jam_operasional}).\n\nPesan Anda telah kami simpan dan akan segera dibalas oleh Customer Service kami saat jam kerja dimulai kembali.\n\n💡 Ketik *MENU* untuk melihat informasi mandiri 24/7.",
    });

    // Presets for AI Personas
    const aiPersonaPresets = [
        {
            id: 'cs_friendly',
            name: 'Customer Service Olshop Ramah',
            icon: ShoppingBag,
            desc: 'Ceria, bersahabat, proaktif membantu cek produk dan closing penjualan.',
            prompt: 'Anda adalah Asisten Virtual Customer Service ramah, ceria, dan sangat responsif dari {workspace}. Bantu pelanggan menemukan produk terbaik, jelaskan harga, cara pemesanan, dan konfirmasi pembayaran dengan bahasa yang santun, bersahabat (gunakan sapaan "Kak"), dan berorientasi membantu closing penjualan.',
        },
        {
            id: 'fnb_host',
            name: 'Pelayan Hangat Resto & Cafe',
            icon: UtensilsCrossed,
            desc: 'Hangat, menggugah selera, responsif melayani reservasi dan delivery.',
            prompt: 'Anda adalah Asisten Virtual resmi dari resto/cafe {workspace}. Berikan informasi menu makanan dan minuman secara menggugah selera, panduan reservasi meja, jam buka, dan layanan delivery dengan ramah, hangat, dan informatif.',
        },
        {
            id: 'services_expert',
            name: 'Konsultan Klinik & Jasa Profesional',
            icon: Stethoscope,
            desc: 'Empatik, informatif, terpercaya menjelaskan jadwal dan booking janji temu.',
            prompt: 'Anda adalah Konsultan Layanan & Asisten Informasi profesional dari {workspace}. Berikan penjelasan yang empatik, terpercaya, dan jelas mengenai paket perawatan/jasa, prosedur booking janji temu, dan petunjuk operasional klinik/jasa.',
        },
        {
            id: 'b2b_corporate',
            name: 'Business Representative B2B',
            icon: Building2,
            desc: 'Formal, terstruktur, berfokus pada solusi enterprise & jadwal demo.',
            prompt: 'Anda adalah Business Representative profesional dari {workspace}. Berikan respon yang terstruktur, formal, berbobot, dan fokus pada solusi enterprise, jadwal meeting/demo, serta paket layanan B2B.',
        },
        {
            id: 'academic',
            name: 'Asisten Admisi Akademik & Kampus',
            icon: GraduationCap,
            desc: 'Edukatif, sopan, memandu syarat pendaftaran siswa/mahasiswa baru.',
            prompt: 'Anda adalah Asisten Informasi Pendaftaran & Akademik resmi dari {workspace}. Berikan penjelasan yang edukatif, ramah, dan lengkap mengenai program studi, biaya pendidikan, jadwal perkuliahan, dan panduan pendaftaran mahasiswa/siswa baru.',
        },
    ];

    const applyAiPersona = (preset) => {
        setAiFormData((prev) => ({
            ...prev,
            persona: preset.id,
            prompt_context: preset.prompt,
        }));
    };

    const addKeyword = (kw) => {
        const current = menuFormData.keywords || '';
        const list = current.split(/[,|\n]+/).map((k) => k.trim().toLowerCase()).filter(Boolean);
        if (!list.includes(kw.toLowerCase())) {
            const updated = current ? `${current.trim()}, ${kw}` : kw;
            setMenuFormData('keywords', updated);
        }
    };

    const insertVariable = (field, tag) => {
        const current = menuFormData[field] || '';
        setMenuFormData(field, current ? `${current} ${tag}` : tag);
    };

    const insertRuleVariable = (tag, isEdit = false) => {
        if (isEdit) {
            const current = editData.reply_message || '';
            setEditData('reply_message', current ? `${current} ${tag}` : tag);
        } else {
            const current = ruleData.reply_message || '';
            setRuleData('reply_message', current ? `${current} ${tag}` : tag);
        }
    };

    const insertAwayVariable = (tag) => {
        const current = scheduleFormData.away_message || '';
        setScheduleFormData('away_message', current ? `${current} ${tag}` : tag);
    };

    const handleSaveMenuConfig = (e) => {
        e.preventDefault();
        postMenuConfig('/auto-reply/menu-config', { preserveScroll: true });
    };

    const handleSaveAiConfig = (e) => {
        e.preventDefault();
        postAiConfig('/auto-reply/ai-config', { preserveScroll: true });
    };

    const handleSaveScheduleConfig = (e) => {
        e.preventDefault();
        postScheduleConfig('/auto-reply/schedule-config', { preserveScroll: true });
    };

    const handleAddRule = (e) => {
        e.preventDefault();
        postRule('/auto-reply', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                resetRule();
            },
        });
    };

    const handleToggleRule = (id) => {
        router.post(`/auto-reply/${id}/toggle`, {}, { preserveScroll: true });
    };

    const handleDeleteRule = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus aturan auto-reply ini?')) {
            router.delete(`/auto-reply/${id}`, { preserveScroll: true });
        }
    };

    // Fast seed industry template
    const [selectedIndustry, setSelectedIndustry] = useState('ecommerce');
    const [seedMode, setSeedMode] = useState('replace');
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeedIndustry = (industryKey = selectedIndustry, mode = seedMode) => {
        const industryName = industryTemplates.find((t) => t.id === industryKey)?.title || industryKey;
        const confirmMsg = mode === 'replace'
            ? `Muat template ${industryName}?\nPerhatian: Aturan lama akan digantikan dengan paket template ini.`
            : `Tambahkan aturan template ${industryName} ke daftar aturan yang ada?`;

        if (confirm(confirmMsg)) {
            setIsSeeding(true);
            router.post(
                '/auto-reply/seed-templates',
                { industry: industryKey, mode },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setIsSeeding(false);
                        setIsTemplateModalOpen(false);
                    },
                }
            );
        }
    };

    // Execute interactive simulator
    const executeSimulation = async (textToSend, quoteText = null) => {
        const safeText = String(textToSend || '').trim();
        if (!safeText || isSimulating) return;

        setChatHistory((prev) => [
            ...prev,
            {
                sender: 'user',
                text: safeText,
                quote: quoteText ? quoteText.substring(0, 110) : null,
            },
        ]);
        setSimulatedMessage('');
        setIsSimulating(true);

        try {
            const response = await fetch('/auto-reply/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    message: safeText,
                    device_id: selectedDeviceId || null,
                    simulate_outside_hours: simulateOutsideHours,
                }),
            });

            const result = await response.json();
            setChatHistory((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: result.reply,
                    source: result.source === 'away_schedule'
                        ? 'Luar Jam Kerja (Away Message)'
                        : result.source === 'keyword_rule'
                        ? `Aturan Kata Kunci: ${result.rule_name}`
                        : result.rule_name,
                    isAway: result.source === 'away_schedule',
                    mediaUrl: result.media_url,
                    menuItems: result.menu_items || null,
                    buttons: result.buttons || null,
                    menuStyle: result.menu_style || null,
                    buttonText: result.button_text || null,
                    cta_text: result.cta_text || null,
                    cta_url: result.cta_url || null,
                    action_buttons: result.action_buttons || null,
                },
            ]);

            router.reload({
                only: ['stats', 'autoReplies'],
                preserveScroll: true,
                preserveState: true,
            });
        } catch (err) {
            setChatHistory((prev) => [
                ...prev,
                { sender: 'bot', text: 'Terjadi kendala saat memproses balasan simulasi.', source: 'error' },
            ]);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleRunSimulation = (e) => {
        e.preventDefault();
        executeSimulation(simulatedMessage);
    };

    // Filter rules
    const filteredRules = safeAutoReplies.filter((rule) => {
        const matchesSearch = !ruleSearch ||
            (rule.name && rule.name.toLowerCase().includes(ruleSearch.toLowerCase())) ||
            (rule.keyword && rule.keyword.toLowerCase().includes(ruleSearch.toLowerCase())) ||
            (rule.reply_message && rule.reply_message.toLowerCase().includes(ruleSearch.toLowerCase()));

        const matchesDevice = !ruleDeviceFilter ||
            (ruleDeviceFilter === 'global' ? !rule.device_id : String(rule.device_id) === String(ruleDeviceFilter));

        const matchesStatus = !ruleStatusFilter ||
            (ruleStatusFilter === 'active' ? Boolean(rule.is_active) : !rule.is_active);

        const matchesCategory = !ruleCategoryFilter ||
            (rule.category && rule.category.toLowerCase() === ruleCategoryFilter.toLowerCase());

        return matchesSearch && matchesDevice && matchesStatus && matchesCategory;
    });

    const activeRulesCount = safeAutoReplies.filter((r) => r.is_active).length;

    // Available categories from registered rules
    const existingCategories = Array.from(new Set(safeAutoReplies.map((r) => r.category || 'Penjualan'))).filter(Boolean);

    // Order format generator templates
    const [selectedOrderFormType, setSelectedOrderFormType] = useState('olshop');
    const orderFormTemplates = {
        olshop: "🛍️ *FORMAT ORDER CEPAT*\n\nNama Lengkap:\nNomor HP:\nAlamat Pengiriman (Jl, RT/RW, Kel, Kec, Kota, Kode Pos):\nNama Produk & Jumlah:\nEkspedisi (JNE / J&T / SiCepat):\nMetode Pembayaran (Transfer BCA / Mandiri / QRIS):",
        fnb: "🍽️ *FORMAT PESANAN MAKANAN / TAKEAWAY*\n\nNama Pemesan:\nNomor HP:\nAlamat Antar / Jam Ambil:\nPesanan & Jumlah:\nCatatan Khusus (Level Pedas / Tanpa Bawang):\nMetode Pembayaran:",
        booking: "📅 *FORMAT RESERVASI & JANJI TEMU*\n\nNama Tamu / Pasien:\nNomor WhatsApp:\nLayanan / Treatment yang Dipilih:\nHari & Tanggal Kunjungan:\nPilihan Jam (Pagi / Sore):\nKeluhan / Catatan Khusus:",
        b2b: "💼 *FORMULIR KONSULTASI & DEMO B2B*\n\nNama Representatif:\nNama Perusahaan / Bisnis:\nEmail Bisnis:\nEstimasi Volume Chat / Bulan:\nJadwal Meeting Zoom yang Dikehendaki:\nKebutuhan Spesifik Integrasi:",
    };

    const [copiedForm, setCopiedForm] = useState(false);
    const handleCopyOrderForm = () => {
        const text = orderFormTemplates[selectedOrderFormType];
        navigator.clipboard.writeText(text);
        setCopiedForm(true);
        setTimeout(() => setCopiedForm(false), 2000);
    };

    const handleInsertOrderFormToNewRule = () => {
        setRuleData((prev) => ({
            ...prev,
            name: selectedOrderFormType === 'olshop' ? 'Format Pemesanan Cepat' : selectedOrderFormType === 'fnb' ? 'Format Pesanan Makanan' : 'Format Booking Janji Temu',
            category: 'Penjualan',
            keyword: '2, order, pesan, beli, format order',
            reply_message: orderFormTemplates[selectedOrderFormType],
        }));
        setIsOrderGenModalOpen(false);
        setIsAddModalOpen(true);
    };

    const toggleDayInSchedule = (dayNum) => {
        const current = [...(scheduleFormData.days || [])];
        if (current.includes(dayNum)) {
            if (current.length > 1) {
                setScheduleFormData('days', current.filter((d) => d !== dayNum));
            }
        } else {
            setScheduleFormData('days', [...current, dayNum].sort((a, b) => a - b));
        }
    };

    const dayLabels = [
        { num: 1, label: 'Sen' },
        { num: 2, label: 'Sel' },
        { num: 3, label: 'Rab' },
        { num: 4, label: 'Kam' },
        { num: 5, label: 'Jum' },
        { num: 6, label: 'Sab' },
        { num: 7, label: 'Min' },
    ];

    return (
        <AppLayout title="Auto-Reply & AI Bot">
            <Head title="Auto-Reply & Asisten AI Gemini — MARDIRA WA" />

            <div className="space-y-5 animate-fade-in-up pb-8">
                {/* 1. TOP HEADER & UNIFIED ACTION BAR */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#e6ebf1]">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-[#1677ff] shrink-0" />
                                <span>Auto-Reply & Asisten AI Cerdas</span>
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border transition-colors ${
                                isMasterOn
                                    ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                    : 'bg-[#fffbe6] text-[#faad14] border-[#ffe58f]'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-[#52c41a] animate-pulse' : 'bg-[#faad14]'}`} />
                                <span className="hidden sm:inline">{isMasterOn ? 'Smart Responder 24/7 (Aktif)' : 'Mode Nonaktif (Manual)'}</span>
                                <span className="sm:hidden">{isMasterOn ? 'Aktif' : 'Nonaktif'}</span>
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                            Otomatisasi respon cerdas untuk UMKM & Bisnis Menengah: Kata Kunci, Jam Kerja, Menu Interaktif, dan Asisten AI Gemini.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* 1. Generator Format Order */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOrderGenModalOpen(true)}
                            className="h-9 px-3 text-xs font-semibold border-[#e6ebf1] text-slate-700 hover:text-[#1677ff] hover:bg-[#e6f4ff]/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            title="Buka template formulir pemesanan cepat"
                        >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Format Order WhatsApp</span>
                        </Button>

                        {/* 2. Muat Template Bisnis */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="h-9 px-3 text-xs font-semibold border-[#e6ebf1] text-slate-700 hover:text-[#1677ff] hover:bg-[#e6f4ff]/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            title="Pilih template industri bisnis siap pakai"
                        >
                            <Store className="w-3.5 h-3.5 text-[#1677ff]" />
                            <span>Template Bisnis UMKM</span>
                        </Button>

                        {/* 3. Tambah Aturan */}
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-9 px-4 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white rounded-xl shadow-[0_2px_4px_rgba(22,119,255,0.2)] gap-1.5 cursor-pointer transition-all flex items-center"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span>Tambah Aturan Kata Kunci</span>
                        </Button>
                    </div>
                </div>

                {/* 2. MASTER TOGGLE SWITCH CARD (GLOBAL ON/OFF) */}
                <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isMasterOn
                        ? 'bg-gradient-to-r from-[#f6ffed]/80 via-white to-[#f6ffed]/30 border-[#b7eb8f]'
                        : 'bg-gradient-to-r from-[#fffbe6]/80 via-white to-slate-50/70 border-[#ffe58f]'
                }`}>
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs transition-colors ${
                            isMasterOn
                                ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                : 'bg-[#fffbe6] text-[#faad14] border-[#ffe58f]'
                        }`}>
                            <Power className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                                    Sakelar Utama Auto-Reply & Asisten Bot
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isMasterOn
                                        ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                        : 'bg-[#fffbe6] text-[#faad14] border-[#ffe58f]'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-[#52c41a] animate-pulse' : 'bg-[#faad14]'}`} />
                                    {isMasterOn ? 'STATUS: AKTIF MERESPON' : 'STATUS: NONAKTIF (MANUAL)'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                                {isMasterOn
                                    ? 'Bot aktif merespon pesan WhatsApp pelanggan secara otomatis 24/7 sesuai aturan kata kunci, jam kerja, atau AI Gemini.'
                                    : 'Seluruh respon bot otomatis sedang dinonaktifkan sementara. Pesan masuk hanya dapat ditangani manual oleh staf di Live Chat.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-[#e6ebf1] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <span className={`text-xs font-bold select-none ${isMasterOn ? 'text-[#52c41a]' : 'text-slate-500'}`}>
                            {isMasterOn ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <Switch
                            checked={isMasterOn}
                            onCheckedChange={handleToggleMaster}
                            disabled={isTogglingMaster}
                            size="default"
                            id="master-autoreply-switch"
                            title="Klik untuk mengaktifkan atau menonaktifkan fitur auto-reply secara global"
                        />
                    </div>
                </div>

                {/* 3. FOUR BALANCED OVERVIEW STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Rules */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/70">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Total Aturan
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/70 font-mono">
                                Rules
                            </span>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums mt-1">
                            {stats?.total_rules ?? safeAutoReplies.length}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                            Aturan kata kunci respon terdaftar
                        </div>
                        <div className="mt-3 pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[10px]">Filter Kategori:</span>
                            <span className="font-semibold text-slate-700 text-[10px]">{existingCategories.length || 1} Kategori</span>
                        </div>
                    </div>

                    {/* Card 2: Active Rules */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#f6ffed] text-[#52c41a] flex items-center justify-center border border-[#b7eb8f]">
                                    <Zap className="w-4 h-4 text-[#52c41a]" />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Aturan Aktif
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-[#52c41a] bg-[#f6ffed] px-2 py-0.5 rounded-full border border-[#b7eb8f]">
                                Ready
                            </span>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-[#52c41a] font-mono tabular-nums mt-1">
                            {activeRulesCount}{' '}
                            <span className="text-sm font-medium text-slate-400 font-sans">
                                / {safeAutoReplies.length}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                            Siap merespon chat masuk WhatsApp
                        </div>
                        <div className="mt-3 pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[10px]">Status Sakelar:</span>
                            <span className={`font-semibold text-[10px] flex items-center gap-1 ${isMasterOn ? 'text-[#52c41a]' : 'text-[#faad14]'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-[#52c41a]' : 'bg-[#faad14]'}`} />
                                {isMasterOn ? 'Aktif Merespon' : 'Nonaktif'}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Total Hits */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]">
                                    <CheckCheck className="w-4 h-4 text-[#1677ff]" />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Pesan Terjawab
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-[#1677ff] bg-[#e6f4ff] px-2 py-0.5 rounded-full border border-[#91caff]">
                                Hits
                            </span>
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums mt-1">
                            {(stats?.total_hits ?? safeAutoReplies.reduce((acc, r) => acc + (r.hit_count || 0), 0)).toLocaleString('id-ID')}{' '}
                            <span className="text-sm font-medium text-slate-400 font-sans">Kali</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                            Akumulasi otomatisasi sukses
                        </div>
                        <div className="mt-3 pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[10px]">Kecepatan Respon:</span>
                            <span className="font-semibold text-slate-700 text-[10px] font-mono">&lt; 1 Detik (Instant)</span>
                        </div>
                    </div>

                    {/* Card 4: Business Working Hours */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Jam Operasional
                                </span>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                scheduleConfig.enabled
                                    ? (scheduleConfig.is_currently_outside ? 'bg-[#fffbe6] text-[#faad14] border-[#ffe58f]' : 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]')
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                {scheduleConfig.enabled ? (scheduleConfig.is_currently_outside ? 'Luar Jam' : 'Jam Buka') : '24/7 Aktif'}
                            </span>
                        </div>
                        <div className="text-lg font-bold tracking-tight text-slate-900 font-mono truncate mt-1">
                            {scheduleConfig.enabled ? `${scheduleConfig.start} - ${scheduleConfig.end} WIB` : 'Non-Stop 24 Jam'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {scheduleConfig.enabled ? scheduleConfig.operating_text : 'Melayani otomatis tanpa batas waktu'}
                        </div>
                        <div className="mt-3 pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[10px]">Mode Luar Jam:</span>
                            <span className="font-semibold text-[#1677ff] text-[10px] capitalize">
                                {scheduleConfig.enabled ? scheduleConfig.away_mode?.replace('_', ' ') : 'Standar'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. MAIN WORKSPACE: 2-COLUMN BALANCED LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: TABS & CONFIGURATION CARDS (7 or 8 cols) */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        {/* SEGMENTED TAB NAVIGATION (MANTIS STYLE) */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-[#e6ebf1] w-full sm:w-fit overflow-x-auto shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <button
                                type="button"
                                onClick={() => setActiveTab('rules')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'rules'
                                        ? 'bg-white text-[#1677ff] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Bot className="w-3.5 h-3.5 text-[#1677ff]" />
                                <span>Aturan Kata Kunci</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#e6f4ff] text-[#1677ff] font-bold border border-[#91caff]/40">
                                    {safeAutoReplies.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('greeting')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'greeting'
                                        ? 'bg-white text-[#1677ff] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <ListChecks className="w-3.5 h-3.5 text-[#1677ff]" />
                                <span>Sambutan & Menu</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${
                                    menuFormData.enabled
                                        ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {menuFormData.enabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('ai')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'ai'
                                        ? 'bg-white text-[#1677ff] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#1677ff]" />
                                <span>Asisten AI Gemini</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${
                                    aiFormData.enabled
                                        ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {aiFormData.enabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('schedule')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'schedule'
                                        ? 'bg-white text-[#1677ff] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Jam Kerja & Away</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${
                                    scheduleFormData.enabled
                                        ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {scheduleFormData.enabled ? 'Jadwal On' : '24 Jam'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('templates')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'templates'
                                        ? 'bg-white text-[#1677ff] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Store className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Template Industri</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                    5 Paket
                                </span>
                            </button>
                        </div>

                        {/* TAB 1: ATURAN KATA KUNCI (KEYWORD RULES TABLE WITH CATEGORY FILTER) */}
                        {activeTab === 'rules' && (
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                                {/* Filter & Search Toolbar */}
                                <div className="p-4 border-b border-[#f0f0f0] bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={ruleSearch}
                                                onChange={(e) => setRuleSearch(e.target.value)}
                                                placeholder="Cari nama aturan, kata kunci, balasan..."
                                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#e6ebf1] bg-white text-xs focus:border-[#1677ff] focus:outline-none placeholder-slate-400 shadow-2xs"
                                            />
                                            {ruleSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setRuleSearch('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Category Filter */}
                                        <select
                                            value={ruleCategoryFilter}
                                            onChange={(e) => setRuleCategoryFilter(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-lg border border-[#e6ebf1] bg-white text-xs focus:border-[#1677ff] focus:outline-none text-slate-700 shadow-2xs font-medium"
                                        >
                                            <option value="">Semua Kategori</option>
                                            <option value="Penjualan">Penjualan & Order</option>
                                            <option value="Layanan & CS">Layanan & CS</option>
                                            <option value="Informasi">Informasi & Lokasi</option>
                                            <option value="Menu">Menu Hidangan</option>
                                            <option value="Biaya">Biaya & SPP</option>
                                            <option value="Teknis">Teknis & API</option>
                                        </select>

                                        {/* Status Filter */}
                                        <select
                                            value={ruleStatusFilter}
                                            onChange={(e) => setRuleStatusFilter(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-lg border border-[#e6ebf1] bg-white text-xs focus:border-[#1677ff] focus:outline-none text-slate-700 shadow-2xs font-medium"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="active">Hanya Aktif</option>
                                            <option value="inactive">Hanya Nonaktif</option>
                                        </select>

                                        {/* Device Filter */}
                                        <select
                                            value={ruleDeviceFilter}
                                            onChange={(e) => setRuleDeviceFilter(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-lg border border-[#e6ebf1] bg-white text-xs focus:border-[#1677ff] focus:outline-none text-slate-700 shadow-2xs"
                                        >
                                            <option value="">Semua Nomor</option>
                                            <option value="global">Khusus Semua Nomor (Global)</option>
                                            {safeDevices.map((device) => (
                                                <option key={device.id} value={device.id}>
                                                    {device.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="text-[11px] text-slate-500 font-medium self-end md:self-auto shrink-0">
                                        Menampilkan <strong className="font-mono text-slate-900">{filteredRules.length}</strong> dari {safeAutoReplies.length} aturan
                                    </div>
                                </div>

                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#fafafb] text-slate-500 uppercase tracking-wider font-semibold text-[10px] border-b border-[#e6ebf1]">
                                            <tr>
                                                <th className="py-3 px-4 min-w-[200px]">Aturan, Kategori & Kata Kunci</th>
                                                <th className="py-3 px-3 w-[105px]">Tipe Pemicu</th>
                                                <th className="py-3 px-3 min-w-[180px]">Pesan Balasan</th>
                                                <th className="py-3 px-2 text-center w-[75px]">Terjawab</th>
                                                <th className="py-3 px-3 text-center w-[120px]">Status</th>
                                                <th className="py-3 px-4 text-right w-[85px]">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f0f0f0]">
                                            {filteredRules.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                                        <div className="flex flex-col items-center justify-center space-y-2">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <Bot className="w-5 h-5" />
                                                            </div>
                                                            <p className="font-semibold text-slate-700 text-xs">
                                                                {ruleSearch || ruleStatusFilter || ruleDeviceFilter || ruleCategoryFilter
                                                                    ? 'Tidak Ada Aturan yang Cocok dengan Filter'
                                                                    : 'Belum Ada Aturan Kata Kunci Terdaftar'}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 max-w-sm">
                                                                Klik tombol "Tambah Aturan Kata Kunci" atau "Template Bisnis UMKM" untuk memuat aturan otomatis siap pakai.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRules.map((rule) => {
                                                    const kws = (rule.keyword || '').split(/[,|\n]+/).map((k) => k.trim()).filter(Boolean);
                                                    const visibleKws = kws.slice(0, 3);
                                                    const remainingKws = kws.length - 3;

                                                    return (
                                                        <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                                                            <td className="py-3 px-4 align-top">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-900 text-xs leading-snug">
                                                                        {rule.name}
                                                                    </span>
                                                                    {rule.category && (
                                                                        <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                                                            {rule.category}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    {rule.device ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 font-medium">
                                                                            <Smartphone className="w-2.5 h-2.5 text-[#1677ff]" />
                                                                            <span>{rule.device.name}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1">
                                                                            <span>🌐</span>
                                                                            <span>Semua Nomor (Global)</span>
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                                    {visibleKws.map((k, kIdx) => {
                                                                        const isNum = /^\d+$/.test(k);
                                                                        return (
                                                                            <span
                                                                                key={kIdx}
                                                                                className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md font-semibold border ${
                                                                                    isNum
                                                                                        ? 'bg-[#e6f4ff] text-[#1677ff] border-[#91caff]/40 font-bold'
                                                                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                                                                }`}
                                                                            >
                                                                                {isNum ? `[${k}]` : k}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {remainingKws > 0 && (
                                                                        <span
                                                                            className="text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-md border border-slate-200 cursor-help transition-colors"
                                                                            title={`Semua kata kunci: ${kws.join(', ')}`}
                                                                        >
                                                                            +{remainingKws} lagi
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 align-top text-slate-600">
                                                                <span
                                                                    className={`capitalize font-semibold text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                                                        rule.trigger_type === 'exact'
                                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                            : rule.trigger_type === 'starts_with'
                                                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                            : 'bg-[#e6f4ff] text-[#1677ff] border-[#91caff]/40'
                                                                    }`}
                                                                >
                                                                    {rule.trigger_type === 'exact'
                                                                        ? 'Cocok Persis'
                                                                        : rule.trigger_type === 'starts_with'
                                                                        ? 'Awalan Kata'
                                                                        : 'Mengandung'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 align-top text-slate-600 text-xs">
                                                                <div className="line-clamp-2 text-xs leading-snug text-slate-700 font-normal whitespace-pre-wrap" title={rule.reply_message}>
                                                                    {rule.reply_message}
                                                                </div>
                                                                {rule.cta_url && (
                                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#1677ff] bg-[#e6f4ff]/60 px-2 py-0.5 rounded-md border border-[#91caff]/40 w-fit font-medium">
                                                                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-[#1677ff]" />
                                                                        <span className="font-semibold">{rule.cta_text || 'Tombol Link'}</span>
                                                                        <span className="text-slate-400 font-mono text-[9px] truncate max-w-[120px]">({rule.cta_url})</span>
                                                                    </div>
                                                                )}
                                                                {rule.action_buttons && Array.isArray(rule.action_buttons) && rule.action_buttons.length > 0 && (
                                                                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                                                                        {rule.action_buttons.map((b, bI) => (
                                                                            <span key={bI} className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                                                                                <CornerDownLeft className="w-2 h-2 text-slate-500" />
                                                                                <span>{b}</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {rule.reply_media_url && (
                                                                    <div className="text-[10px] text-[#1677ff] mt-1 font-mono truncate flex items-center gap-1">
                                                                        <span>📎</span>
                                                                        <span className="truncate">{rule.reply_media_url}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-center align-top">
                                                                <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                                                                    {rule.hit_count}
                                                                </span>
                                                                <span className="block text-[9px] text-slate-400 font-sans">kali</span>
                                                            </td>

                                                            {/* STATUS TOGGLE */}
                                                            <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                                                                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full shadow-2xs">
                                                                    <Switch
                                                                        checked={Boolean(rule.is_active)}
                                                                        onCheckedChange={() => handleToggleRule(rule.id)}
                                                                        size="sm"
                                                                        id={`rule-switch-${rule.id}`}
                                                                        title={rule.is_active ? 'Klik untuk menonaktifkan aturan ini' : 'Klik untuk mengaktifkan aturan ini'}
                                                                    />
                                                                    <span
                                                                        className={`text-[10px] font-bold select-none cursor-pointer ${
                                                                            rule.is_active ? 'text-[#52c41a]' : 'text-slate-400'
                                                                        }`}
                                                                        onClick={() => handleToggleRule(rule.id)}
                                                                    >
                                                                        {rule.is_active ? 'Aktif' : 'Nonaktif'}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* ACTIONS */}
                                                            <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenEdit(rule)}
                                                                        className="p-1.5 text-slate-400 hover:text-[#1677ff] rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-[#91caff]/40"
                                                                        title="Edit Aturan"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteRule(rule.id)}
                                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                                                        title="Hapus Aturan"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SAMBUTAN & MENU */}
                        {activeTab === 'greeting' && (
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]/40">
                                            <ListChecks className="w-4 h-4 text-[#1677ff]" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                                <span>Respon Menu Sambutan Otomatis</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                                    menuFormData.enabled
                                                        ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    {menuFormData.enabled ? 'Aktif 24/7' : 'Nonaktif'}
                                                </span>
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Kirim salam pembuka dan daftar menu bernomor saat pelanggan menyapa dengan kata kunci (<strong>halo</strong>, <strong>info</strong>, <strong>menu</strong>, dll).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveMenuConfig} className="space-y-5 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-[#e6ebf1]">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#e6ebf1]">
                                            <div>
                                                <span className="font-bold text-slate-800 block text-xs">
                                                    Status Respon Menu Sambutan
                                                </span>
                                                <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                                                    Kirim daftar menu layanan otomatis saat disapa.
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[11px] font-bold ${menuFormData.enabled ? 'text-[#52c41a]' : 'text-slate-400'}`}>
                                                    {menuFormData.enabled ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                                <Switch
                                                    checked={menuFormData.enabled}
                                                    onCheckedChange={(val) => setMenuFormData('enabled', val)}
                                                    id="greeting_menu_enabled"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="font-semibold text-slate-700 block mb-1">
                                                Target Nomor / Server WhatsApp
                                            </label>
                                            <select
                                                value={menuFormData.device_id}
                                                onChange={(e) => setMenuFormData('device_id', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] bg-white text-xs focus:border-[#1677ff] focus:outline-none text-slate-700"
                                            >
                                                <option value="">Semua Nomor WA Terhubung (Global)</option>
                                                {safeDevices.map((device) => (
                                                    <option key={device.id} value={device.id}>
                                                        {device.name} ({device.phone_number || 'Belum ada nomor'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Menu Format Selection */}
                                    <div>
                                        <label className="font-bold text-slate-800 text-xs block mb-2">
                                            Format Susunan Tampilan Menu di WhatsApp:
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div
                                                onClick={() => setMenuFormData('style', 'standard')}
                                                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                                                    menuFormData.style === 'standard'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff]/30 ring-1 ring-[#1677ff]'
                                                        : 'border-[#e6ebf1] bg-white'
                                                }`}
                                            >
                                                <div className="font-bold text-xs text-slate-900 flex items-center justify-between pb-1">
                                                    <span>🔢 Format Bernomor (1, 2, 3)</span>
                                                    {menuFormData.style === 'standard' && <span className="text-[#1677ff] font-bold">✓</span>}
                                                </div>
                                                <p className="text-[11px] text-slate-500">Tampilan teks bernomor natural, bersih dan sangat mudah dibaca.</p>
                                            </div>

                                            <div
                                                onClick={() => setMenuFormData('style', 'boxed')}
                                                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                                                    menuFormData.style === 'boxed'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff]/30 ring-1 ring-[#1677ff]'
                                                        : 'border-[#e6ebf1] bg-white'
                                                }`}
                                            >
                                                <div className="font-bold text-xs text-slate-900 flex items-center justify-between pb-1">
                                                    <span>🔲 Format Kotak [ 1 ], [ 2 ]</span>
                                                    {menuFormData.style === 'boxed' && <span className="text-[#1677ff] font-bold">✓</span>}
                                                </div>
                                                <p className="text-[11px] text-slate-500">Pilihan nomor ditonjolkan dengan kurung kotak modern & terstruktur.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Triggers */}
                                    <div className="p-4 bg-slate-50/60 rounded-xl border border-[#e6ebf1] space-y-2">
                                        <label className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Kata Kunci Pemicu Sambutan (*Greeting Triggers*)</span>
                                        </label>
                                        <textarea
                                            rows="2"
                                            value={menuFormData.keywords}
                                            onChange={(e) => setMenuFormData('keywords', e.target.value)}
                                            placeholder="hi, halo, menu, info, bantuan, p, siang..."
                                            className="w-full p-2.5 rounded-lg border border-[#e6ebf1] bg-white font-mono text-xs focus:border-[#1677ff] focus:outline-none"
                                        />
                                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                            <span className="text-[10px] text-slate-400 font-medium">Klik untuk tambah cepat:</span>
                                            {['halo', 'hi', 'p', 'menu', 'info', 'bantuan', 'start', 'assalamualaikum', 'tes', 'admin', 'cs'].map((kw) => (
                                                <button
                                                    key={kw}
                                                    type="button"
                                                    onClick={() => addKeyword(kw)}
                                                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white hover:bg-blue-50 text-slate-700 hover:text-[#1677ff] border border-slate-200 transition-colors cursor-pointer"
                                                >
                                                    + {kw}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Header & Footer */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-semibold text-slate-700">Teks Salam Pembuka (Header)</label>
                                                <div className="flex items-center gap-1">
                                                    {['{nama}', '{salam}', '{workspace}'].map((tag) => (
                                                        <button
                                                            key={tag}
                                                            type="button"
                                                            onClick={() => insertVariable('header', tag)}
                                                            className="text-[9px] font-mono px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea
                                                rows="3"
                                                value={menuFormData.header}
                                                onChange={(e) => setMenuFormData('header', e.target.value)}
                                                placeholder="Halo {nama}, selamat datang di layanan resmi..."
                                                className="w-full p-2.5 rounded-lg border border-[#e6ebf1] bg-white text-xs focus:border-[#1677ff] focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-semibold text-slate-700">Teks Petunjuk Penutup (Footer)</label>
                                                <div className="flex items-center gap-1">
                                                    {['{nama}', '{jam_operasional}'].map((tag) => (
                                                        <button
                                                            key={tag}
                                                            type="button"
                                                            onClick={() => insertVariable('footer', tag)}
                                                            className="text-[9px] font-mono px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea
                                                rows="3"
                                                value={menuFormData.footer}
                                                onChange={(e) => setMenuFormData('footer', e.target.value)}
                                                placeholder="Silakan balas dengan mengetik nomor pilihan Anda..."
                                                className="w-full p-2.5 rounded-lg border border-[#e6ebf1] bg-white text-xs focus:border-[#1677ff] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processingMenu}
                                            className="h-9 px-5 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white rounded-lg shadow-xs cursor-pointer"
                                        >
                                            {processingMenu ? 'Menyimpan...' : 'Simpan Pengaturan Sambutan & Menu'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 3: ASISTEN AI GEMINI & KNOWLEDGE BASE */}
                        {activeTab === 'ai' && (
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-5">
                                <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]/40 flex items-center justify-center font-bold">
                                            <Sparkles className="w-4 h-4 text-[#1677ff]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                                                Asisten Cerdas AI Gemini & FAQ Bisnis
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Merespon pertanyaan pelanggan secara alami dan cerdas berbasis profil bisnis Anda.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold ${aiFormData.enabled ? 'text-[#52c41a]' : 'text-slate-400'}`}>
                                            {aiFormData.enabled ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <Switch
                                            checked={aiFormData.enabled}
                                            onCheckedChange={(val) => setAiFormData('enabled', val)}
                                            id="ai_gemini_enabled"
                                        />
                                    </div>
                                </div>

                                {/* 1-Click AI Persona Selection */}
                                <div>
                                    <label className="font-bold text-xs text-slate-800 block mb-2">
                                        Pilih Karakter & Gaya Bahasa AI (1-Click Persona):
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {aiPersonaPresets.map((preset) => {
                                            const Icon = preset.icon;
                                            const isSelected = aiFormData.persona === preset.id;
                                            return (
                                                <div
                                                    key={preset.id}
                                                    onClick={() => applyAiPersona(preset)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'border-[#1677ff] bg-[#e6f4ff]/40 ring-1 ring-[#1677ff]'
                                                            : 'border-[#e6ebf1] hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2 pb-1">
                                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#1677ff]' : 'text-slate-500'}`} />
                                                            <span className="font-bold text-xs text-slate-900">{preset.name}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 leading-snug">{preset.desc}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-semibold mt-2 ${isSelected ? 'text-[#1677ff]' : 'text-slate-400'}`}>
                                                        {isSelected ? '✓ Persona Terpilih' : 'Gunakan Persona'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <form onSubmit={handleSaveAiConfig} className="space-y-4 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-800 mb-1">
                                            Instruksi Sistem AI (*Prompt Context*):
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={aiFormData.prompt_context}
                                            onChange={(e) => setAiFormData('prompt_context', e.target.value)}
                                            placeholder="Tuliskan peran dan batasan AI dalam menjawab..."
                                            className="w-full p-3 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none leading-relaxed"
                                        />
                                    </div>

                                    {/* Business Knowledge Base & FAQ Input */}
                                    <div className="p-3.5 bg-slate-50/70 rounded-xl border border-[#e6ebf1] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>Basis Pengetahuan & FAQ Bisnis Anda (*Knowledge Base*)</span>
                                            </label>
                                            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                                                Paling Penting untuk UMKM
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Tempelkan daftar harga, FAQ, garansi, rekening, jam buka, atau deskripsi menu Anda di sini. AI akan memprioritaskan menjawab sesuai informasi resmi ini!
                                        </p>
                                        <textarea
                                            rows="5"
                                            value={aiFormData.knowledge_base}
                                            onChange={(e) => setAiFormData('knowledge_base', e.target.value)}
                                            placeholder={`Contoh Informasi Bisnis:\n- Produk Utama: Paket Glowing Skincare Rp 120.000\n- Alamat Toko: Jl. Melati No. 10 Bandung (Buka 09.00 - 18.00)\n- Rekening: BCA 12345678 a.n Toko Sukses\n- Ongkir: Subsidi Rp 10.000 untuk pembelian min. 2 paket`}
                                            className="w-full p-3 rounded-lg border border-[#e6ebf1] bg-white font-mono text-xs focus:border-[#1677ff] focus:outline-none leading-relaxed"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                                                <Key className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Google Gemini API Key (Opsional)</span>
                                            </label>
                                            <span className="text-[10px] text-slate-400 font-mono">Gemini 1.5 Flash</span>
                                        </div>
                                        <input
                                            type="password"
                                            value={aiFormData.api_key}
                                            onChange={(e) => setAiFormData('api_key', e.target.value)}
                                            placeholder="AIzaSy... (Biarkan kosong untuk menggunakan sistem AI bawaan server)"
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs font-mono focus:border-[#1677ff] focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <Button
                                            type="submit"
                                            disabled={processingAi}
                                            className="h-9 px-5 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white rounded-lg shadow-xs cursor-pointer"
                                        >
                                            {processingAi ? 'Menyimpan...' : 'Simpan Pengaturan AI & Pengetahuan'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 4: JAM KERJA & AWAY MESSAGE */}
                        {activeTab === 'schedule' && (
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-5">
                                <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center font-bold">
                                            <Clock className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                                                Jadwal Jam Kerja & Pesan Luar Operasional (Away Message)
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Atur jam buka toko Anda dan kirimkan respon otomatis saat pelanggan chat di luar jam operasional.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold ${scheduleFormData.enabled ? 'text-[#52c41a]' : 'text-slate-400'}`}>
                                            {scheduleFormData.enabled ? 'Jadwal Aktif' : 'Nonaktif (24/7)'}
                                        </span>
                                        <Switch
                                            checked={scheduleFormData.enabled}
                                            onCheckedChange={(val) => setScheduleFormData('enabled', val)}
                                            id="schedule_enabled_toggle"
                                        />
                                    </div>
                                </div>

                                <form onSubmit={handleSaveScheduleConfig} className="space-y-4 text-xs">
                                    {/* Hari Aktif Operasional */}
                                    <div>
                                        <label className="font-bold text-xs text-slate-800 block mb-2">
                                            Hari Buka Operasional:
                                        </label>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {dayLabels.map((d) => {
                                                const isDaySelected = (scheduleFormData.days || []).includes(d.num);
                                                return (
                                                    <button
                                                        key={d.num}
                                                        type="button"
                                                        onClick={() => toggleDayInSchedule(d.num)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                                            isDaySelected
                                                                ? 'bg-[#1677ff] text-white border-[#1677ff] shadow-xs'
                                                                : 'bg-white text-slate-500 border-[#e6ebf1] hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {d.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Rentang Jam Operasional */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="font-semibold text-slate-700 block mb-1">
                                                Jam Buka (WIB):
                                            </label>
                                            <input
                                                type="time"
                                                value={scheduleFormData.start}
                                                onChange={(e) => setScheduleFormData('start', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] bg-white text-xs font-mono font-bold text-slate-800"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-slate-700 block mb-1">
                                                Jam Tutup (WIB):
                                            </label>
                                            <input
                                                type="time"
                                                value={scheduleFormData.end}
                                                onChange={(e) => setScheduleFormData('end', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] bg-white text-xs font-mono font-bold text-slate-800"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Mode Respon Luar Jam Kerja */}
                                    <div>
                                        <label className="font-bold text-xs text-slate-800 block mb-1.5">
                                            Perilaku Respon di Luar Jam Operasional:
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div
                                                onClick={() => setScheduleFormData('away_mode', 'fallback_only')}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                                    scheduleFormData.away_mode === 'fallback_only'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff]/40 ring-1 ring-[#1677ff]'
                                                        : 'border-[#e6ebf1] bg-white'
                                                }`}
                                            >
                                                <div className="font-bold text-xs text-slate-900 pb-1">
                                                    Pintar (Rekomendasi)
                                                </div>
                                                <p className="text-[11px] text-slate-500">
                                                    Menu dan kata kunci produk tetap dibalas otomatis. Pesan luar jam hanya dikirim jika pelanggan menanyakan CS atau pesan tidak dikenali.
                                                </p>
                                            </div>

                                            <div
                                                onClick={() => setScheduleFormData('away_mode', 'always_prepend')}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                                    scheduleFormData.away_mode === 'always_prepend'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff]/40 ring-1 ring-[#1677ff]'
                                                        : 'border-[#e6ebf1] bg-white'
                                                }`}
                                            >
                                                <div className="font-bold text-xs text-slate-900 pb-1">
                                                    Sematkan Info Jam
                                                </div>
                                                <p className="text-[11px] text-slate-500">
                                                    Tetap membalas normal, namun ditambahkan catatan <em>[Toko Sedang Tutup]</em> di bagian atas setiap balasan.
                                                </p>
                                            </div>

                                            <div
                                                onClick={() => setScheduleFormData('away_mode', 'always_away')}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                                    scheduleFormData.away_mode === 'always_away'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff]/40 ring-1 ring-[#1677ff]'
                                                        : 'border-[#e6ebf1] bg-white'
                                                }`}
                                            >
                                                <div className="font-bold text-xs text-slate-900 pb-1">
                                                    Ketat (Always Away)
                                                </div>
                                                <p className="text-[11px] text-slate-500">
                                                    Semua pesan masuk di luar jam kerja langsung dijawab dengan Pesan Luar Jam Kerja tanpa menjalankan menu.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Away Message Editor */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="font-semibold text-slate-800">
                                                Isi Pesan Luar Jam Kerja (*Away Message*):
                                            </label>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <span className="text-[10px] text-slate-400">Sisipkan:</span>
                                                {['{nama}', '{jam_operasional}', '{hari}', '{workspace}'].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => insertAwayVariable(tag)}
                                                        className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 transition-colors"
                                                    >
                                                        + {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            rows="4"
                                            value={scheduleFormData.away_message}
                                            onChange={(e) => setScheduleFormData('away_message', e.target.value)}
                                            className="w-full p-3 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none leading-relaxed"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <Button
                                            type="submit"
                                            disabled={processingSchedule}
                                            className="h-9 px-5 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white rounded-lg shadow-xs cursor-pointer"
                                        >
                                            {processingSchedule ? 'Menyimpan...' : 'Simpan Jadwal Operasional'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 5: TEMPLATE INDUSTRI (5 PRESET BISNIS) */}
                        {activeTab === 'templates' && (
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-4">
                                <div className="border-b border-[#f0f0f0] pb-3">
                                    <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                                        <Store className="w-4 h-4 text-[#1677ff]" />
                                        <span>Paket Template Chatbot Siap Pakai untuk Segala Bisnis</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Pilih bidang bisnis Anda. Sistem akan secara otomatis mengonfigurasi kata kunci, format order, rekening, dan daftar menu layanan yang tepat.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {industryTemplates.map((tpl) => (
                                        <div
                                            key={tpl.id}
                                            className="p-4 rounded-xl border border-[#e6ebf1] hover:border-[#1677ff] transition-all bg-white flex flex-col justify-between hover:shadow-sm"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between pb-1.5">
                                                    <span className="font-bold text-xs text-slate-900">{tpl.title}</span>
                                                    <span className="text-[10px] font-semibold text-[#1677ff] bg-[#e6f4ff] px-2 py-0.5 rounded-full border border-[#91caff]/40">
                                                        {tpl.badge}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                                                    {tpl.description}
                                                </p>
                                                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    <span className="text-[10px] font-bold text-slate-600 block">Aturan Bawaan Paket ({tpl.rules_count}):</span>
                                                    <ul className="text-[10px] text-slate-500 space-y-0.5 list-disc list-inside">
                                                        {tpl.sample_rules.map((sr, sIdx) => (
                                                            <li key={sIdx}>{sr}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="mt-3.5 pt-2.5 border-t border-[#f0f0f0] flex items-center justify-between gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSeedIndustry(tpl.id, 'append')}
                                                    className="h-8 text-[11px] font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex-1 cursor-pointer"
                                                >
                                                    + Tambahkan
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => handleSeedIndustry(tpl.id, 'replace')}
                                                    className="h-8 text-[11px] font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white rounded-lg flex-1 cursor-pointer shadow-xs"
                                                >
                                                    Pasang Paket Ini
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: STICKY REAL-TIME WHATSAPP BOT SIMULATOR */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-3 sticky top-20">
                        <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-[670px] relative">
                            {/* WhatsApp Desktop Header with Device Selector & Testing Mode */}
                            <div className="p-3 bg-[#0b0f17] text-white flex flex-col gap-2 border-b border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/40 flex items-center justify-center font-bold text-xs">
                                                WA
                                            </div>
                                            <span className={`w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-[#0b0f17] ${isMasterOn ? 'bg-[#52c41a]' : 'bg-[#faad14]'}`} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs text-slate-100">Simulator WhatsApp Bisnis</div>
                                            <div className={`text-[10px] font-medium flex items-center gap-1 ${isMasterOn ? 'text-[#52c41a]' : 'text-amber-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-[#52c41a] animate-pulse' : 'bg-amber-400'}`} />
                                                {isMasterOn ? 'Online & Auto-Responder' : 'Bot Nonaktif (Simulasi)'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setChatHistory([{ sender: 'bot', text: 'Chat simulasi telah dibersihkan. Silakan mulai chat baru.', source: 'Reset' }])}
                                        className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
                                        title="Bersihkan riwayat simulasi"
                                    >
                                        Bersihkan
                                    </button>
                                </div>

                                {/* Target Device & Away Simulation Controls */}
                                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                                    <select
                                        value={selectedDeviceId}
                                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none flex-1 truncate"
                                    >
                                        <option value="">Semua Nomor WA (Global)</option>
                                        {safeDevices.map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.name}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => setSimulateOutsideHours(!simulateOutsideHours)}
                                        className={`text-[10px] font-semibold px-2 py-1 rounded border flex items-center gap-1 transition-colors cursor-pointer ${
                                            simulateOutsideHours
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                        }`}
                                        title="Simulasikan waktu chat saat kantor sedang tutup"
                                    >
                                        {simulateOutsideHours ? <Moon className="w-3 h-3 text-amber-400" /> : <Sun className="w-3 h-3" />}
                                        <span>{simulateOutsideHours ? 'Luar Jam' : 'Jam Buka'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Warning Banner if Master is OFF */}
                            {!isMasterOn && (
                                <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>Bot sedang <strong>nonaktif</strong>. Tampilan ini adalah simulasi respon.</span>
                                </div>
                            )}

                            {/* Chat History Bubbles */}
                            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#efeae2]/60 text-xs">
                                {chatHistory.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[88%] p-3 rounded-xl shadow-2xs leading-relaxed text-xs ${
                                                item.sender === 'user'
                                                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-[#c1f5b8]/50'
                                                    : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/60'
                                            }`}
                                        >
                                            {item.quote && (
                                                <div className="mb-1.5 p-1.5 rounded-lg bg-emerald-900/10 border-l-4 border-emerald-600 text-[10px] text-slate-700 select-none">
                                                    <div className="truncate italic">{item.quote}</div>
                                                </div>
                                            )}

                                            {item.mediaUrl && (
                                                <div className="mb-2 rounded-lg overflow-hidden border border-slate-200">
                                                    <img
                                                        src={item.mediaUrl}
                                                        alt="Lampiran"
                                                        className="w-full h-32 object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                                                {item.text}
                                            </div>

                                            {/* Interactive Quick Reply Buttons */}
                                            {item.buttons && Array.isArray(item.buttons) && item.buttons.length > 0 && (
                                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.buttons.map((btn, bIdx) => (
                                                            <button
                                                                key={bIdx}
                                                                type="button"
                                                                onClick={() => executeSimulation(btn.keyword || btn.label, btn.label)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-[#e6f4ff] hover:bg-[#bae0ff] text-[#1677ff] border border-[#91caff]/40 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95 text-left"
                                                            >
                                                                <CornerDownLeft className="w-3 h-3 text-[#1677ff] shrink-0" />
                                                                <span>{btn.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Interactive CTA Link Web Button */}
                                            {item.cta_url && (
                                                <div className="mt-2.5 pt-2 border-t border-slate-100">
                                                    <a
                                                        href={item.cta_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-all shadow-2xs"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                                                        <span>{item.cta_text || 'Buka Tautan Web'}</span>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Action Options */}
                                            {item.action_buttons && Array.isArray(item.action_buttons) && item.action_buttons.length > 0 && (
                                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                                                    {item.action_buttons.map((act, actIdx) => (
                                                        <button
                                                            key={actIdx}
                                                            type="button"
                                                            onClick={() => executeSimulation(act, act)}
                                                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                                                        >
                                                            ➔ {act}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400 font-mono">
                                                <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {item.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-500" />}
                                            </div>
                                        </div>

                                        {item.source && (
                                            <span className={`text-[9px] mt-0.5 px-1 font-mono ${item.isAway ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                                {item.source}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {isSimulating && (
                                    <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-white p-2 rounded-xl w-fit shadow-2xs border border-slate-200/60">
                                        <div className="w-2 h-2 rounded-full bg-[#1677ff] animate-ping" />
                                        <span>Bot sedang mengetik balasan...</span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Quick Testing Chips for Business */}
                            <div className="px-3 py-1.5 bg-slate-50 border-t border-[#e6ebf1] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">Tes:</span>
                                {['Menu', '1', '2', 'Katalog', 'Format Order', 'Rekening', 'Jam Buka', 'CS'].map((chip) => (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => executeSimulation(chip)}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white hover:bg-[#e6f4ff] text-slate-600 hover:text-[#1677ff] border border-slate-200 hover:border-[#91caff]/60 transition-colors shrink-0 cursor-pointer"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Input Simulator Form */}
                            <form onSubmit={handleRunSimulation} className="p-3 bg-white border-t border-[#e6ebf1] flex items-center gap-2">
                                <input
                                    type="text"
                                    value={simulatedMessage}
                                    onChange={(e) => setSimulatedMessage(e.target.value)}
                                    placeholder="Ketik pesan tes (misal: 'info', '1', 'daftar')..."
                                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#e6ebf1] focus:border-[#1677ff] focus:outline-none"
                                />
                                <Button
                                    type="submit"
                                    disabled={!simulatedMessage.trim() || isSimulating}
                                    className="h-8 w-8 p-0 rounded-lg bg-[#1677ff] hover:bg-[#1060d4] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs disabled:opacity-40"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODAL 1: TAMBAH ATURAN AUTO-REPLY ================= */}
            {isAddModalOpen && (
                <ModalPortal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#e6ebf1] my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]/40">
                                        <Plus className="w-4 h-4 text-[#1677ff]" />
                                    </div>
                                    <h3 className="font-bold text-base text-slate-900">
                                        Tambah Aturan Balasan Otomatis
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddRule} className="space-y-3.5 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Nama Aturan</label>
                                        <input
                                            type="text"
                                            value={ruleData.name}
                                            onChange={(e) => setRuleData('name', e.target.value)}
                                            placeholder="Contoh: Katalog Produk & Harga"
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Kategori Bisnis</label>
                                        <select
                                            value={ruleData.category}
                                            onChange={(e) => setRuleData('category', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none"
                                        >
                                            <option value="Penjualan">Penjualan & Pemesanan</option>
                                            <option value="Layanan & CS">Layanan & CS</option>
                                            <option value="Informasi">Informasi & Lokasi</option>
                                            <option value="Menu">Menu Makanan / Produk</option>
                                            <option value="Biaya">Biaya & SPP</option>
                                            <option value="Teknis">Teknis & API</option>
                                            <option value="Umum">Umum</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Kata Kunci (*Keywords*) / Menu</label>
                                        <input
                                            type="text"
                                            value={ruleData.keyword}
                                            onChange={(e) => setRuleData('keyword', e.target.value)}
                                            placeholder="Contoh: 1, katalog, harga"
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs font-mono font-bold focus:border-[#1677ff] focus:outline-none"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Pisahkan koma untuk multi-kata kunci (contoh: 1, harga, produk).
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Tipe Pencocokan</label>
                                        <select
                                            value={ruleData.trigger_type}
                                            onChange={(e) => setRuleData('trigger_type', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none"
                                        >
                                            <option value="contains">Mengandung Kata / Pilihan Menu</option>
                                            <option value="exact">Sama Persis (Exact Match)</option>
                                            <option value="starts_with">Dimulai Dengan (Starts With)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block font-semibold text-slate-700">Pesan Balasan WhatsApp</label>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] text-slate-400">Variabel:</span>
                                            {['{nama}', '{salam}', '{jam_operasional}', '{nomor}', '{workspace}'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => insertRuleVariable(tag, false)}
                                                    className="text-[10px] font-mono px-1.5 py-0.5 bg-[#e6f4ff] hover:bg-blue-100 text-[#1677ff] rounded border border-[#91caff]/40 transition-colors cursor-pointer"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        rows="4"
                                        value={ruleData.reply_message}
                                        onChange={(e) => setRuleData('reply_message', e.target.value)}
                                        placeholder="Tuliskan respon otomatis yang akan dikirim ke nomor WhatsApp pengirim..."
                                        className="w-full p-3 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none leading-relaxed"
                                        required
                                    />
                                </div>

                                {/* Call-to-Action Link */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-lg border border-[#e6ebf1]">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                                            Teks Tombol Tautan (CTA) - Opsional
                                        </label>
                                        <input
                                            type="text"
                                            value={ruleData.cta_text}
                                            onChange={(e) => setRuleData('cta_text', e.target.value)}
                                            placeholder="Contoh: Buka Formulir / Katalog"
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                                            URL Tautan Web - Opsional
                                        </label>
                                        <input
                                            type="url"
                                            value={ruleData.cta_url}
                                            onChange={(e) => setRuleData('cta_url', e.target.value)}
                                            placeholder="https://toko.com/katalog"
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#e6ebf1] text-xs font-mono focus:border-[#1677ff] focus:outline-none bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Nomor WA Target</label>
                                        <select
                                            value={ruleData.device_id}
                                            onChange={(e) => setRuleData('device_id', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none"
                                        >
                                            <option value="">Semua Server & Nomor WA</option>
                                            {safeDevices.map((device) => (
                                                <option key={device.id} value={device.id}>
                                                    {device.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">URL Media Gambar / QRIS (Opsional)</label>
                                        <input
                                            type="url"
                                            value={ruleData.reply_media_url}
                                            onChange={(e) => setRuleData('reply_media_url', e.target.value)}
                                            placeholder="https://toko.com/qris.jpg"
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs font-mono focus:border-[#1677ff] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f0f0]">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="h-8 px-3 text-xs border-slate-200 cursor-pointer"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processingRule}
                                        className="h-8 px-4 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white cursor-pointer"
                                    >
                                        {processingRule ? 'Menyimpan...' : 'Simpan Aturan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* ================= MODAL 2: EDIT ATURAN AUTO-REPLY ================= */}
            {isEditModalOpen && (
                <ModalPortal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsEditModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#e6ebf1] my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]/40">
                                        <Pencil className="w-4 h-4 text-[#1677ff]" />
                                    </div>
                                    <h3 className="font-bold text-base text-slate-900">
                                        Edit Aturan Balasan Otomatis
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateRule} className="space-y-3.5 text-xs">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#e6ebf1]">
                                    <div>
                                        <span className="font-bold text-slate-800 block text-xs">Status Aturan</span>
                                        <span className="text-[11px] text-slate-500 block">Aktifkan atau nonaktifkan aturan kata kunci ini.</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold ${editData.is_active ? 'text-[#52c41a]' : 'text-slate-400'}`}>
                                            {editData.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <Switch
                                            checked={Boolean(editData.is_active)}
                                            onCheckedChange={(val) => setEditData('is_active', val)}
                                            size="sm"
                                            id="edit-rule-active-switch"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Nama Aturan</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData('name', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Kategori Bisnis</label>
                                        <select
                                            value={editData.category}
                                            onChange={(e) => setEditData('category', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none"
                                        >
                                            <option value="Penjualan">Penjualan & Pemesanan</option>
                                            <option value="Layanan & CS">Layanan & CS</option>
                                            <option value="Informasi">Informasi & Lokasi</option>
                                            <option value="Menu">Menu Makanan / Produk</option>
                                            <option value="Biaya">Biaya & SPP</option>
                                            <option value="Teknis">Teknis & API</option>
                                            <option value="Umum">Umum</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Kata Kunci (*Keywords*)</label>
                                        <input
                                            type="text"
                                            value={editData.keyword}
                                            onChange={(e) => setEditData('keyword', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs font-mono font-bold focus:border-[#1677ff] focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Tipe Pencocokan</label>
                                        <select
                                            value={editData.trigger_type}
                                            onChange={(e) => setEditData('trigger_type', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none"
                                        >
                                            <option value="contains">Mengandung Kata / Pilihan Menu</option>
                                            <option value="exact">Sama Persis (Exact Match)</option>
                                            <option value="starts_with">Dimulai Dengan (Starts With)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block font-semibold text-slate-700">Pesan Balasan WhatsApp</label>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] text-slate-400">Variabel:</span>
                                            {['{nama}', '{salam}', '{jam_operasional}', '{nomor}', '{workspace}'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => insertRuleVariable(tag, true)}
                                                    className="text-[10px] font-mono px-1.5 py-0.5 bg-[#e6f4ff] hover:bg-blue-100 text-[#1677ff] rounded border border-[#91caff]/40 transition-colors cursor-pointer"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        rows="4"
                                        value={editData.reply_message}
                                        onChange={(e) => setEditData('reply_message', e.target.value)}
                                        className="w-full p-3 rounded-lg border border-[#e6ebf1] text-xs focus:border-[#1677ff] focus:outline-none leading-relaxed"
                                        required
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f0f0]">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="h-8 px-3 text-xs border-slate-200 cursor-pointer"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processingEdit}
                                        className="h-8 px-4 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white cursor-pointer"
                                    >
                                        {processingEdit ? 'Menyimpan...' : 'Perbarui Aturan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* ================= MODAL 3: PILIH TEMPLATE BISNIS UMKM ================= */}
            {isTemplateModalOpen && (
                <ModalPortal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsTemplateModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#e6ebf1] my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]/40">
                                        <Store className="w-4 h-4 text-[#1677ff]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900">
                                            Pilih Paket Template Bisnis Siap Pakai
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Pilih kategori usaha Anda untuk memuat aturan kata kunci dan menu profesional instan.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsTemplateModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                                {industryTemplates.map((tpl) => (
                                    <div
                                        key={tpl.id}
                                        onClick={() => setSelectedIndustry(tpl.id)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            selectedIndustry === tpl.id
                                                ? 'border-[#1677ff] bg-[#e6f4ff]/40 ring-2 ring-[#1677ff]/20'
                                                : 'border-[#e6ebf1] hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between pb-1">
                                                <span className="font-bold text-xs text-slate-900">{tpl.title}</span>
                                                {selectedIndustry === tpl.id && (
                                                    <span className="text-[#1677ff] font-bold text-xs">✓ Dipilih</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-snug">{tpl.description}</p>
                                        </div>
                                        <div className="mt-2 text-[10px] text-slate-400">
                                            Termasuk <strong>{tpl.rules_count} aturan</strong> siap pakai.
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Mode Pemasangan */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-[#e6ebf1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                    <span className="font-bold text-slate-800 block text-xs">Metode Pemasangan:</span>
                                    <span className="text-[11px] text-slate-500">Pilih apakah ingin menimpa atau menambahkan ke aturan yang ada.</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                                        <input
                                            type="radio"
                                            name="seed_mode"
                                            value="replace"
                                            checked={seedMode === 'replace'}
                                            onChange={() => setSeedMode('replace')}
                                            className="text-[#1677ff]"
                                        />
                                        <span>Gantikan Semua</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                                        <input
                                            type="radio"
                                            name="seed_mode"
                                            value="append"
                                            checked={seedMode === 'append'}
                                            onChange={() => setSeedMode('append')}
                                            className="text-[#1677ff]"
                                        />
                                        <span>Tambahkan Saja</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f0f0]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsTemplateModalOpen(false)}
                                    className="h-8 px-3 text-xs border-slate-200 cursor-pointer"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isSeeding}
                                    onClick={() => handleSeedIndustry(selectedIndustry, seedMode)}
                                    className="h-8 px-4 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white cursor-pointer"
                                >
                                    {isSeeding ? 'Memuat...' : 'Terapkan Template Bisnis'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* ================= MODAL 4: GENERATOR FORMAT ORDER WHATSAPP ================= */}
            {isOrderGenModalOpen && (
                <ModalPortal isOpen={isOrderGenModalOpen} onClose={() => setIsOrderGenModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsOrderGenModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#e6ebf1] my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/50">
                                        <FileText className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900">
                                            Generator Format Pemesanan WhatsApp
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Format formulir cepat agar pelanggan mengirim detail pesanan dengan rapi dan lengkap.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOrderGenModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Pilihan Jenis Form */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {[
                                    { id: 'olshop', label: 'Toko Online' },
                                    { id: 'fnb', label: 'Resto / Makanan' },
                                    { id: 'booking', label: 'Booking Janji' },
                                    { id: 'b2b', label: 'Konsultasi B2B' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setSelectedOrderFormType(tab.id)}
                                        className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                                            selectedOrderFormType === tab.id
                                                ? 'bg-[#1677ff] text-white border-[#1677ff]'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <label className="font-semibold text-slate-700">Teks Template Format:</label>
                                <textarea
                                    rows="7"
                                    value={orderFormTemplates[selectedOrderFormType]}
                                    readOnly
                                    className="w-full p-3 rounded-lg border border-[#e6ebf1] bg-slate-50 font-mono text-xs leading-relaxed text-slate-800"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f0f0f0]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCopyOrderForm}
                                    className="h-8 px-3 text-xs border-slate-200 cursor-pointer flex items-center gap-1.5"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{copiedForm ? 'Tersalin!' : 'Salin Format'}</span>
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsOrderGenModalOpen(false)}
                                        className="h-8 px-3 text-xs border-slate-200 cursor-pointer"
                                    >
                                        Tutup
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleInsertOrderFormToNewRule}
                                        className="h-8 px-4 text-xs font-semibold bg-[#1677ff] hover:bg-[#1060d4] text-white cursor-pointer"
                                    >
                                        Gunakan di Aturan Baru
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </AppLayout>
    );
}
