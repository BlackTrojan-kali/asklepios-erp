<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    description: "Documentation de l'API pour l'ERP Hospitalier Asklepios",
    title: "Asklepios API Core"
)]
#[OA\Server(
    url: "http://localhost:8000/api",
    description: "Serveur Local"
)]
abstract class Controller
{
    // C'est le contrôleur de base de Laravel 11
}