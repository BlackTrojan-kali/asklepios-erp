<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
Schedule::command('appointments:cancel-missed')->hourly();
// Vérifie et clôture les transfusions toutes les heures
Schedule::command('hospital:finish-transfusions')->hourly();