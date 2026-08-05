<?php

namespace App\Models\Hospital;

use App\Models\Center;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BagCenter extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id',
        'blood_type',
        'price',
    ];

    public function center()
    {
        return $this->belongsTo(Center::class);
    }
}