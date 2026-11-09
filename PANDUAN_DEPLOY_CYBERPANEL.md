# 📖 Panduan Lengkap Deploy Mardira WA (BisnisWA)
### Domain: **`mardirawa.frahesta.com`**
Khusus Server CyberPanel (Bisa Tanpa Akses Terminal SSH)

---

## 📌 Ringkasan Alur Cepat Deploy
1. **Buat Website**: Domain `mardirawa.frahesta.com` dengan **PHP 8.3** di CyberPanel.
2. **Buat Database MySQL**: Catat nama DB, user DB, dan password DB.
3. **Upload & Ekstrak**: Upload file `bisniswa-cyberpanel-production.zip` ke `/home/mardirawa.frahesta.com/public_html/` lalu Ekstrak.
4. **Edit `.env`**: Salin `.env.production.example` menjadi `.env`, masukkan kredensial database.
5. **Jalankan Setup via Web Browser**: Buka `https://mardirawa.frahesta.com/setup.php` di browser Anda (PIN default: `mardira123`).
6. **Jalankan WhatsApp Gateway & Queue**: Menggunakan NodeJS CyberPanel atau terminal.

---

## 🛠️ Langkah Demi Langkah

### 1. Buat Website di CyberPanel
1. Masuk ke CyberPanel -> **Websites** -> **Create Website**.
2. **Domain Name**: `mardirawa.frahesta.com`
3. **PHP Version**: `PHP 8.3`
4. Centang: **SSL** dan **open_basedir Protection**.
5. Klik **Create Website**.

### 2. Buat Database MySQL
1. Buka menu **Databases** -> **Create Database**.
2. Pilih website: `mardirawa.frahesta.com`.
3. Masukkan nama database (misal: `mardira_wa`), username (misal: `mardira_user`), dan password yang kuat.
4. Catat detail kredensial ini untuk diisikan ke file `.env`.

### 3. Upload & Ekstrak ZIP
1. Masuk ke **Websites** -> **List Websites** -> klik **Manage** pada `mardirawa.frahesta.com`.
2. Klik **File Manager**.
3. Masuk ke folder: `/home/mardirawa.frahesta.com/public_html/`.
4. (Opsional) Hapus file bawaan `index.html` jika ada.
5. Klik **Upload** di pojok kanan atas, pilih file `bisniswa-cyberpanel-production.zip`.
6. Klik kanan pada file zip yang sudah terupload, pilih **Extract**.

### 4. (PENTING) Arahkan Document Root ke Folder `public`
1. Di CyberPanel, masuk ke menu **Websites** -> **List Websites** -> klik **Manage** pada `mardirawa.frahesta.com`.
2. Klik tombol **vHost Conf** (Konfigurasi Virtual Host).
3. Cari baris `docRoot` dan ubah menjadi:
   ```apache
   docRoot                   $VH_ROOT/public_html/public
   ```
4. Klik **Save**.
*(Catatan: Zip ini juga sudah dilengkapi `.htaccess` cadangan di root folder untuk meredirect otomatis).*

### 5. Atur File Konfigurasi `.env`
1. Di File Manager CyberPanel, salin/rename file `.env.production.example` menjadi `.env`.
2. Edit file `.env`, sesuaikan nilai database:
   ```env
   APP_NAME="MARDIRA WA"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://mardirawa.frahesta.com

   # Kredensial Database CyberPanel Anda
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=mard_mardirawa
   DB_USERNAME=mard_mardirawa
   DB_PASSWORD=23052003

   # Gateway WhatsApp
   WHATSAPP_NODE_URL=http://127.0.0.1:3001
   WHATSAPP_NODE_SECRET=internal_secret_token

   # PIN Pengaman Web Setup Browser
   SETUP_SECRET=mardira123
   ```
3. Simpan perubahan.

### 6. Setup Database & Cache Langsung Lewat Browser (Tanpa Terminal SSH!)
Anda tidak perlu repot mengetik perintah di terminal. Cukup buka browser:

👉 **`https://mardirawa.frahesta.com/setup.php`**

1. Masukkan PIN Pengaman: **`mardira123`**.
2. Anda akan melihat halaman antarmuka **Mardira WA Deployment Assistant**:
   - **Langkah 1**: Periksa apakah status koneksi database sudah bertanda hijau "Terkoneksi".
   - **Langkah 2**: Klik tombol **"Jalankan Migrasi Database"** (otomatis membuat semua tabel).
   - **Langkah 3**: Klik tombol **"Isi Akun Default & Paket"** (menjalankan seeder untuk membuat akun Admin, paket, dan data awal).
   - **Langkah 4**: Klik tombol **"Buat Symlink Storage"** (menghubungkan folder upload media).
   - **Langkah 5**: Klik tombol **"Optimasi Cache Sekarang"** (mempercepat loading sistem).
   - **Langkah 6**: Klik tombol **"Nonaktifkan File Setup Ini"** jika semua langkah di atas sudah selesai demi keamanan.

---

## 🔑 Informasi Akun Login Default

Setelah database dimigrasi & di-seed, Anda dapat langsung login menggunakan akun berikut:

### 1. Akun Super Administrator (Akses Penuh Seluruh Sistem)
- **URL Login**: `https://mardirawa.frahesta.com/login`
- **Email**: `admin@kirimwa.pro`
- **Password**: `password`
- **Hak Akses**: Mengelola seluruh client, paket langganan, payment gateway, audit log, WhatsApp gateway, dan seluruh workspace.

### 2. Akun Client / Tenant Demo
- **Kampus Mardira (Enterprise Pro)**:
  - **Email**: `baak@mardira.ac.id`
  - **Password**: `password`
- **CV Majalengka Berkah (Starter Lite)**:
  - **Email**: `owner@majalengkaberkah.com`
  - **Password**: `password`

*(Catatan: Anda juga bisa membuat akun baru secara mandiri melalui tombol **Mulai** / halaman **`/register`**).*

---

### 7. Menjalankan Engine WhatsApp Web JS & Queue Worker

Aplikasi WhatsApp membutuhkan Node.js agar bot dan scan QR WhatsApp Web JS tetap standby:

#### Pilihan A: Jika Ada Menu "NodeJS" di CyberPanel Anda
1. Buka **Websites** -> **List Websites** -> **Manage** -> **NodeJS App**.
2. **App Path**: `/home/mardirawa.frahesta.com/public_html/gateway-node`
3. **App Startup File**: `server.js`
4. **Port**: `3001`
5. Jalankan `npm install` dan klik **Start App**.

#### Pilihan B: Menggunakan PM2 (Jika Anda / Admin Memiliki Akses SSH VPS)
Jalankan perintah ini:
```bash
# 1. Install dependencies Chromium di VPS Ubuntu/Debian (Wajib untuk WhatsApp Web JS)
sudo apt-get update && sudo apt-get install -y \
  libasound2 libatk-bridge2.0-0 libdrm2 libgbm1 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2

# 2. Jalankan Gateway WhatsApp
cd /home/mardirawa.frahesta.com/public_html/gateway-node
npm install --omit=dev
pm2 start server.js --name "wa-gateway"

# 3. Jalankan Queue Worker Pesan
cd /home/mardirawa.frahesta.com/public_html
pm2 start "php artisan queue:work --tries=3 --timeout=90" --name "wa-queue"

# 4. Simpan agar otomatis hidup saat VPS restart
pm2 save
pm2 startup
```

---

### 8. Atur Cron Job Laravel di CyberPanel
1. Buka CyberPanel -> **Websites** -> **List Websites** -> **Manage** -> **Cron Jobs**.
2. Klik **Add Cron**.
3. Interval: **Every minute** (`* * * * *`).
4. Command:
   ```bash
   /usr/local/lsws/lsphp83/bin/php /home/mardirawa.frahesta.com/public_html/artisan schedule:run >> /dev/null 2>&1
   ```
5. Klik **Save**.

---

🎉 **Selesai!** Buka **`https://mardirawa.frahesta.com`** di browser Anda. Aplikasi siap digunakan 100%!
