<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId("patient_id")->constrained("patients")->onDelete("cascade");
            // Correction : foreignId au lieu de foreign
            $table->foreignId("center_id")->constrained("centers")->onDelete("cascade");
            $table->foreignId("profile_reception_id")->constrained("profile_receptions")->onDelete("cascade");
            
            // Nullable car une urgence (EMERGENCY) ou un walk-in n'a pas de rendez-vous
            $table->foreignId("appointment_id")->nullable()->constrained("appointments")->onDelete("set null");
            
            // Les salles doivent pointer vers facility_rooms. "set null" empêche d'effacer l'historique médical si on supprime une salle
            $table->foreignId("waiting_room_id")->nullable()->constrained("facility_rooms")->onDelete("set null");
            $table->foreignId("consulting_room_id")->nullable()->constrained("facility_rooms")->onDelete("set null");
            
            $table->dateTime("arrival_time")->nullable();
            $table->integer("queue_number")->nullable();
            $table->enum("status", ["IN_WAITING_ROOM", "IN_CONSULTATION", "COMPLETE"]);
            $table->enum("visit_type", ["ROUTINE", "EMERGENCY", "FOLLOW_UP"]);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_visits');
    }
};