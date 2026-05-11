<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\SUPA\AdminController;
use App\Http\Controllers\SUPA\CountryController;
use App\Http\Controllers\SUPA\HospitalController;
use App\Http\Controllers\SUPA\LicenceController;
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
    });

});
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

 