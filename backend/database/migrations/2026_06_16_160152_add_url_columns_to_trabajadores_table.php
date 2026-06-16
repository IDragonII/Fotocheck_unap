<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->string('url_foto_presencial', 255)->nullable()->after('foto');
            $table->string('url_foto_virtual', 255)->nullable()->after('url_foto_presencial');
            $table->string('url_qr_image', 255)->nullable()->after('url_foto_virtual');
            $table->string('url_qr', 255)->nullable()->after('url_qr_image');
        });
    }

    public function down(): void
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->dropColumn(['url_foto_presencial', 'url_foto_virtual', 'url_qr_image', 'url_qr']);
        });
    }
};
