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
        Schema::create('payment_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId("pharmacy_branch_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->string("name");
            $table->enum("type", ['bank', 'mobile_money', 'safe', 'cash_register', 'owner']);
            $table->string("account_number")->nullable();
            $table->decimal("balance", 15, 2)->default(0.00);
            $table->enum("status", ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_accounts');
    }
};
