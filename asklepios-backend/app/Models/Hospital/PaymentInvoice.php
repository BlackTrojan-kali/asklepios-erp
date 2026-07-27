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
        'invoice_split_id', // 👉 NOUVEAU : Traçabilité du tiers payant
        'reception_id',     
        'amount',
        'payment_method',   
    ];

    /**
     * La facture payée.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * La part spécifique (Split) payée (Patient ou Assurance).
     */
    public function invoiceSplit(): BelongsTo
    {
        return $this->belongsTo(InvoiceSplit::class, 'invoice_split_id');
    }

    /**
     * Le réceptionniste / caissier ayant enregistré ce paiement.
     */
    public function reception(): BelongsTo
    {
        return $this->belongsTo(ProfileReception::class, 'reception_id');
    }
}