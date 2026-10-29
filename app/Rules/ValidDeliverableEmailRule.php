<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class ValidDeliverableEmailRule implements ValidationRule
{
    /**
     * Common disposable / temporary email domains to reject.
     */
    protected array $disposableDomains = [
        'mailinator.com',
        'yopmail.com',
        'tempmail.com',
        'temp-mail.org',
        'temp-mail.io',
        'guerrillamail.com',
        'guerrillamail.block',
        'sharklasers.com',
        '10minutemail.com',
        '10minutemail.net',
        'trashmail.com',
        'trashmail.net',
        'dispostable.com',
        'fakeinbox.com',
        'getairmail.com',
        'mohmal.com',
        'throwawaymail.com',
        'burnermail.io',
        'crazymailing.com',
        'emailondeck.com',
        'inboxkitten.com',
        'mytemp.email',
        'tempail.com',
        'maildrop.cc',
        'generator.email',
        'nada.ltd',
        'getnada.com',
        'dropmail.me',
        '10mail.org',
        'fakemailgenerator.com',
        'armyspy.com',
        'cuvox.de',
        'dayrep.com',
        'einrot.com',
        'fleckens.hu',
        'gustr.com',
        'jourrapide.com',
        'rhyta.com',
        'superrito.com',
        'teleworm.us',
        'mailcatch.com',
        'trashymail.com',
        'mailnesia.com',
        'deadaddress.com',
        'getairmail.com',
    ];

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || empty(trim($value))) {
            $fail('Alamat email wajib diisi.');

            return;
        }

        $email = strtolower(trim($value));

        // 1. Basic format & RFC check
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $fail('Format alamat email tidak valid.');

            return;
        }

        // 2. Extract domain
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            $fail('Format alamat email tidak lengkap.');

            return;
        }

        $domain = $parts[1];

        // Ensure domain has at least one dot and valid characters
        if (! str_contains($domain, '.') || preg_match('/[^a-z0-9.-]/', $domain)) {
            $fail("Domain email '{$domain}' tidak valid.");

            return;
        }

        // 3. Block known disposable / burner email domains
        if (in_array($domain, $this->disposableDomains, true)) {
            $fail("Email sementara (disposable email '{$domain}') tidak diizinkan. Harap gunakan email instansi, kampus, atau bisnis resmi.");

            return;
        }

        // 4. DNS MX / A record check (ensure domain actually exists and accepts mail)
        // Skip in testing environment or if DNS is disabled in testing
        if (! app()->runningUnitTests()) {
            try {
                $hasMx = @checkdnsrr($domain, 'MX');
                $hasA = $hasMx ? true : @checkdnsrr($domain, 'A');

                if (! $hasMx && ! $hasA) {
                    $fail("Domain '{$domain}' tidak ditemukan atau tidak memiliki server surat (MX record) yang aktif.");

                    return;
                }
            } catch (\Throwable) {
                // If DNS fails due to network isolation, allow fallback to syntax
            }
        }
    }
}
