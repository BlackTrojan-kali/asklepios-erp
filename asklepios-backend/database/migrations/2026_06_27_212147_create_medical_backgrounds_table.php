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
        Schema::create('medical_backgrounds', function (Blueprint $table) {
            $table->id();
            
            // Relation 1:1 avec le patient
            $table->foreignId("patient_id")->unique()->constrained("patients")->onDelete("cascade");
            
            // Constantes physiologiques de base
            $table->enum("blood_type", [
                'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'
            ])->nullable()->default('UNKNOWN');
            
            // Historique médical structuré (JSON)
            $table->json("allergies")->nullable();          // Ex: ["Pénicilline", "Arachides"]
            $table->json("chronic_conditions")->nullable(); // Ex: ["Diabète type 2", "Hypertension"]
            $table->json("past_surgeries")->nullable();     // Ex: [{"name": "Appendicectomie", "year": 2015}]
            $table->json("current_medications")->nullable();// Ex: ["Metformine 500mg"]
            $table->json("immunizations")->nullable();      // Ex: ["Covid-19", "Fièvre Jaune"]
            
            // Historique textuel (plus libre pour le médecin)
            $table->text("family_history")->nullable();     // Antécédents familiaux
            $table->text("lifestyle_habits")->nullable();   // Tabac, alcool, sport, etc.
            
            // Notes générales du médecin sur les antécédents
            $table->text("general_notes")->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_backgrounds');
    }
};