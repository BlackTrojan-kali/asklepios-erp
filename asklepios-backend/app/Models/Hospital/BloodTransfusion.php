<?php

namespace App\Models\Hospital;

use App\Models\Center;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BloodTransfusion extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultation_id',
        'center_id',
        'blood_bag_id',
        'start_time',
        'end_time',
        'status',
        'is_billed',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_billed' => 'boolean',
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function bloodBag()
    {
        return $this->belongsTo(BloodBag::class);
    }
}