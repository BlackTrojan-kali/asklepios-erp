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
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId("department_id")->constrained("departments")->onDelete("cascade");
            $table->foreignId("facility_room_id")->nullable()->constrained("facility_rooms")->nullOnDelete(); // Où est-il physiquement ?
            
            // Informations générales
            $table->string("name"); // Ex: Dialyseur, Echographe
            $table->string("manufacturer")->nullable(); // Ex: Siemens, Philips
            $table->string("model_number")->nullable();
            $table->string("serial_number")->unique()->nullable(); // Numéro de série (important pour le suivi)
            
            // Statut de la machine
            $table->enum("status", [
                'ACTIVE',           // Prêt à l'emploi
                'IN_USE',           // Actuellement utilisé (optionnel, pour les machines très demandées)
                'IN_MAINTENANCE',   // En révision
                'OUT_OF_SERVICE',   // En panne / Hors service
                'RETIRED'           // Appareil réformé/jeté
            ])->default('ACTIVE');
            
            // Suivi des maintenances
            $table->date("last_maintenance_date")->nullable();
            $table->date("next_maintenance_date")->nullable(); // Pour déclencher des alertes
            
            // Informations financières / Achats
            $table->date("purchase_date")->nullable();
            $table->date("warranty_expiry_date")->nullable();
            
            // Notes supplémentaires
            $table->text("notes")->nullable();

            $table->timestamps();
            $table->softDeletes(); // Pour garder l'historique même si l'appareil est jeté
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};