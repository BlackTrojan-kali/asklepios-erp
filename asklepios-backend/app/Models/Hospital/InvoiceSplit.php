<?php

namespace App\Models\Hospital;

use App\Models\GuarantorClaim;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
// N'oubliez pas d'importer GuarantorClaim selon son emplacement réel dans votre projet
// use App\Models\Insurance\GuarantorClaim; 

class InvoiceSplit extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'type',               // 'PATIENT' ou 'INSURANCE'
        'guarantor_claim_id', // ID de la réclamation/prise en charge (nullable)
        'amount_to_pay',
        'status',             // 'UNPAID', 'PAID'
    ];

    /**
     * Convertir automatiquement les types de données
     */
    protected $casts = [
        'amount_to_pay' => 'float',
    ];

    // ==========================================
    // RELATIONS
    // ==========================================

    /**
     * La facture globale à laquelle cette division appartient.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * La réclamation d'assurance associée (si le type est INSURANCE).
     */
    public function guarantorClaim(): BelongsTo
    {
        return $this->belongsTo(GuarantorClaim::class);
    }
}