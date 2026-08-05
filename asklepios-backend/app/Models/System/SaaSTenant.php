<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class SaaSTenant extends Model
{
    // Ce modèle pointe TOUJOURS vers la base centrale (licences)
    protected $connection = 'system';
    protected $table = 'saas_tenants';
    protected $guarded = [];
}