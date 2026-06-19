<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Imports de tes contrôleurs (Garde tes imports existants ici)
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\ArticleCategoryController;
use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\BatchController;
use App\Http\Controllers\Admin\CenterController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\DriverController;
use App\Http\Controllers\Admin\PharmacienController;
use App\Http\Controllers\Admin\PharmacyBranchController;
use App\Http\Controllers\Admin\ProviderController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\VehiculeController;
use App\Http\Controllers\Pharmacien\InventoryController;
use App\Http\Controllers\Pharmacien\PurchaseOrderController;
use App\Http\Controllers\Pharmacien\PurchaseReturnController;
use App\Http\Controllers\Pharmacien\StockMovementController;
use App\Http\Controllers\Pharmacien\StockTransferController;
use App\Http\Controllers\Pharmacien\StorageLocationController;
use App\Http\Controllers\SUPA\AdminController;
use App\Http\Controllers\SUPA\CountryController;
use App\Http\Controllers\SUPA\HospitalController;
use App\Http\Controllers\SUPA\LicenceController;
use App\Http\Controllers\SUPA\SubscriptionController;

// ==========================================================
// 1. AUTHENTICATION (PUBLIC)
// ==========================================================
Route::prefix("auth")->group(function(){
    Route::post("/login", [AuthController::class, "login"]);
    Route::post("/logout", [AuthController::class, "logout"])->middleware("auth:sanctum");
});

// ==========================================================
// 2. ROUTES AUTHENTIFIÉES (GLOBALES)
// ==========================================================
Route::middleware('auth:sanctum')->group(function () {

    // Profil de l'utilisateur courant
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // LECTURE SEULE : Pays (Accessible à tous les connectés)
    Route::get('/countries', [CountryController::class, 'index']);
    Route::get('/countries/{id}', [CountryController::class, 'show']);


    // ==========================================================
    // 3. SUPER ADMIN (SUPA)
    // ==========================================================
    Route::middleware('role:super_admin')->group(function () {
        
        // PAYS (Écriture)
        Route::post('/countries', [CountryController::class, 'store']);
        Route::put('/countries/{id}', [CountryController::class, 'update']);

        // HÔPITAUX
        Route::get('/hospitals', [HospitalController::class, 'index']);
        Route::post('/hospitals', [HospitalController::class, 'store']);
        Route::get('/hospitals/{id}', [HospitalController::class, 'show']);
        Route::put('/hospitals/{id}', [HospitalController::class, 'update']); // Nécessite _method=PUT depuis React pour les fichiers
        Route::delete('/hospitals/{id}', [HospitalController::class, 'destroy']);

        // ADMINISTRATEURS
        Route::get('/admins', [AdminController::class, 'index']);
        Route::post('/admins', [AdminController::class, 'store']);
        Route::get('/admins/{id}', [AdminController::class, 'show']);
        Route::put('/admins/{id}', [AdminController::class, 'update']);
        Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
        Route::patch('/admins/{id}/password', [AdminController::class, 'updatePassword']);

        // LICENCES
        Route::apiResource('licences', LicenceController::class);

        // SOUSCRIPTIONS / CONTRATS
        Route::prefix('subscriptions')->group(function () {
            Route::get('/{id}/preview', [SubscriptionController::class, 'preview']);
            Route::patch('/{id}/renew', [SubscriptionController::class, 'renew']);
            Route::get('/{id}/invoice', [SubscriptionController::class, 'downloadInvoice']);
        });
        Route::apiResource('subscriptions', SubscriptionController::class);
    });


    // ==========================================================
    // 4. ADMINISTRATEUR DE L'HÔPITAL
    // ==========================================================
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        
        // STRUCTURE HOSPITALIÈRE
        Route::apiResource('centers', CenterController::class);
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('pharmacy-branches', PharmacyBranchController::class);

        // CATALOGUE (Lecture de listes complètes sans pagination en premier)
        Route::get('/article-categories/all', [ArticleCategoryController::class, 'all']);
        Route::apiResource('article-categories', ArticleCategoryController::class);

        Route::get('/articles/all', [ArticleController::class, 'all']);
        Route::post('/articles', [ArticleController::class, 'store']);
        Route::put('/articles/{id}', [ArticleController::class, 'update']); // _method=PUT pour multipart
        Route::delete('/articles/{id}', [ArticleController::class, 'destroy']);

        // LOTS ET STOCKS GLOBAUX
        Route::prefix('batches')->group(function () {
            Route::get('/all', [BatchController::class, 'all']);
            Route::post('/initialize-all-stocks', [BatchController::class, 'initializeAllStocks']);
            Route::post('/{id}/initialize-stock', [BatchController::class, 'initializeBatchStock']);
        });
        Route::apiResource('batches', BatchController::class);
        Route::get('/stocks/global', [StockController::class, 'getGlobalStocks']);

        // PARC AUTOMOBILE & LOGISTIQUE
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

        // TRANSFERTS DE STOCKS (Supervision Admin - Lecture seule)
        Route::prefix('stock-transfers')->group(function () {
            Route::get('/export/pdf', [StockTransferController::class, 'exportPdf']);
            Route::get('/', [StockTransferController::class, 'index']);
        });
        
    });


    // ==========================================================
    // 5. ROUTES PARTAGÉES (ADMIN + PHARMACIEN)
    // ==========================================================
    // Ces routes sont accessibles par les deux rôles. 
    // La sécurité des données est assurée par le getContext() dans les contrôleurs.
    Route::middleware('role:admin,pharmacy')->group(function () {

        // --- Sous le préfixe /admin/ ---
        Route::prefix('admin')->group(function () {
            // LECTURE DES SUCCURSALES (Nécessaire au magasinier pour les transferts)
            Route::get('/pharmacy-branches', [PharmacyBranchController::class, 'index']);
            Route::get('/pharmacy-branches/{id}', [PharmacyBranchController::class, 'show']);
        // LECTURE DU PARC AUTOMOBILE ET CHAUFFEURS (Utile pour les transferts du magasinier)
            Route::get('/vehicules', [VehiculeController::class, 'index']);
            Route::get('/vehicules/{id}', [VehiculeController::class, 'show']);
            
            Route::get('/drivers', [DriverController::class, 'index']);
            Route::get('/drivers/{id}', [DriverController::class, 'show']);
            // Piste d'audit / Mouvements
            Route::prefix('stock-movements')->group(function () {
                Route::get('/export/pdf', [StockMovementController::class, 'exportPdf']);
                Route::get('/export/excel', [StockMovementController::class, 'exportExcel']);
                Route::get('/', [StockMovementController::class, 'index']);
            });

            // Pharmaciens
            Route::get('/pharmaciens/paginated', [PharmacienController::class, 'indexPaginated']);
            Route::apiResource('pharmaciens', PharmacienController::class);

            // Fournisseurs
            Route::prefix('providers')->group(function () {
                Route::get('/paginated', [ProviderController::class, 'indexPaginated']);
                Route::get('/export/pdf', [ProviderController::class, 'exportPdf']);
                Route::get('/export/excel', [ProviderController::class, 'exportExcel']);
                Route::post('/import', [ProviderController::class, 'importExcel']);
            });
            Route::apiResource('providers', ProviderController::class)->except(['show']);

            // Articles (Lecture paginée/standard partagée)
            Route::get('/articles', [ArticleController::class, 'index']);

            // Commandes Fournisseurs
            Route::prefix('purchase-orders')->group(function () {
                Route::get('/export/pdf', [PurchaseOrderController::class, 'exportPdf']);
                Route::get('/export/excel', [PurchaseOrderController::class, 'exportExcel']);
                Route::post('/{id}/cancel', [PurchaseOrderController::class, 'cancelOrder']);
                Route::post('/{id}/validate', [PurchaseOrderController::class, 'validateOrder']);
            });
            Route::apiResource('purchase-orders', PurchaseOrderController::class);

            // Retours Fournisseurs
            Route::prefix('purchase-returns')->group(function () {
                Route::get('/export/pdf', [PurchaseReturnController::class, 'exportPdf']);
                Route::get('/export/excel', [PurchaseReturnController::class, 'exportExcel']);
                Route::post('/{id}/cancel', [PurchaseReturnController::class, 'cancelReturn']);
                Route::post('/{id}/validate', [PurchaseReturnController::class, 'validateReturn']);
            });
            Route::apiResource('purchase-returns', PurchaseReturnController::class);
        });

        // --- Sous le préfixe /pharmacy/ ---
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


    // ==========================================================
    // 6. PHARMACIEN / MAGASINIER (Opérations locales)
    // ==========================================================
    Route::middleware('role:pharmacy')->prefix('pharmacy')->group(function () {
        
        // Stocks locaux
        Route::get('/stocks/my-branch', [StockController::class, 'getMyBranchStocks']);
        
        // Emplacements (Allées/Étagères)
        Route::post('/storage-locations/assign-stock', [StorageLocationController::class, 'assignToStock']);
        Route::apiResource('storage-locations', StorageLocationController::class)->except(['show']);

        // Transferts de Stock (Actions d'expédition/réception)
        Route::prefix('stock-transfers')->group(function () {
            Route::get('/export/pdf', [StockTransferController::class, 'exportPdf']);
            Route::post('/{id}/receive', [StockTransferController::class, 'receive']);
            Route::post('/{id}/cancel', [StockTransferController::class, 'cancel']);
            Route::get('/', [StockTransferController::class, 'index']);
            Route::post('/', [StockTransferController::class, 'store']);
        });

    });

}); // FIN DU MIDDLEWARE AUTH:SANCTUM GLOBAL