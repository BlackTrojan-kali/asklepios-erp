<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'consultation_id',
        'admission_id',
        'lab_request_id',
        // 'performed_medical_act_id', <-- Je te conseille fortement de l'ajouter à ta migration
        // 'description',              <-- Idem
        // 'quantity',                 <-- Idem
        'unit_price',
    ];

    /**
     * La facture à laquelle appartient cette ligne.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Si la ligne facture une consultation spécifique.
     */
    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    /**
     * Si la ligne facture un séjour (hospitalisation).
     */
    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    /**
     * Si la ligne facture un examen de laboratoire.
     */
    public function labRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Laboratory\LabRequest::class);
    }
}