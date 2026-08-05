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
        Schema::table('pos_sales', function (Blueprint $table) {
            $table->foreignId("payment_account_id")->nullable()->after('cash_register_session_id')->constrained("payment_accounts")->onDelete("restrict");
        });

        Schema::table('cash_registers', function (Blueprint $table) {
            $table->string("merchant_code")->nullable()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pos_sales', function (Blueprint $table) {
            $table->dropForeign(['payment_account_id']);
            $table->dropColumn('payment_account_id');
        });

        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropColumn('merchant_code');
        });
    }
};
