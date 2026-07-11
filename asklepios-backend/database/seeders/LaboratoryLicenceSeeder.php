<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Licence;

class LaboratoryLicenceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Licence::firstOrCreate(
            ['name' => 'laboratory'],
            ['description' => 'Licence pour le module Laboratoire (SIL)']
        );
    }
}
