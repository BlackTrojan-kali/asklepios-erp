<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Center;

class LabCategory extends Model
{
    use HasFactory;

    protected $fillable = ['hospital_id', 'name'];

    public function hospital()
    {
        return $this->belongsTo(\App\Models\Hospital::class);
    }

    public function tests()
    {
        return $this->hasMany(LabTest::class);
    }
}
