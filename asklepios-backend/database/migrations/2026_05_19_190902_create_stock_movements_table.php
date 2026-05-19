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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->softDeletes();
            $table->foreignId("pharmacy_branch_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("batch_id")->constrained("batches")->onDelete("cascade");
            $table->float("qty");
            $table->enum("reference_type",["PURCHASE_IN","SALE_OUT","TRANSFER_OUT","TRANFER_IN","LOSS"]);
            $table->unsignedBigInteger("reference_id")->nullable();
            $table->enum("type",["STOCK_IN","STOCK_OUT"]);
            $table->string("label")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
