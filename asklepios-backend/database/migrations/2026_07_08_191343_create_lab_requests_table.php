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
        Schema::create('lab_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('center_id')->constrained('centers')->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->onDelete('set null');
            $table->foreignId('patient_visit_id')->nullable()->constrained('patient_visits')->onDelete('set null');
            $table->foreignId('profile_doctor_id')->nullable()->constrained('profile_doctors')->onDelete('set null');
            $table->string('external_prescriber_name')->nullable();
            $table->enum('priority', ['ROUTINE', 'URGENT'])->default('ROUTINE');
            $table->enum('status', ['PENDING_PAYMENT', 'PAID', 'SAMPLED', 'PARTIAL', 'COMPLETED'])->default('PENDING_PAYMENT');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_requests');
    }
};
