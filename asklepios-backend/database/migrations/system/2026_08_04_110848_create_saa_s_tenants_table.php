<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::connection('system')->create('saas_tenants', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // Ex: Hôpital La Quintinie
        $table->string('domain')->unique(); // Ex: la-quintinie
        
        // Infos de connexion à la base de cet hôpital
        $table->string('db_database'); 
        $table->string('db_host')->default('127.0.0.1');
        $table->string('db_username')->default('root');
        $table->string('db_password')->nullable();
        
        $table->enum('status', ['ACTIVE', 'SUSPENDED'])->default('ACTIVE');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saa_s_tenants');
    }
};
