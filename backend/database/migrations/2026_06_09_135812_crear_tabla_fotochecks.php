<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fotochecks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('trabajador_id');
            $table->string('codigo', 50)->unique()->nullable();
            $table->string('url_qr', 255);
            $table->string('qr_imagen', 255)->nullable();
            $table->dateTime('fecha_emision')->useCurrent();
            $table->date('fecha_vencimiento')->nullable();
            $table->enum('estado', ['VIGENTE', 'VENCIDO', 'ANULADO'])->default('VIGENTE');

            $table->foreign('trabajador_id')
                ->references('id')
                ->on('trabajadores')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fotochecks');
    }
};
