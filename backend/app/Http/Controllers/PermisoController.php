<?php

namespace App\Http\Controllers;

use App\Models\Permiso;
use Illuminate\Http\Request;

class PermisoController extends Controller
{
    public function index()
    {
        $permisos = Permiso::orderBy('nombre')->get();

        return response()->json($permisos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:permisos,nombre',
        ]);

        $permiso = Permiso::create($request->all());

        return response()->json($permiso, 201);
    }

    public function show($id)
    {
        $permiso = Permiso::findOrFail($id);

        return response()->json($permiso);
    }

    public function update(Request $request, $id)
    {
        $permiso = Permiso::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:100|unique:permisos,nombre,'.$id,
        ]);

        $permiso->update($request->all());

        return response()->json($permiso);
    }

    public function destroy($id)
    {
        Permiso::findOrFail($id)->delete();

        return response()->json(['message' => 'Permiso eliminado']);
    }
}
