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
        $highestCol = $sheet->getHighestColumn();
        $highestRow = $sheet->getHighestRow();

        if ($highestRow < 2) {
            return response()->json(['message' => 'El archivo no tiene datos'], 422);
        }

        $header = [];
        for ($col = 'A'; $col <= $highestCol; $col++) {
            $header[] = strtoupper(trim((string) $sheet->getCell($col.'1')->getValue()));
        }

        $creados = 0;
        $actualizados = 0;
        $saltados = 0;

        for ($i = 2; $i <= $highestRow; $i++) {
            $data = [];
            $colIndex = 0;
            for ($col = 'A'; $col <= $highestCol; $col++) {
                $cell = $sheet->getCell($col.$i);
                $data[$header[$colIndex]] = trim((string) $cell->getValue());
                $colIndex++;
            }

            $dni = trim((string) ($data['DNI'] ?? ''));
            $nombres = trim((string) ($data['NOMBRES'] ?? ''));
            $apellidos = trim((string) ($data['APELLIDOS'] ?? ''));
            $codigoUnico = trim((string) ($data['CODIGO_UNICO'] ?? ''));

            if ($dni === '' || $nombres === '' || $apellidos === '' || $codigoUnico === '') {
                $saltados++;
                continue;
            }

            $telefono = trim((string) ($data['TELEFONO'] ?? ''));
            $correo = trim((string) ($data['CORREO'] ?? ''));
            $cargo = trim((string) ($data['CONDICION'] ?? ''));
            $codigoNfs = trim((string) ($data['CODIGO_NFS'] ?? ''));
            $urlFotoPresencial = trim((string) ($data['URL_FOTO_PRESENCIAL'] ?? ''));
            $urlFotoVirtual = trim((string) ($data['URL_FOTO_VIRTUAL'] ?? ''));
            $urlQrImage = trim((string) ($data['URL_QR_IMAGE'] ?? ''));
            $urlQr = trim((string) ($data['URL_QR'] ?? ''));

            $existe = Trabajador::where('dni', $dni)->first();

            if ($existe) {
                $campos = [
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                ];
                if ($telefono !== '') $campos['telefono'] = $telefono;
                if ($correo !== '') $campos['correo'] = $correo;
                if ($cargo !== '') $campos['cargo'] = $cargo;
                if ($codigoUnico !== '') $campos['codigo_unico'] = $codigoUnico;
                if ($codigoNfs !== '') $campos['codigo_nfs'] = $codigoNfs;
                if ($urlFotoPresencial !== '') $campos['url_foto_presencial'] = $urlFotoPresencial;
                if ($urlFotoVirtual !== '') $campos['url_foto_virtual'] = $urlFotoVirtual;
                if ($urlQrImage !== '') $campos['url_qr_image'] = $urlQrImage;
                if ($urlQr !== '') $campos['url_qr'] = $urlQr;

                $existe->update($campos);
                $actualizados++;
            } else {
                $camposCreate = [
                    'dni' => $dni,
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'estado' => 'ACTIVO',
                ];
                if ($telefono !== '') $camposCreate['telefono'] = $telefono;
                if ($correo !== '') $camposCreate['correo'] = $correo;
                if ($cargo !== '') $camposCreate['cargo'] = $cargo;
                if ($codigoUnico !== '') $camposCreate['codigo_unico'] = $codigoUnico;
                if ($codigoNfs !== '') $camposCreate['codigo_nfs'] = $codigoNfs;
                if ($urlFotoPresencial !== '') $camposCreate['url_foto_presencial'] = $urlFotoPresencial;
                if ($urlFotoVirtual !== '') $camposCreate['url_foto_virtual'] = $urlFotoVirtual;
                if ($urlQrImage !== '') $camposCreate['url_qr_image'] = $urlQrImage;
                if ($urlQr !== '') $camposCreate['url_qr'] = $urlQr;

                $nuevo = Trabajador::create($camposCreate);

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

        $this->log($request, 'Importacion', 'trabajadores', null, "Importados: {$creados}, Actualizados: {$actualizados}, Saltados: {$saltados}");

        return response()->json([
            'message' => 'Importacion completada',
            'creados' => $creados,
            'actualizados' => $actualizados,
            'saltados' => $saltados,
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
