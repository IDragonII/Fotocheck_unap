<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Traits\Loggable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    use Loggable;

    public function index(Request $request)
    {
        $query = Usuario::with('roles');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('usuario', 'like', "%{$buscar}%")
                    ->orWhere('nombres', 'like', "%{$buscar}%")
                    ->orWhere('apellidos', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        $usuarios = $query->orderBy('nombres')->paginate(15);

        return response()->json($usuarios);
    }

    public function store(Request $request)
    {
        $request->validate([
            'usuario' => 'required|string|max:50|unique:usuarios,usuario',
            'clave' => 'required|string|min:6',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'roles' => 'required|array',
        ]);

        $usuario = Usuario::create([
            'usuario' => $request->usuario,
            'clave' => Hash::make($request->clave),
            'nombres' => $request->nombres,
            'apellidos' => $request->apellidos,
            'estado' => $request->estado ?? 'ACTIVO',
        ]);

        $usuario->roles()->attach($request->roles);

        $this->log($request, 'Creacion', 'usuarios', $usuario->id, "Usuario creado: {$usuario->usuario}");

        return response()->json($usuario->load('roles'), 201);
    }

    public function show($id)
    {
        $usuario = Usuario::with('roles')->findOrFail($id);

        return response()->json($usuario);
    }

    public function update(Request $request, $id)
    {
        $usuario = Usuario::findOrFail($id);

        $request->validate([
            'usuario' => 'required|string|max:50|unique:usuarios,usuario,'.$id,
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
        ]);

        $data = $request->except('clave', 'roles');
        if ($request->filled('clave')) {
            $data['clave'] = Hash::make($request->clave);
        }

        $usuario->update($data);
        $usuario->roles()->sync($request->roles ?? []);

        $this->log($request, 'Actualizacion', 'usuarios', $id, "Usuario actualizado: {$usuario->usuario}");

        return response()->json($usuario->load('roles'));
    }

    public function destroy($id)
    {
        $usuario = Usuario::findOrFail($id);
        $usuario->roles()->detach();
        $usuario->delete();

        $this->log(request(), 'Eliminacion', 'usuarios', $id, "Usuario eliminado: {$usuario->usuario}");

        return response()->json(['message' => 'Usuario eliminado']);
    }
}
