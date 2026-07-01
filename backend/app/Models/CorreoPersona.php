<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CorreoPersona extends Model
{
    public $timestamps = false;

    protected $table = 'correos_persona';

    protected $fillable = [
        'persona_id', 'correo', 'tipo', 'principal', 'estado',
    ];

    protected function casts(): array
    {
        return [
            'principal' => 'boolean',
        ];
    }

    public function persona()
    {
        return $this->belongsTo(Persona::class);
    }
}
