<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

       $this->call([
            HospitalSeeder::class,
            CountrySeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            LicenceSeeder::class,
    
            // Tu pourras ajouter tes futurs seeders ici (UserSeeder, DepartmentSeeder, etc.)
        ]);
    }
}
