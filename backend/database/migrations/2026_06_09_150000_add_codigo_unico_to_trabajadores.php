<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->string('codigo_unico', 8)->unique()->after('dni');
        });

        $trabajadores = DB::table('trabajadores')->get();
        foreach ($trabajadores as $t) {
            do {
                $codigo = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
            } while (DB::table('trabajadores')->where('codigo_unico', $codigo)->exists());
            DB::table('trabajadores')->where('id', $t->id)->update(['codigo_unico' => $codigo]);
        }
    }

    public function down(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->dropColumn('codigo_unico');
        });
    }
};
