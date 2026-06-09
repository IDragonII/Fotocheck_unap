<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use App\Traits\Loggable;
use Illuminate\Http\Request;

class RolController extends Controller
{
    use Loggable;

    public function index()
    {
        $roles = Rol::with('permisos')->orderBy('nivel', 'desc')->get();

        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:roles,nombre',
            'nivel' => 'required|integer',
        ]);

        $rol = Rol::create($request->all());

        if ($request->has('permisos')) {
            $rol->permisos()->attach($request->permisos);
        }

        $this->log($request, 'Creacion', 'roles', $rol->id, "Rol creado: {$rol->nombre}");

        return response()->json($rol->load('permisos'), 201);
    }

    public function show($id)
    {
        $rol = Rol::with('permisos')->findOrFail($id);

        return response()->json($rol);
    }

    public function update(Request $request, $id)
    {
        $rol = Rol::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:100|unique:roles,nombre,'.$id,
            'nivel' => 'required|integer',
        ]);

        $rol->update($request->except('permisos'));
        $rol->permisos()->sync($request->permisos ?? []);

        $this->log($request, 'Actualizacion', 'roles', $id, "Rol actualizado: {$rol->nombre}");

        return response()->json($rol->load('permisos'));
    }

    public function destroy($id)
    {
        $rol = Rol::findOrFail($id);
        $rol->permisos()->detach();
        $rol->delete();

        $this->log(request(), 'Eliminacion', 'roles', $id, "Rol eliminado: {$rol->nombre}");

        return response()->json(['message' => 'Rol eliminado']);
    }
}
