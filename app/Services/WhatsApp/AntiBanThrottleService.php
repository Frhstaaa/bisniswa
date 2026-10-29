<?php

namespace App\Services\WhatsApp;

class AntiBanThrottleService
{
    /**
     * Parse and randomize spintax patterns: {Halo|Hai|Selamat pagi}
     */
    public function resolveSpintax(string $text): string
    {
        return preg_replace_callback('/\{(((?>[^{}]+)|(?R))*)\}/x', function ($matches) {
            $parts = explode('|', $matches[1]);

            return $this->resolveSpintax($parts[array_rand($parts)]);
        }, $text);
    }

    /**
     * Calculate jitter delay between min and max seconds
     */
    public function calculateJitterDelay(int $minSeconds = 8, int $maxSeconds = 18): int
    {
        return random_int(max(1, $minSeconds), max($minSeconds, $maxSeconds));
    }

    /**
     * Replace dynamic contact placeholders like {{nama}}, {{nomor}}
     */
    public function replacePlaceholders(string $text, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $text = str_replace(["{{$key}}", "{{ $key }}"], (string) $value, $text);
        }

        return $text;
    }
}
