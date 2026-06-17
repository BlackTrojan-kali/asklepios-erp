<?php

namespace App\Http\Services;

use App\Models\Pharmacy\Stock;
use App\Models\Pharmacy\StockMovement;
use Illuminate\Support\Facades\DB;
use Exception;

class StockMovementService
{
    /**
     * Récupère l'ID de la succursale du pharmacien connecté
     * @throws Exception
     */
    private function getBranchId()
    {
        $profile = auth()->user()->profile_pharm;
        
        if (!$profile || !$profile->branch_id) {
            throw new Exception("Accès refusé. Vous n'êtes affecté à aucune succursale.");
        }
        
        return $profile->branch_id;
    }

    /**
     * Enregistre un mouvement de stock et met à jour la quantité globale de la pharmacie.
     * * @param string $type "ENTRY" ou "EXIT"
     * @param string $referenceType "PURCHASE", "RETURN", "SALE", etc.
     * @param int|null $referenceId L'ID du document source (ex: ID de la PurchaseOrder)
     * @param int $batchId L'ID du lot concerné
     * @param float $qty La quantité à mouvoir
     * @param int|null $storageLocationId L'emplacement physique (optionnel)
     * @param string|null $comment Un commentaire optionnel
     * @return StockMovement
     * @throws Exception
     */
    public function recordMovement(
        string $type, 
        string $referenceType, 
        ?int $referenceId, 
        int $batchId, 
        float $qty, 
        ?int $storageLocationId = null, 
        ?string $comment = null
    ) {
        $branchId = $this->getBranchId();
        
        // S'assurer que la quantité fournie est toujours positive pour les calculs
        $qty = abs($qty); 

        DB::beginTransaction();

        try {
            // 1. Récupérer ou créer la ligne de stock pour ce lot dans cette succursale
            $stock = Stock::firstOrCreate(
                ['pharmacy_branch_id' => $branchId, 'batch_id' => $batchId],
                ['qty' => 0, 'storage_location_id' => $storageLocationId]
            );

            // 2. Calculer la nouvelle quantité
            if ($type === 'ENTRY') {
                $stock->qty += $qty;
                // Optionnel: Mettre à jour l'emplacement s'il est fourni lors d'une entrée
                if ($storageLocationId) {
                    $stock->storage_location_id = $storageLocationId;
                }
            } elseif ($type === 'EXIT') {
                $stock->qty -= $qty;
            } else {
                throw new Exception("Type de mouvement invalide. Utilisez ENTRY ou EXIT.");
            }

            // 3. VÉRIFICATION CRITIQUE : Interdire le stock négatif
            if ($stock->qty < 0) {
                throw new Exception("Stock insuffisant. Cette opération entraînerait un stock négatif ({$stock->qty}).");
            }

            $stock->save();

            // 4. Enregistrer la trace du mouvement
            $movement = StockMovement::create([
                'pharmacy_branch_id'  => $branchId,
                'batch_id'            => $batchId,
                'storage_location_id' => $stock->storage_location_id,
                'qty'                 => $qty,
                'reference_type'      => $referenceType,
                'reference_id'        => $referenceId,
                'type'                => $type,
                'qty_in_stock'        => $stock->qty, // Photographie du stock au moment du mouvement
                'comment'             => $comment
            ]);

            DB::commit();

            return $movement;

        } catch (Exception $e) {
            DB::rollBack();
            // On relance l'exception pour que le contrôleur puisse l'attraper et afficher l'erreur
            throw $e; 
        }
    }

    /**
     * Supprime un mouvement de stock et rétablit les quantités.
     * (Augmente le stock si on annule une sortie, réduit le stock si on annule une entrée)
     * * @param int $movementId L'ID du mouvement à supprimer
     * @return bool
     * @throws Exception
     */
    public function deleteMovement(int $movementId)
    {
        $branchId = $this->getBranchId();

        DB::beginTransaction();

        try {
            // 1. Trouver le mouvement (doit appartenir à la succursale du pharmacien connecté)
            $movement = StockMovement::where('pharmacy_branch_id', $branchId)->findOrFail($movementId);

            // 2. Trouver la ligne de stock correspondante
            $stock = Stock::where('pharmacy_branch_id', $branchId)
                          ->where('batch_id', $movement->batch_id)
                          ->first();

            if (!$stock) {
                throw new Exception("Ligne de stock introuvable pour ce mouvement.");
            }

            // 3. Rétablir les quantités (L'inverse du mouvement initial)
            if ($movement->type === 'ENTRY') {
                // Annuler une entrée = Sortir la quantité
                $stock->qty -= $movement->qty;
            } elseif ($movement->type === 'EXIT') {
                // Annuler une sortie = Faire entrer la quantité
                $stock->qty += $movement->qty;
            }

            // 4. VÉRIFICATION CRITIQUE : Interdire le stock négatif après rétablissement
            if ($stock->qty < 0) {
                throw new Exception("Annulation impossible. Rétablir ce mouvement entraînerait un stock négatif ({$stock->qty}).");
            }

            $stock->save();

            // 5. Supprimer la trace du mouvement (Soft Delete selon ta migration)
            $movement->delete();

            DB::commit();

            return true;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}