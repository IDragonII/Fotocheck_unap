<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'usuario' => 'required|string',
            'clave' => 'required|string',
        ]);

        $usuario = Usuario::where('usuario', $request->usuario)->first();

        if (! $usuario || ! Hash::check($request->clave, $usuario->clave)) {
            return response()->json([
                'message' => 'Credenciales incorrectas',
            ], 401);
        }

        if ($usuario->estado !== 'ACTIVO') {
            return response()->json([
                'message' => 'Usuario inactivo',
            ], 403);
        }

        DB::table('usuarios')
            ->where('id', $usuario->id)
            ->update(['ultimo_acceso' => now()]);

        $roles = DB::table('usuario_roles')
            ->join('roles', 'roles.id', '=', 'usuario_roles.rol_id')
            ->where('usuario_roles.usuario_id', $usuario->id)
            ->pluck('roles.nombre', 'roles.id');

        return response()->json([
            'usuario' => [
                'id' => $usuario->id,
                'usuario' => $usuario->usuario,
                'nombres' => $usuario->nombres,
                'apellidos' => $usuario->apellidos,
                'estado' => $usuario->estado,
                'roles' => $roles,
            ],
        ]);
    }
}
