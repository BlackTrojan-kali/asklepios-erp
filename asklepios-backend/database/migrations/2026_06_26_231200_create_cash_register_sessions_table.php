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
        Schema::create('cash_register_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("cash_register_id")->constrained("cash_registers")->onDelete("cascade");
            $table->foreignId("user_id")->constrained("users")->onDelete("cascade");
            $table->dateTime("opened_at");
            $table->dateTime("closed_at")->nullable();
            $table->decimal("opening_balance", 15, 2);
            $table->decimal("closing_balance", 15, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_register_sessions');
    }
};
