<?php

namespace Tests\Feature;

use App\Repositories\Contracts\DeviceRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use App\Services\AntiBanThrottleService;
use App\Services\AutoReplyService;
use App\Services\Billing\SubscriptionService;
use App\Services\PaymentService;
use App\Services\WhatsApp\MetaCloudApiService;
use App\Services\WhatsApp\WhatsAppGatewayService;
use Laravel\Octane\Contracts\OperationTerminated;
use Laravel\Octane\Events\RequestTerminated;
use Laravel\Octane\Listeners\CollectGarbage;
use Laravel\Octane\Listeners\FlushTemporaryContainerInstances;
use Laravel\Octane\Listeners\FlushUploadedFiles;
use Tests\TestCase;

class OctaneConfigurationTest extends TestCase
{
    public function test_octane_server_defaults_to_frankenphp(): void
    {
        $this->assertEquals('frankenphp', config('octane.server'));
    }

    public function test_octane_listeners_include_enterprise_memory_and_upload_flushing(): void
    {
        $requestTerminated = config('octane.listeners.'.RequestTerminated::class, []);
        $this->assertContains(FlushUploadedFiles::class, $requestTerminated, 'FlushUploadedFiles listener must be active to prevent disk bloat from media uploads');

        $operationTerminated = config('octane.listeners.'.OperationTerminated::class, []);
        $this->assertContains(CollectGarbage::class, $operationTerminated, 'CollectGarbage listener must be active to prevent worker memory leaks');
        $this->assertContains(FlushTemporaryContainerInstances::class, $operationTerminated);
    }

    public function test_octane_pre_warms_essential_domain_services_and_repositories(): void
    {
        $warm = config('octane.warm', []);

        $requiredServices = [
            WhatsAppGatewayService::class,
            MetaCloudApiService::class,
            AntiBanThrottleService::class,
            AutoReplyService::class,
            PaymentService::class,
            SubscriptionService::class,
            DeviceRepositoryInterface::class,
            MessageRepositoryInterface::class,
        ];

        foreach ($requiredServices as $service) {
            $this->assertContains($service, $warm, "Service {$service} should be pre-warmed for enterprise throughput");
        }
    }

    public function test_octane_worker_lifecycle_settings(): void
    {
        $this->assertEquals(1000, config('octane.max_requests'));
        $this->assertGreaterThanOrEqual(50, config('octane.garbage'));
        $this->assertGreaterThanOrEqual(30, config('octane.max_execution_time'));
    }

    public function test_caddyfile_and_frankenphp_worker_exist(): void
    {
        $this->assertFileExists(base_path('Caddyfile'));
        $this->assertFileExists(public_path('frankenphp-worker.php'));

        $caddyContent = file_get_contents(base_path('Caddyfile'));
        $this->assertStringContainsString('frankenphp', $caddyContent);
        $this->assertStringContainsString('max_size 100MB', $caddyContent);
        $this->assertStringContainsString('/build/*', $caddyContent);
    }
}
