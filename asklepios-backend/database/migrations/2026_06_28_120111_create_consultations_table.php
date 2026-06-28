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
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId("patient_visit_id")->constrained("patient_visits")->onDelete("cascade");
            $table->foreignId("profile_doctor_id")->constrained("profile_doctors")->onDelete("cascade");
            $table->text("chief_complaint")->nullable();
            $table->json("clinical_data")->nullable();
            $table->float("consultation_price")->default(0.0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
