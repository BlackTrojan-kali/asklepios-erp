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
        Schema::create('stock_tranfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId("source_pharmacy_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("destination_pharmacy_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("driver_id")->constrained("drivers")->onDelete("cascade");
            $table->foreignId("vehicule_id")->constrained("vehicules")->onDelete("cascade");
            $table->enum("status",["INITIATED","CANCELLED","TERMINATED"]);
            $table->dateTime("shipped_at")->nullable();
            $table->dateTime("received_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_tranfers');
    }
};
