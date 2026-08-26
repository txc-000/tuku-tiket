<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->string('row_label');
            $table->unsignedInteger('seat_number');
            $table->string('status')->default('available'); // available | sold | booked | blocked | checked-in
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            $table->timestamps();

            $table->unique(['section_id', 'row_label', 'seat_number']);
            $table->index(['section_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};
