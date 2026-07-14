<?php

namespace App\Http\Services;

use App\Models\Hospital\Invoice;
use App\Models\Hospital\PaymentInvoice;
use Illuminate\Support\Facades\DB;
use Exception;

class PaymentService
{
    /**
     * Enregistre un nouveau paiement et met à jour le statut de la facture.
     */
    public function createPayment(array $data)
    {
        return DB::transaction(function () use ($data) {
            $invoice = Invoice::findOrFail($data['invoice_id']);

            // Création du paiement
            $payment = PaymentInvoice::create($data);

            // Recalcul du statut de la facture
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

            // On recalcule le statut de la facture liée
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

            // On recalcule le statut de la facture après suppression
            $this->recalculateInvoiceStatus($invoice);

            return true;
        });
    }

    /**
     * Fonction clé : Calcule la somme des paiements et met à jour le statut.
     */
    private function recalculateInvoiceStatus(Invoice $invoice)
    {
        // Somme de tous les paiements enregistrés pour cette facture
        $totalPaid = $invoice->payments()->sum('amount');

        // Si la somme payée est supérieure ou égale au total de la facture
        if ($totalPaid >= $invoice->total_amount) {
            $invoice->update(['status' => 'PAID']);

            // Marquer aussi la requête laboratoire comme PAID
            \App\Models\Laboratory\LabRequest::where('invoice_id', $invoice->id)
                ->where('status', 'PENDING_PAYMENT')
                ->update(['status' => 'PAID']);
        } else {
            // S'il manque de l'argent (paiement partiel ou suppression d'un paiement)
            $invoice->update(['status' => 'UNPAID']);
            
            // Si on repasse en UNPAID, on pourrait vouloir repasser la LabRequest en PENDING_PAYMENT
            \App\Models\Laboratory\LabRequest::where('invoice_id', $invoice->id)
                ->where('status', 'PAID')
                ->update(['status' => 'PENDING_PAYMENT']);
        }
    }
}