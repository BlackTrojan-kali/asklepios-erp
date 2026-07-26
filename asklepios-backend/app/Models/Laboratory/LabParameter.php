<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabParameter extends Model
{
    use HasFactory;

    protected $fillable = ['lab_test_id', 'name', 'unit', 'value_type', 'options', 'reference_min_male', 'reference_max_male', 'reference_min_female', 'reference_max_female', 'reference_text'];

    protected $casts = [
        'options' => 'array',
    ];

    public function test()
    {
        return $this->belongsTo(LabTest::class, 'lab_test_id');
    }
}
