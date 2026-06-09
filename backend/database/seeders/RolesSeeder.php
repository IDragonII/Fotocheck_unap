<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->insert([
            [
                'nombre' => 'SUPER_ADMIN',
                'descripcion' => 'Acceso total al sistema',
                'nivel' => 100,
                'estado' => 'ACTIVO',
            ],
            [
                'nombre' => 'ADMIN',
                'descripcion' => 'Administracion general',
                'nivel' => 80,
                'estado' => 'ACTIVO',
            ],
            [
                'nombre' => 'OPERADOR',
                'descripcion' => 'Gestion de trabajadores y fotochecks',
                'nivel' => 50,
                'estado' => 'ACTIVO',
            ],
            [
                'nombre' => 'CONSULTOR',
                'descripcion' => 'Solo consulta de informacion',
                'nivel' => 10,
                'estado' => 'ACTIVO',
            ],
        ]);
    }
}
