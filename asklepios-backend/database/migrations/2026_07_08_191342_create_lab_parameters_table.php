<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lab_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_test_id')->constrained('lab_tests')->onDelete('cascade');
            $table->string('name');
            $table->string('unit');
            $table->float('reference_min_male')->nullable();
            $table->float('reference_max_male')->nullable();
            $table->float('reference_min_female')->nullable();
            $table->float('reference_max_female')->nullable();
            $table->string('reference_text')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_parameters');
    }
};
