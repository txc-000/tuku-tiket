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

            // Seat map is a straight cinema-style grid, selected one section at a
            // time (like XXI) — no per-section angle/radius positioning needed.
            // An earlier version tried to place every section on one shared
            // curved stadium bowl (angle_start/angle_end/radius_inner/radius_outer),
            // but that math made rows overlap or fan out unevenly whenever a
            // section didn't fit the assumptions (too many rows for its radius
            // range, etc.) — a straight grid can't have that problem structurally.
            $table->string('color')->default('#2563eb'); // hex, applied via inline style (not a Tailwind class)

            $table->text('view_image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
