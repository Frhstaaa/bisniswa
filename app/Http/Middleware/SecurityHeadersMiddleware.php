<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and apply production-grade HTTP security headers
     * and defense-in-depth attack probe detection.
     *
     * Protects against:
     * - PHP CGI Argument Injection (CVE-2024-4577)
     * - Remote Code Execution / PHP Wrapper injection (php://, data://)
     * - Directory & Path Traversal (../, ..\, %2e%2e)
     * - Sensitive Probe Scanner Attacks (.env, .git, eval-stdin.php)
     * - Clickjacking (X-Frame-Options, CSP frame-ancestors)
     * - Cross-Site Scripting / XSS (CSP, X-XSS-Protection)
     * - MIME-Type Sniffing (X-Content-Type-Options)
     * - Information Disclosure (removes X-Powered-By)
     * - Referrer Leakage (Referrer-Policy)
     * - Cross-Origin Resource / Window Hijacking (COOP, CORP)
     * - Man-in-the-Middle Attacks (HSTS on HTTPS)
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Suppress server fingerprinting early
        if (function_exists('header_remove')) {
            header_remove('X-Powered-By');
        }

        // Screen for malicious exploitation probes
        if ($this->isMaliciousProbe($request)) {
            return response()->json([
                'message' => 'Prohibited request pattern detected.',
            ], 400);
        }

        /** @var Response $response */
        $response = $next($request);

        // Remove server software header leak
        $response->headers->remove('X-Powered-By');

        // Clickjacking Defense
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // MIME-Sniffing Defense
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Legacy XSS Filter Defense
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Referrer Privacy Protection
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Restrict sensitive browser hardware APIs (modern standard features)
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        );

        // Cross-Origin Isolation
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        // Content Security Policy (CSP) tailored for Inertia + Vite + Google Fonts + Lucide + WebSockets
        $cspPolicy = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' ws: wss: https:",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);
        $response->headers->set('Content-Security-Policy', $cspPolicy);

        // Strict-Transport-Security (HSTS) when on HTTPS
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }

    /**
     * Detect malicious exploitation probes such as CVE-2024-4577 (PHP CGI injection),
     * PHP stream wrappers, directory traversal, and sensitive file probes.
     */
    protected function isMaliciousProbe(Request $request): bool
    {
        $queryString = (string) $request->server('QUERY_STRING', '');
        $rawUri = (string) $request->server('REQUEST_URI', '');
        $decodedUri = rawurldecode($rawUri);
        $decodedQuery = rawurldecode($queryString);

        // 1. Check for CVE-2024-4577 (soft hyphen '%ad' or PHP CGI flag injection)
        if (str_contains(strtolower($queryString), '%ad') || str_contains($rawUri, '%ad')) {
            return true;
        }

        $cvePatterns = [
            'auto_prepend_file',
            'auto_append_file',
            'allow_url_include',
            'allow_url_fopen',
            'disable_functions',
            'cgi-bin',
            'eval-stdin.php',
            '_ignition/execute-solution',
        ];

        foreach ($cvePatterns as $pattern) {
            if (stripos($decodedUri, $pattern) !== false || stripos($decodedQuery, $pattern) !== false) {
                return true;
            }
        }

        // 2. Check for PHP stream wrappers / direct execution exploits
        $streamWrappers = ['php://input', 'php://filter', 'data://text', 'expect://'];
        foreach ($streamWrappers as $wrapper) {
            if (stripos($decodedUri, $wrapper) !== false || stripos($decodedQuery, $wrapper) !== false) {
                return true;
            }
        }

        // 3. Check for path traversal attempts (../, ..\)
        if (
            str_contains($decodedUri, '../') ||
            str_contains($decodedUri, '..\\') ||
            str_contains($decodedQuery, '../') ||
            str_contains($decodedQuery, '..\\')
        ) {
            return true;
        }

        // 4. Check for direct probes targeting hidden sensitive files (.env, .git)
        $path = ltrim($request->path(), '/');
        if (
            str_starts_with($path, '.env') ||
            str_starts_with($path, '.git') ||
            str_contains($path, '/.env') ||
            str_contains($path, '/.git')
        ) {
            return true;
        }

        return false;
    }
}
