<?php

namespace App\Models\Hospital;

use App\Models\Center;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BloodRefrigerator extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id',
        'name',
        'target_temperature',
        'status',
    ];

    /**
     * Relation avec le centre médical
     */
    public function center()
    {
        return $this->belongsTo(Center::class);
    }
}