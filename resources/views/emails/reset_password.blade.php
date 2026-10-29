<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instruksi Reset Kata Sandi - MARDIRA WA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #064e3b; padding: 32px 36px; text-align: left;">
                            <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                MARDIRA<span style="color: #34d399;">WA</span>
                            </div>
                            <div style="font-size: 11px; font-weight: 600; color: #a7f3d0; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
                                Politeknik Mardira Indonesia • Enterprise Gateway
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 36px 28px 36px;">
                            <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                                Permintaan Reset Kata Sandi Akun
                            </h1>
                            <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">
                                Yth. <strong>{{ $userName }}</strong>,
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569;">
                                Kami menerima permintaan pengaturan ulang kata sandi untuk akun MARDIRA WA Anda. Untuk membuat kata sandi baru, silakan klik tombol di bawah ini:
                            </p>

                            <!-- Primary CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{ $resetUrl }}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.2px; box-shadow: 0 3px 6px rgba(5, 150, 105, 0.25);">
                                    Atur Ulang Kata Sandi Saya →
                                </a>
                            </div>

                            <!-- Enterprise Security Metadata Audit Card -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 24px 0; font-size: 12px; color: #334155;">
                                <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Detail Permintaan Keamanan:
                                </div>
                                <table role="presentation" border="0" cellpadding="2" cellspacing="0" width="100%" style="font-size: 11px; color: #475569;">
                                    <tr>
                                        <td style="width: 140px; color: #64748b;">Waktu Pengajuan:</td>
                                        <td style="font-weight: 600; color: #0f172a;">{{ $requestedAt }}</td>
                                    </tr>
                                    @if($clientIp)
                                    <tr>
                                        <td style="color: #64748b;">Alamat IP:</td>
                                        <td style="font-family: monospace; color: #0f172a;">{{ $clientIp }}</td>
                                    </tr>
                                    @endif
                                    @if($userAgent)
                                    <tr>
                                        <td style="color: #64748b;">Browser / Perangkat:</td>
                                        <td style="color: #0f172a;">{{ Str::limit($userAgent, 55) }}</td>
                                    </tr>
                                    @endif
                                    <tr>
                                        <td style="color: #64748b;">Masa Berlaku:</td>
                                        <td style="font-weight: 600; color: #059669;">60 Menit (Kedaluwarsa otomatis)</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Warning Disclaimer -->
                            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin: 20px 0; font-size: 12px; color: #92400e;">
                                <strong>Penting:</strong> Jika Anda tidak mengajukan permintaan ini, kemungkinan ada pihak lain yang mencoba mengakses akun Anda. Kata sandi Anda saat ini tetap aman dan tidak akan berubah tanpa mengklik tautan di atas.
                            </div>

                            <!-- Raw Fallback Link -->
                            <p style="margin: 24px 0 6px 0; font-size: 11px; color: #64748b;">
                                Jika tombol tidak berfungsi, salin dan tempel URL berikut ke bilah alamat browser Anda:
                            </p>
                            <p style="margin: 0; font-size: 11px; font-family: monospace; color: #059669; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 6px;">
                                <a href="{{ $resetUrl }}" style="color: #059669; text-decoration: none;">{{ $resetUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 36px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                            Email ini dikirim otomatis oleh Layanan Otentikasi Terenkripsi MARDIRA WA.<br>
                            <strong>Politeknik Mardira Indonesia</strong> — Jl. Soekarno Hatta No. 211, Bandung, Jawa Barat.<br>
                            &copy; {{ date('Y') }} Politeknik Mardira Indonesia. Seluruh hak cipta dilindungi.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
