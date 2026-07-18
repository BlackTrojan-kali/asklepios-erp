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
            $table->foreignId('exam_request_line_id')->nullable()->constrained('exam_request_lines')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_request_lines', function (Blueprint $table) {
            $table->dropForeign(['exam_request_line_id']);
            $table->dropColumn('exam_request_line_id');
        });
    }
};
