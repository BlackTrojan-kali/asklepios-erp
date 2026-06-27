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
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId("hospital_id")->constrained("hospitals")->onDelete("cascade");
            $table->foreignId("category_id")->constrained("article_categories")->onDelete("cascade");
            $table->string("name");   
            $table->float("default_selling_price")->default(0.0);          
            $table->string("barcode")->nullable();
            $table->float("global_min_qty")->default(0.0);
            $table->string("image_url")->nullable();
            $table->boolean("track_batches");
            $table->boolean("is_prescripted")->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
