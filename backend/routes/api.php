<?php

use App\Http\Controllers\AccesoQrController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FotocheckController;
use App\Http\Controllers\ImageProxyController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\PublicFotocheckController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::get('/public/fotocheck/{codigo}', [PublicFotocheckController::class, 'show'])
    ->middleware('throttle:30,1');

Route::get('/proxy/image/{url}', [ImageProxyController::class, 'show'])
    ->middleware('throttle:30,1');

Route::middleware('throttle:60,1')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('trabajadores', TrabajadorController::class);
    Route::post('trabajadores/importar', [TrabajadorController::class, 'importar']);
    Route::get('trabajadores/{id}/fotochecks', [FotocheckController::class, 'porTrabajador']);

    Route::apiResource('fotochecks', FotocheckController::class)->only(['index', 'store', 'show', 'destroy']);
    Route::post('fotochecks/generar', [FotocheckController::class, 'generar']);

    Route::apiResource('usuarios', UsuarioController::class);
    Route::post('usuarios/{id}/desbloquear', [UsuarioController::class, 'desbloquear']);

    Route::apiResource('roles', RolController::class);

    Route::apiResource('permisos', PermisoController::class);

    Route::get('/logs', [LogController::class, 'index']);

    Route::get('/accesos-qr', [AccesoQrController::class, 'index']);
    Route::post('/accesos-qr/{trabajadorId}', [AccesoQrController::class, 'registrar']);

    Route::get('/plantilla-trabajadores', [TrabajadorController::class, 'plantilla']);
});
