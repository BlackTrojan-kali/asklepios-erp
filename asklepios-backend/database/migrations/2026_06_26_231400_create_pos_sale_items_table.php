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
        Schema::create('pos_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId("pos_sale_id")->constrained("pos_sales")->onDelete("cascade");
            $table->foreignId("article_id")->constrained("articles")->onDelete("cascade");
            $table->foreignId("batch_id")->nullable()->constrained("batches")->onDelete("set null");
            $table->float("qty");
            $table->decimal("unit_price", 15, 2);
            $table->float("discount")->default(0.0); // discount in percentage
            $table->decimal("sub_total", 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_sale_items');
    }
};
