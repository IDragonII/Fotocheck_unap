<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const LOCKOUT_MINUTES = 15;

    public function login(Request $request)
    {
        $request->validate([
            'usuario' => 'required|string|max:50',
            'clave' => 'required|string|max:255',
        ]);

        $usuario = Usuario::where('usuario', $request->usuario)->first();

        if (! $usuario) {
            return response()->json([
                'message' => 'Credenciales incorrectas',
            ], 401);
        }

        if ($usuario->bloqueado_hasta && now()->lessThan($usuario->bloqueado_hasta)) {
            $minutes = ceil(now()->diffInMinutes($usuario->bloqueado_hasta));

            return response()->json([
                'message' => "Cuenta bloqueada. Intenta de nuevo en {$minutes} minuto(s).",
            ], 429);
        }

        if ($usuario->estado !== 'ACTIVO') {
            return response()->json([
                'message' => 'Usuario inactivo',
            ], 403);
        }

        if (! Hash::check($request->clave, $usuario->clave)) {
            $intentos = $usuario->intentos_fallidos + 1;
            $lockUntil = null;

            if ($intentos >= self::MAX_ATTEMPTS) {
                $lockUntil = now()->addMinutes(self::LOCKOUT_MINUTES);
                $intentos = 0;
            }

            DB::table('usuarios')
                ->where('id', $usuario->id)
                ->update([
                    'intentos_fallidos' => $intentos,
                    'bloqueado_hasta' => $lockUntil,
                ]);

            return response()->json([
                'message' => 'Credenciales incorrectas',
            ], 401);
        }

        DB::table('usuarios')
            ->where('id', $usuario->id)
            ->update([
                'ultimo_acceso' => now(),
                'intentos_fallidos' => 0,
                'bloqueado_hasta' => null,
            ]);

        $roles = DB::table('usuario_roles')
            ->join('roles', 'roles.id', '=', 'usuario_roles.rol_id')
            ->where('usuario_roles.usuario_id', $usuario->id)
            ->pluck('roles.nombre', 'roles.id');

        $sessionLifetime = (int) config('session.lifetime', 120);
        $expiresAt = now()->addMinutes($sessionLifetime)->toIso8601String();

        return response()->json([
            'usuario' => [
                'id' => $usuario->id,
                'usuario' => $usuario->usuario,
                'nombres' => $usuario->nombres,
                'apellidos' => $usuario->apellidos,
                'estado' => $usuario->estado,
                'roles' => $roles,
            ],
            'expires_at' => $expiresAt,
        ]);
    }
}
