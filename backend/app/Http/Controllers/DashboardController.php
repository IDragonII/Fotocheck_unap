<?php

namespace App\Http\Controllers;

use App\Models\Fotocheck;
use App\Models\Trabajador;
use App\Models\Usuario;

class DashboardController extends Controller
{
    public function index()
    {
        $totalTrabajadores = Trabajador::count();
        $trabajadoresActivos = Trabajador::where('estado', 'ACTIVO')->count();
        $totalFotochecks = Fotocheck::count();
        $fotochecksVigentes = Fotocheck::where('estado', 'VIGENTE')->count();
        $totalUsuarios = Usuario::count();

        return response()->json([
            'totalTrabajadores' => $totalTrabajadores,
            'trabajadoresActivos' => $trabajadoresActivos,
            'totalFotochecks' => $totalFotochecks,
            'fotochecksVigentes' => $fotochecksVigentes,
            'totalUsuarios' => $totalUsuarios,
        ]);
    }
}
