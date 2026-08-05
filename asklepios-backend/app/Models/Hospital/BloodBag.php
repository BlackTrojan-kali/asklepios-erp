<?php

namespace App\Models\Hospital;

use App\Models\Center;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BloodBag extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id',
        'blood_refrigerator_id',
        'blood_donor_id',
        'blood_type',
        'volume_ml',
        'collection_date',
        'expiry_date',
        'external_supplier',
        'type',
        'barcode',
        'status',
    ];

    /**
     * Relation avec le centre médical
     */
    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * Relation avec le réfrigérateur assigné
     */
    public function bloodRefrigerator()
    {
        return $this->belongsTo(BloodRefrigerator::class);
    }

    /**
     * Relation avec le donneur (Peut être null si la poche vient d'un fournisseur externe)
     */
    public function bloodDonor()
    {
        return $this->belongsTo(BloodDonor::class);
    }
}