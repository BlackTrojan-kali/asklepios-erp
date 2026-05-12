<?php

use App\Http\Controllers\Admin\CenterController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\SUPA\AdminController;
use App\Http\Controllers\SUPA\CountryController;
use App\Http\Controllers\SUPA\HospitalController;
use App\Http\Controllers\SUPA\LicenceController;
use App\Http\Controllers\SUPA\SubscriptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix("auth")->group(function(){
    Route::post("/login",[AuthController::class,"login"]);
    Route::post("/logout",[AuthController::class,"logout"])->middleware("auth:sanctum");
});
Route::middleware('auth:sanctum')->group(function () {

    // TOUT LE MONDE peut voir la liste des pays
    Route::get('/countries', [CountryController::class, 'index']);
    Route::get('/countries/{id}', [CountryController::class, 'show']);

    // SEULS les super_admin ET les admin peuvent ajouter ou modifier un pays
    Route::middleware('role:super_admin')->group(function () {
        Route::post('/countries', [CountryController::class, 'store']);
        Route::put('/countries/{id}', [CountryController::class, 'update']);
        Route::get('/hospitals', [HospitalController::class, 'index']);
    Route::post('/hospitals', [HospitalController::class, 'store']);
    Route::get('/hospitals/{id}', [HospitalController::class, 'show']);
    
    // IMPORTANT : On utilise POST pour l'update afin de supporter le multipart/form-data (fichiers)
    // Depuis React, il faudra envoyer un champ { _method: 'PUT' } dans le FormData
    Route::put('/hospitals/{id}', [HospitalController::class, 'update']);
    
    Route::delete('/hospitals/{id}', [HospitalController::class, 'destroy']);

    // Routes pour les Administrateurs
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::get('/admins/{id}', [AdminController::class, 'show']);
    Route::put('/admins/{id}', [AdminController::class, 'update']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
    
    // Route spécifique pour le mot de passe (PATCH est plus sémantique ici)
    Route::patch('/admins/{id}/password', [AdminController::class, 'updatePassword']);

    Route::get('/licences', [LicenceController::class, 'index']);
Route::post('/licences', [LicenceController::class, 'store']);
Route::get('/licences/{id}', [LicenceController::class, 'show']);
Route::put('/licences/{id}', [LicenceController::class, 'update']);
Route::delete('/licences/{id}', [LicenceController::class, 'destroy']);
    

// ==========================================
    // 3. GESTION DES SOUSCRIPTIONS / CONTRATS (SubscriptionController)
    // ==========================================
    // CRUD de base
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::post('/subscriptions', [SubscriptionController::class, 'store']);
    Route::put('/subscriptions/{id}', [SubscriptionController::class, 'update']);
    Route::delete('/subscriptions/{id}', [SubscriptionController::class, 'destroy']);
    
    // Actions spécifiques métier (Facturation et Renouvellement)
    Route::get('/subscriptions/{id}/preview', [SubscriptionController::class, 'preview']); // Prévisualiser les coûts
    Route::patch('/subscriptions/{id}/renew', [SubscriptionController::class, 'renew']);   // Ajouter 30 jours
    Route::get('/subscriptions/{id}/invoice', [SubscriptionController::class, 'downloadInvoice']); // Générer le PDF

});
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

    // ==========================================
    // GESTION DES CENTRES MÉDICAUX (CenterController)
    // ==========================================
    Route::get('/centers', [CenterController::class, 'index']);
    Route::post('/centers', [CenterController::class, 'store']);
    Route::get('/centers/{id}', [CenterController::class, 'show']);
    Route::put('/centers/{id}', [CenterController::class, 'update']);
    Route::delete('/centers/{id}', [CenterController::class, 'destroy']);

    // Tu pourras ajouter d'autres routes spécifiques à l'admin ici plus tard
    // (ex: gestion des médecins, pharmaciens, patients de cet hôpital...)
    Route::apiResource('departments', DepartmentController::class);
});
    });

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

 