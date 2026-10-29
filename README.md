# bisniswa

MARDIRA WhatsApp Gateway Enterprise & Multi-Device Automation Platform.

Sistem otomasi pesan WhatsApp cerdas dengan dukungan Dual-Engine (Baileys WebSocket & whatsapp-web.js Chromium), Auto-Reply berbasis kata kunci (*keyword rules*), Menu Layanan Interaktif, Fallback Asisten AI Gemini, Kampanye Broadcast terjadwal, dan Shared Team Live Chat Inbox.

---

## Fitur Utama

- **Dual WhatsApp Engine**: Pilihan engine Baileys (cepat & ringan) atau whatsapp-web.js (native Chromium).
- **Auto-Reply & Asisten AI Cerdas**:
  - Respon otomatis berbasis kata kunci (*exact*, *contains*, *starts_with*).
  - Respon Menu Layanan Sambutan (*Greeting Menu*) format bernomor atau kotak.
  - Sakelar Utama Global (*Master Toggle*) & Sakelar Status per-aturan (Aktif / Nonaktif).
  - *Smart Fallback* dengan Google Gemini AI Flash 1.5.
  - Simulator interaktif WhatsApp Bot di dashboard.
- **Shared Live Chat & Inbox**: Kotak masuk tim terpusat dengan sinkronisasi pesan realtime tanpa refresh halaman.
- **Kampanye Broadcast**: Pengiriman pesan massal berjadwal dengan penanganan jeda anti-blokir dan analitik pengiriman.
- **Manajemen Kontak & CRM**: Pengelompokan kontak, import CSV, dan riwayat obrolan pelanggan.
- **REST API & Webhooks**: Kredensial API Key untuk integrasi aplikasi eksternal dan webhook pesan masuk.

---

## Persyaratan Sistem

- PHP >= 8.3
- Node.js >= 20
- PostgreSQL >= 15
- Composer
- NPM

---

## Panduan Instalasi

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Frhstaaa/bisniswa.git
   cd bisniswa
   ```

2. **Setup PHP Dependencies & Environment**:
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

3. **Setup Database & Migrations**:
   ```bash
   php artisan migrate --seed
   ```

4. **Setup Node.js Gateway & Frontend**:
   ```bash
   npm install
   npm run build

   cd gateway-node
   npm install
   cd ..
   ```

5. **Menjalankan Layanan**:
   ```bash
   # Terminal 1: Laravel Web Server
   php artisan serve --port=8001

   # Terminal 2: WhatsApp Gateway Microservice
   PORT=3001 node gateway-node/server.js

   # Terminal 3: Queue Worker
   php artisan queue:work --tries=3
   ```
