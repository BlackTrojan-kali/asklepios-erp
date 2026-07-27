<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use App\Models\Hospital\PaymentInvoice;
use App\Models\Hospital\InvoiceSplit;
use Illuminate\Support\Facades\DB;
use Exception;

class PaymentService
{
    /**
     * Enregistre un nouveau paiement et met à jour le statut des parts et de la facture.
     */
    public function createPayment(array $data)
    {
        return DB::transaction(function () use ($data) {
            $invoice = Invoice::findOrFail($data['invoice_id']);

            // Création du paiement
            $payment = PaymentInvoice::create($data);

            // Recalcul intelligent (Tiers Payant)
            $this->recalculateInvoiceStatus($invoice);

            return $payment;
        });
    }

    /**
     * Met à jour un paiement existant et ajuste la facture.
     */
    public function updatePayment(int $paymentId, array $data)
    {
        return DB::transaction(function () use ($paymentId, $data) {
            $payment = PaymentInvoice::findOrFail($paymentId);
            $payment->update($data);

            $this->recalculateInvoiceStatus($payment->invoice);

            return $payment;
        });
    }

    /**
     * Supprime un paiement (ex: erreur de saisie) et ajuste la facture.
     */
    public function deletePayment(int $paymentId)
    {
        return DB::transaction(function () use ($paymentId) {
            $payment = PaymentInvoice::findOrFail($paymentId);
            $invoice = $payment->invoice;

            $payment->delete();

            $this->recalculateInvoiceStatus($invoice);

            return true;
        });
    }

    /**
     * Fonction clé : Calcule la somme des paiements par Split (Parts),
     * met à jour les statuts et débloque le laboratoire.
     */
    private function recalculateInvoiceStatus(Invoice $invoice)
    {
        $invoice->load('splits');
        
        $allSplitsPaid = true;

        // ==========================================
        // 1. MISE À JOUR DES PARTS (SPLITS)
        // ==========================================
        if ($invoice->splits->isNotEmpty()) {
            foreach ($invoice->splits as $split) {
                // On somme les paiements affectés spécifiquement à cette part
                $totalPaidForSplit = (float) PaymentInvoice::where('invoice_split_id', $split->id)->sum('amount');
                
                $status = ($totalPaidForSplit >= $split->amount_to_pay) ? 'PAID' : 'UNPAID';
                
                if ($split->status !== $status) {
                    $split->update(['status' => $status]);
                }
                
                if ($status === 'UNPAID') {
                    $allSplitsPaid = false;
                }
            }
        } else {
            // Rétrocompatibilité : S'il n'y a aucun split (vieille facture), on gère au global
            $totalPaid = (float) PaymentInvoice::where('invoice_id', $invoice->id)->sum('amount');
            $allSplitsPaid = ($totalPaid >= $invoice->total_amount && $invoice->total_amount > 0);
        }

        // ==========================================
        // 2. MISE À JOUR DE LA FACTURE GLOBALE
        // ==========================================
        // La facture n'est soldée que si TOUTES ses parts (Patient + Assurance) sont payées
        $newInvoiceStatus = $allSplitsPaid ? 'PAID' : 'UNPAID';
        if ($invoice->status !== $newInvoiceStatus) {
            $invoice->update(['status' => $newInvoiceStatus]);
        }

        // ==========================================
        // 3. DÉBLOCAGE INTELLIGENT DU LABORATOIRE
        // ==========================================
        // Le laboratoire n'attend que le paiement de la part PATIENT pour commencer son travail.
        
        $patientSplit = $invoice->splits->where('type', 'PATIENT')->first();
        $patientTotalOwed = $patientSplit ? (float) $patientSplit->amount_to_pay : (float) $invoice->total_amount;
        
        // On récupère uniquement l'argent versé par le patient
        $patientTotalPaid = (float) PaymentInvoice::where('invoice_id', $invoice->id)
            ->where(function($q) use ($patientSplit) {
                if ($patientSplit) {
                    $q->where('invoice_split_id', $patientSplit->id);
                } else {
                    $q->whereNull('invoice_split_id');
                }
            })->sum('amount');

        // Si 100% de la part patient est réglée (ou si elle vaut 0 FCFA grâce à 100% assurance)
        $patientSplitPaid = ($patientTotalPaid >= $patientTotalOwed);

        // Ratio financier du patient sur la facture globale (ex: 0.2 pour 20%)
        $patientRatio = ($invoice->total_amount > 0) ? ($patientTotalOwed / $invoice->total_amount) : 1;

        $labRequests = \App\Models\Laboratory\LabRequest::where('invoice_id', $invoice->id)->with('lines.test')->get();

        foreach ($labRequests as $labReq) {
            $runningPatientDebt = 0.0;
            
            // Mise à jour ligne par ligne en fonction du versement patient
            foreach ($labReq->lines as $line) {
                $price = (float) ($line->test?->price ?? 0.0);
                
                // On calcule la dette "Patient" stricte pour cette ligne d'examen
                $linePatientDebt = $price * $patientRatio;
                $runningPatientDebt += $linePatientDebt;
                
                // La ligne est débloquée si l'argent versé par le patient couvre sa quote-part
                $line->update(['is_paid' => ($runningPatientDebt <= $patientTotalPaid + 0.01)]);
            }

            // Si le patient a soldé sa part entière, la demande Labo passe en PAID (Prêt au prélèvement)
            if ($patientSplitPaid) {
                if ($labReq->status === 'PENDING_PAYMENT') {
                    $labReq->update(['status' => 'PAID']);
                }
            } else {
                // En cas d'annulation de paiement, on remet le labo en attente
                if ($labReq->status === 'PAID') {
                    $labReq->update(['status' => 'PENDING_PAYMENT']);
                }
            }
        }
    }
}