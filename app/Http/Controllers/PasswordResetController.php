<?php

namespace App\Http\Controllers;

use App\Mail\ResetPasswordMail;
use App\Models\Device;
use App\Models\User;
use App\Rules\ValidDeliverableEmailRule;
use App\Services\WhatsApp\WhatsAppGatewayService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    public function __construct(
        protected WhatsAppGatewayService $gatewayService
    ) {}

    /**
     * Display the form to request a password reset link.
     */
    public function showForgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * Send a reset link to the given user.
     */
    public function sendResetLinkEmail(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string', new ValidDeliverableEmailRule],
        ], [
            'email.required' => 'Alamat email wajib diisi.',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if (! $user) {
            if (app()->isLocal()) {
                return back()->with('error', "Email '{$request->email}' belum terdaftar dalam sistem. Silakan pastikan email yang dimasukkan telah terdaftar.");
            }

            return back()->with('status', 'Instruksi dan tautan reset kata sandi telah dikirimkan ke email Anda jika terdaftar dalam sistem.');
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $resetUrl = route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ]);

        try {
            Mail::to($user->email)->send(new ResetPasswordMail(
                resetUrl: $resetUrl,
                userName: $user->name,
                clientIp: $request->ip(),
                userAgent: $request->userAgent()
            ));
        } catch (\Throwable $e) {
            report($e);
        }

        // In local/testing mode, provide preview URL to session flash for instant tester convenience
        if (app()->isLocal() || app()->runningUnitTests()) {
            session()->flash('preview_url', $resetUrl);
        }

        // WhatsApp notification if user has registered phone number and a gateway device is connected
        if (! empty($user->phone)) {
            $connectedDevice = Device::where('status', 'connected')->first();
            if ($connectedDevice) {
                try {
                    $waMessage = "🔐 *MARDIRA WA Security Alert*\n\nHalo *{$user->name}*,\n\nKami menerima permintaan pengaturan ulang kata sandi untuk akun Anda.\n\nSilakan klik tautan di bawah ini untuk membuat kata sandi baru:\n{$resetUrl}\n\n⏱️ *Penting:* Tautan berlaku 60 menit.\nJika Anda tidak mengajukan ini, abaikan pesan ini. Akun Anda tetap terlindungi.\n\n_Layanan Otentikasi Terenkripsi MARDIRA WA_";
                    $this->gatewayService->sendMessage($connectedDevice, $user->phone, $waMessage);
                    session()->flash('wa_sent', true);
                    session()->flash('user_phone', substr($user->phone, 0, 5).'****'.substr($user->phone, -3));
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }

        return back()->with('status', 'Instruksi dan tautan reset kata sandi telah dikirimkan ke email Anda jika terdaftar dalam sistem.');
    }

    /**
     * Display the password reset view for the given token.
     */
    public function showResetPassword(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email', ''),
        ]);
    }

    /**
     * Reset the given user's password.
     */
    public function resetPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => ['required', 'string', new ValidDeliverableEmailRule],
            'password' => ['required', 'confirmed', Password::min(6)],
        ], [
            'email.required' => 'Alamat email wajib diisi.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min' => 'Kata sandi minimal harus 6 karakter.',
        ]);

        $email = strtolower(trim($request->email));

        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (! $record) {
            return back()->withErrors([
                'email' => 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa.',
            ]);
        }

        // Check 60 minutes expiry
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            return back()->withErrors([
                'email' => 'Tautan reset kata sandi telah kedaluwarsa (lebih dari 60 menit). Silakan minta tautan baru.',
            ]);
        }

        if (! Hash::check($request->token, $record->token)) {
            return back()->withErrors([
                'email' => 'Token reset kata sandi tidak sesuai.',
            ]);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return back()->withErrors([
                'email' => 'Pengguna dengan email ini tidak ditemukan.',
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return redirect('/login')->with('success', 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
    }
}
