<?php

namespace App\Http\Services;

use App\Models\Hospital\BloodBag;
use App\Models\Hospital\BloodTransfusion;
use App\Models\Hospital\BagCenter;
use Illuminate\Support\Facades\DB;
use Exception;

class BloodTransfusionService
{
    /**
     * Initie une transfusion et gère la facturation
     */
    public function initiateTransfusion(array $data)
    {
        return DB::transaction(function () use ($data) {
            // 1. Récupérer et vérifier la poche de sang
            $bloodBag = BloodBag::findOrFail($data['blood_bag_id']);

            if ($bloodBag->status !== 'AVAILABLE') {
                throw new Exception("Cette poche de sang n'est pas disponible pour une transfusion (Statut actuel: {$bloodBag->status}).");
            }

            // 2. Vérifier si le centre a configuré un prix pour ce groupe sanguin
            $pricing = BagCenter::where('center_id', $data['center_id'])
                                ->where('blood_type', $bloodBag->blood_type)
                                ->first();

            if (!$pricing) {
                throw new Exception("Aucun tarif configuré dans ce centre pour les poches de sang de type {$bloodBag->blood_type}.");
            }

            // 3. Créer l'enregistrement de la transfusion
            $transfusion = BloodTransfusion::create([
                'consultation_id' => $data['consultation_id'],
                'center_id' => $data['center_id'],
                'blood_bag_id' => $bloodBag->id,
                'start_time' => $data['start_time'] ?? now(),
                'status' => 'ON_GOING',
                'is_billed' => false,
            ]);

            // 4. Mettre à jour le statut de la poche (Elle ne peut plus être utilisée)
            $bloodBag->update(['status' => 'USED']);

            // 5. LOGIQUE DE FACTURATION (A adapter selon la structure exacte de vos factures)
            // Exemple : Ajouter la ligne à la facture liée à la consultation
            /*
             InvoiceItem::create([
                 'consultation_id' => $data['consultation_id'],
                 'description' => "Transfusion sanguine - Poche {$bloodBag->blood_type} ({$bloodBag->volume_ml}ml)",
                 'amount' => $pricing->price,
                 'type' => 'BLOOD_BAG'
             ]);
            */

            // On marque comme facturé
          //  $transfusion->update(['is_billed' => true]);

            return $transfusion->load(['bloodBag', 'consultation']);
        });
    }

    /**
     * Terminer la transfusion
     */
    public function finishTransfusion($transfusionId)
    {
        $transfusion = BloodTransfusion::findOrFail($transfusionId);
        
        if ($transfusion->status === 'FINISHED') {
            throw new Exception("Cette transfusion est déjà terminée.");
        }

        $transfusion->update([
            'status' => 'FINISHED',
            'end_time' => now()
        ]);

        return $transfusion;
    }
}