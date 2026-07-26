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
        Schema::table('cash_register_sessions', function (Blueprint $table) {
            $table->decimal("closing_mobile_money", 15, 2)->nullable()->default(0.00)->after('closing_balance');
            $table->decimal("closing_card", 15, 2)->nullable()->default(0.00)->after('closing_mobile_money');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_register_sessions', function (Blueprint $table) {
            $table->dropColumn(['closing_mobile_money', 'closing_card']);
        });
    }
};
