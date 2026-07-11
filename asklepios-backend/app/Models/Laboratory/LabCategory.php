<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Center;

class LabCategory extends Model
{
    use HasFactory;

    protected $fillable = ['center_id', 'name'];

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function tests()
    {
        return $this->hasMany(LabTest::class);
    }
}
