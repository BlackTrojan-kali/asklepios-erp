<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\SUPA\CountryController;
use App\Http\Controllers\SUPA\HospitalController;
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
    });

});
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

 