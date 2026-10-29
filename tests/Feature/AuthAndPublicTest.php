<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\ApiKey;
use App\Models\Device;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthAndPublicTest extends TestCase
{
    use RefreshDatabase;

    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->plan = Plan::create([
            'name' => 'Enterprise Pro',
            'slug' => 'enterprise-pro',
            'price_monthly' => 299000,
            'price_annually' => 2890000,
            'limits' => [
                'max_devices' => 5,
                'monthly_message_quota' => 50000,
            ],
            'features' => ['webhook_access' => true],
        ]);
    }

    public function test_public_landing_page_renders_successfully(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_login_page_renders_successfully(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_register_page_renders_successfully(): void
    {
        $response = $this->get('/register');
        $response->assertStatus(200);
    }

    public function test_user_can_register_and_automatically_receives_subscription_and_api_key(): void
    {
        $response = $this->post('/register', [
            'name' => 'Ahmad Fauzi',
            'email' => 'ahmad@suksesmandiri.com',
            'phone' => '+6281234567890',
            'workspace_name' => 'Sukses Mandiri Digital',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'plan_id' => $this->plan->id,
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        // Verify Workspace was created
        $workspace = Workspace::where('name', 'Sukses Mandiri Digital')->first();
        $this->assertNotNull($workspace);

        // Verify Subscription was created with chosen plan
        $subscription = Subscription::where('workspace_id', $workspace->id)->first();
        $this->assertNotNull($subscription);
        $this->assertEquals($this->plan->id, $subscription->plan_id);
        $this->assertEquals(50000, $subscription->monthly_message_quota);

        // Verify API Key was automatically generated for client app integration
        $apiKey = ApiKey::where('workspace_id', $workspace->id)->first();
        $this->assertNotNull($apiKey);
        $this->assertStringStartsWith('bk_live_', $apiKey->prefix);
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => 'user@example.com',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_unauthenticated_user_cannot_access_tenant_routes_and_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/devices')->assertRedirect('/login');
        $this->get('/broadcast')->assertRedirect('/login');
        $this->get('/contacts')->assertRedirect('/login');
        $this->get('/inbox')->assertRedirect('/login');
        $this->get('/auto-reply')->assertRedirect('/login');
        $this->get('/subscriptions')->assertRedirect('/login');
        $this->get('/api-access')->assertRedirect('/login');
        $this->get('/profile')->assertRedirect('/login');
    }

    public function test_newly_registered_user_sees_their_own_workspace_and_isolated_data(): void
    {
        // 1. Create a pre-existing workspace with devices to prove isolation
        $otherWorkspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Perusahaan Lain',
            'slug' => 'pt-perusahaan-lain',
            'phone' => '+628111111111',
            'is_active' => true,
        ]);
        Device::create([
            'workspace_id' => $otherWorkspace->id,
            'name' => 'Device Milik Perusahaan Lain',
            'engine' => 'wwebjs',
            'status' => 'connected',
        ]);

        // 2. Register new user
        $response = $this->post('/register', [
            'name' => 'Budi Santoso',
            'email' => 'budi@tokobudi.com',
            'phone' => '+628999888777',
            'workspace_name' => 'Toko Budi Sukses',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'plan_id' => $this->plan->id,
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $budiWorkspace = Workspace::where('name', 'Toko Budi Sukses')->first();
        $this->assertNotNull($budiWorkspace);
        $this->assertNotEquals($otherWorkspace->id, $budiWorkspace->id);

        // 3. Check dashboard returns Budi's workspace, not other workspace
        $dashboardRes = $this->get('/dashboard');
        $dashboardRes->assertStatus(200);
        $dashboardRes->assertInertia(fn ($page) => $page->where('workspace.id', $budiWorkspace->id)
            ->where('workspace.name', 'Toko Budi Sukses')
            ->has('devices', 0)
        );

        // 4. Check devices page returns Budi's isolated devices
        $devicesRes = $this->get('/devices');
        $devicesRes->assertStatus(200);
        $devicesRes->assertInertia(fn ($page) => $page->where('workspace.id', $budiWorkspace->id)
            ->has('devices', 0)
        );
    }

    public function test_forgot_password_page_renders_successfully(): void
    {
        $response = $this->get('/forgot-password');
        $response->assertStatus(200);
    }

    public function test_user_can_request_password_reset_link_and_receives_email(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'dosen@mardira.ac.id',
            'name' => 'Dr. Hendra Wijaya',
        ]);

        $response = $this->post('/forgot-password', [
            'email' => 'dosen@mardira.ac.id',
        ]);

        $response->assertSessionHas('status');
        $response->assertSessionHas('preview_url');

        // Assert record exists in database
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'dosen@mardira.ac.id',
        ]);

        // Assert email was queued/sent
        Mail::assertSent(ResetPasswordMail::class, function (ResetPasswordMail $mail) {
            return $mail->hasTo('dosen@mardira.ac.id') &&
                str_contains($mail->resetUrl, 'reset-password') &&
                $mail->userName === 'Dr. Hendra Wijaya';
        });
    }

    public function test_inertia_middleware_shares_preview_url_and_status_in_flash_props(): void
    {
        $user = User::factory()->create([
            'email' => 'staff@mardira.ac.id',
            'name' => 'Staff IT',
        ]);

        $response = $this->from('/forgot-password')->post('/forgot-password', [
            'email' => 'staff@mardira.ac.id',
        ]);

        $response->assertRedirect('/forgot-password');
        $response->assertSessionHas('preview_url');
        $response->assertSessionHas('status');

        // Follow redirect and assert Inertia receives shared flash props
        $followResponse = $this->get('/forgot-password');
        $followResponse->assertStatus(200);
        $followResponse->assertInertia(fn ($page) => $page
            ->has('flash.status')
            ->has('flash.preview_url')
        );
    }

    public function test_user_can_successfully_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'mahasiswa@mardira.ac.id',
            'password' => Hash::make('old_password_123'),
        ]);

        $rawToken = Str::random(64);
        DB::table('password_reset_tokens')->insert([
            'email' => 'mahasiswa@mardira.ac.id',
            'token' => Hash::make($rawToken),
            'created_at' => now(),
        ]);

        // 1. Reset page renders
        $this->get("/reset-password/{$rawToken}?email=mahasiswa@mardira.ac.id")
            ->assertStatus(200);

        // 2. Submit new password
        $response = $this->post('/reset-password', [
            'token' => $rawToken,
            'email' => 'mahasiswa@mardira.ac.id',
            'password' => 'new_secure_password_999',
            'password_confirmation' => 'new_secure_password_999',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHas('success');

        // Verify password updated
        $this->assertTrue(Hash::check('new_secure_password_999', $user->fresh()->password));

        // Verify token deleted
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'mahasiswa@mardira.ac.id',
        ]);
    }

    public function test_registration_rejects_disposable_email_domain(): void
    {
        $response = $this->post('/register', [
            'name' => 'Penipu Hacker',
            'email' => 'spammer@mailinator.com',
            'phone' => '+628999999999',
            'workspace_name' => 'Fake Workspace',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'plan_id' => $this->plan->id,
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertDatabaseMissing('users', ['email' => 'spammer@mailinator.com']);
    }

    public function test_api_check_email_validates_email_format_and_domain(): void
    {
        // 1. Valid email
        $resValid = $this->postJson('/api/check-email', [
            'email' => 'official@mardira.ac.id',
        ]);
        $resValid->assertStatus(200);
        $resValid->assertJson([
            'valid' => true,
            'deliverable' => true,
            'domain' => 'mardira.ac.id',
        ]);

        // 2. Disposable email
        $resDisposable = $this->postJson('/api/check-email', [
            'email' => 'tester@tempmail.com',
        ]);
        $resDisposable->assertStatus(200);
        $resDisposable->assertJson([
            'valid' => false,
            'deliverable' => false,
        ]);

        // 3. Malformed email
        $resMalformed = $this->postJson('/api/check-email', [
            'email' => 'not-an-email',
        ]);
        $resMalformed->assertStatus(200);
        $resMalformed->assertJson([
            'valid' => false,
        ]);
    }
}
