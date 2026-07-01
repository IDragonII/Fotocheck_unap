<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\ApiKeyLog;
use App\Models\Persona;
use App\Models\Solicitud;
use App\Models\TipoSolicitud;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExternalTicketController extends Controller
{
    public function crearTicket(Request $request): JsonResponse
    {
        $apiKey = $request->attributes->get('api_key');

        if (! $apiKey->tienePermiso('tickets_crear')) {
            return response()->json(['mensaje' => 'No tiene permiso para crear tickets'], 403);
        }

        $request->validate([
            'dni' => 'required|string|max:8',
            'tipo_solicitud_id' => 'required|exists:tipo_solicitudes,id',
            'vinculo' => 'nullable|string|max:100',
            'motivo_solicitud' => 'nullable|in:CREACION,RENOVACION,MODIFICACION,BAJA',
            'tipo_cuenta' => 'nullable|string|max:255',
            'sistema_especifico' => 'nullable|string|max:255',
            'adjuntos' => 'nullable|array|max:5',
            'adjuntos.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
            'adjuntos_url' => 'nullable|array|max:5',
            'adjuntos_url.*' => 'url|max:5000',
            'observaciones' => 'nullable|string|max:1000',
        ]);

        $persona = Persona::where('dni', $request->dni)->first();

        if (! $persona) {
            return response()->json(['mensaje' => 'Persona no encontrada con el DNI proporcionado'], 404);
        }

        $tipoSolicitud = TipoSolicitud::with('oficina')->find($request->tipo_solicitud_id);

        $ultimoCodigo = Solicitud::where('codigo', 'like', 'TICK-%')
            ->orderByDesc('id')
            ->value('codigo');

        if ($ultimoCodigo) {
            $numero = (int) substr($ultimoCodigo, 5) + 1;
        } else {
            $numero = 1;
        }
        $codigo = 'TICK-'.date('Y').'-'.str_pad($numero, 3, '0', STR_PAD_LEFT);

        $solicitud = Solicitud::create([
            'codigo' => $codigo,
            'vinculo' => $request->vinculo,
            'persona_id' => $persona->id,
            'tipo_solicitud_id' => $tipoSolicitud->id,
            'oficina_actual_id' => $tipoSolicitud->oficina_id,
            'estado' => 'PENDIENTE',
            'motivo_solicitud' => $request->motivo_solicitud,
            'tipo_cuenta' => $request->tipo_cuenta,
            'sistema_especifico' => $request->sistema_especifico,
            'adjuntos' => $this->guardarAdjuntos($request, $codigo),
            'observaciones' => $request->observaciones,
            'fecha_solicitud' => now(),
        ]);

        $this->registrarLog($apiKey, 'crear_ticket', $request, 201, [
            'codigo' => $codigo,
            'dni' => $request->dni,
            'tipo_solicitud_id' => $tipoSolicitud->id,
        ]);

        return response()->json([
            'mensaje' => 'Ticket creado exitosamente',
            'data' => [
                'codigo' => $solicitud->codigo,
                'vinculo' => $solicitud->vinculo,
                'tipo_solicitud' => [
                    'id' => $tipoSolicitud->id,
                    'nombre' => $tipoSolicitud->nombre,
                    'oficina' => $tipoSolicitud->oficina->nombre,
                ],
                'estado' => $solicitud->estado,
                'adjuntos' => $solicitud->adjuntos,
                'observaciones' => $solicitud->observaciones,
                'fecha_solicitud' => $solicitud->fecha_solicitud,
            ],
        ], 201);
    }

    public function consultarTicket(string $codigo, Request $request)
    {
        $apiKey = $request->attributes->get('api_key');

        if (! $apiKey->tienePermiso('tickets_consultar')) {
            return response()->json(['mensaje' => 'No tiene permiso para consultar tickets'], 403);
        }

        $solicitud = Solicitud::with('persona', 'tipoSolicitud.oficina')
            ->where('codigo', $codigo)
            ->first();

        if (! $solicitud) {
            return response()->json(['mensaje' => 'Ticket no encontrado'], 404);
        }

        $this->registrarLog($apiKey, 'consultar_ticket', $request, 200, ['codigo' => $codigo]);

        return response()->json([
            'data' => [
                'codigo' => $solicitud->codigo,
                'vinculo' => $solicitud->vinculo,
                'tipo_solicitud' => [
                    'id' => $solicitud->tipoSolicitud->id,
                    'nombre' => $solicitud->tipoSolicitud->nombre,
                    'oficina' => $solicitud->tipoSolicitud->oficina->nombre,
                ],
                'estado' => $solicitud->estado,
                'adjuntos' => $solicitud->adjuntos,
                'observaciones' => $solicitud->observaciones,
                'fecha_solicitud' => $solicitud->fecha_solicitud,
                'fecha_atencion' => $solicitud->fecha_atencion,
                'persona' => [
                    'dni' => $solicitud->persona->dni ?? null,
                    'nombres' => $solicitud->persona->nombres ?? null,
                    'apellidos' => $solicitud->persona->apellidos ?? null,
                ],
            ],
        ]);
    }

    public function consultarPorDni(string $dni, Request $request)
    {
        $apiKey = $request->attributes->get('api_key');

        if (! $apiKey->tienePermiso('dni_consultar')) {
            return response()->json(['mensaje' => 'No tiene permiso para consultar datos por DNI'], 403);
        }

        $persona = Persona::with('correos')
            ->where('dni', $dni)
            ->first();

        if (! $persona) {
            return response()->json(['mensaje' => 'Persona no encontrada con el DNI proporcionado'], 404);
        }

        $correoPrincipal = $persona->correos->where('principal', true)->first()
            ?? $persona->correos->first();

        $correos = $persona->correos->map(fn ($c) => [
            'correo' => $c->correo,
            'tipo' => $c->tipo,
            'principal' => $c->principal,
        ]);

        $this->registrarLog($apiKey, 'consultar_dni', $request, 200, ['dni' => $dni]);

        return response()->json([
            'data' => [
                'dni' => $persona->dni,
                'nombres' => $persona->nombres,
                'apellidos' => $persona->apellidos,
                'telefono' => $persona->telefono,
                'direccion' => $persona->direccion,
                'correo' => $correoPrincipal->correo ?? null,
                'correos' => $correos,
            ],
        ]);
    }

    public function listarTipos(Request $request)
    {
        $apiKey = $request->attributes->get('api_key');

        if (! $apiKey->tienePermiso('tipos_solicitud_consultar')) {
            return response()->json(['mensaje' => 'No tiene permiso para consultar tipos de solicitud'], 403);
        }

        $tipos = TipoSolicitud::with('oficina')
            ->where('estado', 'ACTIVO')
            ->orderBy('nombre')
            ->get()
            ->map(fn ($tipo) => [
                'id' => $tipo->id,
                'nombre' => $tipo->nombre,
                'descripcion' => $tipo->descripcion,
                'oficina' => $tipo->oficina->nombre,
            ]);

        $this->registrarLog($apiKey, 'consultar_tipos_solicitud', $request, 200);

        return response()->json(['data' => $tipos]);
    }

    private function guardarAdjuntos(Request $request, string $codigo): ?string
    {
        $archivos = [];

        if ($request->hasFile('adjuntos')) {
            $disk = config('filesystems.disks.solicitudes.driver', 'local');
            foreach ($request->file('adjuntos') as $archivo) {
                $nombre = time().'_'.$archivo->getClientOriginalName();
                if ($disk === 'local') {
                    $path = $codigo.'/'.$nombre;
                    Storage::disk('solicitudes')->put($path, file_get_contents($archivo));
                } else {
                    $path = Storage::disk('solicitudes')->put($codigo.'/'.$nombre, $archivo);
                }
                $archivos[] = $path;
            }
        }

        if ($request->filled('adjuntos_url')) {
            foreach ($request->adjuntos_url as $url) {
                $archivos[] = $url;
            }
        }

        return $archivos ? json_encode($archivos) : null;
    }

    private function registrarLog(ApiKey $apiKey, string $accion, Request $request, int $status, array $payload = []): void
    {
        ApiKeyLog::create([
            'api_key_id' => $apiKey->id,
            'accion' => $accion,
            'ip' => $request->ip(),
            'navegador' => $request->userAgent(),
            'payload' => json_encode($payload),
            'response_status' => $status,
        ]);
    }
}
