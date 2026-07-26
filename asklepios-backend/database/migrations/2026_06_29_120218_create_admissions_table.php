<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("patient_id")->constrained("patients")->onDelete("cascade");
            $table->foreignId("patient_visit_id")->nullable()->constrained("patient_visits")->onDelete("set null");
            $table->foreignId("profile_doctor_id")->nullable()->constrained("profile_doctors")->onDelete("set null"); // Médecin responsable
            $table->foreignId("bed_id")->constrained("beds")->onDelete("cascade");
            
            $table->text("reason_for_admission")->nullable();
            $table->text("discharge_notes")->nullable();
            
            $table->dateTime("admission_date");
            $table->dateTime("expected_discharge_date")->nullable();
            $table->dateTime("actual_discharge_date")->nullable();
            
            $table->enum("status", ["ADMITTED", "DISCHARGED"]);
            
            // --- COLONNES DE FACTURATION ---
            $table->boolean('is_billed')->default(false);
            $table->unsignedBigInteger('invoice_id')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admissions');
    }
};