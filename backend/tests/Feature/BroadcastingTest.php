<?php

namespace Tests\Feature;

use App\Events\SeatStatusUpdated;
use App\Events\TransactionUpdated;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use ReflectionClass;
use Tests\TestCase;

class BroadcastingTest extends TestCase
{
    /**
     * Regression test: these events must broadcast synchronously
     * (ShouldBroadcastNow), not via ShouldBroadcast. This app has no queue
     * worker running by design (see the class doc comments on both events),
     * so a plain ShouldBroadcast event silently queues forever and no seat
     * update ever reaches a connected browser — confirmed by hand with a live
     * Reverb server before this fix: a curl booking against a running app
     * left the browser's seat map unchanged with no error anywhere.
     */
    public function test_seat_status_updated_broadcasts_synchronously(): void
    {
        $this->assertInstanceOf(ShouldBroadcastNow::class, $this->uninitialized(SeatStatusUpdated::class));
    }

    public function test_transaction_updated_broadcasts_synchronously(): void
    {
        $this->assertInstanceOf(ShouldBroadcastNow::class, $this->uninitialized(TransactionUpdated::class));
    }

    /**
     * Builds an instance without needing a real model — we only care about
     * the interface it implements, not the constructor args here.
     */
    private function uninitialized(string $class): object
    {
        return (new ReflectionClass($class))->newInstanceWithoutConstructor();
    }
}
