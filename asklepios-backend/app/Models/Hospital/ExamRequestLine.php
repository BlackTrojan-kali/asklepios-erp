<?php

namespace App\Models\Hospital;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamRequestLine extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'exam_request_id',
        'exam_name',
        'result_notes',
        'document_url',
    ];

    // ======================================================
    // RELATIONS
    // ======================================================

    /**
     * Obtient la demande d'examen globale à laquelle appartient cette ligne.
     */
    public function examRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital\ExamRequest::class);
    }
}