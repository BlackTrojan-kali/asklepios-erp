<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = ['lab_request_line_id', 'lab_parameter_id', 'lab_sample_id', 'value_numeric', 'value_string', 'is_abnormal', 'status', 'validated_at', 'technician_id', 'validator_id'];

    protected $casts = [
        'validated_at' => 'datetime',
    ];

    public function line()
    {
        return $this->belongsTo(LabRequestLine::class, 'lab_request_line_id');
    }

    public function parameter()
    {
        return $this->belongsTo(LabParameter::class, 'lab_parameter_id');
    }

    public function sample()
    {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validator_id');
    }
}
