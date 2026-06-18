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
        Schema::create('inventory_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId("inventory_id")->constrained("inventories")->onDelete("cascade");
            $table->foreignId("pharmacy_branch_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("storage_location_id")->nullable()->constrained();
            // Ajoute cette ligne dans la migration de inventory_lines
            $table->foreignId("batch_id")->constrained("batches")->onDelete("cascade");
            $table->float("system_qty");
            $table->float("physical_qty");
            $table->float("descrepency");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_lines');
    }
};
