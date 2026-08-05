<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

    // 🚨 ON IMPOSE NOTRE PROPRE LOI SUR L'ORDRE D'EXÉCUTION
        $middleware->priority([
            \App\Http\Middleware\IdentifyTenant::class,
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Auth\Middleware\Authenticate::class,
        ]);
        //
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'licence' => \App\Http\Middleware\CheckLicence::class,
            'active.session' => \App\Http\Middleware\RequireActiveCashSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
