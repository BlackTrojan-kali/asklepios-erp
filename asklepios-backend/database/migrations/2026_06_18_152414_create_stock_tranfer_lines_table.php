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
        Schema::create('stock_tranfer_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId("stock_transfer_id")->constrained("stock_tranfers")->onDelete("cascade");
            $table->foreignId("batch_id")->constrained("batches")->onDelete("cascade");
            $table->float("qty_requested")->nullable();
            $table->float("qty_shipped")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_tranfer_lines');
    }
};
