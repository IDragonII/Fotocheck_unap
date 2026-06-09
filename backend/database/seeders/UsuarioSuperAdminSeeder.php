<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsuarioSuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('usuario_roles')->truncate();
        DB::table('usuarios')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $users = [
            ['usuario' => 'admin.una',      'clave' => 'Un@Adm!n2026#Seg',     'rol_id' => 1],
            ['usuario' => 'rrhh.una',       'clave' => 'Rrhh@Una!2026$Pro',    'rol_id' => 2],
            ['usuario' => 'ti.una',         'clave' => 'T1@Sist3ma!2026&',     'rol_id' => 3],
            ['usuario' => 'consultor.una',  'clave' => 'C0nsult0r!Una#26',     'rol_id' => 4],
            ['usuario' => 'editor.una',     'clave' => 'Ed1t0r!Una@2026$',     'rol_id' => 5],
        ];

        foreach ($users as $u) {
            $id = DB::table('usuarios')->insertGetId([
                'usuario' => $u['usuario'],
                'clave' => Hash::make($u['clave']),
                'nombres' => $u['usuario'],
                'apellidos' => 'Universidad',
                'estado' => 'ACTIVO',
            ]);
            DB::table('usuario_roles')->insert([
                'usuario_id' => $id,
                'rol_id' => $u['rol_id'],
            ]);
        }
    }
}
