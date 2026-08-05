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
        Schema::table('lab_request_lines', function (Blueprint $table) {
            $table->boolean('is_paid')->default(false)->after('lab_test_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_request_lines', function (Blueprint $table) {
            $table->dropColumn('is_paid');
        });
    }
};
