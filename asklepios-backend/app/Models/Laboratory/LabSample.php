<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class LabSample extends Model
{
    use HasFactory;

    protected $fillable = ['lab_request_id', 'barcode', 'sample_type', 'collected_by', 'status'];

    public function request()
    {
        return $this->belongsTo(LabRequest::class, 'lab_request_id');
    }

    public function collector()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
