<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\System\SaaSTenant;

class SystemDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        SaaSTenant::firstOrCreate(
            ['domain' => 'localhost'],
            [
                'name' => 'Hôpital Général (Local)',
                'db_database' => 'asklepios_dev_tenant',
                'db_host' => '127.0.0.1',
                'db_username' => 'root',
                'db_password' => '',
                'status' => 'ACTIVE'
            ]
        );

        $this->command->info('Licence locale (localhost) générée dans la base Système !');
    }
}