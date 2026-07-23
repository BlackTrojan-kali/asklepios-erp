<?php

namespace App\Models\Hospital;

use App\Models\Center;
use App\Models\InsuranceCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuarantorClaim extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id',
        'insurance_company_id',
        'claim_month',
        'total_claim_amount',
        'status', // DRAFT, SUBMITTED, PAID, DISPUTED
        'claim_refence', 
    ];

    protected $casts = [
        'claim_month'        => 'date',
        'total_claim_amount' => 'float',
    ];

    /**
     * Le centre médical qui émet la réclamation.
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * L'assurance (le garant) à qui on réclame l'argent.
     */
    public function insuranceCompany(): BelongsTo
    {
        return $this->belongsTo(InsuranceCompany::class);
    }

    /**
     * Les lignes de factures (Parts Assurances) attachées à ce bordereau.
     */
    public function invoiceSplits(): HasMany
    {
        return $this->hasMany(InvoiceSplit::class, 'guarantor_claim_id');
    }

    /**
     * Méthode utilitaire : Recalcule automatiquement le montant total du bordereau 
     * en fonction des InvoiceSplits qui y sont attachés.
     */
    public function recalculateTotalAmount(): void
    {
        $this->total_claim_amount = $this->invoiceSplits()->sum('amount_to_pay');
        $this->save();
    }
}