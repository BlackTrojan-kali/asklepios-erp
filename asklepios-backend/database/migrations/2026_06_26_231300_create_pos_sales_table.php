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
        Schema::create('pos_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId("pharmacy_branch_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("cash_register_session_id")->constrained("cash_register_sessions")->onDelete("cascade");
            $table->string("customer_name")->default("Client Comptoire");
            $table->boolean("has_prescription")->default(false);
            $table->string("prescription_ref")->nullable();
            $table->decimal("total_amount", 15, 2);
            $table->string("payment_method")->default("CASH"); // CASH, MOBILE_MONEY, CARD
            $table->decimal("amount_received", 15, 2)->nullable();
            $table->decimal("change_due", 15, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_sales');
    }
};
