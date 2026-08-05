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
        Schema::create('blood_transfusions', function (Blueprint $table) {
            $table->id();
            $table->foreignId("consultation_id")->constrained("consultations")->onDelete("cascade");
            $table->foreignId("center_id")->constrained("centers")->onDelete("cascade");
            $table->foreignId("blood_bag_id")->constrained("blood_bags")->onDelete("cascade");
            $table->dateTime("start_time");
            $table->dateTime("end_time")->nullable();
            $table->enum("status",["ON_GOING","FINISHED"]);
            $table->boolean("is_billed")->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blood_transfusions');
    }
};
