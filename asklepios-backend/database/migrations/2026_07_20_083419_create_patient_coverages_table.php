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
        Schema::create('patient_coverages', function (Blueprint $table) {
            $table->id();
            $table->foreignId("patient_id")->constrained("patients")->onDelete("cascade");
            $table->foreignId("insurance_company_id")->constrained("insurance_companies")->onDelete("cascade");
            $table->date("valid_until");
            $table->boolean("is_active");
            $table->string("policy_number");//matricule assure ou numero de police
            $table->float("coverage_rate");
            $table->integer("priority_order")->default(1); //1 pour principale 2 pour complementaire si j'ai plusieurs assurances
            $table->json("coverage_scope");//["consultation","pharmacy","lab"]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_coverages');
    }
};
