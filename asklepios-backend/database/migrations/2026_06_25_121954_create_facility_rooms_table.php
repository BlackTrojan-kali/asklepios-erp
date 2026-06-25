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
        Schema::create('facility_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId("departement_id")->constrained("departments")->onDelete("cascade");
            $table->foreignId("room_category_id")->nullable()->constrained("room_categories");
            $table->string("name");
            $table->enum("type",["WAITING_ROOM","CONSULTATION","WARD"]);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facility_rooms');
    }
};
