<?php
namespace App\Listeners;

use Illuminate\Support\Facades\DB;

class PurgeTenantConnection
{
    public function handle($event): void
    {
        DB::purge('tenant');
        DB::setDefaultConnection('system');
    }
}