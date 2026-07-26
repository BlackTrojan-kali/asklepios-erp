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
        Schema::create('invoice_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId("invoice_id")->constrained("invoices")->onDelete("cascade");
            $table->enum("type",["PATIENT","INSURANCE"]);
            $table->foreignId("guarantor_claim_id")->nullable()->constrained("guarantor_claims")->onDelete("cascade");
            $table->float("amount_to_pay");
            $table->enum("status",["PAID","UNPAID"]);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_splits');
    }
};
