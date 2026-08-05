<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_admins', function (Blueprint $table) {
            // Utilisation du format JSON pour stocker des tableaux d'IDs (ex: [1, 2, 4])
            // Si la valeur est NULL, cela signifie "Accès à TOUS les sites de l'hôpital"
            $table->json("center_ids")->nullable()->comment("Liste des ID des centres autorisés");
            $table->json("pharmacy_branch_ids")->nullable()->comment("Liste des ID des pharmacies autorisées");
            $table->json("laboratory_ids")->nullable()->comment("Liste des ID des laboratoires autorisés");
            $table->json("accessible_licences")->nullable()->comment("Modules autorisés (ex: ['pharmacy', 'base_hospital'])");
        });
    }

    public function down(): void
    {
        Schema::table('profile_admins', function (Blueprint $table) {
            $table->dropColumn([
                'center_ids', 
                'pharmacy_branch_ids', 
                'laboratory_ids', 
                'accessible_licences'
            ]);
        });
    }
};