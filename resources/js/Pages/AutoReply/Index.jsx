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
} from 'lucide-react';

export default function AutoReplyIndex({
    masterEnabled = true,
    autoReplies = [],
    devices = [],
    menuConfig = {},
    aiConfig = {},
    stats = {},
}) {
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

    const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'greeting' | 'ai'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [simulatedMessage, setSimulatedMessage] = useState('');
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [ruleSearch, setRuleSearch] = useState('');
    const [ruleDeviceFilter, setRuleDeviceFilter] = useState('');
    const [ruleStatusFilter, setRuleStatusFilter] = useState(''); // '' | 'active' | 'inactive'

    const [chatHistory, setChatHistory] = useState([
        {
            sender: 'bot',
            text: 'Halo! Saya bot simulasi otomatis. Ketik kata kunci atau pesan sambutan apa saja (seperti "info", "hi", "halo", "menu", "1") untuk menguji respon bot WhatsApp Anda secara interaktif.',
            source: 'system',
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
        keywords: menuConfig.keywords || 'hi, halo, hai, hello, p, info, menu, bantuan, start, mulai, siang, pagi, malam, assalamualaikum, tes',
        device_id: menuConfig.device_id || '',
        header: menuConfig.header || '',
        footer: menuConfig.footer || '',
    });

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

    const handleSaveMenuConfig = (e) => {
        e.preventDefault();
        postMenuConfig('/auto-reply/menu-config', { preserveScroll: true });
    };

    const handleSeedTemplates = () => {
        if (confirm('Muat template menu standar (Administrasi, Bantuan, Jam Operasional, CS) ke dalam daftar aturan?')) {
            router.post('/auto-reply/seed-templates', {}, { preserveScroll: true });
        }
    };

    // Form for AI Config
    const { data: aiFormData, setData: setAiFormData, post: postAiConfig, processing: processingAi } = useForm({
        enabled: Boolean(aiConfig.enabled ?? true),
        prompt_context: aiConfig.prompt_context || '',
        api_key: aiConfig.api_key || '',
    });

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

    const handleSaveAiConfig = (e) => {
        e.preventDefault();
        postAiConfig('/auto-reply/ai-config', { preserveScroll: true });
    };

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
                body: JSON.stringify({ message: safeText, device_id: selectedDeviceId || null }),
            });

            const result = await response.json();
            setChatHistory((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: result.reply,
                    source: result.source === 'keyword_rule' ? `Aturan Kata Kunci: ${result.rule_name}` : result.rule_name,
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

            // Live-refresh stats & hit counts
            router.reload({
                only: ['stats', 'autoReplies'],
                preserveScroll: true,
                preserveState: true,
            });
        } catch (err) {
            setChatHistory((prev) => [
                ...prev,
                { sender: 'bot', text: 'Terjadi kesalahan jaringan saat memproses balasan simulasi.', source: 'error' },
            ]);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleRunSimulation = (e) => {
        e.preventDefault();
        executeSimulation(simulatedMessage);
    };

    // Filter rules by search, device & status
    const filteredRules = autoReplies.filter((rule) => {
        const matchesSearch = !ruleSearch ||
            (rule.name && rule.name.toLowerCase().includes(ruleSearch.toLowerCase())) ||
            (rule.keyword && rule.keyword.toLowerCase().includes(ruleSearch.toLowerCase())) ||
            (rule.reply_message && rule.reply_message.toLowerCase().includes(ruleSearch.toLowerCase()));

        const matchesDevice = !ruleDeviceFilter ||
            (ruleDeviceFilter === 'global' ? !rule.device_id : String(rule.device_id) === String(ruleDeviceFilter));

        const matchesStatus = !ruleStatusFilter ||
            (ruleStatusFilter === 'active' ? Boolean(rule.is_active) : !rule.is_active);

        return matchesSearch && matchesDevice && matchesStatus;
    });

    const activeRulesCount = autoReplies.filter((r) => r.is_active).length;

    return (
        <AppLayout title="Auto-Reply & AI Bot">
            <Head title="Auto-Reply & Asisten AI Gemini — MARDIRA WA" />

            <div className="space-y-5 animate-fade-in-up pb-8">
                {/* 1. TOP HEADER & UNIFIED ACTION BAR */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                                <Bot className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>Auto-Reply & Asisten AI Cerdas</span>
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                                isMasterOn
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                {isMasterOn ? 'Smart Responder 24/7 (Aktif)' : 'Mode Nonaktif (Manual)'}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                            Otomatisasi balasan pesan instan berbasis kata kunci (*keywords*), menu interaktif bernomor, dan *fallback* AI Gemini.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSeedTemplates}
                            className="h-9 px-3 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Muat contoh menu interaktif standar"
                        >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Muat Template Standar</span>
                        </Button>

                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-1.5 cursor-pointer transition-all flex items-center"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span>Tambah Aturan Kata Kunci</span>
                        </Button>
                    </div>
                </div>

                {/* 2. MASTER TOGGLE SWITCH CARD (GLOBAL ON/OFF) */}
                <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isMasterOn
                        ? 'bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 border-emerald-200/90'
                        : 'bg-gradient-to-r from-amber-50/70 via-white to-slate-50/70 border-amber-200/90'
                }`}>
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs transition-colors ${
                            isMasterOn
                                ? 'bg-emerald-100/90 text-emerald-700 border-emerald-200'
                                : 'bg-amber-100/90 text-amber-700 border-amber-200'
                        }`}>
                            <Power className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                                    Sakelar Utama Auto-Reply & Asisten Bot
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isMasterOn
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                    {isMasterOn ? 'STATUS: AKTIF' : 'STATUS: NONAKTIF'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                                {isMasterOn
                                    ? 'Bot aktif merespon pesan pelanggan masuk secara otomatis 24/7 sesuai aturan kata kunci, menu layanan, atau AI Gemini.'
                                    : 'Seluruh respon bot otomatis sedang dinonaktifkan sementara. Pesan masuk tidak akan dibalas oleh bot dan dapat ditangani langsung oleh CS manusia di Live Chat.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-2xs">
                        <span className={`text-xs font-bold select-none ${isMasterOn ? 'text-emerald-700' : 'text-slate-500'}`}>
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

                {/* 3. THREE BALANCED OVERVIEW STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 transition-all hover:shadow-md flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80 shadow-2xs">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Total Aturan
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/70">
                                Keywords
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums mt-1">
                            {stats?.total_rules ?? autoReplies.length}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Aturan kata kunci respon otomatis terdaftar
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Metode:</span>
                            <span className="font-semibold text-slate-700 text-[11px]">Kata Kunci & AI Fallback</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 transition-all hover:shadow-md flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
                                    <Zap className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Aturan Aktif
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Ready 24/7
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold tracking-tight text-emerald-600 font-mono tabular-nums mt-1">
                            {activeRulesCount}{' '}
                            <span className="text-sm font-medium text-slate-400 font-sans">
                                / {autoReplies.length}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Siap merespon chat masuk WhatsApp pelanggan
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Status Global:</span>
                            <span className={`font-semibold text-[11px] flex items-center gap-1 ${isMasterOn ? 'text-emerald-700' : 'text-amber-700'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {isMasterOn ? 'Aktif Merespon' : 'Dinonaktifkan'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 transition-all hover:shadow-md flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shadow-2xs">
                                    <CheckCheck className="w-4 h-4 text-sky-600" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Pesan Terjawab
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                                Akumulasi
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums mt-1">
                            {(stats?.total_hits ?? autoReplies.reduce((acc, r) => acc + (r.hit_count || 0), 0)).toLocaleString('id-ID')}{' '}
                            <span className="text-base font-medium text-slate-400 font-sans">Kali</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Total interaksi pesan terjawab otomatis
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Respon Time:</span>
                            <span className="font-mono font-semibold text-slate-700 text-[11px]">Instant (&lt; 1s)</span>
                        </div>
                    </div>
                </div>

                {/* 4. MAIN WORKSPACE: 2-COLUMN BALANCED LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: TABS & CONFIGURATION CARDS (7 or 8 cols) */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        {/* SEGMENTED TAB NAVIGATION */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 w-full sm:w-fit overflow-x-auto shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setActiveTab('rules')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'rules'
                                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                                }`}
                            >
                                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Aturan Kata Kunci</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                    {autoReplies.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('greeting')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'greeting'
                                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                                }`}
                            >
                                <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Sambutan & Menu</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${
                                    menuFormData.enabled
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {menuFormData.enabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('ai')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === 'ai'
                                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Asisten AI Gemini</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${
                                    aiFormData.enabled
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {aiFormData.enabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </button>
                        </div>

                        {/* TAB 1: ATURAN KATA KUNCI (KEYWORD RULES TABLE) */}
                        {activeTab === 'rules' && (
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
                                {/* Filter & Search Toolbar */}
                                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={ruleSearch}
                                                onChange={(e) => setRuleSearch(e.target.value)}
                                                placeholder="Cari nama aturan, kata kunci, balasan..."
                                                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 focus:outline-none placeholder-slate-400 shadow-2xs"
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

                                        <select
                                            value={ruleStatusFilter}
                                            onChange={(e) => setRuleStatusFilter(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 focus:outline-none text-slate-700 shadow-2xs font-medium"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="active">Hanya Aktif</option>
                                            <option value="inactive">Hanya Nonaktif</option>
                                        </select>

                                        <select
                                            value={ruleDeviceFilter}
                                            onChange={(e) => setRuleDeviceFilter(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 focus:outline-none text-slate-700 shadow-2xs"
                                        >
                                            <option value="">Semua Filter Nomor</option>
                                            <option value="global">Khusus Semua Nomor (Global)</option>
                                            {devices.map((device) => (
                                                <option key={device.id} value={device.id}>
                                                    {device.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="text-[11px] text-slate-500 font-medium self-end md:self-auto shrink-0">
                                        Menampilkan <strong className="font-mono text-slate-900">{filteredRules.length}</strong> dari {autoReplies.length} aturan
                                    </div>
                                </div>

                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200/80">
                                            <tr>
                                                <th className="py-3 px-4 min-w-[200px]">Aturan & Kata Kunci</th>
                                                <th className="py-3 px-3 w-[105px]">Tipe Pemicu</th>
                                                <th className="py-3 px-3 min-w-[180px]">Pesan Balasan</th>
                                                <th className="py-3 px-2 text-center w-[75px]">Terjawab</th>
                                                <th className="py-3 px-3 text-center w-[120px]">Status</th>
                                                <th className="py-3 px-4 text-right w-[85px]">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredRules.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                                        <div className="flex flex-col items-center justify-center space-y-2">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <Bot className="w-5 h-5" />
                                                            </div>
                                                            <p className="font-semibold text-slate-700 text-xs">
                                                                {ruleSearch || ruleStatusFilter || ruleDeviceFilter
                                                                    ? 'Tidak Ada Aturan yang Cocok dengan Filter'
                                                                    : 'Belum Ada Aturan Kata Kunci'}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 max-w-sm">
                                                                {ruleSearch || ruleStatusFilter || ruleDeviceFilter
                                                                    ? 'Coba bersihkan filter pencarian atau ubah filter status di atas.'
                                                                    : 'Klik tombol "Tambah Aturan Kata Kunci" atau "Muat Template Standar" untuk memulai.'}
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
                                                                <div className="font-bold text-slate-900 text-xs leading-snug">
                                                                    {rule.name}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    {rule.device ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 font-medium">
                                                                            <Smartphone className="w-2.5 h-2.5 text-emerald-600" />
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
                                                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
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
                                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                                                                <div className="line-clamp-2 text-xs leading-snug text-slate-700 font-normal" title={rule.reply_message}>
                                                                    {rule.reply_message}
                                                                </div>
                                                                {rule.cta_url && (
                                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80 w-fit font-medium">
                                                                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-sky-600" />
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
                                                                    <div className="text-[10px] text-emerald-700 mt-1 font-mono truncate flex items-center gap-1">
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

                                                            {/* ENHANCED STATUS WITH SWITCH TOGGLE */}
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
                                                                            rule.is_active ? 'text-emerald-700' : 'text-slate-400'
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
                                                                        className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
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
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
                                            <ListChecks className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                                <span>Respon Menu Sambutan Otomatis</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                                    menuFormData.enabled
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    {menuFormData.enabled ? 'Aktif 24/7' : 'Nonaktif'}
                                                </span>
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Kirim salam pembuka dan daftar menu bernomor secara otomatis saat pelanggan mengirim kata kunci seperti <strong>halo</strong>, <strong>info</strong>, <strong>menu</strong>, dll.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSeedTemplates}
                                        className="h-8 px-3 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5"
                                        title="Muat contoh aturan menu siap pakai"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Muat Template Standar</span>
                                    </Button>
                                </div>

                                <form onSubmit={handleSaveMenuConfig} className="space-y-5 text-xs">
                                    {/* 1. Status On/Off & Target Device WITH SWITCH */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                                            <div>
                                                <span className="font-bold text-slate-800 block text-xs">
                                                    Status Respon Menu Sambutan
                                                </span>
                                                <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                                                    Kirim daftar menu layanan otomatis saat disapa.
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[11px] font-bold ${menuFormData.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
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
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 focus:outline-none text-slate-700 shadow-2xs"
                                            >
                                                <option value="">Semua Nomor WA Terhubung (Global)</option>
                                                {devices.map((device) => (
                                                    <option key={device.id} value={device.id}>
                                                        {device.name} ({device.phone_number || 'Belum ada nomor'})
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                Pilih nomor spesifik atau biarkan global agar aktif di seluruh nomor CS Anda.
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Gaya Format Tampilan Menu */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Format Tampilan Menu WhatsApp</span>
                                            </label>
                                            <span className="text-[10px] text-slate-400 font-medium">Pilih susunan format yang paling nyaman</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {/* Option 1: Format Bernomor (1, 2, 3) */}
                                            <div
                                                onClick={() => setMenuFormData('style', 'standard')}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                                                    menuFormData.style === 'standard' || menuFormData.style === 'compact'
                                                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between pb-1.5">
                                                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                                            <span className="text-sm">🔢</span>
                                                            <span>Format Bernomor (1, 2, 3)</span>
                                                        </span>
                                                        {(menuFormData.style === 'standard' || menuFormData.style === 'compact') && (
                                                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                        Format daftar teks alami dengan nomor urut standar (1, 2, 3). Sangat bersih, mudah dibaca di semua jenis HP, dan pelanggan cukup membalas angka.
                                                    </p>
                                                    <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60 font-mono text-[10px] text-slate-600 space-y-0.5">
                                                        <div>1. *Administrasi*</div>
                                                        <div className="text-slate-400 pl-3">➔ Balas: *1* atau *administrasi*</div>
                                                        <div>2. *Info & Bantuan*</div>
                                                        <div className="text-slate-400 pl-3">➔ Balas: *2* atau *bantuan*</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2.5 flex items-center justify-between">
                                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                                        Standar & Paling Alami
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Option 2: Format Kotak [ 1 ], [ 2 ] */}
                                            <div
                                                onClick={() => setMenuFormData('style', 'boxed')}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                                                    menuFormData.style === 'boxed' || menuFormData.style === 'pandawa'
                                                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between pb-1.5">
                                                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                                            <span className="text-sm">🔲</span>
                                                            <span>Format Kotak [ 1 ], [ 2 ]</span>
                                                        </span>
                                                        {(menuFormData.style === 'boxed' || menuFormData.style === 'pandawa') && (
                                                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                        Format bernomor kotak yang rapi dan elegan. Pilihan nomor ditonjolkan dengan tanda kurung kotak sehingga tampak terstruktur dan profesional.
                                                    </p>
                                                    <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60 font-mono text-[10px] text-slate-600 space-y-0.5">
                                                        <div>[ 1 ] *Administrasi*</div>
                                                        <div className="text-slate-400 pl-4">➔ Balas *1* atau *administrasi*</div>
                                                        <div>[ 2 ] *Info & Bantuan*</div>
                                                        <div className="text-slate-400 pl-4">➔ Balas *2* atau *bantuan*</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2.5 flex items-center justify-between">
                                                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                                                        Elegan & Terstruktur
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Greeting Trigger Keywords with Quick-Add Chips */}
                                    <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-800 flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                <span>Kata Kunci Pemicu Sambutan (*Greeting Triggers*)</span>
                                            </label>
                                            <span className="text-[10px] text-slate-400">Pisahkan dengan koma</span>
                                        </div>

                                        <textarea
                                            rows="2"
                                            value={menuFormData.keywords}
                                            onChange={(e) => setMenuFormData('keywords', e.target.value)}
                                            placeholder="hi, halo, menu, info, bantuan, p, siang..."
                                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:border-emerald-600 focus:outline-none"
                                        />

                                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                            <span className="text-[10px] text-slate-400 font-medium">Klik untuk tambah cepat:</span>
                                            {['halo', 'hi', 'p', 'menu', 'info', 'bantuan', 'start', 'assalamualaikum', 'tes', 'admin'].map((kw) => (
                                                <button
                                                    key={kw}
                                                    type="button"
                                                    onClick={() => addKeyword(kw)}
                                                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                                                >
                                                    + {kw}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 4. Header & Footer Templates */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-semibold text-slate-700">Teks Salam Pembuka (Header)</label>
                                                <div className="flex items-center gap-1">
                                                    {['{nama}', '{waktu}', '{target}'].map((tag) => (
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
                                                placeholder="Halo {nama}, selamat {waktu}! Selamat datang di layanan resmi..."
                                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-semibold text-slate-700">Teks Petunjuk Penutup (Footer)</label>
                                                <div className="flex items-center gap-1">
                                                    {['{nama}', '{target}'].map((tag) => (
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
                                                placeholder="Silakan balas dengan mengetik nomor atau kata kunci pilihan Anda..."
                                                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-600 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processingMenu}
                                            className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                                        >
                                            {processingMenu ? 'Menyimpan...' : 'Simpan Pengaturan Sambutan & Menu'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 3: ASISTEN AI GEMINI */}
                        {activeTab === 'ai' && (
                            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80 flex items-center justify-center font-bold shadow-2xs">
                                            <Sparkles className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                                                Asisten Cerdas AI Gemini (Smart Fallback)
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Merespon pertanyaan pelanggan yang tidak cocok dengan kata kunci manual secara cerdas & sopan.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold ${aiFormData.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {aiFormData.enabled ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <Switch
                                            checked={aiFormData.enabled}
                                            onCheckedChange={(val) => setAiFormData('enabled', val)}
                                            id="ai_gemini_enabled"
                                            title="Aktifkan atau nonaktifkan fallback AI Gemini"
                                        />
                                    </div>
                                </div>

                                <form onSubmit={handleSaveAiConfig} className="space-y-4 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-800 mb-1">
                                            Instruksi Konteks & Basis Pengetahuan AI (*Knowledge Context Prompt*):
                                        </label>
                                        <textarea
                                            rows="4"
                                            value={aiFormData.prompt_context}
                                            onChange={(e) => setAiFormData('prompt_context', e.target.value)}
                                            placeholder="Berikan panduan cara AI menjawab pelanggan Anda..."
                                            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none leading-relaxed transition-all"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            AI otomatis dibekali daftar aturan menu Anda sehingga jawabannya selalu terarah dan sesuai bisnis Anda.
                                        </p>
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
                                            placeholder="AIzaSy... (Biarkan kosong untuk menggunakan sistem AI bawaan kampus)"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none transition-all"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Jika diisi, bot akan memproses pertanyaan via Google Gemini API langsung. Jika dikosongkan, bot tetap aktif cerdas menggunakan model kontekstual bawaan.
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <Button
                                            type="submit"
                                            disabled={processingAi}
                                            className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                                        >
                                            {processingAi ? 'Menyimpan...' : 'Simpan Pengaturan AI'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: STICKY LIVE WHATSAPP BOT SIMULATOR (5 or 4 cols) */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-3 sticky top-6">
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col h-[650px] relative">
                            {/* Authentic WhatsApp Desktop Header with Target Device Selector */}
                            <div className="p-3.5 bg-[#0b0f17] text-white flex flex-col gap-2.5 border-b border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold text-xs">
                                                WA
                                            </div>
                                            <span className={`w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-[#0b0f17] ${isMasterOn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs text-slate-100">Simulator WhatsApp Bot</div>
                                            <div className={`text-[10px] font-medium flex items-center gap-1 ${isMasterOn ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${isMasterOn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                                {isMasterOn ? 'Online & Auto-Responder' : 'Bot Nonaktif (Simulasi Mode)'}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded-full text-slate-300 font-medium font-mono">
                                        Live Test
                                    </span>
                                </div>

                                {/* Target Device Selector */}
                                <div className="pt-2 border-t border-slate-800/90 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                                        <Smartphone className="w-3 h-3 text-emerald-400" />
                                        Nomor Tujuan:
                                    </span>
                                    <select
                                        value={selectedDeviceId}
                                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700/80 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 font-sans"
                                    >
                                        <option value="">Semua Nomor WA (Global)</option>
                                        {devices.map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.name} ({device.phone_number || 'Tanpa nomor'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Warning Banner if Master is OFF */}
                            {!isMasterOn && (
                                <div className="px-3 py-2 bg-amber-500/15 border-b border-amber-500/25 text-[11px] text-amber-800 flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>
                                        Auto-reply sedang <strong>nonaktif</strong>. Respon di bawah adalah simulasi saat fitur dinyalakan.
                                    </span>
                                </div>
                            )}

                            {/* Chat History Bubbles (Authentic WhatsApp Web Palette) */}
                            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#efeae2]/60 text-xs">
                                {chatHistory.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[88%] p-3 rounded-2xl shadow-2xs leading-relaxed text-xs ${
                                                item.sender === 'user'
                                                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-[#c1f5b8]/50'
                                                    : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/60'
                                            }`}
                                        >
                                            {/* WhatsApp Quoted Reply Header Preview for User Message */}
                                            {item.quote && (
                                                <div className="mb-1.5 p-2 rounded-lg bg-emerald-900/10 border-l-4 border-emerald-600 text-[10px] text-slate-700 select-none">
                                                    <div className="font-bold text-emerald-800 text-[9px] flex items-center gap-1">
                                                        <CornerDownLeft className="w-2.5 h-2.5" />
                                                        <span>Balasan Kutipan Menu</span>
                                                    </div>
                                                    <div className="truncate italic mt-0.5">{item.quote}</div>
                                                </div>
                                            )}

                                            {item.mediaUrl && (
                                                <div className="mb-2 rounded-xl overflow-hidden border border-slate-200">
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
                                                    <span className="text-[10px] text-slate-400 font-medium select-none">
                                                        Pilihan Balasan Cepat (Quick Reply):
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.buttons.map((btn, bIdx) => (
                                                            <button
                                                                key={bIdx}
                                                                type="button"
                                                                onClick={() => executeSimulation(btn.keyword || btn.label, btn.label)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95 text-left"
                                                            >
                                                                <CornerDownLeft className="w-3 h-3 text-emerald-600 shrink-0" />
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

                                            {/* Suggested Action Options */}
                                            {item.action_buttons && Array.isArray(item.action_buttons) && item.action_buttons.length > 0 && (
                                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                                                    {item.action_buttons.map((act, actIdx) => (
                                                        <button
                                                            key={actIdx}
                                                            type="button"
                                                            onClick={() => executeSimulation(act, act)}
                                                            className="text-[10px] font-medium px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
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
                                            <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                                                {item.source}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {isSimulating && (
                                    <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-white p-2 rounded-xl w-fit shadow-2xs border border-slate-200/60">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                        <span>Bot sedang mengetik balasan otomatis...</span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input Simulator Form */}
                            <form onSubmit={handleRunSimulation} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={simulatedMessage}
                                    onChange={(e) => setSimulatedMessage(e.target.value)}
                                    placeholder="Ketik pesan tes (misal: 'info', '1', 'daftar')..."
                                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none"
                                />
                                <Button
                                    type="submit"
                                    disabled={!simulatedMessage.trim() || isSimulating}
                                    className="h-8 w-8 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs disabled:opacity-40"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODAL: TAMBAH ATURAN AUTO-REPLY ================= */}
            {isAddModalOpen && (
                <ModalPortal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                                        <Plus className="w-4 h-4 text-emerald-600" />
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
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Nama Aturan</label>
                                    <input
                                        type="text"
                                        value={ruleData.name}
                                        onChange={(e) => setRuleData('name', e.target.value)}
                                        placeholder="Contoh: Balasan Info Pendaftaran Mahasiswa"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Kata Kunci (*Keyword*) / Pilihan Menu</label>
                                        <input
                                            type="text"
                                            value={ruleData.keyword}
                                            onChange={(e) => setRuleData('keyword', e.target.value)}
                                            placeholder="Contoh: 1, info, pendaftaran"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-emerald-600 focus:outline-none"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            💡 Masukkan nomor menu (1, 2, dst) atau kata kunci. Pisahkan dengan koma untuk banyak kata.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Tipe Pencocokan</label>
                                        <select
                                            value={ruleData.trigger_type}
                                            onChange={(e) => setRuleData('trigger_type', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                        >
                                            <option value="contains">Mengandung Kata / Pilihan Menu</option>
                                            <option value="exact">Sama Persis (Exact Match)</option>
                                            <option value="starts_with">Dimulai Dengan (Starts With)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block font-semibold text-slate-700">Pesan Balasan Otomatis</label>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] text-slate-400">Sisipkan:</span>
                                            {['{nama}', '{waktu}', '{workspace_name}'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => insertRuleVariable(tag, false)}
                                                    className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 transition-colors cursor-pointer"
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
                                        placeholder="Tuliskan isi pesan yang akan dikirim secara instan ke nomor WhatsApp pengirim..."
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none leading-relaxed"
                                        required
                                    />
                                </div>

                                {/* Call-to-Action (CTA) URL Button */}
                                <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                                            <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                                            <span>Tombol Tautan / Link (Call-to-Action) - Opsional</span>
                                        </label>
                                        <span className="text-[10px] text-sky-700 font-semibold bg-sky-100/70 px-2 py-0.5 rounded">
                                            Link Web
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Tautan URL yang akan disematkan di bawah balasan bot (misal: tautan <strong className="text-sky-800">Buka Formulir</strong> untuk pendaftaran).
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                                                Teks Label Tombol
                                            </label>
                                            <input
                                                type="text"
                                                value={ruleData.cta_text}
                                                onChange={(e) => setRuleData('cta_text', e.target.value)}
                                                placeholder="Contoh: Buka Formulir"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-sky-600 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                                                URL Tautan Web
                                            </label>
                                            <input
                                                type="url"
                                                value={ruleData.cta_url}
                                                onChange={(e) => setRuleData('cta_url', e.target.value)}
                                                placeholder="https://pmb.mardira.ac.id/form"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:border-sky-600 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Rekomendasi Opsi Lanjutan */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                                            <CornerDownLeft className="w-3 h-3 text-slate-500" />
                                            <span>Saran Pilihan / Topik Lanjutan - Opsional</span>
                                        </label>
                                        <span className="text-[10px] text-slate-400">Pisahkan dengan koma</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={ruleData.action_buttons}
                                        onChange={(e) => setRuleData('action_buttons', e.target.value)}
                                        placeholder="Contoh: Menu Utama, Bantuan, Jam Operasional"
                                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Pilih Nomor / Server WA (Opsional)</label>
                                    <select
                                        value={ruleData.device_id}
                                        onChange={(e) => setRuleData('device_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    >
                                        <option value="">Semua Server & Nomor Terhubung</option>
                                        {devices.map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.name} ({device.phone_number || 'Belum ada nomor'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">URL Lampiran Media (Opsional)</label>
                                    <input
                                        type="url"
                                        value={ruleData.reply_media_url}
                                        onChange={(e) => setRuleData('reply_media_url', e.target.value)}
                                        placeholder="https://domain.com/brosur-pendaftaran.pdf"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
                                        className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                    >
                                        {processingRule ? 'Menyimpan...' : 'Simpan Aturan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* ================= MODAL: EDIT ATURAN AUTO-REPLY ================= */}
            {isEditModalOpen && (
                <ModalPortal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsEditModalOpen(false)}
                    >
                        <div
                            className="relative bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                                        <Pencil className="w-4 h-4 text-emerald-600" />
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
                                {/* EDIT RULE STATUS SWITCH */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <span className="font-bold text-slate-800 block text-xs">Status Aturan</span>
                                        <span className="text-[11px] text-slate-500 block">Aktifkan atau nonaktifkan aturan kata kunci ini.</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold ${editData.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
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

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Nama Aturan</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData('name', e.target.value)}
                                        placeholder="Contoh: Balasan Info Pendaftaran Mahasiswa"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Kata Kunci (*Keyword*) / Pilihan Menu</label>
                                        <input
                                            type="text"
                                            value={editData.keyword}
                                            onChange={(e) => setEditData('keyword', e.target.value)}
                                            placeholder="Contoh: 1, info, pendaftaran"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-emerald-600 focus:outline-none"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            💡 Masukkan nomor menu (1, 2, dst) atau kata kunci. Pisahkan dengan koma untuk banyak kata.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Tipe Pencocokan</label>
                                        <select
                                            value={editData.trigger_type}
                                            onChange={(e) => setEditData('trigger_type', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                        >
                                            <option value="contains">Mengandung Kata / Pilihan Menu</option>
                                            <option value="exact">Sama Persis (Exact Match)</option>
                                            <option value="starts_with">Dimulai Dengan (Starts With)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block font-semibold text-slate-700">Pesan Balasan Otomatis</label>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] text-slate-400">Sisipkan:</span>
                                            {['{nama}', '{waktu}', '{workspace_name}'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => insertRuleVariable(tag, true)}
                                                    className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 transition-colors cursor-pointer"
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
                                        placeholder="Tuliskan isi pesan yang akan dikirim secara instan ke nomor WhatsApp pengirim..."
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none leading-relaxed"
                                        required
                                    />
                                </div>

                                {/* Call-to-Action (CTA) URL Button */}
                                <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                                            <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                                            <span>Tombol Tautan / Link (Call-to-Action) - Opsional</span>
                                        </label>
                                        <span className="text-[10px] text-sky-700 font-semibold bg-sky-100/70 px-2 py-0.5 rounded">
                                            Link Web
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Tautan URL yang akan disematkan di bawah balasan bot (misal: tautan <strong className="text-sky-800">Buka Formulir</strong> untuk pendaftaran).
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                                                Teks Label Tombol
                                            </label>
                                            <input
                                                type="text"
                                                value={editData.cta_text}
                                                onChange={(e) => setEditData('cta_text', e.target.value)}
                                                placeholder="Contoh: Buka Formulir"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-sky-600 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                                                URL Tautan Web
                                            </label>
                                            <input
                                                type="url"
                                                value={editData.cta_url}
                                                onChange={(e) => setEditData('cta_url', e.target.value)}
                                                placeholder="https://pmb.mardira.ac.id/form"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:border-sky-600 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Rekomendasi Opsi Lanjutan */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                                            <CornerDownLeft className="w-3 h-3 text-slate-500" />
                                            <span>Saran Pilihan / Topik Lanjutan - Opsional</span>
                                        </label>
                                        <span className="text-[10px] text-slate-400">Pisahkan dengan koma</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={editData.action_buttons}
                                        onChange={(e) => setEditData('action_buttons', e.target.value)}
                                        placeholder="Contoh: Menu Utama, Bantuan, Jam Operasional"
                                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Pilih Nomor / Server WA (Opsional)</label>
                                    <select
                                        value={editData.device_id}
                                        onChange={(e) => setEditData('device_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    >
                                        <option value="">Semua Server & Nomor Terhubung</option>
                                        {devices.map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.name} ({device.phone_number || 'Belum ada nomor'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">URL Lampiran Media (Opsional)</label>
                                    <input
                                        type="url"
                                        value={editData.reply_media_url}
                                        onChange={(e) => setEditData('reply_media_url', e.target.value)}
                                        placeholder="https://domain.com/brosur-pendaftaran.pdf"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
                                        className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                    >
                                        {processingEdit ? 'Menyimpan...' : 'Perbarui Aturan'}
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
