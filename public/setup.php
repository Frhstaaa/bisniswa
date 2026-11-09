<?php

use App\Models\Plan;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Mardira WA (BisnisWA) - Web Deployment & Setup Assistant
 * Dibuat khusus untuk setup aplikasi via web browser tanpa akses terminal SSH di CyberPanel.
 */
session_start();

$basePath = dirname(__DIR__);
if (! file_exists($basePath.'/artisan') && file_exists(__DIR__.'/artisan')) {
    $basePath = __DIR__;
}
$envPath = $basePath.'/.env';

// Ambil secret PIN dari .env jika ada, default: mardira123
$expectedPin = 'mardira123';
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    if (preg_match('/^SETUP_SECRET=(.*)$/m', $envContent, $matches)) {
        $found = trim($matches[1], " \"'");
        if (! empty($found)) {
            $expectedPin = $found;
        }
    }
}

// Otomatis bersihkan file penanda mode dev Vite (public/hot) jika terbawa ke server
if (file_exists(__DIR__.'/hot')) {
    @unlink(__DIR__.'/hot');
}
if (file_exists($basePath.'/public/hot')) {
    @unlink($basePath.'/public/hot');
}

// PENTING: Otomatis hapus file cache config jika ada, agar .env SELALU dibaca ulang secara real-time
if (file_exists($basePath.'/bootstrap/cache/config.php')) {
    @unlink($basePath.'/bootstrap/cache/config.php');
}

// Handle Logout / Kunci
if (isset($_GET['action']) && $_GET['action'] === 'lock') {
    unset($_SESSION['setup_auth']);
    header('Location: setup.php');
    exit;
}

// Handle Disable / Hapus File
if (isset($_POST['action']) && $_POST['action'] === 'self_destruct') {
    if (empty($_SESSION['setup_auth'])) {
        exit(json_encode(['success' => false, 'message' => 'Unauthorized']));
    }
    $target = __FILE__;
    $renamed = __FILE__.'.disabled';
    if (@rename($target, $renamed)) {
        $_SESSION['setup_auth'] = false;
        echo json_encode(['success' => true, 'message' => 'File setup.php berhasil dinonaktifkan (di-rename menjadi setup.php.disabled).']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal me-rename file. Silakan hapus file public/setup.php secara manual melalui File Manager CyberPanel demi keamanan.']);
    }
    exit;
}

// Handle Login PIN
$authError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_pin'])) {
    if (hash_equals($expectedPin, (string) $_POST['login_pin'])) {
        $_SESSION['setup_auth'] = true;
        header('Location: setup.php');
        exit;
    } else {
        $authError = 'PIN Pengaman salah. Default PIN adalah: mardira123';
    }
}

$isAuthed = ! empty($_SESSION['setup_auth']);

// Handle AJAX Actions (Hanya jika terautentikasi)
if ($isAuthed && isset($_POST['action'])) {
    header('Content-Type: application/json');

    // Hapus config cache sebelum aksi apapun dijalankan
    if (file_exists($basePath.'/bootstrap/cache/config.php')) {
        @unlink($basePath.'/bootstrap/cache/config.php');
    }

    $action = $_POST['action'];

    try {
        switch ($action) {
            case 'save_db_config':
                $dbConn = 'mysql';
                $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
                $dbPort = trim($_POST['db_port'] ?? '3306');
                $dbName = trim($_POST['db_database'] ?? 'mard_mardirawa');
                $dbUser = trim($_POST['db_username'] ?? 'mard_mardirawa');
                $dbPass = trim($_POST['db_password'] ?? '23052003');

                if (! file_exists($envPath)) {
                    if (file_exists($basePath.'/.env.production.example')) {
                        copy($basePath.'/.env.production.example', $envPath);
                    } else {
                        file_put_contents($envPath, "APP_NAME=\"MARDIRA WA\"\nAPP_ENV=production\nAPP_KEY=base64:uJr8rJUboGOKdA2FTfmI+2MxUVQ3ue8oBlp4sHR4SeE=\nAPP_URL=https://mardirawa.frahesta.com\n");
                    }
                }

                $envContent = file_get_contents($envPath);
                $replacements = [
                    'DB_CONNECTION' => $dbConn,
                    'DB_HOST' => $dbHost,
                    'DB_PORT' => $dbPort,
                    'DB_DATABASE' => $dbName,
                    'DB_USERNAME' => $dbUser,
                    'DB_PASSWORD' => $dbPass,
                ];

                foreach ($replacements as $key => $val) {
                    if (preg_match("/^{$key}=.*$/m", $envContent)) {
                        $envContent = preg_replace("/^{$key}=.*$/m", "{$key}={$val}", $envContent);
                    } else {
                        $envContent .= "\n{$key}={$val}";
                    }
                }
                file_put_contents($envPath, $envContent);

                if (file_exists($basePath.'/bootstrap/cache/config.php')) {
                    @unlink($basePath.'/bootstrap/cache/config.php');
                }

                // Langsung uji koneksi native PDO
                $directPdoOk = false;
                $directPdoErr = null;
                try {
                    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
                    $pdo = new PDO($dsn, $dbUser, $dbPass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_TIMEOUT => 5,
                    ]);
                    $directPdoOk = true;
                } catch (Throwable $pe) {
                    $directPdoErr = $pe->getMessage();
                }

                echo json_encode([
                    'success' => true,
                    'db_connected' => $directPdoOk,
                    'db_error' => $directPdoErr,
                    'output' => $directPdoOk
                        ? "File .env berhasil diperbarui & Database MySQL Terkoneksi Sukses! ($dbName @ $dbHost:$dbPort)"
                        : "File .env diperbarui, namun MySQL belum terkoneksi: $directPdoErr",
                ]);
                break;

            case 'clear_cache':
                if (file_exists($basePath.'/bootstrap/cache/config.php')) {
                    @unlink($basePath.'/bootstrap/cache/config.php');
                }
                foreach (glob($basePath.'/bootstrap/cache/*.php') as $f) {
                    if (! in_array(basename($f), ['packages.php', 'services.php'])) {
                        @unlink($f);
                    }
                }

                if (file_exists($basePath.'/vendor/autoload.php')) {
                    require_once $basePath.'/vendor/autoload.php';
                    $app = require_once $basePath.'/bootstrap/app.php';
                    $kernel = $app->make(Kernel::class);
                    $kernel->bootstrap();
                    Artisan::call('optimize:clear');
                }

                echo json_encode([
                    'success' => true,
                    'output' => 'Seluruh cache konfigurasi dan file bootstrap/cache/config.php berhasil dibersihkan!',
                ]);
                break;

            case 'check_env':
                $phpVersion = PHP_VERSION;
                $phpOk = version_compare($phpVersion, '8.2.0', '>=');

                $requiredExts = ['pdo', 'pdo_mysql', 'curl', 'mbstring', 'fileinfo', 'zip', 'gd', 'xml', 'bcmath'];
                $extStatus = [];
                foreach ($requiredExts as $ext) {
                    $extStatus[$ext] = extension_loaded($ext);
                }

                $storageWritable = is_writable($basePath.'/storage');
                $bootstrapWritable = is_writable($basePath.'/bootstrap/cache');

                // Baca nilai aktual di .env
                $hasEnv = file_exists($envPath);
                $rawEnv = $hasEnv ? file_get_contents($envPath) : '';
                $detected = [
                    'connection' => preg_match('/^DB_CONNECTION=(.*)$/m', $rawEnv, $m) ? trim($m[1], " \"'") : '',
                    'host' => preg_match('/^DB_HOST=(.*)$/m', $rawEnv, $m) ? trim($m[1], " \"'") : '',
                    'port' => preg_match('/^DB_PORT=(.*)$/m', $rawEnv, $m) ? trim($m[1], " \"'") : '',
                    'database' => preg_match('/^DB_DATABASE=(.*)$/m', $rawEnv, $m) ? trim($m[1], " \"'") : '',
                    'username' => preg_match('/^DB_USERNAME=(.*)$/m', $rawEnv, $m) ? trim($m[1], " \"'") : '',
                ];

                $dbConnected = false;
                $dbError = null;

                if (! file_exists($basePath.'/vendor/autoload.php')) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Folder vendor/ tidak ditemukan. Pastikan file zip diekstrak dengan lengkap.',
                    ]);
                    exit;
                }

                require_once $basePath.'/vendor/autoload.php';
                $app = require_once $basePath.'/bootstrap/app.php';
                $kernel = $app->make(Kernel::class);
                $kernel->bootstrap();

                try {
                    DB::purge();
                    DB::connection()->getPdo();
                    $dbConnected = true;
                } catch (Throwable $e) {
                    $dbError = $e->getMessage();
                }

                $gatewayRunning = false;
                $gatewaySessions = 0;
                $gatewayUrl = preg_match('/^WHATSAPP_NODE_URL=(.*)$/m', $rawEnv, $m) ? trim($m[1], " \"'") : 'http://127.0.0.1:3001';
                try {
                    $ctx = stream_context_create(['http' => ['timeout' => 1]]);
                    $health = @file_get_contents(rtrim($gatewayUrl, '/').'/health', false, $ctx);
                    if ($health) {
                        $json = json_decode($health, true);
                        if ($json && ($json['status'] ?? '') === 'ok') {
                            $gatewayRunning = true;
                            $gatewaySessions = $json['active_sessions'] ?? 0;
                        }
                    }
                } catch (Throwable $e) {
                    // Gateway offline
                }

                echo json_encode([
                    'success' => true,
                    'php_version' => $phpVersion,
                    'php_ok' => $phpOk,
                    'extensions' => $extStatus,
                    'storage_writable' => $storageWritable,
                    'bootstrap_writable' => $bootstrapWritable,
                    'has_env' => $hasEnv,
                    'detected_env' => $detected,
                    'db_connected' => $dbConnected,
                    'db_error' => $dbError,
                    'gateway_running' => $gatewayRunning,
                    'gateway_sessions' => $gatewaySessions,
                    'gateway_url' => $gatewayUrl,
                ]);
                break;

            case 'run_migrate':
                if (! file_exists($basePath.'/vendor/autoload.php')) {
                    exit(json_encode(['success' => false, 'message' => 'Folder vendor/ tidak ditemukan.']));
                }
                require_once $basePath.'/vendor/autoload.php';
                $app = require_once $basePath.'/bootstrap/app.php';
                $kernel = $app->make(Kernel::class);
                $kernel->bootstrap();

                $status = Artisan::call('migrate', ['--force' => true]);
                $output = Artisan::output();

                // Otomatis jalankan seed jika paket/user masih kosong
                if (Plan::count() === 0 || User::count() === 0) {
                    Artisan::call('db:seed', ['--force' => true]);
                    $seedOutput = Artisan::output();
                    $output .= "\n".trim($seedOutput);
                }

                echo json_encode([
                    'success' => $status === 0,
                    'output' => trim($output) ?: 'Migrasi database & data default berhasil dijalankan.',
                ]);
                break;

            case 'run_storage_link':
                require_once $basePath.'/vendor/autoload.php';
                $app = require_once $basePath.'/bootstrap/app.php';
                $kernel = $app->make(Kernel::class);
                $kernel->bootstrap();

                $status = Artisan::call('storage:link');
                $output = Artisan::output();
                echo json_encode([
                    'success' => true,
                    'output' => trim($output) ?: 'Symlink storage berhasil dibuat.',
                ]);
                break;

            case 'run_optimize':
                require_once $basePath.'/vendor/autoload.php';
                $app = require_once $basePath.'/bootstrap/app.php';
                $kernel = $app->make(Kernel::class);
                $kernel->bootstrap();

                Artisan::call('optimize:clear');
                $clearOutput = Artisan::output();

                Artisan::call('config:cache');
                Artisan::call('route:cache');
                Artisan::call('view:cache');
                $cacheOutput = Artisan::output();

                echo json_encode([
                    'success' => true,
                    'output' => trim($clearOutput."\n".$cacheOutput) ?: 'Cache aplikasi berhasil dibersihkan & dioptimasi untuk Production.',
                ]);
                break;

            case 'run_seed':
                require_once $basePath.'/vendor/autoload.php';
                $app = require_once $basePath.'/bootstrap/app.php';
                $kernel = $app->make(Kernel::class);
                $kernel->bootstrap();

                $status = Artisan::call('db:seed', ['--force' => true]);
                $output = Artisan::output();
                echo json_encode([
                    'success' => $status === 0,
                    'output' => trim($output) ?: 'Data seeder berhasil dijalankan.',
                ]);
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Aksi tidak dikenali.']);
                break;
        }
    } catch (Throwable $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Deployment & Setup Assistant - Mardira WA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between p-4 md:p-8">

    <div class="max-w-4xl mx-auto w-full">
        <!-- Header -->
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 mb-6 shadow-xl backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <div class="flex items-center gap-3">
                    <span class="inline-flex items-center justify-center p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </span>
                    <div>
                        <h1 class="text-xl font-bold tracking-tight text-white">Mardira WA Deployment Assistant</h1>
                        <p class="text-sm text-slate-400">Domain: <span class="text-emerald-400 font-mono">mardirawa.frahesta.com</span></p>
                    </div>
                </div>
            </div>
            <?php if ($isAuthed) { ?>
                <div class="flex items-center gap-2.5">
                    <button onclick="clearCacheConfig()" class="text-xs bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-lg transition flex items-center gap-1">
                        🧹 Bersihkan Cache .env
                    </button>
                    <a href="?action=lock" class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-slate-300 transition">Kunci Sesi</a>
                    <a href="/" target="_blank" class="text-xs bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 rounded-lg text-white font-medium transition flex items-center gap-1.5">
                        Buka Aplikasi
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                </div>
            <?php } ?>
        </div>

        <?php if (! $isAuthed) { ?>
            <!-- Login Form -->
            <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <h2 class="text-lg font-bold text-white">Masukkan PIN Pengaman</h2>
                    <p class="text-xs text-slate-400 mt-1">Halaman ini dilindungi PIN demi keamanan server Anda.</p>
                </div>

                <?php if ($authError) { ?>
                    <div class="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs">
                        <?= htmlspecialchars($authError) ?>
                    </div>
                <?php } ?>

                <form method="POST" class="space-y-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1.5">PIN Pengaman (Default: <code class="text-emerald-400">mardira123</code>)</label>
                        <input type="password" name="login_pin" autofocus required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-center tracking-widest text-lg" placeholder="••••••••">
                    </div>
                    <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/30">
                        Buka Dashboard Setup
                    </button>
                </form>
            </div>
        <?php } else { ?>
            <!-- Setup Dashboard -->
            <div class="space-y-6">

                <!-- 1. Status Server & DB -->
                <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2.5">
                            <span class="w-7 h-7 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-bold text-xs">1</span>
                            <h2 class="text-base font-semibold text-white">Diagnostik Lingkungan & Database</h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="toggleDbConfigModal()" class="text-xs bg-emerald-700/80 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
                                ⚙️ Ubah Setting Database .env
                            </button>
                            <button onclick="checkEnvironment()" id="btnCheckEnv" class="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                Refresh Cek
                            </button>
                        </div>
                    </div>

                    <div id="envStatusBox" class="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                        <p class="text-slate-400">Sedang memeriksa status server...</p>
                    </div>

                    <!-- Panel Cepat Setting Database -->
                    <div id="dbConfigPanel" class="mt-4 p-4 bg-slate-950/70 border border-slate-700 rounded-xl">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                <span>🛠️ Konfigurasi Database Langsung ke .env</span>
                            </h3>
                            <span class="text-[11px] text-slate-400">Tersimpan otomatis ke file .env tanpa buka File Manager</span>
                        </div>
                        <form onsubmit="saveDbConfig(event)" class="space-y-3 text-xs">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-slate-400 mb-1">Host Database</label>
                                    <input type="text" id="cfg_host" value="127.0.0.1" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono">
                                </div>
                                <div>
                                    <label class="block text-slate-400 mb-1">Port (MySQL CyberPanel: 3306)</label>
                                    <input type="text" id="cfg_port" value="3306" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono">
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-slate-400 mb-1">Nama Database</label>
                                    <input type="text" id="cfg_database" value="mard_mardirawa" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono">
                                </div>
                                <div>
                                    <label class="block text-slate-400 mb-1">Username Database</label>
                                    <input type="text" id="cfg_username" value="mard_mardirawa" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono">
                                </div>
                                <div>
                                    <label class="block text-slate-400 mb-1">Password Database</label>
                                    <input type="password" id="cfg_password" value="23052003" required class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono">
                                </div>
                            </div>
                            <button type="submit" id="btnSaveDb" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition shadow flex items-center justify-center gap-2">
                                <span>💾 Terapkan Kredensial MySQL & Tes Ulang Koneksi</span>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- 2. Eksekusi Setup Utama -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <!-- Card Migrasi Database -->
                    <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="w-7 h-7 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xs">2</span>
                                <h3 class="font-semibold text-white text-sm">Migrasi Database</h3>
                            </div>
                            <p class="text-xs text-slate-400 mb-4">Membangun tabel aplikasi (Users, Subscriptions, Devices, Messages, dll).</p>
                        </div>
                        <button onclick="runAction('run_migrate', this)" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2">
                            <span>Jalankan Migrasi</span>
                        </button>
                    </div>

                    <!-- Card Seeder Data Default -->
                    <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="w-7 h-7 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-bold text-xs">3</span>
                                <h3 class="font-semibold text-white text-sm">Isi Akun Default & Paket</h3>
                            </div>
                            <p class="text-xs text-slate-400 mb-4">Membuat akun Super Admin (<code class="text-emerald-400">admin@kirimwa.pro</code>) & paket langganan awal.</p>
                        </div>
                        <button onclick="runAction('run_seed', this)" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2">
                            <span>Jalankan Seeder Data</span>
                        </button>
                    </div>

                    <!-- Card Storage Symlink -->
                    <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="w-7 h-7 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center font-bold text-xs">4</span>
                                <h3 class="font-semibold text-white text-sm">Storage Symlink</h3>
                            </div>
                            <p class="text-xs text-slate-400 mb-4">Menghubungkan folder upload media & profil agar bisa diakses langsung.</p>
                        </div>
                        <button onclick="runAction('run_storage_link', this)" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2">
                            <span>Buat Symlink Storage</span>
                        </button>
                    </div>

                    <!-- Card Optimasi Cache -->
                    <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="w-7 h-7 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center font-bold text-xs">5</span>
                                <h3 class="font-semibold text-white text-sm">Optimasi Cache Production</h3>
                            </div>
                            <p class="text-xs text-slate-400 mb-4">Membersihkan cache lama & menyusun cache route, view, config untuk kecepatan maksimal.</p>
                        </div>
                        <button onclick="runAction('run_optimize', this)" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2">
                            <span>Optimasi Cache Sekarang</span>
                        </button>
                    </div>

                    <!-- Card Nonaktifkan Setup -->
                    <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between md:col-span-2 lg:col-span-2">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="w-7 h-7 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center font-bold text-xs">6</span>
                                <h3 class="font-semibold text-white text-sm">Kunci / Nonaktifkan File Setup</h3>
                            </div>
                            <p class="text-xs text-slate-400 mb-4">Setelah setup selesai, kunci atau nonaktifkan file ini demi keamanan server Anda.</p>
                        </div>
                        <button onclick="selfDestruct(this)" class="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2">
                            <span>Nonaktifkan File Setup Ini</span>
                        </button>
                    </div>

                </div>

                <!-- Log Output Console -->
                <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-white text-xs uppercase tracking-wider text-slate-400">Log Output Eksekusi</h3>
                        <button onclick="document.getElementById('consoleOutput').textContent = 'Console bersih.'" class="text-[11px] text-slate-400 hover:text-slate-200">Clear</button>
                    </div>
                    <pre id="consoleOutput" class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">Menunggu instruksi...</pre>
                </div>

            </div>
        <?php } ?>

        <!-- Footer -->
        <div class="text-center text-xs text-slate-500 mt-8">
            &copy; <?= date('Y') ?> Mardira WA (BisnisWA). All rights reserved.
        </div>
    </div>

    <script>
        function log(msg) {
            const el = document.getElementById('consoleOutput');
            if (el) {
                const time = new Date().toLocaleTimeString();
                el.textContent = `[${time}] ${msg}\n\n` + el.textContent;
            }
        }

        async function checkEnvironment() {
            const box = document.getElementById('envStatusBox');
            if (!box) return;
            box.innerHTML = '<span class="text-slate-400 animate-pulse">Memeriksa konfigurasi server & koneksi database...</span>';

            try {
                const formData = new FormData();
                formData.append('action', 'check_env');
                const res = await fetch('setup.php', { method: 'POST', body: formData });
                const data = await res.json();

                let html = '';
                html += `<div class="flex items-center justify-between py-1 border-b border-slate-800">
                    <span class="text-slate-400">Versi PHP:</span>
                    <span class="${data.php_ok ? 'text-emerald-400' : 'text-red-400'} font-bold">${data.php_version} (${data.php_ok ? 'OK' : 'Harap upgrade ke PHP 8.2+'})</span>
                </div>`;

                html += `<div class="flex items-center justify-between py-1 border-b border-slate-800">
                    <span class="text-slate-400">File Konfigurasi (.env):</span>
                    <span class="${data.has_env ? 'text-emerald-400' : 'text-red-400'}">${data.has_env ? 'Tersedia' : 'Belum dibuat!'}</span>
                </div>`;

                if (data.detected_env) {
                    html += `<div class="flex items-center justify-between py-1 border-b border-slate-800 text-slate-300">
                        <span class="text-slate-400">Driver & Target di .env:</span>
                        <span class="font-mono text-emerald-300">${data.detected_env.connection || '-'}://${data.detected_env.username || '-'}@${data.detected_env.host || '-'}:${data.detected_env.port || '-'}/${data.detected_env.database || '-'}</span>
                    </div>`;

                    // Update form values jika ada
                    if (data.detected_env.host) document.getElementById('cfg_host').value = data.detected_env.host;
                    if (data.detected_env.port) document.getElementById('cfg_port').value = data.detected_env.port;
                    if (data.detected_env.database) document.getElementById('cfg_database').value = data.detected_env.database;
                    if (data.detected_env.username) document.getElementById('cfg_username').value = data.detected_env.username;
                }

                html += `<div class="flex items-center justify-between py-1 border-b border-slate-800">
                    <span class="text-slate-400">Koneksi Database:</span>
                    <span class="${data.db_connected ? 'text-emerald-400 font-bold' : 'text-red-400'}">${data.db_connected ? '✅ Terkoneksi dengan Sukses' : '❌ Gagal (' + (data.db_error || 'Periksa .env') + ')'}</span>
                </div>`;

                html += `<div class="flex items-center justify-between py-1 border-b border-slate-800">
                    <span class="text-slate-400">WhatsApp Gateway (Port 3001):</span>
                    <span class="${data.gateway_running ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}">${data.gateway_running ? '🟢 ONLINE (' + data.gateway_sessions + ' Sesi Terhubung)' : '⚠️ OFFLINE (Jalankan: node gateway-node/server.js)'}</span>
                </div>`;

                html += `<div class="flex items-center justify-between py-1 border-b border-slate-800">
                    <span class="text-slate-400">Folder Storage (Writable):</span>
                    <span class="${data.storage_writable ? 'text-emerald-400' : 'text-amber-400'}">${data.storage_writable ? 'Dapat Ditulis (775)' : 'Perlu chmod 775 storage'}</span>
                </div>`;

                html += `<div class="flex items-center justify-between py-1">
                    <span class="text-slate-400">Folder Cache (Writable):</span>
                    <span class="${data.bootstrap_writable ? 'text-emerald-400' : 'text-amber-400'}">${data.bootstrap_writable ? 'Dapat Ditulis (775)' : 'Perlu chmod 775 bootstrap/cache'}</span>
                </div>`;

                box.innerHTML = html;
                log('Diagnostik server selesai. DB Status: ' + (data.db_connected ? 'Connected' : 'Disconnected'));
            } catch (err) {
                box.innerHTML = `<span class="text-red-400">Gagal mengambil data diagnostik: ${err.message}</span>`;
            }
        }

        async function saveDbConfig(e) {
            e.preventDefault();
            const btn = document.getElementById('btnSaveDb');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Menyimpan & Mengetes...';

            log('Menyimpan konfigurasi database baru ke .env...');

            try {
                const formData = new FormData();
                formData.append('action', 'save_db_config');
                formData.append('db_host', document.getElementById('cfg_host').value);
                formData.append('db_port', document.getElementById('cfg_port').value);
                formData.append('db_database', document.getElementById('cfg_database').value);
                formData.append('db_username', document.getElementById('cfg_username').value);
                formData.append('db_password', document.getElementById('cfg_password').value);

                const res = await fetch('setup.php', { method: 'POST', body: formData });
                const data = await res.json();

                log(data.output || data.message || 'Selesai.');
                alert((data.db_connected ? 'SUKSES!\n' : 'PERHATIAN!\n') + (data.output || data.message));
            } catch (err) {
                log('[ERROR] ' + err.message);
                alert('Gagal menyimpan: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
                checkEnvironment();
            }
        }

        async function clearCacheConfig() {
            log('Membersihkan seluruh file cache konfigurasi...');
            try {
                const formData = new FormData();
                formData.append('action', 'clear_cache');
                const res = await fetch('setup.php', { method: 'POST', body: formData });
                const data = await res.json();
                log('[SUKSES] ' + data.output);
                alert(data.output);
            } catch (err) {
                log('[ERROR] ' + err.message);
            } finally {
                checkEnvironment();
            }
        }

        async function runAction(action, btn) {
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = 'Memproses...';

            log(`Menjalankan aksi: ${action}...`);

            try {
                const formData = new FormData();
                formData.append('action', action);
                const res = await fetch('setup.php', { method: 'POST', body: formData });
                const data = await res.json();

                if (data.success) {
                    log(`[SUKSES] ${data.output || 'Selesai.'}`);
                    alert('Sukses!\n' + (data.output || 'Aksi selesai dijalankan.'));
                } else {
                    log(`[ERROR] ${data.message || data.output || 'Terjadi kesalahan.'}`);
                    alert('Peringatan / Error:\n' + (data.message || data.output));
                }
            } catch (err) {
                log(`[FATAL] ${err.message}`);
                alert('Gagal menghubungi server: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = originalText;
                checkEnvironment();
            }
        }

        async function selfDestruct(btn) {
            if (!confirm('Apakah Anda yakin ingin menonaktifkan file setup.php ini? Lakukan ini hanya jika seluruh migrasi dan setup sudah selesai.')) {
                return;
            }

            const formData = new FormData();
            formData.append('action', 'self_destruct');
            const res = await fetch('setup.php', { method: 'POST', body: formData });
            const data = await res.json();
            alert(data.message);
            window.location.href = '/';
        }

        function toggleDbConfigModal() {
            const panel = document.getElementById('dbConfigPanel');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('cfg_password').focus();
            }
        }

        <?php if ($isAuthed) { ?>
            window.addEventListener('DOMContentLoaded', checkEnvironment);
        <?php } ?>
    </script>
</body>
</html>
