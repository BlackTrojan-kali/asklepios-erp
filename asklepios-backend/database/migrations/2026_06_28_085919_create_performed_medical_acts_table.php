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
        Schema::create('performed_medical_acts', function (Blueprint $table) {
            $table->id();
            $table->foreignId("patient_visit_id")->constrained("patient_visits")->onDelete("cascade");
            $table->foreignId("medical_act_catalog_id")->constrained("medical_act_catalogs")->onDelete("cascade");
            $table->foreignId("equipment_id")->nullable()->constrained("equipments");
            $table->float("applied_price")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performed_medical_acts');
    }
};
