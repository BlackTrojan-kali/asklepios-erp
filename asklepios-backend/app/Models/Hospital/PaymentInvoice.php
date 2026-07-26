<?php

namespace App\Models\Hospital;

use App\Models\ProfileReception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'reception_id', // L'agent de réception / caissier qui a encaissé
        'amount',
        'payment_method', // Ex: 'CASH', 'MOBILE_MONEY', 'CARD', 'INSURANCE'
    ];

    /**
     * La facture payée.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Le réceptionniste / caissier ayant enregistré ce paiement.
     */
    public function reception(): BelongsTo
    {
        // Assure-toi que ton modèle ProfileReception est importé correctement
        return $this->belongsTo(ProfileReception::class, 'reception_id');
    }
}