<?php

namespace Database\Seeders;

use App\Models\Oficina;
use App\Models\TipoSolicitud;
use Illuminate\Database\Seeder;

class TipoSolicitudSeeder extends Seeder
{
    public function run(): void
    {
        // Oficinas
        $oficinaGobierno = Oficina::firstOrCreate(
            ['nombre' => 'Sub Oficina de Gobierno Electrónico'],
            ['descripcion' => 'Sub Oficina de Gobierno Electrónico', 'estado' => 'ACTIVO']
        );

        $oficinaDesarrollo = Oficina::firstOrCreate(
            ['nombre' => 'Sub Oficina de Desarrollo de Software'],
            ['descripcion' => 'Sub Oficina de Desarrollo de Software', 'estado' => 'ACTIVO']
        );

        $oficinaRedes = Oficina::firstOrCreate(
            ['nombre' => 'Sub Oficina de Redes y Telecomunicaciones'],
            ['descripcion' => 'Sub Oficina de Redes y Telecomunicaciones', 'estado' => 'ACTIVO']
        );

        $oficinaSoporte = Oficina::firstOrCreate(
            ['nombre' => 'Sub Oficina de Soporte Técnico'],
            ['descripcion' => 'Sub Oficina de Soporte Técnico', 'estado' => 'ACTIVO']
        );

        // Tipos de solicitud
        $tipos = [
            ['nombre' => 'SOLICITUD_ALTA_BAJA', 'descripcion' => 'Solicitud de alta y baja de cuentas de usuario', 'oficina_id' => $oficinaGobierno->id],
            ['nombre' => 'OTRO', 'descripcion' => 'Otras solicitudes', 'oficina_id' => $oficinaGobierno->id],
        ];

        foreach ($tipos as $tipo) {
            TipoSolicitud::updateOrCreate(
                ['nombre' => $tipo['nombre']],
                $tipo
            );
        }
    }
}
