<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId("pharmacy_branch_id")->constrained("pharmacy_branches")->onDelete("cascade");
            $table->foreignId("batch_id")->constrained("batches")->onDelete("cascade"); // Correction ici (foreignId)
            $table->float("qty")->default(0.0); // Ajout d'une valeur par défaut pour plus de sécurité
            $table->timestamps();
            
            // Sécurité niveau base de données : Empêcher les doublons stricts
            $table->unique(['pharmacy_branch_id', 'batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};