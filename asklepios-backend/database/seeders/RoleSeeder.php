<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role; // Assure-toi que le modèle Role existe

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin', 
                'permissions' => json_encode(['*']) // L'étoile signifie souvent "accès total"
            ],
            [
                'name' => 'admin', 
                'permissions' => json_encode(['manage_users', 'view_reports', 'manage_settings'])
            ],
            [
                'name' => 'doctor', 
                'permissions' => json_encode(['view_patients', 'create_prescriptions', 'view_medical_records'])
            ],
            [
                'name' => 'pharmacy', 
                'permissions' => json_encode(['manage_inventory', 'dispense_medication', 'view_prescriptions'])
            ],
            [
                'name' => 'reception', 
                'permissions' => json_encode(['register_patients', 'manage_appointments', 'manage_beds'])
            ],
            [
                'name' => 'laboratory', 
                'permissions' => json_encode(['view_test_requests', 'input_test_results', 'manage_lab_inventory'])
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']], // On vérifie si le nom du rôle existe déjà
                ['permissions' => $role['permissions']]
            );
        }
    }
}