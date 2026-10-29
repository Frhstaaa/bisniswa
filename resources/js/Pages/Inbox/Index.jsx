import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    MessageSquare,
    Send,
    Search,
    Phone,
    CheckCheck,
    Check,
    Paperclip,
    Smartphone,
    Sparkles,
    FileText,
    Plus,
    AlertCircle,
    Zap,
    ShieldCheck,
    Smile,
    Copy,
    ArrowLeft,
    X,
    Clock,
    RefreshCw,
    RotateCcw,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function InboxIndex({
    conversations = [],
    activePhone = '',
    activeMessages = [],
    devices = [],
    cannedResponses = [],
    subscription = null,
}) {
    // Local State for Real-Time UI (Prevents Jarring Page Refreshes)
    const [currentPhone, setCurrentPhone] = useState(activePhone || '');
    const [messages, setMessages] = useState(activeMessages || []);
    const [convList, setConvList] = useState(conversations || []);
    const [remainingQuota, setRemainingQuota] = useState(subscription?.remaining_message_quota ?? 0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposingNew, setIsComposingNew] = useState(!activePhone || conversations.length === 0);
    const [copiedPhone, setCopiedPhone] = useState(false);

    // Form inputs state
    const [messageText, setMessageText] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState(
        devices.find((d) => d.status === 'connected')?.id || devices?.[0]?.id || ''
    );
    const [newPhone, setNewPhone] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState(null);

    const chatContainerRef = useRef(null);
    const messageInputRef = useRef(null);
    const isAtBottomRef = useRef(true);

    // Sync state with props on initial load or route transition
    useEffect(() => {
        if (activePhone) {
            setCurrentPhone(activePhone);
            setIsComposingNew(false);
        }
    }, [activePhone]);

    useEffect(() => {
        if (activeMessages) {
            setMessages(activeMessages);
        }
    }, [activeMessages]);

    useEffect(() => {
        if (conversations) {
            setConvList(conversations);
        }
    }, [conversations]);

    useEffect(() => {
        if (subscription?.remaining_message_quota !== undefined) {
            setRemainingQuota(subscription.remaining_message_quota);
        }
    }, [subscription?.remaining_message_quota]);

    // Scroll to bottom helper
    const scrollToBottom = useCallback((smooth = false) => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto',
            });
        }
    }, []);

    // Track scroll position to prevent disruptive auto-scrolling when user is reading past logs
    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    // Auto-scroll when switching conversation or initial load
    useEffect(() => {
        if (currentPhone && !isComposingNew) {
            setTimeout(() => {
                scrollToBottom(false);
                messageInputRef.current?.focus();
            }, 60);
        }
    }, [currentPhone, isComposingNew, scrollToBottom]);

    // =========================================================================
    // REAL-TIME BACKGROUND SYNC (SILENT POLLING - NO INERTIA PAGE RELOADS)
    // =========================================================================
    useEffect(() => {
        if (!currentPhone || isComposingNew) return;

        const syncInterval = setInterval(async () => {
            try {
                // Get the highest integer ID from currently displayed messages
                const numericIds = messages
                    .map((m) => (typeof m.id === 'number' ? m.id : null))
                    .filter(Boolean);
                const afterId = numericIds.length > 0 ? Math.max(...numericIds) : 0;

                const queryUrl = `/inbox/sync?phone=${encodeURIComponent(currentPhone)}${afterId > 0 ? `&after_id=${afterId}` : ''}`;
                const res = await fetch(queryUrl, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!res.ok) return;
                const data = await res.json();

                if (data.success) {
                    if (data.messages && data.messages.length > 0) {
                        setMessages((prev) => {
                            const existingIds = new Set(prev.map((m) => m.id));
                            const additions = data.messages.filter((m) => !existingIds.has(m.id));
                            if (additions.length === 0) return prev;

                            // If optimistic pending message matches incoming outbound, replace it
                            let updated = [...prev];
                            for (const incoming of additions) {
                                const tempIdx = updated.findIndex(
                                    (m) =>
                                        String(m.id).startsWith('temp-') &&
                                        m.content === incoming.content &&
                                        m.direction === incoming.direction
                                );
                                if (tempIdx !== -1) {
                                    updated[tempIdx] = incoming;
                                } else {
                                    updated.push(incoming);
                                }
                            }

                            if (isAtBottomRef.current) {
                                setTimeout(() => scrollToBottom(true), 40);
                            }
                            return updated;
                        });
                    }

                    if (data.conversations && data.conversations.length > 0) {
                        setConvList(data.conversations);
                    }

                    if (data.remaining_quota !== undefined && data.remaining_quota !== null) {
                        setRemainingQuota(data.remaining_quota);
                    }
                }
            } catch (err) {
                // Silent fail on background poll to avoid console noise
            }
        }, 2500);

        return () => clearInterval(syncInterval);
    }, [currentPhone, messages, isComposingNew, scrollToBottom]);

    // =========================================================================
    // SWITCH CONVERSATION SEAMLESSLY WITHOUT RELOADING PAGE
    // =========================================================================
    const handleSelectConversation = async (phone) => {
        if (phone === currentPhone && !isComposingNew) return;

        setIsComposingNew(false);
        setCurrentPhone(phone);
        setSendError(null);

        // Update URL cleanly in browser without triggering full Inertia page visit
        window.history.replaceState(null, '', `/inbox?phone=${encodeURIComponent(phone)}`);

        try {
            const res = await fetch(`/inbox/conversation-messages?phone=${encodeURIComponent(phone)}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.messages) {
                    setMessages(data.messages);
                    setTimeout(() => {
                        scrollToBottom(false);
                        messageInputRef.current?.focus();
                    }, 50);
                }
            }
        } catch (e) {
            console.error('Failed fetching messages for conversation:', e);
        }
    };

    // =========================================================================
    // SEND MESSAGE (OPTIMISTIC & REAL-TIME AJAX - ZERO PAGE REFRESH)
    // =========================================================================
    const handleSendMessage = async (e, customPhone = null, customContent = null) => {
        if (e) e.preventDefault();

        const targetPhone = customPhone || (isComposingNew ? newPhone : currentPhone);
        const content = (customContent !== null ? customContent : messageText).trim();

        if (!targetPhone) {
            setSendError('Harap masukkan nomor WhatsApp tujuan.');
            return;
        }

        if (!content && !mediaUrl) {
            return;
        }

        if (remainingQuota <= 0) {
            setSendError('Sisa kuota pesan WhatsApp Anda sudah habis (0). Harap lakukan top-up kuota.');
            return;
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const optimisticMsg = {
            id: tempId,
            direction: 'outbound',
            receiver_number: targetPhone,
            content: content,
            media_url: mediaUrl || null,
            status: 'sending',
            created_at: new Date().toISOString(),
        };

        // If in current active conversation, append optimistically
        if (!isComposingNew && targetPhone === currentPhone) {
            setMessages((prev) => [...prev, optimisticMsg]);
            setMessageText('');
            setMediaUrl('');
            setShowMediaInput(false);
            setSendError(null);
            setTimeout(() => scrollToBottom(true), 30);
        }

        setIsSending(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/inbox/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    phone: targetPhone,
                    message: content,
                    device_id: selectedDeviceId,
                    media_url: mediaUrl || null,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // If it was sent from "Obrolan Baru" mode, transition to active conversation cleanly
                if (isComposingNew) {
                    setIsComposingNew(false);
                    setCurrentPhone(targetPhone);
                    setNewPhone('');
                    setMessageText('');
                    setMediaUrl('');
                    setShowMediaInput(false);
                    setMessages([data.message]);
                    window.history.replaceState(null, '', `/inbox?phone=${encodeURIComponent(targetPhone)}`);
                    setTimeout(() => scrollToBottom(false), 50);
                } else {
                    // Update optimistic message to delivered status
                    setMessages((prev) =>
                        prev.map((m) => (m.id === tempId ? { ...data.message, status: data.message.status || 'delivered' } : m))
                    );
                }

                if (data.remaining_quota !== undefined) {
                    setRemainingQuota(data.remaining_quota);
                }

                // Update conversation snippet on the left
                setConvList((prev) => {
                    const existingIdx = prev.findIndex((c) => c.phone === targetPhone);
                    const updatedItem = {
                        phone: targetPhone,
                        name: existingIdx !== -1 ? prev[existingIdx].name : targetPhone,
                        last_message: content,
                        last_direction: 'outbound',
                        last_time: '1 detik',
                        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.'),
                        status: data.message.status || 'delivered',
                    };

                    if (existingIdx !== -1) {
                        const copy = [...prev];
                        copy.splice(existingIdx, 1);
                        return [updatedItem, ...copy];
                    }
                    return [updatedItem, ...prev];
                });
            } else {
                const errMsg = data.error || 'Pengiriman pesan WhatsApp gagal.';
                setSendError(errMsg);
                // Mark optimistic message as failed
                setMessages((prev) =>
                    prev.map((m) => (m.id === tempId ? { ...m, status: 'failed', errorMessage: errMsg } : m))
                );
            }
        } catch (err) {
            const errMsg = 'Koneksi ke server terputus. Harap periksa jaringan.';
            setSendError(errMsg);
            setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...m, status: 'failed', errorMessage: errMsg } : m))
            );
        } finally {
            setIsSending(false);
            messageInputRef.current?.focus();
        }
    };

    // Retry sending a failed message
    const handleRetryMessage = (failedMsg) => {
        setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
        handleSendMessage(null, failedMsg.receiver_number, failedMsg.content);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInsertCanned = (text) => {
        setMessageText((prev) => (prev ? `${prev} ${text}` : text));
        messageInputRef.current?.focus();
    };

    const handleStartNewChat = () => {
        setIsComposingNew(true);
        setNewPhone('');
        setMessageText('');
        setSendError(null);
    };

    const handleCopyPhone = (phone) => {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
    };

    const formatMsgTime = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date
                .toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Jakarta',
                })
                .replace(':', '.');
        } catch {
            return '';
        }
    };

    const filteredConversations = convList.filter((c) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (c.name || '').toLowerCase().includes(query) || (c.phone || '').includes(query);
    });

    const currentContact = convList.find((c) => c.phone === currentPhone);
    const selectedDevice = devices.find((d) => d.id === parseInt(selectedDeviceId)) || devices[0];

    return (
        <AppLayout title="Kotak Masuk Live Chat">
            <Head title="Kotak Masuk Live Chat WhatsApp — MARDIRA WA" />

            <div className="space-y-3">
                {/* Modern Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                                Kotak Masuk WhatsApp
                            </h1>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>LIVE CHAT REALTIME</span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Percakapan WhatsApp langsung dengan pelanggan secara real-time tanpa refresh halaman.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {subscription && (
                            <Link
                                href="/subscriptions"
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium shadow-2xs transition-colors"
                                title="Sisa saldo kuota pesan WhatsApp Anda"
                            >
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                <span>
                                    Kuota:{' '}
                                    <strong className="font-mono text-slate-900">
                                        {remainingQuota?.toLocaleString('id-ID')}
                                    </strong>{' '}
                                    <span className="text-slate-400 font-sans">
                                        / {subscription.monthly_message_quota?.toLocaleString('id-ID')}
                                    </span>
                                </span>
                            </Link>
                        )}

                        {devices.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{devices.length} Gateway Aktif</span>
                            </span>
                        ) : (
                            <Link
                                href="/devices"
                                className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors"
                            >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Tautkan Perangkat</span>
                            </Link>
                        )}

                        <Button
                            size="sm"
                            onClick={handleStartNewChat}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs h-8 px-3"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            <span>Obrolan Baru</span>
                        </Button>
                    </div>
                </div>

                {/* Chat Style Main Frame (Strictly bounded height without page-jumping) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-12.5rem)] min-h-[580px] max-h-[820px]">
                    {/* ================= LEFT COLUMN: CONVERSATION LIST ================= */}
                    <div
                        className={`w-full md:w-[350px] lg:w-[380px] shrink-0 border-r border-[#e9edef] flex flex-col h-full bg-white min-h-0 ${
                            currentPhone && !isComposingNew ? 'hidden md:flex' : 'flex'
                        }`}
                    >
                        {/* Pinned Left Header */}
                        <div className="h-[60px] px-4 bg-[#f0f2f5] border-b border-[#e9edef] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-[#111b21] leading-tight">Obrolan</h2>
                                    <span className="text-[11px] text-[#667781]">{convList.length} percakapan</span>
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleStartNewChat}
                                title="Mulai Obrolan WhatsApp Baru"
                                className="h-8 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg font-semibold flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Baru</span>
                            </Button>
                        </div>

                        {/* Pinned Search Bar */}
                        <div className="p-2.5 bg-white border-b border-slate-100 shrink-0">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-[#54656f] absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari atau mulai chat baru"
                                    className="w-full pl-9 pr-7 py-1.5 rounded-lg bg-[#f0f2f5] text-xs text-[#111b21] placeholder-[#667781] focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-colors border border-transparent focus:border-emerald-600"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Conversation List */}
                        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
                            {filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <p className="font-semibold text-slate-700">Belum ada obrolan</p>
                                    <p className="text-[11px] text-slate-500 max-w-[200px]">
                                        Mulai obrolan WhatsApp baru ke nomor pelanggan.
                                    </p>
                                    <Button
                                        size="sm"
                                        onClick={handleStartNewChat}
                                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg h-7 px-3"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        <span>Obrolan Baru</span>
                                    </Button>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const isSelected = !isComposingNew && conv.phone === currentPhone;
                                    return (
                                        <div
                                            key={conv.phone}
                                            onClick={() => handleSelectConversation(conv.phone)}
                                            className={`px-3.5 py-3 flex items-start gap-3 cursor-pointer transition-colors border-l-4 ${
                                                isSelected
                                                    ? 'bg-[#f0f2f5] border-emerald-600'
                                                    : 'hover:bg-slate-50/80 border-transparent'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                                {(conv.name || 'P').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs truncate ${isSelected ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                                                        {conv.name}
                                                    </span>
                                                    <span className="text-[10px] text-[#667781] shrink-0 font-medium">
                                                        {conv.last_time || conv.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-mono text-[#667781] truncate">
                                                    {conv.phone}
                                                </p>
                                                <p className="text-xs text-slate-600 truncate mt-0.5 flex items-center gap-1">
                                                    {conv.last_direction === 'outbound' && (
                                                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0 inline" />
                                                    )}
                                                    <span className="truncate">{conv.last_message || 'Pesan WhatsApp'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ================= RIGHT COLUMN: ACTIVE CHAT ROOM ================= */}
                    <div
                        className={`flex-1 flex flex-col h-full bg-[#efeae2] min-h-0 min-w-0 relative ${
                            !currentPhone && !isComposingNew ? 'hidden md:flex' : 'flex'
                        }`}
                    >
                        {isComposingNew ? (
                            /* New Conversation Form View */
                            <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/70 p-6">
                                <div className="space-y-5 max-w-xl mx-auto w-full">
                                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">Mulai Obrolan WhatsApp Baru</h3>
                                                <p className="text-xs text-slate-500">Kirim pesan WhatsApp langsung ke nomor pelanggan tanpa reload.</p>
                                            </div>
                                        </div>
                                        {convList.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsComposingNew(false)}
                                                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5" />
                                                <span>Kembali</span>
                                            </button>
                                        )}
                                    </div>

                                    {sendError && (
                                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                            <span>{sendError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={(e) => handleSendMessage(e)} className="space-y-4 text-xs">
                                        <div>
                                            <label className="block font-medium text-slate-700 mb-1.5">
                                                Pilih Perangkat Gateway Pengirim
                                            </label>
                                            {devices.length > 0 ? (
                                                <select
                                                    value={selectedDeviceId}
                                                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:border-emerald-600 focus:outline-none shadow-2xs"
                                                    required
                                                >
                                                    {devices.map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.name} {d.phone_number ? `— ${d.phone_number}` : ''} {d.status === 'connected' ? '🟢' : '⚪'}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                                                    Belum ada perangkat terhubung.{' '}
                                                    <Link href="/devices" className="underline font-bold">
                                                        Tautkan perangkat sekarang
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="block font-medium text-slate-700">
                                                    Nomor WhatsApp Tujuan
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewPhone('+628386012467')}
                                                    className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                                                >
                                                    + Gunakan Nomor Uji (+628386012467)
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={newPhone}
                                                onChange={(e) => setNewPhone(e.target.value)}
                                                placeholder="Contoh: +6281234567890 atau 081234567890"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:border-emerald-600 focus:outline-none shadow-2xs bg-white"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-medium text-slate-700 mb-1.5">
                                                Isi Pesan WhatsApp
                                            </label>
                                            <textarea
                                                rows={4}
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Tulis pesan sapaan atau informasi yang ingin disampaikan..."
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none shadow-2xs bg-white"
                                                required
                                            />
                                        </div>

                                        {/* Canned Template Chips */}
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                                Template Cepat:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {cannedResponses.map((template, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleInsertCanned(template)}
                                                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded-lg text-[11px] text-slate-600 transition-colors text-left shadow-2xs cursor-pointer"
                                                    >
                                                        {template.length > 40 ? `${template.slice(0, 40)}...` : template}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-medium text-slate-700 mb-1.5">
                                                Lampiran URL Dokumen / Media (Opsional)
                                            </label>
                                            <input
                                                type="url"
                                                value={mediaUrl}
                                                onChange={(e) => setMediaUrl(e.target.value)}
                                                placeholder="https://domain.com/brosur.pdf"
                                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none shadow-2xs bg-white"
                                            />
                                        </div>

                                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                            {convList.length > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsComposingNew(false)}
                                                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                                                >
                                                    ← Batal & Kembali
                                                </button>
                                            ) : <div />}

                                            <Button
                                                type="submit"
                                                disabled={isSending || !newPhone.trim() || !messageText.trim()}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs h-9 px-5 cursor-pointer"
                                            >
                                                {isSending ? (
                                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-white animate-spin" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5 mr-1.5 text-white" />
                                                )}
                                                <span>{isSending ? 'Mengirim...' : 'Kirim & Buka Obrolan'}</span>
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : currentPhone ? (
                            /* Active WhatsApp Conversation Stream */
                            <>
                                {/* Fixed Live Chat Header */}
                                <div className="h-[60px] px-4 bg-[#f0f2f5] border-b border-[#e9edef] flex items-center justify-between shrink-0 shadow-2xs z-10">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Mobile Back Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCurrentPhone('');
                                                setIsComposingNew(true);
                                            }}
                                            className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg shrink-0 cursor-pointer"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>

                                        {/* Avatar with Online/Active Gateway Dot */}
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                                {currentContact ? (currentContact.name || 'P').charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-xs sm:text-sm text-[#111b21] tracking-tight truncate">
                                                    {currentContact ? currentContact.name : currentPhone}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyPhone(currentPhone)}
                                                    title="Salin Nomor WhatsApp"
                                                    className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
                                                >
                                                    {copiedPhone ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-[11px] font-mono text-[#667781] flex items-center gap-1.5 mt-0.5 truncate">
                                                <span className="truncate">{currentPhone}</span>
                                                <span>•</span>
                                                <span className="text-emerald-700 font-medium font-sans shrink-0">
                                                    via {selectedDevice?.name || 'Gateway'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Action: Device Gateway Switcher */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {devices.length > 1 && (
                                            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                                                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                                <select
                                                    value={selectedDeviceId}
                                                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                                                    className="text-[11px] font-medium bg-transparent text-slate-700 focus:outline-none border-none pr-2 cursor-pointer"
                                                >
                                                    {devices.map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.name} {d.status === 'connected' ? '🟢' : '⚪'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* WhatsApp Wallpaper Messages Stream */}
                                <div
                                    ref={chatContainerRef}
                                    onScroll={handleScroll}
                                    className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#efeae2] bg-[radial-gradient(#dfd7cc_1px,transparent_1px)] [background-size:18px_18px]"
                                >
                                    {/* End-to-End Encryption Security Pill */}
                                    <div className="flex justify-center mb-3">
                                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#ffeecd] border border-[#ffdda3] text-[11px] text-[#54656f] text-center shadow-2xs max-w-md">
                                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                            <span>Pesan dan obrolan terenkripsi melalui gateway resmi MARDIRA WA.</span>
                                        </div>
                                    </div>

                                    {/* Date Divider Pill */}
                                    <div className="flex justify-center my-2">
                                        <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-semibold text-[#54656f] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] border border-slate-200/40 uppercase tracking-wider">
                                            Percakapan Aktif
                                        </span>
                                    </div>

                                    {messages.length === 0 ? (
                                        <div className="h-48 flex flex-col items-center justify-center text-[#54656f] text-xs">
                                            <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-emerald-700" />
                                            <span>Belum ada riwayat pesan. Kirim pesan di bawah untuk memulai.</span>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isOutbound = msg.direction === 'outbound';
                                            const isSendingStatus = msg.status === 'sending';
                                            const isFailed = msg.status === 'failed';

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-[13px] leading-relaxed relative ${
                                                            isOutbound
                                                                ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-emerald-200/50'
                                                                : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/60'
                                                        } ${isFailed ? 'border-rose-300 bg-rose-50/90' : ''}`}
                                                    >
                                                        {/* Message Content */}
                                                        <div className="whitespace-pre-wrap break-words font-sans">
                                                            {msg.content}
                                                        </div>

                                                        {/* Optional Media Link Card */}
                                                        {msg.media_url && (
                                                            <div className="mt-2 p-2 bg-black/5 rounded-xl text-[11px] font-mono flex items-center gap-2 border border-black/5">
                                                                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                                                                <a
                                                                    href={msg.media_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="underline hover:text-emerald-800 truncate text-[#111b21] font-medium"
                                                                >
                                                                    {msg.media_url}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {/* Failure Error Info & Retry */}
                                                        {isFailed && (
                                                            <div className="mt-1.5 pt-1.5 border-t border-rose-200 flex items-center justify-between text-[11px] text-rose-700 gap-2">
                                                                <span className="flex items-center gap-1 truncate">
                                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                                    <span className="truncate">{msg.errorMessage || 'Gagal terkirim'}</span>
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRetryMessage(msg)}
                                                                    className="font-bold underline hover:text-rose-900 shrink-0 flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" />
                                                                    <span>Coba Lagi</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Inline Bottom-Right Meta: Timestamp & Delivery Status */}
                                                        <div className="float-right ml-3 mt-1 inline-flex items-center gap-1 text-[10px] text-[#667781] select-none font-sans">
                                                            <span>{formatMsgTime(msg.created_at)}</span>
                                                            {isOutbound && (
                                                                <span>
                                                                    {isSendingStatus ? (
                                                                        <Clock className="w-3 h-3 text-slate-400 animate-spin" />
                                                                    ) : isFailed ? (
                                                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                                                    ) : msg.status === 'read' ? (
                                                                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                                    ) : msg.status === 'delivered' ? (
                                                                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                                                    ) : (
                                                                        <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Canned Responses Quick Chips Bar */}
                                <div className="px-4 py-2 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                                    <span className="text-[10px] font-bold text-[#54656f] uppercase tracking-wider shrink-0 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <span>Template:</span>
                                    </span>
                                    {cannedResponses.map((template, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleInsertCanned(template)}
                                            className="shrink-0 px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200/90 rounded-lg text-[11px] text-[#54656f] transition-colors whitespace-nowrap shadow-2xs cursor-pointer active:scale-95"
                                        >
                                            {template.length > 32 ? `${template.slice(0, 32)}...` : template}
                                        </button>
                                    ))}
                                </div>

                                {/* Fixed Message Input Bar */}
                                <form
                                    onSubmit={(e) => handleSendMessage(e)}
                                    className="p-3 bg-[#f0f2f5] border-t border-[#e9edef] space-y-2 shrink-0"
                                >
                                    {remainingQuota <= 0 && (
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                                Sisa saldo kuota pesan Anda sudah habis (0).
                                            </span>
                                            <Link href="/subscriptions" className="font-semibold underline text-rose-900 hover:text-rose-700">
                                                Top Up Kuota &rarr;
                                            </Link>
                                        </div>
                                    )}

                                    {sendError && (
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                {sendError}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSendError(null)}
                                                className="text-amber-700 hover:text-amber-900"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {showMediaInput && (
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 animate-fade-in shadow-2xs">
                                            <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                            <input
                                                type="url"
                                                value={mediaUrl}
                                                onChange={(e) => setMediaUrl(e.target.value)}
                                                placeholder="https://storage.kampus.ac.id/brosur/invoice-992.pdf"
                                                className="flex-1 text-xs font-mono border-none focus:outline-none bg-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMediaUrl('');
                                                    setShowMediaInput(false);
                                                }}
                                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleInsertCanned('😊')}
                                            title="Sisipkan Emoji Sapaan"
                                            className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-black/5 rounded-xl transition-colors shrink-0 cursor-pointer"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setShowMediaInput(!showMediaInput)}
                                            className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                                                showMediaInput ? 'bg-emerald-600 text-white' : 'text-[#54656f] hover:text-[#111b21] hover:bg-black/5'
                                            }`}
                                            title="Lampirkan Dokumen / Gambar"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>

                                        <input
                                            ref={messageInputRef}
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ketik pesan balasan WhatsApp... (Tekan Enter untuk kirim)"
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-transparent bg-white text-xs sm:text-sm text-[#111b21] placeholder-[#667781] focus:border-emerald-600 focus:outline-none shadow-2xs transition-colors"
                                        />

                                        <Button
                                            type="submit"
                                            disabled={
                                                isSending ||
                                                remainingQuota <= 0 ||
                                                (!messageText.trim() && !mediaUrl)
                                            }
                                            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="hidden sm:inline">Kirim</span>
                                            {isSending ? (
                                                <Clock className="w-4 h-4 text-white animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4 text-white" />
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#54656f]">
                                <div className="w-16 h-16 rounded-full bg-slate-200/60 flex items-center justify-center mb-3">
                                    <Phone className="w-8 h-8 opacity-40 text-emerald-800" />
                                </div>
                                <h3 className="font-bold text-base text-slate-800">Pilih Kontak Obrolan</h3>
                                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                                    Pilih salah satu percakapan di sebelah kiri atau klik tombol "Obrolan Baru" untuk mengirim pesan ke nomor baru.
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleStartNewChat}
                                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-2xs h-9 px-4 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    <span>Mulai Obrolan Baru</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
