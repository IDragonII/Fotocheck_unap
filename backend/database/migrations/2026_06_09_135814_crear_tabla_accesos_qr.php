<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accesos_qr', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('trabajador_id');
            $table->string('ip', 45)->nullable();
            $table->text('navegador')->nullable();
            $table->dateTime('fecha_acceso')->useCurrent();

            $table->foreign('trabajador_id')
                ->references('id')
                ->on('trabajadores')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accesos_qr');
    }
};
