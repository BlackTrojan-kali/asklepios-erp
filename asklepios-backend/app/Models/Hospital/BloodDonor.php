<?php

namespace App\Models\Hospital;

use App\Models\Center;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BloodDonor extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id', 'first_name', 'last_name', 'gender', 'birth_date',
        'blood_type', 'phone_contact', 'last_donation_date', 'serology_status',
    ];

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    // 👉 La relation exacte (camelCase)
    public function bloodBags()
    {
        return $this->hasMany(BloodBag::class);
    }
}