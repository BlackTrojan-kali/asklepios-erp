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
        Schema::create('medical_act_catalogs', function (Blueprint $table) {
            $table->id();
            $table->foreignId("hospital_id")->constrained("hospitals")->onDelete("cascade");
            $table->foreignId("department_id")->constrained("departments")->onDelete("cascade");
            $table->string("name");
            $table->float("base_price");
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_act_catalogs');
    }
};
