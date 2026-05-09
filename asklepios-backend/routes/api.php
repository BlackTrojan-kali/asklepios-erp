<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix("auth")->group(function(){
    Route::post("/login",[AuthController::class,"login"]);
    Route::post("/logout",[AuthController::class,"logout"])->middleware("auth:sanctum");
});
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

