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
        Schema::create('exam_request_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId("exam_request_id")->constrained("exam_requests")->onDelete("cascade");
            $table->string("exam_name");
            $table->string("result_notes")->nullable();
            $table->string("document_url")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_request_lines');
    }
};
