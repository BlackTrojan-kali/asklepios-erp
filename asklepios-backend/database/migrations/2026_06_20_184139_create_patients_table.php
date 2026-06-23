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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId("hospital_id")->constrained("hospitals")->onDelete("cascade");
            $table->softDeletes(); // <-- À ajouter si ce n'est pas encore fait
            $table->string("patient_code");
            $table->string("first_name");
            $table->string("last_name")->nullable();
            $table->date("bith_date");
            $table->string("contact_phone");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
