<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolPermisosSeeder extends Seeder
{
    public function run(): void
    {
        // ADMIN - todo excepto gestión de roles y permisos
        $excluidos = [
            'roles_crear', 'roles_editar', 'roles_eliminar',
            'permisos_crear', 'permisos_editar', 'permisos_eliminar', 'permisos_asignar',
        ];

        $permisosAdmin = DB::table('permisos')
            ->whereNotIn('nombre', $excluidos)
            ->pluck('id');

        foreach ($permisosAdmin as $permisoId) {
            DB::table('rol_permisos')->insert([
                'rol_id' => 2,
                'permiso_id' => $permisoId,
            ]);
        }

        // OPERADOR
        $permisosOperador = [
            'dashboard_ver', 'trabajadores_ver', 'trabajadores_crear',
            'trabajadores_editar', 'fotochecks_ver', 'fotochecks_generar',
            'fotochecks_reimprimir',
        ];

        $idsOperador = DB::table('permisos')
            ->whereIn('nombre', $permisosOperador)
            ->pluck('id');

        foreach ($idsOperador as $permisoId) {
            DB::table('rol_permisos')->insert([
                'rol_id' => 3,
                'permiso_id' => $permisoId,
            ]);
        }

        // CONSULTOR
        $permisosConsultor = [
            'dashboard_ver', 'trabajadores_ver', 'fotochecks_ver',
        ];

        $idsConsultor = DB::table('permisos')
            ->whereIn('nombre', $permisosConsultor)
            ->pluck('id');

        foreach ($idsConsultor as $permisoId) {
            DB::table('rol_permisos')->insert([
                'rol_id' => 4,
                'permiso_id' => $permisoId,
            ]);
        }
    }
}
