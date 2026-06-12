<?php

namespace App\Http\Controllers;

use App\Models\Fotocheck;
use App\Models\Trabajador;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalTrabajadores = Trabajador::count();
        $trabajadoresActivos = Trabajador::where('estado', 'ACTIVO')->count();
        $totalFotochecks = Fotocheck::count();
        $fotochecksVigentes = Fotocheck::where('estado', 'VIGENTE')->count();
        $totalUsuarios = Usuario::count();
        $totalAccesos = DB::table('accesos_qr')->count();

        $accesosPorDia = DB::table('accesos_qr')
            ->select(DB::raw('DATE(fecha_acceso) as fecha'), DB::raw('count(*) as total'))
            ->where('fecha_acceso', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(fecha_acceso)'))
            ->orderBy('fecha')
            ->get();

        $accesosPorHora = DB::table('accesos_qr')
            ->select(DB::raw('HOUR(fecha_acceso) as hora'), DB::raw('count(*) as total'))
            ->where('fecha_acceso', '>=', now()->subDays(30))
            ->groupBy(DB::raw('HOUR(fecha_acceso)'))
            ->orderBy('hora')
            ->get();

        $topTrabajadores = DB::table('accesos_qr')
            ->join('trabajadores', 'trabajadores.id', '=', 'accesos_qr.trabajador_id')
            ->select('trabajadores.nombres', 'trabajadores.apellidos', DB::raw('count(*) as total'))
            ->where('accesos_qr.fecha_acceso', '>=', now()->subDays(30))
            ->groupBy('trabajadores.id', 'trabajadores.nombres', 'trabajadores.apellidos')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $logsPorAccion = DB::table('logs')
            ->select('accion', DB::raw('count(*) as total'))
            ->where('fecha', '>=', now()->subDays(30))
            ->groupBy('accion')
            ->orderByDesc('total')
            ->get();

        $trabajadoresPorEstado = DB::table('trabajadores')
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->get();

        $fotochecksPorEstado = DB::table('fotochecks')
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->get();

        return response()->json([
            'totalTrabajadores' => $totalTrabajadores,
            'trabajadoresActivos' => $trabajadoresActivos,
            'totalFotochecks' => $totalFotochecks,
            'fotochecksVigentes' => $fotochecksVigentes,
            'totalUsuarios' => $totalUsuarios,
            'totalAccesos' => $totalAccesos,
            'accesosPorDia' => $accesosPorDia,
            'accesosPorHora' => $accesosPorHora,
            'topTrabajadores' => $topTrabajadores,
            'logsPorAccion' => $logsPorAccion,
            'trabajadoresPorEstado' => $trabajadoresPorEstado,
            'fotochecksPorEstado' => $fotochecksPorEstado,
        ]);
    }
}
