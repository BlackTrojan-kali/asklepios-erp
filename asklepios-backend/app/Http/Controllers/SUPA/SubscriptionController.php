<?php

namespace App\Http\Controllers\SUPA;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Souscriptions (SUPA)", description: "Gestion des abonnements et licences des hôpitaux")]
class SubscriptionController extends Controller
{
    /**
     * Liste paginée et filtrée des souscriptions
     */
    #[OA\Get(
        path: "/api/supa/subscriptions",
        operationId: "getSubscriptions",
        summary: "Lister les souscriptions avec filtres",
        security: [["bearerAuth" => []]],
        tags: ["Souscriptions (SUPA)"]
    )]
    #[OA\Parameter(name: "country_id", in: "query", required: false, description: "Filtrer par pays", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "hospital_id", in: "query", required: false, description: "Filtrer par hôpital", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "from_date", in: "query", required: false, description: "Contrats actifs à partir de (YYYY-MM-DD)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "to_date", in: "query", required: false, description: "Contrats actifs jusqu'au (YYYY-MM-DD)", schema: new OA\Schema(type: "string", format: "date"))]
    #[OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Liste des souscriptions récupérée avec succès")]
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        
        // On initialise la requête en chargeant toutes les relations nécessaires pour le tableau React
        $query = Subscription::with(['hospital', 'country', 'items.licence']);

        // Filtre par Pays
        if ($request->filled('country_id')) {
            $query->where('country_id', $request->query('country_id'));
        }

        // Filtre par Hôpital (toujours utile !)
        if ($request->filled('hospital_id')) {
            $query->where('hospital_id', $request->query('hospital_id'));
        }

        // Filtre par Période (Cherche les abonnements actifs pendant cette période)
        if ($request->filled('from_date')) {
            // Le contrat doit se terminer APRÈS la date de début de recherche
            $query->whereDate('ending_date', '>=', $request->query('from_date'));
        }

        if ($request->filled('to_date')) {
            // Le contrat doit avoir commencé AVANT la date de fin de recherche
            $query->whereDate('starting_date', '<=', $request->query('to_date'));
        }

        // On trie par les contrats les plus récemment créés par défaut
        $subscriptions = $query->latest()->paginate($perPage);

        return response()->json($subscriptions, 200);
    }
    /**
     * Créer une nouvelle souscription avec ses licences
     */
    #[OA\Post(
        path: "/api/supa/subscriptions",
        operationId: "storeSubscription",
        summary: "Créer une souscription pour un hôpital",
        security: [["bearerAuth" => []]],
        tags: ["Souscriptions (SUPA)"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["hospital_id", "country_id", "starting_date", "ending_date", "items"],
            properties: [
                new OA\Property(property: "hospital_id", type: "integer", example: 1),
                new OA\Property(property: "country_id", type: "integer", example: 1),
                new OA\Property(property: "starting_date", type: "string", format: "date-time", example: "2026-05-15 00:00:00"),
                new OA\Property(property: "ending_date", type: "string", format: "date-time", example: "2027-05-15 00:00:00"),
                new OA\Property(
                    property: "items", 
                    type: "array", 
                    description: "Liste des licences incluses et leurs prix",
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: "licence_id", type: "integer", example: 2),
                            new OA\Property(property: "unit_price", type: "number", format: "float", example: 150000.50)
                        ]
                    )
                )
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Souscription créée avec succès")]
    #[OA\Response(response: 422, description: "Erreur de validation")]
    public function store(Request $request)
    {
        // 1. Validation stricte des données entrantes
        $validatedData = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'country_id' => 'required|exists:countries,id',
            'starting_date' => 'required|date',
            'ending_date' => 'required|date|after:starting_date',
            
            // On s'assure qu'il y a au moins une licence dans le tableau 'items'
            'items' => 'required|array|min:1',
            'items.*.licence_id' => 'required|exists:licences,id',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // 2. Transaction pour garantir l'intégrité des données
        $subscription = DB::transaction(function () use ($validatedData) {
            
            // A. Création de la souscription parente
            $sub = Subscription::create([
                'hospital_id' => $validatedData['hospital_id'],
                'country_id' => $validatedData['country_id'],
                'starting_date' => $validatedData['starting_date'], // Utilise strating_date ici si tu n'as pas corrigé la DB
                'ending_date' => $validatedData['ending_date'],
            ]);

            // B. Boucle pour insérer chaque licence avec son prix défini à l'instant T
            foreach ($validatedData['items'] as $item) {
                SubscriptionItem::create([
                    'subscription_id' => $sub->id,
                    'licence_id' => $item['licence_id'],
                    'unit_price' => $item['unit_price'],
                ]);
            }

            return $sub;
        });

        // 3. On charge la relation 'items' pour renvoyer la structure complète au front-end
        $subscription->load('items.licence');

        return response()->json([
            'message' => 'Souscription créée avec succès',
            'data' => $subscription
        ], 201);
    }
    /**
     * Modifier une souscription (ajouter/retirer des licences, modifier les prix)
     */
    #[OA\Put(
        path: "/api/supa/subscriptions/{id}",
        operationId: "updateSubscription",
        summary: "Modifier une souscription existante",
        security: [["bearerAuth" => []]],
        tags: ["Souscriptions (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "hospital_id", type: "integer", example: 1),
                new OA\Property(property: "country_id", type: "integer", example: 1),
                new OA\Property(property: "starting_date", type: "string", format: "date-time", example: "2026-05-15 00:00:00"),
                new OA\Property(property: "ending_date", type: "string", format: "date-time", example: "2027-05-15 00:00:00"),
                new OA\Property(
                    property: "items", 
                    type: "array", 
                    description: "Nouvelle liste complète des licences incluses et leurs prix",
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: "licence_id", type: "integer", example: 2),
                            new OA\Property(property: "unit_price", type: "number", format: "float", example: 175000.00)
                        ]
                    )
                )
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Souscription modifiée avec succès")]
    #[OA\Response(response: 404, description: "Souscription non trouvée")]
    public function update(Request $request, $id)
    {
        $subscription = Subscription::findOrFail($id);

        // 1. Validation (tous les champs sont optionnels pour permettre des mises à jour partielles)
        $validatedData = $request->validate([
            'hospital_id' => 'sometimes|required|exists:hospitals,id',
            'country_id' => 'sometimes|required|exists:countries,id',
            'starting_date' => 'sometimes|required|date',
            'ending_date' => 'sometimes|required|date|after:starting_date',
            
            // Si on envoie des items, on exige qu'il y en ait au moins un et que sa structure soit bonne
            'items' => 'sometimes|required|array|min:1',
            'items.*.licence_id' => 'required_with:items|exists:licences,id',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
        ]);

        DB::transaction(function () use ($validatedData, $subscription) {
            
            // A. Mise à jour des informations de base de la souscription
            $subscription->update(collect($validatedData)->except('items')->toArray());

            // B. Mise à jour intelligente des licences (Items)
            if (isset($validatedData['items'])) {
                
                // On récupère uniquement les IDs des licences envoyées depuis le front-end
                $incomingLicenceIds = collect($validatedData['items'])->pluck('licence_id')->toArray();

                // 1. SUPPRESSION : On supprime de la base de données les licences qui ne sont plus dans le tableau envoyé
                $subscription->items()->whereNotIn('licence_id', $incomingLicenceIds)->delete();

                // 2. AJOUT / MODIFICATION : On boucle sur le nouveau tableau
                foreach ($validatedData['items'] as $item) {
                    $subscription->items()->updateOrCreate(
                        // Condition de recherche : Existe-t-il déjà cette licence pour cette souscription ?
                        ['licence_id' => $item['licence_id']],
                        
                        // Valeur à mettre à jour ou à créer : le prix unitaire
                        ['unit_price' => $item['unit_price']]
                    );
                }
            }
        });

        // On recharge les relations pour renvoyer un objet complet et à jour
        $subscription->load('items.licence');

        return response()->json([
            'message' => 'Souscription mise à jour avec succès',
            'data' => $subscription
        ], 200);
    }
    /**
     * Prévisualiser les détails de facturation d'une souscription
     */
    #[OA\Get(
        path: "/api/supa/subscriptions/{id}/preview",
        operationId: "previewSubscription",
        summary: "Détails de facturation d'une souscription",
        security: [["bearerAuth" => []]],
        tags: ["Souscriptions (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Données de prévisualisation récupérées")]
    public function preview($id)
    {
        // On récupère la souscription avec l'hôpital (et ses centres) et les licences
        $subscription = Subscription::with(['hospital.centers', 'items.licence', 'country'])
            ->findOrFail($id);

        $hospital = $subscription->hospital;
        $centerCount = $hospital->centers->count();

        // Transformation des données pour la facture
        $itemsPreview = $subscription->items->map(function ($item) use ($centerCount) {
            $subTotal = $centerCount > 0 ? $item->unit_price * $centerCount : 0;
            
            return [
                'licence_name' => $item->licence->name,
                'unit_price' => $item->unit_price,
                'center_count' => $centerCount,
                'sub_total' => $subTotal,
            ];
        });

        return response()->json([
            'hospital_name' => $hospital->name,
            'period' => [
                'start' => $subscription->starting_date,
                'end' => $subscription->ending_date,
            ],
            'country' => $subscription->country->name,
            'licences' => $itemsPreview,
            'total_amount' => $itemsPreview->sum('sub_total'),
            'currency' => $subscription->country->currency
        ], 200);
    }

    /**
     * Renouveler une souscription (Ajouter 30 jours)
     */
    #[OA\Patch(
        path: "/api/supa/subscriptions/{id}/renew",
        operationId: "renewSubscription",
        summary: "Ajouter 30 jours à une souscription",
        security: [["bearerAuth" => []]],
        tags: ["Souscriptions (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Souscription renouvelée avec succès")]
    public function renew($id)
    {
        $subscription = Subscription::findOrFail($id);

        // On utilise Carbon (inclus dans Laravel) pour manipuler la date
        $currentEndingDate = \Carbon\Carbon::parse($subscription->ending_date);
        
        $newEndingDate = $currentEndingDate->addDays(30);

        $subscription->update([
            'ending_date' => $newEndingDate
        ]);

        return response()->json([
            'message' => 'La souscription a été renouvelée pour 30 jours supplémentaires.',
            'new_ending_date' => $newEndingDate->toDateTimeString()
        ], 200);
    }
    /**
     * Supprimer une souscription
     */
    #[OA\Delete(
        path: "/api/supa/subscriptions/{id}",
        operationId: "deleteSubscription",
        summary: "Supprimer une souscription",
        security: [["bearerAuth" => []]],
        tags: ["Souscriptions (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Souscription supprimée avec succès")]
    public function destroy($id)
    {
        $subscription = Subscription::findOrFail($id);
        
        // Les SubscriptionItems liés seront supprimés automatiquement
        // grâce au ->onDelete('cascade') dans ta migration
        $subscription->delete();

        return response()->json([
            'message' => 'Souscription supprimée avec succès'
        ], 200);
    }

    /**
     * Télécharger la facture PDF de la souscription
     */
  /**
     * Télécharger la facture PDF de la souscription
     */
    #[OA\Get(
        path: "/api/supa/subscriptions/{id}/invoice",
        operationId: "downloadInvoice",
        summary: "Générer et télécharger la facture PDF",
        security: [["bearerAuth" => []]],
        tags: ["Souscriptions (SUPA)"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Fichier PDF de la facture")]
    public function downloadInvoice($id)
    {
        // On récupère les données avec les relations
        $subscription = Subscription::with(['hospital.centers', 'items.licence', 'country'])
            ->findOrFail($id);

        $hospital = $subscription->hospital;
        $centerCount = $hospital->centers->count();

        // Transformation pour le tableau de la facture
        $items = $subscription->items->map(function ($item) use ($centerCount) {
            return [
                'name' => $item->licence->name,
                'unit_price' => $item->unit_price,
                'center_count' => $centerCount,
                'sub_total' => $centerCount > 0 ? $item->unit_price * $centerCount : 0,
            ];
        });

        $totalAmount = $items->sum('sub_total');

        // Préparation des données pour la vue Blade
        $data = [
            'invoice_number' => 'INV-' . date('Y') . '-' . str_pad($subscription->id, 4, '0', STR_PAD_LEFT),
            'date' => now()->format('d/m/Y'),
            'hospital' => $hospital,
            'center_count' => $centerCount,
            'starting_date' => \Carbon\Carbon::parse($subscription->starting_date)->format('d/m/Y'),
            'ending_date' => \Carbon\Carbon::parse($subscription->ending_date)->format('d/m/Y'),
            'items' => $items,
            'total' => $totalAmount,
            'currency' => $subscription->country->currency
        ];

        // Génération du PDF via la vue Blade
        $pdf = Pdf::loadView('pdf.invoice', $data);

        // Configuration du format (A4)
        $pdf->setPaper('A4', 'portrait');

        // On nettoie le nom du fichier pour éviter les espaces ou caractères spéciaux
        $safeHospitalName = preg_replace('/[^A-Za-z0-9\-]/', '_', $hospital->name);
        
        return $pdf->download('Facture_Asklepios_' . $safeHospitalName . '.pdf');
    }
}