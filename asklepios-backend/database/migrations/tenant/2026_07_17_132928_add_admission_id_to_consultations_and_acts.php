<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up()
{
    Schema::table('consultations', function (Blueprint $table) {
        $table->foreignId('admission_id')->nullable()->constrained('admissions')->nullOnDelete();
        $table->foreignId('patient_visit_id')->nullable()->change(); // Rend la visite optionnelle
    });

    Schema::table('performed_medical_acts', function (Blueprint $table) {
        $table->foreignId('admission_id')->nullable()->constrained('admissions')->nullOnDelete();
        $table->foreignId('patient_visit_id')->nullable()->change(); // Rend la visite optionnelle
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consultations_and_acts', function (Blueprint $table) {
            //
        });
    }
};
