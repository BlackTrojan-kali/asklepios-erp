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
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();
            $table->softDeletes();
            $table->foreignId("hospital_id")->constrained("hospitals")->onDelete("cascade");
            $table->foreignId("provider_id")->constrained("providers")->onDelete("cascade");
            // Remplacez "phramacy_branches" par "pharmacy_branches"
            $table->foreignId("source_pharmacy_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("purchase_order_id")->constrained("purchase_orders")->onDelete("cascade");
            $table->date("return_date");
            $table->enum("status",["PENDING","SHIPPED","CREDITED"]);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};
