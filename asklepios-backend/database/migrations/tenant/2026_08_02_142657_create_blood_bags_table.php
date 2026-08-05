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
        Schema::create('blood_bags', function (Blueprint $table) {
            $table->id();
            $table->foreignId("center_id")->constrained("centers")->onDelete("cascade");
            $table->foreignId("blood_refrigerator_id")->constrained("blood_refrigerators")->onDelete("cascade");
            $table->foreignId("blood_donor_id")->nullable()->constrained("blood_donors")->onDelete("cascade");
            $table->string("blood_type");
            $table->integer("volume_ml");
            $table->date("collection_date");
            $table->date("expiry_date");
            $table->string("external_supplier")->nullable();
            $table->enum("type",["WHOLE_BLOOD","RED_CELLS","PLASMA"]);
            $table->string("barcode")->nullable();
            $table->enum("status",["QUARANTINE","AVAILABLE","USED","EXPIRED"]);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blood_bags');
    }
};
