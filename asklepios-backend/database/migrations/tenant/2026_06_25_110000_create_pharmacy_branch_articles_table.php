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
        Schema::create('pharmacy_branch_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId("pharmacy_branch_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("article_id")->constrained("articles")->onDelete("cascade");
            $table->float("special_selling_price")->nullable();
            $table->foreignId("default_storage_location_id")->nullable()->constrained("storage_locations")->onDelete("set null");
            $table->boolean("is_active")->default(true);
            $table->timestamps();

            // Clé unique pour empêcher les doublons de configuration d'un même article dans une succursale donnée
            $table->unique(['pharmacy_branch_id', 'article_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacy_branch_articles');
    }
};
