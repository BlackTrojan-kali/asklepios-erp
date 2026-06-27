<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Imports de tes contrôleurs (Garde tes imports existants ici)
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\ArticleCategoryController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\BatchController;
use App\Http\Controllers\Admin\BedController;
use App\Http\Controllers\Admin\CenterController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\DoctorController;
use App\Http\Controllers\Admin\DriverController;
use App\Http\Controllers\Admin\FacilityRoomController;
use App\Http\Controllers\Admin\CashRegisterController;
use App\Http\Controllers\Pharmacien\CashRegisterSessionController;
use App\Http\Controllers\Pharmacien\PosSaleController;
use App\Http\Controllers\Pharmacien\PosSaleItemController;
use App\Http\Controllers\Pharmacien\CashierController;
use App\Http\Controllers\Admin\PharmacienController;
use App\Http\Controllers\Admin\PharmacyBranchArticleController;
use App\Http\Controllers\Admin\PharmacyBranchController;
use App\Http\Controllers\Admin\ProviderController;
use App\Http\Controllers\Admin\RoomCategoryController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\VehiculeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Pharmacien\InventoryController;
use App\Http\Controllers\Pharmacien\PurchaseOrderController;
use App\Http\Controllers\Pharmacien\PurchaseReturnController;
use App\Http\Controllers\Pharmacien\StockMovementController;
use App\Http\Controllers\Pharmacien\StockTransferController;
use App\Http\Controllers\Pharmacien\StorageLocationController;
use App\Http\Controllers\Receptionist\AppointmentController;
use App\Http\Controllers\SUPA\AdminController;
use App\Http\Controllers\SUPA\CountryController;
use App\Http\Controllers\SUPA\HospitalController;
use App\Http\Controllers\SUPA\LicenceController;
use App\Http\Controllers\SUPA\SubscriptionController;
use GuzzleHttp\Middleware;

// ==========================================================
// 1. AUTHENTIFICATION (PUBLIC)
// ==========================================================
Route::prefix("auth")->group(function(){
    Route::post("/login", [AuthController::class, "login"]);
    Route::post("/logout", [AuthController::class, "logout"])->middleware("auth:sanctum");
});

// ==========================================================
// 2. ROUTES AUTHENTIFIÉES (GLOBALES)
// ==========================================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Profil utilisateur
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    // LECTURE SEULE : Pays (Accessible à tous les connectés)
        Route::get('/countries/all', [CountryController::class, 'all']); // <-- À PLACER EN PREMIER
    // Configuration / Données publiques
    Route::get('/countries', [CountryController::class, 'index']);
    Route::get('/countries/{id}', [CountryController::class, 'show']);

    // Notifications du système
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    // Endpoint Global : Jours restants de la souscription (utile pour le frontend)
    Route::get('/subscriptions/my-remaining-days', [SubscriptionController::class, 'myRemainingDays']);

    // ==========================================================
    // 3. SUPER ADMIN (Gestion SaaS)
    // ==========================================================
    Route::middleware('role:super_admin')->prefix('supa')->group(function () {
        
        // Configuration de base
        Route::post('/countries', [CountryController::class, 'store']);
        Route::put('/countries/{id}', [CountryController::class, 'update']);
        Route::apiResource('licences', LicenceController::class);

        // Hôpitaux & Administrateurs clients
        Route::apiResource('hospitals', HospitalController::class);
        Route::patch('/admins/{id}/password', [AdminController::class, 'updatePassword']);
        Route::apiResource('admins', AdminController::class);

        // Souscriptions (Abonnements)
        Route::prefix('subscriptions')->group(function () {
            Route::get('/{id}/preview', [SubscriptionController::class, 'preview']);
            Route::patch('/{id}/renew', [SubscriptionController::class, 'renew']);
            Route::get('/{id}/invoice', [SubscriptionController::class, 'downloadInvoice']);
        });
        Route::apiResource('subscriptions', SubscriptionController::class);
    });

    // ==========================================================
    // 4. MODULE DE BASE DE L'HÔPITAL (Hors Pharmacie)
    // ==========================================================
    Route::middleware(["licence:base_hospital"])->group(function(){
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('centers', CenterController::class);
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('receptionists', \App\Http\Controllers\Admin\ReceptionistController::class);
    });
    });

    // ==========================================================
    // 5. MODULE PHARMACIE (Protégé par la licence)
    // ==========================================================
    Route::middleware(['licence:pharmacy'])->group(function () {

        // ------------------------------------------------------
        // 5.1. ACCÈS ADMINISTRATEUR EXCLUSIF (Configuration)
        // ------------------------------------------------------
        Route::middleware('role:admin')->prefix('admin')->group(function () {
            //docteurs

                // Gestion complète (CRUD) des médecins de l'hôpital
                Route::apiResource('doctors', DoctorController::class);
            // Succursales
            Route::apiResource('pharmacy-branches', PharmacyBranchController::class);

            // Caisses (CRUD Admin)
            Route::apiResource('cash-registers', CashRegisterController::class)->only(['store', 'update', 'destroy']);

            // Catalogue
            Route::get('/article-categories/all', [ArticleCategoryController::class, 'all']);
            Route::apiResource('article-categories', ArticleCategoryController::class);
            Route::get('/articles/all', [ArticleController::class, 'all']);
            Route::post('/articles', [ArticleController::class, 'store']);
            Route::put('/articles/{id}', [ArticleController::class, 'update']);
            Route::delete('/articles/{id}', [ArticleController::class, 'destroy']);
            
         
            // Gestion globale des lots
            Route::prefix('batches')->group(function () {
                Route::get('/all', [BatchController::class, 'all']);
                Route::post('/initialize-all-stocks', [BatchController::class, 'initializeAllStocks']);
                Route::post('/{id}/initialize-stock', [BatchController::class, 'initializeBatchStock']);
            });
            Route::apiResource('batches', BatchController::class);
            Route::get('/stocks/global', [StockController::class, 'getGlobalStocks']);

            // Logistique
            Route::prefix('vehicules')->group(function () {
                Route::get('/export/excel', [VehiculeController::class, 'exportExcel']);
                Route::post('/import', [VehiculeController::class, 'importExcel']);
            });
            Route::apiResource('vehicules', VehiculeController::class);

            Route::prefix('drivers')->group(function () {
                Route::get('/export/excel', [DriverController::class, 'exportExcel']);
                Route::post('/import', [DriverController::class, 'importExcel']);
            });
            Route::apiResource('drivers', DriverController::class);

            // Supervision des transferts (Lecture)
            Route::get('/stock-transfers', [StockTransferController::class, 'index']);
            Route::get('/stock-transfers/export/pdf', [StockTransferController::class, 'exportPdf']);
        });

        // ------------------------------------------------------
        // 5.2. ACCÈS PARTAGÉ (Admin + Pharmacien)
        // ------------------------------------------------------
        Route::middleware('role:admin,pharmacy')->group(function () {
            
            Route::prefix('admin')->group(function () {
                // Lecture Logistique & Succursales (utile au pharmacien)
                Route::get('/pharmacy-branches', [PharmacyBranchController::class, 'index']);
                Route::get('/pharmacy-branches/{id}', [PharmacyBranchController::class, 'show']);
                Route::get('/vehicules', [VehiculeController::class, 'index']);
                Route::get('/vehicules/{id}', [VehiculeController::class, 'show']);
                Route::get('/drivers', [DriverController::class, 'index']);
                Route::get('/drivers/{id}', [DriverController::class, 'show']);
                Route::get('/articles', [ArticleController::class, 'index']);
                
                // Mouvements de stock
                Route::prefix('stock-movements')->group(function () {
                    Route::get('/export/pdf', [StockMovementController::class, 'exportPdf']);
                    Route::get('/export/excel', [StockMovementController::class, 'exportExcel']);
                    Route::get('/', [StockMovementController::class, 'index']);
                });

                // Pharmaciens et Fournisseurs
                Route::get('/pharmaciens/paginated', [PharmacienController::class, 'indexPaginated']);
                Route::apiResource('pharmaciens', PharmacienController::class);

                Route::prefix('providers')->group(function () {
                    Route::get('/paginated', [ProviderController::class, 'indexPaginated']);
                    Route::get('/export/pdf', [ProviderController::class, 'exportPdf']);
                    Route::get('/export/excel', [ProviderController::class, 'exportExcel']);
                    Route::post('/import', [ProviderController::class, 'importExcel']);
                });
                Route::apiResource('providers', ProviderController::class)->except(['show']);

                // Achats
                Route::prefix('purchase-orders')->group(function () {
                    Route::get('/export/pdf', [PurchaseOrderController::class, 'exportPdf']);
                    Route::get('/export/excel', [PurchaseOrderController::class, 'exportExcel']);
                    Route::post('/{id}/cancel', [PurchaseOrderController::class, 'cancelOrder']);
                    Route::post('/{id}/validate', [PurchaseOrderController::class, 'validateOrder']);
                    Route::get('/{id}/pdf', [PurchaseOrderController::class, 'downloadOrderForm']);
                });
                Route::apiResource('purchase-orders', PurchaseOrderController::class);

                // Retours
                Route::prefix('purchase-returns')->group(function () {
                    Route::get('/export/pdf', [PurchaseReturnController::class, 'exportPdf']);
                    Route::get('/export/excel', [PurchaseReturnController::class, 'exportExcel']);
                    Route::post('/{id}/cancel', [PurchaseReturnController::class, 'cancelReturn']);
                    Route::post('/{id}/validate', [PurchaseReturnController::class, 'validateReturn']);
                });
                Route::apiResource('purchase-returns', PurchaseReturnController::class);

                // Document logistique
                Route::get('/stock-transfers/{id}/waybill', [StockTransferController::class, 'downloadWaybill']);

                // Articles d'une branche de pharmacie (Accès partagé Admin + Pharmacy)
                Route::get('/branch/articles/export/excel', [PharmacyBranchArticleController::class, 'exportExcel']);
                Route::get('/branch/articles', [PharmacyBranchArticleController::class, 'index']);
                Route::get('/branch/{id}/articles/all', [PharmacyBranchArticleController::class, 'all']);
                Route::get('/branch/{id}/articles/', [PharmacyBranchArticleController::class, 'show']); 
                Route::post('/branch/articles/update-price', [PharmacyBranchArticleController::class, 'updatePrice']); 

                // Caisses (Accès partagé)
                Route::get('/cash-registers', [CashRegisterController::class, 'index']);
                Route::get('/cash-registers/{id}', [CashRegisterController::class, 'show']);
             
            });           

            Route::prefix('pharmacy')->group(function () {
                // Inventaires
                Route::prefix('inventories')->group(function () {
                    Route::get('/export/pdf', [InventoryController::class, 'exportPdf']);
                    Route::get('/export/excel', [InventoryController::class, 'exportExcel']);
                    Route::post('/{id}/validate', [InventoryController::class, 'validateInventory']);
                });
                Route::apiResource('inventories', InventoryController::class);
            });
        });

        // ------------------------------------------------------
        // 5.3. ACCÈS PHARMACIEN EXCLUSIF (Opérations locales)
        // ------------------------------------------------------
        Route::middleware('role:pharmacy')->prefix('pharmacy')->group(function () {
            
            // Gestion du stock physique de la succursale
            Route::get('/stocks/my-branch', [StockController::class, 'getMyBranchStocks']);
            Route::post('/storage-locations/assign-stock', [StorageLocationController::class, 'assignToStock']);
            Route::apiResource('storage-locations', StorageLocationController::class)->except(['show']);

            // Gestion logistique inter-pharmacies
            Route::prefix('stock-transfers')->group(function () {
                Route::get('/', [StockTransferController::class, 'index']);
                Route::post('/', [StockTransferController::class, 'store']);
                Route::post('/{id}/receive', [StockTransferController::class, 'receive']);
                Route::post('/{id}/cancel', [StockTransferController::class, 'cancel']);
                Route::get('/export/pdf', [StockTransferController::class, 'exportPdf']);
            });

            // Caisses Sessions (Pharmacien caissier exclusif)
            Route::prefix('cash-registers')->group(function () {
                Route::post('/{id}/sessions/open', [CashRegisterSessionController::class, 'openSession']);
                Route::post('/sessions/{sessionId}/close', [CashRegisterSessionController::class, 'closeSession']);
                Route::get('/active-session/me', [CashRegisterSessionController::class, 'myActiveSession']);
            });

            // Point de Vente (Ventes POS)
            Route::apiResource('pos-sales', PosSaleController::class)->only(['index', 'show', 'store']);
            Route::get('pos-sales/{id}/pdf', [PosSaleController::class, 'exportPdf']);
            Route::apiResource('pos-sale-items', PosSaleItemController::class)->only(['index']);
            Route::get('cashier/articles', [CashierController::class, 'getAllArticles']);
           
        });

    }); // Fin Middleware Licence Pharmacie

    // ---------------------------------------------------------
        // ACCÈS RÉCEPTIONNISTES ET MÉDECINS (Module Base Hôpital)
        // ---------------------------------------------------------
    // ---------------------------------------------------------
        // ACCÈS RÉCEPTIONNISTES ET MÉDECINS (Module Base Hôpital)
        // ---------------------------------------------------------
        Route::middleware(['licence:base_hospital'])
            ->group(function () {

            // ---------------------------------------------------------
    // ACCÈS PARTAGÉ (Admin, Docteur, Réception)
    // ---------------------------------------------------------
    Route::middleware(["role:admin,doctor,reception"])->prefix('shared')->group(function () {
        
        // ... tes autres routes partagées (room-categories, etc.)

        // Lecture des salles d'un département (Pour l'interface type "Explorateur de fichiers")
        Route::get('departments/{departmentId}/facility-rooms', [FacilityRoomController::class, 'index']);
        
    });


    // ---------------------------------------------------------
    // ACCÈS ADMINISTRATEUR EXCLUSIF
    // ---------------------------------------------------------
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        
        // ... tes autres routes admin

        // Gestion CRUD des Salles (excepté l'index qui est géré dans "shared" ci-dessus)
        Route::apiResource('facility-rooms',FacilityRoomController::class)->except(['index', 'show']);

    });
            Route::middleware(["role:admin,reception"])
            ->prefix('receptionist')->group(function(){
            // Dossiers Patients
            Route::apiResource('patients', \App\Http\Controllers\Receptionist\PatientController::class);
            });


            // ---------------------------------------------------------
            // 2. ACCÈS RÉCEPTIONNISTE
            // ---------------------------------------------------------
            Route::middleware(['role:reception'])->prefix('reception')->group(function () {
                // ... (tes routes patients : Route::apiResource('patients', ...))
                
                // Lecture seule : Liste des médecins affiliés au centre du réceptionniste
                Route::get('doctors', [DoctorController::class, 'index']);
            });
            // ---------------------------------------------------------
    // ACCÈS PARTAGÉ (Admin, Docteur, Réception)
    // Utile pour alimenter les listes déroulantes (React-Select)
    // ---------------------------------------------------------
    Route::middleware(["role:admin,doctor,reception"])->prefix('shared')->group(function () {
        // Lecture seule des catégories (Paginé ou flat list)
        // 1. Export PDF (À placer IMPÉRATIVEMENT avant les routes avec {id})
        Route::get('appointments/export-pdf', [AppointmentController::class, 'exportPdf']);

        // 2. CRUD standard des rendez-vous (On exclut 'destroy' car on utilise 'cancel' pour garder l'historique)
        Route::apiResource('appointments', AppointmentController::class)->except(['destroy', 'show']);

        // 3. Actions spécifiques sur un rendez-vous
        Route::prefix('appointments/{appointment}')->group(function () {
            Route::put('reschedule', [AppointmentController::class, 'reschedule']);
            Route::patch('cancel', [AppointmentController::class, 'cancel']);
            
            // Admission à l'accueil (Création de la file d'attente)
            Route::post('admit', [AppointmentController::class, 'admitToWaitingRoom']);
        });

        // 4. Actions sur la visite en cours (Déplacement dans l'hôpital)
        Route::patch('visits/{visit}/consultation', [AppointmentController::class, 'admitToConsultation']);
        

        Route::get('room-categories', [RoomCategoryController::class, 'index']);
        Route::get('rooms/{roomId}/beds', [BedController::class, 'index']);
    });


    // ---------------------------------------------------------
    // ACCÈS ADMINISTRATEUR EXCLUSIF
    // ---------------------------------------------------------
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        
        // Gestion complète (CRUD) des catégories de chambres
        // Note: L'index est aussi disponible ici pour l'admin (via apiResource)
        Route::post('facility-rooms/sync-waiting-rooms', [FacilityRoomController::class, 'syncWaitingRooms']);
        Route::apiResource('room-categories', RoomCategoryController::class);
        Route::apiResource('beds', BedController::class)->except(['index', 'show']);

    });
        });
}); // Fin Middleware Auth:Sanctum