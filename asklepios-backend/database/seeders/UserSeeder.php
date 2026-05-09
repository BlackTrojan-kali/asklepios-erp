<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. On récupère le rôle super_admin
        $superAdminRole = Role::where("name", "super_admin")->first();

        // On s'assure que le rôle existe bien `avant` de créer l'utilisateur
        if ($superAdminRole) {
            User::firstOrCreate(
                ['email' => 'admin@asklepios.com'], // On évite les doublons basés sur l'email
                [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                    'phone' => 237600000000, // Remplace par un format de numéro valide pour ton test
                    'password' => Hash::make('password123'), // Toujours hasher le mot de passe !
                    'role_id' => $superAdminRole->id, // On lie l'utilisateur à son rôle
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}