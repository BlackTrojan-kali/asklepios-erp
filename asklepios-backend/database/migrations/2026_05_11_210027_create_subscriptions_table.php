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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("licence_id")->constrained("licences")->onDelete("cascade");
            $table->foreignId("country_id")->constrained("countries")->onDelete("cascade");
            $table->foreignId("hospital_id")->constrained("hospitals")->onDelete("cascade");
            $table->dateTime("strating_date");
            $table->dateTime("ending_date");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
