<?php

namespace App\Traits;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait HasWorkspaceContext
{
    /**
     * Resolve the current tenant workspace strictly isolated for the authenticated user.
     * Prevents cross-tenant data collisions or accidental workspace sharing.
     */
    protected function getWorkspace(Request $request): Workspace
    {
        $user = $request->user();

        if ($user instanceof User) {
            if ($user->workspace_id && $user->workspace) {
                return $user->workspace;
            }

            // If user has no workspace assigned, create a dedicated isolated workspace
            $baseSlug = Str::slug($user->name ?: 'tenant');
            if (empty($baseSlug)) {
                $baseSlug = 'tenant-'.$user->id;
            }
            $slug = $baseSlug.'-'.strtolower(Str::random(6));

            $workspace = Workspace::create([
                'uuid' => (string) Str::uuid(),
                'name' => ($user->name ?: 'Tenant').' Workspace',
                'slug' => $slug,
                'phone' => $user->phone ?: '+62812'.rand(10000000, 99999999),
                'is_active' => true,
            ]);

            $user->update(['workspace_id' => $workspace->id]);
            $user->setRelation('workspace', $workspace);

            return $workspace;
        }

        return Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'PT Digital Sukses Mandiri',
                'phone' => '+6281298430911',
                'is_active' => true,
            ]
        );
    }
}
