<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->dropUnique('trabajadores_codigo_unico_unique');
            $table->string('codigo_unico', 50)->unique()->change();
        });
    }

    public function down(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->dropUnique('trabajadores_codigo_unico_unique');
            $table->string('codigo_unico', 8)->unique()->change();
        });
    }
};
