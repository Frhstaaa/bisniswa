<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminClientController extends Controller
{
    public function __construct(
        protected ClientRepositoryInterface $clientRepo
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $clients = $this->clientRepo->getAllWithStats(15, $search, $status);

        return Inertia::render('Admin/Clients/Index', [
            'clients' => $clients,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'totalClients' => $this->clientRepo->getTotalCount(),
            'activeClients' => $this->clientRepo->getActiveCount(),
        ]);
    }

    public function toggleStatus(int $id): RedirectResponse
    {
        $workspace = Workspace::findOrFail($id);
        $this->clientRepo->toggleWorkspaceStatus($workspace);

        $action = $workspace->is_active ? 'dinonaktifkan (suspended)' : 'diaktifkan kembali';

        return back()->with('success', "Workspace {$workspace->name} berhasil {$action}.");
    }

    public function show(int $id): Response
    {
        $workspace = $this->clientRepo->findById($id);

        if (! $workspace) {
            abort(404, 'Workspace klien tidak ditemukan.');
        }

        return Inertia::render('Admin/Clients/Show', [
            'client' => $workspace,
        ]);
    }
}
