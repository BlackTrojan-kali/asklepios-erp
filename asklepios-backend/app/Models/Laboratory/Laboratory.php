<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Hospital;
use App\Models\Center;
use App\Models\ProfileLab;

class Laboratory extends Model
{
    use HasFactory;

    protected $fillable = ['hospital_id', 'center_id', 'country_id', 'name', 'address'];

    public function country()
    {
        return $this->belongsTo(\App\Models\Country::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function requests()
    {
        return $this->hasMany(LabRequest::class);
    }

    public function profileLabs()
    {
        return $this->hasMany(ProfileLab::class);
    }
}
