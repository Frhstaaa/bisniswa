<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class SafePublicUrlRule implements ValidationRule
{
    /**
     * Run the validation rule.
     * Prevents Server-Side Request Forgery (SSRF) to internal/loopback/private IPs and cloud metadata services.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        if (! filter_var($value, FILTER_VALIDATE_URL)) {
            $fail("URL {$attribute} tidak valid.");

            return;
        }

        $parts = parse_url((string) $value);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = strtolower(trim($parts['host'] ?? ''));

        if (! in_array($scheme, ['http', 'https'], true)) {
            $fail("Skema URL pada {$attribute} harus http atau https.");

            return;
        }

        if (empty($host)) {
            $fail("Host pada {$attribute} tidak valid.");

            return;
        }

        // Clean IPv6 brackets if present (e.g. "[::1]" -> "::1")
        $cleanHost = trim($host, '[]');

        // Cloud metadata endpoints (AWS, GCP, Azure, DigitalOcean, Oracle Cloud)
        $cloudMetadataHosts = [
            '169.254.169.254',
            '169.254.170.2',
            'metadata.google.internal',
            'metadata.azure.com',
            'instance-data',
            'fd00:ec2::254',
        ];

        if (in_array($cleanHost, $cloudMetadataHosts, true)) {
            $fail("Akses ke metadata cloud tidak diizinkan untuk {$attribute}.");

            return;
        }

        // Reject obvious loopback or private hostnames
        if (
            $cleanHost === 'localhost' ||
            $cleanHost === '127.0.0.1' ||
            $cleanHost === '0.0.0.0' ||
            $cleanHost === '::1' ||
            $cleanHost === '::' ||
            str_ends_with($cleanHost, '.internal') ||
            str_ends_with($cleanHost, '.local') ||
            str_ends_with($cleanHost, '.localhost') ||
            str_ends_with($cleanHost, '.test') ||
            str_ends_with($cleanHost, '.example') ||
            str_ends_with($cleanHost, '.invalid') ||
            str_ends_with($cleanHost, '.lan') ||
            str_ends_with($cleanHost, '.home') ||
            str_ends_with($cleanHost, '.corp')
        ) {
            $fail("Akses ke host internal/loopback tidak diizinkan untuk {$attribute}.");

            return;
        }

        // Check if host is an IPv4 or IPv6 address or hostname resolving to one
        $ip = filter_var($cleanHost, FILTER_VALIDATE_IP) ? $cleanHost : @gethostbyname($cleanHost);
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP)) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                $fail("URL {$attribute} mengarah ke jaringan privat/terlarang (SSRF protection).");

                return;
            }

            // Explicitly block link-local (169.254.0.0/16) and IPv6 loopback / private addresses
            if (
                str_starts_with($ip, '169.254.') ||
                str_starts_with($ip, '127.') ||
                $ip === '::1' ||
                str_starts_with(strtolower($ip), 'fe80:') ||
                str_starts_with(strtolower($ip), 'fc00:') ||
                str_starts_with(strtolower($ip), 'fd00:')
            ) {
                $fail("URL {$attribute} mengarah ke jaringan privat/terlarang (SSRF protection).");

                return;
            }
        }
    }
}
