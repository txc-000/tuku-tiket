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
            $table->string('layout_type')->default('bowl'); // bowl | orchestra | grid

            // Layout geometry — previously hardcoded per section *name* in the frontend
            // (BookingPage.jsx's STAND_CONFIG), so any admin-created section that didn't
            // match one of four hardcoded names collided with every other unmatched
            // section at the same fallback position. Storing geometry as real data lets
            // any number of sections be positioned independently from the admin form.
            $table->integer('angle_start')->nullable(); // degrees, used by 'bowl'
            $table->integer('angle_end')->nullable();   // degrees, used by 'bowl'
            $table->unsignedInteger('radius_inner')->nullable(); // used by 'bowl'
            $table->unsignedInteger('radius_outer')->nullable(); // used by 'bowl'
            $table->integer('map_angle')->default(0);   // rotation offset, used by 'orchestra' | 'grid'
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
