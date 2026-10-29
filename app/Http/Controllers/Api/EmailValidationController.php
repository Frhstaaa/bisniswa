<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\ValidDeliverableEmailRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmailValidationController extends Controller
{
    /**
     * Real-time verification of email validity, format, deliverability, and domain status.
     */
    public function check(Request $request): JsonResponse
    {
        $email = strtolower(trim((string) $request->input('email', '')));

        if (empty($email)) {
            return response()->json([
                'valid' => false,
                'deliverable' => false,
                'message' => 'Alamat email belum diisi.',
            ], 422);
        }

        $validator = Validator::make(['email' => $email], [
            'email' => ['required', 'string', new ValidDeliverableEmailRule],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'valid' => false,
                'deliverable' => false,
                'message' => $validator->errors()->first('email'),
            ], 200);
        }

        $parts = explode('@', $email);
        $domain = $parts[1] ?? '';

        $isRegistered = User::where('email', $email)->exists();

        return response()->json([
            'valid' => true,
            'deliverable' => true,
            'domain' => $domain,
            'is_registered' => $isRegistered,
            'message' => 'Domain email terverifikasi dan aktif.',
        ]);
    }
}
