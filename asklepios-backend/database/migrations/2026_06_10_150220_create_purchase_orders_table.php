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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->softDeletes();
            $table->foreignId("hospital_id")->constrained("hospitals")->onDelete("cascade");
            $table->foreignId("provider_id")->constrained("providers")->onDelete("cascade");
            $table->foreignId("destination_pharmacy_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("user_id")->constrained("users")->onDelete("cascade");//id de l'initiateur de la commande
            $table->enum("status",["PENDING","PARTIALLY_RECEIVED","RECEIVED","CANCELLED"]);
            $table->double("total_amount")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
