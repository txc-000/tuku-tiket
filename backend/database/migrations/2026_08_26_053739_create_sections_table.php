<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('floor_name')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('row_count');
            $table->unsignedInteger('col_count');

            // Seat map itself is a straight cinema-style grid, selected one section
            // at a time (like XXI) — no per-seat angle/radius positioning. An
            // earlier version tried to place every seat on one shared curved
            // stadium bowl, but that math made rows overlap or fan out unevenly
            // whenever a section didn't fit its assumptions — a straight grid
            // can't have that problem structurally.
            $table->string('color')->default('#2563eb'); // hex, applied via inline style (not a Tailwind class)

            // Where this section's zone sits on the venue overview map (the
            // picker shown before the seat grid) — a clock position (1-12,
            // like "10 o'clock from the pitch") plus near/far ring. This is
            // deliberately coarse (click a spot, not type numbers) and only
            // affects the overview zone layout, never individual seats, so it
            // can't reintroduce the old overlap bug.
            $table->unsignedTinyInteger('clock_position')->default(12); // 1-12
            $table->string('ring')->default('inner'); // inner | outer

            $table->text('view_image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
