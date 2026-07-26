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
        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_request_line_id')->constrained('lab_request_lines')->onDelete('cascade');
            $table->foreignId('lab_parameter_id')->constrained('lab_parameters')->onDelete('cascade');
            $table->foreignId('lab_sample_id')->nullable()->constrained('lab_samples')->onDelete('set null');
            $table->float('value_numeric')->nullable();
            $table->string('value_string')->nullable();
            $table->text('value_text')->nullable();
            $table->string('file_path')->nullable();
            $table->boolean('is_abnormal')->default(false);
            $table->enum('status', ['DRAFT', 'VALIDATED'])->default('DRAFT');
            $table->dateTime('validated_at')->nullable();
            $table->foreignId('technician_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('validator_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_results');
    }
};
