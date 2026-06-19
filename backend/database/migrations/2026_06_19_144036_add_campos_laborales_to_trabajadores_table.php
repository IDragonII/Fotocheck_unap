<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->string('regimen', 150)->nullable()->after('cargo');
            $table->string('facultad', 150)->nullable()->after('regimen');
            $table->string('escuela_profesional', 150)->nullable()->after('facultad');
            $table->string('resolucion_rectoral', 100)->nullable()->after('escuela_profesional');
            $table->string('vigencia', 100)->nullable()->after('resolucion_rectoral');
            $table->date('fecha_emision')->nullable()->after('vigencia');
        });
    }

    public function down(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->dropColumn(['regimen', 'facultad', 'escuela_profesional', 'resolucion_rectoral', 'vigencia', 'fecha_emision']);
        });
    }
};
