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
        Schema::create('article_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId("hospital_id")->constrained("hospitals")->onDelete("cascade");
            $table->foreignId("article_category_id")->nullable()->constrained("article_categories")->onDelete("cascade");
            $table->string("name");
            $table->string("description")->nullable();
            $table->timestamps();
            $table->unique(['hospital_id', 'name'], 'unique_category_per_hospital');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('article_categories');
    }
};
