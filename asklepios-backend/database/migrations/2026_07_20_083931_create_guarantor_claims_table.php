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
        Schema::create('guarantor_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId("center_id")->constrained("centers")->onDelete("cascade");
            $table->foreignId("insurance_company_id")->constrained("insurance_companies")->onDelete("cascade");
            $table->date("claim_month");
            $table->float("total_claim_amount");
            $table->enum("status",["DRAFT","SUBMITTED","PAID","DISPUTED"]);
            $table->string("claim_refence")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guarantor_claims');
    }
};
