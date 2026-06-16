<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trabajador extends Model
{
    protected $table = 'trabajadores';

    public $timestamps = false;

    protected $fillable = [
        'dni', 'codigo_unico', 'codigo_nfs', 'nombres', 'apellidos', 'empresa', 'area', 'cargo',
        'telefono', 'correo', 'direccion', 'fecha_nacimiento',
        'fecha_ingreso', 'grupo_sanguineo', 'foto', 'url_foto_presencial', 'url_foto_virtual',
        'url_qr_image', 'url_qr', 'estado', 'observaciones',
    ];

    protected $hidden = [];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date',
            'fecha_ingreso' => 'date',
        ];
    }

    public function fotochecks()
    {
        return $this->hasMany(Fotocheck::class);
    }

    public function accesosQr()
    {
        return $this->hasMany(AccesoQr::class);
    }
}
