<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId("patient_id")->constrained("patients")->onDelete("cascade");
            $table->foreignId("profile_doctor_id")->constrained("profile_doctors")->onDelete("cascade");
            // Correction : constrained et onDelete orthographiés correctement
            $table->foreignId("center_id")->constrained("centers")->onDelete("cascade");
            $table->dateTime("scheduled_datetime");
            $table->string("reason")->nullable();
            $table->enum("status", ["SCHEDULED", "CANCELLED", "ARRIVED"]);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};