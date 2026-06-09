<?php

namespace App\Http\Controllers;

use App\Models\Trabajador;
use App\Traits\Loggable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class TrabajadorController extends Controller
{
    use Loggable;

    public function index(Request $request)
    {
        $query = Trabajador::query();

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('nombres', 'like', "%{$buscar}%")
                    ->orWhere('apellidos', 'like', "%{$buscar}%")
                    ->orWhere('dni', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        $trabajadores = $query->orderBy('nombres')->paginate(15);

        return response()->json($trabajadores);
    }

    public function store(Request $request)
    {
        $request->validate([
            'dni' => 'required|string|max:8|unique:trabajadores,dni',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
        ]);

        $trabajador = Trabajador::create($request->all());
        $this->log($request, 'Creacion', 'trabajadores', $trabajador->id, "Trabajador creado: {$trabajador->nombres} {$trabajador->apellidos}");

        return response()->json($trabajador, 201);
    }

    public function show($id)
    {
        $trabajador = Trabajador::findOrFail($id);

        return response()->json($trabajador);
    }

    public function update(Request $request, $id)
    {
        $trabajador = Trabajador::findOrFail($id);

        $request->validate([
            'dni' => 'required|string|max:8|unique:trabajadores,dni,'.$id,
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
        ]);

        $trabajador->update($request->all());
        $this->log($request, 'Actualizacion', 'trabajadores', $trabajador->id, "Trabajador actualizado: {$trabajador->nombres} {$trabajador->apellidos}");

        return response()->json($trabajador);
    }

    public function destroy($id)
    {
        $trabajador = Trabajador::findOrFail($id);
        $trabajador->delete();
        $this->log(request(), 'Eliminacion', 'trabajadores', $id, "Trabajador eliminado: {$trabajador->nombres} {$trabajador->apellidos}");

        return response()->json(['message' => 'Trabajador eliminado']);
    }

    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $file = $request->file('archivo');
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        if (count($rows) < 2) {
            return response()->json(['message' => 'El archivo no tiene datos'], 422);
        }

        $header = array_map('strtoupper', array_map('trim', $rows[0]));
        $creados = 0;
        $actualizados = 0;
        $errores = [];

        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            $data = array_combine($header, $row);

            $dni = trim($data['DNI'] ?? '');
            $nombres = trim($data['NOMBRES'] ?? '');
            $apellidos = trim($data['APELLIDOS'] ?? '');
            $telefono = trim($data['TELEFONO'] ?? '');
            $correo = trim($data['CORREO'] ?? '');
            $cargo = trim($data['PUESTO'] ?? '');
            $codigoUnico = trim($data['CODIGO_UNICO'] ?? '');
            $codigoNfs = trim($data['CODIGO_NFS'] ?? '');

            if (! $dni || ! $nombres || ! $apellidos) {
                $errores[] = "Fila {$i}: DNI, NOMBRES y APELLIDOS son obligatorios";

                continue;
            }

            $existe = Trabajador::where('dni', $dni)->first();

            if ($existe) {
                $existe->update([
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'telefono' => $telefono ?: $existe->telefono,
                    'correo' => $correo ?: $existe->correo,
                    'cargo' => $cargo ?: $existe->cargo,
                    'codigo_unico' => $codigoUnico ?: $existe->codigo_unico,
                    'codigo_nfs' => $codigoNfs ?: $existe->codigo_nfs,
                ]);
                $actualizados++;
            } else {
                $nuevo = Trabajador::create([
                    'dni' => $dni,
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'telefono' => $telefono ?: null,
                    'correo' => $correo ?: null,
                    'cargo' => $cargo ?: null,
                    'codigo_unico' => $codigoUnico ?: null,
                    'codigo_nfs' => $codigoNfs ?: null,
                    'estado' => 'ACTIVO',
                ]);

                if ($nuevo->codigo_unico) {
                    $codigo = 'FC-'.strtoupper(Str::random(8));
                    $urlPublica = config('app.frontend_url', 'http://localhost:5173')."/{$nuevo->codigo_unico}";
                    DB::table('fotochecks')->insert([
                        'trabajador_id' => $nuevo->id,
                        'codigo' => $codigo,
                        'url_qr' => $urlPublica,
                        'estado' => 'VIGENTE',
                        'fecha_emision' => now(),
                    ]);
                }

                $creados++;
            }
        }

        $this->log($request, 'Importacion', 'trabajadores', null, "Importados: {$creados}, Actualizados: {$actualizados}, Errores: ".count($errores));

        return response()->json([
            'message' => 'Importacion completada',
            'creados' => $creados,
            'actualizados' => $actualizados,
            'errores' => $errores,
        ]);
    }
}
