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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId("patient_id")->constrained("patients")->onDelete("cascade");
            $table->foreignId("center_id")->nullable()->constrained("centers")->onDelete("cascade");
            $table->foreignId("patient_visit_id")->nullable()->constrained("patient_visits");
            $table->float("total_amount");
            $table->enum("status",["UNPAID","PAID"]);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
