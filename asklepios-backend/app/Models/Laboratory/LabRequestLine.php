<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabRequestLine extends Model
{
    use HasFactory;

    protected $fillable = ['lab_request_id', 'lab_test_id', 'exam_request_line_id'];

    public function request()
    {
        return $this->belongsTo(LabRequest::class, 'lab_request_id');
    }

    public function test()
    {
        return $this->belongsTo(LabTest::class, 'lab_test_id');
    }

    public function results()
    {
        return $this->hasMany(LabResult::class);
    }
}
