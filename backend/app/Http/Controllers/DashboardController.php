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
        DB::statement("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");

        $totalTrabajadores = Trabajador::count();
        $trabajadoresActivos = Trabajador::where('estado', 'ACTIVO')->count();
        $totalFotochecks = Fotocheck::count();
        $fotochecksVigentes = Fotocheck::where('estado', 'VIGENTE')->count();
        $totalUsuarios = Usuario::count();
        $totalAccesos = DB::table('accesos_qr')->count();

        $personalPorTipo = DB::table('trabajadores')
            ->select(DB::raw("CASE WHEN LOWER(cargo) LIKE '%docente%' THEN 'Docentes' ELSE 'Administrativos' END as tipo"), DB::raw('count(*) as total'))
            ->groupByRaw("CASE WHEN LOWER(cargo) LIKE '%docente%' THEN 'Docentes' ELSE 'Administrativos' END")
            ->get();

        $fotosPorTipo = DB::table('trabajadores')
            ->select(
                DB::raw("SUM(CASE WHEN url_foto_presencial IS NOT NULL AND url_foto_presencial != '' THEN 1 ELSE 0 END) as presencial"),
                DB::raw("SUM(CASE WHEN url_foto_virtual IS NOT NULL AND url_foto_virtual != '' THEN 1 ELSE 0 END) as digital"),
                DB::raw("SUM(CASE WHEN (url_foto_presencial IS NULL OR url_foto_presencial = '') AND (url_foto_virtual IS NULL OR url_foto_virtual = '') THEN 1 ELSE 0 END) as sin_foto")
            )
            ->first();

        $disponibilidadFoto = DB::table('trabajadores')
            ->select(DB::raw("
                CASE
                    WHEN url_foto_presencial IS NOT NULL AND url_foto_presencial != '' AND url_foto_virtual IS NOT NULL AND url_foto_virtual != '' THEN 'Ambas'
                    WHEN url_foto_presencial IS NOT NULL AND url_foto_presencial != '' THEN 'Solo Presencial'
                    WHEN url_foto_virtual IS NOT NULL AND url_foto_virtual != '' THEN 'Solo Digital'
                    ELSE 'Sin Fotografia'
                END as tipo
            "), DB::raw('count(*) as total'))
            ->groupByRaw("
                CASE
                    WHEN url_foto_presencial IS NOT NULL AND url_foto_presencial != '' AND url_foto_virtual IS NOT NULL AND url_foto_virtual != '' THEN 'Ambas'
                    WHEN url_foto_presencial IS NOT NULL AND url_foto_presencial != '' THEN 'Solo Presencial'
                    WHEN url_foto_virtual IS NOT NULL AND url_foto_virtual != '' THEN 'Solo Digital'
                    ELSE 'Sin Fotografia'
                END
            ")
            ->get();

        $distribucionCargo = DB::table('trabajadores')
            ->select(DB::raw("CASE WHEN cargo IS NULL OR cargo = '' THEN 'Sin especificar' ELSE cargo END as cargo"), DB::raw('count(*) as total'))
            ->groupByRaw("CASE WHEN cargo IS NULL OR cargo = '' THEN 'Sin especificar' ELSE cargo END")
            ->orderByDesc('total')
            ->get();

        $integridadContacto = DB::table('trabajadores')
            ->select(DB::raw("
                CASE
                    WHEN correo IS NOT NULL AND correo != '' AND telefono IS NOT NULL AND telefono != '' THEN 'Completo'
                    WHEN correo IS NOT NULL AND correo != '' THEN 'Solo Correo'
                    WHEN telefono IS NOT NULL AND telefono != '' THEN 'Solo Telefono'
                    ELSE 'Sin Contacto'
                END as estado
            "), DB::raw('count(*) as total'))
            ->groupByRaw("
                CASE
                    WHEN correo IS NOT NULL AND correo != '' AND telefono IS NOT NULL AND telefono != '' THEN 'Completo'
                    WHEN correo IS NOT NULL AND correo != '' THEN 'Solo Correo'
                    WHEN telefono IS NOT NULL AND telefono != '' THEN 'Solo Telefono'
                    ELSE 'Sin Contacto'
                END
            ")
            ->get();

        return response()->json([
            'totalTrabajadores' => $totalTrabajadores,
            'trabajadoresActivos' => $trabajadoresActivos,
            'totalFotochecks' => $totalFotochecks,
            'fotochecksVigentes' => $fotochecksVigentes,
            'totalUsuarios' => $totalUsuarios,
            'totalAccesos' => $totalAccesos,
            'personalPorTipo' => $personalPorTipo,
            'fotosPorTipo' => $fotosPorTipo,
            'disponibilidadFoto' => $disponibilidadFoto,
            'distribucionCargo' => $distribucionCargo,
            'integridadContacto' => $integridadContacto,
        ]);
    }
}
