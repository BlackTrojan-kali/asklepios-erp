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
        Schema::create('blood_donors', function (Blueprint $table) {
            $table->id();
            $table->foreignId("center_id")->constrained("centers")->onDelete("cascade");
            $table->string("first_name");
            $table->string("last_name")->nullable();
            $table->enum("gender",["M","F"]);
            $table->date("birth_date");
            $table->string("blood_type");
            $table->string("phone_contact");
            $table->date("last_donation_date")->nullable();
            $table->enum("serology_status",["PENDING","CLEARED","REJECTED"]);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blood_donors');
    }
};
