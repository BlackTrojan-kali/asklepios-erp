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
            $table->foreignId("storage_location_id")->nullable()->constrained();
            $table->float("qty")->default(0.0);
            $table->enum("reference_type",["PURCHASE","RETURN","TRANSFER","INVENTORY","SALE","OTHER"]);
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->enum("type",["ENTRY","EXIT"]);
            $table->float("qty_in_stock")->default(0.0);
            $table->string("comment")->nullable();
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
