<?php

namespace App\Http\Controllers;

use App\Models\Trabajador;
use App\Traits\Loggable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

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
            $cargo = trim($data['CONDICION'] ?? '');
            $codigoUnico = trim($data['CODIGO_UNICO'] ?? '');
            $codigoNfs = trim($data['CODIGO_NFS'] ?? '');
            $urlFotoPresencial = trim($data['URL_FOTO_PRESENCIAL'] ?? '');
            $urlFotoVirtual = trim($data['URL_FOTO_VIRTUAL'] ?? '');
            $urlQrImage = trim($data['URL_QR_IMAGE'] ?? '');
            $urlQr = trim($data['URL_QR'] ?? '');

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
                    'url_foto_presencial' => $urlFotoPresencial ?: $existe->url_foto_presencial,
                    'url_foto_virtual' => $urlFotoVirtual ?: $existe->url_foto_virtual,
                    'url_qr_image' => $urlQrImage ?: $existe->url_qr_image,
                    'url_qr' => $urlQr ?: $existe->url_qr,
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
                    'url_foto_presencial' => $urlFotoPresencial ?: null,
                    'url_foto_virtual' => $urlFotoVirtual ?: null,
                    'url_qr_image' => $urlQrImage ?: null,
                    'url_qr' => $urlQr ?: null,
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

    public function plantilla()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = [
            'DNI', 'NOMBRES', 'APELLIDOS', 'TELEFONO', 'CORREO',
            'CONDICION', 'CODIGO_UNICO', 'CODIGO_NFS',
            'URL_FOTO_PRESENCIAL', 'URL_FOTO_VIRTUAL', 'URL_QR_IMAGE', 'URL_QR',
        ];

        $colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L'];

        foreach ($headers as $i => $header) {
            $cell = $sheet->getCell($colLetters[$i] . '1');
            $cell->setValue($header);
            $cell->getStyle()->getFont()->setBold(true);
        }

        $sample = [
            '70123456', 'JUAN', 'PEREZ GARCIA', '951234567', 'juan.perez@unap.edu.pe',
            'NOMBRADO', 'ABC12345', 'NFS001',
            'https://drive.google.com/file/d/ABC123/view', 'https://drive.google.com/file/d/XYZ789/view',
            'https://dominio.com/ABC12345', 'https://dominio.com/qr/ABC12345',
        ];

        foreach ($sample as $i => $value) {
            $sheet->getCell($colLetters[$i] . '2')->setValue($value);
        }

        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $temp = tempnam(sys_get_temp_dir(), 'plantilla_');
        $writer->save($temp);
        $contents = file_get_contents($temp);
        @unlink($temp);

        return Response::make($contents, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment;filename="plantilla_trabajadores.xlsx"',
        ]);
    }
}
