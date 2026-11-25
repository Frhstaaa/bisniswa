<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'SAPA') }}</title>

    <!-- Favicon & Browser URL Icons -->
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}?v=5">
    <link rel="shortcut icon" type="image/png" href="{{ asset('favicon-32x32.png') }}?v=5">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}?v=5">
    <link rel="icon" type="image/svg+xml" href="{{ asset('images/logo-icon.svg') }}?v=5">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('images/logo-icon.png') }}?v=5">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/logo-icon.png') }}?v=5">

    <!-- Search Engine & SEO Metadata -->
    <meta name="description" content="SAPA (Sistem Automisasi Pesan & Alert) — Platform Enterprise WhatsApp Gateway & Broadcast Alerting resmi. Otomasi pesan massal anti-banned, auto-reply asisten AI, alert notifikasi real-time, dan integrasi REST API terpercaya.">
    <meta name="keywords" content="sapa, sapa wa, sistem automisasi pesan dan alert, whatsapp gateway indonesia, api whatsapp resmi, broadcast whatsapp massal, auto reply wa bot, alert whatsapp, wa gateway murah, rest api whatsapp">
    <meta name="author" content="SAPA — Sistem Automisasi Pesan & Alert">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

    <!-- Open Graph & Social Link Preview Logo -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ config('app.name', 'SAPA') }}">
    <meta property="og:title" content="{{ config('app.name', 'SAPA') }} — Sistem Automisasi Pesan & Alert">
    <meta property="og:description" content="SAPA: Platform Enterprise WhatsApp Gateway & Alerting Engine terpadu. Otomasi pesan massal, notifikasi sistem real-time, auto-reply cerdas, dan integrasi API.">
    <meta property="og:image" content="{{ asset('images/logo.png') }}?v=6">
    <meta property="og:locale" content="id_ID">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ config('app.name', 'SAPA') }} — Sistem Automisasi Pesan & Alert">
    <meta name="twitter:description" content="SAPA (Sistem Automisasi Pesan & Alert) — Gateway WhatsApp & Otomasi Pesan Enterprise di Indonesia.">
    <meta name="twitter:image" content="{{ asset('images/logo.png') }}?v=6">

    <!-- Modern Editorial & Tech SaaS Typography (Plus Jakarta Sans, Playfair Display, Instrument Serif, JetBrains Mono) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/js/app.jsx', 'resources/css/app.css'])
    @inertiaHead
</head>
<body class="bg-[#f8fafc] text-[#0f172a] font-sans antialiased min-h-screen flex flex-col">
    @inertia
</body>
</html>
