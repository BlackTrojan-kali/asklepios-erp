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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("pharmacy_branch_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("cash_register_session_id")->nullable()->constrained("cash_register_sessions")->onDelete("set null");
            $table->foreignId("source_account_id")->nullable()->constrained("payment_accounts")->onDelete("restrict");
            $table->foreignId("destination_account_id")->nullable()->constrained("payment_accounts")->onDelete("restrict");
            $table->decimal("amount", 15, 2);
            $table->enum("type", ['cash_in', 'cash_out', 'transfer']);
            $table->enum("payment_method", ['CASH', 'MOBILE_MONEY', 'CARD']);
            $table->enum("status", ['pending', 'completed', 'cancelled'])->default('completed');
            $table->string("reference")->nullable();
            $table->text("description")->nullable();
            $table->string("receipt_path")->nullable();
            $table->foreignId("user_id")->constrained("users")->onDelete("cascade");
            $table->foreignId("confirmed_by_id")->nullable()->constrained("users")->onDelete("set null");
            $table->dateTime("confirmed_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
