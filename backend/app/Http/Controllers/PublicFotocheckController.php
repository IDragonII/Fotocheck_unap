<?php

namespace App\Http\Controllers;

use App\Models\AccesoQr;
use App\Models\Fotocheck;
use App\Models\Trabajador;
use Illuminate\Http\Request;

class PublicFotocheckController extends Controller
{
    public function show($codigo, Request $request)
    {
        $trabajador = Trabajador::where('codigo_unico', $codigo)->first();

        if (! $trabajador) {
            return response()->json(['message' => 'Trabajador no encontrado'], 404);
        }

        $fotocheck = Fotocheck::where('trabajador_id', $trabajador->id)
            ->where('estado', 'VIGENTE')
            ->orderBy('fecha_emision', 'desc')
            ->first();

        if (! $fotocheck) {
            return response()->json(['message' => 'Fotocheck no encontrado'], 404);
        }

        $yaAccedio = AccesoQr::where('trabajador_id', $trabajador->id)
            ->where('ip', $request->ip())
            ->where('fecha_acceso', '>=', now()->subSeconds(5))
            ->exists();

        if (! $yaAccedio) {
            AccesoQr::create([
                'trabajador_id' => $trabajador->id,
                'ip' => $request->ip(),
                'navegador' => $request->userAgent(),
                'fecha_acceso' => now(),
            ]);
        }

        return response()->json([
            'trabajador' => [
                'dni' => $trabajador->dni,
                'nombres' => $trabajador->nombres,
                'apellidos' => $trabajador->apellidos,
                'nombre_completo' => $trabajador->nombres.' '.$trabajador->apellidos,
                'cargo' => $trabajador->cargo,
                'area' => $trabajador->area,
                'empresa' => $trabajador->empresa,
                'telefono' => $trabajador->telefono,
                'correo' => $trabajador->correo,
                'foto' => $trabajador->url_foto_presencial ?: $trabajador->url_foto_virtual,
                'codigo' => $trabajador->codigo_unico,
                'codigo_nfs' => $trabajador->codigo_nfs,
                'fecha_ingreso' => $trabajador->fecha_ingreso,
            ],
            'fotocheck' => [
                'codigo' => $fotocheck->codigo,
                'estado' => $fotocheck->estado,
                'fecha_emision' => $fotocheck->fecha_emision,
            ],
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
}
