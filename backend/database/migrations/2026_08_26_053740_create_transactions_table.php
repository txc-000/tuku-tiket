<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            // restrictOnDelete: no delete-event endpoint exists today, but financial
            // records shouldn't silently vanish if one is added later.
            $table->foreignId('event_id')->constrained()->restrictOnDelete();
            $table->string('customer_name')->nullable();
            $table->string('customer_email');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('payment_status')->default('pending'); // pending | paid
            $table->timestamps();

            $table->index('customer_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
