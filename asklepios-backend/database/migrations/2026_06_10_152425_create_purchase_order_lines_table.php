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
        Schema::create('purchase_order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId("purchase_order_id")->constrained("purchase_orders")->onDelete("cascade");
            $table->foreignId("article_id")->constrained("articles")->onDelete("cascade");
            $table->float("qty_ordered")->default(0.0);
            $table->float("qty_received")->default(0.0);
            $table->float("unit_cost")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order_lines');
    }
};
